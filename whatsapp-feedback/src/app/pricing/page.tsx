"use client";

import { Footer } from "@/components/Footer";
import { ContactSection } from "@/components/ContactSection";
import { Nav } from "@/components/Nav";

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

export default function Pricing() {
  return (
    <div className="min-h-screen bg-surface-primary">

      <Nav active="pricing" />

      {/* Header */}
      <section className="px-6 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16 max-w-[1328px] mx-auto text-center">
        <h1 className="text-[44px] lg:text-[64px] font-light leading-[1] tracking-[-0.04em] text-text-primary mb-5">
          Simple pricing
        </h1>
        <p className="text-[17px] lg:text-[20px] text-text-secondary tracking-[-0.02em]">
          Start with a single event. Scale when you&apos;re ready.
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 lg:px-10 pb-20 lg:pb-32 max-w-[1328px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  );
}

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
      {/* Top: badge + number + name */}
      <div className="mb-8">
        {plan.popular && (
          <span className="inline-block text-[11px] font-semibold tracking-[0.02em] px-3 py-1 rounded-full bg-[#EDF7ED] text-[#003014] mb-4">
            Most popular
          </span>
        )}
        <div
          className="text-[13px] font-medium mb-3"
          style={{ color: dark ? "rgba(255,255,255,0.35)" : "#BBBBBB", letterSpacing: "-0.01em" }}
        >
          {plan.num}
        </div>
        <h2
          className="text-[30px] font-light tracking-[-0.03em] mb-2"
          style={{ color: dark ? "#fff" : "#111" }}
        >
          {plan.name}
        </h2>
        <p
          className="text-[15px] leading-[1.4] tracking-[-0.01em]"
          style={{ color: dark ? "rgba(255,255,255,0.5)" : "#888" }}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Price */}
      <div
        className="mb-8 pb-8"
        style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#F0EFEC"}` }}
      >
        <div className="flex items-end gap-1.5">
          <span
            className="text-[56px] font-light leading-none tracking-[-0.04em]"
            style={{ color: dark ? "#fff" : "#111" }}
          >
            {plan.price}
          </span>
          {plan.period && (
            <span
              className="text-[18px] mb-2 tracking-[-0.01em]"
              style={{ color: dark ? "rgba(255,255,255,0.4)" : "#aaa" }}
            >
              {plan.period}
            </span>
          )}
        </div>
        <p
          className="text-[13px] mt-2 tracking-[-0.01em]"
          style={{ color: dark ? "rgba(255,255,255,0.3)" : "#bbb" }}
        >
          {plan.vatNote}
        </p>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-4 flex-1 mb-10">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-3">
            <CheckIcon dark={dark} />
            <span
              className="text-[15px] tracking-[-0.01em] leading-[1.4]"
              style={{ color: dark ? "rgba(255,255,255,0.75)" : "#505050" }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
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

function CheckIcon({ dark }: { dark: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 18 18" fill="none"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <circle cx="9" cy="9" r="9" fill={dark ? "rgba(255,255,255,0.1)" : "#EDF7ED"} />
      <path
        d="M5.5 9l2.5 2.5L12.5 6"
        stroke={dark ? "rgba(255,255,255,0.65)" : "#003014"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
