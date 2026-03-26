import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0f14",
          gap: 24,
        }}
      >
        {/* BO monogram */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            borderRadius: 40,
            backgroundColor: "#161820",
            border: "3px solid #f5a623",
          }}
        >
          <span
            style={{
              fontSize: 90,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              background: "linear-gradient(135deg, #f5a623, #f76b1c)",
              backgroundClip: "text",
              color: "#f5a623",
            }}
          >
            BO
          </span>
        </div>

        {/* Company name */}
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#e8eaf0",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -1,
          }}
        >
          Buena Onda
        </span>

        {/* Tagline */}
        <span
          style={{
            fontSize: 24,
            color: "#8b8fa8",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          AI-Powered Ad Management Platform
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
