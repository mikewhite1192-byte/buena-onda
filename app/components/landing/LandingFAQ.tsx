"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to know anything about running ads?",
    a: "No. Buena Onda handles everything — campaign setup, targeting, bidding, creative direction, and optimization across Meta, Google, and TikTok. You just tell the AI your goal and budget. It handles the rest.",
  },
  {
    q: "What does the 14-day free trial include?",
    a: "Full access to everything on your chosen plan — AI campaign creation, optimization, WhatsApp and Slack reports, and the full dashboard. No feature restrictions. Your card is charged after 14 days. Cancel any time before then and you're never billed.",
  },
  {
    q: "What ad spend limits apply to each plan?",
    a: "Starter: up to $10k/month. Growth: up to $50k/month. Agency: up to $150k/month. Spending more? Email hello@buenaonda.ai for enterprise pricing.",
  },
  {
    q: "How does the AI actually optimize campaigns?",
    a: "The agent checks campaign performance daily — adjusting bids, pausing underperforming ads, shifting budget to winners, and flagging creative fatigue. Every action is logged so you can see exactly what changed and why.",
  },
  {
    q: "Will I lose control of my ad account?",
    a: "Never. You approve everything before it goes live (or set auto-approve if you prefer). You can pause the AI, override any decision, or disconnect anytime. Your ad account stays yours.",
  },
  {
    q: "What business types does it work for?",
    a: "Lead gen businesses (roofing, solar, HVAC, real estate, insurance, etc.) and e-commerce brands both work great. If you're running Meta ads to generate leads or sales, Buena Onda is built for you.",
  },
  {
    q: "Does it work for agencies managing multiple clients?",
    a: "Yes — the Agency plan is built specifically for this. Each client gets their own AI agent, their own metrics dashboard, and their own optimization rules. You manage everything from one place. No more tab-switching or manual reporting.",
  },
  {
    q: "Does it work with existing campaigns?",
    a: "Yes. Connect your account and the AI audits your existing campaigns immediately — identifying what's working, what's wasting money, and what to fix. You can keep running existing campaigns alongside new AI-built ones.",
  },
  {
    q: "Is my ad account data secure?",
    a: "Yes. We use read/write access scoped specifically to your ad accounts — we can't access anything outside your campaigns. All data is encrypted in transit and at rest.",
  },
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6 bg-[#0d0f14]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            FAQ
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-[#e8eaf0] mb-4 tracking-tight">
            Common questions
          </h2>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`bg-[#161820] rounded-xl overflow-hidden transition-all duration-200 ${
                open === i ? "border border-amber-500/20" : "border border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full px-6 py-5 bg-transparent border-none flex items-center justify-between cursor-pointer gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset focus-visible:rounded-xl"
              >
                <span className="text-sm font-semibold text-[#e8eaf0] leading-snug">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-[#8b8fa8] leading-relaxed m-0">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#5a5e72]">
            Still have questions?{" "}
            <a href="mailto:hello@buenaonda.ai" className="text-amber-400 hover:text-amber-300 font-semibold no-underline transition-colors">
              hello@buenaonda.ai
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
