"use client";

// app/dashboard/layout.tsx
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ClientProvider, useActiveClient } from "@/lib/context/client-context";
import { TourProvider } from "@/lib/context/tour-context";
import ChatBubble from "@/components/chat/ChatBubble";
import TourCard from "@/components/tour/TourCard";

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
  { label: "Reports", path: "/dashboard/reports" },
  { label: "Review", path: "/dashboard/review" },
  { label: "History", path: "/dashboard/history" },
];

function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveClient, setHasNoClients } = useActiveClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [localActive, setLocalActive] = useState<Client | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const switcherRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false);
        setClientSearch("");
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
      setHasNoClients(list.length === 0);
      const first = list.find((c) => c.status === "active") ?? list[0] ?? null;
      if (first) selectClient(first);
    } catch {
      // silent
    }
  }

  function selectClient(client: Client) {
    setLocalActive(client);
    setShowSwitcher(false);
    setClientSearch("");
    setActiveClient({
      id: client.id,
      name: client.name,
      meta_ad_account_id: client.meta_ad_account_id,
      vertical: client.vertical,
    });
    router.push("/dashboard/campaigns");
  }

  const vertColor = localActive ? (localActive.vertical === "leads" ? T.leads : T.ecomm) : T.muted;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>

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
            <ClientSwitcherDropdown
              clients={clients}
              localActive={localActive}
              clientSearch={clientSearch}
              setClientSearch={setClientSearch}
              searchRef={searchRef}
              selectClient={selectClient}
              onManage={() => { setShowSwitcher(false); setClientSearch(""); router.push("/dashboard/clients"); }}
              onAddClient={() => { setShowSwitcher(false); router.push("/dashboard/clients"); }}
              T={T}
            />
          )}
        </div>

        {/* Help button */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("buenaonda:open-chat"))}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginRight: 14,
            padding: "4px 6px",
            borderRadius: 6,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: T.muted, lineHeight: 1 }}>?</span>
          <span style={{ fontSize: 9, color: T.faint, letterSpacing: "0.3px" }}>Help</span>
        </button>

        {/* User button */}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Page content */}
      <main>{children}</main>

      <ChatBubble />
      <TourCard />
    </div>
  );
}

interface DropdownProps {
  clients: Client[];
  localActive: Client | null;
  clientSearch: string;
  setClientSearch: (v: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  selectClient: (c: Client) => void;
  onManage: () => void;
  onAddClient: () => void;
  T: Record<string, string>;
}

function ClientSwitcherDropdown({ clients, localActive, clientSearch, setClientSearch, searchRef, selectClient, onManage, onAddClient, T }: DropdownProps) {
  const filtered = clientSearch.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  if (clients.length === 0) {
    return (
      <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", padding: "16px", fontSize: 12, color: T.muted, textAlign: "center" }}>
        No clients yet.{" "}
        <span style={{ color: T.accent, cursor: "pointer" }} onClick={onAddClient}>Add one →</span>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      {/* Search */}
      <div style={{ padding: "8px 10px 6px" }}>
        <input
          ref={searchRef}
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          placeholder="Search clients…"
          autoFocus
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Client list */}
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "12px", fontSize: 12, color: T.muted, textAlign: "center" }}>No clients match</div>
        ) : filtered.map(client => {
          const vc = client.vertical === "leads" ? T.leads : T.ecomm;
          const isActive = localActive?.id === client.id;
          return (
            <div
              key={client.id}
              onClick={() => selectClient(client)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", background: isActive ? "rgba(245,166,35,0.08)" : "transparent", borderLeft: isActive ? `2px solid ${T.accent}` : "2px solid transparent" }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.status === "active" ? vc : T.faint, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{client.vertical}</div>
              </div>
              {isActive && <span style={{ color: T.accent, fontSize: 12 }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted, cursor: "pointer" }}
        onClick={onManage}
        onMouseEnter={e => e.currentTarget.style.color = T.text}
        onMouseLeave={e => e.currentTarget.style.color = T.muted}
      >
        Manage clients →
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <TourProvider>
        <DashboardNav>{children}</DashboardNav>
      </TourProvider>
    </ClientProvider>
  );
}
