"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Zap, Pause, Clock, RefreshCw, TrendingUp, Target, BarChart3, MessageSquare, OctagonX, CheckCircle2, ArrowRight } from "lucide-react";
import AnimatedDashboard from "./AnimatedDashboard";
import MobileDecisionCards from "./MobileDecisionCards";
// Blobs moved to page level (fixed viewport)

/* ── Ticker Data ── */

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

/* ── Live feed (hero pill, rotates) ── */
const LIVE_FEED = [
  { icon: "pause", text: "Paused underperforming ad set", time: "2m ago" },
  { icon: "zap", text: "Scaled Summit Roofing budget +20%", time: "7m ago" },
  { icon: "clock", text: "Caught CPL spike at 2:14am", time: "18m ago" },
  { icon: "trending", text: "ROAS hit 4.2× on Peak Supplements", time: "34m ago" },
  { icon: "message", text: "WhatsApp: \"pause the roofing campaign\" — done", time: "52m ago" },
  { icon: "check", text: "New Phoenix campaign live · 180k homeowners", time: "1h ago" },
  { icon: "refresh", text: "Creative fatigue detected · brief generated", time: "2h ago" },
];

const TICKER = [
  { icon: "zap", text: "Budget scaled +20% — Summit Roofing CPL dropped to $22", cls: "text-emerald-400" },
  { icon: "pause", text: "Underperforming ad set paused — $340 saved today", cls: "text-amber-400" },
  { icon: "clock", text: "2:14am — CPL spike caught and paused automatically", cls: "text-slate-400" },
  { icon: "refresh", text: "Creative fatigue detected — replacement brief generated", cls: "text-slate-400" },
  { icon: "trending", text: "ROAS hit 4.2x on Peak Supplements — budget increased", cls: "text-emerald-400" },
  { icon: "target", text: "New TikTok campaign launched — 3 ad sets live", cls: "text-amber-400" },
  { icon: "chart", text: "Morning report posted to Slack — 847 leads this week", cls: "text-slate-400" },
  { icon: "message", text: 'WhatsApp: "pause the roofing campaign" — done', cls: "text-amber-400" },
  { icon: "zap", text: "Budget reallocated from 2 losers to top performer", cls: "text-emerald-400" },
  { icon: "stop", text: "CPL cap hit — ad set paused before overspend", cls: "text-red-400" },
  { icon: "trending", text: "Google Search ROAS: 5.1x — scaling now", cls: "text-emerald-400" },
  { icon: "check", text: "New lead campaign live — 180k homeowners in Phoenix", cls: "text-emerald-400" },
];

/* ── Stat Counter ── */

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
        {decimal ? current.toFixed(1) : current}{suffix}
      </div>
      <div className="text-xs text-[#5a5e72] mt-2 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}

/* ── Main Hero ── */

