"use client";

export function SkeletonLine({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      style={{
        background: "#161820",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SkeletonLine width="40%" height={18} />
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} width={`${85 - i * 15}%`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: 16, padding: "14px 18px", alignItems: "center" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <SkeletonLine width={120} height={14} />
      <SkeletonLine width={80} height={14} />
      <SkeletonLine width={60} height={14} />
      <SkeletonLine width={60} height={14} />
      <div style={{ flex: 1 }} />
      <SkeletonLine width={40} height={14} />
    </div>
  );
}
