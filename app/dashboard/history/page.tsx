"use client";

// app/dashboard/history/page.tsx
import { useEffect, useState, useCallback } from "react";

type ActionStatus = "all" | "executed" | "approved" | "rejected" | "flag_review";
type ActionType = "all" | "scale" | "pause" | "creative_brief" | "flag_review";

interface AgentAction {
  id: number;
  ad_set_id: string;
  ad_account_id: string;
  action_type: string;
  action_details: Record<string, unknown>;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  vertical: "leads" | "ecomm" | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_COLORS: Record<string, string> = {
  executed: "#2A8C8A",
  approved: "#2A8C8A",
  rejected: "#E8705A",
  flag_review: "#F5A623",
};

const STATUS_LABELS: Record<string, string> = {
  executed: "Executed",
  approved: "Approved",
  rejected: "Rejected",
  flag_review: "Pending Review",
};

const ACTION_LABELS: Record<string, string> = {
  scale: "Scale Budget",
  pause: "Pause",
  creative_brief: "Creative Brief",
  flag_review: "Flag Review",
};

function formatDetails(action: AgentAction): string {
  const d = action.action_details ?? {};
  if (action.action_type === "scale") {
    return `$${d.current_budget}/day → $${d.new_budget}/day`;
  }
  if (action.action_type === "pause") return "CPL exceeded cap";
  if (action.action_type === "creative_brief") {
    const trigger = d.trigger as string;
    const value = d.value as number;
    if (trigger === "frequency") return `Frequency ${value?.toFixed(2)}`;
    if (trigger === "ctr") return `CTR ${((value ?? 0) * 100).toFixed(2)}%`;
  }
  return "—";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTER_BTN = (active: boolean) => ({
  padding: "5px 12px",
  fontSize: 12,
  borderRadius: 5,
  border: active ? "1px solid #2A8C8A" : "1px solid #1a3535",
  background: active ? "#0B5C5C" : "transparent",
  color: active ? "#e8f4f4" : "#4a7a7a",
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace",
  transition: "all 0.15s",
});

export default function HistoryPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ActionStatus>("all");
  const [typeFilter, setTypeFilter] = useState<ActionType>("all");
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        status: statusFilter,
        action_type: typeFilter,
      });
      const res = await fetch(`/api/agent/history?${params}`);
      const data = await res.json();
      setActions(data.actions ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f0f",
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
        color: "#e8f4f4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 6 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#2A8C8A",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Action History
            </h1>
            {pagination && (
              <span
                style={{
                  fontSize: 13,
                  color: "#4a7a7a",
                  background: "#0f1f1f",
                  border: "1px solid #1a3535",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}
              >
                {pagination.total} total
              </span>
            )}
          </div>
          <p style={{ color: "#4a7a7a", fontSize: 13, margin: 0 }}>
            Every action the agent has taken or flagged.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Status filter */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#2a4a4a", marginRight: 4 }}>STATUS</span>
            {(["all", "executed", "approved", "rejected", "flag_review"] as ActionStatus[]).map((s) => (
              <button
                key={s}
                style={FILTER_BTN(statusFilter === s)}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#2a4a4a", marginRight: 4 }}>TYPE</span>
            {(["all", "scale", "pause", "creative_brief"] as ActionType[]).map((t) => (
              <button
                key={t}
                style={FILTER_BTN(typeFilter === t)}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "All" : ACTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            border: "1px solid #1a2f2f",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 120px",
              padding: "10px 18px",
              background: "#0d1818",
              borderBottom: "1px solid #1a2f2f",
              fontSize: 11,
              color: "#2a4a4a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>Ad Set</span>
            <span>Action</span>
            <span>Details</span>
            <span>Time</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div
              style={{
                padding: "40px 18px",
                textAlign: "center",
                color: "#4a7a7a",
                fontSize: 13,
              }}
            >
              Loading...
            </div>
          ) : actions.length === 0 ? (
            <div
              style={{
                padding: "60px 18px",
                textAlign: "center",
                color: "#4a7a7a",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>—</div>
              No actions yet. The agent will log here once it starts running.
            </div>
          ) : (
            actions.map((action, i) => (
              <div
                key={action.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 120px",
                  padding: "13px 18px",
                  borderBottom: i < actions.length - 1 ? "1px solid #0f1f1f" : "none",
                  fontSize: 12,
                  alignItems: "center",
                  background: i % 2 === 0 ? "#0a0f0f" : "#0c1515",
                  transition: "background 0.1s",
                }}
              >
                {/* Ad Set ID */}
                <span
                  style={{
                    color: "#2A8C8A",
                    fontFamily: "monospace",
                    fontSize: 11,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {action.ad_set_id || "—"}
                </span>

                {/* Action type */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#8ab8b8" }}>
                    {ACTION_LABELS[action.action_type] ?? action.action_type}
                  </span>
                  {action.vertical && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#2a4a4a",
                        background: "#0f1f1f",
                        border: "1px solid #1a3535",
                        borderRadius: 3,
                        padding: "1px 5px",
                      }}
                    >
                      {action.vertical}
                    </span>
                  )}
                </div>

                {/* Details */}
                <span style={{ color: "#4a7a7a", fontSize: 11 }}>
                  {formatDetails(action)}
                </span>

                {/* Time */}
                <span style={{ color: "#2a4a4a", fontSize: 11 }}>
                  {formatDate(action.created_at)}
                </span>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: STATUS_COLORS[action.status] ?? "#4a7a7a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {STATUS_LABELS[action.status] ?? action.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                ...FILTER_BTN(false),
                opacity: page === 1 ? 0.3 : 1,
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: "#4a7a7a" }}>
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              style={{
                ...FILTER_BTN(false),
                opacity: page === pagination.pages ? 0.3 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
