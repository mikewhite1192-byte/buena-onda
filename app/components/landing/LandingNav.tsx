"use client";

import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const T = {
  bg: "#0d0f14",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
};

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .nav-desktop-links { display: flex; align-items: center; gap: 20px; }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; color: #8b8fa8; font-size: 20px; line-height: 1; }
        .nav-mobile-menu { display: none; }
        @media (max-width: 640px) {
          .nav-desktop-links { display: none; }
          .nav-hamburger { display: flex; align-items: center; justify-content: center; }
          .nav-mobile-menu {
            position: fixed; top: 60px; left: 0; right: 0; z-index: 49;
            background: rgba(13,15,20,0.98); border-bottom: 1px solid rgba(255,255,255,0.08);
            padding: 12px 24px 20px; flex-direction: column; gap: 0;
            backdrop-filter: blur(12px);
          }
          .nav-mobile-menu.is-open { display: flex; }
          .nav-mobile-link {
            padding: 14px 0; font-size: 15px; color: #8b8fa8; text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.05); display: block;
          }
          .nav-mobile-cta {
            margin-top: 16px; display: block; text-align: center;
            padding: 13px 20px; border-radius: 10px;
            background: linear-gradient(135deg,#f5a623,#f76b1c);
            color: #0d0f14; font-size: 14px; font-weight: 800; text-decoration: none;
          }
          .nav-mobile-signin {
            margin-top: 10px; display: block; text-align: center;
            padding: 13px 20px; border-radius: 10px;
            border: 1px solid rgba(245,166,35,0.25);
            color: #f5a623; font-size: 14px; font-weight: 700; text-decoration: none;
          }
        }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(13,15,20,0.85)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`, padding: "0 24px",
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Buena Onda
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop-links">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{l.label}</a>
          ))}
          <SignedOut>
            <Link href="/sign-in" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>Log in</Link>
            <Link href="/#pricing" style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Start Free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            style={{ fontFamily: "inherit" }}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div className={`nav-mobile-menu${open ? " is-open" : ""}`}>
        {NAV_LINKS.map(l => (
          <a key={l.label} href={l.href} className="nav-mobile-link" onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <SignedOut>
          <Link href="/#pricing" className="nav-mobile-cta" onClick={() => setOpen(false)}>
            Start Free Trial →
          </Link>
          <Link href="/sign-in" className="nav-mobile-signin" onClick={() => setOpen(false)}>
            Log in
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="nav-mobile-cta" onClick={() => setOpen(false)}>
            Dashboard →
          </Link>
        </SignedIn>
      </div>
    </>
  );
}
