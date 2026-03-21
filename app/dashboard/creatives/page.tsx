"use client";

import { useEffect, useState } from "react";
import { useActiveClient } from "@/lib/context/client-context";
import { isDemoAccount } from "@/lib/demo-data";

const T = {
  bg: "#0d0f14",
  card: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  green: "#2ecc71",
  greenBg: "rgba(46,204,113,0.12)",
  red: "#ff4d4d",
};

interface Creative {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number | null;
  roas: number | null;
  purchases: number;
  leads: number;
  frequency: number;
  thumbnail_url: string | null;
  body: string | null;
  headline: string | null;
  format: string;
  campaign_name: string | null;
  adset_name: string | null;
}

type SortKey = "spend" | "cpl" | "roas" | "ctr" | "impressions";
type StatusFilter = "all" | "ACTIVE" | "PAUSED";

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_CREATIVES_LEADS: Creative[] = [
  { id: "d1", name: "Storm Damage UGC — Homeowner Testimonial", status: "ACTIVE",  spend: 1840, impressions: 148200, clicks: 5634, ctr: 0.038, cpl: 24.50, roas: null, purchases: 0, leads: 75, frequency: 2.4, thumbnail_url: null, body: "My roof was gone in 20 minutes. Here's what I did next.", headline: "Free Roof Inspection — Book Today", format: "VIDEO", campaign_name: "Summit | Storm Season | Lead Gen", adset_name: "Homeowners 35–65 | San Diego" },
  { id: "d2", name: "Before/After Roof Replacement — Static",   status: "ACTIVE",  spend: 1220, impressions: 92400,  clicks: 2682, ctr: 0.029, cpl: 31.00, roas: null, purchases: 0, leads: 39, frequency: 2.1, thumbnail_url: null, body: "Before vs After: See the difference a new roof makes.", headline: "Book a Free Inspection This Week", format: "IMAGE", campaign_name: "Summit | Homeowners LAL", adset_name: "LAL 1% Past Customers" },
  { id: "d3", name: "Free Inspection Offer — Carousel",         status: "ACTIVE",  spend: 620,  impressions: 54800,  clicks: 1151, ctr: 0.021, cpl: 38.75, roas: null, purchases: 0, leads: 16, frequency: 1.8, thumbnail_url: null, body: "Your roof could be failing right now. Get a free inspection.", headline: "Get Your Free Roofing Quote", format: "CAROUSEL", campaign_name: "Summit | Free Quote | Retargeting", adset_name: "Website Visitors 30d" },
  { id: "d4", name: "Hail Season Alert — Video",                status: "PAUSED",  spend: 2100, impressions: 186000, clicks: 2604, ctr: 0.014, cpl: 72.00, roas: null, purchases: 0, leads: 29, frequency: 5.2, thumbnail_url: null, body: "Hail season is here. Is your roof ready?", headline: "Same-Week Inspections Available", format: "VIDEO", campaign_name: "Summit | Hail Season", adset_name: "Homeowners Broad 35–65" },
  { id: "d5", name: "Price Anchor Ad — Static Image",           status: "PAUSED",  spend: 480,  impressions: 41200,  clicks: 371,  ctr: 0.009, cpl: 142.00, roas: null, purchases: 0, leads: 3, frequency: 3.1, thumbnail_url: null, body: "Roof replacements starting at $4,999.", headline: "Affordable Roofing — Get a Quote", format: "IMAGE", campaign_name: "Summit | Price Anchor Test", adset_name: "Homeowners 45–65 | High Income" },
  { id: "d6", name: "Reels — 15s Crew At Work",                 status: "ACTIVE",  spend: 310,  impressions: 28400,  clicks: 1249, ctr: 0.044, cpl: 29.80, roas: null, purchases: 0, leads: 10, frequency: 1.5, thumbnail_url: null, body: "Watch us replace a full roof in one day.", headline: "Summit Roofing — San Diego's Best", format: "VIDEO", campaign_name: "Summit | Reels Test", adset_name: "Broad | 35–65" },
];

