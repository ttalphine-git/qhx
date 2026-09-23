import { useState, useRef, useEffect } from "react"
import {
  Globe, X, Search, MapPin, Info, BookOpen, Users,
  MessageSquare, Scale, CalendarCheck, Plus, Save, Trash2, ChevronDown, ChevronUp,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import type {
  AccreditationScope, AuditorCompetenceRecord,
  ComplaintRecord, AppealRecord, SurveillanceRecord,
} from "@/types"

// ─── storage helpers ──────────────────────────────────────────────────────────
function lsArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[] }
  catch { return [] }
}
function lsSave(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

// ─── All markets ──────────────────────────────────────────────────────────────
const ALL_MARKETS = [
  "Malaysia","Indonesia","Singapore","Brunei","Thailand","Philippines","Vietnam","Myanmar","Cambodia","Laos",
  "United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Jordan","Lebanon","Iraq","Yemen","Syria","Palestine",
  "Egypt","Morocco","Tunisia","Algeria","Libya","Sudan","Senegal","Nigeria",
  "Turkey","Iran","Pakistan","Bangladesh","India","Sri Lanka","Maldives",
  "United Kingdom","France","Germany","Netherlands","Belgium","Spain","Italy","Sweden","Norway","Denmark","Finland","Switzerland","Austria","Poland","Bosnia and Herzegovina","Kazakhstan","Uzbekistan","Azerbaijan",
  "United States","Canada","Australia","New Zealand",
  "China","Japan","South Korea",
  "South Africa","Kenya","Ghana","Tanzania","Uganda","Ethiopia",
  "Others",
]

const HALAL_STANDARDS = ["GSO 2055-1", "GSO 2055-2", "OIC-SMIIC 1", "OIC-SMIIC 2", "UAE.S 2055-1", "MS 1500", "JAKIM", "MUI", "HAS 23000", "LPPOM", "IFANCA", "HFA", "Others"]
const PRODUCT_CATEGORIES = ["Food & Beverage", "Meat & Poultry", "Seafood", "Dairy", "Pharmaceuticals", "Cosmetics & Personal Care", "Food Ingredients & Additives", "Packaging Materials", "Logistics & Storage", "Slaughterhouse", "Restaurant & Food Service", "Others"]

// ─── Small form helpers ───────────────────────────────────────────────────────
function InputF({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)} />
    </div>
  )
}
function TextF({ label, value, onChange, rows = 2, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }}
        onFocus={e => (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)} />
    </div>
  )
}
function SelectF({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
        <option value="">— select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
function SaveBtn({ onClick, label = "Save" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      onMouseOver={e => (e.currentTarget.style.background = C.primaryHover)}
      onMouseOut={e => (e.currentTarget.style.background = C.primary)}>
      <Save size={13} />{label}
    </button>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16, ...(padded ? {} : {}) }}>{children}</div>
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type QMSTab = "markets" | "scopes" | "auditors" | "complaints" | "appeals" | "surveillance"

const QMS_TABS: { key: QMSTab; label: string; icon: React.ElementType }[] = [
  { key: "markets",      label: "Accredited Markets",   icon: Globe         },
  { key: "scopes",       label: "Accreditation Scopes", icon: BookOpen      },
  { key: "auditors",     label: "Auditor Competence",   icon: Users         },
  { key: "complaints",   label: "Complaints",           icon: MessageSquare },
  { key: "appeals",      label: "Appeals",              icon: Scale         },
  { key: "surveillance", label: "Surveillance",         icon: CalendarCheck },
]

export default function AccreditationsPage() {
  const [qmsTab, setQMSTab] = useState<QMSTab>("markets")

  // ── Markets ──
  const [markets, setMarkets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("hcs_accreditations") || "[]") }
    catch { return [] }
  })
  const [mktSearch, setMktSearch] = useState("")
  const [showMktDrop, setShowMktDrop] = useState(false)
  const mktRef = useRef<HTMLDivElement>(null)

  // ── Accreditation Scopes ──
  const [scopes, setScopes] = useState<AccreditationScope[]>(() => lsArr("hcs_acc_scopes"))
  const [showScopeForm, setShowScopeForm] = useState(false)
  const [scopeForm, setScopeForm] = useState<Omit<AccreditationScope, "id">>({ standard: "", category: "", countries: "", accreditationBody: "", accreditationNumber: "", accreditationDate: "", expiryDate: "", status: "ACTIVE" })

  // ── Auditor Competence ──
  const [auditors, setAuditors] = useState<AuditorCompetenceRecord[]>(() => lsArr("hcs_auditor_competence"))
  const [showAuditorForm, setShowAuditorForm] = useState(false)
  const [auditorForm, setAuditorForm] = useState<Omit<AuditorCompetenceRecord, "id">>({ auditorName: "", qualifications: "", approvedSectors: "", approvedStandards: "", languages: "", lastTrainingDate: "", competenceValidUntil: "", conflictDeclarations: "" })
  const [expandedAuditor, setExpandedAuditor] = useState<string | null>(null)

  // ── Complaints ──
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => lsArr("hcs_complaints"))
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [cForm, setCForm] = useState<Omit<ComplaintRecord, "id" | "complaintNumber">>({ complainantName: "", complainantEmail: "", category: "", description: "", receivedAt: new Date().toISOString().slice(0, 10), status: "OPEN", resolution: "", closedAt: "" })

  // ── Appeals ──
  const [appeals, setAppeals] = useState<AppealRecord[]>(() => lsArr("hcs_appeals"))
  const [showAppealForm, setShowAppealForm] = useState(false)
  const [aForm, setAForm] = useState<Omit<AppealRecord, "id" | "appealNumber">>({ appellantName: "", relatedCertificate: "", grounds: "", receivedAt: new Date().toISOString().slice(0, 10), status: "RECEIVED", decision: "", decidedAt: "" })

  // ── Surveillance ──
  const [survRecords, setSurvRecords] = useState<SurveillanceRecord[]>(() => lsArr("hcs_surveillance"))
  const [showSurvForm, setShowSurvForm] = useState(false)
  const [sForm, setSForm] = useState<Omit<SurveillanceRecord, "id">>({ certificateNumber: "", companyName: "", survType: "ANNOUNCED", scheduledDate: "", assignedTo: "", status: "SCHEDULED", notes: "" })

  useEffect(() => {
    localStorage.setItem("hcs_accreditations", JSON.stringify(markets))
  }, [markets])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (mktRef.current && !mktRef.current.contains(e.target as Node)) setShowMktDrop(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Scope actions ──
  const saveScope = () => {
    const updated = [...scopes, { ...scopeForm, id: uid() }]
    setScopes(updated); lsSave("hcs_acc_scopes", updated)
    setScopeForm({ standard: "", category: "", countries: "", accreditationBody: "", accreditationNumber: "", accreditationDate: "", expiryDate: "", status: "ACTIVE" })
    setShowScopeForm(false)
  }
  const removeScope = (id: string) => { const u = scopes.filter(s => s.id !== id); setScopes(u); lsSave("hcs_acc_scopes", u) }

  // ── Auditor actions ──
  const saveAuditor = () => {
    const updated = [...auditors, { ...auditorForm, id: uid() }]
    setAuditors(updated); lsSave("hcs_auditor_competence", updated)
    setAuditorForm({ auditorName: "", qualifications: "", approvedSectors: "", approvedStandards: "", languages: "", lastTrainingDate: "", competenceValidUntil: "", conflictDeclarations: "" })
    setShowAuditorForm(false)
  }
  const removeAuditor = (id: string) => { const u = auditors.filter(a => a.id !== id); setAuditors(u); lsSave("hcs_auditor_competence", u) }

  // ── Complaint actions ──
  const saveComplaint = () => {
    const updated = [...complaints, { ...cForm, id: uid(), complaintNumber: `CMP-${Date.now().toString().slice(-5)}` }]
    setComplaints(updated); lsSave("hcs_complaints", updated)
    setCForm({ complainantName: "", complainantEmail: "", category: "", description: "", receivedAt: new Date().toISOString().slice(0, 10), status: "OPEN", resolution: "", closedAt: "" })
    setShowComplaintForm(false)
  }
  const updateComplaintStatus = (id: string, status: ComplaintRecord["status"]) => {
    const updated = complaints.map(c => c.id === id ? { ...c, status } : c)
    setComplaints(updated); lsSave("hcs_complaints", updated)
  }

  // ── Appeal actions ──
  const saveAppeal = () => {
    const updated = [...appeals, { ...aForm, id: uid(), appealNumber: `APL-${Date.now().toString().slice(-5)}` }]
    setAppeals(updated); lsSave("hcs_appeals", updated)
    setAForm({ appellantName: "", relatedCertificate: "", grounds: "", receivedAt: new Date().toISOString().slice(0, 10), status: "RECEIVED", decision: "", decidedAt: "" })
    setShowAppealForm(false)
  }
  const updateAppealStatus = (id: string, status: AppealRecord["status"]) => {
    const updated = appeals.map(a => a.id === id ? { ...a, status } : a)
    setAppeals(updated); lsSave("hcs_appeals", updated)
  }

  // ── Surveillance actions ──
  const saveSurv = () => {
    const updated = [...survRecords, { ...sForm, id: uid() }]
    setSurvRecords(updated); lsSave("hcs_surveillance", updated)
    setSForm({ certificateNumber: "", companyName: "", survType: "ANNOUNCED", scheduledDate: "", assignedTo: "", status: "SCHEDULED", notes: "" })
    setShowSurvForm(false)
  }
  const updateSurvStatus = (id: string, status: SurveillanceRecord["status"]) => {
    const updated = survRecords.map(s => s.id === id ? { ...s, status } : s)
    setSurvRecords(updated); lsSave("hcs_surveillance", updated)
  }

  const mktFiltered = ALL_MARKETS.filter(m => m.toLowerCase().includes(mktSearch.toLowerCase()) && !markets.includes(m))

  return (
    <OfficeLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* Page header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Accreditation & Quality Management</h1>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
            HCB accreditation scope, auditor competence, market recognition, complaints, appeals, and surveillance records.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `2px solid ${C.border}`, overflowX: "auto", paddingBottom: 0 }}>
          {QMS_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setQMSTab(key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: 13, fontWeight: qmsTab === key ? 600 : 500, background: "none", border: "none", borderBottom: qmsTab === key ? `2px solid ${C.primary}` : "2px solid transparent", color: qmsTab === key ? C.primary : C.muted, cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2, fontFamily: "inherit" }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* ── Markets Tab ── */}
        {qmsTab === "markets" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 9, marginBottom: 18 }}>
              <Info size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#1e40af", lineHeight: 1.6 }}>
                Accredited markets appear as selectable Target Market options in customer applications and registration forms.
              </p>
            </div>

            <Card>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>ADD ACCREDITED MARKET</p>
              </div>
              <div style={{ padding: 16 }}>
                <div ref={mktRef} style={{ position: "relative", maxWidth: 400 }}>
                  <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                  <input type="text" value={mktSearch} placeholder="Search country or market…"
                    onChange={e => { setMktSearch(e.target.value); setShowMktDrop(true) }}
                    onFocus={e => { setShowMktDrop(true); e.currentTarget.style.borderColor = C.primary }}
                    style={{ width: "100%", height: 38, padding: "0 11px 0 34px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: "0.8125rem", color: "#111827", outline: "none", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
                  {showMktDrop && mktFiltered.length > 0 && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 300, maxHeight: 220, overflowY: "auto" }}>
                      {mktFiltered.map(m => (
                        <button key={m} type="button" onMouseDown={() => { setMarkets(prev => [...prev, m]); setMktSearch(""); setShowMktDrop(false) }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8125rem", color: "#111827", fontFamily: "inherit" }}
                          onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                          <Globe size={12} color="#94a3b8" />{m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={14} color={C.primary} />
                  <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "#111827" }}>Accredited Markets</span>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 10px", borderRadius: 20 }}>{markets.length} market{markets.length !== 1 ? "s" : ""}</span>
              </div>
              {markets.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <Globe size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
                  <p style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>No accredited markets yet</p>
                </div>
              ) : (
                <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {markets.map(m => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 12px", borderRadius: 999, background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                      <Globe size={11} color="#2563eb" />
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#2563eb" }}>{m}</span>
                      <button type="button" onClick={() => setMarkets(prev => prev.filter(x => x !== m))}
                        style={{ width: 16, height: 16, borderRadius: "50%", background: "#bfdbfe", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                        <X size={9} color="#2563eb" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Accreditation Scopes Tab ── */}
        {qmsTab === "scopes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Track your HCB's formal accreditation scope by standard, product category, and market.</p>
              <button onClick={() => setShowScopeForm(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} />Add Scope
              </button>
            </div>

            {showScopeForm && (
              <Card>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <SelectF label="Halal Standard" value={scopeForm.standard} onChange={v => setScopeForm(f => ({ ...f, standard: v }))} options={HALAL_STANDARDS.map(s => ({ value: s, label: s }))} />
                    <SelectF label="Product Category" value={scopeForm.category} onChange={v => setScopeForm(f => ({ ...f, category: v }))} options={PRODUCT_CATEGORIES.map(c => ({ value: c, label: c }))} />
                    <InputF label="Countries / Markets Covered" value={scopeForm.countries} onChange={v => setScopeForm(f => ({ ...f, countries: v }))} placeholder="e.g. UAE, Saudi Arabia, Malaysia" />
                    <InputF label="Accreditation Body" value={scopeForm.accreditationBody} onChange={v => setScopeForm(f => ({ ...f, accreditationBody: v }))} placeholder="e.g. EIAC, DAkkS, UKAS" />
                    <InputF label="Accreditation Number" value={scopeForm.accreditationNumber} onChange={v => setScopeForm(f => ({ ...f, accreditationNumber: v }))} placeholder="e.g. ACC-HAL-2024-001" />
                    <SelectF label="Status" value={scopeForm.status} onChange={v => setScopeForm(f => ({ ...f, status: v as AccreditationScope["status"] }))} options={[{ value: "ACTIVE", label: "Active" }, { value: "EXPIRED", label: "Expired" }, { value: "PENDING_RENEWAL", label: "Pending Renewal" }]} />
                    <InputF label="Accreditation Date" value={scopeForm.accreditationDate} onChange={v => setScopeForm(f => ({ ...f, accreditationDate: v }))} type="date" />
                    <InputF label="Expiry Date" value={scopeForm.expiryDate} onChange={v => setScopeForm(f => ({ ...f, expiryDate: v }))} type="date" />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SaveBtn onClick={saveScope} label="Add Scope" />
                    <button onClick={() => setShowScopeForm(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              </Card>
            )}

            {scopes.length === 0 && !showScopeForm ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <BookOpen size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: C.muted }}>No accreditation scopes defined yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {scopes.map(s => {
                  const st = getStatusStyle(s.status)
                  return (
                    <div key={s.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: C.textDark }}>{s.standard}</span>
                          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: "#f0f7ff", color: C.primary }}>{s.category}</span>
                          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                          {s.countries && <span>Markets: {s.countries}</span>}
                          {s.accreditationBody && <span>by {s.accreditationBody}</span>}
                          {s.accreditationNumber && <span>#{s.accreditationNumber}</span>}
                          {s.expiryDate && <span>Expires: {formatDate(s.expiryDate)}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeScope(s.id)} style={{ padding: "4px 8px", background: "#fde7e9", color: "#d13438", border: "none", borderRadius: 6, cursor: "pointer" }}><Trash2 size={13} /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Auditor Competence Tab ── */}
        {qmsTab === "auditors" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Maintain auditor qualification, sector competence, approved standards, and conflict-of-interest declarations.</p>
              <button onClick={() => setShowAuditorForm(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} />Add Auditor Record
              </button>
            </div>

            {showAuditorForm && (
              <Card>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <InputF label="Auditor Full Name *" value={auditorForm.auditorName} onChange={v => setAuditorForm(f => ({ ...f, auditorName: v }))} placeholder="Full name" />
                    <InputF label="Qualifications / Certifications" value={auditorForm.qualifications} onChange={v => setAuditorForm(f => ({ ...f, qualifications: v }))} placeholder="e.g. ISO 22000 Lead Auditor, FSSC" />
                    <InputF label="Approved Sectors" value={auditorForm.approvedSectors} onChange={v => setAuditorForm(f => ({ ...f, approvedSectors: v }))} placeholder="e.g. Food, Pharmaceuticals, Logistics" />
                    <InputF label="Approved Halal Standards" value={auditorForm.approvedStandards} onChange={v => setAuditorForm(f => ({ ...f, approvedStandards: v }))} placeholder="e.g. GSO 2055-1, MS 1500" />
                    <InputF label="Languages" value={auditorForm.languages} onChange={v => setAuditorForm(f => ({ ...f, languages: v }))} placeholder="e.g. English, Arabic, Malay" />
                    <InputF label="Last Training Date" value={auditorForm.lastTrainingDate} onChange={v => setAuditorForm(f => ({ ...f, lastTrainingDate: v }))} type="date" />
                    <InputF label="Competence Valid Until" value={auditorForm.competenceValidUntil} onChange={v => setAuditorForm(f => ({ ...f, competenceValidUntil: v }))} type="date" />
                  </div>
                  <TextF label="Conflict of Interest Declarations" value={auditorForm.conflictDeclarations} onChange={v => setAuditorForm(f => ({ ...f, conflictDeclarations: v }))} rows={2} placeholder="Declare any companies or relationships that create a conflict of interest for this auditor…" />
                  <div style={{ display: "flex", gap: 8 }}>
                    <SaveBtn onClick={saveAuditor} label="Add Auditor" />
                    <button onClick={() => setShowAuditorForm(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              </Card>
            )}

            {auditors.length === 0 && !showAuditorForm ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <Users size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: C.muted }}>No auditor competence records yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {auditors.map(a => {
                  const isExp = expandedAuditor === a.id
                  return (
                    <div key={a.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                        onClick={() => setExpandedAuditor(isExp ? null : a.id)}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0f7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
                          {a.auditorName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: C.textDark, marginBottom: 2 }}>{a.auditorName}</p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {a.approvedSectors && <span style={{ fontSize: 11, color: C.muted }}>{a.approvedSectors}</span>}
                            {a.competenceValidUntil && <span style={{ fontSize: 11, color: C.muted }}>· Valid until {formatDate(a.competenceValidUntil)}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {isExp ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
                          <button onClick={e => { e.stopPropagation(); removeAuditor(a.id) }} style={{ padding: "3px 7px", background: "#fde7e9", color: "#d13438", border: "none", borderRadius: 6, cursor: "pointer" }}><Trash2 size={12} /></button>
                        </div>
                      </div>
                      {isExp && (
                        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                            {[
                              ["Qualifications", a.qualifications],
                              ["Approved Standards", a.approvedStandards],
                              ["Languages", a.languages],
                              ["Last Training", a.lastTrainingDate ? formatDate(a.lastTrainingDate) : ""],
                              ["Conflict Declarations", a.conflictDeclarations],
                            ].filter(([, v]) => v).map(([label, value]) => (
                              <div key={label}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
                                <p style={{ fontSize: 13, color: C.textDark }}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Complaints Tab ── */}
        {qmsTab === "complaints" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Register and track complaints from clients, certified companies, or third parties.</p>
              <button onClick={() => setShowComplaintForm(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} />Register Complaint
              </button>
            </div>

            {showComplaintForm && (
              <Card>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <InputF label="Complainant Name" value={cForm.complainantName} onChange={v => setCForm(f => ({ ...f, complainantName: v }))} />
                    <InputF label="Complainant Email" value={cForm.complainantEmail} onChange={v => setCForm(f => ({ ...f, complainantEmail: v }))} type="email" />
                    <SelectF label="Category" value={cForm.category} onChange={v => setCForm(f => ({ ...f, category: v }))} options={[
                      { value: "CERTIFICATION_DECISION", label: "Certification Decision" },
                      { value: "AUDITOR_CONDUCT", label: "Auditor Conduct" },
                      { value: "PROCESS", label: "Process / Procedure" },
                      { value: "CERTIFICATE_MISUSE", label: "Certificate Misuse" },
                      { value: "OTHER", label: "Other" },
                    ]} />
                    <InputF label="Date Received" value={cForm.receivedAt} onChange={v => setCForm(f => ({ ...f, receivedAt: v }))} type="date" />
                  </div>
                  <TextF label="Complaint Description *" value={cForm.description} onChange={v => setCForm(f => ({ ...f, description: v }))} rows={3} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <SaveBtn onClick={saveComplaint} label="Register" />
                    <button onClick={() => setShowComplaintForm(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              </Card>
            )}

            {complaints.length === 0 && !showComplaintForm ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <MessageSquare size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: C.muted }}>No complaints registered</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {complaints.map(c => {
                  const st = getStatusStyle(c.status)
                  return (
                    <div key={c.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.primary }}>{c.complaintNumber}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: C.textDark }}>{c.complainantName}</span>
                            {c.category && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: "#f0f7ff", color: C.primary }}>{c.category.replace(/_/g, " ")}</span>}
                            <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                          </div>
                          <p style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{c.description}</p>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: C.muted }}>Received: {formatDate(c.receivedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>Status:</span>
                        {(["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"] as const).map(s => (
                          <button key={s} onClick={() => updateComplaintStatus(c.id, s)}
                            style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${c.status === s ? "#107c10" : C.border}`, background: c.status === s ? "#e6f4e6" : "#fff", color: c.status === s ? "#107c10" : C.muted, fontSize: 11, fontWeight: c.status === s ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Appeals Tab ── */}
        {qmsTab === "appeals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Record and manage appeals against certification decisions. Appeals require panel review independent of the original decision maker.</p>
              <button onClick={() => setShowAppealForm(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} />Register Appeal
              </button>
            </div>

            {showAppealForm && (
              <Card>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <InputF label="Appellant Name" value={aForm.appellantName} onChange={v => setAForm(f => ({ ...f, appellantName: v }))} />
                    <InputF label="Related Certificate Number" value={aForm.relatedCertificate} onChange={v => setAForm(f => ({ ...f, relatedCertificate: v }))} placeholder="e.g. HCB-HAL-00042" />
                    <InputF label="Date Received" value={aForm.receivedAt} onChange={v => setAForm(f => ({ ...f, receivedAt: v }))} type="date" />
                  </div>
                  <TextF label="Grounds for Appeal *" value={aForm.grounds} onChange={v => setAForm(f => ({ ...f, grounds: v }))} rows={3} placeholder="Describe the basis and grounds for this appeal…" />
                  <div style={{ display: "flex", gap: 8 }}>
                    <SaveBtn onClick={saveAppeal} label="Register Appeal" />
                    <button onClick={() => setShowAppealForm(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              </Card>
            )}

            {appeals.length === 0 && !showAppealForm ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <Scale size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: C.muted }}>No appeals registered</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {appeals.map(a => {
                  const st = getStatusStyle(a.status)
                  return (
                    <div key={a.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.primary }}>{a.appealNumber}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: C.textDark }}>{a.appellantName}</span>
                        {a.relatedCertificate && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: "#e6f4e6", color: "#107c10" }}>Cert: {a.relatedCertificate}</span>}
                        <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{a.grounds}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>Status:</span>
                        {(["RECEIVED", "PANEL_REVIEW", "UPHELD", "DISMISSED", "WITHDRAWN"] as const).map(s => (
                          <button key={s} onClick={() => updateAppealStatus(a.id, s)}
                            style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${a.status === s ? "#107c10" : C.border}`, background: a.status === s ? "#e6f4e6" : "#fff", color: a.status === s ? "#107c10" : C.muted, fontSize: 11, fontWeight: a.status === s ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Surveillance Tab ── */}
        {qmsTab === "surveillance" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Schedule and track surveillance audits, unannounced inspections, document reviews, and renewal visits for certified companies.</p>
              <button onClick={() => setShowSurvForm(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} />Schedule Surveillance
              </button>
            </div>

            {showSurvForm && (
              <Card>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <InputF label="Certificate Number" value={sForm.certificateNumber} onChange={v => setSForm(f => ({ ...f, certificateNumber: v }))} placeholder="e.g. HCB-HAL-00042" />
                    <InputF label="Company Name" value={sForm.companyName} onChange={v => setSForm(f => ({ ...f, companyName: v }))} />
                    <SelectF label="Surveillance Type" value={sForm.survType} onChange={v => setSForm(f => ({ ...f, survType: v as SurveillanceRecord["survType"] }))} options={[
                      { value: "ANNOUNCED", label: "Announced Surveillance Audit" },
                      { value: "UNANNOUNCED", label: "Unannounced Inspection" },
                      { value: "DOCUMENT_REVIEW", label: "Document Review" },
                    ]} />
                    <InputF label="Scheduled Date" value={sForm.scheduledDate} onChange={v => setSForm(f => ({ ...f, scheduledDate: v }))} type="date" />
                    <InputF label="Assigned To" value={sForm.assignedTo} onChange={v => setSForm(f => ({ ...f, assignedTo: v }))} placeholder="Auditor or reviewer name" />
                  </div>
                  <TextF label="Notes" value={sForm.notes} onChange={v => setSForm(f => ({ ...f, notes: v }))} rows={2} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <SaveBtn onClick={saveSurv} label="Schedule" />
                    <button onClick={() => setShowSurvForm(false)} style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              </Card>
            )}

            {survRecords.length === 0 && !showSurvForm ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <CalendarCheck size={32} color="#d1d5db" style={{ margin: "0 auto 10px" }} />
                <p style={{ color: C.muted }}>No surveillance records scheduled</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {survRecords.map(s => {
                  const st = getStatusStyle(s.status)
                  const typeColors: Record<string, { bg: string; color: string }> = {
                    ANNOUNCED: { bg: "#e0f0ff", color: "#0057a3" },
                    UNANNOUNCED: { bg: "#fff0e5", color: "#8a3c00" },
                    DOCUMENT_REVIEW: { bg: "#f0e6f6", color: "#6b4fa0" },
                  }
                  const tc = typeColors[s.survType] ?? { bg: "#f3f4f6", color: C.muted }
                  return (
                    <div key={s.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                            {s.certificateNumber && <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#107c10" }}>{s.certificateNumber}</span>}
                            <span style={{ fontWeight: 600, fontSize: 13, color: C.textDark }}>{s.companyName}</span>
                            <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: tc.bg, color: tc.color, fontWeight: 600 }}>{s.survType.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                            {s.scheduledDate && <span>Scheduled: {formatDate(s.scheduledDate)}</span>}
                            {s.assignedTo && <span>Assigned to: {s.assignedTo}</span>}
                            {s.notes && <span>· {s.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>Status:</span>
                        {(["SCHEDULED", "COMPLETED", "OVERDUE", "CANCELLED"] as const).map(st2 => (
                          <button key={st2} onClick={() => updateSurvStatus(s.id, st2)}
                            style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${s.status === st2 ? "#107c10" : C.border}`, background: s.status === st2 ? "#e6f4e6" : "#fff", color: s.status === st2 ? "#107c10" : C.muted, fontSize: 11, fontWeight: s.status === st2 ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {st2}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </OfficeLayout>
  )
}
