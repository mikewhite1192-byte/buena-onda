"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DEMO_CLIENTS_CONFIG, getDemoSummary, getDemoCampaigns } from "@/lib/demo-data";

// ── Exact dashboard theme ──────────────────────────────────────────────────────
const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentGlow: "rgba(245,166,35,0.2)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
  healthyBg: "rgba(46,204,113,0.1)",
  warning: "#e8b84b",
  warningBg: "rgba(232,184,75,0.1)",
  critical: "#ff4d4d",
  criticalBg: "rgba(255,77,77,0.1)",
  leads: "#7b8cde",
  leadsBg: "rgba(123,140,222,0.1)",
  ecomm: "#c07ef0",
  ecommBg: "rgba(192,126,240,0.1)",
};

const NAV_ITEMS = ["Overview", "Campaigns", "Clients", "Creatives", "Ads", "Reports", "Review", "History"];

const CLIENT_STATUS: Record<string, "healthy" | "warning" | "critical"> = {
  act_demo_roofing:   "healthy",
  act_demo_dental:    "warning",
  act_demo_ecomm:     "healthy",
  act_demo_solar:     "critical",
  act_demo_hvac:      "healthy",
  act_demo_legal:     "warning",
  act_demo_realty:    "healthy",
  act_demo_remodel:   "healthy",
  act_demo_auto:      "healthy",
  act_demo_insurance: "warning",
  act_demo_beauty:    "healthy",
  act_demo_supps:     "healthy",
  act_demo_homegood:  "warning",
  act_demo_fitness:   "healthy",
  act_demo_finance:   "critical",
};

const STATUS_CONFIG = {
  healthy:  { color: T.healthy,  bg: T.healthyBg,  label: "Healthy" },
  warning:  { color: T.warning,  bg: T.warningBg,  label: "Needs attention" },
  critical: { color: T.critical, bg: T.criticalBg, label: "Critical" },
  no_data:  { color: T.faint,    bg: "rgba(90,94,114,0.1)", label: "No data" },
};

const ALERTS = [
  { severity: "error" as const,   clientName: "Pacific Solar",      message: "$310 spent, 0 leads this week" },
  { severity: "error" as const,   clientName: "Crestwood Financial", message: "$380 spent, 0 leads — all campaigns paused" },
  { severity: "warning" as const, clientName: "Bright Smile Dental", message: "Creative fatigue — 4.1x frequency on retargeting" },
  { severity: "warning" as const, clientName: "Coastal Insurance",    message: "CPL at $68 — above $50 target" },
];

const RECS = [
  { id: "r1", priority: "critical" as const, icon: "🚨", title: "Spending with no leads",      body: "Pacific Solar spent $310 with zero leads. Pause top campaign now.", approveLabel: "Pause Campaign" },
  { id: "r2", priority: "critical" as const, icon: "🚨", title: "Zero conversions",            body: "Crestwood Financial — $380 spend, 0 leads. All ad sets paused pending review.", approveLabel: "Review Account" },
  { id: "r3", priority: "warning"  as const, icon: "😴", title: "Ad fatigue detected",         body: "Bright Smile Dental retargeting at 4.1x frequency. Rotate creative.", approveLabel: "Pause Ad Set" },
  { id: "r4", priority: "info"     as const, icon: "📈", title: "Scale opportunity",           body: "Summit Roofing 'Storm Damage' at $31 CPL. Increase budget 20%.", approveLabel: "Increase Budget 20%" },
  { id: "r5", priority: "info"     as const, icon: "📈", title: "Strong ROAS — scale budget",  body: "Urban Threads DPA at 4.1x ROAS. +$100/day while signal is strong.", approveLabel: "Scale Budget" },
];

// ── Tour steps ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 10;
const STEPS: Record<number, { title: string; body: string; label: string; highlightId?: string; tab?: string; openCreator?: boolean; centered?: boolean }> = {
  1: { title: "Your Agency Command Center", label: `1 / ${TOTAL_STEPS}  ·  Overview`, body: "Live spend, leads, ROAS, and account health across all your clients at a glance. Critical accounts automatically surface to the top.", highlightId: "tour-overview-stats" },
  2: { title: "Anomaly Alerts", label: `2 / ${TOTAL_STEPS}  ·  Alerts`, body: "The AI monitors every account 24/7. The moment something breaks — CPL spike, zero leads, budget overpacing — it flags it here with one-click actions.", highlightId: "tour-alerts" },
  3: { title: "AI Recommendations", label: `3 / ${TOTAL_STEPS}  ·  Recommendations`, body: "Ranked, actionable suggestions — pause a fatigued ad, scale a winner, fix audience overlap. Each one has a one-click approve or dismiss right on the card.", highlightId: "tour-recommendations" },
  4: { title: "Client Account Cards", label: `4 / ${TOTAL_STEPS}  ·  Clients`, body: "Every client's status at a glance — spend, leads, ROAS, and health indicator. Blue is lead gen, purple is e-commerce. Click any card to drill in.", highlightId: "tour-client-accounts" },
  5: { title: "Build an Ad in 60 Seconds", label: `5 / ${TOTAL_STEPS}  ·  Ad Builder`, body: "Tell the AI your offer, audience, and budget — one question at a time. It writes the copy, sets up targeting, and presents everything for your approval before anything goes live.", tab: "ads", openCreator: true, highlightId: "tour-ads-create" },
  6: { title: "Performance Charts", label: `6 / ${TOTAL_STEPS}  ·  Campaigns`, body: "Click 'Show Charts ↗' to see any metric over time — spend, CPL, ROAS, CTR, frequency. Switch metrics with the dropdown. Spot trends before they become problems.", tab: "campaigns", highlightId: "tour-chart-toggle" },
  7: { title: "Shareable Client Reports", label: `7 / ${TOTAL_STEPS}  ·  Share`, body: "Click '↗ Share Report' to generate a read-only link for your client — clean performance view, no login required, no access to settings or other accounts.", highlightId: "tour-share-report" },
  8: { title: "Automated Reports", label: `8 / ${TOTAL_STEPS}  ·  Reports`, body: "Weekly and monthly reports auto-generated per client. Ask the AI anytime — 'send me this week's report' — and it delivers a full performance snapshot ready to share.", tab: "reports" },
  9: { title: "Your AI Is Always Here", label: `9 / ${TOTAL_STEPS}  ·  AI Assistant`, body: "The ✦ button is always here — on every page. Ask about your campaigns, get help building an ad, request a performance summary, or just ask how to navigate the platform.", highlightId: "tour-agent-btn" },
  10: { title: "You're All Set 🎉", label: `10 / ${TOTAL_STEPS}  ·  Ready`, body: "That's the full picture. Start your free trial and run your first real campaign — connect your ad account and the AI takes it from there.", centered: true },
};

