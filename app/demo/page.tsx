"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_CLIENTS_CONFIG, getDemoSummary, getDemoCampaigns } from "@/lib/demo-data";

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.1)",
  warning: "#e8b84b",
  warningBg: "rgba(232,184,75,0.1)",
  critical: "#ff4d4d",
  criticalBg: "rgba(255,77,77,0.1)",
};

// ── Demo client status logic ───────────────────────────────────────────────────
const STATUS_MAP: Record<string, "healthy" | "warning" | "critical"> = {
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

const STATUS_COLOR = { healthy: T.healthy, warning: T.warning, critical: T.critical };
const STATUS_BG    = { healthy: T.healthyBg, warning: T.warningBg, critical: T.criticalBg };
const STATUS_LABEL = { healthy: "Healthy", warning: "Needs attention", critical: "Critical" };

const AGENT_INSIGHTS: Record<string, { icon: string; priority: "critical"|"warning"|"info"; text: string }[]> = {
  act_demo_solar:   [
    { icon: "🚨", priority: "critical", text: "Pacific Solar spent $310 in the last 7 days with 0 leads. Top campaign paused pending review." },
    { icon: "📉", priority: "warning",  text: "CPL threshold breached for 3 consecutive days. Recommend creative refresh." },
  ],
  act_demo_dental:  [
    { icon: "😴", priority: "warning",  text: "Bright Smile Dental — 'Whitening Retargeting' at 4.1x frequency. Creative fatigue detected." },
    { icon: "📈", priority: "info",     text: "Invisalign campaign CPL improved 18% this week. Budget increase opportunity." },
  ],
  act_demo_finance: [
    { icon: "🚨", priority: "critical", text: "Crestwood Financial — $380 spend, 0 leads. All campaigns paused, awaiting your approval." },
  ],
  act_demo_roofing: [
    { icon: "📈", priority: "info",     text: "Summit Roofing 'Storm Damage Retargeting' at $31 CPL — strong. Budget increased 20%." },
    { icon: "✅", priority: "info",     text: "All campaigns within CPL targets. Scaling prospecting next cycle." },
  ],
  act_demo_ecomm: [
    { icon: "📈", priority: "info",     text: "Urban Threads 'Summer Drop DPA' at 4.1x ROAS — top performer. Scaling $100/day." },
    { icon: "😴", priority: "warning",  text: "Retargeting 7d campaign frequency at 5.2x. Recommend pausing to avoid fatigue." },
  ],
  act_demo_hvac: [
    { icon: "✅", priority: "info",     text: "Apex HVAC both campaigns within CPL target. Seasonal surge detected — recommend +$50/day." },
  ],
};

const DEFAULT_INSIGHTS = [
  { icon: "✅", priority: "info" as const, text: "All campaigns within target. Agent monitoring 24/7." },
  { icon: "📊", priority: "info" as const, text: "Weekly performance report generated and sent." },
];

type Client = typeof DEMO_CLIENTS_CONFIG[number];

function fmt$(n: number) { return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`; }
function fmtCPL(n: number) { return n > 0 ? `$${n.toFixed(0)}` : "—"; }
function fmtROAS(n: number) { return n > 0 ? `${n.toFixed(1)}x` : "—"; }

export default function DemoPage() {
  const clients = [...DEMO_CLIENTS_CONFIG];
  const [activeId, setActiveId] = useState(clients[0].meta_ad_account_id);

  const active = clients.find(c => c.meta_ad_account_id === activeId) ?? clients[0];
  const summary = getDemoSummary(activeId) as {
    current: { total_spend: string; total_leads: number; avg_cpl: string; active_ad_sets: number };
    previous: { total_spend: string; total_leads: number; avg_cpl: string };
  };
  const campaigns = getDemoCampaigns(activeId, 30) as {
    campaign_id: string; campaign_name: string; status: string;
    spend: number; leads: number; cpl: number; purchases: number;
    purchase_value: number; roas: number; frequency: number;
  }[];
  const insights = AGENT_INSIGHTS[activeId] ?? DEFAULT_INSIGHTS;
  const status = STATUS_MAP[activeId] ?? "healthy";
  const isEcomm = active.vertical === "ecomm";

  const spendNum    = parseFloat(summary.current.total_spend);
  const prevSpend   = parseFloat(summary.previous.total_spend);
  const spendDelta  = prevSpend > 0 ? ((spendNum - prevSpend) / prevSpend * 100).toFixed(0) : "0";
  const leadsNum    = summary.current.total_leads;
  const prevLeads   = summary.previous.total_leads;
  const leadsDelta  = prevLeads > 0 ? ((leadsNum - prevLeads) / prevLeads * 100).toFixed(0) : "0";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text }}>

      {/* ── Top CTA banner ── */}
      <div style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0f14" }}>
          🎯 You&apos;re viewing a live demo — this is the actual Buena Onda dashboard with sample data.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 12, color: "rgba(0,0,0,0.6)", textDecoration: "none" }}>← Back to site</Link>
          <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 800, color: "#f76b1c", background: "#0d0f14", padding: "7px 18px", borderRadius: 7, textDecoration: "none" }}>
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* ── Dashboard nav ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Buena Onda
        </span>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: T.faint }}>
          <span style={{ color: T.accent, fontWeight: 600, cursor: "default" }}>Overview</span>
          <span style={{ cursor: "default" }}>Campaigns</span>
          <span style={{ cursor: "default" }}>Creatives</span>
          <span style={{ cursor: "default" }}>Reports</span>
          <span style={{ cursor: "default" }}>Clients</span>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 94px)" }}>

        {/* ── Client sidebar ── */}
        <div style={{ width: 220, borderRight: `1px solid ${T.border}`, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px 8px", fontSize: 10, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Clients ({clients.length})
          </div>
          {clients.map(c => {
            const s = STATUS_MAP[c.meta_ad_account_id] ?? "healthy";
            const isActive = c.meta_ad_account_id === activeId;
            return (
              <button
                key={c.meta_ad_account_id}
                onClick={() => setActiveId(c.meta_ad_account_id)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 16px", background: isActive ? T.surfaceAlt : "transparent",
                  border: "none", borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                  cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? T.text : T.muted, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[s] }} />
                  <span style={{ fontSize: 10, color: STATUS_COLOR[s] }}>{STATUS_LABEL[s]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Client header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", marginBottom: 4 }}>{active.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: STATUS_BG[status], color: STATUS_COLOR[status], fontWeight: 600 }}>
                  {STATUS_LABEL[status]}
                </span>
                <span style={{ fontSize: 11, color: T.faint }}>
                  {isEcomm ? "E-Commerce" : "Lead Gen"} · 30-day view
                </span>
              </div>
            </div>
            <Link href="/sign-up" style={{ padding: "9px 20px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
              Manage your clients →
            </Link>
          </div>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Spend", value: fmt$(spendNum), delta: `${Number(spendDelta) >= 0 ? "+" : ""}${spendDelta}% vs prior period`, up: Number(spendDelta) >= 0 },
              { label: isEcomm ? "Total Revenue" : "Total Leads",
                value: isEcomm ? fmt$(campaigns.reduce((s,c)=>s+c.purchase_value,0)) : leadsNum.toString(),
                delta: isEcomm ? "" : `${Number(leadsDelta) >= 0 ? "+" : ""}${leadsDelta}% vs prior period`,
                up: Number(leadsDelta) >= 0 },
              { label: isEcomm ? "Avg ROAS" : "Avg CPL",
                value: isEcomm ? fmtROAS(campaigns.filter(c=>c.roas>0).reduce((s,c)=>s+c.roas,0)/Math.max(1,campaigns.filter(c=>c.roas>0).length)) : fmtCPL(parseFloat(summary.current.avg_cpl)),
                delta: "", up: true },
              { label: "Active Campaigns", value: campaigns.filter(c=>c.status==="ACTIVE").length.toString(), delta: `${campaigns.length} total`, up: true },
            ].map(m => (
              <div key={m.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 4 }}>{m.value}</div>
                {m.delta && <div style={{ fontSize: 10, color: m.up ? T.healthy : T.critical }}>{m.delta}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

            {/* Campaigns table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Campaigns
              </div>
              {campaigns.map((c, i) => (
                <div key={c.campaign_id} style={{ padding: "12px 18px", borderBottom: i < campaigns.length-1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name}</div>
                    <div style={{ fontSize: 10, color: T.faint }}>{fmt$(c.spend)} spend</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.status === "ACTIVE" ? T.healthy : T.faint }}>
                      {isEcomm ? fmtROAS(c.roas) : fmtCPL(c.cpl)}
                    </div>
                    <div style={{ fontSize: 10, color: c.status === "ACTIVE" ? T.healthy : T.faint }}>{c.status}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Agent panel */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", alignSelf: "start" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Agent Insights</span>
              </div>
              {insights.map((ins, i) => (
                <div key={i} style={{ padding: "12px 18px", borderBottom: i < insights.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{ins.icon}</span>
                    <div style={{ fontSize: 12, color: ins.priority === "critical" ? T.critical : ins.priority === "warning" ? T.warning : T.muted, lineHeight: 1.6 }}>
                      {ins.text}
                    </div>
                  </div>
                  {ins.priority !== "info" && (
                    <Link href="/sign-up" style={{ display: "inline-block", marginTop: 8, marginLeft: 22, fontSize: 11, fontWeight: 700, color: T.accent, textDecoration: "none" }}>
                      Take action →
                    </Link>
                  )}
                </div>
              ))}
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}` }}>
                <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "9px", borderRadius: 8, background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, color: T.accent, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Connect your real account →
                </Link>
              </div>
            </div>

          </div>

          {/* Agency callout */}
          <div style={{ marginTop: 20, padding: "20px 24px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                You&apos;re looking at 1 of {clients.length} demo clients
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>
                Buena Onda manages your whole client roster — each with their own AI agent, metrics, and recommendations.
              </div>
            </div>
            <Link href="/sign-up" style={{ padding: "10px 22px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
              Start 14-day free trial →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
