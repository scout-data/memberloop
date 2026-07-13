/**
 * scan-watched-urls.mjs
 * Daily scan of watched URLs. Hashes the raw scraped markdown for reliable
 * change detection, then uses Claude to extract events and build a diff message.
 *
 * Usage:
 *   node --env-file=.env.local scripts/scan-watched-urls.mjs
 *
 * First run: sends "here's what's currently on" as baseline.
 * Subsequent runs: only messages when the raw page content changes.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import ws from "ws";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ─── Firecrawl ────────────────────────────────────────────────────────────────

async function scrapeUrl(url) {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${body}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(`Firecrawl error: ${JSON.stringify(json)}`);
  return json.data?.markdown ?? "";
}

// ─── Hash raw markdown (stable, deterministic) ────────────────────────────────

function hashMarkdown(markdown) {
  // Strip dynamic metadata that changes on every scrape (dates, timestamps in headers)
  const stable = markdown
    .replace(/\d{1,2}(st|nd|rd|th)?\s+\w+\s+\d{4}/gi, "DATE") // e.g. "13th July 2026"
    .replace(/\d{4}-\d{2}-\d{2}/g, "DATE");
  return createHash("sha256").update(stable).digest("hex");
}

// ─── Claude event extraction ──────────────────────────────────────────────────

async function extractEvents(markdown, label) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are extracting upcoming events from a venue website.

Below is the scraped content of ${label}'s website. Extract ONLY upcoming events — things with a specific date, time, or booking. Ignore regular opening hours, menus, and general information.

For each event write one line in this exact format:
DATE | NAME | DETAILS

If there are no upcoming events, respond with exactly: NO_EVENTS

Do not add any preamble or explanation.

---
${markdown.slice(0, 20000)}`,
      },
    ],
  });

  return msg.content[0]?.text?.trim() ?? "NO_EVENTS";
}

// ─── WhatsApp text message ────────────────────────────────────────────────────

async function sendWhatsApp(to, body) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  const resBody = await res.json().catch(() => null);
  if (!res.ok || resBody?.error) {
    console.error("[WA ERR]", res.status, JSON.stringify(resBody));
  } else {
    console.log(`[WA SENT] → ${to}`);
  }
}

// ─── Claude diff message ──────────────────────────────────────────────────────

async function buildDiffMessage(label, oldEvents, newEvents) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a helpful assistant sending a WhatsApp update about a venue's events.

The venue is: ${label}

PREVIOUS events:
${oldEvents}

NEW events:
${newEvents}

Write a short, friendly WhatsApp message (2-4 sentences) describing what's changed — new events added, events removed, or details updated. Be specific. Don't say "I" — write as a notification. Start with the venue name.`,
      },
    ],
  });

  return msg.content[0]?.text?.trim() ?? `Update from ${label}: events have changed.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const { data: rows, error } = await supabase
    .from("watched_urls")
    .select("*");

  if (error) throw new Error(`Supabase fetch: ${error.message}`);
  if (!rows?.length) {
    console.log("No watched URLs found.");
    return;
  }

  console.log(`Scanning ${rows.length} URL(s)...`);

  for (const row of rows) {
    console.log(`\n→ ${row.label} (${row.url})`);

    try {
      const markdown = await scrapeUrl(row.url);
      const newHash = hashMarkdown(markdown);

      console.log(`  Hash: ${newHash.slice(0, 12)}… (prev: ${(row.last_hash ?? "none").slice(0, 12)}…)`);

      const now = new Date().toISOString();
      let messageBody = null;

      if (!row.last_hash) {
        // First run — extract events and send baseline
        const eventsText = await extractEvents(markdown, row.label);
        console.log(`  Events extracted: ${eventsText === "NO_EVENTS" ? "none" : eventsText.split("\n").length + " line(s)"}`);

        if (eventsText !== "NO_EVENTS") {
          messageBody = `Here's what's currently on at ${row.label}:\n\n${eventsText}`;
        } else {
          messageBody = `I've started watching ${row.label} for events. Nothing specific is listed right now — I'll let you know as soon as something new appears.`;
        }

        await supabase.from("watched_urls").update({
          last_events_text: eventsText,
          last_hash: newHash,
          last_checked: now,
          last_changed: now,
        }).eq("id", row.id);

      } else if (newHash !== row.last_hash) {
        // Page changed — extract new events and build diff
        const newEvents = await extractEvents(markdown, row.label);
        console.log(`  Change detected. New events: ${newEvents === "NO_EVENTS" ? "none" : newEvents.split("\n").length + " line(s)"}`);

        messageBody = await buildDiffMessage(row.label, row.last_events_text ?? "none", newEvents);

        await supabase.from("watched_urls").update({
          last_events_text: newEvents,
          last_hash: newHash,
          last_checked: now,
          last_changed: now,
        }).eq("id", row.id);

      } else {
        console.log("  No change.");
        await supabase.from("watched_urls").update({ last_checked: now }).eq("id", row.id);
      }

      if (messageBody) {
        await sendWhatsApp(row.phone_number, messageBody);
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  console.log("\nDone.");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
