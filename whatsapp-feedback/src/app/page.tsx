"use client";

import { useState, useEffect, useRef } from "react";
import { Footer } from "@/components/Footer";
import { ContactSection } from "@/components/ContactSection";
import { Nav } from "@/components/Nav";
import { HomeDemoSection } from "@/components/HomeDemoSection";

type ChatMessage =
  | { kind: "bubble"; side: "left" | "right"; time: string; text: string }
  | { kind: "separator"; label: string };

const MESSAGES: ChatMessage[] = [
  { kind: "bubble",    side: "right", time: "23:44", text: "Amazing night, just wanted to leave some feedback" },
  { kind: "bubble",    side: "left",  time: "23:44", text: "So glad you came! How was the show for you overall?" },
  { kind: "bubble",    side: "right", time: "23:46", text: "Loved the headliner but the bar queues were brutal, missed half the support act" },
  { kind: "bubble",    side: "left",  time: "23:46", text: "That's really useful. How long were you waiting roughly?" },
  { kind: "bubble",    side: "right", time: "23:48", text: "About 40 mins at peak. Needs more bars or more staff" },
  { kind: "bubble",    side: "left",  time: "23:48", text: "Noted, we'll make sure the team sees this. Really appreciate you flagging it." },
  { kind: "separator", label: "Next month" },
  { kind: "bubble",    side: "left",  time: "10:02", text: "Quick update: we've added two extra bars for all upcoming shows. Your feedback directly influenced that." },
  { kind: "bubble",    side: "left",  time: "10:03", text: "Our next show is Saturday 19 July. Early access tickets are live now. Want me to grab you a link?" },
  { kind: "bubble",    side: "right", time: "10:05", text: "Yes please! Honestly one of the best nights out I've had in ages" },
];

// Delay before each message appears (ms)
const DELAYS = [700, 1600, 1400, 1600, 1400, 1800, 800, 2000, 2200, 1600];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-primary">

      {/* Hero */}
      <div className="relative overflow-hidden flex flex-col" style={{ backgroundImage: "url('/hero-crowd.jpg')", backgroundSize: "cover", backgroundPosition: "center", height: "100vh" }}>

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/30" />

        <Nav active="home" transparent />

        <section className="relative z-10 px-6 lg:px-10 py-16 lg:py-24 max-w-[1328px] mx-auto w-full flex-1 flex items-center">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20 w-full">

            {/* Left */}
            <div className="flex-1 max-w-[636px] flex flex-col justify-center pt-2 lg:pt-4">
              <h1 className="text-[48px] lg:text-[56px] font-light leading-[1.05] tracking-[-0.04em] text-white mb-6 lg:mb-7">
                Turn crowd feedback<br className="hidden lg:block" /> into future ticket sales
              </h1>

              <p className="text-[17px] lg:text-[20px] leading-[1.4] tracking-[-0.02em] mb-8 lg:mb-10 max-w-[500px] text-white/75">
                crowdloop&apos;s AI WhatsApp assistants turn event feedback into future bookings and a direct personalised channel to your audience.
              </p>

              <div className="flex items-center gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-[#003014] text-[15px] font-medium px-6 py-3 rounded-full hover:bg-white/90 transition-colors tracking-[-0.01em]"
                >
                  Get started
                </a>
              </div>

            </div>

            {/* Right: phone — hidden on mobile */}
            <div className="hidden lg:flex flex-1 justify-center items-center">
              <Phone3D />
            </div>
          </div>
        </section>

        {/* Scroll arrow */}
        <div className="z-10 flex justify-center" style={{ position: "absolute", bottom: 48, left: 0, right: 0 }}>
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, animation: "heroBounce 2s ease-in-out infinite" }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                <path d="M1 1L7 7L13 1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

      </div>

      {/* Who we help */}
      <WhoWeHelpSection />

      {/* How it works */}
      <section id="how-it-works" className="px-6 lg:px-10 pt-8 pb-20 lg:pb-32 max-w-[1328px] mx-auto scroll-mt-20">
        <h2 className="text-[32px] font-light tracking-[-0.03em] text-text-primary text-center mb-16">How it works</h2>

        <div className="flex flex-col gap-28">
          <HowItWorksStep step={1} headline="Link to WhatsApp from anywhere" body="A QR code at the exit, a link in your post-event email, a button on your ticket confirmation. Attendees tap once and they're in a conversation. No app to download, no login, no friction." visual={<PlacementsVisual />} />
          <HowItWorksStep step={2} headline="Your assistant collects feedback to start the relationship" body="When someone messages in, your AI responds instantly in your event's voice. It asks the right follow-up questions and surfaces the kind of insight a form never captures. Every conversation becomes the start of a direct channel." visual={<ConversationVisual />} />
          <HowItWorksStep step={3} headline="Turn that channel into your next event's audience" body="Every attendee who messaged in becomes a direct contact in the world's most-opened messaging app. Address the issues they raised, then tell them you did. Announce your next event to people who already love what you do. 98% open rates." visual={<InsightsVisual />} />
        </div>
      </section>

      {/* WhatsApp vs Email */}
      <section className="px-6 lg:px-10 pt-8 pb-20 lg:pb-32 max-w-[1328px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[32px] font-light tracking-[-0.03em] text-text-primary">
            WhatsApp is <em>the channel</em> for engagement
          </h2>
        </div>
        <div className="overflow-x-auto"><EngagementTable /></div>
      </section>

      <HomeDemoSection />

      {/* Pricing */}
      <section className="px-6 lg:px-10 pt-8 pb-16 lg:pb-24 max-w-[1328px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[32px] font-light tracking-[-0.03em] text-text-primary">
            Simple pricing
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </section>
      <ContactSection />
      <Footer />
    </div>
  );
}