// ── Demo Ad Creator Chat (matches real AdCreatorOverlay) ──────────────────────

interface DemoChatMsg { id: string; role: "user" | "assistant"; content: string; }

// Scripted conversation that mirrors the real AI builder experience
const DEMO_SCRIPT: { trigger: RegExp | null; response: string }[] = [
  {
    trigger: null, // opening message
    response: `Hey! I'm your Buena Onda AI. I'll build your campaign structure end-to-end.\n\nLet's start simple — **what's the business?** (e.g. "roofing company in San Diego" or "DTC supplement brand")`,
  },
  {
    trigger: /./,  // any user message after the first
    response: `Got it. And what's the **primary goal** — are you generating leads, driving online sales, or something else? Also, what's the **monthly budget** you're working with?`,
  },
  {
    trigger: /lead|sale|budget|\$|\d/i,
    response: `Perfect. Here's what I'm building:\n\n**Headline:** Free [Service] Quote — Book Today\n**Primary Text:** Don't leave money on the table. Our clients cut CPL by 40% in the first 60 days.\n\n**Objective:** Lead Generation\n**Targeting:** Homeowners 35–65, 25mi radius, interest-based + LAL 1%\n**Daily Budget:** $100/day\n**Ad Sets:** 3 (Broad intent · Retargeting 30d · Lookalike 1%)\n\nShould I **finalize this** and queue it for approval, or do you want to tweak anything first?`,
  },
];

function DemoAdCreatorChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<DemoChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    // Show opening message with typing effect
    const opening = DEMO_SCRIPT[0].response;
    setLoading(true);
    const streamingId = "init";
    setMessages([{ id: streamingId, role: "assistant", content: "" }]);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages([{ id: streamingId, role: "assistant", content: opening.slice(0, i * 3) }]);
      if (i * 3 >= opening.length) {
        clearInterval(interval);
        setMessages([{ id: streamingId, role: "assistant", content: opening }]);
        setLoading(false);
      }
    }, 18);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: DemoChatMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
    setInput("");

    const nextIdx = scriptIdx + 1;
    const scriptEntry = DEMO_SCRIPT[Math.min(nextIdx, DEMO_SCRIPT.length - 1)];
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setScriptIdx(nextIdx);

    const streamingId = (Date.now() + 1).toString();
    setTimeout(() => {
      setMessages(prev => [...prev, { id: streamingId, role: "assistant", content: "" }]);
      let i = 0;
      const resp = scriptEntry.response;
      const interval = setInterval(() => {
        i++;
        setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: resp.slice(0, i * 3) } : m));
        if (i * 3 >= resp.length) {
          clearInterval(interval);
          setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: resp } : m));
          setLoading(false);
          if (nextIdx >= DEMO_SCRIPT.length - 1) setDone(true);
        }
      }, 18);
    }, 700);
  }

  function renderMd(text: string): React.ReactNode {
    return text.split("\n").map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j} style={{ color: T.text, fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : <span key={j}>{p}</span>
      );
      return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
    });
  }

  return (
    <>
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#13151d", borderLeft: `1px solid rgba(245,166,35,0.2)`, zIndex: 1200, display: "flex", flexDirection: "column", animation: "panelSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, color: T.accent }}>✦</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>Build with Buena Onda</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2, paddingLeft: 24 }}>Summit Roofing Co · Lead Gen</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: T.muted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 2 }}>✦</div>
              )}
              <div style={{
                maxWidth: "80%",
                background: msg.role === "user" ? T.accentBg : T.surface,
                border: `1px solid ${msg.role === "user" ? T.accent + "40" : T.border}`,
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "10px 14px",
                fontSize: 13,
                color: T.text,
                lineHeight: 1.6,
              }}>
                {msg.content ? renderMd(msg.content) : <span style={{ display: "inline-block", width: 18, height: 4, background: T.muted, borderRadius: 2, animation: "pulse 1s ease-in-out infinite" }} />}
              </div>
            </div>
          ))}
          {done && (
            <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: 10, padding: "14px 16px", fontSize: 12 }}>
              <div style={{ color: "#2ecc71", fontWeight: 700, marginBottom: 6 }}>✓ Campaign queued for approval</div>
              <div style={{ color: T.muted }}>In the real platform this launches in Meta — pending your review. <Link href="/#pricing" style={{ color: T.accent, textDecoration: "none" }}>Start free to try it live →</Link></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          {!done && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Describe your campaign…"
                disabled={loading}
                style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(245,166,35,0.2)", color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit" }}
              >
                →
              </button>
            </div>
          )}
          {done && (
            <Link href="/#pricing" style={{ display: "block", textAlign: "center" as const, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              Start Free — launch your first real campaign →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ── Demo Chat Popup (AI assistant) ────────────────────────────────────────────

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }

const DEMO_SUGGESTIONS = [
  "Which ad sets should I scale?",
  "How does the campaign builder work?",
  "How do I lower my CPL?",
  "Show me the anomaly alerts feature",
];

function DemoChatPopup({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content };
    const streamingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: streamingId, role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: m.content + parsed.text } : m));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: "Sorry, something went wrong. Try again." } : m));
    } finally {
      setLoading(false);
    }
  }

  function renderMd(text: string): React.ReactNode {
    return text.split("\n").map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j} style={{ color: T.text, fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : <span key={j}>{p.replace(/--/g, "—")}</span>
      );
      return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
    });
  }

  return (
    <div style={{ position: "fixed", bottom: 84, right: 24, width: 340, maxHeight: 520, background: "#13151d", border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", zIndex: 1050, overflow: "hidden", animation: "tourFadeIn 0.3s ease both" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Buena Onda AI</div>
            <div style={{ fontSize: 10, color: T.muted }}>Ask me anything about the platform</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Suggested questions:</div>
            {DEMO_SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)} style={{ padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, textAlign: "left" as const, cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 2 }}>✦</div>
            )}
            <div style={{ maxWidth: "85%", background: msg.role === "user" ? T.accentBg : T.surface, border: `1px solid ${msg.role === "user" ? T.accent + "40" : T.border}`, borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px", padding: "8px 12px", fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              {msg.content ? renderMd(msg.content) : <span style={{ display: "inline-block", width: 16, height: 3, background: T.muted, borderRadius: 2 }} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask a question…"
            disabled={loading}
            style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 10px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(245,166,35,0.2)", color: "#0d0f14", fontSize: 12, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit" }}>→</button>
        </div>
      </div>
    </div>
  );
}


