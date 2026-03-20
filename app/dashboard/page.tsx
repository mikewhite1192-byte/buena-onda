"use client";

// app/dashboard/page.tsx — Agency Overview
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActiveClient } from "@/lib/context/client-context";

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
}

interface ClientMetrics {
  totalSpend: number;
  totalLeads: number;
  avgCPL: number;
  campaignCount: number;
  status: "healthy" | "warning" | "critical" | "no_data";
  alert: string | null;
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
}: {
  client: Client;
  onSelect: () => void;
  onMetricsLoaded: (id: string, m: ClientMetrics) => void;
}) {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!client.meta_connected) {
      const m: ClientMetrics = { totalSpend: 0, totalLeads: 0, avgCPL: 0, campaignCount: 0, status: "no_data", alert: "Facebook not connected" };
      setMetrics(m);
      onMetricsLoaded(client.id, m);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/agent/metrics/campaigns?client_id=${client.id}&startDate=${today}&endDate=${today}`)
      .then(r => r.json())
      .then(data => {
        const campaigns = (data.campaigns ?? []) as Array<{ spend: number; leads: number }>;
        const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
        const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
        const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const campaignCount = campaigns.length;
        const { status, alert } = computeStatus(client.vertical, totalSpend, totalLeads, avgCPL, campaignCount);
        const m: ClientMetrics = { totalSpend, totalLeads, avgCPL, campaignCount, status, alert };
        setMetrics(m);
        onMetricsLoaded(client.id, m);
      })
      .catch(() => {
        const m: ClientMetrics = { totalSpend: 0, totalLeads: 0, avgCPL: 0, campaignCount: 0, status: "no_data", alert: "Could not load metrics" };
        setMetrics(m);
        onMetricsLoaded(client.id, m);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id, client.meta_connected]);

  const st = metrics ? STATUS_CONFIG[metrics.status] : STATUS_CONFIG.no_data;
  const isLeads = client.vertical === "leads";
  const isCritical = metrics?.status === "critical";

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
              <MetricBox label="Leads Today" value={String(metrics.totalLeads)} sub="from ads" />
              <MetricBox
                label="Spend Today"
                value={`$${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub="total spend"
              />
              <MetricBox label="Campaigns" value={String(metrics.campaignCount)} sub="with data" />
            </>
          ) : (
            <>
              <MetricBox
                label="Spend Today"
                value={`$${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub="total spend"
              />
              <MetricBox label="Purchases" value={String(metrics.totalLeads)} sub="conversions" />
              <MetricBox label="Campaigns" value={String(metrics.campaignCount)} sub="with data" />
              <MetricBox label="CPA" value={metrics.avgCPL > 0 ? `$${metrics.avgCPL.toFixed(0)}` : "—"} sub="cost per acq." />
            </>
          )
        ) : (
          <div style={{ gridColumn: "1/-1", fontSize: 12, color: T.muted, textAlign: "center", padding: "14px 0" }}>
            {client.meta_connected ? "No campaign spend today" : "Connect Facebook to view metrics"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>View Account →</span>
      </div>
    </div>
  );
}

// ─── Main Overview Page ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { setActiveClient } = useActiveClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [allMetrics, setAllMetrics] = useState<Record<string, ClientMetrics>>({});

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(data => setClients(data.clients ?? []))
      .finally(() => setLoadingClients(false));
  }, []);

  const handleMetricsLoaded = useCallback((id: string, m: ClientMetrics) => {
    setAllMetrics(prev => ({ ...prev, [id]: m }));
  }, []);

  function handleSelectClient(client: Client) {
    setActiveClient({
      id: client.id,
      name: client.name,
      meta_ad_account_id: client.meta_ad_account_id,
      vertical: client.vertical,
    });
    router.push("/dashboard/campaigns");
  }

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const totalSpend = Object.values(allMetrics).reduce((s, m) => s + m.totalSpend, 0);
  const totalLeads = clients
    .filter(c => c.vertical === "leads")
    .reduce((s, c) => s + (allMetrics[c.id]?.totalLeads ?? 0), 0);
  const attentionCount = Object.values(allMetrics).filter(m => m.status === "critical" || m.status === "warning").length;
  const connectedCount = clients.filter(c => c.meta_connected).length;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── No clients welcome screen ────────────────────────────────────────────────
  if (!loadingClients && clients.length === 0) {
    return (
      <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: T.bg }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Welcome to Buena Onda</h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "0 0 32px", lineHeight: 1.6 }}>
            Connect your first client account to start managing Meta ad campaigns with AI.
          </p>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px", textAlign: "left", marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>What you&apos;ll need</div>
            {[
              ["Meta Ad Account ID", "Found in Meta Business Suite → Ad Accounts. Looks like: 123456789"],
              ["Facebook Page ID", "Go to your Facebook Page → About → scroll to bottom. Looks like: 123456789012345"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/clients" style={{ display: "inline-block", background: T.accent, color: "#fff", borderRadius: 8, padding: "11px 28px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Add your first client →
          </Link>
        </div>
      </main>
    );
  }

  // ── Overview dashboard ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "26px 28px", background: T.bg, minHeight: "calc(100vh - 52px)" }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>{getGreeting()} 👋</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
          {today}
          {attentionCount > 0 && (
            <> · <span style={{ color: T.critical }}>{attentionCount} account{attentionCount !== 1 ? "s" : ""} need attention</span></>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          {
            label: "Total Spend Today",
            value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            sub: `across ${clients.length} accounts`,
            color: T.text,
            border: T.border,
          },
          {
            label: "Leads Today",
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

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

        {/* Client cards */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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
