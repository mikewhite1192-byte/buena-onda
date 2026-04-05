"use client";
import { useState } from "react";

const T = {
  bg: "#0d0f14",
  card: "#13151d",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.1)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  success: "#4ade80",
  danger: "#f87171",
  info: "#4fc3f7",
};

const BUSINESSES = [
  {
    id: "buenaonda",
    name: "Buena Onda",
    tagline: "AI Ad Management Platform",
    desc: "Autonomous AI agent that launches, manages, optimizes, and reports on Meta, Google, and TikTok ad campaigns. Like a senior media buyer working 24/7 — hourly optimization, creative fatigue detection, A/B testing, and client-ready reports via Slack and WhatsApp.",
    audience: "Small businesses running their own ads, agencies managing multiple client accounts, and marketers without dedicated media buying expertise.",
    color: "#f5a623",
  },
  {
    id: "wolfpack",
    name: "The Wolf Pack",
    tagline: "AI Appointment Setter",
    desc: "AI-powered sales automation that texts leads via iMessage in 3 seconds, qualifies them through natural conversation, and books appointments on your calendar. 24/7 follow-ups on days 1, 3, 7, and 14. Uses iMessage (blue texts) to bypass carrier filtering.",
    audience: "Sales professionals, small business owners, and agencies that need instant lead response and automated appointment booking without hiring staff.",
    color: "#4fc3f7",
  },
];

const WEEK_THEMES = [
  { day: "Monday", theme: "Authority / Education", desc: "Teach something about AI or automation" },
  { day: "Tuesday", theme: "Trending", desc: "React to what's hot in your niche right now" },
  { day: "Wednesday", theme: "Proof / Results", desc: "Client win, stat, before/after" },
  { day: "Thursday", theme: "Contrarian", desc: "Challenge what your audience believes" },
  { day: "Friday", theme: "Behind the Scenes", desc: "Show the build, the tools, the process" },
  { day: "Saturday", theme: "Personal / Story", desc: "The grind, the origin, a lesson" },
  { day: "Sunday", theme: "Pitch Day", desc: "One clean offer, direct CTA" },
];

const STORY_STACK = [
  "Morning check-in — what you're working on today",
  "Poll or question box — engagement driver",
  "Reel reshare within first hour of posting",
  "Social proof drip — screenshot, win, DM response",
  "Behind the scenes clip — raw, unscripted",
  "CTA story — 'DM me WOLF' or link",
];

const VIRAL_FORMATS = [
  "This vs That — compare two approaches",
  "I tried X so you don't have to",
  "The myth vs the truth about X",
  "Here's what nobody tells you about X",
  "I spent $X on X — here's what I learned",
  "The reason your X isn't working",
  "Watch me X in real time",
  "3 things I wish I knew before X",
  "The $0 vs $1,000/mo version of X",
  "Hot take: X is wrong about X",
  "Stop doing X — do this instead",
  "I replaced X with AI — here's what happened",
  "The real cost of X that nobody talks about",
  "X won't tell you this, but...",
  "How I got X result in X time",
];

const SCRIPT_FORMATS = [
  { id: "15-30s", label: "15-30s Reel", desc: "~65 words" },
  { id: "30-60s", label: "30-60s Reel", desc: "~130 words" },
  { id: "60-90s", label: "60-90s Reel", desc: "~220 words" },
  { id: "talking-points", label: "Talking Points", desc: "5 bold lines" },
];

const VIDEO_FORMATS = [
  { id: "talking-head", label: "Talking Head" },
  { id: "screen-record", label: "Screen Record" },
  { id: "b-roll", label: "B-Roll Voiceover" },
];

type MainTab = "wizard" | "brief" | "trending" | "hooks" | "ads";
type Business = typeof BUSINESSES[number];

// ─── Shared helpers ───
function OutputBox({ output, field, copiedField, onCopy }: { output: string; field: string; copiedField: string; onCopy: (text: string, field: string) => void }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", position: "relative" }}>
      <button onClick={() => onCopy(output, field)}
        style={{ position: "absolute", top: 12, right: 12, background: T.accentBg, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 6, padding: "4px 10px", fontSize: 10, color: T.accent, cursor: "pointer", fontFamily: "inherit" }}>
        {copiedField === field ? "Copied!" : "Copy"}
      </button>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{output}</div>
    </div>
  );
}

function GoldButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#f5a623,#f76b1c)", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 700, color: disabled ? T.faint : "#0d0f14", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

// ─── Main Component ───
export default function ContentHub() {
  const [mainTab, setMainTab] = useState<MainTab>("wizard");
  const [selectedBusiness, setSelectedBusiness] = useState("buenaonda");
  const [copiedField, setCopiedField] = useState("");

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }

  const biz = BUSINESSES.find(b => b.id === selectedBusiness)!;

  const TABS: { id: MainTab; label: string }[] = [
    { id: "wizard", label: "Script Wizard" },
    { id: "brief", label: "Morning Brief" },
    { id: "trending", label: "Trending" },
    { id: "hooks", label: "Hook Bank" },
    { id: "ads", label: "Ad Copy" },
  ];

  return (
    <div>
      {/* Business Selector */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Creating content for</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {BUSINESSES.map((b) => (
            <button key={b.id} onClick={() => setSelectedBusiness(b.id)}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                background: selectedBusiness === b.id ? `${b.color}10` : "transparent",
                border: `1px solid ${selectedBusiness === b.id ? b.color : T.border}`,
              }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: selectedBusiness === b.id ? b.color : T.text }}>{b.name}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{b.tagline}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 6 }}>{biz.desc}</div>
        <div style={{ fontSize: 11, color: T.faint }}><strong style={{ color: T.muted }}>Audience:</strong> {biz.audience}</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${mainTab === t.id ? T.accent : T.border}`, background: mainTab === t.id ? T.accentBg : "transparent", color: mainTab === t.id ? T.accent : T.muted, fontSize: 12, fontWeight: mainTab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === "wizard" && <ScriptWizard copiedField={copiedField} onCopy={copyToClipboard} business={biz} />}
      {mainTab === "brief" && <MorningBrief copiedField={copiedField} onCopy={copyToClipboard} business={biz} />}
      {mainTab === "trending" && <TrendingStandalone copiedField={copiedField} onCopy={copyToClipboard} business={biz} />}
      {mainTab === "hooks" && <HookBank copiedField={copiedField} onCopy={copyToClipboard} business={biz} />}
      {mainTab === "ads" && <AdCopy copiedField={copiedField} onCopy={copyToClipboard} business={biz} />}
    </div>
  );
}

// ─── SCRIPT WIZARD (guided flow) ───
function ScriptWizard({ copiedField, onCopy, business }: { copiedField: string; onCopy: (t: string, f: string) => void; business: Business }) {
  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [trends, setTrends] = useState<string[]>([]);
  const [selectedTrend, setSelectedTrend] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [scriptFormat, setScriptFormat] = useState("30-60s");
  const [videoFormat, setVideoFormat] = useState("talking-head");
  const [viralFormat, setViralFormat] = useState("");
  const [finalScript, setFinalScript] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  async function callAPI(action: string, extra: Record<string, string> = {}) {
    const res = await fetch("/api/owner/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, businessId: business.id, businessName: business.name, businessDesc: business.desc, businessAudience: business.audience, ...extra }),
    });
    const data = await res.json();
    return data.output || data.error || "Error";
  }

  async function generateTopics() {
    if (selectedDay === null) return;
    setLoading(true);
    try {
      const output = await callAPI("wizard-topics", { theme: WEEK_THEMES[selectedDay].theme, dayDesc: WEEK_THEMES[selectedDay].desc });
      const lines = output.split("\n").map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*|\*\*$/g, "").trim()).filter((l: string) => l.length > 5 && l.length < 200);
      setTopics(lines.slice(0, 7));
      setStep(2);
    } finally { setLoading(false); }
  }

  async function generateTrends() {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const output = await callAPI("wizard-trends", { topic: selectedTopic });
      const lines = output.split("\n").map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*|\*\*$/g, "").trim()).filter((l: string) => l.length > 5 && l.length < 200);
      setTrends(lines.slice(0, 7));
      setStep(3);
    } finally { setLoading(false); }
  }

  async function generateHooks() {
    if (!selectedTrend) return;
    setLoading(true);
    try {
      const output = await callAPI("wizard-hooks", { topic: selectedTopic, trend: selectedTrend });
      const lines = output.split("\n").map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*[^*]+\*\*:?\s*/, "").trim()).filter((l: string) => l.length > 10 && l.length < 200);
      setHooks(lines.slice(0, 5));
      setStep(4);
    } finally { setLoading(false); }
  }

  async function generateScript() {
    if (!selectedHook) return;
    setLoading(true);
    try {
      const output = await callAPI("wizard-script", {
        day: WEEK_THEMES[selectedDay!].day,
        theme: WEEK_THEMES[selectedDay!].theme,
        topic: selectedTopic,
        trend: selectedTrend,
        hook: selectedHook,
        scriptFormat,
        videoFormat,
        viralFormat,
      });
      setFinalScript(output);
      setStep(5);
    } finally { setLoading(false); }
  }

  function restart() {
    setStep(1); setSelectedDay(null); setTopics([]); setSelectedTopic("");
    setTrends([]); setSelectedTrend(""); setHooks([]); setSelectedHook("");
    setFinalScript(""); setViralFormat("");
  }

  const STEPS = ["Day", "Topic", "Trend", "Hook", "Script"];

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const active = step === stepNum;
          const done = step > stepNum;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? T.accent : active ? T.accentBg : "transparent",
                border: `2px solid ${done || active ? T.accent : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: done ? "#0d0f14" : active ? T.accent : T.faint,
                cursor: done ? "pointer" : "default", flexShrink: 0,
              }} onClick={() => { if (done) setStep(stepNum); }}>
                {done ? "\u2713" : stepNum}
              </div>
              <span style={{ fontSize: 10, color: active ? T.accent : T.faint, fontWeight: active ? 700 : 400 }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: done ? T.accent : T.border, margin: "0 4px" }} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Pick a Day */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Pick your day</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Each day has a content theme. Pick the one you're creating for.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {WEEK_THEMES.map((day, i) => {
              const isToday = i === todayIndex;
              const selected = selectedDay === i;
              return (
                <button key={day.day} onClick={() => setSelectedDay(i)}
                  style={{
                    background: selected ? T.accentBg : T.card, border: `1px solid ${selected ? T.accent : isToday ? "rgba(245,166,35,0.3)" : T.border}`,
                    borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: selected ? T.accent : T.text }}>{day.day}</span>
                    {isToday && <span style={{ fontSize: 9, color: "#0d0f14", background: T.accent, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selected ? T.accent : T.text, marginTop: 4 }}>{day.theme}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{day.desc}</div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16 }}>
            <GoldButton onClick={generateTopics} disabled={selectedDay === null || loading}>
              {loading ? "Generating topics..." : "Next — Get Topics"}
            </GoldButton>
          </div>
        </div>
      )}

      {/* Step 2: Pick a Topic */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>
            {WEEK_THEMES[selectedDay!].day} — {WEEK_THEMES[selectedDay!].theme}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Pick a topic or type your own.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {topics.map((t, i) => (
              <button key={i} onClick={() => setSelectedTopic(t)}
                style={{
                  background: selectedTopic === t ? T.accentBg : T.card, border: `1px solid ${selectedTopic === t ? T.accent : T.border}`,
                  borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  fontSize: 12, color: selectedTopic === t ? T.accent : T.text, fontWeight: selectedTopic === t ? 700 : 400,
                }}>
                {t}
              </button>
            ))}
          </div>
          <input value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} placeholder="Or type your own topic..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
            <GoldButton onClick={generateTrends} disabled={!selectedTopic.trim() || loading}>
              {loading ? "Finding trends..." : "Next — Get Trends"}
            </GoldButton>
          </div>
        </div>
      )}

      {/* Step 3: Pick a Trend */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Trending angles for your topic</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Pick the angle that feels most natural to film.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {trends.map((t, i) => (
              <button key={i} onClick={() => setSelectedTrend(t)}
                style={{
                  background: selectedTrend === t ? T.accentBg : T.card, border: `1px solid ${selectedTrend === t ? T.accent : T.border}`,
                  borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  fontSize: 12, color: selectedTrend === t ? T.accent : T.text, fontWeight: selectedTrend === t ? 700 : 400,
                }}>
                {t}
              </button>
            ))}
          </div>
          <input value={selectedTrend} onChange={(e) => setSelectedTrend(e.target.value)} placeholder="Or type your own angle..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(2)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
            <GoldButton onClick={generateHooks} disabled={!selectedTrend.trim() || loading}>
              {loading ? "Generating hooks..." : "Next — Get Hooks"}
            </GoldButton>
          </div>
        </div>
      )}

      {/* Step 4: Pick a Hook + Format */}
      {step === 4 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Choose your hook</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Pick the opening line that feels most you.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {hooks.map((h, i) => (
              <button key={i} onClick={() => setSelectedHook(h)}
                style={{
                  background: selectedHook === h ? T.accentBg : T.card, border: `1px solid ${selectedHook === h ? T.accent : T.border}`,
                  borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  fontSize: 13, color: selectedHook === h ? T.accent : T.text, fontWeight: selectedHook === h ? 700 : 400, lineHeight: 1.5,
                }}>
                {h}
              </button>
            ))}
          </div>

          {/* Format options */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Script Length</div>
              {SCRIPT_FORMATS.map((f) => (
                <button key={f.id} onClick={() => setScriptFormat(f.id)}
                  style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: 4, borderRadius: 6, border: `1px solid ${scriptFormat === f.id ? T.accent : T.border}`, background: scriptFormat === f.id ? T.accentBg : "transparent", color: scriptFormat === f.id ? T.accent : T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  {f.label} <span style={{ color: T.faint }}>({f.desc})</span>
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Video Style</div>
              {VIDEO_FORMATS.map((f) => (
                <button key={f.id} onClick={() => setVideoFormat(f.id)}
                  style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: 4, borderRadius: 6, border: `1px solid ${videoFormat === f.id ? T.info : T.border}`, background: videoFormat === f.id ? "rgba(79,195,247,0.1)" : "transparent", color: videoFormat === f.id ? T.info : T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Viral Format</div>
              <select value={viralFormat} onChange={(e) => setViralFormat(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: T.text, fontFamily: "inherit", outline: "none" }}>
                <option value="">Freeform</option>
                {VIRAL_FORMATS.map((f) => (<option key={f} value={f}>{f}</option>))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(3)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
            <GoldButton onClick={generateScript} disabled={!selectedHook || loading}>
              {loading ? "Writing your script..." : "Generate Script"}
            </GoldButton>
          </div>
        </div>
      )}

      {/* Step 5: Final Script */}
      {step === 5 && finalScript && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Your Script</div>
            <button onClick={restart}
              style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 11, color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>
              Start Over
            </button>
          </div>

          {/* Summary of choices */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Day", value: WEEK_THEMES[selectedDay!].day },
              { label: "Theme", value: WEEK_THEMES[selectedDay!].theme },
              { label: "Format", value: SCRIPT_FORMATS.find(f => f.id === scriptFormat)?.label },
              { label: "Style", value: VIDEO_FORMATS.find(f => f.id === videoFormat)?.label },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <OutputBox output={finalScript} field="wizard-script" copiedField={copiedField} onCopy={onCopy} />
        </div>
      )}
    </div>
  );
}

// ─── MORNING BRIEF (standalone) ───
function MorningBrief({ copiedField, onCopy, business }: { copiedField: string; onCopy: (t: string, f: string) => void; business: Business }) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  async function generate() {
    setLoading(true); setOutput("");
    try {
      const res = await fetch("/api/owner/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "brief", businessId: business.id, businessName: business.name, businessDesc: business.desc, businessAudience: business.audience }) });
      const data = await res.json();
      setOutput(data.output || data.error || "Error");
    } catch { setOutput("Failed to connect"); } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Morning Intelligence Brief</div>
        <GoldButton onClick={generate} disabled={loading}>{loading ? "Generating..." : "Generate Today's Brief"}</GoldButton>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Today&apos;s Theme</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>
            {WEEK_THEMES[todayIndex].day[0]}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{WEEK_THEMES[todayIndex].day} — {WEEK_THEMES[todayIndex].theme}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{WEEK_THEMES[todayIndex].desc}</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Today&apos;s Story Stack</div>
        {STORY_STACK.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < STORY_STACK.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.faint, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: T.text }}>{s}</div>
          </div>
        ))}
      </div>

      {output && <OutputBox output={output} field="brief" copiedField={copiedField} onCopy={onCopy} />}
    </div>
  );
}

// ─── TRENDING (standalone) ───
function TrendingStandalone({ copiedField, onCopy, business }: { copiedField: string; onCopy: (t: string, f: string) => void; business: Business }) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setOutput("");
    try {
      const res = await fetch("/api/owner/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "trending", businessId: business.id, businessName: business.name, businessDesc: business.desc, businessAudience: business.audience }) });
      const data = await res.json();
      setOutput(data.output || data.error || "Error");
    } catch { setOutput("Failed to connect"); } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Trending Now</div>
        <GoldButton onClick={generate} disabled={loading}>{loading ? "Scanning..." : "Scan What's Trending"}</GoldButton>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>AI and digital marketing trends happening right now.</div>
      {output && <OutputBox output={output} field="trending" copiedField={copiedField} onCopy={onCopy} />}
    </div>
  );
}

