import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ─── Mode detection ───────────────────────────────────────────────────────────
// "discovery" is the default while we're building the tastemakers product.
// "feedback" only activates when a known venue keyword is in the first message.

type ConversationMode = "discovery" | "feedback";

type VenueConfig = { name: string; keywords: string[] };

const VENUES: VenueConfig[] = [
  { name: "Pear Tree Cafe",  keywords: ["pear tree", "peartree", "pear-tree"] },
  { name: "Oval Space",      keywords: ["oval space", "ovalspace", "oval-space"] },
];

function detectVenue(text: string): VenueConfig | null {
  const lower = text.toLowerCase();
  return VENUES.find(v => v.keywords.some(k => lower.includes(k))) ?? null;
}

const DISCOVERY_SYSTEM = `You are crowdloop, a WhatsApp assistant that helps people find great live music and events.

Your purpose: learn what this person loves so you can alert them when their favourite artists are playing nearby, and surface events with new artists they're likely to love. The better you understand their taste, the more useful the recommendations you send them.

Make this purpose clear naturally in the conversation — not as a pitch, but woven in. For example, when they mention an artist: "Good to know — if they're playing near you I'll make sure you hear about it." Or early on: "Tell me what you're into and I'll flag anything that sounds right for you."

Learn everything relevant: genres, specific artists they love, venues they rate, where they're based, when they go out, who they go with, whether they prefer discovering new acts or seeing names they know.

Rules:
- Keep every reply SHORT — 1 to 3 sentences, exactly like a real WhatsApp message
- Be warm and curious, not formal or salesy
- Ask ONE focused question per message — never multiple at once
- Open with what kind of music or events they're into — let them lead
- Gradually get more specific: favourite artists, local area, evening vs weekend, intimate gig vs bigger venue
- When they mention an artist, follow up on what they love about them or ask about similar acts
- When you have a solid picture (after 5-8 exchanges), confirm you'll be in touch when something great comes up and close warmly
- Never use em dashes in your replies
- Never use bullet points, numbered lists, or long paragraphs
- Never use slang like "vibe", "mate", "gutted", "banging", "brilliant"
- Never say you don't have access to event listings or real-time data — you do have access and will send recommendations once you understand their taste
- Never break character`;

function buildFeedbackPrompt(venueName: string): string {
  return `You are crowdloop, a WhatsApp assistant that helps music and events fans discover and connect with events they love. You are assisting someone who has attended an event at ${venueName}.

Your job is to make the attendee feel heard, learn what they love, and keep them connected to future events.

Rules:
- Keep every reply SHORT — 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and conversational, but never use slang or casual filler words
- Ask ONE focused follow-up question per message — never multiple at once
- Learn their tastes: what artists they love, what kinds of events, what they want more of
- NEVER promise refunds, compensation, or any form of remedy
- If someone raises a complaint: acknowledge warmly, say "I'll make sure the team sees this"
- After 3-4 exchanges, ask: "Is there anything else you'd like to share?"
- If they are done: thank them and say you'll keep them posted on events they'll love
- Never use bullet points, numbered lists, or long paragraphs
- Never use em dashes in your replies
- Never break character`;
}

function buildSystemPrompt(mode: ConversationMode, venueName: string | null, artistContext = ""): string {
  if (mode === "feedback" && venueName) return buildFeedbackPrompt(venueName);
  if (artistContext) return `${DISCOVERY_SYSTEM}\n\n${artistContext}`;
  return DISCOVERY_SYSTEM;
}

// ─── Event matching ───────────────────────────────────────────────────────────

function isEventQuery(text: string): boolean {
  return /what.?s on|any (gigs?|events?|shows?|nights?)|this (weekend|week|friday|saturday|sunday)|tonight|what should i (do|see|go)|gigs? (in|near|around)|events? (in|near|around)|what.?s happening|what.?s good|recommend|anything on/i.test(text);
}

