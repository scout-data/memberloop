import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const PILLARS = [
  {
    num: "01",
    heading: "Branded as you",
    body: "White-label WhatsApp engagement under your venue, festival, or brand name. Fans experience your brand — crowdloop is the engine underneath.",
  },
  {
    num: "02",
    heading: "Network effects across your portfolio",
    body: "Fans who attend one of your venues get matched to others. The more events in your network, the better the recommendations — and the more fans return across your whole operation.",
  },
  {
    num: "03",
    heading: "An audience asset you own",
    body: "Every fan who opts in becomes a direct contact in the world's most-opened messaging app. Not an algorithm's audience. Yours.",
  },
];

const WHO = [
  { label: "Multi-venue operators", detail: "Groups running two or more venues who want a shared audience layer across their portfolio." },
  { label: "Festival and event brands", detail: "Annual events that want to stay in touch with their audience year-round, not just at the gate." },
  { label: "Brand partnerships", detail: "Operators who want a direct, measurable audience asset to bring into commercial partner conversations." },
];

export default function Partnerships() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Nav />

      {/* Hero */}
      <section style={{ background: "#003014", padding: "100px 40px 112px", position: "relative", overflow: "hidden" }}>

        {/* Dot grid */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 320, height: 240,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            marginBottom: 28,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Partnerships
          </p>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 300,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            color: "#fff",
            marginBottom: 32,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Built for operators who run more than one venue
          </h1>

          <p style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            maxWidth: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            crowdloop gives multi-venue operators and event brands a branded WhatsApp engagement product that creates network effects between your venues, artists, and fans.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section style={{ padding: "96px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
          {PILLARS.map(p => (
            <div key={p.num}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#BBBBBB",
                letterSpacing: "-0.01em",
                marginBottom: 20,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {p.num}
              </div>
              <h3 style={{
                fontSize: 24,
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "#111",
                marginBottom: 14,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {p.heading}
              </h3>
              <p style={{
                fontSize: 16,
                color: "#505050",
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #EEE7DB", margin: "0 40px" }} />

      {/* Who it's for */}
      <section style={{ padding: "96px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 300,
          letterSpacing: "-0.03em",
          color: "#111",
          marginBottom: 56,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Who it&apos;s for
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {WHO.map((item, i) => (
            <div key={item.label} style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 40,
              padding: "36px 0",
              borderTop: i === 0 ? "1px solid #EEE7DB" : undefined,
              borderBottom: "1px solid #EEE7DB",
              alignItems: "start",
            }}>
              <h3 style={{
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "#111",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: 0,
              }}>
                {item.label}
              </h3>
              <p style={{
                fontSize: 16,
                color: "#505050",
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: 0,
              }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#FBFAF7", padding: "100px 40px 112px", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{
            fontSize: 52,
            fontWeight: 300,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
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
            lineHeight: 1.5,
            marginBottom: 40,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            If you operate more than one venue or event brand, we&apos;d love to explore what crowdloop looks like inside your network.
          </p>
          <a
            href="mailto:partnerships@crowdloop.co"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#003014",
              color: "#fff",
              borderRadius: 999,
              padding: "16px 32px",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            partnerships@crowdloop.co →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
