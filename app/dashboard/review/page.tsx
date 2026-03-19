"use client";

// app/dashboard/review/page.tsx
import { useEffect, useState } from "react";

type ActionType = "scale" | "pause" | "creative_brief" | "flag_review";

interface AgentAction {
  id: number;
  ad_set_id: string;
  ad_account_id: string;
  action_type: ActionType;
  action_details: Record<string, unknown>;
  status: string;
  created_at: string;
  vertical: "leads" | "ecomm" | null;
}

const ACTION_LABELS: Record<ActionType, string> = {
  scale: "Scale Budget",
  pause: "Pause Ad Set",
  creative_brief: "New Creative Brief",
  flag_review: "Review",
};

const ACTION_COLORS: Record<ActionType, string> = {
  scale: "#2A8C8A",
  pause: "#E8705A",
  creative_brief: "#8B6FE8",
  flag_review: "#F5A623",
};

function formatDetails(action: AgentAction): string {
  const d = action.action_details;
  if (action.action_type === "scale") {
    return `$${d.current_budget}/day → $${d.new_budget}/day (+${Math.round((d.increase_pct as number) * 100)}%)`;
  }
  if (action.action_type === "pause") {
    return `CPL exceeded cap`;
  }
  if (action.action_type === "creative_brief") {
    const trigger = d.trigger as string;
    const value = d.value as number;
    return trigger === "frequency"
      ? `Frequency ${value?.toFixed(2)} — audience fatigued`
      : `CTR ${((value ?? 0) * 100).toFixed(2)}% — creative dying`;
  }
  return JSON.stringify(d);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ReviewPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [resolved, setResolved] = useState<Record<number, "approved" | "rejected">>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  async function fetchActions() {
    try {
      const res = await fetch("/api/agent/actions");
      const data = await res.json();
      setActions(data.actions ?? []);
    } catch {
      setError("Failed to load actions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id: number, decision: "approved" | "rejected") {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/agent/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unknown error");
      }
      setResolved((r) => ({ ...r, [id]: decision }));
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  const pending = actions.filter((a) => !resolved[a.id]);
  const done = actions.filter((a) => resolved[a.id]);

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
      {/* Header */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#2A8C8A",
              margin: 0,
              letterSpacing: "-0.5px",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Agent Review
          </h1>
          {!loading && (
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
              {pending.length} pending
            </span>
          )}
        </div>
        <p style={{ color: "#4a7a7a", fontSize: 13, margin: "0 0 40px" }}>
          Actions flagged by the agent for your approval before execution.
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#2a0f0f",
              border: "1px solid #E8705A44",
              borderRadius: 8,
              padding: "14px 18px",
              color: "#E8705A",
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ color: "#4a7a7a", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
            Loading flagged actions...
          </div>
        )}

        {/* Empty state */}
        {!loading && pending.length === 0 && done.length === 0 && (
          <div
            style={{
              border: "1px dashed #1a3535",
              borderRadius: 12,
              padding: "60px 24px",
              textAlign: "center",
              color: "#4a7a7a",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 14 }}>No actions pending review.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              The agent is running clean. Check back after the next loop cycle.
            </div>
          </div>
        )}

        {/* Pending Actions */}
        {pending.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {pending.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                processing={!!processing[action.id]}
                onApprove={() => handleDecision(action.id, "approved")}
                onReject={() => handleDecision(action.id, "rejected")}
              />
            ))}
          </div>
        )}

        {/* Resolved this session */}
        {done.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                color: "#2a4a4a",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Resolved this session
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {done.map((action) => (
                <div
                  key={action.id}
                  style={{
                    background: "#0d1818",
                    border: "1px solid #141f1f",
                    borderRadius: 10,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.5,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#4a7a7a" }}>
                    <span style={{ color: "#2a5a5a", marginRight: 10 }}>
                      {ACTION_LABELS[action.action_type]}
                    </span>
                    {action.ad_set_id}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: resolved[action.id] === "approved" ? "#2A8C8A" : "#E8705A",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {resolved[action.id]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({
  action,
  processing,
  onApprove,
  onReject,
}: {
  action: AgentAction;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const color = ACTION_COLORS[action.action_type] ?? "#2A8C8A";

  return (
    <div
      style={{
        background: "#0d1818",
        border: "1px solid #1a2f2f",
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "18px 20px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: `${color}18`,
              border: `1px solid ${color}33`,
              borderRadius: 4,
              padding: "2px 8px",
            }}
          >
            {ACTION_LABELS[action.action_type]}
          </span>
          {action.vertical && (
            <span
              style={{
                fontSize: 11,
                color: "#4a7a7a",
                background: "#0f1f1f",
                border: "1px solid #1a3535",
                borderRadius: 4,
                padding: "2px 8px",
              }}
            >
              {action.vertical}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#2a4a4a" }}>{timeAgo(action.created_at)}</span>
      </div>

      {/* Ad Set ID */}
      <div style={{ fontSize: 12, color: "#2A8C8A", marginBottom: 6, fontFamily: "monospace" }}>
        {action.ad_set_id}
      </div>

      {/* Details */}
      <div style={{ fontSize: 13, color: "#8ab8b8", marginBottom: 16 }}>
        {formatDetails(action)}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onApprove}
          disabled={processing}
          style={{
            flex: 1,
            padding: "9px 0",
            background: processing ? "#0f2020" : "#0B5C5C",
            border: "1px solid #2A8C8A44",
            borderRadius: 6,
            color: processing ? "#4a7a7a" : "#e8f4f4",
            fontSize: 13,
            fontWeight: 600,
            cursor: processing ? "not-allowed" : "pointer",
            fontFamily: "'DM Mono', monospace",
            transition: "background 0.15s",
          }}
        >
          {processing ? "Executing..." : "✓ Approve"}
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          style={{
            flex: 1,
            padding: "9px 0",
            background: "transparent",
            border: "1px solid #E8705A44",
            borderRadius: 6,
            color: processing ? "#4a7a7a" : "#E8705A",
            fontSize: 13,
            fontWeight: 600,
            cursor: processing ? "not-allowed" : "pointer",
            fontFamily: "'DM Mono', monospace",
            transition: "all 0.15s",
          }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}
