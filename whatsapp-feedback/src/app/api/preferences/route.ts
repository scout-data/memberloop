import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { supabase, profileToQueryText, PreferenceProfile, MatchedEvent } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROFILE_SYSTEM = `You analyse a guest conversation and extract two things:

1. "display": an array of up to 5 human-readable preference pairs {label, value} for showing on-screen.
   Values should be 3–8 words. Only include things actually mentioned or clearly inferable.

2. "profile": a structured JSON object with these fields (omit or null any field with no evidence):
   - genre_affinities: [{genre, weight (0-1), source ("explicit"|"inferred")}] — music/event genres, ordered by confidence
   - home_area: string (neighbourhood, city, or region the person lives in)
   - work_area: string (where they work, if mentioned)
   - preferred_towns: string[] (towns/areas they'd travel to for events)
   - max_travel: "local"|"citywide"|"anywhere"
   - prefers_evenings: boolean
   - prefers_weekends: boolean
   - prefers_weekdays: boolean
   - late_night_ok: boolean
   - social_mode: "solo"|"couple"|"small_group"|"large_group"
   - has_kids: boolean
   - budget_signal: "free_only"|"budget"|"mid"|"splurge"
   - venue_size_pref: "intimate"|"mid"|"large"
   - indoor_outdoor_pref: "indoor"|"outdoor"|"either"
   - seated_standing_pref: "seated"|"standing"|"either"
   - mentioned_artists: string[] (any artist names mentioned)
   - mentioned_venues: string[] (any venue names mentioned)
   - inferred_interests: string[] (hobbies, activities, vibes inferred from context)
   - profile_confidence: number 0-1 (how complete the profile is overall)

3. "suggested": array of indices (0-based) into the provided venue calendar events that clearly match this person. Return [] if the conversation is too early.

Return ONLY valid JSON: {"display":[...],"profile":{...},"suggested":[...]}`;

export async function POST(req: NextRequest) {
  try {
    const { messages, events, phone, useSupabase } = await req.json() as {
      messages: { role: string; content: string }[];
      events?: { title: string; detail: string }[];
      phone?: string;
      useSupabase?: boolean;
    };

    const userMessages = messages.filter(m => m.role === "user");
    if (!userMessages.length) return NextResponse.json({ preferences: [], suggested: [] });

    const transcript = messages
      .filter(m => m.content)
      .map(m => `${m.role === "user" ? "Guest" : "crowdloop"}: ${m.content}`)
      .join("\n");

    const eventList = events?.length
      ? `\n\nVenue calendar events:\n${events.map((e, i) => `${i}. ${e.title} — ${e.detail}`).join("\n")}`
      : "";

    // Extract structured profile + display pairs + venue suggestions
    const claudeRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: PROFILE_SYSTEM,
      messages: [{ role: "user", content: `${transcript}${eventList}` }],
    });

    const raw = claudeRes.content[0].type === "text" ? claudeRes.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};

    const preferences: { label: string; value: string }[] = Array.isArray(parsed.display) ? parsed.display : [];
    const suggested: number[] = Array.isArray(parsed.suggested) ? parsed.suggested : [];
    const profile: PreferenceProfile = parsed.profile ?? {};

    // Persist profile to Supabase (fire-and-forget)
    const phoneKey = phone ?? "demo";
    if (profile && Object.keys(profile).length > 0) {
      supabase.from("user_profiles").upsert({
        phone_number: phoneKey,
        genre_affinities: profile.genre_affinities ?? null,
        home_area: profile.home_area ?? null,
        work_area: profile.work_area ?? null,
        preferred_towns: profile.preferred_towns ?? null,
        max_travel: profile.max_travel ?? null,
        prefers_evenings: profile.prefers_evenings ?? null,
        prefers_weekends: profile.prefers_weekends ?? null,
        prefers_weekdays: profile.prefers_weekdays ?? null,
        late_night_ok: profile.late_night_ok ?? null,
        social_mode: profile.social_mode ?? null,
        has_kids: profile.has_kids ?? null,
        budget_signal: profile.budget_signal ?? null,
        venue_size_pref: profile.venue_size_pref ?? null,
        indoor_outdoor_pref: profile.indoor_outdoor_pref ?? null,
        seated_standing_pref: profile.seated_standing_pref ?? null,
        mentioned_artists: profile.mentioned_artists ?? null,
        mentioned_venues: profile.mentioned_venues ?? null,
        inferred_interests: profile.inferred_interests ?? null,
        profile_confidence: profile.profile_confidence ?? 0,
        raw_profile: profile,
        last_active: new Date().toISOString(),
      }, { onConflict: "phone_number" }).then(({ error }) => {
        if (error) console.error("[PROFILE UPSERT]", error.message);
      });
    }

    // pgvector event matching if there's enough signal
    let matchedEvents: MatchedEvent[] = [];
    if (useSupabase && profile.profile_confidence && profile.profile_confidence > 0.1) {
      try {
        const queryText = profileToQueryText(profile);
        const embRes = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: queryText,
        });
        const embedding = embRes.data[0].embedding;

        const { data, error } = await supabase.rpc("match_events", {
          query_embedding: embedding,
          phone: phoneKey,
          match_count: 5,
        });

        if (error) {
          console.error("[MATCH_EVENTS]", error.message);
        } else {
          matchedEvents = (data ?? []) as MatchedEvent[];
        }
      } catch (e) {
        console.error("[EMBED ERR]", e);
      }
    }

    console.log("[PREFS]", JSON.stringify({ preferences: preferences.length, suggested, confidence: profile.profile_confidence, matchedEvents: matchedEvents.length }));
    return NextResponse.json({ preferences, suggested, profile, matchedEvents });

  } catch (e) {
    console.error("[PREFS ERR]", e);
    return NextResponse.json({ preferences: [], suggested: [] });
  }
}
