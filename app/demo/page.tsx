"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEMO_CLIENTS_CONFIG, getDemoSummary, getDemoCampaigns } from "@/lib/demo-data";

// ── Exact dashboard theme ──────────────────────────────────────────────────────
const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentGlow: "rgba(245,166,35,0.2)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.1)",
  warning: "#e8b84b",
  warningBg: "rgba(232,184,75,0.1)",
  critical: "#ff4d4d",
  criticalBg: "rgba(255,77,77,0.1)",
  leads: "#7b8cde",
  leadsBg: "rgba(123,140,222,0.1)",
  ecomm: "#c07ef0",
  ecommBg: "rgba(192,126,240,0.1)",
};

const NAV_ITEMS = ["Overview", "Campaigns", "Clients", "Creatives", "Ads", "Reports", "Review", "History"];

const CLIENT_STATUS: Record<string, "healthy" | "warning" | "critical"> = {
  act_demo_roofing:   "healthy",
  act_demo_dental:    "warning",
  act_demo_ecomm:     "healthy",
  act_demo_solar:     "critical",
  act_demo_hvac:      "healthy",
  act_demo_legal:     "warning",
  act_demo_realty:    "healthy",
  act_demo_remodel:   "healthy",
  act_demo_auto:      "healthy",
  act_demo_insurance: "warning",
  act_demo_beauty:    "healthy",
  act_demo_supps:     "healthy",
  act_demo_homegood:  "warning",
  act_demo_fitness:   "healthy",
  act_demo_finance:   "critical",
};

const STATUS_CONFIG = {
  healthy:  { color: T.healthy,  bg: T.healthyBg,  label: "Healthy" },
  warning:  { color: T.warning,  bg: T.warningBg,  label: "Needs attention" },
  critical: { color: T.critical, bg: T.criticalBg, label: "Critical" },
  no_data:  { color: T.faint,    bg: "rgba(90,94,114,0.1)", label: "No data" },
};

const ALERTS = [
  { severity: "error" as const,   clientName: "Pacific Solar",      message: "$310 spent, 0 leads this week" },
  { severity: "error" as const,   clientName: "Crestwood Financial", message: "$380 spent, 0 leads — all campaigns paused" },
  { severity: "warning" as const, clientName: "Bright Smile Dental", message: "Creative fatigue — 4.1x frequency on retargeting" },
  { severity: "warning" as const, clientName: "Coastal Insurance",    message: "CPL at $68 — above $50 target" },
];

const RECS = [
  { id: "r1", priority: "critical" as const, icon: "🚨", title: "Spending with no leads",      body: "Pacific Solar spent $310 with zero leads. Pause top campaign now.", approveLabel: "Pause Campaign" },
  { id: "r2", priority: "critical" as const, icon: "🚨", title: "Zero conversions",            body: "Crestwood Financial — $380 spend, 0 leads. All ad sets paused pending review.", approveLabel: "Review Account" },
  { id: "r3", priority: "warning"  as const, icon: "😴", title: "Ad fatigue detected",         body: "Bright Smile Dental retargeting at 4.1x frequency. Rotate creative.", approveLabel: "Pause Ad Set" },
  { id: "r4", priority: "info"     as const, icon: "📈", title: "Scale opportunity",           body: "Summit Roofing 'Storm Damage' at $31 CPL. Increase budget 20%.", approveLabel: "Increase Budget 20%" },
  { id: "r5", priority: "info"     as const, icon: "📈", title: "Strong ROAS — scale budget",  body: "Urban Threads DPA at 4.1x ROAS. +$100/day while signal is strong.", approveLabel: "Scale Budget" },
];

