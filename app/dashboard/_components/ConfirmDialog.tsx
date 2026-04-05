"use client";

import { useEffect, useRef } from "react";

const T = {
  bg: "#0d0f14",
  surface: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  danger: "#ff4d4d",
  dangerBg: "rgba(255,77,77,0.12)",
};

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const confirmBg =
    variant === "danger"
      ? "linear-gradient(135deg, #ff4d4d, #e03131)"
      : variant === "warning"
      ? "linear-gradient(135deg, #f5a623, #f76b1c)"
      : "linear-gradient(135deg, #f5a623, #f76b1c)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "28px 32px",
          width: 440,
          maxWidth: "90vw",
          outline: "none",
        }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: T.text }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: confirmBg,
              color: variant === "danger" ? "#fff" : T.bg,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
