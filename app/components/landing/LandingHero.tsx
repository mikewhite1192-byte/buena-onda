"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const T = {
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.10)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
  bg: "#0d0f14",
  green: "#2ecc71",
  red: "#e74c3c",
};

const PLATFORMS = ["Meta", "Google", "TikTok", "Shopify"];
const PLATFORM_COLORS = ["#4a90d9", "#34a853", "#ff2d6b", "#96bf48"];

const TICKER = [
  { icon: "⚡", text: "Budget scaled +20% — Summit Roofing CPL dropped to $22", color: T.green },
  { icon: "⏸", text: "Underperforming ad set paused — $340 saved today", color: T.accent },
  { icon: "🔁", text: "Creative fatigue detected — replacement brief auto-generated", color: T.muted },
  { icon: "📈", text: "ROAS hit 4.2x on Peak Supplements — budget increased", color: T.green },
  { icon: "🎯", text: "New TikTok campaign launched — 3 ad sets live", color: T.accent },
  { icon: "📊", text: "Morning report posted to Slack — 847 leads this week across 6 clients", color: T.muted },
  { icon: "💬", text: "WhatsApp reply received: \"pause the roofing campaign\" — done", color: T.accent },
  { icon: "⚡", text: "Budget reallocated from 2 losers to top performer", color: T.green },
  { icon: "🛑", text: "CPL cap hit — ad set paused before overspend", color: T.red },
  { icon: "📈", text: "Google Search ROAS: 5.1x — scaling now", color: T.green },
  { icon: "🎯", text: "Audience overlap fixed — 3 ad sets consolidated", color: T.accent },
  { icon: "✅", text: "New lead campaign live — targeting 180k homeowners in Phoenix", color: T.green },
  { icon: "⚡", text: "TikTok ad outperforming Meta — budget shifted automatically", color: T.accent },
];

const STATS = [
  { label: "avg CPL reduction", value: 40, suffix: "%", decimal: false },
  { label: "avg ROAS lift", value: 3.8, suffix: "x", decimal: true },
  { label: "hours a day, always on", value: 24, suffix: "/7", decimal: false },
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const resolved = useRef<string[]>(text.split(""));
  const [output, setOutput] = useState<string[]>(() => text.split(""));

  useEffect(() => {
    // Init to scrambled state
    const scrambled = text.split("").map((c) =>
      c === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    );
    resolved.current = [...scrambled];
    setOutput([...scrambled]);

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    text.split("").forEach((char, i) => {
      if (char === " ") {
        resolved.current[i] = " ";
        return;
      }
      const charDelay = delay + i * 52;
      const scrambleDuration = 400;
      const numFrames = 7;

      for (let f = 0; f < numFrames; f++) {
        timeouts.push(
          setTimeout(() => {
            resolved.current[i] =
              SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            setOutput([...resolved.current]);
          }, charDelay + (f * scrambleDuration) / numFrames)
        );
      }

      timeouts.push(
        setTimeout(() => {
          resolved.current[i] = char;
          setOutput([...resolved.current]);
        }, charDelay + scrambleDuration)
      );
    });

    return () => timeouts.forEach(clearTimeout);
  }, [text, delay]);

  return <>{output.join("")}</>;
}

