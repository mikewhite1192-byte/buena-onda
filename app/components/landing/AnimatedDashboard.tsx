"use client";

import { useEffect, useState, useRef } from "react";

// Matches the real Buena Onda dashboard layout
const CLIENTS = [
  { name: "Summit Roofing", vertical: "leads", status: "healthy", spend: 2840, leads: 96, cpl: 29.6, roas: 0, frequency: 2.1, campaigns: 3, statusColor: "#4ade80" },
  { name: "Peak Supplements", vertical: "ecomm", status: "scaling", spend: 4200, leads: 0, cpl: 0, roas: 4.2, frequency: 1.8, campaigns: 5, purchases: 127, revenue: 17640, statusColor: "#f5a623" },
  { name: "Metro HVAC", vertical: "leads", status: "warning", spend: 1650, leads: 28, cpl: 58.9, roas: 0, frequency: 3.4, campaigns: 2, statusColor: "#f5a623" },
];

const RECOMMENDATIONS = [
  { type: "critical", icon: "🚨", title: "CPL spike — Metro HVAC", body: '"Emergency AC" campaign CPL jumped to $67. Pause to stop budget bleed.', action: "Pause Campaign" },
  { type: "info", icon: "📈", title: "Scale opportunity — Summit", body: '"Storm Season" at $22 CPL. Increase budget 20% to capture more leads.', action: "Increase Budget" },
  { type: "warning", icon: "😴", title: "Creative fatigue — Peak Supps", body: '"Protein Bundle" ad at 4.1x frequency. Rotate creative before performance drops.', action: "Pause Campaign" },
];

const ALERTS = [
  { text: "Budget scaled +20% on Summit Roofing — CPL dropped to $22", color: "#4ade80" },
  { text: "2:14am — CPL spike caught on Metro HVAC, ad set paused automatically", color: "#f5a623" },
  { text: "Peak Supplements ROAS hit 4.2x — budget increased", color: "#4ade80" },
  { text: "Creative fatigue detected on Peak Supplements — brief generated", color: "#60a5fa" },
];

