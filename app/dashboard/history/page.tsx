"use client";

// app/dashboard/history/page.tsx — Agency action log
import { useEffect, useState } from "react";

const T = {
  bg: "#0d0f14", surface: "#161820", border: "rgba(255,255,255,0.06)",
  accent: "#f5a623", text: "#e8eaf0", muted: "#8b8fa8", faint: "#5a5e72",
  critical: "#ff4d4d", warning: "#e8b84b", healthy: "#2ecc71", info: "#7b8cde",
};

const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  pause_campaign:    { icon: "⏸",  color: T.warning,  label: "Campaign Paused"           },
  scale_budget:      { icon: "📈", color: T.healthy,  label: "Budget Increased"          },
  rec_declined:      { icon: "✕",  color: T.faint,    label: "Recommendation Dismissed"  },
  rec_snoozed:       { icon: "💤", color: T.faint,    label: "Recommendation Snoozed"    },
  campaign_created:  { icon: "✨", color: T.info,     label: "Campaign Created"          },
  campaign_approved: { icon: "✓",  color: T.healthy,  label: "Campaign Approved"         },
  campaign_rejected: { icon: "✕",  color: T.critical, label: "Campaign Rejected"         },
};

interface ActionLog {
  id: number;
  client_id: string | null;
  client_name: string | null;
  action_type: string;
  description: string;
  campaign_id: string | null;
  campaign_name: string | null;
  meta_before: Record<string, unknown> | null;
  meta_after: Record<string, unknown> | null;
  created_at: string;
}

interface Client { id: string; name: string; }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(d => setClients(d.clients ?? []));
    loadHistory();
  }, []);

  async function loadHistory(clientId?: string) {
    setLoading(true);
    const url = clientId && clientId !== "all" ? `/api/history?client_id=${clientId}` : "/api/history";
    const res = await fetch(url);
    const data = await res.json();
    setActions(data.actions ?? []);
    setLoading(false);
  }

  function handleClientFilter(id: string) {
    setFilterClient(id);
    loadHistory(id);
  }

  const filtered = filterType === "all" ? actions : actions.filter(a => a.action_type === filterType);

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-8 max-w-[860px] mx-auto" style={{ fontFamily: "'DM Mono','Fira Mono',monospace" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Action History</h1>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          Every action Buena Onda has taken — pauses, budget changes, campaign launches
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={filterClient}
          onChange={e => handleClientFilter(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "inherit" }}
        >
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "inherit" }}
        >
          <option value="all">All Actions</option>
          <option value="pause_campaign">Campaign Pauses</option>
          <option value="scale_budget">Budget Increases</option>
          <option value="campaign_approved">Campaigns Approved</option>
          <option value="campaign_rejected">Campaigns Rejected</option>
        </select>

        <div style={{ marginLeft: "auto", fontSize: 12, color: T.muted }}>
          {filtered.length} action{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Log */}
      {loading ? (
        <div style={{ textAlign: "center", color: T.muted, fontSize: 13, padding: "40px 0" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: "60px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          No actions yet. Pausing campaigns and scaling budgets from the Overview will appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((action, i) => {
            const cfg = ACTION_CONFIG[action.action_type] ?? { icon: "•", color: T.muted, label: action.action_type };
            const isLast = i === filtered.length - 1;
            return (
              <div key={action.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                {!isLast && (
                  <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 1, background: T.border }} />
                )}
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: cfg.color + "18", border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, paddingBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                    {action.client_name && (
                      <span style={{ fontSize: 11, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: "1px 7px", borderRadius: 4 }}>
                        {action.client_name}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: T.faint, marginLeft: "auto" }}>
                      {timeAgo(action.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 4 }}>
                    {action.description}
                  </div>
                  {action.meta_before && action.meta_after && (
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: T.muted, marginBottom: 4 }}>
                      <span>Before: <span style={{ color: T.text }}>${(action.meta_before.daily_budget as number)?.toFixed(0)}/day</span></span>
                      <span>→</span>
                      <span>After: <span style={{ color: T.healthy }}>${(action.meta_after.daily_budget as number)?.toFixed(0)}/day</span></span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: T.faint }}>
                    {new Date(action.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
