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
    word: "Launch.",
    icon: "🚀",
    title: "We launch your campaigns",
    bullets: [
      "Tell the AI your goal, budget, and target audience",
      "It writes ad copy, selects audiences, and sets bidding strategy",
      "Campaigns go live with creatives structured for lead gen or e-commerce",
      "Every decision is logged — you always see exactly what launched and why",
    ],
  },
  {
    word: "Manage.",
    icon: "🎛️",
    title: "We manage every detail",
    bullets: [
      "All your campaigns and ad sets in one dashboard — Meta, Google, and TikTok in one place",
      "Budget pacing tracked daily so you never over or underspend",
      "The AI handles ad set structure, audience overlaps, and scheduling",
      "Agencies: manage every client from a single view with per-client rules",
    ],
  },
  {
    word: "Optimize.",
    icon: "⚡",
    title: "We optimize around the clock",
    bullets: [
      "The agent monitors performance every day — not just when you remember to check",
      "Winning ads get more budget automatically; underperformers get paused",
      "Creative fatigue is caught early before your CPL spikes",
      "A/B tests run continuously — the AI learns what works and doubles down",
    ],
  },
  {
    word: "Report.",
    icon: "📊",
    title: "We report what matters",
    bullets: [
      "Plain-English morning briefings via WhatsApp — spend, leads, and CPL at a glance",
      "Full dashboard with 30-day trends, campaign breakdowns, and ROAS tracking",
      "Client-ready reports generated automatically — no manual exports",
      "Every AI action is logged with a reason so you're never in the dark",
    ],
  },
  {
    word: "Oversee.",
    icon: "🔭",
    title: "You stay in control",
    bullets: [
      "Approve or reject any AI recommendation before it executes",
      "Set CPL caps, ROAS targets, and frequency limits per client or campaign",
      "Get alerted instantly when something needs your attention",
      "Connect your own ad accounts — your data, your accounts, always",
    ],
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: T.bg }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            How it works
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            Launch. Manage. Optimize. Report. Oversee.
          </h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Whether you run your own ads or manage them for dozens of clients — Buena Onda handles the full lifecycle so you don&apos;t have to.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.word}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "28px 32px",
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 32,
                alignItems: "start",
              }}
            >
              {/* Left: word + icon */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: "0.06em", marginBottom: 8 }}>
                  0{i + 1}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.accent, letterSpacing: "-1px", lineHeight: 1, marginBottom: 10 }}>
                  {step.word}
                </div>
                <div style={{ fontSize: 22 }}>{step.icon}</div>
              </div>

              {/* Right: title + bullets */}
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 16px", letterSpacing: "-0.3px" }}>
                  {step.title}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {step.bullets.map(b => (
                    <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: T.accent, fontSize: 12, flexShrink: 0, marginTop: 2 }}>→</span>
                      <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div style={{ marginTop: 48, background: T.surface, border: "1px solid rgba(245,166,35,0.15)", borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Already running ads — or managing them for clients?
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              Connect your existing accounts. Buena Onda audits what&apos;s working, fixes what&apos;s not, and scales winners across every client.
            </div>
          </div>
          <a href="/demo-login" style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
            Try the live demo →
          </a>
        </div>

      </div>
    </section>
  );
}
