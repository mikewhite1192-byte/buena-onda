"use client";

import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  phase: number;
  morphSpeed: number;
  points: number[];
}

// Generate organic shape points with variation
function generatePoints(count: number): number[] {
  return Array.from({ length: count }, () => 0.85 + Math.random() * 0.3);
}

export default function AnimatedBlobs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = canvas!.offsetWidth * (window.devicePixelRatio || 1);
      canvas!.height = canvas!.offsetHeight * (window.devicePixelRatio || 1);
      ctx!.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // 4 blobs — vivid, fully saturated, sharp edges
    blobsRef.current = [
      // Dominant orange
      { x: w * 0.65, y: h * 0.3, vx: 1.2, vy: 0.8, baseRadius: Math.min(w, h) * 0.28, color: "#FF6B00", phase: 0, morphSpeed: 0.012, points: generatePoints(8) },
      // Deep amber
      { x: w * 0.25, y: h * 0.6, vx: -0.9, vy: 1.1, baseRadius: Math.min(w, h) * 0.24, color: "#FF8C00", phase: 2, morphSpeed: 0.010, points: generatePoints(8) },
      // Accent gold
      { x: w * 0.5, y: h * 0.2, vx: 0.7, vy: -1.0, baseRadius: Math.min(w, h) * 0.20, color: "#FFB700", phase: 4, morphSpeed: 0.014, points: generatePoints(8) },
      // Subtle cool accent
      { x: w * 0.8, y: h * 0.7, vx: -1.1, vy: -0.7, baseRadius: Math.min(w, h) * 0.18, color: "#FF5500", phase: 1, morphSpeed: 0.011, points: generatePoints(8) },
    ];

    let time = 0;

    function draw() {
      if (!ctx || !canvas) return;
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      // Clear with near-black background
      ctx.clearRect(0, 0, cw, ch);

      // Set blend mode for natural color mixing where blobs overlap
      ctx.globalCompositeOperation = "screen";

      time += 1;

      for (const blob of blobsRef.current) {
        // Move with velocity
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges — billiard ball style, natural reflection
        if (blob.x < blob.baseRadius * 0.5) { blob.x = blob.baseRadius * 0.5; blob.vx = Math.abs(blob.vx); }
        if (blob.x > cw - blob.baseRadius * 0.5) { blob.x = cw - blob.baseRadius * 0.5; blob.vx = -Math.abs(blob.vx); }
        if (blob.y < blob.baseRadius * 0.5) { blob.y = blob.baseRadius * 0.5; blob.vy = Math.abs(blob.vy); }
        if (blob.y > ch - blob.baseRadius * 0.5) { blob.y = ch - blob.baseRadius * 0.5; blob.vy = -Math.abs(blob.vy); }

        // Draw sharp organic shape — silk ribbon / liquid feel
        const numPoints = blob.points.length;
        const angleStep = (Math.PI * 2) / numPoints;

        // Calculate all the morphed points
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < numPoints; i++) {
          const baseWobble = blob.points[i];
          const wobble = baseWobble
            + Math.sin(time * blob.morphSpeed + i * 1.5 + blob.phase) * 0.12
            + Math.cos(time * blob.morphSpeed * 0.7 + i * 2.3) * 0.08;
          const r = blob.baseRadius * wobble;
          const angle = angleStep * i;
          pts.push({
            x: blob.x + Math.cos(angle) * r,
            y: blob.y + Math.sin(angle) * r,
          });
        }

        // Draw smooth closed curve through points using cubic bezier
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const curr = pts[i];
          const next = pts[(i + 1) % numPoints];
          const prev = pts[(i - 1 + numPoints) % numPoints];
          const nextNext = pts[(i + 2) % numPoints];

          if (i === 0) {
            ctx.moveTo(curr.x, curr.y);
          }

          // Catmull-Rom to Bezier conversion for smooth organic curves
          const cp1x = curr.x + (next.x - prev.x) / 6;
          const cp1y = curr.y + (next.y - prev.y) / 6;
          const cp2x = next.x - (nextNext.x - curr.x) / 6;
          const cp2y = next.y - (nextNext.y - curr.y) / 6;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
        }
        ctx.closePath();

        // Solid fill — no gradient fade, no opacity reduction, full vivid
        ctx.fillStyle = blob.color;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
