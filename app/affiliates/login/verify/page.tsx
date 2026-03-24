"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (token) {
      window.location.href = `/api/affiliates/login/verify?token=${token}`;
    }
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ color: "#8b8fa8", fontSize: 14 }}>Logging you in…</div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyInner /></Suspense>;
}
