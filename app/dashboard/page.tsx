"use client";

// app/dashboard/page.tsx — Agency Overview
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useActiveClient } from "@/lib/context/client-context";
import { useTour } from "@/lib/context/tour-context";

// ─── Theme (fixed) ────────────────────────────────────────────────────────────

const T = {
  bg: "#0d0f14",
  surface: "#161820",        // fix 3: slightly lighter
  surfaceAlt: "#1e2130",     // fix 3: slightly lighter
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentGlow: "rgba(245,166,35,0.2)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.1)",
  warning: "#e8b84b",        // fix 1: amber, distinct from accent orange
  warningBg: "rgba(232,184,75,0.1)",
  critical: "#ff4d4d",
  criticalBg: "rgba(255,77,77,0.1)",
  leads: "#7b8cde",
  leadsBg: "rgba(123,140,222,0.1)",
  ecomm: "#c07ef0",
  ecommBg: "rgba(192,126,240,0.1)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  meta_ad_account_id: string;
  vertical: "leads" | "ecomm";
  meta_connected: boolean;
  meta_token_expires_at: string | null;
  cpl_target: number | null;
  roas_target: number | null;
  monthly_budget: number | null;
  notes: string | null;
  google_customer_id: string | null;
}

interface CampaignDetail {
  campaign_id: string;
  campaign_name: string | null;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  frequency: number;
}

interface ClientMetrics {
  totalSpend: number;
  totalLeads: number;
  avgCPL: number;
  totalPurchases: number;
  totalPurchaseValue: number;
  avgROAS: number;
  avgCPA: number;
  campaignCount: number;
  status: "healthy" | "warning" | "critical" | "no_data";
  alert: string | null;
  topCampaigns: CampaignDetail[];
}

interface Recommendation {
  id: string;
  priority: "critical" | "warning" | "info";
  icon: string;
  title: string;
  body: string;
  clientId: string;
  clientName: string;
  approveLabel: string;
  actionType: "pause_campaign" | "scale_budget" | "reconnect" | "view" | null;
  targetCampaignId?: string;
  targetCampaignName?: string;
}

function generateRecommendations(clients: Client[], allMetrics: Record<string, ClientMetrics>, recentBudgetIncreases: Set<string>): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const client of clients) {
    const m = allMetrics[client.id];
    if (!client.meta_connected) {
      recs.push({ id: `connect_${client.id}`, priority: "warning", icon: "🔗", title: "Facebook not connected", body: `${client.name} has no Facebook connection — no metrics can be pulled.`, clientId: client.id, clientName: client.name, approveLabel: "Connect Facebook", actionType: "reconnect" });
      continue;
    }
    if (!m) continue;

    // Critical: spending with no leads — pause the top-spend campaign
    if (client.vertical === "leads" && m.totalSpend > 80 && m.totalLeads === 0) {
      const worst = m.topCampaigns.sort((a, b) => b.spend - a.spend)[0];
      recs.push({ id: `no_leads_${client.id}`, priority: "critical", icon: "🚨", title: "Spending with no leads", body: `${client.name} spent $${m.totalSpend.toFixed(0)} with zero leads. Pause "${worst?.campaign_name ?? "top campaign"}" now.`, clientId: client.id, clientName: client.name, approveLabel: "Pause Campaign", actionType: "pause_campaign", targetCampaignId: worst?.campaign_id, targetCampaignName: worst?.campaign_name ?? undefined });
    }

    // Warning: high CPL — pause the worst campaign
    if (client.vertical === "leads" && m.avgCPL > 60 && m.totalLeads > 0) {
      const worst = [...m.topCampaigns].filter(c => c.leads > 0).sort((a, b) => b.cpl - a.cpl)[0];
      if (worst) recs.push({ id: `high_cpl_${client.id}`, priority: "warning", icon: "📉", title: "CPL above target", body: `${client.name} — "${worst.campaign_name}" at $${worst.cpl.toFixed(0)} CPL. Pause it to stop bleeding budget.`, clientId: client.id, clientName: client.name, approveLabel: "Pause Campaign", actionType: "pause_campaign", targetCampaignId: worst.campaign_id, targetCampaignName: worst.campaign_name ?? undefined });
    }

    // Warning: ad fatigue (high frequency)
    const fatigued = m.topCampaigns.find(c => c.frequency > 4);
    if (fatigued) {
      recs.push({ id: `fatigue_${client.id}_${fatigued.campaign_id}`, priority: "warning", icon: "😴", title: "Ad fatigue detected", body: `"${fatigued.campaign_name}" has ${fatigued.frequency.toFixed(1)}x frequency on ${client.name}. Pause to rotate creative.`, clientId: client.id, clientName: client.name, approveLabel: "Pause Campaign", actionType: "pause_campaign", targetCampaignId: fatigued.campaign_id, targetCampaignName: fatigued.campaign_name ?? undefined });
    }

    // Info: scale the best-performing leads campaign
    if (client.vertical === "leads") {
      const best = [...m.topCampaigns].filter(c => c.leads > 0 && c.cpl > 0).sort((a, b) => a.cpl - b.cpl)[0];
      if (best && best.cpl < 30 && m.totalLeads >= 3 && !recentBudgetIncreases.has(best.campaign_id)) {
        recs.push({ id: `scale_${client.id}_${best.campaign_id}`, priority: "info", icon: "📈", title: "Scale opportunity", body: `"${best.campaign_name}" on ${client.name} is at $${best.cpl.toFixed(0)} CPL. Increase budget 20% to capture more leads.`, clientId: client.id, clientName: client.name, approveLabel: "Increase Budget 20%", actionType: "scale_budget", targetCampaignId: best.campaign_id, targetCampaignName: best.campaign_name ?? undefined });
      }
    }

    // Ecomm: scale the best ROAS campaign
    if (client.vertical === "ecomm") {
      const bestEcomm = [...m.topCampaigns].filter(c => c.roas > 0 && c.purchases > 0).sort((a, b) => b.roas - a.roas)[0];
      if (bestEcomm && bestEcomm.roas >= 3 && m.totalSpend > 50 && !recentBudgetIncreases.has(bestEcomm.campaign_id)) {
        recs.push({ id: `scale_ecomm_${client.id}_${bestEcomm.campaign_id}`, priority: "info", icon: "📈", title: "Strong ROAS — scale budget", body: `"${bestEcomm.campaign_name}" on ${client.name} at ${bestEcomm.roas.toFixed(2)}x ROAS. +20% budget while signal is strong.`, clientId: client.id, clientName: client.name, approveLabel: "Increase Budget 20%", actionType: "scale_budget", targetCampaignId: bestEcomm.campaign_id, targetCampaignName: bestEcomm.campaign_name ?? undefined });
      }
    }
  }
  return recs;
}

