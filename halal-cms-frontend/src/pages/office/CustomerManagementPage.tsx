import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Building2, Mail, Phone, MapPin, Globe, User, Clock, CheckCircle, XCircle,
         ChevronDown, ChevronUp, Search, RefreshCw, Users, Factory, Package, ArrowRight, Award, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import OfficeLayout from "./OfficeLayout"
import { getCompanies, type Company } from "@/api/companies"

// ── Types ─────────────────────────────────────────────────────────────────────
interface FieldChange { field: string; label: string; oldVal: string; newVal: string }
type ReqStatus = "PENDING" | "APPROVED" | "REJECTED"
interface ChangeRequest {
  id: string; companyId?: string; companyName?: string; submittedAt: string
  changes: FieldChange[]; status: ReqStatus
  reviewedAt?: string; reviewedBy?: string; reviewNote?: string
}
interface Profile {
  clientId?: string
  companyName: string; email: string; phone: string
  contactName: string; designation: string; website: string
  address1: string; address2: string; city: string
  state: string; postcode: string; country: string
}

function companyToProfile(c: Company): Profile {
  return {
    clientId: c.registrationNumber || c.id,
    companyName: c.name || "",
    email: c.email || "",
    phone: c.phone || "",
    contactName: "",
    designation: "",
    website: c.website || "",
    address1: c.address || "",
    address2: "",
    city: c.city || "",
    state: c.state || "",
    postcode: c.postcode || "",
    country: c.country || "",
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────
const PROFILE_REQUESTS_KEY = "hcs_profile_change_requests"

function loadRequests(): ChangeRequest[] {
  try { return JSON.parse(localStorage.getItem(PROFILE_REQUESTS_KEY) || "[]") } catch { return [] }
}
function saveRequests(reqs: ChangeRequest[]) {
  localStorage.setItem(PROFILE_REQUESTS_KEY, JSON.stringify(reqs))
}
function applyProfile(changes: FieldChange[]) {
  void changes
}

const fmtDt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

const F = "'Inter', system-ui, sans-serif"
const inp: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
  borderRadius: 7, fontSize: "0.8rem", color: "#111827", outline: "none",
  boxSizing: "border-box", fontFamily: F, background: "#fff",
}
const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", fontWeight: 700,
  color: "#374151", marginBottom: 4, fontFamily: F,
}

