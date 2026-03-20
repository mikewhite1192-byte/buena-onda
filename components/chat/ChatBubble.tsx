"use client";

// components/chat/ChatBubble.tsx
import { useState, useRef, useEffect } from "react";
import { useActiveClient } from "@/lib/context/client-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function renderMarkdown(text: string): React.ReactNode[] {
  // Split into lines, then render each with inline bold + em-dash
  return text.split("\n").map((line, i, arr) => {
    // Replace **bold** with <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} style={{ color: "#e8f4f4", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      // Replace -- with em dash
      return <span key={j}>{part.replace(/--/g, "—")}</span>;
    });
    return (
      <span key={i}>
        {parts}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

const SUGGESTED_PROMPTS = [
  "Which ad sets should I scale right now?",
  "Pause my worst performing ad set",
  "What's my best performing campaign?",
  "How can I lower my CPL?",
  "Create a campaign for [industry] targeting [avatar] in the US with $50/day",
  "Analyze my campaign performance",
];

interface PendingCreative {
  imageHash: string;
  fileName: string;
  previewUrl: string;
}

export default function ChatBubble() {
  const { activeClient } = useActiveClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [pendingCreative, setPendingCreative] = useState<PendingCreative | null>(null);
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: activeClient
          ? `Hey — I'm your Buena Onda AI. I have live access to ${activeClient.name}'s campaign data. Ask me anything about performance, decisions, or strategy.`
          : "Hey — I'm your Buena Onda AI. Select a client account to get campaign-specific insights, or ask me anything about Meta ads strategy.",
        timestamp: new Date(),
      }]);
    }
  }, [open, activeClient, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Compress image client-side to stay under Vercel's 4.5MB body limit
  function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg", quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = objectUrl;
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCreative(true);
    const previewUrl = URL.createObjectURL(file);
    try {
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      const form = new FormData();
      form.append("file", compressedFile);
      if (activeClient?.meta_ad_account_id) form.append("ad_account_id", activeClient.meta_ad_account_id);
      const res = await fetch("/api/agent/creative/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.image_hash) {
        setPendingCreative({ imageHash: data.image_hash, fileName: file.name, previewUrl });
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Creative upload failed: ${data.error ?? "unknown error"}`, timestamp: new Date() }]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Creative upload failed: ${msg}`, timestamp: new Date() }]);
    } finally {
      setUploadingCreative(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function sendMessage(content: string) {
    if ((!content.trim() && !pendingCreative) || loading || uploadingCreative) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const allMessages = [...messages, userMsg].filter(m => m.id !== "welcome");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            clientId: activeClient?.id ?? null,
            adAccountId: activeClient?.meta_ad_account_id ?? null,
            imageHash: pendingCreative?.imageHash ?? null,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const data = await res.json();
      const reply = data.reply ?? "Something went wrong.";

      // Clear creative once campaign is successfully created
      if (reply.includes("Campaign created") || reply.includes("Campaign ID:")) {
        setPendingCreative(null);
      }

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I hit an error. Try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          width: 380,
          height: 560,
          background: "#0d1818",
          border: "1px solid #1a2f2f",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          fontFamily: "'DM Mono', 'Fira Mono', monospace",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #1a2f2f",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0a0f0f",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #2A8C8A, #0B5C5C)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#e8f4f4",
              }}>
                BO
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e8f4f4" }}>Buena Onda AI</div>
                <div style={{ fontSize: 10, color: "#2A8C8A" }}>
                  {activeClient ? `● ${activeClient.name}` : "● Select a client"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setMessages([]); setShowSuggestions(true); }}
                title="Clear chat"
                style={{ background: "transparent", border: "none", color: "#4a7a7a", cursor: "pointer", fontSize: 14 }}
              >
                ↺
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "#4a7a7a", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user" ? "#0B5C5C" : "#0f1f1f",
                  border: msg.role === "user" ? "1px solid #2A8C8A33" : "1px solid #1a2f2f",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: msg.role === "user" ? "#e8f4f4" : "#8ab8b8",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "12px 12px 12px 2px",
                  background: "#0f1f1f",
                  border: "1px solid #1a2f2f",
                  fontSize: 12,
                  color: "#4a7a7a",
                }}>
                  Thinking...
                </div>
              </div>
            )}

            {/* Suggested prompts */}
            {showSuggestions && messages.length <= 1 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Try asking
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      style={{
                        background: "transparent",
                        border: "1px solid #1a3535",
                        borderRadius: 8,
                        padding: "7px 12px",
                        color: "#4a7a7a",
                        fontSize: 11,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        fontFamily: "'DM Mono', monospace",
                        transition: "all 0.15s",
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1a2f2f", background: "#0a0f0f" }}>
            {/* Creative preview */}
            {(pendingCreative || uploadingCreative) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", background: "#0d1818", border: "1px solid #1a3535", borderRadius: 8 }}>
                {uploadingCreative ? (
                  <span style={{ fontSize: 11, color: "#4a7a7a" }}>Uploading creative to Meta...</span>
                ) : pendingCreative && (
                  <>
                    <img src={pendingCreative.previewUrl} alt="creative" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 10, color: "#2A8C8A", fontWeight: 600 }}>Creative ready</div>
                      <div style={{ fontSize: 10, color: "#4a7a7a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingCreative.fileName}</div>
                    </div>
                    <button onClick={() => setPendingCreative(null)} style={{ background: "transparent", border: "none", color: "#4a7a7a", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCreative || loading}
                title="Upload ad creative image"
                style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: pendingCreative ? "#0B3C3C" : "transparent",
                  border: pendingCreative ? "1px solid #2A8C8A" : "1px solid #1a3535",
                  color: pendingCreative ? "#2A8C8A" : "#4a7a7a",
                  cursor: uploadingCreative || loading ? "not-allowed" : "pointer",
                  fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {uploadingCreative ? "…" : "📎"}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingCreative ? "Now describe the campaign..." : "Ask anything or create a campaign..."}
                rows={1}
                style={{
                  flex: 1, background: "#0d1818", border: "1px solid #1a2f2f",
                  borderRadius: 8, color: "#e8f4f4", fontSize: 12,
                  fontFamily: "'DM Mono', monospace", padding: "8px 12px",
                  outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 80,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: input.trim() && !loading ? "#0B5C5C" : "#0f1f1f",
                  border: "1px solid #2A8C8A44",
                  color: input.trim() && !loading ? "#e8f4f4" : "#2a4a4a",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#2a4a4a", marginTop: 6, textAlign: "center" as const }}>
              Enter to send · Shift+Enter for new line · 📎 upload creative
            </div>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open ? "#0B5C5C" : "linear-gradient(135deg, #2A8C8A, #0B5C5C)",
          border: "2px solid #2A8C8A44",
          cursor: "pointer",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(42, 140, 138, 0.4)",
          transition: "all 0.2s",
          fontSize: open ? 20 : 22,
          color: "#e8f4f4",
        }}
        title="Open Buena Onda AI"
      >
        {open ? "✕" : "✦"}
      </button>
    </>
  );
}
