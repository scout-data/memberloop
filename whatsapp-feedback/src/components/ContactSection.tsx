"use client";

import { useState } from "react";

export function ContactSection() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Something went wrong");
      setSubmitted(true);
    } catch {
      setError("Sorry, something went wrong. Try emailing ben@crowdloop.co directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="contact"
      style={{ background: "#FBFAF7", position: "relative", overflow: "hidden", padding: "100px 40px 112px" }}
    >
      <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>

        {/* Heading */}
        <h2 style={{
          fontSize: 64,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#111",
          marginBottom: 20,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Let&apos;s talk.
        </h2>

        <p style={{
          fontSize: 18,
          color: "#505050",
          letterSpacing: "-0.01em",
          marginBottom: 48,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          lineHeight: 1.4,
        }}>
          Leave your email and we&apos;ll be in touch.
        </p>

        {/* Email form */}
        {submitted ? (
          <div style={{
            marginBottom: 48,
            padding: "20px",
            color: "#003014",
            fontSize: 17,
            letterSpacing: "-0.01em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Thanks, we&apos;ll be in touch soon.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 520, margin: "0 auto 48px" }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourclub.co.uk"
              required
              style={{
                flex: "1 1 200px",
                background: "#fff",
                border: "1px solid #EEE7DB",
                borderRadius: 999,
                padding: "14px 20px",
                fontSize: 15,
                color: "#111",
                outline: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "-0.01em",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#232323",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "14px 26px",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "-0.01em",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Sending…" : "Send it →"}
            </button>
          </form>
        )}

        {error && (
          <p style={{ fontSize: 14, color: "#c0392b", marginTop: -32, marginBottom: 48, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: 15, color: "#505050", letterSpacing: "-0.01em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          or{" "}
          <a
            href="https://calendar.app.google/1GNDjzUQB2YtX4Lj6"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#003014", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            book a call directly
          </a>
          .
        </p>


      </div>
    </section>
  );
}