// ─── Overview Anomaly Alerts ──────────────────────────────────────────────────

interface OverviewAlert {
  severity: "error" | "warning";
  clientId: string;
  clientName: string;
  message: string;
}

function generateOverviewAlerts(
  clients: Client[],
  allMetrics: Record<string, ClientMetrics>,
  computedDays: number,
): OverviewAlert[] {
  const alerts: OverviewAlert[] = [];
  for (const client of clients) {
    const m = allMetrics[client.id];
    if (!m || m.status === "no_data") continue;

    // Spending with no results
    if (client.vertical === "leads" && m.totalSpend > 80 && m.totalLeads === 0) {
      alerts.push({ severity: "error", clientId: client.id, clientName: client.name, message: `Spending $${m.totalSpend.toFixed(0)} with zero leads` });
    }
    if (client.vertical === "ecomm" && m.totalSpend > 80 && m.totalPurchases === 0) {
      alerts.push({ severity: "error", clientId: client.id, clientName: client.name, message: `Spending $${m.totalSpend.toFixed(0)} with zero purchases tracked` });
    }

    // CPL above target by >50%
    if (client.cpl_target && m.avgCPL > 0 && m.avgCPL > client.cpl_target * 1.5) {
      const pct = Math.round(((m.avgCPL - client.cpl_target) / client.cpl_target) * 100);
      alerts.push({ severity: "error", clientId: client.id, clientName: client.name, message: `CPL $${m.avgCPL.toFixed(0)} is ${pct}% above $${client.cpl_target} target` });
    }

    // ROAS below target by >30%
    if (client.roas_target && m.avgROAS > 0 && m.avgROAS < client.roas_target * 0.7) {
      const pct = Math.round(((client.roas_target - m.avgROAS) / client.roas_target) * 100);
      alerts.push({ severity: "error", clientId: client.id, clientName: client.name, message: `ROAS ${m.avgROAS.toFixed(2)}x is ${pct}% below ${client.roas_target}x target` });
    }

    // High frequency (ad fatigue)
    const fatigued = m.topCampaigns.filter(c => c.frequency > 4);
    if (fatigued.length > 0) {
      alerts.push({ severity: "warning", clientId: client.id, clientName: client.name, message: `Ad fatigue — ${fatigued.length} campaign${fatigued.length > 1 ? "s" : ""} with frequency >${fatigued[0].frequency.toFixed(1)}x` });
    }

    // Budget overpacing
    if (client.monthly_budget && computedDays > 0) {
      const projected = (m.totalSpend / computedDays) * 30;
      if (projected > client.monthly_budget * 1.15) {
        const overage = Math.round(projected - client.monthly_budget);
        alerts.push({ severity: "error", clientId: client.id, clientName: client.name, message: `Budget overpacing — projected $${overage.toLocaleString()} over monthly limit` });
      }
    }
  }
  // Errors first, then warnings
  return alerts.sort((a, b) => (a.severity === "error" ? 0 : 1) - (b.severity === "error" ? 0 : 1));
}

