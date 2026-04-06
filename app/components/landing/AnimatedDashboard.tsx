"use client";

import { useEffect, useState, useRef } from "react";

const METRICS = [
  { label: "Active Campaigns", target: 12, color: "#f5a623", prefix: "" },
  { label: "Ad Spend", target: 47.2, color: "#e8eaf0", prefix: "$", suffix: "k", decimal: true },
  { label: "Leads This Week", target: 847, color: "#4ade80", prefix: "" },
  { label: "Avg CPL", target: 28, color: "#f5a623", prefix: "$" },
  { label: "ROAS", target: 4.2, color: "#4ade80", prefix: "", suffix: "x", decimal: true },
  { label: "Actions Today", target: 34, color: "#60a5fa", prefix: "" },
];

const ALERTS = [
  { text: "CPL spike on Summit Roofing — paused ad set #3", type: "warning", time: "2m ago" },
  { text: "ROAS hit 5.1x on Peak Supplements — scaling budget", type: "success", time: "8m ago" },
  { text: "Creative fatigue detected on Solar Pro — brief generated", type: "info", time: "14m ago" },
];

const CAMPAIGNS = [
  { name: "Summit Roofing — Storm Season", status: "active", spend: "$1,240", cpl: "$26", leads: 48 },
  { name: "Peak Supplements — DPA Retarget", status: "active", spend: "$890", cpl: "$18", leads: 49 },
  { name: "Metro HVAC — Emergency AC", status: "scaling", spend: "$2,100", cpl: "$31", leads: 68 },
  { name: "Volt Electric — EV Charger", status: "active", spend: "$640", cpl: "$42", leads: 15 },
];

export default function AnimatedDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState(METRICS.map(() => 0));
  const [alertIdx, setAlertIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Count up animation
  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCounts(METRICS.map(m => m.decimal ? Math.round(ease * m.target * 10) / 10 : Math.round(ease * m.target)));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible]);

  // Cycle alerts
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS.length), 3000);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Live increment after initial count
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      const live = setInterval(() => {
        setCounts(prev => {
          const next = [...prev];
          const idx = Math.floor(Math.random() * METRICS.length);
          if (METRICS[idx].decimal) next[idx] = Math.round((next[idx] + 0.1) * 10) / 10;
          else next[idx] = next[idx] + 1;
          return next;
        });
      }, 2500);
      return () => clearInterval(live);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const alert = ALERTS[alertIdx];

  return (
    <div ref={ref}>
      <style>{`
        @keyframes alertSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .alert-slide { animation: alertSlide 0.4s ease both; }
      `}</style>

      {/* macOS title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[10px] text-white/20 tracking-wider font-medium">buenaonda.ai — Dashboard</div>
        <div className="w-[50px]" />
      </div>

      <div className="flex min-h-[380px]">
        {/* Sidebar */}
        <div className="w-[160px] border-r border-white/[0.06] p-3 bg-black/20 hidden md:block">
          {[
            { label: "Overview", active: true },
            { label: "Campaigns" },
            { label: "Creatives" },
            { label: "Reports" },
            { label: "Settings" },
          ].map((item, i) => (
            <div key={i} className={`px-3 py-2 rounded-md text-[11px] font-medium mb-0.5 ${item.active ? "bg-amber-500/12 text-amber-400" : "text-white/30"}`}>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Alert banner */}
          <div key={alertIdx} className="alert-slide mb-3 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2" style={{
            background: alert.type === "warning" ? "rgba(245,166,35,0.08)" : alert.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(96,165,250,0.08)",
            border: `1px solid ${alert.type === "warning" ? "rgba(245,166,35,0.15)" : alert.type === "success" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)"}`,
          }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
              background: alert.type === "warning" ? "#f5a623" : alert.type === "success" ? "#4ade80" : "#60a5fa",
            }} />
            <span className={alert.type === "warning" ? "text-amber-300" : alert.type === "success" ? "text-emerald-300" : "text-blue-300"}>{alert.text}</span>
            <span className="ml-auto text-white/20 text-[10px] flex-shrink-0">{alert.time}</span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {METRICS.map((m, i) => (
              <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <div className="text-[18px] font-bold tracking-tight leading-none mb-1" style={{ color: m.color }}>
                  {m.prefix}{m.decimal ? counts[i].toFixed(1) : counts[i].toLocaleString()}{m.suffix || ""}
                </div>
                <div className="text-[9px] text-white/30 font-medium uppercase tracking-wider">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Campaign table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_0.6fr_0.8fr_0.6fr_0.5fr] px-3 py-2 border-b border-white/[0.06]">
              {["Campaign", "Status", "Spend", "CPL", "Leads"].map(h => (
                <div key={h} className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{h}</div>
              ))}
            </div>
            {CAMPAIGNS.map((c, i) => (
              <div key={i} className="grid grid-cols-[2fr_0.6fr_0.8fr_0.6fr_0.5fr] px-3 py-2.5 border-b border-white/[0.04] last:border-b-0 items-center" style={{ animation: isVisible ? `fade-up 0.5s ease ${0.8 + i * 0.15}s both` : "none" }}>
                <div className="text-[11px] text-white/70 font-medium truncate pr-2">{c.name}</div>
                <div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${c.status === "scaling" ? "bg-emerald-400/15 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>{c.status}</span>
                </div>
                <div className="text-[11px] text-white/50">{c.spend}</div>
                <div className="text-[11px] text-white/50">{c.cpl}</div>
                <div className="text-[11px] text-white/70 font-semibold">{c.leads}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
