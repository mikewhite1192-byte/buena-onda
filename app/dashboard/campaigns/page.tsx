"use client";

// app/dashboard/campaigns/page.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveClient } from "@/lib/context/client-context";

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
  campaign_id: string;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  frequency: number;
  impressions: number;
  date_recorded: string;
}

interface TrendPoint {
  day: string;
  spend: number;
  leads: number;
  cpl: number;
}

type SortKey = "cpl" | "spend" | "leads" | "frequency" | "ctr" | "impressions";
type SortDir = "asc" | "desc";
type HealthFilter = "all" | "Scaling" | "Stable" | "Fatigued" | "CPL High";

const ALL_COLUMNS = ["spend", "leads", "cpl", "ctr", "frequency", "impressions", "trend", "health"] as const;
type Column = typeof ALL_COLUMNS[number];

const COLUMN_LABELS: Record<Column, string> = {
  spend: "Spend",
  leads: "Leads",
  cpl: "CPL",
  ctr: "CTR",
  frequency: "Freq",
  impressions: "Impressions",
  trend: "CPL Trend",
  health: "Health",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trendCalc(current: number, previous: number) {
  if (!previous || previous === 0) return { dir: "flat" as const, pct: 0 };
  const pct = ((current - previous) / previous) * 100;
  return { dir: pct > 1 ? "up" as const : pct < -1 ? "down" as const : "flat" as const, pct: Math.abs(pct) };
}

function fmt(n: number | null | undefined, prefix = "", decimals = 0): string {
  if (n === undefined || n === null) return "—";
  return `${prefix}${Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
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

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return <span style={{ color: "#2a4a4a", fontSize: 11 }}>—</span>;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = points
    .map((v, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { activeClient } = useActiveClient();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [adSets, setAdSets] = useState<AdSetMetric[]>([]);
  const [trends, setTrends] = useState<Record<string, TrendPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAdSet, setSelectedAdSet] = useState<string | null>(null);

  // Date range
  const today = new Date().toISOString().split("T")[0];
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(sevenAgo);
  const [endDate, setEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<"today" | "7d" | "30d" | "max" | "custom">("7d");

  // Table controls
  const [sortKey, setSortKey] = useState<SortKey>("cpl");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [search, setSearch] = useState("");
  const [visibleCols, setVisibleCols] = useState<Set<Column>>(new Set(ALL_COLUMNS));
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [selectedAdSets, setSelectedAdSets] = useState<Set<string>>(new Set());
  const [showAdSetPicker, setShowAdSetPicker] = useState(false);
  const adSetPickerRef = useRef<HTMLDivElement>(null);

  // Compute days from date range for API
  const computedDays = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const acct = activeClient?.meta_ad_account_id;
    const acctParam = acct ? `&ad_account_id=${encodeURIComponent(acct)}` : "";
    try {
      const [sumRes, metricsRes] = await Promise.all([
        fetch(`/api/agent/metrics/summary?days=7${acctParam}`),
        fetch(`/api/agent/metrics?days=${computedDays}${acctParam}`),
      ]);
      const sumData = await sumRes.json();
      const metricsData = await metricsRes.json();
      setSummary(sumData);
      setAdSets(metricsData.ad_sets ?? []);
      setTrends(metricsData.trends ?? {});
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [computedDays, activeClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close col picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
      if (adSetPickerRef.current && !adSetPickerRef.current.contains(e.target as Node)) setShowAdSetPicker(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleCol(col: Column) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) { if (next.size > 2) next.delete(col); }
      else next.add(col);
      return next;
    });
  }

  // Filter + sort
  const filtered = adSets
    .filter((a) => {
      if (selectedAdSets.size > 0 && !selectedAdSets.has(a.ad_set_id)) return false;
      if (search && !a.ad_set_id.toLowerCase().includes(search.toLowerCase())) return false;
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

  // Dynamic grid based on visible cols
  const gridCols = `1.5fr ${Array.from(visibleCols).map(() => "80px").join(" ")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8f4f4", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2A8C8A", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Campaigns</h1>
            <p style={{ color: "#4a7a7a", fontSize: 13, margin: 0 }}>Live performance across all ad sets.</p>
          </div>

          {/* Date range */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { key: "today", label: "Today" },
                { key: "7d", label: "7D" },
                { key: "30d", label: "30D" },
                { key: "max", label: "MAX" },
                { key: "custom", label: "Custom" },
              ] as { key: typeof datePreset; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  style={btnStyle(datePreset === key)}
                  onClick={() => {
                    setDatePreset(key);
                    if (key === "today") { setStartDate(today); setEndDate(today); }
                    if (key === "7d") { setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                    if (key === "30d") { setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]); setEndDate(today); }
                    if (key === "max") { setStartDate("2024-01-01"); setEndDate(today); }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {datePreset === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 11, color: "#4a7a7a" }}>FROM</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none", cursor: "pointer" }}
                />
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>—</span>
                <span style={{ fontSize: 11, color: "#4a7a7a" }}>TO</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none", cursor: "pointer" }}
                />
                <button onClick={fetchData} style={{ ...btnStyle(false), padding: "3px 10px", marginLeft: 4 }}>
                  Apply
                </button>
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
              <StatCard label="Total Spend" value={fmt(cur.total_spend, "$")} sub={`${computedDays}d window`} trendDir={spendTrend?.dir} trendPct={spendTrend?.pct} />
              <StatCard label="Total Leads" value={fmt(cur.total_leads)} trendDir={leadsTrend?.dir} trendPct={leadsTrend?.pct} />
              <StatCard label="Avg CPL" value={fmt(cur.avg_cpl, "$", 2)} trendDir={cplTrend?.dir} trendPct={cplTrend?.pct} invertTrend />
              <StatCard label="Avg CTR" value={`${(Number(cur.avg_ctr) * 100).toFixed(2)}%`} />
              <StatCard label="Avg Frequency" value={fmt(cur.avg_frequency, "", 2)} sub={cur.avg_frequency > 3 ? "⚠ high" : "ok"} />
              <StatCard label="Impressions" value={Number(cur.total_impressions).toLocaleString()} />
              <StatCard label="Active Ad Sets" value={String(cur.active_ad_sets)} sub={`${summary?.active_briefs ?? 0} briefs pending`} />
            </div>

            {/* Table controls */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              {/* Ad set multi-select */}
              <div ref={adSetPickerRef} style={{ position: "relative" }}>
                <button style={btnStyle(selectedAdSets.size > 0)} onClick={() => setShowAdSetPicker((v) => !v)}>
                  Ad Sets {selectedAdSets.size > 0 ? `(${selectedAdSets.size})` : "▾"}
                </button>
                {showAdSetPicker && (
                  <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 50, background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, minWidth: 220, maxHeight: 240, overflowY: "auto" }}>
                    {selectedAdSets.size > 0 && (
                      <button
                        onClick={() => setSelectedAdSets(new Set())}
                        style={{ ...btnStyle(false), fontSize: 11, marginBottom: 4, textAlign: "left" as const }}
                      >
                        Clear selection
                      </button>
                    )}
                    {adSets.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#4a7a7a" }}>No ad sets yet</span>
                    ) : (
                      adSets.map((a) => (
                        <label key={a.ad_set_id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11, color: selectedAdSets.has(a.ad_set_id) ? "#e8f4f4" : "#4a7a7a", fontFamily: "monospace" }}>
                          <input
                            type="checkbox"
                            checked={selectedAdSets.has(a.ad_set_id)}
                            onChange={() => {
                              setSelectedAdSets((prev) => {
                                const next = new Set(prev);
                                if (next.has(a.ad_set_id)) next.delete(a.ad_set_id);
                                else next.add(a.ad_set_id);
                                return next;
                              });
                            }}
                            style={{ accentColor: "#2A8C8A", cursor: "pointer" }}
                          />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.ad_set_id}
                          </span>
                          <span style={{ marginLeft: "auto", color: healthColor(a), fontSize: 10, fontWeight: 600 }}>
                            {healthLabel(a)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search ad set ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 6,
                  color: "#e8f4f4", fontSize: 12, fontFamily: "'DM Mono', monospace",
                  padding: "6px 12px", outline: "none", width: 200,
                }}
              />

              {/* Health filter */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>HEALTH</span>
                {(["all", "Scaling", "Stable", "Fatigued", "CPL High"] as HealthFilter[]).map((h) => (
                  <button key={h} style={btnStyle(healthFilter === h)} onClick={() => setHealthFilter(h)}>
                    {h === "all" ? "All" : h}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#2a4a4a" }}>SORT</span>
                {(["cpl", "spend", "leads", "frequency"] as SortKey[]).map((k) => (
                  <button key={k} style={btnStyle(sortKey === k)} onClick={() => toggleSort(k)}>
                    {k.toUpperCase()} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                ))}
              </div>

              {/* Column picker */}
              <div ref={colPickerRef} style={{ position: "relative", marginLeft: "auto" }}>
                <button style={btnStyle(showColPicker)} onClick={() => setShowColPicker((v) => !v)}>
                  Columns ▾
                </button>
                {showColPicker && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
                    background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8,
                    padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, minWidth: 160,
                  }}>
                    {ALL_COLUMNS.map((col) => (
                      <label key={col} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: visibleCols.has(col) ? "#e8f4f4" : "#4a7a7a" }}>
                        <input
                          type="checkbox"
                          checked={visibleCols.has(col)}
                          onChange={() => toggleCol(col)}
                          style={{ accentColor: "#2A8C8A", cursor: "pointer" }}
                        />
                        {COLUMN_LABELS[col]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results count */}
            <div style={{ fontSize: 11, color: "#2a4a4a", marginBottom: 10 }}>
              {filtered.length} ad set{filtered.length !== 1 ? "s" : ""} {healthFilter !== "all" || search ? "matching filters" : "total"}
            </div>

            {/* Table */}
            <div style={{ border: "1px solid #1a2f2f", borderRadius: 10, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: gridCols, padding: "10px 18px", background: "#0d1818", borderBottom: "1px solid #1a2f2f", fontSize: 11, color: "#2a4a4a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span>Ad Set</span>
                {Array.from(visibleCols).map((col) => (
                  <span
                    key={col}
                    onClick={() => ["spend", "leads", "cpl", "ctr", "frequency", "impressions"].includes(col) ? toggleSort(col as SortKey) : null}
                    style={{ cursor: ["spend", "leads", "cpl", "ctr", "frequency"].includes(col) ? "pointer" : "default", color: sortKey === col ? "#2A8C8A" : "#2a4a4a" }}
                  >
                    {COLUMN_LABELS[col]} {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding: "40px 18px", textAlign: "center", color: "#4a7a7a", fontSize: 13 }}>
                  {adSets.length === 0 ? "No ad sets found in this window." : "No ad sets match your filters."}
                </div>
              ) : (
                filtered.map((adSet, i) => {
                  const adTrends = trends[adSet.ad_set_id] ?? [];
                  const cplPoints = adTrends.map((t) => Number(t.cpl));
                  const spendPoints = adTrends.map((t) => Number(t.spend));
                  const isSelected = selectedAdSet === adSet.ad_set_id;
                  const hColor = healthColor(adSet);

                  return (
                    <div key={adSet.ad_set_id}>
                      <div
                        onClick={() => setSelectedAdSet(isSelected ? null : adSet.ad_set_id)}
                        onDoubleClick={() => router.push(`/dashboard/campaigns/${encodeURIComponent(adSet.ad_set_id)}`)}
                        title="Click to expand · Double-click to open detail page"
                        style={{ display: "grid", gridTemplateColumns: gridCols, padding: "13px 18px", borderBottom: "1px solid #0f1f1f", fontSize: 12, alignItems: "center", background: isSelected ? "#0f1f1f" : i % 2 === 0 ? "#0a0f0f" : "#0c1515", cursor: "pointer" }}
                      >
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ color: "#e8f4f4", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {adSet.ad_set_name ?? adSet.ad_set_id}
                          </div>
                          {adSet.ad_set_name && (
                            <div style={{ color: "#2A8C8A", fontFamily: "monospace", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                              {adSet.ad_set_id}
                            </div>
                          )}
                        </div>
                        {Array.from(visibleCols).map((col) => {
                          if (col === "spend") return <span key={col} style={{ color: "#8ab8b8" }}>${fmt(adSet.spend)}</span>;
                          if (col === "leads") return <span key={col} style={{ color: "#8ab8b8" }}>{adSet.leads}</span>;
                          if (col === "cpl") return <span key={col} style={{ color: adSet.cpl > 30 ? "#E8705A" : adSet.cpl < 20 ? "#2A8C8A" : "#8ab8b8", fontWeight: adSet.cpl > 30 ? 600 : 400 }}>${fmt(adSet.cpl, "", 2)}</span>;
                          if (col === "ctr") return <span key={col} style={{ color: "#8ab8b8" }}>{(Number(adSet.ctr) * 100).toFixed(2)}%</span>;
                          if (col === "frequency") return <span key={col} style={{ color: adSet.frequency > 3 ? "#F5A623" : "#8ab8b8", fontWeight: adSet.frequency > 3 ? 600 : 400 }}>{fmt(adSet.frequency, "", 2)}</span>;
                          if (col === "impressions") return <span key={col} style={{ color: "#8ab8b8" }}>{Number(adSet.impressions).toLocaleString()}</span>;
                          if (col === "trend") return <div key={col}><Sparkline points={cplPoints} color={hColor} /></div>;
                          if (col === "health") return <span key={col} style={{ fontSize: 11, fontWeight: 600, color: hColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{healthLabel(adSet)}</span>;
                          return null;
                        })}
                      </div>

                      {isSelected && (
                        <div style={{ padding: "16px 18px", background: "#0d1818", borderBottom: "1px solid #1a2f2f", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 24, alignItems: "end" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#2a4a4a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>CPL Trend</div>
                            <Sparkline points={cplPoints} color={hColor} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#2a4a4a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Daily Spend</div>
                            <Sparkline points={spendPoints} color="#2A8C8A" />
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/campaigns/${encodeURIComponent(adSet.ad_set_id)}`)}
                            style={{ padding: "8px 14px", fontSize: 12, borderRadius: 6, border: "1px solid #2A8C8A44", background: "#0B5C5C", color: "#e8f4f4", cursor: "pointer", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" as const }}
                          >
                            Full Detail →
                          </button>
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
