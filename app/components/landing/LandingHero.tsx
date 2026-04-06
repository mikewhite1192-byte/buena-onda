"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Zap, Pause, Clock, RefreshCw, TrendingUp, Target, BarChart3, MessageSquare, OctagonX, CheckCircle2 } from "lucide-react";

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
  const dashRef = useRef<HTMLDivElement>(null);

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
          25% { background-position: 100% 50%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 0% 0%; }
        }
        @keyframes dashFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dashGlow {
          0%, 100% { box-shadow: 0 40px 100px -20px rgba(245,166,35,0.15), 0 0 0 1px rgba(255,255,255,0.06); }
          50% { box-shadow: 0 40px 100px -20px rgba(245,166,35,0.25), 0 0 0 1px rgba(255,255,255,0.1); }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-60px, 40px) scale(1.1); }
          50% { transform: translate(-30px, -30px) scale(0.95); }
          75% { transform: translate(40px, 20px) scale(1.05); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -40px) scale(1.08); }
          66% { transform: translate(-40px, 30px) scale(0.92); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(30px, -50px) scale(1.12); }
          40% { transform: translate(-50px, -20px) scale(0.95); }
          60% { transform: translate(20px, 40px) scale(1.05); }
          80% { transform: translate(-30px, 10px) scale(0.98); }
        }
        .hero-fade-in { animation: fade-up 1s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-fade-d1 { animation-delay: 0.1s; }
        .hero-fade-d2 { animation-delay: 0.3s; }
        .hero-fade-d3 { animation-delay: 0.5s; }
        .hero-fade-d4 { animation-delay: 0.7s; }
        .hero-fade-d5 { animation-delay: 0.9s; }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0d0f14]">

        {/* ── Stripe-style animated gradient blobs ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary blob — amber/orange, top right */}
          <div className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
            style={{
              top: "-10%", right: "-5%",
              background: "radial-gradient(circle, rgba(245,166,35,0.5) 0%, rgba(247,107,28,0.3) 40%, transparent 70%)",
              animation: "blob1 12s ease-in-out infinite",
            }} />
          {/* Secondary blob — deep orange, bottom left */}
          <div className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-[100px]"
            style={{
              bottom: "0%", left: "-5%",
              background: "radial-gradient(circle, rgba(247,107,28,0.4) 0%, rgba(245,166,35,0.2) 50%, transparent 70%)",
              animation: "blob2 15s ease-in-out infinite",
            }} />
          {/* Accent blob — warm gold, center */}
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
            style={{
              top: "30%", left: "40%",
              background: "radial-gradient(circle, rgba(255,200,50,0.3) 0%, transparent 60%)",
              animation: "blob3 18s ease-in-out infinite",
            }} />
          {/* Cool accent — subtle blue, top left for contrast */}
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.07] blur-[80px]"
            style={{
              top: "5%", left: "10%",
              background: "radial-gradient(circle, rgba(100,150,255,0.4) 0%, transparent 60%)",
              animation: "blob2 20s ease-in-out infinite reverse",
            }} />
        </div>

        {/* Content */}
        <div className="relative z-[2] max-w-[1100px] mx-auto px-6 pt-44 pb-16">

          {/* Headline — massive, confident, single statement */}
          <div className="max-w-[900px] mx-auto text-center mb-6">
            <h1 className="hero-fade-in hero-fade-d1 text-[clamp(48px,8vw,96px)] font-extrabold leading-[0.95] tracking-[-3px] text-[#e8eaf0]">
              Your ads managed by
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"> AI that never sleeps</span>
            </h1>
          </div>

          {/* Subheadline — one clean line */}
          <p className="hero-fade-in hero-fade-d2 text-center text-lg md:text-xl text-[#8b8fa8] max-w-[600px] mx-auto mb-10 leading-relaxed">
            Launch, optimize, and report on Meta, Google, and TikTok campaigns — autonomously. Like a senior media buyer, around the clock.
          </p>

          {/* CTAs — clean, two options */}
          <div className="hero-fade-in hero-fade-d3 flex gap-4 justify-center mb-20">
            <a href="/demo"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-base font-bold no-underline shadow-[0_4px_30px_rgba(245,166,35,0.3)] hover:shadow-[0_8px_40px_rgba(245,166,35,0.4)] hover:-translate-y-0.5 transition-all duration-300">
              Try the live demo
            </a>
            <Link href="/#pricing"
              className="px-8 py-4 rounded-full border border-white/15 text-[#e8eaf0] text-base font-medium no-underline hover:border-white/30 hover:bg-white/[0.03] transition-all duration-300">
              View pricing
            </Link>
          </div>

          {/* Dashboard — floating 3D with tilt */}
          <div
            ref={dashRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="hero-fade-in hero-fade-d4 relative max-w-[960px] mx-auto"
            style={{ perspective: 1200 }}
          >
            {/* Glow behind */}
            <div className="absolute -inset-8 rounded-3xl pointer-events-none z-0 opacity-60"
              style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(245,166,35,0.12) 0%, transparent 60%)", filter: "blur(60px)" }} />

            {/* Dashboard */}
            <div
              className="relative z-[1] rounded-2xl overflow-hidden will-change-transform"
              style={{
                transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`,
                transition: "transform 0.12s ease-out",
                animation: "dashGlow 5s ease-in-out infinite",
              }}
            >
              {/* Gradient border effect */}
              <div className="p-px rounded-2xl bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent">
                <div className="rounded-2xl overflow-hidden bg-[#0d0f14]">
                  <img
                    src="/brand/dashboard-screenshot.png"
                    alt="Buena Onda dashboard showing live campaign metrics, platform breakdown, alerts, and AI recommendations"
                    className="w-full block"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar — platform logos */}
        <div className="hero-fade-in hero-fade-d5 relative z-[2] py-10 border-t border-white/[0.04]">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <div className="text-[11px] text-[#5a5e72] uppercase tracking-[3px] font-medium mb-8">Integrates with</div>
            <div className="flex justify-center items-center gap-12 md:gap-16 flex-wrap opacity-50 hover:opacity-70 transition-opacity duration-500">
              {/* Meta — infinity mark */}
              <svg className="h-5" viewBox="0 0 36 16" fill="white"><path d="M8.14 0C3.73 0 1.2 3.01.29 5.57A18.4 18.4 0 0 0 0 8c0 1.2.13 2.18.29 2.43C1.2 12.99 3.73 16 8.14 16c3.2 0 5.63-1.82 7.86-5.14C18.23 14.18 20.66 16 23.86 16c4.41 0 6.94-3.01 7.85-5.57.16-.25.29-1.23.29-2.43s-.13-2.18-.29-2.43C30.8 3.01 28.27 0 23.86 0c-3.2 0-5.63 1.82-7.86 5.14C13.77 1.82 11.34 0 8.14 0zm0 3c2.08 0 3.9 1.42 5.86 5-1.96 3.58-3.78 5-5.86 5-2.7 0-4.32-2.12-4.88-3.47A13 13 0 0 1 3 8c0-.72.07-1.2.26-1.53C3.82 5.12 5.44 3 8.14 3zm15.72 0c2.7 0 4.32 2.12 4.88 3.47.19.33.26.81.26 1.53s-.07 1.2-.26 1.53c-.56 1.35-2.18 3.47-4.88 3.47-2.08 0-3.9-1.42-5.86-5 1.96-3.58 3.78-5 5.86-5z"/></svg>
              {/* Google */}
              <svg className="h-6" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fillOpacity=".8"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity=".7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fillOpacity=".6"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fillOpacity=".9"/></svg>
              {/* TikTok */}
              <svg className="h-6" viewBox="0 0 448 512" fill="white"><path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0h88a121 121 0 0 0 122.8 121.1z"/></svg>
              {/* Shopify */}
              <svg className="h-7" viewBox="0 0 448 512" fill="white"><path d="M388.3 104.1a4.7 4.7 0 0 0-4.4-4c-2 0-37.2-.8-37.2-.8s-24.4-24.4-27.5-27.2a18.8 18.8 0 0 0-9.3-3.3l-12 369.4L388 404.5s1.8-.5 2.9-1.5a6 6 0 0 0 1.7-4.5c0 0-4.3-294.4-4.3-294.4zM271.4 98.7l-15.6 47.3c-13.3-4-28.6-7.6-44.8-7.4l2.6-17.2c1.7-9.8 4.2-18.7 6.7-25.6 14.3-4.7 33-2.5 51.1 2.9zm-64.3 18.9c-2.5 7.7-5.3 17.6-7.4 29.4l-22.5-5.5 6.8-43.5c9.5-1.1 16.9 5.3 23.1 19.6zm-69.5 4l-13.5 82.7c-11.3-1.7-36.3-4.2-43.3 11.3-8.2 18 25 42.6 27.7 44.3l-12.3 75.5c-5.5-3.5-39-25.5-43.3-68.3-5-49.7 39-91.6 84.7-145.5z"/></svg>
              {/* WhatsApp */}
              <svg className="h-6" viewBox="0 0 448 512" fill="white"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/></svg>
              {/* Slack */}
              <svg className="h-6" viewBox="0 0 448 512" fill="white"><path d="M94.1 315.1c0 25.9-21.2 47.1-47.1 47.1S0 341 0 315.1c0-25.9 21.2-47.1 47.1-47.1h47.1v47.1zm23.7 0c0-25.9 21.2-47.1 47.1-47.1s47.1 21.2 47.1 47.1v117.8c0 25.9-21.2 47.1-47.1 47.1s-47.1-21.2-47.1-47.1V315.1zm47.1-189c-25.9 0-47.1-21.2-47.1-47.1S139 32 164.9 32s47.1 21.2 47.1 47.1v47.1H164.9zm0 23.7c25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1H47.1C21.2 244 0 222.8 0 196.9s21.2-47.1 47.1-47.1H164.9zm189 47.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1h-47.1v-47.1zm-23.7 0c0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1V79.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1v117.8zm-47.1 189c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1v-47.1h47.1zm0-23.7c-25.9 0-47.1-21.2-47.1-47.1 0-25.9 21.2-47.1 47.1-47.1h117.8c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1H283.1z"/></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="relative overflow-hidden border-y border-white/[0.04] bg-[#0d0f14] py-3.5">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0d0f14] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0d0f14] to-transparent z-10 pointer-events-none" />
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
      <div className="bg-[#0d0f14] py-16 px-6">
        <div className="max-w-[700px] mx-auto grid grid-cols-3 gap-8 max-[480px]:grid-cols-1 max-[480px]:gap-10 max-[480px]:max-w-[260px]">
          <StatCounter value={40} suffix="%" decimal={false} label="avg CPL reduction" />
          <StatCounter value={3.8} suffix="x" decimal={true} label="avg ROAS lift" />
          <StatCounter value={24} suffix="/7" decimal={false} label="always optimizing" />
        </div>
      </div>
    </>
  );
}
