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
    logoUrl: "https://bcasfbrjxhokxszafiaj.supabase.co/storage/v1/object/public/venue-images/ronnie-scotts.jpg",
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

UPCOMING MAIN SHOWS:
- slug: tuba-skinny | Tuba Skinny | Main Show | Jul 2026 | SOLD OUT | World-class interpreters of traditional New Orleans jazz, ragtime, and spirituals.
- slug: eliane-elias | Eliane Elias | Main Show | Wed 15 – Thu 16 Jul 2026 | £55–£75 | Brazilian jazz piano and vocal legend, performing with Marc Johnson on bass and Rafael Barata on drums.
- slug: kenny-garrett | Kenny Garrett and Sounds From The Ancestors | Main Show | Fri 17 – Sun 19 Jul 2026 | £55–£70 | Renowned American saxophonist with a high-energy post-bop and spiritual jazz experience.
- slug: say-she-she | Say She She | Main Show | Mon 20 Jul 2026 | SOLD OUT | NYC punk-chic, discodelic trio with irresistible grooves and gorgeous three-part harmonies.
- slug: isaiah-collier | Isaiah Collier: Collier Plays Coltrane | Main Show | Tue 21 Jul 2026 | £40–£55 | One of the most compelling saxophonists of his generation. A centenary celebration of John Coltrane.
- slug: mica-paris | Mica Paris | Main Show | Wed 22 – Wed 29 Jul 2026 | SOLD OUT | £55–£75 | Soul and R&B legend.
- slug: binker-golding | Binker Golding | Main Show | Thu 23 Jul 2026 | £35–£55 | Ivor Novello-nominated saxophonist, one of the most important voices in UK jazz.
- slug: carmen-lundy | Carmen Lundy | Main Show | Fri 24 – Sat 25 Jul 2026 | £40–£65 | One of jazz's great vocalists, accompanied by Andrew Renfroe on guitar and Julius Rodriguez on piano.

UPCOMING UPSTAIRS AT RONNIE'S:
- slug: dana-masters | Dana Masters | Upstairs at Ronnie's | Tue 14 Jul 2026 | £25–£35 | Soul and jazz singer-songwriter. Raised in the deep south USA. Backed by Cian Boylan on piano and Freddie Gavita on trumpet.
- slug: georgia-cecile | Georgia Cécile and Jamie Safir Trio | Upstairs at Ronnie's | Wed 15 Jul – Wed 23 Sept 2026 | £30–£45 | Award-winning vocalist in the club's Vocal Jazz Series.
- slug: sharlene-hector | Sharlene Hector | Upstairs at Ronnie's | Thu 16 Jul 2026 | £25–£35 | One of the UK's top soul, R&B and pop vocalists, known for being a lead vocalist for Basement Jaxx.
- slug: vula | Vula | Upstairs at Ronnie's | Fri 17 Jul 2026 | SOLD OUT | One of the UK's most iconic vocalists, hailed for her powerful voice and electrifying performances.
- slug: asa-martinson | Asa Martinson and The Outlet | Upstairs at Ronnie's | Fri 17 Jul 2026 | SOLD OUT | London-based jazz fusion collective blending R&B, Afrobeat and contemporary jazz.
- slug: donovan-haffner | Donovan Haffner | Upstairs at Ronnie's | Sat 18 Jul 2026 | £25–£35 | Breakthrough Act of the Year at the 2026 Jazz FM Awards.
- slug: buena-vista-live | Buena Vista Live | Upstairs at Ronnie's | Sun 19 Jul – Sun 20 Sept 2026 | Son, bolero, danzón and cha-cha-cha from some of the finest Cuban musicians in the UK.

RECURRING LATE LATE SHOWS (after midnight, tickets usually £10 or door):
- slug: ronnie-scotts-jazz-jam | Ronnie Scott's Jazz Jam | Nightly 11:15pm | £10 (£6 students) | Mon 13 Jul – Mon 9 Nov 2026 | London's top jazz instrumentalists jamming bebop and hardbop.
- Late Late Show with Vula and Friends | Thu nights | Aug 13 – Nov 12 2026 | Soul and RnB.
- Vocal Jazz Jam | Wed nights Upstairs | Jul 15 – Sep 30 2026 | First-ever vocal jazz jam at Ronnie's.
- Mark Kavuma's Banger Factory | Wed nights | Jul 15 – Dec 2 2026 | London jazz scene hero, Jazz FM Instrumentalist of the Year.
- Viva Cuba Late Show | Fri nights Upstairs | Jul 17 – Sep 25 2026 | Live Cuban music.
- N22 (Tenderlonious) | Sat nights Upstairs | Jul 18 – Oct 17 2026 | New project from 22a collaborators.
- The Bricklayers | Tue nights Upstairs | Jul 21 – Sep 22 2026 | Deep improvisation, hard bop, soul and fusion.
- Cosmic Fusion | Thu nights Upstairs | Jul 23 – Dec 17 2026
- Patterns | Thu nights | Jul 23 – Oct 15 2026

