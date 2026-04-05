"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, Pause, Clock, RefreshCw, TrendingUp, Target, BarChart3, MessageSquare, OctagonX, CheckCircle2 } from "lucide-react";

/* ── Data ── */

const PLATFORMS = ["Meta", "Google", "TikTok", "Shopify"];
const PLATFORM_COLORS = ["#4a90d9", "#34a853", "#ff2d6b", "#96bf48"];

const TICKER_ICONS: Record<string, React.ReactNode> = {
  zap: <Zap className="w-3.5 h-3.5" />,
  pause: <Pause className="w-3.5 h-3.5" />,
  clock: <Clock className="w-3.5 h-3.5" />,
  refresh: <RefreshCw className="w-3.5 h-3.5" />,
  trending: <TrendingUp className="w-3.5 h-3.5" />,
  target: <Target className="w-3.5 h-3.5" />,
  chart: <BarChart3 className="w-3.5 h-3.5" />,
  message: <MessageSquare className="w-3.5 h-3.5" />,
  stop: <OctagonX className="w-3.5 h-3.5" />,
  check: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const TICKER = [
  { icon: "zap", text: "Budget scaled +20% — Summit Roofing CPL dropped to $22", cls: "text-emerald-400" },
  { icon: "pause", text: "Underperforming ad set paused — $340 saved today", cls: "text-amber-400" },
  { icon: "clock", text: "2:14am — CPL spike caught and paused automatically. No one was awake.", cls: "text-slate-400" },
  { icon: "refresh", text: "Creative fatigue detected — replacement brief auto-generated", cls: "text-slate-400" },
  { icon: "trending", text: "ROAS hit 4.2x on Peak Supplements — budget increased", cls: "text-emerald-400" },
  { icon: "target", text: "New TikTok campaign launched — 3 ad sets live", cls: "text-amber-400" },
  { icon: "chart", text: "Morning report posted to Slack — 847 leads this week across 6 clients", cls: "text-slate-400" },
  { icon: "message", text: 'WhatsApp reply received: "pause the roofing campaign" — done', cls: "text-amber-400" },
  { icon: "zap", text: "Budget reallocated from 2 losers to top performer", cls: "text-emerald-400" },
  { icon: "stop", text: "CPL cap hit — ad set paused before overspend", cls: "text-red-400" },
  { icon: "clock", text: "Sunday 4am — winner scaled while everyone slept. +$800 in leads by 9am.", cls: "text-emerald-400" },
  { icon: "trending", text: "Google Search ROAS: 5.1x — scaling now", cls: "text-emerald-400" },
  { icon: "target", text: "Audience overlap fixed — 3 ad sets consolidated", cls: "text-amber-400" },
  { icon: "check", text: "New lead campaign live — targeting 180k homeowners in Phoenix", cls: "text-emerald-400" },
  { icon: "zap", text: "TikTok ad outperforming Meta — budget shifted automatically", cls: "text-amber-400" },
];

const STATS = [
  { label: "avg CPL reduction", value: 40, suffix: "%", decimal: false },
  { label: "avg ROAS lift", value: 3.8, suffix: "x", decimal: true },
  { label: "hours a day, always on", value: 24, suffix: "/7", decimal: false },
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

/* ── Components ── */

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const resolved = useRef<string[]>(text.split(""));
  const [output, setOutput] = useState<string[]>(() => text.split(""));

  useEffect(() => {
    const scrambled = text.split("").map((c) =>
      c === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    );
    resolved.current = [...scrambled];
    setOutput([...scrambled]);

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    text.split("").forEach((char, i) => {
      if (char === " ") {
        resolved.current[i] = " ";
        return;
      }
      const charDelay = delay + i * 52;
      const scrambleDuration = 400;
      const numFrames = 7;

      for (let f = 0; f < numFrames; f++) {
        timeouts.push(
          setTimeout(() => {
            resolved.current[i] = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            setOutput([...resolved.current]);
          }, charDelay + (f * scrambleDuration) / numFrames)
        );
      }

      timeouts.push(
        setTimeout(() => {
          resolved.current[i] = char;
          setOutput([...resolved.current]);
        }, charDelay + scrambleDuration)
      );
    });

    return () => timeouts.forEach(clearTimeout);
  }, [text, delay]);

  return <>{output.join("")}</>;
}

function StatCounter({ value, suffix, decimal, label }: { value: number; suffix: string; decimal: boolean; label: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const animate = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCurrent(decimal ? Math.round(eased * value * 10) / 10 : Math.round(eased * value));
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, decimal]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-[clamp(34px,4vw,56px)] font-extrabold text-[#e8eaf0] tracking-tighter leading-none">
        {decimal ? current.toFixed(1) : current}
        {suffix}
      </div>
      <div className="text-xs text-[#5a5e72] mt-2 uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}

const PLATFORM_PILLS = [
  { name: "Meta Ads", color: "#4a90d9" },
  { name: "Google Ads", color: "#5fad56" },
  { name: "TikTok Ads", color: "#e05c8a" },
  { name: "Shopify", color: "#96bf48" },
];

/* ── Hero ── */

export default function LandingHero() {
  const [platformIdx, setPlatformIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPlatformIdx((i) => (i + 1) % PLATFORMS.length);
        setFading(false);
      }, 280);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [...TICKER, ...TICKER];

  return (
    <>
      {/* Scoped animations — kept minimal, rest moved to globals.css */}
      <style>{`
        @keyframes slideReveal {
          from { transform: translateY(110%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes whitePulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.8); transform: scale(1); }
          70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); transform: scale(1); }
        }
        .fu1 { animation: fade-up 0.65s 0.05s ease both; }
        .fu2 { animation: slideReveal 0.7s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .fu3 { animation: slideReveal 0.7s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .fu4 { animation: fade-up 0.65s 0.44s ease both; }
        .fu5 { animation: fade-up 0.65s 0.58s ease both; }
        .fu6 { animation: fade-up 0.65s 0.70s ease both; }
      `}</style>

      <section className="relative overflow-hidden bg-[#0d0f14] pt-36 pb-0 px-6 text-center">
        {/* Ambient glows */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[720px] h-[480px] pointer-events-none animate-glow-pulse"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 68%)" }} />
        <div className="absolute top-[35%] left-1/4 w-[360px] h-[260px] pointer-events-none animate-glow-pulse"
          style={{ background: "radial-gradient(ellipse, rgba(247,107,28,0.05) 0%, transparent 70%)", animationDelay: "2s" }} />

        <div className="max-w-[880px] mx-auto relative">
          {/* Live badge */}
          <div className="fu1 inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-live-pulse" />
            AI Agent · Always On
          </div>

          {/* Headline line 1 */}
          <div className="overflow-hidden block mb-1.5">
            <h1 className="fu2 text-[clamp(42px,7vw,82px)] font-extrabold text-[#e8eaf0] tracking-[-3px] leading-[1] m-0 font-mono">
              <ScrambleText text="Stop managing ads." delay={200} />
            </h1>
          </div>

          {/* Headline line 2 — gradient */}
          <div className="overflow-hidden block mb-10">
            <h1 className="fu3 text-[clamp(42px,7vw,82px)] font-extrabold tracking-[-3px] leading-[1] m-0 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-mono">
              <ScrambleText text="Let AI win them." delay={650} />
            </h1>
          </div>

          {/* Subhead with platform cycling */}
          <p className="fu4 text-lg text-[#8b8fa8] max-w-[560px] mx-auto mb-5 leading-relaxed">
            The autonomous AI agent that launches, optimizes, and reports on your{" "}
            <span
              className={`inline-block transition-all duration-300 font-bold ${fading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}
              style={{ color: PLATFORM_COLORS[platformIdx] }}
            >
              {PLATFORMS[platformIdx]}
            </span>{" "}
            campaigns like a senior media buyer would, around the clock, while you focus on your business.
          </p>

          {/* Platform pills */}
          <div className="fu4 flex justify-center gap-2.5 mb-12 flex-wrap">
            {PLATFORM_PILLS.map((p) => (
              <div
                key={p.name}
                className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  border: `1px solid ${p.color}35`,
                  background: `${p.color}12`,
                  color: p.color,
                }}
              >
                {p.name}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="fu5 flex gap-3.5 justify-center flex-wrap mb-5">
            <a
              href="/demo"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-[15px] font-extrabold no-underline shadow-[0_4px_36px_rgba(245,166,35,0.32)] hover:brightness-110 transition-all duration-200 cursor-pointer tracking-tight"
            >
              <span
                className="w-2 h-2 rounded-full bg-white/90 inline-block flex-shrink-0"
                style={{ animation: "whitePulse 1.8s ease-in-out infinite" }}
              />
              Try the live demo
              <span className="ml-0.5">→</span>
            </a>
            <Link
              href="/#pricing"
              className="px-8 py-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 text-[15px] font-bold no-underline hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-200 cursor-pointer"
            >
              Start Free
            </Link>
          </div>

          <p className="fu6 text-xs text-[#5a5e72] mb-12">
            14-day free trial · Card required · Cancel anytime
          </p>

          {/* Dashboard screenshot */}
          <div className="fu6 relative max-w-[840px] mx-auto rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]">
            <img
              src="/brand/dashboard-screenshot.png"
              alt="Buena Onda dashboard showing live campaign metrics, platform breakdown, alerts, and AI recommendations"
              className="w-full block"
            />
          </div>
        </div>

        {/* Live ticker */}
        <div className="relative overflow-hidden border-y border-white/5 bg-[#161820]/70 py-3.5 mt-0">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0d0f14] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0d0f14] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-ticker" style={{ width: "max-content" }}>
            {tickerItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-8 whitespace-nowrap">
                <span className={item.cls}>{TICKER_ICONS[item.icon]}</span>
                <span className={`text-xs font-medium ${item.cls}`}>{item.text}</span>
                <span className="text-white/[0.07] ml-4">·</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-[#161820] border-b border-white/[0.06] py-14 px-6">
          <div className="max-w-[640px] mx-auto grid grid-cols-3 gap-6 max-[480px]:grid-cols-1 max-[480px]:gap-8 max-[480px]:max-w-[260px]">
            {STATS.map((s) => (
              <StatCounter key={s.label} value={s.value} suffix={s.suffix} decimal={s.decimal} label={s.label} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
