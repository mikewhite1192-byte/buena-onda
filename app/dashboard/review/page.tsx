"use client";

// app/dashboard/review/page.tsx — AI-built campaign review queue
import { useEffect, useState } from "react";

const T = {
  bg: "#0d0f14", surface: "#161820", surfaceAlt: "#1e2130", border: "rgba(255,255,255,0.06)",
  accent: "#f5a623", accentBg: "rgba(245,166,35,0.12)", text: "#e8eaf0", muted: "#8b8fa8",
  faint: "#5a5e72", critical: "#ff4d4d", warning: "#e8b84b", healthy: "#2ecc71", info: "#7b8cde",
};

interface PendingCampaign {
  id: string;
  client_id: string;
  client_name: string;
  campaign_name: string;
  objective: string;
  daily_budget: number;
  targeting_summary: string;
  ad_copy: string;
  creative_description: string;
  special_ad_category: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ReviewPage() {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    setLoading(true);
    const res = await fetch("/api/review/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  }

  async function handleAction(id: string, action: "approved" | "rejected", notes?: string) {
    setActing(id);
    try {
      await fetch(`/api/review/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, notes: notes ?? null }),
      });
      await loadCampaigns();
    } finally {
      setActing(null);
      setEditingNotes(null);
    }
  }

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const pendingCount = campaigns.filter(c => c.status === "pending").length;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Mono','Fira Mono',monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Campaign Review</h1>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            AI-built campaigns waiting for your approval before going live
          </div>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: T.accentBg, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, marginBottom: 24, width: "fit-content" }}>
        {(["pending", "approved", "rejected", "all"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{ padding: "5px 14px", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: filter === tab ? 700 : 400, background: filter === tab ? T.accent : "transparent", color: filter === tab ? "#fff" : T.muted, transition: "all 0.15s", textTransform: "capitalize" }}
          >
            {tab}
            {tab === "pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: "#fff", color: T.accent, borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 800 }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div style={{ textAlign: "center", color: T.muted, fontSize: 13, padding: "40px 0" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: "60px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
          {filter === "pending"
            ? "No campaigns pending review. Ask the AI to build campaigns in the chat and they'll appear here."
            : `No ${filter} campaigns.`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(campaign => {
            const isPending = campaign.status === "pending";
            const statusColor = campaign.status === "approved" ? T.healthy : campaign.status === "rejected" ? T.critical : T.warning;
            return (
              <div
                key={campaign.id}
                style={{ background: T.surface, border: `1px solid ${isPending ? T.accent + "30" : T.border}`, borderRadius: 12, overflow: "hidden" }}
              >
                {/* Card header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{campaign.campaign_name}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: statusColor + "18", color: statusColor, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                        {campaign.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                      {campaign.client_name} · {timeAgo(campaign.created_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.accent }}>${campaign.daily_budget}/day</div>
                </div>

                {/* Campaign details */}
                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Detail label="Objective" value={campaign.objective} />
                  <Detail label="Daily Budget" value={`$${campaign.daily_budget}/day`} />
                  <Detail label="Targeting" value={campaign.targeting_summary} />
                  {campaign.special_ad_category && <Detail label="Special Category" value={campaign.special_ad_category} warn />}
                </div>

                <div style={{ padding: "0 20px 16px" }}>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Ad Copy</div>
                  <div style={{ fontSize: 13, color: T.text, background: T.surfaceAlt, borderRadius: 8, padding: "12px 14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {campaign.ad_copy}
                  </div>
                </div>

                {campaign.creative_description && (
                  <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Creative</div>
                    <div style={{ fontSize: 13, color: T.muted, background: T.surfaceAlt, borderRadius: 8, padding: "10px 14px" }}>
                      {campaign.creative_description}
                    </div>
                  </div>
                )}

                {campaign.notes && (
                  <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)", borderRadius: 8, fontSize: 12, color: T.muted }}>
                    <span style={{ color: T.critical, fontWeight: 600 }}>Notes: </span>{campaign.notes}
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleAction(campaign.id, "approved")}
                      disabled={acting === campaign.id}
                      style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 700, borderRadius: 7, border: "none", background: T.healthy + "18", color: T.healthy, cursor: acting === campaign.id ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    >
                      {acting === campaign.id ? "…" : "✓ Approve & Launch"}
                    </button>
                    <button
                      onClick={() => { setEditingNotes(campaign.id); setNotesInput(""); }}
                      disabled={acting === campaign.id}
                      style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ✏️ Request Changes
                    </button>
                    <button
                      onClick={() => { setEditingNotes(`reject:${campaign.id}`); setNotesInput(""); }}
                      disabled={acting === campaign.id}
                      style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid rgba(255,77,77,0.2)`, background: "rgba(255,77,77,0.06)", color: T.critical, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {/* Notes input for changes/reject */}
                {(editingNotes === campaign.id || editingNotes === `reject:${campaign.id}`) && (
                  <div style={{ padding: "0 20px 16px" }}>
                    <textarea
                      value={notesInput}
                      onChange={e => setNotesInput(e.target.value)}
                      placeholder={editingNotes === `reject:${campaign.id}` ? "Why are you rejecting this campaign?" : "What needs to change?"}
                      rows={3}
                      autoFocus
                      style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" as const }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleAction(campaign.id, "rejected", notesInput)}
                        style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, borderRadius: 7, border: "none", background: editingNotes === `reject:${campaign.id}` ? T.critical + "20" : T.accentBg, color: editingNotes === `reject:${campaign.id}` ? T.critical : T.accent, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {editingNotes === `reject:${campaign.id}` ? "Reject" : "Send for Changes"}
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        style={{ padding: "7px 14px", fontSize: 12, borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: warn ? T.warning : T.text }}>{value}</div>
    </div>
  );
}
