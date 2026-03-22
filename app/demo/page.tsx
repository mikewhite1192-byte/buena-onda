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

// ── Pre-compute demo metrics for all clients ───────────────────────────────────
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

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text }}>

      {/* ── Demo banner ── */}
      <div style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0d0f14" }}>
          🎯 Live demo — this is the actual Buena Onda dashboard with sample agency data. No sign-up needed.
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", textDecoration: "none" }}>← Back to site</Link>
          <Link href="/sign-up" style={{ fontSize: 12, fontWeight: 800, color: "#f76b1c", background: "#0d0f14", padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* ── Top nav (exact dashboard match) ── */}
      <div style={{ height: 52, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 0, position: "sticky", top: 0, zIndex: 100 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff", boxShadow: `0 3px 10px ${T.accentGlow}` }}>B</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-0.3px" }}>Buena Onda</span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(label => (
            <button
              key={label}
              style={{
                padding: "5px 13px", fontSize: 12, borderRadius: 6, border: "none", fontFamily: "inherit",
                background: label === "Overview" ? T.accentBg : "transparent",
                color: label === "Overview" ? T.accent : T.muted,
                fontWeight: label === "Overview" ? 600 : 400,
                cursor: "default",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Client switcher */}
        <div style={{ position: "relative", marginRight: 16 }}>
          <button
            onClick={() => setShowSwitcher(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: showSwitcher ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", color: T.text, fontFamily: "inherit", fontSize: 12, fontWeight: 500, minWidth: 160 }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.leads, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{activeClient}</span>
            <span style={{ color: T.faint, fontSize: 9, marginLeft: "auto" }}>▾</span>
          </button>
          {showSwitcher && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 340, overflowY: "auto" }}>
              {clients.map(c => (
                <div
                  key={c.meta_ad_account_id}
                  onClick={() => { setActiveClient(c.name); setShowSwitcher(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", background: activeClient === c.name ? "rgba(245,166,35,0.08)" : "transparent", borderLeft: activeClient === c.name ? `2px solid ${T.accent}` : "2px solid transparent" }}
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

        {/* Help */}
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "default", marginRight: 14, padding: "4px 6px", borderRadius: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, lineHeight: 1 }}>?</span>
          <span style={{ fontSize: 9, color: T.faint, letterSpacing: "0.3px" }}>Help</span>
        </button>

        {/* Sign up CTA instead of UserButton */}
        <Link href="/sign-up" style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", textDecoration: "none", whiteSpace: "nowrap" }}>
          Sign Up Free
        </Link>
      </div>

      {/* ── Main content (exact dashboard padding) ── */}
      <div style={{ padding: "26px 28px", background: T.bg, minHeight: "calc(100vh - 94px)" }}>

        {/* Greeting + date range */}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Spend (30d)", value: `$${totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `across ${clients.length} accounts`, color: T.text, border: T.border },
            { label: "Leads (30d)", value: String(totalLeadsAll), sub: `${clients.filter(c=>c.vertical==="leads").length} lead gen accounts`, color: T.leads, border: T.leads + "30" },
            { label: "Needing Attention", value: String(attentionCount), sub: "2 critical", color: T.warning, border: T.warning + "40" },
            { label: "FB Connected", value: `${clients.length} / ${clients.length}`, sub: "all connected", color: T.healthy, border: T.healthy + "30" },
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

          {/* Left: alerts + client cards */}
          <div>
            {/* Alerts */}
            <div style={{ marginBottom: 16 }}>
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

            {/* Client accounts header */}
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

            {/* Client cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {clients.map(c => (
                <ClientCard
                  key={c.meta_ad_account_id}
                  name={c.name}
                  accountId={c.meta_ad_account_id}
                  vertical={c.vertical}
                  onSelect={() => { setActiveClient(c.name); }}
                />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Recommendations */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Recommendations</div>
                {visibleRecs.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.critical, borderRadius: 10, padding: "1px 7px" }}>{visibleRecs.length}</span>
                )}
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
                { label: "FB connected",        value: `${clients.length} / ${clients.length}` },
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
    </div>
  );
}
