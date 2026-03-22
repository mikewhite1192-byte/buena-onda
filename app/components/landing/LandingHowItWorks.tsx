"use client";

const T = {
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
  bg: "#0d0f14",
};

const STEPS = [
  {
    n: "01",
    title: "Connect your Meta account",
    desc: "Link your Facebook ad account in 60 seconds. No complex setup — Buena Onda reads your campaigns, pixels, and audience data automatically.",
    icon: "🔗",
  },
  {
    n: "02",
    title: "Tell us your goal",
    desc: "Lead gen, e-commerce, brand awareness — pick your objective and set a budget. The AI handles strategy, targeting, and creative direction.",
    icon: "🎯",
  },
  {
    n: "03",
    title: "AI launches your campaigns",
    desc: "Buena Onda writes ad copy, selects audiences, sets bids, and goes live. Every decision is logged so you always know what's happening and why.",
    icon: "🚀",
  },
  {
    n: "04",
    title: "Optimize around the clock",
    desc: "The agent monitors performance 24/7, shifts budget to winning ads, pauses underperformers, and flags creative fatigue before it hurts your results.",
    icon: "⚡",
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: T.bg }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            How it works
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            From zero to running campaigns in minutes
          </h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            No agency. No guesswork. No wasted spend. Just an AI that runs your ads like a senior media buyer.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ position: "relative" }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", top: 32, left: "calc(50% + 40px)", right: "-50%", height: 1, background: `linear-gradient(90deg, rgba(245,166,35,0.3), transparent)`, display: "none" }} />
              )}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 24px", height: "100%", transition: "border-color 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>{step.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.08em" }}>{step.n}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div style={{ marginTop: 48, background: T.surface, border: `1px solid rgba(245,166,35,0.15)`, borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Already running Meta ads?
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              Connect your existing account. Buena Onda analyzes what's working and optimizes from day one.
            </div>
          </div>
          <a href="/sign-up" style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
            Start Free Trial →
          </a>
        </div>
      </div>
    </section>
  );
}