// ─── HOOK BANK (standalone) ───
function HookBank({ copiedField, onCopy, business }: { copiedField: string; onCopy: (t: string, f: string) => void; business: Business }) {
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true); setOutput("");
    try {
      const res = await fetch("/api/owner/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hooks", topic: topic.trim(), businessId: business.id, businessName: business.name, businessDesc: business.desc, businessAudience: business.audience }) });
      const data = await res.json();
      setOutput(data.output || data.error || "Error");
    } catch { setOutput("Failed to connect"); } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Hook Bank</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Enter a topic and get 5 hook variations — curiosity, controversy, result, story, and question angles.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., AI appointment setters for local businesses"
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none" }} />
        <GoldButton onClick={generate} disabled={loading || !topic.trim()}>{loading ? "Generating..." : "Generate 5 Hooks"}</GoldButton>
      </div>
      {output && <OutputBox output={output} field="hooks" copiedField={copiedField} onCopy={onCopy} />}
    </div>
  );
}

// ─── AD COPY (standalone) ───
function AdCopy({ copiedField, onCopy, business }: { copiedField: string; onCopy: (t: string, f: string) => void; business: Business }) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("meta");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true); setOutput("");
    try {
      const res = await fetch("/api/owner/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ad-copy", topic: topic.trim(), platform, businessId: business.id, businessName: business.name, businessDesc: business.desc, businessAudience: business.audience }) });
      const data = await res.json();
      setOutput(data.output || data.error || "Error");
    } catch { setOutput("Failed to connect"); } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>Ad Copy Generator</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[{ id: "meta", label: "Meta Ads" }, { id: "google", label: "Google Ads" }].map((p) => (
          <button key={p.id} onClick={() => setPlatform(p.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${platform === p.id ? T.info : T.border}`, background: platform === p.id ? "rgba(79,195,247,0.1)" : "transparent", color: platform === p.id ? T.info : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., AI-powered CRM that books appointments automatically"
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none" }} />
        <GoldButton onClick={generate} disabled={loading || !topic.trim()}>{loading ? "Writing..." : `Generate ${platform === "meta" ? "Meta" : "Google"} Copy`}</GoldButton>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Funnel Stages Generated</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ label: "Awareness", desc: "Cold audience", color: T.info }, { label: "Consideration", desc: "Warm audience", color: T.accent }, { label: "Conversion", desc: "Hot audience", color: T.success }].map((s) => (
            <div key={s.label} style={{ flex: 1, minWidth: 120, padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 10, color: T.faint }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
      {output && <OutputBox output={output} field="ads" copiedField={copiedField} onCopy={onCopy} />}
    </div>
  );
}
