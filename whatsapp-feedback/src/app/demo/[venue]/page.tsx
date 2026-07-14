"use client";

import { useState, useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { DemoPhone } from "@/components/DemoPhone";
import { DemoMessage } from "@/lib/demoModes";
import { getVenueConfig, VenueConfig } from "@/lib/venueConfigs";

// ─── Inner page ───────────────────────────────────────────────────────────────

function VenueDemoInner({ config }: { config: VenueConfig }) {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);

  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: config.openingMessage }]);
  }, [config.openingMessage]);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);

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
    try {
      const res = await fetch("/api/venue-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          venueSlug: config.slug,
        }),
      });
      const data = await res.json() as { content?: string; carousel?: { title: string; detail: string; description?: string; cta: string; image?: string; url?: string }[] };
      if (data.content !== undefined) {
        setMessages([...next, { role: "assistant", content: data.content, carousel: data.carousel }]);
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
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F9F7F4",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans', Helvetica Neue, Arial, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>crowdloop</span>
        </a>
        <span style={{ fontSize: 13, color: "#9a9a9a", letterSpacing: "-0.01em" }}>
          a demo built for {config.name}
        </span>
      </div>

      {/* Main */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <p style={{
          fontSize: 15, color: "#666", textAlign: "center",
          marginBottom: 28, maxWidth: 300, lineHeight: 1.5,
          letterSpacing: "-0.01em",
        }}>
          This is what your fans experience on {config.name}&apos;s WhatsApp. Try it.
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
          venueLogoUrl={config.logoUrl}
          venueName={config.name}
        />

        <button
          onClick={reset}
          style={{
            marginTop: 12, fontSize: 13, color: "#aaa",
            background: "none", border: "none", cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          start over
        </button>
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
