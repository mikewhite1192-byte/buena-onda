"use client";

// app/components/CookieConsent.tsx
// Minimum-viable cookie consent banner. Shown on every public page until the
// visitor sets `bo_consent`. Middleware reads this cookie and only writes
// non-essential cookies (analytics _bv, affiliate bo_ref) when consent === "all".

import { useEffect, useState } from "react";

const COOKIE = "bo_consent";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsent(value: "all" | "essential") {
  // 6 months. SameSite=Lax so the cookie travels on top-level nav.
  const oneEightyDays = 60 * 60 * 24 * 180;
  document.cookie = `${COOKIE}=${value}; Max-Age=${oneEightyDays}; Path=/; SameSite=Lax; Secure`;
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!getCookie(COOKIE)) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 720,
        margin: "0 auto",
        background: "#161820",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ flex: "1 1 280px", color: "#e8eaf0", fontSize: 13, lineHeight: 1.5 }}>
        We use a small set of cookies to keep you signed in and to understand how the
        site is used.{" "}
        <a href="/privacy-policy" style={{ color: "#f5a623" }}>
          Details
        </a>
        .
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => {
            setConsent("essential");
            setShow(false);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "transparent",
            color: "#8b8fa8",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Essential only
        </button>
        <button
          onClick={() => {
            setConsent("all");
            setShow(false);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #f5a623, #f76b1c)",
            color: "#0d0f14",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
