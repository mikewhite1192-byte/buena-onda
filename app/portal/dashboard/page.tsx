"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const T = {
  bg: "#0d0f14",
  card: "#13151d",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.1)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  success: "#4ade80",
  leads: "#f5a623",
  ecomm: "#c07ef0",
};

interface Client {
  id: string;
  name: string;
  vertical: "leads" | "ecomm";
  status: string;
}

interface Campaign {
  id: string;
  avatar: string;
  offer: string;
  daily_budget: string;
  status: string;
  platform: string;
  created_at: string;
}

interface Metric {
  date: string;
  spend: string;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: string | null;
  ctr: string | null;
}

interface Summary {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

interface Branding {
  agency_name: string;
  logo_url: string | null;
  primary_color: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877f2",
  google: "#4fc3f7",
  tiktok: "#ff0050",
  shopify: "#96bf62",
};

function fmt$(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function PortalDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customDomain = searchParams.get("__domain");
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [branding, setBranding] = useState<Branding>({ agency_name: 'Buena Onda', logo_url: null, primary_color: '#f5a623' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Check session
      const meRes = await fetch("/api/client-portal/me");
      const meData = await meRes.json();
      if (!meData.client) {
        router.push("/portal/login");
        return;
      }

      // Load data + branding in parallel
      // On custom domains, fetch branding by domain; otherwise by session cookie
      const brandingUrl = customDomain
        ? `/api/client-portal/branding?domain=${encodeURIComponent(customDomain)}`
        : "/api/client-portal/branding";

      const [dataRes, brandRes] = await Promise.all([
        fetch("/api/client-portal/data"),
        fetch(brandingUrl),
      ]);
      const data = await dataRes.json();
      const brandData = await brandRes.json();

      if (data.error) {
        router.push("/portal/login");
        return;
      }

      setClient(data.client);
      setCampaigns(data.campaigns ?? []);
      setMetrics(data.metrics ?? []);
      setSummary(data.summary ?? null);
      if (brandData.branding) setBranding(brandData.branding);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/client-portal/me", { method: "DELETE" });
    router.push("/portal/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono','Fira Mono',monospace" }}>
        <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  const vertColor = client?.vertical === "leads" ? T.leads : T.ecomm;
  const cpl = summary && summary.leads > 0 ? summary.spend / summary.leads : null;
  const ctr = summary && summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : null;
  const accent = branding.primary_color || T.accent;
  const logoLetter = (branding.agency_name ?? 'B')[0].toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace" }}>

      {/* Top Nav */}
      <div className="sticky top-0 z-[100] flex items-center h-[52px] px-3 sm:px-6" style={{
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.agency_name} style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>{logoLetter}</div>
          )}
          <span style={{ fontWeight: 800, fontSize: 13, color: T.text }}>{branding.agency_name ?? 'Buena Onda'}</span>
          {client && (
            <>
              <span style={{ color: T.faint, fontSize: 12, margin: "0 4px" }}>/</span>
              <span style={{ fontSize: 12, color: T.muted }}>{client.name}</span>
            </>
          )}
        </div>

        {/* Read-only badge */}
        <span style={{ fontSize: 10, color: T.faint, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", marginRight: 12, letterSpacing: "0.06em" }}>
          READ ONLY
        </span>

        <button
          onClick={handleLogout}
          style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
        >
          Sign out
        </button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-[900px] mx-auto">

        {/* Client header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: vertColor, display: "inline-block" }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>{client?.name}</h1>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${vertColor}18`, color: vertColor, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {client?.vertical}
            </span>
          </div>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>Last 30 days — read-only view</p>
        </div>

        {/* Summary stats */}
        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Total Spend", value: fmt$(summary.spend), color: accent },
              { label: "Impressions", value: fmtNum(summary.impressions), color: T.text },
              { label: "Clicks", value: fmtNum(summary.clicks), color: T.text },
              ...(client?.vertical === "leads"
                ? [
                    { label: "Leads", value: fmtNum(summary.leads), color: T.success },
                    { label: "CPL", value: cpl ? `$${cpl.toFixed(2)}` : "—", color: T.success },
                  ]
                : [
                    { label: "CTR", value: ctr ? `${ctr.toFixed(2)}%` : "—", color: T.success },
                  ]
              ),
            ].map((stat) => (
              <div key={stat.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, letterSpacing: "-0.5px" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Daily metrics table */}
        {metrics.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 28, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.text }}>
              Daily Performance
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Date", "Spend", "Impressions", "Clicks", "CTR", "Leads", "CPL"].map(h => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: T.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 14).map((m, i) => {
                    const rowCtr = m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) + "%" : "—";
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "9px 14px", color: T.muted, whiteSpace: "nowrap" }}>
                          {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "9px 14px", color: accent, fontWeight: 600 }}>${parseFloat(m.spend).toFixed(2)}</td>
                        <td style={{ padding: "9px 14px", color: T.text }}>{fmtNum(m.impressions)}</td>
                        <td style={{ padding: "9px 14px", color: T.text }}>{fmtNum(m.clicks)}</td>
                        <td style={{ padding: "9px 14px", color: T.text }}>{rowCtr}</td>
                        <td style={{ padding: "9px 14px", color: T.success }}>{m.leads}</td>
                        <td style={{ padding: "9px 14px", color: m.cpl ? T.success : T.faint }}>
                          {m.cpl ? `$${parseFloat(m.cpl).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaigns */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Campaigns ({campaigns.length})
          </div>
          {campaigns.length === 0 ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px", textAlign: "center", color: T.faint, fontSize: 13 }}>
              No campaigns yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {campaigns.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 sm:gap-[14px]" style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                }}>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.offer}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                      ${parseFloat(c.daily_budget).toFixed(0)}/day budget
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 4,
                    background: `${PLATFORM_COLORS[c.platform] ?? T.accent}18`,
                    color: PLATFORM_COLORS[c.platform] ?? T.accent,
                    fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    {c.platform}
                  </span>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 4,
                    background: c.status === "active" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                    color: c.status === "active" ? T.success : T.faint,
                    fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function PortalDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        <div style={{ color: "#8b8fa8", fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <PortalDashboardInner />
    </Suspense>
  );
}
