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
    title: "We optimize around the clock — every hour",
    bullets: [
      "The AI scans every campaign every hour — not just when you remember to check",
      "Winning ads get more budget automatically; underperformers get paused immediately",
      "At 2am on a Sunday, if CPL spikes the AI catches it and acts before you wake up",
      "Choose guardrails mode (you approve) or full autonomous mode (AI executes instantly)",
    ],
  },
  {
    word: "Report.",
    icon: "📊",
    title: "We report what matters",
    bullets: [
      "Weekly performance reports delivered to WhatsApp or your team's Slack — no login required",
      "Agencies: reports auto-post to a dedicated Slack channel so your whole team is always in the loop",
      "Full dashboard with 30-day trends, campaign breakdowns, and ROAS tracking",
      "Client-ready reports generated automatically — no manual exports, no copy-pasting",
    ],
  },
  {
    word: "Oversee.",
    icon: "🔭",
    title: "You stay in control — from anywhere",
    bullets: [
      "Reply in WhatsApp or Slack to control the AI: \"pause that campaign\", \"scale the winner\", \"what's my CPL?\"",
      "The AI executes instantly — no dashboard login needed, works from your phone",
      "Approve or reject any recommendation before it executes",
      "Set CPL caps, ROAS targets, and frequency limits per client or campaign",
    ],
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: T.bg }}>
      <style>{`
        .how-step {
          background: #161820;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 28px 32px;
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 32px;
          align-items: start;
        }
        .how-bullets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
        }
        .how-callout {
          margin-top: 48px;
          background: #161820;
          border: 1px solid rgba(245,166,35,0.15);
          border-radius: 14px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        @media (max-width: 640px) {
          .how-step {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 22px 20px;
          }
          .how-bullets {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .how-callout {
            padding: 22px 20px;
            flex-direction: column;
            align-items: flex-start;
          }
          .how-callout a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            How it works
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            Launch. Manage. Optimize. Report. Oversee.
          </h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Whether you run your own ads or manage them for dozens of clients — Buena Onda handles the full lifecycle so you don&apos;t have to.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((step, i) => (
            <div key={step.word} className="how-step">
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
                <div className="how-bullets">
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
        <div className="how-callout">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Already running ads — or managing them for clients?
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              Connect your existing accounts. Buena Onda audits what&apos;s working, fixes what&apos;s not, and scales winners across every client.
            </div>
          </div>
          <a href="/demo" style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
            Try the live demo →
          </a>
        </div>

      </div>
    </section>
  );
}
