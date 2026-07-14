import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Client } from "pg";
import { NextRequest, NextResponse } from "next/server";
import { getVenueConfig } from "@/lib/venueConfigs";
import { CardData } from "@/lib/demoModes";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Venues that have documents ingested into venue_documents
const RAG_VENUES = new Set(["jockey-club"]);

async function retrieveVenueContext(venueSlug: string, userMessage: string): Promise<string> {
  if (!RAG_VENUES.has(venueSlug) || !process.env.POSTGRES_URL) return "";
  try {
    const embRes   = await openai.embeddings.create({ model: "text-embedding-3-small", input: userMessage });
    const embStr   = `[${embRes.data[0].embedding.join(",")}]`;

    const u  = new URL(process.env.POSTGRES_URL);
    const pg = new Client({
      host:     u.hostname,
      port:     parseInt(u.port) || 5432,
      database: u.pathname.replace(/^\//, ""),
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl:      { rejectUnauthorized: false },
    });
    await pg.connect();
    try {
      const res = await pg.query(
        `SELECT content FROM public.venue_documents WHERE venue_slug = $1 ORDER BY embedding <=> $2::vector LIMIT 5`,
        [venueSlug, embStr]
      );
      if (!res.rows.length) return "";
      return "\n\nRELEVANT KNOWLEDGE BASE (use this to answer accurately):\n" +
        res.rows.map((r: { content: string }) => r.content).join("\n\n---\n\n");
    } finally {
      await pg.end();
    }
  } catch (e) {
    console.error("[venue-chat] RAG retrieval failed:", e);
    return "";
  }
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Heavy rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

async function fetchKiaOvalWeather(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.4816&longitude=-0.1165&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&forecast_days=7&timezone=Europe%2FLondon",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max, weathercode } = data.daily;
    const lines: string[] = [];
    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      const label = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      const desc = WMO_DESCRIPTIONS[weathercode[i]] ?? "Variable";
      const rainChance = precipitation_probability_max[i];
      const maxT = Math.round(temperature_2m_max[i]);
      const minT = Math.round(temperature_2m_min[i]);
      const playRisk = rainChance >= 60 ? " — RAIN RISK, play may be affected" : rainChance >= 30 ? " — some rain possible" : "";
      lines.push(`- ${label}: ${desc}, ${minT}–${maxT}°C, ${rainChance}% rain chance${playRisk}`);
    }
    return `\n\nLIVE WEATHER FORECAST FOR THE KIA OVAL (SE11):\n${lines.join("\n")}\nSource: Open-Meteo. Use this to answer questions about whether play is likely to be affected by rain.`;
  } catch {
    return "";
  }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { messages, venueSlug }: { messages: ChatMessage[]; venueSlug: string } = await req.json();

    const config = getVenueConfig(venueSlug);
    if (!config) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Anthropic requires messages to start with user and alternate roles.
    // Drop leading assistant messages and collapse consecutive same-role messages.
    const normalized: ChatMessage[] = [];
    for (const m of messages) {
      if (!m.content.trim()) continue;
      if (normalized.length === 0 && m.role === "assistant") continue;
      const last = normalized[normalized.length - 1];
      if (last && last.role === m.role) {
        last.content += "\n" + m.content;
      } else {
        normalized.push({ ...m });
      }
    }
    const filteredMessages = normalized;

    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const weatherContext = venueSlug === "kia-oval" ? await fetchKiaOvalWeather() : "";
    const lastUserMsg    = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const ragContext     = await retrieveVenueContext(venueSlug, lastUserMsg);
    const systemWithDate = `TODAY'S DATE: ${today}${weatherContext}${ragContext}\n\n${config.system}`;

    // Notify on first user message (fire-and-forget)
    const isFirstMessage = messages.filter(m => m.role === "user").length === 1;
    if (isFirstMessage && process.env.RESEND_API_KEY) {
      const firstUserMsg = messages.find(m => m.role === "user")?.content ?? "";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Memberloop <notifications@memberloop.io>",
          to: ["ben@crowdloop.co"],
          subject: `New demo session: ${config.name}`,
          html: `<p><strong>Venue:</strong> ${config.name}</p><p><strong>First message:</strong> ${firstUserMsg}</p><p><strong>Time:</strong> ${new Date().toISOString()}</p>`,
        }),
      }).catch(() => { /* silent fail */ });
    }

    console.log("[venue-chat] sending to Claude:", JSON.stringify(filteredMessages));
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemWithDate,
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
    console.error("[venue-chat] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to get response", detail: message }, { status: 500 });
  }
}
