"use client";

// app/affiliates/dashboard/page.tsx
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const T = {
  bg: "#0d0f14",
  card: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.1)",
  accentBorder: "rgba(245,166,35,0.25)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.1)",
};

const MILESTONES: { target: number; reward: string; emoji: string }[] = [
  { target: 1,  reward: "Personal welcome video from the founders", emoji: "🎯" },
  { target: 3,  reward: "Your account is free — as long as you maintain 3 active clients", emoji: "🎁" },
  { target: 10, reward: "Personal strategy call + featured partner", emoji: "⭐" },
];

interface DashboardData {
  name: string;
  affiliate_code: string;
  referral_link: string;
  member_since: string;
  stripe_onboarded: boolean;
  stripe_account_id: string | null;
  is_free_account: boolean;
  total_clicks: number;
  milestones_reached: string[];
  stats: {
    total_referrals: number;
    active_referrals: number;
    monthly_total: number;
    monthly_recurring: number;
    month1_bonus: number;
    lifetime_paid: number;
    pending_payout: number;
  };
  milestones: { target: number; reached: boolean; current_is_next: boolean }[];
  next_milestone: number | null;
  prev_milestone: number;
  referrals: {
    id: string;
    email: string;
    status: string;
    plan: string;
    plan_amount: number;
    joined: string;
  }[];
  payouts: {
    amount: number;
    status: string;
    period_start: string;
    period_end: string;
    paid_at: string | null;
  }[];
}

