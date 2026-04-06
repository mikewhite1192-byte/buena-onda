"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBlobs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animId = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let scrollY = 0;
    let lastScrollY = 0;
    let scrollVelocity = 0;

    // Blob physics
    const blobs = [
      { x: 0, y: 0, vx: 0.7, vy: 0.5, radius: 0, r: 255, g: 140, b: 0 },   // #FF8C00
      { x: 0, y: 0, vx: -0.5, vy: 0.6, radius: 0, r: 255, g: 107, b: 0 },   // #FF6B00
      { x: 0, y: 0, vx: 0.4, vy: -0.55, radius: 0, r: 255, g: 183, b: 0 },  // #FFB700
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = window.innerWidth;
      const h = window.innerHeight;
      const base = Math.min(w, h) * 0.22;

      blobs[0].x = w * 0.3; blobs[0].y = h * 0.35; blobs[0].radius = base * 1.4;
      blobs[1].x = w * 0.7; blobs[1].y = h * 0.55; blobs[1].radius = base * 1.2;
      blobs[2].x = w * 0.5; blobs[2].y = h * 0.25; blobs[2].radius = base * 1.0;
    }
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    function onMouseMove(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }
    window.addEventListener("mousemove", onMouseMove);

    // Scroll tracking
    function onScroll() {
      scrollY = window.scrollY;
      scrollVelocity = Math.abs(scrollY - lastScrollY) * 0.15;
      lastScrollY = scrollY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Calculate scroll-based opacity
    function getOpacity(): number {
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const scrollBottom = docH - scrollY - vh;

      // Hero — full
      if (scrollY < vh) return 0.85 + 0.15 * (1 - scrollY / vh);
      // Bottom (pricing/CTA) — ramp back up
      if (scrollBottom < vh * 1.8) {
        const progress = 1 - scrollBottom / (vh * 1.8);
        return 0.25 + progress * 0.55;
      }
      // Content — pulled back
      return 0.25;
    }

    // Metaball field function — returns intensity at point (px, py)
    function field(px: number, py: number): number {
      let sum = 0;
      for (const b of blobs) {
        const dx = px - b.x;
        const dy = py - b.y;
        const distSq = dx * dx + dy * dy;
        sum += (b.radius * b.radius) / distSq;
      }
      return sum;
    }

    // Get dominant color at point based on closest blob influence
    function getColor(px: number, py: number): [number, number, number] {
      let totalWeight = 0;
      let r = 0, g = 0, b = 0;
      for (const blob of blobs) {
        const dx = px - blob.x;
        const dy = py - blob.y;
        const distSq = dx * dx + dy * dy;
        const weight = (blob.radius * blob.radius) / distSq;
        r += blob.r * weight;
        g += blob.g * weight;
        b += blob.b * weight;
        totalWeight += weight;
      }
      return [r / totalWeight, g / totalWeight, b / totalWeight];
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.clearRect(0, 0, w, h);

      // Update blob positions
      for (const blob of blobs) {
        // Mouse attraction — 8% pull
        const mdx = mouseX - blob.x;
        const mdy = mouseY - blob.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist > 10) {
          blob.vx += (mdx / mDist) * 0.008;
          blob.vy += (mdy / mDist) * 0.008;
        }

        // Scroll disturbance
        blob.vy += scrollVelocity * 0.02 * (Math.random() - 0.5);
        blob.vx += scrollVelocity * 0.01 * (Math.random() - 0.5);

        // Blob-to-blob attraction when close
        for (const other of blobs) {
          if (blob === other) continue;
          const dx = other.x - blob.x;
          const dy = other.y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = blob.radius + other.radius;
          if (dist < threshold * 2 && dist > 1) {
            const force = 0.0004 * Math.max(0, threshold * 2 - dist);
            blob.vx += (dx / dist) * force;
            blob.vy += (dy / dist) * force;
          }
        }

        // Dampen
        blob.vx *= 0.995;
        blob.vy *= 0.995;

        // Minimum speed
        const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy);
        if (speed < 0.3) { blob.vx *= 2; blob.vy *= 2; }
        if (speed > 3) { blob.vx *= 0.8; blob.vy *= 0.8; }

        // Move
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off viewport edges
        if (blob.x < blob.radius * 0.3) { blob.x = blob.radius * 0.3; blob.vx = Math.abs(blob.vx); }
        if (blob.x > w - blob.radius * 0.3) { blob.x = w - blob.radius * 0.3; blob.vx = -Math.abs(blob.vx); }
        if (blob.y < blob.radius * 0.3) { blob.y = blob.radius * 0.3; blob.vy = Math.abs(blob.vy); }
        if (blob.y > h - blob.radius * 0.3) { blob.y = h - blob.radius * 0.3; blob.vy = -Math.abs(blob.vy); }
      }

      // Decay scroll velocity
      scrollVelocity *= 0.92;

      // Render metaballs using pixel sampling
      const opacity = getOpacity();
      const step = 4; // Sample every 4px for performance
      const imgData = ctx!.createImageData(w, h);
      const data = imgData.data;
      const threshold = 1.0;

      for (let py = 0; py < h; py += step) {
        for (let px = 0; px < w; px += step) {
          const f = field(px, py);
          if (f >= threshold) {
            const [r, g, b] = getColor(px, py);
            const alpha = Math.min((f - threshold) * 180, 255) * opacity;

            // Fill the step x step block
            for (let dy = 0; dy < step && py + dy < h; dy++) {
              for (let dx = 0; dx < step && px + dx < w; dx++) {
                const idx = ((py + dy) * w + (px + dx)) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = alpha;
              }
            }
          }
        }
      }

      ctx!.putImageData(imgData, 0, 0);

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "#080808" }}
    />
  );
}
