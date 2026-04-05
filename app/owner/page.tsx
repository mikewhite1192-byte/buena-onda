"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContentHub from "./content-hub";

const RISK_LABELS: Record<string, string> = {
  no_clients: "No clients added",
  no_campaigns: "No campaigns running",
  ai_unused: "AI never used",
  inactive_14d: "14d inactive",
  trial_expiring: "Trial expiring",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#13151d] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.12] transition-all duration-200">
      <div className="text-[11px] text-[#8b8fa8] uppercase tracking-wider mb-2">{label}</div>
      <div className="text-[26px] font-extrabold tracking-tight" style={{ color: color ?? "#e8eaf0" }}>{value}</div>
      {sub && <div className="text-[11px] text-[#5a5e72] mt-1">{sub}</div>}
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

type TabId = "overview" | "users" | "alerts" | "tickets" | "feedback" | "content";

export default function OwnerDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
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
      setStats(await res.json());
    } finally { setLoading(false); }
  }

  async function loadUsers() {
    const res = await fetch(`/api/owner/users?filter=${userFilter}`);
    if (res.ok) setUsers((await res.json()).users ?? []);
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

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users${users.length ? ` (${users.length})` : ""}` },
    { id: "alerts", label: `At-Risk${stats ? ` (${users.filter(u => u.is_at_risk).length})` : ""}` },
    { id: "tickets", label: `Tickets${stats ? ` (${stats.support.open_tickets})` : ""}` },
    { id: "feedback", label: `Feedback${stats ? ` (${stats.support.open_feedback})` : ""}` },
    { id: "content", label: "Content" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f14]">

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0f14]/90 backdrop-blur-xl px-6">
        <div className="max-w-5xl mx-auto h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center font-black text-xs text-white">B</div>
            <span className="font-extrabold text-sm text-[#e8eaf0]">Owner Dashboard</span>
            <span className="text-[10px] text-[#5a5e72] bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5 tracking-wider uppercase">Private</span>
          </div>
          <div className="flex-1" />
          <a href="/dashboard" className="text-xs text-[#8b8fa8] no-underline hover:text-amber-400 transition-colors">
            ← Dashboard
          </a>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto flex gap-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "users") loadUsers(); }}
              className={`px-4 py-2.5 text-xs border-b-2 cursor-pointer transition-all duration-200 bg-transparent border-x-0 border-t-0 ${
                tab === t.id
                  ? "text-amber-400 border-amber-400 font-bold"
                  : "text-[#8b8fa8] border-transparent font-normal hover:text-[#e8eaf0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-7">

        {/* ── Filters ── */}
        {tab === "overview" && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {[["7d","7 days"],["30d","30 days"],["90d","90 days"],["all","All time"]].map(([v,l]) => (
              <button key={v} onClick={() => setRange(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 ${
                  range === v ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-transparent border border-white/[0.06] text-[#8b8fa8] hover:border-white/[0.15]"
                }`}>
                {l}
              </button>
            ))}
            <div className="w-px bg-white/[0.06] mx-1" />
            {[["all","All Platforms"],["meta","Meta"],["google","Google"],["tiktok","TikTok"],["shopify","Shopify"]].map(([v,l]) => (
              <button key={v} onClick={() => setPlatform(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 ${
                  platform === v ? "bg-sky-400/10 border border-sky-400/30 text-sky-400" : "bg-transparent border border-white/[0.06] text-[#8b8fa8] hover:border-white/[0.15]"
                }`}>
                {l}
              </button>
            ))}
            <div className="w-px bg-white/[0.06] mx-1" />
            {[["all","All Verticals"],["leads","Leads"],["ecomm","Ecomm"]].map(([v,l]) => (
              <button key={v} onClick={() => setVertical(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 ${
                  vertical === v ? "bg-purple-400/10 border border-purple-400/30 text-purple-400" : "bg-transparent border border-white/[0.06] text-[#8b8fa8] hover:border-white/[0.15]"
                }`}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          loading ? (
            <div className="text-[#8b8fa8] text-sm py-12 text-center">Loading...</div>
          ) : stats && (
            <>
              <SectionLabel>Revenue</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
                <StatCard label="Est. MRR" value={fmt$(stats.mrr.estimated_mrr)} color="#f5a623" sub={`${stats.mrr.active} active subscribers`} />
                <StatCard label="Active" value={stats.mrr.active} color="#4ade80" />
                <StatCard label="Trialing" value={stats.mrr.trialing} color="#f5a623" />
                <StatCard label="Churned" value={stats.mrr.churned} color="#f87171" />
                <StatCard label="New Signups" value={stats.signups} sub={`in ${range}`} />
              </div>

              <SectionLabel>Ad Spend Managed</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
                <StatCard label="Total Spend" value={fmt$(stats.spend.total)} color="#f5a623" sub={`in ${range}`} />
                {stats.spend.by_platform.map(p => (
                  <StatCard key={p.platform} label={p.platform} value={fmt$(Number(p.spend))} />
                ))}
              </div>

              <SectionLabel>Platform Activity</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
                <StatCard label="Active Campaigns" value={stats.campaigns.active} color="#4ade80" sub={`${stats.campaigns.new} new this period`} />
                <StatCard label="Agent Actions" value={stats.actions.total.toLocaleString()} sub={`in ${range}`} />
                <StatCard label="Ads Created" value={stats.actions.ads_created.toLocaleString()} />
                <StatCard label="Recommendations" value={stats.actions.recommendations_made.toLocaleString()} />
                <StatCard label="Acceptance Rate" value={`${stats.actions.acceptance_rate}%`} color={stats.actions.acceptance_rate > 70 ? "#4ade80" : "#f5a623"} />
              </div>

              <SectionLabel>Support</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
                <StatCard label="Open Tickets" value={stats.support.open_tickets} color={stats.support.open_tickets > 0 ? "#f87171" : "#4ade80"} />
                <StatCard label="Open Feedback" value={stats.support.open_feedback} color={stats.support.open_feedback > 0 ? "#f5a623" : "#4ade80"} />
              </div>

              <SectionLabel>Affiliates</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <StatCard label="Active Affiliates" value={stats.affiliates.active} />
                <StatCard label="Referrals" value={stats.affiliates.referrals_period} sub={`in ${range}`} />
                <StatCard label="Pending Payouts" value={fmt$(stats.affiliates.pending_payouts)} color="#f5a623" />
              </div>
            </>
          )
        )}

        {/* ── Users / At-Risk Tab ── */}
        {(tab === "users" || tab === "alerts") && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {[["all","All"],["active","Active"],["trial","Trial"],["at_risk","At-Risk"],["churned","Churned"]].map(([v,l]) => (
                <button key={v} onClick={() => { setUserFilter(v); loadUsers(); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 ${
                    userFilter === v ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-transparent border border-white/[0.06] text-[#8b8fa8] hover:border-white/[0.15]"
                  }`}>
                  {l}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              {(tab === "alerts" ? users.filter(u => u.is_at_risk) : users).map(u => (
                <div key={u.clerk_user_id} className={`bg-[#13151d] border rounded-xl px-5 py-3.5 flex items-center gap-3.5 flex-wrap transition-all duration-200 hover:border-white/[0.12] ${u.is_at_risk ? "border-red-400/20" : "border-white/[0.06]"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#e8eaf0] font-semibold font-mono">{u.clerk_user_id.slice(0, 20)}...</div>
                    <div className="flex gap-2 mt-1.5 flex-wrap text-[10px]">
                      <span className={u.status === "active" ? "text-emerald-400" : u.status === "trialing" ? "text-amber-400" : "text-red-400"}>{u.status}</span>
                      <span className="text-[#5a5e72]">·</span>
                      <span className="text-[#8b8fa8]">{u.client_count} clients</span>
                      <span className="text-[#5a5e72]">·</span>
                      <span className="text-[#8b8fa8]">{u.campaign_count} campaigns</span>
                      <span className="text-[#5a5e72]">·</span>
                      <span className="text-[#8b8fa8]">{fmt$(Number(u.total_spend))} spend</span>
                      <span className="text-[#5a5e72]">·</span>
                      <span className="text-[#8b8fa8]">{u.action_count} actions</span>
                    </div>
                    {u.risks.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {u.risks.map(r => (
                          <span key={r} className="text-[10px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded px-2 py-0.5">
                            {RISK_LABELS[r] ?? r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-[#5a5e72] whitespace-nowrap">
                    {new Date(u.subscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <button
                    onClick={() => { setOutreachId(u.clerk_user_id); setOutreachMsg(""); }}
                    className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap hover:bg-amber-500/20 transition-all duration-200"
                  >
                    Message
                  </button>
                </div>
              ))}
              {(tab === "alerts" ? users.filter(u => u.is_at_risk) : users).length === 0 && (
                <div className="text-[#5a5e72] text-sm py-6 text-center">
                  {tab === "alerts" ? "No at-risk users right now" : "No users found"}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Tickets Tab ── */}
        {tab === "tickets" && (
          <div className="flex flex-col gap-2">
            {tickets.length === 0 ? (
              <div className="text-[#5a5e72] text-sm py-6 text-center">No open tickets</div>
            ) : tickets.map(t => (
              <div key={String(t.id)} className="bg-[#13151d] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.12] transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-sm font-bold text-[#e8eaf0]">{String(t.subject)}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 rounded px-2 py-0.5">{String(t.category)}</span>
                  <span className="ml-auto text-[11px] text-[#5a5e72]">{new Date(String(t.created_at)).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-[#8b8fa8] mb-1.5">{String(t.user_name)} — {String(t.user_email)}</div>
                <div className="text-xs text-[#8b8fa8] leading-relaxed">{String(t.description).slice(0, 200)}{String(t.description).length > 200 ? "..." : ""}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Feedback Tab ── */}
        {tab === "feedback" && (
          <div className="flex flex-col gap-2">
            {feedback.length === 0 ? (
              <div className="text-[#5a5e72] text-sm py-6 text-center">No open feedback</div>
            ) : feedback.map(f => (
              <div key={String(f.id)} className="bg-[#13151d] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.12] transition-all duration-200">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xs text-[#8b8fa8]">{String(f.user_name)} — {String(f.user_email)}</span>
                  <span className="ml-auto text-[11px] text-[#5a5e72]">{new Date(String(f.created_at)).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-[#e8eaf0] leading-relaxed">{String(f.message)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Content Tab ── */}
        {tab === "content" && <ContentHub />}
      </div>

      {/* ── Outreach Modal ── */}
      {outreachId && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setOutreachId(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#161820] border border-white/[0.06] rounded-2xl p-8 w-[480px] max-w-[90vw]">
            <h3 className="text-base font-bold text-[#e8eaf0] mb-1.5">Send WhatsApp Message</h3>
            <p className="text-xs text-[#8b8fa8] mb-4">Sent as &quot;Mike from Buena Onda&quot; to the user&apos;s WhatsApp number.</p>
            <textarea
              value={outreachMsg}
              onChange={e => setOutreachMsg(e.target.value)}
              placeholder="Hey! Just checking in to see how things are going..."
              rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-[#e8eaf0] outline-none resize-y focus:border-amber-500/40 transition-colors"
            />
            <div className="flex gap-2 mt-3.5">
              <button
                onClick={sendOutreach}
                disabled={sendingOutreach || !outreachMsg.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 ${
                  outreachMsg.trim()
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] hover:brightness-110"
                    : "bg-white/5 text-[#5a5e72] cursor-not-allowed"
                }`}
              >
                {sendingOutreach ? "Sending..." : "Send via WhatsApp"}
              </button>
              <button
                onClick={() => setOutreachId(null)}
                className="bg-transparent border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-[#8b8fa8] cursor-pointer hover:bg-white/5 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-[#8b8fa8] uppercase tracking-wider mb-2.5">
      {children}
    </div>
  );
}