function profileToQueryText(profile: Record<string, unknown>): string {
  const parts: string[] = [];
  const affinities = profile.genre_affinities as Array<{ genre: string; weight: number }> | null;
  if (affinities?.length) {
    const genres = [...affinities].sort((a, b) => b.weight - a.weight).map(g => g.genre).slice(0, 6);
    parts.push(`Music genres: ${genres.join(", ")}.`);
  }
  const artists = profile.mentioned_artists as string[] | null;
  if (artists?.length) parts.push(`Enjoys: ${artists.join(", ")}.`);
  const interests = profile.inferred_interests as string[] | null;
  if (interests?.length) parts.push(`Interests: ${interests.join(", ")}.`);
  if (profile.home_area) parts.push(`Based in ${String(profile.home_area)}.`);
  const towns = profile.preferred_towns as string[] | null;
  if (towns?.length) parts.push(`Prefers events in ${towns.join(", ")}.`);
  return parts.join(" ") || "live music events";
}

type EventCandidate = {
  id: number;
  title: string;
  venue_name: string;
  start_time: string;
  details_url: string | null;
};

async function findMatchingEvents(phone: string, profile: Record<string, unknown>, userMessage: string): Promise<string> {
  try {
    const queryText = [profileToQueryText(profile), userMessage].filter(Boolean).join(". ");
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: queryText });
    const embedding = embRes.data[0].embedding;

    const { data, error } = await supabase.rpc("match_events", {
      query_embedding: embedding,
      phone,
      match_count: 9,
    });

    if (error || !data?.length) return "";

    const lines = (data as EventCandidate[]).slice(0, 9).map((e, i) => {
      const date = new Date(e.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      const time = new Date(e.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      return `${i + 1}. ${e.title} at ${e.venue_name} — ${date} at ${time}${e.details_url ? ` | ${e.details_url}` : ""}`;
    }).join("\n");

    console.log(`[EVENTS] ${data.length} candidates for ${phone}`);
    return `\n\nUPCOMING EVENTS from the crowdloop database, matched to this user's taste:\n${lines}\n\nIf the user is asking about events or you have learned enough about their taste, recommend 1-3 of these naturally. Explain briefly why each suits them. Include the URL. Only recommend events that genuinely fit — if none do, continue building their profile instead.`;
  } catch (e) {
    console.error("[EVENTS ERR]", e);
    return "";
  }
}

// Deduplicate Meta webhook deliveries
const processedIds = new Set<string>();
// Cache detected mode per number so we don't re-detect on every message
const modeByNumber = new Map<string, ConversationMode>();

