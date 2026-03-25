"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const T = {
  bg: "#0d0f14",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  danger: "#f87171",
};

function LoginInner() {
  const params = useSearchParams();
  const error = params.get("error");

  const errorMsg =
    error === "expired" ? "This link has expired. Ask your agency to send a new one." :
    error === "used" ? "This link has already been used. Ask your agency to send a new one." :
    error === "invalid" ? "This link is invalid. Ask your agency to send a new one." :
    null;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>Portal Access</h2>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
        Contact your agency to receive a login link for your dashboard.
      </p>
      {errorMsg && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", color: T.danger, fontSize: 12 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Mono','Fira Mono',monospace",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#13151d",
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "36px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>B</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>Buena Onda</span>
        </div>
        <Suspense fallback={<div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>}>
          <LoginInner />
        </Suspense>
      </div>
    </div>
  );
}
