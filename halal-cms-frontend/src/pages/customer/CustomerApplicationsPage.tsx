import React, { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { addNotification } from "@/lib/notifications"
import { addAuditLog } from "@/lib/auditLog"
import { useAuthStore } from "@/store/authStore"
import {
  Search, FileText, ChevronRight, ChevronLeft,
  Award, AlertCircle, RefreshCw,
  X, Globe, PenLine, RotateCcw, Send, CheckCircle2,
  Building2, Mail, Phone, Building, Paperclip,
  Hash, CalendarDays, Landmark, Receipt, Briefcase, ChevronDown,
  Check, ArrowRight, Zap,
  CreditCard, Upload,
  Tags, List, AlignLeft, Shield,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { getApplications, getCompanyInfo } from "@/api/applications"
import { getStatusStyle, formatDate } from "@/lib/utils"
import {
  loadApplicationBilling, saveApplicationBilling, loadInvoiceByApp,
  invoiceStatusStyle, formatInvoiceDate, loadStripeConfig, downloadInvoicePDF,
  loadPaymentEvidences, addPaymentEvidence, type Invoice, type PaymentEvidence,
} from "@/lib/billing"
import { loadPricing } from "@/lib/pricing"

const F    = "'Inter', system-ui, sans-serif"
const NAV  = "#0f2170"
const BLUE = "#2563eb"
const DARK = "#111827"

// "-" Static data "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-"
const STATUS_FLOW: Record<string, { done: string; upcoming: string }> = {
  DRAFT:                { done: "Draft saved by customer",           upcoming: "Pending submission"                },
  SUBMITTED:            { done: "Submitted by customer",             upcoming: "Awaiting review by HCB"            },
  UNDER_REVIEW:         { done: "Under review by HCB",               upcoming: "Decision pending by HCB"           },
  AGREEMENT_PENDING:    { done: "Approved by HCB",                   upcoming: "Agreement signing by customer"     },
  AGREEMENT_REVIEW:     { done: "Agreement signed by customer",      upcoming: "Agreement review by HCB"           },
  PENDING_PAYMENT:      { done: "Agreement approved by HCB",         upcoming: "Awaiting payment by customer"      },
  PAYMENT_REVIEW:       { done: "Payment submitted by customer",     upcoming: "Payment verification by HCB"       },
  AUDIT_SCHEDULED:      { done: "Payment verified by HCB",           upcoming: "Site audit by HCB"                 },
  DOCUMENT_SUBMISSION:  { done: "Audit plan issued by HCB",          upcoming: "Document submission by customer"   },
  AUDIT_IN_PROGRESS:    { done: "Documents submitted by customer",   upcoming: "Audit by HCB"                      },
  AUDIT_COMPLETED:      { done: "Audit completed by HCB",            upcoming: "NC clearance by customer"          },
  NC_CLEARANCE:         { done: "NC items cleared by customer",      upcoming: "Decision review by HCB"            },
  DECISION_MAKING:      { done: "Decision under review by HCB",      upcoming: "Certificate issuance by HCB"       },
  CERTIFICATION_REVIEW: { done: "Cert. review by HCB",               upcoming: "Certificate issuance by HCB"       },
  CERTIFIED:            { done: "Certificate issued by HCB",         upcoming: "Active - no action required"        },
  REJECTED:             { done: "Rejected by HCB",                   upcoming: "Re-application by customer"        },
}

const STATUS_IDX: Record<string, number> = {
  DRAFT: 0, SUBMITTED: 1, UNDER_REVIEW: 2,
  AGREEMENT_PENDING: 3, AGREEMENT_REVIEW: 4,
  PENDING_PAYMENT: 5, PAYMENT_REVIEW: 6,
  AUDIT_SCHEDULED: 7, DOCUMENT_SUBMISSION: 8,
  AUDIT_IN_PROGRESS: 9, AUDIT_COMPLETED: 10,
  NC_CLEARANCE: 11, DECISION_MAKING: 12,
  CERTIFICATION_REVIEW: 13, CERTIFIED: 14,
}

const PROGRESS_STEPS = [
  { label: "Application submitted", min: 1,  max: 2  },
  { label: "Application approved",  min: 3,  max: 2  },
  { label: "Sign agreement",        min: 3,  max: 4  },
  { label: "Payment",               min: 5,  max: 6  },
  { label: "Audit plan",            min: 7,  max: 7  },
  { label: "Submit documents",      min: 8,  max: 8  },
  { label: "F1 audit",              min: 9,  max: 9  },
  { label: "F2 audit",              min: 10, max: 10 },
  { label: "NC clearance",          min: 11, max: 11 },
  { label: "Decision making",       min: 12, max: 12 },
  { label: "Factory certificate",   min: 13, max: 13 },
  { label: "Issue certificate",     min: 14, max: 14 },
]

const CAT_LABELS: Record<string,string> = {
  food:"Food & Beverages", cosmetics:"Cosmetics & Personal Care",
  pharma:"Pharmaceuticals", logistics:"Logistics & Warehousing",
  restaurant:"Restaurant & F&B", mfg:"Manufacturing",
  slaughter:"Slaughterhouse", others:"Others",
}
const CAT_EMOJIS: Record<string,string> = {
  food:"", cosmetics:"", pharma:"", logistics:"",
  restaurant:"", mfg:"", slaughter:"", others:"",
}

const ACT_INFO: Record<string,{label:string;emoji:string}> = {
  dairy:{label:"Dairy",emoji:""}, eggs:{label:"Eggs & Egg Processing",emoji:""},
  meat:{label:"Meat & Poultry",emoji:"-"}, seafood:{label:"Seafood Processing",emoji:""},
  baking:{label:"Baking Ingredients",emoji:""}, confectionery:{label:"Confectionery & Chocolate",emoji:""},
  readymeals:{label:"Ready-to-Eat Meals",emoji:""}, vegetarian:{label:"Vegetarian Products",emoji:"--"},
  vegan:{label:"Vegan Products",emoji:""}, beverages:{label:"Beverages or Juices",emoji:""},
  oils:{label:"Oils & Fats",emoji:""}, spices:{label:"Spices and Sauces",emoji:""},
  flavoring:{label:"Flavoring & Additives",emoji:""}, supplements:{label:"Supplements",emoji:""},
  nutraceuticals:{label:"Nutraceuticals",emoji:""}, chemicals:{label:"(Synthetic) Chemicals",emoji:""},
  meddevices:{label:"Medical Devices",emoji:""}, cosmeticprod:{label:"Cosmetic Products",emoji:""},
  skincare:{label:"Skincare & Bodycare",emoji:""}, haircare:{label:"Hair Care",emoji:""},
  fragrance:{label:"Perfume & Fragrance",emoji:""}, animalfeed:{label:"Animal Feed",emoji:""},
  packaging:{label:"Packaging & Materials",emoji:""}, privatelabel:{label:"Trading / Private Label",emoji:""},
  slaughter:{label:"Slaughterhouse",emoji:""}, warehousing:{label:"Warehousing & Storage",emoji:""},
  coldchain:{label:"Cold Chain Logistics",emoji:""}, importexport:{label:"Import / Export",emoji:""},
  restaurant:{label:"Restaurant & Caf",emoji:""}, bakery:{label:"Bakery & Patisserie",emoji:""},
  catering:{label:"Catering",emoji:""}, hotel:{label:"Hotel & Hospitality",emoji:""},
  canteen:{label:"Canteen / Institutional",emoji:""}, cleaning:{label:"Cleaning Detergents",emoji:""},
  cleaningservice:{label:"Cleaning Services",emoji:""}, sanitization:{label:"Sanitization Products",emoji:""},
}

const COUNTRY_ISO: Record<string,string> = {
  "Malaysia":"my","Indonesia":"id","United Arab Emirates":"ae","Saudi Arabia":"sa",
  "Qatar":"qa","Kuwait":"kw","Bahrain":"bh","Oman":"om","Jordan":"jo","Egypt":"eg",
  "Turkey":"tr","Pakistan":"pk","Bangladesh":"bd","India":"in","Singapore":"sg",
  "Brunei":"bn","Philippines":"ph","United Kingdom":"gb","Germany":"de","France":"fr",
  "Netherlands":"nl","Belgium":"be","Switzerland":"ch","United States":"us",
  "Canada":"ca","Australia":"au","South Africa":"za","Morocco":"ma","Nigeria":"ng",
  "GCC":"sa","Others":"un",
}

const AGR_LANGUAGES = [
  { code: "en",    label: "English",               flag: "" },
  { code: "ar",    label: "Arabic",                flag: "" },
  { code: "ms",    label: "Malay",                 flag: "" },
  { code: "id",    label: "Indonesian",            flag: "" },
  { code: "tr",    label: "Turkish",               flag: "" },
  { code: "fr",    label: "French",                flag: "" },
  { code: "de",    label: "German",                flag: "" },
  { code: "ur",    label: "Urdu",                  flag: "" },
  { code: "zh",    label: "Chinese (Simplified)",  flag: "" },
  { code: "zh-TW", label: "Chinese (Traditional)", flag: "" },
  { code: "es",    label: "Spanish",               flag: "" },
  { code: "pt",    label: "Portuguese",            flag: "" },
  { code: "ru",    label: "Russian",               flag: "" },
  { code: "ja",    label: "Japanese",              flag: "" },
  { code: "ko",    label: "Korean",                flag: "" },
  { code: "th",    label: "Thai",                  flag: "" },
  { code: "bn",    label: "Bengali",               flag: "" },
  { code: "hi",    label: "Hindi",                 flag: "" },
  { code: "nl",    label: "Dutch",                 flag: "" },
  { code: "it",    label: "Italian",               flag: "" },
]

const ACTIVE_STATUSES = "SUBMITTED,UNDER_REVIEW,AGREEMENT_PENDING,AGREEMENT_REVIEW,PENDING_PAYMENT,PAYMENT_REVIEW,AUDIT_SCHEDULED,DOCUMENT_SUBMISSION,AUDIT_IN_PROGRESS,AUDIT_COMPLETED,NC_CLEARANCE,DECISION_MAKING,CERTIFICATION_REVIEW"

const TABS = [
  { label: "Active",    value: ACTIVE_STATUSES,              badge: true  },
  { label: "Certified", value: "CERTIFIED",                  badge: true  },
  { label: "Draft",     value: "DRAFT",                      badge: true  },
  { label: "Rejected",  value: "REJECTED,SUSPENDED,EXPIRED", badge: false },
]

const APP_TABS = ["Application","Agreement","Billing","Audit plan","Documents","Logs","Certificate"]

const PAGE_SIZE = 15

// "-" Shared styles "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-"
const card: React.CSSProperties = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"22px 24px", marginBottom:14 }
const secHead: React.CSSProperties = { fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:BLUE, margin:"0 0 20px", paddingBottom:12, borderBottom:"1px solid #dbeafe" }
const lbl: React.CSSProperties = { display:"block", fontSize:"0.7rem", fontWeight:600, color:"#64748b", marginBottom:"0.3rem", textTransform:"uppercase", letterSpacing:"0.06em" }

// "-" Read-only form helpers "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""
function ReadonlyYNA({ val }: { val: string }) {
  const opts = [
    { k:"yes", label:"Yes", color:"#16a34a" },
    { k:"no",  label:"No",  color:"#dc2626" },
    { k:"na",  label:"N/A", color:"#64748b" },
  ]
  return (
    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
      {opts.map(o => {
        const sel = val === o.k
        return (
          <div key={o.k} style={{ padding:"6px 18px", borderRadius:7,
            border: sel ? `2px solid ${o.color}` : "2px solid #e2e8f0",
            background: sel ? o.color : "#f8fafc",
            color: sel ? "#fff" : DARK,
            fontSize:"0.82rem", fontWeight:700, fontFamily:F, userSelect:"none" as const }}>
            {o.label}
          </div>
        )
      })}
    </div>
  )
}

function ReadonlyQRow({ q, val, last=false }: { q:string; val:string; last?:boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"12px 0", borderBottom: last?"none":"1px solid #f1f5f9" }}>
      <span style={{ fontSize:"0.72rem", color:"#64748b", lineHeight:1.5, fontFamily:F, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{q}</span>
      <ReadonlyYNA val={val} />
    </div>
  )
}

function ReadonlyFactoryCard({ f, idx, floorPlan }: { f:any; idx:number; floorPlan?: {data:string; name:string} | null }) {
  const [floorZoom, setFloorZoom] = useState(false)
  const lat = f.lat || "3.1390"
  const lng = f.lng || "101.6869"
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(lng)-0.08).toFixed(4)},${(parseFloat(lat)-0.06).toFixed(4)},${(parseFloat(lng)+0.08).toFixed(4)},${(parseFloat(lat)+0.06).toFixed(4)}&layer=mapnik&marker=${lat},${lng}`
  const isImg = floorPlan?.data.startsWith("data:image")
  return (
    <>
      <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
          <Building size={13} color={BLUE} />
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:DARK, fontFamily:F }}>Factory / Plant {idx+1}</span>
        </div>
        <div style={{ display:"flex" }}>
          <div style={{ flex:1, padding:"16px 18px", display:"flex", flexDirection:"column", gap:16, borderRight:"1px solid #e2e8f0" }}>
            {[
              { label:"Factory Name",   value: f.name    || "-" },
              { label:"Country",        value: f.country || "-" },
              { label:"City / Address", value: f.city    || "-" },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>{item.label}</div>
                <div style={{ fontSize:"0.83rem", fontWeight:600, color: item.value==="-"?"#cbd5e1":DARK, fontFamily:F }}>{item.value}</div>
              </div>
            ))}
            {(f.prodLines || f.prodVolume) && (
              <>
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>Production Lines</div>
                  <div style={{ fontSize:"0.83rem", fontWeight:600, color:DARK, fontFamily:F }}>{f.prodLines || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>Volume / Year</div>
                  <div style={{ fontSize:"0.83rem", fontWeight:600, color:DARK, fontFamily:F }}>{f.prodVolume ? `${f.prodVolume} ${f.volUnit||"-"}`.trim() : "-"}</div>
                </div>
              </>
            )}
          </div>
          <div style={{ width:"55%", flexShrink:0, display:"flex", gap:8, padding:"8px 8px 8px 0" }}>
            <iframe src={mapSrc} style={{ flex:1, height:"100%", minHeight:220, border:"none", display:"block", borderRadius:8 }} title={`Factory ${idx+1}`} />
            {floorPlan && (
              <div onClick={() => setFloorZoom(true)}
                style={{ width:"45%", flexShrink:0, border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", position:"relative", overflow:"hidden", background:"#f8fafc" }}
                onMouseOver={e => (e.currentTarget.style.background = "#f0f7ff")}
                onMouseOut={e  => (e.currentTarget.style.background = "#f8fafc")}>
                {isImg ? (
                  <img src={floorPlan.data} alt="Floor Plan" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                ) : (
                  <div style={{ height:"100%", minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:12 }}>
                    <FileText size={32} color={BLUE} />
                    <span style={{ fontSize:"0.7rem", fontWeight:600, color:BLUE, fontFamily:F, textAlign:"center" as const, wordBreak:"break-word" as const }}>{floorPlan.name}</span>
                  </div>
                )}
                <div style={{ position:"absolute", top:6, left:8, fontSize:"0.6rem", fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.85)", padding:"2px 7px", borderRadius:4, fontFamily:F, textTransform:"uppercase", letterSpacing:"0.06em" }}>Floor Plan</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {floorZoom && floorPlan && (
        <div onClick={() => setFloorZoom(false)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(1000px,95vw)", maxHeight:"93vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
              <FileText size={16} color={BLUE} />
              <span style={{ flex:1, fontSize:"0.88rem", fontWeight:700, color:DARK, fontFamily:F }}>{floorPlan.name}</span>
              <button onClick={() => setFloorZoom(false)} style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X style={{ width:14, height:14, color:"#64748b" }} />
              </button>
            </div>
            <div style={{ flex:1, overflow:"auto", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
              {isImg
                ? <img src={floorPlan.data} alt="Floor Plan" style={{ maxWidth:"100%", maxHeight:"85vh", objectFit:"contain", display:"block" }} />
                : <iframe src={floorPlan.data} title="Floor Plan" style={{ width:"100%", height:"85vh", border:"none", display:"block" }} />
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ProductCard({ p, i, fac }: { p:any; i:number; fac:any }) {
  const [open, setOpen] = useState(false)
  const ings: any[] = p.ingredients ?? []
  const stStyle = (status: string) => {
    const st = (status || "-").toLowerCase()
    if (st === "halal")                       return { bg:"#f0fdf4", color:"#16a34a" }
    if (st === "non-halal" || st === "haram") return { bg:"#fef2f2", color:"#dc2626" }
    if (st === "pending")                     return { bg:"#fffbeb", color:"#d97706" }
    return { bg:"#f1f5f9", color:"#64748b" }
  }
  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
      <div onClick={() => ings.length > 0 && setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f8fafc",
          cursor: ings.length > 0 ? "pointer" : "default",
          borderBottom: open ? "1px solid #e2e8f0" : "none" }}
        onMouseOver={e => { if (ings.length > 0) e.currentTarget.style.background = "#f0f7ff" }}
        onMouseOut={e  => { e.currentTarget.style.background = "#f8fafc" }}>
        <span style={{ width:22, height:22, borderRadius:6, background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", fontWeight:700, color:"#64748b", flexShrink:0 }}>{i+1}</span>
        <span style={{ fontSize:"1rem", flexShrink:0 }}>{p.emoji || ""}</span>
        <span style={{ fontWeight:700, fontSize:"0.875rem", color:DARK, fontFamily:F, flex:1 }}>{p.name}</span>
        {p.code && <span style={{ fontSize:"0.7rem", color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:6, fontFamily:F, flexShrink:0 }}>{p.code}</span>}
        {fac && <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 9px", borderRadius:6, fontFamily:F, flexShrink:0 }}>{fac.name}</span>}
        {ings.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
            <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", fontFamily:F }}>{ings.length} ingredient{ings.length !== 1 ? "s" : "-"}</span>
            <ChevronDown size={13} color="#94a3b8" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }} />
          </div>
        )}
        {ings.length === 0 && <span style={{ fontSize:"0.68rem", color:"#cbd5e1", fontFamily:F }}>No ingredients</span>}
      </div>
      {open && ings.length > 0 && (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.78rem", fontFamily:F }}>
          <thead>
            <tr style={{ background:"#fafbfc" }}>
              {["#","Ingredient Name","Status","Certificate"].map((h,j) => (
                <th key={j} style={{ padding:"6px 12px", textAlign:"left" as const, fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", letterSpacing:"0.06em", textTransform:"uppercase" as const, borderBottom:"1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ings.map((ing:any, j:number) => {
              const s = stStyle(ing.status)
              return (
                <tr key={ing.id || j} style={{ borderBottom: j < ings.length-1 ? "1px solid #f8fafc" : "none" }}>
                  <td style={{ padding:"7px 12px", color:"#cbd5e1", fontWeight:600, width:32 }}>{j+1}</td>
                  <td style={{ padding:"7px 12px", fontWeight:500, color:DARK }}>{ing.name || "-"}</td>
                  <td style={{ padding:"7px 12px" }}>
                    {ing.status
                      ? <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"2px 9px", borderRadius:20, background:s.bg, color:s.color }}>{ing.status}</span>
                      : <span style={{ color:"#cbd5e1", fontSize:"0.72rem" }}>-</span>}
                  </td>
                  <td style={{ padding:"7px 12px" }}>
                    {ing.certFile
                      ? <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color:BLUE, fontWeight:600 }}><Paperclip size={11} color={BLUE} />Certificate</div>
                      : <span style={{ color:"#cbd5e1", fontSize:"0.72rem" }}>-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function BillingTab({ app }: { app: any }) {
  const [billing, setBilling] = React.useState(() => loadApplicationBilling(app.id ?? 0))
  const [invoice, setInvoice] = React.useState<Invoice | null>(() => loadInvoiceByApp(app.id ?? 0))
  const stripeConfig = loadStripeConfig()
  const [evidences, setEvidences] = React.useState<PaymentEvidence[]>(() => loadPaymentEvidences(app.id ?? 0))
  const [newFile, setNewFile]     = React.useState<string | null>(null)
  const [newName, setNewName]     = React.useState("")
  const [newMime, setNewMime]     = React.useState("")
  const hasStripe = stripeConfig.enabled && !!stripeConfig.publishableKey
  const [payPref, setPayPref]     = React.useState<"BANK" | "ONLINE" | null>(() => hasStripe ? null : "BANK")

  React.useEffect(() => {
    setInvoice(loadInvoiceByApp(app.id ?? 0))
    setEvidences(loadPaymentEvidences(app.id ?? 0))
    setNewFile(null); setNewName("")
  }, [app.id, app.status])

  React.useEffect(() => {
    if (loadApplicationBilling(app.id ?? 0)) return
    const pricing = loadPricing()
    let accs: { id: string; standard?: string; unitPrice?: number }[] = []
    try { accs = JSON.parse(localStorage.getItem("hcs_hcb_accreditations") || "[]") } catch {}
    const stds: string[] = Array.isArray(app.selectedStandards) ? app.selectedStandards : []
    const appFeeRows = stds.length > 0 ? accs.filter(a => a.standard && stds.includes(a.standard)) : []
    const lineItems = [
      ...appFeeRows.map((a: any) => ({ description: "Application Fee - " + a.standard, quantity: 1, unitPrice: a.unitPrice ?? 0, total: a.unitPrice ?? 0 })),
      { description: "Audit Fee", quantity: 1, unitPrice: pricing.auditDayCost, total: pricing.auditDayCost },
    ]
    const subtotal  = lineItems.reduce((s, l) => s + l.total, 0)
    const vatAmount = subtotal * pricing.vatPct / 100
    saveApplicationBilling({
      applicationId: String(app.id),
      applicationNumber: app.applicationNumber ?? String(app.id).replace("local_", "#L"),
      companyName: app.companyName ?? "-",
      lineItems, subtotal, vatPct: pricing.vatPct, vatAmount,
      total: subtotal + vatAmount, currency: pricing.currency,
      savedAt: new Date().toISOString(),
    })
    setBilling(loadApplicationBilling(app.id ?? 0))
  }, [app.id])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => { setNewFile(ev.target?.result as string); setNewName(f.name); setNewMime(f.type) }
    r.readAsDataURL(f)
  }

  function submitEvidence() {
    if (!newFile) return
    const added = addPaymentEvidence(app.id ?? 0, {
      base64: newFile, fileName: newName, mimeType: newMime,
      uploadedAt: new Date().toISOString(), status: "PENDING",
    })
    setEvidences(loadPaymentEvidences(app.id ?? 0))
    setNewFile(null); setNewName("")
    addNotification("office", { type: "info", title: "Payment Evidence Uploaded", body: "Customer uploaded evidence: " + added.fileName })
  }

  const source   = invoice && invoice.status !== "CANCELLED" ? invoice : null
  const currency = source ? source.currency : (billing?.currency ?? "")
  const canPay   = app.status === "PENDING_PAYMENT" && !!source && (source.status === "ISSUED" || source.status === "OVERDUE")
  const isPaid   = !!source && source.status === "PAID"
  const fmt      = (n: number) => currency + " " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const hasAccepted = evidences.some(e => e.status === "ACCEPTED")

  const evStatusStyle = (st: string) => {
    if (st === "ACCEPTED") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", dot: "#22c55e" }
    if (st === "REJECTED") return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#ef4444" }
    return { bg: "#fffbeb", color: "#92400e", border: "#fde68a", dot: "#f59e0b" }
  }

  const renderEvidenceList = () => evidences.length === 0 ? (
    <div style={{ padding: "24px 14px", textAlign: "center" as const }}>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>No receipts uploaded yet</p>
    </div>
  ) : (
    <div>
      <div style={{ padding: "8px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Upload History ({evidences.length})</span>
      </div>
      {[...evidences].reverse().map((ev, i) => {
        const st = evStatusStyle(ev.status)
        const isImg = ev.mimeType.startsWith("image/")
        return (
          <div key={ev.id} style={{ padding: "12px 14px", borderBottom: i < evidences.length - 1 ? "1px solid #f1f5f9" : "none", background: "#fff" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {isImg ? (
                <img src={ev.base64} alt="" style={{ width: 44, height: 44, objectFit: "cover" as const, borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0, cursor: "pointer" }} onClick={() => window.open(ev.base64, "_blank")} />
              ) : (
                <div style={{ width: 44, height: 44, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }} onClick={() => window.open(ev.base64, "_blank")}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626" }}>PDF</span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ev.fileName}</p>
                <p style={{ margin: "2px 0 6px", fontSize: 10, color: "#94a3b8" }}>{new Date(ev.uploadedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: "1px solid " + st.border }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />{ev.status}
                </span>
                {ev.note && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b", fontStyle: "italic" as const }}>{ev.note}</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ fontFamily: F }}>

      {/* ── ACTION BAR ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" as const, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
        {isPaid && source && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CheckCircle2 size={16} color="#15803d" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>Payment Confirmed</span>
            {source.paymentDate && <span style={{ fontSize: 12, color: "#166534" }}>{formatInvoiceDate(source.paymentDate)}{source.paymentReference ? (" · " + source.paymentReference) : ""}</span>}
          </div>
        )}
        {!isPaid && canPay && stripeConfig.enabled && stripeConfig.publishableKey && (
          <button onClick={() => alert("Stripe checkout — integrate with loadStripe(\"" + stripeConfig.publishableKey + "\")")}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "#635bff", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <CreditCard size={15} />Pay Online with Stripe
          </button>
        )}
        {hasAccepted && !isPaid && (
          <span style={{ fontSize: 12, color: "#64748b" }}>Evidence accepted — awaiting payment confirmation by HCS</span>
        )}
        {source && (() => { const s = invoiceStatusStyle(source.status); return (
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />{source.status}
            </span>
            <button onClick={() => downloadInvoicePDF(source)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", color: DARK, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Download PDF
            </button>
          </div>
        )})()}
        {!source && (
          <span style={{ fontSize: 13, color: "#64748b" }}>Invoice will appear once HCS approves your agreement.</span>
        )}
      </div>

      {/* ── TWO-COLUMN: Invoice | Evidence ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>

        {/* LEFT — A4 Invoice */}
        <div>
          {source ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 4, boxShadow: "0 6px 32px rgba(0,0,0,0.09)", padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 18, marginBottom: 20, borderBottom: "3px solid #0f2170" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="42" height="42" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="52" height="52" rx="10" fill="#0f2170"/>
                    <circle cx="26" cy="25" r="12" stroke="#22c55e" strokeWidth="2.5" fill="none"/>
                    <path d="M26 13C19.4 13 14 18.4 14 25C14 31.6 19.4 37 26 37C26 37 21 33 21 26C21 19 26 15 26 15Z" fill="#22c55e"/>
                    <circle cx="31" cy="17" r="3" fill="#22c55e"/>
                  </svg>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0f2170" }}>HCS Halal Certification Body</p>
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
                      Level 12, Menara HCS, Jalan Semantan<br/>
                      50490 Kuala Lumpur, Malaysia
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#0f2170", lineHeight: 1 }}>INVOICE</p>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#64748b", lineHeight: 1.9 }}>
                    <div><strong style={{ color: DARK }}>No. </strong>{source.invoiceNumber}</div>
                    <div><strong style={{ color: DARK }}>Issued </strong>{formatInvoiceDate(source.issuedAt)}</div>
                    <div><strong style={{ color: DARK }}>Due </strong>{formatInvoiceDate(source.dueDate)}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.14em" }}>Bill To</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: DARK }}>{source.companyName || "—"}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Ref: {source.applicationNumber}</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f2170" }}>
                    <th style={{ padding: "9px 12px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Description</th>
                    <th style={{ padding: "9px 8px", textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: "#fff", width: 36 }}>Qty</th>
                    <th style={{ padding: "9px 12px", textAlign: "right" as const, fontSize: 10, fontWeight: 700, color: "#fff", width: 90 }}>Unit</th>
                    <th style={{ padding: "9px 12px", textAlign: "right" as const, fontSize: 10, fontWeight: 700, color: "#fff", width: 90 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {source.lineItems.map((li, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "9px 12px", fontSize: 12, color: DARK }}>{li.description}</td>
                      <td style={{ padding: "9px 8px", textAlign: "center" as const, fontSize: 12, color: "#64748b" }}>{li.quantity}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right" as const, fontSize: 12, color: "#64748b" }}>{fmt(li.unitPrice)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right" as const, fontSize: 12, fontWeight: 600, color: DARK }}>{fmt(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #e2e8f0" }}>
                <table style={{ borderCollapse: "collapse", minWidth: 220 }}>
                  <tbody>
                    <tr><td style={{ padding: "6px 12px", fontSize: 12, color: "#64748b", textAlign: "right" as const }}>Subtotal</td><td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right" as const, minWidth: 90 }}>{fmt(source.subtotal)}</td></tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}><td style={{ padding: "6px 12px", fontSize: 12, color: "#64748b", textAlign: "right" as const }}>VAT ({source.vatPct}%)</td><td style={{ padding: "6px 12px", fontSize: 12, textAlign: "right" as const }}>{fmt(source.vatAmount)}</td></tr>
                    <tr style={{ background: "#0f2170" }}><td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: "#fff", textAlign: "right" as const }}>TOTAL DUE</td><td style={{ padding: "10px 12px", fontSize: 15, fontWeight: 800, color: "#fff", textAlign: "right" as const }}>{fmt(source.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 20, padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#0f2170", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Payment Instructions</p>
                <p style={{ margin: "0 0 3px", color: "#64748b" }}><strong style={{ color: DARK }}>Bank: </strong>Maybank Berhad &nbsp;|&nbsp; <strong style={{ color: DARK }}>Acc No.: </strong>5621-4567-8901</p>
                <p style={{ margin: "0 0 3px", color: "#64748b" }}><strong style={{ color: DARK }}>Acc Name: </strong>HCS Halal Certification Body Sdn Bhd</p>
                <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>SWIFT: </strong>MBBEMYKL &nbsp;|&nbsp; <strong style={{ color: DARK }}>Ref.: </strong>{source.invoiceNumber}</p>
              </div>
              {isPaid && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>PAID</span>
                  {source.paymentDate && <span style={{ fontSize: 11, color: "#166534" }}>{formatInvoiceDate(source.paymentDate)}{source.paymentReference ? (" · " + source.paymentReference) : ""}</span>}
                </div>
              )}
              <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid #f1f5f9", textAlign: "center" as const, fontSize: 10, color: "#94a3b8" }}>
                Thank you for choosing HCS Halal Certification. For queries contact certification@hcs.com.my
              </div>
            </div>
          ) : (
            <div style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 8, padding: "60px 24px", textAlign: "center" as const }}>
              <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>No invoice issued yet</p>
              <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1" }}>Your invoice will appear once HCS approves your agreement.</p>
            </div>
          )}
        </div>

        {/* RIGHT — Payment Panel */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#fff" }}>

          {isPaid ? (
            <>
              <div style={{ padding: "12px 16px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={14} color="#15803d" />
                <span style={{ fontWeight: 700, fontSize: 12, color: "#15803d" }}>Payment Confirmed</span>
              </div>
              {renderEvidenceList()}
            </>
          ) : !canPay ? (
            <div style={{ padding: "40px 20px", textAlign: "center" as const }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Awaiting Invoice</p>
              <p style={{ margin: 0, fontSize: 11, color: "#cbd5e1" }}>Payment options will appear once HCS issues your invoice.</p>
            </div>
          ) : payPref === null ? (
            <>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: DARK }}>How would you like to pay?</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Choose your preferred payment method.</p>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <button onClick={() => setPayPref("BANK")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left" as const, width: "100%" }}>
                  <div style={{ width: 38, height: 38, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Landmark size={18} color="#2563eb" />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: DARK }}>Bank Transfer</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Transfer & upload your receipt</p>
                  </div>
                  <ArrowRight size={15} color="#94a3b8" style={{ marginLeft: "auto" }} />
                </button>
                <button onClick={() => setPayPref("ONLINE")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left" as const, width: "100%" }}>
                  <div style={{ width: 38, height: 38, background: "#f5f3ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CreditCard size={18} color="#635bff" />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: DARK }}>Pay Online</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Secure payment via Stripe</p>
                  </div>
                  <ArrowRight size={15} color="#94a3b8" style={{ marginLeft: "auto" }} />
                </button>
              </div>
            </>
          ) : payPref === "ONLINE" ? (
            <>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={14} color="#635bff" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Pay Online</span>
                </div>
                <button onClick={() => setPayPref(null)} style={{ fontSize: 11, color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change</button>
              </div>
              <div style={{ padding: "28px 20px", textAlign: "center" as const }}>
                <p style={{ margin: "0 0 18px", fontSize: 13, color: "#64748b" }}>Complete your payment securely via Stripe.</p>
                <button onClick={() => alert("Stripe checkout — integrate with loadStripe(\"" + stripeConfig.publishableKey + "\")")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#635bff", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  <CreditCard size={16} />Pay with Stripe
                </button>
              </div>
              {renderEvidenceList()}
            </>
          ) : (
            <>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Landmark size={14} color="#2563eb" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Bank Transfer</span>
                </div>
                {hasStripe && (
                  <button onClick={() => setPayPref(null)} style={{ fontSize: 11, color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change</button>
                )}
              </div>
              <div style={{ padding: "12px 16px", background: "#eff6ff", borderBottom: "1px solid #dbeafe" }}>
                <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>Transfer to:</p>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "#1e40af" }}>Maybank Berhad &nbsp;|&nbsp; Acc: 5621-4567-8901</p>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "#1e40af" }}>HCS Halal Certification Body Sdn Bhd</p>
                <p style={{ margin: 0, fontSize: 11, color: "#1e40af" }}>Ref: {source?.invoiceNumber ?? ""}</p>
              </div>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: DARK }}>Upload payment receipt</p>
                {newFile ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      {newMime.startsWith("image/") ? (
                        <img src={newFile} alt="" style={{ width: 48, height: 48, objectFit: "cover" as const, borderRadius: 6, border: "1px solid #e2e8f0" }} />
                      ) : (
                        <div style={{ width: 48, height: 48, background: "#fef2f2", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#dc2626" }}>PDF</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{newName}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Ready to submit</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={submitEvidence}
                        style={{ flex: 1, padding: "7px 0", background: BLUE, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Submit Receipt
                      </button>
                      <button onClick={() => { setNewFile(null); setNewName("") }}
                        style={{ padding: "7px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", cursor: "pointer", fontSize: 12 }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 14px", background: "#f8fafc", border: "2px dashed #bfdbfe", borderRadius: 10, cursor: "pointer", width: "100%", boxSizing: "border-box" as const }}>
                    <Upload size={22} color="#2563eb" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{evidences.length > 0 ? "Upload Another Receipt" : "Upload Receipt or Bank Slip"}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>JPG, PNG or PDF</span>
                    <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFileSelect} />
                  </label>
                )}
              </div>
              {renderEvidenceList()}
            </>
          )}

        </div>

      </div>
    </div>
  )
}

function PlaceholderTab({ icon, label }: { icon:string; label:string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" }}>
      <div style={{ fontSize:"2.2rem", marginBottom:10 }}>{icon}</div>
      <p style={{ margin:0, fontSize:"0.88rem", fontWeight:600, color:"#475569", fontFamily:F }}>{label}</p>
      <p style={{ margin:"5px 0 0", fontSize:"0.76rem", color:"#94a3b8", fontFamily:F }}>This section will be available once your application is processed</p>
    </div>
  )
}

type CustomerDocumentUpload = {
  id: string
  fileName: string
  type: string
  uploadedOn: string
  base64: string
  mimeType: string
}

const REQUIRED_DOCUMENTS = {
  "SET-1": [
    "Halal policy Document",
    "Halal Management Team",
    "Training certificates of each personnel",
    "Quality manual / Halal-related activities manual",
    "List of all suppliers with halal certification",
  ],
  "SET-2": [
    "Management Review Procedures",
    "Management Review Schedules",
    "Last Internal Audit Report",
    "Quality Management System certification",
    "Food Safety Management System certification",
  ],
}

function CustomerDocumentsTab({ app }: { app:any }) {
  const storageKey = `hcs_customer_documents_${app.id}`
  const [documents, setDocuments] = useState<CustomerDocumentUpload[]>(() => ls<CustomerDocumentUpload[]>(storageKey, []))
  const guideStored = ls<any>(`hcs_document_guidance_${app.id}`, [])
  const guideComments = Array.isArray(guideStored)
    ? guideStored
    : guideStored ? [{ id:"legacy", text:guideStored, by:"HCB", at:"" }] : []
  function saveDocuments(next: CustomerDocumentUpload[]) {
    setDocuments(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const item: CustomerDocumentUpload = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        fileName: file.name,
        type,
        uploadedOn: new Date().toISOString(),
        base64: reader.result as string,
        mimeType: file.type || "application/octet-stream",
      }
      const next = type === "Extra required documents"
        ? [item, ...documents]
        : [item, ...documents.filter(d => d.type !== type)]
      saveDocuments(next)
      addNotification("office", { type: "info", title: "Document Uploaded", body: `${app.companyName || app.applicationNumber || "Customer"} uploaded ${file.name}.` })
      e.target.value = ""
    }
    reader.onerror = () => {
      e.target.value = ""
    }
    reader.readAsDataURL(file)
  }

  function removeDocument(id: string) {
    saveDocuments(documents.filter(d => d.id !== id))
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, height:"calc(100vh - 300px)", minHeight:430, maxHeight:620, fontFamily:F, overflow:"hidden" }}>
      <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column" }}>
        <div style={{ marginBottom:10, flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:"0.95rem", fontWeight:800, color:DARK }}>Required documents</h3>
          <p style={{ margin:"3px 0 0", fontSize:"0.7rem", color:"#64748b", fontWeight:600 }}>Upload each file against its fixed requirement.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12, overflow:"auto", flex:1, minHeight:0 }}>
          {Object.entries(REQUIRED_DOCUMENTS).map(([setName, items]) => (
            <div key={setName} style={{ border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", overflow:"hidden", minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" }}>
                <span style={{ fontSize:"0.72rem", fontWeight:900, color:DARK }}>{setName}</span>
                <span style={{ fontSize:"0.66rem", fontWeight:800, color:"#64748b" }}>{items.filter(name => documents.some(d => d.type === name)).length}/{items.length} uploaded</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {items.map((name, index) => {
                  const uploaded = documents.find(d => d.type === name)
                  return (
                    <div key={name} style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 180px 96px", gap:10, alignItems:"center", padding:"9px 12px", borderTop:index === 0 ? "none" : "1px solid #f1f5f9" }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ margin:0, fontSize:"0.74rem", color:"#1f2937", fontWeight:700, lineHeight:1.35 }}>{name}</p>
                      </div>
                      <div style={{ minWidth:0 }}>
                        {uploaded ? (
                          <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
                            <span style={{ flexShrink:0, width:7, height:7, borderRadius:"50%", background:"#16a34a" }} />
                            <a href={uploaded.base64} target="_blank" rel="noopener noreferrer"
                              style={{ display:"inline-flex", alignItems:"center", gap:5, minWidth:0, color:"#334155", textDecoration:"none", fontSize:"0.7rem", fontWeight:700 }}>
                              <FileText size={12} color="#64748b" />
                              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{uploaded.fileName}</span>
                            </a>
                            <button onClick={() => removeDocument(uploaded.id)}
                              style={{ width:22, height:22, borderRadius:6, border:"1px solid #fee2e2", background:"#fff", color:"#dc2626", cursor:"pointer", flexShrink:0 }}>
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontWeight:600 }}>Not uploaded</span>
                        )}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <label style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, height:28, padding:"0 9px", borderRadius:7, border:"1px solid #cbd5e1", background:uploaded ? "#fff" : "linear-gradient(#f8fafc, #e5e7eb)", color:"#374151", fontSize:"0.67rem", fontWeight:800, cursor:"pointer" }}>
                          <Upload size={12} />
                          {uploaded ? "Replace" : "Upload"}
                          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style={{ display:"none" }} onChange={e => handleUpload(e, name)} />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:10, border:"1px dashed #cbd5e1", borderRadius:10, background:"#f8fafc", padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexShrink:0 }}>
          <div>
            <p style={{ margin:0, fontSize:"0.78rem", fontWeight:800, color:DARK }}>Extra required documents</p>
            <p style={{ margin:"2px 0 0", fontSize:"0.68rem", color:"#64748b", fontWeight:600 }}>Use this when HCB asks for any additional supporting file.</p>
          </div>
          <label style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, height:30, padding:"0 12px", borderRadius:8, border:"1px solid #d1d5db", background:"#fff", color:"#374151", fontSize:"0.72rem", fontWeight:800, cursor:"pointer", flexShrink:0 }}>
            <Upload size={13} />
            Upload extra
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style={{ display:"none" }} onChange={e => handleUpload(e, "Extra required documents")} />
          </label>
        </div>

        {documents.filter(d => d.type === "Extra required documents").length > 0 && (
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6, maxHeight:92, overflow:"auto", flexShrink:0 }}>
            {documents.filter(d => d.type === "Extra required documents").map(doc => (
              <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff" }}>
                <FileText size={14} color="#64748b" />
                <a href={doc.base64} target="_blank" rel="noopener noreferrer" style={{ flex:1, minWidth:0, color:"#334155", textDecoration:"none", fontSize:"0.74rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.fileName}</a>
                <button onClick={() => removeDocument(doc.id)} style={{ width:24, height:24, borderRadius:6, border:"1px solid #fee2e2", background:"#fff", color:"#dc2626", cursor:"pointer" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ border:"1px solid #e2e8f0", borderRadius:10, background:"#f8fafc", padding:"11px 14px", flexShrink:0, maxHeight:150, overflow:"auto" }}>
        <p style={{ margin:"0 0 8px", fontSize:"0.68rem", fontWeight:900, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>HCB comments history</p>
        {guideComments.length === 0 ? (
          <p style={{ margin:0, fontSize:"0.74rem", color:"#1f2937", lineHeight:1.45, fontWeight:600 }}>No HCB comment yet.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {guideComments.map((c:any) => (
              <div key={c.id} style={{ border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", padding:"8px 10px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:"0.7rem", fontWeight:800, color:DARK }}>{c.by || "HCB"}</span>
                  <span style={{ fontSize:"0.64rem", fontWeight:700, color:"#94a3b8" }}>{c.at ? new Date(c.at).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : ""}</span>
                </div>
                <p style={{ margin:0, fontSize:"0.74rem", color:"#1f2937", lineHeight:1.45, fontWeight:600 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CustomerAuditPlanTab({ app }: { app:any }) {
  const today = new Date()
  const savedPlan = ls<any>(`hcs_audit_plan_${app.id}`, {})
  const initialMonth = savedPlan.calendarMonth ? new Date(savedPlan.calendarMonth) : new Date(today.getFullYear(), today.getMonth(), 1)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1))
  const [requestedAt, setRequestedAt] = useState<string>(() => savedPlan.changeRequestedAt || "")
  const canGoNext = visibleMonth.getFullYear() < 2030 || visibleMonth.getMonth() < 11
  const canGoPrev = visibleMonth.getFullYear() > today.getFullYear() || visibleMonth.getMonth() > today.getMonth()
  const appRef = app.applicationNumber ?? `#${app.id}`
  const submitted = app.savedAt || app.submittedAt

  const requestChangeDate = () => {
    const now = new Date().toISOString()
    const request = {
      ...savedPlan,
      applicationId: app.id,
      applicationNumber: appRef,
      companyName: app.companyName || "",
      requestedMonth: visibleMonth.toISOString(),
      changeRequestedAt: now,
      changeRequestStatus: "PENDING",
    }
    localStorage.setItem(`hcs_audit_plan_${app.id}`, JSON.stringify(request))
    setRequestedAt(now)
    addNotification("office", { type: "warning", title: "Audit Date Change Requested", body: `${app.companyName || appRef} requested an audit date change.` })
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, height:"100%", fontFamily:F }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:0, padding:"10px 14px", flexShrink:0 }}>
        <div>
          <p style={{ margin:0, fontSize:"0.72rem", fontWeight:800, color:BLUE, textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Audit Plan</p>
          <p style={{ margin:"3px 0 0", fontSize:"0.68rem", color:"#94a3b8", fontWeight:600 }}>Review the planned audit month and request a date change if needed.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button
            onClick={requestChangeDate}
            style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", height:34, padding:"0 18px", background:"#fff", color:BLUE, border:"1px solid #bfdbfe", borderRadius:8, fontSize:"0.78rem", fontWeight:800, cursor:"pointer", fontFamily:F }}
            onMouseOver={e => (e.currentTarget.style.background = "#eff6ff")}
            onMouseOut={e => (e.currentTarget.style.background = "#fff")}
          >
            Request change date
          </button>
          <span style={{ fontSize:"0.68rem", fontWeight:800, color:requestedAt ? "#a16207" : "#64748b", background:requestedAt ? "#fef3c7" : "#f1f5f9", padding:"5px 12px", borderRadius:999 }}>
            {requestedAt ? "Request sent" : "No request"}
          </span>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"stretch", height:"calc(100vh - 315px)", minHeight:430, maxHeight:620, overflow:"hidden" }}>
        <div style={{ flex:"0 0 calc(28% - 5px)", minWidth:245, ...card, marginBottom:0, padding:"16px 18px", overflow:"auto" }}>
          <p style={{ ...secHead, marginBottom:14, paddingBottom:10 }}>PLAN DETAILS</p>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <CustomerAuditInfo label="Application No" value={appRef} />
            <CustomerAuditInfo label="Company" value={app.companyName || "-"} />
            <CustomerAuditInfo label="Status" value={savedPlan.status || "Pending"} />
            <CustomerAuditInfo label="Submitted" value={submitted ? new Date(submitted).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "-"} />
          </div>

          <div style={{ marginTop:14, padding:"11px 13px", borderRadius:10, border:"1px solid #dbeafe", background:"#eff6ff" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <CalendarDays size={15} color={BLUE} />
              <span style={{ fontSize:"0.82rem", fontWeight:800, color:DARK }}>Scheduled Window</span>
            </div>
            <p style={{ margin:0, fontSize:"0.7rem", color:"#475569", lineHeight:1.45 }}>
              HCB will confirm the exact audit date. You can request a change from this panel.
            </p>
          </div>

          <div style={{ marginTop:14 }}>
            <p style={{ margin:"0 0 8px", fontSize:"0.7rem", fontWeight:800, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Audit Team</p>
            {["Lead auditor", "Sharia auditor", "Audit date", "Duration"].map(item => (
              <div key={item} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"8px 0", borderBottom:"1px solid #e2e8f0" }}>
                <span style={{ fontSize:"0.74rem", fontWeight:700, color:"#334155" }}>{item}</span>
                <span style={{ fontSize:"0.72rem", color:"#94a3b8" }}>Pending</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex:"0 0 calc(72% - 5px)", minWidth:0, ...card, marginBottom:0, padding:"16px 18px", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10, paddingBottom:10, borderBottom:"1px solid #dbeafe" }}>
            <div>
              <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:BLUE }}>MONTHLY CALENDAR</p>
              <p style={{ margin:"3px 0 0", fontSize:"0.68rem", color:"#94a3b8", fontWeight:600 }}>Load one month at a time until December 2030</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={() => canGoPrev && setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} disabled={!canGoPrev}
                style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"1px solid #dbeafe", background:"#fff", cursor:canGoPrev ? "pointer" : "not-allowed", opacity:canGoPrev ? 1 : 0.45 }}>
                <ChevronLeft size={15} color={BLUE} />
              </button>
              <button onClick={() => canGoNext && setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} disabled={!canGoNext}
                style={{ display:"inline-flex", alignItems:"center", gap:7, height:30, padding:"0 12px", borderRadius:8, border:"1px solid #2563eb", background:canGoNext ? BLUE : "#94a3b8", color:"#fff", cursor:canGoNext ? "pointer" : "not-allowed", fontSize:"0.72rem", fontWeight:800, fontFamily:F }}>
                Next Month
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div style={{ flex:1, minHeight:0 }}>
            <CustomerMonthCalendar year={visibleMonth.getFullYear()} month={visibleMonth.getMonth()} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerAuditInfo({ label, value }: { label:string; value:React.ReactNode }) {
  return (
    <div style={{ paddingBottom:9, borderBottom:"1px solid #e2e8f0" }}>
      <div style={{ fontSize:"0.58rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:"0.78rem", fontWeight:700, color:DARK, overflowWrap:"anywhere" }}>{value}</div>
    </div>
  )
}

function CustomerMonthCalendar({ year, month }: { year:number; month:number }) {
  const monthName = new Date(year, month, 1).toLocaleString("en-GB", { month:"long" })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const cells: (number | null)[] = [
    ...Array.from({ length:offset }, () => null),
    ...Array.from({ length:daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length < 42) cells.push(null)
  const today = new Date()

  return (
    <div style={{ padding:0, height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:"1rem", fontWeight:900, color:DARK }}>{monthName}</span>
        <span style={{ fontSize:"0.78rem", fontWeight:800, color:"#64748b", background:"#f1f5f9", padding:"3px 10px", borderRadius:999 }}>{year}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0, 1fr))", gap:5, flex:1, minHeight:0 }}>
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={`${d}-${i}`} style={{ height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.66rem", fontWeight:800, color:"#94a3b8" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <div key={i} style={{ minHeight:0, height:"100%", display:"flex", alignItems:"flex-start", justifyContent:"flex-start", borderRadius:8, padding:7, border:day ? "1px solid #e2e8f0" : "1px solid transparent", background:isToday ? BLUE : day ? "#f8fafc" : "transparent", color:isToday ? "#fff" : day ? "#334155" : "transparent", fontSize:"0.76rem", fontWeight:isToday ? 900 : 700 }}>
              {day ?? ""}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// "-" Signature canvas "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""
function SignatureCanvas({ onSign, onClear }: { onSign: (d: string) => void; onClear: () => void }) {
  const ref     = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)

  function xy(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const c = ref.current!
    const r = c.getBoundingClientRect()
    const src = "touches" in e ? e.touches[0] : e
    return {
      x: (src.clientX - r.left) * (c.width  / r.width),
      y: (src.clientY - r.top)  * (c.height / r.height),
    }
  }

  function setup(c: HTMLCanvasElement) {
    const ctx = c.getContext("2d")!
    ctx.strokeStyle = "#1e3a8a"
    ctx.lineWidth   = 2.5
    ctx.lineCap     = "round"
    ctx.lineJoin    = "round"
    return ctx
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const c   = ref.current!
    const ctx = setup(c)
    const p   = xy(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    drawing.current = true
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current) return
    const c   = ref.current!
    const ctx = setup(c)
    const p   = xy(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    hasStrokes.current = true
  }

  function onUp() {
    if (!drawing.current) return
    drawing.current = false
    if (hasStrokes.current) onSign(ref.current!.toDataURL())
  }

  function clear() {
    const c = ref.current!
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
    hasStrokes.current = false
    onClear()
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={ref} width={800} height={220}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        style={{ display: "block", width: "100%", height: 110, borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#f8fafc", cursor: "crosshair", touchAction: "none" }} />
      <button onClick={clear}
        style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
        <RotateCcw size={10} />Clear
      </button>
    </div>
  )
}

// "-" Agreement tab "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-"
interface LocalApp {
  id: string; status: string; savedAt: string
  companyName?: string; factoryName?: string
  products?: { name: string }[]; selectedMarkets?: string[]
  remarks?: string; logs?: any[]; applicationNumber?: string
  agreementSignedAt?: string; agreementSignature?: string; agreementLanguage?: string; agreementSignedPdf?: string
  [key: string]: any
}

function loadLocalApps(): LocalApp[] {
  localStorage.removeItem("hcs_local_applications")
  return []
}
function saveLocalApps(_apps: LocalApp[]) {
  localStorage.removeItem("hcs_local_applications")
}
function loadAgrPdfs(): Record<string, { fileName: string; pdfData: string }> {
  try { return JSON.parse(localStorage.getItem("hcs_agreement_pdfs") || "{}") } catch { return {} }
}
function loadAgrLangs(): string[] {
  try { return JSON.parse(localStorage.getItem("hcs_agreement_langs") || "[]") } catch { return [] }
}
function ls<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback } catch { return fallback }
}
function parsePayloadJson(app: any): any {
  const raw = app?.payloadJson
  if (!raw) return {}
  if (typeof raw === "object") return raw
  try { return JSON.parse(raw) } catch { return {} }
}
function hydrateApplication(app: any): LocalApp {
  const payload = parsePayloadJson(app)
  return {
    ...payload,
    ...app,
    id: app.id ?? payload.id,
    status: app.status ?? payload.status,
    savedAt: payload.savedAt ?? app.submittedAt ?? app.createdAt ?? app.updatedAt ?? new Date().toISOString(),
    applicationNumber: app.applicationNumber ?? payload.applicationNumber,
    companyName: app.companyName ?? payload.companyName ?? payload.snapshotProfile?.companyName,
    companyEmail: app.companyEmail ?? payload.companyEmail ?? payload.snapshotProfile?.email,
    companyPhone: app.companyPhone ?? payload.companyPhone ?? payload.snapshotProfile?.phone,
    companyWeb: app.companyWeb ?? payload.companyWeb ?? payload.snapshotProfile?.website,
    type: app.type ?? payload.type ?? "NEW",
    halalStandard: app.halalStandard ?? payload.halalStandard ?? payload.selectedStandards?.[0],
    country: app.country ?? payload.country ?? payload.snapshotProfile?.country,
    productCount: app.productCount ?? payload.productCount ?? payload.products?.length ?? 0,
  } as LocalApp
}
function factoryLocation(app: LocalApp) {
  const factories = app.snapshotFactories ?? ls<any[]>('hcs_factories', [])
  const factory = factories.find((f:any) => !app.factoryId || f.id === app.factoryId)
  const parts = [factory?.city || factory?.address, factory?.country].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

function AgreementTab({ app, user, onUpdate }: { app: LocalApp; user: any; onUpdate: (updated: LocalApp) => void }) {
  const agrPdfs    = loadAgrPdfs()
  const agrCodes   = loadAgrLangs()
  const available  = agrCodes.map(c => AGR_LANGUAGES.find(l => l.code === c)).filter((l): l is typeof AGR_LANGUAGES[0] => !!l && !!agrPdfs[l.code])
  const [lang, setLang]       = useState(available[0]?.code ?? "-")
  const [sig, setSig]         = useState("-")
  const [agreed, setAgreed]   = useState(false)
  const [done, setDone]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const onSign  = useCallback((d: string) => setSig(d), [])
  const onClear = useCallback(() => setSig("-"), [])

  const langMeta  = AGR_LANGUAGES.find(l => l.code === lang)
  const selectedPdf = agrPdfs[lang]

  if (app.status === "AGREEMENT_REVIEW" || app.agreementSignedAt) {
    const sl = AGR_LANGUAGES.find(l => l.code === app.agreementLanguage)
    // Use the signed PDF (with embedded signature) if available, else fall back to original
    const displayPdf = (app as any).agreementSignedPdf || agrPdfs[app.agreementLanguage ?? "-"]?.pdfData
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <CheckCircle2 size={16} color="#16a34a" />
          <div>
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#15803d" }}>Agreement Submitted - Awaiting HCB Review</p>
            <p style={{ margin: "1px 0 0", fontSize: "0.71rem", color: "#166534" }}>
              Signed in <strong>{sl?.label ?? app.agreementLanguage}</strong> on {app.agreementSignedAt ? new Date(app.agreementSignedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}
            </p>
          </div>
        </div>
        {displayPdf && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            {/* PDF with signature embedded on the last page */}
            <iframe src={displayPdf} title="Signed Agreement"
              style={{ width: "100%", height: 600, border: "none", display: "block", background: "#f8fafc" }} />

            {/* Last page - signature at the bottom, right side */}
            <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "40px 40px 32px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.12em", textAlign: "center" }}>- Signature Page -</p>
              <p style={{ margin: "0 0 48px", fontSize: "0.7rem", color: "#94a3b8", textAlign: "center" }}>
                The undersigned parties agree to the terms set forth in this agreement.
              </p>

              {/* Signatures pinned to the bottom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>

                {/* HCB - bottom left */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>HCB Authorised Signatory</p>
                  <div style={{ height: 90, borderRadius: 6, border: "1.5px dashed #e2e8f0", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>Signed by HCB</p>
                  </div>
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>Halal Certification Body</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Date: {app.agreementSignedAt ? new Date(app.agreementSignedAt).toLocaleDateString("en-GB") : "-"}</p>
                  </div>
                </div>

                {/* Customer - bottom right with signature image */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                    {app.companyName ?? app.factoryName}
                  </p>
                  <div style={{ height: 90, borderRadius: 6, border: "1.5px solid #bfdbfe", background: "#f0f9ff", overflow: "hidden", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {app.agreementSignature
                      ? <img src={app.agreementSignature} alt="Signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 6 }} />
                      : <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>-</p>
                    }
                  </div>
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{app.companyName ?? app.factoryName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                      Signed: {app.agreementSignedAt ? new Date(app.agreementSignedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (app.status !== "AGREEMENT_PENDING") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem", marginBottom: 10 }}>"</div>
        <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Agreement Not Available</p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>The agreement will appear here once HCB approves your application.</p>
      </div>
    )
  }

  if (done) {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 420, width: "90%", textAlign: "center" as const, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", border: "4px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Agreement Signed!</p>
            <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#374151", lineHeight: 1.6 }}>
              Your agreement has been submitted to HCB for review.
            </p>
            <p style={{ margin: "0 0 28px", fontSize: "0.78rem", color: "#94a3b8" }}>
              You will be notified once HCB has reviewed your signed agreement.
            </p>
            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0", marginBottom: 20 }}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#15803d" }}>Status updated to Agreement Review</span>
            </div>
            <button onClick={() => window.location.reload()}
              style={{ width: "100%", padding: "10px", borderRadius: 9, background: "#0f2170", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, fontFamily: F }}>
              Back to My Applications
            </button>
          </div>
        </div>
        <div />
      </>
    )
  }

  async function submit() {
    if (!sig || !agreed || !selectedPdf || submitting) return
    setSubmitting(true)
    try {
      const actorName = user?.name ?? "Customer"
      const appRef    = app.applicationNumber ?? app.id.replace("local_", "#L")
      const coName    = app.companyName ?? app.factoryName ?? "-"
      const now       = new Date().toISOString()

      function b64(s: string) {
        const bin = atob(s.replace(/^data:[^;]+;base64,/, ""))
        const out = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
        return out
      }

      let signedPdfData: string | undefined
      try {
        const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")
        const pdfDoc   = await PDFDocument.load(b64(selectedPdf.pdfData), { ignoreEncryption: true })
        const sigImage = await pdfDoc.embedPng(b64(sig))
        const pages    = pdfDoc.getPages()
        const last     = pages[pages.length - 1]
        const { width } = last.getSize()
        const font   = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const sigW = 180, sigH = 70, mx = 36, my = 36
        last.drawRectangle({ x: width-sigW-mx, y: my, width: sigW, height: sigH, borderColor: rgb(0.18,0.30,0.86), borderWidth: 0.8 })
        last.drawImage(sigImage, { x: width-sigW-mx+4, y: my+4, width: sigW-8, height: sigH-8 })
        last.drawLine({ start:{x:width-sigW-mx,y:my-2}, end:{x:width-mx,y:my-2}, thickness:0.8, color:rgb(0.22,0.22,0.22) })
        last.drawText(coName.slice(0,28), { x: width-sigW-mx, y: my-14, size:8, font, color:rgb(0.07,0.09,0.15) })
        last.drawText(`Signed: ${new Date(now).toLocaleDateString("en-GB")}`, { x: width-sigW-mx, y: my-24, size:7, font, color:rgb(0.39,0.45,0.55) })
        const bytes = await pdfDoc.save()
        signedPdfData = await new Promise<string>(res => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(new Blob([bytes as any], { type: "application/pdf" }))
        })
      } catch (pdfErr) {
        console.warn("pdf-lib embed failed, continuing without signed PDF:", pdfErr)
      }

      const updated: LocalApp = {
        ...app,
        status: "AGREEMENT_REVIEW",
        agreementSignedAt: now,
        agreementSignature: sig,
        agreementLanguage: lang,
        ...(signedPdfData ? { agreementSignedPdf: signedPdfData } : {}),
        logs: [...(app.logs ?? []), { timestamp: now, action: "Agreement Signed", by: actorName, note: `Signed in ${langMeta?.label ?? lang}`, color: "#2563eb" }],
      }
      try {
        saveLocalApps(loadLocalApps().map(la => la.id === app.id ? updated : la))
      } catch {
        // QuotaExceededError — save without the large PDF blob
        const slim = { ...updated, agreementSignedPdf: undefined }
        saveLocalApps(loadLocalApps().map(la => la.id === app.id ? slim : la))
      }
      addAuditLog({ applicationId: app.id, applicationNumber: appRef, companyName: coName, actor: actorName, role: "Customer", action: "Agreement Signed", details: `Customer signed the agreement (${langMeta?.label ?? lang})`, oldStatus: "AGREEMENT_PENDING", newStatus: "AGREEMENT_REVIEW", category: "APPLICATION" })
      addNotification("office", { type: "info", title: "Agreement Signed", body: `${coName} has signed the agreement - please review.` })
      onUpdate(updated)
      setDone(true)
    } catch (err) {
      console.error("submit agreement:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PenLine size={20} color="#2563eb" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>Action Required - Sign Agreement</p>
          <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#64748b" }}>Read the agreement carefully, then draw your signature in the pad below.</p>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "5px 12px", flexShrink: 0 }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Pending</span>
        </div>
      </div>
      {available.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
            <Globe size={13} color="#2563eb" />Choose Language
          </label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", fontFamily: F, outline: "none", width: "100%" }}>
            {available.map(l => <option key={l.code} value={l.code}>{l.flag}  {l.label}</option>)}
          </select>
        </div>
      ) : (
        <div style={{ padding: "12px 14px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#92400e" }}>
          No agreement PDF has been uploaded by HCB yet. Please check back later.
        </div>
      )}
      {selectedPdf && (
        <div>
          {/* "" Document view: PDF + signature page as one continuous paper "" */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "10px 10px 0 0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>

            {/* PDF pages */}
            <iframe key={lang} src={selectedPdf.pdfData} title="Agreement PDF"
              style={{ width: "100%", height: 480, border: "none", display: "block", background: "#f8fafc" }} />

            {/* Signature page - attached below, looks like last page of doc */}
            <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "28px 40px 24px" }}>
              <p style={{ margin: "0 0 24px", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.12em", textAlign: "center" }}>- Signature Page -</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

                {/* HCB left */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>HCB Authorised Signatory</p>
                  <div style={{ height: 110, borderRadius: 6, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Signed by HCB</p>
                  </div>
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 7 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>Halal Certification Body</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Date: {new Date().toLocaleDateString("en-GB")}</p>
                  </div>
                </div>

                {/* Customer right - canvas directly in slot */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <PenLine size={11} color="#1d4ed8" />
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                      Your Signature {langMeta && <span style={{ marginLeft: 3 }}>{langMeta.flag}</span>}
                    </p>
                  </div>
                  <SignatureCanvas onSign={onSign} onClear={onClear} />
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 7, marginTop: 10 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{app.companyName ?? app.factoryName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Date: {new Date().toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "2px solid #e2e8f0" }}>
                {/* Declaration block */}
                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Declaration &amp; Acknowledgement</p>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                  By signing this agreement, the undersigned authorised representative of <strong>{app.companyName ?? app.factoryName ?? "the applicant company"}</strong> hereby declares and confirms the following:
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 18 }}>
                  {[
                    "All information submitted in this halal certification application is true, accurate, and complete to the best of my knowledge.",
                    "I understand that submission of false or misleading information may result in immediate rejection, suspension, or revocation of certification.",
                    "I/We agree to grant authorised HCB auditors full access to premises, records, and personnel as required during the audit process.",
                    "I/We commit to maintaining compliance with all applicable halal standards throughout the certification period.",
                    "I have read, understood, and agree to be legally bound by all terms and conditions set forth in this agreement.",
                  ].map((text, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "default" }}>
                      <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}>{text}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                      style={{ marginTop: 2, width: 15, height: 15, accentColor: "#2563eb", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600, lineHeight: 1.5 }}>I confirm all declarations above and authorise this submission on behalf of my organisation.</span>
                  </label>
                  <button onClick={submit} disabled={!sig || !agreed || submitting}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: (!sig || !agreed || submitting) ? "#e2e8f0" : "#16a34a", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: (!sig || !agreed || submitting) ? "#94a3b8" : "#fff", cursor: (!sig || !agreed || submitting) ? "not-allowed" : "pointer", flexShrink: 0 }}>
                    {submitting ? <><RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }} />Signing</> : <><Send size={14} />Sign &amp; Submit</>}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

// "-" Main page "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-"
export default function CustomerApplicationsPage() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [search,      setSearch]      = useState("-")
  const [statusGroup, setStatusGroup] = useState(ACTIVE_STATUSES)
  const [page,        setPage]        = useState(0)
  const [localApps,   setLocalApps]   = useState<LocalApp[]>(loadLocalApps)
  const [viewApp,     setViewApp]     = useState<LocalApp | null>(null)
  const [appTab,      setAppTab]      = useState("Application")
  const detailRef = useRef<HTMLDivElement>(null)

  const refreshLocal = () => setLocalApps(loadLocalApps())

  const rejectedLocalApps = localApps.filter(la => la.status === "REJECTED")

  function selectApp(app: LocalApp) {
    const hydrated = hydrateApplication(app)
    if (viewApp?.id === hydrated.id) { setViewApp(null); return }
    setViewApp(hydrated)
    const CUSTOMER_STATUS_TAB: Record<string, string> = {
      AGREEMENT_PENDING:         "Agreement",
      AGREEMENT_REVIEW:          "Agreement",
      AGREEMENT_APPROVED_BY_HCB: "Billing",
      PENDING_PAYMENT:           "Billing",
      PAYMENT_REVIEW:            "Billing",
    }
    setAppTab(CUSTOMER_STATUS_TAB[hydrated.status] ?? "Application")
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60)
  }

  function handleAgreementUpdate(updated: LocalApp) {
    const all = loadLocalApps().map(la => la.id === updated.id ? updated : la)
    saveLocalApps(all)
    setLocalApps(all)
    setViewApp(updated)
  }

  function resubmitApp(id: string) {
    const all  = loadLocalApps()
    const app  = all.find(la => la.id === id)
    const next = all.map(la => la.id !== id ? la : {
      ...la, status: "SUBMITTED",
      logs: [...((la as any).logs ?? []), { timestamp: new Date().toISOString(), action: "Application Resubmitted", by: "Customer", note: "Customer resubmitted after rejection.", color: "#2563eb" }],
    })
    saveLocalApps(next); setLocalApps(next)
    addAuditLog({ applicationId: id, applicationNumber: id.replace("local_", "#L"), companyName: app?.companyName ?? app?.factoryName ?? "-", actor: "Customer", role: "Customer", action: "Application Resubmitted", details: "Customer resubmitted application after HCB rejection", oldStatus: "REJECTED", newStatus: "SUBMITTED", category: "APPLICATION" })
    addNotification("office", { type: "info", title: "Application Resubmitted", body: `${app?.companyName ?? id} has resubmitted their application after rejection. Please review.` })
  }

  const { data, isLoading } = useQuery({
    queryKey: ["cust-apps", { page, search, statusGroup }],
    queryFn:  () => getApplications({ page, size: PAGE_SIZE, search: search || undefined, statuses: statusGroup || undefined }),
  })
  const { data: allData }       = useQuery({ queryKey: ["cust-apps-all"],       queryFn: () => getApplications({ page: 0, size: 1 }) })
  const { data: activeData }    = useQuery({ queryKey: ["cust-apps-active"],    queryFn: () => getApplications({ page: 0, size: 1, statuses: ACTIVE_STATUSES }) })
  const { data: certifiedData } = useQuery({ queryKey: ["cust-apps-certified"], queryFn: () => getApplications({ page: 0, size: 1, statuses: "CERTIFIED" }) })
  const { data: draftData }     = useQuery({ queryKey: ["cust-apps-draft"],     queryFn: () => getApplications({ page: 0, size: 1, statuses: "DRAFT" }) })
  const { data: companyInfoData } = useQuery({
    queryKey: ["application-company-info", viewApp?.id],
    queryFn: () => viewApp?.id && !viewApp._local ? getCompanyInfo(viewApp.id as any) : null,
    retry: false,
    enabled: !!viewApp?.id && !viewApp._local,
  })

  const apiApps       = data?.content           ?? []
  const totalPages    = data?.totalPages         ?? 0
  const totalAll      = allData?.totalElements       ?? 0
  const totalActive   = activeData?.totalElements    ?? 0
  const totalCert     = certifiedData?.totalElements ?? 0
  const totalDraft    = draftData?.totalElements     ?? 0

  const filteredLocal = localApps.filter(la => {
    const statuses = statusGroup.split(",")
    return statuses.includes(la.status)
  }).filter(la => !search || la.companyName?.toLowerCase().includes(search.toLowerCase()) || la.id.includes(search))

  const apps = [
    ...filteredLocal.map(la => ({ id: la.id, _local: true, applicationNumber: la.id.replace("local_", "#L"), companyName: la.companyName || la.factoryName || "-", country: null, type: "New Application", status: la.status, halalStandard: la.selectedStandards?.[0] ?? null, submittedAt: la.savedAt, updatedAt: la.savedAt, productCount: la.products?.length ?? 0, factoryLocation: factoryLocation(la) } as any)),
    ...apiApps,
  ]

  const localActiveCount = localApps.filter(la => ACTIVE_STATUSES.split(",").includes(la.status)).length
  const localDraftCount  = localApps.filter(la => la.status === "DRAFT").length
  const tabCounts: Record<string, number> = { [ACTIVE_STATUSES]: totalActive + localActiveCount, "CERTIFIED": totalCert, "DRAFT": totalDraft + localDraftCount }

  const STATS = [
    { label: "Total",     value: totalAll + localApps.length,   bg: "#1e3a8a" },
    { label: "Active",    value: totalActive + localActiveCount, bg: "#0ea5e9" },
    { label: "Certified", value: totalCert,                      bg: "#009999" },
    { label: "Draft",     value: totalDraft + localDraftCount,   bg: "#64748b" },
  ]

  // "-" Application tab content (full form view like office portal) "-""-""-""-""-""
  const a       = viewApp
  const appNum  = a ? (a.applicationNumber ?? (a.id ? String(a.id).replace("local_","#L") : "-")) : "-"
  const company = a ? (a.companyName || a.factoryName || "-") : "-"
  const status  = a?.status ?? "-"
  const s       = status ? getStatusStyle(status as any) : { bg:"#f1f5f9", color:"#64748b", dot:"#94a3b8", label:"-" }

  const applicationTab = !a ? null : (() => {
    const PRE_APPROVAL = ["DRAFT", "SUBMITTED", "UNDER_REVIEW"]
    const frozen = !PRE_APPROVAL.includes(a.status)
    const profile   = a.snapshotProfile || ls<any>('hcs_profile', {})
    const regDocs   = a.snapshotRegDocs || ls<any>('hcs_reg_docs', {})
    const cats      = frozen && a.snapshotCategories ? a.snapshotCategories : ls<string[]>('hcs_categories', [])
    const acts      = frozen && a.snapshotActivities ? a.snapshotActivities : ls<string[]>('hcs_activities', [])
    const desc      = frozen && a.snapshotDescription != null ? a.snapshotDescription : (localStorage.getItem('hcs_description') || '')
    const factories = frozen && a.snapshotFactories  ? a.snapshotFactories  : ls<any[]>('hcs_factories', [])

    const email   = a.companyEmail || profile.email   || companyInfoData?.email || "-"
    const phone   = a.companyPhone || profile.phone   || companyInfoData?.phone || "-"
    const website = a.companyWeb   || profile.website || companyInfoData?.website || "-"
    const compType= profile.companyType || a.businessType || companyInfoData?.companyType || "-"
    const compReg = profile.companyReg  || a.registrationNumber || companyInfoData?.registrationNumber || "-"
    const licenseNo   = regDocs.licenseNo     || a.licenseNo     || companyInfoData?.businessLicenseNo || "-"
    const licExpiry   = regDocs.licenseExpiry || a.licenseExpiry || companyInfoData?.licenseExpiry || "-"
    const issuingAuth = regDocs.issuingAuth   || a.issuingAuthority || companyInfoData?.issuingAuthority || "-"
    const vatNo       = regDocs.vatNo         || a.vatNo         || companyInfoData?.vatSstNo || "-"
    const sstNo       = regDocs.sstNo         || a.sstNo         || "-"

    const markets: string[]   = a.selectedMarkets  ?? []
    const certCats: string[]  = a.selectedCertCats ?? []
    const standards: string[] = a.selectedStandards ?? []
    const products: any[]     = a.products          ?? []
    const halalCerts: any[]   = a.halalCerts        ?? []
    const trainingRecs: any[] = a.trainingRecs       ?? []
    const appFactories = factories.filter((f:any) => !a.factoryId || f.id === a.factoryId)
    const ci = STATUS_IDX[a.status] ?? -1

    return (
      <div style={{ fontFamily:F }}>

        {/* Progress stepper */}
        <div style={{ ...card, marginBottom:14, overflowX:"auto" }}>
          <div style={{ display:"flex", alignItems:"flex-start", minWidth:780 }}>
            {PROGRESS_STEPS.map((step, i) => {
              const done   = ci > step.max
              const active = ci >= step.min && ci <= step.max
              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div style={{ flex:1, height:2, marginTop:15, background: ci >= step.min ? "#16a34a" : "#e2e8f0" }} />
                  )}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, width:72, flexShrink:0 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                      background: done ? "#16a34a" : active ? "#fff" : "#f1f5f9",
                      border: done ? "2px solid #16a34a" : active ? `2px solid ${BLUE}` : "2px solid #e2e8f0",
                      boxShadow: active ? "0 0 0 4px rgba(37,99,235,0.12)" : "none",
                    }}>
                      {done
                        ? <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 5L4.5 8.5L12 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <span style={{ fontSize:"0.7rem", fontWeight:700, color: active ? BLUE : "#94a3b8", fontFamily:F }}>{i+1}</span>
                      }
                    </div>
                    <span style={{ fontSize:"0.58rem", fontWeight: active ? 700 : done ? 600 : 400, color: done ? "#16a34a" : active ? DARK : "#94a3b8", textAlign:"center" as const, lineHeight:1.35, fontFamily:F }}>
                      {step.label}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Company Information | Services & Activities + Application Details */}
        <div style={{ display:"flex", gap:14, alignItems:"stretch", marginBottom:14 }}>

          {/* Left: Company Information */}
          <div style={{ ...card, flex:"0 0 58%", marginBottom:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, paddingBottom:12, borderBottom:"1px solid #e2e8f0" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>COMPANY INFORMATION</p>
              <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))" }}>
              {[
                { Icon:Building2,    label:"Company Name",        value: company },
                { Icon:Mail,         label:"Email",               value: email },
                { Icon:Phone,        label:"Phone",               value: phone },
                { Icon:Globe,        label:"Website",             value: website },
                { Icon:Briefcase,    label:"Company Type",        value: compType || "-" },
                { Icon:Hash,         label:"Registration No",     value: compReg  || "-" },
                { Icon:FileText,     label:"Business License No", value: licenseNo },
                { Icon:CalendarDays, label:"License Expiry",      value: licExpiry },
                { Icon:Landmark,     label:"Issuing Authority",   value: issuingAuth },
                { Icon:Receipt,      label:"VAT / SST No",        value: vatNo !== "-" ? vatNo : sstNo },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"13px 16px" }}>
                  <div style={{ width:16, height:16, flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>{r.label}</div>
                    <div style={{ fontSize:"0.83rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F }}>{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Services & Activities + Application Details stacked */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>

            {/* Services & Activities */}
            {(cats.length > 0 || acts.length > 0 || desc) && (
              <div style={{ ...card, marginBottom:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #e2e8f0" }}>
                  <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>SERVICES & ACTIVITIES</p>
                  <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
                </div>
                <div>
                  {([
                    cats.length > 0 && { Icon:Tags,     label:"Activity Category",   value: cats.map((k:string)=>`${CAT_EMOJIS[k]||""} ${CAT_LABELS[k]||k}`.trim()).join("  ·  ") },
                    acts.length > 0 && { Icon:List,     label:"Specific Activities", value: acts.map((k:string)=>`${ACT_INFO[k]?.emoji||""} ${ACT_INFO[k]?.label||k}`.trim()).join("  ·  ") },
                    desc           && { Icon:AlignLeft, label:"Company Description", value: desc },
                  ] as any[]).filter(Boolean).map((r:any) => (
                    <div key={r.label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px" }}>
                      <div style={{ width:16, height:16, flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>{r.label}</div>
                        <div style={{ fontSize:"0.82rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F, lineHeight:1.55, wordBreak:"break-word" as const }}>{r.value||"-"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Details */}
            <div style={{ ...card, marginBottom:0, flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #e2e8f0" }}>
                <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>APPLICATION DETAILS</p>
                <span style={{ fontSize:"0.68rem", padding:"2px 10px", borderRadius:20, fontWeight:700, ...getStatusStyle(a.status as any) }}>{getStatusStyle(a.status as any).label}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))" }}>
                {[
                  { Icon:Hash,         label:"Application No",         value: a.applicationNumber || String(a.id).replace("local_","#L") },
                  { Icon:Briefcase,    label:"Type",                   value: a.type || "New Application" },
                  { Icon:CalendarDays, label:"Submitted",              value: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : a.savedAt ? new Date(a.savedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "-" },
                  { Icon:Shield,       label:"Certification Standard", value: standards.length > 0 ? standards.join(" · ") : "-" },
                  { Icon:Tags,         label:"Certification Category", value: certCats.length  > 0 ? certCats.join(" · ")  : "-" },
                  { Icon:Building2,    label:"Target Markets",         value: markets.length   > 0 ? markets.join(", ")    : "-" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px" }}>
                    <div style={{ width:16, height:16, flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>{r.label}</div>
                      <div style={{ fontSize:"0.82rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F, wordBreak:"break-word" as const }}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Target Market */}
        {markets.length > 0 && (
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>TARGET MARKET</p>
              <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{markets.length} selected</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:8 }}>
              {markets.map((m:string) => {
                const iso = COUNTRY_ISO[m] || "un"
                return (
                  <div key={m} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, padding:"12px 8px", borderRadius:12,
                    border:"2px solid #2563eb", background:"#eff6ff", boxShadow:"0 0 0 3px rgba(37,99,235,0.1)" }}>
                    <img src={`https://flagcdn.com/w40/${iso}.png`} alt={m}
                      style={{ width:36, height:24, objectFit:"cover", borderRadius:5, border:"1px solid #e2e8f0", flexShrink:0 }} />
                    <span style={{ fontSize:"0.72rem", fontWeight:600, color:"#1d4ed8", textAlign:"center" as const, lineHeight:1.3, fontFamily:F }}>{m}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Certification Category */}
        {certCats.length > 0 && (
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>CERTIFICATION CATEGORY</p>
              <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{certCats.length} selected</span>
            </div>
            <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              {certCats.map((cat:string, i:number) => (
                <div key={cat} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom: i < certCats.length-1 ? "1px solid #f1f5f9" : "none", background:"#fff" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:"2px solid #374151", background:"#374151", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:"0.82rem", fontWeight:500, color:DARK, fontFamily:F }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Halal Standards */}
        {standards.length > 0 && (
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>HALAL STANDARDS</p>
              <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{standards.length} selected</span>
            </div>
            <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              {standards.map((std:string, i:number) => (
                <div key={std} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom: i < standards.length-1 ? "1px solid #f1f5f9" : "none", background:"#fff" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:"2px solid #374151", background:"#374151", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:"0.82rem", fontWeight:500, color:DARK, fontFamily:F }}>{std}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Halal Certs */}
        {a.currCert && (
          <div style={card}>
            <p style={secHead}>CERTIFICATION STATUS</p>
            <ReadonlyQRow q="Is your company currently Halal Certified?" val={a.currCert} last={halalCerts.length === 0} />
            {halalCerts.length > 0 && (
              <div style={{ marginTop:16 }}>
                <label style={{ ...lbl, marginBottom:8 }}>Current Halal Certificate & History</label>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {halalCerts.map((c:any) => (
                    <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"6px 14px", padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e9ecef" }}>
                      {[
                        { label:"Certifying Body", value: c.body       || "-" },
                        { label:"Certificate No",  value: c.certNumber || "-" },
                        { label:"Issue Date",       value: c.issueDate  || "-" },
                        { label:"Expiry Date",      value: c.expiryDate || "-" },
                      ].map(r => (
                        <div key={r.label}>
                          <p style={{ margin:"0 0 3px", fontSize:"0.6rem", fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", fontFamily:F }}>{r.label}</p>
                          <p style={{ margin:0, fontSize:"0.83rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F }}>{r.value}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Training */}
        {a.trainingQ && (
          <div style={card}>
            <p style={secHead}>CONDUCTED TRAINING</p>
            <div style={{ marginBottom: trainingRecs.length > 0 ? 16 : 0 }}>
              <ReadonlyQRow q="Has the company conducted training on Halal certification requirements or Halal Standards?" val={a.trainingQ} last={trainingRecs.length === 0} />
            </div>
            {trainingRecs.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {trainingRecs.map((t:any) => (
                  <div key={t.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px 14px", padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e9ecef" }}>
                    {[
                      { label:"Training Title",    value: t.title    || "-" },
                      { label:"Training Provider", value: t.provider || "-" },
                      { label:"Date",              value: t.date     || "-" },
                    ].map(r => (
                      <div key={r.label}>
                        <p style={{ margin:"0 0 3px", fontSize:"0.6rem", fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", fontFamily:F }}>{r.label}</p>
                        <p style={{ margin:0, fontSize:"0.83rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F }}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Production Data */}
        {(appFactories.length > 0 || a.factoryName) && (
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>PRODUCTION DATA</p>
              <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
            </div>
            {(appFactories.length > 0
              ? appFactories
              : [{ id:"x", name: a.factoryName, country:"-", city:"-", lat:"3.1390", lng:"101.6869" }]
            ).map((f:any, i:number) => (
              <ReadonlyFactoryCard key={f.id} f={f} idx={i}
                floorPlan={a.floorPlanData ? { data: a.floorPlanData, name: a.floorPlanName || "Floor Plan" } : null} />
            ))}
          </div>
        )}

        {/* Production Compliance */}
        {[a.outsource,a.privateLab,a.porkProd,a.porkStore,a.freeFromMeat,a.freeFromDeriv,a.vegCert,a.fsmCert,a.alcoholProd,a.alcoholItem,a.dedicDays,a.dedicEquip,a.dedicStore].some(Boolean) && (
          <div style={card}>
            <p style={secHead}>PRODUCTION COMPLIANCE</p>
            <ReadonlyQRow q="Does the company outsource any production activities to third parties?"     val={a.outsource     || "-"} />
            <ReadonlyQRow q="Does the company provide private labeling services?"                        val={a.privateLab    || "-"} />
            <ReadonlyQRow q="Are any pork derivatives used in the production process?"                   val={a.porkProd      || "-"} />
            <ReadonlyQRow q="Are any pork derivatives present in the storage area?"                      val={a.porkStore     || "-"} />
            <ReadonlyQRow q="Is the facility free from any animal meat?"                                 val={a.freeFromMeat  || "-"} />
            <ReadonlyQRow q="Is the facility free from any animal derivatives?"                          val={a.freeFromDeriv || "-"} />
            <ReadonlyQRow q="Does the company hold a valid Vegetarian Certificate?"                      val={a.vegCert       || "-"} />
            <ReadonlyQRow q="Does the company hold a valid Food Safety Management Certificate?"          val={a.fsmCert       || "-"} />
            <ReadonlyQRow q="Are alcohols used in the production process (excluding cleaning)?"          val={a.alcoholProd   || "-"} />
            <ReadonlyQRow q="Is alcohol present in any of the products?"                                 val={a.alcoholItem   || "-"} />
            <ReadonlyQRow q="Does the facility have dedicated days for Halal production?"                val={a.dedicDays     || "-"} />
            <ReadonlyQRow q="Does the facility use dedicated equipment for Halal production?"            val={a.dedicEquip    || "-"} />
            <ReadonlyQRow q="Does the facility use dedicated storage for Halal production?"              val={a.dedicStore    || "-"} last />
          </div>
        )}

        {/* Products */}
        {(products.length > 0 || a.remarks) && (
          <div style={card}>
            <p style={secHead}>PRODUCTS & DECLARATION</p>
            {products.length > 0 && (
              <div style={{ marginBottom: a.remarks ? 22 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <label style={{ ...lbl, marginBottom:0 }}>Products for Certification</label>
                  <span style={{ fontSize:"0.72rem", fontWeight:600, color:"#fff", background:BLUE, padding:"1px 8px", borderRadius:10 }}>{products.length}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {products.map((p:any, i:number) => {
                    const fac = appFactories.find((f:any) => f.id === p.factoryId)
                    return <ProductCard key={p.id || i} p={p} i={i} fac={fac} />
                  })}
                </div>
              </div>
            )}
            {a.remarks && (
              <div>
                <label style={lbl}>Remarks</label>
                <div style={{ marginTop:6, padding:"9px 11px", borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", fontSize:"0.8125rem", color:"#374151", lineHeight:1.65, fontFamily:F }}>
                  {a.remarks}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application meta */}
        <div style={{ ...card, marginBottom:0, background:"#f8fafc" }}>
          <p style={{ ...secHead, marginBottom:12 }}>APPLICATION DETAILS</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px 20px" }}>
            {[
              { label:"Application #", value: appNum },
              { label:"Status",        value: s.label },
              { label:"Type",          value: a.type || "New Application" },
              { label:"Submitted",     value: a.savedAt ? new Date(a.savedAt).toLocaleString("en-GB") : "-" },
              { label:"Halal Standard",value: a.halalStandard || "-" },
              { label:"Remarks",       value: a.remarks || "-" },
            ].map(r => (
              <div key={r.label}>
                <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:3, fontFamily:F }}>{r.label}</div>
                <div style={{ fontSize:"0.83rem", fontWeight:600, color: r.value && r.value!=="-" ? DARK : "#cbd5e1", fontFamily:F }}>{r.value || "-"}</div>
              </div>
            ))}
          </div>
          {a.status === "REJECTED" && (a as any).rejectionReason && (
            <div style={{ marginTop:16, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px" }}>
              <p style={{ margin:"0 0 4px", fontSize:"0.72rem", fontWeight:700, color:"#dc2626" }}>Rejection Reason</p>
              <p style={{ margin:0, fontSize:"0.8rem", color:"#b91c1c" }}>{(a as any).rejectionReason}</p>
            </div>
          )}
        </div>

      </div>
    )
  })()

  // "-" Tab content map "-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-""-"
  const tabContent: Record<string,React.ReactNode> = !a ? {} : {
    "Application": applicationTab,
    "Agreement":   <AgreementTab app={a} user={user} onUpdate={handleAgreementUpdate} />,
    "Billing":     <BillingTab app={a} />,
    "Audit plan":  <CustomerAuditPlanTab app={a} />,
    "Documents":   <CustomerDocumentsTab app={a} />,
    "Certificate": <PlaceholderTab icon="" label="Certificate" />,
    "Logs": (() => {
      const entries = a.logs?.length ? [...a.logs].reverse() : [{
        timestamp: a.savedAt || "-", action: "Application Submitted", by: "Customer", color: "#16a34a",
      }]
      return (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em", fontFamily:F }}>Audit Trail</p>
            <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:6, fontFamily:F }}>{entries.length} event{entries.length !== 1 ? "s" : "-"}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0, borderLeft:"2px solid #e2e8f0", marginLeft:10 }}>
            {entries.map((log: any, i: number) => (
              <div key={i} style={{ display:"flex", gap:14, paddingBottom: i < entries.length-1 ? 20 : 0, position:"relative" }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:log.color ?? "#2563eb", flexShrink:0, marginLeft:-8, marginTop:2, border:"2px solid #fff", boxShadow:"0 0 0 2px " + (log.color ?? "#2563eb") + "33" }} />
                <div style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, padding:"10px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom: log.note ? 4 : 0 }}>
                    <p style={{ margin:0, fontSize:"0.8rem", fontWeight:700, color:"#0f172a", fontFamily:F }}>{log.action}</p>
                    <span style={{ fontSize:"0.66rem", fontWeight:600, color:"#fff", background:log.color ?? "#2563eb", padding:"2px 8px", borderRadius:6, fontFamily:F, flexShrink:0 }}>{log.by}</span>
                  </div>
                  {log.note && <p style={{ margin:"0 0 4px", fontSize:"0.75rem", color:"#475569", fontFamily:F, lineHeight:1.5 }}>{log.note}</p>}
                  <p style={{ margin:0, fontSize:"0.68rem", color:"#94a3b8", fontFamily:F }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString("en-GB") : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })(),
  }

  return (
    <CustomerLayout title="My Applications">
      <div style={{ fontFamily: F }}>

        {/* Page header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "18px 24px 0", marginBottom: 20, borderRadius: "12px 12px 0 0", border: "1px solid #e9ecef" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>My Applications</h1>
              <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#64748b" }}>Track and manage your halal certification applications</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: s.bg }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map(tab => {
              const isActive = statusGroup === tab.value
              const cnt = tab.badge ? (tabCounts[tab.value] ?? 0) : null
              return (
                <button key={tab.value} onClick={() => { setStatusGroup(tab.value); setPage(0) }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 18px", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, fontFamily: F, background: "transparent", color: isActive ? NAV : "#64748b", borderBottom: isActive ? `2.5px solid ${NAV}` : "2.5px solid transparent", marginBottom: -1, whiteSpace: "nowrap" as const }}>
                  {tab.label}
                  {cnt !== null && cnt > 0 && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, background: isActive ? NAV : "#e2e8f0", color: isActive ? "#fff" : "#64748b" }}>{cnt}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search + refresh */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 280 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
            <input type="text" placeholder="Search by number or company" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 33, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#0f172a", outline: "none", fontSize: "0.73rem", fontFamily: F, boxSizing: "border-box" as const }}
              onFocus={e => (e.target.style.borderColor = "#2563eb")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {localApps.length > 0 && <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, background: "#f1f5f9", padding: "3px 9px", borderRadius: 99, border: "1px solid #e2e8f0" }}>{localApps.length} pending sync</span>}
            <button onClick={refreshLocal} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Rejection banner */}
        {rejectedLocalApps.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#dc2626" }}>{rejectedLocalApps.length} application{rejectedLocalApps.length > 1 ? "s" : "-"} rejected by HCB</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.71rem", color: "#ef4444" }}>Review the rejection reason and resubmit after corrections.</p>
            </div>
            <button onClick={() => setStatusGroup("REJECTED,SUSPENDED,EXPIRED")}
              style={{ padding: "4px 10px", borderRadius: 7, background: "#dc2626", color: "#fff", border: "none", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>View</button>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e9ecef", background: "#fafbfc" }}>
                {["App #", "Submitted", "Company", "Type", "Location", "Standard", "Products", "Status", "Total", "Updated", "Progress", "-"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isLoading && apps.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: "60px 20px", textAlign: "center" }}>
                    <FileText size={28} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
                    <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>No applications yet</p>
                    <button onClick={() => navigate("/customer/factories")}
                      style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, fontSize: "0.78rem", fontWeight: 700, color: "#fff", background: NAV, border: "none", cursor: "pointer" }}>
                      Go to My Factories <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ) : apps.map(app => {
                const st       = getStatusStyle(app.status)
                const progress = { DRAFT:5,SUBMITTED:15,UNDER_REVIEW:25,AGREEMENT_PENDING:32,AGREEMENT_REVIEW:38,PENDING_PAYMENT:45,PAYMENT_REVIEW:52,AUDIT_SCHEDULED:58,DOCUMENT_SUBMISSION:63,AUDIT_IN_PROGRESS:70,AUDIT_COMPLETED:78,NC_CLEARANCE:83,DECISION_MAKING:88,CERTIFICATION_REVIEW:94,CERTIFIED:100 }[app.status as string] ?? 0
                const appBilling = loadApplicationBilling(app.id ?? 0)
                const appInvoice = loadInvoiceByApp(app.id ?? 0)
                const billTotal  = appInvoice && appInvoice.status !== 'CANCELLED' ? appInvoice.total : appBilling?.total
                const billCur    = appInvoice && appInvoice.status !== 'CANCELLED' ? appInvoice.currency : appBilling?.currency
                const isLocal  = (app as any)._local
                const isSelected = viewApp?.id === app.id
                const localRaw = localApps.find(la => la.id === app.id)
                const flow = STATUS_FLOW[app.status] ?? { done: app.status, upcoming: "-" }
                return (
                  <tr key={app.id}
                    onClick={() => selectApp((localRaw ?? app) as LocalApp)}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: isSelected ? "#eff6ff" : "transparent", borderLeft: isSelected ? "3px solid #2563eb" : "3px solid transparent", transition: "background 0.1s" }}
                    onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc" }}
                    onMouseOut={e  => { if (!isSelected) e.currentTarget.style.background = "transparent" }}>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "0.71rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 5, display: "inline-block" }}>{app.applicationNumber}</div>
                      {isLocal && <div style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>Pending sync</div>}
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" as const }}>{app.submittedAt ? formatDate(app.submittedAt) : "-"}</td>
                    <td style={{ padding: "11px 16px", fontSize: "0.79rem", fontWeight: 600, color: "#0f172a" }}>{app.companyName}</td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize:"0.68rem", padding:"2px 8px", borderRadius:20, background:"#f1f5f9", color:"#64748b", fontFamily:F, fontWeight:600, whiteSpace:"nowrap" }}>{app.type ?? "-"}</span></td>
                    <td style={{ padding: "11px 16px", fontSize:"0.7rem", color:"#64748b", maxWidth:150, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={app.factoryLocation ?? app.country ?? "-"}>{app.factoryLocation ?? app.country ?? "-"}</td>
                    <td style={{ padding: "11px 16px", fontSize:"0.7rem", color:"#64748b", maxWidth:160, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={app.halalStandard ?? "-"}>{app.halalStandard ?? "-"}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:24, height:22, padding:"0 8px", borderRadius:20, background:"#eef2ff", color:"#3730a3", fontSize:"0.68rem", fontWeight:700, fontFamily:F }}>
                        {app.productCount ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, whiteSpace:"nowrap" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <Check size={10} color="#16a34a" strokeWidth={2.5} />
                          <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#374151", fontFamily:F }}>{flow.done}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <ArrowRight size={10} color={BLUE} strokeWidth={2.5} />
                          <span style={{ fontSize:"0.68rem", fontWeight:600, color:BLUE, fontFamily:F }}>{flow.upcoming}</span>
                        </div>
                      </div>
                      {app.status === "AGREEMENT_PENDING" && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize: "0.63rem", color: "#d97706", fontWeight: 700, marginTop: 4 }}><Zap size={10} color="#d97706" strokeWidth={2.5} /> Signature required</div>
                      )}
                    </td>
                    <td style={{ padding: "11px 16px", whiteSpace: "nowrap" as const }}>
                      {billTotal != null
                        ? <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#0f172a", fontFamily:F }}>{billCur} {billTotal.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
                        : <span style={{ fontSize:"0.72rem", color:"#cbd5e1", fontFamily:F }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" as const }}>{app.updatedAt ? formatDate(app.updatedAt) : "--"}</td>
                    <td style={{ padding: "11px 16px", minWidth: 110 }}>
                      {app.status === "CERTIFIED"
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.69rem", color: "#15803d", fontWeight: 600 }}><Award size={12} />Certified</span>
                        : ["REJECTED","SUSPENDED","EXPIRED"].includes(app.status) ? <span style={{ fontSize: "0.69rem", color: "#94a3b8" }}>-</span>
                        : <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>Progress</span>
                              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: st.color }}>{progress}%</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 99, overflow: "hidden", background: "#f1f5f9", width: 100 }}>
                              <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: st.dot }} />
                            </div>
                          </div>
                      }
                    </td>
                    <td style={{ padding: "11px 16px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {isLocal && (
                          <button onClick={() => selectApp((localRaw ?? app) as LocalApp)}
                            style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7, fontSize:"0.7rem", fontWeight:600, background: isSelected ? "#dbeafe" : "#f0f7ff", color:BLUE, border:"none", cursor:"pointer", fontFamily:F }}>
                            {isSelected ? "Close" : "View"}
                          </button>
                        )}
                        {isLocal && app.status === "REJECTED" && (
                          <button onClick={() => resubmitApp(app.id as string)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, fontSize: "0.68rem", fontWeight: 700, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                            <RefreshCw size={10} />Resubmit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Page {page + 1} of {totalPages}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", opacity: page === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={13} color="#64748b" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                <ChevronRight size={13} color="#64748b" />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen detail popup */}
        {viewApp && (
          <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:"5vh 5vw" }}>
          <div ref={detailRef} style={{ width:"100%", height:"100%", maxWidth:1400, background:"#f1f5f9", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}>

            {/* Panel header */}
            <div style={{ padding: "14px 20px", background: "#2563eb", borderBottom: "1px solid #1d4ed8", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 6, flexShrink: 0 }}>{appNum}</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{company}</span>
              {/* Status flow badges */}
              {(() => {
                const flow = STATUS_FLOW[status] ?? { done: s.label, upcoming: "-" }
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ffffff", padding: "5px 14px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 900, color: BLUE, fontFamily: F }}>Current Status:</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#111827", fontFamily: F }}>{flow.done}</span>
                    </div>
                    <ArrowRight size={14} color="rgba(255,255,255,0.6)" strokeWidth={2} />
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ffffff", padding: "5px 14px", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 900, color: BLUE, fontFamily: F }}>Pending Work:</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#111827", fontFamily: F }}>{flow.upcoming}</span>
                    </div>
                  </div>
                )
              })()}
              <button onClick={() => setViewApp(null)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", overflowX: "auto", scrollbarWidth: "none" as const, background: "#fff" }}>
              {APP_TABS.map(tab => {
                const active = appTab === tab
                return (
                  <button key={tab} onClick={() => setAppTab(tab)}
                    style={{ padding: "10px 17px", fontSize: "0.77rem", fontWeight: active ? 700 : 400, color: active ? BLUE : "#64748b", background: "transparent", border: "none", borderBottom: `2px solid ${active ? BLUE : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: F, flexShrink: 0, transition: "color 0.1s", position: "relative" as const }}>
                    {tab}
                    {tab === "Agreement" && viewApp?.status === "AGREEMENT_PENDING" && (
                      <span style={{ position: "absolute" as const, top: 7, right: 5, width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
              {tabContent[appTab] ?? <PlaceholderTab icon="" label={appTab} />}
            </div>
          </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}