// ─── Webhook verification ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── Incoming message handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return NextResponse.json({ ok: true });

    const message = messages[0];

    // Deduplicate
    if (processedIds.has(message.id)) return NextResponse.json({ ok: true });
    processedIds.add(message.id);
    if (processedIds.size > 500) {
      const oldest = processedIds.values().next().value;
      if (oldest) processedIds.delete(oldest);
    }

    if (message.type !== "text") return NextResponse.json({ ok: true });

    const from = message.from as string;
    const text = message.text.body as string;

    console.log(`[WA IN]  ${from}: ${text}`);

    await markAsRead(message.id);

    // ── Load history from Supabase ─────────────────────────────────────────────
    const { data: historyRows } = await supabase
      .from("messages")
      .select("role, content")
      .eq("phone_number", from)
      .order("created_at", { ascending: true })
      .limit(30);

    type Message = { role: "user" | "assistant"; content: string };
    const history: Message[] = (historyRows ?? []) as Message[];

    // On first message, detect mode and upsert user_profiles row
    const isNew = history.length === 0;
    if (isNew) {
      const venue = detectVenue(text);
      const mode: ConversationMode = venue ? "feedback" : "discovery";
      modeByNumber.set(from, mode);
      if (venue) console.log(`[WA VENUE] ${from} → ${venue.name}`);
      console.log(`[WA MODE] ${from} → ${mode}`);
      await supabase.from("user_profiles").upsert(
        { phone_number: from, last_active: new Date().toISOString() },
        { onConflict: "phone_number" }
      );
    } else {
      supabase.from("user_profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("phone_number", from)
        .then(() => {});
    }

    const mode = modeByNumber.get(from) ?? "discovery";
    const firstUserMsg = history.find(m => m.role === "user")?.content ?? text;
    const venue = detectVenue(firstUserMsg);
    const venueName = venue?.name ?? null;

    // Persist incoming user message
    await supabase.from("messages").insert({
      phone_number: from,
      role: "user",
      content: text,
      wa_message_id: message.id,
    });

    const fullHistory: Message[] = [...history, { role: "user", content: text }];

    // In discovery mode, look up any mentioned artists on Last.fm so Claude
    // responds with accurate genre info rather than guessing
    let artistContext = "";
    if (mode === "discovery") {
      artistContext = await buildArtistContext(text);
    }

    // In discovery mode, look up real events when the user asks or after enough exchanges
    let eventContext = "";
    if (mode === "discovery" && (isEventQuery(text) || fullHistory.length >= 6)) {
      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("phone_number", from)
        .single();
      if (profileRow && (profileRow.profile_confidence ?? 0) >= 0.3) {
        eventContext = await findMatchingEvents(from, profileRow as Record<string, unknown>, text);
      }
    }

    // Call Claude
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system: buildSystemPrompt(mode, venueName, artistContext) + eventContext,
      messages: fullHistory,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    // Persist assistant reply
    await supabase.from("messages").insert({
      phone_number: from,
      role: "assistant",
      content: reply,
    });

    console.log(`[WA OUT] ${from}: ${reply}`);

    // Fire-and-forget profile extraction (runs async, doesn't block reply)
    extractAndSaveProfile(from, [...fullHistory, { role: "assistant", content: reply }]);

    await sendWhatsApp(from, reply);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[WA ERR]", err);
    return NextResponse.json({ ok: true });
  }
}

// ─── Real-time artist context via Last.fm ─────────────────────────────────────
// Extracts artist names from the user's message, fetches real genre/bio data
// from Last.fm, and returns a context string to inject into the system prompt.

async function extractArtistNames(text: string): Promise<string[]> {
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: "Extract any musician or band names from the message. Reply with ONLY a JSON array of strings, e.g. [\"Barry Can't Swim\",\"Bicep\"]. Reply [] if none.",
      messages: [{ role: "user", content: text }],
    });
    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

