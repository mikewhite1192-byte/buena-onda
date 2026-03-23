"use client";

// app/affiliates/page.tsx
import { useState } from "react";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentBorder: "rgba(245,166,35,0.3)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.1)",
};

const BASE_URL = "https://buenaonda.ai";

const MILESTONES = [
  { count: 1,   icon: "🎯", label: "First referral",          reward: "Personal welcome video from the founders" },
  { count: 3,   icon: "🎁", label: "3 active clients",        reward: "Your account is free forever" },
  { count: 10,  icon: "⭐", label: "10 active clients",       reward: "Personal strategy call + shoutout" },
  { count: 25,  icon: "🚀", label: "25 active clients",       reward: "Co-marketing opportunity" },
  { count: 50,  icon: "💎", label: "50 active clients",       reward: "Revenue share increase" },
  { count: 100, icon: "👑", label: "100 active clients",      reward: "Equity conversation" },
];

const STEPS = [
  { n: "01", title: "Sign up in 30 seconds", body: "Name and email. That's it. You get your unique referral link instantly." },
  { n: "02", title: "Share your link", body: "Post it, email it, add it to your content. Anyone who clicks and signs up is tracked for 90 days." },
  { n: "03", title: "Get paid every month", body: "50% on their first month. 40% every month after — for as long as they're a customer. Deposited directly to your bank." },
];

