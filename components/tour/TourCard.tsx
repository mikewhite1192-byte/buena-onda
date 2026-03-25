"use client";

// components/tour/TourCard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTour } from "@/lib/context/tour-context";

const T = {
  bg: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
};

const TOTAL_STEPS = 10;

interface StepConfig {
  title: string;
  body: string;
  label: string;
  highlightId?: string;    // glow + scroll to this DOM element
  navigateTo?: string;     // push this route on arrival
  openCreator?: boolean;   // dispatch buenaonda:open-creator
  openChat?: boolean;      // dispatch buenaonda:open-chat
  centered?: boolean;
}

const STEPS: Record<number, StepConfig> = {
  1: {
    title: "Your Agency Command Center",
    label: `1 / ${TOTAL_STEPS}  ·  Overview`,
    body: "Live spend, leads, ROAS, and account health across all your clients at a glance. Critical accounts automatically surface to the top.",
    navigateTo: "/dashboard",
    highlightId: "tour-overview-stats",
  },
  2: {
    title: "Anomaly Alerts",
    label: `2 / ${TOTAL_STEPS}  ·  Alerts`,
    body: "The AI monitors every account 24/7. The moment something breaks — CPL spike, zero leads, budget overpacing — it flags it here with one-click actions.",
    highlightId: "tour-alerts",
  },
  3: {
    title: "AI Recommendations",
    label: `3 / ${TOTAL_STEPS}  ·  Recommendations`,
    body: "Ranked, actionable suggestions — pause a fatigued ad, scale a winner, fix audience overlap. Each one has a one-click approve or dismiss right on the card.",
    highlightId: "tour-recommendations",
  },
  4: {
    title: "Client Account Cards",
    label: `4 / ${TOTAL_STEPS}  ·  Clients`,
    body: "Every client's status at a glance — spend, leads, ROAS, and health indicator. Blue is lead gen, purple is e-commerce. Click any card to drill in.",
    highlightId: "tour-client-accounts",
  },
  5: {
    title: "Build an Ad in 60 Seconds",
    label: `5 / ${TOTAL_STEPS}  ·  Ad Builder`,
    body: "Tell the AI your offer, audience, and budget — one question at a time. It writes the copy, sets up targeting, and presents everything for your approval before anything goes live.",
    navigateTo: "/dashboard/ads",
    openCreator: true,
    highlightId: "tour-ads-create",
  },
  6: {
    title: "Performance Charts",
    label: `6 / ${TOTAL_STEPS}  ·  Campaigns`,
    body: "Click 'Show Charts ↗' to see any metric over time — spend, CPL, ROAS, CTR, frequency. Switch metrics with the dropdown. Spot trends before they become problems.",
    navigateTo: "/dashboard/campaigns",
    highlightId: "tour-chart-toggle",
  },
  7: {
    title: "Shareable Client Reports",
    label: `7 / ${TOTAL_STEPS}  ·  Share`,
    body: "Click '↗ Share Report' to generate a read-only link for your client — clean performance view, no login required, no access to settings or other accounts.",
    highlightId: "tour-share-report",
  },
  8: {
    title: "Automated Reports",
    label: `8 / ${TOTAL_STEPS}  ·  Reports`,
    body: "Weekly and monthly reports auto-generated per client. Ask the AI anytime — 'send me this week's report' — and it delivers a full performance snapshot ready to share.",
    navigateTo: "/dashboard/reports",
  },
  9: {
    title: "Your AI Is Always Here",
    label: `9 / ${TOTAL_STEPS}  ·  AI Assistant`,
    body: "The ✦ button is always here — on every page. Ask about your campaigns, get help building an ad, request a performance summary, or just ask how to navigate the platform.",
    openChat: true,
  },
  10: {
    title: "You're All Set 🎉",
    label: `10 / ${TOTAL_STEPS}  ·  Ready`,
    body: "That's the full picture. Start your free trial and run your first real campaign — connect your ad account and the AI takes it from there.",
    centered: true,
  },
};

