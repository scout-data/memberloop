import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, events } = await req.json() as {
      messages: { role: string; content: string }[];
      events?: { title: string; detail: string }[];
    };

    const userMessages = messages.filter(m => m.role === "user");
    if (!userMessages.length) return NextResponse.json({ preferences: [], eventOrder: [] });

    const transcript = messages
      .filter(m => m.content)
      .map(m => `${m.role === "user" ? "Guest" : "crowdloop"}: ${m.content}`)
      .join("\n");

    const eventList = events?.length
      ? `\n\nVenue calendar events:\n${events.map((e, i) => `${i}. ${e.title} — ${e.detail}`).join("\n")}`
      : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You analyse a guest conversation to extract preferences and identify which events from the venue's calendar are a genuine match for this specific guest.

Return ONLY valid JSON in this exact shape:
{"preferences":[{"label":"...","value":"..."}],"suggested":[0,2]}

For preferences: extract anything useful — what brought them in, food/drink taste, atmosphere, type of events, first visit, how they found the venue. Be liberal: capture any signal. Max 4 items, values 3–8 words.

For suggested: return the indices of calendar events that are a clear match based on what the guest has shared. Only include an event if there is real evidence it suits this person — not just because it exists. Return an empty array if the conversation is too early to make a confident recommendation.

Return empty preferences array only if the guest has shared nothing about themselves.`,
      messages: [{ role: "user", content: `${transcript}${eventList}` }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    const preferences = Array.isArray(parsed.preferences) ? parsed.preferences : [];
    const suggested = Array.isArray(parsed.suggested) ? parsed.suggested : [];
    console.log("[PREFS]", JSON.stringify({ preferences, suggested }));
    return NextResponse.json({ preferences, suggested });
  } catch (e) {
    console.error("[PREFS ERR]", e);
    return NextResponse.json({ preferences: [], eventOrder: [] });
  }
}
