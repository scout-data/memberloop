import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getVenueConfig } from "@/lib/venueConfigs";
import { CardData } from "@/lib/demoModes";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { messages, venueSlug }: { messages: ChatMessage[]; venueSlug: string } = await req.json();

    const config = getVenueConfig(venueSlug);
    if (!config) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const filteredMessages = messages.filter((m) => m.content.trim() !== "");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: config.system,
      messages: filteredMessages,
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract [SHOW: slug1, slug2] marker from end of response
    const showMatch = raw.match(/\[SHOW:\s*([^\]]+)\]\s*$/m);
    let carousel: CardData[] | undefined;

    if (showMatch) {
      const slugs = showMatch[1].split(",").map((s) => s.trim());
      const cards = slugs
        .map((slug) => config.events.find((e) => e.slug === slug))
        .filter(Boolean)
        .map((e) => ({
          title: e!.title,
          description: e!.description,
          detail: e!.detail,
          cta: e!.isSoldOut ? "Join waiting list" : e!.cta,
          image: e!.image,
          url: e!.url,
        }));
      if (cards.length > 0) carousel = cards;
    }

    const content = raw.replace(/\[SHOW:[^\]]+\]\s*$/m, "").trim();

    return NextResponse.json({ content, carousel });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