const DEMO_CREATIVES_ECOMM: Creative[] = [
  { id: "e1", name: "Summer Drop — Lifestyle Lookbook Video",  status: "ACTIVE", spend: 3200, impressions: 284000, clicks: 13348, ctr: 0.047, cpl: null, roas: 4.10, purchases: 58, leads: 0, frequency: 2.1, thumbnail_url: null, body: "The drop you've been waiting for. Limited pieces.", headline: "Shop the Summer Collection", format: "VIDEO", campaign_name: "Urban Threads | Summer Drop | DPA", adset_name: "Broad LAL 1%" },
  { id: "e2", name: "DPA — Retargeting Catalog",               status: "ACTIVE", spend: 2100, impressions: 198000, clicks: 7524, ctr: 0.038, cpl: null, roas: 3.60, purchases: 42, leads: 0, frequency: 3.2, thumbnail_url: null, body: null, headline: null, format: "CAROUSEL", campaign_name: "Urban Threads | Retargeting 7d", adset_name: "Website Visitors 7d" },
  { id: "e3", name: "UGC Unboxing — Customer Review",          status: "ACTIVE", spend: 1850, impressions: 165000, clicks: 6765, ctr: 0.041, cpl: null, roas: 3.20, purchases: 33, leads: 0, frequency: 2.6, thumbnail_url: null, body: "I wasn't expecting this quality at this price.", headline: "See Why Everyone's Talking About Us", format: "VIDEO", campaign_name: "Urban Threads | Lookalike | Broad", adset_name: "LAL 2% Past Customers" },
  { id: "e4", name: "Static Product Hero — White Background",  status: "PAUSED", spend: 1400, impressions: 134000, clicks: 2412, ctr: 0.018, cpl: null, roas: 1.80, purchases: 14, leads: 0, frequency: 4.8, thumbnail_url: null, body: "Shop the new collection.", headline: "New Arrivals — Shop Now", format: "IMAGE", campaign_name: "Urban Threads | Brand | Cold", adset_name: "Interest Targeting | Fashion" },
  { id: "e5", name: "Influencer Story — @thestyleloft",        status: "ACTIVE", spend: 720,  impressions: 68400,  clicks: 2257, ctr: 0.033, cpl: null, roas: 2.40, purchases: 12, leads: 0, frequency: 1.9, thumbnail_url: null, body: "My honest review after 30 days.", headline: "Honest Review — Worth It?", format: "VIDEO", campaign_name: "Urban Threads | Influencer Test", adset_name: "Lookalike @thestyleloft" },
  { id: "e6", name: "Promo — 20% Off Flash Sale",              status: "PAUSED", spend: 560,  impressions: 48200,  clicks: 1060, ctr: 0.022, cpl: null, roas: 0.90, purchases: 4, leads: 0, frequency: 2.3, thumbnail_url: null, body: "20% off everything. Today only.", headline: "Flash Sale — 20% Off Sitewide", format: "IMAGE", campaign_name: "Urban Threads | Promo | Flash Sale", adset_name: "Past Purchasers + LAL" },
];

