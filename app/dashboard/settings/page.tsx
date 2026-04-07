"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.12)",
  error: "#e74c3c",
};

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();

  // WhatsApp state
  const [whatsapp, setWhatsapp] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Autonomous mode state
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [modeSaved, setModeSaved] = useState(false);

  // Billing state
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  // Slack state
  const [slackStatus, setSlackStatus] = useState<"" | "connected" | "error">("");

  // Branding state
  const [agencyName, setAgencyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f5a623");
  const [customDomain, setCustomDomain] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingAccess, setBrandingAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/account/whatsapp")
      .then(r => r.json())
      .then(d => { if (d.whatsapp_number) setWhatsapp(d.whatsapp_number); })
      .finally(() => setLoading(false));

    fetch("/api/account/autonomous-mode")
      .then(r => r.json())
      .then(d => setAutonomousMode(d.autonomous_mode ?? false));

    fetch("/api/branding")
      .then(r => r.json())
      .then(d => {
        setBrandingAccess(d.hasAccess ?? false);
        if (d.branding) {
          setAgencyName(d.branding.agency_name ?? "");
          setLogoUrl(d.branding.logo_url ?? "");
          setPrimaryColor(d.branding.primary_color ?? "#f5a623");
          setCustomDomain(d.branding.custom_domain ?? "");
        }
      });

    const slack = searchParams.get("slack");
    if (slack === "connected") setSlackStatus("connected");
    if (slack === "error") setSlackStatus("error");
  }, [searchParams]);

  async function saveAutonomousMode(value: boolean) {
    setSavingMode(true);
    setModeSaved(false);
    setAutonomousMode(value);
    try {
      await fetch("/api/account/autonomous-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autonomous_mode: value }),
      });
      setModeSaved(true);
      setTimeout(() => setModeSaved(false), 2000);
    } finally {
      setSavingMode(false);
    }
  }

  async function saveBranding() {
    setSavingBranding(true);
    setBrandingSaved(false);
    try {
      await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: agencyName.trim() || null,
          logo_url: logoUrl.trim() || null,
          primary_color: primaryColor,
          custom_domain: customDomain.trim().toLowerCase() || null,
        }),
      });
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 3000);
    } finally {
      setSavingBranding(false);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setBillingError(data.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      setBillingError("Network error");
    } finally {
      setBillingLoading(false);
    }
  }

  async function saveWhatsapp() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-[680px] mx-auto">
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Settings
      </h1>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 40px" }}>
        Manage your account preferences and integrations.
      </p>

      {/* AI Behavior */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>AI Behavior</span>
          {modeSaved && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: T.healthy, background: T.healthyBg, padding: "3px 10px", borderRadius: 20 }}>✓ Saved</span>}
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Control how the AI handles campaign decisions. With guardrails on, the AI recommends actions and you approve before anything executes. With autonomous mode on, the AI acts immediately — 24/7 with no human needed.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4" style={{ padding: "16px 20px", background: autonomousMode ? "rgba(245,166,35,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${autonomousMode ? "rgba(245,166,35,0.25)" : T.border}`, borderRadius: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3 }}>
              {autonomousMode ? "🟢 Autonomous Mode" : "🔵 Recommendations Mode"}
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              {autonomousMode
                ? "AI executes actions immediately — pauses, scales, and optimizes 24/7 without approval."
                : "AI surfaces recommendations in the Review tab. You approve before anything executes."}
            </div>
          </div>
          <button
            onClick={() => saveAutonomousMode(!autonomousMode)}
            disabled={savingMode}
            style={{
              marginLeft: 20, flexShrink: 0,
              width: 52, height: 28, borderRadius: 14, border: "none", cursor: savingMode ? "not-allowed" : "pointer",
              background: autonomousMode ? T.accent : "rgba(255,255,255,0.1)",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: autonomousMode ? 27 : 3,
              width: 22, height: 22, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: T.faint, margin: 0, lineHeight: 1.6 }}>
          New accounts start in Recommendations Mode. Switch to Autonomous Mode once you&apos;ve reviewed a few AI decisions and trust its judgment.
        </p>
      </div>

      {/* Billing & Subscription */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>💳</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Billing & Subscription</span>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Manage your subscription, update payment methods, view invoices, or change your plan.
        </p>

        {billingError && (
          <p style={{ fontSize: 12, color: T.error, background: "rgba(231,76,60,0.12)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            {billingError}
          </p>
        )}

        <button
          onClick={openBillingPortal}
          disabled={billingLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: T.accentBg,
            color: T.accent,
            fontSize: 13,
            fontWeight: 700,
            cursor: billingLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: billingLoading ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {billingLoading ? "Opening…" : "Manage Billing →"}
        </button>

        <p style={{ fontSize: 11, color: T.faint, margin: "10px 0 0", lineHeight: 1.6 }}>
          Opens the Stripe customer portal where you can update your card, switch plans, download invoices, or cancel.
        </p>
      </div>

      {/* WhatsApp */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>WhatsApp Alerts</span>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Get notified on WhatsApp when the agent takes action on your campaigns. You can also message the AI directly to check performance, ask questions, or give instructions.
        </p>

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Your WhatsApp Number
        </label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-[10px]">
          <input
            type="tel"
            value={loading ? "" : whatsapp}
            onChange={e => { setWhatsapp(e.target.value); setSaved(false); }}
            placeholder="15862378743 (include country code, no +)"
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? T.error : T.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: T.text,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={saveWhatsapp}
            disabled={saving || loading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: saved ? T.healthyBg : T.accentBg,
              color: saved ? T.healthy : T.accent,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: T.error, margin: "8px 0 0" }}>{error}</p>}
        <p style={{ fontSize: 11, color: T.faint, margin: "10px 0 0", lineHeight: 1.6 }}>
          Enter your full number with country code, no + or spaces (e.g. 15862378743 for US). Your number must be registered on WhatsApp.
        </p>
      </div>

      {/* White-label Branding */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20, position: "relative" }}>
        {/* Locked overlay for non-subscribers */}
        {brandingAccess === false && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(13,15,20,0.85)",
            borderRadius: 12,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12, backdropFilter: "blur(2px)",
          }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>$197/mo Plan Required</div>
            <div style={{ fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
              White-label branding is available on the Growth plan. Upgrade to brand the client portal with your agency.
            </div>
            <a href="/pricing" style={{ marginTop: 4, padding: "9px 22px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              Upgrade →
            </a>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🎨</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>White-label Branding</span>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
          Brand the client portal with your agency&apos;s name, logo, and colors. Clients will see your brand instead of Buena Onda.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Agency name */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Your Agency"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>

          {/* Logo URL */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://youragency.com/logo.png"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
            />
            <p style={{ fontSize: 11, color: T.faint, margin: "6px 0 0" }}>Direct URL to your logo image (PNG or SVG recommended). Shown in the client portal header.</p>
          </div>

          {/* Primary color */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Primary Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: 44, height: 36, border: `1px solid ${T.border}`, borderRadius: 7, cursor: "pointer", background: "transparent", padding: 2 }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                placeholder="#f5a623"
                style={{ width: 110, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none" }}
              />
              <div style={{ width: 36, height: 36, borderRadius: 8, background: primaryColor, border: `1px solid ${T.border}` }} />
            </div>
          </div>

          {/* Custom domain */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Custom Portal Domain</label>
            <input
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value.toLowerCase().trim())}
              placeholder="portal.youragency.com"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
            />

            {/* DNS instructions — shown when domain is entered */}
            {customDomain.trim() && (
              <div style={{ marginTop: 12, padding: "14px 16px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>DNS Setup Instructions</div>
                <p style={{ fontSize: 12, color: T.muted, margin: "0 0 10px", lineHeight: 1.6 }}>
                  Add this CNAME record in your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.):
                </p>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, overflowX: "auto" }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span><span style={{ color: T.faint }}>Type:</span> <span style={{ color: T.text }}>CNAME</span></span>
                    <span><span style={{ color: T.faint }}>Name:</span> <span style={{ color: T.accent }}>{customDomain.split(".")[0]}</span></span>
                    <span><span style={{ color: T.faint }}>Value:</span> <span style={{ color: T.accent }}>buenaonda.ai</span></span>
                    <span><span style={{ color: T.faint }}>TTL:</span> <span style={{ color: T.text }}>Auto</span></span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: T.faint, margin: "10px 0 0", lineHeight: 1.6 }}>
                  After saving, click <strong style={{ color: T.muted }}>Save Branding</strong> below. We&apos;ll activate your domain within 24 hours and send you a confirmation.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={saveBranding}
            disabled={savingBranding}
            style={{
              alignSelf: "flex-start",
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: brandingSaved ? T.healthyBg : T.accentBg,
              color: brandingSaved ? T.healthy : T.accent,
              fontSize: 13,
              fontWeight: 700,
              cursor: savingBranding ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: savingBranding ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {savingBranding ? "Saving…" : brandingSaved ? "✓ Saved" : "Save Branding"}
          </button>

          {brandingSaved && customDomain.trim() && (
            <div style={{ padding: "10px 14px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 8, fontSize: 12, color: T.healthy, lineHeight: 1.6 }}>
              ✓ Branding saved. Your custom domain request has been received — we&apos;ll activate <strong>{customDomain}</strong> within 24 hours.
            </div>
          )}
        </div>
      </div>

      {/* Slack */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Slack</span>
          {slackStatus === "connected" && (
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: T.healthy, background: T.healthyBg, padding: "3px 10px", borderRadius: 20 }}>
              Connected
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Get agent alerts, weekly reports, and performance summaries delivered directly to your Slack workspace.
        </p>

        {slackStatus === "connected" && (
          <p style={{ fontSize: 12, color: T.healthy, background: T.healthyBg, padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            ✓ Slack connected successfully.
          </p>
        )}
        {slackStatus === "error" && (
          <p style={{ fontSize: 12, color: T.error, background: "rgba(231,76,60,0.12)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            Connection failed. Please try again.
          </p>
        )}

        <a
          href="/api/slack/connect"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "rgba(74,21,75,0.3)",
            color: "#e879f9",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          {slackStatus === "connected" ? "Reconnect Slack" : "Connect Slack"}
        </a>
      </div>
    </div>
  );
}