async function lastfmArtistInfo(name: string): Promise<{ genres: string[]; summary: string } | null> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(name)}&api_key=${process.env.LASTFM_API_KEY}&format=json&autocorrect=1`;
    const res = await fetch(url);
    const data = await res.json() as {
      artist?: {
        tags?: { tag?: { name: string }[] };
        bio?: { summary?: string };
      };
      error?: number;
    };
    if (data.error || !data.artist) return null;
    const genres = (data.artist.tags?.tag ?? []).slice(0, 5).map(t => t.name).filter(Boolean);
    const summary = (data.artist.bio?.summary ?? "").replace(/<[^>]+>/g, "").split("Read more")[0].trim().slice(0, 200);
    return { genres, summary };
  } catch {
    return null;
  }
}

async function buildArtistContext(text: string): Promise<string> {
  const names = await extractArtistNames(text);
  if (!names.length) return "";

  const results = await Promise.all(names.map(async name => {
    const info = await lastfmArtistInfo(name);
    if (!info || !info.genres.length) return null;
    return `${name}: ${info.genres.join(", ")}${info.summary ? ` — ${info.summary}` : ""}`;
  }));

  const lines = results.filter(Boolean) as string[];
  if (!lines.length) return "";

  console.log(`[ARTIST CTX] ${lines.join(" | ")}`);
  return `IMPORTANT — verified artist data from Last.fm (use this, do not guess genres):\n${lines.map(l => `• ${l}`).join("\n")}`;
}

// ─── Async profile extraction ─────────────────────────────────────────────────

const PROFILE_SYSTEM = `Extract a structured preference profile from this WhatsApp conversation. Return ONLY valid JSON with these fields (omit or null any with no evidence):
{
  "genre_affinities": [{"genre": "...", "weight": 0.0-1.0, "source": "explicit|inferred"}],
  "home_area": "...",
  "preferred_towns": ["..."],
  "max_travel": "local|citywide|anywhere",
  "prefers_evenings": true/false,
  "prefers_weekends": true/false,
  "late_night_ok": true/false,
  "social_mode": "solo|couple|small_group|large_group",
  "has_kids": true/false,
  "budget_signal": "free_only|budget|mid|splurge",
  "venue_size_pref": "intimate|mid|large",
  "mentioned_artists": ["..."],
  "inferred_interests": ["..."],
  "profile_confidence": 0.0-1.0
}`;

async function extractAndSaveProfile(phone: string, history: { role: string; content: string }[]) {
  try {
    const transcript = history.map(m => `${m.role === "user" ? "User" : "crowdloop"}: ${m.content}`).join("\n");
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: PROFILE_SYSTEM,
      messages: [{ role: "user", content: transcript }],
    });
    const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return;
    const profile = JSON.parse(match[0]);

    // Enrich genre_affinities with verified Last.fm data for mentioned artists
    let genreAffinities = profile.genre_affinities ?? [];
    if (profile.mentioned_artists?.length) {
      const enriched = await Promise.all(profile.mentioned_artists.map(async (artist: string) => {
        const info = await lastfmArtistInfo(artist);
        return info?.genres ?? [];
      }));
      const lastfmGenres = enriched.flat();
      // Merge: boost existing genres that match Last.fm, add new ones
      const existing = new Map(genreAffinities.map((g: { genre: string; weight: number; source: string }) => [g.genre.toLowerCase(), g]));
      for (const genre of lastfmGenres) {
        const key = genre.toLowerCase();
        if (existing.has(key)) {
          const entry = existing.get(key) as { genre: string; weight: number; source: string };
          entry.weight = Math.min(1, entry.weight + 0.15);
        } else {
          existing.set(key, { genre, weight: 0.6, source: "artist_lookup" });
        }
      }
      genreAffinities = Array.from(existing.values());
    }

    await supabase.from("user_profiles").upsert({
      phone_number: phone,
      genre_affinities: genreAffinities.length ? genreAffinities : null,
      home_area: profile.home_area ?? null,
      preferred_towns: profile.preferred_towns ?? null,
      max_travel: profile.max_travel ?? null,
      prefers_evenings: profile.prefers_evenings ?? null,
      prefers_weekends: profile.prefers_weekends ?? null,
      late_night_ok: profile.late_night_ok ?? null,
      social_mode: profile.social_mode ?? null,
      has_kids: profile.has_kids ?? null,
      budget_signal: profile.budget_signal ?? null,
      venue_size_pref: profile.venue_size_pref ?? null,
      mentioned_artists: profile.mentioned_artists ?? null,
      inferred_interests: profile.inferred_interests ?? null,
      profile_confidence: profile.profile_confidence ?? 0,
      raw_profile: profile,
      last_active: new Date().toISOString(),
    }, { onConflict: "phone_number" });

    console.log(`[PROFILE] ${phone} confidence=${profile.profile_confidence}`);
  } catch (e) {
    console.error("[PROFILE ERR]", e);
  }
}

// ─── WhatsApp Cloud API helpers ───────────────────────────────────────────────

async function markAsRead(messageId: string) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  });
}

async function sendWhatsApp(to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[WA SEND ERR]", res.status, err);
  }
}