export default function LandingHero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [feedIdx, setFeedIdx] = useState(0);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setFeedIdx((i) => (i + 1) % LIVE_FEED.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dashRef.current) return;
    const rect = dashRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => setMousePos({ x: 0, y: 0 }), []);

  const tiltX = mousePos.y * -10;
  const tiltY = mousePos.x * 10;

  const tickerItems = [...TICKER, ...TICKER];

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes dashGlow {
          0%, 100% { box-shadow: 0 40px 100px -20px rgba(245,166,35,0.12), 0 0 0 1px rgba(255,255,255,0.06); }
          50% { box-shadow: 0 40px 100px -20px rgba(245,166,35,0.22), 0 0 0 1px rgba(255,255,255,0.1); }
        }
        @keyframes pill-feed-enter {
          from { opacity: 0; transform: translateY(6px); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .pill-feed-item {
          animation: pill-feed-enter 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dash-rise {
          from { transform: rotateX(24deg) translateZ(0); }
          to   { transform: rotateX(0deg) translateZ(0); }
        }
        .dash-entry-tilt {
          animation: dash-rise 1250ms cubic-bezier(0.16, 1, 0.3, 1) 750ms both;
          transform-origin: 50% 100%;
          transform-style: preserve-3d;
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-entry-tilt { animation: none; }
        }
        .hero-gradient {
          background: linear-gradient(100deg, #fde68a 0%, #f5a623 45%, #e8eaf0 100%);
          background-size: 220% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 16s ease-in-out infinite;
        }
        .cta-primary {
          position: relative;
          background: #f5a623;
          box-shadow: 0 8px 30px -6px rgba(245,166,35,0.35);
          transition: box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
        }
        .cta-primary:hover {
          background: #ffb33a;
          box-shadow: 0 12px 38px -6px rgba(245,166,35,0.5);
        }
        .hero-stat-row {
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hero-stat-cell + .hero-stat-cell {
          border-left: 1px solid rgba(255,255,255,0.06);
        }
        @media (max-width: 767px) {
          .hero-stat-cell:nth-child(3) { border-left: none; }
          .hero-stat-cell:nth-child(n+3) { border-top: 1px solid rgba(255,255,255,0.06); }
        }
        .hero-fade-in { animation: fade-up 1s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-fade-d0 { animation-delay: 0s; }
        .hero-fade-d1 { animation-delay: 0.15s; }
        .hero-fade-d2 { animation-delay: 0.35s; }
        .hero-fade-d3 { animation-delay: 0.55s; }
        .hero-fade-d4 { animation-delay: 0.75s; }
        .hero-fade-d5 { animation-delay: 0.95s; }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative flex flex-col justify-center overflow-hidden" style={{ minHeight: "110vh" }}>

        {/* Content */}
        <div className="relative z-[2] max-w-[1100px] mx-auto px-4 md:px-6 pt-28 md:pt-44 pb-10 md:pb-16">

          {/* Live announcement pill — rotating activity feed */}
          <div className="hero-fade-in hero-fade-d0 flex justify-center mb-5 md:mb-7">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs md:text-[13px] max-w-[92vw]">
              <span className="relative flex w-2 h-2 flex-none">
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
                <span className="relative w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,166,35,0.7)]" />
              </span>
              <span className="font-semibold text-[#e8eaf0] tracking-wide flex-none">Live</span>
              <span className="text-[#5a5e72] flex-none">·</span>
              <span key={feedIdx} className="pill-feed-item inline-flex items-center gap-2 min-w-0">
                <span className="text-[#8b8fa8] flex-none">
                  {TICKER_ICONS[LIVE_FEED[feedIdx].icon]}
                </span>
                <span className="text-[#e8eaf0] truncate">
                  {LIVE_FEED[feedIdx].text}
                </span>
                <span className="text-[#5a5e72] flex-none hidden sm:inline">·</span>
                <span className="text-[#5a5e72] flex-none hidden sm:inline tabular-nums">
                  {LIVE_FEED[feedIdx].time}
                </span>
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="max-w-[900px] mx-auto text-center mb-5 md:mb-6">
            <h1 className="hero-fade-in hero-fade-d1 text-[clamp(42px,7.2vw,104px)] font-extrabold leading-[0.95] md:leading-[0.92] tracking-[-1.8px] md:tracking-[-4px] text-[#e8eaf0]">
              Your ads managed by
              <span className="hero-gradient"> AI that never sleeps</span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="hero-fade-in hero-fade-d2 text-center text-[15px] md:text-xl text-[#8b8fa8] max-w-[540px] md:max-w-[600px] mx-auto mb-8 md:mb-10 leading-relaxed px-2">
            Launch, optimize, and report on Meta, Google, and TikTok campaigns — autonomously. Like a senior media buyer, around the clock.
          </p>

          {/* CTAs — stack on mobile */}
          <div className="hero-fade-in hero-fade-d3 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 md:mb-20 px-4 sm:px-0">
            <a href="/demo"
              className="cta-primary group w-full sm:w-auto px-7 py-3.5 rounded-full text-[#0d0f14] text-[15px] font-semibold no-underline inline-flex items-center justify-center gap-2">
              Try the live demo
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <Link href="/#pricing"
              className="group w-full sm:w-auto text-center px-7 py-3.5 rounded-full border border-white/12 text-[#e8eaf0] text-[15px] font-medium no-underline hover:border-white/25 hover:bg-white/[0.03] transition-all duration-200 inline-flex items-center justify-center gap-2">
              View pricing
              <ArrowRight className="w-4 h-4 opacity-50 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile: live decision cards (hero visual) */}
          <div className="hero-fade-in hero-fade-d4 sm:hidden px-2 mb-10">
            <MobileDecisionCards />
          </div>

          {/* Desktop: full dashboard with 3D tilt */}
          <div className="hero-fade-in hero-fade-d4 relative max-w-[960px] mx-auto hidden sm:block">
            <div
              ref={dashRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative"
              style={{ perspective: 1400 }}
            >
              <div className="absolute -inset-8 rounded-3xl pointer-events-none z-0 opacity-50"
                style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(245,166,35,0.1) 0%, transparent 60%)", filter: "blur(70px)" }} />

              <div className="dash-entry-tilt relative z-[1]">
                <div
                  className="rounded-2xl overflow-hidden will-change-transform"
                  style={{
                    transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`,
                    transition: "transform 0.2s ease-out",
                    animation: "dashGlow 6s ease-in-out infinite",
                  }}
                >
                  <div className="p-px rounded-2xl bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent">
                    <div className="rounded-2xl overflow-hidden bg-[#0d0f14]">
                      <AnimatedDashboard />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat row — always visible, 2x2 on mobile, 4-col on desktop */}
          <div className="hero-fade-in hero-fade-d4 hero-stat-row max-w-[960px] mx-auto mt-8 sm:mt-14 md:mt-20 grid grid-cols-2 md:grid-cols-4 tabular-nums">
            <div className="hero-stat-cell py-5 md:py-6 px-4 md:px-6">
              <div className="text-[10px] uppercase tracking-[1.6px] text-[#6a6e82] font-medium mb-2">ROAS</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] md:text-[32px] font-semibold text-[#e8eaf0] leading-none">4.2×</span>
                <span className="text-[11px] font-medium text-emerald-400">↑ 0.8</span>
              </div>
            </div>
            <div className="hero-stat-cell py-5 md:py-6 px-4 md:px-6">
              <div className="text-[10px] uppercase tracking-[1.6px] text-[#6a6e82] font-medium mb-2">Cost per lead</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] md:text-[32px] font-semibold text-[#e8eaf0] leading-none">$22</span>
                <span className="text-[11px] font-medium text-emerald-400">↓ $3</span>
              </div>
            </div>
            <div className="hero-stat-cell py-5 md:py-6 px-4 md:px-6">
              <div className="text-[10px] uppercase tracking-[1.6px] text-[#6a6e82] font-medium mb-2">Leads / week</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] md:text-[32px] font-semibold text-[#e8eaf0] leading-none">847</span>
                <span className="text-[11px] font-medium text-emerald-400">↑ 12%</span>
              </div>
            </div>
            <div className="hero-stat-cell py-5 md:py-6 px-4 md:px-6">
              <div className="text-[10px] uppercase tracking-[1.6px] text-[#6a6e82] font-medium mb-2">Saved · 24h</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] md:text-[32px] font-semibold text-[#e8eaf0] leading-none">$340</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar — platform logos */}
        <div className="hero-fade-in hero-fade-d5 relative z-[2] py-10 border-t border-white/[0.04]">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <div className="text-[11px] text-[#5a5e72] uppercase tracking-[3px] font-medium mb-8">Integrates with</div>
            <div className="grid grid-cols-3 md:flex md:justify-center items-center gap-8 md:gap-16 max-w-[300px] md:max-w-none mx-auto opacity-50 hover:opacity-70 transition-opacity duration-500">
              {/* Meta — infinity mark */}
              <svg className="h-5" viewBox="0 0 36 16" fill="white"><path d="M8.14 0C3.73 0 1.2 3.01.29 5.57A18.4 18.4 0 0 0 0 8c0 1.2.13 2.18.29 2.43C1.2 12.99 3.73 16 8.14 16c3.2 0 5.63-1.82 7.86-5.14C18.23 14.18 20.66 16 23.86 16c4.41 0 6.94-3.01 7.85-5.57.16-.25.29-1.23.29-2.43s-.13-2.18-.29-2.43C30.8 3.01 28.27 0 23.86 0c-3.2 0-5.63 1.82-7.86 5.14C13.77 1.82 11.34 0 8.14 0zm0 3c2.08 0 3.9 1.42 5.86 5-1.96 3.58-3.78 5-5.86 5-2.7 0-4.32-2.12-4.88-3.47A13 13 0 0 1 3 8c0-.72.07-1.2.26-1.53C3.82 5.12 5.44 3 8.14 3zm15.72 0c2.7 0 4.32 2.12 4.88 3.47.19.33.26.81.26 1.53s-.07 1.2-.26 1.53c-.56 1.35-2.18 3.47-4.88 3.47-2.08 0-3.9-1.42-5.86-5 1.96-3.58 3.78-5 5.86-5z"/></svg>
              {/* Google */}
              <svg className="h-6" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fillOpacity=".8"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity=".7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fillOpacity=".6"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fillOpacity=".9"/></svg>
              {/* TikTok */}
              <svg className="h-6" viewBox="0 0 448 512" fill="white"><path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0h88a121 121 0 0 0 122.8 121.1z"/></svg>
              {/* Shopify */}
              <svg className="h-7" viewBox="0 0 448 512" fill="white"><path d="M388.3 104.1a4.7 4.7 0 0 0-4.4-4c-2 0-37.2-.8-37.2-.8s-24.4-24.4-27.5-27.2a18.8 18.8 0 0 0-9.3-3.3l-12 369.4L388 404.5s1.8-.5 2.9-1.5a6 6 0 0 0 1.7-4.5c0 0-4.3-294.4-4.3-294.4zM271.4 98.7l-15.6 47.3c-13.3-4-28.6-7.6-44.8-7.4l2.6-17.2c1.7-9.8 4.2-18.7 6.7-25.6 14.3-4.7 33-2.5 51.1 2.9zm-64.3 18.9c-2.5 7.7-5.3 17.6-7.4 29.4l-22.5-5.5 6.8-43.5c9.5-1.1 16.9 5.3 23.1 19.6zm-69.5 4l-13.5 82.7c-11.3-1.7-36.3-4.2-43.3 11.3-8.2 18 25 42.6 27.7 44.3l-12.3 75.5c-5.5-3.5-39-25.5-43.3-68.3-5-49.7 39-91.6 84.7-145.5z"/></svg>
              {/* WhatsApp — phone in speech bubble */}
              <svg className="h-6" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {/* Slack */}
              <svg className="h-6" viewBox="0 0 448 512" fill="white"><path d="M94.1 315.1c0 25.9-21.2 47.1-47.1 47.1S0 341 0 315.1c0-25.9 21.2-47.1 47.1-47.1h47.1v47.1zm23.7 0c0-25.9 21.2-47.1 47.1-47.1s47.1 21.2 47.1 47.1v117.8c0 25.9-21.2 47.1-47.1 47.1s-47.1-21.2-47.1-47.1V315.1zm47.1-189c-25.9 0-47.1-21.2-47.1-47.1S139 32 164.9 32s47.1 21.2 47.1 47.1v47.1H164.9zm0 23.7c25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1H47.1C21.2 244 0 222.8 0 196.9s21.2-47.1 47.1-47.1H164.9zm189 47.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1h-47.1v-47.1zm-23.7 0c0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1V79.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1v117.8zm-47.1 189c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1v-47.1h47.1zm0-23.7c-25.9 0-47.1-21.2-47.1-47.1 0-25.9 21.2-47.1 47.1-47.1h117.8c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1H283.1z"/></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="relative overflow-hidden border-y border-white/[0.04] py-3.5">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#080808] to-transparent z-10 pointer-events-none" />
        <div className="flex animate-ticker" style={{ width: "max-content" }}>
          {tickerItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-8 whitespace-nowrap">
              <span className={item.cls}>{TICKER_ICONS[item.icon]}</span>
              <span className={`text-xs font-medium ${item.cls}`}>{item.text}</span>
              <span className="text-white/[0.06] ml-4">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="py-16 px-6">
        <div className="max-w-[700px] mx-auto grid grid-cols-3 gap-8 max-[480px]:grid-cols-1 max-[480px]:gap-10 max-[480px]:max-w-[260px]">
          <StatCounter value={40} suffix="%" decimal={false} label="avg CPL reduction" />
          <StatCounter value={3.8} suffix="x" decimal={true} label="avg ROAS lift" />
          <StatCounter value={24} suffix="/7" decimal={false} label="always optimizing" />
        </div>
      </div>
    </>
  );
}
