"use client";

import { useState } from "react";
import { CrowdloopLogo } from "./CrowdloopLogo";

type Page = "home" | "pricing" | "contact" | "demo";

export function Nav({ active, transparent }: { active?: Page; transparent?: boolean }) {
  const [open, setOpen] = useState(false);

  function handleWhoClick(e: React.MouseEvent) {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  }

  const linkBase = transparent
    ? "text-white/80 hover:text-white"
    : "text-text-secondary hover:text-text-primary";

  const activeLink = transparent ? "text-white font-medium" : "text-text-primary font-medium";

  return (
    <>
      <nav className={`w-full px-6 lg:px-10 h-[80px] flex items-center sticky top-0 z-50 transition-colors ${transparent ? "bg-transparent" : "bg-surface-primary/90 backdrop-blur-sm"}`}>
        <a href="/">
          <CrowdloopLogo color={transparent ? "#ffffff" : "#003014"} />
        </a>

        {/* Desktop links — centred */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-6">
          <a href="/#how-it-works" className={`text-[14px] transition-colors tracking-[-0.01em] ${linkBase}`}>How it works</a>
          <a href="/demo"           className={`text-[14px] tracking-[-0.01em] transition-colors ${active === "demo"    ? activeLink : linkBase}`}>Try it</a>
          <a href="/pricing"        className={`text-[14px] tracking-[-0.01em] transition-colors ${active === "pricing" ? activeLink : linkBase}`}>Pricing</a>
          <a href="/contact"        className={`text-[14px] tracking-[-0.01em] transition-colors ${active === "contact" ? activeLink : linkBase}`}>Contact</a>
        </div>

        {/* Desktop CTA */}
        <a
          href="/contact"
          className={`hidden lg:inline-flex text-[13px] font-medium px-4 py-2 rounded-full transition-colors tracking-[-0.01em] ${
            transparent
              ? "bg-white/15 text-white hover:bg-white/25 border border-white/30"
              : "bg-action-primary text-text-on-dark hover:bg-[#111]"
          }`}
        >
          Get started →
        </a>

        {/* Burger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px]"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className={`block w-5 h-[1.5px] origin-center transition-all duration-200 ${transparent ? "bg-white" : "bg-text-primary"} ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
          <span className={`block w-5 h-[1.5px] transition-all duration-200 ${transparent ? "bg-white" : "bg-text-primary"} ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-[1.5px] origin-center transition-all duration-200 ${transparent ? "bg-white" : "bg-text-primary"} ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-x-0 top-[80px] bottom-0 z-40 bg-surface-primary flex flex-col px-6 pt-8 pb-12 transition-all duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="flex flex-col gap-1">
          {([
            { label: "How it works", href: "/#how-it-works" },
            { label: "Try it", href: "/demo"          },
            { label: "Pricing", href: "/pricing"      },
            { label: "Contact", href: "/contact"      },
          ] as { label: string; href: string; onClick?: (e: React.MouseEvent) => void }[]).map(({ label, href, onClick: extraOnClick }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => { extraOnClick?.(e); setOpen(false); }}
              className="text-[28px] font-light tracking-[-0.03em] text-text-primary py-3 border-b border-border-warm"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="/contact"
            onClick={() => setOpen(false)}
            className="inline-flex items-center bg-action-primary text-text-on-dark text-[15px] font-medium px-6 py-3 rounded-full tracking-[-0.01em]"
          >
            Get started →
          </a>
        </div>
      </div>
    </>
  );
}
