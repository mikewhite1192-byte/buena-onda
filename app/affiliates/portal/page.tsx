"use client";

// app/affiliates/portal/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  warning: "#f5a623",
  critical: "#ff4d4d",
};

interface Referral {
  referred_email: string | null;
  status: string;
  created_at: string;
}

interface PortalData {
  affiliate_code: string;
  name: string;
  member_since: string;
  referral_link: string;
  referrals: Referral[];
  total_referrals: number;
}

function PortalContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [inputEmail, setInputEmail] = useState(searchParams.get("email") ?? "");
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function lookup(lookupEmail: string) {
    if (!lookupEmail.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/affiliates/portal?email=${encodeURIComponent(lookupEmail.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Not found. Check your email or sign up below.");
        return;
      }
      setData(json);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup if email in URL
  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail) lookup(urlEmail);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const estimatedMonthly = data ? (data.total_referrals * 197 * 0.2).toFixed(0) : "0";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text }}>

      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 16, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Buena Onda
          </span>
        </a>
        <a href="/affiliates" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>← Affiliate program</a>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", padding: "5px 14px", background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 20, fontSize: 11, color: T.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>
            Affiliate Portal
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Your affiliate stats
          </h1>
          <p style={{ fontSize: 13, color: T.muted }}>Enter your email to view your referrals and link.</p>
        </div>

        {/* Email lookup */}
        {!data && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px", marginBottom: 24 }}>
            <form onSubmit={e => { e.preventDefault(); setEmail(inputEmail); lookup(inputEmail); }} style={{ display: "flex", gap: 10 }}>
              <input
                type="email"
                value={inputEmail}
                onChange={e => setInputEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ flex: 1, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: "11px 14px", fontFamily: "inherit", outline: "none" }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ padding: "11px 20px", borderRadius: 8, border: `1px solid rgba(245,166,35,0.4)`, background: T.accentBg, color: T.accent, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {loading ? "..." : "View stats →"}
              </button>
            </form>
            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: T.critical }}>
                {error}{" "}
                {error.includes("sign up") && (
                  <a href="/affiliates" style={{ color: T.accent, textDecoration: "none" }}>Get your link →</a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Portal dashboard */}
        {data && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>Hey, {data.name.split(" ")[0]} 👋</div>
              <div style={{ fontSize: 12, color: T.faint }}>Member since {new Date(data.member_since).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total referrals", value: data.total_referrals.toString(), color: T.accent },
                { label: "Est. monthly", value: `$${estimatedMonthly}`, color: T.healthy },
                { label: "Commission", value: "20%", color: T.text },
              ].map(s => (
                <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Referral link */}
            <div style={{ background: T.surface, border: `1px solid rgba(245,166,35,0.15)`, borderRadius: 12, padding: "20px 22px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Your referral link</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13, color: T.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {data.referral_link}
                </span>
                <button
                  onClick={copyLink}
                  style={{ padding: "7px 16px", borderRadius: 6, border: `1px solid rgba(245,166,35,0.3)`, background: copied ? "rgba(46,204,113,0.12)" : T.accentBg, color: copied ? T.healthy : T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "all 0.2s" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Referral list */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Referrals ({data.total_referrals})
              </div>
              {data.referrals.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", fontSize: 13, color: T.faint }}>
                  No referrals yet — share your link to start earning.
                </div>
              ) : (
                data.referrals.map((r, i) => (
                  <div key={i} style={{ padding: "14px 20px", borderBottom: i < data.referrals.length - 1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.text }}>
                        {r.referred_email ? r.referred_email.replace(/(.{2}).*(@.*)/, "$1•••$2") : "Anonymous"}
                      </div>
                      <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: r.status === "signed_up" ? "rgba(46,204,113,0.12)" : T.accentBg, color: r.status === "signed_up" ? T.healthy : T.accent }}>
                      {r.status}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={() => { setData(null); setEmail(""); setInputEmail(""); }}
                style={{ fontSize: 12, color: T.faint, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Look up a different email
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: "center", fontSize: 12, color: T.faint }}>
          Questions? <a href="mailto:hello@buenaonda.ai" style={{ color: T.accent, textDecoration: "none" }}>hello@buenaonda.ai</a>
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense>
      <PortalContent />
    </Suspense>
  );
}
