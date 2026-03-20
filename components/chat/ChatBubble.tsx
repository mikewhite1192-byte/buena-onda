"use client";

// components/chat/ChatBubble.tsx
import { useState, useRef, useEffect } from "react";
import { useActiveClient } from "@/lib/context/client-context";
import { useTour } from "@/lib/context/tour-context";

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
        return <strong key={j} style={{ color: "#e8eaf0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
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

const ONBOARDING_PROMPTS = [
  "Give me the full tour",
  "How does the AI campaign builder work?",
  "How does campaign diagnostics work?",
  "Tell me about the reporting features",
  "I'm ready to set up my first client",
];

const HELP_PROMPTS = [
  "How do I connect a Facebook account?",
  "My ad got disapproved — what do I do?",
  "Why is my CPL so high?",
  "My campaigns aren't spending — help me diagnose",
  "How do I find my Meta Ad Account ID?",
  "What does frequency mean and when is it a problem?",
  "How do I create a campaign?",
  "My data isn't showing up in the dashboard",
];

interface PendingCreative {
  imageHash: string;
  fileName: string;
  previewUrl: string;
}

export default function ChatBubble() {
  const { activeClient, hasNoClients } = useActiveClient();
  const { tourActive, step, startTour } = useTour();
  const [open, setOpen] = useState(false);
  const [helpMode, setHelpMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [pendingCreative, setPendingCreative] = useState<PendingCreative | null>(null);
  const [uploadingCreative, setUploadingCreative] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenedRef = useRef(false);
  const hasSentStep3Ref = useRef(false);
  const hasSentStep4Ref = useRef(false);

  const isOnboarding = hasNoClients === true && !tourActive;

  // Auto-open for new users (onboarding modal)
  useEffect(() => {
    if (isOnboarding && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isOnboarding]);

  // Open chat when Help button is clicked from the nav
  useEffect(() => {
    function handler() {
      setHelpMode(true);
      setMessages([]);
      setShowSuggestions(true);
      setOpen(true);
    }
    document.addEventListener("buenaonda:open-chat", handler);
    return () => document.removeEventListener("buenaonda:open-chat", handler);
  }, []);

  // Tour step 3 — open chat and auto-send optimization question
  useEffect(() => {
    if (step === 3 && !hasSentStep3Ref.current) {
      hasSentStep3Ref.current = true;
      setOpen(true);
      setMessages([]);
      const t = setTimeout(() => {
        sendMessage("How do you decide which ad sets to scale and which to pause? Walk me through your thinking.");
      }, 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Tour step 4 — auto-send campaign creation demo
  useEffect(() => {
    if (step === 4 && !hasSentStep4Ref.current) {
      hasSentStep4Ref.current = true;
      const t = setTimeout(() => {
        sendMessage("Walk me through building a campaign for a final expense insurance company targeting seniors 65+ in Texas with $50/day. Describe each step — don't create it yet.");
      }, 400);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: isOnboarding
          ? "Hey, welcome to Buena Onda! 👋\n\nBefore we get you set up, let me show you what this thing can actually do — because it's a lot.\n\nI can build full Meta campaigns from a conversation, diagnose why your CPL is rising, pause or scale anything instantly, generate client reports on demand, and flag issues across all your accounts the moment you log in.\n\nWant the full tour, or are you ready to jump straight into setup?"
          : activeClient
            ? `Hey — I'm your Buena Onda AI. I have live access to ${activeClient.name}'s campaign data. Ask me anything about performance, decisions, or strategy.`
            : "Hey — I'm your Buena Onda AI. Select a client account to get campaign-specific insights, or ask me anything about Meta ads strategy.",
        timestamp: new Date(),
      }]);
    }
  }, [open, activeClient, isOnboarding, messages.length]);

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
      if (activeClient?.id) form.append("client_id", activeClient.id);
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
    const streamingId = (Date.now() + 1).toString();

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
            isOnboarding,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!res.body) throw new Error("No response body");

      // Add placeholder message immediately
      setMessages(prev => [...prev, { id: streamingId, role: "assistant", content: "", timestamp: new Date() }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accum = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accum += parsed.text;
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: accum } : m));
            }
            if (parsed.error) {
              accum = `Error: ${parsed.error}`;
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: accum } : m));
            }
          } catch { /* incomplete JSON chunk */ }
        }
      }

      const reply = accum || "Something went wrong.";
      if (!accum) {
        setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: reply } : m));
      }

      // Clear creative once campaign is successfully created
      if (reply.includes("Campaign created") || reply.includes("Campaign ID:")) {
        setPendingCreative(null);
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamingId ? { ...m, content: "Sorry, I hit an error. Try again." } : m
      ));
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
      {open && isOnboarding && (
        <div
          onClick={() => {}}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      )}
      {open && (
        <div data-chat-open="true" style={{
          position: "fixed",
          ...(isOnboarding ? {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            height: 620,
          } : {
            bottom: 88,
            right: 24,
            width: 380,
            height: 560,
          }),
          background: "#161820",
          border: "1px solid rgba(255,255,255,0.06)",
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
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0d0f14",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #f5a623, #f76b1c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#e8eaf0",
              }}>
                BO
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0" }}>Buena Onda AI</div>
                <div style={{ fontSize: 10, color: "#f5a623" }}>
                  {activeClient ? `● ${activeClient.name}` : "● Select a client"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setMessages([]); setShowSuggestions(true); }}
                title="Clear chat"
                style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 14 }}
              >
                ↺
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 18 }}
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
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user" ? "rgba(245,166,35,0.15)" : "#13151d",
                  border: msg.role === "user" ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: msg.role === "user" ? "#e8eaf0" : "#8b8fa8",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
                {/* Take the Tour button — only on welcome message during onboarding */}
                {msg.id === "welcome" && hasNoClients && !tourActive && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, width: "100%" }}>
                    <button
                      onClick={() => { startTour(); setOpen(false); }}
                      style={{
                        width: "100%", padding: "13px 0", borderRadius: 10,
                        border: "1px solid rgba(245,166,35,0.5)",
                        background: "rgba(245,166,35,0.15)", color: "#f5a623",
                        fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      Take the Tour →
                    </button>
                    <button
                      onClick={() => setShowSuggestions(true)}
                      style={{
                        width: "100%", padding: "11px 0", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "transparent", color: "#8b8fa8",
                        fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Skip, set up now
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "12px 12px 12px 2px",
                  background: "#13151d",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                  color: "#8b8fa8",
                }}>
                  Thinking...
                </div>
              </div>
            )}

            {/* Suggested prompts */}
            {showSuggestions && messages.length <= 1 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#5a5e72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {isOnboarding ? "Getting started" : helpMode ? "Common help topics" : "Try asking"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(isOnboarding ? ONBOARDING_PROMPTS : helpMode ? HELP_PROMPTS : SUGGESTED_PROMPTS).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: "7px 12px",
                        color: "#8b8fa8",
                        fontSize: 11,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        fontFamily: "'DM Mono', 'Fira Mono', monospace",
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
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0d0f14" }}>
            {/* Creative preview */}
            {(pendingCreative || uploadingCreative) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                {uploadingCreative ? (
                  <span style={{ fontSize: 11, color: "#8b8fa8" }}>Uploading creative to Meta...</span>
                ) : pendingCreative && (
                  <>
                    <img src={pendingCreative.previewUrl} alt="creative" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 600 }}>Creative ready</div>
                      <div style={{ fontSize: 10, color: "#8b8fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingCreative.fileName}</div>
                    </div>
                    <button onClick={() => setPendingCreative(null)} style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
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
                  background: pendingCreative ? "rgba(245,166,35,0.1)" : "transparent",
                  border: pendingCreative ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.06)",
                  color: pendingCreative ? "#f5a623" : "#8b8fa8",
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
                placeholder={pendingCreative ? "Describe the campaign..." : "Ask anything..."}
                rows={1}
                style={{
                  flex: 1, background: "#161820", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, color: "#e8eaf0", fontSize: 12,
                  fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "8px 12px",
                  outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 80,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: input.trim() && !loading ? "rgba(245,166,35,0.15)" : "#13151d",
                  border: "1px solid rgba(245,166,35,0.27)",
                  color: input.trim() && !loading ? "#e8eaf0" : "#5a5e72",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#5a5e72", marginTop: 6, textAlign: "center" as const }}>
              Enter to send · Shift+Enter for new line · 📎 upload creative
            </div>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => { setOpen((v) => { if (v) setHelpMode(false); return !v; }); }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open ? "#c4831a" : "linear-gradient(135deg, #f5a623, #f76b1c)",
          border: "2px solid rgba(245,166,35,0.3)",
          cursor: "pointer",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(245,166,35,0.35)",
          transition: "all 0.2s",
          fontSize: open ? 20 : 22,
          color: "#e8eaf0",
        }}
        title="Open Buena Onda AI"
      >
        {open ? "✕" : "✦"}
      </button>
    </>
  );
}
