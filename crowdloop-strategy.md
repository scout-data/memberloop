# crowdloop — Product Strategy

_Last updated: 2026-07-08. Based on founding thinking + notes from Rory (ex-Togather)._

---

## The core insight

Every event creates a moment of genuine audience intent. Someone showed up, paid, stayed until the end. That's the highest-quality signal in the music and live events industry — and it disappears the moment they walk out.

crowdloop captures that moment through WhatsApp and turns it into a durable relationship.

---

## What the product actually is

Feedback is the entry point, not the product.

The product is a fan identity and engagement layer built on top of live events. Over time, crowdloop knows:
- Which events a person attended
- Which artists they responded to
- What they said about their experience
- Whether they bought a ticket to a follow-up event

That data — aggregated across events, venues, and artists — becomes a recommendation and targeting engine more valuable than anything a promoter can build from ticket sales alone.

---

## The web of connections (Rory's insight)

An attendee at a festival with 25 artists becomes a contact who can be targeted based on their specific engagement. "This person gave feedback on this event, where these artists were performing — we can suggest future events where those artists are playing."

This creates value for multiple stakeholders simultaneously:
- **The fan**: receives relevant, personalised suggestions they actually engage with
- **The artist/label**: reaches their community directly, with evidence of intent
- **The promoter**: sells tickets to a pre-qualified audience
- **The venue**: builds a loyal, returning audience

---

## The community thesis

Labels, artists, and promoters are all chasing the same thing: community. High-value productions where everyone's there because they know it'll be worth it. The problem is they have no direct channel to those people after the event.

Email open rates are 20%. Social reach is algorithmic and declining. WhatsApp open rates are 98%.

The pitch to artists and labels: reach your community directly, with personalised suggestions they actually engage with.

---

## Go-to-market: start incredibly small

First customers are not festivals. They are:
- Pubs and bars with regular music nights
- Local theatres
- Small independent promoters running 100-500 person events

The pitch at this stage is not the full vision. It is simply: "Do you want more feedback from your crowd?"

This matters because:
1. Small venues move fast, don't need procurement, and feel the problem acutely
2. Every small event builds the fan data layer
3. It proves the consumer experience before pitching to bigger players

---

## The product must be built around the end user

The fan experience must be excellent. Not adequate — excellent. Ideally, it is a single experience regardless of what event or venue they're at.

The aspiration: one WhatsApp presence that a fan builds a relationship with over time, regardless of which events they attend. Like Spotify, but conversational and rooted in the live experience.

---

## Open strategic question

**Who owns the channel — crowdloop or the venue?**

This determines whether crowdloop is:
- A SaaS tool sold to venues (fast to sell, low defensibility)
- A consumer platform where venues are data contributors (slow to build, high defensibility)

This question is not yet resolved. See stakeholder mapping below.

---

## Stakeholder mapping

### The fan (end consumer)

**What they want:**
- To feel heard after an event
- Relevant suggestions for things they'd actually enjoy
- Not to be spammed by venues they visited once
- One place, not a different WhatsApp number for every event they attend

**Best experience for them:**
A single, trusted crowdloop presence. They message in once, the system remembers them, and future suggestions are personalised across every event they've attended through the platform. The more they engage, the better it gets.

**Implication:** Single number wins for the fan. Per-venue fragments the experience and commoditises the tool.

---

### Labels, artists, and promoters (eventual paying customers for promotion)

**What they want:**
- Access to a qualified audience who has already demonstrated intent (showed up, paid, engaged)
- Ability to target based on taste, not just demographics
- High deliverability and engagement rates
- Measurable conversion to ticket sales

**Best experience for them:**
A targetable audience layer: "fans who attended three or more electronic events in London in the last six months and gave positive feedback." They pay crowdloop to reach that segment with a personalised message, rather than spraying their own mailing list.

**Implication:** This business only exists if crowdloop owns the fan data across venues. Per-venue siloes destroy the value — a promoter can't access an audience that's split across 200 separate WhatsApp numbers.

---

### Physical spaces and events (venues, bars, theatres, festivals)

**What they want:**
- Easy to deploy with no technical overhead
- Immediate, actionable feedback on their events
- To feel like they own their audience relationship
- Not to be disintermediated — they don't want crowdloop to own their customers

**Best experience for them:**
Simple setup (QR code, email link), instant feedback, a clean insights report. The tension is that they want to feel like the channel is theirs, even if the underlying data is aggregated by crowdloop.

**Implication:** Per-venue feels safer to them. But if crowdloop can show that being part of the network benefits them (their fans get better recommendations, which means more return visits), the single-platform model becomes a feature, not a threat.

---

## Resolving the tension

The three stakeholders point in different directions:

| Stakeholder | Preferred model |
|---|---|
| Fan | Single crowdloop experience |
| Promoter/label | Single crowdloop audience layer |
| Venue | Per-venue ownership |

The venue is the odd one out — but they are also the entry point. You need them to deploy the QR code.

**The resolution: start per-venue, architect for single.**

Phase 1 (now): Each venue/event gets their own crowdloop-powered WhatsApp assistant. It feels like their channel. They get their feedback and insights. crowdloop collects the underlying fan data with consent.

Phase 2: Fans who opt in across multiple events get the cross-venue experience — personalised suggestions, artist follow recommendations, a unified preference profile. crowdloop surfaces this as a benefit to fans who engage repeatedly.

Phase 3: The promoter/label product opens once the audience layer is large enough to be valuable. crowdloop sells targeted reach, not SaaS subscriptions.

The QR code is the bridge. Today it launches a venue-specific conversation. Eventually, returning fans are recognised and the experience personalises across their history.

---

## Revenue model (evolving)

| Phase | Revenue source |
|---|---|
| 1 | Venue SaaS: £89 one-off per event / £149/mo subscription |
| 2 | Fan opt-in network: data layer, no direct revenue yet |
| 3 | Promoter/label campaigns: targeted reach to qualified fan segments |

The SaaS revenue funds phase 1 and 2. The campaign revenue is the real business.

---

## What this means for the product right now

1. **The fan experience must be excellent from day one** — even at the per-venue stage, the conversation quality, tone, and follow-through sets expectations for the platform it will become.

2. **Consent and data architecture matter early** — the fan data collected now needs to be structured so it can power cross-venue personalisation later. Build with that in mind.

3. **The pitch to small venues stays simple** — "collect better feedback." Don't sell the full vision. Let the product do that.

4. **The pitch to artists and labels is the bigger vision** — when you're ready to have those conversations, the story is community reach and direct fan relationships.
