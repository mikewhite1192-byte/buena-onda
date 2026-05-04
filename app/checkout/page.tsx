"use client";

// app/checkout/page.tsx
// Auto-fires Stripe checkout after sign-up so the user never has to click the pricing page twice.
// URL: /checkout?priceId=price_xxx&planName=Starter
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const T = {
  bg: "#0d0f14",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  accent: "#f5a623",
};

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // React 18 Strict Mode mounts effects twice in dev, and Suspense re-renders
  // can re-fire on prop changes. A ref guard prevents two checkout sessions
  // from being created for one click.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const priceId = searchParams.get("priceId");
    const planName = searchParams.get("planName") ?? "";

    if (!priceId) {
      window.location.href = "/#pricing";
      return;
    }

    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, planName }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("Could not start checkout. Please try again.");
        }
      })
      .catch(() => setError("Could not start checkout. Please try again."));
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'DM Mono', 'Fira Mono', monospace",
    }}>
      {error ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: T.muted, marginBottom: 16 }}>{error}</div>
          <a href="/#pricing" style={{ fontSize: 13, color: T.accent }}>← Back to pricing</a>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: T.muted }}>Setting up your account…</div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutRedirect />
    </Suspense>
  );
}
