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
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
};

const BASE_URL = "https://buenaonda.ai";

export default function AffiliatesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const referralLink = affiliateCode ? `${BASE_URL}/?ref=${affiliateCode}` : "";

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
        // If already exists, just retrieve their code
        if (res.status === 409) {
          const lookupRes = await fetch(`/api/affiliates?email=${encodeURIComponent(email.trim())}`);
          const lookupData = await lookupRes.json();
          if (lookupData.affiliate_code) { setAffiliateCode(lookupData.affiliate_code); return; }
        }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setAffiliateCode(data.affiliate_code);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    fontSize: 13,
    padding: "11px 14px",
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text }}>

      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Buena Onda
          </span>
        </a>
        <a href="/affiliates/portal" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>Already an affiliate? View your stats →</a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", padding: "5px 14px", background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            Affiliate Program
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
            Share your link.<br />
            <span style={{ color: T.accent }}>Earn 20% forever.</span>
          </h1>
          <p style={{ fontSize: 15, color: T.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Every time someone signs up through your link, you earn 20% of their subscription — every single month they stay.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 56 }}>
          {[
            { label: "Commission", value: "20%", sub: "recurring every month" },
            { label: "Cookie", value: "90 days", sub: "from first click" },
            { label: "Payout", value: "Monthly", sub: "direct to your bank" },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "22px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.accent, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Earnings example */}
        <div style={{ background: T.surface, border: `1px solid rgba(245,166,35,0.15)`, borderRadius: 12, padding: "24px 28px", marginBottom: 56 }}>
          <div style={{ fontSize: 10, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>What you could earn</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { refs: "5 referrals", monthly: "$197/mo", annual: "$2,364/yr" },
              { refs: "10 referrals", monthly: "$394/mo", annual: "$4,728/yr" },
              { refs: "25 referrals", monthly: "$985/mo", annual: "$11,820/yr" },
            ].map(e => (
              <div key={e.refs}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{e.refs} on Growth plan</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.healthy }}>{e.monthly}</div>
                <div style={{ fontSize: 11, color: T.faint }}>{e.annual}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Get your link — the main CTA */}
        <div style={{ maxWidth: 520, margin: "0 auto" }}>

          {!affiliateCode ? (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6, textAlign: "center" }}>Get your referral link</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 24, textAlign: "center" }}>No application. Instant link.</div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <input
                    style={inputStyle}
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="Your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div style={{ fontSize: 12, color: "#ff4d4d", marginBottom: 12 }}>{error}</div>}

                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !email.trim()}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    borderRadius: 8,
                    border: `1px solid rgba(245,166,35,0.4)`,
                    background: (submitting || !name.trim() || !email.trim()) ? "rgba(255,255,255,0.03)" : T.accentBg,
                    color: (submitting || !name.trim() || !email.trim()) ? T.faint : T.accent,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: (submitting || !name.trim() || !email.trim()) ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {submitting ? "Creating your link..." : "Get My Referral Link →"}
                </button>
              </form>
            </div>

          ) : (

            <div style={{ background: T.surface, border: `1px solid rgba(46,204,113,0.2)`, borderRadius: 14, padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.healthy, marginBottom: 4 }}>You're in, {name.split(" ")[0]}!</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>Share this link. Earn 20% every month someone stays.</div>

              {/* Link display */}
              <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13, color: T.accent, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid rgba(245,166,35,0.3)`, background: T.accentBg, color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                >
                  Copy
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use Buena Onda to manage Meta ads with AI. Get started: ${referralLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                >
                  Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                >
                  Share on LinkedIn
                </a>
              </div>

              <a href="/affiliates/portal" style={{ fontSize: 12, color: T.accent, textDecoration: "none" }}>
                View your stats →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 28, borderTop: `1px solid ${T.border}`, textAlign: "center", fontSize: 12, color: T.faint }}>
          Questions? <a href="mailto:mike@buenaonda.ai" style={{ color: T.accent, textDecoration: "none" }}>mike@buenaonda.ai</a>
          <span style={{ margin: "0 12px" }}>·</span>
          <a href="/" style={{ color: T.faint, textDecoration: "none" }}>← Back to Buena Onda</a>
        </div>
      </div>
    </div>
  );
}
