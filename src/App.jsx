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

function guessColumnMapping(headers) {
  const lower = headers.map((h) => (h || "").toString().toLowerCase().trim());
  const mapping = { company: null, role: null, status: null, date: null };
  const patterns = {
    company: ["company", "company name", "employer", "organization", "org", "firm"],
    role: ["role", "position", "title", "job title", "job role", "job", "designation"],
    status: ["status", "stage", "state", "progress", "application status"],
    date: ["date", "applied", "date applied", "applied on", "application date", "applied date", "submission date"],
  };
  for (const [field, keywords] of Object.entries(patterns)) {
    for (let i = 0; i < lower.length; i++) {
      if (keywords.includes(lower[i]) || keywords.some((k) => lower[i].includes(k))) {
        mapping[field] = i;
        break;
      }
    }
  }
  return mapping;
}

function normalizeStatus(val) {
  if (!val) return "Applied";
  const v = val.toString().toLowerCase().trim();
  if (v.includes("offer")) return "Offer";
  if (v.includes("reject") || v.includes("denied") || v.includes("declined")) return "Rejected";
  if (v.includes("interview") || v.includes("screen") || v.includes("call")) return "Interview";
  if (v.includes("review") || v.includes("pending") || v.includes("processing")) return "In Review";
  if (v.includes("withdraw") || v.includes("pulled") || v.includes("cancel")) return "Withdrawn";
  if (v.includes("applied") || v.includes("submitted")) return "Applied";
  const exact = STATUSES.find((s) => s.toLowerCase() === v);
  if (exact) return exact;
  return "Applied";
}