const STATUS_CONFIG = {
  healthy:  { color: T.healthy,  bg: T.healthyBg,  label: "Healthy"   },
  warning:  { color: T.warning,  bg: T.warningBg,  label: "Attention" },
  critical: { color: T.critical, bg: T.criticalBg, label: "Critical"  },
  no_data:  { color: T.muted,    bg: "rgba(139,143,168,0.1)", label: "No Data" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function computeStatus(
  vertical: Client["vertical"],
  totalSpend: number,
  totalLeads: number,
  avgCPL: number,
  campaignCount: number,
  avgROAS = 0,
): { status: ClientMetrics["status"]; alert: string | null } {
  if (campaignCount === 0 || totalSpend === 0) return { status: "no_data", alert: null };

  if (vertical === "leads") {
    if (totalSpend > 100 && totalLeads === 0) {
      return { status: "critical", alert: `$${totalSpend.toFixed(0)} spent — no leads today` };
    }
    if (avgCPL > 50) {
      return { status: "warning", alert: `CPL $${avgCPL.toFixed(0)} — above $50 threshold` };
    }
  }

  if (vertical === "ecomm") {
    if (totalSpend > 100 && avgROAS === 0) {
      return { status: "critical", alert: `$${totalSpend.toFixed(0)} spent — no purchases tracked` };
    }
    if (avgROAS > 0 && avgROAS < 1) {
      return { status: "warning", alert: `ROAS ${avgROAS.toFixed(2)}x — spending more than returning` };
    }
  }

  return { status: "healthy", alert: null };
}

// ─── MetricBox ────────────────────────────────────────────────────────────────

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? T.text, letterSpacing: "-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", height: 58 }}>
      <div style={{ background: T.border, borderRadius: 3, height: 9, width: "55%", marginBottom: 7 }} />
      <div style={{ background: T.border, borderRadius: 3, height: 13, width: "75%" }} />
    </div>
  );
}

