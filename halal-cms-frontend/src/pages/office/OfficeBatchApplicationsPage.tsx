import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FilePlus2,
  FileText,
  Filter,
  Grid2X2,
  Headphones,
  LayoutList,
  Plus,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfficeLayout from "./OfficeLayout"

interface BatchApplication {
  id: number
  requestNumber: string
  status: string
  companyName: string
  submittedAt?: string
}

const F = "'Inter', system-ui, sans-serif"
const NAVY = "#0f2170"
const BLUE = "#0b5ed7"
const SOFT_BLUE = "#edf5ff"
const TEXT = "#0f172a"
const MUTED = "#5c6f85"

const stats = [
  { label: "Total Applications", helper: "All submitted", value: 0, icon: FileText, accent: "#0b5ed7", bg: "#e8f2ff" },
  { label: "Active", helper: "Currently processing", value: 0, icon: ShieldCheck, accent: "#2563eb", bg: "#eaf1ff" },
  { label: "Approved", helper: "Certified", value: 0, icon: ShieldCheck, accent: "#15803d", bg: "#ecfdf5" },
  { label: "Rejected", helper: "Declined", value: 0, icon: XCircle, accent: "#dc2626", bg: "#feeaea" },
]

export default function OfficeBatchApplicationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  const { data, isLoading } = useQuery({
    queryKey: ["office-batch-applications", search],
    queryFn: async () => {
      return {
        content: [],
        totalElements: 0,
      }
    },
  })

  const applications = data?.content || []
  const totalElements = data?.totalElements || 0

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return { bg: "#fef3c7", color: "#b45309" }
      case "APPROVED":
        return { bg: "#dcfce7", color: "#15803d" }
      case "REJECTED":
        return { bg: "#fee2e2", color: "#dc2626" }
      default:
        return { bg: "#f3f4f6", color: "#64748b" }
    }
  }

  return (
    <OfficeLayout>
      <div style={{ fontFamily: F, background: "#f8fafc", minHeight: "100vh", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ margin: "0 0 8px", color: "#4b5563", fontSize: "0.83rem", fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase" }}>Batch Applications</p>
            <h1 style={{ margin: 0, color: "#09204f", fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.04, fontWeight: 900, letterSpacing: "-0.045em" }}>
              Batch Applications
            </h1>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 40 }}>
            {stats.map(({ label, helper, value, icon: Icon, accent, bg }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 16, padding: 24, display: "flex", gap: 16, alignItems: "flex-start", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon size={32} color={accent} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ color: "#071d35", fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: "#41546c", marginTop: 8, fontSize: "1rem", fontWeight: 700 }}>{label}</div>
                  <div style={{ color: "#6a7890", marginTop: 4, fontSize: "0.9rem" }}>{helper}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Panel */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            {/* Panel Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "#e8f2ff", display: "grid", placeItems: "center" }}>
                    <FileText size={28} color={BLUE} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: TEXT, fontSize: "1.4rem", fontWeight: 850, letterSpacing: "-0.025em" }}>Batch Applications</h2>
                    <p style={{ margin: "6px 0 0", color: MUTED, fontSize: "0.95rem" }}>{totalElements} total applications</p>
                  </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <label style={{ position: "relative", display: "block" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search applications..."
                      style={{ width: 220, height: 40, border: "1px solid #d7e3f2", borderRadius: 10, background: "#f8fbff", color: TEXT, padding: "0 12px 0 40px", fontSize: "0.85rem", outline: "none" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#d7e3f2")}
                    />
                  </label>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #d7e3f2", borderRadius: 10, background: "#fff", color: MUTED, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <Filter size={16} />Filter
                  </button>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #d7e3f2", borderRadius: 10, background: "#fff", color: MUTED, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <CalendarDays size={16} />All Dates<ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
                <div style={{ textAlign: "center", color: MUTED }}>Loading...</div>
              </div>
            ) : applications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <FileText size={48} style={{ margin: "0 auto 16px", color: "#cbd5e1", display: "block" }} />
                <h3 style={{ margin: "0 0 8px", color: TEXT, fontSize: "1.3rem", fontWeight: 850 }}>No Batch Applications</h3>
                <p style={{ margin: "0 auto", maxWidth: 480, color: MUTED, lineHeight: 1.5, fontSize: "0.95rem" }}>
                  No batch applications found. Applications submitted by customers will appear here.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    {["Request #", "Company", "Status", "Submitted", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app: BatchApplication) => {
                    const st = getStatusColor(app.status)
                    return (
                      <tr key={app.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "14px 16px", fontSize: "0.9rem", fontWeight: 600, color: BLUE }}>{app.requestNumber}</td>
                        <td style={{ padding: "14px 16px", fontSize: "0.9rem", fontWeight: 500, color: TEXT }}>{app.companyName}</td>
                        <td style={{ padding: "14px 16px", fontSize: "0.85rem" }}>
                          <span style={{ padding: "4px 12px", borderRadius: 16, background: st.bg, color: st.color, fontWeight: 600 }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "0.9rem", color: MUTED }}>
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "0.9rem" }}>
                          <button onClick={() => navigate(`/office/batch-applications/${app.id}`)} style={{ color: BLUE, textDecoration: "none", cursor: "pointer", background: "none", border: "none", fontFamily: F, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            View <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
