"use client";

import { useState } from "react";
import type { WorkflowPlan } from "@/lib/ai/brain";

async function requestPlan(payload: { prompt: string; contactId?: string }) {
  const res = await fetch("/api/employee/workflow/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Request failed");
  }

  const data = (await res.json()) as { plan: WorkflowPlan };
  return data.plan;
}

export default function ClientConsole() {
  const [prompt, setPrompt] = useState("");
  const [contactId, setContactId] = useState("");
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(includeContact: boolean) {
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    if (includeContact && !contactId.trim()) {
      setError("Contact ID required for execution");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const nextPlan = await requestPlan({ prompt, contactId: includeContact ? contactId.trim() : undefined });
      setPlan(nextPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Prompt</label>
        <textarea
          className="w-full rounded border border-slate-300 p-2"
          rows={4}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Contact ID (optional)</label>
        <input
          className="w-full rounded border border-slate-300 p-2"
          value={contactId}
          onChange={(event) => setContactId(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          Plan only
        </button>
        <button
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          onClick={() => handleSubmit(true)}
          disabled={loading}
        >
          Plan + Execute
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {plan && (
        <pre className="rounded bg-slate-100 p-4 text-sm">
          {JSON.stringify(plan, null, 2)}
        </pre>
      )}
    </div>
  );
}
