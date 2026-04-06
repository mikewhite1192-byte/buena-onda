import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ad Account Grader — Free tool by Buena Onda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0d0f14",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* Top: badge + title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#161820",
                border: "2px solid #f5a623",
                fontSize: 24,
              }}
            >
              <span style={{ color: "#f5a623" }}>A+</span>
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f5a623",
                fontFamily: "system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Free Tool
            </span>
          </div>

          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#e8eaf0",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Ad Account Grader
          </span>

          <span
            style={{
              fontSize: 26,
              color: "#8b8fa8",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.4,
              maxWidth: 800,
            }}
          >
            Score your Meta, Google, or TikTok ad account health in 60 seconds. Get actionable fixes to improve ROAS.
          </span>
        </div>

        {/* Bottom: branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#161820",
                border: "2px solid #f5a623",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "Georgia, serif",
                  color: "#f5a623",
                }}
              >
                BO
              </span>
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#e8eaf0",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              buenaonda.ai
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: "#8b8fa8",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            AI-Powered Ad Management
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
