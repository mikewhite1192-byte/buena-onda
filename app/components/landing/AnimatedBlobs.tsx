"use client";

import { useEffect, useRef, useState } from "react";

interface MetaBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function AnimatedBlobs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<MetaBlob[]>([]);
  const animRef = useRef<number>(0);
  const [positions, setPositions] = useState<{ x: number; y: number; r: number }[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const baseR = Math.min(w, h) * 0.18;

    // 3 large metaballs
    blobRefs.current = [
      { x: w * 0.3, y: h * 0.35, vx: 0.6, vy: 0.45, radius: baseR * 1.3 },
      { x: w * 0.7, y: h * 0.5, vx: -0.5, vy: 0.55, radius: baseR * 1.1 },
      { x: w * 0.5, y: h * 0.25, vx: 0.4, vy: -0.5, radius: baseR * 0.95 },
    ];

    function tick() {
      const blobs = blobRefs.current;
      const cw = container!.offsetWidth;
      const ch = container!.offsetHeight;

      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;

        // Bounce
        if (b.x - b.radius < 0) { b.x = b.radius; b.vx = Math.abs(b.vx); }
        if (b.x + b.radius > cw) { b.x = cw - b.radius; b.vx = -Math.abs(b.vx); }
        if (b.y - b.radius < 0) { b.y = b.radius; b.vy = Math.abs(b.vy); }
        if (b.y + b.radius > ch) { b.y = ch - b.radius; b.vy = -Math.abs(b.vy); }

        // Slight attraction between blobs when close — creates the stretch effect
        for (const other of blobs) {
          if (b === other) continue;
          const dx = other.x - b.x;
          const dy = other.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b.radius + other.radius;
          if (dist < minDist * 1.8 && dist > 0) {
            const force = 0.0003 * (minDist * 1.8 - dist);
            b.vx += (dx / dist) * force;
            b.vy += (dy / dist) * force;
          }
        }

        // Dampen velocity slightly to keep things smooth
        b.vx *= 0.999;
        b.vy *= 0.999;

        // Ensure minimum speed so they keep moving
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.3) {
          b.vx *= 1.5;
          b.vy *= 1.5;
        }
      }

      setPositions(blobs.map(b => ({ x: b.x, y: b.y, r: b.radius })));
      animRef.current = requestAnimationFrame(tick);
    }

    // Initialize positions
    setPositions(blobRefs.current.map(b => ({ x: b.x, y: b.y, r: b.radius })));
    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* The metaball filter — this is the magic */}
          {/* 1. Blur the circles so their edges bleed together */}
          {/* 2. Crank contrast so only the thick overlapping parts survive */}
          {/* 3. Result: liquid merging effect with crisp organic edges */}
          <filter id="metaball-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -10"
              result="contrast"
            />
            <feComposite in="SourceGraphic" in2="contrast" operator="atop" />
          </filter>
        </defs>

        <g filter="url(#metaball-filter)">
          {/* Blob 1 — vivid orange */}
          {positions[0] && (
            <circle
              cx={positions[0].x}
              cy={positions[0].y}
              r={positions[0].r}
              fill="#FF8C00"
              opacity="0.18"
            />
          )}
          {/* Blob 2 — deep amber */}
          {positions[1] && (
            <circle
              cx={positions[1].x}
              cy={positions[1].y}
              r={positions[1].r}
              fill="#FF6B00"
              opacity="0.15"
            />
          )}
          {/* Blob 3 — gold */}
          {positions[2] && (
            <circle
              cx={positions[2].x}
              cy={positions[2].y}
              r={positions[2].r}
              fill="#FFB700"
              opacity="0.13"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
