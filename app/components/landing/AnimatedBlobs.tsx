"use client";

import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  phase: number;
  speed: number;
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
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Initialize blobs
    blobsRef.current = [
      { x: canvas.width * 0.7, y: canvas.height * 0.2, vx: 0.4, vy: 0.3, radius: 350, color: "rgba(245,166,35,", phase: 0, speed: 0.008 },
      { x: canvas.width * 0.2, y: canvas.height * 0.7, vx: -0.3, vy: 0.4, radius: 280, color: "rgba(247,107,28,", phase: 2, speed: 0.006 },
      { x: canvas.width * 0.5, y: canvas.height * 0.4, vx: 0.25, vy: -0.35, radius: 250, color: "rgba(255,190,50,", phase: 4, speed: 0.007 },
      { x: canvas.width * 0.3, y: canvas.height * 0.15, vx: -0.2, vy: 0.25, radius: 200, color: "rgba(130,140,255,", phase: 1, speed: 0.005 },
      { x: canvas.width * 0.8, y: canvas.height * 0.8, vx: 0.3, vy: -0.2, radius: 220, color: "rgba(245,166,35,", phase: 3, speed: 0.009 },
    ];

    let time = 0;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      for (const blob of blobsRef.current) {
        // Move
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges with some padding
        const pad = blob.radius * 0.3;
        if (blob.x - pad < 0) { blob.x = pad; blob.vx = Math.abs(blob.vx); }
        if (blob.x + pad > canvas.width) { blob.x = canvas.width - pad; blob.vx = -Math.abs(blob.vx); }
        if (blob.y - pad < 0) { blob.y = pad; blob.vy = Math.abs(blob.vy); }
        if (blob.y + pad > canvas.height) { blob.y = canvas.height - pad; blob.vy = -Math.abs(blob.vy); }

        // Morphing radius
        const morphedRadius = blob.radius + Math.sin(time * blob.speed + blob.phase) * (blob.radius * 0.15);

        // Draw blob with radial gradient
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, morphedRadius);
        gradient.addColorStop(0, blob.color + "0.25)");
        gradient.addColorStop(0.4, blob.color + "0.12)");
        gradient.addColorStop(0.7, blob.color + "0.04)");
        gradient.addColorStop(1, blob.color + "0)");

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, morphedRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

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
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
