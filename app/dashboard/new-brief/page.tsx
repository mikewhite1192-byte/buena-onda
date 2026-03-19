"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const defaultScalingRules = JSON.stringify(
  {
    increase_budget_if_cpl_below: null,
    decrease_budget_if_cpl_above: null,
    pause_if_cpl_above: null,
    scale_multiplier: 1.2,
  },
  null,
  2
);

export default function NewBriefPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    avatar: "",
    offer: "",
    daily_budget: "",
    cpl_cap: "",
    scaling_rules: defaultScalingRules,
    frequency_cap: "3",
    creative_asset_ids: "",
    ad_account_id: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          daily_budget: parseFloat(form.daily_budget),
          cpl_cap: parseFloat(form.cpl_cap),
          frequency_cap: parseInt(form.frequency_cap, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save brief");

      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Campaign Brief</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Fill out the brief to give the agent everything it needs to manage your campaign.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Avatar */}
        <Field label="Target Avatar" hint="Who is this ad for? Be specific about demographics, pain points, and desires.">
          <textarea
            required
            rows={4}
            className={inputClass}
            placeholder="e.g. Female business owners 35–55, frustrated with inconsistent lead flow, want predictable client acquisition without doing it themselves…"
            value={form.avatar}
            onChange={(e) => set("avatar", e.target.value)}
          />
        </Field>

        {/* Offer */}
        <Field label="Offer" hint="What are you promoting? Include the hook, price point, and CTA.">
          <textarea
            required
            rows={3}
            className={inputClass}
            placeholder="e.g. Free 30-min strategy call → $3,500 done-for-you Meta Ads package…"
            value={form.offer}
            onChange={(e) => set("offer", e.target.value)}
          />
        </Field>

        {/* Budget + CPL side by side */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Daily Budget ($)" hint="Max spend per day.">
            <input
              required
              type="number"
              min="1"
              step="0.01"
              className={inputClass}
              placeholder="50.00"
              value={form.daily_budget}
              onChange={(e) => set("daily_budget", e.target.value)}
            />
          </Field>
          <Field label="CPL Cap ($)" hint="Pause or alert if cost-per-lead exceeds this.">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className={inputClass}
              placeholder="25.00"
              value={form.cpl_cap}
              onChange={(e) => set("cpl_cap", e.target.value)}
            />
          </Field>
        </div>

        {/* Frequency Cap */}
        <Field label="Frequency Cap" hint="Max times an individual sees the ad before the agent flags creative fatigue.">
          <input
            required
            type="number"
            min="1"
            max="20"
            className={inputClass}
            placeholder="3"
            value={form.frequency_cap}
            onChange={(e) => set("frequency_cap", e.target.value)}
          />
        </Field>

        {/* Scaling Rules */}
        <Field label="Scaling Rules (JSON)" hint="Define when the agent should increase/decrease budget or pause. Edit the values below.">
          <textarea
            rows={8}
            className={`${inputClass} font-mono text-xs`}
            value={form.scaling_rules}
            onChange={(e) => set("scaling_rules", e.target.value)}
          />
        </Field>

        {/* Meta Ad Account ID */}
        <Field label="Meta Ad Account ID" hint="The act_XXXXXXXXXXXXXXX ID for the Meta ad account this campaign runs in.">
          <input
            type="text"
            className={inputClass}
            placeholder="act_1951029692121376"
            value={form.ad_account_id}
            onChange={(e) => set("ad_account_id", e.target.value)}
          />
        </Field>

        {/* Creative Asset IDs */}
        <Field label="Ad Set IDs" hint="Paste the Meta ad set IDs the agent should monitor, one per line or comma-separated.">
          <textarea
            rows={3}
            className={`${inputClass} font-mono text-xs`}
            placeholder={"120213456789\n120213456790"}
            value={form.creative_asset_ids}
            onChange={(e) => set("creative_asset_ids", e.target.value)}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-neutral-900 text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Campaign Brief"}
        </button>
      </form>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-800">{label}</label>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
      {children}
    </div>
  );
}
