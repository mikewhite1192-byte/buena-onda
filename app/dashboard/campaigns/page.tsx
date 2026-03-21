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
  ctr: number;
  frequency: number;
  impressions: number;
  raw_metrics: Record<string, unknown>;
}

type SortKey = "cpl" | "spend" | "leads" | "frequency" | "ctr" | "impressions";
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

function adSetHealthColor(a: AdSetMetric): string {
  if (a.cpl > 30) return "#E8705A";
  if (a.frequency > 3) return "#F5A623";
  if (a.cpl < 20 && a.leads >= 5) return "#f5a623";
  return "#8b8fa8";
}

function adSetHealthLabel(a: AdSetMetric): string {
  if (a.cpl > 30) return "CPL High";
  if (a.frequency > 3) return "Fatigued";
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

function BudgetPacingCard({ spend, budget }: { spend: number; budget: number | null }) {
  if (!budget) return null;
  const pct = Math.min((spend / budget) * 100, 100);
  const overBudget = spend > budget;
  const barColor = overBudget ? "#ff4d4d" : pct >= 85 ? "#e8b84b" : "#2ecc71";
  const label = overBudget
    ? `$${(spend - budget).toLocaleString(undefined, { maximumFractionDigits: 0 })} over`
    : `$${(budget - spend).toLocaleString(undefined, { maximumFractionDigits: 0 })} left`;
  return (
    <div style={{ background: "#161820", border: `1px solid ${barColor}22`, borderRadius: 10, padding: "18px 24px", marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase" }}>Budget Pacing</div>
        <div style={{ fontSize: 11, color: barColor }}>{label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: barColor }}>${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div style={{ fontSize: 12, color: "#5a5e72" }}>/ ${budget.toLocaleString()} budget</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: barColor, marginLeft: "auto" }}>{pct.toFixed(1)}%</div>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

const btnStyle = (active: boolean) => ({
  padding: "5px 12px", fontSize: 12, borderRadius: 5,
  border: active ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.06)",
  background: active ? "rgba(245,166,35,0.15)" : "transparent",
  color: active ? "#e8eaf0" : "#8b8fa8",
  cursor: "pointer" as const, fontFamily: "'DM Mono', 'Fira Mono', monospace", transition: "all 0.15s",
});

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

// ─── Stat Card Config ─────────────────────────────────────────────────────────

const STAT_CARD_OPTIONS = [
  { key: "spend",       label: "Total Spend",    vertical: "both"  },
  { key: "leads",       label: "Total Leads",    vertical: "leads" },
  { key: "purchases",   label: "Purchases",      vertical: "ecomm" },
  { key: "cpl",         label: "Avg CPL",        vertical: "leads" },
  { key: "roas",        label: "Overall ROAS",   vertical: "ecomm" },
  { key: "ctr",         label: "Avg CTR",        vertical: "both"  },
  { key: "frequency",   label: "Avg Frequency",  vertical: "both"  },
  { key: "impressions", label: "Impressions",    vertical: "both"  },
  { key: "campaigns",   label: "Campaign Count", vertical: "both"  },
] as const;

const LEADS_DEFAULT_STAT_CARDS = ["spend", "leads", "cpl", "ctr", "frequency"];
const ECOMM_DEFAULT_STAT_CARDS  = ["spend", "purchases", "roas", "ctr", "frequency"];

function getDefaultStatCards(vertical: string) {
  return vertical === "ecomm" ? ECOMM_DEFAULT_STAT_CARDS : LEADS_DEFAULT_STAT_CARDS;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { activeClient } = useActiveClient();

  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showColModal, setShowColModal] = useState(false);
  const [showStatCustomizer, setShowStatCustomizer] = useState(false);
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

  // Charts
  const [showCharts, setShowCharts] = useState(false);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [tsLoading, setTsLoading] = useState(false);
  const [chartMetric, setChartMetric] = useState<"spend" | "leads" | "cpl" | "roas" | "purchases" | "cpa">("spend");
  const isEcomm = activeClient?.vertical === "ecomm";

  // Reset chart metric when switching between leads and ecomm clients
  useEffect(() => { setChartMetric("spend"); }, [isEcomm]);

  const defaultCols = activeClient?.vertical === "ecomm" ? ECOMM_DEFAULT_COLUMNS : LEADS_DEFAULT_COLUMNS;
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(defaultCols));

  const computedDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));

  const fetchData = useCallback(async () => {
    if (!activeClient) return;
    setLoading(true);
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
        alert(`Meta API error: ${campaignsData.error}`);
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
    } catch {
      setCampaigns([]);
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
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCtr = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length : 0;
  const avgFreq = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.frequency, 0) / campaigns.length : 0;
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);

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

          {/* Date range */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
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

        {/* Stat Cards */}
        {loading ? (
          <div style={{ color: "#8b8fa8", fontSize: 13, marginBottom: 32 }}>Loading metrics...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ border: "1px dashed #1a3535", borderRadius: 10, padding: "40px 24px", textAlign: "center", color: "#8b8fa8", marginBottom: 32 }}>
            <div style={{ fontSize: 13 }}>No campaign data for this period.</div>
          </div>
        ) : (
          <>
            {/* Budget Pacing — full width */}
            <BudgetPacingCard spend={totalSpend} budget={activeClient?.monthly_budget ?? null} />

            {/* Stat Cards header + customizer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: activeClient?.monthly_budget ? 16 : 0 }}>
              <span style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase" }}>Performance</span>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowStatCustomizer(v => !v)}
                  style={{ ...btnStyle(showStatCustomizer), padding: "3px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
                >
                  ⚙ Customize
                </button>
                {showStatCustomizer && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 200, background: "#161820", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 16px", width: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                    <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Visible Cards</div>
                    {STAT_CARD_OPTIONS.filter(o => o.vertical === "both" || o.vertical === (isEcomm ? "ecomm" : "leads")).map(opt => (
                      <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: visibleStatCards.includes(opt.key) ? "#e8eaf0" : "#5a5e72", marginBottom: 8 }}>
                        <input type="checkbox" checked={visibleStatCards.includes(opt.key)}
                          onChange={() => {
                            const next = visibleStatCards.includes(opt.key)
                              ? visibleStatCards.filter(k => k !== opt.key)
                              : [...visibleStatCards, opt.key];
                            setVisibleStatCards(next);
                            localStorage.setItem("visibleStatCards", JSON.stringify(next));
                          }}
                          style={{ accentColor: "#f5a623", cursor: "pointer" }}
                        />
                        {opt.label}
                      </label>
                    ))}
                    <button
                      onClick={() => {
                        const def = getDefaultStatCards(activeClient?.vertical ?? "leads");
                        setVisibleStatCards(def);
                        localStorage.setItem("visibleStatCards", JSON.stringify(def));
                      }}
                      style={{ ...btnStyle(false), padding: "4px 10px", fontSize: 11, marginTop: 4, width: "100%" }}
                    >
                      Reset to default
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
              {visibleStatCards.includes("spend") && (
                <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${computedDays}d window`} />
              )}
              {visibleStatCards.includes("leads") && !isEcomm && (
                <StatCard label="Total Leads" value={String(totalLeads)} />
              )}
              {visibleStatCards.includes("purchases") && isEcomm && (
                <StatCard label="Purchases" value={String(campaigns.reduce((s, c) => {
                  const arr = (c.raw_metrics as Record<string,unknown>)?.actions as {action_type:string;value:string}[]|undefined;
                  return s + parseInt(arr?.find(a=>a.action_type==="purchase")?.value??"0");
                }, 0))} />
              )}
              {visibleStatCards.includes("cpl") && !isEcomm && (
                <StatCard label="Avg CPL" value={`$${avgCpl.toFixed(2)}`}
                  valueColor={cplStatusColor(avgCpl, activeClient?.cpl_target ?? null)}
                  target={activeClient?.cpl_target ? `$${activeClient.cpl_target}` : undefined} />
              )}
              {visibleStatCards.includes("roas") && isEcomm && (() => {
                const totalPurchaseValue = campaigns.reduce((s, c) => {
                  const avArr = (c.raw_metrics as Record<string,unknown>)?.action_values as {action_type:string;value:string}[]|undefined;
                  return s + parseFloat(avArr?.find(a=>a.action_type==="purchase")?.value??"0");
                }, 0);
                const overallRoas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
                return (
                  <StatCard label="Overall ROAS" value={`${overallRoas.toFixed(2)}x`}
                    valueColor={roasStatusColor(overallRoas, activeClient?.roas_target ?? null)}
                    target={activeClient?.roas_target ? `${activeClient.roas_target}x` : undefined} />
                );
              })()}
              {visibleStatCards.includes("ctr") && (
                <StatCard label="Avg CTR" value={`${(avgCtr * 100).toFixed(2)}%`} />
              )}
              {visibleStatCards.includes("frequency") && (
                <StatCard label="Avg Frequency" value={avgFreq.toFixed(2)} sub={avgFreq > 3 ? "⚠ high" : "ok"} />
              )}
              {visibleStatCards.includes("impressions") && (
                <StatCard label="Impressions" value={totalImpressions.toLocaleString()} />
              )}
              {visibleStatCards.includes("campaigns") && (
                <StatCard label="Campaigns" value={String(campaigns.length)} />
              )}
            </div>

            {/* Charts toggle */}
            <div style={{ marginBottom: 24 }}>
              <button
                onClick={() => setShowCharts(v => !v)}
                style={{ ...btnStyle(showCharts), display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontSize: 13 }}>📈</span>
                {showCharts ? "Hide Charts" : "Show Charts"}
              </button>
            </div>

            {/* Chart Panel */}
            {showCharts && (
              <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
                {/* Metric tabs */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>Trend Over Time</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                    {(isEcomm
                      ? ([
                          { key: "spend"     as typeof chartMetric, label: "Spend",     color: "#f5a623" },
                          { key: "purchases" as typeof chartMetric, label: "Purchases", color: "#7b8cde" },
                          { key: "roas"      as typeof chartMetric, label: "ROAS",      color: "#2ecc71" },
                          { key: "cpa"       as typeof chartMetric, label: "CPA",       color: "#c07ef0" },
                        ])
                      : ([
                          { key: "spend" as typeof chartMetric, label: "Spend", color: "#f5a623" },
                          { key: "leads" as typeof chartMetric, label: "Leads", color: "#7b8cde" },
                          { key: "cpl"   as typeof chartMetric, label: "CPL",   color: "#2ecc71" },
                        ])
                    ).map(({ key, label, color: _c }) => (
                      <button
                        key={key}
                        onClick={() => setChartMetric(key)}
                        style={{ ...btnStyle(chartMetric === key), padding: "4px 12px", fontSize: 11 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {tsLoading ? (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8fa8", fontSize: 13 }}>
                    Loading chart data...
                  </div>
                ) : timeseries.length === 0 ? (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8fa8", fontSize: 13 }}>
                    No data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={timeseries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#5a5e72", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={d => {
                          const date = new Date(d + "T12:00:00");
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        }}
                        interval={Math.max(0, Math.floor(timeseries.length / 8) - 1)}
                      />
                      <YAxis
                        tick={{ fill: "#5a5e72", fontSize: 10, fontFamily: "'DM Mono',monospace" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v =>
                          (chartMetric === "spend" || chartMetric === "cpa") ? `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}` :
                          chartMetric === "cpl"   ? `$${v.toFixed(0)}` :
                          chartMetric === "roas"  ? `${v.toFixed(1)}x` :
                          String(v)
                        }
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{ background: "#13151d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: 12 }}
                        labelStyle={{ color: "#8b8fa8", marginBottom: 4 }}
                        labelFormatter={d => {
                          const date = new Date(d + "T12:00:00");
                          return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                        }}
                        formatter={(value) => {
                          const n = Number(value ?? 0);
                          if (chartMetric === "spend")     return [`$${n.toFixed(2)}`, "Spend"];
                          if (chartMetric === "cpl")       return [`$${n.toFixed(2)}`, "CPL"];
                          if (chartMetric === "cpa")       return [`$${n.toFixed(2)}`, "CPA"];
                          if (chartMetric === "roas")      return [`${n.toFixed(2)}x`, "ROAS"];
                          if (chartMetric === "purchases") return [n, "Purchases"];
                          return [n, "Leads"];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={chartMetric}
                        stroke={
                          chartMetric === "spend"     ? "#f5a623" :
                          chartMetric === "leads" || chartMetric === "purchases" ? "#7b8cde" :
                          chartMetric === "roas"      ? "#2ecc71" :
                          chartMetric === "cpa"       ? "#c07ef0" : "#2ecc71"
                        }
                        strokeWidth={2}
                        dot={timeseries.length <= 30 ? { r: 3, strokeWidth: 0, fill: chartMetric === "spend" ? "#f5a623" : chartMetric === "leads" || chartMetric === "purchases" ? "#7b8cde" : chartMetric === "roas" ? "#2ecc71" : chartMetric === "cpa" ? "#c07ef0" : "#2ecc71" } : false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Table controls */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#e8eaf0", fontSize: 12, fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "6px 12px", outline: "none", width: 220 }} />

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#5a5e72" }}>SORT</span>
                {(["spend", "leads", "cpl", "ctr", "frequency"] as SortKey[]).map(k => (
                  <button key={k} style={btnStyle(sortKey === k)} onClick={() => toggleSort(k)}>
                    {k.toUpperCase()} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
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
                  const sortable = ["spend", "leads", "cpl", "ctr", "frequency", "impressions"].includes(col);
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
                        style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "14px 18px", borderBottom: "1px solid #13151d", fontSize: 12, alignItems: "center", background: isCampaignExpanded ? "rgba(245,166,35,0.06)" : i % 2 === 0 ? "#0d0f14" : "#0d0f14", cursor: "pointer", minWidth: colMin }}
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
                            <div style={{ padding: "14px 18px 14px 36px", fontSize: 12, color: "#8b8fa8" }}>Loading ad sets...</div>
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
                                const hColor = adSetHealthColor(adSet);

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
                                          <span style={{ fontSize: 9, color: hColor, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{adSetHealthLabel(adSet)}</span>
                                        </div>
                                        <div style={{ fontSize: 9, color: "#3a3e52", fontFamily: "monospace", paddingLeft: 17 }}>{adSet.ad_set_id}</div>
                                      </div>
                                      {visibleColsArray.map(col => {
                                        if (col === "trend") return <div key={col} />;
                                        if (col === "health") return <span key={col} style={{ fontSize: 10, fontWeight: 600, color: hColor, textTransform: "uppercase" }}>{adSetHealthLabel(adSet)}</span>;
                                        const val = formatRowValue(col, adSet);
                                        const isBad = col === "cpl" && adSet.cpl > 30;
                                        const isGood = col === "cpl" && adSet.cpl < 20 && adSet.leads >= 5;
                                        return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#f5a623" : "#6a9898", fontWeight: isBad ? 600 : 400 }}>{val}</span>;
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
                                          <div style={{ padding: "12px 18px 12px 56px", fontSize: 11, color: "#8b8fa8" }}>Loading ads...</div>
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
                                                const adRow: MetricRow = { spend: ad.spend, leads: ad.leads, cpl: ad.cpl, ctr: ad.ctr, frequency: ad.frequency, impressions: ad.impressions, raw_metrics: ad.raw_metrics };
                                                const val = formatRowValue(col, adRow);
                                                const isBad = col === "cpl" && ad.cpl > 30;
                                                const isGood = col === "cpl" && ad.cpl < 20 && ad.leads >= 5;
                                                return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#f5a623" : "#507070" }}>{val}</span>;
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
      </div>
    </div>
  );
}
