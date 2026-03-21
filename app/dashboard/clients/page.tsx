"use client";

// app/dashboard/clients/page.tsx
import { useEffect, useState } from "react";

interface Client {
  id: string;
  name: string;
  meta_ad_account_id: string;
  meta_page_id: string;
  vertical: "leads" | "ecomm";
  status: string;
  whatsapp_number: string;
  notes: string;
  created_at: string;
  meta_connected: boolean;
  meta_token_expires_at: string | null;
}

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
}

function getTokenStatus(c: Client): "connected" | "expiring" | "disconnected" {
  if (!c.meta_connected) return "disconnected";
  if (c.meta_token_expires_at) {
    const exp = new Date(c.meta_token_expires_at);
    const daysLeft = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 10) return "expiring";
  }
  return "connected";
}

const EMPTY_FORM = {
  name: "",
  meta_ad_account_id: "",
  meta_page_id: "",
  vertical: "leads" as "leads" | "ecomm",
  whatsapp_number: "",
  notes: "",
  status: "active",
};

const VERTICAL_COLORS = { leads: "#f5a623", ecomm: "#8B6FE8" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Account picker for multiple ad accounts discovered via OAuth
  const [accountPickerClientId, setAccountPickerClientId] = useState<string | null>(null);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<AdAccount[]>([]);
  const [pickingAccount, setPickingAccount] = useState(false);

  // Client rules / memory panel
  const [rulesClientId, setRulesClientId] = useState<string | null>(null);
  const [rulesClientName, setRulesClientName] = useState("");
  const [rules, setRules] = useState<{ id: string; rule_text: string; category: string; created_at: string }[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("general");
  const [savingRule, setSavingRule] = useState(false);

  useEffect(() => {
    loadClients();
    // Handle OAuth callback params
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const accounts = params.get("accounts");
    const oauthError = params.get("error");
    window.history.replaceState({}, "", window.location.pathname);
    if (connected && accounts) {
      try {
        const decoded = JSON.parse(Buffer.from(accounts, "base64").toString()) as AdAccount[];
        setAccountPickerClientId(connected);
        setDiscoveredAccounts(decoded);
        setSuccessMsg("Facebook connected! Select which ad account to use.");
      } catch {
        setSuccessMsg("Facebook account connected successfully.");
      }
    } else if (connected) {
      setSuccessMsg("Facebook account connected and ad account auto-detected.");
    } else if (oauthError) {
      setError(`Facebook connection failed: ${oauthError}`);
    }
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name ?? "",
      meta_ad_account_id: c.meta_ad_account_id ?? "",
      meta_page_id: c.meta_page_id ?? "",
      vertical: c.vertical ?? "leads",
      whatsapp_number: c.whatsapp_number ?? "",
      notes: c.notes ?? "",
      status: c.status ?? "active",
    });
    setEditingId(c.id);
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    const raw = form.meta_ad_account_id.trim();
    const normalized = raw && !raw.startsWith("act_") ? `act_${raw}` : raw;
    const payload = { ...form, meta_ad_account_id: normalized };
    setSaving(true);
    setError("");
    try {
      const res = editingId
        ? await fetch(`/api/clients/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Save failed");
        return;
      }
      setShowForm(false);
      await loadClients();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      await loadClients();
    } catch {
      setError("Delete failed");
    }
  }

  async function loadDemo() {
    setLoadingDemo(true);
    try {
      await fetch("/api/demo/seed", { method: "POST" });
      await loadClients();
      setSuccessMsg("Demo account loaded — explore with sample data.");
    } catch {
      setError("Failed to load demo");
    } finally {
      setLoadingDemo(false);
    }
  }

  async function selectAdAccount(accountId: string) {
    if (!accountPickerClientId) return;
    setPickingAccount(true);
    try {
      await fetch(`/api/clients/${accountPickerClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta_ad_account_id: accountId }),
      });
      setAccountPickerClientId(null);
      setDiscoveredAccounts([]);
      setSuccessMsg("Ad account saved successfully.");
      await loadClients();
    } catch {
      setError("Failed to save ad account");
    } finally {
      setPickingAccount(false);
    }
  }

  async function toggleStatus(c: Client) {
    const next = c.status === "active" ? "paused" : "active";
    try {
      await fetch(`/api/clients/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await loadClients();
    } catch {
      setError("Update failed");
    }
  }

  async function openRules(c: Client) {
    setRulesClientId(c.id);
    setRulesClientName(c.name);
    setRulesLoading(true);
    setRules([]);
    setNewRule("");
    try {
      const res = await fetch(`/api/clients/${c.id}/rules`);
      const data = await res.json();
      setRules(data.rules ?? []);
    } finally {
      setRulesLoading(false);
    }
  }

  async function saveRule() {
    if (!newRule.trim() || !rulesClientId) return;
    setSavingRule(true);
    try {
      const res = await fetch(`/api/clients/${rulesClientId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_text: newRule.trim(), category: newRuleCategory, source: "manual" }),
      });
      const data = await res.json();
      if (data.rule) setRules(r => [data.rule, ...r]);
      setNewRule("");
    } finally {
      setSavingRule(false);
    }
  }

  async function deleteRule(ruleId: string) {
    if (!rulesClientId) return;
    await fetch(`/api/clients/${rulesClientId}/rules/${ruleId}`, { method: "DELETE" });
    setRules(r => r.filter(x => x.id !== ruleId));
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e8eaf0", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
            Clients
          </h1>
          <div style={{ fontSize: 12, color: "#8b8fa8", marginTop: 4 }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={loadDemo}
            disabled={loadingDemo}
            style={{
              background: "transparent",
              border: "1px solid #2a3a2a",
              borderRadius: 7,
              padding: "8px 14px",
              fontSize: 12,
              color: "#4ade80",
              cursor: loadingDemo ? "not-allowed" : "pointer",
              fontFamily: "'DM Mono', 'Fira Mono', monospace",
            }}
          >
            {loadingDemo ? "Loading..." : "🎯 Demo"}
          </button>
          <button
            onClick={openAdd}
            style={{
              background: "#f5a623",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Mono', 'Fira Mono', monospace",
              cursor: "pointer",
            }}
          >
            + Add Client
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{ background: "#0a2a1a", border: "1px solid #1a5a2a", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 13, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* Error banner */}
      {error && !showForm && (
        <div style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div style={{ color: "#8b8fa8", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{
          border: "1px dashed #1a3535",
          borderRadius: 10,
          padding: "60px 0",
          textAlign: "center",
          color: "#8b8fa8",
          fontSize: 13,
        }}>
          No clients yet. Add your first client to get started.
          <div style={{ marginTop: 20 }}>
            <button
              onClick={loadDemo}
              disabled={loadingDemo}
              style={{
                background: "transparent",
                border: "1px solid #2a3a2a",
                borderRadius: 7,
                padding: "7px 16px",
                fontSize: 12,
                color: "#4ade80",
                cursor: loadingDemo ? "not-allowed" : "pointer",
                fontFamily: "'DM Mono', 'Fira Mono', monospace",
              }}
            >
              {loadingDemo ? "Loading..." : "🎯 Try with demo data"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clients.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#161820",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Vertical dot */}
              <span style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: c.status === "active" ? (VERTICAL_COLORS[c.vertical] ?? "#f5a623") : "#5a5e72",
              }} />

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0" }}>{c.name}</span>
                  {c.meta_ad_account_id === "act_demo" && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#0a2a0a", color: "#4ade80", fontWeight: 700, letterSpacing: "0.06em" }}>
                      DEMO
                    </span>
                  )}
                  <span style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: c.vertical === "leads" ? "#0f2f2f" : "#1a1030",
                    color: VERTICAL_COLORS[c.vertical] ?? "#f5a623",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {c.vertical}
                  </span>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: c.status === "active" ? "#0f2f2f" : "#1a2020",
                    color: c.status === "active" ? "#f5a623" : "#8b8fa8",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#8b8fa8", marginTop: 3 }}>
                  {c.meta_ad_account_id ? `Act: ${c.meta_ad_account_id}` : "No ad account"}
                  {c.meta_page_id ? ` · Page: ${c.meta_page_id}` : " · No page ID"}
                  {c.whatsapp_number ? ` · WA: ${c.whatsapp_number}` : ""}
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  {(() => {
                    const status = getTokenStatus(c);
                    const badge = status === "connected"
                      ? { bg: "#0f2f1a", color: "#4ade80", text: "FB Connected" }
                      : status === "expiring"
                      ? { bg: "#2a2000", color: "#facc15", text: "Token expiring" }
                      : { bg: "#1a1a1a", color: "#8b8fa8", text: "FB Not connected" };
                    return (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: badge.bg, color: badge.color, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                        {badge.text}
                      </span>
                    );
                  })()}
                  {getTokenStatus(c) !== "connected" && (
                    <a
                      href={`/api/auth/facebook?clientId=${c.id}`}
                      style={{ fontSize: 10, color: "#f5a623", textDecoration: "none", fontWeight: 600 }}
                    >
                      Connect Facebook →
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => toggleStatus(c)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    color: "#8b8fa8",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', 'Fira Mono', monospace",
                  }}
                >
                  {c.status === "active" ? "Pause" : "Activate"}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "#8b8fa8", cursor: "pointer", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => openRules(c)}
                  style={{ background: "transparent", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "#f5a623", cursor: "pointer", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}
                >
                  Memory
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid #2a1a1a",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    color: "#7a3a3a",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', 'Fira Mono', monospace",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Picker Modal */}
      {accountPickerClientId && discoveredAccounts.length > 0 && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setAccountPickerClientId(null); setDiscoveredAccounts([]); } }}
        >
          <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "28px 32px", width: 480, maxWidth: "90vw" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#e8eaf0", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
              Select Ad Account
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#8b8fa8", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
              Multiple active ad accounts found. Choose which one to use for this client.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {discoveredAccounts.map((acct) => (
                <button
                  key={acct.id}
                  onClick={() => selectAdAccount(acct.id)}
                  disabled={pickingAccount}
                  style={{
                    background: "#0d0f14",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "12px 16px",
                    cursor: pickingAccount ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontFamily: "'DM Mono', 'Fira Mono', monospace",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#f5a623")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>{acct.name}</div>
                  <div style={{ fontSize: 11, color: "#8b8fa8", marginTop: 2 }}>{acct.id}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setAccountPickerClientId(null); setDiscoveredAccounts([]); }}
              style={{ marginTop: 16, background: "transparent", border: "none", color: "#8b8fa8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            background: "#161820",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "28px 32px",
            width: 480,
            maxWidth: "90vw",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#e8eaf0", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
              {editingId ? "Edit Client" : "Add Client"}
            </h2>

            {error && (
              <div style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Client Name *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Acme Roofing"
                  style={inputStyle}
                />
              </Field>

              <Field label="Meta Ad Account ID" hint="Optional — auto-discovered when you connect Facebook. Or find it in Meta Business Suite → Ad Accounts">
                <input
                  value={form.meta_ad_account_id}
                  onChange={(e) => setForm({ ...form, meta_ad_account_id: e.target.value })}
                  placeholder="123456789"
                  style={inputStyle}
                />
              </Field>

              <Field label="Facebook Page ID" hint="Optional — auto-discovered when you connect Facebook. Or find it on your Facebook Page → About">
                <input
                  value={form.meta_page_id}
                  onChange={(e) => setForm({ ...form, meta_page_id: e.target.value })}
                  placeholder="123456789012345"
                  style={inputStyle}
                />
              </Field>

              <Field label="Vertical">
                <select
                  value={form.vertical}
                  onChange={(e) => setForm({ ...form, vertical: e.target.value as "leads" | "ecomm" })}
                  style={inputStyle}
                >
                  <option value="leads">Leads</option>
                  <option value="ecomm">E-commerce</option>
                </select>
              </Field>

              <Field label="WhatsApp Number">
                <input
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="+1 555 000 0000"
                  style={inputStyle}
                />
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>

              {editingId && (
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 7,
                  padding: "8px 18px",
                  fontSize: 13,
                  color: "#8b8fa8",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', 'Fira Mono', monospace",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? "#1a4a4a" : "#f5a623",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'DM Mono', 'Fira Mono', monospace",
                }}
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules / Memory Panel */}
      {rulesClientId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setRulesClientId(null); }}
        >
          <div style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "28px 32px", width: 520, maxWidth: "92vw", maxHeight: "80vh", display: "flex", flexDirection: "column", fontFamily: "'DM Mono', 'Fira Mono', monospace" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f5a623" }}>Client Memory</h2>
                <div style={{ fontSize: 11, color: "#8b8fa8", marginTop: 3 }}>{rulesClientName} · rules the AI always follows</div>
              </div>
              <button onClick={() => setRulesClientId(null)} style={{ background: "transparent", border: "none", color: "#8b8fa8", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            {/* Add rule */}
            <div style={{ display: "flex", gap: 8, marginTop: 18, marginBottom: 16 }}>
              <select
                value={newRuleCategory}
                onChange={e => setNewRuleCategory(e.target.value)}
                style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 10px", fontSize: 11, color: "#8b8fa8", fontFamily: "inherit", flexShrink: 0 }}
              >
                <option value="general">General</option>
                <option value="budget">Budget</option>
                <option value="targeting">Targeting</option>
                <option value="creative">Creative</option>
                <option value="strategy">Strategy</option>
                <option value="schedule">Schedule</option>
              </select>
              <input
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveRule(); }}
                placeholder="e.g. Never scale above $300/day"
                style={{ flex: 1, background: "#0d0f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 12px", fontSize: 12, color: "#e8eaf0", fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={saveRule}
                disabled={savingRule || !newRule.trim()}
                style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 6, padding: "7px 14px", fontSize: 12, color: "#f5a623", cursor: savingRule ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, opacity: savingRule || !newRule.trim() ? 0.5 : 1 }}
              >
                {savingRule ? "…" : "+ Add"}
              </button>
            </div>

            {/* Rules list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {rulesLoading ? (
                <div style={{ fontSize: 12, color: "#8b8fa8", padding: "20px 0", textAlign: "center" }}>Loading…</div>
              ) : rules.length === 0 ? (
                <div style={{ border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 8, padding: "32px 0", textAlign: "center", color: "#5a5e72", fontSize: 12 }}>
                  No rules yet. Tell the AI rules in the chat and they&apos;ll appear here automatically, or add one above.
                </div>
              ) : rules.map(rule => {
                const catColor: Record<string, string> = { budget: "#f5a623", targeting: "#7b8cde", creative: "#c07ef0", strategy: "#2ecc71", schedule: "#e8b84b", general: "#8b8fa8" };
                return (
                  <div key={rule.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 4, background: (catColor[rule.category] ?? "#8b8fa8") + "20", color: catColor[rule.category] ?? "#8b8fa8", flexShrink: 0, marginTop: 2 }}>
                      {rule.category}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, color: "#e8eaf0", lineHeight: 1.5 }}>{rule.rule_text}</span>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      style={{ background: "transparent", border: "none", color: "#5a5e72", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}
                      title="Remove rule"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#8b8fa8", marginBottom: 5, fontFamily: "'DM Mono', 'Fira Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#5a5e72", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a1212",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  color: "#e8eaf0",
  fontFamily: "'DM Mono', 'Fira Mono', monospace",
  outline: "none",
  boxSizing: "border-box",
};
