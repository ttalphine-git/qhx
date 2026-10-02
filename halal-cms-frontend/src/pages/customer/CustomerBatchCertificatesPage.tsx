import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, RefreshCw, Eye, Loader, FileText, Download, Zap, FilePlus2, CalendarDays, ShieldCheck, CircleHelp, Headphones, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import CustomerLayout from "./CustomerLayout"

interface Certificate {
  id: number
  certificateNumber: string
  status: string
  companyName: string
  expiryDate?: string
  halalStandard?: string
}

const F = "'Inter', system-ui, sans-serif"
const NAV = "#0f2170"
const BLUE = "#2563eb"
const TEXT = "#0f172a"

const STATS = [
  { label: "Total", value: 0, bg: "#1e3a8a" },
  { label: "Active", value: 0, bg: "#15803d" },
  { label: "Expiring", value: 0, bg: "#b45309" },
  { label: "Expired", value: 0, bg: "#64748b" },
]

const quickActions = [
  { label: "Apply for New Certificate", helper: "Start a new batch certificate application", icon: FilePlus2, color: "#0b5ed7", path: "/customer/batch-certificates/new" },
  { label: "View My Applications", helper: "Track your application status", icon: CalendarDays, color: "#2563eb", path: "/customer/applications" },
  { label: "My Factories", helper: "Manage your registered factories", icon: ShieldCheck, color: "#7c3aed", path: "/customer/factories" },
]

export default function CustomerBatchCertificatesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["customer-batch-certificates", page, search],
    queryFn: async () => {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
      }
    },
  })

  const certificates = data?.content || []
  const totalElements = data?.totalElements || 0

  function getStatusColor(status: string) {
    switch (status) {
      case "ACTIVE":
        return { bg: "#dcfce7", color: "#15803d" }
      case "EXPIRING_SOON":
        return { bg: "#fef3c7", color: "#b45309" }
      case "EXPIRED":
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
    <CustomerLayout title="Batch Certificates">
      <div style={{ fontFamily: F, padding: "18px 24px", paddingBottom: 40, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
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
                Batch Certificates
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                View and manage your halal batch certificates
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
            onClick={() => window.location.reload()}
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
                {["Certificate #", "Company", "Standard", "Expiry Date", "Status", "Action"].map(
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
              {!isLoading && certificates.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                      No batch certificates found
                    </p>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                    }}
                  >
                    <Loader size={24} color="#2563eb" className="animate-spin" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : (
                certificates.map((cert: Certificate) => {
                  const st = getStatusColor(cert.status)
                  return (
                    <tr
                      key={cert.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.73rem",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                        {cert.certificateNumber}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {cert.companyName}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {cert.halalStandard || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 6,
                            backgroundColor: st.bg,
                            color: st.color,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => navigate(`/customer/batch-certificates/${cert.id}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#64748b",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                          }}
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Need Help */}
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(199, 223, 247, 0.78)",
              borderRadius: 12,
              padding: "16px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <CircleHelp size={22} color={NAV} style={{ margin: "0 auto 8px", display: "block" }} />
            <h3 style={{ margin: "0 0 6px", color: TEXT, fontSize: "0.9rem", fontWeight: 850 }}>Need Help?</h3>
            <p style={{ margin: "0 auto 12px", color: "#5d6f86", lineHeight: 1.55, fontSize: "0.68rem" }}>
              If you have any questions about your batch certificates, please contact our support team.
            </p>
            <button style={{ width: "100%", height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid #0f2170", borderRadius: 6, background: "#fff", color: "#0f2170", fontWeight: 800, fontSize: "0.7rem", cursor: "pointer", fontFamily: F }}>
              <Headphones size={14} />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
