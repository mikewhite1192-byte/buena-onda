"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: 97,
    priceId: "price_1TDsTU2LedSrht7tPlVdEkEM",
    spend: "Up to $10k/mo ad spend",
    desc: "Perfect for small businesses ready to put their ad campaigns on autopilot.",
    features: [
      "AI campaign creation & launch",
      "Hourly autonomous optimization",
      "Lead gen & e-commerce support",
      "WhatsApp & Slack performance reports",
      "Up to 5 active campaigns",
      "Guardrails or full autonomous mode",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Growth",
    price: 197,
    priceId: "price_1TDsV42LedSrht7tW379Owbh",
    spend: "Up to $50k/mo ad spend",
    desc: "For growing businesses ready to scale their ad results.",
    features: [
      "Everything in Starter",
      "Unlimited active campaigns",
      "Creative fatigue detection",
      "A/B testing automation",
      "ROAS & CPL goal tracking",
      "Priority AI optimization",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Agency",
    price: 397,
    priceId: "price_1TDsW92LedSrht7tspIcI8Td",
    spend: "Up to $150k/mo ad spend",
    desc: "For agencies and power users managing multiple clients.",
    features: [
      "Everything in Growth",
      "Multi-client management",
      "Client memory & strategies",
      "White-label reporting",
      "Dedicated AI agent per client",
      "Advanced campaign analytics",
      "14-day free trial",
    ],
    cta: "Start Free",
    highlight: false,
  },
];

export default function LandingPricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  async function checkout(plan: (typeof PLANS)[0]) {
    if (!isSignedIn) {
      const checkoutUrl = `/checkout?priceId=${encodeURIComponent(plan.priceId)}&planName=${encodeURIComponent(plan.name)}`;
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(checkoutUrl)}`;
      return;
    }
    setLoading(plan.name);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, planName: plan.name }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-24 px-6 bg-[#0d0f14]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            Pricing
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-[#e8eaf0] mb-4 tracking-tight">
            Simple pricing. No surprises.
          </h2>
          <p className="text-base text-[#8b8fa8] max-w-md mx-auto leading-relaxed">
            All plans include a 14-day free trial. Cancel anytime. No setup fees.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 ${
                plan.highlight
                  ? "bg-[#1e2130] border-2 border-amber-500/30 md:scale-[1.02]"
                  : "bg-[#161820] border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[11px] font-bold text-[#0d0f14] whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm font-semibold text-[#8b8fa8] mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[42px] font-extrabold text-[#e8eaf0] tracking-tighter">${plan.price}</span>
                  <span className="text-sm text-[#5a5e72]">/month</span>
                </div>
                <div className="text-xs text-amber-400 font-semibold mb-3">{plan.spend}</div>
                <div className="text-sm text-[#8b8fa8] leading-relaxed">{plan.desc}</div>
              </div>

              <button
                onClick={() => checkout(plan)}
                disabled={loading === plan.name}
                className={`w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 mb-6 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] hover:brightness-110 shadow-lg shadow-amber-500/20"
                    : "bg-white/5 border border-white/[0.1] text-[#e8eaf0] hover:bg-white/10"
                } ${loading === plan.name ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading === plan.name ? "Loading..." : `${plan.cta} →`}
              </button>

              <div className="border-t border-white/[0.06] pt-6 space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#8b8fa8] leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-[#5a5e72]">
            Spending over $150k/month?{" "}
            <a href="mailto:hello@buenaonda.ai" className="text-amber-400 hover:text-amber-300 font-semibold no-underline transition-colors">
              Contact us for Enterprise pricing →
            </a>
          </p>
          <p className="text-xs text-[#5a5e72] mt-2">
            Card required to start trial · Billed monthly · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
