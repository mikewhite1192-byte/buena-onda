"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollReveal({
  children,
  delay = 0,
  type = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  type?: "up" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const styles = {
    up: {
      from: { opacity: 0, transform: "translateY(50px) scale(0.98)", filter: "blur(4px)" },
      to: { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
    },
    scale: {
      from: { opacity: 0, transform: "scale(0.93)", filter: "blur(3px)" },
      to: { opacity: 1, transform: "scale(1)", filter: "blur(0)" },
    },
  };

  const style = vis ? styles[type].to : styles[type].from;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
