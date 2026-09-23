import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Search, Award, RefreshCw, ChevronLeft, ChevronRight,
  Settings, QrCode, X, ExternalLink, Copy,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getCertificates } from "@/api/certificates"
import { C, getStatusStyle, formatDate, daysUntil } from "@/lib/utils"
import type { LocalGeneratedCertificate } from "@/types"

const PAGE_SIZE = 15

function lsArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[] }
  catch { return [] }
}

// ─── QR visual placeholder ────────────────────────────────────────────────────
function QRPlaceholder({ value }: { value: string }) {
  const rows = 9
  const cells = 9
  const seed = value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (
    <div style={{ display: "inline-block", padding: 6, background: "#fff", border: "2px solid #0f172a", borderRadius: 4 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex" }}>
          {Array.from({ length: cells }).map((_, c) => {
            // fixed corner squares for QR-like look
            const topL = (r < 3 && c < 3) || (r === 3 && c === 3)
            const topR = (r < 3 && c >= cells - 3) || (r === 3 && c === cells - 4)
            const btmL = (r >= rows - 3 && c < 3) || (r === rows - 4 && c === 3)
            const corner = topL || topR || btmL
            const bit = corner ? 1 : (seed + r * 11 + c * 7 + r * c) % 3 === 0 ? 1 : 0
            return <div key={c} style={{ width: 6, height: 6, background: bit ? "#0f172a" : "#fff" }} />
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Certificate detail modal ─────────────────────────────────────────────────
function CertModal({ cert, onClose }: { cert: LocalGeneratedCertificate; onClose: () => void }) {
  const verifyUrl = `${window.location.origin}/verify/${cert.key}`
  const copy = () => { navigator.clipboard.writeText(verifyUrl); }
  const tmpl = cert.template
  const hasUploadedTemplate = Boolean(tmpl?.sourceTemplateDataUrl)
  const isImageTemplate = tmpl?.sourceTemplateMime?.startsWith("image/")
  const isPdfTemplate = tmpl?.sourceTemplateMime === "application/pdf" || tmpl?.sourceTemplateName?.toLowerCase().endsWith(".pdf")
  const usesPlacedLayout = hasUploadedTemplate && Boolean(tmpl?.placedFields?.length)
  const pageCount = Math.max(1, tmpl?.pageCount ?? 1)
  const valueForField = (key: string) => ({
    certificateNumber: cert.certificateNumber,
    companyName: cert.companyName,
    factoryAddress: cert.factoryAddress,
    scope: cert.scope,
    standard: cert.standard,
    issueDate: formatDate(cert.issueDate),
    expiryDate: formatDate(cert.expiryDate),
    signatoryName: cert.signatoryName,
    signatoryTitle: cert.signatoryTitle,
    heading: tmpl?.bodyTitle || "Halal Certificate",
    subtitle: "Awarded to:",
    smallText: "Small certificate note",
    footerNote: tmpl?.footerNote || "",
  }[key] ?? "")
  const renderIssuedElement = (field: NonNullable<NonNullable<LocalGeneratedCertificate["template"]>["placedFields"]>[number]) => {
    if (field.key === "frame") return <div style={{ width: "100%", height: "100%", border: "6px double #b88746", boxShadow: "inset 0 0 0 10px #f7ead8" }} />
    if (field.key === "logo") return tmpl?.logoDataUrl ? <img src={tmpl.logoDataUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null
    if (field.key === "signature") return tmpl?.signatureDataUrl ? <img src={tmpl.signatureDataUrl} alt="Signature" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null
    if (field.key === "productsTable") {
      return (
        <div style={{ width: "100%", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.9)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", background: "#f8fafc", fontSize: 10, fontWeight: 800 }}>
            <span style={{ padding: 5 }}>Product</span><span style={{ padding: 5 }}>Category</span><span style={{ padding: 5 }}>Brand</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", fontSize: 10 }}>
            <span style={{ padding: 5 }}>{cert.products || "Certified products"}</span><span style={{ padding: 5 }}>{cert.standard || "Halal"}</span><span style={{ padding: 5 }}>{cert.companyName}</span>
          </div>
        </div>
      )
    }
    if (field.key === "qrCode") return <QRPlaceholder value={cert.key} />
    return valueForField(field.key)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={18} color="#107c10" />
            <span style={{ fontWeight: 700, fontSize: 15, color: C.textDark }}>Halal Certificate</span>
          </div>
          <button onClick={onClose} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Certificate preview */}
          {Array.from({ length: pageCount }).map((_, pageIndex) => {
            const page = pageIndex + 1
            const pageFields = (tmpl?.placedFields ?? []).filter(field => (field.page ?? 1) === page)
            return (
          <div key={page} style={{ border: "2px solid #107c10", borderRadius: 10, padding: 20, marginBottom: 18, background: hasUploadedTemplate ? "#fff" : "linear-gradient(135deg, #f0fff4 0%, #fff 100%)", position: "relative", overflow: "hidden", minHeight: 560 }}>
            {pageCount > 1 && (
              <span style={{ position: "absolute", top: 8, left: 10, zIndex: 5, fontSize: 10, fontWeight: 800, color: C.muted, background: "rgba(255,255,255,0.85)", padding: "2px 8px", borderRadius: 20 }}>
                Page {page}
              </span>
            )}
            {isImageTemplate && (
              <img src={tmpl?.sourceTemplateDataUrl} alt={tmpl?.sourceTemplateName || "HCB certificate template"}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.28, pointerEvents: "none" }} />
            )}
            {isPdfTemplate && (
              <object data={tmpl?.sourceTemplateDataUrl} type="application/pdf" aria-label={tmpl?.sourceTemplateName || "HCB certificate PDF template"}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.2, pointerEvents: "none", border: "none" }} />
            )}
            {pageFields.map(field => (
              <div
                key={field.id}
                style={{
                  position: "absolute",
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: field.key === "frame" ? 1 : 2,
                  minWidth: field.key === "qrCode" ? 74 : 130,
                  width: `${field.w ?? (field.key === "qrCode" ? 12 : 24)}%`,
                  height: field.h ? `${field.h * 5.6}px` : field.key === "qrCode" ? 74 : undefined,
                  minHeight: field.h ? undefined : field.key === "qrCode" ? 74 : 24,
                  padding: field.key === "frame" ? 0 : field.key === "qrCode" || field.key === "productsTable" || field.key === "logo" || field.key === "signature" ? 6 : "4px 7px",
                  color: C.textDark,
                  fontSize: field.fontSize ?? 12,
                  fontWeight: 700,
                  textAlign: field.key === "qrCode" ? "center" : "left",
                  background: field.key === "frame" ? "transparent" : "rgba(255,255,255,0.72)",
                }}
              >
                {renderIssuedElement(field)}
              </div>
            ))}
            <div style={{ position: "relative", zIndex: 1, display: usesPlacedLayout ? "none" : "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {tmpl?.logoDataUrl && <img src={tmpl.logoDataUrl} alt="HCB logo" style={{ width: 58, height: 58, objectFit: "contain" }} />}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#107c10", textTransform: "uppercase", letterSpacing: "0.15em" }}>{tmpl?.issuingBodyName || cert.issuingBodyName}</p>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: C.textDark, margin: "6px 0 2px" }}>{tmpl?.bodyTitle || "Halal Certification"}</h2>
                  <p style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#107c10" }}>{cert.certificateNumber}</p>
                </div>
              </div>
              {hasUploadedTemplate && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#107c10", background: "#e6f4e6", padding: "4px 8px", borderRadius: 20 }}>HCB TEMPLATE</span>
              )}
            </div>

            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {[
                ["Certified Company", cert.companyName],
                ["Factory / Plant", cert.factoryAddress],
                ["Standard", cert.standard],
                ["Certified Scope", cert.scope],
                ["Issue Date", formatDate(cert.issueDate)],
                ["Expiry Date", formatDate(cert.expiryDate)],
                ["Signatory", `${cert.signatoryName} — ${cert.signatoryTitle}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", minWidth: 120, flexShrink: 0, marginTop: 2 }}>{label}</span>
                  <span style={{ fontSize: 13, color: C.textDark }}>{value}</span>
                </div>
              ))}
              {(tmpl?.customFields ?? []).map(field => (
                <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", minWidth: 120, flexShrink: 0, marginTop: 2 }}>{field.label}</span>
                  <span style={{ fontSize: 13, color: C.textDark }}>{field.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #d1fae5" }}>
              <div>
                <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>SCAN TO VERIFY</p>
                <QRPlaceholder value={cert.key} />
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#e6f4e6", color: "#107c10" }}>{cert.status}</span>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 8, maxWidth: 160 }}>Verify at: {cert.key}</p>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              {tmpl?.signatureDataUrl && <img src={tmpl.signatureDataUrl} alt="Authorized signature" style={{ maxWidth: 150, maxHeight: 48, objectFit: "contain", marginBottom: 6 }} />}
              {tmpl?.accreditationLine && <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5, marginBottom: 4 }}>{tmpl.accreditationLine}</p>}
              {tmpl?.footerNote && <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{tmpl.footerNote}</p>}
            </div>
            </div>
          </div>
            )
          })}

          {/* QR verification link */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0f7ff", borderRadius: 8, marginBottom: 14 }}>
            <QrCode size={16} color={C.primary} />
            <span style={{ fontSize: 12, color: C.text, flex: 1, wordBreak: "break-all" }}>{verifyUrl}</span>
            <button onClick={copy} title="Copy URL" style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: C.muted }}>
              <Copy size={14} />
            </button>
            <a href={verifyUrl} target="_blank" rel="noreferrer" style={{ padding: 4, color: C.muted }}>
              <ExternalLink size={14} />
            </a>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => window.print()}
              style={{ padding: "8px 18px", background: "#107c10", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [selectedCert, setSelectedCert] = useState<LocalGeneratedCertificate | null>(null)

  const genCerts: LocalGeneratedCertificate[] = lsArr("hcs_gen_certs")

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["certificates", { page, search }],
    queryFn: () => getCertificates({ page, size: PAGE_SIZE, search: search || undefined }),
  })

  const certs = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const activeCerts  = certs.filter(c => c.status === "ACTIVE").length
  const expiringSoon = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30 }).length
  const expiredCerts = certs.filter(c => c.status === "EXPIRED").length

  // Filter local gen certs by search
  const filteredGen = genCerts.filter(c =>
    !search || c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <OfficeLayout title="Certificates">
      <div className="p-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Issued",      value: totalElements + genCerts.length, accent: C.primary,  light: "#dbeef9" },
            { label: "Active",            value: activeCerts + genCerts.filter(c => c.status === "ACTIVE").length, accent: "#107c10", light: "#e6f4e6" },
            { label: "Expiring ≤30d",     value: expiringSoon,  accent: "#ffb900", light: "#fff8e5" },
            { label: "Expired / Revoked", value: expiredCerts,  accent: "#d13438", light: "#fde7e9" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-4"
              style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <p className="text-sm" style={{ color: C.muted }}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: stat.accent }}>{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <input type="text" placeholder="Search by company or certificate #…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none" }}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>
          <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ border: `1px solid ${C.border}`, background: C.white, color: C.muted }}
            onMouseOver={e => (e.currentTarget.style.background = C.bg)}
            onMouseOut={e => (e.currentTarget.style.background = C.white)}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => navigate("/office/settings")}
            className="flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-semibold"
            style={{ border: `1px solid ${C.border}`, background: C.white, color: C.primary }}>
            <Settings className="w-4 h-4" />Template
          </button>
        </div>

        {/* Locally generated certificates */}
        {filteredGen.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.muted }}>
              Generated Certificates ({filteredGen.length})
            </p>
            <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                    {["Certificate #", "Company", "Standard", "Issue Date", "Expiry Date", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGen.map(cert => {
                    const s = getStatusStyle(cert.status)
                    return (
                      <tr key={cert.key} style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-semibold" style={{ color: "#107c10" }}>{cert.certificateNumber}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-sm" style={{ color: C.textDark }}>{cert.companyName}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{cert.standard}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{formatDate(cert.issueDate)}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{formatDate(cert.expiryDate)}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: s.bg, color: s.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />{s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedCert(cert)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "#e6f4e6", color: "#107c10" }}
                              onMouseOver={e => (e.currentTarget.style.background = "#d1f0d1")}
                              onMouseOut={e => (e.currentTarget.style.background = "#e6f4e6")}>
                              <QrCode className="w-3.5 h-3.5" />View / QR
                            </button>
                            <a href={`/verify/${cert.key}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "#f0f7ff", color: C.primary }}>
                              <ExternalLink className="w-3.5 h-3.5" />Verify
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API certificates */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
          {certs.length > 0 || isLoading ? (
            <div className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide"
              style={{ background: "#fafbfc", borderColor: C.border, color: C.muted }}>
              All Certificates from System
            </div>
          ) : null}
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                {["Certificate #", "Company", "Standard", "Issue Date", "Expiry Date", "Status", "Issued By", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 rounded animate-pulse" style={{ background: "#f0f0f0" }} /></td>
                    ))}
                  </tr>
                ))
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Award className="w-9 h-9 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <p className="font-medium" style={{ color: C.muted }}>No certificates in system. Use the certification decision workflow to generate certificates.</p>
                    <p className="text-sm mt-2" style={{ color: C.muted }}>Generated certificates appear in the top section above.</p>
                  </td>
                </tr>
              ) : (
                certs.map(cert => {
                  const s = getStatusStyle(cert.status)
                  const daysLeft = daysUntil(cert.expiryDate)
                  const nearExpiry = daysLeft >= 0 && daysLeft <= 30
                  return (
                    <tr key={cert.id} style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold" style={{ color: C.primary }}>{cert.certificateNumber}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-sm" style={{ color: C.textDark }}>{cert.companyName}</td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{cert.halalStandard}</td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{formatDate(cert.issueDate)}</td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm" style={{ color: nearExpiry ? "#d13438" : C.muted }}>{formatDate(cert.expiryDate)}</p>
                          {nearExpiry && <p className="text-xs font-medium" style={{ color: "#d13438" }}>{daysLeft === 0 ? "Expires today" : `${daysLeft} days left`}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: s.bg, color: s.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />{s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{cert.issuedBy ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#e6f4e6", color: "#107c10" }}
                          onMouseOver={e => (e.currentTarget.style.background = "#d1f0d1")}
                          onMouseOut={e => (e.currentTarget.style.background = "#e6f4e6")}>
                          <QrCode className="w-3.5 h-3.5" />View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm" style={{ color: C.muted }}>Page {page + 1} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40"
                style={{ border: `1px solid ${C.border}`, background: C.white }}>
                <ChevronLeft className="w-4 h-4" style={{ color: C.text }} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40"
                style={{ border: `1px solid ${C.border}`, background: C.white }}>
                <ChevronRight className="w-4 h-4" style={{ color: C.text }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificate detail modal */}
      {selectedCert && <CertModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
    </OfficeLayout>
  )
}
