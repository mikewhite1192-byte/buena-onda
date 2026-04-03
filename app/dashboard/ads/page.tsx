"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [showCreator, setShowCreator] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (activeClient?.id) fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id]);

  // Tour: open the creator overlay when the demo tour reaches the ads step
  useEffect(() => {
    function handler() {
      if (activeClient) setShowCreator(true);
    }
    document.addEventListener("buenaonda:open-creator", handler);
    return () => document.removeEventListener("buenaonda:open-creator", handler);
  }, [activeClient]);

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
    setShowCreator(true);
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
    <>
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
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowManualForm(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "transparent", border: `1px solid ${T.accentBorder}`, borderRadius: 8, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              + Create Ad
            </button>
            <button
              id="tour-ads-create"
              onClick={openChatCreate}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              ✦ Create with Buena Onda
            </button>
          </div>
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
                ? "Ask Buena Onda to create an ad and it will appear here for review before going live."
                : "Approve a pending campaign or create a new one with the AI."}
            </div>
            <button
              onClick={() => setShowCreator(true)}
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
                adAccountId={activeClient.meta_ad_account_id}
                onCopyUpdated={(id, headline, body) => {
                  setCampaigns(prev => prev.map(c => c.id === id
                    ? { ...c, ads: c.ads.map((a, i) => i === 0 ? { ...a, headline, body } : a) }
                    : c
                  ));
                }}
              />
            ))}
          </div>
        )}

      </div>
    </div>

    {/* Ad Creator Overlay */}
    {showCreator && activeClient && (
      <AdCreatorOverlay
        client={activeClient}
        onClose={() => { setShowCreator(false); fetchAds(); }}
      />
    )}

    {/* Manual Ad Creation Form */}
    {showManualForm && activeClient && (
      <ManualAdForm
        client={activeClient}
        onClose={() => { setShowManualForm(false); fetchAds(); }}
      />
    )}
    </>
  );
}

