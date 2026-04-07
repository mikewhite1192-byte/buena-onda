"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0f14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(4rem, 15vw, 8rem)",
          fontWeight: 700,
          color: "#f5a623",
          margin: 0,
          lineHeight: 1,
        }}
      >
        500
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#e8eaf0",
          marginTop: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        Something went wrong
      </p>
      <p
        style={{
          fontSize: "0.95rem",
          color: "#8b8fa8",
          marginTop: 0,
          marginBottom: "2rem",
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 2rem",
            backgroundColor: "#f5a623",
            color: "#0d0f14",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            padding: "0.75rem 2rem",
            backgroundColor: "transparent",
            color: "#e8eaf0",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
