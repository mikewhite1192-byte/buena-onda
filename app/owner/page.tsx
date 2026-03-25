"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const T = {
  bg: "#0d0f14",
  card: "#13151d",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.1)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  success: "#4ade80",
  danger: "#f87171",
  info: "#4fc3f7",
};

const RISK_LABELS: Record<string, string> = {
  no_clients: "No clients added",
  no_campaigns: "No campaigns running",
  ai_unused: "AI never used",
  inactive_14d: "14d inactive",
  trial_expiring: "Trial expiring",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? T.text, letterSpacing: "-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function fmt$(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

type Stats = {
  mrr: { active: number; trialing: number; churned: number; total: number; estimated_mrr: number };
  signups: number;
  spend: { total: number; by_platform: { platform: string; spend: string }[] };
  campaigns: { total: number; active: number; new: number };
  actions: { total: number; recommendations_made: number; recommendations_used: number; acceptance_rate: number; ads_created: number };
  support: { open_tickets: number; open_feedback: number };
  affiliates: { active: number; pending: number; referrals_period: number; pending_payouts: number };
};

type User = {
  clerk_user_id: string;
  status: string;
  plan_name: string;
  subscribed_at: string;
  client_count: number;
  campaign_count: number;
  action_count: number;
  total_spend: number;
  last_action_at: string | null;
  risks: string[];
  is_at_risk: boolean;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users" | "alerts" | "tickets" | "feedback">("overview");
  const [range, setRange] = useState("30d");
  const [platform, setPlatform] = useState("all");
  const [vertical, setVertical] = useState("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState("all");
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [feedback, setFeedback] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [outreachId, setOutreachId] = useState<string | null>(null);
  const [outreachMsg, setOutreachMsg] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);

  useEffect(() => { loadStats(); }, [range, platform, vertical]);
  useEffect(() => { loadUsers(); }, [userFilter]);
  useEffect(() => { if (tab === "tickets") loadTickets(); }, [tab]);
  useEffect(() => { if (tab === "feedback") loadFeedbackData(); }, [tab]);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/stats?range=${range}&platform=${platform}&vertical=${vertical}`);
      if (res.status === 404) { router.push("/dashboard"); return; }
      const data = await res.json();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    const res = await fetch(`/api/owner/users?filter=${userFilter}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
  }

  async function loadTickets() {
    const res = await fetch("/api/owner/tickets");
    if (res.ok) setTickets((await res.json()).tickets ?? []);
  }

  async function loadFeedbackData() {
    const res = await fetch("/api/owner/feedback");
    if (res.ok) setFeedback((await res.json()).feedback ?? []);
  }

  async function sendOutreach() {
    if (!outreachId || !outreachMsg.trim()) return;
    setSendingOutreach(true);
    await fetch("/api/owner/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerk_user_id: outreachId, message: outreachMsg.trim(), channel: "whatsapp" }),
    });
    setSendingOutreach(false);
    setOutreachId(null);
    setOutreachMsg("");
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users${users.length ? ` (${users.length})` : ""}` },
    { id: "alerts", label: `At-Risk${stats ? ` (${users.filter(u => u.is_at_risk).length})` : ""}` },
    { id: "tickets", label: `Tickets${stats ? ` (${stats.support.open_tickets})` : ""}` },
    { id: "feedback", label: `Feedback${stats ? ` (${stats.support.open_feedback})` : ""}` },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 24px", position: "sticky", top: 0, background: T.bg, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 52, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>B</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Owner Dashboard</span>
            <span style={{ fontSize: 10, color: T.faint, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 7px", letterSpacing: "0.06em" }}>PRIVATE</span>
          </div>
          <div style={{ flex: 1 }} />
          <a href="/dashboard" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>← Dashboard</a>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 2, paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "users") loadUsers(); }}
              style={{ padding: "8px 14px", fontSize: 12, border: "none", background: "transparent", color: tab === t.id ? T.accent : T.muted, borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`, cursor: "pointer", fontFamily: "inherit", fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Filters */}
        {tab === "overview" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {[["7d","7 days"],["30d","30 days"],["90d","90 days"],["all","All time"]].map(([v,l]) => (
              <button key={v} onClick={() => setRange(v)}
                style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${range === v ? T.accent : T.border}`, background: range === v ? T.accentBg : "transparent", color: range === v ? T.accent : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
            <div style={{ width: 1, background: T.border, margin: "0 4px" }} />
            {[["all","All Platforms"],["meta","Meta"],["google","Google"],["tiktok","TikTok"],["shopify","Shopify"]].map(([v,l]) => (
              <button key={v} onClick={() => setPlatform(v)}
                style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${platform === v ? T.info : T.border}`, background: platform === v ? "rgba(79,195,247,0.1)" : "transparent", color: platform === v ? T.info : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
            <div style={{ width: 1, background: T.border, margin: "0 4px" }} />
            {[["all","All Verticals"],["leads","Leads"],["ecomm","Ecomm"]].map(([v,l]) => (
              <button key={v} onClick={() => setVertical(v)}
                style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${vertical === v ? "#c07ef0" : T.border}`, background: vertical === v ? "rgba(192,126,240,0.1)" : "transparent", color: vertical === v ? "#c07ef0" : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {tab === "overview" && (
          loading ? <div style={{ color: T.muted, fontSize: 13 }}>Loading…</div> :
          stats && <>
            {/* Revenue */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Revenue</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard label="Est. MRR" value={fmt$(stats.mrr.estimated_mrr)} color={T.accent} sub={`${stats.mrr.active} active subscribers`} />
              <StatCard label="Active" value={stats.mrr.active} color={T.success} />
              <StatCard label="Trialing" value={stats.mrr.trialing} color={T.accent} />
              <StatCard label="Churned" value={stats.mrr.churned} color={T.danger} />
              <StatCard label="New Signups" value={stats.signups} sub={`in ${range}`} />
            </div>

            {/* Ad Spend */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Ad Spend Managed</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard label="Total Spend" value={fmt$(stats.spend.total)} color={T.accent} sub={`in ${range}`} />
              {stats.spend.by_platform.map((p) => (
                <StatCard key={p.platform} label={p.platform} value={fmt$(Number(p.spend))} />
              ))}
            </div>

            {/* Activity */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Platform Activity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard label="Active Campaigns" value={stats.campaigns.active} color={T.success} sub={`${stats.campaigns.new} new this period`} />
              <StatCard label="Agent Actions" value={stats.actions.total.toLocaleString()} sub={`in ${range}`} />
              <StatCard label="Ads Created" value={stats.actions.ads_created.toLocaleString()} />
              <StatCard label="Recommendations" value={stats.actions.recommendations_made.toLocaleString()} />
              <StatCard label="Acceptance Rate" value={`${stats.actions.acceptance_rate}%`} color={stats.actions.acceptance_rate > 70 ? T.success : T.accent} />
            </div>

            {/* Support */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Support</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
              <StatCard label="Open Tickets" value={stats.support.open_tickets} color={stats.support.open_tickets > 0 ? T.danger : T.success} />
              <StatCard label="Open Feedback" value={stats.support.open_feedback} color={stats.support.open_feedback > 0 ? T.accent : T.success} />
            </div>

            {/* Affiliates */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Affiliates</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
              <StatCard label="Active Affiliates" value={stats.affiliates.active} />
              <StatCard label="Referrals" value={stats.affiliates.referrals_period} sub={`in ${range}`} />
              <StatCard label="Pending Payouts" value={fmt$(stats.affiliates.pending_payouts)} color={T.accent} />
            </div>
          </>
        )}

        {/* Users Tab */}
        {(tab === "users" || tab === "alerts") && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[["all","All"],["active","Active"],["trial","Trial"],["at_risk","At-Risk"],["churned","Churned"]].map(([v,l]) => (
                <button key={v} onClick={() => { setUserFilter(v); loadUsers(); }}
                  style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${userFilter === v ? T.accent : T.border}`, background: userFilter === v ? T.accentBg : "transparent", color: userFilter === v ? T.accent : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(tab === "alerts" ? users.filter(u => u.is_at_risk) : users).map(u => (
                <div key={u.clerk_user_id} style={{ background: T.card, border: `1px solid ${u.is_at_risk ? "rgba(248,113,113,0.2)" : T.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600, fontFamily: "monospace" }}>{u.clerk_user_id.slice(0, 20)}…</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: u.status === "active" ? T.success : u.status === "trialing" ? T.accent : T.danger }}>{u.status}</span>
                      <span style={{ fontSize: 10, color: T.faint }}>·</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{u.client_count} clients</span>
                      <span style={{ fontSize: 10, color: T.faint }}>·</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{u.campaign_count} campaigns</span>
                      <span style={{ fontSize: 10, color: T.faint }}>·</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{fmt$(Number(u.total_spend))} spend</span>
                      <span style={{ fontSize: 10, color: T.faint }}>·</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{u.action_count} actions</span>
                    </div>
                    {u.risks.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {u.risks.map(r => (
                          <span key={r} style={{ fontSize: 10, color: T.danger, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                            {RISK_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: T.faint, whiteSpace: "nowrap" }}>
                    {new Date(u.subscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <button onClick={() => { setOutreachId(u.clerk_user_id); setOutreachMsg(""); }}
                    style={{ background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, color: T.accent, borderRadius: 7, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Message
                  </button>
                </div>
              ))}
              {(tab === "alerts" ? users.filter(u => u.is_at_risk) : users).length === 0 && (
                <div style={{ color: T.faint, fontSize: 13, padding: "24px 0", textAlign: "center" }}>
                  {tab === "alerts" ? "No at-risk users right now ✓" : "No users found"}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tickets Tab */}
        {tab === "tickets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.length === 0 ? (
              <div style={{ color: T.faint, fontSize: 13, padding: "24px 0", textAlign: "center" }}>No open tickets</div>
            ) : tickets.map((t) => (
              <div key={String(t.id)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{String(t.subject)}</span>
                  <span style={{ fontSize: 10, color: T.accent, background: T.accentBg, borderRadius: 4, padding: "2px 7px" }}>{String(t.category)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: T.faint }}>{new Date(String(t.created_at)).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{String(t.user_name)} — {String(t.user_email)}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{String(t.description).slice(0, 200)}{String(t.description).length > 200 ? "…" : ""}</div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Tab */}
        {tab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feedback.length === 0 ? (
              <div style={{ color: T.faint, fontSize: 13, padding: "24px 0", textAlign: "center" }}>No open feedback</div>
            ) : feedback.map((f) => (
              <div key={String(f.id)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>{String(f.user_name)} — {String(f.user_email)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: T.faint }}>{new Date(String(f.created_at)).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{String(f.message)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outreach Modal */}
      {outreachId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setOutreachId(null); }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px 32px", width: 480, maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: T.text }}>Send WhatsApp Message</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: T.muted }}>Sent as "Mike from Buena Onda" to the user's WhatsApp number.</p>
            <textarea
              value={outreachMsg}
              onChange={e => setOutreachMsg(e.target.value)}
              placeholder="Hey! Just checking in to see how things are going..."
              rows={4}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" as const }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={sendOutreach} disabled={sendingOutreach || !outreachMsg.trim()}
                style={{ flex: 1, background: outreachMsg.trim() ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, color: outreachMsg.trim() ? "#0d0f14" : T.faint, cursor: outreachMsg.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                {sendingOutreach ? "Sending…" : "Send via WhatsApp"}
              </button>
              <button onClick={() => setOutreachId(null)}
                style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