function DashboardInner() {
  const params = useSearchParams();
  const connectStatus = params.get("connect");
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [sentLink, setSentLink] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(
    errorParam === "expired" ? "Your login link expired. Request a new one below." :
    errorParam === "used" ? "That login link has already been used. Request a new one." :
    errorParam === "invalid" ? "Invalid login link. Request a new one below." : ""
  );
  const [copied, setCopied] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMsg, setConnectMsg] = useState(
    connectStatus === "success" ? "Bank account connected! Payouts are now enabled." : ""
  );

  const fetchDashboard = useCallback(async (em: string) => {
    if (!em) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/affiliates/dashboard?email=${encodeURIComponent(em)}`);
      if (!res.ok) {
        const j = await res.json();
        setError(j.error || "Not found.");
        setData(null);
      } else {
        const d = await res.json();
        setData(d);
        if (connectStatus === "success" && !d.stripe_onboarded) {
          await fetch("/api/affiliates/connect/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: em }),
          });
          const res2 = await fetch(`/api/affiliates/dashboard?email=${encodeURIComponent(em)}`);
          if (res2.ok) setData(await res2.json());
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [connectStatus]);

  // On mount: check cookie for logged-in email
  useEffect(() => {
    fetch("/api/affiliates/login/me")
      .then(r => r.json())
      .then(d => {
        if (d.email) {
          setEmail(d.email);
          fetchDashboard(d.email);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [fetchDashboard]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    setSendingLink(true);
    setError("");
    try {
      await fetch("/api/affiliates/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail.trim() }),
      });
      setSentLink(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSendingLink(false);
    }
  }

  async function logout() {
    await fetch("/api/affiliates/login/me", { method: "DELETE" });
    setData(null);
    setEmail("");
    setSentLink(false);
  }

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleConnect() {
    if (!email || !data) return;
    setConnectLoading(true);
    try {
      const res = await fetch("/api/affiliates/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json();
      if (j.already_connected) {
        setConnectMsg("Your bank account is already connected.");
      } else if (j.url) {
        window.location.href = j.url;
      }
    } catch {
      setConnectMsg("Failed to start setup. Please try again.");
    } finally {
      setConnectLoading(false);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
      <style>{`
        .aff-nav { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
        .aff-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .aff-earnings-row { display: flex; justify-content: space-between; font-size: 13px; }
        .aff-payout-banner { background: linear-gradient(135deg, rgba(245,166,35,0.12), rgba(247,107,28,0.08)); border: 1px solid rgba(245,166,35,0.25); border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        @media (max-width: 640px) {
          .aff-nav { padding: 14px 16px; }
          .aff-earnings-row { flex-direction: column; gap: 2px; }
          .aff-earnings-row span:last-child { font-size: 14px; }
          .aff-payout-banner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
      {/* Nav */}
      <div className="aff-nav">
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 15, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Buena Onda
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/affiliates" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>← Affiliate program</Link>
          {email && (
            <button onClick={logout} style={{ fontSize: 12, color: T.faint, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Affiliate Dashboard</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 32px" }}>Track your referrals, earnings, and milestones.</p>

        {/* Magic link login if not authenticated */}
        {!email && !loading && (
          <div style={{ maxWidth: 440, marginBottom: 32 }}>
            {sentLink ? (
              <div style={{ background: T.greenBg, border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.green, marginBottom: 6 }}>Check your email</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                  We sent a login link to <strong style={{ color: T.text }}>{inputEmail}</strong>. It expires in 30 minutes.
                </div>
                <button onClick={() => setSentLink(false)} style={{ marginTop: 14, background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                  Use a different email →
                </button>
              </div>
            ) : (
              <form onSubmit={requestLink}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>Sign in to your dashboard</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>We'll email you a secure login link — no password needed.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={e => setInputEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                  <button type="submit" disabled={sendingLink || !inputEmail.trim()}
                    style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", borderRadius: 8, padding: "11px 20px", color: "#0d0f14", fontWeight: 700, fontSize: 13, cursor: sendingLink ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sendingLink ? 0.7 : 1, whiteSpace: "nowrap" }}>
                    {sendingLink ? "Sending…" : "Send Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {loading && (
          <div style={{ color: T.muted, fontSize: 13 }}>Loading your dashboard…</div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {connectMsg && (
          <div style={{ background: T.greenBg, border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 10, padding: "14px 18px", color: T.green, fontSize: 13, marginBottom: 24 }}>
            {connectMsg}
          </div>
        )}

        {data && (
          <>
            {/* Welcome + referral link */}
            <div style={{ background: T.card, border: `1px solid ${T.accentBorder}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Welcome back, {data.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 11, color: T.faint }}>Member since {fmtDate(data.member_since)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Affiliate code</div>
                  <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>{data.affiliate_code}</div>
                </div>
              </div>

              {/* Referral link */}
              <div style={{ marginTop: 16, background: "#0d0f14", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, color: T.accent, fontWeight: 600, wordBreak: "break-all" }}>{data.referral_link}</div>
                <button
                  onClick={copyLink}
                  style={{ background: copied ? T.greenBg : T.accentBg, border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : T.accentBorder}`, borderRadius: 7, padding: "8px 14px", color: copied ? T.green : T.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* Share shortcuts */}
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Share on Twitter/X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've been using Buena Onda AI to manage Meta Ads for my clients — it's incredible. Try it free: ${data.referral_link}`)}` },
                  { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referral_link)}` },
                  { label: "Share via Email", href: `mailto:?subject=${encodeURIComponent("AI that manages your Meta Ads automatically")}&body=${encodeURIComponent(`Check out Buena Onda: ${data.referral_link}`)}` },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: T.muted, textDecoration: "none", background: "#0d0f14", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px" }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Next payout banner */}
            {data.stats.monthly_total > 0 && (
              <div className="aff-payout-banner">
                <div>
                  <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Next Payout</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: "-1px" }}>{fmt(data.stats.monthly_total)}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                    {data.stats.active_referrals} active client{data.stats.active_referrals !== 1 ? "s" : ""} · pays out 1st of next month
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: T.faint, marginBottom: 4 }}>Lifetime earned</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{fmt(data.stats.lifetime_paid)}</div>
                  {data.stats.pending_payout > 0 && (
                    <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>{fmt(data.stats.pending_payout)} pending</div>
                  )}
                </div>
              </div>
            )}

            {/* Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Active Clients", value: data.stats.active_referrals, highlight: true },
                { label: "Total Referrals", value: data.stats.total_referrals },
                { label: "Monthly Earnings", value: fmt(data.stats.monthly_total), highlight: data.stats.monthly_total > 0 },
                { label: "Lifetime Paid", value: fmt(data.stats.lifetime_paid) },
                { label: "Pending Payout", value: fmt(data.stats.pending_payout) },
                { label: "Link Clicks", value: data.total_clicks },
              ].map((s) => (
                <div key={s.label} style={{ background: T.card, border: `1px solid ${s.highlight ? T.accentBorder : T.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.highlight ? T.accent : T.text }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Earnings breakdown */}
            {data.stats.active_referrals > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 14 }}>Earnings Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="aff-earnings-row">
                    <span style={{ color: T.muted }}>Recurring (40% × {data.stats.active_referrals} active clients)</span>
                    <span style={{ color: T.text, fontWeight: 700 }}>{fmt(data.stats.monthly_recurring)}/mo</span>
                  </div>
                  {data.stats.month1_bonus > 0 && (
                    <div className="aff-earnings-row">
                      <span style={{ color: T.muted }}>Month 1 bonus (extra 10% for new signups)</span>
                      <span style={{ color: T.accent, fontWeight: 700 }}>+{fmt(data.stats.month1_bonus)}</span>
                    </div>
                  )}
                  <div className="aff-earnings-row" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, fontSize: 14 }}>
                    <span style={{ color: T.text, fontWeight: 700 }}>This month total</span>
                    <span style={{ color: T.accent, fontWeight: 800 }}>{fmt(data.stats.monthly_total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stripe Connect */}
            <div style={{ background: T.card, border: `1px solid ${data.stripe_onboarded ? "rgba(34,197,94,0.25)" : T.accentBorder}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                    {data.stripe_onboarded ? "✓ Payouts connected" : "Connect bank account for payouts"}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    {data.stripe_onboarded
                      ? "Your bank account is linked. Payouts are sent monthly via Stripe."
                      : "Connect your bank account to receive monthly commission payouts via Stripe."}
                  </div>
                </div>
                {!data.stripe_onboarded && (
                  <button
                    onClick={handleConnect}
                    disabled={connectLoading}
                    style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", borderRadius: 8, padding: "11px 20px", color: "#0d0f14", fontWeight: 700, fontSize: 13, cursor: connectLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: connectLoading ? 0.7 : 1, whiteSpace: "nowrap" }}
                  >
                    {connectLoading ? "Setting up…" : "Connect via Stripe →"}
                  </button>
                )}
                {data.stripe_onboarded && (
                  <div style={{ background: T.greenBg, border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "8px 14px", color: T.green, fontSize: 12, fontWeight: 700 }}>
                    Connected
                  </div>
                )}
              </div>
            </div>

            {/* Milestone tracker */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Milestone Tracker</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>
                {data.stats.total_referrals} referral{data.stats.total_referrals !== 1 ? "s" : ""} so far
                {data.next_milestone ? ` · ${data.next_milestone - data.stats.total_referrals} more to unlock next milestone` : " · All milestones unlocked!"}
              </div>

              {/* Progress bar */}
              {data.next_milestone && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.faint, marginBottom: 6 }}>
                    <span>{data.prev_milestone} referrals</span>
                    <span>{data.next_milestone} referrals</span>
                  </div>
                  <div style={{ height: 6, background: "#1e2130", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 4,
                      background: "linear-gradient(90deg,#f5a623,#f76b1c)",
                      width: `${Math.min(100, ((data.stats.total_referrals - data.prev_milestone) / (data.next_milestone - data.prev_milestone)) * 100)}%`,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MILESTONES.map((m) => {
                  const reached = data.stats.total_referrals >= m.target;
                  const isNext = m.target === data.next_milestone;
                  return (
                    <div
                      key={m.target}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        background: reached ? "rgba(34,197,94,0.06)" : isNext ? T.accentBg : "#0d0f14",
                        border: `1px solid ${reached ? "rgba(34,197,94,0.2)" : isNext ? T.accentBorder : T.border}`,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{reached ? "✓" : m.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: reached ? T.green : isNext ? T.accent : T.muted }}>
                          {m.target} referral{m.target !== 1 ? "s" : ""} — {m.reward}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: reached ? T.green : isNext ? T.accent : T.faint, whiteSpace: "nowrap" }}>
                        {reached ? "Unlocked" : isNext ? "Next goal" : `${m.target - data.stats.total_referrals} away`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payouts */}
            {data.payouts.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Payout History</div>
                <div className="aff-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 400 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Period", "Amount", "Status", "Paid"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0 0 10px", color: T.faint, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 0", color: T.muted }}>
                          {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                        </td>
                        <td style={{ padding: "10px 0", color: T.text, fontWeight: 700 }}>{fmt(Number(p.amount))}</td>
                        <td style={{ padding: "10px 0" }}>
                          <span style={{
                            background: p.status === "paid" ? T.greenBg : T.accentBg,
                            color: p.status === "paid" ? T.green : T.accent,
                            border: `1px solid ${p.status === "paid" ? "rgba(34,197,94,0.25)" : T.accentBorder}`,
                            borderRadius: 5, padding: "3px 8px", fontSize: 10, fontWeight: 700,
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 0", color: T.faint }}>{p.paid_at ? fmtDate(p.paid_at) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* Referrals list */}
            {data.referrals.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Your Referrals</div>
                <div className="aff-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 380 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Email", "Plan", "Status", "Joined"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0 0 10px", color: T.faint, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 0", color: T.muted }}>{r.email}</td>
                        <td style={{ padding: "10px 0", color: T.text, textTransform: "capitalize" }}>{r.plan}</td>
                        <td style={{ padding: "10px 0" }}>
                          <span style={{
                            background: r.status === "active" ? T.greenBg : T.accentBg,
                            color: r.status === "active" ? T.green : T.accent,
                            border: `1px solid ${r.status === "active" ? "rgba(34,197,94,0.25)" : T.accentBorder}`,
                            borderRadius: 5, padding: "3px 8px", fontSize: 10, fontWeight: 700,
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 0", color: T.faint }}>{fmtDate(r.joined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {data.referrals.length === 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px 24px", textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🚀</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>No referrals yet — let's change that</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Share your link and start earning 50% month 1, then 40% every month after.</div>
                <button
                  onClick={copyLink}
                  style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", borderRadius: 8, padding: "11px 24px", color: "#0d0f14", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {copied ? "Copied!" : "Copy referral link →"}
                </button>
              </div>
            )}

            {/* Not you? */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                onClick={() => { setData(null); setEmail(""); setInputEmail(""); setError(""); }}
                style={{ background: "transparent", border: "none", color: T.faint, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              >
                Not you? Look up a different email
              </button>
            </div>
          </>
        )}

        {/* Not signed up yet */}
        {!loading && !data && email && !error && (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 13, color: T.muted }}>Loading…</div>
          </div>
        )}

        {!email && !loading && (
          <div style={{ marginTop: 40, padding: "32px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: T.muted, marginBottom: 16 }}>Not an affiliate yet?</div>
            <Link
              href="/affiliates"
              style={{ display: "inline-block", background: "linear-gradient(135deg,#f5a623,#f76b1c)", borderRadius: 8, padding: "11px 24px", color: "#0d0f14", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
            >
              Join the affiliate program →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f14", color: "#8b8fa8", fontFamily: "monospace", fontSize: 13 }}>
        Loading…
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
