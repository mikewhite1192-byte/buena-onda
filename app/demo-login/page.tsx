"use client";

import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
};


export default function DemoLoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "signing-in" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    autoSignIn();
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function autoSignIn() {
    setStatus("signing-in");
    try {
      // Get a short-lived sign-in token from the server
      const tokenRes = await fetch("/api/demo/token");
      if (!tokenRes.ok) throw new Error("Could not fetch demo token");
      const { token } = await tokenRes.json();

      // Use the ticket strategy — no password needed
      const result = await signIn!.create({ strategy: "ticket", ticket: token });

      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        await fetch("/api/demo/seed", { method: "POST" });
        router.push("/dashboard?demo=1");
      } else {
        setStatus("error");
        setError(`Sign-in incomplete (status: ${result.status}). Try again.`);
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      setError("Demo account unavailable. Please try again in a moment.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono','Fira Mono',monospace", color: T.text }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#f5a623,#f76b1c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff" }}>B</div>
        <span style={{ fontWeight: 800, fontSize: 18, color: T.text }}>Buena Onda</span>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px 48px", textAlign: "center", maxWidth: 400, width: "100%" }}>

        {status === "loading" || status === "signing-in" ? (
          <>
            {/* Animated spinner */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, margin: "0 auto 20px", animation: "spin 0.9s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                {status === "loading" ? "Preparing demo…" : "Loading your demo…"}
              </div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Signing into the demo account and seeding 15 sample clients.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Connecting demo account", done: status === "signing-in" },
                { label: "Loading 15 client accounts", done: false },
                { label: "Generating campaign data",  done: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: step.done ? T.accent : T.faint }}>
                    {step.done ? "✓" : "○"}
                  </span>
                  <span style={{ fontSize: 12, color: step.done ? T.text : T.faint }}>{step.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>Demo unavailable</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
            <button
              onClick={() => { setStatus("loading"); autoSignIn(); }}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}
            >
              Try again →
            </button>
            <Link href="/sign-up" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>
              Or start your free trial →
            </Link>
          </>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: T.faint, textAlign: "center" }}>
        This is a shared demo account with sample data.{" "}
        <Link href="/" style={{ color: T.accent, textDecoration: "none" }}>Back to site →</Link>
      </div>
    </div>
  );
}
