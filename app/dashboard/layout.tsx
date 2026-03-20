"use client";

// app/dashboard/layout.tsx
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ClientProvider, useActiveClient } from "@/lib/context/client-context";
import ChatBubble from "@/components/chat/ChatBubble";

const T = {
  bg: "#0d0f14",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  accentGlow: "rgba(245,166,35,0.2)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  leads: "#7b8cde",
  ecomm: "#c07ef0",
};

interface Client {
  id: string;
  name: string;
  meta_ad_account_id: string;
  vertical: "leads" | "ecomm";
  status: string;
}

const NAV_ITEMS = [
  { label: "Overview", path: "/dashboard" },
  { label: "Campaigns", path: "/dashboard/campaigns" },
  { label: "Clients", path: "/dashboard/clients" },
  { label: "Review", path: "/dashboard/review" },
  { label: "History", path: "/dashboard/history" },
];

function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveClient } = useActiveClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [localActive, setLocalActive] = useState<Client | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      const list = (data.clients ?? []) as Client[];
      setClients(list);
      const first = list.find((c) => c.status === "active") ?? list[0] ?? null;
      if (first) selectClient(first);
    } catch {
      // silent
    }
  }

  function selectClient(client: Client) {
    setLocalActive(client);
    setShowSwitcher(false);
    setActiveClient({
      id: client.id,
      name: client.name,
      meta_ad_account_id: client.meta_ad_account_id,
      vertical: client.vertical,
    });
  }

  const vertColor = localActive ? (localActive.vertical === "leads" ? T.leads : T.ecomm) : T.muted;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Top Nav */}
      <div style={{
        height: 52,
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 0,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg,#f5a623,#f76b1c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 12, color: "#fff",
            boxShadow: `0 3px 10px ${T.accentGlow}`,
          }}>B</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-0.3px" }}>Buena Onda</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.accent, background: T.accentBg, padding: "1px 6px", borderRadius: 3, letterSpacing: "0.5px" }}>AGENCY</span>
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ label, path }) => {
            const active = path === "/dashboard" ? pathname === "/dashboard" : pathname === path || pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                style={{
                  padding: "5px 13px",
                  fontSize: 12,
                  borderRadius: 6,
                  border: "none",
                  background: active ? T.accentBg : "transparent",
                  color: active ? T.accent : T.muted,
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Account Switcher */}
        <div ref={switcherRef} style={{ position: "relative", marginRight: 16 }}>
          <button
            onClick={() => setShowSwitcher((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: showSwitcher ? "rgba(255,255,255,0.05)" : "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              padding: "5px 11px",
              cursor: "pointer",
              color: T.text,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 500,
              minWidth: 160,
              transition: "background 0.15s",
            }}
          >
            {localActive ? (
              <>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: vertColor, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {localActive.name}
                </span>
              </>
            ) : (
              <span style={{ color: T.muted }}>Select account</span>
            )}
            <span style={{ color: T.faint, fontSize: 9, marginLeft: "auto" }}>▾</span>
          </button>

          {showSwitcher && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 200,
              background: "#13151d",
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 240,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              {clients.length === 0 ? (
                <div style={{ padding: "16px", fontSize: 12, color: T.muted, textAlign: "center" }}>
                  No clients yet.{" "}
                  <span
                    style={{ color: T.accent, cursor: "pointer" }}
                    onClick={() => { setShowSwitcher(false); router.push("/dashboard/clients"); }}
                  >
                    Add one →
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ padding: "8px 12px 4px", fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Your Clients
                  </div>
                  {clients.map((client) => {
                    const vc = client.vertical === "leads" ? T.leads : T.ecomm;
                    return (
                      <div
                        key={client.id}
                        onClick={() => selectClient(client)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          cursor: "pointer",
                          background: localActive?.id === client.id ? "rgba(245,166,35,0.08)" : "transparent",
                          borderLeft: localActive?.id === client.id ? `2px solid ${T.accent}` : "2px solid transparent",
                          transition: "background 0.1s",
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.status === "active" ? vc : T.faint, flexShrink: 0 }} />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {client.name}
                          </div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                            {client.vertical}
                          </div>
                        </div>
                        {localActive?.id === client.id && (
                          <span style={{ color: T.accent, fontSize: 12 }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                  <div
                    style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted, cursor: "pointer" }}
                    onClick={() => { setShowSwitcher(false); router.push("/dashboard/clients"); }}
                  >
                    Manage clients →
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* User button */}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Page content */}
      <main>{children}</main>

      <ChatBubble />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <DashboardNav>{children}</DashboardNav>
    </ClientProvider>
  );
}
