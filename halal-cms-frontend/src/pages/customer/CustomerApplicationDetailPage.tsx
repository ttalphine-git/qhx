import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft, CheckCircle2, Clock, Circle,
  Building2, CreditCard, AlertTriangle,
  FileText, PenLine, RotateCcw, Send, Globe, Upload, X,
  Mail, Phone, Hash, CalendarDays, Landmark, Receipt, Briefcase,
  Shield, Tags, List, AlignLeft,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { getApplication, getCompanyInfo, getPaymentStatus, getEventLogs } from "@/api/applications"
import { C, getStatusStyle, formatDate, formatDateTime } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { addNotification } from "@/lib/notifications"
import { addAuditLog } from "@/lib/auditLog"
import { loadApplicationBilling, loadInvoiceByApp, invoiceStatusStyle, formatInvoiceDate, loadStripeConfig, addPaymentEvidence } from "@/lib/billing"
import type { Invoice } from "@/lib/billing"

const STAGES = [
  { key: "DRAFT",                label: "Draft" },
  { key: "SUBMITTED",            label: "Submitted" },
  { key: "UNDER_REVIEW",         label: "Under Review" },
  { key: "AGREEMENT_PENDING",    label: "Agreement" },
  { key: "AGREEMENT_REVIEW",     label: "Agr. Review" },
  { key: "PENDING_PAYMENT",      label: "Payment" },
  { key: "PAYMENT_REVIEW",       label: "Pay. Review" },
  { key: "AUDIT_SCHEDULED",      label: "Scheduled" },
  { key: "AUDIT_IN_PROGRESS",    label: "In Progress" },
  { key: "AUDIT_COMPLETED",      label: "Completed" },
  { key: "CERTIFICATION_REVIEW", label: "Cert. Review" },
  { key: "CERTIFIED",            label: "Certified" },
]

const AGR_LANGUAGES = [
  { code: "en",    label: "English",               flag: "🇬🇧" },
  { code: "ar",    label: "Arabic",                flag: "🇸🇦" },
  { code: "ms",    label: "Malay",                 flag: "🇲🇾" },
  { code: "id",    label: "Indonesian",            flag: "🇮🇩" },
  { code: "tr",    label: "Turkish",               flag: "🇹🇷" },
  { code: "fr",    label: "French",                flag: "🇫🇷" },
  { code: "de",    label: "German",                flag: "🇩🇪" },
  { code: "ur",    label: "Urdu",                  flag: "🇵🇰" },
  { code: "zh",    label: "Chinese (Simplified)",  flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "es",    label: "Spanish",               flag: "🇪🇸" },
  { code: "pt",    label: "Portuguese",            flag: "🇧🇷" },
  { code: "ru",    label: "Russian",               flag: "🇷🇺" },
  { code: "ja",    label: "Japanese",              flag: "🇯🇵" },
  { code: "ko",    label: "Korean",                flag: "🇰🇷" },
  { code: "th",    label: "Thai",                  flag: "🇹🇭" },
  { code: "bn",    label: "Bengali",               flag: "🇧🇩" },
  { code: "hi",    label: "Hindi",                 flag: "🇮🇳" },
  { code: "nl",    label: "Dutch",                 flag: "🇳🇱" },
  { code: "it",    label: "Italian",               flag: "🇮🇹" },
]

function loadAgrPdfs(): Record<string, { fileName: string; pdfData: string }> {
  try { return JSON.parse(localStorage.getItem("hcs_agreement_pdfs") || "{}") } catch { return {} }
}
function loadAgrLangs(): string[] {
  try { return JSON.parse(localStorage.getItem("hcs_agreement_langs") || "[]") } catch { return [] }
}
function loadLocalApp(_id: string) {
  localStorage.removeItem("hcs_local_applications")
  return null
}
function saveLocalApp(_app: any) {
  localStorage.removeItem("hcs_local_applications")
}

