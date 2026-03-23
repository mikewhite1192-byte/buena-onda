"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { DEMO_CLIENTS_CONFIG, getDemoSummary, getDemoCampaigns } from "@/lib/demo-data";

// ── Theme (exact match to real dashboard) ─────────────────────────────────────
const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentBorder: "rgba(245,166,35,0.3)",
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

const NAV_ITEMS = ["Overview","Campaigns","Clients","Creatives","Ads","Reports","Review","History"];
type Tab = "overview"|"campaigns"|"clients"|"creatives"|"ads"|"reports"|"review"|"history";

// ── Demo data ─────────────────────────────────────────────────────────────────
const CLIENT_STATUS: Record<string, "healthy"|"warning"|"critical"> = {
  act_demo_roofing:"healthy", act_demo_dental:"warning", act_demo_ecomm:"healthy",
  act_demo_solar:"critical", act_demo_hvac:"healthy", act_demo_legal:"warning",
  act_demo_realty:"healthy", act_demo_remodel:"healthy", act_demo_auto:"healthy",
  act_demo_insurance:"warning", act_demo_beauty:"healthy", act_demo_supps:"healthy",
  act_demo_homegood:"warning", act_demo_fitness:"healthy", act_demo_finance:"critical",
};
const STATUS_CFG = {
  healthy:{ color:T.healthy, bg:T.healthyBg, label:"Healthy" },
  warning:{ color:T.warning, bg:T.warningBg, label:"Needs attention" },
  critical:{ color:T.critical, bg:T.criticalBg, label:"Critical" },
};
const ALERTS = [
  { severity:"error" as const,   client:"Pacific Solar",       msg:"$310 spent, 0 leads this week" },
  { severity:"error" as const,   client:"Crestwood Financial",  msg:"$380 spent, 0 leads — all campaigns paused" },
  { severity:"warning" as const, client:"Bright Smile Dental",  msg:"Creative fatigue — 4.1x frequency on retargeting" },
  { severity:"warning" as const, client:"Coastal Insurance",    msg:"CPL at $68 — above $50 target" },
];
const RECS = [
  { id:"r1", priority:"critical" as const, icon:"🚨", title:"Spending with no leads",     body:"Pacific Solar spent $310 with zero leads. Pause top campaign now.", approveLabel:"Pause Campaign" },
  { id:"r2", priority:"critical" as const, icon:"🚨", title:"Zero conversions",           body:"Crestwood Financial — $380 spend, 0 leads. All ad sets paused pending review.", approveLabel:"Review Account" },
  { id:"r3", priority:"warning"  as const, icon:"😴", title:"Ad fatigue detected",        body:"Bright Smile Dental retargeting at 4.1x frequency. Rotate creative.", approveLabel:"Pause Ad Set" },
  { id:"r4", priority:"info"     as const, icon:"📈", title:"Scale opportunity",          body:"Summit Roofing 'Storm Damage' at $31 CPL. Increase budget 20%.", approveLabel:"Increase Budget 20%" },
  { id:"r5", priority:"info"     as const, icon:"📈", title:"Strong ROAS — scale budget", body:"Urban Threads DPA at 4.1x ROAS. +$100/day while signal is strong.", approveLabel:"Scale Budget" },
];

// ── Tour ──────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 10;
const STEPS: Record<number,{ title:string; body:string; label:string; highlightId?:string; tab?:Tab; openCreator?:boolean; centered?:boolean }> = {
  1:{ title:"Your Agency Command Center", label:`1 / ${TOTAL_STEPS}  ·  Overview`, body:"Live spend, leads, ROAS, and account health across all your clients at a glance. Critical accounts automatically surface to the top.", highlightId:"tour-overview-stats" },
  2:{ title:"Anomaly Alerts", label:`2 / ${TOTAL_STEPS}  ·  Alerts`, body:"The AI monitors every account 24/7. The moment something breaks — CPL spike, zero leads, budget overpacing — it flags it here with one-click actions.", highlightId:"tour-alerts" },
  3:{ title:"AI Recommendations", label:`3 / ${TOTAL_STEPS}  ·  Recommendations`, body:"Ranked, actionable suggestions — pause a fatigued ad, scale a winner, fix audience overlap. Each one has a one-click approve or dismiss right on the card.", highlightId:"tour-recommendations" },
  4:{ title:"Client Account Cards", label:`4 / ${TOTAL_STEPS}  ·  Clients`, body:"Every client's status at a glance — spend, leads, ROAS, and health indicator. Blue is lead gen, purple is e-commerce. Click any card to drill in.", highlightId:"tour-client-accounts" },
  5:{ title:"Build an Ad in 60 Seconds", label:`5 / ${TOTAL_STEPS}  ·  Ad Builder`, body:"Tell the AI your offer, audience, and budget — one question at a time. It writes the copy, sets up targeting, and presents everything for your approval before anything goes live.", tab:"ads", openCreator:true, highlightId:"tour-ads-create" },
  6:{ title:"Performance Charts", label:`6 / ${TOTAL_STEPS}  ·  Campaigns`, body:"Every metric over time — spend, CPL, ROAS, CTR, frequency. Time range selectors. Spot trends before they become problems.", tab:"campaigns", highlightId:"tour-chart-toggle" },
  7:{ title:"Shareable Client Reports", label:`7 / ${TOTAL_STEPS}  ·  Share`, body:"Click 'Share Report' to generate a read-only link for your client — clean performance view, no login required, no access to settings or other accounts.", highlightId:"tour-share-report", tab:"campaigns" },
  8:{ title:"Automated Reports", label:`8 / ${TOTAL_STEPS}  ·  Reports`, body:"Weekly and monthly reports auto-generated per client. Select a client and date range, hit Generate — get a full performance snapshot ready to email.", tab:"reports" },
  9:{ title:"Your AI Is Always Here", label:`9 / ${TOTAL_STEPS}  ·  AI Assistant`, body:"The ✦ button is always here — on every page. Ask about your campaigns, get help building an ad, request a performance summary.", highlightId:"tour-agent-btn" },
  10:{ title:"You're All Set 🎉", label:`10 / ${TOTAL_STEPS}  ·  Ready`, body:"That's the full picture. Start your free trial and run your first real campaign — connect your ad account and the AI takes it from there.", centered:true },
};

