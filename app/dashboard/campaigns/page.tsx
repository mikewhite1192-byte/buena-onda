"use client";

// app/dashboard/campaigns/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useActiveClient } from "@/lib/context/client-context";
import { METRIC_GROUPS, METRIC_BY_KEY, LEADS_DEFAULT_COLUMNS, ECOMM_DEFAULT_COLUMNS } from "@/lib/meta/metric-definitions";
import type { MetricDef } from "@/lib/meta/metric-definitions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TimeseriesPoint } from "@/lib/demo-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignMetric {
  campaign_id: string;
  campaign_name: string | null;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  ctr: number;
  frequency: number;
  impressions: number;
  clicks: number;
  raw_metrics: Record<string, unknown>;
}

interface AdSetMetric {
  ad_set_id: string;
  ad_set_name: string | null;
  ad_status: string | null;
  campaign_id: string;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  ctr: number;
  frequency: number;
  impressions: number;
  clicks: number;
  date_recorded: string;
  raw_metrics: Record<string, unknown>;
}

interface AdMetric {
  ad_id: string;
  ad_name: string | null;
  ad_status: string | null;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  ctr: number;
  frequency: number;
  impressions: number;
  clicks: number;
  raw_metrics: Record<string, unknown>;
}

// Generic row shape that formatRowValue accepts
interface MetricRow {
  spend: number;
  leads: number;
  cpl: number;
  purchases?: number;
  purchase_value?: number;
  roas?: number;
  cost_per_purchase?: number;
  ctr: number;
  frequency: number;
  impressions: number;
  raw_metrics: Record<string, unknown>;
}

type SortKey = "cpl" | "spend" | "leads" | "frequency" | "ctr" | "impressions" | "purchases" | "roas" | "cost_per_purchase" | "purchase_value";
type SortDir = "asc" | "desc";

interface Preset { id: string; name: string; columns: string[]; is_default: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MetaActionRow = { action_type: string; value: string };

function extractFromRaw(raw: Record<string, unknown>, apiField: string): unknown {
  if (apiField.startsWith("computed:")) return undefined;
  const [prefix, actionType] = apiField.split(":");
  if (actionType) {
    const arr = raw[prefix] as MetaActionRow[] | undefined;
    return arr?.find((r) => r.action_type === actionType)?.value;
  }
  return raw[apiField];
}

function formatRowValue(key: string, row: MetricRow): string {
  const def: MetricDef | undefined = METRIC_BY_KEY[key];
  if (!def) return "—";

  const direct: Record<string, number | null> = {
    spend: row.spend, leads: row.leads, cpl: row.cpl,
    ctr: row.ctr, frequency: row.frequency, impressions: row.impressions,
  };

  let val: unknown = direct[key] ?? extractFromRaw(row.raw_metrics ?? {}, def.apiField);

  if (key === "hook_rate" && val === undefined) {
    const raw = row.raw_metrics ?? {};
    const plays = (raw["video_play_actions"] as MetaActionRow[] | undefined)?.find(r => r.action_type === "video_view")?.value;
    if (plays && row.impressions > 0) val = parseFloat(plays) / row.impressions;
  }

  if (val === undefined || val === null) return "—";

  const n = Number(val);
  if (isNaN(n)) return String(val);

  switch (def.format) {
    case "currency": return n === 0 ? "$—" : `$${n.toFixed(2)}`;
    case "percent": return def.rawIsPercent ? `${n.toFixed(2)}%` : `${(n * 100).toFixed(2)}%`;
    case "roas": return `${n.toFixed(2)}x`;
    case "seconds": return n < 60 ? `${n.toFixed(1)}s` : `${Math.floor(n/60)}m${Math.round(n%60)}s`;
    case "number": return n.toLocaleString();
    case "text": return String(val);
    default: return String(val);
  }
}

function adSetHealthColor(a: AdSetMetric, isEcomm = false): string {
  if (a.frequency > 3) return "#F5A623";
  if (isEcomm) {
    if (a.roas > 0 && a.roas < 1.5) return "#E8705A";
    if (a.roas >= 3 && a.purchases >= 3) return "#2ecc71";
    return "#8b8fa8";
  }
  if (a.cpl > 30) return "#E8705A";
  if (a.cpl < 20 && a.leads >= 5) return "#2ecc71";
  return "#8b8fa8";
}

function adSetHealthLabel(a: AdSetMetric, isEcomm = false): string {
  if (a.frequency > 3) return "Fatigued";
  if (isEcomm) {
    if (a.roas > 0 && a.roas < 1.5) return "Low ROAS";
    if (a.roas >= 3 && a.purchases >= 3) return "Scaling";
    return "Stable";
  }
  if (a.cpl > 30) return "CPL High";
  if (a.cpl < 20 && a.leads >= 5) return "Scaling";
  return "Stable";
}

// Returns green/yellow/red based on CPL vs target (lower is better)
function cplStatusColor(cpl: number, target: number | null): string {
  if (!target || cpl === 0) return "#e8eaf0";
  if (cpl <= target) return "#2ecc71";
  if (cpl <= target * 1.3) return "#e8b84b";
  return "#ff4d4d";
}

// Returns green/yellow/red based on ROAS vs target (higher is better)
function roasStatusColor(roas: number, target: number | null): string {
  if (!target || roas === 0) return "#e8eaf0";
  if (roas >= target) return "#2ecc71";
  if (roas >= target * 0.7) return "#e8b84b";
  return "#ff4d4d";
}

function StatCard({ label, value, sub, valueColor, target }: { label: string; value: string; sub?: string; valueColor?: string; target?: string }) {
  return (
    <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: valueColor ?? "#e8eaf0", letterSpacing: "-0.5px", marginBottom: 4 }}>{value}</div>
      {target && <div style={{ fontSize: 10, color: "#5a5e72", marginBottom: 2 }}>Target: {target}</div>}
      {sub && <div style={{ fontSize: 11, color: "#8b8fa8" }}>{sub}</div>}
    </div>
  );
}

