import { useState, useEffect } from "react"
import { User, MapPin, Building2, Send, Clock, CheckCircle, XCircle, Globe, FileText, Eye } from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { useAuthStore } from "@/store/authStore"
import { C } from "@/lib/utils"
import { addAuditLog } from "@/lib/auditLog"
import { getMyCompany, updateCompany, type Company } from "@/api/companies"

const DARK = "#111827"
const NAV  = "#0f2170"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Profile {
  clientId?: string
  companyName: string; email: string; phone: string
  contactName: string; designation: string; website: string
  address1: string; address2: string; city: string
  state: string; postcode: string; country: string
  businessType: string; activityCategory: string; yearEstablished: string; employeeCount: string
}

interface FieldChange { field: string; label: string; oldVal: string; newVal: string }
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED"

interface ChangeRequest {
  id: string; companyId?: string; companyName?: string; submittedAt: string
  changes: FieldChange[]; status: RequestStatus
  reviewedAt?: string; reviewedBy?: string; reviewNote?: string
}

const PROFILE_REQUESTS_KEY = "hcs_profile_change_requests"

// ── Storage helpers ─────────────────────────────────────────────────────────
function loadProfileLoc(): { lat: string; lng: string } {
  return { lat: "", lng: "" }
}

function makeMapHtml(lat: string, lng: string): string {
  const clat = lat && !isNaN(+lat) ? +lat : 3.1390
  const clng = lng && !isNaN(+lng) ? +lng : 101.6869
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head><body><div id="map"></div><script>
var map=L.map('map').setView([${clat},${clng}],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
var marker=L.marker([${clat},${clng}],{draggable:true}).addTo(map);
function send(ll){window.parent.postMessage({type:'hcs-loc',lat:ll.lat.toFixed(6),lng:ll.lng.toFixed(6)},'*');}
marker.on('dragend',function(e){send(e.target.getLatLng());});
map.on('click',function(e){marker.setLatLng(e.latlng);send(e.latlng);});
</script></body></html>`
}

const FIELD_LABELS: Record<Exclude<keyof Profile, "clientId">, string> = {
  companyName: "Company Name", email: "Business Email", phone: "Phone Number",
  contactName: "Contact Person", designation: "Designation", website: "Website",
  address1: "Address Line 1", address2: "Address Line 2", city: "City",
  state: "State", postcode: "Postcode", country: "Country",
  businessType: "Company Type", activityCategory: "Activity Category",
  yearEstablished: "Year Established", employeeCount: "Employee Count",
}

const DOC_FIELD_LABELS: Record<string, string> = {
  licenseNo: "Business License No.", licenseExpiry: "License Expiry Date",
  issuingAuth: "Issuing Authority", vatNo: "VAT / CIF No.", sstNo: "SST No.",
}

const BUSINESS_TYPES = [
  "SOLE_PROPRIETOR", "PARTNERSHIP", "PRIVATE_LIMITED", "PUBLIC_LIMITED", "COOPERATIVE", "OTHER",
]

const ACTIVITY_CATEGORIES = [
  "FOOD_MANUFACTURER", "FOOD_IMPORTER", "FOOD_EXPORTER", "FOOD_SERVICE", "RETAILER", "DISTRIBUTOR",
  "SLAUGHTERHOUSE", "LOGISTICS", "COSMETICS", "PHARMACEUTICAL", "OTHER",
]

function generateClientId(): string {
  return "HCS-" + Math.random().toString(36).substring(2, 10).toUpperCase()
}
void generateClientId

function loadProfile(user: { name?: string; email?: string } | null): Profile {
  return {
    companyName: user?.name ?? "", email: user?.email ?? "", phone: "",
    contactName: "", designation: "", website: "",
    address1: "", address2: "", city: "", state: "", postcode: "", country: "",
    businessType: "", activityCategory: "", yearEstablished: "", employeeCount: "",
  }
}

function loadRequests(): ChangeRequest[] {
  try { return JSON.parse(localStorage.getItem(PROFILE_REQUESTS_KEY) || "[]") } catch { return [] }
}

function saveRequests(reqs: ChangeRequest[]) {
  localStorage.setItem(PROFILE_REQUESTS_KEY, JSON.stringify(reqs))
}

// ── Sub-components ──────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 11px",
  border: `1px solid ${C.border}`, borderRadius: 7,
  fontSize: "0.8125rem", color: DARK, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
}
const lbl: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#374151", marginBottom: 5 }

function fmtSize(b: number) { return b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB` }
function getExt(name: string) { return (name.split(".").pop() || "FILE").toUpperCase().slice(0, 4) }

function DocThumb({ hasFile, ext }: { hasFile: boolean; ext: string }) {
  return (
    <div style={{ width:54, height:70, flexShrink:0, position:"relative" as const }}>
      <div style={{ position:"absolute" as const, inset:0, background: hasFile ? "linear-gradient(145deg,#dbeafe,#eff6ff)" : "#f1f5f9", borderRadius:7, clipPath:"polygon(0 0,calc(100% - 13px) 0,100% 13px,100% 100%,0 100%)", display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", gap:4, borderColor: hasFile ? "#bfdbfe" : "#e2e8f0" }}>
        <FileText size={20} color={hasFile ? "#3b82f6" : "#cbd5e1"} strokeWidth={1.5}/>
        <span style={{ fontSize:"0.42rem", fontWeight:800, color: hasFile ? "#2563eb" : "#94a3b8", letterSpacing:"0.1em" }}>{ext}</span>
      </div>
      <div style={{ position:"absolute" as const, top:0, right:0, width:13, height:13, background: hasFile ? "#93c5fd" : "#e2e8f0", clipPath:"polygon(0 0,100% 0,100% 100%)", borderRadius:"0 7px 0 0" }}/>
    </div>
  )
}

function DocCard({
  title, dataKey, nameKey, sizeKey,
  fields, fileState, setFileState, docs, setDocs,
}: {
  title: string; dataKey: string; nameKey: string; sizeKey: string
  fields: { label: string; key: string; type?: string }[]
  fileState: File|null; setFileState: (f:File|null)=>void
  docs: Record<string,any>; setDocs: React.Dispatch<React.SetStateAction<Record<string,any>>>
}) {
  const hasFile = !!docs[dataKey]
  const ext = hasFile ? getExt(docs[nameKey] || "") : fileState ? getExt(fileState.name) : "FILE"
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", background:"#fafbfc", display:"flex", flexDirection:"column" as const, gap:12 }}>
      <p style={{ margin:0, fontSize:"0.68rem", fontWeight:700, color:"#475569", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>{title}</p>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <DocThumb hasFile={hasFile || !!fileState} ext={ext}/>
        <div style={{ flex:1 }}>
          {hasFile
            ? <div style={{ fontSize:"0.78rem", fontWeight:600, color:DARK, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{docs[nameKey]}</div>
            : fileState
              ? <div style={{ fontSize:"0.78rem", fontWeight:600, color:DARK, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{fileState.name}</div>
              : <div style={{ fontSize:"0.78rem", color:"#94a3b8", marginBottom:2 }}>No file uploaded</div>
          }
          {(hasFile || fileState) && (
            <div style={{ fontSize:"0.68rem", color:"#94a3b8", marginBottom:8 }}>
              {hasFile ? fmtSize(docs[sizeKey] as number) : fmtSize(fileState!.size)} · Document
            </div>
          )}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
            <label style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, background:"#f1f5f9", border:`1px solid ${C.border}`, fontSize:"0.7rem", fontWeight:600, color:"#475569", cursor:"pointer" }}>
              {hasFile ? "Replace" : "Upload"}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e => setFileState(e.target.files?.[0] ?? null)}/>
            </label>
            {hasFile && (
              <a href={docs[dataKey] as string} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", fontSize:"0.7rem", fontWeight:600, textDecoration:"none" }}>
                <Eye size={10}/> View
              </a>
            )}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column" as const, gap:7 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ ...lbl, fontSize:"0.67rem" }}>{f.label}</label>
            <input type={f.type||"text"} style={{ ...inp, height:33, fontSize:"0.78rem" }}
              value={docs[f.key]||""}
              onChange={e => setDocs((d:any) => ({ ...d, [f.key]: e.target.value }))}
              onFocus={e => e.target.style.borderColor="#2563eb"}
              onBlur={e  => e.target.style.borderColor=C.border}/>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text", disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...inp, background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#94a3b8" : DARK, cursor: disabled ? "not-allowed" : "text" }}
        onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = "#2563eb" }}
        onBlur={e => { e.currentTarget.style.borderColor = C.border }} />
    </div>
  )
}

function SelectField({ label, value, onChange, options, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...inp, background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#94a3b8" : DARK, cursor: disabled ? "not-allowed" : "pointer" }}
        onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = "#2563eb" }}
        onBlur={e => { e.currentTarget.style.borderColor = C.border }}>
        <option value="">Select</option>
        {options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, { bg: string; color: string; dot: string; label: string }> = {
    PENDING:  { bg: "#fef9e7", color: "#92400e", dot: "#f59e0b", label: "Pending Approval" },
    APPROVED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", label: "Approved"         },
    REJECTED: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Rejected"          },
  }
  const s = styles[status]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: "0.7rem", fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{title}</span>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomerProfilePage() {
  const { user } = useAuthStore()
  const [company, setCompany] = useState<Company | null>(null)
  const [approved, setApproved] = useState<Profile>(() => loadProfile(user))
  const [form, setForm]         = useState<Profile>(() => loadProfile(user))
  const [requests, setRequests] = useState<ChangeRequest[]>(loadRequests)
  const [submitted, setSubmitted] = useState(false)
  const [approvedDesc, setApprovedDesc] = useState("")
  const [description, setDescription]   = useState("")
  const [approvedDocs, setApprovedDocs] = useState<Record<string,any>>({})
  const [docs, setDocs] = useState<Record<string,any>>({})
  const [licFile, setLicFile] = useState<File|null>(null)
  const [vatFile, setVatFile] = useState<File|null>(null)
  const [loc, setLoc] = useState(loadProfileLoc)
  const [locSaved, setLocSaved] = useState(false)

  useEffect(() => {
    let alive = true
    getMyCompany().then(c => {
      if (!alive) return
      const profile = {
        clientId: c.registrationNumber || c.id,
        companyName: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        contactName: c.contactName || "",
        designation: c.contactDesignation || "",
        website: c.website || "",
        address1: c.addressLine1 || c.address || "",
        address2: c.addressLine2 || "",
        city: c.city || "",
        state: c.state || "",
        postcode: c.postcode || "",
        country: c.country || "",
        businessType: c.businessType || "",
        activityCategory: c.activityCategory || "",
        yearEstablished: c.incorporationDate ? c.incorporationDate.slice(0, 4) : "",
        employeeCount: c.employeeCount == null ? "" : String(c.employeeCount),
      }
      setCompany(c)
      setApproved(profile)
      setForm(profile)
      setApprovedDesc(c.description || "")
      setDescription(c.description || "")
      const companyDocs = {
        licenseNo: c.licenseNo || c.registrationNumber || "",
        licenseExpiry: c.licenseExpiry || "",
        issuingAuth: c.issuingAuthority || "",
        licenseFileName: c.licenseFileName || "",
        licenseFileSize: c.licenseFileSize || 0,
        licenseFileData: c.licenseFileData || "",
        vatNo: c.vatNo || "",
        sstNo: c.sstNo || "",
        vatFileName: c.vatFileName || "",
        vatFileSize: c.vatFileSize || 0,
        vatFileData: c.vatFileData || "",
      }
      setApprovedDocs(companyDocs)
      setDocs(companyDocs)
      setLoc({ lat: c.latitude || "", lng: c.longitude || "" })
      setRequests(loadRequests().filter(req => req.companyId === c.id || !req.companyId))
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const saveDocs = async () => {
    const readFile = (f: File|null): Promise<string|null> =>
      f ? new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target?.result as string ?? null); r.readAsDataURL(f) }) : Promise.resolve(null)
    const [licData, vatData] = await Promise.all([readFile(licFile), readFile(vatFile)])
      const updated: Record<string, any> = {
      ...docs,
      ...(licData ? { licenseFileData:licData, licenseFileName:licFile!.name, licenseFileSize:licFile!.size } : {}),
      ...(vatData ? { vatFileData:vatData,      vatFileName:vatFile!.name,     vatFileSize:vatFile!.size     } : {}),
    }
    setDocs(updated); setLicFile(null); setVatFile(null)
    return updated
  }

  const saveLocation = () => {
    setLocSaved(true)
    setTimeout(() => setLocSaved(false), 2500)
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "hcs-loc" && e.data.lat && e.data.lng) {
        setLoc({ lat: e.data.lat, lng: e.data.lng })
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const hasPending = requests.some(r => r.status === "PENDING")
  const set = (k: keyof Profile) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!company) return
    const updatedDocs = await saveDocs()
    await updateCompany(company.id, {
      registrationNumber: updatedDocs.licenseNo || company.registrationNumber,
      name: form.companyName,
      businessType: form.businessType || company.businessType,
      address: [form.address1, form.address2].filter(Boolean).join(", "),
      addressLine1: form.address1,
      addressLine2: form.address2,
      city: form.city,
      state: form.state,
      postcode: form.postcode,
      country: form.country,
      phone: form.phone,
      email: form.email,
      website: form.website,
      activityCategory: form.activityCategory || company.activityCategory,
      specificActivities: company.specificActivities,
      description,
      incorporationDate: form.yearEstablished ? `${form.yearEstablished}-01-01` : company.incorporationDate,
      contactName: form.contactName,
      contactDesignation: form.designation,
      employeeCount: form.employeeCount ? Number(form.employeeCount) : undefined,
      latitude: loc.lat,
      longitude: loc.lng,
      licenseNo: updatedDocs.licenseNo,
      licenseExpiry: updatedDocs.licenseExpiry || undefined,
      issuingAuthority: updatedDocs.issuingAuth,
      licenseFileName: updatedDocs.licenseFileName,
      licenseFileSize: updatedDocs.licenseFileSize,
      licenseFileData: updatedDocs.licenseFileData,
      vatNo: updatedDocs.vatNo,
      sstNo: updatedDocs.sstNo,
      vatFileName: updatedDocs.vatFileName,
      vatFileSize: updatedDocs.vatFileSize,
      vatFileData: updatedDocs.vatFileData,
    })

    const changes: FieldChange[] = (Object.keys(FIELD_LABELS) as Exclude<keyof Profile, "clientId">[])
      .filter(k => form[k] !== approved[k])
      .map(k => ({ field: k, label: FIELD_LABELS[k], oldVal: approved[k] as string, newVal: form[k] as string }))
    if (description !== approvedDesc)
      changes.push({ field: "description", label: "Business Description", oldVal: approvedDesc, newVal: description })
    Object.keys(DOC_FIELD_LABELS).forEach(k => {
      if ((updatedDocs[k] || "") !== (approvedDocs[k] || ""))
        changes.push({ field: k, label: DOC_FIELD_LABELS[k], oldVal: approvedDocs[k] as string || "", newVal: updatedDocs[k] as string || "" })
    })
    if (changes.length === 0) return
    const req: ChangeRequest = {
      id: Date.now().toString(),
      companyId: company.id,
      companyName: form.companyName,
      submittedAt: new Date().toISOString(),
      changes,
      status: "PENDING",
    }
    const otherCompanyRequests = loadRequests().filter(r => r.companyId && r.companyId !== company.id)
    const updated = [req, ...requests]
    saveRequests([...updated, ...otherCompanyRequests])
    setRequests(updated)
    addAuditLog({
      applicationId: 'profile',
      applicationNumber: 'PROFILE',
      companyName: form.companyName || '—',
      actor: user?.name || 'Customer',
      role: 'Customer',
      action: 'Profile Change Requested',
      details: `${changes.length} field(s) changed: ${changes.map(c => c.label).join(', ')}`,
      category: 'PROFILE',
    })
    // Advance approved snapshots so hasDiff goes false after the database update.
    setApproved({ ...form })
    setApprovedDesc(description)
    setApprovedDocs((d: any) => ({
      ...d,
      ...Object.fromEntries(Object.keys(DOC_FIELD_LABELS).map(k => [k, updatedDocs[k] || ""]))
    }))
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const docsDiff = Object.keys(DOC_FIELD_LABELS).some(k => (docs[k] || "") !== (approvedDocs[k] || ""))
  const hasDiff = (Object.keys(FIELD_LABELS) as (keyof Profile)[]).some(k => form[k] !== approved[k]) || description !== approvedDesc || docsDiff

  const fmtDt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <CustomerLayout title="My Profile">

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: DARK, margin: 0 }}>Company Registration Profile</h1>
          <p style={{ fontSize: "0.78rem", color: C.muted, margin: "4px 0 0" }}>Edit your details and submit for office approval</p>
        </div>
        <button onClick={handleSubmit} disabled={!hasDiff || hasPending}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: submitted ? "#16a34a" : hasDiff && !hasPending ? NAV : "#cbd5e1", color: "#fff", border: "none", cursor: hasDiff && !hasPending ? "pointer" : "not-allowed", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit", flexShrink: 0, transition: "background 0.2s" }}>
          {submitted ? <><CheckCircle size={13} /> Submitted</> : <><Send size={13} /> Submit for Approval</>}
        </button>
      </div>

      {/* Pending banner */}
      {hasPending && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", background: "#eef2ff", borderRadius: 10, marginBottom: 16, border: "1px solid #c7d2fe" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={13} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#3730a3" }}>Under Review</p>
            <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#4338ca" }}>Your profile update is with the office. Fields are locked until a decision is made.</p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: Edit Form ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={13} color="#2563eb" /></div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Company Information</span>
              </div>
              {approved.clientId && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Client ID</span>
                  <span style={{ fontSize: "0.7rem", fontFamily: "monospace", padding: "2px 8px", borderRadius: 5, background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "1px solid #e2e8f0", letterSpacing: "0.04em" }}>{approved.clientId}</span>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Company / Trade Name" value={form.companyName} onChange={set("companyName")} disabled={hasPending} />
              </div>
              <SelectField label="Company Type" value={form.businessType} onChange={set("businessType")} options={BUSINESS_TYPES} disabled={hasPending} />
              <SelectField label="Activity Category" value={form.activityCategory} onChange={set("activityCategory")} options={ACTIVITY_CATEGORIES} disabled={hasPending} />
              <Field label="Business Email" value={form.email} onChange={set("email")} type="email" disabled={hasPending} />
              <Field label="Phone Number" value={form.phone} onChange={set("phone")} type="tel" disabled={hasPending} />
              <Field label="Website" value={form.website} onChange={set("website")} disabled={hasPending} />
              <Field label="Year Established" value={form.yearEstablished} onChange={set("yearEstablished")} type="number" disabled={hasPending} />
              <Field label="Employee Count" value={form.employeeCount} onChange={set("employeeCount")} type="number" disabled={hasPending} />
            </div>
          </div>

          {/* ── Registration Documents ── */}
          <div style={{ background:"#fff", borderRadius:12, padding:"18px 22px", border:`1px solid ${C.border}`, boxShadow:C.cardShadow }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:26, height:26, borderRadius:7, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}><FileText size={13} color="#2563eb"/></div>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Registration Documents</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <DocCard
                title="Business License"
                dataKey="licenseFileData" nameKey="licenseFileName" sizeKey="licenseFileSize"
                fields={[
                  { label:"License No.", key:"licenseNo" },
                  { label:"Expiry Date", key:"licenseExpiry", type:"date" },
                  { label:"Issuing Authority", key:"issuingAuth" },
                ]}
                fileState={licFile} setFileState={setLicFile}
                docs={docs} setDocs={setDocs}
              />
              <DocCard
                title="VAT / SST Document"
                dataKey="vatFileData" nameKey="vatFileName" sizeKey="vatFileSize"
                fields={[
                  { label:"VAT / CIF No.", key:"vatNo" },
                  { label:"SST No.", key:"sstNo" },
                ]}
                fileState={vatFile} setFileState={setVatFile}
                docs={docs} setDocs={setDocs}
              />
            </div>
          </div>

          {/* ── Business Description ── */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
            <SectionHead icon={<Globe size={13} color="#2563eb" />} title="Business Description" />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={hasPending}
              rows={4}
              placeholder="Describe your business — products, services, operations…"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: "0.8125rem", color: hasPending ? "#94a3b8" : DARK, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, background: hasPending ? "#f8fafc" : "#fff", cursor: hasPending ? "not-allowed" : "text" }}
              onFocus={e => { if (!hasPending) e.target.style.borderColor = "#2563eb" }}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
            <SectionHead icon={<User size={13} color="#2563eb" />} title="Contact Person" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Full Name" value={form.contactName} onChange={set("contactName")} disabled={hasPending} />
              <Field label="Designation / Title" value={form.designation} onChange={set("designation")} disabled={hasPending} />
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
            <SectionHead icon={<MapPin size={13} color="#2563eb" />} title="Office / Registered Address" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Address Line 1" value={form.address1} onChange={set("address1")} disabled={hasPending} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Address Line 2" value={form.address2} onChange={set("address2")} disabled={hasPending} />
              </div>
              <Field label="City" value={form.city} onChange={set("city")} disabled={hasPending} />
              <Field label="State / Province" value={form.state} onChange={set("state")} disabled={hasPending} />
              <Field label="Postcode" value={form.postcode} onChange={set("postcode")} disabled={hasPending} />
              <Field label="Country" value={form.country} onChange={set("country")} disabled={hasPending} />

            </div>

            {/* ── Interactive map ── */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Office Location</span>
                  <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#94a3b8" }}>Click on the map or drag the pin to set location</p>
                </div>
                <button
                  onClick={saveLocation}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: locSaved ? "#16a34a" : NAV, color: "#fff", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit", transition: "background 0.2s", flexShrink: 0 }}
                >
                  {locSaved ? <><CheckCircle size={11} /> Saved</> : <><MapPin size={11} /> Save Location</>}
                </button>
              </div>
              <iframe
                srcDoc={makeMapHtml(loc.lat, loc.lng)}
                style={{ width: "100%", height: 280, border: "1px solid #e2e8f0", borderRadius: 9, display: "block" }}
                title="Office location map"
              />
              {loc.lat && loc.lng && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <MapPin size={11} color="#94a3b8" />
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>{loc.lat}, {loc.lng}</span>
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>— click Save Location to confirm</span>
                </div>
              )}
            </div>
            </div>

        </div>

        {/* ── RIGHT: Change Log ───────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.cardShadow, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: DARK }}>Change History</p>
              <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: C.muted }}>Submitted profile update requests</p>
            </div>
            {requests.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Clock size={32} color="#e2e8f0" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>No changes submitted yet</p>
              </div>
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {requests.map((req, i) => (
                  <div key={req.id} style={{ padding: "14px 18px", borderBottom: i < requests.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                      <StatusBadge status={req.status} />
                      <span style={{ fontSize: "0.68rem", color: C.muted }}>{fmtDt(req.submittedAt)}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {req.changes.map(ch => (
                        <div key={ch.field} style={{ padding: "6px 10px", borderRadius: 7, background: "#f8fafc", border: `1px solid ${C.border}` }}>
                          <p style={{ margin: "0 0 3px", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{ch.label}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", color: "#dc2626", textDecoration: "line-through", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ch.oldVal || "—"}</span>
                            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>→</span>
                            <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ch.newVal || "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {req.status !== "PENDING" && (
                      <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: req.status === "APPROVED" ? "#f0fdf4" : "#fef2f2", fontSize: "0.7rem", color: req.status === "APPROVED" ? "#15803d" : "#dc2626" }}>
                        {req.status === "APPROVED" ? <CheckCircle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} /> : <XCircle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />}
                        {req.reviewedBy ?? "Office"} · {req.reviewedAt ? fmtDt(req.reviewedAt) : ""}
                        {req.reviewNote && <span style={{ display: "block", marginTop: 2, color: "inherit", opacity: 0.85 }}>{req.reviewNote}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: "0.75rem", color: "#1e40af", lineHeight: 1.6 }}>
            All profile updates require review and approval by the certification office before they take effect. Factory and product data can be managed independently under <strong>My Factories</strong>.
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
