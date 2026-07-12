/**
 * test-matching.mjs
 * Simulates the full event-search pipeline from route.ts.
 *
 * Usage:
 *   node --env-file=.env.local scripts/test-matching.mjs "gigs in London this weekend"
 *   node --env-file=.env.local scripts/test-matching.mjs "jazz in Manchester in August" --profile jazz-manchester
 *
 * Built-in profiles: electronic-london | jazz-manchester | folk-bristol | rock-sheffield
 * Omit --profile to use a bare query with no saved preferences.
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import ws from "ws";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Profiles ─────────────────────────────────────────────────────────────────

const PROFILES = {
  "electronic-london": {
    genre_affinities: [
      { genre: "electronic", weight: 0.9 },
      { genre: "house", weight: 0.85 },
      { genre: "techno", weight: 0.8 },
    ],
    mentioned_artists: ["Barry Can't Swim", "Bicep"],
    home_area: "South London",
    preferred_towns: ["London"],
    prefers_evenings: true,
    prefers_weekends: true,
    profile_confidence: 0.75,
  },
  "jazz-manchester": {
    genre_affinities: [
      { genre: "jazz", weight: 0.95 },
      { genre: "soul", weight: 0.6 },
    ],
    mentioned_artists: ["Nubya Garcia", "Moses Boyd"],
    home_area: "Manchester",
    preferred_towns: ["Manchester"],
    prefers_evenings: true,
    profile_confidence: 0.8,
  },
  "folk-bristol": {
    genre_affinities: [
      { genre: "folk", weight: 0.9 },
      { genre: "acoustic", weight: 0.85 },
    ],
    mentioned_artists: ["Laura Marling"],
    home_area: "Bristol",
    preferred_towns: ["Bristol", "Bath"],
    profile_confidence: 0.7,
  },
  "rock-sheffield": {
    genre_affinities: [
      { genre: "rock", weight: 0.9 },
      { genre: "indie", weight: 0.8 },
    ],
    mentioned_artists: ["Arctic Monkeys"],
    home_area: "Sheffield",
    preferred_towns: ["Sheffield", "Leeds", "Manchester"],
    profile_confidence: 0.72,
  },
};

// ─── Mirrors route.ts helpers ─────────────────────────────────────────────────

const UK_CITIES = ["london","manchester","birmingham","bristol","leeds","sheffield","edinburgh","glasgow","liverpool","brighton","bath","oxford","cambridge","nottingham","cardiff"];

function extractLocationFromMessage(msg) {
  const lower = msg.toLowerCase();
  return UK_CITIES.find(c => lower.includes(c)) ?? null;
}

function profileToQueryText(profile) {
  const parts = [];
  const affinities = profile.genre_affinities ?? [];
  if (affinities.length) {
    const genres = [...affinities].sort((a, b) => b.weight - a.weight).map(g => g.genre).slice(0, 6);
    parts.push(`Music genres: ${genres.join(", ")}.`);
  }
  if (profile.mentioned_artists?.length) parts.push(`Enjoys: ${profile.mentioned_artists.join(", ")}.`);
  if (profile.home_area) parts.push(`Based in ${profile.home_area}.`);
  if (profile.preferred_towns?.length) parts.push(`Prefers events in ${profile.preferred_towns.join(", ")}.`);
  return parts.join(" ") || "live music events";
}

function extractDateRange(msg) {
  const lower = msg.toLowerCase();
  const now = new Date();
  const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const monthIdx = MONTHS.findIndex(m => lower.includes(m));
  if (monthIdx !== -1) {
    const year = monthIdx < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    return { from: new Date(year, monthIdx, 1), to: new Date(year, monthIdx + 1, 0, 23, 59, 59), label: MONTHS[monthIdx] };
  }
  if (/next two weeks|two weeks|fortnight/.test(lower)) {
    const to = new Date(now); to.setDate(now.getDate() + 14);
    return { from: now, to, label: "next 2 weeks" };
  }
  if (/few weeks|coming weeks|next few weeks|couple of weeks/.test(lower)) {
    const to = new Date(now); to.setDate(now.getDate() + 21);
    return { from: now, to, label: "next 3 weeks" };
  }
  if (/next weekend/.test(lower)) {
    const day = now.getDay();
    const daysToSat = ((6 - day + 7) % 7) || 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0,0,0,0);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23,59,59,0);
    return { from: sat, to: sun, label: "next weekend" };
  }
  if (/this weekend/.test(lower)) {
    const day = now.getDay();
    const daysToSat = (6 - day + 7) % 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0,0,0,0);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23,59,59,0);
    return { from: sat, to: sun, label: "this weekend" };
  }
  if (/this week/.test(lower)) {
    const to = new Date(now); to.setDate(now.getDate() + (7 - now.getDay())); to.setHours(23,59,59,0);
    return { from: now, to, label: "this week" };
  }
  const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayIdx = DAYS.findIndex(d => lower.includes(d));
  if (dayIdx !== -1 && monthIdx === -1) {
    // Find the next N occurrences of that day within the next 8 weeks
    const occurrences = [];
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 56; i++) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === dayIdx) occurrences.push(new Date(d));
      if (occurrences.length === 8) break;
    }
    if (occurrences.length) {
      return { from: occurrences[0], to: new Date(occurrences[occurrences.length - 1].getTime() + 86399000), label: `${DAYS[dayIdx]}s`, dayFilter: dayIdx };
    }
  }
  if (/next month/.test(lower)) {
    const m = now.getMonth() + 1;
    const y = m > 11 ? now.getFullYear() + 1 : now.getFullYear();
    return { from: new Date(y, m % 12, 1), to: new Date(y, (m % 12) + 1, 0, 23, 59, 59), label: "next month" };
  }
  return null;
}

// ─── Main search ──────────────────────────────────────────────────────────────

async function search(userMessage, profile = {}) {
  const location = extractLocationFromMessage(userMessage);
  const dateRange = extractDateRange(userMessage);

  // Build query: message first, then profile (mirrors route.ts weighting)
  const queryText = [userMessage, profileToQueryText(profile)].filter(Boolean).join(". ");
  console.log(`\nQuery text: "${queryText}"`);
  console.log(`Location filter: ${location ?? "none"}`);
  console.log(`Date filter: ${dateRange?.label ?? "none"}\n`);

  const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: queryText });
  const embedding = embRes.data[0].embedding;

  const { data, error } = await supabase.rpc("match_events", {
    query_embedding: embedding,
    phone: "test_simulation",
    match_count: 150,
  });
  if (error) throw new Error(error.message);

  let candidates = (data ?? []).filter(e => e.details_url);
  console.log(`Semantic matches (with link): ${candidates.length}`);

  const topSimilarity = candidates[0]?.similarity ?? 0;
  if (topSimilarity < 0.40) {
    console.log(`\n⚠️  Low confidence (${(topSimilarity * 100).toFixed(1)}%) — best match below 40% threshold`);
    console.log(`   No carousel would be sent. Claude would respond honestly: couldn't find that specific act.`);
    process.exit(0);
  }

  // Fetch raw location data for all candidates
  const { data: rawRows } = await supabase
    .from("events")
    .select("id, artist_image, raw")
    .in("id", candidates.map(e => e.id));

  const infoMap = new Map(
    (rawRows ?? []).map(r => {
      const loc = r.raw?.location ?? {};
      return [r.id, {
        artist_image: r.artist_image,
        town: (loc.town ?? "").toLowerCase(),
        county: (loc.county ?? "").toLowerCase(),
      }];
    })
  );

  // Location filter
  if (location) {
    const locationFiltered = candidates.filter(e => {
      const info = infoMap.get(e.id);
      return info
        ? info.town.includes(location) || info.county.includes(location) || e.venue_name.toLowerCase().includes(location)
        : e.venue_name.toLowerCase().includes(location);
    });
    console.log(`After location filter (${location}): ${locationFiltered.length}`);
    if (locationFiltered.length === 0) {
      console.log(`\n✗  No results in ${location} — no carousel would be sent`);
      console.log(`   Claude would say: "Nothing on in ${location.charAt(0).toUpperCase() + location.slice(1)} for that right now — want to try somewhere nearby?"`);
      process.exit(0);
    }
    candidates = locationFiltered;
  }

  // Date filter
  if (dateRange) {
    const dateFiltered = candidates.filter(e => {
      const d = new Date(e.start_time);
      const inRange = d.getTime() >= dateRange.from.getTime() && d.getTime() <= dateRange.to.getTime();
      const rightDay = dateRange.dayFilter !== undefined ? d.getDay() === dateRange.dayFilter : true;
      return inRange && rightDay;
    });
    console.log(`After date filter (${dateRange.label}): ${dateFiltered.length}`);
    if (dateFiltered.length > 0) candidates = dateFiltered;
    else console.log("  ⚠️  Date filter returned 0 — showing without date filter");
  }

  // Late night filter
  const isLateNight = /late night|after midnight|late evening/.test(userMessage.toLowerCase());
  if (isLateNight) {
    const lateFiltered = candidates.filter(e => new Date(e.start_time).getHours() >= 21);
    console.log(`After late night filter (21:00+): ${lateFiltered.length}`);
    if (lateFiltered.length > 0) candidates = lateFiltered;
    else console.log("  ⚠️  No events after 21:00 — showing all times");
  }

  // Max 2 events per venue for diversity
  const venueCounts = new Map();
  const top = [];
  for (const e of candidates) {
    const count = venueCounts.get(e.venue_name) ?? 0;
    if (count < 2) { top.push(e); venueCounts.set(e.venue_name, count + 1); }
    if (top.length === 9) break;
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`TOP ${top.length} RESULTS:`);
  console.log(`${"─".repeat(70)}`);

  top.forEach((e, i) => {
    const info = infoMap.get(e.id);
    const date = new Date(e.start_time).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
    const time = new Date(e.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const sim = ((e.similarity ?? 0) * 100).toFixed(1);
    const hasImg = info?.artist_image ? "🖼" : "✗";
    const town = info?.town ? `(${info.town}${info.county ? ", " + info.county : ""})` : "";
    console.log(`  ${i + 1}. [${sim}%] ${hasImg} ${e.title}`);
    console.log(`       ${e.venue_name} ${town}`);
    console.log(`       ${date} ${time}`);
    console.log(`       ${e.details_url}`);
  });

  console.log(`${"─".repeat(70)}`);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const profileFlag = args.indexOf("--profile");
const profileKey = profileFlag !== -1 ? args[profileFlag + 1] : null;
const userMessage = args.filter((_, i) => i !== profileFlag && (profileFlag === -1 || i !== profileFlag + 1)).join(" ");

if (!userMessage) {
  console.error("Usage: node --env-file=.env.local scripts/test-matching.mjs \"your query\" [--profile electronic-london]");
  console.error("Profiles:", Object.keys(PROFILES).join(" | "));
  process.exit(1);
}

const profile = profileKey ? (PROFILES[profileKey] ?? {}) : {};
if (profileKey && !PROFILES[profileKey]) console.warn(`Unknown profile "${profileKey}", using empty profile`);

search(userMessage, profile).catch(e => { console.error(e); process.exit(1); });
