import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VERIFY_TOKEN      = process.env.WHATSAPP_VERIFY_TOKEN;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

type ClientConfig = {
  accessToken: string;
  phoneNumberId: string;
  botName: string;
  templatePrefix: string;
};

function getClientConfig(phoneNumberId: string): ClientConfig {
  if (phoneNumberId === process.env.GIGPIG_PHONE_NUMBER_ID) {
    return {
      accessToken:   process.env.GIGPIG_ACCESS_TOKEN!,
      phoneNumberId: process.env.GIGPIG_PHONE_NUMBER_ID!,
      botName:       "GigPig",
      templatePrefix: "gigpig",
    };
  }
  return {
    accessToken:   process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    botName:       "crowdloop",
    templatePrefix: "crowdloop",
  };
}

const CROWDLOOP_SYSTEM = `You are crowdloop, a WhatsApp assistant that helps people get more out of live events and discover new ones they'll love.

You naturally handle two things — often in the same conversation. If someone has just been to an event, hear what they experienced: what they loved, what fell short, what kind of crowd it attracted. If someone wants to find events, help them discover what's on based on what you know about their taste. Follow the conversation — if it moves between the two, move with it.

Your purpose is to understand each person well enough to be genuinely useful. The more you know about what they care about, the better you can connect them to experiences worth attending.

Rules:
- Keep every reply SHORT — 1 to 3 sentences, exactly like a real WhatsApp message
- Be warm and genuinely curious, not formal or salesy
- Ask ONE focused question per message — never multiple at once
- If someone raises a complaint or issue about an event: acknowledge warmly and say you'll make sure the team hears it — never promise remedies or refunds
- Never use em dashes in your replies
- Never use bullet points, numbered lists, or long paragraphs
- Never use slang like "vibe", "mate", "gutted", "banging", "brilliant"
- Never say you don't have access to event listings or real-time data — you do
- When recommending multiple events, call send_events_carousel immediately after one short intro sentence — do not describe events in text only
- When the user asks for a specific event's link, call send_event_link with the event title and slug
- Never include URLs in your text reply
- Never break character
- VENUE WATCHING — follow this exact flow, no deviations:
  1. User shares a URL or venue name → ALWAYS write a short message first ("On it..." or "Looking that up...") AND call find_venue in the same response
  2. find_venue returns → write ONE sentence confirming what you found (just the name and city), then ask "Want me to watch this and alert you when new events go up?" — nothing else
  3. User says yes/yeah/sure/ok → immediately call add_venue_to_watchlist — do NOT ask any follow-up questions first
  4. Never ask for location or extra details if the user already gave you a URL
  5. Use list_watched_venues to show the user's watchlist. Use remove_venue_from_watchlist to stop tracking`;

const GIGPIG_DISCOVERY_SYSTEM = `You are GigPig's WhatsApp assistant, helping music fans discover live events from across the GigPig network — the UK's largest live music marketplace, with over 20,000 artists performing at hundreds of venues nationwide.

Your job is to learn what this person loves and match them to upcoming live events they'll genuinely want to attend. The better you understand their taste, the better the recommendations you can send them.

GigPig connects real fans with real artists at real venues. You care about live music the same way they do — not as a transaction, but as something that matters. Any venue can be a stage, and every fan deserves to find their next favourite night out.

Make this purpose clear naturally. For example: "Tell me what you're into and I'll find something worth going to." Or when they mention an artist: "Good shout — if they're playing near you through GigPig I'll make sure you know about it."

Learn what you need: genres, artists they love, where they're based, when they go out, whether they want to discover new acts or see names they already know.

Rules:
- Keep every reply SHORT — 1 to 3 sentences, exactly like a real WhatsApp message
- Be warm and genuine, not salesy or corporate
- Ask ONE focused question per message — never multiple at once
- Open with what kind of music or events they're into — let them lead
- When they mention an artist, follow up naturally — what do they love about them, similar acts they rate
- When you have a solid picture (after 5-8 exchanges), confirm you'll keep them posted on events that fit
- Never use em dashes in your replies
- Never use bullet points, numbered lists, or long paragraphs
- Never use slang like "vibe", "mate", "gutted", "banging", "brilliant"
- Never say you don't have access to event listings or real-time data — you have access to GigPig's full live event catalogue
- When recommending multiple events, call send_events_carousel with 2-10 events immediately after your intro sentence — do not describe events in text only
- When the user asks for a specific event's link, call send_event_link with the event title and slug
- Never include URLs in your text reply
- Never break character`;

