"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Campaign {
  campaign_id: string;
  campaign_name: string | null;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  impressions: number;
}

interface Snapshot {
  vertical: string;
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  avgCtr: number;
  totalImpressions: number;
  cplTarget: number | null;
  roasTarget: number | null;
  campaigns: Campaign[];
}

interface Report {
  client_name: string;
  start_date: string;
  end_date: string;
  snapshot: Snapshot;
  created_at: string;
}

function fmt$(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function ReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(true); else setReport(d); })
      .catch(() => setError(true));
  }, [token]);

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ textAlign: "center", color: "#8b8fa8" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>Report not found</div>
        <div style={{ fontSize: 13 }}>This link may have expired or is invalid.</div>
      </div>
    </div>
  );

  if (!report) return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #f5a623", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const s = report.snapshot;
  const isEcomm = s.vertical === "ecomm";
  const dateRange = `${fmtDate(report.start_date)} – ${fmtDate(report.end_date)}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0", padding: "48px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Performance Report</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#f5a623", margin: "0 0 8px", letterSpacing: "-0.5px" }}>{report.client_name}</h1>
          <div style={{ fontSize: 14, color: "#8b8fa8" }}>{dateRange}</div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 36 }}>
          {[
            { label: "Total Spend",      value: fmt$(s.totalSpend) },
            { label: isEcomm ? "Purchases" : "Total Leads", value: String(s.totalLeads) },
            { label: isEcomm ? "Avg CPA" : "Avg CPL",
              value: fmt$(s.avgCpl),
              color: s.cplTarget && s.avgCpl > 0
                ? s.avgCpl <= s.cplTarget ? "#2ecc71"
                : s.avgCpl <= s.cplTarget * 1.3 ? "#e8b84b" : "#ff4d4d"
                : "#e8eaf0",
              sub: s.cplTarget ? `Target: $${s.cplTarget}` : undefined,
            },
            { label: "Avg CTR",          value: `${(s.avgCtr * 100).toFixed(2)}%` },
            { label: "Impressions",      value: s.totalImpressions.toLocaleString() },
          ].map((card, i) => (
            <div key={i} style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: (card as { color?: string }).color ?? "#e8eaf0", letterSpacing: "-0.5px" }}>{card.value}</div>
              {(card as { sub?: string }).sub && <div style={{ fontSize: 10, color: "#5a5e72", marginTop: 4 }}>{(card as { sub?: string }).sub}</div>}
            </div>
          ))}
        </div>

        {/* Campaigns Table */}
        <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 40 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>Campaigns</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Campaign", "Status", "Spend", isEcomm ? "Purchases" : "Leads", isEcomm ? "CPA" : "CPL", "CTR", "Impressions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 10, color: "#5a5e72", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.campaigns.sort((a, b) => b.spend - a.spend).map((c, i) => (
                  <tr key={c.campaign_id} style={{ borderBottom: i < s.campaigns.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <td style={{ padding: "11px 16px", color: "#e8eaf0", maxWidth: 260 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name ?? c.campaign_id}</div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: c.status === "ACTIVE" ? "rgba(46,204,113,0.15)" : "rgba(90,94,114,0.15)", color: c.status === "ACTIVE" ? "#2ecc71" : "#8b8fa8" }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: "#e8eaf0" }}>{fmt$(c.spend)}</td>
                    <td style={{ padding: "11px 16px", color: "#e8eaf0" }}>{c.leads}</td>
                    <td style={{ padding: "11px 16px", color: c.cpl > 0 && s.cplTarget ? (c.cpl <= s.cplTarget ? "#2ecc71" : c.cpl <= s.cplTarget * 1.3 ? "#e8b84b" : "#ff4d4d") : "#e8eaf0" }}>
                      {c.cpl > 0 ? fmt$(c.cpl) : "—"}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#8b8fa8" }}>{(c.ctr * 100).toFixed(2)}%</td>
                    <td style={{ padding: "11px 16px", color: "#8b8fa8" }}>{c.impressions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#5a5e72" }}>
          Generated {fmtDate(report.created_at.split("T")[0])} · Data reflects the selected date range only
        </div>

      </div>
    </div>
  );
}
