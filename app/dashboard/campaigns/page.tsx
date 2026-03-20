"use client";

// app/dashboard/campaigns/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveClient } from "@/lib/context/client-context";
import { METRIC_GROUPS, METRIC_BY_KEY, LEADS_DEFAULT_COLUMNS, ECOMM_DEFAULT_COLUMNS } from "@/lib/meta/metric-definitions";
import type { MetricDef } from "@/lib/meta/metric-definitions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total_spend: number;
  total_leads: number;
  avg_cpl: number;
  avg_ctr: number;
  avg_frequency: number;
  total_impressions: number;
  active_ad_sets: number;
}

interface SummaryResponse {
  current: Summary;
  previous: { total_spend: number; total_leads: number; avg_cpl: number };
  active_briefs: number;
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

type SortKey = "cpl" | "spend" | "leads" | "frequency" | "ctr" | "impressions";
type SortDir = "asc" | "desc";
type HealthFilter = "all" | "Scaling" | "Stable" | "Fatigued" | "CPL High";

interface Preset { id: string; name: string; columns: string[]; is_default: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trendCalc(current: number, previous: number) {
  if (!previous || previous === 0) return { dir: "flat" as const, pct: 0 };
  const pct = ((current - previous) / previous) * 100;
  return { dir: pct > 1 ? "up" as const : pct < -1 ? "down" as const : "flat" as const, pct: Math.abs(pct) };
}

function healthColor(adSet: AdSetMetric): string {
  if (adSet.cpl > 30) return "#E8705A";
  if (adSet.frequency > 3) return "#F5A623";
  if (adSet.cpl < 20 && adSet.leads >= 5) return "#2A8C8A";
  return "#8ab8b8";
}

function healthLabel(adSet: AdSetMetric): HealthFilter {
  if (adSet.cpl > 30) return "CPL High";
  if (adSet.frequency > 3) return "Fatigued";
  if (adSet.cpl < 20 && adSet.leads >= 5) return "Scaling";
  return "Stable";
}

type MetaActionRow = { action_type: string; value: string };

function extractFromRaw(raw: Record<string, unknown>, apiField: string): unknown {
  if (apiField.startsWith("computed:")) return undefined; // handled separately

  const [prefix, actionType] = apiField.split(":");

  if (actionType) {
    // Field is nested in an array (e.g. actions:link_click, cost_per_action_type:lead)
    const arr = raw[prefix] as MetaActionRow[] | undefined;
    return arr?.find((r) => r.action_type === actionType)?.value;
  }

  // Top-level flat field (e.g. cpc, cpm, reach, unique_clicks)
  return raw[apiField];
}

function formatMetricValue(key: string, adSet: AdSetMetric): string {
  const def: MetricDef | undefined = METRIC_BY_KEY[key];
  if (!def) return "—";

  // Fields kept as typed properties on AdSetMetric
  const direct: Record<string, number | string | null> = {
    spend: adSet.spend, leads: adSet.leads, cpl: adSet.cpl,
    ctr: adSet.ctr, frequency: adSet.frequency, impressions: adSet.impressions,
  };

  let val: unknown = direct[key] ?? extractFromRaw(adSet.raw_metrics ?? {}, def.apiField);

  // Computed fields
  if (key === "hook_rate" && val === undefined) {
    const raw = adSet.raw_metrics ?? {};
    const plays = (raw["video_play_actions"] as MetaActionRow[] | undefined)?.find(r => r.action_type === "video_view")?.value;
    const imp = adSet.impressions;
    if (plays && imp > 0) val = parseFloat(plays) / imp;
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


function StatCard({ label, value, sub, trendDir, trendPct, invertTrend }: {
  label: string; value: string; sub?: string;
  trendDir?: "up" | "down" | "flat"; trendPct?: number; invertTrend?: boolean;
}) {
  const isGood = trendDir === "flat" ? null : invertTrend ? trendDir === "down" : trendDir === "up";
  return (
    <div style={{ background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: "#2a4a4a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#e8f4f4", letterSpacing: "-0.5px", marginBottom: 4 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {trendDir && trendDir !== "flat" && trendPct !== undefined && (
          <span style={{ fontSize: 11, color: isGood ? "#2A8C8A" : "#E8705A", fontWeight: 600 }}>
            {trendDir === "up" ? "↑" : "↓"} {trendPct.toFixed(1)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: "#4a7a7a" }}>{sub}</span>}
      </div>
    </div>
  );
}

const btnStyle = (active: boolean) => ({
  padding: "5px 12px", fontSize: 12, borderRadius: 5,
  border: active ? "1px solid #2A8C8A" : "1px solid #1a3535",
  background: active ? "#0B5C5C" : "transparent",
  color: active ? "#e8f4f4" : "#4a7a7a",
  cursor: "pointer" as const, fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
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
      <div style={{ background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 12, width: 780, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a2f2f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#2A8C8A" }}>Customize Columns</div>
            <div style={{ fontSize: 12, color: "#4a7a7a", marginTop: 4 }}>{visibleCols.size} columns selected</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#4a7a7a", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Saved Presets */}
        {presets.length > 0 && (
          <div style={{ padding: "12px 24px", borderBottom: "1px solid #0f1f1f", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Presets:</span>
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

        {/* Search */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #0f1f1f" }}>
          <input
            type="text" placeholder="Search metrics..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: "#0a0f0f", border: "1px solid #1a2f2f", borderRadius: 6, color: "#e8f4f4", fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "7px 12px", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        {/* Body — group tabs + metrics */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Group tabs */}
          <div style={{ width: 160, borderRight: "1px solid #0f1f1f", padding: "12px 0", overflowY: "auto", flexShrink: 0 }}>
            {filteredGroups.map(g => (
              <div
                key={g.group}
                onClick={() => setActiveGroup(g.group)}
                style={{
                  padding: "8px 16px", fontSize: 12, cursor: "pointer",
                  color: activeGroup === g.group ? "#2A8C8A" : "#4a7a7a",
                  background: activeGroup === g.group ? "#0f2020" : "transparent",
                  borderLeft: activeGroup === g.group ? "2px solid #2A8C8A" : "2px solid transparent",
                }}
              >
                {g.group}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {filteredGroups.map(g =>
              (search ? true : g.group === activeGroup) && (
                <div key={g.group}>
                  {g.subgroups.map(sub => (
                    <div key={sub.name} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{sub.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {sub.metrics.map(m => (
                          <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: visibleCols.has(m.key) ? "#e8f4f4" : "#4a7a7a" }}>
                            <input
                              type="checkbox"
                              checked={visibleCols.has(m.key)}
                              onChange={() => toggle(m.key)}
                              style={{ accentColor: "#2A8C8A", cursor: "pointer" }}
                            />
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

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1a2f2f", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {showPresetInput ? (
              <>
                <input
                  type="text" placeholder="Preset name..."
                  value={presetName} onChange={e => setPresetName(e.target.value)}
                  style={{ background: "#0a0f0f", border: "1px solid #1a2f2f", borderRadius: 6, color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "6px 10px", outline: "none", width: 160 }}
                />
                <button
                  onClick={() => { if (presetName) { onSavePreset(presetName); setPresetName(""); setShowPresetInput(false); } }}
                  style={{ ...btnStyle(true), padding: "6px 12px" }}
                >Save</button>
                <button onClick={() => setShowPresetInput(false)} style={{ ...btnStyle(false), padding: "6px 12px" }}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setShowPresetInput(true)} style={{ ...btnStyle(false), padding: "6px 12px" }}>
                Save as preset
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ ...btnStyle(true), padding: "8px 20px" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter();
  const { activeClient } = useActiveClient();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [adSets, setAdSets] = useState<AdSetMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [adLevelData, setAdLevelData] = useState<Record<string, AdMetric[]>>({});
  const [adLevelLoading, setAdLevelLoading] = useState<Set<string>>(new Set());
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showColModal, setShowColModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(sevenAgo);
  const [endDate, setEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<"today" | "7d" | "30d" | "max" | "custom">("7d");

  const [sortKey, setSortKey] = useState<SortKey>("cpl");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedAdSets, setSelectedAdSets] = useState<Set<string>>(new Set());
  const [showAdSetPicker, setShowAdSetPicker] = useState(false);
  const adSetPickerRef = useRef<HTMLDivElement>(null);

  const defaultCols = activeClient?.vertical === "ecomm" ? ECOMM_DEFAULT_COLUMNS : LEADS_DEFAULT_COLUMNS;
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(defaultCols));

  const computedDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const adAccountParam = activeClient?.meta_ad_account_id ? `&ad_account_id=${activeClient.meta_ad_account_id}` : "";
    try {
      const [liveRes, presetsRes] = await Promise.all([
        fetch(`/api/agent/metrics/live?startDate=${startDate}&endDate=${endDate}${adAccountParam}`),
        fetch("/api/agent/presets"),
      ]);
      const [liveData, presetsData] = await Promise.all([liveRes.json(), presetsRes.json()]);
      setSummary({ current: liveData.current, previous: liveData.previous, active_briefs: liveData.active_briefs });
      setAdSets(liveData.ad_sets ?? []);
      setPresets(presetsData.presets ?? []);

      const defaultPreset = (presetsData.presets ?? []).find((p: Preset) => p.is_default);
      if (defaultPreset) setVisibleCols(new Set(defaultPreset.columns));
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, activeClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (adSetPickerRef.current && !adSetPickerRef.current.contains(e.target as Node)) setShowAdSetPicker(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function toggleAdExpand(adSetId: string) {
    const next = new Set(expandedAdSets);
    if (next.has(adSetId)) {
      next.delete(adSetId);
      setExpandedAdSets(next);
      return;
    }
    next.add(adSetId);
    setExpandedAdSets(next);
    if (adLevelData[adSetId]) return; // already loaded
    setAdLevelLoading((prev) => new Set(prev).add(adSetId));
    try {
      const res = await fetch(
        `/api/agent/metrics/ads?adSetId=${adSetId}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      setAdLevelData((prev) => ({ ...prev, [adSetId]: data.ads ?? [] }));
    } catch {
      setAdLevelData((prev) => ({ ...prev, [adSetId]: [] }));
    } finally {
      setAdLevelLoading((prev) => { const s = new Set(prev); s.delete(adSetId); return s; });
    }
  }

  async function savePreset(name: string) {
    const res = await fetch("/api/agent/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, columns: Array.from(visibleCols), is_default: false }),
    });
    const data = await res.json();
    setPresets(p => [...p, data.preset]);
  }

  async function deletePreset(id: string) {
    await fetch(`/api/agent/presets/${id}`, { method: "DELETE" });
    setPresets(p => p.filter(x => x.id !== id));
  }

  function loadPreset(preset: Preset) {
    setVisibleCols(new Set(preset.columns));
    setShowColModal(false);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = adSets
    .filter(a => {
      if (selectedAdSets.size > 0 && !selectedAdSets.has(a.ad_set_id)) return false;
      if (search && !(a.ad_set_name ?? a.ad_set_id).toLowerCase().includes(search.toLowerCase())) return false;
      if (healthFilter !== "all" && healthLabel(a) !== healthFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = Number(a[sortKey as keyof AdSetMetric] ?? 0);
      const bVal = Number(b[sortKey as keyof AdSetMetric] ?? 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const cur = summary?.current;
  const prev = summary?.previous;
  const spendTrend = cur && prev ? trendCalc(cur.total_spend, prev.total_spend) : null;
  const cplTrend = cur && prev ? trendCalc(cur.avg_cpl, prev.avg_cpl) : null;
  const leadsTrend = cur && prev ? trendCalc(cur.total_leads, prev.total_leads) : null;

  const visibleColsArray = Array.from(visibleCols);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8f4f4", padding: "40px 24px" }}>
      {showColModal && (
        <ColumnPickerModal
          visibleCols={visibleCols}
          onChange={setVisibleCols}
          onClose={() => setShowColModal(false)}
          onSavePreset={savePreset}
          presets={presets}
          onLoadPreset={loadPreset}
          onDeletePreset={deletePreset}
        />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2A8C8A", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Campaigns</h1>
            <p style={{ color: "#4a7a7a", fontSize: 13, margin: 0 }}>Live performance across all ad sets.</p>
          </div>

          {/* Date range */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {([{ key: "today", label: "1D" }, { key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "max", label: "MAX" }, { key: "custom", label: "Custom" }] as { key: typeof datePreset; label: string }[]).map(({ key, label }) => (
                <button key={key} style={btnStyle(datePreset === key)} onClick={() => {
                  setDatePreset(key);
                  if (key === "today") { setStartDate(new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "7d") { setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "30d") { setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                  if (key === "max") { setStartDate("2024-01-01"); setEndDate(today); }
                }}>{label}</button>
              ))}
            </div>
            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 11, color: "#4a7a7a" }}>FROM</span>
                <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} style={{ background: "transparent", border: "none", color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none" }} />
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>—</span>
                <span style={{ fontSize: 11, color: "#4a7a7a" }}>TO</span>
                <input type="date" value={endDate} min={startDate} max={today} onChange={e => setEndDate(e.target.value)} style={{ background: "transparent", border: "none", color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none" }} />
                <button onClick={fetchData} style={{ ...btnStyle(false), padding: "3px 10px" }}>Apply</button>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div style={{ color: "#4a7a7a", fontSize: 13, marginBottom: 32 }}>Loading metrics...</div>
        ) : !cur ? (
          <div style={{ border: "1px dashed #1a3535", borderRadius: 10, padding: "40px 24px", textAlign: "center", color: "#4a7a7a", marginBottom: 32 }}>
            <div style={{ fontSize: 13 }}>No metric data yet.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>The agent loop will populate this once it pulls from Meta API.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 32 }}>
              <StatCard label="Total Spend" value={`$${Number(cur.total_spend).toLocaleString()}`} sub={`${computedDays}d window`} trendDir={spendTrend?.dir} trendPct={spendTrend?.pct} />
              <StatCard label="Total Leads" value={String(cur.total_leads)} trendDir={leadsTrend?.dir} trendPct={leadsTrend?.pct} />
              <StatCard label="Avg CPL" value={`$${Number(cur.avg_cpl).toFixed(2)}`} trendDir={cplTrend?.dir} trendPct={cplTrend?.pct} invertTrend />
              <StatCard label="Avg CTR" value={`${(Number(cur.avg_ctr) * 100).toFixed(2)}%`} />
              <StatCard label="Avg Frequency" value={Number(cur.avg_frequency).toFixed(2)} sub={Number(cur.avg_frequency) > 3 ? "⚠ high" : "ok"} />
              <StatCard label="Impressions" value={Number(cur.total_impressions).toLocaleString()} />
              <StatCard label="Ad Sets" value={String(cur.active_ad_sets)} sub={`${summary?.active_briefs ?? 0} briefs pending`} />
            </div>

            {/* Table controls */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>

              {/* Ad set picker */}
              <div ref={adSetPickerRef} style={{ position: "relative" }}>
                <button style={btnStyle(selectedAdSets.size > 0)} onClick={() => setShowAdSetPicker(v => !v)}>
                  Ad Sets {selectedAdSets.size > 0 ? `(${selectedAdSets.size})` : "▾"}
                </button>
                {showAdSetPicker && (
                  <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 50, background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8, padding: "10px 14px", minWidth: 260, maxHeight: 260, overflowY: "auto" }}>
                    {selectedAdSets.size > 0 && (
                      <button onClick={() => setSelectedAdSets(new Set())} style={{ ...btnStyle(false), fontSize: 11, marginBottom: 8, width: "100%", textAlign: "left" as const }}>Clear selection</button>
                    )}
                    {adSets.map(a => (
                      <label key={a.ad_set_id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: selectedAdSets.has(a.ad_set_id) ? "#e8f4f4" : "#4a7a7a", marginBottom: 6 }}>
                        <input type="checkbox" checked={selectedAdSets.has(a.ad_set_id)}
                          onChange={() => setSelectedAdSets(prev => {
                            const next = new Set(prev);
                            if (next.has(a.ad_set_id)) next.delete(a.ad_set_id); else next.add(a.ad_set_id);
                            return next;
                          })}
                          style={{ accentColor: "#2A8C8A" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.ad_set_name ?? a.ad_set_id}</span>
                        <span style={{ color: healthColor(a), fontSize: 10, fontWeight: 600 }}>{healthLabel(a)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Search */}
              <input type="text" placeholder="Search ad sets..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 6, color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", padding: "6px 12px", outline: "none", width: 200 }} />

              {/* Health filter */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>HEALTH</span>
                {(["all", "Scaling", "Stable", "Fatigued", "CPL High"] as HealthFilter[]).map(h => (
                  <button key={h} style={btnStyle(healthFilter === h)} onClick={() => setHealthFilter(h)}>{h === "all" ? "All" : h}</button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>SORT</span>
                {(["cpl", "spend", "leads", "frequency"] as SortKey[]).map(k => (
                  <button key={k} style={btnStyle(sortKey === k)} onClick={() => toggleSort(k)}>
                    {k.toUpperCase()} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                ))}
              </div>

              {/* Column picker */}
              <button style={{ ...btnStyle(false), marginLeft: "auto" }} onClick={() => setShowColModal(true)}>
                Columns ({visibleCols.size}) ▾
              </button>
            </div>

            {/* Results count */}
            <div style={{ fontSize: 11, color: "#2a4a4a", marginBottom: 10 }}>
              {filtered.length} ad set{filtered.length !== 1 ? "s" : ""} {healthFilter !== "all" || search || selectedAdSets.size > 0 ? "matching filters" : "total"}
            </div>

            {/* Table */}
            <div style={{ border: "1px solid #1a2f2f", borderRadius: 10, overflow: "auto" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: `260px ${visibleColsArray.map(() => "120px").join(" ")}`, padding: "10px 18px", background: "#0d1818", borderBottom: "1px solid #1a2f2f", fontSize: 11, color: "#2a4a4a", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 260 + visibleColsArray.length * 120 }}>
                <span>Ad Set</span>
                {visibleColsArray.map(col => {
                  const def = METRIC_BY_KEY[col];
                  const sortable = ["spend", "leads", "cpl", "ctr", "frequency", "impressions"].includes(col);
                  return (
                    <span key={col}
                      onClick={() => sortable ? toggleSort(col as SortKey) : undefined}
                      style={{ cursor: sortable ? "pointer" : "default", color: sortKey === col ? "#2A8C8A" : "#2a4a4a" }}>
                      {def?.label ?? col} {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  );
                })}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding: "40px 18px", textAlign: "center", color: "#4a7a7a", fontSize: 13 }}>
                  {adSets.length === 0 ? "No ad sets found in this window." : "No ad sets match your filters."}
                </div>
              ) : (
                filtered.map((adSet, i) => {
                  const isExpanded = expandedAdSets.has(adSet.ad_set_id);
                  const isLoading = adLevelLoading.has(adSet.ad_set_id);
                  const ads = adLevelData[adSet.ad_set_id] ?? [];
                  const hColor = healthColor(adSet);
                  const isActive = adSet.ad_status === "ACTIVE";
                  const colTemplate = `260px ${visibleColsArray.map(() => "120px").join(" ")}`;
                  const colMin = 260 + visibleColsArray.length * 120;

                  return (
                    <div key={adSet.ad_set_id}>
                      {/* Ad Set row */}
                      <div
                        onClick={() => toggleAdExpand(adSet.ad_set_id)}
                        onDoubleClick={() => router.push(`/dashboard/campaigns/${encodeURIComponent(adSet.ad_set_id)}`)}
                        title="Click to expand ads · Double-click for detail page"
                        style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "13px 18px", borderBottom: "1px solid #0f1f1f", fontSize: 12, alignItems: "center", background: isExpanded ? "#0f1f1f" : i % 2 === 0 ? "#0a0f0f" : "#0c1515", cursor: "pointer", minWidth: colMin }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 10, color: "#4a7a7a", transition: "transform 0.15s", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#2A8C8A" : "#2a4a4a", flexShrink: 0, display: "inline-block" }} />
                            <span style={{ color: "#e8f4f4", fontFamily: "sans-serif", fontSize: 12, fontWeight: 500 }}>
                              {adSet.ad_set_name ?? adSet.ad_set_id}
                            </span>
                            <span style={{ fontSize: 10, color: isActive ? "#2A8C8A" : "#4a7a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {isActive ? "Active" : (adSet.ad_status ?? "—")}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: "#2A8C8A", fontFamily: "monospace", paddingLeft: 22 }}>{adSet.ad_set_id}</div>
                        </div>
                        {visibleColsArray.map(col => {
                          if (col === "trend") return <div key={col} />;
                          if (col === "health") return <span key={col} style={{ fontSize: 11, fontWeight: 600, color: hColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{healthLabel(adSet)}</span>;
                          const val = formatMetricValue(col, adSet);
                          const isBad = col === "cpl" && adSet.cpl > 30;
                          const isGood = col === "cpl" && adSet.cpl < 20 && adSet.leads >= 5;
                          return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#2A8C8A" : "#8ab8b8", fontWeight: isBad ? 600 : 400 }}>{val}</span>;
                        })}
                      </div>

                      {/* Expanded: individual ads */}
                      {isExpanded && (
                        <div style={{ background: "#080d0d", borderBottom: "1px solid #1a2f2f", overflowX: "auto" }}>
                          {/* Sub-header */}
                          <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "8px 18px 8px 36px", background: "#0a1212", borderBottom: "1px solid #0f1f1f", fontSize: 10, color: "#2a4a4a", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: colMin }}>
                            <span>Ad</span>
                            {visibleColsArray.map(col => {
                              const def = METRIC_BY_KEY[col];
                              return <span key={col}>{def?.label ?? col}</span>;
                            })}
                          </div>

                          {/* Ad rows */}
                          {isLoading ? (
                            <div style={{ padding: "16px 36px", fontSize: 12, color: "#4a7a7a" }}>Loading ads...</div>
                          ) : ads.length === 0 ? (
                            <div style={{ padding: "16px 36px", fontSize: 12, color: "#4a7a7a" }}>No ad data for this period.</div>
                          ) : (
                            ads.map((ad, j) => {
                              const adAsMetric = { ...ad, ad_set_id: ad.ad_id, ad_set_name: ad.ad_name, campaign_id: "", date_recorded: "", raw_metrics: ad.raw_metrics };
                              return (
                                <div key={ad.ad_id} style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "10px 18px 10px 36px", borderBottom: "1px solid #0a1a1a", fontSize: 11, alignItems: "center", background: j % 2 === 0 ? "#080d0d" : "#0a1010", minWidth: colMin }}>
                                  <div>
                                    <div style={{ color: "#c8e8e8", fontSize: 11, fontWeight: 500, marginBottom: 2 }}>{ad.ad_name ?? ad.ad_id}</div>
                                    <div style={{ fontSize: 10, color: "#2A8C8A", fontFamily: "monospace" }}>{ad.ad_id}</div>
                                  </div>
                                  {visibleColsArray.map(col => {
                                    if (col === "trend" || col === "health") return <span key={col} style={{ color: "#2a4a4a" }}>—</span>;
                                    const val = formatMetricValue(col, adAsMetric as AdSetMetric);
                                    const isBad = col === "cpl" && ad.cpl > 30;
                                    const isGood = col === "cpl" && ad.cpl < 20 && ad.leads >= 5;
                                    return <span key={col} style={{ color: isBad ? "#E8705A" : isGood ? "#2A8C8A" : "#6a9898" }}>{val}</span>;
                                  })}
                                </div>
                              );
                            })
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
