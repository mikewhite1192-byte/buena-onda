"use client";

import { useState } from "react";
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
const TOUR_STEPS = [
  {
    id: "tour-welcome",
    icon: "👋",
    title: "Welcome to Buena Onda",
    body: "This is your AI-powered ad management dashboard. We're going to walk you through the highlights — it only takes 60 seconds.",
    highlight: null,
  },
  {
    id: "tour-stats",
    icon: "📊",
    title: "Everything at a glance",
    body: "See total spend, leads, and account health across every client — Meta, Google, and TikTok — all in one number.",
    highlight: "tour-stat-strip",
  },
  {
    id: "tour-alerts",
    icon: "🔴",
    title: "The AI catches problems first",
    body: "Before you even open the app, the AI has already flagged what needs your attention. No more finding out a campaign failed days later.",
    highlight: "tour-alerts",
  },
  {
    id: "tour-recs",
    icon: "⚡",
    title: "One-click AI actions",
    body: "The agent doesn't just tell you what's wrong — it tells you exactly what to do. Approve it with one click and it executes immediately.",
    highlight: "tour-recs",
  },
  {
    id: "tour-clients",
    icon: "🏢",
    title: "Every client, one view",
    body: "Lead gen and ecommerce clients side by side. CPL, ROAS, spend, and health status — no tab-switching, no manual reporting.",
    highlight: "tour-clients",
  },
  {
    id: "tour-agent",
    icon: "🤖",
    title: "Your AI works while you sleep",
    body: "The agent runs 24/7 — scaling winners, pausing losers, flagging fatigue, and sending you morning briefings via WhatsApp.",
    highlight: "tour-agent",
  },
  {
    id: "tour-cta",
    icon: "🚀",
    title: "Ready to connect your accounts?",
    body: "This is real software, running on real data. Connect your ad accounts and the AI gets to work immediately — no setup required.",
    highlight: null,
  },
];

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
  const [tourStep, setTourStep] = useState(0);
  const [tourDone, setTourDone] = useState(false);
  const isTourActive = !tourDone;
  const step = TOUR_STEPS[tourStep];
  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  function nextStep() {
    if (isLastStep) { setTourDone(true); return; }
    setTourStep(s => s + 1);
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
    if (!isTourActive || step.highlight !== id) return {};
    return {
      outline: `2px solid ${T.accent}`,
      outlineOffset: 4,
      borderRadius: 10,
      boxShadow: `0 0 0 4px rgba(245,166,35,0.15)`,
      transition: "outline 0.3s, box-shadow 0.3s",
    };
  }

  return (
    <>
      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(245,166,35,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(245,166,35,0.08); }
        }
        .tour-highlight {
          animation: tourPulse 2s ease-in-out infinite;
        }
        @keyframes ctaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text, paddingBottom: 80 }}>

        {/* ── Demo banner ── */}
        <div style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0d0f14" }}>
            🎯 Live demo — the actual Buena Onda dashboard with sample agency data. No sign-up needed.
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", textDecoration: "none" }}>← Back to site</Link>
            <Link href="/sign-up" style={{ fontSize: 12, fontWeight: 800, color: "#f76b1c", background: "#0d0f14", padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>
              Start Free →
            </Link>
          </div>
        </div>

        {/* ── Top nav ── */}
        <div style={{ height: 52, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 0, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff", boxShadow: `0 3px 10px ${T.accentGlow}` }}>B</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-0.3px" }}>Buena Onda</span>
          </div>

          <nav style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(label => (
              <button key={label} style={{ padding: "5px 13px", fontSize: 12, borderRadius: 6, border: "none", fontFamily: "inherit", background: label === "Overview" ? T.accentBg : "transparent", color: label === "Overview" ? T.accent : T.muted, fontWeight: label === "Overview" ? 600 : 400, cursor: "default" }}>
                {label}
              </button>
            ))}
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

          <Link href="/sign-up" style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", textDecoration: "none", whiteSpace: "nowrap" }}>
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
            <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
              {["Today", "7d", "30d", "90d", "Max"].map(label => (
                <button key={label} style={{ padding: "4px 11px", fontSize: 12, borderRadius: 6, border: "none", cursor: "default", fontFamily: "inherit", fontWeight: label === "30d" ? 700 : 400, background: label === "30d" ? T.accent : "transparent", color: label === "30d" ? "#fff" : T.muted }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat strip */}
          <div id="tour-stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28, ...highlightStyle("tour-stat-strip") }}>
            {[
              { label: "Total Spend (30d)", value: `$${totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `across ${clients.length} accounts`, color: T.text, border: T.border },
              { label: "Leads (30d)", value: String(totalLeadsAll), sub: `${clients.filter(c=>c.vertical==="leads").length} lead gen accounts`, color: T.leads, border: T.leads + "30" },
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
              <div id="tour-clients" style={{ ...highlightStyle("tour-clients") }}>
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
              <div id="tour-recs" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", ...highlightStyle("tour-recs") }}>
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
              <div id="tour-agent" style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "16px", ...highlightStyle("tour-agent") }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 14 }}>Agent Status</div>
                {[
                  { label: "Accounts monitored", value: `${clients.length} / ${clients.length}` },
                  { label: "Accounts connected",  value: `${clients.length} / ${clients.length}` },
                  { label: "Accounts healthy",    value: `${Object.values(CLIENT_STATUS).filter(s=>s==="healthy").length} / ${clients.length}` },
                  { label: "Needing attention",   value: String(attentionCount), warn: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.warn ? T.warning : T.text }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <Link href="/sign-up" style={{ display: "block", textAlign: "center" as const, padding: "9px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
                    Connect your account →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Tour card (floating, bottom-left) ── */}
        {isTourActive && (
          <div
            key={tourStep}
            style={{
              position: "fixed",
              bottom: 24,
              left: 24,
              width: 360,
              background: "#13151d",
              border: `1px solid rgba(245,166,35,0.3)`,
              borderRadius: 14,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              zIndex: 1000,
              overflow: "hidden",
              animation: "tourFadeIn 0.35s ease both",
            }}
          >
            {/* Progress bar */}
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
              <div style={{ height: "100%", width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%`, background: "linear-gradient(90deg,#f5a623,#f76b1c)", transition: "width 0.4s ease" }} />
            </div>

            <div style={{ padding: "20px 22px" }}>
              {/* Step header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{step.icon}</span>
                  <span style={{ fontSize: 11, color: T.faint, fontWeight: 500 }}>
                    {tourStep + 1} of {TOUR_STEPS.length}
                  </span>
                </div>
                <button
                  onClick={() => setTourDone(true)}
                  style={{ fontSize: 11, color: T.faint, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 6px" }}
                >
                  Skip tour
                </button>
              </div>

              {/* Content */}
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.3px" }}>{step.title}</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 18 }}>{step.body}</div>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setTourStep(i)}
                    style={{ width: i === tourStep ? 20 : 6, height: 6, borderRadius: 3, background: i === tourStep ? T.accent : i < tourStep ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.25s" }}
                  />
                ))}
              </div>

              {/* Actions */}
              {isLastStep ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link
                    href="/sign-up"
                    style={{ display: "block", textAlign: "center" as const, padding: "12px", borderRadius: 9, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                  >
                    Start Free →
                  </Link>
                  <button
                    onClick={() => setTourDone(true)}
                    style={{ width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Keep exploring
                  </button>
                </div>
              ) : (
                <button
                  onClick={nextStep}
                  style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {tourStep === 0 ? "Start tour →" : "Next →"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Sticky CTA bar (shows after tour is done) ── */}
        {tourDone && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "rgba(13,15,20,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(245,166,35,0.2)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "ctaSlideUp 0.4s ease both" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Ready to run your ads on autopilot?</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Connect your accounts and the AI gets to work immediately.</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>← Back to site</Link>
              <Link
                href="/sign-up"
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
