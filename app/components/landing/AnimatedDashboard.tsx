"use client";

import { useEffect, useState, useRef } from "react";

// ── Helpers ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function fmt(n: number) { return n.toLocaleString(); }
function fmtDollar(n: number) { return "$" + n.toLocaleString(); }

function useCountUp(target: number, duration: number, start: boolean, delay: number = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(() => {
      const s = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - s) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(t);
  }, [start, target, duration, delay]);
  return val;
}

export default function AnimatedDashboard() {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Top stats
  // Long slow count — 60-90 seconds, constantly moving
  const spend = useCountUp(491611, 75000, vis);
  const leads = useCountUp(3871, 65000, vis, 1000);
  const attention = useCountUp(6, 15000, vis, 2000);
  const accounts = useCountUp(17, 20000, vis, 3000);

  // Platform stats — start after 5 seconds, count for 60+ seconds
  const metaSpend = useCountUp(491611, 70000, vis, 5000);
  const metaLeads = useCountUp(3871, 60000, vis, 6000);
  const metaRevenue = useCountUp(709560, 80000, vis, 7000);
  const googleSpend = useCountUp(98955, 55000, vis, 8000);
  const googleConv = useCountUp(3660, 50000, vis, 9000);
  const tiktokSpend = useCountUp(56022, 55000, vis, 10000);
  const tiktokConv = useCountUp(4059, 50000, vis, 11000);
  const shopRevenue = useCountUp(55992, 55000, vis, 12000);
  const shopOrders = useCountUp(807, 45000, vis, 13000);

  const alerts = [
    { severity: "critical", icon: "🔴", name: "Crestwood Financial", text: "Spending $69 with zero leads" },
    { severity: "critical", icon: "🔴", name: "Pacific Solar", text: "Spending $98 with zero leads" },
    { severity: "warning", icon: "🟡", name: "Casa Living Co", text: "Ad fatigue — 2 campaigns with frequency >5.8x" },
    { severity: "warning", icon: "🟡", name: "Urban Threads", text: "Ad fatigue — 1 campaign with frequency >5.2x" },
    { severity: "warning", icon: "🟡", name: "Bright Smile Dental", text: "Ad fatigue — 1 campaign with frequency >4.1x" },
  ];

  const recs = [
    { type: "info", title: "Scale opportunity — Summit Roofing", body: '"Storm Season" at $22 CPL. Increase budget 20%.', action: "Scale Budget" },
    { type: "critical", title: "Spending with no leads — Crestwood", body: "$69 spent, 0 leads. Pause top campaign now.", action: "Pause Campaign" },
    { type: "info", title: "Scale opportunity — Peak Supplements", body: "ROAS at 4.2x. +20% budget while signal is strong.", action: "Scale Budget" },
  ];

  const cardBg = "#161820";
  const border = "rgba(255,255,255,0.06)";

  return (
    <div ref={ref} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#e8eaf0" }}>
      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes recPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.3); } 50% { box-shadow: 0 0 0 6px rgba(245,166,35,0); } }
        .mono { font-family: 'DM Mono', 'Fira Mono', monospace; }
      `}</style>

      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${border}`, background: "rgba(255,255,255,0.015)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[9px] text-white/15 tracking-wider">buenaonda.ai</div>
        <div className="w-12" />
      </div>

      {/* ── Nav bar ── */}
      <div className="flex items-center px-3 py-1.5" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-1.5 mr-3">
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[7px] font-black text-white">B</div>
          <span className="text-[10px] font-bold text-white/70">Buena Onda</span>
        </div>
        {["Overview", "Campaigns", "Clients", "Creatives", "Ads", "Reports", "Review", "History", "Team", "Settings"].map((item, i) => (
          <div key={item} className={`px-1.5 py-0.5 rounded text-[8px] mx-[1px] ${i === 0 ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-white/20"}`}>{item}</div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <div className="text-[8px] text-white/25">Covered by Mike ▾</div>
          <div className="text-[8px] text-white/15">?</div>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3" style={{ background: "#0f0f12" }}>

        {/* Greeting + filters */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[14px] font-extrabold text-white/90 tracking-tight">{getGreeting()} 👋</div>
            <div className="text-[9px] text-white/25 mt-0.5">{getToday()} · <span className="text-amber-400">{attention} accounts need attention</span></div>
          </div>
          <div className="flex p-[2px] rounded-md" style={{ background: cardBg, border: `1px solid ${border}` }}>
            {["Today", "7d", "30d", "90d", "Max", "Custom"].map((r, i) => (
              <div key={r} className={`px-2 py-[3px] rounded text-[7px] font-semibold ${i === 3 ? "bg-amber-500 text-white" : "text-white/20"}`}>{r}</div>
            ))}
          </div>
        </div>

        {/* ── 4 Stat cards ── */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="rounded-lg px-3 py-2.5" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1">Total Spend (90d)</div>
            <div className="text-[20px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmtDollar(spend)}</div>
            <div className="text-[8px] text-white/20 mt-1">across 17 accounts</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: cardBg, border: `1px solid rgba(123,140,222,0.25)` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1">Leads (90d)</div>
            <div className="text-[20px] font-extrabold text-[#7b8cde] tracking-tight leading-none mono">{fmt(leads)}</div>
            <div className="text-[8px] text-white/20 mt-1">12 lead gen accounts</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1">Needing Attention</div>
            <div className="text-[20px] font-extrabold text-white/90 tracking-tight leading-none mono">{attention}</div>
            <div className="text-[8px] text-white/20 mt-1">2 critical</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: cardBg, border: `1px solid rgba(245,166,35,0.25)` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1">Accounts Managed</div>
            <div className="text-[20px] font-extrabold text-amber-400 tracking-tight leading-none mono">{accounts}</div>
            <div className="text-[8px] text-white/20 mt-1">across all platforms</div>
          </div>
        </div>

        {/* ── Platform Breakdown ── */}
        <div className="text-[7px] font-semibold text-white/20 uppercase tracking-[1.5px] mb-1.5">Platform Breakdown</div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Meta */}
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1 mb-1"><span className="text-[9px]">📘</span><span className="text-[9px] font-bold text-white/60">Meta</span><span className="text-[6px] px-1 py-[1px] rounded bg-emerald-400/10 text-emerald-400 font-semibold">17 connected</span></div>
            <div className="space-y-0.5 text-[8px]">
              <div className="flex justify-between"><span className="text-white/25">Spend</span><span className="text-white/50 mono">{fmtDollar(metaSpend)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Leads</span><span className="text-[#7b8cde] mono">{fmt(metaLeads)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Revenue</span><span className="text-amber-400 mono">{fmtDollar(metaRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Avg ROAS</span><span className="text-amber-400 mono">3.13x</span></div>
            </div>
          </div>
          {/* Google */}
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1 mb-1"><span className="text-[9px]">🔍</span><span className="text-[9px] font-bold text-white/60">Google</span><span className="text-[6px] px-1 py-[1px] rounded bg-emerald-400/10 text-emerald-400 font-semibold">Connected</span></div>
            <div className="space-y-0.5 text-[8px]">
              <div className="flex justify-between"><span className="text-white/25">Spend</span><span className="text-white/50 mono">{fmtDollar(googleSpend)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Conversions</span><span className="text-[#7b8cde] mono">{fmt(googleConv)}</span></div>
            </div>
          </div>
          {/* TikTok */}
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1 mb-1"><span className="text-[9px]">🎵</span><span className="text-[9px] font-bold text-white/60">TikTok</span><span className="text-[6px] px-1 py-[1px] rounded bg-emerald-400/10 text-emerald-400 font-semibold">Connected</span></div>
            <div className="space-y-0.5 text-[8px]">
              <div className="flex justify-between"><span className="text-white/25">Spend</span><span className="text-white/50 mono">{fmtDollar(tiktokSpend)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Conversions</span><span className="text-amber-400 mono">{fmt(tiktokConv)}</span></div>
            </div>
          </div>
          {/* Shopify */}
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1 mb-1"><span className="text-[9px]">🛍</span><span className="text-[9px] font-bold text-white/60">Shopify</span><span className="text-[6px] px-1 py-[1px] rounded bg-emerald-400/10 text-emerald-400 font-semibold">Connected</span></div>
            <div className="space-y-0.5 text-[8px]">
              <div className="flex justify-between"><span className="text-white/25">Revenue</span><span className="text-amber-400 mono">{fmtDollar(shopRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-white/25">Orders</span><span className="text-amber-400 mono">{fmt(shopOrders)}</span></div>
            </div>
          </div>
        </div>

        {/* ── Alerts + Recommendations ── */}
        <div className="grid grid-cols-[1fr_200px] gap-3">
          {/* Alerts */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[7px] font-semibold text-white/20 uppercase tracking-[1.5px]">Alerts</span>
              <span className="text-[7px] font-bold bg-red-500/20 text-red-400 px-1.5 py-[1px] rounded-full">5</span>
            </div>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5 py-1.5" style={{ borderBottom: `1px solid ${border}`, animation: vis ? `slideInLeft 0.4s ease ${i * 0.08}s both` : "none" }}>
                <span className="text-[8px] mt-0.5 flex-shrink-0">{a.icon}</span>
                <div className="text-[8px] leading-relaxed">
                  <span className={a.severity === "critical" ? "text-red-400 font-semibold" : "text-amber-400 font-semibold"}>{a.name}</span>
                  <span className="text-white/30"> — {a.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[7px] font-semibold text-white/20 uppercase tracking-[1.5px]">Recommendations</span>
              <span className="text-[7px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-[1px] rounded-full">15</span>
            </div>
            {recs.map((r, i) => (
              <div key={i} className="rounded-md px-2 py-1.5 mb-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${border}`, borderLeftWidth: 2, borderLeftColor: r.type === "critical" ? "#f87171" : "#60a5fa", animation: vis ? `slideInLeft 0.4s ease ${0.5 + i * 0.15}s both` : "none" }}>
                <div className="text-[8px] font-semibold text-white/70 mb-0.5">{r.title}</div>
                <div className="text-[7px] text-white/25 mb-1">{r.body}</div>
                <div className="text-[6px] font-bold px-1.5 py-[2px] rounded inline-block" style={{ background: r.type === "critical" ? "rgba(248,113,113,0.12)" : "rgba(96,165,250,0.12)", color: r.type === "critical" ? "#f87171" : "#60a5fa" }}>{r.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating AI button (bottom right) ── */}
      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[12px] cursor-default" style={{ animation: "recPulse 2s ease-in-out infinite", boxShadow: "0 4px 16px rgba(245,166,35,0.3)" }}>
        +
      </div>
    </div>
  );
}