function fmt$(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

const FORMAT_ICONS: Record<string, string> = { VIDEO: "▶", IMAGE: "🖼", CAROUSEL: "⊞", STORY: "◻", REEL: "▶" };

export default function CreativesPage() {
  const { activeClient } = useActiveClient();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (activeClient?.id) fetchCreatives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id]);

  async function fetchCreatives() {
    if (!activeClient) return;
    if (isDemoAccount(activeClient.meta_ad_account_id)) {
      setCreatives(activeClient.vertical === "ecomm" ? DEMO_CREATIVES_ECOMM : DEMO_CREATIVES_LEADS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/creatives?adAccountId=${activeClient.meta_ad_account_id}&startDate=${getStartDate()}&endDate=${getToday()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCreatives(data.creatives ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load creatives");
    } finally {
      setLoading(false);
    }
  }

  function getToday() { return new Date().toISOString().split("T")[0]; }
  function getStartDate() { return new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]; }

  const isEcomm = activeClient?.vertical === "ecomm";

  // Top producers
  const withPerf = [...creatives].filter(c => isEcomm ? c.roas != null : c.cpl != null);
  const sorted4Rank = withPerf.sort((a, b) => isEcomm ? (b.roas ?? 0) - (a.roas ?? 0) : (a.cpl ?? 99999) - (b.cpl ?? 99999));
  const topIds = new Set(sorted4Rank.slice(0, 3).map(c => c.id));

  const filtered = [...creatives]
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || (c.body ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "spend") return b.spend - a.spend;
      if (sortBy === "cpl") return (a.cpl ?? 99999) - (b.cpl ?? 99999);
      if (sortBy === "roas") return (b.roas ?? 0) - (a.roas ?? 0);
      if (sortBy === "ctr") return b.ctr - a.ctr;
      if (sortBy === "impressions") return b.impressions - a.impressions;
      return 0;
    });

  const counts = {
    all: creatives.length,
    ACTIVE: creatives.filter(c => c.status === "ACTIVE").length,
    PAUSED: creatives.filter(c => c.status === "PAUSED").length,
  };

  if (!activeClient) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>No client selected</div>
          <div style={{ fontSize: 13 }}>Select a client from the top nav.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text, padding: "32px 28px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Creative Library</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>{activeClient.name}</h1>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{creatives.length} ads · last 30 days</div>
          </div>
          <button onClick={fetchCreatives} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            ↻ Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {/* Status tabs */}
          <div style={{ display: "flex", gap: 3, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4 }}>
            {(["all", "ACTIVE", "PAUSED"] as StatusFilter[]).map(s => {
              const active = statusFilter === s;
              const color = s === "ACTIVE" ? T.green : s === "PAUSED" ? T.muted : T.accent;
              const bg = s === "ACTIVE" ? T.greenBg : s === "PAUSED" ? "rgba(139,143,168,0.12)" : T.accentBg;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "5px 12px", borderRadius: 5, border: "none", fontSize: 11, fontWeight: active ? 600 : 400, background: active ? bg : "transparent", color: active ? color : T.muted, cursor: "pointer", fontFamily: "inherit" }}>
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} <span style={{ fontSize: 10, opacity: 0.7 }}>{counts[s]}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ads…" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none", width: 180 }} />

          {/* Sort */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.faint }}>Sort:</span>
            <div style={{ display: "flex", gap: 3, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4 }}>
              {([
                { v: "spend",      l: "Spend" },
                { v: isEcomm ? "roas" : "cpl", l: isEcomm ? "Best ROAS" : "Best CPL" },
                { v: "ctr",        l: "CTR" },
                { v: "impressions",l: "Reach" },
              ] as { v: SortKey; l: string }[]).map(({ v, l }) => (
                <button key={v} onClick={() => setSortBy(v)} style={{ padding: "5px 10px", borderRadius: 5, border: "none", fontSize: 11, fontWeight: sortBy === v ? 600 : 400, background: sortBy === v ? T.accentBg : "transparent", color: sortBy === v ? T.accent : T.muted, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: T.red, marginBottom: 20 }}>{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🎨</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              {creatives.length === 0 ? "No ads found for this account" : "No ads match this filter"}
            </div>
            <div style={{ fontSize: 13 }}>
              {creatives.length === 0 ? "Run some campaigns and they'll appear here with performance data." : "Try a different filter."}
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {filtered.map(c => (
              <CreativeCard key={c.id} creative={c} isEcomm={isEcomm} isTop={topIds.has(c.id)} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function CreativeCard({ creative: c, isEcomm, isTop }: { creative: Creative; isEcomm: boolean; isTop: boolean }) {
  const isActive = c.status === "ACTIVE";
  const formatIcon = FORMAT_ICONS[c.format] ?? "◻";

  return (
    <div style={{ background: T.card, border: isTop ? "1px solid rgba(245,166,35,0.35)" : `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: isTop ? "0 0 16px rgba(245,166,35,0.07)" : "none" }}>

      {/* Thumbnail */}
      <div style={{ position: "relative", width: "100%", height: 140, background: "linear-gradient(135deg,#1a1d2e,#2a2f45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {c.thumbnail_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.thumbnail_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center", opacity: 0.3 }}>
              <div style={{ fontSize: 28 }}>{formatIcon}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.format}</div>
            </div>
        }
        {/* Status + top badge overlay */}
        <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: isActive ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.6)", color: isActive ? T.green : T.muted, backdropFilter: "blur(4px)" }}>
            {isActive ? "● Live" : "◯ Paused"}
          </span>
          {isTop && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "rgba(245,166,35,0.85)", color: "#0d0f14", letterSpacing: "0.06em", textTransform: "uppercase" }}>★ Top</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
        {c.body && <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.body}</div>}
        {c.campaign_name && <div style={{ fontSize: 10, color: T.faint, marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📁 {c.campaign_name}</div>}

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Metric label="Spend" value={fmt$(c.spend)} />
          {isEcomm
            ? <Metric label="ROAS" value={c.roas != null ? `${c.roas.toFixed(2)}x` : "—"} highlight={c.roas != null && c.roas >= 2} />
            : <Metric label="CPL" value={c.cpl != null ? fmt$(c.cpl) : "—"} />
          }
          <Metric label="CTR" value={`${(c.ctr * 100).toFixed(2)}%`} />
          <Metric label="Impressions" value={fmtK(c.impressions)} />
          <Metric label={isEcomm ? "Purchases" : "Leads"} value={String(isEcomm ? c.purchases : c.leads)} />
          <Metric label="Frequency" value={c.frequency.toFixed(1)} highlight={c.frequency > 4} highlightColor={T.red} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight, highlightColor }: { label: string; value: string; highlight?: boolean; highlightColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? (highlightColor ?? T.green) : T.text }}>{value}</div>
    </div>
  );
}
