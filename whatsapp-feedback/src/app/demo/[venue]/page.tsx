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
      <div className="flex items-center justify-between lg:justify-center lg:relative" style={{ padding: "18px 24px", flexShrink: 0 }}>
        <a href="/" style={{ textDecoration: "none" }} className="lg:absolute lg:left-6">
          <CrowdloopLogo />
        </a>
        <span className="hidden lg:inline" style={{ fontSize: 13, color: "#9a9a9a", letterSpacing: "-0.01em" }}>
          a demo built for {config.name}
        </span>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full px-6 lg:px-16"
        style={{ paddingTop: 64, paddingBottom: 48, gap: 100 }}
      >

        {/* Text */}
        <div className="flex flex-col w-full lg:items-end order-1" style={{ gap: 24, paddingBottom: 40 }}><div style={{ maxWidth: 520 }}>
          <div>
            <h1 className="lg:text-5xl" style={{ fontSize: 32, fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#111", marginBottom: 16 }}>
              Build a personal channel with every {config.name} fan
            </h1>
            <p style={{ fontSize: 16, color: "#666", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
              This is a live demo of what {config.name} WhatsApp agent could do. It knows your upcoming shows, can answer questions about visiting, take feedback from members, and sends event cards with direct booking links.
            </p>
          </div>

          <button
            onClick={reset}
            style={{ alignSelf: "flex-start", fontSize: 13, color: "#aaa", background: "none", border: "none", cursor: "pointer", letterSpacing: "-0.01em", padding: 0 }}
          >
            ↺ Start over
          </button>
        </div></div>


        {/* Phone */}
        <div className="flex w-full justify-center lg:justify-start order-2">
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
