"use client";

import { useEffect, useRef, useState } from "react";
import {
  Zap,
  Pause,
  Clock,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

type FeedItem = {
  icon: "zap" | "pause" | "clock" | "refresh" | "trending" | "message" | "check";
  tint: "emerald" | "amber" | "slate" | "sky";
  title: string;
  meta: string;
};

const FEED: FeedItem[] = [
  { icon: "zap",      tint: "emerald", title: "Budget scaled +20% on Summit Roofing", meta: "CPL dropped to $22 · now" },
  { icon: "pause",    tint: "amber",   title: "Paused underperforming ad set",        meta: "$340 saved today · 2m ago" },
  { icon: "trending", tint: "emerald", title: "ROAS hit 4.2× on Peak Supplements",    meta: "Scaling budget · 7m ago" },
  { icon: "clock",    tint: "slate",   title: "Caught CPL spike at 2:14am",           meta: "Paused automatically · 18m ago" },
  { icon: "message",  tint: "amber",   title: "“Pause the roofing campaign” via WhatsApp", meta: "Done · 52m ago" },
  { icon: "check",    tint: "emerald", title: "New Phoenix campaign live",            meta: "180k homeowners · 1h ago" },
  { icon: "refresh",  tint: "sky",     title: "Creative fatigue detected",            meta: "Replacement brief generated · 2h ago" },
];

const ICON_COMPONENT = {
  zap: Zap,
  pause: Pause,
  clock: Clock,
  refresh: RefreshCw,
  trending: TrendingUp,
  message: MessageSquare,
  check: CheckCircle2,
} as const;

const TINT_STYLES: Record<FeedItem["tint"], { bg: string; border: string; text: string }> = {
  emerald: { bg: "bg-emerald-400/10", border: "border-emerald-400/25", text: "text-emerald-400" },
  amber:   { bg: "bg-amber-400/10",   border: "border-amber-400/25",   text: "text-amber-400" },
  slate:   { bg: "bg-slate-400/10",   border: "border-slate-400/25",   text: "text-slate-300" },
  sky:     { bg: "bg-sky-400/10",     border: "border-sky-400/25",     text: "text-sky-400" },
};

type SlotItem = FeedItem & { _key: number };

export default function MobileDecisionCards() {
  const keyCounter = useRef(0);
  const feedCursor = useRef(0);

  const nextSlot = (): SlotItem => {
    const item = FEED[feedCursor.current % FEED.length];
    feedCursor.current += 1;
    keyCounter.current += 1;
    return { ...item, _key: keyCounter.current };
  };

  const [slots, setSlots] = useState<SlotItem[]>(() => [
    nextSlot(),
    nextSlot(),
    nextSlot(),
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setSlots((prev) => [...prev.slice(1), nextSlot()]);
    }, 3600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[420px] mx-auto">
      <style>{`
        @keyframes card-slide-in {
          from { opacity: 0; transform: translateY(14px) scale(0.98); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .decision-card {
          animation: card-slide-in 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
      {slots.map((s, i) => {
        const Icon = ICON_COMPONENT[s.icon];
        const tint = TINT_STYLES[s.tint];
        const depth = (2 - i) / 2; // 0 (bottom) → 1 (top)
        return (
          <div
            key={s._key}
            className="decision-card relative flex items-start gap-3 px-3.5 py-3 rounded-2xl backdrop-blur-xl"
            style={{
              background: "linear-gradient(180deg, rgba(22,24,32,0.82), rgba(13,15,20,0.82))",
              boxShadow:
                "0 12px 32px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
              opacity: 1 - depth * 0.12,
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                padding: 1,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 45%, rgba(245,166,35,0.18) 100%)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              } as React.CSSProperties}
            />
            <div
              className={`relative flex-none w-9 h-9 rounded-xl border flex items-center justify-center ${tint.bg} ${tint.border}`}
            >
              <Icon className={`w-4 h-4 ${tint.text}`} strokeWidth={2.2} />
            </div>
            <div className="relative min-w-0 flex-1 pt-[1px]">
              <div className="text-[13.5px] leading-snug font-medium text-[#e8eaf0] truncate">
                {s.title}
              </div>
              <div className="text-[11.5px] text-[#8b8fa8] mt-0.5 truncate">
                {s.meta}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
