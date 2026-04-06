"use client";

export default function AnimatedBlobs() {
  return (
    <>
      {/* SVG filter — this creates the liquid metaball merge effect */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <filter id="blob-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
          />
        </filter>
      </svg>

      {/* Blob container — fixed, full viewport, behind everything */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          filter: "url(#blob-filter)",
          overflow: "hidden",
          background: "#080808",
        }}
      >
        {/* Blob 1 — large vivid orange, slow orbit */}
        <div
          style={{
            position: "absolute",
            width: "min(50vw, 550px)",
            height: "min(50vw, 550px)",
            borderRadius: "50%",
            background: "#FF8C00",
            animation: "blob-move-1 25s ease-in-out infinite",
          }}
        />

        {/* Blob 2 — medium deep amber, different path */}
        <div
          style={{
            position: "absolute",
            width: "min(40vw, 450px)",
            height: "min(40vw, 450px)",
            borderRadius: "50%",
            background: "#FF6B00",
            animation: "blob-move-2 30s ease-in-out infinite",
          }}
        />

        {/* Blob 3 — smaller gold, faster */}
        <div
          style={{
            position: "absolute",
            width: "min(32vw, 380px)",
            height: "min(32vw, 380px)",
            borderRadius: "50%",
            background: "#FFB700",
            animation: "blob-move-3 20s ease-in-out infinite",
          }}
        />
      </div>

      {/* Keyframe animations — each blob has its own path */}
      <style>{`
        @keyframes blob-move-1 {
          0%   { top: 10%; left: 15%; transform: scale(1); }
          15%  { top: 30%; left: 60%; transform: scale(1.05); }
          30%  { top: 55%; left: 40%; transform: scale(0.95); }
          45%  { top: 20%; left: 70%; transform: scale(1.08); }
          60%  { top: 60%; left: 20%; transform: scale(0.92); }
          75%  { top: 40%; left: 55%; transform: scale(1.03); }
          100% { top: 10%; left: 15%; transform: scale(1); }
        }
        @keyframes blob-move-2 {
          0%   { top: 55%; left: 65%; transform: scale(1); }
          20%  { top: 25%; left: 30%; transform: scale(1.06); }
          40%  { top: 60%; left: 10%; transform: scale(0.94); }
          60%  { top: 15%; left: 50%; transform: scale(1.04); }
          80%  { top: 50%; left: 75%; transform: scale(0.96); }
          100% { top: 55%; left: 65%; transform: scale(1); }
        }
        @keyframes blob-move-3 {
          0%   { top: 35%; left: 40%; transform: scale(1); }
          12%  { top: 60%; left: 70%; transform: scale(1.1); }
          25%  { top: 15%; left: 55%; transform: scale(0.9); }
          37%  { top: 45%; left: 15%; transform: scale(1.05); }
          50%  { top: 70%; left: 45%; transform: scale(0.95); }
          62%  { top: 20%; left: 75%; transform: scale(1.08); }
          75%  { top: 50%; left: 25%; transform: scale(0.92); }
          87%  { top: 30%; left: 60%; transform: scale(1.03); }
          100% { top: 35%; left: 40%; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
