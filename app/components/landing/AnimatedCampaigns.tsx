"use client";

import { useEffect, useState, useRef } from "react";

// ── Helpers ──
function fmt(n: number) { return n.toLocaleString(); }
function fmtDollar(n: number) { return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPct(n: number) { return n.toFixed(2) + "%"; }

function useCountUp(target: number, duration: number, start: boolean, delay: number = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(() => {
      const s = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - s) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(ease * target);
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(t);
  }, [start, target, duration, delay]);
  return val;
}

function useCountDown(from: number, to: number, duration: number, start: boolean, delay: number = 0) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    if (!start) return;
    const t = setTimeout(() => {
      const s = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - s) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(from - ease * (from - to));
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(t);
  }, [start, from, to, duration, delay]);
  return val;
}

const CAMPAIGNS = [
  { name: "Apex HVAC | Homeowners | AC Leads", id: "demo_h_001", spend: 3159.52, leads: 109, cpl: 28.99, ctr: 2.60, freq: 2, impr: 285572, reach: 0 },
  { name: "Apex HVAC | Retargeting | Hot Summer", id: "demo_h_002", spend: 2059.33, leads: 82, cpl: 25.11, ctr: 4.10, freq: 3.3, impr: 122388, reach: 0 },
];

export default function AnimatedCampaigns() {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 90-second countups from 0
  const dur = 90000;
  const spend = useCountUp(5218.85, dur, vis);
  const leads = useCountUp(191, dur, vis, 500);
  const cpl = useCountDown(30, 27.32, dur, vis, 1000);
  const ctr = useCountUp(3.35, dur, vis, 1500);
  const freq = useCountUp(2.65, dur, vis, 2000);

  // Campaign row values
  const r1spend = useCountUp(3159.52, dur, vis, 3000);
  const r1leads = useCountUp(109, dur, vis, 3500);
  const r1cpl = useCountDown(30, 28.99, dur, vis, 4000);
  const r1ctr = useCountUp(2.60, dur, vis, 4500);
  const r1impr = useCountUp(285572, dur, vis, 5000);

  const r2spend = useCountUp(2059.33, dur, vis, 3100);
  const r2leads = useCountUp(82, dur, vis, 3600);
  const r2cpl = useCountDown(30, 25.11, dur, vis, 4100);
  const r2ctr = useCountUp(4.10, dur, vis, 4600);
  const r2impr = useCountUp(122388, dur, vis, 5100);

  const cardBg = "#161820";
  const border = "rgba(255,255,255,0.06)";
  const amber = "#f5a623";

  return (
    <div ref={ref} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#e8eaf0" }}>
      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes rowSlideIn { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes recPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.3); } 50% { box-shadow: 0 0 0 6px rgba(245,166,35,0); } }
        @keyframes chatBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .mono { font-family: 'DM Mono', 'Fira Mono', monospace; }
        .sans { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; }
      `}</style>

      {/* ── Title bar (macOS dots) ── */}
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
          <span className="text-[10px] font-bold text-white/70 sans">Buena Onda</span>
        </div>
        {["Overview", "Campaigns", "Clients", "Creatives", "Ads", "Reports", "Review", "History", "Team", "Settings"].map((item) => (
          <div key={item} className={`px-1.5 py-0.5 rounded text-[8px] mx-[1px] sans ${item === "Campaigns" ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-white/20"}`}>{item}</div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <div className="text-[8px] text-white/25 sans">Apex HVAC Services ▾</div>
          <div className="text-[8px] text-white/15">?</div>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3" style={{ background: "#0f0f12" }}>

        {/* Title + time filters */}
        <div className="flex items-end justify-between mb-2.5">
          <div>
            <div className="text-[16px] font-extrabold tracking-tight sans" style={{ color: amber }}>Campaigns</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[8px] text-white/25 sans">Live performance &middot; Campaign &rarr; Ad Set &rarr; Ad</span>
              <span className="text-[7px] text-white/15 ml-1">&#8635;</span>
              <span className="text-[7px] text-white/15 mono">Updated 08:31 PM</span>
            </div>
          </div>
          <div className="flex p-[2px] rounded-md" style={{ background: cardBg, border: `1px solid ${border}` }}>
            {["1D", "7D", "30D", "90D", "MAX", "Custom"].map((r) => (
              <div key={r} className={`px-2 py-[3px] rounded text-[7px] font-semibold sans ${r === "30D" ? "text-amber-400" : "text-white/20"}`}
                   style={r === "30D" ? { border: `1px solid ${amber}` } : undefined}>{r}</div>
            ))}
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex items-center gap-3 mb-3" style={{ borderBottom: `1px solid ${border}` }}>
          {[
            { name: "Meta", icon: "📘", active: true },
            { name: "Google", icon: "🔍", active: false },
            { name: "TikTok", icon: "🎵", active: false },
            { name: "Shopify", icon: "🛍", active: false },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-1 pb-1.5 px-1" style={p.active ? { borderBottom: "2px solid #3b82f6" } : undefined}>
              <span className="text-[8px]">{p.icon}</span>
              <span className={`text-[8px] font-semibold sans ${p.active ? "text-white/80" : "text-white/20"}`}>{p.name}</span>
            </div>
          ))}
        </div>

        {/* PERFORMANCE label */}
        <div className="text-[7px] font-semibold text-white/20 uppercase tracking-[1.5px] mb-1.5 sans">Performance</div>

        {/* 5 Stat cards */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Amount Spent</div>
            <div className="text-[18px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmtDollar(spend)}</div>
            <div className="text-[7px] text-white/15 mt-0.5 sans">30d window</div>
          </div>
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Leads</div>
            <div className="text-[18px] font-extrabold text-[#7b8cde] tracking-tight leading-none mono">{fmt(Math.round(leads))}</div>
          </div>
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Cost Per Lead</div>
            <div className="text-[18px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmtDollar(cpl)}</div>
          </div>
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">CTR (ALL)</div>
            <div className="text-[18px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmtPct(ctr)}</div>
          </div>
          <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-[7px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Frequency</div>
            <div className="text-[18px] font-extrabold text-white/90 tracking-tight leading-none mono">{freq.toFixed(2)}</div>
            <div className="text-[7px] text-emerald-400/70 mt-0.5 sans">ok</div>
          </div>
        </div>

        {/* Show Charts button */}
        <div className="mb-2.5">
          <div className="inline-flex items-center gap-1 px-2 py-[3px] rounded text-[7px] text-white/25 sans" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <span className="text-[8px]">📊</span> Show Charts
          </div>
        </div>

        {/* Search + sort bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-[3px] rounded text-[8px] text-white/15 sans" style={{ background: cardBg, border: `1px solid ${border}`, minWidth: 120 }}>
              <span className="text-[8px]">🔍</span> Search campaigns...
            </div>
            <div className="flex p-[1px] rounded" style={{ background: cardBg, border: `1px solid ${border}` }}>
              {["SPEND", "LEADS", "CPL", "CTR", "FREQUENCY"].map((s) => (
                <div key={s} className={`px-1.5 py-[2px] rounded text-[6px] font-bold sans ${s === "SPEND" ? "text-amber-400" : "text-white/15"}`}
                     style={s === "SPEND" ? { border: `1px solid ${amber}` } : undefined}>{s}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-[3px] rounded text-[7px] text-white/20 sans" style={{ background: cardBg, border: `1px solid ${border}` }}>
            Columns (10) ▾
          </div>
        </div>

        {/* Campaign count */}
        <div className="text-[8px] text-white/20 mb-1.5 sans">2 campaigns</div>

        {/* Campaign table */}
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
          {/* Header row */}
          <div className="grid gap-0" style={{
            gridTemplateColumns: "minmax(180px, 1.5fr) repeat(8, 1fr)",
            background: "rgba(255,255,255,0.02)",
            borderBottom: `1px solid ${border}`,
          }}>
            {["CAMPAIGN", "AMOUNT SPENT", "LEADS", "COST PER LEAD", "CTR (ALL)", "FREQUENCY", "IMPRESSIONS", "REACH", "CPM"].map((col) => (
              <div key={col} className="px-2 py-1.5 text-[6px] font-bold text-white/15 uppercase tracking-wider sans">{col}</div>
            ))}
          </div>

          {/* Row 1 */}
          <div className="grid gap-0 items-center" style={{
            gridTemplateColumns: "minmax(180px, 1.5fr) repeat(8, 1fr)",
            borderBottom: `1px solid ${border}`,
            animation: vis ? "rowSlideIn 0.5s ease 0.2s both" : "none",
          }}>
            <div className="px-2 py-2">
              <div className="flex items-center gap-1">
                <span className="text-[6px] text-white/15">&#9654;</span>
                <div>
                  <div className="text-[8px] font-bold text-white/80 sans">{CAMPAIGNS[0].name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[6px] text-white/15 mono">{CAMPAIGNS[0].id}</span>
                    <span className="text-[5px] px-1 py-[1px] rounded bg-emerald-400/15 text-emerald-400 font-bold uppercase sans">Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 py-2 text-[9px] font-bold mono" style={{ color: amber }}>{fmtDollar(r1spend)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmt(Math.round(r1leads))}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmtDollar(r1cpl)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmtPct(r1ctr)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{Math.round(useCountUp(2, dur, vis, 5000))}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmt(Math.round(r1impr))}</div>
            <div className="px-2 py-2 text-[9px] text-white/10">—</div>
            <div className="px-2 py-2 text-[9px] text-white/10">—</div>
          </div>

          {/* Row 2 */}
          <div className="grid gap-0 items-center" style={{
            gridTemplateColumns: "minmax(180px, 1.5fr) repeat(8, 1fr)",
            animation: vis ? "rowSlideIn 0.5s ease 0.3s both" : "none",
          }}>
            <div className="px-2 py-2">
              <div className="flex items-center gap-1">
                <span className="text-[6px] text-white/15">&#9654;</span>
                <div>
                  <div className="text-[8px] font-bold text-white/80 sans">{CAMPAIGNS[1].name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[6px] text-white/15 mono">{CAMPAIGNS[1].id}</span>
                    <span className="text-[5px] px-1 py-[1px] rounded bg-emerald-400/15 text-emerald-400 font-bold uppercase sans">Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 py-2 text-[9px] font-bold mono" style={{ color: amber }}>{fmtDollar(r2spend)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmt(Math.round(r2leads))}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmtDollar(r2cpl)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmtPct(r2ctr)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{(useCountUp(3.3, dur, vis, 5100)).toFixed(1)}</div>
            <div className="px-2 py-2 text-[9px] text-white/60 mono">{fmt(Math.round(r2impr))}</div>
            <div className="px-2 py-2 text-[9px] text-white/10">—</div>
            <div className="px-2 py-2 text-[9px] text-white/10">—</div>
          </div>
        </div>
      </div>

      {/* ── Floating + button ── */}
      <div className="absolute bottom-3 right-12 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-[12px] font-bold text-[#0d0f14] cursor-default" style={{ animation: "recPulse 2s ease-in-out infinite", boxShadow: "0 4px 16px rgba(245,166,35,0.3)" }}>
        +
      </div>

      {/* ── Floating chat bubble ── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1.5 rounded-full cursor-default" style={{ background: cardBg, border: `1px solid ${border}`, animation: "chatBounce 3s ease-in-out infinite" }}>
        <span className="text-[10px]">💡</span>
        <span className="text-[7px] text-white/30 sans">What do you want to see?</span>
      </div>
    </div>
  );
}
