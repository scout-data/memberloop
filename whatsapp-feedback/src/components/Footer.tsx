const FOOTER_LINKS = [
  { label: "Privacy",  href: "#"         },
  { label: "Contact",  href: "/contact"  },
  { label: "Try it",   href: "/demo"     },
];

export function Footer() {
  return (
    <footer style={{ background: "#003014", position: "relative", overflow: "hidden" }}>

      {/* Dot grid — top left */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 160, height: 100,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1.2px, transparent 1.2px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "20px 18px",
        pointerEvents: "none",
      }} />

      {/* Large watermark */}
      <div style={{ padding: "72px 0 68px", overflow: "hidden", pointerEvents: "none", userSelect: "none" }}>
        <span style={{
          display: "block",
          paddingLeft: 40,
          fontSize: "clamp(96px, 14vw, 220px)",
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 0.88,
          color: "rgba(255,255,255,0.07)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          whiteSpace: "nowrap",
        }}>
          crowdloop
        </span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "0 40px" }} />

      {/* Bottom strip */}
      <div style={{
        padding: "22px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 28 }}>
          {FOOTER_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                letterSpacing: "-0.01em",
                textDecoration: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <span style={{
          color: "rgba(255,255,255,0.28)",
          fontSize: 14,
          letterSpacing: "-0.01em",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          © 2026 Distil Technology Limited t/a crowdloop
        </span>
      </div>

    </footer>
  );
}