function normalizeDate(val) {
  if (!val) return todayStr();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (typeof val === "number" && val > 30000 && val < 60000) {
    const d = new Date((val - 25569) * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return todayStr();
}

function ImportModal({ onClose, onImport }) {
  const [step, setStep] = useState("upload");
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ company: null, role: null, status: null, date: null });
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const processFile = async (file) => {
    setError("");
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      setError("Please upload an .xlsx, .xls, or .csv file");
      return;
    }
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (json.length < 2) {
        setError("File seems empty or has no data rows.");
        return;
      }
      const hdrs = json[0].map((h) => (h || "").toString());
      const rows = json.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
      setHeaders(hdrs);
      setRawData(rows);
      setMapping(guessColumnMapping(hdrs));
      setStep("mapping");
    } catch (e) {
      console.error(e);
      setError("Failed to read file. Make sure it's a valid Excel or CSV file.");
    }
  };

  const handleFile = (e) => { const file = e.target.files?.[0]; if (file) processFile(file); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };

  const goToPreview = () => {
    if (mapping.company === null) { setError("Please map at least the Company column"); return; }
    setError("");
    const parsed = rawData
      .map((row) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        company: (row[mapping.company] || "").toString().trim(),
        role: mapping.role !== null ? (row[mapping.role] || "").toString().trim() : "Not specified",
        status: mapping.status !== null ? normalizeStatus(row[mapping.status]) : "Applied",
        date: mapping.date !== null ? normalizeDate(row[mapping.date]) : todayStr(),
      }))
      .filter((a) => a.company.length > 0);
    setPreview(parsed);
    setStep("preview");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, animation: "fadeIn .2s ease" }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.15)", animation: "slideUp .25s ease" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e", fontFamily: "'Space Mono', monospace" }}>
            {step === "upload" && "📂 Import from Excel"}
            {step === "mapping" && "🔗 Map your columns"}
            {step === "preview" && `👀 Preview (${preview.length} rows)`}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF", lineHeight: 1 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "#FDE8E8", color: "#EF4444", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>
        )}

        {step === "upload" && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#5B8DEF" : "#d1d5db"}`, borderRadius: 14, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#E8F0FE" : "#fafafa", transition: "all .2s" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#374151" }}>Drop your Excel or CSV file here</p>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9CA3AF" }}>or click to browse — supports .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
            </div>
            <div style={{ marginTop: 20, padding: 16, background: "#f9fafb", borderRadius: 12, fontSize: 13, color: "#6B7280" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#374151" }}>💡 Tips for best results:</p>
              <p style={{ margin: "0 0 4px" }}>• First row should have column headers (Company, Role, Status, Date)</p>
              <p style={{ margin: "0 0 4px" }}>• We auto-detect columns — you can adjust the mapping</p>
              <p style={{ margin: 0 }}>• Status values like "Interviewed", "Rejected", "Pending" are matched automatically</p>
            </div>
          </>
        )}

        {step === "mapping" && (
          <>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px" }}>
              Found <strong>{headers.length} columns</strong> and <strong>{rawData.length} rows</strong>. Map your columns below.
            </p>
            {["company", "role", "status", "date"].map((field) => (
              <div key={field} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ width: 90, fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "capitalize", flexShrink: 0 }}>
                  {field} {field === "company" && "*"}
                </span>
                <span style={{ color: "#d1d5db" }}>→</span>
                <select
                  value={mapping[field] === null ? "__none__" : mapping[field]}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value === "__none__" ? null : parseInt(e.target.value) })}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: mapping[field] !== null ? "#E8F0FE" : "#fff", color: mapping[field] !== null ? "#5B8DEF" : "#374151", fontWeight: mapping[field] !== null ? 600 : 400 }}
                >
                  <option value="__none__">— Skip —</option>
                  {headers.map((h, i) => (<option key={i} value={i}>{h || `Column ${i + 1}`}</option>))}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setStep("upload")} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#6B7280" }}>Back</button>
              <button onClick={goToPreview} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: "#5B8DEF", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Preview Import</button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <div style={{ maxHeight: 340, overflowY: "auto", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", position: "sticky", top: 0 }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Company</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Role</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((app, i) => {
                    const cfg = STATUS_CONFIG[app.status];
                    return (
                      <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1a1a2e" }}>{app.company}</td>
                        <td style={{ padding: "8px 12px", color: "#6B7280" }}>{app.role}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.icon} {app.status}</span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#6B7280" }}>{formatDate(app.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStep("mapping")} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#6B7280" }}>Back</button>
              <button onClick={() => onImport(preview)} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#10B981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(16,185,129,.35)" }}>
                ✅ Import {preview.length} application{preview.length !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [apps, setApps] = useState(() => loadApps());
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("date-desc");
  const [form, setForm] = useState({ company: "", role: "", status: "Applied", date: todayStr() });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importToast, setImportToast] = useState(null);
  const formRef = useRef(null);

  useEffect(() => { saveApps(apps); }, [apps]);
  useEffect(() => { if (importToast) { const t = setTimeout(() => setImportToast(null), 3000); return () => clearTimeout(t); } }, [importToast]);

  const resetForm = () => { setForm({ company: "", role: "", status: "Applied", date: todayStr() }); setEditId(null); setShowForm(false); };

  const handleSubmit = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    if (editId) { setApps((prev) => prev.map((a) => (a.id === editId ? { ...a, ...form } : a))); }
    else { setApps((prev) => [{ ...form, id: Date.now().toString() }, ...prev]); }
    resetForm();
  };

  const startEdit = (app) => {
    setForm({ company: app.company, role: app.role, status: app.status, date: app.date });
    setEditId(app.id); setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const deleteApp = (id) => { setApps((prev) => prev.filter((a) => a.id !== id)); setDeleteConfirm(null); };
  const handleImport = (imported) => { setApps((prev) => [...imported, ...prev]); setShowImport(false); setImportToast(imported.length); };

  const filtered = apps
    .filter((a) => filter === "All" || a.status === filter)
    .sort((a, b) => {
      if (sort === "date-desc") return b.date.localeCompare(a.date);
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "company") return a.company.localeCompare(b.company);
      return 0;
    });

  const counts = STATUSES.reduce((acc, s) => { acc[s] = apps.filter((a) => a.status === s).length; return acc; }, {});

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: "24px 16px", maxWidth: 720, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />

      {importToast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 2000, boxShadow: "0 4px 20px rgba(16,185,129,.4)", animation: "toastIn .3s ease", fontFamily: "'DM Sans', sans-serif" }}>
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
          ✅ Imported {importToast} application{importToast !== 1 ? "s" : ""} successfully!
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700, color: "#1a1a2e", margin: 0, letterSpacing: "-0.5px" }}>Job Tracker</h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: "4px 0 0", fontWeight: 400 }}>{apps.length} application{apps.length !== 1 ? "s" : ""} tracked</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setFilter("All")} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", background: filter === "All" ? "#1a1a2e" : "#f3f4f6", color: filter === "All" ? "#fff" : "#374151", transition: "all .15s" }}>All ({apps.length})</button>
        {STATUSES.map((s) => counts[s] > 0 ? (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", background: filter === s ? STATUS_CONFIG[s].color : STATUS_CONFIG[s].bg, color: filter === s ? "#fff" : STATUS_CONFIG[s].color, transition: "all .15s" }}>{STATUS_CONFIG[s].icon} {s} ({counts[s]})</button>
        ) : null)}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#374151", background: "#fff", cursor: "pointer" }}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="company">A → Z</option>
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", cursor: "pointer", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >📊 Import Excel</button>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: "#5B8DEF", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px rgba(91,141,239,.35)", transition: "transform .1s" }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >+ Add Application</button>
        </div>
      </div>

      {showForm && (
        <div ref={formRef} style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,.06)", animation: "formSlide .2s ease" }}>
          <style>{`@keyframes formSlide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: "#1a1a2e" }}>{editId ? "Edit Application" : "New Application"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Company *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Scalable Capital"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", transition: "border-color .15s" }}
                onFocus={(e) => (e.target.style.borderColor = "#5B8DEF")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Role *</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Data Engineer"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", transition: "border-color .15s" }}
                onFocus={(e) => (e.target.style.borderColor = "#5B8DEF")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", background: "#fff", cursor: "pointer" }}>
                {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_CONFIG[s].icon} {s}</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 4 }}>Date Applied</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={resetForm} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#6B7280" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!form.company.trim() || !form.role.trim()} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: !form.company.trim() || !form.role.trim() ? "#ccc" : "#5B8DEF", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{editId ? "Save Changes" : "Add"}</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#9CA3AF", borderRadius: 14, border: "2px dashed #e5e7eb", marginTop: 8 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{apps.length === 0 ? "No applications yet — add one or import from Excel!" : "No applications match this filter."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            return (
              <div key={app.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "box-shadow .15s, border-color .15s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#eee"; }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.company}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", letterSpacing: "0.3px" }}>{cfg.icon} {app.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{app.role} · {formatDate(app.date)}</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                  <button onClick={() => startEdit(app)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>✏️</button>
                  {deleteConfirm === app.id ? (
                    <button onClick={() => deleteApp(app.id)} title="Confirm delete" style={{ height: 32, borderRadius: 8, border: "none", padding: "0 10px", background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Confirm</button>
                  ) : (
                    <button onClick={() => setDeleteConfirm(app.id)} onBlur={() => setTimeout(() => setDeleteConfirm(null), 200)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fde8e8")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>🗑️</button>
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