function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.4px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? T.text, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ClientCard({ name, accountId, vertical, onSelect }: { name: string; accountId: string; vertical: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const status = CLIENT_STATUS[accountId] ?? "healthy";
  const st = STATUS_CONFIG[status];
  const isLeads = vertical === "leads";
  const isCritical = status === "critical";

  const summary = getDemoSummary(accountId) as {
    current: { total_spend: string; total_leads: number; avg_cpl: string; active_ad_sets: number };
  };
  const campaigns = getDemoCampaigns(accountId, 30) as Array<{ spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; status: string }>;
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = summary.current.total_leads;
  const avgCPL = parseFloat(summary.current.avg_cpl);
  const totalPurchases = campaigns.reduce((s, c) => s + (c.purchases ?? 0), 0);
  const totalPurchaseValue = campaigns.reduce((s, c) => s + (c.purchase_value ?? 0), 0);
  const avgROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
  const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const alert = status === "critical" ? "Campaigns paused — needs attention" : status === "warning" ? "Above CPL target — review recommended" : null;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.accent + "50" : isCritical ? T.critical + "30" : T.border}`,
        borderRadius: 10, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alert ? 6 : 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: isLeads ? T.leads : T.ecomm, background: isLeads ? T.leadsBg : T.ecommBg, padding: "2px 7px", borderRadius: 4 }}>
            {isLeads ? "Lead Gen" : "Ecommerce"}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, padding: "3px 9px", borderRadius: 5 }}>{st.label}</span>
      </div>
      {alert && <div style={{ fontSize: 12, color: st.color, marginBottom: 12, paddingLeft: 15 }}>! {alert}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {isLeads ? (
          <>
            <MetricBox label="CPL" value={avgCPL > 0 ? `$${avgCPL.toFixed(0)}` : "—"} sub="cost per lead" color={avgCPL > 50 ? T.warning : T.healthy} />
            <MetricBox label="Leads (30d)" value={String(totalLeads)} sub="from ads" />
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="total spend" />
            <MetricBox label="Campaigns" value={String(campaigns.length)} sub="with data" />
          </>
        ) : (
          <>
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="total spend" />
            <MetricBox label="ROAS" value={avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"} sub="return on ad spend" color={avgROAS >= 2 ? T.healthy : avgROAS > 0 ? T.warning : undefined} />
            <MetricBox label="Purchases (30d)" value={String(totalPurchases)} sub="conversions" />
            <MetricBox label="CPA" value={avgCPA > 0 ? `$${avgCPA.toFixed(0)}` : "—"} sub="cost per acq." />
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>View Account →</span>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const clients = [...DEMO_CLIENTS_CONFIG];
  const [activeClient, setActiveClient] = useState(clients[0].name);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);

  // Tour state
  const [step, setStep] = useState(1);
  const [tourActive, setTourActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "ads" | "campaigns" | "reports">("overview");
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedReportClient, setSelectedReportClient] = useState<string>(clients[0]?.name ?? "");
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportSendEmail, setReportSendEmail] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isTourActive = tourActive;

  function applyStepEffects(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (!cfg) return;
    if (cfg.tab) setActiveTab(cfg.tab as "ads" | "campaigns" | "reports");
    if (cfg.openCreator) setShowBriefPanel(true);
    if (targetStep === 9) setShowChatPopup(true);
  }
  function applyPrevRoute(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (cfg?.tab) setActiveTab(cfg.tab as "ads" | "campaigns" | "reports");
    else if (targetStep < 5) setActiveTab("overview");
  }
  function handleNext() {
    if (step === TOTAL_STEPS) { setTourActive(false); return; }
    applyStepEffects(step + 1);
    setStep(s => s + 1);
  }
  function handlePrev() {
    applyPrevRoute(step - 1);
    setStep(s => s - 1);
  }

  // Aggregate stats
  const totalSpendAll = clients.reduce((sum, c) => {
    const campaigns = getDemoCampaigns(c.meta_ad_account_id, 30) as Array<{ spend: number }>;
    return sum + campaigns.reduce((s, x) => s + x.spend, 0);
  }, 0);
  const totalLeadsAll = clients.reduce((sum, c) => {
    const s = getDemoSummary(c.meta_ad_account_id) as { current: { total_leads: number } };
    return sum + s.current.total_leads;
  }, 0);
  const attentionCount = Object.values(CLIENT_STATUS).filter(s => s === "critical" || s === "warning").length;
  const visibleRecs = RECS.filter(r => !dismissed.has(r.id));

  function highlightStyle(id: string): React.CSSProperties {
    if (!isTourActive || STEPS[step]?.highlightId !== id) return {};
    return { outline: "2px solid rgba(245,166,35,0.85)", outlineOffset: 6, borderRadius: 10, transition: "outline 0.3s ease" };
  }

  // Active client campaigns for campaigns tab
  const activeClientObj = clients.find(c => c.name === activeClient) ?? clients[0];
  const activeCampaigns = getDemoCampaigns(activeClientObj.meta_ad_account_id, 30) as Array<{ name?: string; spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; status: string; ctr: number; frequency: number }>;

  return (
    <>
      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text, paddingBottom: 80 }}>

        {/* ── Demo banner (sticky) ── */}
        <div style={{ background: "linear-gradient(135deg,#f5a623,#f76b1c)", padding: "9px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 101 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0d0f14" }}>
            🎯 Live demo — the actual Buena Onda dashboard with sample agency data. No sign-up needed.
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", textDecoration: "none" }}>← Back to site</Link>
            <Link href="/#pricing" style={{ fontSize: 12, fontWeight: 800, color: "#f76b1c", background: "#0d0f14", padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>
              Start Free →
            </Link>
          </div>
        </div>

        {/* ── Top nav (sticky below banner) ── */}
        <div style={{ height: 52, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 0, position: "sticky", top: 40, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff", boxShadow: `0 3px 10px ${T.accentGlow}` }}>B</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-0.3px" }}>Buena Onda</span>
          </div>

          <nav style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(label => {
              const tab = label === "Overview" ? "overview" : label === "Campaigns" ? "campaigns" : label === "Ads" ? "ads" : label === "Reports" ? "reports" : null;
              const isActive = tab === activeTab;
              const isClickable = !!tab;
              return (
                <button key={label}
                  onClick={() => tab && setActiveTab(tab as "overview" | "ads" | "campaigns" | "reports")}
                  style={{ padding: "5px 13px", fontSize: 12, borderRadius: 6, border: "none", fontFamily: "inherit",
                    background: isActive ? T.accentBg : "transparent",
                    color: isActive ? T.accent : isClickable ? T.muted : T.faint,
                    fontWeight: isActive ? 600 : 400,
                    cursor: isClickable ? "pointer" : "default" }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div style={{ position: "relative", marginRight: 16 }}>
            <button onClick={() => setShowSwitcher(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, background: showSwitcher ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", color: T.text, fontFamily: "inherit", fontSize: 12, fontWeight: 500, minWidth: 160 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.leads, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{activeClient}</span>
              <span style={{ color: T.faint, fontSize: 9, marginLeft: "auto" }}>▾</span>
            </button>
            {showSwitcher && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 340, overflowY: "auto" }}>
                {clients.map(c => (
                  <div key={c.meta_ad_account_id} onClick={() => { setActiveClient(c.name); setShowSwitcher(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", background: activeClient === c.name ? "rgba(245,166,35,0.08)" : "transparent", borderLeft: activeClient === c.name ? `2px solid ${T.accent}` : "2px solid transparent" }}
                    onMouseEnter={e => { if (activeClient !== c.name) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (activeClient !== c.name) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.vertical === "leads" ? T.leads : T.ecomm, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.text }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{c.vertical}</div>
                    </div>
                    {activeClient === c.name && <span style={{ color: T.accent, fontSize: 12 }}>✓</span>}
                  </div>
                ))}
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>Manage clients →</div>
              </div>
            )}
          </div>

          <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "default", marginRight: 14, padding: "4px 6px", borderRadius: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, lineHeight: 1 }}>?</span>
            <span style={{ fontSize: 9, color: T.faint, letterSpacing: "0.3px" }}>Help</span>
          </button>

          <Link href="/#pricing" style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", textDecoration: "none", whiteSpace: "nowrap" }}>
            Start Free
          </Link>
        </div>

        {/* ── Main content ── */}
        <div style={{ padding: "26px 28px", background: T.bg, minHeight: "calc(100vh - 94px)" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Good morning 👋</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                Demo Account · <span style={{ color: T.critical }}>{ALERTS.length} accounts need attention</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
                {["Today", "7d", "30d", "90d", "Max"].map(label => (
                  <button key={label} style={{ padding: "4px 11px", fontSize: 12, borderRadius: 6, border: "none", cursor: "default", fontFamily: "inherit", fontWeight: label === "30d" ? 700 : 400, background: label === "30d" ? T.accent : "transparent", color: label === "30d" ? "#fff" : T.muted }}>
                    {label}
                  </button>
                ))}
              </div>
              <button
                id="tour-ads-create"
                onClick={() => { setActiveTab("ads"); setShowBriefPanel(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}
              >
                + New Campaign
              </button>
            </div>
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <>
              {/* Stat strip */}
              <div id="tour-overview-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28, ...highlightStyle("tour-overview-stats") }}>
                {[
                  { label: "Total Spend (30d)", value: `$${totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `across ${clients.length} accounts`, color: T.text, border: T.border },
                  { label: "Leads (30d)", value: String(totalLeadsAll), sub: `${clients.filter(c => c.vertical === "leads").length} lead gen accounts`, color: T.leads, border: T.leads + "30" },
                  { label: "Needing Attention", value: String(attentionCount), sub: "2 critical", color: T.warning, border: T.warning + "40" },
                  { label: "Accounts Connected", value: `${clients.length} / ${clients.length}`, sub: "all connected", color: T.healthy, border: T.healthy + "30" },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: "18px 20px" }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

                {/* Left */}
                <div>
                  {/* Alerts */}
                  <div id="tour-alerts" style={{ marginBottom: 16, ...highlightStyle("tour-alerts") }}>
                    <div onClick={() => setAlertsCollapsed(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alertsCollapsed ? 0 : 8, cursor: "pointer", userSelect: "none" as const }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Alerts</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: T.critical, borderRadius: 10, padding: "1px 7px" }}>{ALERTS.length}</span>
                      </div>
                      <span style={{ fontSize: 11, color: T.faint }}>{alertsCollapsed ? "▶" : "▼"}</span>
                    </div>
                    {!alertsCollapsed && ALERTS.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, background: a.severity === "error" ? "rgba(255,77,77,0.06)" : "rgba(232,184,75,0.06)", border: `1px solid ${a.severity === "error" ? "rgba(255,77,77,0.2)" : "rgba(232,184,75,0.2)"}`, borderRadius: 8 }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>{a.severity === "error" ? "🔴" : "🟡"}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: a.severity === "error" ? T.critical : T.warning }}>{a.clientName}</span>
                          <span style={{ fontSize: 12, color: T.muted }}> — {a.message}</span>
                        </div>
                        <span style={{ fontSize: 10, color: T.faint }}>→</span>
                      </div>
                    ))}
                  </div>

                  {/* Client accounts */}
                  <div id="tour-client-accounts" style={{ ...highlightStyle("tour-client-accounts") }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Client Accounts</div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: T.leads }} /> Lead Gen
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: T.ecomm }} /> Ecommerce
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                      {clients.map(c => (
                        <ClientCard key={c.meta_ad_account_id} name={c.name} accountId={c.meta_ad_account_id} vertical={c.vertical} onSelect={() => setActiveClient(c.name)} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Recommendations */}
                  <div id="tour-recommendations" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", ...highlightStyle("tour-recommendations") }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Recommendations</div>
                      {visibleRecs.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.critical, borderRadius: 10, padding: "1px 7px" }}>{visibleRecs.length}</span>}
                    </div>
                    {visibleRecs.map((rec, i) => {
                      const borderColor = rec.priority === "critical" ? T.critical : rec.priority === "warning" ? T.warning : T.accent;
                      return (
                        <div key={rec.id} style={{ padding: "12px 16px", borderBottom: i < visibleRecs.length - 1 ? `1px solid ${T.border}` : "none", borderLeft: `3px solid ${borderColor}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{rec.title}</div>
                              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{rec.body}</div>
                            </div>
                          </div>
                          {done.has(rec.id) ? (
                            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 5, background: "rgba(46,204,113,0.12)", color: "#2ecc71", fontSize: 11, fontWeight: 600, textAlign: "center" as const }}>✓ Done — changes applied</div>
                          ) : (
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button onClick={() => setDone(d => new Set([...d, rec.id]))} style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", background: borderColor + "22", color: borderColor, cursor: "pointer", fontFamily: "inherit" }}>
                                {rec.approveLabel}
                              </button>
                              <button onClick={() => setDismissed(d => new Set([...d, rec.id]))} style={{ padding: "5px 8px", fontSize: 11, borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Agent Status */}
                  <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 14 }}>Agent Status</div>
                    {[
                      { label: "Accounts monitored", value: `${clients.length} / ${clients.length}` },
                      { label: "Accounts connected",  value: `${clients.length} / ${clients.length}` },
                      { label: "Accounts healthy",    value: `${Object.values(CLIENT_STATUS).filter(s => s === "healthy").length} / ${clients.length}` },
                      { label: "Needing attention",   value: String(attentionCount), warn: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                        <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.warn ? T.warning : T.text }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14 }}>
                      <Link href="/#pricing" style={{ display: "block", textAlign: "center" as const, padding: "9px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
                        Connect your account →
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* Campaigns tab */}
          {activeTab === "campaigns" && (() => {
            const cmpnSpend = activeCampaigns.reduce((s, c) => s + c.spend, 0);
            const cmpnLeads = activeCampaigns.reduce((s, c) => s + (c.leads ?? 0), 0);
            const cmpnAvgCPL = cmpnLeads > 0 ? cmpnSpend / cmpnLeads : 0;
            const cmpnPurchases = activeCampaigns.reduce((s, c) => s + (c.purchases ?? 0), 0);
            const cmpnPurchaseValue = activeCampaigns.reduce((s, c) => s + (c.purchase_value ?? 0), 0);
            const cmpnROAS = cmpnSpend > 0 && cmpnPurchaseValue > 0 ? cmpnPurchaseValue / cmpnSpend : 0;
            const isLeadsAcc = (activeClientObj.vertical === "leads");
            // Simple sparkline data (daily spend last 7 days)
            const sparkVals = [42, 58, 51, 73, 66, 80, Math.round(cmpnSpend / 30)];
            const sparkMax = Math.max(...sparkVals);
            const W = 560; const H = 100; const pts = sparkVals.map((v, i) => `${(i / (sparkVals.length - 1)) * W},${H - (v / sparkMax) * H * 0.85}`).join(" ");
            return (
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>Campaigns</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>{activeClient}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{activeCampaigns.filter(c => c.status === "active" || c.status === "ACTIVE").length} active · {activeCampaigns.filter(c => c.status === "paused" || c.status === "PAUSED").length} paused</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button id="tour-chart-toggle" onClick={() => setShowCharts(v => !v)}
                      style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer", fontFamily: "inherit", ...highlightStyle("tour-chart-toggle") }}>
                      {showCharts ? "Hide Charts ↙" : "Show Charts ↗"}
                    </button>
                    <button id="tour-share-report"
                      style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer", fontFamily: "inherit", ...highlightStyle("tour-share-report") }}>
                      ↗ Share Report
                    </button>
                  </div>
                </div>

                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Spend (30d)", value: `$${cmpnSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    isLeadsAcc
                      ? { label: "Leads (30d)", value: String(cmpnLeads), color: T.leads }
                      : { label: "Purchases (30d)", value: String(cmpnPurchases), color: T.ecomm },
                    isLeadsAcc
                      ? { label: "Avg CPL", value: cmpnAvgCPL > 0 ? `$${cmpnAvgCPL.toFixed(0)}` : "—", color: cmpnAvgCPL > 50 ? T.warning : T.healthy, target: "$50" }
                      : { label: "Avg ROAS", value: cmpnROAS > 0 ? `${cmpnROAS.toFixed(2)}x` : "—", color: cmpnROAS >= 2 ? T.healthy : T.warning },
                    { label: "Active Campaigns", value: String(activeCampaigns.filter(c => c.status === "active" || c.status === "ACTIVE").length), color: T.accent },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px" }}>
                      <div style={{ fontSize: 11, color: "#5a5e72", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: (s as { color?: string }).color ?? T.text, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value}</div>
                      {(s as { target?: string }).target && <div style={{ fontSize: 10, color: "#5a5e72" }}>Target: {(s as { target?: string }).target}</div>}
                    </div>
                  ))}
                </div>

                {/* Chart */}
                {showCharts && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Spend — Last 7 Days</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["Spend", "CPL", "ROAS", "CTR", "Frequency"].map(m => (
                          <button key={m} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: m === "Spend" ? T.accentBg : "transparent", color: m === "Spend" ? T.accent : T.faint, cursor: "pointer", fontFamily: "inherit" }}>{m}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 110 }}>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f5a623" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#f5a623" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <polyline fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts} />
                        <polygon fill="url(#chartGrad)" points={`0,${H} ${pts} ${W},${H}`} />
                        {sparkVals.map((v, i) => (
                          <circle key={i} cx={(i / (sparkVals.length - 1)) * W} cy={H - (v / sparkMax) * H * 0.85} r="4" fill="#f5a623" />
                        ))}
                      </svg>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                        <span key={d} style={{ fontSize: 10, color: T.faint }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campaign table */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                    <div>Campaign</div>
                    <div style={{ textAlign: "right" as const }}>Spend</div>
                    <div style={{ textAlign: "right" as const }}>Leads</div>
                    <div style={{ textAlign: "right" as const }}>CPL</div>
                    <div style={{ textAlign: "right" as const }}>CTR</div>
                    <div style={{ textAlign: "right" as const }}>Freq</div>
                    <div style={{ textAlign: "right" as const }}>Status</div>
                  </div>
                  {activeCampaigns.slice(0, 8).map((c, i) => {
                    const statusColor = (c.status === "active" || c.status === "ACTIVE") ? T.healthy : T.warning;
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px", padding: "12px 16px", borderBottom: i < Math.min(activeCampaigns.length, 8) - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                        <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{c.name ?? `Campaign ${i + 1}`}</div>
                        <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>${c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>{c.leads ?? "—"}</div>
                        <div style={{ fontSize: 12, color: c.cpl > 50 ? T.warning : T.muted, textAlign: "right" as const }}>{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</div>
                        <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>{c.ctr > 0 ? `${(c.ctr * 100).toFixed(2)}%` : "—"}</div>
                        <div style={{ fontSize: 12, color: c.frequency > 3 ? T.warning : T.muted, textAlign: "right" as const }}>{c.frequency > 0 ? c.frequency.toFixed(1) : "—"}</div>
                        <div style={{ textAlign: "right" as const }}><span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: statusColor + "20", padding: "3px 8px", borderRadius: 4, textTransform: "lowercase" as const }}>{c.status.toLowerCase()}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Ads tab */}
          {activeTab === "ads" && (
            <div style={{ maxWidth: 960 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" as const }}>
                <div>
                  <div style={{ fontSize: 11, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 }}>Ad Manager</div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.3px" }}>{activeClient}</h1>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                    <span style={{ color: T.accent }}>2 pending approval</span>
                  </div>
                </div>
                <button
                  id="tour-ads-create"
                  onClick={() => setShowBriefPanel(true)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.accent, border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, ...highlightStyle("tour-ads-create") }}
                >
                  ✦ Create with Buena Onda
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, background: "#161820", border: `1px solid ${T.border}`, borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content" }}>
                {[
                  { key: "pending", label: "Pending Approval", count: 2, color: T.accent },
                  { key: "live", label: "Live", count: 2, color: "#2ecc71" },
                ].map(t => (
                  <button key={t.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 5, border: "none", fontSize: 12, fontWeight: t.key === "pending" ? 600 : 400, background: t.key === "pending" ? "rgba(245,166,35,0.12)" : "transparent", color: t.key === "pending" ? T.accent : T.muted, cursor: "pointer", fontFamily: "inherit" }}>
                    {t.key === "pending" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />}
                    {t.label}
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{t.count}</span>
                  </button>
                ))}
              </div>

              {/* Campaign cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  {
                    name: "Summit Roofing | Storm Season | Video Lead Gen",
                    status: "PAUSED" as const,
                    objective: "Lead Generation",
                    budget: 75,
                    adName: "Storm Damage UGC v2",
                    headline: "Free Roof Inspection — Book Today",
                    body: "Your roof took a hit this storm season — and you might not even know it. Get a FREE inspection from Summit Roofing before the damage gets worse.",
                    targeting: "San Diego, CA · Ages 35–65",
                  },
                  {
                    name: "Summit Roofing | Free Quote | Retargeting",
                    status: "PAUSED" as const,
                    objective: "Lead Generation",
                    budget: 40,
                    adName: "Free Quote Offer — Static",
                    headline: "Get Your Free Roofing Quote",
                    body: "Still thinking about that roof? Summit Roofing is offering free quotes this week only. Takes 10 minutes. Could save you thousands.",
                    targeting: "San Diego, CA · Retargeting 30d",
                  },
                ].map((campaign, idx) => (
                  <div key={idx} style={{ background: "#161820", border: `1px solid rgba(245,166,35,0.2)`, borderRadius: 12, overflow: "hidden" }}>
                    {/* Card header */}
                    <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: "rgba(245,166,35,0.12)", padding: "2px 8px", borderRadius: 4 }}>Pending Approval</span>
                          <span style={{ fontSize: 11, color: T.faint }}>{campaign.objective}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{campaign.name}</div>
                      </div>
                      <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>${campaign.budget}/day</div>
                    </div>

                    {/* Ad preview */}
                    <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "140px 1fr", gap: 20, alignItems: "start" }}>
                      {/* Mock image */}
                      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `1px solid ${T.border}` }}>📷</div>
                      <div>
                        <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Ad Copy</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{campaign.headline}</div>
                        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>{campaign.body}</div>
                        <div style={{ fontSize: 11, color: T.faint }}>Ad Set: {campaign.targeting}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button onClick={() => setShowBriefPanel(true)} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Edit Copy</button>
                      <button style={{ padding: "7px 18px", background: "#2ecc71", border: "none", borderRadius: 7, color: "#0d0f14", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ Approve & Go Live</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports tab */}
          {activeTab === "reports" && (
            <div style={{ maxWidth: 900 }}>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: T.accent, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Reports</h1>
                <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Generate performance reports · Email to clients · Print to PDF</p>
              </div>

              {/* Generate Report panel */}
              {!reportGenerated && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 20 }}>Generate Report</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                    {/* Client */}
                    <div>
                      <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Client</label>
                      <select value={selectedReportClient} onChange={e => setSelectedReportClient(e.target.value)} style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none" }}>
                        {clients.map(c => <option key={c.meta_ad_account_id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    {/* Start date */}
                    <div>
                      <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Start Date</label>
                      <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                    {/* End date */}
                    <div>
                      <label style={{ fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>End Date</label>
                      <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {[{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "This month", days: 0 }].map(({ label, days }) => (
                      <button key={label} onClick={() => {
                        const end = new Date(); const start = new Date();
                        if (days === 0) start.setDate(1); else start.setDate(start.getDate() - days);
                        setReportStartDate(start.toISOString().split("T")[0]);
                        setReportEndDate(end.toISOString().split("T")[0]);
                      }} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Email option */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8 }}>
                    <input type="checkbox" id="demoSendEmail" checked={reportSendEmail} onChange={e => setReportSendEmail(e.target.checked)} style={{ width: 14, height: 14, cursor: "pointer" }} />
                    <label htmlFor="demoSendEmail" style={{ fontSize: 12, color: T.muted, cursor: "pointer" }}>Email this report</label>
                    {reportSendEmail && (
                      <input type="email" value={reportEmail} onChange={e => setReportEmail(e.target.value)} placeholder="recipient@email.com" style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", fontFamily: "inherit", outline: "none" }} />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setReportGenerating(true);
                      setTimeout(() => { setReportGenerating(false); setReportGenerated(true); }, 1800);
                    }}
                    disabled={reportGenerating}
                    style={{ width: "100%", padding: "13px", borderRadius: 9, border: "none", background: reportGenerating ? "rgba(245,166,35,0.3)" : "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, cursor: reportGenerating ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {reportGenerating ? (
                      <>
                        <div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #0d0f14", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Generating report…
                      </>
                    ) : "Generate Report →"}
                  </button>
                </div>
              )}

              {/* Generated report */}
              {reportGenerated && (() => {
                const clientObj = clients.find(c => c.name === selectedReportClient) ?? clients[0];
                const cmpns = getDemoCampaigns(clientObj.meta_ad_account_id, 30) as Array<{ name?: string; spend: number; leads: number; cpl: number; purchases: number; purchase_value: number; roas: number; status: string }>;
                const totalSpend = cmpns.reduce((s, c) => s + c.spend, 0);
                const totalLeads = cmpns.reduce((s, c) => s + (c.leads ?? 0), 0);
                const totalPurchases = cmpns.reduce((s, c) => s + (c.purchases ?? 0), 0);
                const totalPurchaseValue = cmpns.reduce((s, c) => s + (c.purchase_value ?? 0), 0);
                const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
                const avgROAS = totalSpend > 0 && totalPurchaseValue > 0 ? totalPurchaseValue / totalSpend : 0;
                const isLeadsClient = clientObj.vertical === "leads";
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{selectedReportClient} — Performance Report</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{reportStartDate} to {reportEndDate}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setReportGenerated(false)} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>← New Report</button>
                        <Link href="/#pricing" style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontWeight: 800, textDecoration: "none", display: "inline-block" }}>↗ Share Report</Link>
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                      {[
                        { label: "Total Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                        isLeadsClient
                          ? { label: "Total Leads", value: String(totalLeads), color: T.leads }
                          : { label: "Total Purchases", value: String(totalPurchases), color: T.ecomm },
                        isLeadsClient
                          ? { label: "Avg CPL", value: avgCPL > 0 ? `$${avgCPL.toFixed(0)}` : "—", color: avgCPL > 50 ? T.warning : T.healthy }
                          : { label: "Avg ROAS", value: avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—", color: avgROAS >= 2 ? T.healthy : T.warning },
                        { label: "Campaigns", value: String(cmpns.length), color: T.accent },
                      ].map((s, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "18px 20px", textAlign: "center" as const }}>
                          <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: (s as { color?: string }).color ?? T.accent, letterSpacing: "-1px" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Campaign breakdown */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Campaign Breakdown</div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.faint, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                        <div>Campaign</div>
                        <div style={{ textAlign: "right" as const }}>Spend</div>
                        <div style={{ textAlign: "right" as const }}>{isLeadsClient ? "Leads" : "Purchases"}</div>
                        <div style={{ textAlign: "right" as const }}>{isLeadsClient ? "CPL" : "ROAS"}</div>
                        <div style={{ textAlign: "right" as const }}>Status</div>
                      </div>
                      {cmpns.map((c, i) => {
                        const statusColor = c.status === "ACTIVE" ? T.healthy : T.warning;
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: i < cmpns.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                            <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{c.name ?? `Campaign ${i + 1}`}</div>
                            <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>${c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div style={{ fontSize: 12, color: T.muted, textAlign: "right" as const }}>{isLeadsClient ? (c.leads ?? "—") : (c.purchases ?? "—")}</div>
                            <div style={{ fontSize: 12, textAlign: "right" as const, color: isLeadsClient ? (c.cpl > 50 ? T.warning : T.muted) : (c.roas >= 2 ? T.healthy : T.muted) }}>{isLeadsClient ? (c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—") : (c.roas > 0 ? `${c.roas.toFixed(2)}x` : "—")}</div>
                            <div style={{ textAlign: "right" as const }}><span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: statusColor + "20", padding: "3px 8px", borderRadius: 4 }}>{c.status.toLowerCase()}</span></div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 16, padding: "14px 16px", background: T.surfaceAlt, borderRadius: 10, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                      <strong style={{ color: T.text }}>AI Summary:</strong> {isLeadsClient
                        ? `${selectedReportClient} generated ${totalLeads} leads at an average CPL of ${avgCPL > 0 ? `$${avgCPL.toFixed(0)}` : "N/A"} over the selected period with $${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} in total spend. ${cmpns.filter(c => c.cpl > 50).length > 0 ? "Some campaigns are above target CPL — recommend creative rotation." : "Performance is within target range."}`
                        : `${selectedReportClient} drove ${totalPurchases} purchases at a ${avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "N/A"} average ROAS with $${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} total spend. ${avgROAS >= 2 ? "Strong ROAS — consider scaling the top-performing ad set." : "ROAS is below 2x — review targeting and creative strategy."}`}
                    </div>

                    <div style={{ marginTop: 12, textAlign: "center" as const }}>
                      <Link href="/#pricing" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 9, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                        Start Free — run reports on your real accounts →
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* ── Ad creator chat overlay ── */}
        {showBriefPanel && <DemoAdCreatorChat onClose={() => setShowBriefPanel(false)} />}

        {/* ── AI chat popup ── */}
        {showChatPopup && <DemoChatPopup onClose={() => setShowChatPopup(false)} />}

        {/* ── AI button (always visible, bottom-right) ── */}
        <button id="tour-agent-btn" onClick={() => setShowChatPopup(v => !v)} style={{ position: "fixed", bottom: 24, right: 24, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", color: "#0d0f14", fontSize: 18, cursor: "pointer", zIndex: 1001, boxShadow: "0 4px 20px rgba(245,166,35,0.4)", ...highlightStyle("tour-agent-btn") }}>✦</button>

        {/* ── Tour card ── */}
        {isTourActive && mounted && (() => {
          const cfg = STEPS[step];
          const posStyle: React.CSSProperties =
            step === 10 ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2100 } :
            step === 9 ? { position: "fixed", bottom: 32, left: 28, zIndex: 2100 } :
            (step >= 1 && step <= 4) ? { position: "fixed", bottom: 32, left: 28, zIndex: 2100 } :
            { position: "fixed", bottom: 32, right: 32, zIndex: 2100 };

          return (
            <>
              {step === 10 && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2099 }} />}
              <div
                key={step}
                style={{
                  ...posStyle,
                  width: 300,
                  background: "#13151d",
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  overflow: "hidden",
                  animation: "tourFadeIn 0.35s ease both",
                  opacity: mounted ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                {/* Progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${(step / TOTAL_STEPS) * 100}%`, background: "linear-gradient(90deg,#f5a623,#f76b1c)", transition: "width 0.4s ease" }} />
                </div>

                <div style={{ padding: "18px 20px" }}>
                  {/* Label */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: T.faint, fontWeight: 500, letterSpacing: "0.3px" }}>{cfg?.label}</span>
                    <button
                      onClick={() => setTourActive(false)}
                      style={{ fontSize: 10, color: T.faint, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 6px" }}
                    >
                      Skip tour
                    </button>
                  </div>

                  {/* Title + body */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.3px", textAlign: cfg?.centered ? "center" as const : "left" as const }}>{cfg?.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, marginBottom: 16, textAlign: cfg?.centered ? "center" as const : "left" as const }}>{cfg?.body}</div>

                  {/* Progress dots */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 14, justifyContent: cfg?.centered ? "center" : "flex-start" }}>
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                      <div
                        key={i}
                        style={{ width: (i + 1) === step ? 20 : 6, height: 6, borderRadius: 3, background: (i + 1) === step ? T.accent : (i + 1) < step ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.1)", transition: "all 0.25s" }}
                      />
                    ))}
                  </div>

                  {/* Buttons */}
                  {step === TOTAL_STEPS ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Link
                        href="/#pricing"
                        style={{ display: "block", textAlign: "center" as const, padding: "12px", borderRadius: 9, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                      >
                        Start Free — launch your first campaign →
                      </Link>
                      <button
                        onClick={() => setTourActive(false)}
                        style={{ width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Keep exploring
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      {step > 1 && (
                        <button
                          onClick={handlePrev}
                          style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {step === 1 ? "Start tour →" : "Next →"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── Sticky CTA bar (shows after tour is done) ── */}
        {!tourActive && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "rgba(13,15,20,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(245,166,35,0.2)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "ctaSlideUp 0.4s ease both" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Ready to run your ads on autopilot?</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Connect your accounts and the AI gets to work immediately.</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>← Back to site</Link>
              <Link
                href="/#pricing"
                style={{ padding: "10px 28px", borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}
              >
                Start Free →
              </Link>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