const AVATAR_COLORS = ["#0f2170","#0e7490","#6d28d9","#b45309","#065f46","#9f1239","#1d4ed8"]
function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length]
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CustomerManagementPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>(() =>
    loadRequests().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  )
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [rejectId,   setRejectId]   = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const navigate     = useNavigate()
  const [search,     setSearch]     = useState("")

  const [sheet,    setSheet]    = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState<Profile | null>(null)
  const [saveTick, setSaveTick] = useState(false)
  const companiesQ = useQuery({
    queryKey: ["office", "companies"],
    queryFn: () => getCompanies(0, 100),
    retry: false,
  })

  const openSheet  = (p: Profile) => { setSheet(p); setEditForm({ ...p }) }
  const closeSheet = () => { setSheet(null); setEditForm(null) }
  const setF = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm(prev => prev ? { ...prev, [k]: e.target.value } : prev)

  const saveSheet = () => {
    if (!editForm) return
    setSaveTick(true)
    setTimeout(() => { setSaveTick(false); closeSheet() }, 1200)
  }

  const pendingReqs  = requests.filter(r => r.status === "PENDING")
  const approvedReqs = requests.filter(r => r.status === "APPROVED")

  const approve = (req: ChangeRequest) => {
    applyProfile(req.changes)
    const updated = requests.map(r =>
      r.id === req.id ? { ...r, status: "APPROVED" as ReqStatus, reviewedAt: new Date().toISOString(), reviewedBy: "Office" } : r
    )
    saveRequests(updated); setRequests(updated); setExpanded(null)
    toast.success("Profile changes approved")
  }

  const confirmReject = () => {
    if (!rejectId) return
    const updated = requests.map(r =>
      r.id === rejectId ? { ...r, status: "REJECTED" as ReqStatus, reviewedAt: new Date().toISOString(), reviewedBy: "Office", reviewNote: rejectNote || undefined } : r
    )
    saveRequests(updated); setRequests(updated); setRejectId(null); setExpanded(null)
    toast.success("Request rejected")
  }

  const allCustomers = (companiesQ.data?.content ?? []).map(c => {
    const profile = companyToProfile(c)
    const pendingRequests = requests.filter(r =>
      r.status === "PENDING" &&
      (r.companyId === c.id || (!r.companyId && (r.companyName === c.name || r.companyName === profile.companyName)))
    )
    return {
      id: c.id,
      profile,
      pending: pendingRequests.length,
      pendingRequests,
    }
  })

  const customers = allCustomers.filter(c =>
    !search ||
    c.profile.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.profile.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.profile.clientId ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const counts = { factories: 0, products: 0, factCerts: 0, batchCerts: 0 }

  const refresh = () => {
    companiesQ.refetch()
    setRequests(loadRequests().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
    toast.success("Refreshed")
  }

  return (
    <OfficeLayout title="Customers">
      <div style={{ padding: "1.75rem 2rem", fontFamily: F }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>Customer Accounts</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b", fontFamily: F }}>Manage company profiles and review change requests</p>
          </div>
          <button onClick={refresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseOut={e => (e.currentTarget.style.background = "#fff")}
          >
            <RefreshCw size={13} />Refresh
          </button>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Customers",  value: allCustomers.length, accent: "#0f2170", icon: <Users size={16} color="#0f2170" />,       bg: "#eff6ff" },
            { label: "Pending Review",   value: pendingReqs.length,  accent: "#d97706", icon: <Clock size={16} color="#d97706" />,       bg: "#fffbeb" },
            { label: "Approved Changes", value: approvedReqs.length, accent: "#16a34a", icon: <CheckCircle size={16} color="#16a34a" />, bg: "#f0fdf4" },
            { label: "Up to Date",       value: allCustomers.filter(c => c.pending === 0).length, accent: "#0891b2", icon: <Building2 size={16} color="#0891b2" />, bg: "#ecfeff" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, padding: "15px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b", fontWeight: 500, fontFamily: F }}>{s.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "1.6rem", fontWeight: 800, color: s.accent, lineHeight: 1, fontFamily: F }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or client ID…"
              style={{ width: "100%", boxSizing: "border-box", height: 38, paddingLeft: 36, paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 9, fontSize: "0.8rem", color: "#0f172a", outline: "none", fontFamily: F, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#2563eb")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: F }}>
            {customers.length} of {allCustomers.length} customer{allCustomers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Customer table ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e9ecef", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>

          {/* Head */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1.3fr 0.9fr 1fr 120px 70px 70px 80px 96px 126px 120px 44px", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e9ecef" }}>
            {["Client ID", "Company", "Contact", "Contact Info", "Location", "Factories", "Products", "Fac. Certs", "Batch Certs", "Status", "", ""].map(h => (
              <div key={h} style={{ fontSize: "0.63rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: F }}>{h}</div>
            ))}
          </div>

          {customers.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Users size={22} color="#cbd5e1" />
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569", margin: "0 0 4px", fontFamily: F }}>No customers found</p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, fontFamily: F }}>
                {search ? "Try a different search term" : "No registered customers yet"}
              </p>
            </div>
          ) : (
            customers.map(c => (
              <div key={c.id}>
                {/* Row */}
                <div
                  onClick={() => openSheet(c.profile)}
                  style={{ display: "grid", gridTemplateColumns: "130px 1.3fr 0.9fr 1fr 120px 70px 70px 80px 96px 126px 120px 44px", padding: "16px 20px", borderBottom: expanded === c.id ? "none" : "1px solid #f1f5f9", cursor: "pointer", alignItems: "center", transition: "background 0.12s", borderLeft: "3px solid transparent" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.borderLeftColor = "#2563eb" }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent" }}
                >
                  {/* Client ID */}
                  <div>
                    <span style={{ fontSize: "0.7rem", fontFamily: "monospace", padding: "3px 8px", borderRadius: 5, background: "#f1f5f9", color: "#334155", fontWeight: 700, border: "1px solid #e2e8f0", letterSpacing: "0.03em", whiteSpace: "nowrap" as const }}>
                      {c.profile.clientId || "—"}
                    </span>
                  </div>

                  {/* Company */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, paddingRight: 12, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarColor(c.profile.companyName), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.875rem", fontWeight: 800, flexShrink: 0 }}>
                      {(c.profile.companyName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: F }}>{c.profile.companyName || "—"}</p>
                      {c.profile.website && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          <Globe size={10} color="#94a3b8" />
                          <span style={{ fontSize: "0.67rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: F }}>{c.profile.website}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact person */}
                  <div style={{ paddingRight: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={11} color="#64748b" />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 500, fontFamily: F }}>{c.profile.contactName || "—"}</span>
                    </div>
                    {c.profile.designation && (
                      <p style={{ margin: "3px 0 0 30px", fontSize: "0.68rem", color: "#94a3b8", fontFamily: F }}>{c.profile.designation}</p>
                    )}
                  </div>

                  {/* Email + phone */}
                  <div style={{ paddingRight: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <Mail size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: F }}>{c.profile.email || "—"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontFamily: F }}>{c.profile.phone || "—"}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    {[c.profile.city, c.profile.country].some(Boolean) ? (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                        <MapPin size={11} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.4, fontFamily: F }}>
                          {[c.profile.city, c.profile.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    ) : <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontFamily: F }}>—</span>}
                  </div>

                  {/* Factories */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, background: counts.factories > 0 ? "#eff6ff" : "#f8fafc", color: counts.factories > 0 ? "#1d4ed8" : "#94a3b8", border: `1px solid ${counts.factories > 0 ? "#bfdbfe" : "#e9ecef"}`, fontSize: "0.72rem", fontWeight: 700, fontFamily: F }}>
                      <Factory size={11} />{counts.factories}
                    </span>
                  </div>

                  {/* Products */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, background: counts.products > 0 ? "#f0fdf4" : "#f8fafc", color: counts.products > 0 ? "#15803d" : "#94a3b8", border: `1px solid ${counts.products > 0 ? "#bbf7d0" : "#e9ecef"}`, fontSize: "0.72rem", fontWeight: 700, fontFamily: F }}>
                      <Package size={11} />{counts.products}
                    </span>
                  </div>

                  {/* Factory Certs */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, background: counts.factCerts > 0 ? "#fdf4ff" : "#f8fafc", color: counts.factCerts > 0 ? "#7e22ce" : "#94a3b8", border: `1px solid ${counts.factCerts > 0 ? "#e9d5ff" : "#e9ecef"}`, fontSize: "0.72rem", fontWeight: 700, fontFamily: F }}>
                      <ShieldCheck size={11} />{counts.factCerts}
                    </span>
                  </div>

                  {/* Batch Certs */}
                  <div style={{ paddingRight: 14 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, background: counts.batchCerts > 0 ? "#fffbeb" : "#f8fafc", color: counts.batchCerts > 0 ? "#b45309" : "#94a3b8", border: `1px solid ${counts.batchCerts > 0 ? "#fde68a" : "#e9ecef"}`, fontSize: "0.72rem", fontWeight: 700, fontFamily: F }}>
                      <Award size={11} />{counts.batchCerts}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ paddingLeft: 10 }}>
                    {c.pending > 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", fontSize: "0.7rem", fontWeight: 700, fontFamily: F }}>
                        <Clock size={10} />{c.pending} pending
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", fontSize: "0.7rem", fontWeight: 600, fontFamily: F }}>
                        <CheckCircle size={10} />Current
                      </span>
                    )}
                  </div>

                  {/* Review toggle */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {c.pendingRequests.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(expanded === c.id ? null : c.id) }}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: expanded === c.id ? "#eff6ff" : "#f8fafc", border: `1px solid ${expanded === c.id ? "#bfdbfe" : "#e2e8f0"}`, color: expanded === c.id ? "#1d4ed8" : "#475569", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}
                        onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#1d4ed8" }}
                        onMouseOut={e => { if (expanded !== c.id) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569" } }}
                      >
                        {expanded === c.id ? <><ChevronUp size={12} />Hide</> : <><ChevronDown size={12} />Review</>}
                      </button>
                    )}
                  </div>

                  {/* Open detail page */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/office/customers/${c.id}`) }}
                      title="View full profile"
                      style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#0f2170"; e.currentTarget.style.borderColor = "#0f2170"; (e.currentTarget.querySelector("svg") as SVGElement).style.color = "#fff" }}
                      onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#e2e8f0"; (e.currentTarget.querySelector("svg") as SVGElement).style.color = "#64748b" }}
                    >
                      <ArrowRight size={14} color="#64748b" />
                    </button>
                  </div>
                </div>

                {/* Expanded pending requests */}
                {expanded === c.id && (
                  <div style={{ background: "#fafbff", borderTop: "1px solid #e0e7ff", borderBottom: "1px solid #e9ecef" }}>
                    <div style={{ padding: "10px 20px 10px 23px", borderBottom: "1px solid #e9ecef", display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={12} color="#6366f1" />
                      <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#4338ca", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: F }}>
                        {c.pendingRequests.length} pending request{c.pendingRequests.length !== 1 ? "s" : ""} — latest first
                      </p>
                    </div>

                    {c.pendingRequests.map((req, i) => (
                      <div key={req.id} style={{ padding: "14px 20px 14px 23px", borderBottom: i < c.pendingRequests.length - 1 ? "1px solid #e9ecef" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: F }}>Submitted {fmtDt(req.submittedAt)}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => approve(req)}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: F }}
                              onMouseOver={e => (e.currentTarget.style.background = "#bbf7d0")}
                              onMouseOut={e => (e.currentTarget.style.background = "#dcfce7")}
                            ><CheckCircle size={12} />Approve</button>
                            <button onClick={() => { setRejectId(req.id); setRejectNote("") }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: F }}
                              onMouseOver={e => (e.currentTarget.style.background = "#fecaca")}
                              onMouseOut={e => (e.currentTarget.style.background = "#fee2e2")}
                            ><XCircle size={12} />Reject</button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                          {req.changes.map(ch => (
                            <div key={ch.field} style={{ borderRadius: 8, padding: "9px 12px", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                              <p style={{ margin: "0 0 5px", fontSize: "0.62rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: F }}>{ch.label}</p>
                              <p style={{ margin: "0 0 3px", fontSize: "0.73rem", color: "#dc2626", textDecoration: "line-through", fontFamily: F }}>{ch.oldVal || "—"}</p>
                              <p style={{ margin: 0, fontSize: "0.73rem", fontWeight: 600, color: "#475569", fontFamily: F }}>{ch.newVal || "—"}</p>
                            </div>
                          ))}
                        </div>

                        {rejectId === req.id && (
                          <div style={{ marginTop: 12, borderRadius: 9, padding: 14, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                            <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 600, color: "#92400e", fontFamily: F }}>Rejection note (optional)</p>
                            <input type="text" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                              placeholder="Reason for rejection…"
                              style={{ width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 7, border: "1px solid #fdba74", outline: "none", fontSize: "0.8rem", fontFamily: F, marginBottom: 10 }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={confirmReject} style={{ padding: "6px 14px", borderRadius: 7, background: "#dc2626", color: "#fff", border: "none", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: F }}>Confirm Rejection</button>
                              <button onClick={() => setRejectId(null)} style={{ padding: "6px 14px", borderRadius: 7, background: "#f3f4f6", color: "#374151", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {pendingReqs.length > 0 && (
          <div style={{ marginTop: 14, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
            <Clock size={14} color="#92400e" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#92400e", fontFamily: F }}>
              <strong>{pendingReqs.length} change request{pendingReqs.length !== 1 ? "s" : ""}</strong> awaiting review — click <strong>Review</strong> on the row to approve or reject.
            </p>
          </div>
        )}

      </div>

      {/* ── Customer Detail Modal ─────────────────────────────────────────────── */}
      {sheet && editForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) closeSheet() }}>
          <div style={{ width: "100%", maxWidth: 860, maxHeight: "88vh", background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", fontFamily: F, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e9ecef", background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: avatarColor(sheet.companyName), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                  {(sheet.companyName || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{sheet.companyName || "Customer"}</p>
                    {sheet.clientId && <span style={{ fontSize: "0.68rem", fontFamily: "monospace", padding: "2px 8px", borderRadius: 5, background: "#fff", color: "#334155", fontWeight: 700, border: "1px solid #e2e8f0", letterSpacing: "0.04em" }}>{sheet.clientId}</span>}
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{sheet.email}</p>
                </div>
              </div>
              <button onClick={closeSheet}
                style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseOut={e => (e.currentTarget.style.background = "#fff")}
              ><XCircle size={15} color="#64748b" /></button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <Building2 size={13} color="#2563eb" />
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Company Information</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Company / Trade Name</label><input style={inp} value={editForm.companyName} onChange={setF("companyName")} /></div>
                  <div><label style={lbl}>Business Email</label><input style={inp} type="email" value={editForm.email} onChange={setF("email")} /></div>
                  <div><label style={lbl}>Phone Number</label><input style={inp} type="tel" value={editForm.phone} onChange={setF("phone")} /></div>
                  <div><label style={lbl}>Website</label><input style={inp} value={editForm.website} onChange={setF("website")} /></div>
                </div>
              </div>
              <div style={{ height: 1, background: "#f1f5f9" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <User size={13} color="#2563eb" />
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Contact Person</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={editForm.contactName} onChange={setF("contactName")} /></div>
                  <div><label style={lbl}>Designation / Title</label><input style={inp} value={editForm.designation} onChange={setF("designation")} /></div>
                </div>
              </div>
              <div style={{ height: 1, background: "#f1f5f9" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <MapPin size={13} color="#2563eb" />
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Office / Registered Address</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Address Line 1</label><input style={inp} value={editForm.address1} onChange={setF("address1")} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Address Line 2</label><input style={inp} value={editForm.address2} onChange={setF("address2")} /></div>
                  <div><label style={lbl}>City</label><input style={inp} value={editForm.city} onChange={setF("city")} /></div>
                  <div><label style={lbl}>State / Province</label><input style={inp} value={editForm.state} onChange={setF("state")} /></div>
                  <div><label style={lbl}>Postcode</label><input style={inp} value={editForm.postcode} onChange={setF("postcode")} /></div>
                  <div><label style={lbl}>Country</label><input style={inp} value={editForm.country} onChange={setF("country")} /></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e9ecef", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#94a3b8", fontFamily: F }}>Changes apply immediately — no customer approval required</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={closeSheet} style={{ padding: "8px 18px", borderRadius: 9, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, fontFamily: F }}
                  onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.background = "#fff")}
                >Cancel</button>
                <button onClick={saveSheet}
                  style={{ padding: "8px 22px", borderRadius: 9, background: saveTick ? "#16a34a" : "#0f2170", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: F, transition: "background 0.2s", display: "flex", alignItems: "center", gap: 7 }}>
                  {saveTick ? <><CheckCircle size={13} />Saved</> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </OfficeLayout>
  )
}
