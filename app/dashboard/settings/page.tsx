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

  // Slack state
  const [slackStatus, setSlackStatus] = useState<"" | "connected" | "error">("");

  // Branding state
  const [agencyName, setAgencyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f5a623");
  const [customDomain, setCustomDomain] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  useEffect(() => {
    fetch("/api/account/whatsapp")
      .then(r => r.json())
      .then(d => { if (d.whatsapp_number) setWhatsapp(d.whatsapp_number); })
      .finally(() => setLoading(false));

    fetch("/api/branding")
      .then(r => r.json())
      .then(d => {
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
    <div style={{ padding: "32px 24px", maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Settings
      </h1>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 40px" }}>
        Manage your account preferences and integrations.
      </p>

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
        <div style={{ display: "flex", gap: 10 }}>
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
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
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
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="portal.youragency.com"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
            />
            <p style={{ fontSize: 11, color: T.faint, margin: "6px 0 0" }}>
              Add a CNAME record pointing <strong style={{ color: T.muted }}>portal.youragency.com</strong> → <strong style={{ color: T.muted }}>buenaonda.ai</strong>, then add the domain in Vercel. Clients will see your domain in the browser.
            </p>
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
