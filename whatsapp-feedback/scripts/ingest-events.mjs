/**
 * ingest-events.mjs
 *
 * Fetches all GigPig events, enriches artists via Last.fm (+ web fallback),
 * enriches venues via website scrape, builds embedding text, generates
 * OpenAI embeddings, and upserts everything to Supabase.
 *
 * Usage:
 *   node scripts/ingest-events.mjs              # full run
 *   node scripts/ingest-events.mjs --skip-embed # skip embedding step
 *   node scripts/ingest-events.mjs --artists-only
 *   node scripts/ingest-events.mjs --venues-only
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import ws from "ws";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const env = readFileSync(join(__dir, "../.env.local"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...rest] = line.split("=");
    if (k && rest.length) process.env[k.trim()] = rest.join("=").trim();
  }
} catch {}

const SUPABASE_URL       = process.env.SUPABASE_URL;
const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LASTFM_KEY         = process.env.LASTFM_API_KEY;
const OPENAI_KEY         = process.env.OPENAI_API_KEY;

const GIGPIG_URL         = "https://widgets.gigpig.uk/calendar/whatson";
const LASTFM_API         = "https://ws.audioscrobbler.com/2.0/";
const CONCURRENCY        = 5;   // parallel requests for Last.fm / venue scrape
const EMBED_BATCH        = 100; // events per OpenAI embedding batch

const args               = process.argv.slice(2);
const SKIP_EMBED         = args.includes("--skip-embed") || !OPENAI_KEY;
const ARTISTS_ONLY       = args.includes("--artists-only");
const VENUES_ONLY        = args.includes("--venues-only");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb     = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { transport: ws } });
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function inBatches(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
}

// ─── Step 1: Fetch GigPig events ─────────────────────────────────────────────

async function fetchGigPigEvents() {
  console.log("📡  Fetching GigPig events...");
  const res  = await fetch(GIGPIG_URL);
  const json = await res.json();
  const data = json.data ?? [];
  console.log(`    ${data.length} events fetched (${new Set(data.map(e => e.venue?.name)).size} venues, ${new Set(data.map(e => e.artist?.name)).size} artists)`);
  return data;
}

// ─── Step 2: Upsert venues ───────────────────────────────────────────────────

async function upsertVenues(events) {
  console.log("\n🏛️   Upserting venues...");
  const seen = new Map();
  for (const e of events) {
    const v = e.venue;
    if (v && !seen.has(v.uuid)) {
      seen.set(v.uuid, {
        uuid:     v.uuid,
        name:     v.name,
        website:  v.website ?? null,
        town:     e.location?.town ?? null,
        county:   e.location?.county ?? null,
        postcode: e.location?.postcode ?? null,
        latitude: e.location?.latitude ?? null,
        longitude: e.location?.longitude ?? null,
      });
    }
  }

  const venues = [...seen.values()];
  const { error } = await sb.from("venues").upsert(venues, { onConflict: "uuid", ignoreDuplicates: false });
  if (error) console.error("  ❌ venue upsert error:", error.message);
  else console.log(`  ✅ ${venues.length} venues upserted`);
  return venues;
}

// ─── Step 3: Upsert artists ──────────────────────────────────────────────────

async function upsertArtists(events) {
  console.log("\n🎤  Upserting artists...");
  const seen = new Map();
  for (const e of events) {
    const a = e.artist;
    if (a?.name && !seen.has(a.name)) {
      seen.set(a.name, { name: a.name, image_url: a.image ?? null });
    }
  }

  const artists = [...seen.values()];
  const { error } = await sb.from("artists").upsert(artists, { onConflict: "name", ignoreDuplicates: true });
  if (error) console.error("  ❌ artist upsert error:", error.message);
  else console.log(`  ✅ ${artists.length} artists upserted`);
  return artists;
}

// ─── Step 4: Upsert events ───────────────────────────────────────────────────

async function upsertEvents(events) {
  console.log("\n🎵  Upserting events...");
  const rows = events.map(e => ({
    id:           e.id,
    title:        e.title,
    artist_name:  e.artist?.name ?? null,
    artist_image: e.artist?.image ?? null,
    venue_uuid:   e.venue?.uuid ?? null,
    venue_name:   e.venue?.name ?? null,
    start_time:   e.start,
    end_time:     e.end ?? null,
    details_url:  e.details_url ?? null,
    raw:          e,
  }));

  // Batch upsert in chunks of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("events").upsert(batch, { onConflict: "id" });
    if (error) console.error(`  ❌ event upsert error (batch ${i}):`, error.message);
  }
  console.log(`  ✅ ${rows.length} events upserted`);
}

// ─── Step 5: Enrich artists via Last.fm ──────────────────────────────────────

async function enrichArtist(name) {
  try {
    const url = `${LASTFM_API}?method=artist.getInfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_KEY}&format=json&autocorrect=1`;
    const res  = await fetch(url);
    const json = await res.json();

    if (json.error || !json.artist) return null;

    const a         = json.artist;
    const tags      = (a.tags?.tag ?? []).slice(0, 6).map(t => t.name.toLowerCase());
    const similar   = (a.similar?.artist ?? []).slice(0, 5).map(s => s.name);
    const bio       = stripHtml(a.bio?.summary ?? "");
    const listeners = parseInt(a.stats?.listeners ?? "0", 10);

    return {
      name,
      lastfm_url:        a.url ?? null,
      genre_tags:        tags,
      description:       bio || null,
      similar_artists:   similar,
      listeners,
      enriched_at:       new Date().toISOString(),
      enrichment_source: tags.length ? "lastfm" : "lastfm_no_tags",
    };
  } catch {
    return null;
  }
}

async function enrichArtists() {
  console.log("\n🔍  Enriching artists via Last.fm...");

  // Only process unenriched artists
  const { data: artists, error } = await sb
    .from("artists")
    .select("name")
    .is("enriched_at", null)
    .limit(10000);

  if (error) { console.error("  ❌", error.message); return; }
  if (!artists.length) { console.log("  ✅ All artists already enriched"); return; }

  console.log(`  Processing ${artists.length} unenriched artists...`);
  let enriched = 0, failed = 0;

  await inBatches(artists, CONCURRENCY, async ({ name }) => {
    const data = await enrichArtist(name);
    if (data) {
      const { error: e } = await sb.from("artists").update(data).eq("name", name);
      if (e) failed++;
      else enriched++;
    } else {
      // Mark as attempted so we don't retry on every run
      await sb.from("artists").update({
        enriched_at: new Date().toISOString(),
        enrichment_source: "none",
      }).eq("name", name);
      failed++;
    }
    await sleep(50); // gentle rate limit
  });

  console.log(`  ✅ ${enriched} enriched, ${failed} not found in Last.fm`);
}

// ─── Step 6: Enrich venues via Firecrawl ────────────────────────────────────

async function enrichVenue(venue) {
  if (!venue.website) return null;

  try {
    // Use Firecrawl API directly if key available, otherwise skip
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) return null;

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: venue.website,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const json = await res.json();
    const md   = json.data?.markdown ?? "";
    if (!md) return null;

    // Ask Claude to extract venue type and vibe from the scraped content
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const claude    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You analyse venue website content and return ONLY valid JSON in this shape:
{"venue_type":"pub","vibe_tags":["intimate","seated"],"capacity_tier":"small","description":"One sentence about the venue."}

venue_type: one of pub | restaurant | dedicated_music | bar | theatre | outdoor | hotel | other
vibe_tags: subset of [intimate, lively, seated, standing, late_night, afternoon, outdoor, free, food_focused, cocktail_bar, sports_bar, arts_venue]
capacity_tier: small (<100) | medium (100-500) | large (500+)
description: one punchy sentence capturing the venue's vibe and identity.`,
      messages: [{ role: "user", content: `Venue: ${venue.name}\n\n${md.slice(0, 3000)}` }],
    });

    const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

async function enrichVenues() {
  console.log("\n🏛️   Enriching venues via website scrape...");

  const { data: venues, error } = await sb
    .from("venues")
    .select("uuid, name, website")
    .is("enriched_at", null)
    .not("website", "is", null)
    .limit(10000);

  if (error) { console.error("  ❌", error.message); return; }
  if (!venues.length) { console.log("  ✅ All venues already enriched"); return; }

  console.log(`  Processing ${venues.length} unenriched venues...`);
  let enriched = 0;

  await inBatches(venues, 3, async (venue) => {
    const data = await enrichVenue(venue);
    if (data) {
      await sb.from("venues").update({
        ...data,
        enriched_at: new Date().toISOString(),
      }).eq("uuid", venue.uuid);
      enriched++;
    } else {
      await sb.from("venues").update({ enriched_at: new Date().toISOString() }).eq("uuid", venue.uuid);
    }
    await sleep(200);
  });

  console.log(`  ✅ ${enriched} venues enriched`);
}

// ─── Step 7: Build embedding text ────────────────────────────────────────────

async function buildEmbeddingTexts() {
  console.log("\n📝  Building embedding texts...");
  let totalDone = 0;

  while (true) {
  // Fetch next batch of events needing embedding text
  const { data: events, error } = await sb
    .from("events")
    .select(`
      id, title, artist_name, venue_name, start_time,
      artists ( genre_tags, description, similar_artists, listeners ),
      venues ( description, venue_type, vibe_tags, town )
    `)
    .is("embedding_text", null)
    .limit(1000);

  if (error) { console.error("  ❌", error.message); return; }
  if (!events.length) break;

  console.log(`  Building text for ${events.length} events...`);

  const rows = events.map(e => {
    const artist  = e.artists;
    const venue   = e.venues;
    const date    = new Date(e.start_time);
    const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
    const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const isEvening = date.getHours() >= 18;
    const isAfternoon = date.getHours() >= 12 && date.getHours() < 18;

    const parts = [
      e.title,
      venue?.town ? `in ${venue.town}` : "",
      `on ${dayName} at ${timeStr}`,
      isEvening ? "evening" : isAfternoon ? "afternoon" : "morning",
    ];

    if (artist?.genre_tags?.length) {
      parts.push(`Genre: ${artist.genre_tags.slice(0, 4).join(", ")}`);
    }
    if (artist?.description) {
      parts.push(artist.description.slice(0, 200));
    }
    if (artist?.similar_artists?.length) {
      parts.push(`Similar to: ${artist.similar_artists.slice(0, 3).join(", ")}`);
    }
    if (venue?.description) {
      parts.push(`Venue: ${venue.description}`);
    }
    if (venue?.vibe_tags?.length) {
      parts.push(`Vibe: ${venue.vibe_tags.join(", ")}`);
    }

    return { id: e.id, text: parts.filter(Boolean).join(". ") };
  });

  // Use update (not upsert) — partial column updates require .update()
  let done = 0, errs = 0;
  await inBatches(rows, 20, async ({ id, text }) => {
    const { error } = await sb.from("events").update({ embedding_text: text }).eq("id", id);
    if (error) errs++;
    else done++;
  });

  if (errs) console.warn(`  ⚠️  ${errs} update errors`);
  totalDone += done;
  } // end while

  console.log(`  ✅ ${totalDone} embedding texts built`);
}

// ─── Step 8: Generate OpenAI embeddings ──────────────────────────────────────

async function generateEmbeddings() {
  if (SKIP_EMBED) {
    console.log("\n⏭️   Skipping embeddings (no OPENAI_API_KEY)");
    return;
  }

  console.log("\n🧠  Generating OpenAI embeddings...");

  let totalEmbedded = 0;

  while (true) {
    const { data: events, error } = await sb
      .from("events")
      .select("id, embedding_text")
      .is("embedding", null)
      .not("embedding_text", "is", null)
      .limit(1000);

    if (error) { console.error("  ❌", error.message); return; }
    if (!events.length) break;

    console.log(`  Embedding ${events.length} events...`);

    for (let i = 0; i < events.length; i += EMBED_BATCH) {
      const batch  = events.slice(i, i + EMBED_BATCH);
      const inputs = batch.map(e => e.embedding_text);

      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: inputs,
      });

      await Promise.all(batch.map(async (e, j) => {
        await sb.from("events").update({ embedding: res.data[j].embedding }).eq("id", e.id);
      }));

      totalEmbedded += batch.length;
      console.log(`  ${totalEmbedded} embedded so far...`);
      await sleep(200);
    }
  }

  console.log(`  ✅ ${totalEmbedded} events embedded`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀  crowdloop event ingest pipeline\n");

  const events = await fetchGigPigEvents();
  if (!events.length) { console.error("No events returned"); process.exit(1); }

  if (!VENUES_ONLY) await upsertArtists(events);
  if (!ARTISTS_ONLY) await upsertVenues(events);

  if (!ARTISTS_ONLY && !VENUES_ONLY) {
    await upsertEvents(events);
    await enrichArtists();
    await enrichVenues();
    await buildEmbeddingTexts();
    await generateEmbeddings();
  } else if (ARTISTS_ONLY) {
    await enrichArtists();
  } else if (VENUES_ONLY) {
    await enrichVenues();
  }

  console.log("\n✅  Ingest complete");
}

main().catch(e => { console.error(e); process.exit(1); });
