"use client";

import { useEffect, useState, useRef } from "react";

export default function AnimatedDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [spend, setSpend] = useState(0);
  const [leads, setLeads] = useState(0);
  const [attention, setAttention] = useState(0);
  const [accounts, setAccounts] = useState(0);
  const [alertIdx, setAlertIdx] = useState(0);
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
    const targets = { spend: 12847, leads: 247, attention: 2, accounts: 6 };
    const duration = 2200;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setSpend(Math.round(ease * targets.spend));
      setLeads(Math.round(ease * targets.leads));
      setAttention(Math.round(ease * targets.attention));
      setAccounts(Math.round(ease * targets.accounts));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible]);

  // Live increment
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => {
      const live = setInterval(() => {
        setSpend(p => p + Math.floor(Math.random() * 40 + 10));
        setLeads(p => p + 1);
      }, 3500);
      return () => clearInterval(live);
    }, 2500);
    return () => clearTimeout(t);
  }, [isVisible]);

  // Alerts
  const alerts = [
    { text: "Budget scaled +20% on Summit Roofing — CPL dropped to $22", dot: "#4ade80" },
    { text: "2:14am — CPL spike caught on Metro HVAC, paused automatically", dot: "#f5a623" },
    { text: "Peak Supplements ROAS hit 4.2x — scaling budget now", dot: "#4ade80" },
    { text: "Creative fatigue on Solar Pro — replacement brief generated", dot: "#60a5fa" },
  ];
  useEffect(() => { if (!isVisible) return; const t = setInterval(() => setAlertIdx(i => (i + 1) % alerts.length), 3500); return () => clearInterval(t); }, [isVisible, alerts.length]);
  const alert = alerts[alertIdx];

  // Client campaigns
  const clients = [
    { name: "Summit Roofing", status: "healthy", color: "#4ade80", spend: "$2,840", leads: "96", cpl: "$29", campaigns: "3 active" },
    { name: "Peak Supplements", status: "scaling", color: "#f5a623", spend: "$4,200", roas: "4.2x", purchases: "127", campaigns: "5 active" },
    { name: "Metro HVAC", status: "warning", color: "#e8b84b", spend: "$1,650", leads: "28", cpl: "$59", campaigns: "2 active" },
    { name: "Solar Pro", status: "healthy", color: "#4ade80", spend: "$3,180", leads: "84", cpl: "$38", campaigns: "4 active" },
  ];

  return (
    <div ref={ref}>
      <style>{`@keyframes alertIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[10px] text-white/20 tracking-wider">buenaonda.ai</div>
        <div className="w-12" />
      </div>

      {/* ── Nav bar ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[8px] font-black text-white">B</div>
          <span className="text-[11px] font-bold text-white/80">Buena Onda</span>
        </div>
        {["Overview", "Campaigns", "Clients", "Creatives", "Ads", "Reports"].map((item, i) => (
          <div key={item} className={`px-2 py-1 rounded text-[10px] ${i === 0 ? "bg-amber-500/12 text-amber-400 font-semibold" : "text-white/25"}`}>{item}</div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="text-[9px] text-white/20">Summit Roofing ▾</div>
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-[7px] font-bold text-white">M</div>
        </div>
      </div>

      {/* ── Dashboard content ── */}
      <div className="p-4 min-h-[360px]">

        {/* Greeting */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[15px] font-extrabold text-white/90 tracking-tight">Good morning 👋</div>
            <div className="text-[10px] text-white/30 mt-0.5">Saturday, April 5 · <span className="text-amber-400">2 accounts need attention</span></div>
          </div>
          <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-md p-0.5 gap-0.5">
            {["7d", "30d", "90d"].map((r, i) => (
              <div key={r} className={`px-2.5 py-1 rounded text-[9px] font-semibold ${i === 1 ? "bg-amber-500 text-white" : "text-white/30"}`}>{r}</div>
            ))}
          </div>
        </div>

        {/* Alert banner */}
        <div key={alertIdx} className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 border border-white/[0.06]" style={{ animation: "alertIn 0.3s ease both", background: "rgba(255,255,255,0.02)" }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: alert.dot }} />
          <span className="text-[10px] text-white/50 flex-1">{alert.text}</span>
          <span className="text-[8px] text-white/15">Just now</span>
        </div>

        {/* ── 4 stat cards — matches real dashboard ── */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { label: "Total Spend (30d)", value: `$${spend.toLocaleString()}`, sub: "across 6 accounts", color: "#e8eaf0", border: "rgba(255,255,255,0.06)" },
            { label: "Leads (30d)", value: leads.toString(), sub: "4 lead gen accounts", color: "#7b8cde", border: "rgba(123,140,222,0.3)" },
            { label: "Needing Attention", value: attention.toString(), sub: "1 critical", color: "#e8b84b", border: "rgba(232,184,75,0.4)" },
            { label: "Accounts Managed", value: accounts.toString(), sub: "across all platforms", color: "#f5a623", border: "rgba(245,166,35,0.3)" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-3 py-3" style={{ background: "#161820", border: `1px solid ${s.border}` }}>
              <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1.5 font-medium">{s.label}</div>
              <div className="text-[22px] font-extrabold tracking-tight leading-none" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-white/25 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Platform Breakdown ── */}
        <div className="text-[8px] font-semibold text-white/25 uppercase tracking-wider mb-2">Platform Breakdown</div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { name: "Meta", icon: "📘", connected: "4 connected", spend: "$8,420", color: "#4a90d9" },
            { name: "Google", icon: "🔍", connected: "2 connected", spend: "$3,200", color: "#34a853" },
            { name: "TikTok", icon: "🎵", connected: "1 connected", spend: "$1,227", color: "#ff2d6b" },
            { name: "Shopify", icon: "🛍", connected: "2 connected", spend: "$0", color: "#96bf48" },
          ].map(p => (
            <div key={p.name} className="rounded-lg px-2.5 py-2" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px]">{p.icon}</span>
                <span className="text-[10px] font-bold text-white/70">{p.name}</span>
              </div>
              <div className="text-[9px] text-white/30">{p.connected}</div>
              <div className="text-[12px] font-bold text-white/60 mt-0.5">{p.spend}</div>
            </div>
          ))}
        </div>

        {/* ── Client cards ── */}
        <div className="text-[8px] font-semibold text-white/25 uppercase tracking-wider mb-2">Client Accounts</div>
        <div className="grid grid-cols-2 gap-2">
          {clients.map((c, i) => (
            <div key={c.name} className="rounded-lg px-3 py-2.5" style={{ background: "#161820", border: `1px solid ${c.status === "warning" ? "rgba(232,184,75,0.15)" : "rgba(255,255,255,0.06)"}`, animation: isVisible ? `alertIn 0.4s ease ${0.4 + i * 0.15}s both` : "none" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-[10px] font-semibold text-white/80">{c.name}</span>
                </div>
                <span className="text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold" style={{
                  background: c.status === "healthy" ? "rgba(74,222,128,0.1)" : c.status === "scaling" ? "rgba(245,166,35,0.1)" : "rgba(232,184,75,0.1)",
                  color: c.color,
                }}>{c.status}</span>
              </div>
              <div className="flex gap-4 text-[9px]">
                <div><span className="text-white/60 font-semibold">{c.spend}</span><span className="text-white/20 ml-1">spend</span></div>
                {c.leads && <div><span className="text-emerald-400 font-semibold">{c.leads}</span><span className="text-white/20 ml-1">leads</span></div>}
                {c.roas && <div><span className="text-emerald-400 font-semibold">{c.roas}</span><span className="text-white/20 ml-1">ROAS</span></div>}
                {c.cpl && <div><span className="font-semibold" style={{ color: parseInt(c.cpl.replace('$','')) < 40 ? "#4ade80" : "#e8b84b" }}>{c.cpl}</span><span className="text-white/20 ml-1">CPL</span></div>}
                <div><span className="text-white/40 font-medium">{c.campaigns}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
