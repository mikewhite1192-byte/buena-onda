"use client";

// components/tour/TourCard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTour } from "@/lib/context/tour-context";

const T = {
  bg: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  healthy: "#2ecc71",
};

interface StepConfig {
  title: string;
  body: string;
  label?: string; // small label above title
  navigatePrev?: string;
  navigateNext?: string;
  centered?: boolean;
  final?: boolean;
}

const STEPS: Record<number, StepConfig> = {
  1: {
    title: "Your Agency Command Center",
    body: "Every client, live metrics, and attention flags — all in one place. Accounts that need action sort to the top automatically.",
    label: "1 / 6  ·  Overview",
    navigateNext: undefined,
  },
  2: {
    title: "Drill Into Any Account",
    body: "Campaign → Ad Set → Ad. Click any row to expand. See spend, leads, CPL, CTR, and frequency in real time. Pick your own columns.",
    label: "2 / 6  ·  Campaigns",
    navigatePrev: "/dashboard",
    navigateNext: "/dashboard",
  },
  3: {
    title: "Ask the AI Anything",
    body: "Watch the AI analyze campaign data and give real recommendations. Ask about performance, strategy, or what to do next.",
    label: "3 / 6  ·  Optimization",
  },
  4: {
    title: "Build a Campaign in 60 Seconds ⭐",
    body: "Watch the AI build a full campaign — targeting, ad copy, creative, budget — from a single sentence. All created paused for your review.",
    label: "4 / 6  ·  Campaign Creation",
  },
  5: {
    title: "Automated Reports",
    body: "Set up weekly or monthly reports per client. Ask the AI anytime — 'send me a report for this week' — and it generates a full performance snapshot. Email delivery and PDF export coming soon.",
    label: "5 / 6  ·  Reports",
    centered: true,
  },
  6: {
    title: "You're All Set 🎉",
    body: "That's what Buena Onda can do. Now let's connect your first client account to get started with real data.",
    label: "6 / 6  ·  Ready",
    centered: true,
    final: true,
  },
};

// Positioning per step — bottom-right for steps 1–4, centered for 5–6
function getPosition(step: number, isChatOpen: boolean): React.CSSProperties {
  if (step === 5 || step === 6) {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1002 };
  }
  if (step === 3 || step === 4) {
    // Chat is open — shift left so card doesn't overlap
    return { position: "fixed", bottom: 100, right: isChatOpen ? 420 : 88, zIndex: 1002 };
  }
  return { position: "fixed", bottom: 100, right: 88, zIndex: 1002 };
}

export default function TourCard() {
  const { tourActive, step, nextStep, prevStep, endTour } = useTour();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Animate in
  useEffect(() => {
    if (tourActive) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [tourActive, step]);

  // Reset mount animation on step change
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [step]);

  // Detect if chat bubble is open by checking DOM
  useEffect(() => {
    const interval = setInterval(() => {
      const chatEl = document.querySelector("[data-chat-open]");
      setChatOpen(!!chatEl);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Keyboard escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") endTour();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [endTour]);

  if (!tourActive || !STEPS[step]) return null;

  const config = STEPS[step];
  const pos = getPosition(step, chatOpen);

  function handleNext() {
    if (step === 1) {
      nextStep();
      router.push("/dashboard/campaigns");
    } else if (step === 2) {
      nextStep();
      router.push("/dashboard");
    } else if (step === 6) {
      endTour();
      router.push("/dashboard/clients");
    } else {
      nextStep();
    }
  }

  function handlePrev() {
    if (step === 2) {
      prevStep();
      router.push("/dashboard");
    } else {
      prevStep();
    }
  }

  return (
    <>
      {/* Backdrop for centered steps */}
      {(step === 5 || step === 6) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1001 }} />
      )}

      {/* Tour card */}
      <div style={{
        ...pos,
        width: 320,
        background: T.bg,
        border: `1px solid ${T.accent}40`,
        borderRadius: 14,
        padding: "20px 22px",
        boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${T.accent}20`,
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
        opacity: mounted ? 1 : 0,
        transform: `${pos.transform ?? ""} translateY(${mounted ? 0 : 10}px)`,
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          {config.label && (
            <span style={{ fontSize: 10, color: T.faint, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {config.label}
            </span>
          )}
          <button
            onClick={endTour}
            style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", fontSize: 14, padding: 0, marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ fontSize: 15, fontWeight: 700, color: T.accent, marginBottom: 10, letterSpacing: "-0.3px", lineHeight: 1.3 }}>
          {config.title}
        </div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>
          {config.body}
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} style={{
              width: s === step ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: s === step ? T.accent : T.faint,
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {step > 1 && (
            <button
              onClick={handlePrev}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: "transparent", color: T.muted,
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: 2, padding: "9px 0", borderRadius: 8,
              border: `1px solid ${T.accent}40`,
              background: T.accentBg, color: T.accent,
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {step === 6 ? "Add First Client →" : step === 5 ? "Got it →" : "Next →"}
          </button>
        </div>

        {step < 6 && (
          <button
            onClick={endTour}
            style={{ display: "block", width: "100%", marginTop: 10, background: "transparent", border: "none", color: T.faint, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            Skip tour
          </button>
        )}
      </div>
    </>
  );
}
