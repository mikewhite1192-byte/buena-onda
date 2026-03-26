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
  bg: "#0d0f14",
};

const FAQS = [
  {
    q: "Do I need to know anything about running ads?",
    a: "No. Buena Onda handles everything — campaign setup, targeting, bidding, creative direction, and optimization across Meta, Google, and TikTok. You just tell the AI your goal and budget. It handles the rest.",
  },
  {
    q: "What does the 14-day free trial include?",
    a: "Full access to everything on your chosen plan — AI campaign creation, optimization, WhatsApp and Slack reports, and the full dashboard. No feature restrictions. Your card is charged after 14 days. Cancel any time before then and you're never billed.",
  },
  {
    q: "What ad spend limits apply to each plan?",
    a: "Starter: up to $10k/month. Growth: up to $50k/month. Agency: up to $150k/month. Spending more? Email hello@buenaonda.ai for enterprise pricing.",
  },
  {
    q: "How does the AI actually optimize campaigns?",
    a: "The agent checks campaign performance daily — adjusting bids, pausing underperforming ads, shifting budget to winners, and flagging creative fatigue. Every action is logged so you can see exactly what changed and why.",
  },
  {
    q: "Will I lose control of my ad account?",
    a: "Never. You approve everything before it goes live (or set auto-approve if you prefer). You can pause the AI, override any decision, or disconnect anytime. Your ad account stays yours.",
  },
  {
    q: "What business types does it work for?",
    a: "Lead gen businesses (roofing, solar, HVAC, real estate, insurance, etc.) and e-commerce brands both work great. If you're running Meta ads to generate leads or sales, Buena Onda is built for you.",
  },
  {
    q: "Does it work for agencies managing multiple clients?",
    a: "Yes — the Agency plan is built specifically for this. Each client gets their own AI agent, their own metrics dashboard, and their own optimization rules. You manage everything from one place. No more tab-switching or manual reporting.",
  },
  {
    q: "Does it work with existing campaigns?",
    a: "Yes. Connect your account and the AI audits your existing campaigns immediately — identifying what's working, what's wasting money, and what to fix. You can keep running existing campaigns alongside new AI-built ones.",
  },
  {
    q: "Is my ad account data secure?",
    a: "Yes. We use read/write access scoped specifically to your ad accounts — we can't access anything outside your campaigns. All data is encrypted in transit and at rest.",
  },
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: "100px 24px", background: T.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: "1px solid rgba(245,166,35,0.3)", borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px" }}>
            Common questions
          </h2>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{ background: T.surface, border: `1px solid ${open === i ? "rgba(245,166,35,0.25)" : T.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", padding: "18px 22px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 16, fontFamily: "inherit" }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text, textAlign: "left", lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: T.accent, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 22px 18px" }}>
                  <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: T.faint }}>
            Still have questions?{" "}
            <a href="mailto:hello@buenaonda.ai" style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>
              hello@buenaonda.ai
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