// ─── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCardUI({ campaign, acting, onApprove, onPause, onEditInChat, adAccountId, onCopyUpdated }: {
  campaign: CampaignCard;
  acting: boolean;
  onApprove: () => void;
  onPause: () => void;
  onEditInChat: () => void;
  adAccountId: string;
  onCopyUpdated: (campaignId: string, headline: string, body: string) => void;
}) {
  const isPending = campaign.status === "PAUSED";
  const ad = campaign.ads[0];
  const adset = campaign.adsets[0];
  const objLabel = OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective;
  const [copyStep, setCopyStep] = useState<"closed" | "edit" | "preview">("closed");
  const [editHeadline, setEditHeadline] = useState(ad?.headline ?? "");
  const [editBody, setEditBody] = useState(ad?.body ?? "");
  const [savingCopy, setSavingCopy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  function openCopyEditor() {
    setEditHeadline(ad?.headline ?? "");
    setEditBody(ad?.body ?? "");
    setCopyError(null);
    setCopyStep("edit");
  }

  async function handlePublishCopy() {
    if (!ad?.id) return;
    setSavingCopy(true);
    setCopyError(null);
    try {
      const res = await fetch(`/api/agent/ads/${campaign.id}/copy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id, headline: editHeadline, primaryText: editBody, adAccountId }),
      });
      const data = await res.json();
      if (data.error) { setCopyError(data.error); setCopyStep("preview"); return; }
      onCopyUpdated(campaign.id, editHeadline, editBody);
      setCopyStep("closed");
    } finally {
      setSavingCopy(false);
    }
  }

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
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 8, background: "rgba(0,0,0,0.15)", flexWrap: "wrap" }}>
        <button
          onClick={onEditInChat}
          style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
        >
          Chat
        </button>

        {isPending && (
          <button
            onClick={openCopyEditor}
            style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = T.accent}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            ✏ Edit Copy
          </button>
        )}

        {isPending ? (
          <button
            onClick={onApprove}
            disabled={acting}
            style={{ padding: "7px 18px", background: acting ? "rgba(46,204,113,0.15)" : T.green, border: "none", borderRadius: 7, color: acting ? T.green : "#0d0f14", fontSize: 12, fontWeight: 700, cursor: acting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
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

      {/* Edit Copy — Step 1: Edit */}
      {copyStep === "edit" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setCopyStep("closed"); }}
        >
          <div style={{ background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 560, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Edit Ad Copy</div>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>Step 1 of 2 — Write your copy</div>
              </div>
              <button onClick={() => setCopyStep("closed")} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Headline</label>
              <input
                value={editHeadline}
                onChange={e => setEditHeadline(e.target.value)}
                placeholder="e.g. Final Expense Coverage Made Simple"
                autoFocus
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 10, color: editHeadline.length > 40 ? T.red : T.faint, marginTop: 4 }}>{editHeadline.length}/40 chars</div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Primary Text</label>
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                placeholder="e.g. Don't leave your loved ones with the burden..."
                rows={4}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "'DM Mono', monospace", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setCopyStep("closed")} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button
                onClick={() => { if (editHeadline.trim() && editBody.trim()) setCopyStep("preview"); }}
                disabled={!editHeadline.trim() || !editBody.trim()}
                style={{ padding: "9px 24px", background: editHeadline.trim() && editBody.trim() ? T.accent : "rgba(245,166,35,0.3)", border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: editHeadline.trim() && editBody.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}
              >
                Preview Ad →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Copy — Step 2: Preview & Publish */}
      {copyStep === "preview" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20 }}>
          <div style={{ background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 680, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Review Before Publishing</div>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>Step 2 of 2 — Confirm this is exactly what you want</div>
              </div>
              <button onClick={() => setCopyStep("closed")} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            {/* Side by side: mockup + copy */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>
              <AdMockup
                ad={{ id: "preview", name: "preview", status: "PAUSED", body: editBody, headline: editHeadline, image_url: ad?.image_url ?? null }}
                clientName={campaign.name.split("|")[0].trim()}
                imageUrl={ad?.image_url ?? null}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Headline</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{editHeadline}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Primary Text</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{editBody}</div>
                </div>
                <div style={{ background: "rgba(245,166,35,0.08)", border: `1px solid ${T.accentBorder}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: T.accent }}>
                  This will update the ad creative in Meta. The campaign stays PAUSED until you approve it.
                </div>
              </div>
            </div>

            {copyError && (
              <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.red }}>{copyError}</div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button onClick={() => setCopyStep("edit")} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Edit Copy
              </button>
              <button
                onClick={handlePublishCopy}
                disabled={savingCopy}
                style={{ padding: "9px 28px", background: savingCopy ? "rgba(46,204,113,0.15)" : T.green, border: "none", borderRadius: 8, color: savingCopy ? T.green : "#0d0f14", fontSize: 13, fontWeight: 700, cursor: savingCopy ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {savingCopy ? "Publishing…" : "✓ Looks Good — Publish to Meta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ad Creator Overlay ───────────────────────────────────────────────────────

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }
interface AdSpec { headline: string; body: string; objective: string; budget: string; targeting: string; created: boolean; }

function extractSpec(text: string, prev: AdSpec): AdSpec {
  const next = { ...prev };
  const get = (patterns: RegExp[]) => {
    for (const p of patterns) { const m = text.match(p); if (m?.[1]) return m[1].trim().replace(/^["']|["']$/g, ""); }
    return null;
  };

  const headline = get([/\*\*Headline:\*\*\s*(.+)/i, /headline[:\s]+["']?([^"'\n]{5,60})["']?/i]);
  if (headline) next.headline = headline;

  const body = get([/\*\*(?:Primary [Tt]ext|Body[^:]*|Ad [Cc]opy):\*\*\s*([\s\S]{20,300}?)(?:\n\n|\*\*|$)/i,
                    /(?:primary text|ad copy|body copy)[:\s]+["']?([\s\S]{20,300}?)["']?(?:\n\n|$)/i]);
  if (body) next.body = body.replace(/\n/g, " ").trim();

  const obj = get([/\*\*Objective:\*\*\s*(.+)/i, /objective[:\s]+(.+)/i]);
  if (obj) next.objective = obj;

  const budget = get([/\*\*(?:Daily )?[Bb]udget:\*\*\s*(.+)/i, /\$(\d+)[\s/]*(?:per )?day/i, /budget[:\s]+\$?(\d+)/i]);
  if (budget) next.budget = budget.startsWith("$") ? budget : `$${budget}/day`;

  const targeting = get([/\*\*Targeting:\*\*\s*(.+)/i, /\*\*Audience:\*\*\s*(.+)/i]);
  if (targeting) next.targeting = targeting;

  if (text.includes("campaign_id") || text.includes("Campaign created") || text.match(/✅.*campaign/i)) {
    next.created = true;
  }

  return next;
}

function renderChatMd(text: string): React.ReactNode {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j} style={{ color: "#e8eaf0", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        : <span key={j}>{p.replace(/--/g, "—")}</span>
    );
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

const PLATFORMS = [
  { value: "meta", label: "Meta Ads", icon: "📘", desc: "Facebook & Instagram" },
  { value: "google", label: "Google Ads", icon: "🔍", desc: "Search, Display, Performance Max" },
  { value: "tiktok", label: "TikTok Ads", icon: "🎵", desc: "Short-form video campaigns" },
  { value: "shopify", label: "Shopify", icon: "🛍️", desc: "Ecommerce & product ads" },
] as const;

type AdPlatform = typeof PLATFORMS[number]["value"];

function AdCreatorOverlay({ client, onClose }: {
  client: { id: string; name: string; meta_ad_account_id: string; vertical: string };
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<AdPlatform | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<AdSpec>({ headline: "", body: "", objective: "", budget: "", targeting: "", created: false });
  const [creative, setCreative] = useState<{ imageHash: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initiated = useRef(false);

  function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error("Compression failed")),
          "image/jpeg", quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = objectUrl;
    });
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    try {
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });

      // Local preview from compressed blob
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(compressed);
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("ad_account_id", client.meta_ad_account_id);
      formData.append("client_id", client.id);
      const res = await fetch("/api/agent/creative/upload", { method: "POST", body: formData });

      let data: { image_hash?: string; error?: string };
      try { data = await res.json(); }
      catch { throw new Error(`Server error (${res.status})`); }

      if (data.error) {
        setUploadError(data.error);
      } else if (data.image_hash) {
        setCreative({ imageHash: data.image_hash, preview });
      } else {
        setUploadError("Upload failed — no image hash returned.");
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
    }
  }

  const sendMessage = useCallback(async (content: string, isAuto = false) => {
    if ((!content.trim()) || loading) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: content.trim() };
    const streamingId = (Date.now() + 1).toString();

    setMessages(prev => isAuto ? prev : [...prev, userMsg]);
    if (!isAuto) setInput("");
    setLoading(true);

    const historyForApi = isAuto
      ? [{ role: "user" as const, content: content.trim() }]
      : [...messages, userMsg].map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          clientId: client.id,
          adAccountId: client.meta_ad_account_id,
          imageHash: creative?.imageHash ?? null,
          isOnboarding: false,
        }),
      });

      if (!res.body) throw new Error("No stream");
      setMessages(prev => [...prev, { id: streamingId, role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accum = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accum += parsed.text;
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: accum } : m));
              setSpec(prev => extractSpec(accum, prev));
            }
          } catch { /* partial chunk */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: "Something went wrong. Try again." } : m));
    } finally {
      setLoading(false);
    }
  }, [messages, loading, client, creative]);

  // Auto-start the conversation once platform is selected
  useEffect(() => {
    if (!platform || initiated.current) return;
    initiated.current = true;
    const vertical = client.vertical === "ecomm" ? "ecommerce/DTC" : "lead generation";

    const prompts: Record<AdPlatform, string> = {
      meta: `I want to create a new Meta (Facebook/Instagram) ad for ${client.name}, a ${vertical} client. Rules: ask ONE question at a time — never combine questions. Start by asking if there is an existing ad set to add this ad to (or create a new campaign). If yes, call list_campaigns and let them pick. Then gather info one question at a time: offer, audience, budget, landing page, etc. Once you have enough, present 3 headline options and 3 primary text options — let them pick and refine. Only call create_ad_campaign when they explicitly say they are ready. Never create anything without their go-ahead.`,
      google: `I want to create a new Google Ads campaign for ${client.name}, a ${vertical} client. Rules: ask ONE question at a time — never combine questions. Start by asking what type of campaign (Search, Display, or Performance Max). Then gather: campaign name, daily budget, bidding strategy (Maximize Conversions / Target CPA / Manual CPC), target CPA if applicable, landing page URL, 3 headlines, 2 descriptions, and keywords if Search. Present the full summary and get explicit confirmation before calling create_google_campaign. Never create anything without their go-ahead.`,
      tiktok: `I want to create a new TikTok Ads campaign for ${client.name}, a ${vertical} client. Rules: ask ONE question at a time — never combine questions. Gather: campaign objective (Traffic/Conversions/Lead Gen), daily budget, target audience (age, interests, location), video creative URL, ad copy. TikTok ads are coming soon — for now, gather the brief and confirm the details with the user so we can launch it once TikTok integration is live.`,
      shopify: `I want to create product ads for ${client.name}'s Shopify store. Rules: ask ONE question at a time — never combine questions. Gather: which products to promote, campaign objective (Sales/Traffic), daily budget, target audience, landing page (product or collection page URL). Shopify integration is coming soon — gather the full brief and confirm details with the user.`,
    };

    sendMessage(prompts[platform], true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const initials = client.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const specComplete = spec.headline && spec.body;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "94vw", height: "92vh", maxWidth: 1200, background: "#13151d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>✦</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Create with Buena Onda</div>
              <div style={{ fontSize: 11, color: T.faint }}>
                {client.name}{platform ? ` · ${PLATFORMS.find(p => p.value === platform)?.label}` : ""}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
        </div>

        {/* Platform selector — shown before chat starts */}
        {!platform && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>What platform are you building on?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>Choose a platform to get started.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 560 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  style={{
                    padding: "20px 24px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: T.text,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${T.accent}`; (e.currentTarget as HTMLButtonElement).style.background = T.accentBg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {platform && <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 380px", overflow: "hidden" }}>

          {/* Left — Chat */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
                  <div style={{ width: 28, height: 28, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T.muted }}>Starting your ad creation session…</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  {msg.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#fff", flexShrink: 0, marginTop: 2 }}>✦</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "11px 15px", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: msg.role === "user" ? T.accentBg : "rgba(255,255,255,0.05)",
                    border: msg.role === "user" ? `1px solid ${T.accentBorder}` : "1px solid rgba(255,255,255,0.06)",
                    fontSize: 13, color: T.text, lineHeight: 1.65,
                  }}>
                    {msg.content ? renderChatMd(msg.content) : (
                      <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.muted, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
                        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)} }`}</style>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              {/* Upload error */}
              {uploadError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ flex: 1, fontSize: 11, color: T.red }}>{uploadError}</div>
                  <button onClick={() => setUploadError(null)} style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              )}

              {/* Creative preview strip */}
              {creative && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={creative.preview} alt="Creative" style={{ width: 40, height: 40, borderRadius: 5, objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Creative uploaded</div>
                    <div style={{ fontSize: 10, color: T.faint }}>Will be used when the campaign is created</div>
                  </div>
                  <button onClick={() => setCreative(null)} style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {/* Attach creative */}
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach creative"
                  style={{ width: 46, height: 46, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: creative ? T.green : T.muted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  {uploading ? "…" : "📎"}
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Type your answer…"
                  rows={2}
                  disabled={loading}
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: T.text, fontFamily: "'DM Mono', monospace", resize: "none", outline: "none", lineHeight: 1.5 }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  style={{ padding: "11px 18px", background: input.trim() && !loading ? T.accent : "rgba(245,166,35,0.2)", border: "none", borderRadius: 10, color: input.trim() && !loading ? "#0d0f14" : T.faint, fontSize: 13, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0, height: 46 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right — Live Preview */}
          <div style={{ overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20, background: "rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Preview</div>

            {/* Mockup */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <AdMockup
                ad={{ id: "preview", name: "preview", status: "PAUSED", body: spec.body || null, headline: spec.headline || null, image_url: creative?.preview ?? null }}
                clientName={client.name}
                imageUrl={creative?.preview ?? null}
              />
            </div>

            {/* Spec summary */}
            {(spec.objective || spec.budget || spec.targeting) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>Captured so far</div>
                {spec.objective && <SpecRow icon="🎯" label="Objective" value={spec.objective} />}
                {spec.budget && <SpecRow icon="💰" label="Budget" value={spec.budget} />}
                {spec.targeting && <SpecRow icon="👥" label="Targeting" value={spec.targeting} />}
              </div>
            )}

            {/* Created success state */}
            {spec.created && (
              <div style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.green, marginBottom: 4 }}>Ad Created!</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>It's in your Pending Approval queue. Review the copy and approve when ready.</div>
                <button
                  onClick={onClose}
                  style={{ padding: "8px 20px", background: T.green, border: "none", borderRadius: 7, color: "#0d0f14", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  View in Queue →
                </button>
              </div>
            )}

            {/* Empty state hint */}
            {!spec.headline && !spec.body && !spec.created && (
              <div style={{ textAlign: "center", padding: "20px 10px", color: T.faint, fontSize: 12, lineHeight: 1.7 }}>
                Your ad preview will build here as the conversation progresses.
              </div>
            )}

            {/* Spec complete — ready hint */}
            {specComplete && !spec.created && (
              <div style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.accent }}>
                Looking good — tell Buena Onda to create the campaign when you're ready.
              </div>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── Manual Ad Creation Form ──────────────────────────────────────────────────

interface LeadForm { id: string; name: string; status: string; }
interface Interest { id: string; name: string; audience_size: number | null; }

const PLACEMENT_OPTIONS = [
  { platform: "facebook", position: "feed", label: "Facebook Feed" },
  { platform: "facebook", position: "right_hand_column", label: "Right Column" },
  { platform: "facebook", position: "marketplace", label: "Marketplace" },
  { platform: "facebook", position: "story", label: "Facebook Stories" },
  { platform: "facebook", position: "reels", label: "Facebook Reels" },
  { platform: "instagram", position: "stream", label: "Instagram Feed" },
  { platform: "instagram", position: "story", label: "Instagram Stories" },
  { platform: "instagram", position: "reels", label: "Instagram Reels" },
  { platform: "instagram", position: "explore", label: "Instagram Explore" },
];

const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "GET_QUOTE", label: "Get Quote" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "GET_OFFER", label: "Get Offer" },
];

const OBJECTIVE_OPTIONS = [
  { value: "leads", label: "Leads", desc: "Get form submissions via instant forms" },
  { value: "traffic", label: "Traffic", desc: "Drive clicks to your website" },
  { value: "sales", label: "Sales", desc: "Optimize for purchases/conversions" },
];

function ManualAdForm({ client, onClose }: {
  client: { id: string; name: string; meta_ad_account_id: string; vertical: string };
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1 — Campaign
  const [campaignName, setCampaignName] = useState(`${client.name} — `);
  const [objective, setObjective] = useState(client.vertical === "ecomm" ? "sales" : "leads");
  const [dailyBudget, setDailyBudget] = useState("");
  const [specialAdCategory, setSpecialAdCategory] = useState(false);

  // Step 2 — Targeting
  const [ageMin, setAgeMin] = useState("25");
  const [ageMax, setAgeMax] = useState("65");
  const [locations, setLocations] = useState("United States");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [interestSearch, setInterestSearch] = useState("");
  const [interestResults, setInterestResults] = useState<Interest[]>([]);
  const [searchingInterests, setSearchingInterests] = useState(false);
  const [advantagePlus, setAdvantagePlus] = useState(true);
  const [placementMode, setPlacementMode] = useState<"advantage" | "manual">("advantage");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(PLACEMENT_OPTIONS.map(p => `${p.platform}:${p.position}`));
  const interestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — Creative
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [ctaType, setCtaType] = useState(objective === "leads" ? "SIGN_UP" : "LEARN_MORE");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [leadFormId, setLeadFormId] = useState("");
  const [leadForms, setLeadForms] = useState<LeadForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [imageHash, setImageHash] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4 — Review & Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch lead forms when objective is leads
  useEffect(() => {
    if (objective !== "leads") return;
    setLoadingForms(true);
    fetch(`/api/agent/ads/lead-forms?client_id=${client.id}`)
      .then(r => r.json())
      .then(data => setLeadForms(data.forms ?? []))
      .catch(() => setLeadForms([]))
      .finally(() => setLoadingForms(false));
  }, [objective, client.id]);

  // Debounced interest search
  useEffect(() => {
    if (interestSearch.length < 2) { setInterestResults([]); return; }
    if (interestTimer.current) clearTimeout(interestTimer.current);
    interestTimer.current = setTimeout(async () => {
      setSearchingInterests(true);
      try {
        const res = await fetch(`/api/agent/ads/interests?q=${encodeURIComponent(interestSearch)}&client_id=${client.id}`);
        const data = await res.json();
        setInterestResults((data.interests ?? []).filter((i: Interest) => !interests.some(sel => sel.id === i.id)));
      } catch { setInterestResults([]); }
      finally { setSearchingInterests(false); }
    }, 400);
    return () => { if (interestTimer.current) clearTimeout(interestTimer.current); };
  }, [interestSearch, client.id, interests]);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      // Compress
      const canvas = document.createElement("canvas");
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const ratio = Math.min(1, 1200 / img.width);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), "image/jpeg", 0.85));
      const preview = await new Promise<string>((res) => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(blob); });
      setImagePreview(preview);

      const formData = new FormData();
      formData.append("file", new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      formData.append("ad_account_id", client.meta_ad_account_id);
      formData.append("client_id", client.id);
      const res = await fetch("/api/agent/creative/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.image_hash) throw new Error("No image hash returned");
      setImageHash(data.image_hash);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/agent/ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          ad_account_id: client.meta_ad_account_id,
          campaign_name: campaignName,
          objective,
          daily_budget: parseFloat(dailyBudget),
          countries: locations.split(",").map(s => s.trim()).filter(Boolean),
          age_min: parseInt(ageMin),
          age_max: parseInt(ageMax),
          primary_text: primaryText,
          headline,
          description,
          cta_type: ctaType,
          destination_url: destinationUrl || undefined,
          lead_form_id: leadFormId || undefined,
          image_hash: imageHash || undefined,
          special_ad_categories: specialAdCategory ? ["HOUSING", "EMPLOYMENT", "CREDIT", "ISSUES_ELECTIONS_POLITICS"] : [],
          interests: interests.map(i => ({ id: i.id, name: i.name })),
          advantage_plus_audience: advantagePlus,
          publisher_platforms: placementMode === "advantage" ? undefined : [...new Set(selectedPlacements.map(p => p.split(":")[0]))],
          facebook_positions: placementMode === "advantage" ? undefined : selectedPlacements.filter(p => p.startsWith("facebook:")).map(p => p.split(":")[1]),
          instagram_positions: placementMode === "advantage" ? undefined : selectedPlacements.filter(p => p.startsWith("instagram:")).map(p => p.split(":")[1]),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create campaign");
      setSuccess(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text,
    fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, color: T.faint, textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 6,
  };

  function canNext() {
    if (step === 1) return campaignName.trim().length > 3 && parseFloat(dailyBudget) > 0;
    if (step === 2) return true;
    if (step === 3) return primaryText.trim().length > 10 && headline.trim().length > 2 && imageHash;
    return true;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div style={{ width: "94vw", maxWidth: 640, maxHeight: "90vh", background: "#13151d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Create Ad</div>
            <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{client.name} — Step {step} of {totalSteps}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ height: "100%", width: `${(step / totalSteps) * 100}%`, background: T.accent, transition: "width 0.3s ease" }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>

          {/* Success */}
          {success && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Campaign Created</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Your campaign was created in PAUSED status. Review it and approve to go live.</div>
              <button onClick={onClose} style={{ padding: "10px 28px", background: T.accent, border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Done
              </button>
            </div>
          )}

          {/* Step 1: Campaign Basics */}
          {!success && step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelStyle}>Campaign Name</label>
                <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Summit Roofing — Storm Season Leads" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Objective</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBJECTIVE_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setObjective(o.value); setCtaType(o.value === "leads" ? "SIGN_UP" : o.value === "sales" ? "SHOP_NOW" : "LEARN_MORE"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
                        border: objective === o.value ? `1px solid ${T.accentBorder}` : "1px solid rgba(255,255,255,0.08)",
                        background: objective === o.value ? T.accentBg : "transparent",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${objective === o.value ? T.accent : T.faint}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {objective === o.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: objective === o.value ? T.text : T.muted }}>{o.label}</div>
                        <div style={{ fontSize: 11, color: T.faint }}>{o.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Daily Budget ($)</label>
                <input type="number" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} placeholder="e.g. 50" style={inputStyle} min="1" step="1" />
              </div>
              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={specialAdCategory} onChange={e => setSpecialAdCategory(e.target.checked)} style={{ accentColor: T.accent }} />
                  Special Ad Category (Housing, Employment, Credit, Politics)
                </label>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>Enable if your ad is about housing, employment, credit, or social issues. This restricts targeting options.</div>
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {!success && step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Location */}
              <div>
                <label style={labelStyle}>Location</label>
                <input value={locations} onChange={e => setLocations(e.target.value)} placeholder="e.g. United States, California, New York" style={inputStyle} />
                <div style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>Comma-separated. Use 2-letter codes (US, CA) or state/city names.</div>
              </div>

              {/* Age */}
              {!specialAdCategory && (
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Age Min</label>
                    <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)} min="18" max="65" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Age Max</label>
                    <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)} min="18" max="65" style={inputStyle} />
                  </div>
                </div>
              )}
              {specialAdCategory && (
                <div style={{ background: "rgba(245,166,35,0.06)", border: `1px solid ${T.accentBorder}`, borderRadius: 8, padding: 14, fontSize: 12, color: T.muted }}>
                  Age, gender, and interest targeting are restricted for special ad categories per Meta policy.
                </div>
              )}

              {/* Interests */}
              {!specialAdCategory && (
                <div>
                  <label style={labelStyle}>Interests (optional)</label>
                  <input value={interestSearch} onChange={e => setInterestSearch(e.target.value)} placeholder="Search interests — e.g. roofing, fitness, real estate" style={inputStyle} />
                  {searchingInterests && <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>Searching…</div>}
                  {interestResults.length > 0 && (
                    <div style={{ marginTop: 6, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "#0d0f14", maxHeight: 180, overflow: "auto" }}>
                      {interestResults.map(i => (
                        <button key={i.id} onClick={() => { setInterests(prev => [...prev, i]); setInterestSearch(""); setInterestResults([]); }}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", color: T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                          <span>{i.name}</span>
                          {i.audience_size && <span style={{ fontSize: 10, color: T.faint }}>{(i.audience_size / 1000000).toFixed(1)}M</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {interests.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {interests.map(i => (
                        <span key={i.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 6, fontSize: 11, color: T.accent }}>
                          {i.name}
                          <button onClick={() => setInterests(prev => prev.filter(x => x.id !== i.id))} style={{ background: "transparent", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Advantage+ Audience */}
              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={advantagePlus} onChange={e => setAdvantagePlus(e.target.checked)} style={{ accentColor: T.accent }} />
                  Advantage+ Audience
                </label>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>
                  Let Meta&apos;s AI expand your targeting to reach people most likely to convert. Your targeting selections become suggestions that Meta uses as a starting point.
                </div>
              </div>

              {/* Placements */}
              <div>
                <label style={labelStyle}>Placements</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {([{ value: "advantage", label: "Advantage+ Placements" }, { value: "manual", label: "Manual Placements" }] as const).map(p => (
                    <button key={p.value} onClick={() => { setPlacementMode(p.value); if (p.value === "advantage") setSelectedPlacements(PLACEMENT_OPTIONS.map(x => `${x.platform}:${x.position}`)); }}
                      style={{
                        padding: "7px 14px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                        background: placementMode === p.value ? T.accentBg : "transparent",
                        border: placementMode === p.value ? `1px solid ${T.accentBorder}` : "1px solid rgba(255,255,255,0.08)",
                        color: placementMode === p.value ? T.accent : T.muted,
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {placementMode === "advantage" && (
                  <div style={{ fontSize: 11, color: T.faint }}>Meta will automatically show your ad across all available placements to maximize results.</div>
                )}
                {placementMode === "manual" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {PLACEMENT_OPTIONS.map(p => {
                      const key = `${p.platform}:${p.position}`;
                      const checked = selectedPlacements.includes(key);
                      return (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: checked ? "rgba(255,255,255,0.03)" : "transparent", cursor: "pointer", fontSize: 12, color: checked ? T.text : T.muted }}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setSelectedPlacements(prev => checked ? prev.filter(x => x !== key) : [...prev, key])}
                            style={{ accentColor: T.accent }} />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Creative & Copy */}
          {!success && step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Image upload */}
              <div>
                <label style={labelStyle}>Creative Image</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                {imagePreview ? (
                  <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />
                    <button onClick={() => { setImageHash(""); setImagePreview(""); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ width: "100%", padding: "28px 16px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {uploading ? "Uploading…" : "Click to upload image"}
                  </button>
                )}
                {uploadError && <div style={{ fontSize: 11, color: T.red, marginTop: 6 }}>{uploadError}</div>}
              </div>

              {/* Primary text */}
              <div>
                <label style={labelStyle}>Primary Text</label>
                <textarea value={primaryText} onChange={e => setPrimaryText(e.target.value)} placeholder="The main body of your ad — what people see first" rows={4}
                  style={{ ...inputStyle, resize: "vertical" }} />
                <div style={{ fontSize: 10, color: primaryText.length > 125 ? T.accent : T.faint, marginTop: 4 }}>{primaryText.length} chars — aim for 80–125</div>
              </div>

              {/* Headline */}
              <div>
                <label style={labelStyle}>Headline</label>
                <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Free Roof Inspection — Book Today" style={inputStyle} />
                <div style={{ fontSize: 10, color: headline.length > 40 ? T.red : T.faint, marginTop: 4 }}>{headline.length}/40 chars</div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description below the headline" style={inputStyle} />
              </div>

              {/* CTA */}
              <div>
                <label style={labelStyle}>Call to Action</label>
                <select value={ctaType} onChange={e => setCtaType(e.target.value)}
                  style={{ ...inputStyle, appearance: "auto" as React.CSSProperties["appearance"] }}>
                  {CTA_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Destination URL */}
              <div>
                <label style={labelStyle}>Destination URL</label>
                <input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} placeholder="https://example.com/landing-page" style={inputStyle} />
                <div style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>Required — Meta needs a URL even for lead gen ads</div>
              </div>

              {/* Lead form picker (only for leads objective) */}
              {objective === "leads" && (
                <div>
                  <label style={labelStyle}>Lead Form (optional)</label>
                  {loadingForms ? (
                    <div style={{ fontSize: 12, color: T.faint }}>Loading forms…</div>
                  ) : leadForms.length > 0 ? (
                    <select value={leadFormId} onChange={e => setLeadFormId(e.target.value)}
                      style={{ ...inputStyle, appearance: "auto" as React.CSSProperties["appearance"] }}>
                      <option value="">No form (URL-based leads)</option>
                      {leadForms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.status})</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: 12, color: T.faint }}>No instant forms found on this page. Create one in Meta Ads Manager.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {!success && step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Review Your Ad</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>This campaign will be created in PAUSED status. Approve it from the Ads page to go live.</div>

              {submitError && (
                <div style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.red, marginBottom: 4 }}>
                  {submitError}
                </div>
              )}

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                {[
                  { label: "Campaign", value: campaignName },
                  { label: "Objective", value: OBJECTIVE_OPTIONS.find(o => o.value === objective)?.label ?? objective },
                  { label: "Daily Budget", value: `$${dailyBudget}/day` },
                  { label: "Location", value: locations || "United States" },
                  ...(!specialAdCategory ? [{ label: "Age Range", value: `${ageMin} – ${ageMax}` }] : []),
                  ...(interests.length > 0 ? [{ label: "Interests", value: interests.map(i => i.name).join(", ") }] : []),
                  { label: "Advantage+", value: advantagePlus ? "Enabled — Meta AI will expand targeting" : "Disabled" },
                  { label: "Placements", value: placementMode === "advantage" ? "Advantage+ (all placements)" : `${selectedPlacements.length} selected` },
                  { label: "Headline", value: headline },
                  { label: "Primary Text", value: primaryText.length > 80 ? primaryText.slice(0, 80) + "…" : primaryText },
                  { label: "CTA", value: CTA_OPTIONS.find(c => c.value === ctaType)?.label ?? ctaType },
                  { label: "Destination", value: destinationUrl || "—" },
                  ...(leadFormId ? [{ label: "Lead Form", value: leadForms.find(f => f.id === leadFormId)?.name ?? leadFormId }] : []),
                  { label: "Creative", value: imageHash ? "Image uploaded" : "—" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 120, fontSize: 11, color: T.faint, flexShrink: 0 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: T.text, flex: 1 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {imagePreview && (
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", maxWidth: 280 }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", display: "block" }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {!success && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              disabled={submitting}
              style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                style={{ padding: "9px 24px", background: canNext() ? T.accent : "rgba(245,166,35,0.3)", border: "none", borderRadius: 8, color: canNext() ? "#0d0f14" : T.faint, fontSize: 13, fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "inherit" }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: "9px 24px", background: submitting ? "rgba(245,166,35,0.3)" : T.accent, border: "none", borderRadius: 8, color: submitting ? T.faint : "#0d0f14", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {submitting ? "Creating…" : "Create Campaign (Paused)"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spec Row / Ad Mockup helpers ─────────────────────────────────────────────

function SpecRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "8px 10px" }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: T.muted }}>{value}</div>
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
