"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  error: "#e74c3c",
};

type Platform = "meta" | "google";

const PLATFORM_OPTIONS: { value: Platform; label: string; icon: string; desc: string }[] = [
  { value: "meta", label: "Meta Ads", icon: "📘", desc: "Facebook & Instagram campaigns" },
  { value: "google", label: "Google Ads", icon: "🔍", desc: "Search, Display, Performance Max" },
];

const CAMPAIGN_TYPES = [
  { value: "SEARCH", label: "Search" },
  { value: "DISPLAY", label: "Display" },
  { value: "PERFORMANCE_MAX", label: "Performance Max" },
  { value: "SHOPPING", label: "Shopping" },
];

const BIDDING_STRATEGIES = [
  { value: "MAXIMIZE_CONVERSIONS", label: "Maximize Conversions" },
  { value: "TARGET_CPA", label: "Target CPA" },
  { value: "TARGET_ROAS", label: "Target ROAS" },
  { value: "MANUAL_CPC", label: "Manual CPC" },
];

const defaultScalingRules = JSON.stringify(
  { increase_budget_if_cpl_below: null, decrease_budget_if_cpl_above: null, pause_if_cpl_above: null, scale_multiplier: 1.2 },
  null, 2
);

export default function NewBriefPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("meta");

  // Meta fields
  const [metaForm, setMetaForm] = useState({
    avatar: "", offer: "", daily_budget: "", cpl_cap: "",
    scaling_rules: defaultScalingRules, frequency_cap: "3",
    creative_asset_ids: "", ad_account_id: "",
  });

  // Google fields
  const [googleForm, setGoogleForm] = useState({
    name: "",
    type: "SEARCH",
    daily_budget: "",
    bidding_strategy: "MAXIMIZE_CONVERSIONS",
    target_cpa: "",
    target_roas: "",
    cpc_bid: "1.00",
    final_url: "",
    headlines: ["", "", ""],
    descriptions: ["", ""],
    keywords: "",
  });

  function setMeta(field: keyof typeof metaForm, value: string) {
    setMetaForm(f => ({ ...f, [field]: value }));
  }

  function setGoogle(field: keyof typeof googleForm, value: string | string[]) {
    setGoogleForm(f => ({ ...f, [field]: value }));
  }

  function setHeadline(i: number, value: string) {
    const h = [...googleForm.headlines];
    h[i] = value;
    setGoogle("headlines", h);
  }

  function setDescription(i: number, value: string) {
    const d = [...googleForm.descriptions];
    d[i] = value;
    setGoogle("descriptions", d);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (platform === "meta") {
        const res = await fetch("/api/briefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...metaForm,
            platform: "meta",
            daily_budget: parseFloat(metaForm.daily_budget),
            cpl_cap: parseFloat(metaForm.cpl_cap),
            frequency_cap: parseInt(metaForm.frequency_cap, 10),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save brief");
      } else {
        // Google Ads — create campaign directly
        const keywords = googleForm.keywords
          .split(/[\n,]+/)
          .map(k => k.trim())
          .filter(Boolean)
          .map(text => ({ text, match_type: "BROAD" as const }));

        const res = await fetch("/api/google-ads/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: googleForm.name,
            type: googleForm.type,
            daily_budget: parseFloat(googleForm.daily_budget),
            bidding_strategy: googleForm.bidding_strategy,
            target_cpa: googleForm.target_cpa ? parseFloat(googleForm.target_cpa) : undefined,
            target_roas: googleForm.target_roas ? parseFloat(googleForm.target_roas) : undefined,
            cpc_bid: parseFloat(googleForm.cpc_bid),
            final_url: googleForm.final_url,
            headlines: googleForm.headlines.filter(Boolean),
            descriptions: googleForm.descriptions.filter(Boolean),
            keywords: googleForm.type === "SEARCH" ? keywords : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
      }

      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        New Campaign
      </h1>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 32px" }}>
        Create a new campaign brief. The AI agent will monitor and optimize it automatically.
      </p>

      {/* Platform Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        {PLATFORM_OPTIONS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPlatform(p.value)}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: 12,
              border: `1px solid ${platform === p.value ? T.accent : T.border}`,
              background: platform === p.value ? T.accentBg : T.surface,
              color: platform === p.value ? T.accent : T.muted,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{p.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── META FIELDS ─────────────────────────────────────────────────── */}
        {platform === "meta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Target Avatar" hint="Who is this ad for? Be specific about demographics, pain points, and desires.">
              <textarea required rows={4} style={inputStyle} value={metaForm.avatar}
                placeholder="e.g. Female business owners 35–55, frustrated with inconsistent lead flow…"
                onChange={e => setMeta("avatar", e.target.value)} />
            </Field>

            <Field label="Offer" hint="What are you promoting? Include the hook, price point, and CTA.">
              <textarea required rows={3} style={inputStyle} value={metaForm.offer}
                placeholder="e.g. Free 30-min strategy call → $3,500 done-for-you Meta Ads package…"
                onChange={e => setMeta("offer", e.target.value)} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Daily Budget ($)" hint="Max spend per day.">
                <input required type="number" min="1" step="0.01" style={inputStyle}
                  placeholder="50.00" value={metaForm.daily_budget}
                  onChange={e => setMeta("daily_budget", e.target.value)} />
              </Field>
              <Field label="CPL Cap ($)" hint="Pause if cost-per-lead exceeds this.">
                <input required type="number" min="0.01" step="0.01" style={inputStyle}
                  placeholder="25.00" value={metaForm.cpl_cap}
                  onChange={e => setMeta("cpl_cap", e.target.value)} />
              </Field>
            </div>

            <Field label="Frequency Cap" hint="Flag creative fatigue when an individual sees the ad this many times.">
              <input required type="number" min="1" max="20" style={inputStyle}
                placeholder="3" value={metaForm.frequency_cap}
                onChange={e => setMeta("frequency_cap", e.target.value)} />
            </Field>

            <Field label="Meta Ad Account ID" hint="act_XXXXXXXXXXXXXXX">
              <input type="text" style={inputStyle} placeholder="act_1951029692121376"
                value={metaForm.ad_account_id} onChange={e => setMeta("ad_account_id", e.target.value)} />
            </Field>

            <Field label="Ad Set IDs" hint="Meta ad set IDs to monitor, one per line or comma-separated.">
              <textarea rows={3} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
                placeholder={"120213456789\n120213456790"} value={metaForm.creative_asset_ids}
                onChange={e => setMeta("creative_asset_ids", e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── GOOGLE FIELDS ────────────────────────────────────────────────── */}
        {platform === "google" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Campaign Name" hint="Internal name for this campaign.">
              <input required type="text" style={inputStyle} placeholder="Brand Search — Q2 2026"
                value={googleForm.name} onChange={e => setGoogle("name", e.target.value)} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Campaign Type">
                <select required style={inputStyle} value={googleForm.type}
                  onChange={e => setGoogle("type", e.target.value)}>
                  {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Daily Budget ($)">
                <input required type="number" min="1" step="0.01" style={inputStyle}
                  placeholder="50.00" value={googleForm.daily_budget}
                  onChange={e => setGoogle("daily_budget", e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Bidding Strategy">
                <select style={inputStyle} value={googleForm.bidding_strategy}
                  onChange={e => setGoogle("bidding_strategy", e.target.value)}>
                  {BIDDING_STRATEGIES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
              {googleForm.bidding_strategy === "TARGET_CPA" && (
                <Field label="Target CPA ($)">
                  <input type="number" min="0.01" step="0.01" style={inputStyle}
                    placeholder="25.00" value={googleForm.target_cpa}
                    onChange={e => setGoogle("target_cpa", e.target.value)} />
                </Field>
              )}
              {googleForm.bidding_strategy === "TARGET_ROAS" && (
                <Field label="Target ROAS (e.g. 3.5 = 350%)">
                  <input type="number" min="0.1" step="0.1" style={inputStyle}
                    placeholder="3.5" value={googleForm.target_roas}
                    onChange={e => setGoogle("target_roas", e.target.value)} />
                </Field>
              )}
              {googleForm.bidding_strategy === "MANUAL_CPC" && (
                <Field label="Default CPC Bid ($)">
                  <input type="number" min="0.01" step="0.01" style={inputStyle}
                    placeholder="1.00" value={googleForm.cpc_bid}
                    onChange={e => setGoogle("cpc_bid", e.target.value)} />
                </Field>
              )}
            </div>

            <Field label="Final URL" hint="The landing page URL for your ads.">
              <input required type="url" style={inputStyle} placeholder="https://buenaonda.ai"
                value={googleForm.final_url} onChange={e => setGoogle("final_url", e.target.value)} />
            </Field>

            <Field label="Headlines" hint="3–15 headlines, max 30 characters each. Agent uses these in your Responsive Search Ad.">
              {googleForm.headlines.map((h, i) => (
                <input key={i} type="text" maxLength={30} style={{ ...inputStyle, marginBottom: 8 }}
                  placeholder={`Headline ${i + 1} (max 30 chars)`} value={h}
                  onChange={e => setHeadline(i, e.target.value)} />
              ))}
              {googleForm.headlines.length < 15 && (
                <button type="button" onClick={() => setGoogle("headlines", [...googleForm.headlines, ""])}
                  style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  + Add headline
                </button>
              )}
            </Field>

            <Field label="Descriptions" hint="2–4 descriptions, max 90 characters each.">
              {googleForm.descriptions.map((d, i) => (
                <input key={i} type="text" maxLength={90} style={{ ...inputStyle, marginBottom: 8 }}
                  placeholder={`Description ${i + 1} (max 90 chars)`} value={d}
                  onChange={e => setDescription(i, e.target.value)} />
              ))}
              {googleForm.descriptions.length < 4 && (
                <button type="button" onClick={() => setGoogle("descriptions", [...googleForm.descriptions, ""])}
                  style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  + Add description
                </button>
              )}
            </Field>

            {googleForm.type === "SEARCH" && (
              <Field label="Keywords" hint="One keyword per line or comma-separated. All added as Broad match — refine in Google Ads UI after creation.">
                <textarea rows={4} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
                  placeholder={"best meta ads agency\nautonomous ad management\nai ads platform"}
                  value={googleForm.keywords} onChange={e => setGoogle("keywords", e.target.value)} />
              </Field>
            )}

            <div style={{ fontSize: 12, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 16px" }}>
              Campaign will be created in <strong style={{ color: T.text }}>PAUSED</strong> status. Review in Google Ads and enable when ready.
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 20, fontSize: 13, color: T.error, background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 8, padding: "10px 14px" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 28,
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: saving ? T.accentBg : T.accent,
            color: saving ? T.accent : "#0d0f14",
            fontSize: 14,
            fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Creating…" : platform === "google" ? "Create Google Campaign" : "Save Meta Brief"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  color: "#e8eaf0",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8b8fa8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11, color: "#5a5e72", marginBottom: 8, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}
