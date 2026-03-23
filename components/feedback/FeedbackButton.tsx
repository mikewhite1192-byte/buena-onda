"use client";

import { useState } from "react";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  surfaceAlt: "#1e2130",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
};

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setSent(true);
      setMessage("");
      setTimeout(() => { setOpen(false); setSent(false); }, 2000);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px",
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.muted,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent + "60"; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
      >
        💡 What do you want to see?
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 440, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", fontFamily: "inherit" }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🙌</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Got it, thanks!</div>
                <div style={{ fontSize: 13, color: T.muted }}>We read every single one.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>What do you want to see? 💡</div>
                    <div style={{ fontSize: 12, color: T.muted }}>Feature ideas, improvements, anything. We read every one.</div>
                  </div>
                  <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: T.faint, fontSize: 18, cursor: "pointer", padding: "0 0 0 12px", lineHeight: 1 }}>✕</button>
                </div>

                <textarea
                  autoFocus
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
                  placeholder="I wish I could... / It would be great if... / Can you add..."
                  rows={5}
                  style={{ width: "100%", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  <span style={{ fontSize: 11, color: T.faint }}>⌘ + Enter to send</span>
                  <button
                    onClick={submit}
                    disabled={!message.trim() || sending}
                    style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: !message.trim() || sending ? "rgba(245,166,35,0.3)" : "linear-gradient(135deg,#f5a623,#f76b1c)", color: "#0d0f14", fontSize: 13, fontWeight: 800, cursor: !message.trim() || sending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    {sending ? "Sending…" : "Send feedback →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
