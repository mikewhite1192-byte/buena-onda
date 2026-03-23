"use client";

// lib/context/tour-context.tsx
import { createContext, useContext, useState } from "react";

interface TourContextValue {
  tourActive: boolean;
  demoMode: boolean; // stays true after tour ends — used for sticky CTA bar
  step: number; // 1–8 while active, 0 = inactive
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourActive: false,
  demoMode: false,
  step: 0,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  endTour: () => {},
});

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const startTour = () => { setDemoMode(true); setStep(1); };
  const nextStep = () => setStep((s) => Math.min(s + 1, 8));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const endTour = () => setStep(0); // demoMode stays true

  return (
    <TourContext.Provider value={{ tourActive: step > 0, demoMode, step, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  return useContext(TourContext);
}