// ── AdMockup (matches real product exactly) ───────────────────────────────────
function AdMockup({ headline, body: adBody, clientName }: { headline:string|null; body:string|null; clientName:string }) {
  const initials = clientName.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (
    <div style={{ width:"100%", maxWidth:244, background:"#fff", borderRadius:10, boxShadow:"0 2px 12px rgba(0,0,0,0.25)", overflow:"hidden", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <div style={{ padding:"10px 12px 6px", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>{initials}</div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#1c1e21", lineHeight:1.2 }}>{clientName}</div>
          <div style={{ fontSize:10, color:"#65676b" }}>Sponsored · 🌐</div>
        </div>
      </div>
      {adBody && <div style={{ padding:"2px 12px 8px", fontSize:11, color:"#1c1e21", lineHeight:1.5 }}>{adBody.length > 90 ? adBody.slice(0,90)+"…" : adBody}</div>}
      <div style={{ width:"100%", height:120, background:"linear-gradient(135deg,#1a1d2e,#2a2f45,#1e2235)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
        <div style={{ fontSize:22, opacity:0.4 }}>🖼</div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", textTransform:"uppercase" as const }}>Creative</div>
      </div>
      <div style={{ padding:"8px 12px 10px", background:"#f0f2f5", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#1c1e21", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>{headline ?? clientName}</div>
          <div style={{ fontSize:10, color:"#65676b" }}>Learn more</div>
        </div>
        <div style={{ padding:"5px 10px", background:"#e4e6eb", borderRadius:5, fontSize:10, fontWeight:700, color:"#1c1e21", whiteSpace:"nowrap", flexShrink:0 }}>Learn More</div>
      </div>
      <div style={{ padding:"6px 12px", borderTop:"1px solid #e4e6eb", display:"flex", gap:16 }}>
        {["👍 Like","💬 Comment","↗ Share"].map(i=><div key={i} style={{ fontSize:10, color:"#65676b", fontWeight:600 }}>{i}</div>)}
      </div>
    </div>
  );
}

// ── Ad Creator Overlay (split-panel, scripted chat, matches real product) ─────
interface AdMsg { id:string; role:"user"|"assistant"; content:string; }
const AD_SCRIPT = [
  { response:`I'm ready to build a new campaign for **Summit Roofing Co**.\n\nFirst — do you have an existing ad set you'd like to add this to, or should I create a **new campaign** from scratch?` },
  { response:`Got it. What's the main **offer**?\n\nFor example: "free roof inspection", "same-day repair quote", or a seasonal promotion.` },
  { response:`Perfect. Who are we targeting? Think about **age range, location, and homeowner status**.\n\nFor example: "homeowners 35–65 in San Diego County, 25mi radius."` },
  { response:`Great. What's the **daily or monthly budget** for this campaign?` },
  { response:`Here are **3 headline options**:\n\n1. "Free Roof Inspection — Book Today"\n2. "Storm Damage? We'll Fix It Fast"\n3. "Same-Week Roofing Inspection — No Pressure"\n\nWhich do you prefer, or want to tweak?` },
  { response:`Locked in. Here's the **ad copy**:\n\n**Headline:** Free Roof Inspection — Book Today\n**Primary Text:** Your roof took a hit this storm season — and you might not even know it. Get a FREE inspection from Summit Roofing before the damage gets worse. No pressure, no obligation.\n\nShall I **create this campaign** and queue it for approval?` },
  { response:`✅ **Campaign created and queued for approval.**\n\nHead to the Ads tab to review the copy and approve when ready. It won't go live until you give the green light.` },
];

function DemoAdCreatorOverlay({ clientName, onClose }: { clientName:string; onClose:()=>void }) {
  const [messages, setMessages] = useState<AdMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [spec, setSpec] = useState({ headline:"", body:"", created:false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initiated = useRef(false);

  const streamResponse = useCallback((text:string, id:string, onDone?:()=>void) => {
    setMessages(prev => [...prev, { id, role:"assistant", content:"" }]);
    let i = 0;
    const interval = setInterval(() => {
      i += 4;
      setMessages(prev => prev.map(m => m.id===id ? { ...m, content:text.slice(0,i) } : m));
      if (i >= text.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(m => m.id===id ? { ...m, content:text } : m));
        setLoading(false);
        onDone?.();
      }
    }, 14);
  }, []);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    setLoading(true);
    streamResponse(AD_SCRIPT[0].response, "init");
  }, [streamResponse]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  function send() {
    if (!input.trim() || loading) return;
    const userMsg:AdMsg = { id:Date.now().toString(), role:"user", content:input.trim() };
    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const next = Math.min(scriptIdx + 1, AD_SCRIPT.length - 1);
    setScriptIdx(next);
    const resp = AD_SCRIPT[next].response;
    setTimeout(() => {
      streamResponse(resp, (Date.now()+1).toString(), () => {
        // Extract spec from response
        if (resp.includes("Free Roof Inspection")) setSpec(s => ({ ...s, headline:"Free Roof Inspection — Book Today" }));
        if (resp.includes("Primary Text:")) setSpec(s => ({ ...s, body:"Your roof took a hit this storm season — and you might not even know it. Get a FREE inspection from Summit Roofing before the damage gets worse." }));
        if (resp.includes("created and queued")) setSpec(s => ({ ...s, created:true }));
      });
    }, 600);
  }

  function renderMd(text:string): React.ReactNode {
    return text.split("\n").map((line,i,arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p,j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j} style={{ color:T.text, fontWeight:700 }}>{p.slice(2,-2)}</strong>
          : <span key={j}>{p}</span>
      );
      return <span key={i}>{parts}{i < arr.length-1 && <br/>}</span>;
    });
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.88)", backdropFilter:"blur(4px)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
      <div style={{ width:"94vw", height:"92vh", maxWidth:1200, background:"#13151d", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff" }}>✦</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Create with Buena Onda</div>
              <div style={{ fontSize:11, color:T.faint }}>{clientName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:T.muted, fontSize:22, cursor:"pointer", lineHeight:1, padding:"4px 8px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 380px", overflow:"hidden" }}>

          {/* Left — Chat */}
          <div style={{ display:"flex", flexDirection:"column", borderRight:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:16 }}>
              {messages.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:10, opacity:0.5 }}>
                  <div style={{ width:24, height:24, border:`2px solid ${T.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
                  <span style={{ fontSize:13, color:T.muted }}>Starting your ad creation session…</span>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection:msg.role==="user"?"row-reverse":"row" }}>
                  {msg.role==="assistant" && (
                    <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:11, color:"#fff", flexShrink:0, marginTop:2 }}>✦</div>
                  )}
                  <div style={{ maxWidth:"78%", padding:"11px 15px", borderRadius:msg.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px", background:msg.role==="user"?T.accentBg:"rgba(255,255,255,0.05)", border:msg.role==="user"?`1px solid ${T.accentBorder}`:"1px solid rgba(255,255,255,0.06)", fontSize:13, color:T.text, lineHeight:1.65 }}>
                    {msg.content ? renderMd(msg.content) : (
                      <span style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {[0,1,2].map(i=><span key={i} style={{ width:5, height:5, borderRadius:"50%", background:T.muted, animation:`bounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"16px 24px 20px", borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                <button title="Attach creative" style={{ width:46, height:46, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:T.muted, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📎</button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
                  placeholder="Type your answer…"
                  rows={2}
                  disabled={loading || spec.created}
                  style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"11px 14px", fontSize:13, color:T.text, fontFamily:"'DM Mono',monospace", resize:"none", outline:"none", lineHeight:1.5 }}
                />
                <button onClick={send} disabled={!input.trim()||loading||spec.created} style={{ padding:"11px 18px", background:input.trim()&&!loading&&!spec.created?T.accent:"rgba(245,166,35,0.2)", border:"none", borderRadius:10, color:input.trim()&&!loading&&!spec.created?"#0d0f14":T.faint, fontSize:13, fontWeight:700, cursor:input.trim()&&!loading&&!spec.created?"pointer":"not-allowed", fontFamily:"inherit", flexShrink:0, height:46 }}>Send</button>
              </div>
            </div>
          </div>

          {/* Right — Live Preview */}
          <div style={{ overflowY:"auto", padding:"24px 20px", display:"flex", flexDirection:"column", gap:20, background:"rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.1em" }}>Live Preview</div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <AdMockup headline={spec.headline||null} body={spec.body||null} clientName={clientName}/>
            </div>
            {!spec.headline && !spec.body && !spec.created && (
              <div style={{ textAlign:"center", padding:"20px 10px", color:T.faint, fontSize:12, lineHeight:1.7 }}>
                Your ad preview will build here as the conversation progresses.
              </div>
            )}
            {spec.headline && spec.body && !spec.created && (
              <div style={{ background:T.accentBg, border:`1px solid ${T.accentBorder}`, borderRadius:8, padding:"10px 14px", fontSize:12, color:T.accent }}>
                Looking good — tell Buena Onda to create the campaign when you're ready.
              </div>
            )}
            {spec.created && (
              <div style={{ background:"rgba(46,204,113,0.1)", border:"1px solid rgba(46,204,113,0.3)", borderRadius:10, padding:"14px 16px", textAlign:"center" as const }}>
                <div style={{ fontSize:20, marginBottom:6 }}>✅</div>
                <div style={{ fontSize:13, fontWeight:600, color:T.healthy, marginBottom:4 }}>Ad Created!</div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:14 }}>It's in your Pending Approval queue. Review the copy and approve when ready.</div>
                <Link href="/#pricing" style={{ padding:"8px 20px", background:T.healthy, border:"none", borderRadius:7, color:"#0d0f14", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textDecoration:"none", display:"inline-block" }}>Start Free →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Chat Bubble (matches real ChatBubble) ──────────────────────────────────
interface ChatMsg { id:string; role:"user"|"assistant"; content:string; }
const SUGGESTED_PROMPTS = [
  "Which ad sets should I scale right now?",
  "Pause my worst performing ad set",
  "What's my best performing campaign?",
  "How can I lower my CPL?",
  "Create a campaign for roofing targeting homeowners in San Diego with $50/day",
  "Analyze my campaign performance",
];

function DemoChatBubble({ clientName, highlightStyle }: { clientName:string; highlightStyle:React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      setOpen(true);
      if (detail?.message) {
        setTimeout(() => sendMsg(detail.message), 100);
      }
    }
    document.addEventListener("buenaonda:open-chat", handler);
    return () => document.removeEventListener("buenaonda:open-chat", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function sendMsg(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg:ChatMsg = { id:Date.now().toString(), role:"user", content };
    const streamingId = (Date.now()+1).toString();
    setMessages(prev => [...prev, userMsg, { id:streamingId, role:"assistant", content:"" }]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }));
      const res = await fetch("/api/demo/chat", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ messages:history }) });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream:true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try { const p = JSON.parse(data); if (p.text) setMessages(prev => prev.map(m => m.id===streamingId ? { ...m, content:m.content+p.text } : m)); }
          catch { /* ignore */ }
        }
      }
    } catch { setMessages(prev => prev.map(m => m.id===streamingId ? { ...m, content:"Sorry, something went wrong." } : m)); }
    finally { setLoading(false); }
  }

  function renderMd(text:string): React.ReactNode {
    return text.split("\n").map((line,i,arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p,j) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={j} style={{ color:T.text, fontWeight:700 }}>{p.slice(2,-2)}</strong> : <span key={j}>{p.replace(/--/g,"—")}</span>
      );
      return <span key={i}>{parts}{i < arr.length-1 && <br/>}</span>;
    });
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{ position:"fixed", bottom:84, right:24, width:400, height:560, background:"#13151d", border:`1px solid ${T.accentBorder}`, borderRadius:16, boxShadow:"0 16px 48px rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", zIndex:1050, overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"#0f111a" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff" }}>✦</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Buena Onda AI</div>
                <div style={{ fontSize:11, color:T.accent }}>{clientName}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:"transparent", border:"none", color:T.muted, fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
            {/* Opening message */}
            {messages.length === 0 && (
              <>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff", flexShrink:0, marginTop:2 }}>✦</div>
                  <div style={{ maxWidth:"85%", padding:"10px 14px", borderRadius:"12px 12px 12px 4px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.06)", fontSize:13, color:T.text, lineHeight:1.65 }}>
                    Hey! I'm your Buena Onda AI. I have live access to <strong style={{ color:T.accent }}>{clientName}</strong>'s campaign data. Ask me anything — I can analyze performance, pause bad campaigns, scale winners, or build a new ad from scratch.
                  </div>
                </div>
                <div style={{ paddingLeft:34 }}>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:8 }}>Try asking:</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {SUGGESTED_PROMPTS.map(s => (
                      <button key={s} onClick={() => sendMsg(s)} style={{ padding:"7px 12px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, textAlign:"left" as const, cursor:"pointer", fontFamily:"inherit", lineHeight:1.4 }}>{s}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:msg.role==="user"?"row-reverse":"row" }}>
                {msg.role==="assistant" && <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff", flexShrink:0, marginTop:2 }}>✦</div>}
                <div style={{ maxWidth:"85%", padding:"10px 14px", borderRadius:msg.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px", background:msg.role==="user"?T.accentBg:"rgba(255,255,255,0.05)", border:msg.role==="user"?`1px solid ${T.accentBorder}`:"1px solid rgba(255,255,255,0.06)", fontSize:13, color:T.text, lineHeight:1.65 }}>
                  {msg.content ? renderMd(msg.content) : <span style={{ display:"flex", gap:3 }}>{[0,1,2].map(i=><span key={i} style={{ width:4, height:4, borderRadius:"50%", background:T.muted, display:"inline-block" }}/>)}</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:"12px 14px 14px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button title="Upload creative" style={{ width:36, height:36, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:8, color:T.muted, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📎</button>
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); sendMsg(); } }}
                placeholder="Ask anything…"
                disabled={loading}
                style={{ flex:1, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.text, fontFamily:"inherit", outline:"none" }}
              />
              <button onClick={()=>sendMsg()} disabled={!input.trim()||loading} style={{ padding:"9px 14px", borderRadius:8, border:"none", background:input.trim()&&!loading?T.accent:"rgba(245,166,35,0.2)", color:input.trim()&&!loading?"#0d0f14":T.faint, fontSize:12, fontWeight:700, cursor:input.trim()&&!loading?"pointer":"not-allowed", fontFamily:"inherit", flexShrink:0 }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        id="tour-agent-btn"
        onClick={() => setOpen(v=>!v)}
        style={{ position:"fixed", bottom:24, right:24, width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#f5a623,#f76b1c)", border:"none", color:"#0d0f14", fontSize:20, cursor:"pointer", zIndex:1001, boxShadow:"0 4px 20px rgba(245,166,35,0.45)", display:"flex", alignItems:"center", justifyContent:"center", ...highlightStyle }}
      >✦</button>
    </>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function MetricBox({ label, value, sub, color }: { label:string; value:string; sub:string; color?:string }) {
  return (
    <div>
      <div style={{ fontSize:9, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.4px", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:800, color:color??T.text, letterSpacing:"-0.5px" }}>{value}</div>
      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{sub}</div>
    </div>
  );
}

function ClientCard({ name, accountId, vertical, onSelect }: { name:string; accountId:string; vertical:string; onSelect:()=>void }) {
  const [hovered, setHovered] = useState(false);
  const status = CLIENT_STATUS[accountId] ?? "healthy";
  const st = STATUS_CFG[status];
  const isLeads = vertical === "leads";
  const isCritical = status === "critical";
  const summary = getDemoSummary(accountId) as { current:{ total_leads:number; avg_cpl:string; active_ad_sets:number; total_spend:string } };
  const campaigns = getDemoCampaigns(accountId, 30) as Array<{ spend:number; leads:number; cpl:number; purchases:number; purchase_value:number; roas:number; status:string }>;
  const totalSpend = campaigns.reduce((s,c)=>s+c.spend,0);
  const totalLeads = summary.current.total_leads;
  const avgCPL = parseFloat(summary.current.avg_cpl);
  const totalPurchases = campaigns.reduce((s,c)=>s+(c.purchases??0),0);
  const totalPurchaseValue = campaigns.reduce((s,c)=>s+(c.purchase_value??0),0);
  const avgROAS = totalSpend > 0 ? totalPurchaseValue/totalSpend : 0;
  const avgCPA = totalPurchases > 0 ? totalSpend/totalPurchases : 0;
  const alert = status==="critical"?"Campaigns paused — needs attention":status==="warning"?"Above CPL target — review recommended":null;
  return (
    <div onClick={onSelect} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ background:T.surface, border:`1px solid ${hovered?T.accent+"50":isCritical?T.critical+"30":T.border}`, borderRadius:10, padding:"16px 18px", cursor:"pointer", transition:"border-color 0.15s" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:alert?6:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:st.color, flexShrink:0 }}/>
          <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{name}</span>
          <span style={{ fontSize:11, fontWeight:600, color:isLeads?T.leads:T.ecomm, background:isLeads?T.leadsBg:T.ecommBg, padding:"2px 7px", borderRadius:4 }}>{isLeads?"Lead Gen":"Ecommerce"}</span>
        </div>
        <span style={{ fontSize:11, fontWeight:600, color:st.color, background:st.bg, padding:"3px 9px", borderRadius:5 }}>{st.label}</span>
      </div>
      {alert && <div style={{ fontSize:12, color:st.color, marginBottom:12, paddingLeft:15 }}>! {alert}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {isLeads ? (
          <>
            <MetricBox label="CPL" value={avgCPL>0?`$${avgCPL.toFixed(0)}`:"—"} sub="cost per lead" color={avgCPL>50?T.warning:T.healthy}/>
            <MetricBox label="Leads (30d)" value={String(totalLeads)} sub="from ads"/>
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="total spend"/>
            <MetricBox label="Campaigns" value={String(campaigns.length)} sub="with data"/>
          </>
        ) : (
          <>
            <MetricBox label="Spend (30d)" value={`$${totalSpend.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="total spend"/>
            <MetricBox label="ROAS" value={avgROAS>0?`${avgROAS.toFixed(2)}x`:"—"} sub="return on ad spend" color={avgROAS>=2?T.healthy:avgROAS>0?T.warning:undefined}/>
            <MetricBox label="Purchases" value={String(totalPurchases)} sub="conversions"/>
            <MetricBox label="CPA" value={avgCPA>0?`$${avgCPA.toFixed(0)}`:"—"} sub="cost per acq."/>
          </>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
        <span style={{ fontSize:12, color:T.accent, fontWeight:600 }}>View Account →</span>
      </div>
    </div>
  );
}

// ── Main Demo Page ────────────────────────────────────────────────────────────
export default function DemoPage() {
  const clients = [...DEMO_CLIENTS_CONFIG];
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [activeClient, setActiveClient] = useState(clients[0].name);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [timeRange, setTimeRange] = useState("30D");
  const [lastUpdated] = useState(() => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")} ${now.getHours()>=12?"PM":"AM"}`;
  });

  // Reports state
  const [reportClient, setReportClient] = useState<string>(clients[0]?.name ?? "");
  const [reportStart, setReportStart] = useState(() => { const d=new Date(); d.setDate(d.getDate()-7); return d.toISOString().split("T")[0]; });
  const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportEmail, setReportEmail] = useState(false);
  const [reportEmailTo, setReportEmailTo] = useState("");
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Tour state
  const [tourStep, setTourStep] = useState(1);
  const [tourActive, setTourActive] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function applyStep(s: number) {
    const cfg = STEPS[s];
    if (!cfg) return;
    if (cfg.tab) setActiveTab(cfg.tab);
    else if (s < 5) setActiveTab("overview");
    if (cfg.openCreator) setShowCreator(true);
    else setShowCreator(false);
    if (s === 9) document.dispatchEvent(new CustomEvent("buenaonda:open-chat"));
  }
  function nextStep() {
    if (tourStep === TOTAL_STEPS) { setTourActive(false); return; }
    applyStep(tourStep + 1);
    setTourStep(s => s+1);
  }
  function prevStep() {
    applyStep(tourStep - 1);
    setTourStep(s => s-1);
  }

  // Aggregate stats
  const totalSpendAll = clients.reduce((sum,c) => { const cmpns = getDemoCampaigns(c.meta_ad_account_id,30) as Array<{spend:number}>; return sum + cmpns.reduce((s,x)=>s+x.spend,0); }, 0);
  const totalLeadsAll = clients.reduce((sum,c) => { const s = getDemoSummary(c.meta_ad_account_id) as { current:{ total_leads:number } }; return sum + s.current.total_leads; }, 0);
  const attentionCount = Object.values(CLIENT_STATUS).filter(s=>s==="critical"||s==="warning").length;
  const visibleRecs = RECS.filter(r=>!dismissed.has(r.id));

  const activeClientObj = clients.find(c=>c.name===activeClient) ?? clients[0];
  const activeCampaigns = getDemoCampaigns(activeClientObj.meta_ad_account_id,30) as Array<{ name?:string; spend:number; leads:number; cpl:number; purchases:number; purchase_value:number; roas:number; status:string; ctr:number; frequency:number; impressions:number }>;

  function hl(id:string): React.CSSProperties {
    if (!tourActive || STEPS[tourStep]?.highlightId !== id) return {};
    return { outline:"2px solid rgba(245,166,35,0.85)", outlineOffset:6, borderRadius:10, transition:"outline 0.3s ease" };
  }

  // ── Campaigns tab derived ──
  const cTotal = activeCampaigns.reduce((s,c)=>s+c.spend,0);
  const lTotal = activeCampaigns.reduce((s,c)=>s+(c.leads??0),0);
  const avgCPL = lTotal>0?cTotal/lTotal:0;
  const avgCTR = activeCampaigns.length>0?activeCampaigns.reduce((s,c)=>s+(c.ctr??0),0)/activeCampaigns.length:0;
  const avgFreq = activeCampaigns.length>0?activeCampaigns.reduce((s,c)=>s+(c.frequency??0),0)/activeCampaigns.length:0;
  const totalImpressions = activeCampaigns.reduce((s,c)=>s+(c.impressions??0),0);
  const sparkVals = [42,58,51,73,66,80,Math.round(cTotal/30)].map(v=>v||30);
  const sparkMax = Math.max(...sparkVals);
  const W=560; const H=80;
  const pts = sparkVals.map((v,i)=>`${(i/(sparkVals.length-1))*W},${H-(v/sparkMax)*H*0.85}`).join(" ");

  return (
    <>
      <style>{`
        @keyframes tourFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tourFadeInCentered { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>

      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Mono','Fira Mono',monospace", color:T.text, paddingBottom:80 }}>

        {/* ── Demo banner (sticky) ── */}
        <div style={{ background:"linear-gradient(135deg,#f5a623,#f76b1c)", padding:"9px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", position:"sticky", top:0, zIndex:200 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#0d0f14" }}>🎯 Live demo — the actual Buena Onda dashboard with sample agency data. No sign-up needed.</div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Link href="/" style={{ fontSize:12, color:"rgba(0,0,0,0.55)", textDecoration:"none" }}>← Back to site</Link>
            <Link href="/#pricing" style={{ fontSize:12, fontWeight:800, color:"#f76b1c", background:"#0d0f14", padding:"6px 16px", borderRadius:6, textDecoration:"none" }}>Start Free →</Link>
          </div>
        </div>

        {/* ── Top nav ── */}
        <div style={{ height:52, background:T.bg, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:0, position:"sticky", top:40, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:24 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#f5a623,#f76b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:"#fff", boxShadow:`0 3px 10px ${T.accentGlow}` }}>B</div>
            <span style={{ fontWeight:800, fontSize:14, color:T.text, letterSpacing:"-0.3px" }}>Buena Onda</span>
          </div>

          <nav style={{ display:"flex", gap:2, flex:1 }}>
            {NAV_ITEMS.map(label => {
              const tab = label.toLowerCase() as Tab;
              const isActive = tab === activeTab;
              return (
                <button key={label} onClick={()=>setActiveTab(tab)} style={{ padding:"5px 13px", fontSize:12, borderRadius:6, border:"none", fontFamily:"inherit", background:isActive?T.accentBg:"transparent", color:isActive?T.accent:T.muted, fontWeight:isActive?600:400, cursor:"pointer" }}>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Client switcher */}
          <div style={{ position:"relative", marginRight:16 }}>
            <button onClick={()=>setShowSwitcher(v=>!v)} style={{ display:"flex", alignItems:"center", gap:8, background:showSwitcher?"rgba(255,255,255,0.05)":"transparent", border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 11px", cursor:"pointer", color:T.text, fontFamily:"inherit", fontSize:12, fontWeight:500, minWidth:160 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:T.leads, flexShrink:0 }}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{activeClient}</span>
              <span style={{ color:T.faint, fontSize:9, marginLeft:"auto" }}>▾</span>
            </button>
            {showSwitcher && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:200, background:"#13151d", border:`1px solid ${T.border}`, borderRadius:10, minWidth:240, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxHeight:340, overflowY:"auto" }}>
                {clients.map(c=>(
                  <div key={c.meta_ad_account_id} onClick={()=>{ setActiveClient(c.name); setShowSwitcher(false); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", cursor:"pointer", background:activeClient===c.name?"rgba(245,166,35,0.08)":"transparent", borderLeft:activeClient===c.name?`2px solid ${T.accent}`:"2px solid transparent" }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:c.vertical==="leads"?T.leads:T.ecomm, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:T.text }}>{c.name}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>{c.vertical}</div>
                    </div>
                    {activeClient===c.name && <span style={{ color:T.accent, fontSize:12 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={()=>document.dispatchEvent(new CustomEvent("buenaonda:open-chat"))} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", marginRight:14, padding:"4px 6px", borderRadius:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T.muted, lineHeight:1 }}>?</span>
            <span style={{ fontSize:9, color:T.faint, letterSpacing:"0.3px" }}>Help</span>
          </button>
          <Link href="/#pricing" style={{ fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:7, background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", textDecoration:"none", whiteSpace:"nowrap" }}>Start Free</Link>
        </div>

        {/* ── Page content ── */}
        <div style={{ padding:"26px 28px" }}>

          {/* ═══════════════════════ OVERVIEW ══════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.5px" }}>Good morning 👋</div>
                  <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Demo Account · <span style={{ color:T.critical }}>{ALERTS.length} accounts need attention</span></div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ display:"flex", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:3, gap:2 }}>
                    {["Today","7d","30d","90d","Max"].map(l=>(
                      <button key={l} style={{ padding:"4px 11px", fontSize:12, borderRadius:6, border:"none", cursor:"default", fontFamily:"inherit", fontWeight:l==="30d"?700:400, background:l==="30d"?T.accent:"transparent", color:l==="30d"?"#fff":T.muted }}>{l}</button>
                    ))}
                  </div>
                  <button id="tour-ads-create" onClick={()=>{ setActiveTab("ads"); setShowCreator(true); }} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit", ...hl("tour-ads-create") }}>+ New Campaign</button>
                </div>
              </div>

              {/* Stat strip */}
              <div id="tour-overview-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28, ...hl("tour-overview-stats") }}>
                {[
                  { label:"Total Spend (30d)", value:`$${totalSpendAll.toLocaleString(undefined,{maximumFractionDigits:0})}`, sub:`across ${clients.length} accounts`, color:T.text, border:T.border },
                  { label:"Leads (30d)", value:String(totalLeadsAll), sub:`${clients.filter(c=>c.vertical==="leads").length} lead gen accounts`, color:T.leads, border:T.leads+"30" },
                  { label:"Needing Attention", value:String(attentionCount), sub:"2 critical", color:T.warning, border:T.warning+"40" },
                  { label:"Accounts Connected", value:`${clients.length} / ${clients.length}`, sub:"all connected", color:T.healthy, border:T.healthy+"30" },
                ].map((s,i)=>(
                  <div key={i} style={{ background:T.surface, border:`1px solid ${s.border}`, borderRadius:10, padding:"18px 20px" }}>
                    <div style={{ fontSize:10, color:T.muted, marginBottom:6, fontWeight:500, textTransform:"uppercase" as const, letterSpacing:"0.4px" }}>{s.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-1px" }}>{s.value}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:18 }}>
                <div>
                  {/* Alerts */}
                  <div id="tour-alerts" style={{ marginBottom:16, ...hl("tour-alerts") }}>
                    <div onClick={()=>setAlertsCollapsed(v=>!v)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:alertsCollapsed?0:8, cursor:"pointer", userSelect:"none" as const }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase" as const }}>Alerts</span>
                        <span style={{ fontSize:10, fontWeight:700, color:"#fff", background:T.critical, borderRadius:10, padding:"1px 7px" }}>{ALERTS.length}</span>
                      </div>
                      <span style={{ fontSize:11, color:T.faint }}>{alertsCollapsed?"▶":"▼"}</span>
                    </div>
                    {!alertsCollapsed && ALERTS.map((a,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", marginBottom:6, background:a.severity==="error"?"rgba(255,77,77,0.06)":"rgba(232,184,75,0.06)", border:`1px solid ${a.severity==="error"?"rgba(255,77,77,0.2)":"rgba(232,184,75,0.2)"}`, borderRadius:8 }}>
                        <span style={{ fontSize:12, flexShrink:0 }}>{a.severity==="error"?"🔴":"🟡"}</span>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:a.severity==="error"?T.critical:T.warning }}>{a.client}</span>
                          <span style={{ fontSize:12, color:T.muted }}> — {a.msg}</span>
                        </div>
                        <span style={{ fontSize:10, color:T.faint }}>→</span>
                      </div>
                    ))}
                  </div>

                  {/* Client accounts */}
                  <div id="tour-client-accounts" style={{ ...hl("tour-client-accounts") }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase" as const }}>Client Accounts</div>
                      <div style={{ display:"flex", gap:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:T.muted }}><div style={{ width:7, height:7, borderRadius:2, background:T.leads }}/> Lead Gen</div>
                        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:T.muted }}><div style={{ width:7, height:7, borderRadius:2, background:T.ecomm }}/> Ecommerce</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                      {clients.map(c=><ClientCard key={c.meta_ad_account_id} name={c.name} accountId={c.meta_ad_account_id} vertical={c.vertical} onSelect={()=>setActiveClient(c.name)}/>)}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div id="tour-recommendations" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", ...hl("tour-recommendations") }}>
                    <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase" as const }}>Recommendations</div>
                      {visibleRecs.length>0 && <span style={{ fontSize:11, fontWeight:700, color:"#fff", background:T.critical, borderRadius:10, padding:"1px 7px" }}>{visibleRecs.length}</span>}
                    </div>
                    {visibleRecs.map((rec,i)=>{
                      const bc = rec.priority==="critical"?T.critical:rec.priority==="warning"?T.warning:T.accent;
                      return (
                        <div key={rec.id} style={{ padding:"12px 16px", borderBottom:i<visibleRecs.length-1?`1px solid ${T.border}`:"none", borderLeft:`3px solid ${bc}` }}>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{rec.icon}</span>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:2 }}>{rec.title}</div>
                              <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{rec.body}</div>
                            </div>
                          </div>
                          {done.has(rec.id) ? (
                            <div style={{ marginTop:8, padding:"6px 10px", borderRadius:5, background:"rgba(46,204,113,0.12)", color:"#2ecc71", fontSize:11, fontWeight:600, textAlign:"center" as const }}>✓ Done — changes applied</div>
                          ) : (
                            <div style={{ display:"flex", gap:6, marginTop:8 }}>
                              <button onClick={()=>setDone(d=>new Set([...d,rec.id]))} style={{ flex:1, padding:"5px 0", fontSize:11, fontWeight:600, borderRadius:5, border:"none", background:bc+"22", color:bc, cursor:"pointer", fontFamily:"inherit" }}>{rec.approveLabel}</button>
                              <button onClick={()=>setDismissed(d=>new Set([...d,rec.id]))} style={{ padding:"5px 8px", fontSize:11, borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background:T.surface, border:`1px solid ${T.accent}30`, borderRadius:10, padding:"16px" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase" as const, marginBottom:14 }}>Agent Status</div>
                    {[
                      { label:"Accounts monitored", value:`${clients.length} / ${clients.length}` },
                      { label:"Accounts connected", value:`${clients.length} / ${clients.length}` },
                      { label:"Accounts healthy", value:`${Object.values(CLIENT_STATUS).filter(s=>s==="healthy").length} / ${clients.length}` },
                      { label:"Needing attention", value:String(attentionCount), warn:true },
                    ].map((row,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                        <span style={{ fontSize:12, color:T.muted }}>{row.label}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:row.warn?T.warning:T.text }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:14 }}>
                      <Link href="/#pricing" style={{ display:"block", textAlign:"center" as const, padding:"9px", borderRadius:8, background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:12, fontWeight:800, textDecoration:"none" }}>Connect your account →</Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════ CAMPAIGNS ═════════════════════════════════ */}
          {activeTab === "campaigns" && (
            <div>
              {/* Header row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 4px", letterSpacing:"-0.5px" }}>Campaigns</h1>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.muted }}>
                    Live performance · Campaign &rsaquo; Ad Set &rsaquo; Ad
                    <button style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", border:`1px solid ${T.border}`, borderRadius:5, background:"transparent", color:T.muted, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>↻ Refresh <span style={{ color:T.faint }}>{lastUpdated}</span></button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {/* Time range */}
                  <div style={{ display:"flex", background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:3, gap:1 }}>
                    {["1D","7D","30D","90D","MAX"].map(t=>(
                      <button key={t} onClick={()=>setTimeRange(t)} style={{ padding:"4px 10px", fontSize:11, borderRadius:5, border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:t===timeRange?700:400, background:t===timeRange?T.accent:"transparent", color:t===timeRange?"#0d0f14":T.muted }}>{t}</button>
                    ))}
                  </div>
                  <button id="tour-share-report" style={{ fontSize:12, padding:"7px 14px", borderRadius:7, border:`1px solid ${T.border}`, background:T.surface, color:T.muted, cursor:"pointer", fontFamily:"inherit", ...hl("tour-share-report") }}>↗ Share Report</button>
                </div>
              </div>

              {/* Alert banner */}
              {ALERTS.filter(a=>a.severity==="warning").slice(0,1).map((a,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:16, background:"rgba(232,184,75,0.06)", border:"1px solid rgba(232,184,75,0.25)", borderLeft:"3px solid #e8b84b", borderRadius:8 }}>
                  <span style={{ fontSize:13 }}>🟡</span>
                  <div style={{ flex:1, fontSize:12, color:T.warning }}><strong>{a.client}</strong> — {a.msg}</div>
                  <span style={{ fontSize:11, color:T.faint, cursor:"pointer" }}>✕</span>
                </div>
              ))}

              {/* Stat cards */}
              <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                {[
                  { label:"Amount Spent", value:`$${cTotal.toLocaleString(undefined,{maximumFractionDigits:0})}`, sub:timeRange },
                  { label:"Leads", value:String(lTotal), sub:timeRange, color:T.leads },
                  { label:"Cost Per Lead", value:avgCPL>0?`$${avgCPL.toFixed(2)}`:"—", sub:timeRange, color:avgCPL>50?T.warning:T.healthy },
                  { label:"CTR", value:avgCTR>0?`${(avgCTR*100).toFixed(2)}%`:"—", sub:timeRange },
                  { label:"Frequency", value:avgFreq>0?avgFreq.toFixed(2):"—", sub:timeRange, color:avgFreq>3.5?T.warning:undefined },
                ].map((s,i)=>(
                  <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 20px", flex:"1 1 140px", minWidth:120 }}>
                    <div style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:8 }}>{s.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:s.color??T.text, letterSpacing:"-0.5px", marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:10, color:T.faint }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Show Charts */}
              <div style={{ marginBottom:16 }}>
                <button id="tour-chart-toggle" onClick={()=>setShowCharts(v=>!v)} style={{ fontSize:12, padding:"7px 14px", borderRadius:7, border:`1px solid ${T.border}`, background:T.surface, color:T.muted, cursor:"pointer", fontFamily:"inherit", ...hl("tour-chart-toggle") }}>
                  {showCharts?"Hide Charts ↙":"Show Charts ↗"}
                </button>
              </div>

              {showCharts && (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"20px 24px", marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Amount Spent — Last 7 Days · {activeClient}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {["Spend","CPL","ROAS","CTR","Frequency"].map(m=>(
                        <button key={m} style={{ fontSize:11, padding:"4px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:m==="Spend"?T.accentBg:"transparent", color:m==="Spend"?T.accent:T.faint, cursor:"pointer", fontFamily:"inherit" }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position:"relative", height:90 }}>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"100%", overflow:"visible" }} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.35"/>
                          <stop offset="100%" stopColor="#f5a623" stopOpacity="0.02"/>
                        </linearGradient>
                      </defs>
                      <polyline fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts}/>
                      <polygon fill="url(#cg)" points={`0,${H} ${pts} ${W},${H}`}/>
                      {sparkVals.map((v,i)=><circle key={i} cx={(i/(sparkVals.length-1))*W} cy={H-(v/sparkMax)*H*0.85} r="4" fill="#f5a623"/>)}
                    </svg>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d} style={{ fontSize:10, color:T.faint }}>{d}</span>)}
                  </div>
                </div>
              )}

              {/* Campaign table */}
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px" }}>
                  {["Campaign","Amount Spent","Leads","Cost Per Lead","CTR","Frequency","Impressions","Reach","CPM"].map(h=>(
                    <div key={h} style={{ textAlign:h==="Campaign"?"left":"right" as const }}>{h}</div>
                  ))}
                </div>
                {activeCampaigns.slice(0,8).map((c,i)=>{
                  const statusColor = (c.status==="active"||c.status==="ACTIVE")?T.healthy:T.warning;
                  const impressions = c.impressions ?? Math.round(c.spend * 180);
                  const reach = Math.round(impressions * 0.62);
                  const cpm = impressions > 0 ? (c.spend/impressions)*1000 : 0;
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:i<Math.min(activeCampaigns.length,8)-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:statusColor, flexShrink:0 }}/>
                        <div>
                          <div style={{ fontSize:12, color:T.text, fontWeight:600 }}>{c.name??`Campaign ${i+1}`}</div>
                          <div style={{ fontSize:10, color:T.faint, marginTop:1 }}><span style={{ fontSize:10, fontWeight:600, color:statusColor, background:statusColor+"20", padding:"1px 6px", borderRadius:3 }}>{(c.status==="active"||c.status==="ACTIVE")?"Active":"Paused"}</span></div>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>${c.spend.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{c.leads||"—"}</div>
                      <div style={{ fontSize:12, color:c.cpl>50?T.warning:T.muted, textAlign:"right" as const }}>{c.cpl>0?`$${c.cpl.toFixed(2)}`:"—"}</div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{c.ctr>0?`${(c.ctr*100).toFixed(2)}%`:"—"}</div>
                      <div style={{ fontSize:12, color:c.frequency>3.5?T.warning:T.muted, textAlign:"right" as const }}>{c.frequency>0?c.frequency.toFixed(2):"—"}</div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{impressions.toLocaleString()}</div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{reach.toLocaleString()}</div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{cpm>0?`$${cpm.toFixed(2)}`:"—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════ CLIENTS ═══════════════════════════════════ */}
          {activeTab === "clients" && (
            <div>
              <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 6px", letterSpacing:"-0.5px" }}>Clients</h1>
              <p style={{ color:T.muted, fontSize:13, margin:"0 0 24px" }}>All connected ad accounts · {clients.length} total</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                {clients.map(c=><ClientCard key={c.meta_ad_account_id} name={c.name} accountId={c.meta_ad_account_id} vertical={c.vertical} onSelect={()=>setActiveClient(c.name)}/>)}
              </div>
            </div>
          )}

          {/* ═══════════════════════ CREATIVES ═════════════════════════════════ */}
          {activeTab === "creatives" && (
            <div style={{ maxWidth:1000 }}>
              <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 6px", letterSpacing:"-0.5px" }}>Creatives</h1>
              <p style={{ color:T.muted, fontSize:13, margin:"0 0 24px" }}>Ad creative library · Performance by creative</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  { name:"Storm Damage UGC v2", client:"Summit Roofing", spend:187, leads:6, cpl:31, ctr:2.1, freq:2.4, status:"active" },
                  { name:"Free Inspection Static", client:"Summit Roofing", spend:62, leads:2, cpl:31, ctr:3.8, freq:3.1, status:"active" },
                  { name:"Summer Drop DPA", client:"Urban Threads", spend:420, leads:0, cpl:0, ctr:3.2, freq:2.1, status:"active", roas:2.06 },
                  { name:"Invisalign Before/After", client:"Bright Smile Dental", spend:174, leads:3, cpl:58, ctr:1.8, freq:3.2, status:"active" },
                  { name:"Testimonial Carousel", client:"Summit Roofing", spend:44, leads:1, cpl:44, ctr:1.2, freq:1.8, status:"paused" },
                  { name:"Lookalike Broad", client:"Urban Threads", spend:280, leads:0, cpl:0, ctr:1.9, freq:1.6, status:"active", roas:1.14 },
                ].map((cr,i)=>(
                  <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
                    <div style={{ height:120, background:"linear-gradient(135deg,#1a1d2e,#2a2f45,#1e2235)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ fontSize:28, opacity:0.4 }}>🖼</div>
                    </div>
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:2 }}>{cr.name}</div>
                          <div style={{ fontSize:11, color:T.muted }}>{cr.client}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, color:cr.status==="active"?T.healthy:T.warning, background:(cr.status==="active"?T.healthy:T.warning)+"20", padding:"2px 8px", borderRadius:4 }}>{cr.status}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:8 }}>
                        <div><div style={{ fontSize:9, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.4px" }}>Spend</div><div style={{ fontSize:15, fontWeight:700, color:T.text }}>${cr.spend}</div></div>
                        {cr.roas ? (
                          <div><div style={{ fontSize:9, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.4px" }}>ROAS</div><div style={{ fontSize:15, fontWeight:700, color:cr.roas>=2?T.healthy:T.warning }}>{cr.roas}x</div></div>
                        ) : (
                          <div><div style={{ fontSize:9, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.4px" }}>CPL</div><div style={{ fontSize:15, fontWeight:700, color:cr.cpl>50?T.warning:T.healthy }}>{cr.cpl>0?`$${cr.cpl}`:"—"}</div></div>
                        )}
                        <div><div style={{ fontSize:9, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.4px" }}>CTR</div><div style={{ fontSize:15, fontWeight:700, color:T.text }}>{cr.ctr}%</div></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════ ADS ════════════════════════════════════════ */}
          {activeTab === "ads" && (
            <div style={{ maxWidth:960 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:16, flexWrap:"wrap" as const }}>
                <div>
                  <div style={{ fontSize:11, color:T.faint, letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:6 }}>Ad Manager</div>
                  <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0, letterSpacing:"-0.3px" }}>{activeClient}</h1>
                  <div style={{ fontSize:12, color:T.muted, marginTop:4 }}><span style={{ color:T.accent }}>2 pending approval</span></div>
                </div>
                <button id="tour-ads-create" onClick={()=>setShowCreator(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:T.accent, border:"none", borderRadius:8, color:"#0d0f14", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, ...hl("tour-ads-create") }}>✦ Create with Buena Onda</button>
              </div>

              <div style={{ display:"flex", gap:4, background:"#161820", border:`1px solid ${T.border}`, borderRadius:8, padding:4, marginBottom:24, width:"fit-content" }}>
                {[{key:"pending",label:"Pending Approval",count:2},{key:"live",label:"Live",count:2}].map(t=>(
                  <button key={t.key} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:5, border:"none", fontSize:12, fontWeight:t.key==="pending"?600:400, background:t.key==="pending"?"rgba(245,166,35,0.12)":"transparent", color:t.key==="pending"?T.accent:T.muted, cursor:"pointer", fontFamily:"inherit" }}>
                    {t.key==="pending" && <span style={{ width:6, height:6, borderRadius:"50%", background:T.accent, flexShrink:0 }}/>}
                    {t.label} <span style={{ fontSize:10, opacity:0.7 }}>{t.count}</span>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {[
                  { name:"Summit Roofing | Storm Season | Video Lead Gen", budget:75, headline:"Free Roof Inspection — Book Today", body:"Your roof took a hit this storm season — and you might not even know it. Get a FREE inspection from Summit Roofing before the damage gets worse.", targeting:"San Diego, CA · Ages 35–65 · Homeowners" },
                  { name:"Summit Roofing | Free Quote | Retargeting", budget:40, headline:"Get Your Free Roofing Quote", body:"Still thinking about that roof? Summit Roofing is offering free quotes this week only. Takes 10 minutes. Could save you thousands.", targeting:"San Diego, CA · Retargeting 30d" },
                ].map((campaign,idx)=>(
                  <div key={idx} style={{ background:"#161820", border:`1px solid rgba(245,166,35,0.2)`, borderRadius:12, overflow:"hidden" }}>
                    <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:T.accent, background:"rgba(245,166,35,0.12)", padding:"2px 8px", borderRadius:4 }}>Pending Approval</span>
                          <span style={{ fontSize:11, color:T.faint }}>Lead Generation</span>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{campaign.name}</div>
                      </div>
                      <div style={{ fontSize:13, color:T.accent, fontWeight:600 }}>${campaign.budget}/day</div>
                    </div>
                    <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"140px 1fr", gap:20, alignItems:"start" }}>
                      <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:`1px solid ${T.border}` }}>📷</div>
                      <div>
                        <div style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:6 }}>Ad Copy</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:8 }}>{campaign.headline}</div>
                        <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:10 }}>{campaign.body}</div>
                        <div style={{ fontSize:11, color:T.faint }}>Ad Set: {campaign.targeting}</div>
                      </div>
                    </div>
                    <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button onClick={()=>setShowCreator(true)} style={{ padding:"7px 14px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Edit in AI</button>
                      <button style={{ padding:"7px 18px", background:"#2ecc71", border:"none", borderRadius:7, color:"#0d0f14", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✓ Approve & Go Live</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════ REPORTS ════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div>
              <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 6px", letterSpacing:"-0.5px" }}>Reports</h1>
              <p style={{ color:T.muted, fontSize:13, margin:"0 0 28px" }}>Generate performance reports · Email to clients · Print to PDF</p>

              {!reportGenerated && (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"24px", marginBottom:28 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase" as const, marginBottom:20 }}>Generate Report</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:16 }}>
                    <div>
                      <label style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px", display:"block", marginBottom:6 }}>Client</label>
                      <select value={reportClient} onChange={e=>setReportClient(e.target.value)} style={{ width:"100%", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"8px 10px", fontFamily:"inherit", outline:"none" }}>
                        {clients.map(c=><option key={c.meta_ad_account_id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px", display:"block", marginBottom:6 }}>Start Date</label>
                      <input type="date" value={reportStart} onChange={e=>setReportStart(e.target.value)} style={{ width:"100%", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"8px 10px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px", display:"block", marginBottom:6 }}>End Date</label>
                      <input type="date" value={reportEnd} onChange={e=>setReportEnd(e.target.value)} style={{ width:"100%", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12, padding:"8px 10px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const }}/>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, marginBottom:20 }}>
                    {[{label:"Last 7 days",days:7},{label:"Last 30 days",days:30},{label:"This month",days:0}].map(({label,days})=>(
                      <button key={label} onClick={()=>{ const end=new Date(); const start=new Date(); if(days===0) start.setDate(1); else start.setDate(start.getDate()-days); setReportStart(start.toISOString().split("T")[0]); setReportEnd(end.toISOString().split("T")[0]); }} style={{ padding:"5px 12px", fontSize:11, borderRadius:6, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                    <input type="checkbox" id="rEmail" checked={reportEmail} onChange={e=>setReportEmail(e.target.checked)} style={{ width:14, height:14, cursor:"pointer", accentColor:T.accent }}/>
                    <label htmlFor="rEmail" style={{ fontSize:12, color:T.muted, cursor:"pointer" }}>Email this report</label>
                    {reportEmail && <input type="email" value={reportEmailTo} onChange={e=>setReportEmailTo(e.target.value)} placeholder="recipient@email.com" style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:12, padding:"6px 10px", fontFamily:"inherit", outline:"none" }}/>}
                  </div>
                  <button onClick={()=>{ setReportGenerating(true); setTimeout(()=>{ setReportGenerating(false); setReportGenerated(true); },1800); }} disabled={reportGenerating} style={{ width:"100%", padding:"13px", borderRadius:9, border:"none", background:reportGenerating?"rgba(245,166,35,0.3)":"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:13, fontWeight:800, cursor:reportGenerating?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {reportGenerating?<><div style={{ width:14, height:14, border:"2px solid rgba(0,0,0,0.3)", borderTop:"2px solid #0d0f14", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>Generating report…</>:"Generate Report →"}
                  </button>
                </div>
              )}

              {!reportGenerated && !reportGenerating && (
                <div style={{ textAlign:"center", padding:"60px 20px", color:T.muted }}>
                  <div style={{ fontSize:40, marginBottom:14 }}>📋</div>
                  <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:6 }}>No report generated yet</div>
                  <div style={{ fontSize:13 }}>Select a client and date range above, then hit Generate.</div>
                </div>
              )}

              {reportGenerated && (() => {
                const cObj = clients.find(c=>c.name===reportClient)??clients[0];
                const cmpns = getDemoCampaigns(cObj.meta_ad_account_id,30) as Array<{ name?:string; spend:number; leads:number; cpl:number; purchases:number; purchase_value:number; roas:number; status:string }>;
                const ts = cmpns.reduce((s,c)=>s+c.spend,0);
                const tl = cmpns.reduce((s,c)=>s+(c.leads??0),0);
                const tp = cmpns.reduce((s,c)=>s+(c.purchases??0),0);
                const tv = cmpns.reduce((s,c)=>s+(c.purchase_value??0),0);
                const acpl = tl>0?ts/tl:0;
                const aroas = ts>0&&tv>0?tv/ts:0;
                const isL = cObj.vertical==="leads";
                return (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
                      <div>
                        <div style={{ fontSize:18, fontWeight:700, color:T.text }}>{reportClient} — Performance Report</div>
                        <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{reportStart} to {reportEnd}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setReportGenerated(false)} style={{ fontSize:12, padding:"7px 14px", borderRadius:7, border:`1px solid ${T.border}`, background:T.surface, color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>← New Report</button>
                        <Link href="/#pricing" style={{ fontSize:12, padding:"7px 14px", borderRadius:7, border:"none", background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontWeight:800, textDecoration:"none", display:"inline-block" }}>↗ Share Report</Link>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                      {[
                        { label:"Total Spend", value:`$${ts.toLocaleString(undefined,{maximumFractionDigits:0})}` },
                        isL?{ label:"Total Leads", value:String(tl), color:T.leads }:{ label:"Total Purchases", value:String(tp), color:T.ecomm },
                        isL?{ label:"Avg CPL", value:acpl>0?`$${acpl.toFixed(2)}`:"—", color:acpl>50?T.warning:T.healthy }:{ label:"Avg ROAS", value:aroas>0?`${aroas.toFixed(2)}x`:"—", color:aroas>=2?T.healthy:T.warning },
                        { label:"Campaigns", value:String(cmpns.length), color:T.accent },
                      ].map((s,i)=>(
                        <div key={i} style={{ background:T.surfaceAlt, borderRadius:10, padding:"18px 20px", textAlign:"center" as const }}>
                          <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:8 }}>{s.label}</div>
                          <div style={{ fontSize:26, fontWeight:800, color:(s as {color?:string}).color??T.accent, letterSpacing:"-1px" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.faint, textTransform:"uppercase" as const, letterSpacing:"0.5px" }}>
                        <div>Campaign</div><div style={{ textAlign:"right" as const }}>Spend</div><div style={{ textAlign:"right" as const }}>{isL?"Leads":"Purchases"}</div><div style={{ textAlign:"right" as const }}>{isL?"CPL":"ROAS"}</div><div style={{ textAlign:"right" as const }}>Status</div>
                      </div>
                      {cmpns.map((c,i)=>{
                        const sc=(c.status==="ACTIVE"||c.status==="active")?T.healthy:T.warning;
                        return(
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", padding:"12px 16px", borderBottom:i<cmpns.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                            <div style={{ fontSize:12, color:T.text, fontWeight:600 }}>{c.name??`Campaign ${i+1}`}</div>
                            <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>${c.spend.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                            <div style={{ fontSize:12, color:T.muted, textAlign:"right" as const }}>{isL?(c.leads||"—"):(c.purchases||"—")}</div>
                            <div style={{ fontSize:12, textAlign:"right" as const, color:isL?(c.cpl>50?T.warning:T.muted):(c.roas>=2?T.healthy:T.muted) }}>{isL?(c.cpl>0?`$${c.cpl.toFixed(2)}`:"—"):(c.roas>0?`${c.roas.toFixed(2)}x`:"—")}</div>
                            <div style={{ textAlign:"right" as const }}><span style={{ fontSize:10, fontWeight:600, color:sc, background:sc+"20", padding:"3px 8px", borderRadius:4 }}>{(c.status==="ACTIVE"||c.status==="active")?"Active":"Paused"}</span></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:16, textAlign:"center" as const }}>
                      <Link href="/#pricing" style={{ display:"inline-block", padding:"12px 28px", borderRadius:9, background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:13, fontWeight:800, textDecoration:"none" }}>Start Free — run reports on your real accounts →</Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══════════════════════ REVIEW ═════════════════════════════════════ */}
          {activeTab === "review" && (
            <div style={{ maxWidth:800 }}>
              <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 6px", letterSpacing:"-0.5px" }}>Review</h1>
              <p style={{ color:T.muted, fontSize:13, margin:"0 0 24px" }}>AI-flagged issues and recommendations across all accounts</p>
              {RECS.map((rec,i)=>{
                const bc=rec.priority==="critical"?T.critical:rec.priority==="warning"?T.warning:T.accent;
                return(
                  <div key={rec.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${bc}`, borderRadius:10, padding:"16px 20px", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{rec.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{rec.title}</span>
                          <span style={{ fontSize:10, fontWeight:700, color:bc, background:bc+"20", padding:"2px 7px", borderRadius:4, textTransform:"uppercase" as const }}>{rec.priority}</span>
                        </div>
                        <div style={{ fontSize:13, color:T.muted, lineHeight:1.55 }}>{rec.body}</div>
                      </div>
                    </div>
                    {done.has(rec.id) ? (
                      <div style={{ padding:"8px 12px", borderRadius:6, background:"rgba(46,204,113,0.12)", color:"#2ecc71", fontSize:12, fontWeight:600 }}>✓ Done — changes applied</div>
                    ) : dismissed.has(rec.id) ? (
                      <div style={{ padding:"8px 12px", borderRadius:6, background:"rgba(90,94,114,0.12)", color:T.faint, fontSize:12 }}>Dismissed</div>
                    ) : (
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setDone(d=>new Set([...d,rec.id]))} style={{ flex:1, padding:"8px", fontSize:12, fontWeight:600, borderRadius:7, border:"none", background:bc+"22", color:bc, cursor:"pointer", fontFamily:"inherit" }}>{rec.approveLabel}</button>
                        <button onClick={()=>setDismissed(d=>new Set([...d,rec.id]))} style={{ padding:"8px 14px", fontSize:12, borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>Dismiss</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════ HISTORY ════════════════════════════════════ */}
          {activeTab === "history" && (
            <div style={{ maxWidth:800 }}>
              <h1 style={{ fontSize:26, fontWeight:700, color:T.accent, margin:"0 0 6px", letterSpacing:"-0.5px" }}>History</h1>
              <p style={{ color:T.muted, fontSize:13, margin:"0 0 24px" }}>AI action log — every change made across all accounts</p>
              <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
                {[
                  { time:"Today 9:14am", action:"Paused ad set", detail:"Pacific Solar · Homeowners 35–65 — $310 spend, 0 leads", type:"pause" },
                  { time:"Today 8:47am", action:"Increased budget 20%", detail:"Summit Roofing · Storm Damage · $50 → $60/day", type:"scale" },
                  { time:"Yesterday 6:02pm", action:"Created campaign", detail:"Summit Roofing · Free Inspection Retargeting · Pending approval", type:"create" },
                  { time:"Yesterday 2:31pm", action:"Paused ad set", detail:"Bright Smile Dental · Retargeting — frequency 4.1x", type:"pause" },
                  { time:"Mar 20 11:18am", action:"Dismissed recommendation", detail:"Crestwood Financial · Budget underpacing alert", type:"dismiss" },
                  { time:"Mar 19 9:00am", action:"Sent weekly report", detail:"Summit Roofing · Mar 13–19 · Emailed to client@summitroofing.com", type:"report" },
                  { time:"Mar 18 3:45pm", action:"Scaled budget", detail:"Urban Threads · DPA Summer Drop · $120 → $140/day", type:"scale" },
                ].map((row,i,arr)=>{
                  const typeColor = row.type==="pause"?T.warning:row.type==="scale"?T.healthy:row.type==="create"?T.accent:row.type==="report"?T.leads:T.faint;
                  return(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 18px", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:typeColor, marginTop:5, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{row.action}</span>
                        </div>
                        <div style={{ fontSize:12, color:T.muted }}>{row.detail}</div>
                      </div>
                      <div style={{ fontSize:11, color:T.faint, whiteSpace:"nowrap", marginTop:2 }}>{row.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Ad Creator Overlay */}
        {showCreator && <DemoAdCreatorOverlay clientName={activeClient} onClose={()=>setShowCreator(false)}/>}

        {/* AI Chat Bubble — always present */}
        {mounted && <DemoChatBubble clientName={activeClient} highlightStyle={hl("tour-agent-btn")}/>}

        {/* Tour card */}
        {tourActive && mounted && (() => {
          const cfg = STEPS[tourStep];
          const pos: React.CSSProperties =
            tourStep===10?{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:2100 }:
            tourStep===9?{ position:"fixed", bottom:32, left:28, zIndex:2100 }:
            (tourStep>=1 && tourStep<=4)?{ position:"fixed", bottom:32, left:28, zIndex:2100 }:
            { position:"fixed", bottom:32, right:32, zIndex:2100 };
          return (
            <>
              {tourStep===10 && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:2099 }}/>}
              <div key={tourStep} style={{ ...pos, width:300, background:"#13151d", border:"1px solid rgba(245,166,35,0.3)", borderRadius:14, boxShadow:"0 16px 48px rgba(0,0,0,0.6)", overflow:"hidden", animation:cfg?.centered?"tourFadeInCentered 0.35s ease both":"tourFadeIn 0.35s ease both" }}>
                <div style={{ height:3, background:"rgba(255,255,255,0.05)" }}>
                  <div style={{ height:"100%", width:`${(tourStep/TOTAL_STEPS)*100}%`, background:"linear-gradient(90deg,#f5a623,#f76b1c)", transition:"width 0.4s ease" }}/>
                </div>
                <div style={{ padding:"18px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:10, color:T.faint, fontWeight:500, letterSpacing:"0.3px" }}>{cfg?.label}</span>
                    <button onClick={()=>setTourActive(false)} style={{ fontSize:10, color:T.faint, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"2px 6px" }}>Skip tour</button>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:6, letterSpacing:"-0.3px", textAlign:cfg?.centered?"center":"left" }}>{cfg?.title}</div>
                  <div style={{ fontSize:12, color:T.muted, lineHeight:1.65, marginBottom:16, textAlign:cfg?.centered?"center":"left" }}>{cfg?.body}</div>
                  <div style={{ display:"flex", gap:5, marginBottom:14, justifyContent:cfg?.centered?"center":"flex-start" }}>
                    {Array.from({length:TOTAL_STEPS},(_,i)=>(
                      <div key={i} style={{ width:(i+1)===tourStep?20:6, height:6, borderRadius:3, background:(i+1)===tourStep?T.accent:(i+1)<tourStep?"rgba(245,166,35,0.35)":"rgba(255,255,255,0.1)", transition:"all 0.25s" }}/>
                    ))}
                  </div>
                  {tourStep===TOTAL_STEPS ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <Link href="/#pricing" style={{ display:"block", textAlign:"center", padding:"12px", borderRadius:9, background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:13, fontWeight:800, textDecoration:"none" }}>Start Free — launch your first campaign →</Link>
                      <button onClick={()=>setTourActive(false)} style={{ width:"100%", padding:"9px", borderRadius:9, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Keep exploring</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:8 }}>
                      {tourStep>1 && <button onClick={prevStep} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>}
                      <button onClick={nextStep} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#f5a623,#f76b1c)", color:"#0d0f14", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>{tourStep===1?"Start tour →":"Next →"}</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

      </div>
    </>
  );
}
