"use client";

import { useEffect, useState, useRef } from "react";
import { useActiveClient } from "@/lib/context/client-context";
import { isDemoAccount, getDemoCreatives } from "@/lib/demo-data";

const T = {
  bg: "#0d0f14",
  card: "#161820",
  border: "rgba(255,255,255,0.06)",
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.12)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
};

type CreativeStatus = "live" | "testing" | "fatigued" | "killed";
type CreativeFormat = "image" | "video" | "carousel" | "story" | "reel";

interface Creative {
  id: string;
  client_id: string;
  name: string;
  format: CreativeFormat;
  status: CreativeStatus;
  hook: string | null;
  spend: number | null;
  cpl: number | null;
  roas: number | null;
  ctr: number | null;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<CreativeStatus, { label: string; color: string; bg: string }> = {
  live:     { label: "Live",     color: "#2ecc71", bg: "rgba(46,204,113,0.12)" },
  testing:  { label: "Testing",  color: "#f5a623", bg: "rgba(245,166,35,0.12)" },
  fatigued: { label: "Fatigued", color: "#e8b84b", bg: "rgba(232,184,75,0.12)" },
  killed:   { label: "Killed",   color: "#8b8fa8", bg: "rgba(139,143,168,0.12)" },
};

const FORMAT_CONFIG: Record<CreativeFormat, { label: string; color: string }> = {
  image:    { label: "Image",    color: "#7b8cde" },
  video:    { label: "Video",    color: "#c07ef0" },
  carousel: { label: "Carousel", color: "#5bc8af" },
  story:    { label: "Story",    color: "#f08080" },
  reel:     { label: "Reel",     color: "#f5a623" },
};

const ALL_STATUSES: CreativeStatus[] = ["live", "testing", "fatigued", "killed"];
const ALL_FORMATS: CreativeFormat[] = ["image", "video", "carousel", "story", "reel"];

const EMPTY_FORM = {
  name: "", format: "image" as CreativeFormat, status: "testing" as CreativeStatus,
  hook: "", spend: "", cpl: "", roas: "", ctr: "", notes: "",
};

function fmt$(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtRoas(n: number | null) { return n ? `${n.toFixed(2)}x` : "—"; }
function fmtCtr(n: number | null) { return n ? `${(n * 100).toFixed(2)}%` : "—"; }

export default function CreativesPage() {
  const { activeClient } = useActiveClient();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CreativeStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editCreative, setEditCreative] = useState<Creative | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"performance" | "spend" | "newest">("performance");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeClient?.id) fetchCreatives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id]);

  async function fetchCreatives() {
    if (!activeClient?.id) return;
    if (isDemoAccount(activeClient.meta_ad_account_id)) {
      setCreatives(getDemoCreatives(activeClient.vertical) as Creative[]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${activeClient.id}/creatives`);
      const data = await res.json();
      setCreatives(data.creatives ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditCreative(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: Creative) {
    setEditCreative(c);
    setForm({
      name: c.name,
      format: c.format,
      status: c.status,
      hook: c.hook ?? "",
      spend: c.spend != null ? String(c.spend) : "",
      cpl: c.cpl != null ? String(c.cpl) : "",
      roas: c.roas != null ? String(c.roas) : "",
      ctr: c.ctr != null ? String(Number(c.ctr) * 100) : "",
      notes: c.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!activeClient?.id || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        format: form.format,
        status: form.status,
        hook: form.hook.trim() || null,
        spend: form.spend ? parseFloat(form.spend) : null,
        cpl: form.cpl ? parseFloat(form.cpl) : null,
        roas: form.roas ? parseFloat(form.roas) : null,
        ctr: form.ctr ? parseFloat(form.ctr) / 100 : null,
        notes: form.notes.trim() || null,
      };

      if (editCreative) {
        await fetch(`/api/clients/${activeClient.id}/creatives/${editCreative.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/clients/${activeClient.id}/creatives`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchCreatives();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!activeClient?.id) return;
    setDeleting(id);
    try {
      await fetch(`/api/clients/${activeClient.id}/creatives/${id}`, { method: "DELETE" });
      setCreatives(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const isEcomm = activeClient?.vertical === "ecomm";

  // Determine top producers — top 3 by performance metric (must have result data)
  const withPerf = creatives
    .filter(c => isEcomm ? c.roas != null : c.cpl != null)
    .sort((a, b) => isEcomm
      ? (b.roas ?? 0) - (a.roas ?? 0)   // higher ROAS = better
      : (a.cpl ?? 0) - (b.cpl ?? 0)     // lower CPL = better
    );
  const topProducerIds = new Set(withPerf.slice(0, 3).map(c => c.id));

  function sortCreatives(list: Creative[]) {
    if (sortBy === "performance") {
      return [...list].sort((a, b) => {
        // top producers always first, then by metric
        const aTop = topProducerIds.has(a.id) ? 0 : 1;
        const bTop = topProducerIds.has(b.id) ? 0 : 1;
        if (aTop !== bTop) return aTop - bTop;
        return isEcomm
          ? (b.roas ?? -1) - (a.roas ?? -1)
          : (a.cpl ?? 99999) - (b.cpl ?? 99999);
      });
    }
    if (sortBy === "spend") return [...list].sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const filtered = sortCreatives(
    creatives
      .filter(c => statusFilter === "all" || c.status === statusFilter)
      .filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || (c.hook ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const counts: Record<string, number> = { all: creatives.length };
  ALL_STATUSES.forEach(s => { counts[s] = creatives.filter(c => c.status === s).length; });

  if (!activeClient) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>No client selected</div>
          <div style={{ fontSize: 13 }}>Select a client from the top nav to view their creatives.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text, padding: "32px 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Creative Library
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.3px" }}>
              {activeClient.name}
            </h1>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
              {creatives.length} creative{creatives.length !== 1 ? "s" : ""} tracked
            </div>
          </div>
          <button
            onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: T.accent, border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            + Add Creative
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {/* Status tabs */}
          <div style={{ display: "flex", gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4 }}>
            {(["all", ...ALL_STATUSES] as const).map(s => {
              const active = statusFilter === s;
              const cfg = s === "all" ? null : STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 12px", borderRadius: 5, border: "none", fontSize: 11, fontWeight: active ? 600 : 400,
                    background: active ? (cfg ? cfg.bg : T.accentBg) : "transparent",
                    color: active ? (cfg ? cfg.color : T.accent) : T.muted,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s].label}
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>{counts[s] ?? 0}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creatives…"
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, color: T.text, fontFamily: "inherit", outline: "none", width: 200 }}
          />

          {/* Sort */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.faint }}>Sort:</span>
            <div style={{ display: "flex", gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4 }}>
              {([
                { value: "performance", label: isEcomm ? "Best ROAS" : "Best CPL" },
                { value: "spend",       label: "Most Spend" },
                { value: "newest",      label: "Newest" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  style={{
                    padding: "5px 11px", borderRadius: 5, border: "none", fontSize: 11,
                    fontWeight: sortBy === opt.value ? 600 : 400,
                    background: sortBy === opt.value ? T.accentBg : "transparent",
                    color: sortBy === opt.value ? T.accent : T.muted,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🎨</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              {creatives.length === 0 ? "No creatives yet" : "No creatives match this filter"}
            </div>
            <div style={{ fontSize: 13 }}>
              {creatives.length === 0
                ? "Add your first creative to start tracking what's working."
                : "Try a different status or search term."}
            </div>
            {creatives.length === 0 && (
              <button
                onClick={openAdd}
                style={{ marginTop: 20, padding: "9px 20px", background: T.accentBg, border: `1px solid ${T.accent}`, borderRadius: 8, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                + Add Creative
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {filtered.map(c => (
              <CreativeCard
                key={c.id}
                creative={c}
                isEcomm={activeClient.vertical === "ecomm"}
                isTopProducer={topProducerIds.has(c.id)}
                onEdit={() => openEdit(c)}
                onDelete={() => handleDelete(c.id)}
                isDeleting={deleting === c.id}
              />
            ))}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            ref={modalRef}
            style={{ background: "#13151d", border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Modal header */}
            <div style={{ padding: "22px 28px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{editCreative ? "Edit Creative" : "Add Creative"}</div>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            </div>

            {/* Scrollable form */}
            <div style={{ overflowY: "auto", flex: 1, padding: "0 28px" }}>
              <FormField label="Creative Name *">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Summer Sale — Red Hoodie Video"
                  style={inputStyle}
                  autoFocus
                />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FormField label="Format">
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as CreativeFormat }))} style={inputStyle}>
                    {ALL_FORMATS.map(fmt => <option key={fmt} value={fmt}>{FORMAT_CONFIG[fmt].label}</option>)}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CreativeStatus }))} style={inputStyle}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Hook / Headline">
                <input
                  value={form.hook}
                  onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}
                  placeholder="e.g. Stop wasting money on ads that don't convert"
                  style={inputStyle}
                />
              </FormField>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Results</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField label="Spend ($)">
                    <input type="number" value={form.spend} onChange={e => setForm(f => ({ ...f, spend: e.target.value }))} placeholder="0.00" style={inputStyle} />
                  </FormField>
                  <FormField label="CTR (%)">
                    <input type="number" value={form.ctr} onChange={e => setForm(f => ({ ...f, ctr: e.target.value }))} placeholder="e.g. 2.4" style={inputStyle} />
                  </FormField>
                  <FormField label={activeClient.vertical === "ecomm" ? "ROAS" : "CPL ($)"}>
                    {activeClient.vertical === "ecomm"
                      ? <input type="number" value={form.roas} onChange={e => setForm(f => ({ ...f, roas: e.target.value }))} placeholder="e.g. 3.2" style={inputStyle} />
                      : <input type="number" value={form.cpl} onChange={e => setForm(f => ({ ...f, cpl: e.target.value }))} placeholder="0.00" style={inputStyle} />
                    }
                  </FormField>
                </div>
              </div>

              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Audience, learnings, what to test next…"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                />
              </FormField>

              <div style={{ height: 20 }} />
            </div>

            {/* Modal footer */}
            <div style={{ padding: "16px 28px 22px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{ padding: "9px 24px", background: form.name.trim() ? T.accent : "rgba(245,166,35,0.3)", border: "none", borderRadius: 8, color: "#0d0f14", fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}
              >
                {saving ? "Saving…" : editCreative ? "Save Changes" : "Add Creative"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 7, padding: "9px 12px", fontSize: 13, color: T.text, fontFamily: "'DM Mono', monospace",
  outline: "none", boxSizing: "border-box",
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function CreativeCard({ creative: c, isEcomm, isTopProducer, onEdit, onDelete, isDeleting }: {
  creative: Creative;
  isEcomm: boolean;
  isTopProducer: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const statusCfg = STATUS_CONFIG[c.status];
  const formatCfg = FORMAT_CONFIG[c.format];
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      background: T.card,
      border: isTopProducer ? "1px solid rgba(245,166,35,0.35)" : `1px solid ${T.border}`,
      borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12,
      boxShadow: isTopProducer ? "0 0 16px rgba(245,166,35,0.07)" : "none",
    }}>

      {/* Top row: name + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
            {isTopProducer && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(245,166,35,0.15)", color: T.accent, letterSpacing: "0.06em", flexShrink: 0, textTransform: "uppercase" }}>
                ★ Top Producer
              </span>
            )}
          </div>
          {c.hook && <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.hook}</div>}
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `rgba(${hexToRgb(formatCfg.color)},0.12)`, color: formatCfg.color }}>
            {formatCfg.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Metric label="Spend" value={fmt$(c.spend)} />
        {isEcomm
          ? <Metric label="ROAS" value={fmtRoas(c.roas)} highlight={c.roas != null && c.roas >= 2} />
          : <Metric label="CPL" value={fmt$(c.cpl)} />
        }
        <Metric label="CTR" value={fmtCtr(c.ctr)} />
      </div>

      {/* Notes */}
      {c.notes && (
        <div style={{ fontSize: 11, color: T.muted, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.6 }}>
          {c.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: -2 }}>
        {confirmDelete ? (
          <>
            <span style={{ fontSize: 11, color: T.muted, alignSelf: "center" }}>Delete?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            >No</button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(); }}
              disabled={isDeleting}
              style={{ padding: "5px 12px", background: "rgba(255,77,77,0.12)", border: "1px solid rgba(255,77,77,0.3)", borderRadius: 6, color: "#ff4d4d", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            >{isDeleting ? "…" : "Yes, delete"}</button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}
            >Edit</button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.faint, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ff4d4d"}
              onMouseLeave={e => e.currentTarget.style.color = T.faint}
            >Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: highlight ? "#2ecc71" : T.text }}>{value}</div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
