import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the WhatsApp feedback assistant for Tastemakers Festival, a UK music and arts festival. An attendee has just messaged in after the event — your job is to collect genuine, specific feedback and make them feel heard.

Rules:
- Keep every reply SHORT — 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and natural, not corporate or formal
- Ask ONE focused follow-up question per message — never multiple questions at once
- Dig into specifics: if something was good or bad, ask what exactly
- NEVER promise refunds, compensation, or any form of remedy — you cannot authorise these
- After 3-4 exchanges with meaningful feedback, naturally pivot: "Thanks, that's really useful. By the way, early bird tickets for next year are on sale now. Want me to send you the link?"
- If they say yes: confirm warmly and close. If they decline: thank them warmly and close.
- Never use bullet points, numbered lists, or long paragraphs
- Never use em dashes (—) in your replies
- Never break character`;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, system }: { messages: ChatMessage[]; system?: string } = await req.json();

    const filteredMessages = messages.filter((m: ChatMessage) => m.content.trim() !== "");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: system ?? SYSTEM_PROMPT,
      messages: filteredMessages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