// ── Signature canvas ───────────────────────────────────────────────────────────
function SignatureCanvas({ onSign, onClear }: { onSign: (dataUrl: string) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const src = "touches" in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.strokeStyle = "#1e3a8a"
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      drawing.current = true
      const { x, y } = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!drawing.current) return
      const { x, y } = getPos(e, canvas)
      ctx.lineTo(x, y)
      ctx.stroke()
      hasStrokes.current = true
    }
    const end = () => {
      drawing.current = false
      if (hasStrokes.current) onSign(canvas.toDataURL())
    }

    canvas.addEventListener("mousedown", start)
    canvas.addEventListener("mousemove", move)
    canvas.addEventListener("mouseup", end)
    canvas.addEventListener("mouseleave", end)
    canvas.addEventListener("touchstart", start, { passive: false })
    canvas.addEventListener("touchmove", move, { passive: false })
    canvas.addEventListener("touchend", end)
    return () => {
      canvas.removeEventListener("mousedown", start)
      canvas.removeEventListener("mousemove", move)
      canvas.removeEventListener("mouseup", end)
      canvas.removeEventListener("mouseleave", end)
      canvas.removeEventListener("touchstart", start)
      canvas.removeEventListener("touchmove", move)
      canvas.removeEventListener("touchend", end)
    }
  }, [onSign])

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasStrokes.current = false
    onClear()
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={340} height={110}
        style={{ display: "block", width: "100%", height: 110, borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#f8fafc", cursor: "crosshair", touchAction: "none" }} />
      <button onClick={clear}
        style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
        <RotateCcw size={10} />Clear
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CustomerApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const appId = Number(id)
  const [logPage, setLogPage] = useState(0)

  // Agreement state
  const agrPdfs = loadAgrPdfs()
  const agrLangCodes = loadAgrLangs()
  const availableLangs = agrLangCodes
    .map(c => AGR_LANGUAGES.find(l => l.code === c))
    .filter((l): l is typeof AGR_LANGUAGES[0] => !!l && !!agrPdfs[l.code])
  const [agrLang, setAgrLang] = useState(availableLangs[0]?.code ?? "")
  const [signature, setSignature] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [signed, setSigned] = useState(false)

  // Invoice / payment state
  const billing     = loadApplicationBilling(id ?? 0)
  const [invoice, setInvoice] = useState<Invoice | null>(() => loadInvoiceByApp(id ?? 0))
  const stripeConfig = loadStripeConfig()
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null)
  const [evidenceName, setEvidenceName] = useState("")
  const [evidenceUploaded, setEvidenceUploaded] = useState(false)
  const [transactionRef, setTransactionRef] = useState("")
  const [evidencePreview, setEvidencePreview] = useState<{ base64: string; name: string; isImg: boolean } | null>(null)

  const evKey = `hcs_pay_evidence_${id}`

  // Refresh invoice + evidence state when app status changes
  useEffect(() => {
    setInvoice(loadInvoiceByApp(id ?? 0))
    try { const ev = JSON.parse(localStorage.getItem(evKey) || "null"); if (ev) { setEvidenceUploaded(true); setEvidenceName(ev.fileName) } } catch {}
  }, [evKey, id])

  function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => { setEvidenceFile(ev.target?.result as string); setEvidenceName(f.name) }
    r.readAsDataURL(f)
  }

  function submitEvidence() {
    if (!evidenceFile || !id) return
    try {
      addPaymentEvidence(id, {
        base64: evidenceFile,
        fileName: evidenceName,
        mimeType: evidenceFile.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
        uploadedAt: new Date().toISOString(),
        status: 'PENDING',
        transactionRef: transactionRef.trim() || undefined,
      })
      addNotification('office', {
        type: 'info',
        title: 'Payment Evidence Uploaded',
        body: `Customer uploaded payment evidence for application #${id}.${transactionRef.trim() ? ` Ref: ${transactionRef.trim()}` : ''}`,
      })
      setEvidenceUploaded(true)
      setEvidenceFile(null)
      setTransactionRef("")
    } catch (err) {
      console.error('submitEvidence:', err)
      alert('Failed to save evidence — file may be too large. Try a smaller image.')
    }
  }

  const { data: apiApp, isLoading } = useQuery({
    queryKey: ["customer-app", appId],
    queryFn: () => getApplication(appId),
    enabled: !!appId && !isNaN(appId),
  })

  // Fallback to localStorage for local apps
  const localApp = loadLocalApp(id ?? "")
  const app = apiApp ?? localApp
  const isLocalApp = !apiApp && !!localApp

  const { data: company } = useQuery({
    queryKey: ["customer-app-company", appId],
    queryFn: () => getCompanyInfo(appId),
    enabled: !!appId && !isNaN(appId) && !!apiApp,
  })
  useQuery({
    queryKey: ["customer-app-payment", appId],
    queryFn: () => getPaymentStatus(appId),
    enabled: !!appId && !isNaN(appId) && !!apiApp,
  })
  const { data: logsData } = useQuery({
    queryKey: ["customer-app-logs", appId, logPage],
    queryFn: () => getEventLogs(appId, { page: logPage, size: 8 }),
    enabled: !!appId && !isNaN(appId) && !!apiApp,
  })

  const handleSign = useCallback((dataUrl: string) => setSignature(dataUrl), [])
  const handleClear = useCallback(() => setSignature(""), [])

  function submitAgreement() {
    if (!signature || !agreed || !app) return
    const actorName = user?.name ?? "Customer"
    const appNum = app.applicationNumber ?? `#${app.id}`
    const company = app.companyName ?? ""

    // Update status
    const updated = {
      ...app,
      status: "AGREEMENT_REVIEW",
      agreementSignedAt: new Date().toISOString(),
      agreementSignature: signature,
      agreementLanguage: agrLang,
      logs: [...((app as any).logs ?? []), {
        timestamp: new Date().toISOString(),
        action: "Agreement Signed",
        by: actorName,
        note: `Signed in ${AGR_LANGUAGES.find(l => l.code === agrLang)?.label ?? agrLang}`,
        color: "#2563eb",
      }],
    }

    if (isLocalApp) {
      saveLocalApp(updated)
    } else {
      // For API-backed apps store the signature side-data locally
      saveLocalApp({ ...updated, _signedLocally: true })
    }

    addAuditLog({
      applicationId: String(app.id),
      applicationNumber: appNum,
      companyName: company,
      actor: actorName,
      role: "Customer",
      action: "Agreement Signed",
      details: `Customer signed the agreement (${AGR_LANGUAGES.find(l => l.code === agrLang)?.label ?? agrLang})`,
      oldStatus: "AGREEMENT_PENDING",
      newStatus: "AGREEMENT_REVIEW",
      category: "APPLICATION",
    })

    addNotification("office", {
      title: "Agreement Signed",
      body: `${company} has signed the agreement — please review.`,
      type: "info",
    })

    setSigned(true)
  }

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: C.white }} />
          ))}
        </div>
      </CustomerLayout>
    )
  }

  if (!app) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center" style={{ color: C.muted }}>Application not found.</div>
      </CustomerLayout>
    )
  }

  const s = getStatusStyle(app.status)
  const stageIdx = STAGES.findIndex(st => st.key === app.status)
  const terminal = ["REJECTED", "SUSPENDED", "EXPIRED"].includes(app.status)
  const logs = logsData?.content ?? ((app as any).logs ?? [])
  const showAgreement = app.status === "AGREEMENT_PENDING"
  const selectedPdf = agrPdfs[agrLang]
  const selectedLangMeta = AGR_LANGUAGES.find(l => l.code === agrLang)

  return (
    <CustomerLayout>
      <div style={{ padding: "1.75rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        {/* Back */}
        <button onClick={() => navigate("/customer/applications")}
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", marginBottom: 20 }}
          onMouseOver={e => (e.currentTarget.style.color = C.text)}
          onMouseOut={e => (e.currentTarget.style.color = C.muted)}>
          <ArrowLeft size={16} />My Applications
        </button>

        {/* Header card */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: C.cardShadow }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.primary }}>{app.applicationNumber}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "3px 10px", borderRadius: 99, fontWeight: 500, background: s.bg, color: s.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />{s.label}
                </span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#f3f4f6", color: C.muted }}>{app.type}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: C.textDark }}>{app.companyName}</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
                Submitted {app.submittedAt ? formatDate(app.submittedAt) : "—"}
                {app.halalStandard && ` · ${app.halalStandard}`}
              </p>
            </div>
            {app.assignedAuditorName && (
              <div style={{ background: "#f0f7ff", border: "1px solid #dbeef9", borderRadius: 10, padding: "8px 12px", textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Assigned Auditor</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: C.primary }}>{app.assignedAuditorName}</p>
              </div>
            )}
          </div>

          {/* Stage pipeline */}
          {!terminal && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 8 }}>
                {STAGES.map((stage, idx) => {
                  const done    = stageIdx > idx
                  const current = stageIdx === idx
                  return (
                    <div key={stage.key} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, background: done ? "#107c10" : current ? C.accent : "#f0f0f0", border: current ? `2px solid ${C.accent}` : "none", boxShadow: current ? `0 0 0 3px rgba(0,153,188,0.2)` : "none" }}>
                          {done ? <CheckCircle2 size={16} color="#fff" /> : current ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> : <Circle size={12} color="#d1d5db" />}
                        </div>
                        <span style={{ fontSize: 10, color: done ? "#107c10" : current ? C.accent : "#9ca3af", fontWeight: current ? 600 : 400, maxWidth: 60, textAlign: "center", lineHeight: 1.2 }}>{stage.label}</span>
                      </div>
                      {idx < STAGES.length - 1 && <div style={{ height: 2, minWidth: 16, background: idx < stageIdx ? "#107c10" : "#e5e7eb", margin: "0 4px" }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {terminal && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={20} color={s.color} style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, color: s.color }}>
                This application has been <strong>{s.label.toLowerCase()}</strong>.
                {app.status === "REJECTED" && " Please contact support if you wish to appeal."}
              </p>
            </div>
          )}
        </div>

        {/* Company Information | Services & Activities + Application Details */}
        {(() => {
          const ls = (key: string, def: any) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def } catch { return def } }
          const a = app as any
          const PRE_APPROVAL = ["DRAFT", "SUBMITTED", "UNDER_REVIEW"]
          const frozen = !PRE_APPROVAL.includes(app.status)

          const profile   = a.snapshotProfile || ls('hcs_profile', {})
          const regDocs   = a.snapshotRegDocs || ls('hcs_reg_docs', {})
          const cats      = frozen && a.snapshotCategories ? a.snapshotCategories : ls('hcs_categories', []) as string[]
          const acts      = frozen && a.snapshotActivities ? a.snapshotActivities : ls('hcs_activities', []) as string[]
          const desc: string = frozen && a.snapshotDescription != null ? a.snapshotDescription : (localStorage.getItem('hcs_description') || '')
          const standards: string[] = a.selectedStandards  ?? []
          const certCats: string[]  = a.selectedCertCats   ?? []
          const markets: string[]   = a.selectedMarkets    ?? []

          const compEmail   = a.companyEmail  || profile.email      || company?.email  || "-"
          const compPhone   = a.companyPhone  || profile.phone      || company?.phone  || "-"
          const compWeb     = a.companyWeb    || profile.website    || "-"
          const compType    = profile.companyType || a.businessType || company?.companyType || "-"
          const compReg     = profile.companyReg  || a.registrationNumber || company?.registrationNumber || "-"
          const licenseNo   = regDocs.licenseNo     || a.licenseNo     || company?.businessLicenseNo || "-"
          const licExpiry   = regDocs.licenseExpiry || a.licenseExpiry || company?.licenseExpiry || "-"
          const issuingAuth = regDocs.issuingAuth   || a.issuingAuthority || company?.issuingAuthority || "-"
          const vatNo       = regDocs.vatNo || a.vatNo || company?.vatSstNo || "-"
          const sstNo       = regDocs.sstNo || a.sstNo || "-"

          const cardSt = { background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: C.cardShadow, marginBottom: 0 }
          const headSt = { margin: 0, fontSize: "0.65rem" as const, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }

          return (
            <div style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 20 }}>

              {/* Left: Company Information */}
              <div style={{ ...cardSt, flex: "0 0 58%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <p style={headSt}>COMPANY INFORMATION</p>
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic" }}>From registration profile</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  {[
                    { Icon: Building2,    label: "Company Name",        value: app.companyName || "-" },
                    { Icon: Mail,         label: "Email",               value: compEmail },
                    { Icon: Phone,        label: "Phone",               value: compPhone },
                    { Icon: Globe,        label: "Website",             value: compWeb },
                    { Icon: Briefcase,    label: "Company Type",        value: compType },
                    { Icon: Hash,         label: "Registration No",     value: compReg },
                    { Icon: FileText,     label: "Business License No", value: licenseNo },
                    { Icon: CalendarDays, label: "License Expiry",      value: licExpiry },
                    { Icon: Landmark,     label: "Issuing Authority",   value: issuingAuth },
                    { Icon: Receipt,      label: "VAT / SST No",        value: vatNo !== "-" ? vatNo : sstNo },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 16px" }}>
                      <div style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>{r.label}</div>
                        <div style={{ fontSize: "0.83rem", fontWeight: 600, color: r.value === "-" ? "#cbd5e1" : C.textDark }}>{r.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column: Services & Activities + Application Details stacked */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Services & Activities */}
                {(cats.length > 0 || acts.length > 0 || desc) && (
                  <div style={cardSt}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                      <p style={headSt}>SERVICES & ACTIVITIES</p>
                      <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic" }}>From registration profile</span>
                    </div>
                    <div>
                      {([
                        cats.length > 0 && { Icon: Tags,      label: "Activity Category",   value: cats.join("  ·  ") },
                        acts.length > 0 && { Icon: List,      label: "Specific Activities", value: acts.join("  ·  ") },
                        desc           && { Icon: AlignLeft,  label: "Company Description", value: desc },
                      ] as any[]).filter(Boolean).map((r: any) => (
                        <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px" }}>
                          <div style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>{r.label}</div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: r.value === "-" ? "#cbd5e1" : C.textDark, lineHeight: 1.55, wordBreak: "break-word" as const }}>{r.value || "-"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Details */}
                <div style={{ ...cardSt, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                    <p style={headSt}>APPLICATION DETAILS</p>
                    <span style={{ fontSize: "0.68rem", padding: "2px 10px", borderRadius: 20, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    {[
                      { Icon: Hash,         label: "Application No",         value: app.applicationNumber || `#${app.id}` },
                      { Icon: Briefcase,    label: "Type",                   value: app.type || "New Application" },
                      { Icon: CalendarDays, label: "Submitted",              value: app.submittedAt ? formatDate(app.submittedAt) : (app as any).savedAt ? formatDate((app as any).savedAt) : "-" },
                      { Icon: Shield,       label: "Certification Standard", value: standards.length > 0 ? standards.join(" · ") : "-" },
                      { Icon: Tags,         label: "Certification Category", value: certCats.length > 0 ? certCats.join(" · ") : "-" },
                      { Icon: Building2,    label: "Target Markets",         value: markets.length > 0 ? markets.join(", ") : "-" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px" }}>
                        <div style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 3 }}>{r.label}</div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: r.value === "-" ? "#cbd5e1" : C.textDark, wordBreak: "break-word" as const }}>{r.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )
        })()}

        {/* ── AGREEMENT SECTION ──────────────────────────────────────────────── */}
        {showAgreement && (
          <div style={{ background: C.white, border: "1.5px solid #2563eb", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(37,99,235,0.1)" }}>
            {/* Banner */}
            <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <FileText size={20} color="#fff" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>Action Required — Sign Agreement</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.75)" }}>
                  Your application has been approved. Please read and sign the agreement below to proceed.
                </p>
              </div>
            </div>

            <div style={{ padding: 22 }}>
              {signed ? (
                /* ── Signed confirmation ── */
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 size={28} color="#16a34a" />
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Agreement Signed Successfully</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: C.muted }}>Your signed agreement has been submitted to HCB for review.</p>
                </div>
              ) : (
                <>
                  {/* Language selector */}
                  {availableLangs.length > 0 ? (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                        <Globe size={14} color="#2563eb" />Choose Agreement Language
                      </label>
                      <select value={agrLang} onChange={e => setAgrLang(e.target.value)}
                        style={{ padding: "9px 14px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", fontFamily: "inherit", outline: "none", minWidth: 240 }}>
                        {availableLangs.map(l => (
                          <option key={l.code} value={l.code}>{l.flag}  {l.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ padding: "12px 16px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                      No agreement PDF has been uploaded by HCB yet. Please check back later.
                    </div>
                  )}

                  {/* PDF viewer */}
                  {selectedPdf && (
                    <div>
                      <iframe
                        key={agrLang}
                        src={selectedPdf.pdfData}
                        title="Agreement PDF"
                        style={{ width: "100%", height: "calc(100vh - 320px)", minHeight: 500, border: `1px solid ${C.border}`, borderRadius: "10px 10px 0 0", display: "block", background: "#f8fafc" }}
                      />

                      {/* ── Last-page signature section — centred below the PDF ── */}
                      <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", background: "#fff", padding: "24px 28px" }}>
                        {/* Section label */}
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>— Signature Page —</p>
                          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Both parties must sign below. Please read the full agreement before signing.</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          {/* LEFT — HCB signature placeholder */}
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>HCB Authorised Signatory</p>
                            <div style={{ height: 110, borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Signed by HCB</p>
                            </div>
                            <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>Halal Certification Body</p>
                              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Date: {new Date().toLocaleDateString("en-GB")}</p>
                            </div>
                          </div>

                          {/* RIGHT — Customer signature (interactive) */}
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              <PenLine size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                              Customer Signature {selectedLangMeta && <span style={{ marginLeft: 4 }}>{selectedLangMeta.flag}</span>}
                            </p>
                            <SignatureCanvas onSign={handleSign} onClear={handleClear} />
                            <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8, marginTop: 10 }}>
                              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{app.companyName}</p>
                              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Date: {new Date().toLocaleDateString("en-GB")}</p>
                            </div>
                          </div>
                        </div>

                        {/* Agree + submit */}
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" as const }}>
                          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                              style={{ marginTop: 2, width: 14, height: 14, accentColor: "#2563eb", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.45 }}>
                              I have read and agree to all terms and conditions in this agreement.
                            </span>
                          </label>
                          <button
                            onClick={submitAgreement}
                            disabled={!signature || !agreed}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: (!signature || !agreed) ? "#e2e8f0" : "#2563eb", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: (!signature || !agreed) ? "#94a3b8" : "#fff", cursor: (!signature || !agreed) ? "not-allowed" : "pointer", transition: "background 0.15s", flexShrink: 0 }}>
                            <Send size={14} />Sign &amp; Submit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Billing & Payments ── always visible once submitted ── */}
        {billing && (() => {
          const source      = invoice && invoice.status !== 'CANCELLED' ? invoice : null
          const lineItems   = source ? source.lineItems   : billing.lineItems
          const vatPct      = source ? source.vatPct      : billing.vatPct
          const vatAmount   = source ? source.vatAmount   : billing.vatAmount
          const total       = source ? source.total       : billing.total
          const currency    = source ? source.currency    : billing.currency
          const ivStyle     = source ? invoiceStatusStyle(source.status) : null
          // Payment is active only after agreement is approved (PENDING_PAYMENT) and invoice is issued
          const canPay      = app.status === "PENDING_PAYMENT" && !!source && (source.status === 'ISSUED' || source.status === 'OVERDUE')
          const isPaid      = !!source && source.status === 'PAID'
          const fmt         = (n: number) => `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

          return (
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.cardShadow }}>

                {/* Card header */}
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CreditCard size={16} color={C.accent} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.textDark }}>
                        {source ? source.invoiceNumber : "Fee Summary"}
                      </p>
                      {source
                        ? <p style={{ margin: "1px 0 0", fontSize: 12, color: C.muted }}>Issued {formatInvoiceDate(source.issuedAt)} · Due {formatInvoiceDate(source.dueDate)}</p>
                        : <p style={{ margin: "1px 0 0", fontSize: 12, color: C.muted }}>Estimated fees for your application</p>
                      }
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ivStyle && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: ivStyle.bg, color: ivStyle.color }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: ivStyle.dot }} />{source!.status}
                      </span>
                    )}
                    {!source && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>
                        Invoice pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Line items */}
                <div style={{ padding: "16px 20px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 4 }}>
                    <tbody>
                      {lineItems.map((li, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "7px 0", color: C.textDark }}>{li.description}</td>
                          <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 500 }}>{fmt(li.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: "7px 0", color: C.muted, fontSize: 12 }}>VAT ({vatPct}%)</td>
                        <td style={{ padding: "7px 0", textAlign: "right", color: C.muted }}>{fmt(vatAmount)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f8fafc" }}>
                        <td style={{ padding: "10px 8px", fontWeight: 700, fontSize: 14 }}>Total</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, fontSize: 17, color: C.accent }}>{fmt(total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Paid */}
                  {isPaid && source && (
                    <div style={{ marginTop: 12, padding: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={18} color="#15803d" />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#15803d" }}>Payment Received</p>
                        {source.paymentDate && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#166534" }}>on {formatInvoiceDate(source.paymentDate)}{source.paymentReference ? ` · Ref: ${source.paymentReference}` : ''}</p>}
                      </div>
                    </div>
                  )}

                  {/* Stripe — only when invoice issued and PENDING_PAYMENT */}
                  {canPay && stripeConfig.enabled && stripeConfig.publishableKey && (
                    <button
                      onClick={() => alert(`Stripe checkout for ${fmt(total)} — integrate with loadStripe("${stripeConfig.publishableKey}")`)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, padding: "13px 24px", background: "#635bff", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
                      <CreditCard size={16} />Pay {fmt(total)} with Stripe
                    </button>
                  )}

                  {/* Bank transfer evidence — always available once billing exists */}
                  {!isPaid && (
                    <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.border}` }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: C.textDark }}>Upload Payment Evidence</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>Paid by bank transfer? Upload your receipt or transfer confirmation.</p>
                      </div>
                      <div style={{ padding: 16 }}>
                        {evidenceUploaded ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <CheckCircle2 size={16} color="#15803d" />
                            <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>Evidence uploaded: <strong>{evidenceName}</strong></span>
                            <button onClick={() => {
                              const src = invoice?.paymentEvidenceBase64 ?? (() => { try { return JSON.parse(localStorage.getItem(`hcs_pay_evidence_${id}`) || "null")?.base64 } catch { return null } })()
                              if (src) setEvidencePreview({ base64: src, name: evidenceName, isImg: /\.(png|jpe?g|gif|webp)/i.test(evidenceName) || src.startsWith("data:image") })
                            }} style={{ padding: "4px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#1d4ed8", cursor: "pointer" }}>
                              View
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1d4ed8", cursor: "pointer" }}>
                                <Upload size={14} />
                                {evidenceFile ? evidenceName : "Choose file"}
                                <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleEvidenceUpload} />
                              </label>
                              {evidenceFile && (
                                <button onClick={() => { setEvidenceFile(null); setEvidenceName(""); setTransactionRef("") }}
                                  style={{ padding: "8px 10px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer" }}>
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <input
                                value={transactionRef}
                                onChange={e => setTransactionRef(e.target.value)}
                                placeholder="Transaction / reference number (optional)"
                                style={{ flex: 1, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textDark, fontFamily: "inherit", outline: "none" }}
                              />
                              {evidenceFile && (
                                <button onClick={submitEvidence}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                                  <Send size={13} /> Submit
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Activity log */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.cardShadow }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textDark }}>Activity Timeline</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>All updates on your application</p>
          </div>
          {logs.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Clock size={28} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No activity yet</p>
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              <ol style={{ borderLeft: `2px solid ${C.bg}`, paddingLeft: 24, margin: 0, listStyle: "none" }}>
                {logs.map((log: any, i: number) => (
                  <li key={log.id ?? i} style={{ position: "relative", marginBottom: 20 }}>
                    <div style={{ position: "absolute", left: -32, top: 2, width: 16, height: 16, borderRadius: "50%", background: C.accent, border: "2px solid #fff" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textDark }}>{log.event ?? log.action}</p>
                        {(log.description ?? log.note) && <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{log.description ?? log.note}</p>}
                      </div>
                      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{formatDateTime ? formatDateTime(log.performedAt ?? log.timestamp) : (log.performedAt ?? log.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ol>
              {(logsData?.totalPages ?? 0) > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                  <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)}
                    style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, color: C.text, background: C.white, cursor: "pointer", opacity: logPage === 0 ? 0.4 : 1 }}>Previous</button>
                  <button disabled={logPage >= (logsData?.totalPages ?? 1) - 1} onClick={() => setLogPage(p => p + 1)}
                    style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, color: C.text, background: C.white, cursor: "pointer", opacity: logPage >= (logsData?.totalPages ?? 1) - 1 ? 0.4 : 1 }}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence preview popup */}
      {evidencePreview && (
        <div onClick={() => setEvidencePreview(null)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(900px,92vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
              <span style={{ flex:1, fontSize:"0.86rem", fontWeight:700, color:"#0f172a" }}>{evidencePreview.name}</span>
              <button onClick={() => setEvidencePreview(null)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#64748b" }}>✕</button>
            </div>
            <div style={{ flex:1, overflow:"auto", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", minHeight:300 }}>
              {evidencePreview.isImg
                ? <img src={evidencePreview.base64} alt={evidencePreview.name} style={{ maxWidth:"100%", maxHeight:"82vh", objectFit:"contain", display:"block" }} />
                : <iframe src={evidencePreview.base64} title={evidencePreview.name} style={{ width:"100%", height:"80vh", border:"none", display:"block" }} />
              }
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}