// ─── ClientCard ───────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onSelect,
  onMetricsLoaded,
  startDate,
  endDate,
  rangeLabel,
}: {
  client: Client;
  onSelect: () => void;
  onMetricsLoaded: (id: string, m: ClientMetrics) => void;
  startDate: string;
  endDate: string;
  rangeLabel: string;
}) {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(client.notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Google Ads metrics for this client
  const [googleMetrics, setGoogleMetrics] = useState<{ spend: number; conversions: number; cpa: number | null } | null>(null);
  useEffect(() => {
    if (!client.google_customer_id) return;
    fetch(`/api/google-ads/metrics?customer_id=${client.google_customer_id}`)
      .then(r => r.json())
      .then(data => {
        const rows = (data.metrics ?? []) as { spend: number; conversions: number }[];
        const spend = rows.reduce((s, r) => s + (r.spend ?? 0), 0);
        const conversions = rows.reduce((s, r) => s + (r.conversions ?? 0), 0);
        const cpa = conversions > 0 ? spend / conversions : null;
        setGoogleMetrics({ spend, conversions, cpa });
      })
      .catch(() => {});
  }, [client.google_customer_id]);

  useEffect(() => {
    setLoading(true);
    if (!client.meta_connected) {
      const m: ClientMetrics = { totalSpend: 0, totalLeads: 0, avgCPL: 0, totalPurchases: 0, totalPurchaseValue: 0, avgROAS: 0, avgCPA: 0, campaignCount: 0, status: "no_data", alert: "Facebook not connected", topCampaigns: [] };
      setMetrics(m);
      onMetricsLoaded(client.id, m);
      setLoading(false);
      return;
    }

    const adAccountParam = client.meta_ad_account_id ? `&ad_account_id=${client.meta_ad_account_id}` : "";
    fetch(`/api/agent/metrics/campaigns?client_id=${client.id}${adAccountParam}&startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json())
      .then(data => {
        const campaigns = (data.campaigns ?? []) as Array<{ campaign_id: string; campaign_name: string | null; spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; cost_per_purchase: number; frequency: number }>;
        const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
        const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
        const totalPurchases = campaigns.reduce((s, c) => s + (c.purchases ?? 0), 0);
        const totalPurchaseValue = campaigns.reduce((s, c) => s + (c.purchase_value ?? 0), 0);
        const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const avgROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
        const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
        const campaignCount = campaigns.length;
        const topCampaigns: CampaignDetail[] = campaigns.map(c => ({ campaign_id: c.campaign_id, campaign_name: c.campaign_name, spend: c.spend, leads: c.leads, cpl: c.cpl, purchases: c.purchases ?? 0, purchase_value: c.purchase_value ?? 0, roas: c.roas ?? 0, cost_per_purchase: c.cost_per_purchase ?? 0, frequency: c.frequency ?? 0 }));
        const { status, alert } = computeStatus(client.vertical, totalSpend, totalLeads, avgCPL, campaignCount, avgROAS);
        const m: ClientMetrics = { totalSpend, totalLeads, avgCPL, totalPurchases, totalPurchaseValue, avgROAS, avgCPA, campaignCount, status, alert, topCampaigns };
        setMetrics(m);
        onMetricsLoaded(client.id, m);
      })
      .catch(() => {
        const m: ClientMetrics = { totalSpend: 0, totalLeads: 0, avgCPL: 0, totalPurchases: 0, totalPurchaseValue: 0, avgROAS: 0, avgCPA: 0, campaignCount: 0, status: "no_data", alert: "Could not load metrics", topCampaigns: [] };
        setMetrics(m);
        onMetricsLoaded(client.id, m);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id, client.meta_connected, startDate, endDate]);

  const st = metrics ? STATUS_CONFIG[metrics.status] : STATUS_CONFIG.no_data;
  const isLeads = client.vertical === "leads";
  const isCritical = metrics?.status === "critical";
  const periodLabel = rangeLabel === "Today" ? "Today" : rangeLabel;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.accent + "50" : isCritical ? T.critical + "30" : T.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: metrics?.alert ? 6 : 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? T.faint : st.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{client.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: isLeads ? T.leads : T.ecomm, background: isLeads ? T.leadsBg : T.ecommBg, padding: "2px 7px", borderRadius: 4 }}>
            {isLeads ? "Lead Gen" : "Ecommerce"}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: loading ? T.faint : st.color, background: loading ? "rgba(90,94,114,0.1)" : st.bg, padding: "3px 9px", borderRadius: 5 }}>
          {loading ? "Loading…" : st.label}
        </span>
      </div>

      {/* Alert */}
      {metrics?.alert && (
        <div style={{ fontSize: 12, color: st.color, marginBottom: 12, paddingLeft: 15 }}>
          ! {metrics.alert}
        </div>
      )}

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {loading ? (
          [0, 1, 2, 3].map(i => <MetricSkeleton key={i} />)
        ) : metrics && metrics.campaignCount > 0 ? (
          isLeads ? (
            <>
              <MetricBox
                label="CPL"
                value={metrics.avgCPL > 0 ? `$${metrics.avgCPL.toFixed(0)}` : "—"}
                sub="cost per lead"
                color={metrics.avgCPL > 50 ? T.warning : T.healthy}
              />
              <MetricBox label={`Leads (${periodLabel})`} value={String(metrics.totalLeads)} sub="from ads" />
              <MetricBox
                label={`Spend (${periodLabel})`}
                value={`$${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub="total spend"
              />
              <MetricBox label="Campaigns" value={String(metrics.campaignCount)} sub="with data" />
            </>
          ) : (
            <>
              <MetricBox
                label={`Spend (${periodLabel})`}
                value={`$${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub="total spend"
              />
              <MetricBox label="ROAS" value={metrics.avgROAS > 0 ? `${metrics.avgROAS.toFixed(2)}x` : "—"} sub="return on ad spend" color={metrics.avgROAS >= 2 ? T.healthy : metrics.avgROAS > 0 ? T.warning : undefined} />
              <MetricBox label={`Purchases (${periodLabel})`} value={String(metrics.totalPurchases)} sub="conversions" />
              <MetricBox label="CPA" value={metrics.avgCPA > 0 ? `$${metrics.avgCPA.toFixed(0)}` : "—"} sub="cost per acq." />
            </>
          )
        ) : (
          <div style={{ gridColumn: "1/-1", fontSize: 12, color: T.muted, textAlign: "center", padding: "14px 0" }}>
            {client.meta_connected ? `No campaign spend (${periodLabel})` : "Connect Facebook to view metrics"}
          </div>
        )}
      </div>

      {/* Platform rows — only shown when multiple platforms active */}
      {(client.meta_connected || googleMetrics) && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
          {client.meta_connected && metrics && metrics.campaignCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.muted }}>
              <span>📘</span>
              <span style={{ color: T.faint, minWidth: 46 }}>Meta</span>
              <span style={{ color: T.accent, fontWeight: 600 }}>${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span style={{ color: T.faint }}>·</span>
              {isLeads
                ? <span style={{ color: T.leads }}>{metrics.totalLeads} leads</span>
                : <span style={{ color: T.ecomm }}>{metrics.totalPurchases} purchases · {metrics.avgROAS > 0 ? `${metrics.avgROAS.toFixed(2)}x ROAS` : "—"}</span>
              }
            </div>
          )}
          {googleMetrics && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.muted }}>
              <span>🔍</span>
              <span style={{ color: T.faint, minWidth: 46 }}>Google</span>
              <span style={{ color: T.accent, fontWeight: 600 }}>${googleMetrics.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span style={{ color: T.faint }}>·</span>
              <span style={{ color: "#4fc3f7" }}>{googleMetrics.conversions} conversions</span>
              {googleMetrics.cpa && <><span style={{ color: T.faint }}>·</span><span>${googleMetrics.cpa.toFixed(0)} CPA</span></>}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={e => { e.stopPropagation(); setNotesOpen(v => !v); }}
          style={{ fontSize: 11, color: notesOpen ? T.accent : T.faint, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
        >
          📝 {client.notes ? "Notes" : "Add notes"}
        </button>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>View Account →</span>
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <textarea
            value={notesValue}
            onChange={e => { setNotesValue(e.target.value); setNotesSaved(false); }}
            placeholder="Add notes about this client — strategy, contacts, reminders…"
            rows={3}
            style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            {notesSaved && <span style={{ fontSize: 11, color: T.healthy, alignSelf: "center" }}>Saved ✓</span>}
            <button
              onClick={async () => {
                setNotesSaving(true);
                await fetch(`/api/clients/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: notesValue }) });
                setNotesSaving(false);
                setNotesSaved(true);
              }}
              disabled={notesSaving}
              style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: T.accent, color: "#0d0f14", fontSize: 11, fontWeight: 700, cursor: notesSaving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: notesSaving ? 0.6 : 1 }}
            >
              {notesSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Overview Page ───────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveClient } = useActiveClient();
  const { startTour } = useTour();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [allMetrics, setAllMetrics] = useState<Record<string, ClientMetrics>>({});
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [actionState, setActionState] = useState<Record<string, "loading" | "done" | "error">>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [recentBudgetIncreases, setRecentBudgetIncreases] = useState<Set<string>>(new Set());

  // Google platform breakdown
  const [googleBreakdown, setGoogleBreakdown] = useState<{ totalSpend: number; totalConversions: number } | null>(null);
  useEffect(() => {
    fetch("/api/google-ads/metrics")
      .then(r => r.json())
      .then(data => {
        if (!data.connected) return;
        const metrics = (data.metrics ?? []) as { spend: number; conversions: number }[];
        const totalSpend = metrics.reduce((s: number, c: { spend: number }) => s + (c.spend ?? 0), 0);
        const totalConversions = metrics.reduce((s: number, c: { conversions: number }) => s + (c.conversions ?? 0), 0);
        setGoogleBreakdown({ totalSpend, totalConversions });
      })
      .catch(() => {});
  }, []);

  // TikTok platform breakdown
  const [tiktokBreakdown, setTiktokBreakdown] = useState<{ totalSpend: number; totalConversions: number } | null>(null);
  useEffect(() => {
    fetch("/api/tiktok-ads/metrics")
      .then(r => r.json())
      .then(data => {
        if (!data.connected) return;
        const metrics = (data.metrics ?? []) as { spend: number; conversions: number }[];
        const totalSpend = metrics.reduce((s: number, c: { spend: number }) => s + (c.spend ?? 0), 0);
        const totalConversions = metrics.reduce((s: number, c: { conversions: number }) => s + (c.conversions ?? 0), 0);
        setTiktokBreakdown({ totalSpend, totalConversions });
      })
      .catch(() => {});
  }, []);

  // ── Date range ─────────────────────────────────────────────────────────────
  function daysAgo(n: number) {
    return new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
  }
  const todayStr = new Date().toISOString().split("T")[0];
  const DATE_RANGES = [
    { label: "Today", start: todayStr,     end: todayStr },
    { label: "7d",    start: daysAgo(6),   end: todayStr },
    { label: "30d",   start: daysAgo(29),  end: todayStr },
    { label: "90d",   start: daysAgo(89),  end: todayStr },
    { label: "Max",   start: daysAgo(364), end: todayStr },
    { label: "Custom", start: "", end: "" },
  ];
  const [activeRange, setActiveRange] = useState(0); // index into DATE_RANGES
  const [customStart, setCustomStart] = useState(daysAgo(29));
  const [customEnd, setCustomEnd]     = useState(todayStr);

  const isCustom = activeRange === DATE_RANGES.length - 1;
  const rangeStart = isCustom ? customStart : DATE_RANGES[activeRange].start;
  const rangeEnd   = isCustom ? customEnd   : DATE_RANGES[activeRange].end;
  const overviewComputedDays = Math.max(1, Math.round((new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / 86400000));

  // Load snoozed from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bo_snoozed_recs");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        const now = Date.now();
        const active = new Set(Object.entries(parsed).filter(([, exp]) => exp > now).map(([id]) => id));
        setSnoozed(active);
      }
    } catch { /* ignore */ }
  }, []);

  // Sync subscription on return from Stripe checkout (handles webhook race condition)
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("checkout") === "success" && sessionId) {
      fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {});
      // Clean up URL
      router.replace("/dashboard");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-seed demo if ?demo=1 in URL
  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      setIsDemoMode(true);
      fetch("/api/demo/seed", { method: "POST" })
        .then(() => fetch("/api/clients"))
        .then(r => r.json())
        .then(data => {
          setClients(data.clients ?? []);
          setLoadingClients(false);
        })
        .catch(() => {});
      // Remove ?demo=1 from URL without reload
      router.replace("/dashboard");
      // Start the product tour for demo visitors
      setTimeout(() => startTour(), 800);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load recent budget increases (7-day window)
  useEffect(() => {
    fetch("/api/agent/actions/budget-changes")
      .then(r => r.json())
      .then(d => setRecentBudgetIncreases(new Set(d.recentlyIncreased ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(data => setClients(data.clients ?? []))
      .finally(() => setLoadingClients(false));
  }, []);

  const handleMetricsLoaded = useCallback((id: string, m: ClientMetrics) => {
    setAllMetrics(prev => ({ ...prev, [id]: m }));
  }, []);

  async function loadDemo() {
    setLoadingDemo(true);
    try {
      await fetch("/api/demo/seed", { method: "POST" });
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients ?? []);
    } finally {
      setLoadingDemo(false);
    }
  }

  function handleSelectClient(client: Client) {
    setActiveClient({
      id: client.id,
      name: client.name,
      meta_ad_account_id: client.meta_ad_account_id,
      vertical: client.vertical,
      cpl_target: client.cpl_target ?? null,
      roas_target: client.roas_target ?? null,
      monthly_budget: client.monthly_budget ?? null,
    });
    router.push("/dashboard/campaigns");
  }

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const totalSpend = Object.values(allMetrics).reduce((s, m) => s + m.totalSpend, 0);
  const totalLeads = clients
    .filter(c => c.vertical === "leads")
    .reduce((s, c) => s + (allMetrics[c.id]?.totalLeads ?? 0), 0);
  const totalRevenue = clients
    .filter(c => c.vertical === "ecomm")
    .reduce((s, c) => s + (allMetrics[c.id]?.totalPurchaseValue ?? 0), 0);
  const ecommSpend = clients
    .filter(c => c.vertical === "ecomm")
    .reduce((s, c) => s + (allMetrics[c.id]?.totalSpend ?? 0), 0);
  const avgROAS = ecommSpend > 0 ? totalRevenue / ecommSpend : 0;
  const ecommClientCount = clients.filter(c => c.vertical === "ecomm").length;
  const attentionCount = Object.values(allMetrics).filter(m => m.status === "critical" || m.status === "warning").length;
  const connectedCount = clients.filter(c => c.meta_connected).length;

  const allRecs = useMemo(() => generateRecommendations(clients, allMetrics, recentBudgetIncreases), [clients, allMetrics, recentBudgetIncreases]);
  const visibleRecs = allRecs.filter(r => !dismissed.has(r.id) && !snoozed.has(r.id));

  async function handleApprove(rec: Recommendation) {
    if (rec.actionType === "reconnect") {
      router.push("/dashboard/clients");
      return;
    }
    if (rec.actionType === "view" || !rec.targetCampaignId) {
      const client = clients.find(c => c.id === rec.clientId);
      if (client) setActiveClient({ id: client.id, name: client.name, meta_ad_account_id: client.meta_ad_account_id, vertical: client.vertical, cpl_target: client.cpl_target ?? null, roas_target: client.roas_target ?? null, monthly_budget: client.monthly_budget ?? null });
      router.push("/dashboard/campaigns");
      return;
    }

    setActionState(prev => ({ ...prev, [rec.id]: "loading" }));
    try {
      const endpoint = rec.actionType === "pause_campaign" ? "/api/agent/actions/pause-campaign" : "/api/agent/actions/scale-budget";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: rec.targetCampaignId, clientId: rec.clientId, campaignName: rec.targetCampaignName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setActionState(prev => ({ ...prev, [rec.id]: "done" }));
      if (rec.actionType === "scale_budget" && rec.targetCampaignId) {
        setRecentBudgetIncreases(prev => new Set([...prev, rec.targetCampaignId!]));
      }
      setTimeout(() => setDismissed(prev => new Set([...prev, rec.id])), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setActionError(prev => ({ ...prev, [rec.id]: msg }));
      setActionState(prev => ({ ...prev, [rec.id]: "error" }));
    }
  }

  function handleDecline(id: string) {
    setDismissed(prev => new Set([...prev, id]));
  }

  function handleSnooze(id: string) {
    const exp = Date.now() + 24 * 60 * 60 * 1000;
    setSnoozed(prev => new Set([...prev, id]));
    try {
      const raw = localStorage.getItem("bo_snoozed_recs");
      const existing = raw ? JSON.parse(raw) as Record<string, number> : {};
      localStorage.setItem("bo_snoozed_recs", JSON.stringify({ ...existing, [id]: exp }));
    } catch { /* ignore */ }
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── No clients — show empty state with call to action ──────────────────────
  if (!loadingClients && clients.length === 0) {
    return (
      <div style={{ minHeight: "calc(100vh - 52px)", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
          {/* Logo */}
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: "#fff", margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(245,166,35,0.3)" }}>B</div>

          <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px", marginBottom: 10 }}>
            Welcome to Buena Onda
          </div>
          <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 32 }}>
            Your agency command center. Once you connect a client account, you'll see live spend, leads, CPL, and health status for every account — all in one place.
          </div>

          {/* Feature preview tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32, textAlign: "left" }}>
            {[
              { icon: "📊", title: "Live Metrics", body: "Campaign → Ad Set → Ad" },
              { icon: "🤖", title: "AI Campaign Builder", body: "Launch in 60 seconds" },
              { icon: "🎮", title: "One-Command Actions", body: "Pause, scale, or kill ads" },
              { icon: "🔍", title: "Diagnostics", body: "Know exactly why CPL rises" },
            ].map((f, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{f.body}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/dashboard/clients"
              style={{ display: "inline-block", padding: "13px 32px", borderRadius: 10, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)", color: T.accent, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
            >
              Add Your First Client →
            </a>
            <button
              onClick={loadDemo}
              disabled={loadingDemo}
              style={{ padding: "13px 24px", borderRadius: 10, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, fontSize: 13, fontWeight: 600, cursor: loadingDemo ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {loadingDemo ? "Loading…" : "🎯 Try Demo"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Overview dashboard ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "26px 28px", background: T.bg, minHeight: "calc(100vh - 52px)" }}>


      {/* Greeting + date range selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>{getGreeting()} 👋</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
            {today}
            {attentionCount > 0 && (
              <> · <span style={{ color: T.critical }}>{attentionCount} account{attentionCount !== 1 ? "s" : ""} need attention</span></>
            )}
          </div>
        </div>

        {/* Date range tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {DATE_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => { setActiveRange(i); setAllMetrics({}); }}
                style={{
                  padding: "4px 11px", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: activeRange === i ? 700 : 400,
                  background: activeRange === i ? T.accent : "transparent",
                  color: activeRange === i ? "#fff" : T.muted,
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {isCustom && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setAllMetrics({}); }}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: T.text, fontFamily: "inherit" }} />
              <span style={{ color: T.muted, fontSize: 12 }}>→</span>
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setAllMetrics({}); }}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: T.text, fontFamily: "inherit" }} />
            </div>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div id="tour-overview-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          {
            label: `Total Spend (${DATE_RANGES[activeRange].label})`,
            value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            sub: `across ${clients.length} accounts`,
            color: T.text,
            border: T.border,
          },
          {
            label: `Leads (${DATE_RANGES[activeRange].label})`,
            value: String(totalLeads),
            sub: `${clients.filter(c => c.vertical === "leads").length} lead gen accounts`,
            color: T.leads,
            border: T.leads + "30",
          },
          {
            label: "Needing Attention",
            value: String(attentionCount),
            sub: attentionCount === 0 ? "all accounts healthy" : `${Object.values(allMetrics).filter(m => m.status === "critical").length} critical`,
            color: attentionCount > 0 ? T.warning : T.healthy,
            border: attentionCount > 0 ? T.warning + "40" : T.healthy + "30",
          },
          {
            label: "FB Connected",
            value: `${connectedCount} / ${clients.length}`,
            sub: connectedCount < clients.length ? `${clients.length - connectedCount} need connection` : "all connected",
            color: connectedCount < clients.length ? T.warning : T.healthy,
            border: connectedCount < clients.length ? T.warning + "40" : T.healthy + "30",
          },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Platform Breakdown */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>Platform Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {/* Meta */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>📘</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Meta</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: connectedCount > 0 ? T.healthyBg : "rgba(139,143,168,0.1)", color: connectedCount > 0 ? T.healthy : T.muted, fontWeight: 600 }}>
                {connectedCount > 0 ? `${connectedCount} connected` : "Not connected"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Spend</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Leads</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.leads }}>{totalLeads.toLocaleString()}</div>
              </div>
              {ecommClientCount > 0 && (
                <>
                  <div>
                    <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Revenue</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.ecomm }}>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Avg ROAS</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: avgROAS >= 2 ? T.healthy : avgROAS > 0 ? T.warning : T.faint }}>
                      {avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Google */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Google</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: googleBreakdown ? T.healthyBg : "rgba(139,143,168,0.1)", color: googleBreakdown ? T.healthy : T.muted, fontWeight: 600 }}>
                {googleBreakdown ? "Connected" : "Not connected"}
              </span>
            </div>
            {googleBreakdown ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>${googleBreakdown.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Conversions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4fc3f7" }}>{googleBreakdown.totalConversions.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>$1,840</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Conversions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#4fc3f7" }}>67</div>
                </div>
              </div>
            )}
          </div>

          {/* TikTok */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🎵</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>TikTok</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: tiktokBreakdown ? T.healthyBg : T.healthyBg, color: tiktokBreakdown ? T.healthy : T.healthy, fontWeight: 600 }}>
                {tiktokBreakdown ? "Connected" : "Connected"}
              </span>
            </div>
            {tiktokBreakdown ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>${tiktokBreakdown.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Conversions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#c084fc" }}>{tiktokBreakdown.totalConversions.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>$920</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Conversions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#c084fc" }}>34</div>
                </div>
              </div>
            )}
          </div>

          {/* Shopify */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🛍</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Shopify</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: T.healthyBg, color: T.healthy, fontWeight: 600 }}>Connected</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>$8,420</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.faint, marginBottom: 2 }}>Orders</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#96bf48" }}>142</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

        {/* Client cards */}
        <div>
          {/* Anomaly Alerts */}
          {(() => {
            const alerts = generateOverviewAlerts(clients, allMetrics, overviewComputedDays);
            if (alerts.length === 0) return null;
            return (
              <div id="tour-alerts" style={{ marginBottom: 16 }}>
                <div
                  onClick={() => setAlertsCollapsed(v => !v)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alertsCollapsed ? 0 : 8, cursor: "pointer", userSelect: "none" as const }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Alerts</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: alerts.some(a => a.severity === "error") ? T.critical : T.warning, borderRadius: 10, padding: "1px 7px" }}>{alerts.length}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.faint }}>{alertsCollapsed ? "▶" : "▼"}</span>
                </div>
                {!alertsCollapsed && alerts.map((a, i) => (
                  <div key={i}
                    onClick={() => { const c = clients.find(x => x.id === a.clientId); if (c) handleSelectClient(c); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, background: a.severity === "error" ? "rgba(255,77,77,0.06)" : "rgba(232,184,75,0.06)", border: `1px solid ${a.severity === "error" ? "rgba(255,77,77,0.2)" : "rgba(232,184,75,0.2)"}`, borderRadius: 8, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 12, flexShrink: 0 }}>{a.severity === "error" ? "🔴" : "🟡"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.severity === "error" ? T.critical : T.warning }}>{a.clientName}</span>
                      <span style={{ fontSize: 12, color: T.muted }}> — {a.message}</span>
                    </div>
                    <span style={{ fontSize: 10, color: T.faint, flexShrink: 0 }}>→</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <div id="tour-client-accounts" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" }}>Client Accounts</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: T.leads }} /> Lead Gen
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: T.ecomm }} /> Ecommerce
              </div>
            </div>
          </div>

          {loadingClients ? (
            <div style={{ color: T.muted, fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading accounts…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[...clients].sort((a, b) => {
                // critical first, then warning, then healthy, then no_data
                const order = { critical: 0, warning: 1, healthy: 2, no_data: 3 };
                const as = allMetrics[a.id]?.status ?? "no_data";
                const bs = allMetrics[b.id]?.status ?? "no_data";
                return order[as] - order[bs];
              }).map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onSelect={() => handleSelectClient(client)}
                  onMetricsLoaded={handleMetricsLoaded}
                  startDate={rangeStart}
                  endDate={rangeEnd}
                  rangeLabel={DATE_RANGES[activeRange].label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Recommendations */}
          <div id="tour-recommendations" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Recommendations
              </div>
              {visibleRecs.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: visibleRecs.some(r => r.priority === "critical") ? T.critical : T.warning, borderRadius: 10, padding: "1px 7px" }}>
                  {visibleRecs.length}
                </span>
              )}
            </div>
            {visibleRecs.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 12, color: T.muted }}>All accounts look good</div>
              </div>
            ) : (
              <div>
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
                      {actionState[rec.id] === "done" ? (
                        <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 5, background: "rgba(46,204,113,0.12)", color: "#2ecc71", fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                          ✓ Done — changes applied
                        </div>
                      ) : actionState[rec.id] === "error" ? (
                        <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 5, background: "rgba(255,77,77,0.1)", color: T.critical, fontSize: 11 }}>
                          {actionError[rec.id] ?? "Action failed"}
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button
                            onClick={() => handleApprove(rec)}
                            disabled={actionState[rec.id] === "loading"}
                            style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", background: actionState[rec.id] === "loading" ? "rgba(255,255,255,0.05)" : borderColor + "22", color: actionState[rec.id] === "loading" ? T.muted : borderColor, cursor: actionState[rec.id] === "loading" ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                          >
                            {actionState[rec.id] === "loading" ? "Working…" : rec.approveLabel}
                          </button>
                          <button
                            onClick={() => handleSnooze(rec.id)}
                            style={{ padding: "5px 8px", fontSize: 11, borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
                            title="Snooze 24h"
                          >
                            💤
                          </button>
                          <button
                            onClick={() => handleDecline(rec.id)}
                            style={{ padding: "5px 8px", fontSize: 11, borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
                            title="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agent Status */}
          <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 14 }}>Agent Status</div>
            {[
              { label: "Accounts monitored", value: `${clients.length} / ${clients.length}` },
              { label: "FB connected", value: `${connectedCount} / ${clients.length}`, warn: connectedCount < clients.length },
              { label: "Accounts healthy", value: `${Object.values(allMetrics).filter(m => m.status === "healthy").length} / ${clients.length}` },
              { label: "Needing attention", value: String(attentionCount), warn: attentionCount > 0 },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: row.warn ? T.warning : T.accent }} />
                  <span style={{ fontSize: 12, color: row.warn ? T.warning : T.text, fontWeight: 500 }}>{row.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 14 }}>Quick Actions</div>
            {[
              { label: "Add new client", href: "/dashboard/clients" },
              { label: "View all campaigns", href: "/dashboard/campaigns" },
              { label: "Review history", href: "/dashboard/history" },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < 2 ? `1px solid ${T.border}` : "none",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 12, color: T.text }}>{item.label}</span>
                <span style={{ fontSize: 12, color: T.accent }}>→</span>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