// ─── Who we help ──────────────────────────────────────────────────────────────

const WHO_WE_HELP = [
  {
    id: "live",
    label: "Festivals & Live Sport",
    img: "/hero-crowd.jpg",
    heading: "crowdloop for live events",
    body: "Know what your crowd thought while it's still fresh. Build a direct WhatsApp channel to everyone who attended, and use it to sell the next event before they've even got home.",
  },
  {
    id: "venues",
    label: "Event Venues",
    img: "/event-venues.jpg",
    heading: "crowdloop for event venues",
    body: "Collect guest feedback after every hire, re-engage bookers for their next event, and turn one-off bookings into long-term relationships. Your venue becomes the obvious choice next time.",
  },
  {
    id: "corporate",
    label: "Corporate Event Teams",
    img: "/corporate-events.jpg",
    heading: "crowdloop for corporate events",
    body: "Follow up with every attendee, collect meaningful feedback for stakeholders, and give your clients the data they need to justify the next event and book it with you again.",
  },
];

function WhoWeHelpSection() {
  const [selected, setSelected] = useState("live");
  const active = WHO_WE_HELP.find(w => w.id === selected)!;

  return (
    <section id="who" style={{ padding: "80px 40px 96px" }} className="bg-surface-primary scroll-mt-20">
      <div style={{ maxWidth: 1328, margin: "0 auto" }}>

        <h2 style={{
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "#111",
          marginBottom: 52,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          For events where every guest counts
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start" style={{ gap: "40px 80px" }}>

          {/* Chips */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", alignItems: "center" }}>
            {WHO_WE_HELP.map(item => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${selected === item.id ? "transparent" : "#D9D9D9"}`,
                  background: selected === item.id ? "#232323" : "transparent",
                  color: selected === item.id ? "#fff" : "#505050",
                  fontSize: 15,
                  fontWeight: selected === item.id ? 600 : 400,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dynamic content */}
          <div>
            <div style={{
              width: "100%",
              height: 220,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 28,
              background: "#E8E4DC",
            }}>
              {active.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <h3 style={{
              fontSize: 36,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#111",
              marginBottom: 18,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {active.heading}
            </h3>
            <p style={{
              fontSize: 17,
              color: "#505050",
              lineHeight: 1.6,
              letterSpacing: "-0.01em",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: 32,
            }}>
              {active.body}
            </p>
            <a
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#232323",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: "none",
              }}
            >
              Get started free →
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "event",
    num: "01",
    name: "Single Event",
    tagline: "Try it on your next event",
    price: "£89",
    period: "",
    vatNote: "one-off · ex VAT",
    popular: false,
    cta: "Get started",
    features: [
      "1 event",
      "7-day post-event feedback window",
      "AI WhatsApp feedback assistant",
      "QR code and email link",
      "Up to 500 attendee conversations",
      "End-of-event insights report",
    ],
  },
  {
    id: "pro",
    num: "02",
    name: "Pro",
    tagline: "For teams running events regularly",
    price: "£149",
    period: "/mo",
    vatNote: "ex VAT",
    popular: true,
    cta: "Get started",
    features: [
      "Unlimited events",
      "Keep contacts as a direct channel between events",
      "Outbound messaging to past attendees",
      "All 5 modes: feedback, re-engagement, promotion, renewals and updates",
      "Custom assistant name and voice",
      "Insights dashboard",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    num: "03",
    name: "Enterprise",
    tagline: "For multi-venue operators and agencies",
    price: "Custom",
    period: "",
    vatNote: "Talk to us",
    popular: false,
    cta: "Talk to us",
    features: [
      "Multiple WhatsApp numbers",
      "Everything in Pro",
      "Multi-venue dashboard",
      "White-label",
      "Dedicated account manager",
      "SLAs",
      "API access",
    ],
  },
] as const;

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  const dark = plan.popular;
  return (
    <div
      className="rounded-3xl p-9 flex flex-col"
      style={{
        background: dark ? "#232323" : "#fff",
        border: dark ? "none" : "1px solid #EEE7DB",
      }}
    >
      <div className="mb-8">
        {plan.popular && (
          <span className="inline-block text-[11px] font-semibold tracking-[0.02em] px-3 py-1 rounded-full bg-[#EDF7ED] text-[#003014] mb-4">
            Most popular
          </span>
        )}
        <div className="text-[13px] font-medium mb-3" style={{ color: dark ? "rgba(255,255,255,0.35)" : "#BBBBBB", letterSpacing: "-0.01em" }}>{plan.num}</div>
        <h3 className="text-[30px] font-light tracking-[-0.03em] mb-2" style={{ color: dark ? "#fff" : "#111" }}>{plan.name}</h3>
        <p className="text-[15px] leading-[1.4] tracking-[-0.01em]" style={{ color: dark ? "rgba(255,255,255,0.5)" : "#888" }}>{plan.tagline}</p>
      </div>

      <div className="mb-8 pb-8" style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#F0EFEC"}` }}>
        <div className="flex items-end gap-1.5">
          <span className="text-[56px] font-light leading-none tracking-[-0.04em]" style={{ color: dark ? "#fff" : "#111" }}>{plan.price}</span>
          {plan.period && (
            <span className="text-[18px] mb-2 tracking-[-0.01em]" style={{ color: dark ? "rgba(255,255,255,0.4)" : "#aaa" }}>{plan.period}</span>
          )}
        </div>
        <p className="text-[13px] mt-2 tracking-[-0.01em]" style={{ color: dark ? "rgba(255,255,255,0.3)" : "#bbb" }}>{plan.vatNote}</p>
      </div>

      <ul className="flex flex-col gap-4 flex-1 mb-10">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-3">
            <PlanCheckIcon dark={dark} />
            <span className="text-[15px] tracking-[-0.01em] leading-[1.4]" style={{ color: dark ? "rgba(255,255,255,0.75)" : "#505050" }}>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href="/contact"
        className="block w-full text-center py-3.5 rounded-full text-[15px] font-medium tracking-[-0.01em] transition-colors"
        style={
          dark
            ? { background: "#fff", color: "#111" }
            : plan.id === "enterprise"
            ? { background: "transparent", color: "#111", border: "1px solid #D9D9D9" }
            : { background: "#232323", color: "#fff" }
        }
      >
        {plan.cta} →
      </a>
    </div>
  );
}

function PlanCheckIcon({ dark }: { dark: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="9" cy="9" r="9" fill={dark ? "rgba(255,255,255,0.1)" : "#EDF7ED"} />
      <path d="M5.5 9l2.5 2.5L12.5 6" stroke={dark ? "rgba(255,255,255,0.65)" : "#003014"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const ENGAGEMENT_ROWS = [
  { metric: "Open Rate",          wa: "98%",        email: "20-26%"      },
  { metric: "Click-through Rate", wa: "20-60%",     email: "1-2%"        },
  { metric: "Conversion Rate",    wa: "5-15%",      email: "0.07-0.8%"   },
  { metric: "Cart Recovery",      wa: "4x better",  email: "Baseline"    },
  { metric: "Response Time",      wa: "Real-time",  email: "90+ min avg" },
];

function EngagementTable() {
  return (
    <div className="mx-auto rounded-2xl overflow-hidden" style={{ border: "1px solid #EEE7DB", minWidth: 540 }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: "#F0EFEC", borderBottom: "1px solid #EEE7DB", alignItems: "stretch" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#888", letterSpacing: "-0.01em", padding: "18px 40px", display: "flex", alignItems: "center" }}>Metric</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderLeft: "1px solid #D9D9D9", padding: "18px 20px" }}>
          <img src="https://img.logo.dev/whatsapp.com?token=pk_Q7O4k099Tgitwp7yoycUjQ&size=40" alt="WhatsApp" style={{ width: 18, height: 18, borderRadius: 4 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>WhatsApp</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderLeft: "1px solid #D9D9D9", padding: "18px 20px" }}>
          <svg width="17" height="14" viewBox="0 0 18 14" fill="none">
            <rect x="1" y="1" width="16" height="12" rx="1.5" stroke="#888" strokeWidth="1.4"/>
            <path d="M1.5 2.5l7.5 5 7.5-5" stroke="#888" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#888", letterSpacing: "-0.01em" }}>Email</span>
        </div>
      </div>

      {/* Rows */}
      {ENGAGEMENT_ROWS.map((row, i) => (
        <div key={row.metric} style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
          background: "#fff",
          borderBottom: i < ENGAGEMENT_ROWS.length - 1 ? "1px solid #F4F1EC" : "none",
          alignItems: "stretch",
        }}>
          <span style={{ fontSize: 17, color: "#505050", letterSpacing: "-0.01em", padding: "24px 40px", display: "flex", alignItems: "center" }}>{row.metric}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #EEE7DB", padding: "24px 20px" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>{row.wa}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #EEE7DB", padding: "24px 20px" }}>
            <span style={{ fontSize: 17, color: "#9E9E9E", letterSpacing: "-0.01em" }}>{row.email}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-surface-secondary rounded-2xl p-8">
      <div className="text-2xl mb-5">{icon}</div>
      <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary mb-3 leading-[1.2]">{title}</h3>
      <p className="text-[15px] text-text-secondary leading-[1.5] tracking-[-0.01em]">{body}</p>
    </div>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksStep({ step, headline, body, visual }: {
  step: number; headline: string; body: string; visual: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-16">
      <div className="flex-1 max-w-[520px]">
        <div className="text-[13px] font-medium text-text-muted tracking-[0.06em] mb-5">0{step}</div>
        <h2 className="text-[38px] font-light tracking-[-0.03em] leading-[1.1] text-text-primary mb-6">{headline}</h2>
        <p className="text-[17px] text-text-secondary leading-[1.6] tracking-[-0.01em]">{body}</p>
      </div>
      <div className="flex-1 flex justify-center items-center">
        {visual}
      </div>
    </div>
  );
}

type TilePhase = "idle" | "clicking" | "loading" | "done";

const SETUP_TILES = [
  { id: "qr",    label: "Create QR code",    sub: "Print & place anywhere",  btn: "Generate" },
  { id: "web",   label: "Add to my website", sub: "Paste one snippet",        btn: "Embed"    },
  { id: "email", label: "Share in email",    sub: "Drop in your newsletter",  btn: "Get link" },
] as const;

function PlacementsVisual() {
  const [phases, setPhases] = useState<TilePhase[]>(["idle", "idle", "idle"]);

  useEffect(() => {
    let running = true;

    function setPhase(i: number, phase: TilePhase) {
      setPhases(prev => { const n = [...prev] as TilePhase[]; n[i] = phase; return n; });
    }

    function runLoop() {
      if (!running) return;
      setPhases(["idle", "idle", "idle"]);

      const CLICK = 180, LOAD = 950, GAP = 580;
      let t = 700;
      [0, 1, 2].forEach(i => {
        setTimeout(() => { if (running) setPhase(i, "clicking"); }, t);
        setTimeout(() => { if (running) setPhase(i, "loading");  }, t + CLICK);
        setTimeout(() => { if (running) setPhase(i, "done");     }, t + CLICK + LOAD);
        t += CLICK + LOAD + GAP;
      });

      setTimeout(() => { if (running) runLoop(); }, t - GAP + CLICK + LOAD + 2800);
    }

    runLoop();
    return () => { running = false; };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
      {SETUP_TILES.map((tile, i) => (
        <SetupTile key={tile.id} tile={tile} phase={phases[i]} />
      ))}
    </div>
  );
}

function SetupTile({ tile, phase }: { tile: typeof SETUP_TILES[number]; phase: TilePhase }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: "#F0EFEC",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {tile.id === "qr"    && <QrIcon />}
        {tile.id === "web"   && <GlobeIcon />}
        {tile.id === "email" && <MailIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111", letterSpacing: "-0.01em", lineHeight: "1.2" }}>{tile.label}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2, lineHeight: "1.2" }}>{tile.sub}</div>
      </div>

      <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", minWidth: 88 }}>
        {(phase === "idle" || phase === "clicking") && (
          <div style={{
            background: phase === "clicking" ? "#111" : "#232323",
            color: "#fff", borderRadius: 999, padding: "6px 12px",
            fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap",
            transform: phase === "clicking" ? "scale(0.94)" : "scale(1)",
            transition: "transform 0.12s ease, background 0.1s ease",
          }}>
            {tile.btn} →
          </div>
        )}
        {phase === "loading" && <TileSpinner />}
        {phase === "done"    && <TileResult id={tile.id} />}
      </div>
    </div>
  );
}

function TileSpinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: "spin 0.75s linear infinite" }}>
      <circle cx="11" cy="11" r="8" stroke="#E8E7E3" strokeWidth="2.5"/>
      <path d="M11 3a8 8 0 0 1 8 8" stroke="#232323" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function TileResult({ id }: { id: string }) {
  if (id === "qr") return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <MiniQrCode />
    </div>
  );
  if (id === "web") return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#25D366", borderRadius: 8, padding: "6px 10px", animation: "fadeSlideIn 0.3s ease" }}>
      <img src="https://img.logo.dev/whatsapp.com?token=pk_Q7O4k099Tgitwp7yoycUjQ&size=40" alt="" style={{ width: 13, height: 13, borderRadius: 3 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "Helvetica Neue, Arial, sans-serif", whiteSpace: "nowrap" }}>Widget live</span>
    </div>
  );
  if (id === "email") return (
    <div style={{ background: "#F0EFEC", borderRadius: 8, padding: "6px 10px", animation: "fadeSlideIn 0.3s ease" }}>
      <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#333", whiteSpace: "nowrap" }}>ptm.app/a1b2</span>
    </div>
  );
  return null;
}

function MiniQrCode() {
  return (
    <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
      {/* TL finder */}
      <rect x="1" y="1" width="11" height="11" rx="1.5" fill="#111"/>
      <rect x="3" y="3" width="7" height="7" rx="0.5" fill="#fff"/>
      <rect x="5" y="5" width="3" height="3" fill="#111"/>
      {/* TR finder */}
      <rect x="18" y="1" width="11" height="11" rx="1.5" fill="#111"/>
      <rect x="20" y="3" width="7" height="7" rx="0.5" fill="#fff"/>
      <rect x="22" y="5" width="3" height="3" fill="#111"/>
      {/* BL finder */}
      <rect x="1" y="18" width="11" height="11" rx="1.5" fill="#111"/>
      <rect x="3" y="20" width="7" height="7" rx="0.5" fill="#fff"/>
      <rect x="5" y="22" width="3" height="3" fill="#111"/>
      {/* Timing strips */}
      <rect x="13" y="1"  width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="13" y="4"  width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="13" y="7"  width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="13" y="10" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="1"  y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="4"  y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="7"  y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="10" y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      {/* Data region */}
      <rect x="15" y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="18" y="14" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="21" y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="24" y="14" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="27" y="13" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="14" y="16" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="17" y="17" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="20" y="16" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="23" y="17" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="26" y="16" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="15" y="19" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="19" y="20" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="22" y="19" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="25" y="20" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="28" y="19" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="14" y="22" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="18" y="23" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="21" y="22" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="24" y="23" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="27" y="22" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="16" y="25" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="20" y="26" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="23" y="25" width="1.5" height="1.5" fill="#111" rx="0.2"/>
      <rect x="26" y="26" width="1.5" height="1.5" fill="#111" rx="0.2"/>
    </svg>
  );
}

function QrCodeGraphic() {
  // Simplified QR code using a grid pattern
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,0,0,0,0,1,0,0,0,1,0,1,0,0],
    [1,0,1,0,1,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,0,1,0],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,0,0,0,1,0],
  ];
  const size = 17;
  const cell = 52 / size;
  return (
    <svg width="52" height="52" viewBox={`0 0 52 52`}>
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 0.3} height={cell - 0.3} fill="#111" rx="0.3" /> : null
        )
      )}
    </svg>
  );
}

