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
    </>
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

function AdCreatorOverlay({ client, onClose }: {
  client: { id: string; name: string; meta_ad_account_id: string; vertical: string };
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<AdSpec>({ headline: "", body: "", objective: "", budget: "", targeting: "", created: false });
  const [creative, setCreative] = useState<{ imageHash: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initiated = useRef(false);

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      // Compress client-side
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const formData = new FormData();
      formData.append("file", file);
      if (client.meta_ad_account_id) formData.append("ad_account_id", client.meta_ad_account_id);
      const res = await fetch("/api/agent/creative/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.image_hash) {
        setCreative({ imageHash: data.image_hash, preview });
      }
    } finally {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, client]);

  // Auto-start the conversation
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    const vertical = client.vertical === "ecomm" ? "ecommerce/DTC" : "lead generation";
    sendMessage(
      `I want to create a new Facebook ad for ${client.name}, a ${vertical} client. Ask me one question at a time to build the ad. Start by asking about the campaign objective.`,
      true
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div style={{ fontSize: 11, color: T.faint }}>{client.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 380px", overflow: "hidden" }}>

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
        </div>
      </div>
    </div>
  );
}

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
