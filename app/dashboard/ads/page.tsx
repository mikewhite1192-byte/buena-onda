"use client";

import { useEffect, useState } from "react";
import { useActiveClient } from "@/lib/context/client-context";
import { isDemoAccount } from "@/lib/demo-data";

const T = {
  bg: "#0d0f14",
  card: "#161820",
  cardHover: "#1c1f2a",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentBorder: "rgba(245,166,35,0.3)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  green: "#2ecc71",
  greenBg: "rgba(46,204,113,0.12)",
  red: "#ff4d4d",
};

interface AdCard {
  id: string;
  name: string;
  status: string;
  body: string | null;
  headline: string | null;
  image_url: string | null;
}

interface AdSetCard {
  id: string;
  name: string;
  status: string;
  daily_budget: number | null;
  targeting: string;
}

interface CampaignCard {
  id: string;
  name: string;
  status: "PAUSED" | "ACTIVE";
  objective: string;
  daily_budget: number | null;
  created_time: string | null;
  ads: AdCard[];
  adsets: AdSetCard[];
}

const OBJECTIVE_LABELS: Record<string, string> = {
  LEAD_GENERATION: "Leads",
  OUTCOME_LEADS: "Leads",
  LINK_CLICKS: "Traffic",
  OUTCOME_TRAFFIC: "Traffic",
  CONVERSIONS: "Sales",
  OUTCOME_SALES: "Sales",
  REACH: "Reach",
  BRAND_AWARENESS: "Awareness",
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_CAMPAIGNS: CampaignCard[] = [
  {
    id: "demo_pending_001",
    name: "Summit Roofing | Storm Season | Video Lead Gen",
    status: "PAUSED",
    objective: "LEAD_GENERATION",
    daily_budget: 75,
    created_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ads: [{
      id: "demo_ad_001",
      name: "Storm Damage UGC v2",
      status: "PAUSED",
      body: "Your roof took a hit this storm season — and you might not even know it. Get a FREE inspection from Summit Roofing before the damage gets worse. No pressure, no obligation.",
      headline: "Free Roof Inspection — Book Today",
      image_url: null,
    }],
    adsets: [{
      id: "demo_as_001",
      name: "Homeowners 35–65 | San Diego",
      status: "PAUSED",
      daily_budget: 75,
      targeting: "San Diego, CA · Ages 35–65",
    }],
  },
  {
    id: "demo_pending_002",
    name: "Summit Roofing | Free Quote | Retargeting",
    status: "PAUSED",
    objective: "LEAD_GENERATION",
    daily_budget: 40,
    created_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ads: [{
      id: "demo_ad_002",
      name: "Free Quote Offer — Static",
      status: "PAUSED",
      body: "Still thinking about that roof? Summit Roofing is offering free quotes this week only. Takes 10 minutes. Could save you thousands.",
      headline: "Get Your Free Roofing Quote",
      image_url: null,
    }],
    adsets: [{
      id: "demo_as_002",
      name: "Website Visitors 30d",
      status: "PAUSED",
      daily_budget: 40,
      targeting: "San Diego, CA · Retargeting 30d",
    }],
  },
  {
    id: "demo_live_001",
    name: "Summit Roofing | Homeowners LAL | Lead Gen",
    status: "ACTIVE",
    objective: "LEAD_GENERATION",
    daily_budget: 60,
    created_time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    ads: [{
      id: "demo_ad_003",
      name: "Homeowner Testimonial Video",
      status: "ACTIVE",
      body: "My roof was completely destroyed after the hail storm. Summit Roofing replaced it in one day. Best decision I ever made.",
      headline: "See Why 500+ Homeowners Trust Summit",
      image_url: null,
    }],
    adsets: [{
      id: "demo_as_003",
      name: "LAL 1% — Past Customers",
      status: "ACTIVE",
      daily_budget: 60,
      targeting: "San Diego, CA · Ages 30–65 · Lookalike 1%",
    }],
  },
  {
    id: "demo_live_002",
    name: "Summit Roofing | Storm Damage | Broad",
    status: "ACTIVE",
    objective: "LEAD_GENERATION",
    daily_budget: 50,
    created_time: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    ads: [{
      id: "demo_ad_004",
      name: "Before/After Static",
      status: "ACTIVE",
      body: "Don't wait until a small leak becomes a $20,000 problem. Summit Roofing offers same-week inspections for San Diego homeowners.",
      headline: "Book a Free Inspection This Week",
      image_url: null,
    }],
    adsets: [{
      id: "demo_as_004",
      name: "Homeowners Broad | 35–65",
      status: "ACTIVE",
      daily_budget: 50,
      targeting: "San Diego, CA · Ages 35–65 · Broad",
    }],
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdsPage() {
  const { activeClient } = useActiveClient();
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "live">("pending");
  const [acting, setActing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeClient?.id) fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id]);

  async function fetchAds() {
    if (!activeClient) return;
    if (isDemoAccount(activeClient.meta_ad_account_id)) {
      setCampaigns(DEMO_CAMPAIGNS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/ads?adAccountId=${activeClient.meta_ad_account_id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCampaigns(data.campaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ads");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(campaignId: string, action: "approve" | "pause") {
    setActing(a => ({ ...a, [campaignId]: true }));
    try {
      if (isDemoAccount(activeClient?.meta_ad_account_id ?? "")) {
        // Demo: just toggle status locally
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, status: action === "approve" ? "ACTIVE" : "PAUSED" } : c
        ));
        return;
      }
      const res = await fetch(`/api/agent/ads/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adAccountId: activeClient?.meta_ad_account_id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: action === "approve" ? "ACTIVE" : "PAUSED" } : c
      ));
    } finally {
      setActing(a => ({ ...a, [campaignId]: false }));
    }
  }

  function openChatCreate() {
    const msg = activeClient
      ? `I want to create a new ad for ${activeClient.name}. Let's start with the objective and target audience.`
      : "I want to create a new ad campaign.";
    document.dispatchEvent(new CustomEvent("buenaonda:open-chat", { detail: { message: msg } }));
  }

  function openChatEdit(campaign: CampaignCard) {
    const msg = `Can you help me tweak the ad "${campaign.ads[0]?.name ?? campaign.name}"? The current copy is: "${campaign.ads[0]?.body ?? ""}"`;
    document.dispatchEvent(new CustomEvent("buenaonda:open-chat", { detail: { message: msg } }));
  }

  if (!activeClient) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>No client selected</div>
          <div style={{ fontSize: 13 }}>Select a client from the top nav to manage their ads.</div>
        </div>
      </div>
    );
  }

  const pending = campaigns.filter(c => c.status === "PAUSED");
  const live = campaigns.filter(c => c.status === "ACTIVE");
  const shown = tab === "pending" ? pending : live;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text, padding: "32px 28px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Ad Manager</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.3px" }}>{activeClient.name}</h1>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
              {pending.length > 0
                ? <span style={{ color: T.accent }}>{pending.length} pending approval{pending.length !== 1 ? "s" : ""}</span>
                : <span>{live.length} live campaign{live.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>
          <button
            onClick={openChatCreate}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            ✦ Create with Buena Onda
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content" }}>
          {([
            { key: "pending", label: "Pending Approval", count: pending.length, dot: pending.length > 0 },
            { key: "live",    label: "Live",              count: live.length,    dot: false },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 5, border: "none", fontSize: 12,
                fontWeight: tab === t.key ? 600 : 400,
                background: tab === t.key ? (t.key === "pending" ? T.accentBg : T.greenBg) : "transparent",
                color: tab === t.key ? (t.key === "pending" ? T.accent : T.green) : T.muted,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              {t.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />}
              {t.label}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: T.red, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && shown.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{tab === "pending" ? "✅" : "📢"}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              {tab === "pending" ? "Nothing waiting for approval" : "No live campaigns yet"}
            </div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>
              {tab === "pending"
                ? "Ask the AI to create an ad and it will appear here for review before going live."
                : "Approve a pending campaign or create a new one with the AI."}
            </div>
            <button
              onClick={openChatCreate}
              style={{ padding: "10px 22px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 8, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              ✦ Create with Buena Onda
            </button>
          </div>
        )}

        {/* Campaign cards */}
        {!loading && shown.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {shown.map(campaign => (
              <CampaignCardUI
                key={campaign.id}
                campaign={campaign}
                acting={!!acting[campaign.id]}
                onApprove={() => handleAction(campaign.id, "approve")}
                onPause={() => handleAction(campaign.id, "pause")}
                onEditInChat={() => openChatEdit(campaign)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCardUI({ campaign, acting, onApprove, onPause, onEditInChat }: {
  campaign: CampaignCard;
  acting: boolean;
  onApprove: () => void;
  onPause: () => void;
  onEditInChat: () => void;
}) {
  const isPending = campaign.status === "PAUSED";
  const ad = campaign.ads[0];
  const adset = campaign.adsets[0];
  const objLabel = OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective;

  return (
    <div style={{
      background: T.card,
      border: isPending ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {campaign.name}
          </div>
          {campaign.created_time && (
            <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>Created {timeAgo(campaign.created_time)}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
          <Badge label={objLabel} color={T.muted} bg="rgba(139,143,168,0.12)" />
          {campaign.daily_budget != null && (
            <Badge label={`$${campaign.daily_budget}/day`} color={T.muted} bg="rgba(139,143,168,0.12)" />
          )}
          <Badge
            label={isPending ? "Pending Approval" : "Live"}
            color={isPending ? T.accent : T.green}
            bg={isPending ? T.accentBg : T.greenBg}
          />
        </div>
      </div>

      {/* Ad content — preview + details side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 0 }}>

        {/* Facebook ad mockup */}
        <div style={{ borderRight: `1px solid ${T.border}`, padding: "20px 18px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, alignSelf: "flex-start" }}>Preview</div>
          <AdMockup ad={ad} clientName={campaign.name.split("|")[0].trim()} imageUrl={ad?.image_url ?? null} />
        </div>

        {/* Copy + targeting details */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {ad ? (
            <>
              {ad.headline && (
                <div>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Headline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{ad.headline}</div>
                </div>
              )}
              {ad.body && (
                <div>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Ad Copy</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{ad.body}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: T.faint, fontStyle: "italic" }}>No ad copy available</div>
          )}

          {adset && (
            <div>
              <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Targeting</div>
              <div style={{ fontSize: 12, color: T.muted }}>{adset.targeting}</div>
            </div>
          )}
          {adset?.daily_budget != null && (
            <div>
              <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Daily Budget</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>${adset.daily_budget}/day</div>
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 8, background: "rgba(0,0,0,0.15)" }}>
        <button
          onClick={onEditInChat}
          style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
        >
          Edit in Chat
        </button>

        {isPending ? (
          <button
            onClick={onApprove}
            disabled={acting}
            style={{
              padding: "7px 18px", background: acting ? "rgba(46,204,113,0.15)" : T.green, border: "none", borderRadius: 7,
              color: acting ? T.green : "#0d0f14", fontSize: 12, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            {acting ? "Approving…" : "✓ Approve & Go Live"}
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={acting}
            style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(255,77,77,0.3)", borderRadius: 7, color: T.red, fontSize: 12, cursor: acting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {acting ? "Pausing…" : "Pause"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Facebook Ad Mockup ───────────────────────────────────────────────────────

function AdMockup({ ad, clientName, imageUrl }: {
  ad: AdCard | undefined;
  clientName: string;
  imageUrl: string | null;
}) {
  const initials = clientName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div style={{
      width: "100%", maxWidth: 244,
      background: "#fff", borderRadius: 10,
      boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* FB post header */}
      <div style={{ padding: "10px 12px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg,#f5a623,#f76b1c)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1e21", lineHeight: 1.2 }}>{clientName}</div>
          <div style={{ fontSize: 10, color: "#65676b", display: "flex", alignItems: "center", gap: 3 }}>
            Sponsored ·
            <svg width="10" height="10" viewBox="0 0 16 16" fill="#65676b"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7 5v4.5l3.5 2 .75-1.3L8.5 8.8V5H7z"/></svg>
          </div>
        </div>
      </div>

      {/* Primary text */}
      {ad?.body && (
        <div style={{ padding: "2px 12px 8px", fontSize: 11, color: "#1c1e21", lineHeight: 1.5 }}>
          {ad.body.length > 90 ? ad.body.slice(0, 90) + "…" : ad.body}
        </div>
      )}

      {/* Creative area */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Ad creative" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 130 }} />
      ) : (
        <div style={{
          width: "100%", height: 120,
          background: "linear-gradient(135deg, #1a1d2e 0%, #2a2f45 50%, #1e2235 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <div style={{ fontSize: 22, opacity: 0.4 }}>🖼</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Creative</div>
        </div>
      )}

      {/* Headline + CTA */}
      <div style={{ padding: "8px 12px 10px", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1c1e21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
            {ad?.headline ?? clientName}
          </div>
          <div style={{ fontSize: 10, color: "#65676b" }}>Learn more</div>
        </div>
        <div style={{
          padding: "5px 10px", background: "#e4e6eb", borderRadius: 5,
          fontSize: 10, fontWeight: 700, color: "#1c1e21", whiteSpace: "nowrap", flexShrink: 0,
        }}>Learn More</div>
      </div>

      {/* Reaction bar */}
      <div style={{ padding: "6px 12px", borderTop: "1px solid #e4e6eb", display: "flex", gap: 16 }}>
        {["👍 Like", "💬 Comment", "↗ Share"].map(item => (
          <div key={item} style={{ fontSize: 10, color: "#65676b", fontWeight: 600 }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: bg, color }}>{label}</span>
  );
}