function TouchpointsVisual() {
  const sources = [
    { label: "QR code", icon: <QrIcon /> },
    { label: "Website", icon: <GlobeIcon /> },
    { label: "Email", icon: <MailIcon /> },
  ];
  return (
    <div className="w-full max-w-[420px] bg-surface-secondary rounded-3xl p-10 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {sources.map(({ label, icon }) => (
          <div key={label} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center text-text-secondary">
              {icon}
            </div>
            <span className="text-[15px] font-medium tracking-[-0.01em] text-text-primary">{label}</span>
            <div className="ml-auto flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-border-light" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-px bg-border-warm" />
      <div className="flex items-center gap-4 bg-[#25D366] rounded-2xl px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <WhatsAppIcon />
        </div>
        <span className="text-[15px] font-medium text-white tracking-[-0.01em]">Member messages in</span>
        <span className="ml-auto text-white/70 text-[13px]">any time</span>
      </div>
    </div>
  );
}

const CONV_BUBBLES: { side: "left" | "right"; text: string }[] = [
  { side: "right", text: "Good event overall but leaving was a real problem" },
  { side: "left",  text: "Sorry to hear that. What happened when you were leaving?" },
  { side: "right", text: "The exit gates funnelled everyone into one route. Took nearly 40 minutes to get out" },
  { side: "left",  text: "That's really useful to know. Did you take one of the shuttle transfers?" },
  { side: "right", text: "Yes, waited over an hour. Only two buses showed up and they were already full" },
  { side: "left",  text: "I'm sorry about that. How many people were in your group?" },
  { side: "right", text: "Four of us. We ended up getting a cab which cost a fortune" },
  { side: "left",  text: "Understood. I'll make sure the operations team sees this before the next event." },
];
const CONV_DELAYS = [600, 1500, 1400, 1400, 1300, 1400, 1400, 1600];