function StatCounter({
  value,
  suffix,
  decimal,
  label,
}: {
  value: number;
  suffix: string;
  decimal: boolean;
  label: string;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const animate = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCurrent(
              decimal
                ? Math.round(eased * value * 10) / 10
                : Math.round(eased * value)
            );
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, decimal]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "clamp(34px, 4vw, 56px)",
          fontWeight: 800,
          color: T.text,
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        {decimal ? current.toFixed(1) : current}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 12,
          color: T.faint,
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function LandingHero() {
  const [platformIdx, setPlatformIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPlatformIdx((i) => (i + 1) % PLATFORMS.length);
        setFading(false);
      }, 280);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [...TICKER, ...TICKER];

  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 1.4; transform: translateX(-50%) scale(1.1); }
        }
        @keyframes pulseGlow2 {
          0%, 100% { opacity: 0.6; transform: translateX(-30%) scale(1); }
          50% { opacity: 1; transform: translateX(-30%) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .stats-grid {
          max-width: 640px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            max-width: 260px;
          }
        }
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(46,204,113,0.5); }
          70% { box-shadow: 0 0 0 7px rgba(46,204,113,0); }
          100% { box-shadow: 0 0 0 0 rgba(46,204,113,0); }
        }
        @keyframes whitePulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.8); transform: scale(1); }
          70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); transform: scale(1); }
        }
        @keyframes slideReveal {
          from { transform: translateY(110%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .fu1 { animation: fadeUp 0.65s 0.05s ease both; }
        .fu2 { animation: slideReveal 0.7s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .fu3 { animation: slideReveal 0.7s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .fu4 { animation: fadeUp 0.65s 0.44s ease both; }
        .fu5 { animation: fadeUp 0.65s 0.58s ease both; }
        .fu6 { animation: fadeUp 0.65s 0.70s ease both; }
        .platform-swap {
          display: inline-block;
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .platform-swap.out {
          opacity: 0;
          transform: translateY(-10px);
        }
        .platform-swap.in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <section
        style={{
          paddingTop: 136,
          paddingBottom: 0,
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          background: T.bg,
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            width: 720,
            height: 480,
            background:
              "radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 68%)",
            pointerEvents: "none",
            animation: "pulseGlow 5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "25%",
            width: 360,
            height: 260,
            background:
              "radial-gradient(ellipse, rgba(247,107,28,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "pulseGlow2 7s ease-in-out infinite",
          }}
        />

        <div
          style={{ maxWidth: 880, margin: "0 auto", position: "relative" }}
        >
          {/* Live badge */}
          <div
            className="fu1"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              background: T.accentBg,
              border: "1px solid rgba(245,166,35,0.22)",
              borderRadius: 20,
              fontSize: 11,
              color: T.accent,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: 36,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: T.green,
                display: "inline-block",
                animation: "livePulse 2s infinite",
              }}
            />
            AI Agent · Always On
          </div>

          {/* Headline line 1 — slide up + scramble */}
          <div style={{ overflow: "hidden", display: "block", marginBottom: 6 }}>
            <h1
              className="fu2"
              style={{
                fontSize: "clamp(42px, 7vw, 82px)",
                fontWeight: 800,
                color: T.text,
                margin: 0,
                letterSpacing: "-3px",
                lineHeight: 1.0,
              }}
            >
              <ScrambleText text="Stop managing ads." delay={200} />
            </h1>
          </div>

          {/* Headline line 2 — slide up + scramble + gradient */}
          <div style={{ overflow: "hidden", display: "block", marginBottom: 36 }}>
            <h1
              className="fu3"
              style={{
                fontSize: "clamp(42px, 7vw, 82px)",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-3px",
                lineHeight: 1.0,
                background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <ScrambleText text="Let AI win them." delay={650} />
            </h1>
          </div>

          {/* Subhead with platform cycling */}
          <p
            className="fu4"
            style={{
              fontSize: 18,
              color: T.muted,
              maxWidth: 560,
              margin: "0 auto 20px",
              lineHeight: 1.8,
            }}
          >
            The autonomous AI agent that launches, optimizes, and reports on your{" "}
            <span
              className={`platform-swap ${fading ? "out" : "in"}`}
              style={{ color: PLATFORM_COLORS[platformIdx], fontWeight: 700 }}
            >
              {PLATFORMS[platformIdx]}
            </span>{" "}
            campaigns — around the clock, while you focus on your business.
          </p>

          {/* Platform pills */}
          <div
            className="fu4"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginBottom: 48,
              flexWrap: "wrap",
            }}
          >
            {[
              { name: "Meta Ads", color: "#4a90d9" },
              { name: "Google Ads", color: "#5fad56" },
              { name: "TikTok Ads", color: "#e05c8a" },
              { name: "Shopify", color: "#96bf48" },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  padding: "5px 16px",
                  borderRadius: 20,
                  border: `1px solid ${p.color}35`,
                  background: `${p.color}12`,
                  fontSize: 12,
                  color: p.color,
                  fontWeight: 600,
                  letterSpacing: "0.2px",
                }}
              >
                {p.name}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            className="fu5"
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <a
              href="/demo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 38px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                color: "#0d0f14",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 36px rgba(245,166,35,0.32)",
                letterSpacing: "-0.3px",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "inline-block", flexShrink: 0, animation: "whitePulse 1.8s ease-in-out infinite" }} />
              Try the live demo →
            </a>
            <Link
              href="/#pricing"
              style={{
                padding: "16px 32px",
                borderRadius: 10,
                border: "1px solid rgba(245,166,35,0.25)",
                background: T.accentBg,
                color: T.accent,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Start Free
            </Link>
          </div>

          <p
            className="fu6"
            style={{ fontSize: 12, color: T.faint, marginBottom: 80 }}
          >
            14-day free trial · Card required · Cancel anytime
          </p>
        </div>

        {/* Live ticker */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(22,24,32,0.7)",
            padding: "14px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 100,
              background: `linear-gradient(to right, ${T.bg}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 100,
              background: `linear-gradient(to left, ${T.bg}, transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              animation: "ticker 38s linear infinite",
              width: "max-content",
            }}
          >
            {tickerItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 32px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span
                  style={{ fontSize: 12, color: item.color, fontWeight: 500 }}
                >
                  {item.text}
                </span>
                <span
                  style={{ color: "rgba(255,255,255,0.07)", marginLeft: 16 }}
                >
                  ·
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            padding: "56px 24px",
          }}
        >
          <div className="stats-grid">
            {STATS.map((s) => (
              <StatCounter
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                decimal={s.decimal}
                label={s.label}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
