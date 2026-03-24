"use client";

import { useEffect, useState } from "react";
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
  blue: "#4285f4",
  blueBg: "rgba(66,133,244,0.12)",
};

export default function SettingsPage() {
  const searchParams = useSearchParams();

  // WhatsApp state
  const [whatsapp, setWhatsapp] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Google Ads state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleLastSynced, setGoogleLastSynced] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleStatus, setGoogleStatus] = useState<"" | "connected" | "error">("");
  const [savingCustomerId, setSavingCustomerId] = useState(false);
  const [customerIdSaved, setCustomerIdSaved] = useState(false);

  useEffect(() => {
    // Load WhatsApp number
    fetch("/api/account/whatsapp")
      .then(r => r.json())
      .then(d => { if (d.whatsapp_number) setWhatsapp(d.whatsapp_number); })
      .finally(() => setLoading(false));

    // Load Google Ads connection status
    fetch("/api/google-ads/metrics")
      .then(r => r.json())
      .then(d => {
        setGoogleConnected(d.connected);
        if (d.customer_id) setGoogleCustomerId(d.customer_id);
        if (d.last_synced) setGoogleLastSynced(d.last_synced);
      })
      .finally(() => setGoogleLoading(false));

    // Check for OAuth callback result
    const gads = searchParams.get("google_ads");
    if (gads === "connected") setGoogleStatus("connected");
    if (gads === "error") setGoogleStatus("error");
  }, [searchParams]);

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

  async function saveCustomerId() {
    setSavingCustomerId(true);
    setCustomerIdSaved(false);
    try {
      await fetch("/api/google-ads/customer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: googleCustomerId }),
      });
      setCustomerIdSaved(true);
      setTimeout(() => setCustomerIdSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSavingCustomerId(false);
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

      {/* Google Ads */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Google Ads</span>
          {!googleLoading && googleConnected && (
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: T.healthy, background: T.healthyBg, padding: "3px 10px", borderRadius: 20 }}>
              Connected
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Connect your Google Ads account to sync campaign performance alongside your Meta campaigns.
        </p>

        {googleStatus === "connected" && (
          <p style={{ fontSize: 12, color: T.healthy, background: T.healthyBg, padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            ✓ Google Ads connected successfully. Metrics will sync daily.
          </p>
        )}
        {googleStatus === "error" && (
          <p style={{ fontSize: 12, color: T.error, background: "rgba(231,76,60,0.12)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            Connection failed. Please try again.
          </p>
        )}

        {!googleLoading && googleConnected && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Google Ads Customer ID
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={googleCustomerId}
                onChange={e => { setGoogleCustomerId(e.target.value); setCustomerIdSaved(false); }}
                placeholder="1234567890 (no dashes)"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: T.text,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={saveCustomerId}
                disabled={savingCustomerId}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: customerIdSaved ? T.healthyBg : T.accentBg,
                  color: customerIdSaved ? T.healthy : T.accent,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: savingCustomerId ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {savingCustomerId ? "Saving…" : customerIdSaved ? "✓ Saved" : "Save"}
              </button>
            </div>
            {googleLastSynced && (
              <p style={{ fontSize: 11, color: T.faint, margin: "8px 0 0" }}>
                Last synced: {new Date(googleLastSynced).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <a
          href="/api/google-ads/connect"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: T.blueBg,
            color: T.blue,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          {googleConnected ? "Reconnect Google Ads" : "Connect Google Ads"}
        </a>
      </div>
    </div>
  );
}
