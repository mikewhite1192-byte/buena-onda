"use client";

import { useState } from "react";
import { Bot } from "lucide-react";

type Message = { role: "user" | "ai"; text: string };

const DEMO_FLOWS: Record<string, { messages: Message[]; summary: string }> = {
  leadgen: {
    summary: "Lead Gen Campaign",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I run a roofing company. I want to get more leads." },
      { role: "ai", text: "Perfect. What's your monthly ad budget and which cities are you targeting?" },
      { role: "user", text: "About $3,000/month. I'm in Phoenix and Scottsdale." },
      { role: "ai", text: "Got it. I'll target homeowners 35–65 in Phoenix Metro. Storm season is active — I'll lead with an 'emergency roof repair' angle. What's your typical lead cost goal?" },
      { role: "user", text: "Under $40 per lead ideally." },
      { role: "ai", text: "That's very achievable. I'm setting up 3 ad sets: storm damage urgency, free inspection offer, and a testimonial carousel. I'll launch tomorrow morning and optimize daily. Want me to send you a WhatsApp update each morning with results — or post to your Slack channel?" },
      { role: "user", text: "Yes please!" },
      { role: "ai", text: "Campaign ready to launch. I'll target 180k homeowners, run 9 creatives, and aim for $28 CPL. You'll get a morning briefing every day at 8am. Approve to go live." },
    ],
  },
  ecomm: {
    summary: "E-Commerce / ROAS",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I sell supplements online. We want to scale revenue." },
      { role: "ai", text: "Love it. Are you tracking purchases with a Meta pixel? And what's your current ROAS target?" },
      { role: "user", text: "Yes, pixel is installed. I want at least 3x ROAS." },
      { role: "ai", text: "I see your pixel data — your best-performing product is your protein bundle. I'll build a DPA retargeting campaign for cart abandoners and a prospecting campaign targeting fitness enthusiasts 25–45. What's the monthly budget?" },
      { role: "user", text: "Start with $5k/month." },
      { role: "ai", text: "Smart. I'll split $3k prospecting / $2k retargeting. Retargeting typically runs 6–8x ROAS. I'll scale the winners weekly and kill anything below 2x after 5 days. Ready to launch?" },
      { role: "user", text: "Let's do it." },
      { role: "ai", text: "Launching 2 campaigns, 6 ad sets, 14 creatives. DPA catalog connected. I'll optimize bids daily and report every Monday. Projected Month 1 ROAS: 3.4x based on your pixel history." },
    ],
  },
  audit: {
    summary: "Campaign Audit",
    messages: [
      { role: "ai", text: "Hey! I'm your Buena Onda AI agent. What are we advertising today?" },
      { role: "user", text: "I'm already running ads but they're not performing well." },
      { role: "ai", text: "Let me audit your account. I can see 4 active campaigns. Your CPL went from $31 to $67 over the last 30 days. Want to know why?" },
      { role: "user", text: "Yes, what's happening?" },
      { role: "ai", text: "3 issues: (1) Creative fatigue — your top ad has been running 47 days, CTR dropped 60%. (2) Audience overlap — 3 of your 4 ad sets are targeting the same people. (3) Budget imbalance — 70% on a broad campaign that's only converting at 12%." },
      { role: "user", text: "How do we fix it?" },
      { role: "ai", text: "Here's my plan: Pause the fatigued creatives today. Consolidate overlapping ad sets into 2 clean audiences. Reallocate budget 50/50 between your top-performing lookalike and a new retargeting campaign. I can execute this now — approve?" },
      { role: "user", text: "Yes, do it." },
      { role: "ai", text: "Done. 3 creatives paused, ad sets consolidated, budgets reallocated. I'll monitor for 72 hours and report back. Based on your historic data, expect CPL to drop back to $32–$38 within a week." },
    ],
  },
};

export default function LandingDemo() {
  const [activeFlow, setActiveFlow] = useState<keyof typeof DEMO_FLOWS>("leadgen");
  const [visibleCount, setVisibleCount] = useState(2);
  const flow = DEMO_FLOWS[activeFlow];

  function handleFlowChange(key: keyof typeof DEMO_FLOWS) {
    setActiveFlow(key);
    setVisibleCount(2);
  }

  function nextMessage() {
    setVisibleCount((c) => Math.min(c + 1, flow.messages.length));
  }

  const visible = flow.messages.slice(0, visibleCount);
  const done = visibleCount >= flow.messages.length;

  return (
    <section id="demo" className="py-24 px-6 ">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            Live demo
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-[#e8eaf0] mb-4 tracking-tight">
            Watch the AI in action
          </h2>
          <p className="text-base text-[#8b8fa8] max-w-md mx-auto mb-3 leading-relaxed">
            See how the AI handles real agency scenarios — or explore the full live dashboard below.
          </p>
          <a
            href="/demo"
            className="inline-block px-6 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold no-underline hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-200 cursor-pointer"
          >
            Explore the full demo dashboard →
          </a>
        </div>

        {/* Scenario tabs */}
        <div className="flex gap-2.5 mb-6 justify-center flex-wrap">
          {(Object.keys(DEMO_FLOWS) as Array<keyof typeof DEMO_FLOWS>).map((key) => (
            <button
              key={key}
              onClick={() => handleFlowChange(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                activeFlow === key
                  ? "bg-amber-500/10 border border-amber-500/40 text-amber-400"
                  : "bg-transparent border border-white/[0.06] text-[#8b8fa8] hover:border-white/[0.15] hover:text-[#e8eaf0]"
              }`}
            >
              {DEMO_FLOWS[key].summary}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="bg-[#161820] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#0d0f14]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#e8eaf0]">Buena Onda AI</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-live-pulse" />
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 min-h-[320px] flex flex-col gap-4">
            {visible.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-br-md text-amber-300"
                      : "bg-[#1e2130] border border-white/[0.06] rounded-2xl rounded-bl-md text-[#e8eaf0]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
            {!done ? (
              <button
                onClick={nextMessage}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-extrabold cursor-pointer border-none hover:brightness-110 transition-all duration-200"
              >
                {flow.messages[visibleCount]?.role === "user" ? "Continue conversation →" : "See AI response →"}
              </button>
            ) : (
              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => setVisibleCount(2)}
                  className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-transparent text-[#8b8fa8] text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all duration-200"
                >
                  ↩ Restart
                </button>
                <a
                  href="/#pricing"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-extrabold no-underline text-center cursor-pointer hover:brightness-110 transition-all duration-200"
                >
                  Start Free →
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#5a5e72] mt-4">
          This is a demo — the real AI connects to your live ad accounts and campaigns.
        </p>
      </div>
    </section>
  );
}
