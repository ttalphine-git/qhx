import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Search, Award, Download, RefreshCw,
  ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { getCertificates } from "@/api/certificates"
import { C, getStatusStyle, formatDate, daysUntil } from "@/lib/utils"

const PAGE_SIZE = 10

export default function CustomerCertificatesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["customer-certs-list", { page, search }],
    queryFn: () => getCertificates({ page, size: PAGE_SIZE, search: search || undefined }),
  })

  const certs = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const activeCerts  = certs.filter(c => c.status === "ACTIVE").length
  const expiringSoon = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30 }).length
  const expired      = certs.filter(c => c.status === "EXPIRED").length

  return (
    <CustomerLayout title="My Certificates">
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",          value: totalElements, color: C.primary,  bg: "#dbeef9" },
            { label: "Active",         value: activeCerts,   color: "#107c10",  bg: "#e6f4e6" },
            { label: "Expiring ≤30d",  value: expiringSoon,  color: "#ca5010",  bg: "#fff8e5" },
            { label: "Expired",        value: expired,       color: "#d13438",  bg: "#fde7e9" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}>
                <Award className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <input
              type="text"
              placeholder="Search certificates…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none" }}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${C.border}`, background: C.white, color: C.muted }}
            onMouseOver={e => (e.currentTarget.style.background = C.bg)}
            onMouseOut={e => (e.currentTarget.style.background = C.white)}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ background: C.white, border: `1px solid ${C.border}`, height: 96 }}
              />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div
            className="rounded-xl py-20 text-center"
            style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
          >
            <Award className="w-9 h-9 mx-auto mb-3" style={{ color: "#d1d5db" }} />
            <p className="font-medium" style={{ color: C.muted }}>No certificates yet</p>
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Certificates will appear here once your application is approved
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map(cert => {
              const s = getStatusStyle(cert.status)
              const dLeft = daysUntil(cert.expiryDate)
              const nearExpiry = dLeft >= 0 && dLeft <= 30
              const isExpired  = dLeft < 0

              return (
                <div
                  key={cert.id}
                  className="rounded-xl p-5"
                  style={{
                    background: C.white,
                    border: `1px solid ${nearExpiry ? "#f5d78e" : C.border}`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.bg }}
                    >
                      <ShieldCheck className="w-6 h-6" style={{ color: s.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs font-semibold" style={{ color: C.primary }}>
                              {cert.certificateNumber}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: s.bg, color: s.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                              {s.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: C.textDark }}>{cert.companyName}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                            {cert.halalStandard}
                            {cert.issuedBy && ` · Issued by ${cert.issuedBy}`}
                          </p>
                        </div>

                        <button
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all"
                          style={{ background: "#e6f4e6", color: "#107c10" }}
                          onMouseOver={e => (e.currentTarget.style.background = "#d1ead1")}
                          onMouseOut={e => (e.currentTarget.style.background = "#e6f4e6")}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </button>
                      </div>

                      {/* Dates */}
                      <div
                        className="flex items-center gap-6 mt-3 pt-3 text-xs"
                        style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}
                      >
                        <div>
                          <p>Issue Date</p>
                          <p className="font-medium mt-0.5" style={{ color: C.text }}>
                            {formatDate(cert.issueDate)}
                          </p>
                        </div>
                        <div>
                          <p>Expiry Date</p>
                          <p
                            className="font-medium mt-0.5"
                            style={{ color: nearExpiry || isExpired ? "#d13438" : C.text }}
                          >
                            {formatDate(cert.expiryDate)}
                          </p>
                        </div>
                        {!isExpired && (
                          <div
                            className="px-2.5 py-1 rounded-full text-xs font-semibold ml-auto"
                            style={{
                              background: nearExpiry ? "#fff8e5" : "#e6f4e6",
                              color: nearExpiry ? "#8a6000" : "#107c10",
                            }}
                          >
                            {nearExpiry
                              ? dLeft === 0 ? "Expires today" : `${dLeft} days left`
                              : `Valid for ${dLeft} days`}
                          </div>
                        )}
                        {isExpired && (
                          <div
                            className="px-2.5 py-1 rounded-full text-xs font-semibold ml-auto"
                            style={{ background: "#fde7e9", color: "#d13438" }}
                          >
                            Expired
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, background: C.white }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: C.text }} />
            </button>
            <span className="text-sm" style={{ color: C.muted }}>Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, background: C.white }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: C.text }} />
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
