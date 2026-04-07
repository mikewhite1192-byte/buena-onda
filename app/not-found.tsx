import Link from "next/link";

export default function NotFound() {
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
        404
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#e8eaf0",
          marginTop: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        This page doesn't exist
      </p>
      <p
        style={{
          fontSize: "0.95rem",
          color: "#8b8fa8",
          marginTop: 0,
          marginBottom: "2rem",
        }}
      >
        The page you're looking for may have been moved or removed.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "0.75rem 2rem",
          backgroundColor: "#f5a623",
          color: "#0d0f14",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          transition: "opacity 0.2s",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
