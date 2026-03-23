"use client";

// components/tour/TourCard.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
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

const TOTAL_STEPS = 8;

interface StepConfig {
  title: string;
  body: string;
  label: string;
  highlightId?: string;       // DOM element to glow + scroll to
  navigateTo?: string;        // route to push before showing this step
  openChat?: boolean;         // dispatch open-chat event
  centered?: boolean;
}

const STEPS: Record<number, StepConfig> = {
  1: {
    title: "Your Agency Command Center",
    label: `1 / ${TOTAL_STEPS}  ·  Overview`,
    body: "Live spend, leads, ROAS, and account health — everything across all your clients in one place. Critical accounts sort to the top automatically.",
    highlightId: "tour-overview-stats",
  },
  2: {
    title: "Anomaly Alerts",
    label: `2 / ${TOTAL_STEPS}  ·  Alerts`,
    body: "The AI watches every account around the clock. The moment something breaks — CPL spike, zero leads, budget overpacing — it surfaces here with one-click actions.",
    highlightId: "tour-alerts",
  },
  3: {
    title: "AI Recommendations",
    label: `3 / ${TOTAL_STEPS}  ·  Recommendations`,
    body: "Actionable suggestions ranked by priority — pause a fatigued campaign, scale a winner, reallocate budget. Approve or dismiss with one click.",
    highlightId: "tour-recommendations",
  },
  4: {
    title: "Client Account Cards",
    label: `4 / ${TOTAL_STEPS}  ·  Clients`,
    body: "Every client's status at a glance. Click any card to drill into their campaigns, ad sets, and creatives. Color-coded by vertical — blue for lead gen, purple for e-commerce.",
    highlightId: "tour-client-accounts",
  },
  5: {
    title: "Drill Into Any Campaign",
    label: `5 / ${TOTAL_STEPS}  ·  Campaigns`,
    body: "Campaign → Ad Set → Ad, all in one view. Live spend, CPL, ROAS, CTR, and frequency. Click any row to expand. Customize your columns.",
    navigateTo: "/dashboard/campaigns",
  },
  6: {
    title: "Ask the AI Anything",
    label: `6 / ${TOTAL_STEPS}  ·  AI Chat`,
    body: "Hit the ? button any time and ask — 'Why is my CPL up?' or 'What should I pause?' The AI has full context on every client and campaign.",
    navigateTo: "/dashboard/campaigns",
    openChat: true,
  },
  7: {
    title: "Automated Reports",
    label: `7 / ${TOTAL_STEPS}  ·  Reports`,
    body: "Weekly and monthly performance reports per client — auto-generated, ready to send. Ask the AI anytime: 'Send me this week's report.' Email delivery and PDF export built in.",
    navigateTo: "/dashboard/reports",
  },
  8: {
    title: "You're All Set 🎉",
    label: `8 / ${TOTAL_STEPS}  ·  Ready`,
    body: "That's the full picture. Start your free trial — connect your first client, launch a campaign, and let the AI run the rest.",
    centered: true,
  },
};

function getPosition(step: number, isChatOpen: boolean): React.CSSProperties {
  if (step === 8) {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1002 };
  }
  if (step === 6 || step === 7) {
    return { position: "fixed", bottom: 100, right: isChatOpen ? 420 : 88, zIndex: 1002 };
  }
  // Steps 1–4 are on overview — position bottom-left so it doesn't cover the right sidebar
  if (step >= 1 && step <= 4) {
    return { position: "fixed", bottom: 32, left: 28, zIndex: 1002 };
  }
  return { position: "fixed", bottom: 100, right: 88, zIndex: 1002 };
}

export default function TourCard() {
  const { tourActive, step, nextStep, prevStep, endTour } = useTour();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Animate in on mount / step change
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [step, tourActive]);

  // Highlight the target element and scroll it into view
  useEffect(() => {
    if (!tourActive) return;
    const config = STEPS[step];
    if (!config?.highlightId) return;

    const el = document.getElementById(config.highlightId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.outline = "2px solid rgba(245,166,35,0.8)";
    el.style.outlineOffset = "6px";
    el.style.borderRadius = "10px";
    el.style.transition = "outline 0.3s ease";

    return () => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    };
  }, [step, tourActive]);

  // Detect chat bubble open state
  useEffect(() => {
    const interval = setInterval(() => {
      setChatOpen(!!document.querySelector("[data-chat-open]"));
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
    const next = step + 1;
    const nextConfig = STEPS[next];

    if (nextConfig?.openChat) {
      document.dispatchEvent(new CustomEvent("buenaonda:open-chat"));
    }
    if (nextConfig?.navigateTo) {
      router.push(nextConfig.navigateTo);
    }

    if (step === TOTAL_STEPS) {
      endTour();
    } else {
      nextStep();
    }
  }

  function handlePrev() {
    const prev = step - 1;
    const prevConfig = STEPS[prev];
    if (prevConfig?.navigateTo) {
      router.push(prevConfig.navigateTo);
    } else if (step > 5) {
      // Navigate back to overview when going back to overview steps
      router.push("/dashboard");
    }
    prevStep();
  }

  return (
    <>
      {/* Backdrop for final step */}
      {step === 8 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1001 }} />
      )}

      {/* Tour card */}
      <div style={{
        ...pos,
        width: 300,
        background: T.bg,
        border: `1px solid ${T.accent}40`,
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${T.accent}20`,
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
        opacity: mounted ? 1 : 0,
        transform: `${pos.transform ?? ""} translateY(${mounted ? 0 : 10}px)`,
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: T.faint, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {config.label}
          </span>
          <button
            onClick={endTour}
            style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", fontSize: 14, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 8, letterSpacing: "-0.3px", lineHeight: 1.3 }}>
          {config.title}
        </div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 16 }}>
          {config.body}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 16, justifyContent: "center" }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
            <div key={s} style={{
              width: s === step ? 14 : 5,
              height: 5,
              borderRadius: 3,
              background: s === step ? T.accent : s < step ? T.accent + "50" : T.faint,
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        {/* Buttons */}
        {step === TOTAL_STEPS ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link
              href="/sign-up"
              style={{
                display: "block", textAlign: "center",
                padding: "11px 0", borderRadius: 8,
                background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                color: "#0d0f14", fontSize: 13, fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Start Free — launch your first campaign →
            </Link>
            <button
              onClick={endTour}
              style={{ background: "transparent", border: "none", color: T.faint, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            >
              Keep exploring the dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 && (
              <button
                onClick={handlePrev}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8,
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
                flex: 2, padding: "8px 0", borderRadius: 8,
                border: `1px solid ${T.accent}40`,
                background: T.accentBg, color: T.accent,
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {step === TOTAL_STEPS - 1 ? "Finish →" : "Next →"}
            </button>
          </div>
        )}

        {step < TOTAL_STEPS && (
          <button
            onClick={endTour}
            style={{ display: "block", width: "100%", marginTop: 8, background: "transparent", border: "none", color: T.faint, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            Skip tour
          </button>
        )}
      </div>
    </>
  );
}
