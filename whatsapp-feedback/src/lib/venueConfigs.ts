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
    slug: "willows",
    name: "willows",
    openingMessage:
      "Hope you had a lovely evening at willows last night. What did you think — was it your first time visiting us?",
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
        title: "The Landor: Jazz Sessions",
        detail: "Every Thursday · Free entry · Clapham North",
        cta: "Find out more",
      },
    ],
  },
];

export function getVenueConfig(slug: string): VenueConfig | null {
  return VENUE_CONFIGS.find((v) => v.slug === slug) ?? null;
}