RULES:
- Keep every reply to 1 to 2 sentences max, exactly like a real WhatsApp message
- Be warm and knowledgeable about jazz, never corporate, never slangy — no "mate", "hey", "awesome", "no worries" or similar
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
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/982676/RS_JazzJam_01_2024-10-31-165935_wicl.webp",
      },
      {
        slug: "tuba-skinny",
        title: "Tuba Skinny",
        description: "World-class interpreters of traditional New Orleans jazz, ragtime and spirituals.",
        detail: "Jul 2026 · Main Show · Sold out",
        showType: "Main Show",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/tuba-skinny",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/1906528/TubaSkinny2026.webp",
        isSoldOut: true,
      },
      {
        slug: "dana-masters",
        title: "Dana Masters",
        description: "Soul and jazz from the deep south of the USA. Backed by a world-class trio.",
        detail: "Tue 14 Jul · Upstairs at Ronnie's · £25–£35",
        showType: "Upstairs at Ronnie's",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/dana-masters",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/1678747/Dana-Masters-US26.webp",
      },
      {
        slug: "eliane-elias",
        title: "Eliane Elias",
        description: "Brazilian jazz piano and vocal legend with Marc Johnson and Rafael Barata.",
        detail: "Wed 15 – Thu 16 Jul · Main Show · £55–£75",
        showType: "Main Show",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/eliane-elias",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/900910/Eliane-Elias-25.webp",
      },
      {
        slug: "georgia-cecile",
        title: "Georgia Cécile and Jamie Safir Trio",
        description: "Award-winning vocalist in the club's Vocal Jazz Series. Every Wednesday.",
        detail: "Wed nights · Upstairs at Ronnie's · £30–£45",
        showType: "Upstairs at Ronnie's",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/georgia-cecile-2",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/1866490/Georgia-Cecile-Jamie-Safir-American-Songbook-UPS-26-1920x960px_2025-11-25-175756_jntk.webp",
      },
      {
        slug: "sharlene-hector",
        title: "Sharlene Hector",
        description: "One of the UK's top soul vocalists. Known for Basement Jaxx.",
        detail: "Thu 16 Jul · Upstairs at Ronnie's · £25–£35",
        showType: "Upstairs at Ronnie's",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/sharlene-hector",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/1679083/SHARLENE-HECTOR-US26_2025-09-16-144621_eftn.webp",
      },
      {
        slug: "kenny-garrett",
        title: "Kenny Garrett and Sounds From The Ancestors",
        description: "Renowned American saxophonist with high-energy post-bop and spiritual jazz.",
        detail: "Fri 17 – Sun 19 Jul · Main Show · £55–£70",
        showType: "Main Show",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/kenny-garrett-and-sounds-from-the-ancestors",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/2197525/Kenny-Garrett-1920x960px.webp",
      },
      {
        slug: "vula",
        title: "Vula",
        description: "One of the UK's most iconic vocalists. A powerful, electrifying performance.",
        detail: "Fri 17 Jul · Upstairs at Ronnie's · Sold out",
        showType: "Upstairs at Ronnie's",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/vula-2",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/1680849/Vula-Malinga-US26.webp",
        isSoldOut: true,
      },
      {
        slug: "donovan-haffner",
        title: "Donovan Haffner",
        description: "Breakthrough Act of the Year at the 2026 Jazz FM Awards.",
        detail: "Sat 18 Jul · Upstairs at Ronnie's · £25–£35",
        showType: "Upstairs at Ronnie's",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/donovan-haffner",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/2252146/Donovan-Haffner-1920x960px.webp",
      },
      {
        slug: "say-she-she",
        title: "Say She She",
        description: "NYC punk-chic, discodelic trio. Irresistible grooves and three-part harmonies.",
        detail: "Mon 20 Jul · Main Show · Sold out",
        showType: "Main Show",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/say-she-she",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/2285976/Say-She-She-2-1920x960px.webp",
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
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/2364400/Isaiah-Collier-1920x960px.webp",
      },
      {
        slug: "mica-paris",
        title: "Mica Paris",
        description: "Soul and R&B legend. A landmark run at Ronnie Scott's.",
        detail: "Wed 22 – Wed 29 Jul · Main Show · Sold out",
        showType: "Main Show",
        cta: "Join waiting list",
        url: "https://www.ronniescotts.co.uk/find-a-show/mica-paris",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/902498/Mica-Paris-25.webp",
        isSoldOut: true,
      },
      {
        slug: "binker-golding",
        title: "Binker Golding",
        description: "Ivor Novello-nominated saxophonist. One of the most important voices in UK jazz.",
        detail: "Thu 23 Jul · Main Show · £35–£55",
        showType: "Main Show",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/binker-golding",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/2544642/Binker-Golding-26-1920x960px.webp",
      },
      {
        slug: "carmen-lundy",
        title: "Carmen Lundy",
        description: "One of jazz's great vocalists. Accompanied by Andrew Renfroe and Julius Rodriguez.",
        detail: "Fri 24 – Sat 25 Jul · Main Show · £40–£65",
        showType: "Main Show",
        cta: "Book now",
        url: "https://www.ronniescotts.co.uk/find-a-show/carmen-lundy",
        image: "https://cdn.ronniescotts.co.uk/uploads/_listing_image/726165/carmen-lundy24.webp",
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
