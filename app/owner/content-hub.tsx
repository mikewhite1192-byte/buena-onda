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

const WEEK_THEMES = [
  { day: "Monday", theme: "Authority / Education", desc: "Teach something about AI or automation", icon: "M" },
  { day: "Tuesday", theme: "Trending", desc: "React to what's hot in your niche right now", icon: "T" },
  { day: "Wednesday", theme: "Proof / Results", desc: "Client win, stat, before/after", icon: "W" },
  { day: "Thursday", theme: "Contrarian", desc: "Challenge what your audience believes", icon: "T" },
  { day: "Friday", theme: "Behind the Scenes", desc: "Show the build, the tools, the process", icon: "F" },
  { day: "Saturday", theme: "Personal / Story", desc: "The grind, the origin, a lesson", icon: "S" },
  { day: "Sunday", theme: "Pitch Day", desc: "One clean offer, direct CTA", icon: "S" },
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

type SubTab = "calendar" | "scripts" | "hooks" | "ads" | "brief";

export default function ContentHub() {
  const [subTab, setSubTab] = useState<SubTab>("brief");
  const [topic, setTopic] = useState("");
  const [scriptFormat, setScriptFormat] = useState("30-60s");
  const [videoFormat, setVideoFormat] = useState("talking-head");
  const [viralFormat, setViralFormat] = useState("");
  const [adPlatform, setAdPlatform] = useState("meta");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Monday = 0

  async function generate(action: string) {
    if (!topic.trim() && action !== "brief") return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/owner/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          topic: topic.trim(),
          scriptFormat,
          videoFormat,
          viralFormat,
          platform: adPlatform,
        }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || "Error generating content");
    } catch {
      setOutput("Failed to connect to AI");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: "brief", label: "Morning Brief" },
    { id: "calendar", label: "Calendar" },
    { id: "scripts", label: "Script Generator" },
    { id: "hooks", label: "Hook Bank" },
    { id: "ads", label: "Ad Copy" },
  ];

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${subTab === t.id ? T.accent : T.border}`,
              background: subTab === t.id ? T.accentBg : "transparent",
              color: subTab === t.id ? T.accent : T.muted,
              fontSize: 12,
              fontWeight: subTab === t.id ? 700 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Morning Brief ── */}
      {subTab === "brief" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>
              Morning Intelligence Brief
            </div>
            <button
              onClick={() => generate("brief")}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 700,
                color: "#0d0f14",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Generating..." : "Generate Today's Brief"}
            </button>
          </div>

          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Today&apos;s Theme
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                {WEEK_THEMES[todayIndex].icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  {WEEK_THEMES[todayIndex].day} — {WEEK_THEMES[todayIndex].theme}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>{WEEK_THEMES[todayIndex].desc}</div>
              </div>
            </div>
          </div>

          {/* Story Stack */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Today&apos;s Story Stack
            </div>
            {STORY_STACK.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < STORY_STACK.length - 1 ? `1px solid ${T.border}` : "none",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: T.faint,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: T.text }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Brief Output */}
          {output && (
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => copyToClipboard(output, "brief")}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: T.accentBg,
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: T.accent,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copiedField === "brief" ? "Copied!" : "Copy"}
              </button>
              <div
                style={{
                  fontSize: 13,
                  color: T.text,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {output}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Content Calendar ── */}
      {subTab === "calendar" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>
            7-Day Content Calendar
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {WEEK_THEMES.map((day, i) => {
              const isToday = i === todayIndex;
              return (
                <div
                  key={day.day}
                  style={{
                    background: isToday ? T.surface : T.card,
                    border: `1px solid ${isToday ? T.accent : T.border}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isToday && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: "linear-gradient(90deg,#f5a623,#f76b1c)",
                      }}
                    />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? T.accent : T.text }}>
                      {day.day}
                    </span>
                    {isToday && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "#0d0f14",
                          background: T.accent,
                          borderRadius: 4,
                          padding: "2px 6px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                    {day.theme}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{day.desc}</div>
                  <button
                    onClick={() => {
                      setTopic(`${day.theme}: `);
                      setSubTab("scripts");
                    }}
                    style={{
                      marginTop: 10,
                      background: "transparent",
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 10,
                      color: T.muted,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Generate Script
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Script Generator ── */}
      {subTab === "scripts" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>
            Script Writing Engine
          </div>

          {/* Topic Input */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Topic
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Why most businesses don't need a $500/mo CRM"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: T.text,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          </div>

          {/* Format Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Script Format
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SCRIPT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setScriptFormat(f.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 7,
                      border: `1px solid ${scriptFormat === f.id ? T.accent : T.border}`,
                      background: scriptFormat === f.id ? T.accentBg : "transparent",
                      color: scriptFormat === f.id ? T.accent : T.muted,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{f.label}</span>
                    <span style={{ color: T.faint }}>{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Video Format
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {VIDEO_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setVideoFormat(f.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 7,
                      border: `1px solid ${videoFormat === f.id ? T.info : T.border}`,
                      background: videoFormat === f.id ? "rgba(79,195,247,0.1)" : "transparent",
                      color: videoFormat === f.id ? T.info : T.muted,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, marginTop: 16 }}>
                Viral Format (optional)
              </div>
              <select
                value={viralFormat}
                onChange={(e) => setViralFormat(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11,
                  color: T.text,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                <option value="">None — freeform</option>
                {VIRAL_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generate("script")}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              background: topic.trim() ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: 10,
              padding: "14px",
              fontSize: 14,
              fontWeight: 800,
              color: topic.trim() ? "#0d0f14" : T.faint,
              cursor: topic.trim() && !loading ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              marginBottom: 16,
            }}
          >
            {loading ? "Writing script..." : "Generate Script"}
          </button>

          {/* Output */}
          {output && (
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => copyToClipboard(output, "script")}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: T.accentBg,
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: T.accent,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copiedField === "script" ? "Copied!" : "Copy Script"}
              </button>
              <div
                style={{
                  fontSize: 13,
                  color: T.text,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {output}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Hook Bank ── */}
      {subTab === "hooks" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>
            Hook Bank
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Enter a topic and get 5 hook variations — curiosity, controversy, result, story, and question angles.
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI appointment setters for local businesses"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: T.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={() => generate("hooks")}
              disabled={loading || !topic.trim()}
              style={{
                background: topic.trim() ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 12,
                fontWeight: 700,
                color: topic.trim() ? "#0d0f14" : T.faint,
                cursor: topic.trim() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Generating..." : "Generate 5 Hooks"}
            </button>
          </div>

          {output && (
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => copyToClipboard(output, "hooks")}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: T.accentBg,
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: T.accent,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copiedField === "hooks" ? "Copied!" : "Copy All"}
              </button>
              <div
                style={{
                  fontSize: 13,
                  color: T.text,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {output}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Ad Copy Generator ── */}
      {subTab === "ads" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 16 }}>
            Ad Copy Generator
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { id: "meta", label: "Meta Ads" },
              { id: "google", label: "Google Ads" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setAdPlatform(p.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${adPlatform === p.id ? T.info : T.border}`,
                  background: adPlatform === p.id ? "rgba(79,195,247,0.1)" : "transparent",
                  color: adPlatform === p.id ? T.info : T.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI-powered CRM that books appointments automatically"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: T.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={() => generate("ad-copy")}
              disabled={loading || !topic.trim()}
              style={{
                background: topic.trim() ? "linear-gradient(135deg,#f5a623,#f76b1c)" : "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 12,
                fontWeight: 700,
                color: topic.trim() ? "#0d0f14" : T.faint,
                cursor: topic.trim() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Writing..." : `Generate ${adPlatform === "meta" ? "Meta" : "Google"} Copy`}
            </button>
          </div>

          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Funnel Stages Generated
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Awareness", desc: "Cold audience", color: T.info },
                { label: "Consideration", desc: "Warm audience", color: T.accent },
                { label: "Conversion", desc: "Hot audience", color: T.success },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: T.faint }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {output && (
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => copyToClipboard(output, "ads")}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: T.accentBg,
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: T.accent,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {copiedField === "ads" ? "Copied!" : "Copy All"}
              </button>
              <div
                style={{
                  fontSize: 13,
                  color: T.text,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
