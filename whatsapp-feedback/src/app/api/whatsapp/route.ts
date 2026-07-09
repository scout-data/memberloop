import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ─── Venue config ─────────────────────────────────────────────────────────────
// Each venue has a list of keywords to match against the user's first message.
// The first message is typically the QR prefill text, but may be rephrased —
// Claude handles flexible interpretation; keywords are just for fast detection.

type VenueConfig = { name: string; keywords: string[] };

const VENUES: VenueConfig[] = [
  { name: "Pear Tree Cafe",  keywords: ["pear tree", "peartree", "pear-tree"] },
  { name: "Oval Space",      keywords: ["oval space", "ovalspace", "oval-space"] },
];

function detectVenue(text: string): VenueConfig | null {
  const lower = text.toLowerCase();
  return VENUES.find(v => v.keywords.some(k => lower.includes(k))) ?? null;
}

function buildSystemPrompt(venueName: string | null): string {
  const venueContext = venueName
    ? `You are assisting someone who has attended an event at ${venueName}. The conversation was started from a ${venueName} QR code.`
    : "You are assisting someone who has attended a live music or events venue.";

  return `You are crowdloop, a WhatsApp assistant that helps music and events fans discover and connect with events they love. ${venueContext}

Your job is to make the attendee feel heard, learn what they love, and keep them connected to future events.

Rules:
- Keep every reply SHORT — 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and conversational, but never use slang, colloquialisms or casual filler words — avoid terms like "rough", "dodgy", "vibe", "mate", "gutted", "brilliant" or similar
- Ask ONE focused follow-up question per message — never multiple at once
- Learn their tastes: what artists they love, what kinds of events, what they want more of
- NEVER promise refunds, compensation, or any form of remedy — you cannot authorise these
- NEVER say you will "sort", "process", "escalate", or "fix" anything
- If someone raises a complaint: acknowledge warmly, note the detail, say "I'll make sure the team sees this"
- After 3-4 exchanges, ask: "Is there anything else you'd like to share?"
- If they are done: thank them and say you'll keep them posted on events they'll love
- Then ask: "Want us to let you know when something comes up that's right for you?"
- If they say yes: confirm warmly and close
- If they say no: thank them warmly and close
- Never use bullet points, numbered lists, or long paragraphs
- Never use em dashes (—) in your replies
- Never break character`;
}

// ─── Per-number state ─────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };
const conversations = new Map<string, Message[]>();
const venueByNumber = new Map<string, string | null>();  // phone → venue name

// Deduplicate Meta webhook deliveries
const processedIds = new Set<string>();

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

    // Only handle text messages
    if (message.type !== "text") return NextResponse.json({ ok: true });

    const from = message.from as string;
    const text = message.text.body as string;

    console.log(`[WA IN]  ${from}: ${text}`);

    // Mark message as read (blue double-tick)
    await markAsRead(message.id);

    // Detect venue on first message from this number
    const isNewConversation = !conversations.has(from);
    if (isNewConversation) {
      const venue = detectVenue(text);
      venueByNumber.set(from, venue?.name ?? null);
      if (venue) console.log(`[WA VENUE] ${from} → ${venue.name}`);
      conversations.set(from, []);
    }

    const venueName = venueByNumber.get(from) ?? null;
    const history = conversations.get(from)!;
    history.push({ role: "user", content: text });

    // Call Claude
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: buildSystemPrompt(venueName),
      messages: history,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    history.push({ role: "assistant", content: reply });

    // Cap history at 30 messages
    if (history.length > 30) conversations.set(from, history.slice(-30));

    console.log(`[WA OUT] ${from}: ${reply}`);

    await sendWhatsApp(from, reply);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[WA ERR]", err);
    // Always return 200 to Meta — otherwise it retries endlessly
    return NextResponse.json({ ok: true });
  }
}

// ─── Send via WhatsApp Cloud API ──────────────────────────────────────────────

async function markAsRead(messageId: string) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

async function sendWhatsApp(to: string, text: string) {
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
    console.error("[WA SEND ERR]", res.status, err);
  }
}
