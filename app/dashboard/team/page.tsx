"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "../_components/ConfirmDialog";

const T = {
  bg: "#0d0f14",
  card: "#13151d",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  success: "#4ade80",
  danger: "#f87171",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#c07ef0",
  manager: "#7b8cde",
  viewer: "#8b8fa8",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

const ROLE_DESCS: Record<string, string> = {
  admin: "Full access — same as owner",
  manager: "Campaigns + clients",
  viewer: "Read-only",
};

interface TeamMember {
  id: string;
  member_clerk_user_id: string;
  role: string;
  name: string | null;
  email: string | null;
  joined_at: string;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [sending, setSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Role change / remove state
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setMembers(data.members ?? []);
      setInvites(data.invites ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setInviteMsg({ type: "ok", text: `Invite sent to ${inviteEmail.trim()}` });
        setInviteEmail("");
        fetchTeam();
      } else {
        setInviteMsg({ type: "err", text: data.error ?? "Failed to send invite" });
      }
    } catch {
      setInviteMsg({ type: "err", text: "Network error" });
    } finally {
      setSending(false);
    }
  }

  async function removeMember(id: string) {
    setPendingRemove(id);
    try {
      await fetch(`/api/team/members/${id}`, { method: "DELETE" });
      setMembers((m) => m.filter((x) => x.id !== id));
    } catch {
      // ignore
    } finally {
      setPendingRemove(null);
    }
  }

  async function cancelInvite(id: string) {
    try {
      await fetch(`/api/team/invites/${id}`, { method: "DELETE" });
      setInvites((v) => v.filter((x) => x.id !== id));
    } catch {
      // ignore
    }
  }

  async function changeRole(id: string, newRole: string) {
    try {
      await fetch(`/api/team/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setMembers((m) => m.map((x) => (x.id === id ? { ...x, role: newRole } : x)));
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 780, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.4px" }}>Team</h1>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
          Invite teammates and manage their access level.
        </p>
      </div>

      {/* Invite form */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "22px 24px", marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Invite a team member</div>
        <form onSubmit={sendInvite} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 6 }}>Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@agency.com"
              required
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13,
                color: T.text,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 6 }}>Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              style={{
                width: "100%",
                background: "#0d0f14",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13,
                color: T.text,
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            style={{
              background: sending ? "rgba(245,166,35,0.3)" : "linear-gradient(135deg,#f5a623,#f76b1c)",
              color: sending ? T.accent : "#0d0f14",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: sending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </form>
        {inviteMsg && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: inviteMsg.type === "ok" ? T.success : T.danger,
            padding: "8px 12px",
            background: inviteMsg.type === "ok" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
            borderRadius: 6,
          }}>
            {inviteMsg.text}
          </div>
        )}

        {/* Role reference */}
        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.faint }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ROLE_COLORS[key], display: "inline-block" }} />
              <strong style={{ color: ROLE_COLORS[key] }}>{label}</strong> — {ROLE_DESCS[key]}
            </div>
          ))}
        </div>
      </div>

      {/* Current members */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          Members ({members.length})
        </div>

        {loading ? (
          <div style={{ color: T.faint, fontSize: 13, padding: "16px 0" }}>Loading…</div>
        ) : members.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px 20px", textAlign: "center", color: T.faint, fontSize: 13 }}>
            No team members yet. Invite someone above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {members.map((m) => (
              <div key={m.id} style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                {/* Avatar initial */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: `${ROLE_COLORS[m.role]}22`,
                  border: `1px solid ${ROLE_COLORS[m.role]}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: ROLE_COLORS[m.role],
                  flexShrink: 0,
                }}>
                  {(m.name ?? m.email ?? "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name ?? m.email ?? "Unknown"}
                  </div>
                  {m.name && (
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                  )}
                </div>

                {/* Role selector */}
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value)}
                  style={{
                    background: "#0d0f14",
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    color: ROLE_COLORS[m.role],
                    fontFamily: "inherit",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>

                {/* Joined date */}
                <div style={{ fontSize: 11, color: T.faint, whiteSpace: "nowrap", minWidth: 70, textAlign: "right" }}>
                  {new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                {/* Remove */}
                <button
                  onClick={() => setConfirmRemove({ id: m.id, email: m.email ?? "this member" })}
                  disabled={pendingRemove === m.id}
                  style={{
                    background: "transparent",
                    border: `1px solid rgba(248,113,113,0.3)`,
                    color: T.danger,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: pendingRemove === m.id ? 0.5 : 1,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Pending Invites ({invites.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {invites.map((inv) => (
              <div key={inv.id} style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                {/* Pending dot */}
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, opacity: 0.6, flexShrink: 0 }} />

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.email}</div>
                  <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>
                    Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>

                <span style={{ fontSize: 11, color: ROLE_COLORS[inv.role], background: `${ROLE_COLORS[inv.role]}18`, border: `1px solid ${ROLE_COLORS[inv.role]}33`, borderRadius: 5, padding: "3px 8px" }}>
                  {ROLE_LABELS[inv.role]}
                </span>

                <button
                  onClick={() => cancelInvite(inv.id)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${T.border}`,
                    color: T.muted,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${confirmRemove?.email ?? "this member"} from the team? They will lose all access immediately.`}
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={() => {
          if (confirmRemove) removeMember(confirmRemove.id);
          setConfirmRemove(null);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
