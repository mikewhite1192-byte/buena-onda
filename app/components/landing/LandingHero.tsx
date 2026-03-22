"use client";

import Link from "next/link";

const T = {
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
};

const WORDS = ["Launch.", "Manage.", "Optimize.", "Report.", "Oversee."];

export default function LandingHero() {
  return (
    <section style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
        {/* Badge */}
        <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 28 }}>
          AI-Powered Meta Ads Platform
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, color: T.text, margin: "0 0 24px", letterSpacing: "-2px", lineHeight: 1.05 }}>
          The AI agent that{" "}
          <br />
          <span style={{ color: T.accent }}>runs your Meta ads.</span>
        </h1>

        {/* Subheading */}
        <p style={{ fontSize: 18, color: T.muted, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Buena Onda is the autonomous AI agent that runs your Meta ad campaigns — creating, optimizing, and reporting while you focus on growing your business.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <Link href="/sign-up" style={{ padding: "14px 32px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 24px rgba(245,166,35,0.3)" }}>
            Start Free Trial →
          </Link>
          <a href="/sign-up?redirect_url=%2Fdashboard%3Fdemo%3D1" style={{ padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(245,166,35,0.3)", background: T.accentBg, color: T.accent, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            See the Demo
          </a>
        </div>

        <p style={{ fontSize: 12, color: T.faint }}>14-day free trial · No setup fees · Cancel anytime</p>

        {/* Dashboard preview */}
        <div style={{ marginTop: 64, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
          {/* Fake browser bar */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
            <div style={{ flex: 1, margin: "0 16px", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: T.faint, textAlign: "center" }}>
              app.buenaonda.ai/dashboard
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total Spend", value: "$24,840", color: T.accent },
              { label: "Total Leads", value: "847", color: "#2ecc71" },
              { label: "Avg CPL", value: "$29.33", color: T.text },
              { label: "Active Campaigns", value: "12", color: T.text },
            ].map(m => (
              <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "16px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.faint, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Campaigns</div>
              {["Summit Roofing | Storm Season", "Peak Supps | ROAS Scale", "Glow Beauty | DPA"].map((c, i) => (
                <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 11, color: T.muted }}>{c}</span>
                  <span style={{ fontSize: 11, color: "#2ecc71", fontWeight: 600 }}>{["$22 CPL", "4.1x ROAS", "3.6x ROAS"][i]}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.faint, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Agent Activity</div>
              {[
                { action: "Budget increased 20%", time: "2m ago", color: "#2ecc71" },
                { action: "Creative fatigue flagged", time: "1h ago", color: T.accent },
                { action: "New ad created", time: "3h ago", color: T.muted },
              ].map(a => (
                <div key={a.action} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: a.color }}>{a.action}</span>
                  <span style={{ fontSize: 10, color: T.faint }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
