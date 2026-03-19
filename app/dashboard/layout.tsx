"use client";

// app/dashboard/layout.tsx
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface Client {
  id: string;
  name: string;
  meta_ad_account_id: string;
  vertical: "leads" | "ecomm";
  status: string;
}

const VERTICAL_COLORS = { leads: "#2A8C8A", ecomm: "#8B6FE8" };

const NAV_ITEMS = [
  { label: "Campaigns", path: "/dashboard/campaigns" },
  { label: "Review", path: "/dashboard/review" },
  { label: "History", path: "/dashboard/history" },
  { label: "Clients", path: "/dashboard/clients" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
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
      // Auto-select first active client
      const first = list.find((c) => c.status === "active") ?? list[0] ?? null;
      setActiveClient(first);
    } catch {
      // silent
    }
  }

  function selectClient(client: Client) {
    setActiveClient(client);
    setShowSwitcher(false);
    // Store in sessionStorage so other pages can read it
    sessionStorage.setItem("activeClientId", client.id);
    sessionStorage.setItem("activeClient", JSON.stringify(client));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0f", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>

      {/* Top Nav */}
      <div style={{
        height: 52,
        background: "#0d1818",
        borderBottom: "1px solid #1a2f2f",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 0,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>

        {/* Account Switcher */}
        <div ref={switcherRef} style={{ position: "relative", marginRight: 24 }}>
          <button
            onClick={() => setShowSwitcher((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: showSwitcher ? "#0f2020" : "transparent",
              border: "1px solid #1a3535",
              borderRadius: 7,
              padding: "6px 12px",
              cursor: "pointer",
              color: "#e8f4f4",
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              fontWeight: 600,
              minWidth: 180,
              transition: "background 0.15s",
            }}
          >
            {activeClient ? (
              <>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: VERTICAL_COLORS[activeClient.vertical] ?? "#2A8C8A",
                  flexShrink: 0,
                }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {activeClient.name}
                </span>
              </>
            ) : (
              <span style={{ color: "#4a7a7a" }}>Select account</span>
            )}
            <span style={{ color: "#4a7a7a", fontSize: 10, marginLeft: "auto" }}>▾</span>
          </button>

          {showSwitcher && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 200,
              background: "#0d1818",
              border: "1px solid #1a2f2f",
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 240,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              {clients.length === 0 ? (
                <div style={{ padding: "16px", fontSize: 12, color: "#4a7a7a", textAlign: "center" }}>
                  No clients yet.{" "}
                  <span
                    style={{ color: "#2A8C8A", cursor: "pointer" }}
                    onClick={() => { setShowSwitcher(false); router.push("/dashboard/clients"); }}
                  >
                    Add one →
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ padding: "8px 12px 4px", fontSize: 10, color: "#2a4a4a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Your Clients
                  </div>
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => selectClient(client)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: activeClient?.id === client.id ? "#0f2020" : "transparent",
                        borderLeft: activeClient?.id === client.id ? "2px solid #2A8C8A" : "2px solid transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: client.status === "active" ? (VERTICAL_COLORS[client.vertical] ?? "#2A8C8A") : "#2a4a4a",
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 13, color: "#e8f4f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#4a7a7a", marginTop: 1 }}>
                          {client.meta_ad_account_id} · {client.vertical}
                        </div>
                      </div>
                      {activeClient?.id === client.id && (
                        <span style={{ color: "#2A8C8A", fontSize: 12 }}>✓</span>
                      )}
                    </div>
                  ))}
                  <div
                    style={{ padding: "10px 12px", borderTop: "1px solid #1a2f2f", fontSize: 12, color: "#4a7a7a", cursor: "pointer" }}
                    onClick={() => { setShowSwitcher(false); router.push("/dashboard/clients"); }}
                  >
                    Manage clients →
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ display: "flex", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(({ label, path }) => {
            const active = pathname === path || pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  borderRadius: 6,
                  border: "none",
                  background: active ? "#0B5C5C" : "transparent",
                  color: active ? "#e8f4f4" : "#4a7a7a",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Buena Onda wordmark */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2A8C8A", letterSpacing: "-0.3px", marginRight: 16 }}>
          buena onda
        </div>

        {/* User button */}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