function BudgetPacingCard({ spend, budget, computedDays }: { spend: number; budget: number | null; computedDays: number }) {
  if (!budget) return null;

  // Current month context
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  // Daily pace from selected range, projected to full month
  const dailyPace = computedDays > 0 ? spend / computedDays : 0;
  const projected = Math.round(dailyPace * daysInMonth);

  // Where spend should be right now (linear)
  const expectedByToday = (dayOfMonth / daysInMonth) * budget;
  const pacingRatio = expectedByToday > 0 ? spend / expectedByToday : 1;

  // Colors: green = on pace (85-115%), yellow = slightly off, red = significantly off
  const barColor = pacingRatio > 1.2 || spend > budget
    ? "#ff4d4d"
    : pacingRatio < 0.7
    ? "#ff4d4d"
    : pacingRatio < 0.85 || pacingRatio > 1.1
    ? "#e8b84b"
    : "#2ecc71";

  const statusLabel = spend > budget
    ? "OVER BUDGET"
    : pacingRatio > 1.15
    ? "OVERPACING"
    : pacingRatio < 0.7
    ? "UNDERPACING"
    : pacingRatio < 0.85
    ? "SLIGHTLY BEHIND"
    : pacingRatio > 1.05
    ? "SLIGHTLY AHEAD"
    : "ON TRACK";

  const spendPct = Math.min((spend / budget) * 100, 100);
  const expectedPct = Math.min((expectedByToday / budget) * 100, 100);

  return (
    <div style={{ background: "#161820", border: `1px solid ${barColor}33`, borderRadius: 10, padding: "18px 24px", marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase" }}>Budget Pacing</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: barColor, letterSpacing: "0.06em" }}>{statusLabel}</div>
      </div>

      {/* Main numbers */}
      <div style={{ display: "flex", gap: 32, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#5a5e72", marginBottom: 2 }}>Spent</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: barColor }}>${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#5a5e72", marginBottom: 2 }}>Expected by day {dayOfMonth}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf0" }}>${Math.round(expectedByToday).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#5a5e72", marginBottom: 2 }}>Projected month</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: projected > budget * 1.1 ? "#ff4d4d" : projected < budget * 0.8 ? "#e8b84b" : "#e8eaf0" }}>
            ${projected.toLocaleString()}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#5a5e72", marginBottom: 2 }}>Monthly budget</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#5a5e72" }}>${budget.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress bar — actual spend */}
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "visible", marginBottom: 4 }}>
        {/* Expected marker */}
        <div style={{
          position: "absolute", top: -4, left: `${expectedPct}%`,
          width: 2, height: 14, background: "rgba(255,255,255,0.2)", borderRadius: 1,
          transform: "translateX(-50%)",
        }} />
        {/* Actual spend bar */}
        <div style={{ height: "100%", width: `${spendPct}%`, background: barColor, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#5a5e72" }}>
        <span>${Math.round(dailyPace).toLocaleString()}/day pace · Day {dayOfMonth} of {daysInMonth}</span>
        <span>{spendPct.toFixed(1)}% of budget used</span>
      </div>
    </div>
  );
}

// ─── Anomaly Detection ────────────────────────────────────────────────────────

interface Anomaly {
  severity: "error" | "warning";
  title: string;
  detail: string;
}

function detectAnomalies(
  campaigns: CampaignMetric[],
  client: { cpl_target?: number | null; roas_target?: number | null; monthly_budget?: number | null; vertical?: string },
  totalSpend: number,
  computedDays: number,
  isEcomm: boolean,
): Anomaly[] {
  const alerts: Anomaly[] = [];
  const active = campaigns.filter(c => c.status === "ACTIVE");

  // 1. Active campaigns with zero spend
  const deadCampaigns = active.filter(c => c.spend === 0);
  if (deadCampaigns.length > 0) {
    alerts.push({
      severity: "error",
      title: `${deadCampaigns.length} active campaign${deadCampaigns.length > 1 ? "s" : ""} with $0 spend`,
      detail: deadCampaigns.map(c => c.campaign_name ?? c.campaign_id).join(", "),
    });
  }

  // 2. Spending but zero results
  const noResults = active.filter(c => c.spend > 50 && c.leads === 0);
  if (noResults.length > 0) {
    alerts.push({
      severity: "warning",
      title: `${noResults.length} campaign${noResults.length > 1 ? "s" : ""} spending with no ${isEcomm ? "purchases" : "leads"}`,
      detail: noResults.map(c => c.campaign_name ?? c.campaign_id).join(", "),
    });
  }

  // 3. High frequency (ad fatigue)
  const fatigued = campaigns.filter(c => c.frequency > 4);
  if (fatigued.length > 0) {
    alerts.push({
      severity: "warning",
      title: `High frequency on ${fatigued.length} campaign${fatigued.length > 1 ? "s" : ""} — risk of ad fatigue`,
      detail: fatigued.map(c => `${c.campaign_name ?? c.campaign_id} (${c.frequency.toFixed(1)}x)`).join(", "),
    });
  }

  // 4. CPL above target by >50%
  if (!isEcomm && client.cpl_target) {
    const overTarget = campaigns.filter(c => c.cpl > 0 && c.cpl > client.cpl_target! * 1.5);
    if (overTarget.length > 0) {
      alerts.push({
        severity: "error",
        title: `${overTarget.length} campaign${overTarget.length > 1 ? "s" : ""} with CPL >50% above target`,
        detail: overTarget.map(c => `${c.campaign_name ?? c.campaign_id} ($${c.cpl.toFixed(0)} vs $${client.cpl_target} target)`).join(", "),
      });
    }
  }

  // 5. ROAS below target by >30%
  if (isEcomm && client.roas_target) {
    const underRoas = campaigns.filter(c => {
      const avArr = (c.raw_metrics as Record<string,unknown>)?.action_values as {action_type:string;value:string}[]|undefined;
      const pv = parseFloat(avArr?.find(a=>a.action_type==="purchase")?.value ?? "0");
      const roas = c.spend > 0 && pv > 0 ? pv / c.spend : 0;
      return roas > 0 && roas < client.roas_target! * 0.7;
    });
    if (underRoas.length > 0) {
      alerts.push({
        severity: "error",
        title: `${underRoas.length} campaign${underRoas.length > 1 ? "s" : ""} with ROAS >30% below target`,
        detail: underRoas.map(c => c.campaign_name ?? c.campaign_id).join(", "),
      });
    }
  }

  // 6. Budget pacing alerts
  if (client.monthly_budget && computedDays > 0) {
    const dailyPace = totalSpend / computedDays;
    const projected = dailyPace * 30;
    if (projected > client.monthly_budget * 1.15) {
      const overage = Math.round(projected - client.monthly_budget);
      alerts.push({
        severity: "error",
        title: `Budget overpacing — projected to overspend by $${overage.toLocaleString()}`,
        detail: `Current pace: $${Math.round(dailyPace)}/day · Projected month: $${Math.round(projected).toLocaleString()} vs $${client.monthly_budget.toLocaleString()} budget`,
      });
    } else if (projected < client.monthly_budget * 0.6) {
      const shortfall = Math.round(client.monthly_budget - projected);
      alerts.push({
        severity: "warning",
        title: `Budget underpacing — projected to underspend by $${shortfall.toLocaleString()}`,
        detail: `Current pace: $${Math.round(dailyPace)}/day · Projected month: $${Math.round(projected).toLocaleString()} vs $${client.monthly_budget.toLocaleString()} budget`,
      });
    }
  }

  return alerts;
}

function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {anomalies.map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          background: a.severity === "error" ? "rgba(255,77,77,0.06)" : "rgba(232,184,75,0.06)",
          border: `1px solid ${a.severity === "error" ? "rgba(255,77,77,0.25)" : "rgba(232,184,75,0.25)"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{a.severity === "error" ? "🔴" : "🟡"}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: a.severity === "error" ? "#ff6b6b" : "#e8b84b", marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: "#5a5e72" }}>{a.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Aggregate all campaigns into one synthetic MetricRow for stat cards ──────

type AggRow = MetricRow & { raw_metrics: Record<string, unknown> };

function buildAggregateRow(campaigns: CampaignMetric[]): AggRow {
  const spend       = campaigns.reduce((s, c) => s + c.spend, 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const leads       = campaigns.reduce((s, c) => s + c.leads, 0);
  const cpl         = leads > 0 ? spend / leads : 0;
  const frequency   = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.frequency, 0) / campaigns.length : 0;
  const ctr         = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length : 0;
  const cpm         = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpc         = clicks > 0 ? spend / clicks : 0;

  type ActionRow = { action_type: string; value: string };
  const actionsMap: Record<string, number> = {};
  const actionValuesMap: Record<string, number> = {};
  const videoSumMap: Record<string, Record<string, number>> = {};
  let reach = 0;

  for (const c of campaigns) {
    const raw = c.raw_metrics as Record<string, unknown>;
    reach += parseInt(String(raw.reach ?? "0")) || 0;

    const acts = raw.actions as ActionRow[] | undefined;
    if (acts) for (const a of acts) actionsMap[a.action_type] = (actionsMap[a.action_type] ?? 0) + parseFloat(a.value);

    const avs = raw.action_values as ActionRow[] | undefined;
    if (avs) for (const a of avs) actionValuesMap[a.action_type] = (actionValuesMap[a.action_type] ?? 0) + parseFloat(a.value);

    for (const field of ["video_play_actions","video_continuous_2_sec_watched_actions","video_thruplay_watched_actions",
      "video_p25_watched_actions","video_p50_watched_actions","video_p75_watched_actions",
      "video_p95_watched_actions","video_p100_watched_actions","video_avg_time_watched_actions"]) {
      const arr = raw[field] as ActionRow[] | undefined;
      if (arr) {
        if (!videoSumMap[field]) videoSumMap[field] = {};
        for (const v of arr) videoSumMap[field][v.action_type] = (videoSumMap[field][v.action_type] ?? 0) + parseFloat(v.value);
      }
    }
  }

  const actions       = Object.entries(actionsMap).map(([action_type, v]) => ({ action_type, value: String(v) }));
  const action_values = Object.entries(actionValuesMap).map(([action_type, v]) => ({ action_type, value: String(v) }));
  const cost_per_action_type = Object.entries(actionsMap)
    .filter(([, n]) => n > 0).map(([action_type, n]) => ({ action_type, value: String(spend / n) }));
  const purchaseValue = actionValuesMap["purchase"] ?? 0;
  const purchase_roas = spend > 0 && purchaseValue > 0
    ? [{ action_type: "omni_purchase", value: String(purchaseValue / spend) }] : [];
  const videoFields: Record<string, ActionRow[]> = {};
  for (const [f, map] of Object.entries(videoSumMap))
    videoFields[f] = Object.entries(map).map(([action_type, v]) => ({ action_type, value: String(v) }));

  return {
    spend, impressions, leads, cpl, ctr, frequency,
    raw_metrics: {
      spend: String(spend), impressions: String(impressions), reach: String(reach),
      clicks: String(clicks), unique_clicks: String(clicks),
      frequency: String(frequency), ctr: String(ctr), cpm: String(cpm), cpc: String(cpc),
      actions, action_values, cost_per_action_type, purchase_roas,
      ...videoFields,
    },
  };
}

const btnStyle = (active: boolean) => ({
  padding: "5px 12px", fontSize: 12, borderRadius: 5,
  border: active ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.06)",
  background: active ? "rgba(245,166,35,0.15)" : "transparent",
  color: active ? "#e8eaf0" : "#8b8fa8",
  cursor: "pointer" as const, fontFamily: "'DM Mono', 'Fira Mono', monospace", transition: "all 0.15s",
});

// ─── Stat Card Picker Modal ───────────────────────────────────────────────────

function StatCardPickerModal({ visible, onChange, onClose, onReset }: {
  visible: string[];
  onChange: (keys: string[]) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(METRIC_GROUPS[0].group);

  const filteredGroups = METRIC_GROUPS.map(g => ({
    ...g,
    subgroups: g.subgroups.map(s => ({
      ...s,
      metrics: s.metrics.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase())),
    })).filter(s => s.metrics.length > 0),
  })).filter(g => g.subgroups.length > 0);

  function toggle(key: string) {
    const next = visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key];
    onChange(next);
    localStorage.setItem("visibleStatCards", JSON.stringify(next));
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, width: 780, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f5a623" }}>Customize Stat Cards</div>
            <div style={{ fontSize: 12, color: "#8b8fa8", marginTop: 4 }}>{visible.length} cards selected</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: "12px 24px", borderBottom: "1px solid #13151d" }}>
          <input type="text" placeholder="Search metrics..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: "#0d0f14", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#e8eaf0", fontSize: 13, fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "7px 12px", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 180, borderRight: "1px solid #13151d", padding: "12px 0", overflowY: "auto", flexShrink: 0 }}>
            {filteredGroups.map(g => (
              <div key={g.group} onClick={() => setActiveGroup(g.group)}
                style={{ padding: "8px 16px", fontSize: 12, cursor: "pointer", color: activeGroup === g.group ? "#f5a623" : "#8b8fa8", background: activeGroup === g.group ? "rgba(245,166,35,0.06)" : "transparent", borderLeft: activeGroup === g.group ? "2px solid #f5a623" : "2px solid transparent" }}>
                {g.group}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {filteredGroups.map(g =>
              (search ? true : g.group === activeGroup) && (
                <div key={g.group}>
                  {g.subgroups.map(sub => (
                    <div key={sub.name} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{sub.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {sub.metrics.map(m => (
                          <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: visible.includes(m.key) ? "#e8eaf0" : "#8b8fa8" }}>
                            <input type="checkbox" checked={visible.includes(m.key)} onChange={() => toggle(m.key)} style={{ accentColor: "#f5a623", cursor: "pointer" }} />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onReset} style={{ ...btnStyle(false), padding: "6px 14px" }}>Reset to default</button>
          <button onClick={onClose} style={{ ...btnStyle(true), padding: "8px 20px" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Column Picker Modal ──────────────────────────────────────────────────────

function ColumnPickerModal({
  visibleCols, onChange, onClose, onSavePreset, presets, onLoadPreset, onDeletePreset
}: {
  visibleCols: Set<string>;
  onChange: (cols: Set<string>) => void;
  onClose: () => void;
  onSavePreset: (name: string) => void;
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [activeGroup, setActiveGroup] = useState(METRIC_GROUPS[0].group);

  function toggle(key: string) {
    const next = new Set(visibleCols);
    if (next.has(key)) { if (next.size > 1) next.delete(key); }
    else next.add(key);
    onChange(next);
  }

  const filteredGroups = METRIC_GROUPS.map(g => ({
    ...g,
    subgroups: g.subgroups.map(s => ({
      ...s,
      metrics: s.metrics.filter(m => !search || m.label.toLowerCase().includes(search.toLowerCase()))
    })).filter(s => s.metrics.length > 0)
  })).filter(g => g.subgroups.length > 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, width: 780, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f5a623" }}>Customize Columns</div>
            <div style={{ fontSize: 12, color: "#8b8fa8", marginTop: 4 }}>{visibleCols.size} columns selected</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {presets.length > 0 && (
          <div style={{ padding: "12px 24px", borderBottom: "1px solid #13151d", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em" }}>Presets:</span>
            {presets.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => onLoadPreset(p)} style={{ ...btnStyle(false), padding: "3px 10px", fontSize: 11 }}>
                  {p.name} {p.is_default ? "★" : ""}
                </button>
                <button onClick={() => onDeletePreset(p.id)} style={{ background: "transparent", border: "none", color: "#E8705A", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "12px 24px", borderBottom: "1px solid #13151d" }}>
          <input
            type="text" placeholder="Search metrics..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: "#0d0f14", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#e8eaf0", fontSize: 13, fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "7px 12px", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 160, borderRight: "1px solid #13151d", padding: "12px 0", overflowY: "auto", flexShrink: 0 }}>
            {filteredGroups.map(g => (
              <div key={g.group} onClick={() => setActiveGroup(g.group)}
                style={{ padding: "8px 16px", fontSize: 12, cursor: "pointer", color: activeGroup === g.group ? "#f5a623" : "#8b8fa8", background: activeGroup === g.group ? "rgba(245,166,35,0.06)" : "transparent", borderLeft: activeGroup === g.group ? "2px solid #f5a623" : "2px solid transparent" }}>
                {g.group}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {filteredGroups.map(g =>
              (search ? true : g.group === activeGroup) && (
                <div key={g.group}>
                  {g.subgroups.map(sub => (
                    <div key={sub.name} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{sub.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {sub.metrics.map(m => (
                          <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: visibleCols.has(m.key) ? "#e8eaf0" : "#8b8fa8" }}>
                            <input type="checkbox" checked={visibleCols.has(m.key)} onChange={() => toggle(m.key)} style={{ accentColor: "#f5a623", cursor: "pointer" }} />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {showPresetInput ? (
              <>
                <input type="text" placeholder="Preset name..." value={presetName} onChange={e => setPresetName(e.target.value)}
                  style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#e8eaf0", fontSize: 12, fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "6px 10px", outline: "none", width: 160 }} />
                <button onClick={() => { if (presetName) { onSavePreset(presetName); setPresetName(""); setShowPresetInput(false); } }} style={{ ...btnStyle(true), padding: "6px 12px" }}>Save</button>
                <button onClick={() => setShowPresetInput(false)} style={{ ...btnStyle(false), padding: "6px 12px" }}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setShowPresetInput(true)} style={{ ...btnStyle(false), padding: "6px 12px" }}>Save as preset</button>
            )}
          </div>
          <button onClick={onClose} style={{ ...btnStyle(true), padding: "8px 20px" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

const LEADS_DEFAULT_STAT_CARDS = ["spend", "leads", "cpl", "ctr", "frequency"];
const ECOMM_DEFAULT_STAT_CARDS  = ["spend", "purchases", "purchase_roas", "ctr", "frequency"];

function getDefaultStatCards(vertical: string) {
  return vertical === "ecomm" ? ECOMM_DEFAULT_STAT_CARDS : LEADS_DEFAULT_STAT_CARDS;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { activeClient } = useActiveClient();

  type CampaignPlatform = "meta" | "google" | "tiktok" | "shopify";
  const [activePlatform, setActivePlatform] = useState<CampaignPlatform>("meta");

  // Google Ads state
  const [googleCampaigns, setGoogleCampaigns] = useState<{campaign_id: string; campaign_name: string | null; spend: number; conversions: number; cpa: number | null; ctr: number; impressions: number; clicks: number; status?: string}[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState<string | null>(null);

  // TikTok Ads state
  const [tiktokCampaigns, setTiktokCampaigns] = useState<{campaign_id: string; campaign_name: string | null; campaign_status: string | null; spend: number; conversions: number; cpa: number | null; ctr: number; impressions: number; clicks: number; video_play_actions: number}[]>([]);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState<string | null>(null);

  // Shopify state
  const [shopifyMetrics, setShopifyMetrics] = useState<{date_recorded: string; orders: number; revenue: number; avg_order_value: number | null}[]>([]);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShopName, setShopifyShopName] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showColModal, setShowColModal] = useState(false);
  const [showStatCardModal, setShowStatCardModal] = useState(false);
  const [visibleStatCards, setVisibleStatCards] = useState<string[]>(() => {
    if (typeof window === "undefined") return LEADS_DEFAULT_STAT_CARDS;
    const saved = localStorage.getItem("visibleStatCards");
    return saved ? JSON.parse(saved) : LEADS_DEFAULT_STAT_CARDS;
  });

  // Expand state: campaign → ad sets, ad set → ads
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [adSetLevelData, setAdSetLevelData] = useState<Record<string, AdSetMetric[]>>({});
  const [adSetLevelLoading, setAdSetLevelLoading] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [adLevelData, setAdLevelData] = useState<Record<string, AdMetric[]>>({});
  const [adLevelLoading, setAdLevelLoading] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(sevenAgo);
  const [endDate, setEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<"today" | "7d" | "30d" | "90d" | "max" | "custom">("7d");

  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");

  // Report sharing
  const [reportLink, setReportLink] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  async function generateReport() {
    if (!activeClient || campaigns.length === 0) return;
    setGeneratingReport(true);
    try {
      const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
      const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
      const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const avgCtr = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length : 0;
      const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
      const snapshot = {
        vertical: activeClient.vertical,
        totalSpend, totalLeads, avgCpl, avgCtr, totalImpressions,
        cplTarget: activeClient.cpl_target ?? null,
        roasTarget: activeClient.roas_target ?? null,
        campaigns: campaigns.map(c => ({ campaign_id: c.campaign_id, campaign_name: c.campaign_name, status: c.status, spend: c.spend, leads: c.leads, cpl: c.cpl, ctr: c.ctr, impressions: c.impressions })),
      };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: activeClient.id, client_name: activeClient.name, start_date: startDate, end_date: endDate, snapshot }),
      });
      const data = await res.json();
      if (data.token) setReportLink(`${window.location.origin}/report/${data.token}`);
    } finally {
      setGeneratingReport(false);
    }
  }

  // Charts
  const [showCharts, setShowCharts] = useState(false);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [tsLoading, setTsLoading] = useState(false);
  const [chartMetric, setChartMetric] = useState<string>("spend");
  const [showChartMetricPicker, setShowChartMetricPicker] = useState(false);
  const isEcomm = activeClient?.vertical === "ecomm";

  // Reset chart metric and sort key when switching between leads and ecomm clients
  useEffect(() => {
    setChartMetric("spend");
    setSortKey("spend");
    setSortDir("desc");
  }, [isEcomm]);

  const defaultCols = activeClient?.vertical === "ecomm" ? ECOMM_DEFAULT_COLUMNS : LEADS_DEFAULT_COLUMNS;
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(defaultCols));

  const computedDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));

  const fetchData = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
    setApiError(null);
    const adAccountParam = activeClient.meta_ad_account_id ? `&ad_account_id=${activeClient.meta_ad_account_id}` : "";
    const clientParam = activeClient.id ? `&client_id=${activeClient.id}` : "";
    try {
      const [campaignsRes, presetsRes] = await Promise.all([
        fetch(`/api/agent/metrics/campaigns?startDate=${startDate}&endDate=${endDate}${adAccountParam}${clientParam}`),
        fetch("/api/agent/presets"),
      ]);
      const [campaignsData, presetsData] = await Promise.all([campaignsRes.json(), presetsRes.json()]);
      if (campaignsData.error) {
        console.error("[campaigns] API error:", campaignsData.error);
        setApiError(campaignsData.error);
      } else {
        setApiError(null);
      }
      setCampaigns(campaignsData.campaigns ?? []);
      setPresets(presetsData.presets ?? []);
      const defaultPreset = (presetsData.presets ?? []).find((p: Preset) => p.is_default);
      if (defaultPreset) setVisibleCols(new Set(defaultPreset.columns));
      // Clear expanded state when date range changes
      setExpandedCampaigns(new Set());
      setAdSetLevelData({});
      setExpandedAdSets(new Set());
      setAdLevelData({});
    } catch (err) {
      setCampaigns([]);
      setApiError(err instanceof Error ? err.message : "Network error fetching campaigns");
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, [startDate, endDate, activeClient]);

  const fetchTimeseries = useCallback(async () => {
    if (!activeClient) return;
    setTsLoading(true);
    const adAccountParam = activeClient.meta_ad_account_id ? `&ad_account_id=${activeClient.meta_ad_account_id}` : "";
    const clientParam = activeClient.id ? `&client_id=${activeClient.id}` : "";
    try {
      const res = await fetch(`/api/agent/metrics/campaigns/timeseries?startDate=${startDate}&endDate=${endDate}${adAccountParam}${clientParam}`);
      const data = await res.json();
      setTimeseries(data.timeseries ?? []);
    } catch {
      setTimeseries([]);
    } finally {
      setTsLoading(false);
    }
  }, [startDate, endDate, activeClient]);

  function handleRefresh() {
    // Clear all cached expanded data so re-expanding re-fetches fresh from Meta
    setAdSetLevelData({});
    setAdLevelData({});
    fetchData();
    if (showCharts) fetchTimeseries();
  }

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (showCharts) fetchTimeseries(); }, [showCharts, fetchTimeseries]);

  useEffect(() => {
    if (activePlatform !== "google") return;
    setGoogleLoading(true);
    fetch("/api/google-ads/metrics")
      .then(r => r.json())
      .then(data => {
        setGoogleConnected(data.connected ?? false);
        setGoogleCustomerId(data.customer_id ?? null);
        setGoogleCampaigns(data.metrics ?? []);
      })
      .catch(() => setGoogleCampaigns([]))
      .finally(() => setGoogleLoading(false));
  }, [activePlatform]);

  useEffect(() => {
    if (activePlatform !== "tiktok") return;
    setTiktokLoading(true);
    fetch("/api/tiktok-ads/metrics")
      .then(r => r.json())
      .then(data => {
        setTiktokConnected(data.connected ?? false);
        setTiktokAdvertiserId(data.advertiser_id ?? null);
        setTiktokCampaigns(data.metrics ?? []);
      })
      .catch(() => setTiktokCampaigns([]))
      .finally(() => setTiktokLoading(false));
  }, [activePlatform]);

  useEffect(() => {
    if (activePlatform !== "shopify") return;
    setShopifyLoading(true);
    fetch("/api/shopify/metrics")
      .then(r => r.json())
      .then(data => {
        setShopifyConnected(data.connected ?? false);
        setShopifyShopName(data.shop_name ?? null);
        setShopifyMetrics(data.metrics ?? []);
      })
      .catch(() => setShopifyMetrics([]))
      .finally(() => setShopifyLoading(false));
  }, [activePlatform]);

  // Expand/collapse campaign → load its ad sets
  async function toggleCampaignExpand(campaignId: string) {
    const next = new Set(expandedCampaigns);
    if (next.has(campaignId)) {
      next.delete(campaignId);
      setExpandedCampaigns(next);
      return;
    }
    next.add(campaignId);
    setExpandedCampaigns(next);
    if (adSetLevelData[campaignId]) return;
    setAdSetLevelLoading(prev => new Set(prev).add(campaignId));
    try {
      const res = await fetch(`/api/agent/metrics/adsets?campaignId=${campaignId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setAdSetLevelData(prev => ({ ...prev, [campaignId]: data.ad_sets ?? [] }));
    } catch {
      setAdSetLevelData(prev => ({ ...prev, [campaignId]: [] }));
    } finally {
      setAdSetLevelLoading(prev => { const s = new Set(prev); s.delete(campaignId); return s; });
    }
  }

  // Expand/collapse ad set → load its ads
  async function toggleAdExpand(adSetId: string) {
    const next = new Set(expandedAdSets);
    if (next.has(adSetId)) {
      next.delete(adSetId);
      setExpandedAdSets(next);
      return;
    }
    next.add(adSetId);
    setExpandedAdSets(next);
    if (adLevelData[adSetId]) return;
    setAdLevelLoading(prev => new Set(prev).add(adSetId));
    try {
      const res = await fetch(`/api/agent/metrics/ads?adSetId=${adSetId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setAdLevelData(prev => ({ ...prev, [adSetId]: data.ads ?? [] }));
    } catch {
      setAdLevelData(prev => ({ ...prev, [adSetId]: [] }));
    } finally {
      setAdLevelLoading(prev => { const s = new Set(prev); s.delete(adSetId); return s; });
    }
  }

  async function savePreset(name: string) {
    const res = await fetch("/api/agent/presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, columns: Array.from(visibleCols), is_default: false }) });
    const data = await res.json();
    setPresets(p => [...p, data.preset]);
  }

  async function deletePreset(id: string) {
    await fetch(`/api/agent/presets/${id}`, { method: "DELETE" });
    setPresets(p => p.filter(x => x.id !== id));
  }

  function loadPreset(preset: Preset) { setVisibleCols(new Set(preset.columns)); setShowColModal(false); }
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = campaigns
    .filter(c => !search || (c.campaign_name ?? c.campaign_id).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Active always before paused/inactive
      const aActive = a.status === "ACTIVE" ? 0 : 1;
      const bActive = b.status === "ACTIVE" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      const aVal = Number(a[sortKey as keyof CampaignMetric] ?? 0);
      const bVal = Number(b[sortKey as keyof CampaignMetric] ?? 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  // Summary totals from campaign data
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);

  const visibleColsArray = Array.from(visibleCols);
  const colTemplate = `280px ${visibleColsArray.map(() => "120px").join(" ")}`;
  const colMin = 280 + visibleColsArray.length * 120;

  if (!activeClient) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0f14", fontFamily: "'DM Mono', 'Fira Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>No client selected</div>
          <div style={{ fontSize: 13, color: "#8b8fa8" }}>Go to the Overview and select a client to view their campaigns</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0", padding: "40px 24px" }}>
      {showColModal && (
        <ColumnPickerModal visibleCols={visibleCols} onChange={setVisibleCols} onClose={() => setShowColModal(false)}
          onSavePreset={savePreset} presets={presets} onLoadPreset={loadPreset} onDeletePreset={deletePreset} />
      )}
      {showStatCardModal && (
        <StatCardPickerModal
          visible={visibleStatCards}
          onChange={setVisibleStatCards}
          onClose={() => setShowStatCardModal(false)}
          onReset={() => {
            const def = getDefaultStatCards(activeClient?.vertical ?? "leads");
            setVisibleStatCards(def);
            localStorage.setItem("visibleStatCards", JSON.stringify(def));
          }}
        />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f5a623", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Campaigns</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <p style={{ color: "#8b8fa8", fontSize: 13, margin: 0 }}>Live performance · Campaign → Ad Set → Ad</p>
              <button
                onClick={handleRefresh}
                disabled={loading}
                style={{ ...btnStyle(false), padding: "3px 10px", fontSize: 11, opacity: loading ? 0.5 : 1 }}
              >
                {loading ? "↻ Loading..." : "↻ Refresh"}
              </button>
              {lastRefreshed && !loading && (
                <span style={{ fontSize: 11, color: "#5a5e72" }}>
                  Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {/* Date range + Share Report */}
          <div id="tour-share-report" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Share Report button + link */}
              {campaigns.length > 0 && (
                reportLink ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: 6, padding: "3px 10px" }}>
                    <span style={{ fontSize: 11, color: "#2ecc71" }}>Link ready:</span>
                    <input
                      readOnly value={reportLink}
                      onFocus={e => e.target.select()}
                      style={{ background: "transparent", border: "none", color: "#e8eaf0", fontSize: 11, fontFamily: "'DM Mono', monospace", outline: "none", width: 220 }}
                    />
                    <button onClick={() => { navigator.clipboard.writeText(reportLink); }} style={{ ...btnStyle(false), padding: "1px 8px", fontSize: 10 }}>Copy</button>
                    <button onClick={() => setReportLink(null)} style={{ background: "transparent", border: "none", color: "#5a5e72", cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={generateReport}
                    disabled={generatingReport}
                    style={{ ...btnStyle(false), padding: "3px 10px", fontSize: 11, opacity: generatingReport ? 0.6 : 1, borderColor: "rgba(46,204,113,0.3)", color: "#2ecc71" }}
                  >
                    {generatingReport ? "Generating..." : "↗ Share Report"}
                  </button>
                )
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {([{ key: "today", label: "1D" }, { key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "90d", label: "90D" }, { key: "max", label: "MAX" }, { key: "custom", label: "Custom" }] as { key: typeof datePreset; label: string }[]).map(({ key, label }) => (
                <button key={key} style={btnStyle(datePreset === key)} onClick={() => {
                  setDatePreset(key);
                  if (key === "today") { setStartDate(new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "7d") { setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "30d") { setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "90d") { setStartDate(new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "max") { setStartDate("2024-01-01"); setEndDate(today); }
                }}>{label}</button>
              ))}
            </div>
            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 11, color: "#8b8fa8" }}>FROM</span>
                <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} style={{ background: "transparent", border: "none", color: "#e8eaf0", fontSize: 12, fontFamily: "'DM Mono', 'Fira Mono', monospace", outline: "none" }} />
                <span style={{ fontSize: 11, color: "#5a5e72" }}>—</span>
                <span style={{ fontSize: 11, color: "#8b8fa8" }}>TO</span>
                <input type="date" value={endDate} min={startDate} max={today} onChange={e => setEndDate(e.target.value)} style={{ background: "transparent", border: "none", color: "#e8eaf0", fontSize: 12, fontFamily: "'DM Mono', 'Fira Mono', monospace", outline: "none" }} />
                <button onClick={fetchData} style={{ ...btnStyle(false), padding: "3px 10px" }}>Apply</button>
              </div>
            )}
          </div>
        </div>

        {/* Platform Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
          {[
            { value: "meta", label: "📘 Meta", color: "#1877f2" },
            { value: "google", label: "🔍 Google", color: "#4285f4" },
            { value: "tiktok", label: "🎵 TikTok", color: "#ff0050" },
            { value: "shopify", label: "🛍 Shopify", color: "#96bf48" },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setActivePlatform(p.value as CampaignPlatform)}
              style={{
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                background: "transparent",
                border: "none",
                borderBottom: activePlatform === p.value ? `2px solid ${p.color}` : "2px solid transparent",
                color: activePlatform === p.value ? "#e8eaf0" : "#5a5e72",
                cursor: "pointer",
                fontFamily: "'DM Mono', 'Fira Mono', monospace",
                marginBottom: -1,
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Meta Tab */}
        {activePlatform === "meta" && (
        <>

        {/* Stat Cards */}
        {loading ? (
          <div style={{ color: "#8b8fa8", fontSize: 13, marginBottom: 32 }}>Loading metrics...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ border: `1px dashed ${apiError ? "#7f1d1d" : "#1a3535"}`, borderRadius: 10, padding: "40px 24px", textAlign: "center", color: "#8b8fa8", marginBottom: 32 }}>
            {apiError ? (
              <>
                <div style={{ fontSize: 13, color: "#f87171", marginBottom: 8 }}>Meta API error</div>
                <div style={{ fontSize: 12, color: "#fca5a5", maxWidth: 600, margin: "0 auto", wordBreak: "break-word" }}>{apiError}</div>
              </>
            ) : (
              <div style={{ fontSize: 13 }}>No campaign data for this period.</div>
            )}
          </div>
        ) : (
          <>
            {/* Anomaly Alerts */}
            <AnomalyPanel anomalies={detectAnomalies(campaigns, activeClient, totalSpend, computedDays, isEcomm)} />

            {/* Budget Pacing — full width */}
            <BudgetPacingCard spend={totalSpend} budget={activeClient?.monthly_budget ?? null} computedDays={computedDays} />

            {/* Stat Cards header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: activeClient?.monthly_budget ? 16 : 0 }}>
              <span style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase" }}>Performance</span>
              <button
                onClick={() => setShowStatCardModal(true)}
                style={{ ...btnStyle(false), padding: "3px 10px", fontSize: 11 }}
              >
                ⚙ Customize
              </button>
            </div>

            {/* Stat Cards grid — dynamic from any metric */}
            {(() => {
              const aggRow = buildAggregateRow(campaigns);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
                  {visibleStatCards.map(key => {
                    const def = METRIC_BY_KEY[key];
                    if (!def) return null;
                    const rawVal = formatRowValue(key, aggRow);
                    // Special: CPL color vs target
                    if (key === "cpl" && activeClient?.cpl_target) {
                      return <StatCard key={key} label={def.label} value={rawVal}
                        valueColor={cplStatusColor(aggRow.cpl, activeClient.cpl_target)}
                        target={`$${activeClient.cpl_target}`} />;
                    }
                    // Special: ROAS color vs target
                    if (key === "purchase_roas" && activeClient?.roas_target) {
                      const roasNum = parseFloat(rawVal) || 0;
                      return <StatCard key={key} label={def.label} value={rawVal}
                        valueColor={roasStatusColor(roasNum, activeClient.roas_target)}
                        target={`${activeClient.roas_target}x`} />;
                    }
                    // Special: frequency warning
                    if (key === "frequency") {
                      return <StatCard key={key} label={def.label} value={rawVal}
                        sub={aggRow.frequency > 3 ? "⚠ high" : "ok"} />;
                    }
                    // Special: spend — add window sub
                    if (key === "spend") {
                      return <StatCard key={key} label={def.label} value={rawVal} sub={`${computedDays}d window`} />;
                    }
                    return <StatCard key={key} label={def.label} value={rawVal} />;
                  })}
                </div>
              );
            })()}

            {/* Charts toggle */}
            <div id="tour-chart-toggle" style={{ marginBottom: 24 }}>
              <button
                onClick={() => setShowCharts(v => !v)}
                style={{ ...btnStyle(showCharts), display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontSize: 13 }}>📈</span>
                {showCharts ? "Hide Charts" : "Show Charts"}
              </button>
            </div>

            {/* Chart Panel */}
            {showCharts && (() => {
              // All available chart metrics with metadata
              const CHART_METRIC_DEFS: { key: string; label: string; color: string; format: "currency" | "number" | "percent" | "roas" | "decimal"; group: string }[] = [
                { key: "spend",          label: "Amount Spent",       color: "#f5a623", format: "currency", group: "Delivery" },
                { key: "impressions",    label: "Impressions",         color: "#5a8dee", format: "number",   group: "Delivery" },
                { key: "reach",          label: "Reach",               color: "#4bcfb5", format: "number",   group: "Delivery" },
                { key: "frequency",      label: "Frequency",           color: "#E8705A", format: "decimal",  group: "Delivery" },
                { key: "cpm",            label: "CPM",                 color: "#fc6e51", format: "currency", group: "Delivery" },
                { key: "clicks",         label: "Clicks (All)",        color: "#ac92ec", format: "number",   group: "Clicks" },
                { key: "link_clicks",    label: "Link Clicks",         color: "#c07ef0", format: "number",   group: "Clicks" },
                { key: "unique_clicks",  label: "Unique Clicks",       color: "#a0d468", format: "number",   group: "Clicks" },
                { key: "ctr",            label: "CTR",                 color: "#48cfad", format: "percent",  group: "Clicks" },
                { key: "cpc",            label: "CPC",                 color: "#e8b84b", format: "currency", group: "Clicks" },
                { key: "leads",          label: "Leads",               color: "#7b8cde", format: "number",   group: "Results" },
                { key: "cpl",            label: "Cost per Lead",       color: "#2ecc71", format: "currency", group: "Results" },
                { key: "purchases",      label: "Purchases",           color: "#7b8cde", format: "number",   group: "Results" },
                { key: "purchase_value", label: "Revenue",             color: "#e8b84b", format: "currency", group: "Results" },
                { key: "adds_to_cart",   label: "Add to Cart",         color: "#f5a623", format: "number",   group: "Results" },
                { key: "checkouts",      label: "Checkouts Initiated", color: "#5a8dee", format: "number",   group: "Results" },
                { key: "cpa",            label: "Cost per Purchase",   color: "#c07ef0", format: "currency", group: "Results" },
                { key: "roas",           label: "Purchase ROAS",       color: "#2ecc71", format: "roas",     group: "Results" },
              ];
              const currentDef = CHART_METRIC_DEFS.find(d => d.key === chartMetric) ?? CHART_METRIC_DEFS[0];
              const lineColor  = currentDef.color;
              const fmt = currentDef.format;
              const groups = [...new Set(CHART_METRIC_DEFS.map(d => d.group))];

              const formatVal = (v: number) => {
                if (fmt === "currency") return v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`;
                if (fmt === "roas")    return `${v.toFixed(2)}x`;
                if (fmt === "percent") return `${(v * 100).toFixed(2)}%`;
                if (fmt === "decimal") return v.toFixed(2);
                return v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(Math.round(v));
              };

              return (
                <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>Trend Over Time</div>

                    {/* Metric selector */}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowChartMetricPicker(v => !v)}
                        style={{ ...btnStyle(showChartMetricPicker), padding: "5px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <span style={{ color: lineColor }}>●</span>
                        {currentDef.label}
                        <span style={{ fontSize: 9, color: "#5a5e72" }}>▼</span>
                      </button>

                      {showChartMetricPicker && (
                        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 300, background: "#13151d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 260, maxHeight: 340, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                          {groups.map(group => (
                            <div key={group}>
                              <div style={{ padding: "8px 14px 4px", fontSize: 10, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{group}</div>
                              {CHART_METRIC_DEFS.filter(d => d.group === group).map(d => (
                                <button key={d.key} onClick={() => { setChartMetric(d.key); setShowChartMetricPicker(false); }}
                                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px", background: chartMetric === d.key ? "rgba(245,166,35,0.08)" : "transparent", border: "none", color: chartMetric === d.key ? "#e8eaf0" : "#8b8fa8", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono',monospace", textAlign: "left" as const }}>
                                  <span style={{ color: d.color, fontSize: 8 }}>●</span>
                                  {d.label}
                                  {chartMetric === d.key && <span style={{ marginLeft: "auto", color: "#f5a623", fontSize: 10 }}>✓</span>}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {tsLoading ? (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8fa8", fontSize: 13 }}>Loading chart data...</div>
                  ) : timeseries.length === 0 ? (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8fa8", fontSize: 13 }}>No data for this period</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={timeseries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date"
                          tick={{ fill: "#5a5e72", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                          tickLine={false} axisLine={false}
                          tickFormatter={d => { const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }}
                          interval={Math.max(0, Math.floor(timeseries.length / 8) - 1)}
                        />
                        <YAxis tick={{ fill: "#5a5e72", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                          tickLine={false} axisLine={false}
                          tickFormatter={formatVal} width={56}
                        />
                        <Tooltip
                          contentStyle={{ background: "#13151d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: 12 }}
                          labelStyle={{ color: "#8b8fa8", marginBottom: 4 }}
                          labelFormatter={d => { const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }}
                          formatter={(value) => {
                            const n = Number(value ?? 0);
                            if (fmt === "currency") return [`$${n.toFixed(2)}`, currentDef.label];
                            if (fmt === "roas")     return [`${n.toFixed(2)}x`, currentDef.label];
                            if (fmt === "percent")  return [`${(n * 100).toFixed(2)}%`, currentDef.label];
                            if (fmt === "decimal")  return [n.toFixed(2), currentDef.label];
                            return [Math.round(n).toLocaleString(), currentDef.label];
                          }}
                        />
                        <Line type="monotone" dataKey={chartMetric} stroke={lineColor} strokeWidth={2}
                          dot={timeseries.length <= 30 ? { r: 3, strokeWidth: 0, fill: lineColor } : false}
                          activeDot={{ r: 5, strokeWidth: 0, fill: lineColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              );
            })()}

            {/* Table controls */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#e8eaf0", fontSize: 12, fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "6px 12px", outline: "none", width: 220 }} />

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#5a5e72" }}>SORT</span>
                {(isEcomm
                  ? ["spend", "purchases", "roas", "cost_per_purchase", "ctr", "frequency"] as SortKey[]
                  : ["spend", "leads", "cpl", "ctr", "frequency"] as SortKey[]
                ).map(k => (
                  <button key={k} style={btnStyle(sortKey === k)} onClick={() => toggleSort(k)}>
                    {k === "cost_per_purchase" ? "CPA" : k === "purchase_value" ? "REV" : k.toUpperCase()} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                ))}
              </div>

              <button style={{ ...btnStyle(false), marginLeft: "auto" }} onClick={() => setShowColModal(true)}>
                Columns ({visibleCols.size}) ▾
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#5a5e72", marginBottom: 10 }}>
              {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
            </div>

            {/* Table */}
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "auto" }}>

              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "10px 18px", background: "#161820", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: colMin }}>
                <span>Campaign</span>
                {visibleColsArray.map(col => {
                  const def = METRIC_BY_KEY[col];
                  const sortable = ["spend", "leads", "cpl", "purchases", "roas", "cost_per_purchase", "purchase_value", "ctr", "frequency", "impressions"].includes(col);
                  return (
                    <span key={col} onClick={() => sortable ? toggleSort(col as SortKey) : undefined}
                      style={{ cursor: sortable ? "pointer" : "default", color: sortKey === col ? "#f5a623" : "#5a5e72" }}>
                      {def?.label ?? col} {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "40px 18px", textAlign: "center", color: "#8b8fa8", fontSize: 13 }}>No campaigns match your search.</div>
              ) : (
                filtered.map((campaign, i) => {
                  const isCampaignExpanded = expandedCampaigns.has(campaign.campaign_id);
                  const isCampaignLoading = adSetLevelLoading.has(campaign.campaign_id);
                  const campaignAdSets = adSetLevelData[campaign.campaign_id] ?? [];

                  return (
                    <div key={campaign.campaign_id}>
                      {/* ── Campaign row ── */}
                      <div
                        onClick={() => toggleCampaignExpand(campaign.campaign_id)}
                        title="Click to expand ad sets"
                        style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "14px 18px", borderBottom: "1px solid #13151d", fontSize: 12, alignItems: "center", background: isCampaignExpanded ? "rgba(245,166,35,0.06)" : "transparent", cursor: "pointer", minWidth: colMin, transition: "background 0.15s" }}
                        onMouseEnter={e => { if (!isCampaignExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={e => { if (!isCampaignExpanded) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: "#f5a623", transition: "transform 0.15s", display: "inline-block", transform: isCampaignExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                            <span style={{ color: campaign.status === "ACTIVE" ? "#e8eaf0" : "#5a5e72", fontFamily: "sans-serif", fontSize: 13, fontWeight: 600 }}>
                              {campaign.campaign_name ?? campaign.campaign_id}
                            </span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                              padding: "2px 6px", borderRadius: 4,
                              background: campaign.status === "ACTIVE" ? "rgba(46,204,113,0.12)" : "rgba(90,94,114,0.2)",
                              color: campaign.status === "ACTIVE" ? "#2ecc71" : "#5a5e72",
                              border: `1px solid ${campaign.status === "ACTIVE" ? "rgba(46,204,113,0.25)" : "rgba(90,94,114,0.3)"}`,
                            }}>
                              {campaign.status === "ACTIVE" ? "● Active" : "⏸ Paused"}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: "#3a3e52", fontFamily: "monospace", paddingLeft: 18 }}>{campaign.campaign_id}</div>
                        </div>
                        {visibleColsArray.map(col => {
                          if (col === "trend" || col === "health") return <span key={col} style={{ color: "#5a5e72" }}>—</span>;
                          const val = formatRowValue(col, campaign);
                          let color = "#8b8fa8";
                          if (col === "cpl" && campaign.cpl > 0) color = cplStatusColor(campaign.cpl, activeClient?.cpl_target ?? null);
                          if (col === "roas" && campaign.spend > 0) {
                            const avArr = (campaign.raw_metrics as Record<string, unknown>)?.action_values as { action_type: string; value: string }[] | undefined;
                            const purchaseValue = parseFloat(avArr?.find(a => a.action_type === "purchase")?.value ?? "0");
                            const roasVal = purchaseValue / campaign.spend;
                            if (roasVal > 0) color = roasStatusColor(roasVal, activeClient?.roas_target ?? null);
                          }
                          return <span key={col} style={{ color }}>{val}</span>;
                        })}
                      </div>

                      {/* ── Ad Set rows (expanded under campaign) ── */}
                      {isCampaignExpanded && (
                        <div style={{ background: "#080d0d", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {isCampaignLoading ? (
                            <div style={{ padding: "10px 18px 10px 36px" }}>
                              {[1, 2, 3].map(n => (
                                <div key={n} style={{ display: "flex", gap: 16, padding: "8px 0", alignItems: "center" }}>
                                  <div style={{ width: 120, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                  <div style={{ width: 60, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                  <div style={{ width: 50, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                  <div style={{ width: 50, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                </div>
                              ))}
                              <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                            </div>
                          ) : campaignAdSets.length === 0 ? (
                            <div style={{ padding: "14px 18px 14px 36px", fontSize: 12, color: "#8b8fa8" }}>No ad set data for this period.</div>
                          ) : (
                            <>
                              {/* Ad set sub-header */}
                              <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "8px 18px 8px 36px", background: "#0b1616", borderBottom: "1px solid #13151d", fontSize: 10, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: colMin }}>
                                <span>Ad Set</span>
                                {visibleColsArray.map(col => <span key={col}>{METRIC_BY_KEY[col]?.label ?? col}</span>)}
                              </div>

                              {[...campaignAdSets].sort((a, b) => (a.ad_status === "ACTIVE" ? 0 : 1) - (b.ad_status === "ACTIVE" ? 0 : 1)).map((adSet, j) => {
                                const isAdSetExpanded = expandedAdSets.has(adSet.ad_set_id);
                                const isAdSetLoading = adLevelLoading.has(adSet.ad_set_id);
                                const ads = adLevelData[adSet.ad_set_id] ?? [];
                                const hColor = adSetHealthColor(adSet, isEcomm);

                                return (
                                  <div key={adSet.ad_set_id}>
                                    {/* Ad Set row */}
                                    <div
                                      onClick={e => { e.stopPropagation(); toggleAdExpand(adSet.ad_set_id); }}
                                      title="Click to expand ads"
                                      style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "11px 18px 11px 36px", borderBottom: "1px solid #0a1a1a", fontSize: 11, alignItems: "center", background: isAdSetExpanded ? "#0c1a1a" : j % 2 === 0 ? "#080d0d" : "#0a1212", cursor: "pointer", minWidth: colMin }}
                                    >
                                      <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                          <span style={{ fontSize: 9, color: "#8b8fa8", transition: "transform 0.15s", display: "inline-block", transform: isAdSetExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                                          <span style={{ color: adSet.ad_status === "ACTIVE" ? "#c8e8e8" : "#5a5e72", fontFamily: "sans-serif", fontSize: 12 }}>
                                            {adSet.ad_set_name ?? adSet.ad_set_id}
                                          </span>
                                          <span style={{
                                            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                                            padding: "1px 5px", borderRadius: 3,
                                            background: adSet.ad_status === "ACTIVE" ? "rgba(46,204,113,0.1)" : "rgba(90,94,114,0.18)",
                                            color: adSet.ad_status === "ACTIVE" ? "#2ecc71" : "#5a5e72",
                                          }}>
                                            {adSet.ad_status === "ACTIVE" ? "● Active" : "⏸ Paused"}
                                          </span>
                                          <span style={{ fontSize: 9, color: hColor, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{adSetHealthLabel(adSet, isEcomm)}</span>
                                        </div>
                                        <div style={{ fontSize: 9, color: "#3a3e52", fontFamily: "monospace", paddingLeft: 17 }}>{adSet.ad_set_id}</div>
                                      </div>
                                      {visibleColsArray.map(col => {
                                        if (col === "trend") return <div key={col} />;
                                        if (col === "health") return <span key={col} style={{ fontSize: 10, fontWeight: 600, color: hColor, textTransform: "uppercase" }}>{adSetHealthLabel(adSet, isEcomm)}</span>;
                                        const val = formatRowValue(col, adSet);
                                        const isBad = isEcomm
                                          ? col === "roas" && adSet.roas > 0 && adSet.roas < 1.5
                                          : col === "cpl" && adSet.cpl > 30;
                                        const isGood = isEcomm
                                          ? col === "roas" && adSet.roas >= 3
                                          : col === "cpl" && adSet.cpl < 20 && adSet.leads >= 5;
                                        return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#2ecc71" : "#6a9898", fontWeight: isBad ? 600 : 400 }}>{val}</span>;
                                      })}
                                    </div>

                                    {/* ── Ad rows (expanded under ad set) ── */}
                                    {isAdSetExpanded && (
                                      <div style={{ background: "#060b0b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        {/* Ad sub-header */}
                                        <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "7px 18px 7px 56px", background: "#080e0e", borderBottom: "1px solid #0a1515", fontSize: 10, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: colMin }}>
                                          <span>Ad</span>
                                          {visibleColsArray.map(col => <span key={col}>{METRIC_BY_KEY[col]?.label ?? col}</span>)}
                                        </div>

                                        {isAdSetLoading ? (
                                          <div style={{ padding: "8px 18px 8px 56px" }}>
                                            {[1, 2].map(n => (
                                              <div key={n} style={{ display: "flex", gap: 14, padding: "6px 0", alignItems: "center" }}>
                                                <div style={{ width: 100, height: 11, borderRadius: 5, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                                <div style={{ width: 50, height: 11, borderRadius: 5, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                                <div style={{ width: 40, height: 11, borderRadius: 5, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
                                              </div>
                                            ))}
                                          </div>
                                        ) : ads.length === 0 ? (
                                          <div style={{ padding: "12px 18px 12px 56px", fontSize: 11, color: "#8b8fa8" }}>No ad data for this period.</div>
                                        ) : (
                                          [...ads].sort((a, b) => (a.ad_status === "ACTIVE" ? 0 : 1) - (b.ad_status === "ACTIVE" ? 0 : 1)).map((ad, k) => (
                                            <div key={ad.ad_id} style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "9px 18px 9px 56px", borderBottom: "1px solid #09100f", fontSize: 11, alignItems: "center", background: k % 2 === 0 ? "#060b0b" : "#080d0d", minWidth: colMin }}>
                                              <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                                  <span style={{ color: ad.ad_status === "ACTIVE" ? "#a8d8d8" : "#5a5e72", fontSize: 11, fontWeight: 500 }}>{ad.ad_name ?? ad.ad_id}</span>
                                                  <span style={{
                                                    fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                                                    padding: "1px 4px", borderRadius: 3,
                                                    background: ad.ad_status === "ACTIVE" ? "rgba(46,204,113,0.1)" : "rgba(90,94,114,0.18)",
                                                    color: ad.ad_status === "ACTIVE" ? "#2ecc71" : "#5a5e72",
                                                  }}>
                                                    {ad.ad_status === "ACTIVE" ? "● Active" : "⏸ Paused"}
                                                  </span>
                                                </div>
                                                <div style={{ fontSize: 9, color: "#3a3e52", fontFamily: "monospace" }}>{ad.ad_id}</div>
                                              </div>
                                              {visibleColsArray.map(col => {
                                                if (col === "trend" || col === "health") return <span key={col} style={{ color: "#5a5e72" }}>—</span>;
                                                const adRow: MetricRow = { spend: ad.spend, leads: ad.leads, cpl: ad.cpl, purchases: ad.purchases, purchase_value: ad.purchase_value, roas: ad.roas, cost_per_purchase: ad.cost_per_purchase, ctr: ad.ctr, frequency: ad.frequency, impressions: ad.impressions, raw_metrics: ad.raw_metrics };
                                                const val = formatRowValue(col, adRow);
                                                const isBad = isEcomm
                                                  ? col === "roas" && ad.roas > 0 && ad.roas < 1.5
                                                  : col === "cpl" && ad.cpl > 30;
                                                const isGood = isEcomm
                                                  ? col === "roas" && ad.roas >= 3
                                                  : col === "cpl" && ad.cpl < 20 && ad.leads >= 5;
                                                return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#2ecc71" : "#507070" }}>{val}</span>;
                                              })}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        </>
        )}
        {/* End Meta Tab */}

        {/* Google Ads Tab */}
        {activePlatform === "google" && (
          <div>
            {!googleConnected ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>Google Ads not connected</div>
                <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 24 }}>Connect your Google Ads account in Settings to see campaign data here.</div>
                <a href="/dashboard/settings" style={{ padding: "10px 24px", background: "#4285f4", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Go to Settings →
                </a>
              </div>
            ) : googleLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>Loading Google campaigns…</div>
            ) : (
              <div>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#8b8fa8" }}>Customer ID: {googleCustomerId} · {googleCampaigns.length} campaign{googleCampaigns.length !== 1 ? "s" : ""}</div>
                  <button onClick={() => {
                    setGoogleLoading(true);
                    fetch("/api/google-ads/metrics").then(r => r.json()).then(data => { setGoogleCampaigns(data.metrics ?? []); }).finally(() => setGoogleLoading(false));
                  }} style={{ fontSize: 12, color: "#8b8fa8", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    Refresh
                  </button>
                </div>

                {/* Stat cards row */}
                {googleCampaigns.length > 0 && (() => {
                  const totalSpend = googleCampaigns.reduce((s, c) => s + (c.spend ?? 0), 0);
                  const totalConv = googleCampaigns.reduce((s, c) => s + (c.conversions ?? 0), 0);
                  const avgCPA = totalConv > 0 ? totalSpend / totalConv : null;
                  const totalImpr = googleCampaigns.reduce((s, c) => s + (c.impressions ?? 0), 0);
                  const avgCTR = googleCampaigns.length > 0 ? googleCampaigns.reduce((s, c) => s + (c.ctr ?? 0), 0) / googleCampaigns.length : 0;
                  void totalImpr;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                      {[
                        { label: "Total Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#f5a623" },
                        { label: "Conversions", value: totalConv.toLocaleString(), color: "#2ecc71" },
                        { label: "Avg CPA", value: avgCPA ? `$${avgCPA.toFixed(2)}` : "—", color: "#e8eaf0" },
                        { label: "Avg CTR", value: `${(avgCTR * 100).toFixed(2)}%`, color: "#4fc3f7" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" }}>
                          <div style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Campaign table */}
                {googleCampaigns.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>
                    No Google Ads data yet. Data syncs daily at 7am UTC.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Campaign", "Status", "Spend", "Impressions", "Clicks", "CTR", "Conversions", "CPA"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: h === "Campaign" ? "left" : "right" as const, color: "#5a5e72", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {googleCampaigns.map((c, i) => (
                          <tr key={c.campaign_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "10px 12px", color: "#e8eaf0", fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name ?? c.campaign_id}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const }}>
                              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: c.status === "ENABLED" ? "rgba(46,204,113,0.1)" : "rgba(139,143,168,0.1)", color: c.status === "ENABLED" ? "#2ecc71" : "#8b8fa8", fontWeight: 700 }}>
                                {c.status ?? "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#f5a623" }}>${(c.spend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{(c.impressions ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{(c.clicks ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#4fc3f7" }}>{((c.ctr ?? 0) * 100).toFixed(2)}%</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#2ecc71" }}>{(c.conversions ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{c.cpa ? `$${c.cpa.toFixed(2)}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TikTok Ads Tab */}
        {activePlatform === "tiktok" && (
          <div>
            {!tiktokConnected ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎵</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>TikTok Ads not connected</div>
                <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 24 }}>Connect your TikTok Ads account in Settings to see campaign data here.</div>
                <a href="/dashboard/settings" style={{ padding: "10px 24px", background: "#ff0050", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Go to Settings →
                </a>
              </div>
            ) : tiktokLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>Loading TikTok campaigns…</div>
            ) : (
              <div>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#8b8fa8" }}>Advertiser ID: {tiktokAdvertiserId} · {tiktokCampaigns.length} campaign{tiktokCampaigns.length !== 1 ? "s" : ""}</div>
                  <button onClick={() => {
                    setTiktokLoading(true);
                    fetch("/api/tiktok-ads/metrics").then(r => r.json()).then(data => { setTiktokCampaigns(data.metrics ?? []); }).finally(() => setTiktokLoading(false));
                  }} style={{ fontSize: 12, color: "#8b8fa8", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    Refresh
                  </button>
                </div>

                {/* Stat cards row */}
                {tiktokCampaigns.length > 0 && (() => {
                  const totalSpend = tiktokCampaigns.reduce((s, c) => s + (c.spend ?? 0), 0);
                  const totalConv = tiktokCampaigns.reduce((s, c) => s + (c.conversions ?? 0), 0);
                  const avgCPA = totalConv > 0 ? totalSpend / totalConv : null;
                  const avgCTR = tiktokCampaigns.length > 0 ? tiktokCampaigns.reduce((s, c) => s + (c.ctr ?? 0), 0) / tiktokCampaigns.length : 0;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                      {[
                        { label: "Total Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#f5a623" },
                        { label: "Conversions", value: totalConv.toLocaleString(), color: "#2ecc71" },
                        { label: "Avg CPA", value: avgCPA ? `$${avgCPA.toFixed(2)}` : "—", color: "#e8eaf0" },
                        { label: "Avg CTR", value: `${(avgCTR * 100).toFixed(2)}%`, color: "#4fc3f7" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" }}>
                          <div style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Campaign table */}
                {tiktokCampaigns.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>
                    No TikTok Ads data yet. Data syncs daily at 7am UTC.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Campaign", "Spend", "Impressions", "Clicks", "CTR", "Conversions", "CPA", "Video Plays"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: h === "Campaign" ? "left" : "right" as const, color: "#5a5e72", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tiktokCampaigns.map((c, i) => (
                          <tr key={c.campaign_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "10px 12px", color: "#e8eaf0", fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name ?? c.campaign_id}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#f5a623" }}>${(c.spend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{(c.impressions ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{(c.clicks ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#4fc3f7" }}>{((c.ctr ?? 0) * 100).toFixed(2)}%</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#2ecc71" }}>{(c.conversions ?? 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#e8eaf0" }}>{c.cpa ? `$${(c.cpa as number).toFixed(2)}` : "—"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, color: "#c084fc" }}>{(c.video_play_actions ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shopify Tab */}
        {activePlatform === "shopify" && (
          <div>
            {!shopifyConnected && !shopifyLoading && (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🛍️</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>Shopify not connected</div>
                <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 24 }}>Connect your Shopify store in Settings to see revenue and order data here.</div>
                <a href="/dashboard/settings" style={{ padding: "10px 24px", background: "rgba(150,191,98,0.15)", color: "#96bf62", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                  Go to Settings
                </a>
              </div>
            )}
            {shopifyLoading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>Loading Shopify data…</div>
            )}
            {shopifyConnected && !shopifyLoading && (
              <div>
                {shopifyShopName && (
                  <div style={{ marginBottom: 20, fontSize: 13, color: "#8b8fa8" }}>
                    Store: <span style={{ color: "#96bf62", fontWeight: 600 }}>{shopifyShopName}</span>
                  </div>
                )}
                {shopifyMetrics.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#8b8fa8", fontSize: 13 }}>
                    No Shopify data yet. Data syncs daily at 7:30am UTC.
                  </div>
                ) : (
                  <div>
                    {/* Summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
                      {[
                        { label: "Total Revenue", value: `$${shopifyMetrics.reduce((s, r) => s + Number(r.revenue), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { label: "Total Orders", value: shopifyMetrics.reduce((s, r) => s + r.orders, 0).toLocaleString() },
                        { label: "Avg Order Value", value: (() => { const r = shopifyMetrics.filter(r => r.avg_order_value); return r.length ? `$${(r.reduce((s, x) => s + Number(x.avg_order_value), 0) / r.length).toFixed(2)}` : "—" })() },
                        { label: "Days with Data", value: shopifyMetrics.length },
                      ].map(card => (
                        <div key={card.label} style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" }}>
                          <div style={{ fontSize: 11, color: "#8b8fa8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{card.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#e8eaf0" }}>{card.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Daily table */}
                    <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 130px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 700, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <span>Date</span>
                        <span style={{ textAlign: "right" }}>Orders</span>
                        <span style={{ textAlign: "right" }}>Revenue</span>
                        <span style={{ textAlign: "right" }}>Avg Order</span>
                      </div>
                      {shopifyMetrics.slice(0, 30).map((row, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 130px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "#e8eaf0" }}>
                          <span style={{ color: "#8b8fa8" }}>{row.date_recorded}</span>
                          <span style={{ textAlign: "right" }}>{row.orders}</span>
                          <span style={{ textAlign: "right", color: "#96bf62", fontWeight: 600 }}>${Number(row.revenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span style={{ textAlign: "right" }}>{row.avg_order_value ? `$${Number(row.avg_order_value).toFixed(2)}` : "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
