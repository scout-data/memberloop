export type VenueEvent = {
  title: string;
  detail: string;
  cta: string;
  image?: string;
};

export type VenueConfig = {
  slug: string;
  name: string;
  openingMessage: string;
  system: string;
  events: VenueEvent[];
};

const VENUE_CONFIGS: VenueConfig[] = [
  {
    slug: "omnibus",
    name: "Omnibus Theatre",
    openingMessage:
      "Hope you had a great evening at Omnibus Theatre! What brought you in tonight?",
    system: `You are crowdloop, a WhatsApp assistant for Omnibus Theatre, an independent arts venue in Clapham housed in a converted Victorian library. Omnibus runs theatre, comedy, cabaret, improv, live music, jazz nights, and special talks throughout the year. Their café-bar and garden are a big part of the experience.

Your goal is to make the guest feel heard, find out what they came to see and what they enjoyed, and understand what kinds of events they would come back for. After 2 to 3 exchanges, mention upcoming events at Omnibus that match their interests and ask if they would like to be kept in the loop.

Rules:
- Keep every reply to 1 to 2 sentences max
- Be warm but never slangy or casual
- Never use em dashes in your replies
- Never use bullet points or numbered lists
- Never break character`,
    events: [
      {
        title: "Pretend Night",
        detail: "Thu 17 Jul · Improv comedy · From £10",
        cta: "Get tickets",
      },
      {
        title: "Edinburgh Previews 2026",
        detail: "19-31 Jul · New works before the Fringe · From £12",
        cta: "See the lineup",
      },
      {
        title: "Fridaze",
        detail: "Thu 24 Jul · Cabaret night · Emerging artists · From £12",
        cta: "Get tickets",
      },
      {
        title: "Lost the Plot: An Improvised Musical",
        detail: "Fri 25 Jul · All-new improv musical every show · From £15",
        cta: "Book now",
      },
      {
        title: "Clapham Common Jazz Club",
        detail: "Sat 26 Jul · Jazz in the bar and garden · From £10",
        cta: "Reserve a spot",
      },
      {
        title: "In Conversation with Miriam Margolyes",
        detail: "Sun 2 Aug · 7pm · Special one-night talk · From £18",
        cta: "Book tickets",
      },
      {
        title: "Live Music Every Sunday",
        detail: "Every Sunday · Free · Café-bar and garden",
        cta: "Find out more",
      },
      {
        title: "Ivo Graham: Orange Crush (WIP)",
        detail: "Sun 24 Aug · Stand-up work in progress · From £12",
        cta: "Get tickets",
      },
    ],
  },
  {
    slug: "willows",
    name: "willows",
    openingMessage:
      "Hope you had a lovely evening at willows last night. Was it your first time visiting us?",
    system: `You are crowdloop, a WhatsApp assistant for willows, an independent neighbourhood restaurant on Clapham Common serving smörgåsbord-inspired brunch boards and evening small plates. Willows hosts regular events including live music nights, life drawing evenings, and seasonal supper clubs.

Your goal is to make the guest feel heard, learn what they enjoyed (food, atmosphere, live music, a specific event), and understand their preferences. After 2 to 3 exchanges, mention upcoming willows events and ask if they would like to be kept in the loop.

Rules:
- Keep every reply to 1 to 2 sentences max
- Be warm but never slangy or casual
- Never use em dashes in your replies
- Never use bullet points or numbered lists
- Never break character`,
    events: [
      {
        title: "willows: Summer Supper Club",
        detail: "Friday 25 July · 7pm · From £35pp",
        cta: "Reserve a table",
      },
      {
        title: "willows: Life Drawing Night",
        detail: "Thursday 7 Aug · 7pm · From £25",
        cta: "Book now",
      },
      {
        title: "willows: Late Night Sessions",
        detail: "Friday 22 Aug · Live music · From £15",
        cta: "Get tickets",
      },
    ],
  },
];

export function getVenueConfig(slug: string): VenueConfig | null {
  return VENUE_CONFIGS.find((v) => v.slug === slug) ?? null;
}
