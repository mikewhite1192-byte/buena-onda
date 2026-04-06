"use client";

export default function AnimatedBlobs() {
  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <filter id="blob-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
          />
        </filter>
      </svg>

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
        {/* Blob 1 — orange, medium */}
        <div style={{
          position: "absolute",
          width: "min(22vw, 240px)",
          height: "min(22vw, 240px)",
          borderRadius: "50%",
          background: "#FF8C00",
          animation: "blob-move-1 28s ease-in-out infinite",
        }} />

        {/* Blob 2 — amber, slightly smaller */}
        <div style={{
          position: "absolute",
          width: "min(18vw, 200px)",
          height: "min(18vw, 200px)",
          borderRadius: "50%",
          background: "#FF6B00",
          animation: "blob-move-2 34s ease-in-out infinite",
        }} />

        {/* Blob 3 — gold, smallest */}
        <div style={{
          position: "absolute",
          width: "min(15vw, 170px)",
          height: "min(15vw, 170px)",
          borderRadius: "50%",
          background: "#FFB700",
          animation: "blob-move-3 22s ease-in-out infinite",
        }} />
      </div>

      {/* Paths designed so blobs approach each other but never overlap —
          they get close enough for the SVG filter to create the liquid
          bridge/deform effect, then drift apart */}
      <style>{`
        @keyframes blob-move-1 {
          0%   { top: 8%;  left: 10%; }
          14%  { top: 25%; left: 35%; }
          28%  { top: 55%; left: 18%; }
          42%  { top: 70%; left: 50%; }
          56%  { top: 40%; left: 72%; }
          70%  { top: 15%; left: 58%; }
          84%  { top: 35%; left: 8%;  }
          100% { top: 8%;  left: 10%; }
        }
        @keyframes blob-move-2 {
          0%   { top: 65%; left: 70%; }
          16%  { top: 40%; left: 50%; }
          33%  { top: 18%; left: 72%; }
          50%  { top: 50%; left: 85%; }
          66%  { top: 75%; left: 42%; }
          83%  { top: 55%; left: 15%; }
          100% { top: 65%; left: 70%; }
        }
        @keyframes blob-move-3 {
          0%   { top: 30%; left: 80%; }
          12%  { top: 60%; left: 60%; }
          25%  { top: 80%; left: 30%; }
          37%  { top: 50%; left: 10%; }
          50%  { top: 20%; left: 25%; }
          62%  { top: 10%; left: 55%; }
          75%  { top: 40%; left: 85%; }
          87%  { top: 70%; left: 75%; }
          100% { top: 30%; left: 80%; }
        }
      `}</style>
    </>
  );
}