export default function AnimatedDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ spend: 0, leads: 0, roas: 0, campaigns: 0 });
  const [alertIdx, setAlertIdx] = useState(0);
  const [recVisible, setRecVisible] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Count up
  useEffect(() => {
    if (!isVisible) return;
    const targets = { spend: 8690, leads: 124, roas: 4.2, campaigns: 10 };
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setStats({ spend: Math.round(ease * targets.spend), leads: Math.round(ease * targets.leads), roas: Math.round(ease * targets.roas * 10) / 10, campaigns: Math.round(ease * targets.campaigns) });
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible]);

  // Cycle alerts
  useEffect(() => { if (!isVisible) return; const t = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS.length), 3500); return () => clearInterval(t); }, [isVisible]);

  // Stagger recommendation reveals
  useEffect(() => { if (!isVisible) return; const t = setInterval(() => setRecVisible(v => Math.min(v + 1, RECOMMENDATIONS.length)), 800); return () => clearInterval(t); }, [isVisible]);

  // Live increment
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => {
      const live = setInterval(() => { setStats(prev => ({ ...prev, leads: prev.leads + 1, spend: prev.spend + Math.floor(Math.random() * 20 + 5) })); }, 3000);
      return () => clearInterval(live);
    }, 2500);
    return () => clearTimeout(t);
  }, [isVisible]);

  const alert = ALERTS[alertIdx];

  return (
    <div ref={ref}>
      <style>{`
        @keyframes alertPulse { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes recSlide { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes barGrow { from { width: 0; } }
      `}</style>

      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[10px] text-white/20 tracking-wider">buenaonda.ai — Agency Dashboard</div>
        <div className="w-12" />
      </div>

      {/* Nav bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[8px] font-black text-white">B</div>
          <span className="text-[11px] font-bold text-white/80">Buena Onda</span>
        </div>
        {["Overview", "Campaigns", "Clients", "Creatives", "Reports"].map((item, i) => (
          <div key={item} className={`px-2.5 py-1 rounded text-[10px] ${i === 0 ? "bg-amber-500/12 text-amber-400 font-semibold" : "text-white/30"}`}>{item}</div>
        ))}
      </div>

      <div className="p-4 min-h-[340px]">
        {/* Alert banner */}
        <div key={alertIdx} className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 bg-white/[0.03] border border-white/[0.06]" style={{ animation: "alertPulse 0.4s ease both" }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: alert.color }} />
          <span className="text-[10px] text-white/60 flex-1">{alert.text}</span>
          <span className="text-[9px] text-white/20 flex-shrink-0">Just now</span>
        </div>

        {/* Overview stats */}
        <div className="text-[9px] font-bold text-amber-400 tracking-[1.5px] uppercase mb-2">Overview</div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Total Spend", value: `$${stats.spend.toLocaleString()}`, color: "#f5a623" },
            { label: "Total Leads", value: stats.leads.toString(), color: "#4ade80" },
            { label: "Avg ROAS", value: `${stats.roas}x`, color: "#4ade80" },
            { label: "Active Campaigns", value: stats.campaigns.toString(), color: "#e8eaf0" },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2">
              <div className="text-[16px] font-bold leading-none mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-white/25 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_240px] gap-3">
          {/* Left — Client cards */}
          <div>
            <div className="text-[9px] font-bold text-amber-400 tracking-[1.5px] uppercase mb-2">Clients</div>
            <div className="space-y-2">
              {CLIENTS.map((client, i) => (
                <div key={client.name} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5"
                  style={{ animation: isVisible ? `recSlide 0.5s ease ${0.3 + i * 0.2}s both` : "none" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: client.statusColor }} />
                      <span className="text-[11px] font-semibold text-white/80">{client.name}</span>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{
                      background: client.status === "healthy" ? "rgba(74,222,128,0.1)" : "rgba(245,166,35,0.1)",
                      color: client.status === "healthy" ? "#4ade80" : "#f5a623",
                    }}>{client.status}</span>
                  </div>
                  <div className="flex gap-3">
                    <div><div className="text-[11px] font-bold text-white/70">${client.spend.toLocaleString()}</div><div className="text-[8px] text-white/20">spend</div></div>
                    {client.vertical === "leads" ? (
                      <>
                        <div><div className="text-[11px] font-bold text-emerald-400">{client.leads}</div><div className="text-[8px] text-white/20">leads</div></div>
                        <div><div className="text-[11px] font-bold" style={{ color: client.cpl < 35 ? "#4ade80" : "#f5a623" }}>${client.cpl.toFixed(0)}</div><div className="text-[8px] text-white/20">CPL</div></div>
                      </>
                    ) : (
                      <>
                        <div><div className="text-[11px] font-bold text-emerald-400">{client.roas}x</div><div className="text-[8px] text-white/20">ROAS</div></div>
                        <div><div className="text-[11px] font-bold text-white/70">{client.purchases}</div><div className="text-[8px] text-white/20">purchases</div></div>
                      </>
                    )}
                    <div><div className="text-[11px] font-bold text-white/50">{client.campaigns}</div><div className="text-[8px] text-white/20">campaigns</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Recommendations */}
          <div>
            <div className="text-[9px] font-bold text-amber-400 tracking-[1.5px] uppercase mb-2">AI Recommendations</div>
            <div className="space-y-2">
              {RECOMMENDATIONS.slice(0, recVisible).map((rec, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5"
                  style={{ animation: `recSlide 0.4s ease both`, borderLeftColor: rec.type === "critical" ? "#f87171" : rec.type === "warning" ? "#f5a623" : "#60a5fa", borderLeftWidth: 2 }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px]">{rec.icon}</span>
                    <span className="text-[10px] font-semibold text-white/80">{rec.title}</span>
                  </div>
                  <div className="text-[9px] text-white/40 leading-relaxed mb-2">{rec.body}</div>
                  <div className="flex gap-1.5">
                    <div className="px-2 py-1 rounded text-[8px] font-semibold cursor-default" style={{
                      background: rec.type === "critical" ? "rgba(248,113,113,0.15)" : rec.type === "info" ? "rgba(96,165,250,0.15)" : "rgba(245,166,35,0.15)",
                      color: rec.type === "critical" ? "#f87171" : rec.type === "info" ? "#60a5fa" : "#f5a623",
                    }}>{rec.action}</div>
                    <div className="px-2 py-1 rounded text-[8px] text-white/20 bg-white/[0.03]">Dismiss</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
