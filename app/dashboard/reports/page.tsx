"use client";

// app/dashboard/reports/page.tsx
import { useEffect, useState } from "react";
import { useActiveClient } from "@/lib/context/client-context";

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
  leads: "#7b8cde",
};

interface Client { id: string; name: string; meta_ad_account_id: string; vertical: string; }

interface ReportMetrics {
  totalSpend: number;
  totalLeads: number;
  totalPurchases: number;
  totalPurchaseValue: number;
  avgCPL: number;
  avgCPA: number;
  avgROAS: number;
  avgCTR: number;
  avgFrequency: number;
  totalImpressions: number;
  campaignCount: number;
}

interface Campaign {
  campaign_id: string;
  campaign_name: string | null;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  ctr: number;
  frequency: number;
}

interface Report {
  clientName: string;
  vertical: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  metrics: ReportMetrics;
  campaigns: Campaign[];
  summary: string;
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} style={{ color: T.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "18px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? T.accent, letterSpacing: "-1px" }}>{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const { activeClient } = useActiveClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [emailTo, setEmailTo] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [platform, setPlatform] = useState<"meta" | "google" | "tiktok" | "shopify">("meta");

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(data => {
        const list = data.clients ?? [];
        setClients(list);
        if (activeClient?.id) setSelectedClientId(activeClient.id);
        else if (list.length > 0) setSelectedClientId(list[0].id);
      });
  }, [activeClient?.id]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const isLeads = selectedClient?.vertical === "leads";

  async function generate() {
    if (!selectedClientId) return;
    setGenerating(true);
    setError(null);
    setReport(null);
    setEmailSent(false);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId, startDate, endDate, sendEmail, emailTo: sendEmail ? emailTo : undefined }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setReport(data.report);
      if (sendEmail) setEmailSent(true);
    } catch {
      setError("Failed to generate report. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  function printReport() {
    window.print();
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text, padding: "40px 24px" }}>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-area { background: white !important; color: black !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.accent, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Reports</h1>
          <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Generate performance reports · Email to clients · Print to PDF</p>
        </div>

        {/* Platform Tabs */}
        <div className="no-print" style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {[
            { value: "meta", label: "📘 Meta" },
            { value: "google", label: "🔍 Google" },
            { value: "tiktok", label: "🎵 TikTok" },
            { value: "shopify", label: "🛍 Shopify" },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => { setPlatform(p.value as typeof platform); setReport(null); setError(null); }}
              style={{
                padding: "8px 18px", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none",
                borderBottom: platform === p.value ? `2px solid ${T.accent}` : "2px solid transparent",
                color: platform === p.value ? T.text : T.faint,
                cursor: "pointer", fontFamily: "inherit", marginBottom: -1, transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Generator panel */}
        <div className="no-print" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 20 }}>
            Generate {platform === "google" ? "Google Ads" : platform === "tiktok" ? "TikTok" : platform === "shopify" ? "Shopify" : "Meta"} Report
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            {/* Client */}
            <div>
              <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Client</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none" }}
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Start date */}
            <div>
              <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* End date */}
            <div>
              <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Quick date presets */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[
              { label: "Last 7 days", days: 7 },
              { label: "Last 30 days", days: 30 },
              { label: "This month", days: 0 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  if (days === 0) {
                    start.setDate(1);
                  } else {
                    start.setDate(start.getDate() - days);
                  }
                  setStartDate(start.toISOString().split("T")[0]);
                  setEndDate(end.toISOString().split("T")[0]);
                }}
                style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Email option */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8 }}>
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            <label htmlFor="sendEmail" style={{ fontSize: 12, color: T.muted, cursor: "pointer" }}>Email this report</label>
            {sendEmail && (
              <input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="recipient@email.com"
                style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none" }}
              />
            )}
          </div>

          {error && <div style={{ fontSize: 12, color: "#ff4d4d", marginBottom: 12 }}>{error}</div>}

          <button
            onClick={generate}
            disabled={generating || !selectedClientId}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 8,
              border: `1px solid rgba(245,166,35,0.4)`,
              background: generating ? "rgba(255,255,255,0.03)" : T.accentBg,
              color: generating ? T.faint : T.accent,
              fontSize: 13, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            {generating ? "Generating report..." : "Generate Report →"}
          </button>

          {emailSent && (
            <div style={{ marginTop: 10, fontSize: 12, color: T.healthy, textAlign: "center" }}>
              ✓ Report emailed to {emailTo}
            </div>
          )}
        </div>

        {/* Report output */}
        {report && (
          <div className="print-area" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "32px", position: "relative" }}>

            {/* Print/Email actions */}
            <div className="no-print" style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
              <button
                onClick={printReport}
                style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              >
                🖨 Print / PDF
              </button>
            </div>

            {/* Report header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 5, fontSize: 10, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
                Performance Report
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{report.clientName}</h2>
              <div style={{ fontSize: 13, color: T.muted }}>{report.startDate} → {report.endDate}</div>
            </div>

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
              <StatCard label="Total Spend" value={`$${report.metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              {isLeads ? (
                <>
                  <StatCard label="Total Leads" value={String(report.metrics.totalLeads)} color={T.leads} />
                  <StatCard label="Avg CPL" value={report.metrics.avgCPL > 0 ? `$${report.metrics.avgCPL.toFixed(0)}` : "—"} color={T.healthy} />
                  <StatCard label="Avg CTR" value={`${report.metrics.avgCTR.toFixed(2)}%`} color={T.muted} />
                </>
              ) : (
                <>
                  <StatCard label="Revenue" value={`$${(report.metrics.totalPurchaseValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color={T.healthy} />
                  <StatCard label="ROAS" value={report.metrics.avgROAS > 0 ? `${report.metrics.avgROAS.toFixed(2)}x` : "—"} color={T.accent} />
                  <StatCard label="Purchases" value={String(report.metrics.totalPurchases ?? 0)} color={T.leads} />
                </>
              )}
            </div>

            {/* Secondary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
              <StatCard label="Impressions" value={report.metrics.totalImpressions.toLocaleString()} color={T.text} />
              <StatCard label="Avg Frequency" value={report.metrics.avgFrequency.toFixed(2)} color={report.metrics.avgFrequency > 3 ? "#e8b84b" : T.text} />
              <StatCard label="Avg CTR" value={`${report.metrics.avgCTR.toFixed(2)}%`} color={T.muted} />
              <StatCard label="Campaigns" value={String(report.metrics.campaignCount)} color={T.text} />
            </div>

            {/* AI Summary */}
            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "20px 22px", marginBottom: 28, borderLeft: `3px solid ${T.accent}` }}>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>AI Analysis</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
                {renderMarkdown(report.summary)}
              </div>
            </div>

            {/* Campaign table */}
            {report.campaigns.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Campaign Breakdown</div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: T.surfaceAlt, padding: "8px 14px" }}>
                    {["Campaign", "Spend", isLeads ? "Leads" : "Purchases", isLeads ? "CPL" : "ROAS", isLeads ? "CTR" : "Revenue"].map((h, i) => (
                      <div key={i} style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                    ))}
                  </div>
                  {report.campaigns.map((c, i) => (
                    <div key={c.campaign_id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 14px", borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>{c.campaign_name ?? c.campaign_id}</div>
                      <div style={{ fontSize: 12, color: T.text, textAlign: "right" }}>${Number(c.spend).toFixed(2)}</div>
                      {isLeads ? (
                        <>
                          <div style={{ fontSize: 12, color: T.leads, textAlign: "right" }}>{c.leads}</div>
                          <div style={{ fontSize: 12, color: T.accent, textAlign: "right" }}>${Number(c.cpl).toFixed(2)}</div>
                          <div style={{ fontSize: 12, color: T.muted, textAlign: "right" }}>{Number(c.ctr).toFixed(2)}%</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, color: T.leads, textAlign: "right" }}>{c.purchases ?? 0}</div>
                          <div style={{ fontSize: 12, color: T.accent, textAlign: "right" }}>{Number(c.roas ?? 0).toFixed(2)}x</div>
                          <div style={{ fontSize: 12, color: T.healthy, textAlign: "right" }}>${Number(c.purchase_value ?? 0).toFixed(0)}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.faint }}>
              Generated by Buena Onda · {new Date(report.generatedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!report && !generating && (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.faint }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, color: T.muted, marginBottom: 6 }}>No report generated yet</div>
            <div style={{ fontSize: 12 }}>Select a client and date range above, then hit Generate</div>
          </div>
        )}
      </div>
    </div>
  );
}
