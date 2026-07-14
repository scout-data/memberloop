"use client";

import { useState, useRef } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DemoPhone } from "@/components/DemoPhone";
import { SCENARIOS, ScenarioId } from "@/lib/demoModes";

export default function Demo() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("ticket_releases");
  const chatRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;

  return (
    <div className="min-h-screen bg-surface-primary">
      <Nav active="demo" />

      <section className="px-6 lg:px-10 pt-8 lg:pt-12 pb-6 max-w-[1328px] mx-auto text-center">
        <h1 className="text-[36px] lg:text-[48px] font-light leading-[1] tracking-[-0.04em] text-text-primary">
          See how it works
        </h1>
      </section>

      <section className="px-6 lg:px-10 pb-16 max-w-[1328px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-20 w-full">

          {/* Left: scenario tabs */}
          <div className="flex-1 max-w-[636px] lg:pt-4 flex flex-col">
            {SCENARIOS.map(s => {
              const active = scenarioId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`text-left py-5 border-b transition-all ${
                    active
                      ? "border-b-2 border-text-primary"
                      : "border-border-warm hover:border-text-secondary"
                  }`}
                >
                  <div className={`text-[18px] font-light tracking-[-0.02em] mb-1 transition-colors ${active ? "text-text-primary" : "text-text-secondary"}`}>
                    {s.label}
                  </div>
                  <div className={`text-[14px] leading-[1.5] tracking-[-0.01em] transition-colors ${active ? "text-text-secondary" : "text-text-muted"}`}>
                    {s.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phone */}
          <div className="flex-1 flex justify-center items-start">
            <DemoPhone
              key={scenarioId}
              messages={scenario.messages}
              chatRef={chatRef}
              readOnly
            />
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
