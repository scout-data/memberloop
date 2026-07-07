import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const SYSTEM_PROMPT = `You are the WhatsApp feedback assistant for Tastemakers Festival, a UK music and arts festival. An attendee has just messaged in after the event. Your job is to collect genuine feedback and make them feel heard.

Rules:
- Keep every reply SHORT — 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and natural, not corporate or formal
- Ask ONE focused follow-up question per message — never multiple at once
- Dig into specifics: if something was good or bad, ask what exactly
- NEVER promise refunds, compensation, or any form of remedy — you cannot authorise these
- NEVER say you will "sort", "process", "escalate", or "fix" anything
- If someone asks for a refund or compensation: acknowledge warmly, collect the details, say "I'll make sure the team sees this and someone will be in touch" — nothing more
- After 3-4 exchanges with meaningful feedback, naturally pivot: "Thanks, that's really useful. By the way, early bird tickets for next year are on sale now. Want me to send you the link?"
- If they say yes: send the link (https://crowdloop.co) and close warmly. If they decline: thank them and close warmly.
- Never use bullet points, numbered lists, or long paragraphs
- Never break character`;

const GREETING = "Hi! Thanks for coming to Tastemakers Festival. Hope you had an amazing time — we'd love to hear how it was for you. What was the highlight?";

// Per-number conversation history (resets on server restart — fine for demo)
type Message = { role: "user" | "assistant"; content: string };
const conversations = new Map<string, Message[]>();

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

    // Build history — send greeting on first contact
    const isNew = !conversations.has(from);
    if (isNew) {
      conversations.set(from, [{ role: "assistant", content: GREETING }]);
      await sendWhatsApp(from, GREETING);
    }

    const history = conversations.get(from)!;
    history.push({ role: "user", content: text });

    // Call Claude
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    history.push({ role: "assistant", content: reply });

    // Cap history at 30 messages
    if (history.length > 30) conversations.set(from, history.slice(-30));

    await sendWhatsApp(from, reply);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    // Always return 200 to Meta — otherwise it retries endlessly
    return NextResponse.json({ ok: true });
  }
}

// ─── Send via WhatsApp Cloud API ──────────────────────────────────────────────

async function sendWhatsApp(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
}
