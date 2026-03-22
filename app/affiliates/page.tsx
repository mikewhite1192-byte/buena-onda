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

export default function AffiliatesPage() {
  const [form, setForm] = useState({ name: "", email: "", website: "", audience_size: "", promotion_plan: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.promotion_plan) {
      setError("Name, email, and promotion plan are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    fontSize: 13,
    padding: "10px 12px",
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: T.faint,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 6,
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
        <a href="/sign-in" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>Sign in →</a>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", padding: "5px 14px", background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>
            Affiliate Program
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
            Earn 20% every month.<br />
            <span style={{ color: T.accent }}>Forever.</span>
          </h1>
          <p style={{ fontSize: 16, color: T.muted, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Refer agencies and media buyers to Buena Onda. Earn 20% recurring commission on every subscription — as long as they stay.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 64 }}>
          {[
            { label: "Commission", value: "20%", sub: "of every subscription" },
            { label: "Cookie Duration", value: "90 days", sub: "from first click" },
            { label: "Payout", value: "Monthly", sub: "via Stripe or PayPal" },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.accent, letterSpacing: "-1px", marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 28, letterSpacing: "-0.5px" }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { step: "01", title: "Apply below", body: "Tell us about your audience and how you plan to promote Buena Onda. We approve within 48 hours." },
              { step: "02", title: "Share your link", body: "Get a unique referral link and discount code. Share it with your audience, newsletter, or clients." },
              { step: "03", title: "Get paid", body: "Earn 20% recurring every month for each paying customer you refer. No cap. No expiry." },
            ].map(s => (
              <div key={s.step} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px" }}>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: 12 }}>{s.step}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings example */}
        <div style={{ background: T.surface, border: `1px solid rgba(245,166,35,0.2)`, borderRadius: 12, padding: "28px 32px", marginBottom: 64 }}>
          <div style={{ fontSize: 11, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Earnings example</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { refs: "5 referrals", plan: "Growth ($197/mo)", monthly: "$197/mo", annual: "$2,364/yr" },
              { refs: "10 referrals", plan: "Growth ($197/mo)", monthly: "$394/mo", annual: "$4,728/yr" },
              { refs: "20 referrals", plan: "Mixed plans avg $250", monthly: "$1,000/mo", annual: "$12,000/yr" },
            ].map(e => (
              <div key={e.refs}>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>{e.refs} · {e.plan}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.healthy, marginBottom: 2 }}>{e.monthly}</div>
                <div style={{ fontSize: 11, color: T.faint }}>{e.annual}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Application form */}
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 8, letterSpacing: "-0.5px", textAlign: "center" }}>Apply to become an affiliate</h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 32, textAlign: "center" }}>We review every application manually. You'll hear back within 48 hours.</p>

          {submitted ? (
            <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 12, padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.healthy, marginBottom: 8 }}>Application received!</div>
              <div style={{ fontSize: 13, color: T.muted }}>Check your email for confirmation. We'll review your application and get back to you within 48 hours.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Website / Social</label>
                  <input style={inputStyle} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="yoursite.com or @handle" />
                </div>
                <div>
                  <label style={labelStyle}>Audience Size</label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.audience_size}
                    onChange={e => setForm({ ...form, audience_size: e.target.value })}
                  >
                    <option value="">Select range</option>
                    <option value="under_1k">Under 1,000</option>
                    <option value="1k_10k">1,000 – 10,000</option>
                    <option value="10k_50k">10,000 – 50,000</option>
                    <option value="50k_plus">50,000+</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>How will you promote Buena Onda? *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={form.promotion_plan}
                  onChange={e => setForm({ ...form, promotion_plan: e.target.value })}
                  placeholder="e.g. newsletter to 5k agency owners, YouTube channel about Meta ads, Facebook group for media buyers..."
                />
              </div>

              {error && <div style={{ fontSize: 12, color: "#ff4d4d", marginBottom: 16 }}>{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 8,
                  border: `1px solid rgba(245,166,35,0.4)`,
                  background: submitting ? "rgba(255,255,255,0.03)" : T.accentBg,
                  color: submitting ? T.faint : T.accent,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Submitting..." : "Apply Now →"}
              </button>

              <p style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 14 }}>
                No spam. We'll only email you about your application and affiliate updates.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 80, paddingTop: 32, borderTop: `1px solid ${T.border}`, textAlign: "center", fontSize: 12, color: T.faint }}>
          Questions? Email <a href="mailto:mike@buenaonda.ai" style={{ color: T.accent, textDecoration: "none" }}>mike@buenaonda.ai</a>
          <span style={{ margin: "0 12px" }}>·</span>
          <a href="/" style={{ color: T.faint, textDecoration: "none" }}>← Back to Buena Onda</a>
        </div>
      </div>
    </div>
  );
}
