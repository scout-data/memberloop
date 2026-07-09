"use client";

import { useState, useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { DemoPhone } from "@/components/DemoPhone";
import { DemoMessage } from "@/lib/demoModes";
import { getVenueConfig, VenueEvent, VenueConfig } from "@/lib/venueConfigs";

type Pref = { label: string; value: string };

// ─── Event tile (compact horizontal) ─────────────────────────────────────────

function EventTile({ event }: { event: VenueEvent }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      display: "flex",
      flexShrink: 0,
      fontFamily: "Helvetica Neue, Arial, sans-serif",
    }}>
      <div style={{ padding: "10px 12px", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", lineHeight: "17px", marginBottom: 2 }}>{event.title}</div>
        <div style={{ fontSize: 11, color: "#667781", lineHeight: "15px", marginBottom: 6 }}>{event.detail}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="#00A67E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#00A67E" }}>{event.cta}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: preferences + events ───────────────────────────────────────

function RightPanel({ preferences, suggestedEvents, calendarEvents, hasReplied }: {
  preferences: Pref[];
  suggestedEvents: VenueEvent[];
  calendarEvents: VenueEvent[];
  hasReplied: boolean;
}) {
  const hasSuggested = suggestedEvents.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Helvetica Neue, Arial, sans-serif" }}>

      {/* Preferences */}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.03em", marginBottom: 4 }}>
          What we&apos;ve learned
        </h2>
        <p style={{ fontSize: 13, color: "#9a9a9a", letterSpacing: "-0.01em", marginBottom: 28 }}>
          Updates as the conversation continues.
        </p>

        {!hasReplied && (
          <p style={{ fontSize: 14, color: "#c8c8c8", fontStyle: "italic" }}>
            Start a conversation to see preferences appear here.
          </p>
        )}

        {hasReplied && preferences.length === 0 && (
          <p style={{ fontSize: 14, color: "#c8c8c8", fontStyle: "italic" }}>
            Keep chatting to build a preference profile.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {preferences.map((pref, i) => (
            <div key={i} style={{ fontSize: 15, color: "#111", letterSpacing: "-0.01em", lineHeight: "21px", animation: "fadeSlideIn 0.3s ease" }}>
              <span style={{ fontWeight: 600 }}>{pref.label.replace(/_/g, " ")}:</span> {pref.value}
            </div>
          ))}
        </div>

        {/* Suggested — flows directly below preferences */}
        {hasSuggested && (
          <div style={{ marginTop: 24, animation: "fadeSlideIn 0.4s ease" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", letterSpacing: "-0.02em", marginBottom: 10 }}>
              Suggested for you
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestedEvents.map((event, i) => (
                <EventTile key={i} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* From your calendar — always at the bottom */}
      {calendarEvents.length > 0 && (
        <div>
          <div style={{ height: 1, background: "#E8E8E8", marginBottom: 20 }} />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#aaa", letterSpacing: "-0.02em", marginBottom: 10 }}>
            From your calendar
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
            {calendarEvents.map((event, i) => (
              <EventTile key={i} event={event} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function VenueDemoInner({ config }: { config: VenueConfig }) {
  const [messages, setMessages]             = useState<DemoMessage[]>([]);
  const [input, setInput]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [preferences, setPreferences]       = useState<Pref[]>([]);
  const [suggestedIndices, setSuggested]    = useState<number[]>([]);
  const [hasReplied, setHasReplied]         = useState(false);

  const suggestedEvents = suggestedIndices.map(i => config.events[i]).filter(Boolean) as VenueEvent[];
  const calendarEvents  = config.events.filter((_, i) => !suggestedIndices.includes(i));
  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: config.openingMessage }]);
  }, [config.openingMessage]);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function fetchPreferences(msgs: DemoMessage[]) {
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, events: config.events.map(e => ({ title: e.title, detail: e.detail })) }),
      });
      const data = await res.json() as { preferences?: Pref[]; suggested?: number[] };
      console.log("[PREFS]", res.status, data);
      if (data.preferences?.length) setPreferences(data.preferences);
      if (data.suggested) setSuggested(data.suggested);
    } catch (e) {
      console.error("[PREFS ERR]", e);
    }
  }

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
        const withReply = [...next, { role: "assistant" as const, content: data.content }];
        setMessages(withReply);
        fetchPreferences(withReply);
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
    setPreferences([]);
    setSuggested([]);
    setHasReplied(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9F7F4", display: "flex", flexDirection: "column", fontFamily: "Helvetica Neue, Arial, sans-serif" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>crowdloop</span>
        </a>
        <span style={{ fontSize: 13, color: "#9a9a9a", letterSpacing: "-0.01em" }}>
          a demo built for {config.name}
        </span>
      </div>

      {/* Two columns */}
      <div style={{ flex: 1, display: "flex", maxWidth: 1100, margin: "0 auto", width: "100%", padding: "48px 40px", gap: 0, alignItems: "stretch" }}>

        {/* Left: phone */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingRight: 56, flexShrink: 0 }}>
          <p style={{ fontSize: 15, color: "#666", textAlign: "center", marginBottom: 28, maxWidth: 300, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            This is what your guests experience after an evening at {config.name}. Try it.
          </p>
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
          <button
            onClick={reset}
            style={{ marginTop: 12, fontSize: 13, color: "#aaa", background: "none", border: "none", cursor: "pointer", letterSpacing: "-0.01em" }}
          >
            start over
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#E8E8E8", flexShrink: 0, alignSelf: "stretch" }} />

        {/* Right: preferences + events */}
        <div style={{ flex: 1, paddingLeft: 56, display: "flex", flexDirection: "column" }}>
          <RightPanel preferences={preferences} suggestedEvents={suggestedEvents} calendarEvents={calendarEvents} hasReplied={hasReplied} />
        </div>

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