// ─── Venue watching helpers ───────────────────────────────────────────────────

function urlToGoSlug(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  } catch {
    return url.replace(/[^a-z0-9]/g, "-").slice(0, 50);
  }
}

async function findVenueInfo(query: string): Promise<{
  name: string; url: string; image_url: string | null; preview: string;
}> {
  let url = query.trim();

  if (!url.startsWith("http")) {
    // Search for the venue by name
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
      body: JSON.stringify({ query: `${query} official website events`, limit: 3 }),
    });
    const searchJson = await searchRes.json() as { data?: { url: string }[] };
    url = searchJson.data?.[0]?.url ?? "";
    if (!url) return { name: query, url: "", image_url: null, preview: "Could not find a website for that venue." };
  }

  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false }),
  });
  const scrapeJson = await scrapeRes.json() as { success: boolean; data?: { markdown?: string; html?: string; metadata?: { title?: string; ogTitle?: string } } };
  if (!scrapeJson.success) return { name: query, url, image_url: null, preview: "Could not load that page." };

  const html = scrapeJson.data?.html ?? "";
  const markdown = scrapeJson.data?.markdown ?? "";

  const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]
    ?? html.match(/name="twitter:image"\s+content="([^"]+)"/)?.[1]
    ?? Array.from(html.matchAll(/https?:\/\/[^"'\s]+\/uploads\/[^"'\s]+\.(jpg|jpeg|webp)/gi)).map(m => m[0]).find(Boolean)
    ?? null;

  const name = scrapeJson.data?.metadata?.ogTitle
    ?? scrapeJson.data?.metadata?.title?.split("|")[0]?.split("–")[0]?.trim()
    ?? query;

  const preview = markdown.slice(0, 400);
  return { name, url, image_url: ogImg, preview };
}

function buildSystemPrompt(botName: string, artistContext = ""): string {
  const system = botName === "GigPig" ? GIGPIG_DISCOVERY_SYSTEM : CROWDLOOP_SYSTEM;
  if (artistContext) return `${system}\n\n${artistContext}`;
  return system;
}

// ─── Event matching ───────────────────────────────────────────────────────────

function isEventQuery(text: string): boolean {
  return /what.?s on|any (gigs?|events?|shows?|nights?)|this (weekend|week|friday|saturday|sunday)|tonight|what should i (do|see|go)|gigs? (in|near|around)|events? (in|near|around)|what.?s happening|what.?s good|recommend|anything on|(give|send|get).{0,10}link|what.?s the link|ticket/i.test(text);
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

type EventFull = EventCandidate & {
  details_url: string; // guaranteed non-null after filtering
  artist_image: string | null;
  embedding_text: string | null;
};

function formatVenueDate(venueName: string, startTime: string): string {
  const date = new Date(startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time} · ${venueName}`;
}

const UK_CITIES = ["london", "manchester", "birmingham", "bristol", "leeds", "sheffield", "edinburgh", "glasgow", "liverpool", "brighton", "bath", "oxford", "cambridge", "nottingham", "cardiff"];

function extractLocationFromMessage(userMessage: string): string | null {
  const lower = userMessage.toLowerCase();
  return UK_CITIES.find(c => lower.includes(c)) ?? null;
}

function extractLocation(userMessage: string, profile: Record<string, unknown>, sessionLocation: string | null): string | null {
  // Priority: current message → session location → profile home_area
  const fromMsg = extractLocationFromMessage(userMessage);
  if (fromMsg) return fromMsg;
  if (sessionLocation) return sessionLocation;
  const homeArea = profile.home_area as string | null;
  if (homeArea) {
    const fromProfile = UK_CITIES.find(c => homeArea.toLowerCase().includes(c));
    if (fromProfile) return fromProfile;
  }
  return null;
}

function extractDateRange(userMessage: string): { from: Date; to: Date; dayFilter?: number } | null {
  const lower = userMessage.toLowerCase();
  const now = new Date();
  const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const monthIdx = MONTHS.findIndex(m => lower.includes(m));
  if (monthIdx !== -1) {
    const year = monthIdx < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    return {
      from: new Date(year, monthIdx, 1),
      to: new Date(year, monthIdx + 1, 0, 23, 59, 59),
    };
  }
  const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayIdx = DAYS.findIndex(d => lower.includes(d));
  if (dayIdx !== -1) {
    const to = new Date(now);
    to.setDate(now.getDate() + 56);
    return { from: now, to, dayFilter: dayIdx };
  }
  if (/next two weeks|two weeks|fortnight/.test(lower)) {
    const to = new Date(now);
    to.setDate(now.getDate() + 14);
    return { from: now, to };
  }
  if (/few weeks|coming weeks|next few weeks|couple of weeks/.test(lower)) {
    const to = new Date(now);
    to.setDate(now.getDate() + 21);
    return { from: now, to };
  }
  if (/this week/.test(lower)) {
    const to = new Date(now);
    to.setDate(now.getDate() + (7 - now.getDay()));
    to.setHours(23, 59, 59, 0);
    return { from: now, to };
  }
  if (/next month/.test(lower)) {
    const m = now.getMonth() + 1;
    const y = m > 11 ? now.getFullYear() + 1 : now.getFullYear();
    return { from: new Date(y, m % 12, 1), to: new Date(y, (m % 12) + 1, 0, 23, 59, 59) };
  }
  if (/next weekend/.test(lower)) {
    const day = now.getDay();
    const daysToSat = ((6 - day + 7) % 7) || 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0,0,0,0);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23,59,59,0);
    return { from: sat, to: sun };
  }
  if (/this weekend/.test(lower)) {
    const day = now.getDay();
    const daysToSat = (6 - day + 7) % 7;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0,0,0,0);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23,59,59,0);
    return { from: sat, to: sun };
  }
  return null;
}

async function fetchMatchingEvents(
  phone: string,
  profile: Record<string, unknown>,
  userMessage: string,
  sessionLocation: string | null,
  recentHistory: { role: string; content: string }[],
): Promise<{ events: EventFull[]; location: string | null; lowConfidence?: boolean }> {
  try {
    const location = extractLocation(userMessage, profile, sessionLocation);
    // Weight current conversation over saved profile: recent messages first, profile last
    const recentConversation = recentHistory.slice(-6).map(m => m.content).join(" ");
    const queryText = [userMessage, recentConversation, profileToQueryText(profile)].filter(Boolean).join(". ");
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: queryText });
    const embedding = embRes.data[0].embedding;

    const { data, error } = await supabase.rpc("match_events", {
      query_embedding: embedding,
      phone,
      match_count: 150,
    });

    if (error || !data?.length) return { events: [], location };

    type EventWithSimilarity = EventCandidate & { similarity: number };
    let candidates = (data as EventWithSimilarity[]).filter(e => e.details_url !== null);
    const topSimilarity = candidates[0]?.similarity ?? 0;
    if (topSimilarity < 0.40) {
      console.log(`[EVENTS] Low confidence (${(topSimilarity * 100).toFixed(1)}%) — skipping carousel`);
      return { events: [], location, lowConfidence: true };
    }

    const dateRange = extractDateRange(userMessage);
    if (dateRange) {
      const dateFiltered = candidates.filter(e => {
        const d = new Date(e.start_time);
        const inRange = d.getTime() >= dateRange.from.getTime() && d.getTime() <= dateRange.to.getTime();
        const rightDay = dateRange.dayFilter !== undefined ? d.getDay() === dateRange.dayFilter : true;
        return inRange && rightDay;
      });
      if (dateFiltered.length > 0) candidates = dateFiltered;
    }

    // Batch fetch artist images, location, and genre context
    type RawRow = { id: number; artist_image: string | null; embedding_text: string | null; raw: { location?: { town?: string; county?: string } } | null };
    const { data: imageRows } = await supabase
      .from("events")
      .select("id, artist_image, embedding_text, raw")
      .in("id", candidates.map(e => e.id));
    const infoMap = new Map(
      (imageRows ?? []).map((r: RawRow) => {
        const loc = r.raw?.location ?? {};
        return [r.id, {
          artist_image: r.artist_image,
          embedding_text: r.embedding_text,
          town: (loc.town ?? "").toLowerCase(),
          county: (loc.county ?? "").toLowerCase(),
        }];
      })
    );

    if (location) {
      const locationFiltered = candidates.filter(e => {
        const info = infoMap.get(e.id);
        return info
          ? info.town.includes(location) || info.county.includes(location) || e.venue_name.toLowerCase().includes(location)
          : e.venue_name.toLowerCase().includes(location);
      });
      console.log(`[LOCATION] ${location}: ${locationFiltered.length}/${candidates.length} candidates matched`);
      if (locationFiltered.length === 0) {
        console.log(`[LOCATION] Nothing in ${location} — returning empty rather than wrong-city results`);
        return { events: [], location, lowConfidence: true };
      }
      candidates = locationFiltered;
    }

    const isLateNight = /late night|after midnight|late evening/.test(userMessage.toLowerCase());
    if (isLateNight) {
      const lateFiltered = candidates.filter(e => new Date(e.start_time).getHours() >= 21);
      console.log(`[LATE NIGHT] ${lateFiltered.length}/${candidates.length} events starting 21:00+`);
      if (lateFiltered.length > 0) candidates = lateFiltered;
    }

    // Pick top 9 with venue diversity — max 2 events per venue
    const venueCounts = new Map<string, number>();
    const top: typeof candidates = [];
    for (const e of candidates) {
      const count = venueCounts.get(e.venue_name) ?? 0;
      if (count < 2) {
        top.push(e);
        venueCounts.set(e.venue_name, count + 1);
      }
      if (top.length === 9) break;
    }

    const events: EventFull[] = top.map(e => ({
      ...e,
      details_url: e.details_url as string,
      artist_image: infoMap.get(e.id)?.artist_image ?? null,
      embedding_text: infoMap.get(e.id)?.embedding_text ?? null,
    }));

    console.log(`[EVENTS] ${events.length} linkable candidates for ${phone}${location ? ` (filtered: ${location})` : ""}`);
    return { events, location };
  } catch (e) {
    console.error("[EVENTS ERR]", e);
    return { events: [], location: null };
  }
}

function buildEventContext(events: EventFull[], location: string | null): string {
  if (!events.length) return "";
  const locationNote = location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : "";
  const lines = events.map((e, i) => {
    const slug = e.details_url.startsWith("https://www.gigpig.uk/whats-on/")
      ? e.details_url.replace("https://www.gigpig.uk/whats-on/", "")
      : e.details_url.split("/").filter(Boolean).pop() ?? "event";
    // Extract genre/vibe line from embedding_text (e.g. "Genre: jazz, soul. Vibe: intimate, seated")
    const genreLine = e.embedding_text?.match(/Genre:[^.]+\.|Vibe:[^.]+\./g)?.join(" ") ?? "";
    return `${i + 1}. ${e.title} at ${e.venue_name} — ${formatVenueDate(e.venue_name, e.start_time)}${genreLine ? ` | ${genreLine}` : ""} [slug: ${slug}]`;
  }).join("\n");
  return `\n\nUPCOMING EVENTS${locationNote} from the crowdloop database, matched to this user's taste:\n${lines}\n\nEvery event has a slug. Call send_event_link for a specific event, or send_events_carousel to show 2-10 events as image cards. Use the Genre/Vibe info to write an accurate intro — do not guess genre from the user's profile.`;
}

// Deduplicate Meta webhook deliveries
const processedIds = new Set<string>();
// Cache last known location per number so follow-up messages inherit it
const locationByNumber = new Map<string, string>();

// ─── Crowdloop demo events ────────────────────────────────────────────────────
// Used when the Crowdloop number is active — curated sample events drawn from
// Underground Fan Club's real brand partnerships. Claude picks the most relevant
// ones based on the conversation rather than semantic DB matching.

const CROWDLOOP_DEMO_EVENTS: EventFull[] = [
  {
    id: -1,
    title: "Underground Fan Club x Guinness — Aston Villa After Party",
    venue_name: "Villa Park, Birmingham",
    start_time: "2026-08-09T21:30:00",
    details_url: "https://www.undergroundfanclub.com/experiences/aston-villa-party",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: fan experience, brand activation. Vibe: post-match, exclusive access, community.",
  },
  {
    id: -2,
    title: "Nike Run Club — Summer Series London",
    venue_name: "Victoria Park, London",
    start_time: "2026-07-27T08:00:00",
    details_url: "https://www.undergroundfanclub.com/experiences/nike-summer-series",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: running, fitness community, brand event. Vibe: active, social, outdoor, morning.",
  },
  {
    id: -3,
    title: "The Fast Supper Vol. 2 — New Balance x Sportsshoes",
    venue_name: "Shoreditch, London",
    start_time: "2026-08-14T19:00:00",
    details_url: "https://www.undergroundfanclub.com/experiences/fast-supper-2",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: brand dinner, running community, exclusive. Vibe: intimate, post-run, social.",
  },
  {
    id: -4,
    title: "NFL UK Fan Experience — Boxpark x Underground Fan Club",
    venue_name: "Boxpark Wembley, London",
    start_time: "2026-09-06T17:00:00",
    details_url: "https://www.undergroundfanclub.com/experiences/nfl-fan-experience",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: sports fan event, American football, brand activation. Vibe: high-energy, fan community, immersive.",
  },
  {
    id: -5,
    title: "Strava x Underground Fan Club — Community Ride London",
    venue_name: "Clapham Common, London",
    start_time: "2026-08-02T09:00:00",
    details_url: "https://www.undergroundfanclub.com/experiences/strava-community-ride",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: cycling, fitness community, brand event. Vibe: social, outdoor, active morning.",
  },
  {
    id: -6,
    title: "Word on the Curb — Culture Festival 2026",
    venue_name: "Peckham Rye Park, London",
    start_time: "2026-08-30T13:00:00",
    details_url: "https://www.undergroundfanclub.com/experiences/word-on-the-curb",
    artist_image: "https://picsum.photos/seed/crowdloop/800/450",
    embedding_text: "Genre: culture, community, street festival, arts. Vibe: outdoor, diverse, food, music.",
  },
];

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

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;
    if (!messages?.length) return NextResponse.json({ ok: true });

    const message = messages[0];
    const incomingPhoneNumberId = value?.metadata?.phone_number_id as string;
    const wa = getClientConfig(incomingPhoneNumberId);

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

    await markAsRead(message.id, wa);

    // ── Load history from Supabase ─────────────────────────────────────────────
    const { data: historyRows } = await supabase
      .from("messages")
      .select("role, content")
      .eq("phone_number", from)
      .order("created_at", { ascending: true })
      .limit(30);

    type Message = { role: "user" | "assistant"; content: string };
    const history: Message[] = (historyRows ?? []) as Message[];

    // Upsert user_profiles row
    if (history.length === 0) {
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

    // Persist incoming user message
    await supabase.from("messages").insert({
      phone_number: from,
      role: "user",
      content: text,
      wa_message_id: message.id,
    });

    const fullHistory: Message[] = [...history, { role: "user", content: text }];

    // Look up any mentioned artists on Last.fm
    const artistContext = await buildArtistContext(text);

    // Look up real events when the user asks or after enough exchanges
    let eventMatches: EventFull[] = [];
    let eventContext = "";
    let noMatchContext = "";
    if (isEventQuery(text) || fullHistory.length >= 6) {
      if (wa.botName === "GigPig") {
        // GigPig: match against live event database
        const { data: profileRow } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("phone_number", from)
          .single();
        if (profileRow && (profileRow.profile_confidence ?? 0) >= 0.3) {
          const msgLocation = extractLocationFromMessage(text);
          if (msgLocation) locationByNumber.set(from, msgLocation);
          const sessionLocation = locationByNumber.get(from) ?? null;
          const { events, location, lowConfidence } = await fetchMatchingEvents(from, profileRow as Record<string, unknown>, text, sessionLocation, history);
          eventMatches = events;
          if (lowConfidence) {
            const cityNote = location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : "";
            noMatchContext = `\n\nEVENT SEARCH RESULT: Nothing found${cityNote} in the database matching this request. Be honest — tell the user there's nothing matching right now${cityNote ? " in that area" : ""}. Then pivot: if a city was mentioned, ask if they'd consider somewhere nearby or a different night; otherwise ask what else they're into.`;
          } else {
            eventContext = buildEventContext(events, location);
          }
        }
      } else {
        // Crowdloop demo: use curated sample events — Claude picks based on conversation
        eventMatches = CROWDLOOP_DEMO_EVENTS;
        eventContext = buildEventContext(CROWDLOOP_DEMO_EVENTS, null);
      }
    }

    // Build system prompt — when events are ready, switch into recommendation mode
    // so the profiling rules don't override the instruction to recommend
    const baseSystem = buildSystemPrompt(wa.botName, artistContext);
    const system = eventContext
      ? `${baseSystem}\n\n--- RECOMMENDATION MODE: MANDATORY ---\nYou have real upcoming events in the database. You MUST call send_events_carousel in this response — no exceptions, no deferring to a later message. Pick between 2 and 10 events from the list based on how many are genuinely relevant — do not pad with weak matches, but do not artificially limit to 3. Write one short sentence introducing them, then call the tool. Do NOT say you will "look into it", "get back to them", or that you need to find events — you have them right now. Do NOT filter by date in your head — show the best taste-matched events available regardless of exact date. Do NOT ask any more questions.${eventContext}`
      : noMatchContext
        ? `${baseSystem}${noMatchContext}`
        : baseSystem;

    // Call Claude with tools available
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system,
      messages: fullHistory,
      tools: [
        {
          name: "send_event_link",
          description: "Send a WhatsApp image card with artist photo and a Find out more button for one specific event. Call this when the user asks for a link to a specific event they want to attend.",
          input_schema: {
            type: "object" as const,
            properties: {
              event_title: { type: "string", description: "Display name of the event, e.g. 'DJ H at Swingers'" },
              gigpig_slug: { type: "string", description: "The slug from the event listing, e.g. 'dj-h-swingers-13403437'" },
            },
            required: ["event_title", "gigpig_slug"],
          },
        },
        {
          name: "send_events_carousel",
          description: "Send a WhatsApp carousel of 2-10 recommended events, each with an artist photo and a Find out more button. Call this when recommending events to the user. Choose how many events to include based on how many are genuinely relevant — don't pad with weak matches.",
          input_schema: {
            type: "object" as const,
            properties: {
              events: {
                type: "array",
                description: "2-10 events to show in the carousel — only include events that are a strong match for this person's taste",
                items: {
                  type: "object",
                  properties: {
                    event_title: { type: "string", description: "Display name of the event" },
                    gigpig_slug: { type: "string", description: "The slug from the event listing" },
                  },
                  required: ["event_title", "gigpig_slug"],
                },
                minItems: 2,
                maxItems: 10,
              },
            },
            required: ["events"],
          },
        },
        {
          name: "find_venue",
          description: "Look up a venue by URL or by name/city to preview it before adding to the watchlist. Returns the venue name, website URL, and a content preview so you can confirm it's the right place with the user.",
          input_schema: {
            type: "object" as const,
            properties: {
              query: { type: "string", description: "A full URL (e.g. https://thepigshead.com) or a venue name with optional city (e.g. 'The Pigs Head Clapham')" },
            },
            required: ["query"],
          },
        },
        {
          name: "add_venue_to_watchlist",
          description: "Add a venue to this user's watchlist so they get WhatsApp alerts when new events appear. Only call this after the user has confirmed they want to watch the venue.",
          input_schema: {
            type: "object" as const,
            properties: {
              url:       { type: "string", description: "The venue website URL" },
              label:     { type: "string", description: "The venue display name" },
              image_url: { type: "string", description: "URL of the venue image for carousel cards (optional)" },
            },
            required: ["url", "label"],
          },
        },
        {
          name: "list_watched_venues",
          description: "List all venues this user is currently watching for event updates.",
          input_schema: { type: "object" as const, properties: {} },
        },
        {
          name: "remove_venue_from_watchlist",
          description: "Stop watching a venue and remove it from the user's watchlist.",
          input_schema: {
            type: "object" as const,
            properties: {
              label: { type: "string", description: "The venue label to remove" },
            },
            required: ["label"],
          },
        },
      ],
      tool_choice: { type: "auto" },
    });

    const textBlock = response.content.find(b => b.type === "text");
    const toolUse  = response.content.find(b => b.type === "tool_use");
    const reply = textBlock?.type === "text" ? textBlock.text : "";

    await supabase.from("messages").insert({ phone_number: from, role: "assistant", content: reply });
    console.log(`[WA OUT] ${from}: ${reply}`);

    extractAndSaveProfile(from, [...fullHistory, { role: "assistant", content: reply }]);

    if (reply) await sendWhatsApp(from, reply, wa);

    // If Claude called a tool but sent no text, the user is waiting in silence — send a fallback
    if (toolUse?.type === "tool_use" && !reply) {
      const silentTools = ["find_venue", "list_watched_venues"];
      if (silentTools.includes(toolUse.name)) {
        await sendWhatsApp(from, "On it...", wa);
      }
    }

    if (toolUse?.type === "tool_use") {
      if (toolUse.name === "send_event_link") {
        const { event_title, gigpig_slug } = toolUse.input as { event_title: string; gigpig_slug: string };
        const match = eventMatches.find(e => e.details_url.endsWith(gigpig_slug));
        if (match?.artist_image) {
          await sendEventCard(from, event_title, formatVenueDate(match.venue_name, match.start_time), match.artist_image, gigpig_slug, wa);
          console.log(`[WA CARD] ${from} (${wa.botName}): event_card → ${gigpig_slug}`);
        } else {
          await sendEventTemplate(from, event_title, gigpig_slug, wa);
          console.log(`[WA LINK] ${from} (${wa.botName}): go fallback → ${gigpig_slug}`);
        }
      } else if (toolUse.name === "find_venue") {
        const { query } = toolUse.input as { query: string };
        const info = await findVenueInfo(query);
        const toolResult = info.url
          ? `Found: "${info.name}" at ${info.url}${info.image_url ? ` (image: ${info.image_url})` : ""}.\n\nPage preview:\n${info.preview}`
          : `Could not find a venue matching "${query}". Try a different name or paste the URL directly.`;
        const followUp = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: buildSystemPrompt(wa.botName),
          messages: [
            ...fullHistory,
            { role: "assistant", content: response.content },
            { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: toolResult }] },
          ],
        });
        const followUpText = followUp.content.find(b => b.type === "text")?.text ?? "";
        if (followUpText) await sendWhatsApp(from, followUpText, wa);

      } else if (toolUse.name === "add_venue_to_watchlist") {
        const { url, label, image_url } = toolUse.input as { url: string; label: string; image_url?: string };
        const go_slug = urlToGoSlug(url);
        const { data: existing } = await supabase.from("watched_urls").select("id").eq("phone_number", from).eq("url", url).maybeSingle();
        let toolResult: string;
        if (existing) {
          toolResult = `Already watching ${label}.`;
        } else {
          await supabase.from("watched_urls").insert({ url, phone_number: from, label, image_url: image_url ?? null, go_slug });
          toolResult = `Added ${label} to watchlist. Daily scan will alert when new events appear.`;
          console.log(`[WATCH] ${from} → ${label} (${url})`);
        }
        const followUp = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          system: buildSystemPrompt(wa.botName),
          messages: [
            ...fullHistory,
            { role: "assistant", content: response.content },
            { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: toolResult }] },
          ],
        });
        const followUpText = followUp.content.find(b => b.type === "text")?.text ?? "";
        if (followUpText) await sendWhatsApp(from, followUpText, wa);

      } else if (toolUse.name === "list_watched_venues") {
        const { data: venues } = await supabase
          .from("watched_urls")
          .select("label, url, image_url, go_slug, last_changed")
          .eq("phone_number", from)
          .order("created_at");

        if (venues?.length) {
          // Send a short text intro then a carousel
          await sendWhatsApp(from, `You're watching ${venues.length} venue${venues.length > 1 ? "s" : ""}.`, wa);
          await sendWatchlistCarousel(from, venues, wa);
        } else {
          await sendWhatsApp(from, "You're not watching any venues yet. Share a URL or a venue name and I'll set it up for you.", wa);
        }

      } else if (toolUse.name === "remove_venue_from_watchlist") {
        const { label } = toolUse.input as { label: string };
        await supabase.from("watched_urls").delete().eq("phone_number", from).ilike("label", label);
        const followUp = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          system: buildSystemPrompt(wa.botName),
          messages: [
            ...fullHistory,
            { role: "assistant", content: response.content },
            { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: `Removed ${label} from watchlist.` }] },
          ],
        });
        const followUpText = followUp.content.find(b => b.type === "text")?.text ?? "";
        if (followUpText) await sendWhatsApp(from, followUpText, wa);

      } else if (toolUse.name === "send_events_carousel") {
        const { events } = toolUse.input as { events: Array<{ event_title: string; gigpig_slug: string }> };
        const enriched = events.map(e => {
          const match = eventMatches.find(m => m.details_url.endsWith(e.gigpig_slug));
          return {
            event_title: e.event_title,
            venue_date: match ? formatVenueDate(match.venue_name, match.start_time) : "",
            artist_image: match?.artist_image ?? "",
            gigpig_slug: e.gigpig_slug,
            start_time: match?.start_time ?? "",
          };
        }).filter(e => e.artist_image && e.venue_date)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .slice(0, 3);

        if (enriched.length >= 2) {
          await sendEventCarousel(from, enriched, wa);
          console.log(`[WA CAROUSEL] ${from} (${wa.botName}): ${enriched.length} cards`);
        } else if (enriched.length === 1) {
          await sendEventCard(from, enriched[0].event_title, enriched[0].venue_date, enriched[0].artist_image, enriched[0].gigpig_slug, wa);
          console.log(`[WA CARD] ${from} (${wa.botName}): single card fallback`);
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[WA ERR]", err);
    return NextResponse.json({ ok: true });
  }
}

