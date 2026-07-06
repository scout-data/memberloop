"use client";

import { useState, useEffect, useRef } from "react";
import { DemoPhone } from "@/components/DemoPhone";
import { DemoMessage, toMessages, DEMO_MODES, DemoModeId } from "@/lib/demoModes";
import { InsightsPanel, ModeInsights } from "@/components/InsightsPanel";

export function HomeDemoSection() {
  const [modeId, setModeId]                     = useState<DemoModeId>("feedback");
  const [messages, setMessages]                 = useState<DemoMessage[]>([]);
  const [input, setInput]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [insights, setInsights]                 = useState<ModeInsights | null>(null);
  const [insightsLoading, setInsightsLoading]   = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeMode = DEMO_MODES.find(m => m.id === modeId)!;

  useEffect(() => {
    setMessages(toMessages(activeMode.initial));
    setInput("");
    setLoading(false);
    setInsights(null);
  }, [modeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function fetchInsights(msgs: DemoMessage[]) {
    if (msgs.filter(m => m.role === "user").length === 0) return;
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, modeId }),
      });
      const data = await res.json();
      if (data.mode) setInsights(data as ModeInsights);
    } catch { /* ignore */ } finally {
      setInsightsLoading(false);
    }
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: DemoMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, system: activeMode.system }),
      });
      const data = await res.json();
      if (data.content) {
        const withReply = [...next, { role: "assistant" as const, content: data.content }];
        setMessages(withReply);
        fetchInsights(withReply);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant" as const, content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <section className="px-6 lg:px-10 pt-8 pb-20 lg:pb-32 max-w-[1328px] mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-[32px] font-light tracking-[-0.03em] text-text-primary">
          Try it yourself
        </h2>
      </div>
      <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-12">

        {/* Left: mode tabs */}
        <div className="w-full lg:flex-1 lg:pt-4 flex flex-col gap-6">
          <div>
            <p className="text-[13px] font-semibold text-text-primary tracking-[-0.01em] mb-4">Features</p>
            <div className="flex flex-col gap-2">
              {DEMO_MODES.map(m => {
                const active = modeId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModeId(m.id)}
                    className={`text-left text-[14px] tracking-[-0.01em] leading-[1.4] px-4 py-3 rounded-xl transition-colors ${
                      active
                        ? "bg-[#232323] text-white"
                        : "text-text-secondary bg-surface-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex justify-center w-full lg:w-auto lg:shrink-0">
          <DemoPhone
            messages={messages}
            input={input}
            loading={loading}
            chatRef={chatRef}
            inputRef={inputRef}
            onInput={setInput}
            onKey={handleKey}
            onSend={() => send(input)}
            onCardCta={(cta) => send(cta)}
            showPrompt={true}
          />
        </div>

        {/* Right: insights */}
        <div className="hidden lg:block lg:flex-1 lg:pt-4">
          <InsightsPanel insights={insights} loading={insightsLoading} />
        </div>

      </div>

    </section>
  );
}
