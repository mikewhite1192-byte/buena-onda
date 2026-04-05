"use client";

// app/dashboard/review/page.tsx — Campaign review queue + AI recommendations
import { useEffect, useState } from "react";
import ConfirmDialog from "../_components/ConfirmDialog";

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

interface Recommendation {
  id: string;
  action_type: string;
  details: { adset_id: string; reason: string; new_budget?: number; meta_result?: string };
  status: "pending" | "approved" | "rejected" | "executed";
  created_at: string;
  brief_id: string;
  daily_budget: string;
  offer: string;
  client_name: string;
  client_id: string;
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
  const [pageTab, setPageTab] = useState<"campaigns" | "recommendations">("campaigns");

  // Campaign review state
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  // AI recommendations state
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsFilter, setRecsFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [actingRec, setActingRec] = useState<string | null>(null);

  useEffect(() => { loadCampaigns(); loadRecs(); }, []);

  async function loadCampaigns() {
    setLoading(true);
    const res = await fetch("/api/review/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  }

  async function loadRecs() {
    setRecsLoading(true);
    const res = await fetch("/api/agent/recommendations");
    const data = await res.json();
    setRecs(data.recommendations ?? []);
    setRecsLoading(false);
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

  async function handleRecAction(id: string, action: "approved" | "rejected") {
    setActingRec(id);
    try {
      await fetch(`/api/agent/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadRecs();
    } finally {
      setActingRec(null);
    }
  }

  const [confirmAction, setConfirmAction] = useState<{ type: "campaign" | "rec"; id: string; action: "approved" | "rejected"; notes?: string; name?: string } | null>(null);

  function requestAction(type: "campaign" | "rec", id: string, action: "approved" | "rejected", name?: string, notes?: string) {
    setConfirmAction({ type, id, action, name, notes });
  }

  function executeConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === "campaign") handleAction(confirmAction.id, confirmAction.action, confirmAction.notes);
    else handleRecAction(confirmAction.id, confirmAction.action);
    setConfirmAction(null);
  }

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const pendingCount = campaigns.filter(c => c.status === "pending").length;
  const filteredRecs = recsFilter === "all" ? recs : recs.filter(r => r.status === recsFilter);
  const pendingRecsCount = recs.filter(r => r.status === "pending").length;

  const actionColor: Record<string, string> = { pause: T.critical, scale: T.healthy, flag_review: T.warning, creative_brief: T.info };
  const actionEmoji: Record<string, string> = { pause: "⏸️", scale: "📈", flag_review: "🔍", creative_brief: "🎨" };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Mono','Fira Mono',monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Review</h1>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Campaign approvals and AI recommendations
          </div>
        </div>
        {(pendingCount + pendingRecsCount) > 0 && (
          <div style={{ background: T.accentBg, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>
            {pendingCount + pendingRecsCount} pending
          </div>
        )}
      </div>

      {/* Page tab switch */}
      <div style={{ display: "flex", gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, marginBottom: 24, width: "fit-content" }}>
        {([
          { key: "campaigns", label: "Campaign Review", count: pendingCount },
          { key: "recommendations", label: "AI Recommendations", count: pendingRecsCount },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setPageTab(t.key)}
            style={{ padding: "6px 16px", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: pageTab === t.key ? 700 : 400, background: pageTab === t.key ? T.accent : "transparent", color: pageTab === t.key ? "#fff" : T.muted, transition: "all 0.15s" }}>
            {t.label}
            {t.count > 0 && <span style={{ marginLeft: 6, background: pageTab === t.key ? "rgba(255,255,255,0.3)" : T.accentBg, color: pageTab === t.key ? "#fff" : T.accent, borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 800 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── AI Recommendations Tab ────────────────────────────────────────────── */}
      {pageTab === "recommendations" && (
        <div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            The AI scans your campaigns hourly and surfaces recommendations here. Approve to execute, or reject to dismiss.
            {" "}<a href="/dashboard/settings" style={{ color: T.accent, textDecoration: "none" }}>Switch to Autonomous Mode →</a>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, marginBottom: 20, width: "fit-content" }}>
            {(["pending", "approved", "rejected", "all"] as const).map(tab => (
              <button key={tab} onClick={() => setRecsFilter(tab)}
                style={{ padding: "5px 14px", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: recsFilter === tab ? 700 : 400, background: recsFilter === tab ? T.accent : "transparent", color: recsFilter === tab ? "#fff" : T.muted, transition: "all 0.15s", textTransform: "capitalize" }}>
                {tab}
                {tab === "pending" && pendingRecsCount > 0 && <span style={{ marginLeft: 6, background: "#fff", color: T.accent, borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 800 }}>{pendingRecsCount}</span>}
              </button>
            ))}
          </div>

          {recsLoading ? (
            <div style={{ textAlign: "center", color: T.muted, fontSize: 13, padding: "40px 0" }}>Loading…</div>
          ) : filteredRecs.length === 0 ? (
            <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: "60px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
              {recsFilter === "pending" ? "No pending recommendations. The AI is scanning your campaigns hourly." : `No ${recsFilter} recommendations.`}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRecs.map(rec => {
                const color = actionColor[rec.action_type] ?? T.muted;
                const emoji = actionEmoji[rec.action_type] ?? "🔧";
                const isPending = rec.status === "pending";
                const statusColor = rec.status === "approved" ? T.healthy : rec.status === "rejected" ? T.critical : rec.status === "executed" ? T.info : T.warning;
                return (
                  <div key={rec.id} style={{ background: T.surface, border: `1px solid ${isPending ? color + "30" : T.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 16 }}>{emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color, textTransform: "uppercase" }}>{rec.action_type.replace("_", " ")}</span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: statusColor + "18", color: statusColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{rec.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>{rec.client_name} · {timeAgo(rec.created_at)}</div>
                      </div>
                      {rec.details.new_budget && (
                        <div style={{ fontSize: 13, color: T.healthy, fontWeight: 700 }}>→ ${rec.details.new_budget.toFixed(2)}/day</div>
                      )}
                    </div>
                    <div style={{ padding: "12px 20px" }}>
                      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>AI Reasoning</div>
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{rec.details.reason}</div>
                      {rec.details.meta_result && rec.details.meta_result !== "pending" && (
                        <div style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>Result: {rec.details.meta_result}</div>
                      )}
                    </div>
                    {isPending && (
                      <div style={{ padding: "10px 20px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                        <button onClick={() => requestAction("rec", rec.id, "approved", rec.details?.reason)} disabled={actingRec === rec.id}
                          style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 700, borderRadius: 7, border: "none", background: T.healthy + "18", color: T.healthy, cursor: actingRec === rec.id ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                          {actingRec === rec.id ? "…" : "✓ Approve & Execute"}
                        </button>
                        <button onClick={() => requestAction("rec", rec.id, "rejected", rec.details?.reason)} disabled={actingRec === rec.id}
                          style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid rgba(255,77,77,0.2)`, background: "rgba(255,77,77,0.06)", color: T.critical, cursor: "pointer", fontFamily: "inherit" }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Campaign Review Tab ───────────────────────────────────────────────── */}
      {pageTab === "campaigns" && (<>

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
                      onClick={() => requestAction("campaign", campaign.id, "approved", campaign.campaign_name)}
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
                        onClick={() => requestAction("campaign", campaign.id, "rejected", campaign.campaign_name, notesInput)}
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
      </>)}

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.action === "approved"
            ? confirmAction?.type === "campaign" ? "Approve & Launch Campaign" : "Approve Recommendation"
            : confirmAction?.type === "campaign" ? "Reject Campaign" : "Reject Recommendation"
        }
        message={
          confirmAction?.action === "approved"
            ? confirmAction?.type === "campaign"
              ? `Are you sure you want to approve and launch "${confirmAction?.name ?? "this campaign"}"? It will go live immediately.`
              : "Are you sure you want to approve and execute this recommendation?"
            : confirmAction?.type === "campaign"
              ? `Are you sure you want to reject "${confirmAction?.name ?? "this campaign"}"?`
              : "Are you sure you want to reject this recommendation?"
        }
        confirmLabel={confirmAction?.action === "approved" ? "Approve" : "Reject"}
        variant={confirmAction?.action === "rejected" ? "danger" : "warning"}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmAction(null)}
      />
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
