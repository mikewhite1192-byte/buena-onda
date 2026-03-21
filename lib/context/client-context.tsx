"use client";

// lib/context/client-context.tsx
import { createContext, useContext, useState, useCallback } from "react";

export interface ActiveClient {
  id: string;
  name: string;
  meta_ad_account_id: string;
  vertical: "leads" | "ecomm";
  cpl_target: number | null;
  roas_target: number | null;
  monthly_budget: number | null;
}

interface ClientContextValue {
  activeClient: ActiveClient | null;
  setActiveClient: (client: ActiveClient | null) => void;
  hasNoClients: boolean | null; // null = not yet loaded
  setHasNoClients: (v: boolean) => void;
}

const ClientContext = createContext<ClientContextValue>({
  activeClient: null,
  setActiveClient: () => {},
  hasNoClients: null,
  setHasNoClients: () => {},
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null);
  const [hasNoClients, setHasNoClients] = useState<boolean | null>(null);

  const setActiveClient = useCallback((client: ActiveClient | null) => {
    setActiveClientState(client);
    if (client) {
      sessionStorage.setItem("activeClientId", client.id);
      sessionStorage.setItem("activeClient", JSON.stringify(client));
    } else {
      sessionStorage.removeItem("activeClientId");
      sessionStorage.removeItem("activeClient");
    }
  }, []);

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClient, hasNoClients, setHasNoClients }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useActiveClient(): ClientContextValue {
  return useContext(ClientContext);
}