function getPosition(step: number): React.CSSProperties {
  // Final step — centered
  if (step === 10) {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2100 };
  }
  // Step 9 (AI Assistant) — bottom-LEFT so chat button at bottom-right stays visible
  if (step === 9) {
    return { position: "fixed", bottom: 32, left: 28, zIndex: 2100 };
  }
  // Overview steps (1–4) — bottom-left so the recommendations sidebar stays fully visible
  if (step >= 1 && step <= 4) {
    return { position: "fixed", bottom: 32, left: 28, zIndex: 2100 };
  }
  // All other steps (including ads step 5) — bottom-right, above any overlay
  return { position: "fixed", bottom: 32, right: 32, zIndex: 2100 };
}

export default function TourCard() {
  const { tourActive, step, nextStep, prevStep, endTour } = useTour();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Fade-in animation on each step change
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [step, tourActive]);

  // Glow + scroll to the target element — retries until element appears after navigation
  useEffect(() => {
    if (!tourActive) return;
    const config = STEPS[step];
    if (!config?.highlightId) return;

    const id = config.highlightId!;
    let attempts = 0;
    const interval = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        clearInterval(interval);
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        el.style.outline = "2px solid rgba(245,166,35,0.85)";
        el.style.outlineOffset = "6px";
        el.style.borderRadius = "10px";
        el.style.transition = "outline 0.3s ease";
      } else if (++attempts >= 15) {
        clearInterval(interval); // give up after ~3s
      }
    }, 200);

    return () => {
      clearInterval(interval);
      const el = document.getElementById(id);
      if (el) { el.style.outline = ""; el.style.outlineOffset = ""; }
    };
  }, [step, tourActive]);

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") endTour(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [endTour]);

  if (!tourActive || !STEPS[step]) return null;

  const config = STEPS[step];
  const pos = getPosition(step);

  // Fire side effects for the DESTINATION step (forward only)
  function applyStepEffects(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (!cfg) return;
    if (cfg.navigateTo) router.push(cfg.navigateTo);
    if (cfg.openCreator) {
      setTimeout(() => document.dispatchEvent(new CustomEvent("buenaonda:open-creator")), 600);
    }
    if (cfg.openChat) {
      setTimeout(() => document.dispatchEvent(new CustomEvent("buenaonda:open-chat")), 400);
    }
  }

  // Navigate back — only push route, no chat/creator side-effects
  function applyPrevRoute(targetStep: number) {
    const cfg = STEPS[targetStep];
    if (cfg?.navigateTo) router.push(cfg.navigateTo);
    else if (step > 5) router.push("/dashboard"); // fall back to overview
  }

  function handleNext() {
    if (step === TOTAL_STEPS) { endTour(); return; }
    applyStepEffects(step + 1);
    nextStep();
  }

  function handlePrev() {
    applyPrevRoute(step - 1);
    prevStep();
  }

  return (
    <>
      {/* Dim backdrop only for the final step */}
      {step === 10 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2099 }} />
      )}

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
          <button onClick={endTour} style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", fontSize: 14, padding: 0 }}>
            ✕
          </button>
        </div>

        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 8, letterSpacing: "-0.3px", lineHeight: 1.3 }}>
          {config.title}
        </div>

        {/* Body */}
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 16 }}>
          {config.body}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, justifyContent: "center" }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
            <div key={s} style={{
              width: s === step ? 12 : 4,
              height: 4,
              borderRadius: 2,
              background: s === step ? T.accent : s < step ? T.accent + "50" : T.faint,
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        {/* Action buttons */}
        {step === TOTAL_STEPS ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {isSignedIn ? (
              <button
                onClick={() => { endTour(); router.push("/dashboard/clients"); }}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "11px 0", borderRadius: 8,
                  background: "linear-gradient(135deg,#f5a623,#f76b1c)",
                  color: "#0d0f14", fontSize: 13, fontWeight: 800,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Connect your first ad account →
              </button>
            ) : (
              <a
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
              </a>
            )}
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
