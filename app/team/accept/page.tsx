"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, SignIn } from "@clerk/nextjs";

const T = {
  bg: "#0d0f14",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
};

function AcceptInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  const [status, setStatus] = useState<"idle" | "accepting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!token) {
      setStatus("error");
      setErrorMsg("No invite token found.");
      return;
    }
    if (!isSignedIn) return; // show sign-in UI below

    // Auto-accept once signed in
    if (status === "idle") {
      setStatus("accepting");
      fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setStatus("done");
            setTimeout(() => router.push("/dashboard"), 1500);
          } else {
            setStatus("error");
            setErrorMsg(d.error ?? "Could not accept invite.");
          }
        })
        .catch(() => {
          setStatus("error");
          setErrorMsg("Something went wrong. Please try again.");
        });
    }
  }, [isLoaded, isSignedIn, token, status, router]);

  if (!isLoaded) {
    return (
      <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ width: "100%" }}>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24, textAlign: "center" }}>
          Sign in or create an account to accept this invitation.
        </p>
        <SignIn
          routing="hash"
          afterSignInUrl={`/team/accept?token=${token}`}
          afterSignUpUrl={`/team/accept?token=${token}`}
          appearance={{
            variables: { colorBackground: "#13151d", colorText: "#e8eaf0", colorPrimary: "#f5a623" },
          }}
        />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: T.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Invite Error</div>
        <div style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>{errorMsg}</div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: T.accent, borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          Go to dashboard →
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <div style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>You&apos;re in!</div>
        <div style={{ color: T.muted, fontSize: 14 }}>Redirecting to dashboard…</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: T.muted, fontSize: 14 }}>Accepting invitation…</div>
    </div>
  );
}

export default function AcceptPage() {
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
        maxWidth: 460,
        background: "#13151d",
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>B</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Buena Onda</span>
        </div>

        <Suspense fallback={<div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>}>
          <AcceptInner />
        </Suspense>
      </div>
    </div>
  );
}
