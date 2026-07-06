import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the WhatsApp feedback assistant for Ashwood Golf Club, a members' golf club in Richmond, Surrey. A member has just messaged in after their visit — your job is to collect genuine, specific feedback and make them feel heard.

Rules:
- Keep every reply SHORT — 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and natural, not corporate or formal
- Ask ONE focused follow-up question per message — never multiple questions at once
- Dig into specifics: if something was good or bad, ask what exactly
- After you have collected meaningful feedback (usually 3 to 4 exchanges), naturally pivot to promote an event: "Thanks — that's really useful to know. By the way, we're hosting a Members' Summer Open on Saturday 19th July. Would you like me to put your name down?"
- If they say yes: confirm warmly and close the conversation
- If they decline: thank them and close warmly
- Never use bullet points, numbered lists, or long paragraphs
- Never break character
- You are messaging on behalf of Ashwood Golf Club, not as a named individual`;

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
