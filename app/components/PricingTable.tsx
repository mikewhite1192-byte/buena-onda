"use client";

import Link from "next/link";
import { pricing, type Plan } from "@/lib/site";

export default function PricingTable() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {pricing.map((p) => (
        <PlanCard key={p.name} plan={p} />
      ))}
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.featured;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-soft p-6 flex flex-col ${
        featured ? "border-onda-teal" : "border-gray-200"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-onda-slate">{plan.name}</h3>
        <span className="text-xl font-bold text-onda-teal">{plan.price}</span>
      </div>

      <p className="mt-1 text-sm text-onda-slate/70">{plan.tagline}</p>

      <ul className="mt-4 space-y-2 text-sm text-onda-slate/90">
        {plan.bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
        <li className="text-onda-slate/70">
          Messages:{" "}
          <strong>
            {plan.limit.messages === "unlimited"
              ? "Unlimited"
              : plan.limit.messages}
          </strong>
          {plan.limit.trialDays ? ` • ${plan.limit.trialDays}-day trial` : ""}
        </li>
      </ul>

      <Link
        href={plan.cta.href}
        className={`mt-6 inline-block w-full text-center rounded-lg px-4 py-2 ${
          featured
            ? "bg-onda-teal text-white"
            : "border border-gray-300 text-onda-slate hover:border-onda-teal"
        }`}
      >
        {plan.cta.label}
      </Link>

      {plan.name === "Unlimited" && (
        <p className="mt-3 text-xs text-onda-slate/60">
          Fair-use protections apply to prevent abuse.
        </p>
      )}
    </div>
  );
}
