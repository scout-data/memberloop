"use client";

import { useState, useEffect, useRef } from "react";
import { notFound } from "next/navigation";
import { DemoPhone } from "@/components/DemoPhone";
import { CrowdloopLogo } from "@/components/CrowdloopLogo";
import { DemoMessage } from "@/lib/demoModes";
import { getVenueConfig, VenueConfig } from "@/lib/venueConfigs";

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
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        padding: "18px 40px",
        flexShrink: 0,
      }}>
        <a href="/" style={{ textDecoration: "none", position: "absolute", left: 40 }}>
          <CrowdloopLogo />
        </a>
        <span style={{ fontSize: 13, color: "#9a9a9a", letterSpacing: "-0.01em" }}>
          a demo built for {config.name}
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
        padding: "80px 40px 80px 0",
        gap: 140,
        alignItems: "flex-start",
      }}>

        {/* LHS: description */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#111", marginBottom: 16 }}>
              Build a personal channel with every {config.name} fan
            </h1>
            <p style={{ fontSize: 16, color: "#666", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
              This is a live demo of what {config.name}&apos;s WhatsApp agent could do. It knows your upcoming shows, can answer questions about visiting, and sends event cards with direct booking links.
            </p>
          </div>

          <button
            onClick={reset}
            style={{ alignSelf: "flex-start", fontSize: 13, color: "#aaa", background: "none", border: "none", cursor: "pointer", letterSpacing: "-0.01em", padding: 0 }}
          >
            ↺ Start over
          </button>
        </div>

        {/* RHS: phone */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
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
        </div>

      </div>
    </div>
  );
}

export default function VenueDemoPage({ params }: { params: { venue: string } }) {
  const config = getVenueConfig(params.venue);
  if (!config) notFound();
  return <VenueDemoInner config={config} />;
}
