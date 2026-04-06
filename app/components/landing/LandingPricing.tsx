"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, Crown } from "lucide-react";

const SHARED_FEATURES = [
  "AI campaign creation & launch",
  "Unlimited active campaigns",
  "Hourly autonomous optimization",
  "Creative fatigue detection",
  "A/B testing automation",
  "ROAS & CPL goal tracking",
  "Lead gen & e-commerce support",
  "WhatsApp & Slack reports",
  "Multi-client management",
  "Guardrails or full autonomous mode",
  "14-day free trial",
];

const PLANS = [
  {
    name: "Starter",
    price: 97,
    priceId: "price_1TDsTU2LedSrht7tPlVdEkEM",
    spend: "Up to $10k/mo ad spend",
    desc: "Perfect for small businesses ready to put their campaigns on autopilot.",
    cta: "Start Free",
    highlight: false,
    extra: null,
  },
  {
    name: "Growth",
    price: 197,
    priceId: "price_1TDsV42LedSrht7tW379Owbh",
    spend: "Up to $50k/mo ad spend",
    desc: "For growing businesses ready to scale their ad results.",
    cta: "Start Free",
    highlight: true,
    badge: "Most Popular",
    extra: null,
  },
  {
    name: "Pro",
    price: 297,
    priceId: "price_PRO_PLACEHOLDER",
    spend: "Up to $100k/mo ad spend",
    desc: "For serious operators scaling multiple campaigns at high spend.",
    cta: "Start Free",
    highlight: false,
    extra: null,
  },
  {
    name: "Agency",
    price: 397,
    priceId: "price_1TDsW92LedSrht7tspIcI8Td",
    spend: "Up to $150k/mo ad spend",
    desc: "For agencies managing multiple clients with branded reporting.",
    cta: "Start Free",
    highlight: false,
    extra: "White-label reporting",
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
    <section id="pricing" className="py-24 px-6 ">
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
            Every plan includes the full platform. Pick the one that fits your ad spend.
          </p>
        </div>

        {/* Plan cards — compact, no feature lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch mb-14">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-0.5 flex flex-col ${
                plan.highlight
                  ? "bg-[#1e2130] border-2 border-amber-500/30 lg:scale-[1.03]"
                  : "bg-[#161820] border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[11px] font-bold text-[#0d0f14] whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="text-sm font-semibold text-[#8b8fa8] mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[42px] font-extrabold text-[#e8eaf0] tracking-tighter">${plan.price}</span>
                <span className="text-sm text-[#5a5e72]">/mo</span>
              </div>
              <div className="text-xs text-amber-400 font-semibold mb-3">{plan.spend}</div>
              <div className="text-sm text-[#8b8fa8] leading-relaxed mb-6">{plan.desc}</div>

              {/* Agency-only extra */}
              {plan.extra && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-400 font-semibold">{plan.extra}</span>
                </div>
              )}

              <div className="mt-auto">
                <button
                  onClick={() => checkout(plan)}
                  disabled={loading === plan.name}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] hover:brightness-110 shadow-lg shadow-amber-500/20"
                      : "bg-white/5 border border-white/[0.1] text-[#e8eaf0] hover:bg-white/10"
                  } ${loading === plan.name ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {loading === plan.name ? "Loading..." : `${plan.cta} →`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* All plans include */}
        <div className="bg-[#161820] border border-white/[0.06] rounded-2xl p-8 mb-10">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-[#e8eaf0] mb-1">All plans include</h3>
            <p className="text-sm text-[#5a5e72]">The only difference between plans is your ad spend limit.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 max-w-3xl mx-auto">
            {SHARED_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-[#8b8fa8]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise note */}
        <div className="text-center">
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
