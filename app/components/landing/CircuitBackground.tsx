"use client";

import { useEffect, useRef } from "react";

const AMBER = "245, 166, 35";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const CELL = 68;
    const JITTER = 10;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    const MAX_PULSES = 5;

    // "buena onda" letter paths — each letter is a continuous sequence of
    // waypoints in a 2w × 3h unit grid. Pulses trace these at regular speed,
    // leaving a faint amber trail so (if you're looking) the word is briefly
    // visible on the board.
    const LETTERS: Record<string, number[][]> = {
      b: [[0,0],[0,3],[2,3],[2,2],[0,2]],
      u: [[0,0],[0,3],[2,3],[2,0]],
      e: [[2,1],[0,1],[0,3],[2,3],[2,2],[0,2]],
      n: [[0,3],[0,0],[2,0],[2,3]],
      a: [[0,3],[0,0],[2,0],[2,3],[0,3],[0,2],[2,2]],
      o: [[0,0],[2,0],[2,3],[0,3],[0,0]],
      d: [[2,0],[2,3],[0,3],[0,1],[2,1]],
    };
    const MEGA_TEXT = "buena onda";
    const LETTER_SCALE = 18;           // px per unit
    const LETTER_ADVANCE = 3;          // units of horizontal advance per char
    const SPACE_ADVANCE = 2;           // space width in units
    const LETTER_STAGGER_MS = 260;     // delay between consecutive letter pulses
    const LETTER_SPEED = 0.32;         // px/ms (about same as regular pulses)
    const TRAIL_FADE_MS = 2400;        // how long a letter segment lingers after traced

    let W = 0;
    let H = 0;

    type Node = { x: number; y: number; id: number };
    type Edge = { a: number; b: number; dir: "h" | "v"; len: number };

    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let adjacency = new Map<number, number[]>();
    let baseCanvas: HTMLCanvasElement | null = null;

    function buildGrid() {
      nodes = [];
      edges = [];
      adjacency = new Map();

      const cols = Math.ceil(W / CELL) + 2;
      const rows = Math.ceil(H / CELL) + 2;
      const grid: number[][] = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const id = nodes.length;
          grid[r][c] = id;
          nodes.push({
            id,
            x: (c - 1) * CELL + (Math.random() - 0.5) * JITTER,
            y: (r - 1) * CELL + (Math.random() - 0.5) * JITTER,
          });
          adjacency.set(id, []);
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = grid[r][c];
          if (c < cols - 1 && Math.random() < 0.78) {
            const other = grid[r][c + 1];
            const ei = edges.length;
            edges.push({
              a: id,
              b: other,
              dir: "h",
              len: Math.hypot(nodes[other].x - nodes[id].x, nodes[other].y - nodes[id].y),
            });
            adjacency.get(id)!.push(ei);
            adjacency.get(other)!.push(ei);
          }
          if (r < rows - 1 && Math.random() < 0.78) {
            const other = grid[r + 1][c];
            const ei = edges.length;
            edges.push({
              a: id,
              b: other,
              dir: "v",
              len: Math.hypot(nodes[other].x - nodes[id].x, nodes[other].y - nodes[id].y),
            });
            adjacency.get(id)!.push(ei);
            adjacency.get(other)!.push(ei);
          }
        }
      }
    }

    function drawBase() {
      baseCanvas = document.createElement("canvas");
      baseCanvas.width = Math.floor(W * DPR);
      baseCanvas.height = Math.floor(H * DPR);
      const bctx = baseCanvas.getContext("2d")!;
      bctx.scale(DPR, DPR);

      bctx.strokeStyle = "rgba(255,255,255,0.045)";
      bctx.lineWidth = 1;
      bctx.lineCap = "round";

      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        bctx.beginPath();
        bctx.moveTo(a.x, a.y);
        bctx.lineTo(b.x, b.y);
        bctx.stroke();
      }

      bctx.fillStyle = "rgba(255,255,255,0.1)";
      for (const n of nodes) {
        const deg = adjacency.get(n.id)!.length;
        if (deg >= 3) {
          bctx.fillRect(n.x - 1.5, n.y - 1.5, 3, 3);
        } else if (deg === 2) {
          bctx.fillRect(n.x - 1, n.y - 1, 2, 2);
        }
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(DPR, DPR);
      buildGrid();
      drawBase();
    }
    resize();

    type Pulse = {
      edgeIdx: number;
      dir: 1 | -1;
      t: number;
      speed: number;
      life: number;
    };
    const pulses: Pulse[] = [];
    const flares: Array<{ x: number; y: number; t: number }> = [];

    function spawnPulse() {
      if (pulses.length >= MAX_PULSES || edges.length === 0) return;
      const edgeIdx = Math.floor(Math.random() * edges.length);
      pulses.push({
        edgeIdx,
        dir: Math.random() < 0.5 ? 1 : -1,
        t: 0,
        speed: 0.35 + Math.random() * 0.25,
        life: 6 + Math.floor(Math.random() * 8),
      });
    }

    function step(dt: number) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const edge = edges[p.edgeIdx];
        p.t += (p.speed * dt) / edge.len;
        if (p.t >= 1) {
          const arrivedNodeId = p.dir === 1 ? edge.b : edge.a;
          flares.push({ x: nodes[arrivedNodeId].x, y: nodes[arrivedNodeId].y, t: 0 });
          p.life -= 1;
          if (p.life <= 0) {
            pulses.splice(i, 1);
            continue;
          }
          const options = adjacency.get(arrivedNodeId)!.filter((ei) => ei !== p.edgeIdx);
          if (options.length === 0) {
            pulses.splice(i, 1);
            continue;
          }
          const next = options[Math.floor(Math.random() * options.length)];
          const nextEdge = edges[next];
          p.edgeIdx = next;
          p.dir = nextEdge.a === arrivedNodeId ? 1 : -1;
          p.t = 0;
        }
      }

      for (let i = flares.length - 1; i >= 0; i--) {
        flares[i].t += dt / 550;
        if (flares[i].t >= 1) flares.splice(i, 1);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (baseCanvas) ctx.drawImage(baseCanvas, 0, 0, W, H);

      for (const p of pulses) {
        const edge = edges[p.edgeIdx];
        const a = p.dir === 1 ? nodes[edge.a] : nodes[edge.b];
        const b = p.dir === 1 ? nodes[edge.b] : nodes[edge.a];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const trailLen = 0.6;
        const t0 = Math.max(0, p.t - trailLen);
        const tx = a.x + (b.x - a.x) * t0;
        const ty = a.y + (b.y - a.y) * t0;

        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `rgba(${AMBER}, 0)`);
        grad.addColorStop(0.6, `rgba(${AMBER}, 0.35)`);
        grad.addColorStop(1, `rgba(${AMBER}, 0.9)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.shadowBlur = 14;
        ctx.shadowColor = `rgba(${AMBER}, 0.85)`;
        ctx.fillStyle = `rgba(${AMBER}, 1)`;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const f of flares) {
        const alpha = Math.max(0, (1 - f.t) * 0.75);
        const size = 4 + f.t * 16;
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, size);
        grad.addColorStop(0, `rgba(${AMBER}, ${alpha})`);
        grad.addColorStop(1, `rgba(${AMBER}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(f.x - size, f.y - size, size * 2, size * 2);
      }
    }

    // Letter-tracing pulse: follows a pre-computed list of waypoints that
    // happen to spell a character. Visually identical to a regular pulse.
    type PathPulse = {
      pts: Array<{ x: number; y: number }>;
      seg: number;    // current segment (from pts[seg-1] to pts[seg])
      t: number;      // 0..1 within current segment
      startAt: number; // ms — when this pulse becomes alive
    };
    const pathPulses: PathPulse[] = [];

    // Faint segments left behind by letter pulses; fade away over TRAIL_FADE_MS
    type GhostSeg = { x1: number; y1: number; x2: number; y2: number; start: number };
    const ghostSegs: GhostSeg[] = [];

    let nextMegaAt = performance.now() + 10000 + Math.random() * 5000;

    function triggerMega() {
      // Measure word width
      let totalUnits = 0;
      for (const ch of MEGA_TEXT) {
        if (ch === " ") totalUnits += SPACE_ADVANCE;
        else if (LETTERS[ch]) totalUnits += LETTER_ADVANCE;
      }
      // Subtract trailing advance gap
      totalUnits -= 1;
      const totalPx = totalUnits * LETTER_SCALE;
      const originX = Math.round(W / 2 - totalPx / 2);
      const originY = Math.round(H / 2 - (3 * LETTER_SCALE) / 2);

      let cx = originX;
      let staggerIdx = 0;
      const baseStart = performance.now();

      for (const ch of MEGA_TEXT) {
        if (ch === " ") {
          cx += SPACE_ADVANCE * LETTER_SCALE;
          continue;
        }
        const shape = LETTERS[ch];
        if (!shape) {
          cx += LETTER_ADVANCE * LETTER_SCALE;
          continue;
        }
        const pts = shape.map(([lx, ly]) => ({
          x: cx + lx * LETTER_SCALE,
          y: originY + ly * LETTER_SCALE,
        }));
        pathPulses.push({
          pts,
          seg: 1,
          t: 0,
          startAt: baseStart + staggerIdx * LETTER_STAGGER_MS,
        });
        cx += LETTER_ADVANCE * LETTER_SCALE;
        staggerIdx++;
      }
    }

    function stepPathPulses(now: number, dt: number) {
      for (let i = pathPulses.length - 1; i >= 0; i--) {
        const p = pathPulses[i];
        if (now < p.startAt) continue;

        const a = p.pts[p.seg - 1];
        const b = p.pts[p.seg];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        p.t += (LETTER_SPEED * dt) / segLen;

        if (p.t >= 1) {
          // completed this segment — leave a ghost
          ghostSegs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, start: now });
          p.seg++;
          p.t = 0;
          if (p.seg >= p.pts.length) {
            pathPulses.splice(i, 1);
          }
        }
      }

      // expire ghosts
      for (let i = ghostSegs.length - 1; i >= 0; i--) {
        if (now - ghostSegs[i].start > TRAIL_FADE_MS) ghostSegs.splice(i, 1);
      }
    }

    function drawPathPulsesAndGhosts(now: number) {
      // ghosts first (behind moving pulse dots)
      for (const g of ghostSegs) {
        const age = now - g.start;
        const fade = Math.max(0, 1 - age / TRAIL_FADE_MS);
        const alpha = 0.22 * fade; // intentionally faint — has to be "look hard to notice"
        if (alpha <= 0.01) continue;
        ctx.strokeStyle = `rgba(${AMBER}, ${alpha})`;
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y1);
        ctx.lineTo(g.x2, g.y2);
        ctx.stroke();
      }

      // moving pulse dots
      for (const p of pathPulses) {
        if (now < p.startAt) continue;
        const a = p.pts[p.seg - 1];
        const b = p.pts[p.seg];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        // Short leading trail (same visual as regular pulses)
        const trailT = Math.max(0, p.t - 0.6);
        const tx = a.x + (b.x - a.x) * trailT;
        const ty = a.y + (b.y - a.y) * trailT;
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `rgba(${AMBER}, 0)`);
        grad.addColorStop(1, `rgba(${AMBER}, 0.8)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${AMBER}, 0.8)`;
        ctx.fillStyle = `rgba(${AMBER}, 0.95)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    let rafId = 0;
    let lastFrame = 0;
    let lastSpawn = performance.now();
    let prev = performance.now();

    function loop(now: number) {
      rafId = requestAnimationFrame(loop);
      if (now - lastFrame < FRAME_INTERVAL) return;
      const dt = Math.min(50, now - prev);
      prev = now;
      lastFrame = now;

      const spawnWait = 450 + Math.random() * 600;
      if (now - lastSpawn > spawnWait) {
        spawnPulse();
        lastSpawn = now;
      }

      if (pathPulses.length === 0 && now > nextMegaAt) {
        triggerMega();
        // schedule next event — long enough that most people won't notice the pattern
        nextMegaAt = now + 18000 + Math.random() * 7000 + MEGA_TEXT.length * LETTER_STAGGER_MS;
      }

      step(dt);
      stepPathPulses(now, dt);
      draw();
      drawPathPulsesAndGhosts(now);
    }

    // warm up with a couple of pulses so it's not empty on first frame
    spawnPulse();
    setTimeout(() => spawnPulse(), 300);
    rafId = requestAnimationFrame(loop);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        pathPulses.length = 0;
        ghostSegs.length = 0;
      }, 180);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#080808",
      }}
    />
  );
}
