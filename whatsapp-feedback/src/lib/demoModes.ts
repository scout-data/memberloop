export type CardData    = { title: string; detail: string; description?: string; cta: string; image?: string; url?: string };
export type DemoMessage = { role: "user" | "assistant"; content: string; card?: CardData; carousel?: CardData[] };

export type ScenarioId = "ticket_releases" | "ticket_reminders" | "feedback" | "faqs";

export const SCENARIOS: { id: ScenarioId; label: string; description: string; messages: DemoMessage[] }[] = [
  {
    id: "ticket_releases",
    label: "Ticket releases",
    description: "Notify fans the moment tickets go live and close the sale in the chat.",
    messages: [
      { role: "assistant", content: "Jay-Z tickets just went on sale. You asked to be notified first 👇" },
      { role: "assistant", content: "", card: { title: "Jay-Z · The HOV Tour", detail: "Sat 18 Jul 2026 · Tottenham Hotspur Stadium · From £85", cta: "Get tickets", image: "/hero-crowd.jpg" } },
      { role: "user",      content: "How much for floor standing?" },
      { role: "assistant", content: "Floor from £85, seated from £120. Selling fast — last year sold out in under 2 hours." },
      { role: "user",      content: "I'll take 2 floor please" },
      { role: "assistant", content: "On it. Here's your direct booking link: tottenhamhotspurstadium.com/jay-z" },
    ],
  },
  {
    id: "ticket_reminders",
    label: "Ticket reminders",
    description: "Send event day info directly to fans who have tickets, before they even ask.",
    messages: [
      { role: "assistant", content: "Jay-Z is tomorrow night 🎤 Doors open at 6pm. Here's everything you need." },
      { role: "user",      content: "What time is he on stage?" },
      { role: "assistant", content: "Jay-Z hits the stage at 9pm. Support act from 7:30pm." },
      { role: "user",      content: "Is there parking nearby?" },
      { role: "assistant", content: "Limited on-site parking. Northumberland Park station is a 5-minute walk and the easiest option." },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Collect post-event insights in the chat, while the experience is still fresh.",
    messages: [
      { role: "assistant", content: "Thanks for coming to the NFL game last night. How was it?" },
      { role: "user",      content: "Great atmosphere, loved it" },
      { role: "assistant", content: "Brilliant to hear. Anything we could have done better?" },
      { role: "user",      content: "Food queues near Gate C were really long" },
      { role: "assistant", content: "Noted — I'll flag that to the team. Really glad you enjoyed it. We'll keep you posted on the next game." },
    ],
  },
  {
    id: "faqs",
    label: "FAQs",
    description: "Answer common questions instantly, 24/7, without lifting a finger.",
    messages: [
      { role: "user",      content: "What's the bag policy?" },
      { role: "assistant", content: "Small bags only (A4 size or smaller). No backpacks. No glass bottles, professional cameras or umbrellas." },
      { role: "user",      content: "Can I bring food in?" },
      { role: "assistant", content: "No outside food or drink. Lots of options inside including Boxpark and bars throughout the stadium." },
      { role: "user",      content: "Where's the nearest tube?" },
      { role: "assistant", content: "Northumberland Park is the closest, about a 5-minute walk. Tottenham Hale is nearby with more connections." },
    ],
  },
];
