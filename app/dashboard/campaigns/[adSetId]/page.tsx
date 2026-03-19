"use client";

// app/dashboard/campaigns/[adSetId]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricPoint {
  ad_set_id: string;
  campaign_id: string;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  frequency: number;
  impressions: number;
  date_recorded: string;
}

interface AdSetSummary {
  total_spend: number;
  total_leads: number;
  avg_cpl: number;
  best_cpl: number;
  worst_cpl: number;
  avg_ctr: number;
  avg_frequency: number;
  peak_frequency: number;
  data_points: number;
}

interface Action {
  id: number;
  action_type: string;
  action_details: Record<string, unknown>;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  executed: "#2A8C8A",
  approved: "#2A8C8A",
  rejected: "#E8705A",
  flag_review: "#F5A623",
};

const ACTION_LABELS: Record<string, string> = {
  scale: "Scale Budget",
  pause: "Pause",
  creative_brief: "Creative Brief",
  flag_review: "Flag Review",
};

function fmt(n: number | null | undefined, prefix = "", decimals = 0): string {
  if (n === undefined || n === null) return "—";
  return `${prefix}${Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Inline chart using SVG ───────────────────────────────────────────────────

function LineChart({
  points,
  color,
  label,
  formatter,
}: {
  points: { x: string; y: number }[];
  color: string;
  label: string;
  formatter?: (n: number) => string;
}) {
  if (!points.length) return (
    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a4a4a", fontSize: 12 }}>
      No data
    </div>
  );

  const w = 500;
  const h = 100;
  const pad = { top: 10, right: 10, bottom: 24, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const ys = points.map((p) => p.y);
  const maxY = Math.max(...ys, 1);
  const minY = Math.min(...ys, 0);
  const rangeY = maxY - minY || 1;

  const coords = points.map((p, i) => ({
    x: pad.left + (i / Math.max(points.length - 1, 1)) * innerW,
    y: pad.top + innerH - ((p.y - minY) / rangeY) * innerH,
    val: p.y,
    label: p.x,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${path} L ${coords[coords.length - 1].x} ${pad.top + innerH} L ${coords[0].x} ${pad.top + innerH} Z`;

  const yTicks = [minY, (minY + maxY) / 2, maxY];

  return (
    <div>
      <div style={{ fontSize: 11, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 120, overflow: "visible" }}>
        <path d={area} fill={`${color}15`} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill={color} opacity={0.8} />
        ))}
        {yTicks.map((v, i) => (
          <text
            key={i}
            x={pad.left - 6}
            y={pad.top + innerH - ((v - minY) / rangeY) * innerH + 4}
            fontSize={9}
            fill="#2a4a4a"
            textAnchor="end"
          >
            {formatter ? formatter(v) : v.toFixed(0)}
          </text>
        ))}
        {coords.length > 0 && (
          <>
            <text x={coords[0].x} y={h - 4} fontSize={9} fill="#2a4a4a" textAnchor="middle">
              {coords[0].label}
            </text>
            <text x={coords[coords.length - 1].x} y={h - 4} fontSize={9} fill="#2a4a4a" textAnchor="middle">
              {coords[coords.length - 1].label}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdSetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adSetId = decodeURIComponent(params.adSetId as string);

  const [data, setData] = useState<{
    summary: AdSetSummary;
    metrics: MetricPoint[];
    actions: Action[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agent/metrics/${encodeURIComponent(adSetId)}?days=${days}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load ad set data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [adSetId, days]);

  const s = data?.summary;
  const metrics = data?.metrics ?? [];
  const actions = data?.actions ?? [];

  const cplPoints = metrics.map((m) => ({ x: new Date(m.date_recorded).toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: Number(m.cpl) }));
  const spendPoints = metrics.map((m) => ({ x: new Date(m.date_recorded).toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: Number(m.spend) }));
  const freqPoints = metrics.map((m) => ({ x: new Date(m.date_recorded).toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: Number(m.frequency) }));
  const ctrPoints = metrics.map((m) => ({ x: new Date(m.date_recorded).toLocaleDateString("en-US", { month: "short", day: "numeric" }), y: Number(m.ctr) * 100 }));

  const btnStyle = (active: boolean) => ({
    padding: "5px 12px", fontSize: 12, borderRadius: 5,
    border: active ? "1px solid #2A8C8A" : "1px solid #1a3535",
    background: active ? "#0B5C5C" : "transparent",
    color: active ? "#e8f4f4" : "#4a7a7a",
    cursor: "pointer" as const, fontFamily: "'DM Mono', monospace",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8f4f4", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <button
          onClick={() => router.push("/dashboard/campaigns")}
          style={{ ...btnStyle(false), marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}
        >
          ← Back to Campaigns
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2A8C8A", margin: "0 0 6px", letterSpacing: "-0.5px", fontFamily: "monospace" }}>
              {adSetId}
            </h1>
            <p style={{ color: "#4a7a7a", fontSize: 12, margin: 0 }}>Ad Set Detail</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([7, 14, 30, 90] as const).map((d) => (
              <button key={d} style={btnStyle(days === d)} onClick={() => setDays(d)}>{d}d</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ color: "#4a7a7a", fontSize: 13 }}>Loading...</div>}
        {error && <div style={{ color: "#E8705A", fontSize: 13, padding: "16px", background: "#2a0f0f", borderRadius: 8, border: "1px solid #E8705A33" }}>{error}</div>}

        {data && s && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
              {[
                { label: "Total Spend", value: fmt(s.total_spend, "$") },
                { label: "Total Leads", value: fmt(s.total_leads) },
                { label: "Avg CPL", value: fmt(s.avg_cpl, "$", 2), flag: Number(s.avg_cpl) > 30 },
                { label: "Best CPL", value: fmt(s.best_cpl, "$", 2), good: true },
                { label: "Worst CPL", value: fmt(s.worst_cpl, "$", 2), flag: true },
                { label: "Avg CTR", value: `${(Number(s.avg_ctr) * 100).toFixed(2)}%` },
                { label: "Avg Frequency", value: fmt(s.avg_frequency, "", 2), flag: Number(s.avg_frequency) > 3 },
                { label: "Peak Frequency", value: fmt(s.peak_frequency, "", 2), flag: Number(s.peak_frequency) > 3 },
              ].map(({ label, value, flag, good }) => (
                <div key={label} style={{ background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: flag ? "#E8705A" : good ? "#2A8C8A" : "#e8f4f4" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              {[
                { points: cplPoints, color: "#E8705A", label: "CPL Over Time", formatter: (n: number) => `$${n.toFixed(0)}` },
                { points: spendPoints, color: "#2A8C8A", label: "Daily Spend", formatter: (n: number) => `$${n.toFixed(0)}` },
                { points: freqPoints, color: "#F5A623", label: "Frequency", formatter: (n: number) => n.toFixed(1) },
                { points: ctrPoints, color: "#8B6FE8", label: "CTR %", formatter: (n: number) => `${n.toFixed(2)}%` },
              ].map(({ points, color, label, formatter }) => (
                <div key={label} style={{ background: "#0d1818", border: "1px solid #1a2f2f", borderRadius: 10, padding: "16px 20px" }}>
                  <LineChart points={points} color={color} label={label} formatter={formatter} />
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#2A8C8A", fontWeight: 600, marginBottom: 12 }}>
                Agent Actions on This Ad Set
              </div>
              {actions.length === 0 ? (
                <div style={{ border: "1px dashed #1a3535", borderRadius: 8, padding: "24px", textAlign: "center", color: "#4a7a7a", fontSize: 12 }}>
                  No actions taken on this ad set yet.
                </div>
              ) : (
                <div style={{ border: "1px solid #1a2f2f", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", padding: "10px 18px", background: "#0d1818", borderBottom: "1px solid #1a2f2f", fontSize: 11, color: "#2a4a4a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <span>Action</span>
                    <span>Details</span>
                    <span>Time</span>
                    <span>Status</span>
                  </div>
                  {actions.map((action, i) => (
                    <div key={action.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", padding: "12px 18px", borderBottom: i < actions.length - 1 ? "1px solid #0f1f1f" : "none", fontSize: 12, background: i % 2 === 0 ? "#0a0f0f" : "#0c1515", alignItems: "center" }}>
                      <span style={{ color: "#8ab8b8" }}>{ACTION_LABELS[action.action_type] ?? action.action_type}</span>
                      <span style={{ color: "#4a7a7a", fontSize: 11 }}>
                        {action.action_type === "scale"
                          ? `$${(action.action_details as Record<string, unknown>)?.current_budget} → $${(action.action_details as Record<string, unknown>)?.new_budget}`
                          : "—"}
                      </span>
                      <span style={{ color: "#2a4a4a", fontSize: 11 }}>{formatDate(action.created_at)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[action.status] ?? "#4a7a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {action.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
