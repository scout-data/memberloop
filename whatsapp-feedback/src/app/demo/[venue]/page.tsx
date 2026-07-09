"use client";

import { useState, useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { DemoPhone } from "@/components/DemoPhone";
import { DemoMessage } from "@/lib/demoModes";
import { getVenueConfig, VenueEvent } from "@/lib/venueConfigs";

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: VenueEvent }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
      width: "100%",
      fontFamily: "Helvetica Neue, Arial, sans-serif",
    }}>
      {/* Image area */}
      <div style={{ height: 130, background: "#1a1a1a", overflow: "hidden", position: "relative" }}>
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a1a1a 0%, #2a2a2a 100%)" }} />
        )}
      </div>

      {/* Text */}
      <div style={{ padding: "10px 12px 8px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 3, lineHeight: "17px" }}>{event.title}</div>
        <div style={{ fontSize: 12, color: "#667781", lineHeight: "16px" }}>{event.detail}</div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F0F0F0", margin: "0 12px" }} />

      {/* CTA */}
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="#00A67E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#00A67E" }}>{event.cta}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inner page (rendered only when config is known) ─────────────────────────

function VenueDemoInner({ config }: { config: NonNullable<ReturnType<typeof getVenueConfig>> }) {
  const [messages, setMessages]     = useState<DemoMessage[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [hasReplied, setHasReplied] = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialise with opening message
  useEffect(() => {
    setMessages([{ role: "assistant", content: config.openingMessage }]);
  }, [config.openingMessage]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: DemoMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setHasReplied(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, system: config.system }),
      });
      const data = await res.json() as { content?: string };
      if (data.content) {
        setMessages([...next, { role: "assistant" as const, content: data.content }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function reset() {
    setMessages([{ role: "assistant", content: config.openingMessage }]);
    setInput("");
    setLoading(false);
    setHasReplied(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F4", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: "#111", fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
            crowdloop
          </span>
        </a>
        <span style={{ fontSize: 13, color: "#9a9a9a", fontFamily: "Helvetica Neue, Arial, sans-serif", letterSpacing: "-0.01em" }}>
          a demo built for {config.name}
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 64px" }}>

        {/* Hero text */}
        <p style={{ fontSize: 16, color: "#555", textAlign: "center", marginBottom: 36, maxWidth: 440, lineHeight: "1.5", fontFamily: "Helvetica Neue, Arial, sans-serif", letterSpacing: "-0.01em" }}>
          This is what your guests experience after an evening at {config.name}. Try it.
        </p>

        {/* Phone */}
        <DemoPhone
          messages={messages}
          input={input}
          loading={loading}
          chatRef={chatRef}
          inputRef={inputRef}
          onInput={setInput}
          onKey={handleKey}
          onSend={() => send(input)}
          showPrompt={true}
        />

        {/* Start over */}
        <button
          onClick={reset}
          style={{ marginTop: 16, fontSize: 13, color: "#9a9a9a", background: "none", border: "none", cursor: "pointer", fontFamily: "Helvetica Neue, Arial, sans-serif", letterSpacing: "-0.01em", padding: "4px 8px" }}
        >
          ↺ Start over
        </button>

        {/* Events section */}
        {hasReplied && (
          <div style={{ width: "100%", maxWidth: 720, marginTop: 56 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.03em", marginBottom: 8, fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
                Based on your conversation, here&apos;s what we&apos;d suggest next
              </h2>
              <p style={{ fontSize: 14, color: "#667781", fontFamily: "Helvetica Neue, Arial, sans-serif", letterSpacing: "-0.01em" }}>
                crowdloop reaches back out with personalised event recommendations. 98% open rate.
              </p>
            </div>

            {/* Cards row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {config.events.map((event, i) => (
                <div key={i} style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenueDemoPage({ params }: { params: { venue: string } }) {
  const config = getVenueConfig(params.venue);
  if (!config) notFound();
  return <VenueDemoInner config={config} />;
}
