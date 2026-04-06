"use client";

import { Rocket, SlidersHorizontal, Zap, BarChart3, Eye } from "lucide-react";
import AnimatedCampaigns from "./AnimatedCampaigns";

const STEPS = [
  {
    num: 1,
    icon: Rocket,
    title: "Launch",
    bullets: [
      "AI writes ad copy, selects audiences, and sets bidding strategy",
      "Campaigns go live on Meta, Google, or TikTok in one click",
      "You approve or let it auto-launch — your call",
      "No ad experience needed — the AI handles everything",
    ],
  },
  {
    num: 2,
    icon: SlidersHorizontal,
    title: "Manage",
    bullets: [
      "Unified dashboard — Meta, Google, and TikTok in one place",
      "Real-time budget pacing so you never overspend",
      "Every campaign, ad set, and creative tracked live",
      "Works with your existing campaigns too — not just new ones",
    ],
    animated: true, // uses AnimatedCampaigns component instead of static screenshot
  },
  {
    num: 3,
    icon: Zap,
    title: "Optimize",
    bullets: [
      "AI checks performance hourly and adjusts automatically",
      "Pauses losers, scales winners, shifts budget to what works",
      "Catches issues at 2am so you don't wake up to wasted spend",
      "Full autonomous or guardrails mode — you choose the control level",
    ],
  },
  {
    num: 4,
    icon: BarChart3,
    title: "Report",
    bullets: [
      "Morning briefings delivered via WhatsApp or Slack",
      "Weekly PDF reports — white-label ready for agency clients",
      "Every optimization logged with reasons, not just actions",
      "Built for agency owners — one report per client, zero effort",
    ],
    screenshot: {
      src: "/brand/reports-screenshot.png",
      alt: "Buena Onda AI-generated performance report with spend, revenue, ROAS, and recommendations",
    },
  },
  {
    num: 5,
    icon: Eye,
    title: "Oversee",
    bullets: [
      "Control everything from WhatsApp or Slack — no dashboard required",
      "Set CPL caps, ROAS floors, and daily spend limits",
      "Override any AI decision at any time — your account, your rules",
      "Full action log shows exactly what changed and why",
    ],
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 ">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            How it works
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-[#e8eaf0] mb-4 tracking-tight">
            Five steps to autopilot
          </h2>
          <p className="text-base text-[#8b8fa8] max-w-lg mx-auto leading-relaxed">
            From launch to optimization to reporting — the AI handles the full lifecycle of your ad campaigns.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num}>
                <div className="bg-[#161820] border border-white/[0.06] rounded-2xl p-8 hover:border-amber-500/20 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start gap-5 mb-5">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[#0d0f14] font-bold text-sm">
                        {step.num}
                      </div>
                      <Icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-[#e8eaf0] pt-2">{step.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 sm:ml-[76px]">
                    {step.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2.5">
                        <span className="text-amber-500 text-sm mt-0.5 flex-shrink-0">→</span>
                        <span className="text-sm text-[#8b8fa8] leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {step.animated && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-amber-500/5 relative">
                    <AnimatedCampaigns />
                  </div>
                )}
                {step.screenshot && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-amber-500/5">
                    <img
                      src={step.screenshot.src}
                      alt={step.screenshot.alt}
                      className="w-full block"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Callout */}
        <div className="mt-12 bg-[#161820] border border-amber-500/20 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-[#e8eaf0] mb-2">Already running ads?</h3>
            <p className="text-sm text-[#8b8fa8] leading-relaxed max-w-lg">
              Connect your existing Meta, Google, or TikTok ad account. The AI audits your campaigns in minutes — finds what&apos;s wasting money, what&apos;s working, and starts optimizing immediately.
            </p>
          </div>
          <a
            href="/#pricing"
            className="flex-shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] font-bold text-sm no-underline hover:brightness-110 transition-all duration-200 cursor-pointer"
          >
            Connect your account →
          </a>
        </div>
      </div>
    </section>
  );
}