function ConversationVisual() {
  const [visible, setVisible] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let running = true;

    function runLoop() {
      if (!running) return;
      setVisible(0);
      let cumulative = 0;
      CONV_DELAYS.forEach((delay, i) => {
        cumulative += delay;
        setTimeout(() => {
          if (!running) return;
          setVisible(i + 1);
        }, cumulative);
      });
      setTimeout(() => { if (running) runLoop(); }, cumulative + 3000);
    }

    runLoop();
    return () => { running = false; };
  }, []);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  return (
    <div
      ref={chatRef}
      className="w-full max-w-[420px] flex flex-col gap-2"
      style={{ aspectRatio: "1", overflowY: "auto", scrollbarWidth: "none", padding: "8px 0" }}
    >
      {CONV_BUBBLES.slice(0, visible).map((b, i) => {
        const right = b.side === "right";
        return (
          <div key={i} className={`flex px-2 ${right ? "justify-end" : "justify-start"}`} style={{ animation: "fadeSlideIn 0.25s ease" }}>
            <div style={{
              background: right ? "#DCF8C6" : "#fff",
              borderRadius: right ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
              padding: "9px 13px",
              maxWidth: "78%",
              fontFamily: "Helvetica Neue, Arial, sans-serif",
              fontSize: 15,
              lineHeight: "19px",
              color: "#111",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}>
              {b.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const INSIGHTS_INITIAL = [
  { id: "exit",    label: "Exit & transport", count: 61 },
  { id: "bars",    label: "Bar queues",        count: 38 },
  { id: "sound",   label: "Sound quality",     count: 24 },
  { id: "tickets", label: "Ticketing",         count: 17 },
];

const INSIGHTS_STEPS: Record<string, number>[] = [
  { exit: 68, bars: 44, sound: 29, tickets: 22 },
  { exit: 72, bars: 57, sound: 34, tickets: 28 },
  { exit: 75, bars: 73, sound: 39, tickets: 31 },
];

const INSIGHTS_STEP_DELAY = 2200;

function InsightsVisual() {
  const [themes, setThemes] = useState(INSIGHTS_INITIAL);

  useEffect(() => {
    let running = true;

    function runLoop() {
      if (!running) return;
      setThemes(INSIGHTS_INITIAL.map(t => ({ ...t })));

      let cumulative = 0;
      INSIGHTS_STEPS.forEach((counts) => {
        cumulative += INSIGHTS_STEP_DELAY;
        setTimeout(() => {
          if (!running) return;
          setThemes(prev => prev.map(t => ({ ...t, count: counts[t.id] })));
        }, cumulative);
      });

      setTimeout(() => { if (running) runLoop(); }, cumulative + 3000);
    }

    runLoop();
    return () => { running = false; };
  }, []);

  const sorted = [...themes].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count || 1;
  const total = themes.reduce((s, t) => s + t.count, 0);

  const ITEM_H = 44;
  const GAP = 14;

  return (
    <div className="w-full max-w-[420px] p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-text-primary">Top themes this month</span>
        <span className="text-[12px] text-text-muted">{total} mentions</span>
      </div>

      <div style={{ position: "relative", height: themes.length * (ITEM_H + GAP) - GAP }}>
        {themes.map((theme) => {
          const rank = sorted.findIndex(s => s.id === theme.id);
          const pct = Math.round((theme.count / maxCount) * 100);
          return (
            <div
              key={theme.id}
              style={{
                position: "absolute",
                top: rank * (ITEM_H + GAP),
                left: 0, right: 0,
                height: ITEM_H,
                transition: "top 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="text-[14px] tracking-[-0.01em] text-text-primary">{theme.label}</span>
                  <span className="text-[13px] text-text-muted">{theme.count} mentions</span>
                </div>
                <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-action-primary rounded-full"
                    style={{ width: `${pct}%`, transition: "width 0.55s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="3" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="11" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="13" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="1" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="3" y="13" width="2" height="2" fill="currentColor"/>
      <path d="M11 11h2v2h-2zM13 13h2v2h-2zM15 11h2v2h-2zM11 15h4v2h-4z" fill="currentColor"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4"/>
      <ellipse cx="9" cy="9" rx="3" ry="7.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 9h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="3.5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 4.5l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src={`https://img.logo.dev/whatsapp.com?token=pk_Q7O4k099Tgitwp7yoycUjQ&size=40`}
      alt="WhatsApp"
      style={{ width: size, height: size, borderRadius: 4, display: "block" }}
    />
  );
}

function Phone3D() {
  return (
    <div
      style={{
        width: 300,
        height: 620,
        borderRadius: 48,
        border: "2px solid #2a2a2e",
        background: "#1C1C1E",
        padding: "5px 5px 5px 4px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 32px 64px rgba(0,0,0,0.35)",
      }}
    >
      <Screen />
    </div>
  );
}

function Screen() {
  return (
    <div style={{
      flex: 1,
      borderRadius: 44,
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      background: "#fff",
    }}>
      {/* Dynamic Island */}
      <div style={{
        position: "absolute", top: 12, left: "50%",
        transform: "translateX(-50%)",
        width: 112, height: 30,
        background: "#000", borderRadius: 999, zIndex: 10,
      }} />

      {/* Status bar */}
      <div style={{
        height: 52, background: "#fff", flexShrink: 0,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        padding: "0 20px 6px",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#000", fontFamily: "inherit" }}>15:30</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {/* WiFi */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#000"/>
            <path d="M4.5 7.2A5 5 0 0 1 8 6a5 5 0 0 1 3.5 1.2" stroke="#000" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M1.5 4.5A9 9 0 0 1 8 2a9 9 0 0 1 6.5 2.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {/* Battery */}
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <div style={{ width: 22, height: 11, borderRadius: 3, border: "1.2px solid #000", padding: "1.5px", position: "relative" }}>
              <div style={{ width: "65%", height: "100%", background: "#000", borderRadius: 1.5 }} />
            </div>
            <div style={{ width: 2, height: 5, background: "#000", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "0.5px solid #E8E8E8",
        padding: "7px 10px",
        display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
      }}>
        {/* Back chevron + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, marginRight: 6 }}>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M7 1L1 6.5L7 12" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: "#007AFF", fontSize: 14, fontFamily: "inherit" }}>6</span>
        </div>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/organiser-avatar.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Name + online */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#000", fontFamily: "inherit" }}>
              Tastemakers Festival
            </span>
            {/* Meta verified tick */}
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="10" cy="10" r="10" fill="#1DA1F2"/>
              <path d="M5.5 10L8.5 13L14.5 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 10, color: "#8E8E93", fontFamily: "inherit" }}>online</div>
        </div>

      </div>

      <AnimatedChat />

      {/* Input bar */}
      <div style={{
        background: "#F0F2F5", padding: "7px 10px",
        display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
      }}>
        {/* Plus */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Input field */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 999, padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#aaa", fontFamily: "inherit" }}>Message</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#8E8E93" strokeWidth="1.5"/>
            <path d="M8.5 14.5s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="10" r="1" fill="#8E8E93"/>
            <circle cx="15" cy="10" r="1" fill="#8E8E93"/>
          </svg>
        </div>

        {/* Camera */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#8E8E93" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="3.5" stroke="#8E8E93" strokeWidth="1.5"/>
        </svg>

        {/* Mic */}
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
          <rect x="5" y="1" width="8" height="11" rx="4" stroke="#8E8E93" strokeWidth="1.5"/>
          <path d="M1 9v1a8 8 0 0 0 16 0V9" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="18" x2="9" y2="20" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="6" y1="20" x2="12" y2="20" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Glass reflection */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
        background: "linear-gradient(140deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 60%)",
      }} />
    </div>
  );
}

// ─── Animated chat ────────────────────────────────────────────────────────────

function AnimatedChat() {
  const [visible, setVisible] = useState(0);
  const [readUpTo, setReadUpTo] = useState(-1);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let running = true;

    function runLoop() {
      if (!running) return;
      setVisible(0);
      setReadUpTo(-1);

      let cumulative = 0;
      DELAYS.forEach((delay, i) => {
        cumulative += delay;
        setTimeout(() => {
          if (!running) return;
          setVisible(i + 1);
          const msg = MESSAGES[i];
          if (msg.kind === "bubble" && msg.side === "left") setReadUpTo(i);
        }, cumulative);
      });

      setTimeout(() => { if (running) runLoop(); }, cumulative + 10000);
    }

    runLoop();
    return () => { running = false; };
  }, []);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  return (
    <div ref={chatRef} style={{
      flex: 1, background: "#ECE5DD",
      padding: "10px 8px",
      display: "flex", flexDirection: "column", gap: 2,
      overflowY: "auto",
      scrollbarWidth: "none",
    }}>
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "#667781", background: "rgba(255,255,255,0.5)", borderRadius: 99, padding: "1px 8px", fontFamily: "inherit" }}>
          Today
        </span>
      </div>
      {MESSAGES.slice(0, visible).map((msg, i) => (
        <div key={i} style={{ opacity: 1, animation: "fadeSlideIn 0.25s ease" }}>
          {msg.kind === "separator" ? (
            <div style={{ textAlign: "center", margin: "6px 0 4px" }}>
              <span style={{ fontSize: 10, color: "#667781", background: "rgba(255,255,255,0.5)", borderRadius: 99, padding: "1px 8px", fontFamily: "inherit" }}>
                {msg.label}
              </span>
            </div>
          ) : (
            <Bubble side={msg.side} time={msg.time} read={msg.side === "right" && readUpTo > i}>
              {msg.text}
            </Bubble>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WhatsApp bubble ──────────────────────────────────────────────────────────

function Bubble({ children, side, time, read }: {
  children: React.ReactNode;
  side: "left" | "right";
  time: string;
  read?: boolean;
}) {
  const right = side === "right";
  const tickColor = read ? "#53BDEB" : "#9BA8B0";
  return (
    <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}>
      <div style={{
        background: right ? "#DCF8C6" : "#fff",
        borderRadius: right ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
        padding: "5px 8px 4px", maxWidth: "80%",
        boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
        fontFamily: "Helvetica Neue, Arial, sans-serif",
        fontSize: 14,
        lineHeight: "17px",
        color: "#111",
      }}>
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: "#667781", lineHeight: 1 }}>{time}</span>
          {right && (
            <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
              <path d="M1 5.5L3.5 8.5L8 2" stroke={tickColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5.5L7.5 8.5L12 2" stroke={tickColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

