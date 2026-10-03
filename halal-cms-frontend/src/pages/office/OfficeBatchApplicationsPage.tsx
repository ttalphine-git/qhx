import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, RefreshCw, Eye, Loader, FileText } from "lucide-react"
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
const NAV = "#0f2170"
const BLUE = "#2563eb"

const STATS = [
  { label: "Total", value: 0, bg: "#1e40af" },
  { label: "Active", value: 0, bg: "#0369a1" },
  { label: "Approved", value: 0, bg: "#059669" },
  { label: "Rejected", value: 0, bg: "#0891b2" },
]

export default function OfficeBatchApplicationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("Active")

  const { data, isLoading } = useQuery({
    queryKey: ["office-batch-applications", page, search, activeTab],
    queryFn: async () => {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
      }
    },
  })

  const applications = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = Math.ceil(totalElements / 20)

  const tabs = ["Active", "Approved", "Rejected"]

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

  const stats_display = [
    { ...STATS[0], value: totalElements },
    { ...STATS[1], value: 0 },
    { ...STATS[2], value: 0 },
    { ...STATS[3], value: 0 },
  ]

  return (
    <OfficeLayout>
      <div style={{ fontFamily: F }}>
        {/* Page Header */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e9ecef",
            padding: "18px 24px 0",
            marginBottom: 20,
            borderRadius: "12px 12px 0 0",
            border: "1px solid #e9ecef",
          }}
        >
          {/* Title and Stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Batch Applications
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                Track and manage batch certificate applications
              </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "flex", gap: 8 }}>
              {stats_display.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: s.bg,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.8)",
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                    setPage(0)
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "11px 18px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: F,
                    background: "transparent",
                    color: isActive ? NAV : "#64748b",
                    borderBottom: isActive
                      ? `2.5px solid ${NAV}`
                      : "2.5px solid transparent",
                    marginBottom: -1,
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ position: "relative", width: 280 }}>
            <Search
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 13,
                height: 13,
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search by number or company"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 10,
                height: 33,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#fff",
                color: "#0f172a",
                outline: "none",
                fontSize: "0.73rem",
                fontFamily: F,
                boxSizing: "border-box" as const,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
          </div>
          <button
            onClick={() => {}}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e9ecef",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e9ecef",
                  background: "#fafbfc",
                }}
              >
                {["Request #", "Company", "Status", "Submitted", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 16px",
                        textAlign: "left",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!isLoading && applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "60px 20px", textAlign: "center" }}
                  >
                    <FileText
                      size={28}
                      color="#cbd5e1"
                      style={{ margin: "0 auto 12px", display: "block" }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      No batch applications found
                    </p>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                    }}
                  >
                    <Loader size={24} color="#2563eb" className="animate-spin" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : (
                applications.map((app: BatchApplication) => {
                  const st = getStatusColor(app.status)
                  return (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.73rem",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                        {app.requestNumber}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {app.companyName}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() =>
                            navigate(`/office/batch-applications/${app.id}`)
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#2563eb",
                            textDecoration: "none",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            fontFamily: F,
                            fontSize: "0.73rem",
                            fontWeight: 600,
                          }}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
              {applications.length > 0 && Array.from({ length: Math.max(0, 8 - applications.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: "1px solid #f1f5f9", height: 55 }}>
                  <td colSpan={5} style={{ padding: "12px 16px", background: "transparent" }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OfficeLayout>
  )
}