export default function AffiliatesPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [affiliateName, setAffiliateName] = useState("");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [refs, setRefs]         = useState(5);

  const referralLink = affiliateCode ? `${BASE_URL}/?ref=${affiliateCode}` : "";

  // Earnings calculator (avg Growth plan $197)
  const avgPlan = 197;
  const month1  = Math.round(refs * avgPlan * 0.5);
  const monthly = Math.round(refs * avgPlan * 0.4);
  const annual  = monthly * 12 + month1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.affiliate_code) {
          setAffiliateCode(data.affiliate_code);
          setAffiliateName(name.trim());
          return;
        }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setAffiliateCode(data.affiliate_code);
      setAffiliateName(name.trim());
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    fontSize: 14,
    padding: "13px 16px",
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 17, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Buena Onda
          </span>
        </a>
        <a href="/affiliates/dashboard" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>
          Already an affiliate? View dashboard →
        </a>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-block", padding: "5px 16px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 24 }}>
            Affiliate Program · Early Access
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 62px)", fontWeight: 800, color: T.text, margin: "0 0 20px", letterSpacing: "-2px", lineHeight: 1.1 }}>
            Get paid to grow<br />
            <span style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Buena Onda.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: T.muted, maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.7 }}>
            50% on their first month. 40% every month after — forever.
            Refer 3 clients and your account is free for life.
          </p>
          <p style={{ fontSize: 13, color: T.faint }}>
            Early affiliates are locked in at these rates. No cap. No expiry.
          </p>
        </div>

        {/* Commission + milestone stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 64 }}>
          {[
            { label: "Month 1 commission", value: "50%", sub: "on first payment" },
            { label: "Recurring commission", value: "40%", sub: "every month after" },
            { label: "Free account at", value: "3 refs", sub: "active paying clients" },
            { label: "Cookie window", value: "90 days", sub: "from first click" },
            { label: "Payout cycle", value: "Monthly", sub: "direct to your bank" },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.accent, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column: earnings calc + sign up */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 64, alignItems: "start" }}>

          {/* Earnings calculator */}
          <div style={{ background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 14, padding: "28px 30px" }}>
            <div style={{ fontSize: 10, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Earnings calculator</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.muted }}>Active referrals</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{refs}</span>
              </div>
              <input
                type="range" min={1} max={50} value={refs}
                onChange={e => setRefs(Number(e.target.value))}
                style={{ width: "100%", accentColor: T.accent }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px", background: T.surfaceAlt, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.muted }}>Month 1 bonus (50%)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>${month1.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.muted }}>Monthly recurring (40%)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.healthy }}>${monthly.toLocaleString()}/mo</span>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.muted }}>Year 1 total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>${annual.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: T.faint }}>
              Based on avg Growth plan ($197/mo). Starter and Agency plans also earn commissions.
            </div>
          </div>

          {/* Sign up form or success state */}
          {!affiliateCode ? (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 30px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Get your referral link</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 24 }}>No application. Instant access. Locked-in rates.</div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  style={inputStyle}
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                {error && <div style={{ fontSize: 12, color: "#ff4d4d" }}>{error}</div>}

                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !email.trim()}
                  style={{
                    padding: "14px 0",
                    borderRadius: 8,
                    border: "none",
                    background: (submitting || !name.trim() || !email.trim())
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg,#f5a623,#f76b1c)",
                    color: (submitting || !name.trim() || !email.trim()) ? T.faint : "#0d0f14",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: (submitting || !name.trim() || !email.trim()) ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {submitting ? "Creating your link…" : "Join the affiliate program →"}
                </button>

                <p style={{ fontSize: 11, color: T.faint, textAlign: "center", margin: 0 }}>
                  By joining you agree to our affiliate terms. You'll connect your bank account via Stripe from your dashboard.
                </p>
              </form>
            </div>
          ) : (
            <div style={{ background: T.surface, border: `1px solid rgba(46,204,113,0.25)`, borderRadius: 14, padding: "28px 30px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.healthy, marginBottom: 4, letterSpacing: "-0.5px" }}>
                You&apos;re in, {affiliateName.split(" ")[0]}!
              </div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
                50% on month 1, 40% every month after — locked in for life.
              </div>

              <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                <span style={{ flex: 1, fontSize: 12, color: T.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${T.accentBorder}`, background: copied ? T.healthyBg : T.accentBg, color: copied ? T.healthy : T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "all 0.2s" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use @BuenaOndaAI to manage Meta, Google, and TikTok ads with AI. Try it: ${referralLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                >
                  Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                >
                  Share on LinkedIn
                </a>
              </div>

              <a
                href={`/affiliates/dashboard?email=${encodeURIComponent(email)}`}
                style={{ display: "block", padding: "12px", borderRadius: 8, border: `1px solid ${T.accentBorder}`, background: T.accentBg, color: T.accent, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
              >
                Set up payouts & view dashboard →
              </a>
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 28, textAlign: "center" }}>How it works</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 22px" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.accentBg, letterSpacing: "-1px", marginBottom: 12, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone rewards */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Milestone rewards</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              The more you refer, the better it gets
            </h2>
            <p style={{ fontSize: 13, color: T.muted }}>
              We personally reach out at every milestone. These aren&apos;t automated badges — they&apos;re real rewards.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {MILESTONES.map((m, i) => (
              <div
                key={m.count}
                style={{
                  background: i === 1 ? "rgba(46,204,113,0.06)" : T.surface,
                  border: `1px solid ${i === 1 ? "rgba(46,204,113,0.2)" : T.border}`,
                  borderRadius: 12,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: i === 1 ? T.healthy : T.muted }}>{m.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!affiliateCode && (
          <div style={{ textAlign: "center", padding: "48px 24px", background: T.surface, border: `1px solid ${T.accentBorder}`, borderRadius: 16 }}>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
              Ready to earn?
            </h3>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 28 }}>
              Early affiliates lock in these rates permanently. Join now before we change the structure.
            </p>
            <a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "inline-block", padding: "14px 40px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
              Get your referral link →
            </a>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: "center", fontSize: 12, color: T.faint }}>
          Questions? <a href="mailto:hello@buenaonda.ai" style={{ color: T.accent, textDecoration: "none" }}>hello@buenaonda.ai</a>
          <span style={{ margin: "0 12px" }}>·</span>
          <a href="/" style={{ color: T.faint, textDecoration: "none" }}>← Back to Buena Onda</a>
        </div>
      </div>
    </div>
  );
}
