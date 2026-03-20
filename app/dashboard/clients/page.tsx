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

const VERTICAL_COLORS = { leads: "#2A8C8A", ecomm: "#8B6FE8" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClients();
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

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e8f4f4", fontFamily: "'DM Mono', monospace" }}>
            Clients
          </h1>
          <div style={{ fontSize: 12, color: "#4a7a7a", marginTop: 4 }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: "#2A8C8A",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'DM Mono', monospace",
            cursor: "pointer",
          }}
        >
          + Add Client
        </button>
      </div>

      {/* Error banner */}
      {error && !showForm && (
        <div style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div style={{ color: "#4a7a7a", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{
          border: "1px dashed #1a3535",
          borderRadius: 10,
          padding: "60px 0",
          textAlign: "center",
          color: "#4a7a7a",
          fontSize: 13,
        }}>
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clients.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#0d1818",
                border: "1px solid #1a2f2f",
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
                background: c.status === "active" ? (VERTICAL_COLORS[c.vertical] ?? "#2A8C8A") : "#2a4a4a",
              }} />

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e8f4f4" }}>{c.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: c.vertical === "leads" ? "#0f2f2f" : "#1a1030",
                    color: VERTICAL_COLORS[c.vertical] ?? "#2A8C8A",
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
                    color: c.status === "active" ? "#2A8C8A" : "#4a7a7a",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#4a7a7a", marginTop: 3 }}>
                  {c.meta_ad_account_id ? `Act: ${c.meta_ad_account_id}` : "No ad account"}
                  {c.meta_page_id ? ` · Page: ${c.meta_page_id}` : " · No page ID"}
                  {c.whatsapp_number ? ` · WA: ${c.whatsapp_number}` : ""}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => toggleStatus(c)}
                  style={{
                    background: "transparent",
                    border: "1px solid #1a3535",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    color: "#4a7a7a",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {c.status === "active" ? "Pause" : "Activate"}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  style={{
                    background: "transparent",
                    border: "1px solid #1a3535",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    color: "#4a7a7a",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Edit
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
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
            background: "#0d1818",
            border: "1px solid #1a2f2f",
            borderRadius: 12,
            padding: "28px 32px",
            width: 480,
            maxWidth: "90vw",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#e8f4f4", fontFamily: "'DM Mono', monospace" }}>
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

              <Field label="Meta Ad Account ID" hint="Found in Meta Business Suite → Ad Accounts">
                <input
                  value={form.meta_ad_account_id}
                  onChange={(e) => setForm({ ...form, meta_ad_account_id: e.target.value })}
                  placeholder="123456789"
                  style={inputStyle}
                />
              </Field>

              <Field label="Facebook Page ID" hint="Found on your Facebook Page → About (bottom of page)">
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
                  border: "1px solid #1a3535",
                  borderRadius: 7,
                  padding: "8px 18px",
                  fontSize: 13,
                  color: "#4a7a7a",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? "#1a4a4a" : "#2A8C8A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Client"}
              </button>
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
      <label style={{ display: "block", fontSize: 11, color: "#4a7a7a", marginBottom: 5, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#2a4a4a", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a1212",
  border: "1px solid #1a3535",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  color: "#e8f4f4",
  fontFamily: "'DM Mono', monospace",
  outline: "none",
  boxSizing: "border-box",
};
