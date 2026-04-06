"use client";

import { useEffect, useState, useRef } from "react";

function fmt(n: number) { return Math.round(n).toLocaleString(); }
function fmtDollar(n: number) { return "$" + Math.round(n).toLocaleString(); }

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

function useTypewriter(text: string, start: boolean, delay: number, speed: number = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start) return;
    let i = 0;
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [start, text, delay, speed]);
  return { displayed, done };
}

const AI_TEXT = `Casa Living Co — Meta Ads Performance Report

Period: March 19–26, 2026

---

## Executive Summary

Casa Living Co generated $8,100 in purchase revenue from $2,475.20 in spend, delivering a 3.27x ROAS and 98 purchases at a $25.26 CPA across two active campaigns. The Broad Furniture campaign carried the majority of spend and volume, outperforming the Retargeting campaign on efficiency. The primary risk this period is audience fatigue, with average frequency hitting 6.00 across 285,760 impressions — a threshold that typically signals diminishing returns.`;

export default function AnimatedReport() {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dur = 90000;
  const spend = useCountUp(2475, dur, vis);
  const revenue = useCountUp(8100, dur, vis, 500);
  const roas = useCountUp(3.27, dur, vis, 1000);
  const purchases = useCountUp(98, dur, vis, 1500);
  const impressions = useCountUp(285760, dur, vis, 2000);
  const frequency = useCountUp(6.00, dur, vis, 2500);
  const ctrVal = useCountUp(2.49, dur, vis, 3000);
  const campaigns = useCountUp(2, dur, vis, 3500);

  const { displayed: aiText, done: aiDone } = useTypewriter(AI_TEXT, vis, 4000, 16);

  const cardBg = "#161820";
  const border = "rgba(255,255,255,0.06)";
  const amber = "#f5a623";

  return (
    <div ref={ref} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#e8eaf0" }}>
      <style>{`
        @keyframes recPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.3); } 50% { box-shadow: 0 0 0 6px rgba(245,166,35,0); } }
        @keyframes chatBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
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
          <div key={item} className={`px-1.5 py-0.5 rounded text-[8px] mx-[1px] sans ${item === "Reports" ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-white/20"}`}>{item}</div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <div className="text-[8px] text-white/25 sans">Casa Living Co ▾</div>
          <div className="text-[8px] text-white/15">?</div>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3" style={{ background: "#0f0f12" }}>
        <div className="mx-auto rounded-xl px-5 py-4" style={{ background: "#13131a", maxWidth: 680 }}>

          {/* Print button + badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="px-2 py-[3px] rounded-full text-[7px] font-bold uppercase tracking-wider sans" style={{ background: "rgba(245,166,35,0.12)", color: amber }}>
              Performance Report
            </div>
            <div className="flex items-center gap-1 px-2 py-[3px] rounded text-[7px] text-white/20 sans" style={{ border: `1px solid ${border}` }}>
              <span className="text-[8px]">🖨</span> Print / PDF
            </div>
          </div>

          {/* Client name + date range */}
          <div className="mb-4">
            <div className="text-[18px] font-extrabold text-white/95 tracking-tight sans">Casa Living Co</div>
            <div className="text-[9px] text-white/25 mt-0.5 mono">2026-03-19 → 2026-03-26</div>
          </div>

          {/* Top row — 4 stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Total Spend</div>
              <div className="text-[16px] font-extrabold tracking-tight leading-none mono" style={{ color: amber }}>{fmtDollar(spend)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Revenue</div>
              <div className="text-[16px] font-extrabold text-emerald-400 tracking-tight leading-none mono">{fmtDollar(revenue)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">ROAS</div>
              <div className="text-[16px] font-extrabold tracking-tight leading-none mono" style={{ color: amber }}>{roas.toFixed(2)}x</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Purchases</div>
              <div className="text-[16px] font-extrabold text-[#7b8cde] tracking-tight leading-none mono">{fmt(purchases)}</div>
            </div>
          </div>

          {/* Bottom row — 4 stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Impressions</div>
              <div className="text-[16px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmt(impressions)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Avg Frequency</div>
              <div className="text-[16px] font-extrabold tracking-tight leading-none mono" style={{ color: amber }}>{frequency.toFixed(2)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Avg CTR</div>
              <div className="text-[16px] font-extrabold text-white/40 tracking-tight leading-none mono">{ctrVal.toFixed(2)}%</div>
            </div>
            <div className="rounded-lg px-2.5 py-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="text-[6px] text-white/25 uppercase tracking-wider font-medium mb-1 sans">Campaigns</div>
              <div className="text-[16px] font-extrabold text-white/90 tracking-tight leading-none mono">{fmt(campaigns)}</div>
            </div>
          </div>

          {/* AI ANALYSIS section */}
          <div className="rounded-lg px-3 py-3" style={{ background: cardBg, border: `1px solid ${border}`, borderLeft: `3px solid ${amber}` }}>
            <div className="text-[7px] font-bold uppercase tracking-[1.5px] mb-2 sans" style={{ color: amber }}>AI Analysis</div>
            <div className="text-[8px] text-white/60 leading-relaxed sans whitespace-pre-wrap">
              {aiText.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <div key={i} className="text-[9px] font-bold text-white/80 mt-2 mb-1 sans">{line.replace("## ", "")}</div>;
                if (line === "---") return <div key={i} className="my-1.5" style={{ borderTop: `1px solid ${border}` }} />;
                if (line.startsWith("Period:")) return <div key={i} className="text-[8px] font-bold text-white/50 sans">{line}</div>;
                if (i === 0 && line) return <div key={i} className="text-[10px] font-bold text-white/80 mb-0.5 sans">{line}</div>;
                return <span key={i}>{line}{"\n"}</span>;
              })}
              {!aiDone && <span className="inline-block w-[4px] h-[10px] ml-[1px] align-middle" style={{ background: amber, animation: "blink 0.8s step-end infinite" }} />}
            </div>
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
