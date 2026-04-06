"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedBlobs() {
  const [mounted, setMounted] = useState(false);
  const b1 = useRef({ x: 25, y: 30, vx: 0.25, vy: 0.18 });
  const b2 = useRef({ x: 68, y: 55, vx: -0.2, vy: 0.22 });
  const b3 = useRef({ x: 45, y: 18, vx: 0.18, vy: -0.2 });
  const [p, setP] = useState({ x1: 25, y1: 30, x2: 68, y2: 55, x3: 45, y3: 18 });
  const mouse = useRef({ x: 50, y: 50 });
  const scrollVel = useRef(0);
  const lastScroll = useRef(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  // Mouse
  useEffect(() => {
    const h = (e: MouseEvent) => { mouse.current = { x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 }; };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // Scroll
  useEffect(() => {
    const h = () => {
      const sy = window.scrollY;
      scrollVel.current = Math.abs(sy - lastScroll.current) * 0.06;
      lastScroll.current = sy;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const bottom = docH - sy - vh;
      let op = 0.25;
      if (sy < vh) op = 0.85 + 0.15 * (1 - sy / vh);
      else if (bottom < vh * 1.8) op = 0.25 + (1 - bottom / (vh * 1.8)) * 0.55;
      setOpacity(op);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Physics loop
  useEffect(() => {
    if (!mounted) return;
    let id: number;
    const blobs = [b1.current, b2.current, b3.current];
    // Sizes in % of viewport for repulsion calc
    const sizes = [22, 19, 15];

    function tick() {
      const m = mouse.current;

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];

        // Mouse pull — 8%
        b.vx += (m.x - b.x) * 0.0006;
        b.vy += (m.y - b.y) * 0.0006;

        // Scroll kick
        b.vx += scrollVel.current * (Math.random() - 0.5) * 0.02;
        b.vy += scrollVel.current * (Math.random() - 0.5) * 0.02;

        // Repulsion from other blobs — never overlap, stretch toward but push apart
        for (let j = 0; j < blobs.length; j++) {
          if (i === j) continue;
          const other = blobs[j];
          const dx = other.x - b.x;
          const dy = other.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = (sizes[i] + sizes[j]) * 0.55;

          if (dist < minDist * 2.5 && dist > 0.1) {
            if (dist < minDist) {
              // Repel — too close
              const repel = 0.008 * (minDist - dist) / minDist;
              b.vx -= (dx / dist) * repel;
              b.vy -= (dy / dist) * repel;
            } else {
              // Gentle attract — in the merge zone
              const attract = 0.0003 * (minDist * 2.5 - dist);
              b.vx += (dx / dist) * attract;
              b.vy += (dy / dist) * attract;
            }
          }
        }

        // Dampen
        b.vx *= 0.997;
        b.vy *= 0.997;

        // Min/max speed
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.06) { b.vx *= 3; b.vy *= 3; }
        if (speed > 0.8) { b.vx *= 0.7; b.vy *= 0.7; }

        // Move
        b.x += b.vx;
        b.y += b.vy;

        // Bounce off viewport (in %)
        if (b.x < 5) { b.x = 5; b.vx = Math.abs(b.vx); }
        if (b.x > 95) { b.x = 95; b.vx = -Math.abs(b.vx); }
        if (b.y < 5) { b.y = 5; b.vy = Math.abs(b.vy); }
        if (b.y > 95) { b.y = 95; b.vy = -Math.abs(b.vy); }
      }

      scrollVel.current *= 0.9;
      setP({ x1: b1.current.x, y1: b1.current.y, x2: b2.current.x, y2: b2.current.y, x3: b3.current.x, y3: b3.current.y });
      id = requestAnimationFrame(tick);
    }

    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* SVG gooey filter — creates liquid merge effect */}
      <svg style={{ position: "fixed", width: 0, height: 0, top: 0, left: 0 }} aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Blob container — position:fixed, covers full viewport, z-index 0 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          filter: "url(#goo)",
          opacity,
          transition: "opacity 0.5s ease",
          overflow: "visible",
        }}
      >
        {/* Blob 1 — large orange */}
        <div style={{
          position: "absolute",
          width: "min(45vw, 520px)",
          height: "min(45vw, 520px)",
          borderRadius: "50%",
          background: "#FF8C00",
          left: `${p.x1}%`,
          top: `${p.y1}%`,
          transform: "translate(-50%, -50%)",
        }} />

        {/* Blob 2 — medium amber */}
        <div style={{
          position: "absolute",
          width: "min(38vw, 440px)",
          height: "min(38vw, 440px)",
          borderRadius: "50%",
          background: "#FF6B00",
          left: `${p.x2}%`,
          top: `${p.y2}%`,
          transform: "translate(-50%, -50%)",
        }} />

        {/* Blob 3 — smaller gold, faster */}
        <div style={{
          position: "absolute",
          width: "min(30vw, 360px)",
          height: "min(30vw, 360px)",
          borderRadius: "50%",
          background: "#FFB700",
          left: `${p.x3}%`,
          top: `${p.y3}%`,
          transform: "translate(-50%, -50%)",
        }} />
      </div>
    </>
  );
}
