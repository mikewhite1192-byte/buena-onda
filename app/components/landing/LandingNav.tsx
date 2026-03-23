"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const T = {
  bg: "#0d0f14",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
};

export default function LandingNav() {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(13,15,20,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Buena Onda
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <a href="#how-it-works" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>How it works</a>
        <a href="#pricing" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>Pricing</a>
        <a href="#faq" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>FAQ</a>

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
    </nav>
  );
}
