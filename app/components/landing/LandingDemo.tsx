"use client";

import { useState } from "react";

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

type Message = { role: "user" | "ai"; text: string };

const DEMO_FLOWS: Record<string, { messages: Message[]; summary: string }> = {
  leadgen: {
    summary: "Lead Gen Campaign",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I run a roofing company. I want to get more leads." },
      { role: "ai", text: "Perfect. What's your monthly ad budget and which cities are you targeting?" },
      { role: "user", text: "About $3,000/month. I'm in Phoenix and Scottsdale." },
      { role: "ai", text: "Got it. I'll target homeowners 35–65 in Phoenix Metro. Storm season is active — I'll lead with an 'emergency roof repair' angle. What's your typical lead cost goal?" },
      { role: "user", text: "Under $40 per lead ideally." },
      { role: "ai", text: "That's very achievable. I'm setting up 3 ad sets: storm damage urgency, free inspection offer, and a testimonial carousel. I'll launch tomorrow morning and optimize daily. Want me to send you a WhatsApp update each morning with results?" },
      { role: "user", text: "Yes please!" },
      { role: "ai", text: "✅ Campaign ready to launch. I'll target 180k homeowners, run 9 creatives, and aim for $28 CPL. You'll get a morning briefing every day at 8am. Approve to go live →" },
    ],
  },
  ecomm: {
    summary: "E-Commerce / ROAS",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I sell supplements online. We want to scale revenue." },
      { role: "ai", text: "Love it. Are you tracking purchases with a Meta pixel? And what's your current ROAS target?" },
      { role: "user", text: "Yes, pixel is installed. I want at least 3x ROAS." },
      { role: "ai", text: "I see your pixel data — your best-performing product is your protein bundle. I'll build a DPA retargeting campaign for cart abandoners and a prospecting campaign targeting fitness enthusiasts 25–45. What's the monthly budget?" },
      { role: "user", text: "Start with $5k/month." },
      { role: "ai", text: "Smart. I'll split $3k prospecting / $2k retargeting. Retargeting typically runs 6–8x ROAS. I'll scale the winners weekly and kill anything below 2x after 5 days. Ready to launch?" },
      { role: "user", text: "Let's do it." },
      { role: "ai", text: "✅ Launching 2 campaigns, 6 ad sets, 14 creatives. DPA catalog connected. I'll optimize bids daily and report every Monday. Projected Month 1 ROAS: 3.4x based on your pixel history." },
    ],
  },
  audit: {
    summary: "Campaign Audit",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I'm already running ads but they're not performing well." },
      { role: "ai", text: "Let me audit your account. I can see 4 active campaigns. Your CPL went from $31 to $67 over the last 30 days. Want to know why?" },
      { role: "user", text: "Yes, what's happening?" },
      { role: "ai", text: "3 issues: (1) Creative fatigue — your top ad has been running 47 days, CTR dropped 60%. (2) Audience overlap — 3 of your 4 ad sets are targeting the same people. (3) Budget imbalance — 70% on a broad campaign that's only converting at 12%." },
      { role: "user", text: "How do we fix it?" },
      { role: "ai", text: "Here's my plan: Pause the fatigued creatives today. Consolidate overlapping ad sets into 2 clean audiences. Reallocate budget 50/50 between your top-performing lookalike and a new retargeting campaign. I can execute this now — approve?" },
      { role: "user", text: "Yes, do it." },
      { role: "ai", text: "✅ Done. 3 creatives paused, ad sets consolidated, budgets reallocated. I'll monitor for 72 hours and report back. Based on your historic data, expect CPL to drop back to $32–$38 within a week." },
    ],
  },
};

export default function LandingDemo() {
  const [activeFlow, setActiveFlow] = useState<keyof typeof DEMO_FLOWS>("leadgen");
  const [visibleCount, setVisibleCount] = useState(2);
  const flow = DEMO_FLOWS[activeFlow];

  function handleFlowChange(key: keyof typeof DEMO_FLOWS) {
    setActiveFlow(key);
    setVisibleCount(2);
  }

  function nextMessage() {
    setVisibleCount(c => Math.min(c + 1, flow.messages.length));
  }

  const visible = flow.messages.slice(0, visibleCount);
  const done = visibleCount >= flow.messages.length;

  return (
    <section id="demo" style={{ padding: "100px 24px", background: T.surfaceAlt }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            Live demo
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            Watch the AI in action
          </h2>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto 12px", lineHeight: 1.7 }}>
            See how the AI handles real agency scenarios — or explore the full live dashboard below.
          </p>
          <a href="/demo" style={{ display: "inline-block", padding: "9px 22px", borderRadius: 8, background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", color: T.accent, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Explore the full demo dashboard →
          </a>
        </div>

        {/* Scenario tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {(Object.keys(DEMO_FLOWS) as Array<keyof typeof DEMO_FLOWS>).map(key => (
            <button
              key={key}
              onClick={() => handleFlowChange(key)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: activeFlow === key ? "1px solid rgba(245,166,35,0.5)" : `1px solid ${T.border}`,
                background: activeFlow === key ? T.accentBg : "transparent",
                color: activeFlow === key ? T.accent : T.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {DEMO_FLOWS[key].summary}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          {/* Chat header */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Buena Onda AI</div>
              <div style={{ fontSize: 11, color: T.healthy, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.healthy, display: "inline-block" }} />
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: "24px 20px", minHeight: 320, display: "flex", flexDirection: "column", gap: 16 }}>
            {visible.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%",
                  padding: "11px 16px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "rgba(245,166,35,0.15)" : T.surfaceAlt,
                  border: msg.role === "user" ? "1px solid rgba(245,166,35,0.25)" : `1px solid ${T.border}`,
                  fontSize: 13,
                  color: msg.role === "user" ? T.accent : T.text,
                  lineHeight: 1.6,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            {!done ? (
              <button
                onClick={nextMessage}
                style={{ flex: 1, padding: "11px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              >
                {flow.messages[visibleCount]?.role === "user" ? "Continue conversation →" : "See AI response →"}
              </button>
            ) : (
              <div style={{ flex: 1, display: "flex", gap: 10 }}>
                <button
                  onClick={() => setVisibleCount(2)}
                  style={{ flex: 1, padding: "11px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ↩ Restart
                </button>
                <a
                  href="/sign-up?redirect_url=%2Fdashboard%3Fdemo%3D1"
                  style={{ flex: 1, padding: "11px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none", textAlign: "center" }}
                >
                  Start Free →
                </a>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: T.faint, marginTop: 16 }}>
          This is a demo — the real AI connects to your live ad accounts and campaigns.
        </p>
      </div>
    </section>
  );
}