// ─── Real-time artist context via Last.fm ─────────────────────────────────────

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

    let genreAffinities = profile.genre_affinities ?? [];
    if (profile.mentioned_artists?.length) {
      const enriched = await Promise.all(profile.mentioned_artists.map(async (artist: string) => {
        const info = await lastfmArtistInfo(artist);
        return info?.genres ?? [];
      }));
      const lastfmGenres = enriched.flat();
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

async function sendEventCard(to: string, eventTitle: string, venueDate: string, imageUrl: string, gigpigSlug: string, client: ClientConfig) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: `${client.templatePrefix}_event_card`,
        language: { code: "en_GB" },
        components: [
          {
            type: "header",
            parameters: [{ type: "image", image: { link: imageUrl } }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: eventTitle },
              { type: "text", text: venueDate },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: gigpigSlug }],
          },
        ],
      },
    }),
  });
  if (!res.ok) console.error("[WA CARD ERR]", res.status, await res.text());
}

async function sendEventCarousel(
  to: string,
  events: Array<{ event_title: string; venue_date: string; artist_image: string; gigpig_slug: string }>,
  client: ClientConfig,
) {
  const templateName = `${client.templatePrefix}_carousel_${events.length}`;
  const res = await fetch(`https://graph.facebook.com/v19.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_GB" },
        components: [
          {
            type: "carousel",
            cards: events.map((e, index) => ({
              card_index: index,
              components: [
                {
                  type: "header",
                  parameters: [{ type: "image", image: { link: e.artist_image } }],
                },
                {
                  type: "body",
                  // Card body: "Coming up: *{{1}}*\n{{2}}\nTap to get tickets."
                  parameters: [
                    { type: "text", text: e.event_title },
                    { type: "text", text: e.venue_date },
                  ],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: e.gigpig_slug }],
                },
              ],
            })),
          },
        ],
      },
    }),
  });
  const resBody = await res.json().catch(() => null);
  console.log("[WA CAROUSEL API]", res.status, JSON.stringify(resBody));
  if (!res.ok || resBody?.error) console.error("[WA CAROUSEL ERR]", res.status, JSON.stringify(resBody));
}

async function sendWatchlistCarousel(
  to: string,
  venues: Array<{ label: string; go_slug: string | null; image_url: string | null; last_changed: string | null }>,
  client: ClientConfig,
) {
  const count = Math.min(venues.length, 6);
  const templateName = count === 1 ? "crowdloop_watchlist_2" : `crowdloop_watchlist_${count}`;
  const fallbackImg = "https://picsum.photos/seed/crowdloop/800/450";

  const cards = venues.slice(0, count).map((v, index) => {
    const lastUpdate = v.last_changed
      ? new Date(v.last_changed).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : "Watching for new events";
    const goSlug = v.go_slug ?? v.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      card_index: index,
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: v.image_url ?? fallbackImg } }] },
        { type: "body", parameters: [{ type: "text", text: v.label }, { type: "text", text: lastUpdate }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: goSlug }] },
      ],
    };
  });

  // For a single venue, send 2 identical cards (watchlist_2 is the minimum)
  if (count === 1) cards.push({ ...cards[0], card_index: 1 });

  const res = await fetch(`https://graph.facebook.com/v21.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_GB" },
        components: [{ type: "carousel", cards }],
      },
    }),
  });
  const resBody = await res.json().catch(() => null);
  console.log("[WA WATCHLIST CAROUSEL]", res.status, JSON.stringify(resBody));
  if (!res.ok || resBody?.error) console.error("[WA WATCHLIST ERR]", res.status, JSON.stringify(resBody));
}

async function sendEventTemplate(to: string, eventTitle: string, gigpigSlug: string, client: ClientConfig) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: `${client.templatePrefix}_go`,
        language: { code: "en_GB" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: eventTitle }],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: gigpigSlug }],
          },
        ],
      },
    }),
  });
  if (!res.ok) console.error("[WA TEMPLATE ERR]", res.status, await res.text());
}

async function markAsRead(messageId: string, client: ClientConfig) {
  await fetch(`https://graph.facebook.com/v19.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  });
}

async function sendWhatsApp(to: string, text: string, client: ClientConfig) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${client.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) console.error("[WA SEND ERR]", res.status, await res.text());
}
