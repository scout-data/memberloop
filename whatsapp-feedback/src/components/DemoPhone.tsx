"use client";

import React from "react";
import { DemoMessage, CardData } from "@/lib/demoModes";

// ─── WhatsApp Rich Card ───────────────────────────────────────────────────────

export function WhatsAppCard({ card, onCta }: { card: CardData; onCta?: (cta: string) => void; }) {
  return (
    <div style={{
      width: 220, borderRadius: 8, overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      background: "#fff",
    }}>
      <div style={{ height: 130, position: "relative", overflow: "hidden", background: "#1a1a1a" }}>
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #4a90a4 0%, #5ba3b8 35%, #2d6e3e 35%, #1a5c35 100%)" }}>
            <div style={{ position: "absolute", top: 14, right: 18, width: 22, height: 22, borderRadius: "50%", background: "#FFD97D", boxShadow: "0 0 10px rgba(255,217,125,0.6)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, width: 36, height: 14, borderRadius: 99, background: "rgba(255,255,255,0.55)" }} />
            <div style={{ position: "absolute", top: 20, left: 24, width: 28, height: 12, borderRadius: 99, background: "rgba(255,255,255,0.45)" }} />
            <div style={{ position: "absolute", bottom: 0, left: "30%", width: "40%", height: "55%", background: "rgba(255,255,255,0.06)", borderRadius: "50% 50% 0 0" }} />
            <div style={{ position: "absolute", bottom: 18, left: "50%", marginLeft: -1, width: 2, height: 38, background: "#fff" }} />
            <div style={{ position: "absolute", bottom: 54, left: "50%", marginLeft: 1, width: 0, height: 0, borderLeft: "14px solid #e53e3e", borderTop: "8px solid transparent", borderBottom: "8px solid transparent" }} />
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 16, height: 5, borderRadius: "50%", background: "rgba(0,0,0,0.25)" }} />
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px 6px", height: 72, overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2, lineHeight: "17px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{card.title}</div>
        <div style={{ fontSize: 11, color: "#667781", lineHeight: "15px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{card.detail}</div>
      </div>
      <div style={{ height: 1, background: "#F0F0F0", margin: "0 10px" }} />
      <a
        href={card.url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onCta?.(card.cta)}
        style={{ width: "100%", padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "none", border: "none", cursor: "pointer", textDecoration: "none" }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="#00A67E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#00A67E" }}>{card.cta}</span>
      </a>
    </div>
  );
}

// ─── Demo Phone ───────────────────────────────────────────────────────────────

export function DemoPhone({ messages, input, loading, chatRef, inputRef, onInput, onKey, onSend, onCardCta, showPrompt, readOnly, venueLogoUrl, venueName }: {
  messages: DemoMessage[];
  input?: string;
  loading?: boolean;
  chatRef: React.RefObject<HTMLDivElement>;
  inputRef?: React.RefObject<HTMLInputElement>;
  onInput?: (v: string) => void;
  onKey?: (e: React.KeyboardEvent) => void;
  onSend?: () => void;
  onCardCta?: (cta: string) => void;
  showPrompt?: boolean;
  readOnly?: boolean;
  venueLogoUrl?: string;
  venueName?: string;
}) {
  return (
    <div style={{
      width: 300, height: 620, borderRadius: 48,
      border: "2px solid #2a2a2e", background: "#1C1C1E",
      padding: "5px 5px 5px 4px",
      display: "flex", flexDirection: "column",
      boxShadow: "0 32px 64px rgba(0,0,0,0.35)", flexShrink: 0,
    }}>
      <div style={{
        flex: 1, borderRadius: 44, overflow: "hidden",
        position: "relative", display: "flex", flexDirection: "column", background: "#fff",
      }}>
        {/* Dynamic Island */}
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 112, height: 30, background: "#000", borderRadius: 999, zIndex: 10 }} />

        {/* Status bar */}
        <div style={{ height: 52, background: "#fff", flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 6px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#000", fontFamily: "inherit" }}>15:30</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#000"/>
              <path d="M4.5 7.2A5 5 0 0 1 8 6a5 5 0 0 1 3.5 1.2" stroke="#000" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M1.5 4.5A9 9 0 0 1 8 2a9 9 0 0 1 6.5 2.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <div style={{ width: 22, height: 11, borderRadius: 3, border: "1.2px solid #000", padding: "1.5px" }}>
                <div style={{ width: "65%", height: "100%", background: "#000", borderRadius: 1.5 }} />
              </div>
              <div style={{ width: 2, height: 5, background: "#000", borderRadius: 1 }} />
            </div>
          </div>
        </div>

        {/* WA Header */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #E8E8E8", padding: "7px 10px", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 1, marginRight: 6 }}>
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
              <path d="M7 1L1 6.5L7 12" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: "#007AFF", fontSize: 14, fontFamily: "inherit" }}>6</span>
          </div>
          <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={venueLogoUrl ?? "/wembley-fireworks.webp"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#000", fontFamily: "inherit" }}>{venueName ?? "Tottenham Hotspur Stadium"}</span>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="10" cy="10" r="10" fill="#1DA1F2"/>
                <path d="M5.5 10L8.5 13L14.5 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 10, color: "#8E8E93", fontFamily: "inherit" }}>online</div>
          </div>
        </div>

        {/* Chat area */}
        <div ref={chatRef} style={{ flex: 1, background: "#ECE5DD", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#667781", background: "rgba(255,255,255,0.5)", borderRadius: 99, padding: "1px 8px" }}>Today</span>
          </div>

          {messages.map((msg, i) => {
            const right = msg.role === "user";

            if (msg.carousel && msg.carousel.length > 0) {
              return (
                <div key={i} style={{ animation: "fadeSlideIn 0.25s ease" }}>
                  {msg.content ? (
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
                      <div style={{ background: "#fff", borderRadius: "2px 12px 12px 12px", padding: "5px 8px 4px", maxWidth: "80%", boxShadow: "0 1px 1px rgba(0,0,0,0.1)", fontFamily: "Helvetica Neue, Arial, sans-serif", fontSize: 13, lineHeight: "19px", color: "#111", whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : null}
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
                    {msg.carousel.map((card, j) => (
                      <div key={j} style={{ flexShrink: 0, width: 220 }}>
                        <WhatsAppCard card={card} onCta={onCardCta} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (msg.card) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start", animation: "fadeSlideIn 0.25s ease" }}>
                  <WhatsAppCard card={msg.card} onCta={onCardCta} />
                </div>
              );
            }
            return (
              <div key={i} style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start", animation: "fadeSlideIn 0.25s ease" }}>
                <div style={{
                  background: right ? "#DCF8C6" : "#fff",
                  borderRadius: right ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                  padding: "5px 8px 4px", maxWidth: "80%",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                  fontFamily: "Helvetica Neue, Arial, sans-serif",
                  fontSize: 13, lineHeight: "19px", color: "#111",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", animation: "fadeSlideIn 0.2s ease" }}>
              <div style={{ background: "#fff", borderRadius: "2px 12px 12px 12px", padding: "8px 12px", boxShadow: "0 1px 1px rgba(0,0,0,0.1)", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9BA8B0", animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Type prompt */}
        {!readOnly && showPrompt && messages.length === 1 && !loading && (
          <div style={{ textAlign: "center", padding: "6px 8px 4px", background: "#ECE5DD" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "#8b0000", borderRadius: 999, padding: "4px 12px", fontFamily: "Helvetica Neue, Arial, sans-serif", display: "inline-block", animation: "nudge 1.6s ease-in-out infinite" }}>
              Type your reply below
            </span>
          </div>
        )}

        {/* Input bar */}
        {!readOnly && (
          <div style={{ background: "#F0F2F5", padding: "7px 8px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1, background: "#fff", borderRadius: 999, padding: "0 10px", display: "flex", alignItems: "center", animation: !input && !loading ? "inputPulse 2s ease-in-out infinite" : "none" }}>
              <input
                ref={inputRef}
                type="text"
                value={input ?? ""}
                onChange={e => onInput?.(e.target.value)}
                onKeyDown={onKey}
                placeholder="Message"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, color: "#111", padding: "6px 0", fontFamily: "Helvetica Neue, Arial, sans-serif", caretColor: "#111" }}
              />
            </div>
            <button
              onClick={onSend}
              disabled={!input?.trim() || loading}
              style={{ width: 30, height: 30, borderRadius: "50%", background: input?.trim() && !loading ? "#25D366" : "#C8C8C8", border: "none", cursor: input?.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