// ── Tour steps ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 10;
const STEPS: Record<number, { title: string; body: string; label: string; highlightId?: string; tab?: string; openCreator?: boolean; centered?: boolean }> = {
  1: { title: "Your Agency Command Center", label: `1 / ${TOTAL_STEPS}  ·  Overview`, body: "Live spend, leads, ROAS, and account health across all your clients at a glance. Critical accounts automatically surface to the top.", highlightId: "tour-overview-stats" },
  2: { title: "Anomaly Alerts", label: `2 / ${TOTAL_STEPS}  ·  Alerts`, body: "The AI monitors every account 24/7. The moment something breaks — CPL spike, zero leads, budget overpacing — it flags it here with one-click actions.", highlightId: "tour-alerts" },
  3: { title: "AI Recommendations", label: `3 / ${TOTAL_STEPS}  ·  Recommendations`, body: "Ranked, actionable suggestions — pause a fatigued ad, scale a winner, fix audience overlap. Each one has a one-click approve or dismiss right on the card.", highlightId: "tour-recommendations" },
  4: { title: "Client Account Cards", label: `4 / ${TOTAL_STEPS}  ·  Clients`, body: "Every client's status at a glance — spend, leads, ROAS, and health indicator. Blue is lead gen, purple is e-commerce. Click any card to drill in.", highlightId: "tour-client-accounts" },
  5: { title: "Build an Ad in 60 Seconds", label: `5 / ${TOTAL_STEPS}  ·  Ad Builder`, body: "Tell the AI your offer, audience, and budget — one question at a time. It writes the copy, sets up targeting, and presents everything for your approval before anything goes live.", tab: "ads", openCreator: true, highlightId: "tour-ads-create" },
  6: { title: "Performance Charts", label: `6 / ${TOTAL_STEPS}  ·  Campaigns`, body: "Click 'Show Charts ↗' to see any metric over time — spend, CPL, ROAS, CTR, frequency. Switch metrics with the dropdown. Spot trends before they become problems.", tab: "campaigns", highlightId: "tour-chart-toggle" },
  7: { title: "Shareable Client Reports", label: `7 / ${TOTAL_STEPS}  ·  Share`, body: "Click '↗ Share Report' to generate a read-only link for your client — clean performance view, no login required, no access to settings or other accounts.", highlightId: "tour-share-report" },
  8: { title: "Automated Reports", label: `8 / ${TOTAL_STEPS}  ·  Reports`, body: "Weekly and monthly reports auto-generated per client. Ask the AI anytime — 'send me this week's report' — and it delivers a full performance snapshot ready to share.", tab: "reports" },
  9: { title: "Your AI Is Always Here", label: `9 / ${TOTAL_STEPS}  ·  AI Assistant`, body: "The ✦ button is always here — on every page. Ask about your campaigns, get help building an ad, request a performance summary, or just ask how to navigate the platform.", highlightId: "tour-agent-btn" },
  10: { title: "You're All Set 🎉", label: `10 / ${TOTAL_STEPS}  ·  Ready`, body: "That's the full picture. Start your free trial and run your first real campaign — connect your ad account and the AI takes it from there.", centered: true },
};

// ── Campaign builder panel ─────────────────────────────────────────────────────

const BUSINESS_TYPES = ["Roofing / Home Services", "Real Estate", "Insurance", "Dental / Medical", "Solar", "Ecommerce / DTC", "Fitness / Wellness", "Finance / Legal", "Other"];
const PLATFORMS = [
  { name: "Meta", color: "#4a90d9" },
  { name: "Google", color: "#34a853" },
  { name: "TikTok", color: "#ff2d6b" },
];

const AI_BUILD_STEPS = [
  { label: "Analyzing your business type & goals", duration: 700 },
  { label: "Selecting optimal audiences & targeting", duration: 900 },
  { label: "Structuring ad sets & budget splits", duration: 800 },
  { label: "Writing ad copy & creative briefs", duration: 1000 },
  { label: "Setting CPL targets & scaling rules", duration: 600 },
];

function CampaignBuilderPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "building" | "done">("form");
  const [businessType, setBusinessType] = useState("Roofing / Home Services");
  const [platforms, setPlatforms] = useState<string[]>(["Meta"]);
  const [budget, setBudget] = useState("3000");
  const [goal, setGoal] = useState("leads");
  const [cplTarget, setCplTarget] = useState("35");
  const [buildProgress, setBuildProgress] = useState(0);

  function togglePlatform(name: string) {
    setPlatforms(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  }

  function startBuild() {
    setStep("building");
    setBuildProgress(0);
    let elapsed = 0;
    AI_BUILD_STEPS.forEach((s, idx) => {
      elapsed += s.duration;
      setTimeout(() => {
        setBuildProgress(idx + 1);
        if (idx === AI_BUILD_STEPS.length - 1) {
          setTimeout(() => setStep("done"), 400);
        }
      }, elapsed);
    });
  }

  // Derived preview values
  const monthlyBudget = parseInt(budget) || 3000;
  const isLeads = goal === "leads";
  const platformList = platforms.join(" + ") || "Meta";
  const adSets = platforms.length === 1 ? 3 : platforms.length === 2 ? 4 : 5;
  const creatives = adSets * 3;

  return (
    <>
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes buildFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#13151d", borderLeft: `1px solid rgba(245,166,35,0.2)`, zIndex: 1200, overflow: "auto", animation: "panelSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>
              {step === "form" ? "Launch a New Campaign" : step === "building" ? "AI is building your campaign…" : "Campaign Ready ✓"}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              {step === "form" ? "Tell the AI what you want — it handles the rest" : step === "building" ? "This takes about 5 seconds in real life" : "Review and launch when ready"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: T.muted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

          {/* ── STEP 1: FORM ── */}
          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Business type */}
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Business Type</div>
                <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                  {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Platforms */}
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Platforms</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const active = platforms.includes(p.name);
                    return (
                      <button key={p.name} onClick={() => togglePlatform(p.name)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${active ? p.color + "60" : T.border}`, background: active ? p.color + "15" : "transparent", color: active ? p.color : T.faint, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal */}
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Campaign Goal</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ value: "leads", label: "🎯 Lead Gen" }, { value: "sales", label: "🛒 Ecommerce" }].map(g => (
                    <button key={g.value} onClick={() => setGoal(g.value)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${goal === g.value ? T.accent + "60" : T.border}`, background: goal === g.value ? T.accentBg : "transparent", color: goal === g.value ? T.accent : T.faint, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget + Target */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>Monthly Budget ($)</div>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }} placeholder="3000" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>{isLeads ? "CPL Target ($)" : "ROAS Target"}</div>
                  <input type="number" value={cplTarget} onChange={e => setCplTarget(e.target.value)} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }} placeholder={isLeads ? "35" : "3.5"} />
                </div>
              </div>

              {/* Preview estimate */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 12 }}>What the AI will build</div>
                {[
                  { label: "Platforms", value: platformList },
                  { label: "Ad sets", value: `${adSets} (split by audience + intent)` },
                  { label: "Creatives queued", value: `${creatives} (hooks, carousels, testimonials)` },
                  { label: "Daily budget", value: `$${Math.round(monthlyBudget / 30)}/day` },
                  { label: `${isLeads ? "CPL" : "ROAS"} target`, value: isLeads ? `$${cplTarget} per lead` : `${cplTarget}x return` },
                  { label: "Auto-optimize", value: "Daily — 24/7" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={startBuild}
                disabled={platforms.length === 0}
                style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: platforms.length === 0 ? "rgba(245,166,35,0.2)" : "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, cursor: platforms.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                Build with AI →
              </button>
            </div>
          )}

          {/* ── STEP 2: BUILDING ── */}
          {step === "building" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ textAlign: "center" as const, padding: "24px 0 20px" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", border: `3px solid rgba(245,166,35,0.2)`, borderTop: `3px solid ${T.accent}`, margin: "0 auto 16px", animation: "spin 0.9s linear infinite" }} />
                <div style={{ fontSize: 14, color: T.muted }}>Building your campaign…</div>
              </div>
              {AI_BUILD_STEPS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.surface, borderRadius: 8, border: `1px solid ${buildProgress > i ? "rgba(46,204,113,0.2)" : T.border}`, animation: buildProgress > i ? "buildFadeIn 0.3s ease" : "none" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{buildProgress > i ? "✓" : buildProgress === i ? "⟳" : "○"}</span>
                  <span style={{ fontSize: 12, color: buildProgress > i ? T.healthy : buildProgress === i ? T.accent : T.faint }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 3: DONE ── */}
          {step === "done" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.healthy, marginBottom: 4 }}>✓ Campaign built and ready to launch</div>
                <div style={{ fontSize: 12, color: T.muted }}>{businessType} · {platformList} · ${Math.round(monthlyBudget / 30)}/day</div>
              </div>

              {/* Ad sets */}
              <div>
                <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 10 }}>Ad Sets Created</div>
                {[
                  { name: `${businessType.split("/")[0].trim()} | Broad Intent`, budget: Math.round(monthlyBudget * 0.4 / 30), audience: "Homeowners 35–65 · 25mi radius" },
                  { name: `${businessType.split("/")[0].trim()} | Retargeting`, budget: Math.round(monthlyBudget * 0.3 / 30), audience: "Website visitors · 30d window" },
                  { name: `${businessType.split("/")[0].trim()} | Lookalike 1%`, budget: Math.round(monthlyBudget * 0.3 / 30), audience: "Based on your best customers" },
                ].slice(0, adSets > 3 ? 3 : adSets).map((a, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{a.name}</span>
                      <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>${a.budget}/day</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.faint }}>{a.audience}</div>
                  </div>
                ))}
              </div>

              {/* Creatives */}
              <div>
                <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 10 }}>Creative Briefs Generated</div>
                {[
                  { type: "Video Hook", desc: "iPhone-style, raw footage — problem/solution format", count: Math.ceil(creatives / 3) },
                  { type: "Image Carousel", desc: "Before/after or feature highlights — 5 cards", count: Math.floor(creatives / 3) },
                  { type: "Testimonial", desc: "Social proof — customer result + photo", count: Math.floor(creatives / 3) },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, minWidth: 18, textAlign: "center" as const }}>{c.count}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.type}</div>
                      <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rules */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 10 }}>AI Rules Set</div>
                {[
                  { label: isLeads ? "Pause if CPL exceeds" : "Pause if ROAS drops below", value: isLeads ? `$${Math.round(parseInt(cplTarget) * 1.4)}` : `${(parseFloat(cplTarget) * 0.6).toFixed(1)}x` },
                  { label: isLeads ? "Scale if CPL under" : "Scale if ROAS above", value: isLeads ? `$${cplTarget}` : `${cplTarget}x` },
                  { label: "Creative fatigue threshold", value: "3.0x frequency" },
                  { label: "Morning WhatsApp report", value: "8:00am daily" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{r.label}</span>
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <Link href="/#pricing" style={{ display: "block", textAlign: "center" as const, padding: "14px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
                Start Free — launch your first campaign →
              </Link>
              <button onClick={() => setStep("form")} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                ← Try different settings
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.4px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? T.text, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ClientCard({ name, accountId, vertical, onSelect }: { name: string; accountId: string; vertical: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const status = CLIENT_STATUS[accountId] ?? "healthy";
  const st = STATUS_CONFIG[status];
  const isLeads = vertical === "leads";
  const isCritical = status === "critical";

  const summary = getDemoSummary(accountId) as {
    current: { total_spend: string; total_leads: number; avg_cpl: string; active_ad_sets: number };
  };
  const campaigns = getDemoCampaigns(accountId, 30) as Array<{ spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; status: string }>;
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = summary.current.total_leads;
  const avgCPL = parseFloat(summary.current.avg_cpl);
  const totalPurchases = campaigns.reduce((s, c) => s + (c.purchases ?? 0), 0);
  const totalPurchaseValue = campaigns.reduce((s, c) => s + (c.purchase_value ?? 0), 0);
  const avgROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
  const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const alert = status === "critical" ? "Campaigns paused — needs attention" : status === "warning" ? "Above CPL target — review recommended" : null;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.accent + "50" : isCritical ? T.critical + "30" : T.border}`,
        borderRadius: 10, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alert ? 6 : 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: isLeads ? T.leads : T.ecomm, background: isLeads ? T.leadsBg : T.ecommBg, padding: "2px 7px", borderRadius: 4 }}>
            {isLeads ? "Lead Gen" : "Ecommerce"}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, padding: "3px 9px", borderRadius: 5 }}>{st.label}</span>
      </div>
      {alert && <div style={{ fontSize: 12, color: st.color, marginBottom: 12, paddingLeft: 15 }}>! {alert}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {isLeads ? (
          <>
            <MetricBox label="CPL" value={avgCPL > 0 ? `$${avgCPL.toFixed(0)}` : "—"} sub="cost per lead" color={avgCPL > 50 ? T.warning : T.healthy} />
            <MetricBox label="Leads (30d)" value={String(totalLeads)} sub="from ads" />
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="total spend" />
            <MetricBox label="Campaigns" value={String(campaigns.length)} sub="with data" />
          </>
        ) : (
          <>
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="total spend" />
            <MetricBox label="ROAS" value={avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"} sub="return on ad spend" color={avgROAS >= 2 ? T.healthy : avgROAS > 0 ? T.warning : undefined} />
            <MetricBox label="Purchases (30d)" value={String(totalPurchases)} sub="conversions" />
            <MetricBox label="CPA" value={avgCPA > 0 ? `$${avgCPA.toFixed(0)}` : "—"} sub="cost per acq." />
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>View Account →</span>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const clients = [...DEMO_CLIENTS_CONFIG];
  const [activeClient, setActiveClient] = useState(clients[0].name);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);

  // Tour state
  const [step, setStep] = useState(1);
  const [tourActive, setTourActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "ads" | "campaigns" | "reports">("overview");
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isTourActive = tourActive;

  function applyStepEffects(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (!cfg) return;
    if (cfg.tab) setActiveTab(cfg.tab as "ads" | "campaigns" | "reports");
    if (cfg.openCreator) setShowBriefPanel(true);
  }
  function applyPrevRoute(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (cfg?.tab) setActiveTab(cfg.tab as "ads" | "campaigns" | "reports");
    else if (targetStep < 5) setActiveTab("overview");
  }
  function handleNext() {
    if (step === TOTAL_STEPS) { setTourActive(false); return; }
    applyStepEffects(step + 1);
    setStep(s => s + 1);
  }
  function handlePrev() {
    applyPrevRoute(step - 1);
    setStep(s => s - 1);
  }

  // Aggregate stats
  const totalSpendAll = clients.reduce((sum, c) => {
    const campaigns = getDemoCampaigns(c.meta_ad_account_id, 30) as Array<{ spend: number }>;
    return sum + campaigns.reduce((s, x) => s + x.spend, 0);
  }, 0);
  const totalLeadsAll = clients.reduce((sum, c) => {
    const s = getDemoSummary(c.meta_ad_account_id) as { current: { total_leads: number } };
    return sum + s.current.total_leads;
  }, 0);
  const attentionCount = Object.values(CLIENT_STATUS).filter(s => s === "critical" || s === "warning").length;
  const visibleRecs = RECS.filter(r => !dismissed.has(r.id));

  function highlightStyle(id: string): React.CSSProperties {
    if (!isTourActive || STEPS[step]?.highlightId !== id) return {};
    return { outline: "2px solid rgba(245,166,35,0.85)", outlineOffset: 6, borderRadius: 10, transition: "outline 0.3s ease" };
  }

  // Active client campaigns for campaigns tab
  const activeClientObj = clients.find(c => c.name === activeClient) ?? clients[0];
  const activeCampaigns = getDemoCampaigns(activeClientObj.meta_ad_account_id, 30) as Array<{ name?: string; spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; status: string }>;

  return (
    <>
      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text, paddingBottom: 80 }}>

        {/* ── Demo banner (sticky) ── */}
        <div style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 101 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0d0f14" }}>
            🎯 Live demo — the actual Buena Onda dashboard with sample agency data. No sign-up needed.
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", textDecoration: "none" }}>← Back to site</Link>
            <Link href="/#pricing" style={{ fontSize: 12, fontWeight: 800, color: "#f76b1c", background: "#0d0f14", padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>
              Start Free →
            </Link>
          </div>
        </div>

        {/* ── Top nav (sticky below banner) ── */}
        <div style={{ height: 52, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 0, position: "sticky", top: 40, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff", boxShadow: `0 3px 10px ${T.accentGlow}` }}>B</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-0.3px" }}>Buena Onda</span>
          </div>

          <nav style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(label => {
              const tab = label === "Overview" ? "overview" : label === "Campaigns" ? "campaigns" : label === "Ads" ? "ads" : label === "Reports" ? "reports" : null;
              const isActive = tab === activeTab;
              const isClickable = !!tab;
              return (
                <button key={label}
                  onClick={() => tab && setActiveTab(tab as "overview" | "ads" | "campaigns" | "reports")}
                  style={{ padding: "5px 13px", fontSize: 12, borderRadius: 6, border: "none", fontFamily: "inherit",
                    background: isActive ? T.accentBg : "transparent",
                    color: isActive ? T.accent : isClickable ? T.muted : T.faint,
                    fontWeight: isActive ? 600 : 400,
                    cursor: isClickable ? "pointer" : "default" }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div style={{ position: "relative", marginRight: 16 }}>
            <button onClick={() => setShowSwitcher(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, background: showSwitcher ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", color: T.text, fontFamily: "inherit", fontSize: 12, fontWeight: 500, minWidth: 160 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.leads, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{activeClient}</span>
              <span style={{ color: T.faint, fontSize: 9, marginLeft: "auto" }}>▾</span>
            </button>
            {showSwitcher && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 340, overflowY: "auto" }}>
                {clients.map(c => (
                  <div key={c.meta_ad_account_id} onClick={() => { setActiveClient(c.name); setShowSwitcher(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", background: activeClient === c.name ? "rgba(245,166,35,0.08)" : "transparent", borderLeft: activeClient === c.name ? `2px solid ${T.accent}` : "2px solid transparent" }}
                    onMouseEnter={e => { if (activeClient !== c.name) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (activeClient !== c.name) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.vertical === "leads" ? T.leads : T.ecomm, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.text }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{c.vertical}</div>
                    </div>
                    {activeClient === c.name && <span style={{ color: T.accent, fontSize: 12 }}>✓</span>}
                  </div>
                ))}
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>Manage clients →</div>
              </div>
            )}
          </div>

          <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "default", marginRight: 14, padding: "4px 6px", borderRadius: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, lineHeight: 1 }}>?</span>
            <span style={{ fontSize: 9, color: T.faint, letterSpacing: "0.3px" }}>Help</span>
          </button>

          <Link href="/#pricing" style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", textDecoration: "none", whiteSpace: "nowrap" }}>
            Start Free
          </Link>
        </div>

        {/* ── Main content ── */}
        <div style={{ padding: "26px 28px", background: T.bg, minHeight: "calc(100vh - 94px)" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Good morning 👋</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                Demo Account · <span style={{ color: T.critical }}>{ALERTS.length} accounts need attention</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
                {["Today", "7d", "30d", "90d", "Max"].map(label => (
                  <button key={label} style={{ padding: "4px 11px", fontSize: 12, borderRadius: 6, border: "none", cursor: "default", fontFamily: "inherit", fontWeight: label === "30d" ? 700 : 400, background: label === "30d" ? T.accent : "transparent", color: label === "30d" ? "#fff" : T.muted }}>
                    {label}
                  </button>
                ))}
              </div>
              <button
                id="tour-ads-create"
                onClick={() => { setActiveTab("ads"); setShowBriefPanel(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}
              >
                + New Campaign
              </button>
            </div>
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <>
              {/* Stat strip */}
              <div id="tour-overview-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28, ...highlightStyle("tour-overview-stats") }}>
                {[
                  { label: "Total Spend (30d)", value: `$${totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `across ${clients.length} accounts`, color: T.text, border: T.border },
                  { label: "Leads (30d)", value: String(totalLeadsAll), sub: `${clients.filter(c => c.vertical === "leads").length} lead gen accounts`, color: T.leads, border: T.leads + "30" },
                  { label: "Needing Attention", value: String(attentionCount), sub: "2 critical", color: T.warning, border: T.warning + "40" },
                  { label: "Accounts Connected", value: `${clients.length} / ${clients.length}`, sub: "all connected", color: T.healthy, border: T.healthy + "30" },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: "18px 20px" }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

                {/* Left */}
                <div>
                  {/* Alerts */}
                  <div id="tour-alerts" style={{ marginBottom: 16, ...highlightStyle("tour-alerts") }}>
                    <div onClick={() => setAlertsCollapsed(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alertsCollapsed ? 0 : 8, cursor: "pointer", userSelect: "none" as const }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Alerts</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: T.critical, borderRadius: 10, padding: "1px 7px" }}>{ALERTS.length}</span>
                      </div>
                      <span style={{ fontSize: 11, color: T.faint }}>{alertsCollapsed ? "▶" : "▼"}</span>
                    </div>
                    {!alertsCollapsed && ALERTS.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, background: a.severity === "error" ? "rgba(255,77,77,0.06)" : "rgba(232,184,75,0.06)", border: `1px solid ${a.severity === "error" ? "rgba(255,77,77,0.2)" : "rgba(232,184,75,0.2)"}`, borderRadius: 8 }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>{a.severity === "error" ? "🔴" : "🟡"}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: a.severity === "error" ? T.critical : T.warning }}>{a.clientName}</span>
                          <span style={{ fontSize: 12, color: T.muted }}> — {a.message}</span>
                        </div>
                        <span style={{ fontSize: 10, color: T.faint }}>→</span>
                      </div>
                    ))}
                  </div>

                  {/* Client accounts */}
                  <div id="tour-client-accounts" style={{ ...highlightStyle("tour-client-accounts") }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Client Accounts</div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: T.leads }} /> Lead Gen
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: T.ecomm }} /> Ecommerce
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                      {clients.map(c => (
                        <ClientCard key={c.meta_ad_account_id} name={c.name} accountId={c.meta_ad_account_id} vertical={c.vertical} onSelect={() => setActiveClient(c.name)} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Recommendations */}
                  <div id="tour-recommendations" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", ...highlightStyle("tour-recommendations") }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Recommendations</div>
                      {visibleRecs.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.critical, borderRadius: 10, padding: "1px 7px" }}>{visibleRecs.length}</span>}
                    </div>
                    {visibleRecs.map((rec, i) => {
                      const borderColor = rec.priority === "critical" ? T.critical : rec.priority === "warning" ? T.warning : T.accent;
                      return (
                        <div key={rec.id} style={{ padding: "12px 16px", borderBottom: i < visibleRecs.length - 1 ? `1px solid ${T.border}` : "none", borderLeft: `3px solid ${borderColor}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{rec.title}</div>
                              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{rec.body}</div>
                            </div>
                          </div>
                          {done.has(rec.id) ? (
                            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 5, background: "rgba(46,204,113,0.12)", color: "#2ecc71", fontSize: 11, fontWeight: 600, textAlign: "center" as const }}>✓ Done — changes applied</div>
                          ) : (
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button onClick={() => setDone(d => new Set([...d, rec.id]))} style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", background: borderColor + "22", color: borderColor, cursor: "pointer", fontFamily: "inherit" }}>
                                {rec.approveLabel}
                              </button>
                              <button onClick={() => setDismissed(d => new Set([...d, rec.id]))} style={{ padding: "5px 8px", fontSize: 11, borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Agent Status */}
                  <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 14 }}>Agent Status</div>
                    {[
                      { label: "Accounts monitored", value: `${clients.length} / ${clients.length}` },
                      { label: "Accounts connected",  value: `${clients.length} / ${clients.length}` },
                      { label: "Accounts healthy",    value: `${Object.values(CLIENT_STATUS).filter(s => s === "healthy").length} / ${clients.length}` },
                      { label: "Needing attention",   value: String(attentionCount), warn: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                        <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.warn ? T.warning : T.text }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14 }}>
                      <Link href="/#pricing" style={{ display: "block", textAlign: "center" as const, padding: "9px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
                        Connect your account →
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* Campaigns tab */}
          {activeTab === "campaigns" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Campaigns</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button id="tour-chart-toggle" onClick={() => setShowCharts(v => !v)}
                    style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer", fontFamily: "inherit", ...highlightStyle("tour-chart-toggle") }}>
                    {showCharts ? "Hide Charts ↙" : "Show Charts ↗"}
                  </button>
                  <button id="tour-share-report"
                    style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer", fontFamily: "inherit", ...highlightStyle("tour-share-report") }}>
                    ↗ Share Report
                  </button>
                </div>
              </div>
              {showCharts && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "24px", marginBottom: 20, textAlign: "center" as const }}>
                  <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Performance Chart — {activeClient}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                    {["Spend", "CPL", "ROAS", "CTR", "Frequency"].map(m => (
                      <button key={m} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: m === "Spend" ? T.accentBg : "transparent", color: m === "Spend" ? T.accent : T.faint, cursor: "pointer", fontFamily: "inherit" }}>{m}</button>
                    ))}
                  </div>
                  <div style={{ height: 120, display: "flex", alignItems: "flex-end", gap: 6, justifyContent: "center" }}>
                    {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                      <div key={i} style={{ width: 32, height: `${h}%`, background: `linear-gradient(180deg, rgba(245,166,35,0.8), rgba(247,107,28,0.4))`, borderRadius: "4px 4px 0 0" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                      <span key={d} style={{ fontSize: 10, color: T.faint, width: 32, textAlign: "center" as const }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                  <div>Campaign</div>
                  <div style={{ textAlign: "right" as const }}>Spend</div>
                  <div style={{ textAlign: "right" as const }}>Leads</div>
                  <div style={{ textAlign: "right" as const }}>CPL</div>
                  <div style={{ textAlign: "right" as const }}>ROAS</div>
                  <div style={{ textAlign: "right" as const }}>Status</div>
                </div>
                {activeCampaigns.slice(0, 8).map((c, i) => {
                  const statusColor = c.status === "active" ? T.healthy : c.status === "paused" ? T.warning : T.faint;
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 0, padding: "12px 16px", borderBottom: i < Math.min(activeCampaigns.length, 8) - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{c.name ?? `Campaign ${i + 1}`}</div>
                      <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>${c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>{c.leads ?? "—"}</div>
                      <div style={{ fontSize: 12, color: c.cpl > 50 ? T.warning : T.muted, textAlign: "right" as const }}>{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</div>
                      <div style={{ fontSize: 12, color: c.roas >= 2 ? T.healthy : T.muted, textAlign: "right" as const }}>{c.roas > 0 ? `${c.roas.toFixed(2)}x` : "—"}</div>
                      <div style={{ textAlign: "right" as const }}><span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: statusColor + "20", padding: "3px 8px", borderRadius: 4 }}>{c.status}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ads tab */}
          {activeTab === "ads" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Ads</div>
                <button
                  id="tour-ads-create"
                  onClick={() => setShowBriefPanel(true)}
                  style={{ fontSize: 12, padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", ...highlightStyle("tour-ads-create") }}
                >
                  + New Campaign
                </button>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "48px", textAlign: "center" as const }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>Build your first campaign</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 20, maxWidth: 380, margin: "0 auto 20px" }}>
                  Tell the AI your offer, audience, and budget. It writes the copy, sets up targeting, and presents everything for your approval.
                </div>
                <button
                  onClick={() => setShowBriefPanel(true)}
                  style={{ fontSize: 13, padding: "12px 28px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Launch with AI →
                </button>
              </div>
            </div>
          )}

          {/* Reports tab */}
          {activeTab === "reports" && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 20 }}>Reports</div>
              {[
                { client: "Summit Roofing Co", type: "Weekly", date: "Mar 17–23, 2025", status: "ready" },
                { client: "Urban Threads", type: "Monthly", date: "February 2025", status: "ready" },
                { client: "Bright Smile Dental", type: "Weekly", date: "Mar 17–23, 2025", status: "generating" },
                { client: "Valley Auto Group", type: "Monthly", date: "February 2025", status: "ready" },
              ].map((r, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.client} — {r.type} Report</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{r.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {r.status === "ready" ? (
                      <button style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: `1px solid rgba(34,197,94,0.3)`, background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontFamily: "inherit" }}>View Report →</button>
                    ) : (
                      <span style={{ fontSize: 11, color: T.muted }}>Generating...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Campaign builder panel ── */}
        {showBriefPanel && <CampaignBuilderPanel onClose={() => setShowBriefPanel(false)} />}

        {/* ── AI button (always visible, bottom-right) ── */}
        <button id="tour-agent-btn" style={{ position: "fixed", bottom: 24, right: 24, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", color: "#0d0f14", fontSize: 18, cursor: "pointer", zIndex: 1001, boxShadow: "0 4px 20px rgba(245,166,35,0.4)", ...highlightStyle("tour-agent-btn") }}>✦</button>

        {/* ── Tour card ── */}
        {isTourActive && mounted && (() => {
          const cfg = STEPS[step];
          const posStyle: React.CSSProperties =
            step === 10 ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2100 } :
            step === 9 ? { position: "fixed", bottom: 32, left: 28, zIndex: 2100 } :
            (step >= 1 && step <= 4) ? { position: "fixed", bottom: 32, left: 28, zIndex: 2100 } :
            { position: "fixed", bottom: 32, right: 32, zIndex: 2100 };

          return (
            <>
              {step === 10 && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2099 }} />}
              <div
                key={step}
                style={{
                  ...posStyle,
                  width: 300,
                  background: "#13151d",
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  animation: "tourFadeIn 0.35s ease both",
                  opacity: mounted ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                {/* Progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${(step / TOTAL_STEPS) * 100}%`, background: "linear-gradient(90deg,#f5a623,#f76b1c)", transition: "width 0.4s ease" }} />
                </div>

                <div style={{ padding: "18px 20px" }}>
                  {/* Label */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: T.faint, fontWeight: 500, letterSpacing: "0.3px" }}>{cfg?.label}</span>
                    <button
                      onClick={() => setTourActive(false)}
                      style={{ fontSize: 10, color: T.faint, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 6px" }}
                    >
                      Skip tour
                    </button>
                  </div>

                  {/* Title + body */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.3px", textAlign: cfg?.centered ? "center" as const : "left" as const }}>{cfg?.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, marginBottom: 16, textAlign: cfg?.centered ? "center" as const : "left" as const }}>{cfg?.body}</div>

                  {/* Progress dots */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 14, justifyContent: cfg?.centered ? "center" : "flex-start" }}>
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                      <div
                        key={i}
                        style={{ width: (i + 1) === step ? 20 : 6, height: 6, borderRadius: 3, background: (i + 1) === step ? T.accent : (i + 1) < step ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.1)", transition: "all 0.25s" }}
                      />
                    ))}
                  </div>

                  {/* Buttons */}
                  {step === TOTAL_STEPS ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Link
                        href="/#pricing"
                        style={{ display: "block", textAlign: "center" as const, padding: "12px", borderRadius: 9, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                      >
                        Start Free — launch your first campaign →
                      </Link>
                      <button
                        onClick={() => setTourActive(false)}
                        style={{ width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Keep exploring
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      {step > 1 && (
                        <button
                          onClick={handlePrev}
                          style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {step === 1 ? "Start tour →" : "Next →"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── Sticky CTA bar (shows after tour is done) ── */}
        {!tourActive && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "rgba(13,15,20,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(245,166,35,0.2)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "ctaSlideUp 0.4s ease both" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Ready to run your ads on autopilot?</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Connect your accounts and the AI gets to work immediately.</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>← Back to site</Link>
              <Link
                href="/#pricing"
                style={{ padding: "10px 28px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}
              >
                Start Free →
              </Link>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
