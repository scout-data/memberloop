#!/usr/bin/env node
/**
 * push-event-digest.mjs
 *
 * Proactive event push for one or all users.
 * Loads their preference profile from Supabase, finds the best upcoming events
 * via pgvector search (excluding already-shown events), generates a short AI
 * message, and sends it via WhatsApp Cloud API.
 *
 * Usage:
 *   node scripts/push-event-digest.mjs                # all users with confidence > 0.2
 *   node scripts/push-event-digest.mjs --phone +447463589130   # one user
 *   node scripts/push-event-digest.mjs --dry-run       # print messages, don't send
 *   node scripts/push-event-digest.mjs --top 3         # recommend N events (default 3)
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import ws from "ws";

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

const openai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun      = args.includes("--dry-run");
const forceSend   = args.includes("--force");
const topN        = parseInt(args[args.indexOf("--top") + 1] ?? "3", 10) || 3;
const singlePhone = args[args.indexOf("--phone") + 1] ?? null;

// ─── Profile → query text ─────────────────────────────────────────────────────

function profileToQueryText(profile) {
  const parts = [];

  if (profile.genre_affinities?.length) {
    const genres = [...profile.genre_affinities]
      .sort((a, b) => b.weight - a.weight)
      .map(g => g.genre)
      .slice(0, 6);
    parts.push(`Music and event genres: ${genres.join(", ")}.`);
  }

  if (profile.mentioned_artists?.length) {
    parts.push(`Enjoys artists: ${profile.mentioned_artists.join(", ")}.`);
  }

  if (profile.inferred_interests?.length) {
    parts.push(`Interests: ${profile.inferred_interests.join(", ")}.`);
  }

  const locationParts = [];
  if (profile.home_area) locationParts.push(`lives in ${profile.home_area}`);
  if (profile.preferred_towns?.length) locationParts.push(`prefers events in ${profile.preferred_towns.join(", ")}`);
  if (locationParts.length) parts.push(`Location: ${locationParts.join(", ")}.`);

  const timingParts = [];
  if (profile.prefers_evenings) timingParts.push("evenings");
  if (profile.prefers_weekends) timingParts.push("weekends");
  if (profile.prefers_weekdays) timingParts.push("weekdays");
  if (timingParts.length) parts.push(`Prefers: ${timingParts.join(" and ")} events.`);

  const venueParts = [];
  if (profile.venue_size_pref) venueParts.push(`${profile.venue_size_pref} venues`);
  if (profile.indoor_outdoor_pref && profile.indoor_outdoor_pref !== "either") venueParts.push(profile.indoor_outdoor_pref);
  if (profile.seated_standing_pref && profile.seated_standing_pref !== "either") venueParts.push(`${profile.seated_standing_pref} events`);
  if (venueParts.length) parts.push(`Venue preference: ${venueParts.join(", ")}.`);

  return parts.join(" ") || "general live events and music";
}

// ─── Embed a query string ─────────────────────────────────────────────────────

async function embed(text) {
  const res = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

// ─── Find best events for a user ──────────────────────────────────────────────

async function findEventsForUser(phone, profile, n) {
  const queryText = profileToQueryText(profile);
  console.log(`  Query: "${queryText.slice(0, 100)}..."`);

  const embedding = await embed(queryText);

  const { data, error } = await supabase.rpc("match_events", {
    query_embedding: embedding,
    phone,
    match_count: n,
  });

  if (error) throw new Error(`match_events RPC failed: ${error.message}`);
  return data ?? [];
}

// ─── Generate AI push message ─────────────────────────────────────────────────

async function generatePushMessage(profile, events) {
  if (!events.length) return null;

  const eventLines = events.map((e, i) => {
    const date = new Date(e.start_time).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short"
    });
    const time = new Date(e.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${i + 1}. ${e.title} at ${e.venue_name} — ${date} at ${time}${e.details_url ? `\n   ${e.details_url}` : ""}`;
  }).join("\n");

  const profileHint = [
    profile.genre_affinities?.slice(0, 3).map(g => g.genre).join(", "),
    profile.home_area,
  ].filter(Boolean).join(", ");

  const res = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 250,
    system: `You are crowdloop, a WhatsApp assistant that surfaces personalised event recommendations.
Write a short WhatsApp message (3-4 sentences max) suggesting the events below to this person.
Be warm and specific — mention what makes each event relevant to their taste. Never use em dashes. No bullet points. No markdown.
End with a line like "Let me know if any of these catch your eye" or similar.`,
    messages: [{
      role: "user",
      content: `User interests: ${profileHint || "live music and events"}\n\nEvents:\n${eventLines}`
    }],
  });

  return res.content[0].type === "text" ? res.content[0].text : null;
}

// ─── Send via WhatsApp Cloud API ──────────────────────────────────────────────

async function sendWhatsApp(to, text) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${err}`);
  }
}

// ─── Log push to Supabase ─────────────────────────────────────────────────────

async function logPush(phone, events, message) {
  // Log to push_log
  await supabase.from("push_log").insert({
    phone_number: phone,
    event_ids: events.map(e => e.id),
    ai_message: message,
    trigger_type: "manual",
  });

  // Log each event to recommendation_log so they won't be shown again
  const rows = events.map(e => ({
    phone_number: phone,
    event_id: e.id,
    push_type: "proactive_push",
  }));
  await supabase.from("recommendation_log").insert(rows);
}

// ─── Process one user ─────────────────────────────────────────────────────────

async function processUser(user) {
  const phone = user.phone_number;
  console.log(`\n[${phone}] confidence=${user.profile_confidence}`);

  const profile = user.raw_profile ?? {};

  let events;
  try {
    events = await findEventsForUser(phone, profile, topN);
  } catch (e) {
    console.error(`  ERROR finding events: ${e.message}`);
    return;
  }

  if (!events.length) {
    console.log("  No matching events found.");
    return;
  }

  console.log(`  Found ${events.length} events:`);
  events.forEach(e => {
    const date = new Date(e.start_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    console.log(`    • ${e.title} @ ${e.venue_name} (${date}) sim=${e.similarity?.toFixed(3)}`);
  });

  const message = await generatePushMessage(profile, events);
  if (!message) {
    console.log("  Failed to generate message.");
    return;
  }

  console.log(`\n  Message:\n  ${message.replace(/\n/g, "\n  ")}`);

  if (dryRun) {
    console.log("  [DRY RUN] Not sending.");
    return;
  }

  try {
    await sendWhatsApp(phone, message);
    await logPush(phone, events, message);
    console.log("  Sent and logged.");
  } catch (e) {
    console.error(`  SEND ERROR: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`crowdloop push digest — ${dryRun ? "DRY RUN" : "LIVE"} — top ${topN} events per user`);

  let users;

  if (singlePhone) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("phone_number", singlePhone)
      .single();

    if (error || !data) {
      if (forceSend) {
        console.log(`No profile found for ${singlePhone} — creating minimal profile for test.`);
        await supabase.from("user_profiles").upsert({
          phone_number: singlePhone,
          profile_confidence: 0.05,
          raw_profile: {},
          last_active: new Date().toISOString(),
        }, { onConflict: "phone_number" });
        users = [{ phone_number: singlePhone, profile_confidence: 0.05, raw_profile: {} }];
      } else {
        console.error(`No profile found for ${singlePhone}. Use --force to send anyway.`);
        process.exit(1);
      }
    } else {
      users = [data];
    }
  } else {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .gte("profile_confidence", forceSend ? 0 : 0.2)
      .order("last_active", { ascending: false });

    if (error) {
      console.error("Failed to load users:", error.message);
      process.exit(1);
    }
    users = data ?? [];
  }

  console.log(`Processing ${users.length} user(s)...`);

  for (const user of users) {
    await processUser(user);
  }

  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
