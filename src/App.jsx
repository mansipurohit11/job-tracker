import { useState, useEffect, useRef } from "react";

const STATUS_CONFIG = {
  Applied: { color: "#5B8DEF", bg: "#E8F0FE", icon: "📤" },
  "In Review": { color: "#E6A817", bg: "#FEF7E0", icon: "👀" },
  Interview: { color: "#8B5CF6", bg: "#F0EBFE", icon: "🎤" },
  Offer: { color: "#10B981", bg: "#DEFAEC", icon: "🎉" },
  Rejected: { color: "#EF4444", bg: "#FDE8E8", icon: "✕" },
  Withdrawn: { color: "#6B7280", bg: "#F0F0F0", icon: "↩" },
};

const STATUSES = Object.keys(STATUS_CONFIG);

const STORAGE_KEY = "job-applications-v1";

function loadApps() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveApps(apps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error("Save failed:", e);
  }
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-DE", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function App() {
  const [apps, setApps] = useState(() => loadApps());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("date-desc");
  const [form, setForm] = useState({ company: "", role: "", status: "Applied", date: todayStr() });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const formRef = useRef(null);

  // Save whenever apps change
  useEffect(() => {
    saveApps(apps);
  }, [apps]);

  const resetForm = () => {
    setForm({ company: "", role: "", status: "Applied", date: todayStr() });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    if (editId) {
      setApps((prev) => prev.map((a) => (a.id === editId ? { ...a, ...form } : a)));
    } else {
      setApps((prev) => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    resetForm();
  };

  const startEdit = (app) => {
    setForm({ company: app.company, role: app.role, status: app.status, date: app.date });
    setEditId(app.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const deleteApp = (id) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = apps
    .filter((a) => filter === "All" || a.status === filter)
    .sort((a, b) => {
      if (sort === "date-desc") return b.date.localeCompare(a.date);
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "company") return a.company.localeCompare(b.company);
      return 0;
    });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: "24px 16px", maxWidth: 720, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700, color: "#1a1a2e", margin: 0, letterSpacing: "-0.5px" }}>
          Job Tracker
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: "4px 0 0", fontWeight: 400 }}>
          {apps.length} application{apps.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      {/* Status pills summary */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setFilter("All")}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: filter === "All" ? "#1a1a2e" : "#f3f4f6",
            color: filter === "All" ? "#fff" : "#374151",
            transition: "all .15s",
          }}
        >
          All ({apps.length})
        </button>
        {STATUSES.map((s) =>
          counts[s] > 0 ? (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: filter === s ? STATUS_CONFIG[s].color : STATUS_CONFIG[s].bg,
                color: filter === s ? "#fff" : STATUS_CONFIG[s].color,
                transition: "all .15s",
              }}
            >
              {STATUS_CONFIG[s].icon} {s} ({counts[s]})
            </button>
          ) : null
        )}
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", color: "#374151", background: "#fff", cursor: "pointer",
          }}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="company">A → Z</option>
        </select>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "#5B8DEF", color: "#fff", fontSize: 14, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 2px 8px rgba(91,141,239,.35)",
            transition: "transform .1s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          + Add Application
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div
          ref={formRef}
          style={{
            background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16,
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 4px 16px rgba(0,0,0,.06)",
            animation: "slideDown .2s ease",
          }}
        >
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: "#1a1a2e" }}>
            {editId ? "Edit Application" : "New Application"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Company *</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Scalable Capital"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  outline: "none", transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#5B8DEF")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Role *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Data Engineer"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  outline: "none", transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#5B8DEF")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  background: "#fff", cursor: "pointer",
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].icon} {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Date Applied</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button
              onClick={resetForm}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#6B7280",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.company.trim() || !form.role.trim()}
              style={{
                padding: "8px 22px", borderRadius: 8, border: "none",
                background: !form.company.trim() || !form.role.trim() ? "#ccc" : "#5B8DEF",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {editId ? "Save Changes" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", color: "#9CA3AF", borderRadius: 14,
          border: "2px dashed #e5e7eb", marginTop: 8,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
            {apps.length === 0 ? "No applications yet — add your first one!" : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            return (
              <div
                key={app.id}
                style={{
                  background: "#fff", borderRadius: 12, padding: "14px 18px",
                  border: "1.5px solid #eee",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "box-shadow .15s, border-color .15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#eee"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {app.company}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", letterSpacing: "0.3px",
                      }}
                    >
                      {cfg.icon} {app.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>
                    {app.role} · {formatDate(app.date)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                  <button
                    onClick={() => startEdit(app)}
                    title="Edit"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb",
                      background: "#fff", cursor: "pointer", fontSize: 14, display: "flex",
                      alignItems: "center", justifyContent: "center", transition: "background .1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    ✏️
                  </button>
                  {deleteConfirm === app.id ? (
                    <button
                      onClick={() => deleteApp(app.id)}
                      title="Confirm delete"
                      style={{
                        height: 32, borderRadius: 8, border: "none", padding: "0 10px",
                        background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 11,
                        fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(app.id)}
                      onBlur={() => setTimeout(() => setDeleteConfirm(null), 200)}
                      title="Delete"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb",
                        background: "#fff", cursor: "pointer", fontSize: 14, display: "flex",
                        alignItems: "center", justifyContent: "center", transition: "background .1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fde8e8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}