import { useState, useMemo } from "react"
import { Search, Download, Trash2, RefreshCw, Clock, FileText, Activity } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getAuditLogs, clearAuditLogs, type AuditLogEntry, type AuditCategory } from "@/lib/auditLog"

const F    = "'Inter', system-ui, sans-serif"
const DARK = "#111827"

const PAGE_SIZE = 25

const CATEGORY_STYLE: Record<AuditCategory, { bg: string; color: string; label: string }> = {
  APPLICATION: { bg: "#eff6ff", color: "#1d4ed8", label: "Application" },
  PROFILE:     { bg: "#f0fdf4", color: "#15803d", label: "Profile"      },
  PAYMENT:     { bg: "#fefce8", color: "#a16207", label: "Payment"      },
  AUDIT:       { bg: "#fdf4ff", color: "#7e22ce", label: "Audit"        },
  CERTIFICATE: { bg: "#fff7ed", color: "#c2410c", label: "Certificate"  },
  SYSTEM:      { bg: "#f8fafc", color: "#475569", label: "System"       },
}

const ROLE_DOT: Record<string, string> = {
  "Customer":  "#0ea5e9",
  "HCB Office": "#7c3aed",
  "System":    "#94a3b8",
}

const ACTION_COLOR: Record<string, string> = {
  "Application Submitted":    "#16a34a",
  "Application Approved":     "#2563eb",
  "Application Rejected":     "#dc2626",
  "Application Resubmitted":  "#0ea5e9",
  "Draft Saved":              "#94a3b8",
  "Profile Change Requested": "#f59e0b",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function exportCsv(logs: AuditLogEntry[]) {
  const header = ["ID", "Timestamp", "Application ID", "Application #", "Company", "Actor", "Role", "Action", "Category", "Old Status", "New Status", "Details"]
  const rows = logs.map(l => [
    l.id, l.timestamp, l.applicationId, l.applicationNumber,
    l.companyName, l.actor, l.role, l.action, l.category,
    l.oldStatus ?? "", l.newStatus ?? "", l.details ?? "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
  const csv = [header.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `audit_trail_${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function AuditTrailPage() {
  const [logs,     setLogs]     = useState<AuditLogEntry[]>(() => getAuditLogs())
  const [search,   setSearch]   = useState("")
  const [category, setCategory] = useState<AuditCategory | "ALL">("ALL")
  const [role,     setRole]     = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")
  const [page,     setPage]     = useState(0)

  const refresh = () => { setLogs(getAuditLogs()); setPage(0) }

  const handleClear = () => {
    if (!window.confirm("Clear all audit log entries? This cannot be undone.")) return
    clearAuditLogs()
    setLogs([])
    setPage(0)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      if (category !== "ALL" && l.category !== category) return false
      if (role !== "ALL" && l.role !== role) return false
      if (dateFrom && l.timestamp < dateFrom) return false
      if (dateTo   && l.timestamp > dateTo + "T23:59:59") return false
      if (q && !l.applicationNumber.toLowerCase().includes(q) &&
               !l.companyName.toLowerCase().includes(q) &&
               !l.actor.toLowerCase().includes(q) &&
               !l.action.toLowerCase().includes(q) &&
               !(l.details ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [logs, search, category, role, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCount = logs.filter(l => l.timestamp.startsWith(todayStr)).length

  const STATS = [
    { label: "Total Entries",  value: logs.length,  icon: <Activity size={16} color="#fff" />, bg: "#1e3a8a" },
    { label: "Today",          value: todayCount,   icon: <Clock    size={16} color="#fff" />, bg: "#0ea5e9" },
    { label: "Filtered",       value: filtered.length, icon: <Search size={16} color="#fff" />, bg: "#7c3aed" },
  ]

  return (
    <OfficeLayout title="Audit Trail">
      <div style={{ fontFamily: F }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: DARK }}>Audit Trail</h1>
            <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Complete activity log — every action across all applications</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={refresh}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => exportCsv(filtered)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              <Download size={13} /> Export CSV
            </button>
            <button onClick={handleClear}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderRadius: 10, background: s.bg }}>
              {s.icon}
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.75)", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap" as const, gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
            <input
              placeholder="Search app #, company, actor, action…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, height: 34, border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.75rem", color: DARK, outline: "none", boxSizing: "border-box" as const, fontFamily: F }}
              onFocus={e => (e.target.style.borderColor = "#2563eb")}
              onBlur={e =>  (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Category */}
          <select value={category} onChange={e => { setCategory(e.target.value as any); setPage(0) }}
            style={{ height: 34, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.75rem", color: DARK, background: "#fff", outline: "none", fontFamily: F, cursor: "pointer" }}>
            <option value="ALL">All Categories</option>
            {(Object.keys(CATEGORY_STYLE) as AuditCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_STYLE[c].label}</option>
            ))}
          </select>

          {/* Role */}
          <select value={role} onChange={e => { setRole(e.target.value); setPage(0) }}
            style={{ height: 34, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.75rem", color: DARK, background: "#fff", outline: "none", fontFamily: F, cursor: "pointer" }}>
            <option value="ALL">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="HCB Office">HCB Office</option>
            <option value="System">System</option>
          </select>

          {/* Date from */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" as const }}>From</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              style={{ height: 34, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.75rem", color: DARK, outline: "none", fontFamily: F }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" as const }}>To</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }}
              style={{ height: 34, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.75rem", color: DARK, outline: "none", fontFamily: F }} />
          </div>

          {(search || category !== "ALL" || role !== "ALL" || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(""); setCategory("ALL"); setRole("ALL"); setDateFrom(""); setDateTo(""); setPage(0) }}
              style={{ padding: "5px 11px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" as const }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        {paged.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
            <Activity size={32} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#94a3b8" }}>No log entries found</p>
            <p style={{ margin: "5px 0 0", fontSize: "0.75rem", color: "#cbd5e1" }}>Actions will be recorded here as users interact with the system</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Timestamp", "Application", "Company", "Actor", "Action", "Category", "Status Change", "Details"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" as const }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((log, i) => {
                  const cat  = CATEGORY_STYLE[log.category]
                  const dot  = ROLE_DOT[log.role] ?? "#94a3b8"
                  const acColor = ACTION_COLOR[log.action] ?? "#374151"
                  const even = i % 2 === 0
                  return (
                    <tr key={log.id}
                      style={{ borderBottom: "1px solid #f1f5f9", background: even ? "#fff" : "#fafbfc" }}
                      onMouseOver={e => (e.currentTarget.style.background = "#f0f7ff")}
                      onMouseOut={e =>  (e.currentTarget.style.background = even ? "#fff" : "#fafbfc")}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={11} color="#94a3b8" />
                          <span style={{ fontSize: "0.72rem", color: "#374151", fontFamily: "monospace" }}>{fmtDate(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Application */}
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <FileText size={11} color="#2563eb" />
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2563eb", fontFamily: "monospace", background: "#eff6ff", padding: "2px 7px", borderRadius: 5 }}>
                            {log.applicationNumber}
                          </span>
                        </div>
                      </td>

                      {/* Company */}
                      <td style={{ padding: "11px 14px", maxWidth: 160 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: DARK, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{log.companyName}</span>
                      </td>

                      {/* Actor */}
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.73rem", fontWeight: 600, color: DARK }}>{log.actor}</div>
                            <div style={{ fontSize: "0.63rem", color: "#94a3b8" }}>{log.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: acColor, flexShrink: 0 }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: acColor }}>{log.action}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700, background: cat.bg, color: cat.color, whiteSpace: "nowrap" as const }}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Status change */}
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                        {(log.oldStatus || log.newStatus) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem" }}>
                            {log.oldStatus && <span style={{ padding: "1px 7px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{log.oldStatus}</span>}
                            {log.oldStatus && log.newStatus && <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>→</span>}
                            {log.newStatus && <span style={{ padding: "1px 7px", borderRadius: 99, background: "#eff6ff", color: "#2563eb", fontWeight: 700 }}>{log.newStatus}</span>}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.68rem", color: "#cbd5e1" }}>—</span>
                        )}
                      </td>

                      {/* Details */}
                      <td style={{ padding: "11px 14px", maxWidth: 240 }}>
                        <span style={{ fontSize: "0.71rem", color: "#64748b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={log.details}>
                          {log.details ?? "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: "0.72rem", fontWeight: 600, color: "#374151", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, fontFamily: F }}>
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const n = Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid #e2e8f0", background: n === page ? "#2563eb" : "#fff", color: n === page ? "#fff" : "#374151", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                        {n + 1}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: "0.72rem", fontWeight: 600, color: "#374151", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1, fontFamily: F }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
