"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

const T = {
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  bg: "#0d0f14",
  healthy: "#2ecc71",
};

const PLANS = [
  {
    name: "Starter",
    price: 97,
    priceId: "price_1TDsTU2LedSrht7tPlVdEkEM",
    spend: "Up to $10k/mo ad spend",
    desc: "Perfect for small businesses ready to put their ad campaigns on autopilot.",
    features: [
      "AI campaign creation & launch",
      "Daily automated optimization",
      "Lead gen & e-commerce support",
      "WhatsApp &amp; Slack performance reports",
      "Up to 5 active campaigns",
      "Client dashboard access",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Growth",
    price: 197,
    priceId: "price_1TDsV42LedSrht7tW379Owbh",
    spend: "Up to $50k/mo ad spend",
    desc: "For growing businesses ready to scale their ad results.",
    features: [
      "Everything in Starter",
      "Unlimited active campaigns",
      "Creative fatigue detection",
      "A/B testing automation",
      "ROAS & CPL goal tracking",
      "Priority AI optimization",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Agency",
    price: 397,
    priceId: "price_1TDsW92LedSrht7tspIcI8Td",
    spend: "Up to $150k/mo ad spend",
    desc: "For agencies and power users managing multiple clients.",
    features: [
      "Everything in Growth",
      "Multi-client management",
      "Client memory & strategies",
      "White-label reporting",
      "Dedicated AI agent per client",
      "Advanced campaign analytics",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: false,
  },
];

export default function LandingPricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  async function checkout(plan: typeof PLANS[0]) {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/#pricing")}`;
      return;
    }
    setLoading(plan.name);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, planName: plan.name }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(null);
      }
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  }

  return (
    <section id="pricing" style={{ padding: "100px 24px", background: T.bg }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            Pricing
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            Simple pricing. No surprises.
          </h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            All plans include a 14-day free trial. Cancel anytime. No setup fees.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? T.surfaceAlt : T.surface,
                border: plan.highlight ? "1px solid rgba(245,166,35,0.35)" : `1px solid ${T.border}`,
                borderRadius: 16,
                padding: "32px 28px",
                position: "relative",
              }}
            >
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", background: "linear-gradient(135deg,#f5a623,#f76b1c)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#0d0f14", whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: T.text, letterSpacing: "-2px" }}>${plan.price}</span>
                  <span style={{ fontSize: 14, color: T.faint }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 10 }}>{plan.spend}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{plan.desc}</div>
              </div>

              <button
                onClick={() => checkout(plan)}
                disabled={loading === plan.name}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: plan.highlight ? "none" : "1px solid rgba(245,166,35,0.35)",
                  background: plan.highlight ? "linear-gradient(135deg,#f5a623,#f76b1c)" : T.accentBg,
                  color: plan.highlight ? "#0d0f14" : T.accent,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading === plan.name ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  marginBottom: 24,
                  opacity: loading === plan.name ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {loading === plan.name ? "Loading..." : `${plan.cta} →`}
              </button>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: T.healthy, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise note */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: T.faint }}>
            Spending over $150k/month?{" "}
            <a href="mailto:hello@buenaonda.ai" style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>
              Contact us for Enterprise pricing →
            </a>
          </p>
          <p style={{ fontSize: 12, color: T.faint, marginTop: 8 }}>
            Card required to start trial · Billed monthly · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
