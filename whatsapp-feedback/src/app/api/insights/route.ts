import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODE_EXTRACTORS: Record<string, string> = {
  feedback: `You analyze member feedback from a golf club WhatsApp conversation. Extract key themes and a recommended action for the club team. Return ONLY valid JSON, no explanation:
{"mode":"feedback","themes":[{"label":"2-3 word label","sentiment":"positive|negative|neutral"}],"summary":"One sentence summary.","action":"Specific recommended action (e.g. 'Flag to greenkeeper', 'Follow up with member', 'Share with team at next meeting'). Be specific and actionable."}
Rules: max 4 themes prioritised by importance, only themes explicitly mentioned, action must be concrete.`,

  visitor_followup: `You analyze a golf club visitor follow-up WhatsApp conversation. Assess the visitor's likelihood to return and any feedback they gave. Return ONLY valid JSON, no explanation:
{"mode":"visitor_followup","intent":"hot|warm|cold","feedback":"key feedback the visitor mentioned about their round or null","preferences":"stated day/time preferences or null","nextStep":"specific suggested next action for the team (e.g. 'Offer Thursday 9am slot', 'Address slow play concern then offer date') or null","summary":"One sentence summary."}
hot=expressed clear interest in returning, warm=open but noncommittal, cold=unlikely to return.`,

  events: `You analyze a golf club event promotion WhatsApp conversation. Extract the member's response to the event invitation. Return ONLY valid JSON, no explanation:
{"mode":"events","rsvp":"attending|interested|declined|unclear","groupSize":"number as string or null if not mentioned","nameCaptured":true|false,"questions":"any questions the member asked about the event or null","summary":"One sentence summary."}
nameCaptured=true only if the member explicitly gave their name.`,

  renewal: `You analyze a golf club membership renewal WhatsApp conversation. Assess the member's renewal intent. Return ONLY valid JSON, no explanation:
{"mode":"renewal","status":"renewing|undecided|lapsing","membershipType":"Full|Five-day|Social|Unknown","objections":"any objections raised (price, not playing enough, moving away, etc.) or null","summary":"One sentence summary."}
renewing=confirmed they want to renew, undecided=has questions or hesitation, lapsing=indicated they do not want to renew.`,

  society: `You analyze a golf society follow-up WhatsApp conversation. Assess the organiser's satisfaction and likelihood to rebook. Return ONLY valid JSON, no explanation:
{"mode":"society","intent":"hot|warm|cold","feedback":"key feedback the organiser mentioned about the day or null","groupSize":"number as string or null if mentioned","preferredDate":"preferred time of year for rebooking or null","nameCaptured":true|false,"summary":"One sentence summary."}
hot=expressed clear interest in rebooking, warm=open but noncommittal, cold=unlikely to rebook. nameCaptured=true only if the organiser explicitly gave their name.`,

  updates: `You analyze a golf club updates/announcements WhatsApp conversation. Assess how the member engaged with the update. Return ONLY valid JSON, no explanation:
{"mode":"updates","engagement":"engaged|passive","topicsOfInterest":["topic"],"followUpNeeded":true|false,"followUpNote":"what specific follow-up is needed or null","summary":"One sentence summary."}
engaged=asked questions or expressed clear interest in something, passive=acknowledged but no meaningful engagement. topicsOfInterest=specific topics the member asked about or reacted to.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, modeId = "feedback" } = await req.json();

    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    if (userMessages.length === 0) return NextResponse.json({ mode: modeId });

    const systemPrompt = MODE_EXTRACTORS[modeId] ?? MODE_EXTRACTORS.feedback;
    const transcript = messages
      .filter((m: { role: string; content: string }) => m.content.trim() !== "")
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Member" : "Club"}: ${m.content}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: `Conversation:\n${transcript}` }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ mode: modeId });

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...data, mode: modeId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ mode: "feedback" });
  }
}
