"use client";

// lib/context/tour-context.tsx
import { createContext, useContext, useState } from "react";

interface TourContextValue {
  tourActive: boolean;
  step: number; // 1–6 while active, 0 = inactive
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourActive: false,
  step: 0,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  endTour: () => {},
});

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(0);

  const startTour = () => setStep(1);
  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const endTour = () => setStep(0);

  return (
    <TourContext.Provider value={{ tourActive: step > 0, step, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  return useContext(TourContext);
}
