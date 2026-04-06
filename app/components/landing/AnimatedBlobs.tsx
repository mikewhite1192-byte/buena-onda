"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedBlobs() {
  const [mounted, setMounted] = useState(false);
  const blob1 = useRef({ x: 30, y: 25, vx: 0.3, vy: 0.2 });
  const blob2 = useRef({ x: 65, y: 55, vx: -0.25, vy: 0.3 });
  const blob3 = useRef({ x: 50, y: 15, vx: 0.2, vy: -0.25 });
  const [pos, setPos] = useState({ b1: { x: 30, y: 25 }, b2: { x: 65, y: 55 }, b3: { x: 50, y: 15 } });
  const mouseRef = useRef({ x: 50, y: 50 });
  const scrollVelRef = useRef(0);
  const lastScrollRef = useRef(0);
  const opacityRef = useRef(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  // Mouse tracking
  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseRef.current = { x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 };
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Scroll tracking
  useEffect(() => {
    function onScroll() {
      const sy = window.scrollY;
      scrollVelRef.current = Math.abs(sy - lastScrollRef.current) * 0.08;
      lastScrollRef.current = sy;

      // Opacity by scroll position
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const bottom = docH - sy - vh;
      let op = 0.25;
      if (sy < vh) op = 0.85 + 0.15 * (1 - sy / vh);
      else if (bottom < vh * 1.8) op = 0.25 + (1 - bottom / (vh * 1.8)) * 0.55;
      opacityRef.current = op;
      setOpacity(op);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!mounted) return;
    let animId: number;

    function tick() {
      const blobs = [blob1.current, blob2.current, blob3.current];
      const mouse = mouseRef.current;

      for (const b of blobs) {
        // Mouse pull — 8%
        b.vx += (mouse.x - b.x) * 0.0008;
        b.vy += (mouse.y - b.y) * 0.0008;

        // Scroll disturbance
        b.vx += scrollVelRef.current * (Math.random() - 0.5) * 0.03;
        b.vy += scrollVelRef.current * (Math.random() - 0.5) * 0.03;

        // Attraction between blobs
        for (const other of blobs) {
          if (b === other) continue;
          const dx = other.x - b.x;
          const dy = other.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40 && dist > 0.1) {
            b.vx += (dx / dist) * 0.003;
            b.vy += (dy / dist) * 0.003;
          }
        }

        // Dampen
        b.vx *= 0.997;
        b.vy *= 0.997;

        // Min/max speed
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.08) { b.vx *= 3; b.vy *= 3; }
        if (speed > 1.2) { b.vx *= 0.7; b.vy *= 0.7; }

        // Move (in % of viewport)
        b.x += b.vx;
        b.y += b.vy;

        // Bounce
        if (b.x < -10) { b.x = -10; b.vx = Math.abs(b.vx); }
        if (b.x > 110) { b.x = 110; b.vx = -Math.abs(b.vx); }
        if (b.y < -10) { b.y = -10; b.vy = Math.abs(b.vy); }
        if (b.y > 110) { b.y = 110; b.vy = -Math.abs(b.vy); }
      }

      scrollVelRef.current *= 0.9;

      setPos({
        b1: { x: blob1.current.x, y: blob1.current.y },
        b2: { x: blob2.current.x, y: blob2.current.y },
        b3: { x: blob3.current.x, y: blob3.current.y },
      });

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* SVG filter for metaball gooey merge effect */}
      <svg className="fixed" style={{ width: 0, height: 0, position: "fixed" }}>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Blob container — FIXED to viewport, behind all content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          filter: "url(#gooey)",
          opacity,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Blob 1 — dominant orange, largest */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(45vw, 500px)",
            height: "min(45vw, 500px)",
            background: "#FF8C00",
            left: `${pos.b1.x}%`,
            top: `${pos.b1.y}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 0.05s linear, top 0.05s linear",
          }}
        />
        {/* Blob 2 — deep amber */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(38vw, 420px)",
            height: "min(38vw, 420px)",
            background: "#FF6B00",
            left: `${pos.b2.x}%`,
            top: `${pos.b2.y}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 0.05s linear, top 0.05s linear",
          }}
        />
        {/* Blob 3 — gold, smaller, faster */}
        <div
          className="absolute rounded-full"
          style={{
            width: "min(30vw, 340px)",
            height: "min(30vw, 340px)",
            background: "#FFB700",
            left: `${pos.b3.x}%`,
            top: `${pos.b3.y}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 0.05s linear, top 0.05s linear",
          }}
        />
      </div>
    </>
  );
}
