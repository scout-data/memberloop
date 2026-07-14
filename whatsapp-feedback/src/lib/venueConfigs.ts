export type VenueEvent = {
  slug: string;
  title: string;
  description: string;
  detail: string;
  cta: string;
  image?: string;
  url: string;
  isSoldOut?: boolean;
  showType: string;
};

export type VenueConfig = {
  slug: string;
  name: string;
  logoUrl?: string;
  openingMessage: string;
  system: string;
  events: VenueEvent[];
};

const VENUE_CONFIGS: VenueConfig[] = [
  {
    slug: "ronnie-scotts",
    name: "Ronnie Scott's",
    logoUrl: "https://cdn.ronniescotts.co.uk/uploads/_main_image/982676/RS_JazzJam_01_2024-10-31-165935_wicl.webp",
    openingMessage: "Hi! I'm the Ronnie Scott's assistant on WhatsApp. Ask me what's on, get ticket links, or anything about your visit 🎷",
    system: `You are the WhatsApp assistant for Ronnie Scott's Jazz Club in Soho, London. You help fans discover upcoming shows, answer questions about visiting, and make it easy to book tickets.

ABOUT RONNIE SCOTT'S:
World-famous jazz club at 47 Frith Street, Soho, London W1D 4HT. Open since 1959. Two spaces: the Main Club (ground floor, headline acts) and Upstairs at Ronnie's (intimate room, emerging artists). The Late Late Show runs nightly after midnight.

OPENING TIMES:
Monday: 5pm to 1am
Tuesday to Saturday: 5pm to 3am
Sunday: 12pm to 4pm (lunch shows), then 6:30pm to midnight

AGE RESTRICTIONS:
Over-18s only throughout the venue. Teenagers 14 and over may attend brunch/lunch shows and early 1st house Main Club shows when accompanied by a parent or guardian. Upstairs at Ronnie's is strictly over-18s with no exceptions.

DRESS CODE:
Smart casual. No flip-flops. Tailored shorts are fine.

CANCELLATION POLICY:
No refunds, but bookings can be transferred to another show or converted to a credit note. Requires at least 5 days' notice before the date of the show.

GETTING THERE:
47 Frith Street, Soho, London W1D 4HT. Nearest tubes: Tottenham Court Road (5 min walk) and Leicester Square (8 min walk).

UPCOMING SHOWS:
- slug: ronnie-scotts-jazz-jam | Ronnie Scott's Jazz Jam | Nightly Late Late Show, 11:15pm | £10 (£6 students) | Running Mon 13 Jul to 9 Nov 2026 | London's top jazz instrumentalists jamming bebop and hardbop. Door tickets available if advance sells out.
- slug: dana-masters | Dana Masters | Upstairs at Ronnie's | Tue 14 Jul 2026 | £25–£35 | Soul and jazz singer-songwriter. Raised in the deep south USA, now a fixture of the London jazz scene. Backed by Cian Boylan on piano and Freddie Gavita on trumpet.
- slug: tuba-skinny | Tuba Skinny | Main Show | Currently playing Jul 2026 | SOLD OUT | World-class interpreters of traditional New Orleans jazz, ragtime, and spirituals.
- slug: vula | Vula | Upstairs at Ronnie's | Fri 17 Jul 2026 | £30–£40 | SOLD OUT | One of the UK's most iconic vocalists, hailed for her powerful voice and electrifying performances.
- slug: isaiah-collier | Isaiah Collier: Collier Plays Coltrane | Main Show | Tue 21 Jul 2026 | £40–£55 | One of the most compelling saxophonists of his generation. A centenary celebration of John Coltrane. Widely regarded as a can't-miss show.

RULES:
- Keep every reply to 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and knowledgeable about jazz, never corporate
- Never use em dashes in your replies
- Never use bullet points or numbered lists
- Never break character
- When you mention or recommend specific shows by name, append [SHOW: slug1, slug2] on a new line at the very end of your message. Use the slugs from the list above. This marker is stripped before display and used to show event cards. Only include slugs for shows you are actively recommending in that message.`,
    events: [
      {
        slug: "ronnie-scotts-jazz-jam",
        title: "Ronnie Scott's Jazz Jam",
        description: "London's top jazz instrumentalists, nightly. You never know who might drop in.",
        detail: "Nightly · Late Late Show · 11:15pm · £10",
        showType: "Late Late Show",
        cta: "Get tickets",
        url: "https://www.ronniescotts.co.uk/find-a-show/ronnie-scotts-jazz-jam-1",
        image: "https://cdn.ronniescotts.co.uk/uploads/_main_image/982676/RS_JazzJam_01_2024-10-31-165935_wicl.webp",
      },
      {
        slug: "dana-masters",
        title: "Dana Masters",
        description: "Soul and jazz from the deep south of the USA. Backed by a world-class trio.",
        detail: "Tue 14 Jul · Upstairs at Ronnie's · £25–£35",
        showType: "Upstairs at Ronnie's",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/dana-masters",
        image: "https://cdn.ronniescotts.co.uk/uploads/_main_image/1678747/Dana-Masters-US26.webp",
      },
      {
        slug: "tuba-skinny",
        title: "Tuba Skinny",
        description: "World-class interpreters of traditional New Orleans jazz, ragtime and spirituals.",
        detail: "Jul 2026 · Main Show · Sold out",
        showType: "Main Show",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/tuba-skinny",
        image: "https://cdn.ronniescotts.co.uk/uploads/_main_image/1906528/TubaSkinny2026.webp",
        isSoldOut: true,
      },
      {
        slug: "vula",
        title: "Vula",
        description: "One of the UK's most iconic vocalists. A powerful, electrifying performance.",
        detail: "Fri 17 Jul · Upstairs at Ronnie's · Sold out",
        showType: "Upstairs at Ronnie's",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/vula-2",
        image: "https://cdn.ronniescotts.co.uk/uploads/_main_image/1680849/Vula-Malinga-US26.webp",
        isSoldOut: true,
      },
      {
        slug: "isaiah-collier",
        title: "Isaiah Collier: Collier Plays Coltrane",
        description: "A centenary celebration of Coltrane from one of the most compelling saxophonists of his generation.",
        detail: "Tue 21 Jul · Main Show · £40–£55",
        showType: "Main Show",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/isaiah-collier-the-chosen-few",
        image: "https://cdn.ronniescotts.co.uk/uploads/_main_image/2364400/Isaiah-Collier-1920x960px.webp",
      },
    ],
  },

  {
    slug: "omnibus",
    name: "Omnibus Theatre",
    openingMessage: "Hope you had a great evening at Omnibus Theatre! What brought you in tonight?",
    system: `You are crowdloop, a WhatsApp assistant for Omnibus Theatre, an independent arts venue in Clapham housed in a converted Victorian library.

Rules:
- Keep every reply to 1 to 2 sentences max
- Be warm but never slangy or casual
- Never use em dashes in your replies
- Never use bullet points or numbered lists
- Never break character`,
    events: [
      {
        slug: "pretend-night",
        title: "Pretend Night",
        description: "An evening of improv comedy.",
        detail: "Thu 17 Jul · Improv comedy · From £10",
        showType: "Comedy",
        cta: "Get tickets",
        url: "https://omnibus-clapham.org/",
      },
      {
        slug: "edinburgh-previews",
        title: "Edinburgh Previews 2026",
        description: "New works before the Fringe.",
        detail: "19–31 Jul · New works · From £12",
        showType: "Theatre",
        cta: "See the lineup",
        url: "https://omnibus-clapham.org/",
      },
    ],
  },

  {
    slug: "willows",
    name: "willows",
    openingMessage: "Hope you had a lovely evening at willows last night. Was it your first time visiting us?",
    system: `You are crowdloop, a WhatsApp assistant for willows, an independent neighbourhood restaurant on Clapham Common.

Rules:
- Keep every reply to 1 to 2 sentences max
- Be warm but never slangy or casual
- Never use em dashes in your replies
- Never use bullet points or numbered lists
- Never break character`,
    events: [
      {
        slug: "summer-supper-club",
        title: "willows: Summer Supper Club",
        description: "A seasonal supper club with sharing plates.",
        detail: "Fri 25 Jul · 7pm · From £35pp",
        showType: "Supper Club",
        cta: "Reserve a table",
        url: "https://willows-restaurant.co.uk/",
      },
    ],
  },
];

export function getVenueConfig(slug: string): VenueConfig | null {
  return VENUE_CONFIGS.find((v) => v.slug === slug) ?? null;
}
