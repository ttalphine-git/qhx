import React, { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Search, RefreshCw, FileText,
  ChevronLeft, ChevronRight, X, ChevronDown,
  Building2, Mail, Phone, Globe, Building, Shield,
  Briefcase, Hash, Paperclip, CalendarDays, Landmark, Receipt,
  Tags, List, AlignLeft,
  CheckCircle2, MessageSquare,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import "@/styles/audit.css"
import { NcsTab } from "@/components/NcsTab"
import { getApplications, getCompanyInfo } from "@/api/applications"
import {
  getApplicationAuditReport,
  getAuditPlan,
  getAuditReportConfigurations,
  saveAuditPlan as saveAuditPlanApi,
  type ApplicationAuditReportDto,
  type AuditReportConfigurationDto,
} from "@/api/audits"
import { getMgmtUsers } from "@/api/users"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import { DEFAULT_AUDIT_TRACKS, type AuditTrack } from "@/lib/hcbWorkflow"
import { CHECKLISTS, REFERENCE, type AuditType } from "@/lib/uploaded-audit/checklists"
import { DEFAULT_ACTIVITY_CATEGORY_SETTINGS } from "@/lib/activityOptions"
import { addNotification } from "@/lib/notifications"
import { addAuditLog } from "@/lib/auditLog"
import { useAuthStore } from "@/store/authStore"
import type { ApplicationStatus, UserListDto } from "@/types"
import {
  loadApplicationBilling, saveApplicationBilling, loadInvoiceByApp, createInvoiceFromBilling,
  saveInvoice, invoiceStatusStyle, formatInvoiceDate, downloadInvoicePDF,
  loadPaymentEvidences, updatePaymentEvidence,
  type Invoice, type InvoiceStatus, type PaymentEvidence,
} from "@/lib/billing"

const F    = "'Inter', system-ui, sans-serif"
const BLUE = "#2563eb"
const DARK = "#111827"

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
  CERTIFIED:            { done: "Certificate issued by HCB",         upcoming: "Active - no action required"       },
  REJECTED:             { done: "Rejected by HCB",                   upcoming: "Re-application by customer"        },
  SUSPENDED:            { done: "Suspended by HCB",                  upcoming: "Re-audit required by HCB"          },
  EXPIRED:              { done: "Certificate expired",                upcoming: "Renewal required by customer"      },
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
  food: "", cosmetics: "", pharma: "", logistics: "",
  restaurant: "", mfg: "", slaughter: "", others: "",
}

const ACT_INFO: Record<string,{label:string;emoji:string}> = {
  dairy:{label:"Dairy",emoji: ""}, eggs:{label:"Eggs & Egg Processing",emoji: ""},
  meat:{label:"Meat & Poultry",emoji: ""}, seafood:{label:"Seafood Processing",emoji: ""},
  baking:{label:"Baking Ingredients",emoji: ""}, confectionery:{label:"Confectionery & Chocolate",emoji: ""},
  readymeals:{label:"Ready-to-Eat Meals",emoji: ""}, vegetarian:{label:"Vegetarian Products",emoji: ""},
  vegan:{label:"Vegan Products",emoji: ""}, beverages:{label:"Beverages or Juices",emoji: ""},
  oils:{label:"Oils & Fats",emoji: ""}, spices:{label:"Spices and Sauces",emoji: ""},
  flavoring:{label:"Flavoring & Additives",emoji: ""}, supplements:{label:"Supplements",emoji: ""},
  nutraceuticals:{label:"Nutraceuticals",emoji: ""}, chemicals:{label:"(Synthetic) Chemicals",emoji: ""},
  meddevices:{label:"Medical Devices",emoji: ""}, cosmeticprod:{label:"Cosmetic Products",emoji: ""},
  skincare:{label:"Skincare & Bodycare",emoji: ""}, haircare:{label:"Hair Care",emoji: ""},
  fragrance:{label:"Perfume & Fragrance",emoji: ""}, animalfeed:{label:"Animal Feed",emoji: ""},
  packaging:{label:"Packaging & Materials",emoji: ""}, privatelabel:{label:"Trading / Private Label",emoji: ""},
  slaughter:{label:"Slaughterhouse",emoji: ""}, warehousing:{label:"Warehousing & Storage",emoji: ""},
  coldchain:{label:"Cold Chain Logistics",emoji: ""}, importexport:{label:"Import / Export",emoji: ""},
  restaurant:{label: "",emoji: ""}, bakery:{label:"Bakery & Patisserie",emoji: ""},
  catering:{label:"Catering",emoji: ""}, hotel:{label:"Hotel & Hospitality",emoji: ""},
  canteen:{label:"Canteen / Institutional",emoji: ""}, cleaning:{label:"Cleaning Detergents",emoji: ""},
  cleaningservice:{label:"Cleaning Services",emoji: ""}, sanitization:{label:"Sanitization Products",emoji: ""},
}

const normalizeActivityCategory = (key?: string) => {
  const raw = (key ?? "").trim().toLowerCase()
  if (!raw) return ""
  if (["manufacturing", "factory", "mfg"].includes(raw)) return "mfg"
  if (["slaughterhouse", "slaughter"].includes(raw)) return "slaughter"
  if (["meat", "meatprocessing", "meat-processing"].includes(raw)) return "meat-processing"
  return raw
}

const activityCategoriesFromApp = (app: any): string[] => {
  const factory = (app?.snapshotFactories ?? []).find((f:any) => !app?.factoryId || f.id === app.factoryId)
  const values = [
    ...(Array.isArray(factory?.activityCategories) ? factory.activityCategories : []),
    ...(Array.isArray(app?.activityCategories) ? app.activityCategories : []),
    ...(Array.isArray(app?.snapshotCategories) ? app.snapshotCategories : []),
    ...(app?.activityCategoryKey ? [app.activityCategoryKey] : []),
    ...(app?.activityCategory ? [app.activityCategory] : []),
  ].map(normalizeActivityCategory).filter(Boolean)
  return Array.from(new Set(values))
}

const specificActivitiesFromApp = (app: any): string[] => {
  const factory = (app?.snapshotFactories ?? []).find((f:any) => !app?.factoryId || f.id === app.factoryId)
  const values = [
    ...(Array.isArray(factory?.specificActivities) ? factory.specificActivities : []),
    ...(Array.isArray(app?.specificActivities) ? app.specificActivities : []),
    ...(Array.isArray(app?.snapshotActivities) ? app.snapshotActivities : []),
  ].filter(Boolean)
  return Array.from(new Set(values))
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

const CERT_CATEGORIES = [
  "Category A: Farming 1 (Animals)",
  "Category B: Farming 2 (Plants)",
  "Category C: Processing 1 (Perishable animal products)",
  "Category D: Processing 2 (Perishable vegetable products)",
  "Category E: Processing 3 (Products with long shelf life at room temperature)",
  "Category F: Feed production",
  "Category G: Food Service",
  "Category H: Distribution",
  "Category I: Services",
  "Category J: Transport and storage",
  "Category K: Equipment manufacturing",
  "Category L: Chemical and Biochemical manufacturing",
  "Category M: Packaging and wrapping material manufacturing",
]

const HALAL_STANDARDS = [
  "OIC/SMIIC 1:2019 (Halal Foods)",
  "OIC/SMIIC 24:2020 (Food Additives)",
  "OIC/SMIIC Halal Standard (General)",
  "GSO 2055-1:2015 (GCC Foods)",
  "UAE Halal Standard (ESMA)",
  "GSO Halal Standard (General)",
  "MS 1500:2019 (Malaysian Halal)",
  "HAS 23000 (BPJPH Indonesia)",
  "MUIS Halal Standard (Singapore)",
  "JAKIM Halal Standard",
]

const ACCREDITATIONS_STORAGE = "hcs_hcb_accreditations"
function loadConfiguredHalalStandards(): string[] {
  try {
    const rows = JSON.parse(localStorage.getItem(ACCREDITATIONS_STORAGE) || "[]")
    if (!Array.isArray(rows)) return HALAL_STANDARDS
    const standards = rows
      .map(row => typeof row?.standard === "string" ? row.standard.trim() : "")
      .filter(Boolean)
    return standards.length > 0 ? Array.from(new Set(standards)) : HALAL_STANDARDS
  } catch {
    return HALAL_STANDARDS
  }
}

const PAGE_SIZE = 15
const APP_TABS  = ["Application","Products","Agreement","Billing","Audit plan","Documents","Audit","NCs","Summary","Assignment","Decision","Final Decision","Logs","Chat","Certificate"]

const ACTIVE_STATUSES = "SUBMITTED,UNDER_REVIEW,AGREEMENT_PENDING,AGREEMENT_REVIEW,PENDING_PAYMENT,PAYMENT_REVIEW,AUDIT_SCHEDULED,DOCUMENT_SUBMISSION,AUDIT_IN_PROGRESS,AUDIT_COMPLETED,NC_CLEARANCE,DECISION_MAKING,CERTIFICATION_REVIEW"

const TABS = [
  { label: "Active",    value: ACTIVE_STATUSES,                     badge: true  },
  { label: "Certified", value: "CERTIFIED",                         badge: true  },
  { label: "Draft",     value: "DRAFT",                             badge: true  },
  { label: "Rejected",  value: "REJECTED,SUSPENDED,EXPIRED",        badge: false },
]

// "" Form-matching read-only components """"""""""""""""""""""""""

const card: React.CSSProperties = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"22px 24px", marginBottom:14 }
const secHead: React.CSSProperties = { fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:BLUE, margin:"0 0 20px", paddingBottom:12, borderBottom:"1px solid #dbeafe" }
const lbl: React.CSSProperties = { display:"block", fontSize:"0.7rem", fontWeight:600, color:"#64748b", marginBottom:"0.3rem", textTransform:"uppercase", letterSpacing:"0.06em" }

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
            fontSize:"0.82rem", fontWeight:700, fontFamily:F, userSelect:"none" }}>
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
      <span style={{ fontSize:"0.72rem", color:"#64748b", lineHeight:1.5, fontFamily:F, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{q}</span>
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
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"13px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
          <Building size={13} color={BLUE} />
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:DARK, fontFamily:F }}>Factory / Plant {idx+1}</span>
        </div>
        <div style={{ display:"flex" }}>
          {/* Left: details */}
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
                  <div style={{ fontSize:"0.83rem", fontWeight:600, color:DARK, fontFamily:F }}>{f.prodVolume ? `${f.prodVolume} ${f.volUnit||""}`.trim() : "-"}</div>
                </div>
              </>
            )}
          </div>
          {/* Right: map + floor plan side by side */}
          <div style={{ width:"55%", flexShrink:0, display:"flex", gap:8, padding:"8px 8px 8px 0" }}>
            <iframe src={mapSrc} style={{ flex:1, height:"100%", minHeight:220, border:"none", display:"block", borderRadius:8 }} title={`Factory ${idx+1}`} />
            {floorPlan && (
              <div onClick={() => setFloorZoom(true)}
                style={{ width:"45%", height:220, flexShrink:0, border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", position:"relative", overflow:"hidden", background:"#f8fafc" }}
                onMouseOver={e => (e.currentTarget.style.background = "#f0f7ff")}
                onMouseOut={e  => (e.currentTarget.style.background = "#f8fafc")}>
                {isImg ? (
                  <img src={floorPlan.data} alt="Floor Plan"
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                ) : (
                  <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:12 }}>
                    <FileText size={32} color={BLUE} />
                    <span style={{ fontSize:"0.7rem", fontWeight:600, color:BLUE, fontFamily:F, textAlign:"center" as const, wordBreak:"break-word" as const }}>{floorPlan.name}</span>
                  </div>
                )}
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(0,0,0,0)", transition:"background 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
                  onMouseOut={e  => (e.currentTarget.style.background = "rgba(0,0,0,0)")}>
                  <div style={{ background:"rgba(255,255,255,0.92)", borderRadius:8, padding:"5px 12px", fontSize:"0.72rem", fontWeight:700, color:DARK, fontFamily:F, display:"flex", alignItems:"center", gap:5 }}>
                    Click to view full size
                  </div>
                </div>
                <div style={{ position:"absolute", top:6, left:8, fontSize:"0.6rem", fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.85)", padding:"2px 7px", borderRadius:4, fontFamily:F, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Floor Plan
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floor plan zoom modal */}
      {floorZoom && floorPlan && (
        <div onClick={() => setFloorZoom(false)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(1000px,95vw)", maxHeight:"93vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
              <FileText size={16} color={BLUE} />
              <span style={{ flex:1, fontSize:"0.88rem", fontWeight:700, color:DARK, fontFamily:F }}>{floorPlan.name}</span>
              <button onClick={() => setFloorZoom(false)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
    const st = (status || "").toLowerCase()
    if (st === "halal")                       return { bg:"#f0fdf4", color:"#16a34a" }
    if (st === "non-halal" || st === "haram") return { bg:"#fef2f2", color:"#dc2626" }
    if (st === "pending")                     return { bg:"#fffbeb", color:"#d97706" }
    return { bg:"#f1f5f9", color:"#64748b" }
  }
  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
      {/* Product header - click to toggle ingredients */}
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
            <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", fontFamily:F }}>{ings.length} ingredient{ings.length !== 1 ? "s" : ""}</span>
            <ChevronDown size={13} color="#94a3b8" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }} />
          </div>
        )}
        {ings.length === 0 && <span style={{ fontSize:"0.68rem", color:"#cbd5e1", fontFamily:F }}>No ingredients</span>}
      </div>

      {/* Ingredients - collapsed by default */}
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

function A4Invoice({ invoice, fmt }: { invoice: Invoice; fmt: (n: number) => string }) {
  const ivStyle = invoiceStatusStyle(invoice.status)
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 4, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 48px", fontFamily: F }}>

      {/* ── HEADER: Logo + Address | INVOICE title + details ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, marginBottom: 28, borderBottom: "3px solid #0f2170" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="52" height="52" rx="10" fill="#0f2170"/>
            <circle cx="26" cy="25" r="12" stroke="#22c55e" strokeWidth="2.5" fill="none"/>
            <path d="M26 13C19.4 13 14 18.4 14 25C14 31.6 19.4 37 26 37C26 37 21 33 21 26C21 19 26 15 26 15Z" fill="#22c55e"/>
            <circle cx="31" cy="17" r="3" fill="#22c55e"/>
          </svg>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f2170" }}>HCS Halal Certification Body</p>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
              Level 12, Menara HCS, Jalan Semantan<br/>
              50490 Kuala Lumpur, Malaysia<br/>
              Tel: +60 3-2123 4567 &nbsp;|&nbsp; certification@hcs.com.my
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: "#0f2170", letterSpacing: "0.03em", lineHeight: 1 }}>INVOICE</p>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" as const, gap: 3 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong style={{ color: DARK, marginRight: 6 }}>Invoice No.</strong>{invoice.invoiceNumber}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong style={{ color: DARK, marginRight: 6 }}>Date Issued</strong>{formatInvoiceDate(invoice.issuedAt)}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong style={{ color: DARK, marginRight: 6 }}>Due Date</strong>{formatInvoiceDate(invoice.dueDate)}</p>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: ivStyle.bg, color: ivStyle.color }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ivStyle.dot }} />{invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── BILL TO ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.14em" }}>Bill To</p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{invoice.companyName || "—"}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Application Ref: {invoice.applicationNumber}</p>
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#0f2170" }}>
            <th style={{ padding: "11px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Description</th>
            <th style={{ padding: "11px 16px", textAlign: "center" as const, fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.08em", width: 48 }}>Qty</th>
            <th style={{ padding: "11px 16px", textAlign: "right" as const, fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.08em", width: 130 }}>Unit Price</th>
            <th style={{ padding: "11px 16px", textAlign: "right" as const, fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.08em", width: 130 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "11px 16px", fontSize: 13, color: DARK }}>{li.description}</td>
              <td style={{ padding: "11px 16px", textAlign: "center" as const, fontSize: 13, color: "#64748b" }}>{li.quantity}</td>
              <td style={{ padding: "11px 16px", textAlign: "right" as const, fontSize: 13, color: "#64748b" }}>{fmt(li.unitPrice)}</td>
              <td style={{ padding: "11px 16px", textAlign: "right" as const, fontSize: 13, fontWeight: 600, color: DARK }}>{fmt(li.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALS ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #e2e8f0" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 280 }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 16px", fontSize: 13, color: "#64748b", textAlign: "right" as const }}>Subtotal</td>
              <td style={{ padding: "8px 16px", fontSize: 13, color: DARK, textAlign: "right" as const, fontWeight: 500, minWidth: 110 }}>{fmt(invoice.subtotal)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "8px 16px", fontSize: 13, color: "#64748b", textAlign: "right" as const }}>VAT / Tax ({invoice.vatPct}%)</td>
              <td style={{ padding: "8px 16px", fontSize: 13, color: DARK, textAlign: "right" as const, fontWeight: 500 }}>{fmt(invoice.vatAmount)}</td>
            </tr>
            <tr style={{ background: "#0f2170" }}>
              <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 800, color: "#fff", textAlign: "right" as const }}>TOTAL DUE</td>
              <td style={{ padding: "13px 16px", fontSize: 17, fontWeight: 800, color: "#fff", textAlign: "right" as const }}>{fmt(invoice.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAYMENT INSTRUCTIONS ── */}
      <div style={{ marginTop: 28, padding: "18px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#0f2170", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Payment Instructions</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
            <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>Bank Name: </strong>Maybank Berhad</p>
            <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>Account Name: </strong>HCS Halal Certification Body Sdn Bhd</p>
            <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>Account No.: </strong>5621-4567-8901</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
            <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>SWIFT / BIC: </strong>MBBEMYKL</p>
            <p style={{ margin: 0, color: "#64748b" }}><strong style={{ color: DARK }}>Payment Ref.: </strong>{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* ── PAID STAMP ── */}
      {invoice.status === "PAID" && (
        <div style={{ marginTop: 20, padding: "12px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={20} color="#15803d" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#15803d" }}>PAID</p>
            {invoice.paymentDate && <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>{formatInvoiceDate(invoice.paymentDate)}{invoice.paymentReference ? (" · Ref: " + invoice.paymentReference) : ""}</p>}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid #f1f5f9", textAlign: "center" as const }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Thank you for your business. For queries please contact certification@hcs.com.my</p>
      </div>
    </div>
  )
}

function OfficeBillingTab({ app }: { app: any }) {
  const billing = loadApplicationBilling(app.id ?? 0)
  const [invoice, setInvoice] = React.useState<Invoice | null>(() => loadInvoiceByApp(app.id ?? 0))
  const [showPaidForm, setShowPaidForm] = React.useState(false)
  const [paidMethod, setPaidMethod] = React.useState("BANK_TRANSFER")
  const [paidRef, setPaidRef] = React.useState("")
  const [evidences, setEvidences]     = React.useState<PaymentEvidence[]>(() => loadPaymentEvidences(app.id ?? 0))
  const [rejectId, setRejectId]       = React.useState<string | null>(null)
  const [rejectNote, setRejectNote]   = React.useState("")
  const [previewEv, setPreviewEv]     = React.useState<{ base64: string; name: string; isImg: boolean } | null>(null)

  React.useEffect(() => {
    setInvoice(loadInvoiceByApp(app.id ?? 0))
    setEvidences(loadPaymentEvidences(app.id ?? 0))
    setShowPaidForm(false); setPaidRef(""); setRejectId(null)
  }, [app.id])

  function acceptEvidence(id: string) {
    updatePaymentEvidence(app.id ?? 0, id, { status: "ACCEPTED", reviewedAt: new Date().toISOString() })
    setEvidences(loadPaymentEvidences(app.id ?? 0))
    // Mark invoice as paid when evidence is accepted
    if (invoice && invoice.status !== "PAID") {
      const ev = loadPaymentEvidences(app.id ?? 0).find(e => e.id === id)
      const paid: Invoice = { ...invoice, status: "PAID", paymentMethod: "BANK_TRANSFER", paymentReference: ev?.transactionRef ?? "", paymentDate: new Date().toISOString() }
      saveInvoice(paid); setInvoice(paid)
    }
  }
  function rejectEvidence(id: string) {
    updatePaymentEvidence(app.id ?? 0, id, { status: "REJECTED", note: rejectNote, reviewedAt: new Date().toISOString() })
    setEvidences(loadPaymentEvidences(app.id ?? 0))
    setRejectId(null); setRejectNote("")
  }

  function handleCreate() {
    if (!billing) return
    const now = new Date().toISOString()
    const inv = createInvoiceFromBilling({ ...billing, applicationId: String(app.id), applicationNumber: app.applicationNumber ?? ("#" + String(app.id)) })
    const issued: Invoice = { ...inv, status: "ISSUED", sentAt: now }
    saveInvoice(issued); setInvoice(issued)
  }
  function handleStatus(s: InvoiceStatus) {
    if (!invoice) return
    const u: Invoice = { ...invoice, status: s }
    saveInvoice(u); setInvoice(u)
  }
  function handleMarkPaid() {
    if (!invoice) return
    const u: Invoice = { ...invoice, status: "PAID", paymentMethod: paidMethod as Invoice["paymentMethod"], paymentReference: paidRef, paymentDate: new Date().toISOString() }
    saveInvoice(u); setInvoice(u); setShowPaidForm(false)
  }

  const sym = billing?.currency ?? ""
  const fmt = (n: number) => sym + " " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <React.Fragment>
    <div style={{ fontFamily: F }}>

      {/* ── ACTION BAR ────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" as const, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
        {!invoice && (
          <button onClick={handleCreate} disabled={!billing}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: billing ? BLUE : "#e2e8f0", color: billing ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: billing ? "pointer" : "not-allowed" }}>
            + Create &amp; Issue Invoice
          </button>
        )}
        {invoice && (
          <button onClick={() => downloadInvoicePDF(invoice)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#fff", color: DARK, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Download PDF
          </button>
        )}
        {invoice && invoice.status === "ISSUED" && (
          <button onClick={() => handleStatus("OVERDUE")}
            style={{ padding: "8px 16px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Mark Overdue
          </button>
        )}
        {invoice && invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
          <button onClick={() => handleStatus("CANCELLED")}
            style={{ padding: "8px 16px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel Invoice
          </button>
        )}
        {/* Accept Manual Payment — far right as primary action */}
        {invoice && (invoice.status === "ISSUED" || invoice.status === "OVERDUE") && !showPaidForm && (
          <button onClick={() => setShowPaidForm(true)}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 22px", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(21,128,61,0.25)" }}>
            Accept Manual Payment
          </button>
        )}
        {invoice && (() => { const s = invoiceStatusStyle(invoice.status); return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />{invoice.status}
          </span>
        )})()}
        {!invoice && !billing && (
          <span style={{ fontSize: 13, color: "#94a3b8" }}>No billing data found for this application.</span>
        )}
      </div>

      {/* ── MARK PAID FORM ────────────────────────────────────── */}
      {showPaidForm && (
        <div style={{ marginBottom: 18, padding: 18, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#15803d" }}>Confirm Manual Payment</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase" as const }}>Method</label>
              <select value={paidMethod} onChange={e => setPaidMethod(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: F }}>
                {["BANK_TRANSFER","CASH","STRIPE","OTHER"].map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase" as const }}>Transaction Reference</label>
              <input value={paidRef} onChange={e => setPaidRef(e.target.value)} placeholder="Bank transfer ref, cheque no., etc."
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: F, boxSizing: "border-box" as const }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleMarkPaid}
              style={{ padding: "8px 20px", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Confirm Payment Received
            </button>
            <button onClick={() => setShowPaidForm(false)}
              style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── TWO-COLUMN: Invoice | Evidence Review ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>

        {/* LEFT — A4 Invoice */}
        <div>
          {invoice ? (
            <A4Invoice invoice={invoice} fmt={fmt} />
          ) : (
            <div style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 8, padding: "48px 24px", textAlign: "center" as const }}>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>No invoice created yet</p>
              <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1" }}>Click "Create & Issue Invoice" above.</p>
            </div>
          )}
        </div>

        {/* RIGHT — Evidence Review Panel */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: DARK }}>Customer Evidence</p>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{evidences.length} file{evidences.length !== 1 ? "s" : ""}</span>
          </div>

          {evidences.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center" as const }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>No evidence uploaded by customer yet</p>
            </div>
          ) : (
            <div>
              {[...evidences].reverse().map((ev, i) => {
                const mime   = ev.mimeType || (ev.base64?.startsWith("data:image") ? "image/png" : "application/pdf")
                const isImg  = mime.startsWith("image/")
                const isPend = ev.status === "PENDING"
                const stBg   = ev.status === "ACCEPTED" ? "#f0fdf4" : ev.status === "REJECTED" ? "#fef2f2" : "#fffbeb"
                const stCol  = ev.status === "ACCEPTED" ? "#15803d" : ev.status === "REJECTED" ? "#dc2626" : "#92400e"
                const stBdr  = ev.status === "ACCEPTED" ? "#bbf7d0" : ev.status === "REJECTED" ? "#fecaca" : "#fde68a"
                const stDot  = ev.status === "ACCEPTED" ? "#22c55e" : ev.status === "REJECTED" ? "#ef4444" : "#f59e0b"
                return (
                  <div key={ev.id} style={{ padding: "12px 14px", borderBottom: i < evidences.length - 1 ? "1px solid #f1f5f9" : "none", background: "#fff" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {isImg ? (
                        <img src={ev.base64} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0, cursor: "pointer" }} onClick={() => setPreviewEv({ base64: ev.base64, name: ev.fileName, isImg: true })} />
                      ) : (
                        <div style={{ width: 56, height: 56, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }} onClick={() => setPreviewEv({ base64: ev.base64, name: ev.fileName, isImg: false })}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>PDF</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ev.fileName}</p>
                        <p style={{ margin: "2px 0 6px", fontSize: 10, color: "#94a3b8" }}>{new Date(ev.uploadedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        {ev.transactionRef && (
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#374151" }}>Ref: <span style={{ fontFamily: "monospace", color: BLUE }}>{ev.transactionRef}</span></p>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: stBg, color: stCol, border: "1px solid " + stBdr }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: stDot }} />{ev.status}
                        </span>
                        {ev.note && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#64748b", fontStyle: "italic" as const }}>{ev.note}</p>}
                      </div>
                    </div>

                    {/* Accept / Reject actions for PENDING */}
                    {isPend && rejectId !== ev.id && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button onClick={() => acceptEvidence(ev.id)}
                          style={{ flex: 1, padding: "7px 0", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Accept
                        </button>
                        <button onClick={() => { setRejectId(ev.id); setRejectNote("") }}
                          style={{ flex: 1, padding: "7px 0", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Reject reason form */}
                    {rejectId === ev.id && (
                      <div style={{ marginTop: 10, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                        <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason for rejection (optional)..."
                          rows={2} style={{ width: "100%", padding: "6px 8px", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontFamily: F, resize: "none" as const, boxSizing: "border-box" as const }} />
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <button onClick={() => rejectEvidence(ev.id)}
                            style={{ flex: 1, padding: "6px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            Confirm Reject
                          </button>
                          <button onClick={() => setRejectId(null)}
                            style={{ padding: "6px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>

    {/* Evidence preview popup */}
    {previewEv && (
      <div onClick={() => setPreviewEv(null)}
        style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div onClick={e => e.stopPropagation()}
          style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(900px,92vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
            <FileText size={15} color={BLUE} />
            <span style={{ flex:1, fontSize:"0.86rem", fontWeight:700, color:DARK, fontFamily:F }}>{previewEv.name}</span>
            <button onClick={() => setPreviewEv(null)}
              style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X style={{ width:14, height:14, color:"#64748b" }} />
            </button>
          </div>
          <div style={{ flex:1, overflow:"auto", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", minHeight:300 }}>
            {previewEv.isImg
              ? <img src={previewEv.base64} alt={previewEv.name} style={{ maxWidth:"100%", maxHeight:"82vh", objectFit:"contain", display:"block" }} />
              : <iframe src={previewEv.base64} title={previewEv.name} style={{ width:"100%", height:"80vh", border:"none", display:"block" }} />
            }
          </div>
        </div>
      </div>
    )}
    </React.Fragment>
  )
}

function PlaceholderTab({ icon, label }: { icon:string; label:string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" }}>
      <div style={{ fontSize:"2.2rem", marginBottom:10 }}>{icon}</div>
      <p style={{ margin:0, fontSize:"0.88rem", fontWeight:600, color:"#475569", fontFamily:F }}>{label}</p>
      <p style={{ margin:"5px 0 0", fontSize:"0.76rem", color:"#94a3b8", fontFamily:F }}>This section will be available once the application is processed</p>
    </div>
  )
}

function OfficeDocumentsTab({ app }: { app:any }) {
  const { user } = useAuthStore()
  const docs = ls<any[]>(`hcs_customer_documents_${app.id}`, [])
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<any[]>(() => {
    const stored = ls<any>(`hcs_document_guidance_${app.id}`, [])
    if (Array.isArray(stored)) return stored
    return stored ? [{ id:"legacy", text:stored, by:"HCB", at:new Date().toISOString() }] : []
  })
  const [saved, setSaved] = useState(false)
  const requiredDocuments = {
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

  function saveComment() {
    const text = comment.trim()
    if (!text) return
    const next = [{ id:`comment_${Date.now()}`, text, by:user?.name || "HCB", at:new Date().toISOString() }, ...comments]
    setComments(next)
    setComment("")
    localStorage.setItem(`hcs_document_guidance_${app.id}`, JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    addNotification("customer", { type: "info", title: "Document Guidance Updated", body: "HCB added guidance for your required documents." })
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 360px", gap:18, alignItems:"start", fontFamily:F }}>
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <h3 style={{ margin:0, fontSize:"1rem", fontWeight:800, color:DARK }}>Customer uploaded documents</h3>
            <p style={{ margin:"4px 0 0", fontSize:"0.72rem", color:"#64748b", fontWeight:600 }}>{docs.length} file{docs.length === 1 ? "" : "s"} uploaded</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
          {Object.entries(requiredDocuments).map(([setName, items]) => (
            <div key={setName} style={{ border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", overflow:"hidden", minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" }}>
                <span style={{ fontSize:"0.72rem", fontWeight:900, color:DARK }}>{setName}</span>
                <span style={{ fontSize:"0.66rem", fontWeight:800, color:"#64748b" }}>{items.filter(name => docs.some(d => d.type === name)).length}/{items.length} uploaded</span>
              </div>
              {items.map((name, index) => {
                const uploaded = docs.find(d => d.type === name)
                return (
                  <div key={name} style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 190px", gap:10, alignItems:"center", padding:"9px 12px", borderTop:index === 0 ? "none" : "1px solid #f1f5f9" }}>
                    <p style={{ margin:0, fontSize:"0.74rem", color:"#1f2937", fontWeight:700, lineHeight:1.35 }}>{name}</p>
                    {uploaded ? (
                      <a href={uploaded.base64} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, minWidth:0, color:"#334155", textDecoration:"none", fontSize:"0.72rem", fontWeight:700 }}>
                        <span style={{ flexShrink:0, width:7, height:7, borderRadius:"50%", background:"#16a34a" }} />
                        <FileText size={13} color="#64748b" />
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{uploaded.fileName}</span>
                      </a>
                    ) : (
                      <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontWeight:700 }}>Not uploaded</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {docs.filter(d => d.type === "Extra required documents").length > 0 && (
          <div style={{ marginTop:12, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", overflow:"hidden" }}>
            <div style={{ padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc", fontSize:"0.72rem", fontWeight:900, color:DARK }}>Extra required documents</div>
            {docs.filter(d => d.type === "Extra required documents").map(doc => (
              <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderTop:"1px solid #f1f5f9" }}>
                <FileText size={14} color="#64748b" />
                <a href={doc.base64} target="_blank" rel="noopener noreferrer" style={{ flex:1, minWidth:0, color:"#334155", textDecoration:"none", fontSize:"0.76rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.fileName}</a>
                <span style={{ fontSize:"0.68rem", color:"#64748b", fontWeight:700 }}>{doc.uploadedOn ? new Date(doc.uploadedOn).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "-"}</span>
              </div>
            ))}
          </div>
        )}

        {docs.length === 0 && (
          <div style={{ marginTop:12, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", padding:"28px 16px", textAlign:"center", fontSize:"0.78rem", color:"#475569" }}>
            No files uploaded yet.
          </div>
        )}
        </div>

      <div style={{ ...card, marginBottom:0 }}>
        <p style={{ ...secHead, marginBottom:12, paddingBottom:10 }}>HCB COMMENTS</p>
        <p style={{ margin:"0 0 12px", fontSize:"0.74rem", color:"#64748b", lineHeight:1.5, fontWeight:600 }}>Add guidance for the customer. Each note is saved as history.</p>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
          placeholder="Example: Please upload supplier certificates for all raw materials."
          style={{ width:"100%", resize:"vertical", border:"1px solid #dbeafe", borderRadius:9, padding:"11px 12px", fontFamily:F, fontSize:"0.78rem", color:DARK, lineHeight:1.5, background:"#fff" }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:12 }}>
          <span style={{ fontSize:"0.68rem", fontWeight:800, color:saved ? "#15803d" : "#94a3b8" }}>{saved ? "Comment added" : "Visible to customer"}</span>
          <button onClick={saveComment}
            style={{ height:34, padding:"0 16px", border:"none", borderRadius:8, background:BLUE, color:"#fff", fontSize:"0.78rem", fontWeight:800, cursor:"pointer", fontFamily:F }}>
            Add Comment
          </button>
        </div>
        <div style={{ marginTop:16, borderTop:"1px solid #e2e8f0", paddingTop:12, display:"flex", flexDirection:"column", gap:10, maxHeight:260, overflow:"auto" }}>
          {comments.length === 0 ? (
            <p style={{ margin:0, fontSize:"0.74rem", color:"#94a3b8", fontWeight:600 }}>No comments yet.</p>
          ) : comments.map(c => (
            <div key={c.id} style={{ border:"1px solid #e2e8f0", borderRadius:9, background:"#f8fafc", padding:"10px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:"0.72rem", fontWeight:800, color:DARK }}>{c.by || "HCB"}</span>
                <span style={{ fontSize:"0.66rem", fontWeight:700, color:"#94a3b8" }}>{c.at ? new Date(c.at).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "-"}</span>
              </div>
              <p style={{ margin:0, fontSize:"0.76rem", color:"#334155", lineHeight:1.5, fontWeight:600 }}>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuditPlanTab({ app }: { app:any }) {
  const today = new Date()
  const existingPlan = ls<any>(`hcs_audit_plan_${app.id}`, {})
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [startDate, setStartDate] = useState<string>(() => existingPlan.startDate || existingPlan.plannedDate || "")
  const [endDate, setEndDate] = useState<string>(() => existingPlan.endDate || existingPlan.plannedDate || "")
  const [leadAuditorId, setLeadAuditorId] = useState<string>(() => existingPlan.leadAuditorId || "")
  const [shariaAuditorId, setShariaAuditorId] = useState<string>(() => existingPlan.shariaAuditorId || "")
  const [savedAt, setSavedAt] = useState<string>(() => existingPlan.savedAt || "")
  const [saveError, setSaveError] = useState("")
  const [savingPlan, setSavingPlan] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const auditorQ = useQuery({
    queryKey: ["audit-plan-staff", "AUDITOR"],
    queryFn: () => getMgmtUsers({ page: 0, size: 200, filterByRole: "AUDITOR" }),
    retry: false,
  })
  const shariaQ = useQuery({
    queryKey: ["audit-plan-staff", "SHARIA_AUDITOR"],
    queryFn: () => getMgmtUsers({ page: 0, size: 200, filterByRole: "SHARIA_AUDITOR" }),
    retry: false,
  })
  const auditors = auditorQ.data?.content ?? []
  const shariaAuditors = shariaQ.data?.content ?? []
  const leadAuditor = auditors.find(u => u.id === leadAuditorId)
  const shariaAuditor = shariaAuditors.find(u => u.id === shariaAuditorId)
  const canGoNext = visibleMonth.getFullYear() < 2030 || visibleMonth.getMonth() < 11
  const canGoPrev = visibleMonth.getFullYear() > today.getFullYear() || visibleMonth.getMonth() > today.getMonth()
  const submitted = app.savedAt || app.submittedAt
  const appRef = app.applicationNumber ?? `#${app.id}`
  const numericApplicationId = Number(app.id)
  const canUseDatabasePlan = Number.isFinite(numericApplicationId)
  const auditPlanQ = useQuery({
    queryKey: ["audit-plan", numericApplicationId],
    queryFn: () => getAuditPlan(numericApplicationId),
    enabled: canUseDatabasePlan,
    retry: false,
  })
  const datesReady = !!startDate && !!endDate
  const goNextMonth = () => {
    if (!canGoNext) return
    setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }
  const goPrevMonth = () => {
    if (!canGoPrev) return
    setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  useEffect(() => {
    const plan = auditPlanQ.data
    if (!plan) return
    if (plan.scheduledDate) {
      setStartDate(plan.scheduledDate)
      const duration = Math.max(1, plan.durationDays || 1)
      const end = new Date(plan.scheduledDate)
      end.setDate(end.getDate() + duration - 1)
      setEndDate(dateKey(end.getFullYear(), end.getMonth(), end.getDate()))
      setVisibleMonth(new Date(end.getFullYear(), end.getMonth(), 1))
    }
    if (plan.auditorId) setLeadAuditorId(String(plan.auditorId))
    if (plan.status && plan.id) setSavedAt(new Date().toISOString())
  }, [auditPlanQ.data?.id, auditPlanQ.data?.scheduledDate, auditPlanQ.data?.auditorId])
  const pickDate = (date: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate("")
      setLeadAuditorId("")
      setShariaAuditorId("")
      return
    }
    if (date < startDate) {
      setEndDate(startDate)
      setStartDate(date)
      setTeamModalOpen(true)
      return
    }
    setEndDate(date)
    setTeamModalOpen(true)
  }
  const clearSelection = () => {
    setStartDate("")
    setEndDate("")
    setLeadAuditorId("")
    setShariaAuditorId("")
    setSaveError("")
    setTeamModalOpen(false)
  }
  const savePlan = async () => {
    if (!canUseDatabasePlan) {
      setSaveError("This application is still local. Submit/create it in the database before saving an audit plan.")
      return
    }
    setSavingPlan(true)
    setSaveError("")
    const now = new Date().toISOString()
    try {
      await saveAuditPlanApi(numericApplicationId, {
        auditorId: leadAuditorId || undefined,
        auditorName: leadAuditor?.name || undefined,
        scheduledDate: startDate || undefined,
        durationDays: startDate && endDate ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 1,
        scope: [
          app.companyName ? `Company: ${app.companyName}` : "",
          endDate ? `Audit window: ${startDate} to ${endDate}` : startDate ? `Audit date: ${startDate}` : "",
          shariaAuditor?.name ? `Sharia auditor: ${shariaAuditor.name}` : "",
        ].filter(Boolean).join("\n"),
        status: "DRAFT",
      })
      setSavedAt(now)
    } catch {
      setSaveError("Could not save audit plan to database.")
    } finally {
      setSavingPlan(false)
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, height:"100%", fontFamily:F }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, marginBottom:0, padding:"10px 14px", flexShrink:0 }}>
        <div>
          <p style={{ margin:0, fontSize:"0.72rem", fontWeight:800, color:BLUE, textTransform:"uppercase", letterSpacing:"0.08em" }}>Audit Plan</p>
          <p style={{ margin:"3px 0 0", fontSize:"0.68rem", color:"#94a3b8", fontWeight:600 }}>Plan the audit window and save the draft.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button
            onClick={savePlan}
            disabled={savingPlan}
            style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", height:34, padding:"0 20px", background:savingPlan ? "#94a3b8" : "#15803d", color:"#fff", border:"none", borderRadius:8, boxShadow:"0 8px 18px rgba(21,128,61,0.22)", fontSize:"0.78rem", fontWeight:800, cursor:savingPlan ? "wait" : "pointer", fontFamily:F }}
            onMouseOver={e => (e.currentTarget.style.background = "#166534")}
            onMouseOut={e => (e.currentTarget.style.background = savingPlan ? "#94a3b8" : "#15803d")}
          >
            {savingPlan ? "Saving..." : "Save Plan"}
          </button>
          <span style={{ fontSize:"0.68rem", fontWeight:800, color:savedAt ? "#15803d" : "#64748b", background:savedAt ? "#dcfce7" : "#f1f5f9", padding:"5px 12px", borderRadius:999 }}>
            {savedAt ? `Saved ${new Date(savedAt).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}` : "Draft not saved"}
          </span>
        </div>
      </div>
      {saveError && (
        <div style={{ border:"1px solid #fecaca", background:"#fef2f2", color:"#b91c1c", borderRadius:10, padding:"9px 12px", fontSize:"0.74rem", fontWeight:800 }}>
          {saveError}
        </div>
      )}

      <div style={{ display:"flex", gap:10, alignItems:"stretch", height:"calc(100vh - 315px)", minHeight:430, maxHeight:620, overflow:"hidden" }}>
      <div style={{ flex:"0 0 calc(28% - 5px)", minWidth:245, ...card, marginBottom:0, padding:"16px 18px", overflow:"auto" }}>
        <p style={{ ...secHead, marginBottom:14, paddingBottom:10 }}>AUDIT PLAN</p>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          <AuditPlanInfo label="Application No" value={appRef} />
          <AuditPlanInfo label="Company" value={app.companyName || "-"} />
          <AuditPlanInfo label="Current Status" value={getStatusStyle(app.status as any).label || app.status || "-"} />
          <AuditPlanInfo label="Submitted" value={submitted ? new Date(submitted).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "-"} />
        </div>

        <div style={{ marginTop:14, padding:"11px 13px", borderRadius:10, border:"1px solid #dbeafe", background:"#eff6ff" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <CalendarDays size={15} color={BLUE} />
            <span style={{ fontSize:"0.82rem", fontWeight:800, color:DARK }}>Planning Window</span>
          </div>
          <p style={{ margin:0, fontSize:"0.7rem", color:"#475569", lineHeight:1.45 }}>
            Click the first audit date, then click the last audit date. A popup will open to choose employee names.
          </p>
        </div>

        <div style={{ marginTop:14 }}>
          <p style={{ margin:"0 0 8px", fontSize:"0.7rem", fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em" }}>Plan Details</p>
          {[
            ["Start date", startDate ? formatDate(startDate) : "Click first date"],
            ["End date", endDate ? formatDate(endDate) : "Click last date"],
            ["Lead auditor", leadAuditor?.name || "Pending"],
            ["Sharia auditor", shariaAuditor?.name || "Pending"],
            ["Duration", startDate && endDate ? `${Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)} day(s)` : "Pending"],
          ].map(([item, value]) => (
            <div key={item} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"8px 0", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:"0.74rem", fontWeight:700, color:"#334155" }}>{item}</span>
              <span style={{ fontSize:"0.72rem", color:value === "Pending" ? "#94a3b8" : "#334155", fontWeight:value === "Pending" ? 500 : 800, textAlign:"right" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop:14, padding:"14px", borderRadius:10, border:`1px solid ${datesReady ? "#bfdbfe" : "#e2e8f0"}`, background:datesReady ? "#f8fbff" : "#f8fafc", display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <p style={{ margin:0, fontSize:"0.86rem", fontWeight:700, color:DARK }}>Audit team</p>
            <p style={{ margin:"4px 0 0", fontSize:"0.72rem", fontWeight:500, color:datesReady ? "#475569" : "#94a3b8", lineHeight:1.35 }}>
              {datesReady ? "Select the two employee names for this audit." : "Select the audit start and end dates first."}
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, opacity:datesReady ? 1 : 0.62 }}>
            <StaffSelect
              label="Lead Auditor"
              value={leadAuditorId}
              users={auditors}
              loading={auditorQ.isLoading}
              placeholder="Choose auditor"
              disabled={!datesReady}
              onChange={setLeadAuditorId}
            />
            <StaffSelect
              label="Sharia Auditor"
              value={shariaAuditorId}
              users={shariaAuditors}
              loading={shariaQ.isLoading}
              placeholder="Choose Sharia auditor"
              disabled={!datesReady}
              onChange={setShariaAuditorId}
            />
          </div>
        </div>

        <div style={{ marginTop:14, padding:"12px 13px", borderRadius:10, border:"1px solid #fde68a", background:"#fffbeb" }}>
          <p style={{ margin:"0 0 7px", fontSize:"0.78rem", fontWeight:700, color:"#92400e" }}>How to assign auditors</p>
          <div style={{ display:"grid", gap:5, fontSize:"0.72rem", color:"#78350f", fontWeight:500, lineHeight:1.45 }}>
            <span>1. Click the first audit date.</span>
            <span>2. Click the last audit date.</span>
            <span>3. Choose the Lead Auditor and Sharia Auditor employee names.</span>
            <span>4. Click Save Plan.</span>
          </div>
        </div>
      </div>

      <div style={{ flex:"0 0 calc(72% - 5px)", minWidth:0, ...card, marginBottom:0, padding:"16px 18px", overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10, paddingBottom:10, borderBottom:"1px solid #dbeafe" }}>
          <div>
            <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:BLUE }}>MONTHLY CALENDAR</p>
            <p style={{ margin:"3px 0 0", fontSize:"0.68rem", color:"#94a3b8", fontWeight:600 }}>Load one month at a time until December 2030</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button
              type="button"
              onClick={() => setTeamModalOpen(true)}
              disabled={!datesReady}
              style={{ height:30, padding:"0 13px", borderRadius:8, border:"none", background:datesReady ? BLUE : "#dbeafe", color:datesReady ? "#fff" : "#64748b", fontSize:"0.72rem", fontWeight:700, cursor:datesReady ? "pointer" : "not-allowed", fontFamily:F }}
            >
              Choose employees
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={!startDate && !endDate && !leadAuditorId && !shariaAuditorId}
              style={{ height:30, padding:"0 11px", borderRadius:8, border:"1px solid #cbd5e1", background:"#fff", color:"#475569", fontSize:"0.72rem", fontWeight:600, cursor:(!startDate && !endDate && !leadAuditorId && !shariaAuditorId) ? "not-allowed" : "pointer", opacity:(!startDate && !endDate && !leadAuditorId && !shariaAuditorId) ? 0.55 : 1, fontFamily:F }}
            >
              Clear
            </button>
            <button onClick={goPrevMonth} disabled={!canGoPrev}
              style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"1px solid #dbeafe", background:"#fff", cursor:canGoPrev ? "pointer" : "not-allowed", opacity:canGoPrev ? 1 : 0.45 }}>
              <ChevronLeft size={15} color={BLUE} />
            </button>
            <button onClick={goNextMonth} disabled={!canGoNext}
              style={{ display:"inline-flex", alignItems:"center", gap:7, height:30, padding:"0 12px", borderRadius:8, border:"1px solid #2563eb", background:canGoNext ? BLUE : "#94a3b8", color:"#fff", cursor:canGoNext ? "pointer" : "not-allowed", fontSize:"0.72rem", fontWeight:800, fontFamily:F }}>
              Next Month
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div style={{ flex:1, minHeight:0 }}>
          <MonthCalendar
            year={visibleMonth.getFullYear()}
            month={visibleMonth.getMonth()}
            large
            startDate={startDate}
            endDate={endDate}
            onDateClick={pickDate}
          />
        </div>
      </div>
      </div>
      {teamModalOpen && datesReady && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:18 }}>
          <div style={{ width:"min(500px, 96vw)", background:"#fff", borderRadius:12, boxShadow:"0 24px 70px rgba(15,23,42,0.32)", border:"1px solid #dbeafe", overflow:"hidden", fontFamily:F }}>
            <div style={{ padding:"16px 18px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <div>
                <p style={{ margin:0, fontSize:"1rem", fontWeight:700, color:DARK }}>Select employees</p>
                <p style={{ margin:"5px 0 0", fontSize:"0.76rem", fontWeight:500, color:"#64748b" }}>
                  {formatDate(startDate)} to {formatDate(endDate)}
                </p>
              </div>
              <button onClick={() => setTeamModalOpen(false)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding:"18px", display:"flex", flexDirection:"column", gap:16 }}>
              <StaffSelect
                label="Lead auditor"
                value={leadAuditorId}
                users={auditors}
                loading={auditorQ.isLoading}
                placeholder="Select lead auditor"
                onChange={setLeadAuditorId}
              />
              <StaffSelect
                label="Sharia auditor"
                value={shariaAuditorId}
                users={shariaAuditors}
                loading={shariaQ.isLoading}
                placeholder="Select Sharia auditor"
                onChange={setShariaAuditorId}
              />
            </div>
            <div style={{ padding:"12px 18px", borderTop:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, background:"#f8fafc" }}>
              <button onClick={clearSelection}
                style={{ height:34, padding:"0 13px", borderRadius:8, border:"1px solid #cbd5e1", background:"#fff", color:"#475569", fontSize:"0.74rem", fontWeight:600, cursor:"pointer", fontFamily:F }}>
                Clear Selection
              </button>
              <button onClick={() => setTeamModalOpen(false)}
                style={{ height:34, padding:"0 18px", borderRadius:8, border:"none", background:BLUE, color:"#fff", fontSize:"0.76rem", fontWeight:700, cursor:"pointer", fontFamily:F }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditPlanInfo({ label, value }: { label:string; value:React.ReactNode }) {
  return (
    <div style={{ paddingBottom:9, borderBottom:"1px solid #e2e8f0" }}>
      <div style={{ fontSize:"0.58rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:"0.78rem", fontWeight:700, color:DARK, overflowWrap:"anywhere" }}>{value}</div>
    </div>
  )
}

type AuditAnswerValue = "" | "yes" | "no" | "na"
type AuditFindingValue = "" | "nc" | "obs"
type AuditQuestionAnswer = {
  answer: AuditAnswerValue
  finding: AuditFindingValue
  customerComment: string
  auditorComment: string
  shariaComment: string
  ncDescription: string
  obsDescription: string
  ncEvidence: { name: string; data: string; size: number }[]
  obsEvidence: { name: string; data: string; size: number }[]
  customerEvidence: { name: string; data: string; size: number }[]
  auditorEvidence: { name: string; data: string; size: number }[]
  shariaEvidence: { name: string; data: string; size: number }[]
}
type AuditQuestionNode = { index: number; label: string; text: string }
type AuditSectionNode = { id: string; title: string; questions: AuditQuestionNode[] }
type AuditPartNode = { id: string; title: string; sections: AuditSectionNode[] }

const blankAuditAnswer = (): AuditQuestionAnswer => ({
  answer: "",
  finding: "",
  customerComment: "",
  auditorComment: "",
  shariaComment: "",
  ncDescription: "",
  obsDescription: "",
  ncEvidence: [],
  obsEvidence: [],
  customerEvidence: [],
  auditorEvidence: [],
  shariaEvidence: [],
})

const auditConfigToTrack = (config: AuditReportConfigurationDto): AuditTrack => ({
  dbId: config.id,
  id: config.id ? `db-${config.id}` : config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name: config.name,
  reportTitle: config.reportTitle,
  appliesTo: config.appliesTo,
  activityCategoryKeys: config.activityCategoryKeys ?? [],
  riskLevel: config.riskLevel,
  formCode: config.formCode,
  revision: config.revision,
  stages: config.stages ?? [],
  questions: (config.questions ?? []).map(q => q.questionText),
})

const auditTypes = Object.keys(CHECKLISTS) as AuditType[]
const normalizeAuditText = (value?: string) => (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")

function checklistTypeForTrack(track: AuditTrack): AuditType | undefined {
  const haystack = [
    track.id,
    track.name,
    track.reportTitle,
    track.formCode,
    ...(track.activityCategoryKeys ?? []),
  ].map(normalizeAuditText).join("|")

  return auditTypes.find(type => {
    const checklist = CHECKLISTS[type]
    const aliases = [
      type,
      checklist.key,
      checklist.name,
      checklist.short,
      checklist.form,
      type === "manufacturing" ? "mfg" : "",
      type === "slaughterhouse" ? "slaughter" : "",
      type === "meatprocessing" ? "meatprocessing" : "",
    ].map(normalizeAuditText).filter(Boolean)
    return aliases.some(alias => haystack.includes(alias))
  })
}

function stripQuestionPrefix(question: string) {
  return question.replace(/^\s*\d+(?:\.\d+){1,2}\s+/, "").trim()
}

function hcbText(value: string) {
  return value.replace(/Halal Quality Control/g, "HCB").replace(/\bHQC\b/g, "HCB")
}

function buildAuditParts(track: AuditTrack): AuditPartNode[] {
  const checklistType = checklistTypeForTrack(track)
  const checklist = checklistType ? CHECKLISTS[checklistType] : undefined

  if (checklist) {
    let questionIndex = 0
    return checklist.parts.map(part => ({
      id: part.n,
      title: part.title,
      sections: part.sections.map(section => ({
        id: section.id,
        title: section.title,
        questions: section.qs.map(([number, text, note]) => {
          const index = questionIndex++
          const fallbackText = note ? `${text} (${note})` : text
          return {
            index,
            label: `${section.id}.${number}`,
            text: hcbText(stripQuestionPrefix(track.questions[index] ?? fallbackText)),
          }
        }).filter(question => question.index < track.questions.length),
      })).filter(section => section.questions.length > 0),
    })).filter(part => part.sections.length > 0)
  }

  const parts = new Map<string, AuditPartNode>()
  track.questions.forEach((question, index) => {
    const match = question.match(/^\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?\s+(.+)/)
    const partId = match?.[1] ?? "1"
    const sectionId = match?.[2] ? `${partId}.${match[2]}` : partId
    const label = match?.[3] ? `${sectionId}.${match[3]}` : String(index + 1)
    const text = hcbText(match?.[4] ?? question)

    if (!parts.has(partId)) parts.set(partId, { id: partId, title: `Section ${partId}`, sections: [] })
    const part = parts.get(partId)!
    let section = part.sections.find(item => item.id === sectionId)
    if (!section) {
      section = { id: sectionId, title: sectionId === partId ? "Audit Questions" : `Subsection ${sectionId}`, questions: [] }
      part.sections.push(section)
    }
    section.questions.push({ index, label, text })
  })
  return Array.from(parts.values())
}

function AuditChecklistTab({ app }: { app:any }) {
  const numericApplicationId = Number(app.id)
  const canUseDatabase = Number.isFinite(numericApplicationId)
  const appCategoryKeys = activityCategoriesFromApp(app)
  const categories = DEFAULT_ACTIVITY_CATEGORY_SETTINGS.filter(category => appCategoryKeys.includes(category.key))
  const visibleCategories = categories.length ? categories : DEFAULT_ACTIVITY_CATEGORY_SETTINGS.filter(category => category.key === "mfg")
  const inferredCategory = normalizeActivityCategory(app.activityCategoryKey) || appCategoryKeys[0] || visibleCategories[0]?.key || "mfg"
  const [activityCategoryKey, setActivityCategoryKey] = useState(inferredCategory)
  const [answers, setAnswers] = useState<Record<string, AuditQuestionAnswer>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [openPart, setOpenPart] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const [showReference, setShowReference] = useState(false)
  const [saving, setSaving] = useState(false)

  const configsQ = useQuery({
    queryKey: ["audit-report-configurations"],
    queryFn: getAuditReportConfigurations,
    enabled: canUseDatabase,
  })
  const reportQ = useQuery({
    queryKey: ["application-audit-report", numericApplicationId, activityCategoryKey],
    queryFn: () => getApplicationAuditReport(numericApplicationId, activityCategoryKey),
    enabled: canUseDatabase,
  })

  const tracks = configsQ.data?.length ? configsQ.data.map(auditConfigToTrack) : DEFAULT_AUDIT_TRACKS
  const allowedTrackKeys = visibleCategories.map(category => category.key)
  const visibleTracks = tracks.filter(track => (track.activityCategoryKeys ?? []).some(key => allowedTrackKeys.includes(key)))
  const selectedTrack = visibleTracks.find(track => (track.activityCategoryKeys ?? []).includes(activityCategoryKey)) ?? visibleTracks[0] ?? tracks[0]
  const sourceConfig = configsQ.data?.find(config => config.id === selectedTrack?.dbId)
  const completed = selectedTrack?.questions.filter((_, i) => answers[`${selectedTrack.id}-${i}`]?.answer).length ?? 0
  const total = selectedTrack?.questions.length ?? 0
  const percent = total ? Math.round((completed / total) * 100) : 0
  const auditParts = React.useMemo(() => selectedTrack ? buildAuditParts(selectedTrack) : [], [selectedTrack])
  const activeOpenPart = openPart
  const countQuestions = (questions: AuditQuestionNode[]) => ({
    answered: questions.filter(question => selectedTrack && answers[`${selectedTrack.id}-${question.index}`]?.answer).length,
    total: questions.length,
  })
  const countPart = (part: AuditPartNode) => ({
    answered: part.sections.reduce((sum, section) => sum + countQuestions(section.questions).answered, 0),
    total: part.sections.reduce((sum, section) => sum + section.questions.length, 0),
  })
  const scrollToAuditNode = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (visibleCategories.some(category => category.key === activityCategoryKey)) return
    setActivityCategoryKey(visibleCategories[0]?.key || "mfg")
  }, [activityCategoryKey, visibleCategories.map(category => category.key).join("|")])

  useEffect(() => {
    if (!reportQ.data || !selectedTrack) return
    const next: Record<string, AuditQuestionAnswer> = {}
    const configQuestions = reportQ.data.configuration?.questions ?? []
    ;(reportQ.data.answers ?? []).forEach((answer, index) => {
      const questionIndex = configQuestions.findIndex(q =>
        (answer.questionId && q.id === answer.questionId) || q.questionText === answer.questionText
      )
      next[`${selectedTrack.id}-${questionIndex >= 0 ? questionIndex : index}`] = {
        answer: answer.answer ?? "",
        finding: answer.finding ?? "",
        customerComment: answer.customerComment ?? "",
        auditorComment: answer.auditorComment ?? "",
        shariaComment: answer.shariaComment ?? "",
      } as any
    })
    setAnswers(next)
  }, [reportQ.data?.id, selectedTrack?.id])

  const updateAnswer = (key: string, patch: Partial<AuditQuestionAnswer>) => {
    setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] ?? blankAuditAnswer()), ...patch } }))
  }

  const toggleComments = (key: string) => {
    setOpenComments(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  const handleEvidenceUpload = (key: string, type: 'nc' | 'obs' | 'customer' | 'auditor' | 'sharia', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation
    if (file.size > MAX_FILE_SIZE) {
      addNotification('office', { title: 'File too large', body: `File size must be less than 50MB`, type: 'error' })
      event.target.value = ''
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      addNotification('office', { title: 'Invalid file type', body: 'Only PDF, images, and Word documents are allowed', type: 'error' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      addNotification('office', { title: 'Error reading file', body: 'Failed to read the selected file', type: 'error' })
    }

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result as string
        const evidenceKey = `${type}Evidence` as keyof AuditQuestionAnswer
        const record = answers[key] ?? blankAuditAnswer()
        const currentEvidence = (record[evidenceKey] as any[]) || []
        const newEvidence = [...currentEvidence, { name: file.name, data: fileData, size: file.size, type: file.type }]
        updateAnswer(key, { [evidenceKey]: newEvidence } as Partial<AuditQuestionAnswer>)
        addNotification('office', { title: 'File uploaded', body: `${file.name} uploaded successfully`, type: 'success' })
      } catch (err) {
        console.error('Error processing file:', err)
        addNotification('office', { title: 'Error uploading file', body: 'Failed to process the file', type: 'error' })
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const saveReport = async () => {
    if (!canUseDatabase || !selectedTrack) return

    try {
      setSaving(true)

      const formData = new FormData()
      let totalFileSize = 0
      let fileCount = 0

      const payload: ApplicationAuditReportDto = {
        id: reportQ.data?.id,
        applicationId: numericApplicationId,
        configurationId: selectedTrack.dbId,
        activityCategoryKey,
        status: "DRAFT",
        generalComment: reportQ.data?.generalComment ?? "",
        answers: selectedTrack.questions.map((questionText, index) => {
          const question = sourceConfig?.questions?.[index]
          const record = answers[`${selectedTrack.id}-${index}`] ?? blankAuditAnswer()

          // Convert evidence files to blobs and add to FormData
          const processEvidenceFiles = (evidenceArray: any[], prefix: string) => {
            if (evidenceArray && evidenceArray.length > 0) {
              evidenceArray.forEach((file, idx) => {
                try {
                  // Extract base64 data from data URL
                  const base64Data = file.data.split(',')[1]
                  if (!base64Data) return

                  // Convert base64 to blob
                  const binaryString = atob(base64Data)
                  const bytes = new Uint8Array(binaryString.length)
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                  }
                  const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' })

                  // Add to FormData
                  const fieldName = `${prefix}-q${index}-f${idx}`
                  formData.append(fieldName, blob, file.name)

                  totalFileSize += file.size
                  fileCount++
                } catch (err) {
                  console.error(`Error processing file ${file.name}:`, err)
                }
              })
            }
          }

          processEvidenceFiles(record.ncEvidence, 'nc-evidence')
          processEvidenceFiles(record.obsEvidence, 'obs-evidence')
          processEvidenceFiles(record.customerEvidence, 'customer-evidence')
          processEvidenceFiles(record.auditorEvidence, 'auditor-evidence')
          processEvidenceFiles(record.shariaEvidence, 'sharia-evidence')

          return {
            questionId: question?.id,
            questionText,
            answer: record.answer,
            finding: record.finding,
            customerComment: record.customerComment,
            auditorComment: record.auditorComment,
            shariaComment: record.shariaComment,
            ncDescription: record.ncDescription,
            obsDescription: record.obsDescription,
            ncEvidenceCount: record.ncEvidence?.length || 0,
            obsEvidenceCount: record.obsEvidence?.length || 0,
          }
        }),
      }

      // Add payload as JSON
      formData.append('payload', JSON.stringify(payload))
      formData.append('fileCount', fileCount.toString())
      formData.append('totalFileSize', totalFileSize.toString())

      console.log(`[Audit Save] Saving report with ${fileCount} files (${(totalFileSize / 1024 / 1024).toFixed(2)}MB)`)

      const apiUrl = process.env.REACT_APP_API_URL || '/api'
      const response = await fetch(`${apiUrl}/applications/${numericApplicationId}/audit-report`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(300000), // 5 minute timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Save failed with status ${response.status}`)
      }

      // Save NCs and Observations to separate database tables
      const stripBase64 = (files: any[]) => files?.map(f => ({ originalName: f.name, size: f.size, type: f.type })) || []

      for (let index = 0; index < selectedTrack.questions.length; index++) {
        const question = sourceConfig?.questions?.[index]
        const record = (answers[`${selectedTrack.id}-${index}`] ?? blankAuditAnswer()) as any
        const questionText = selectedTrack.questions[index]

        if (record.finding === 'NC' && record.ncDescription) {
          const ncPayload = {
            questionId: question?.id || `q-${index}`,
            questionText,
            category: activityCategoryKey,
            ncEvidence: stripBase64(record.ncEvidence),
            customerComment: record.customerComment || '',
            customerEvidence: stripBase64(record.customerEvidence),
            auditorComment: record.auditorComment || '',
            auditorEvidence: stripBase64(record.auditorEvidence),
            shariaComment: record.shariaComment || '',
            shariaEvidence: stripBase64(record.shariaEvidence),
          }

          const apiUrl = process.env.REACT_APP_API_URL || '/api'
          const ncResponse = await fetch(`${apiUrl}/applications/${numericApplicationId}/non-conformities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ncPayload),
          })

          if (!ncResponse.ok) {
            console.warn('Failed to save NC for question', question?.id)
          }
        } else if (record.finding === 'OBS' && record.obsDescription) {
          const obsPayload = {
            questionId: question?.id || `q-${index}`,
            questionText,
            category: activityCategoryKey,
            obsEvidence: stripBase64(record.obsEvidence),
            customerComment: record.customerComment || '',
            customerEvidence: stripBase64(record.customerEvidence),
            auditorComment: record.auditorComment || '',
            auditorEvidence: stripBase64(record.auditorEvidence),
            shariaComment: record.shariaComment || '',
            shariaEvidence: stripBase64(record.shariaEvidence),
          }

          const apiUrl = process.env.REACT_APP_API_URL || '/api'
          const obsResponse = await fetch(`${apiUrl}/applications/${numericApplicationId}/observations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obsPayload),
          })

          if (!obsResponse.ok) {
            console.warn('Failed to save observation for question', question?.id)
          }
        }
      }

      addNotification('office', {
        title: 'Report saved',
        body: `Audit report saved with ${fileCount} evidence file${fileCount !== 1 ? 's' : ''}`,
        type: 'success'
      })

      await reportQ.refetch()
    } catch (err) {
      console.error('[Audit Save Error]', err)
      addNotification('office', {
        title: 'Failed to save report',
        body: err instanceof Error ? err.message : 'An unexpected error occurred',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canUseDatabase) {
    return (
      <div style={{ padding: "44px 20px", textAlign: "center", color: "#64748b", fontFamily:F }}>
        <div style={{ fontSize:"0.92rem", fontWeight:700, color:DARK }}>Audit report requires a database application</div>
        <div style={{ marginTop:6, fontSize:"0.78rem" }}>Create or sync this application in the database before completing the audit form.</div>
      </div>
    )
  }

  if (!selectedTrack) return <PlaceholderTab icon="" label="Audit" />

  return (
    <div id="app" style={{ background:"var(--page)", margin:-22, maxHeight:"calc(100vh - 190px)", overflow:"auto" }}>
      <div className="wrap" style={{ maxWidth:"none", padding:"20px" }}>
        <div className="tabrow" style={{ display: 'none' }}>
          <div className="tabs" role="tablist">
            {visibleCategories.map(category => (
              <button
                key={category.key}
                type="button"
                role="tab"
                aria-selected={category.key === activityCategoryKey}
                onClick={() => setActivityCategoryKey(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pagehead">
          <div className="grow">
            <h1>{selectedTrack.reportTitle || selectedTrack.name}</h1>
            <p>
              {app.applicationNumber || app.id} · {app.companyName || "-"}
            </p>
          </div>
          <div className="prog">
            <div className="bar"><i style={{ width: `${percent}%` }} /></div>
            <span>{completed} of {total} answered</span>
          </div>
          <button type="button" className="btn primary" onClick={saveReport} disabled={saving}>
            {saving ? "Saving..." : "Save Report"}
          </button>
        </div>

        <div className="toolbar">
          <span className="count" style={{ display: 'none' }}>{selectedTrack.appliesTo}</span>
          <button type="button" className="chipbtn" style={{ marginLeft:"auto" }} onClick={() => setShowReference(true)}>
            Risk &amp; Definitions
          </button>
        </div>

        <div className="cols">
          <nav className="side" aria-label="Sections">
            <h4>Audit Sections</h4>
            {auditParts.map(part => {
              const partCounts = countPart(part)
              const partOpen = activeOpenPart === part.id
              const partLeft = partCounts.total - partCounts.answered
              return (
                <React.Fragment key={part.id}>
                  <button
                    type="button"
                    className="navlink"
                    aria-expanded={partOpen}
                    onClick={() => {
                      setOpenPart(partOpen ? null : part.id)
                      scrollToAuditNode(`part-${part.id}`)
                    }}
                  >
                    <span className="nid">{part.id}</span>
                    <span>{part.title}</span>
                    {partLeft > 0 ? (
                      <span className="npend" title={`${partLeft} question${partLeft > 1 ? "s" : ""} not answered`}>{partLeft} left</span>
                    ) : (
                      <i className="ndot done" />
                    )}
                  </button>

                  {partOpen && (
                    <div className="subnav">
                      {part.sections.map(section => {
                        const sectionCounts = countQuestions(section.questions)
                        const sectionLeft = sectionCounts.total - sectionCounts.answered
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className="sublink"
                            aria-current={currentSection === section.id || undefined}
                            onClick={() => {
                              setCurrentSection(section.id)
                              scrollToAuditNode(`sec-${section.id}`)
                            }}
                          >
                            <span className="nid">{section.id}</span>
                            <span>{section.title}</span>
                            {sectionLeft > 0 ? (
                              <span className="npend" title={`${sectionLeft} question${sectionLeft > 1 ? "s" : ""} not answered`}>{sectionLeft} left</span>
                            ) : (
                              <i className="ndot done" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          <div className="colmain">
            {auditParts.map(part => (
              <React.Fragment key={part.id}>
                <div className="parthead" id={`part-${part.id}`}>
                  <div className="eyebrow">Section {part.id}</div>
                  <h2>{part.title}</h2>
                </div>

                {part.sections.map(section => {
                  const sectionCounts = countQuestions(section.questions)
                  const sectionLeft = sectionCounts.total - sectionCounts.answered
                  return (
                    <section className="sec" id={`sec-${section.id}`} key={section.id}>
                      <div className="sec-hd" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="sid">{section.id}</span>
                        <h3>{section.title}</h3>
                        <span className="sec-meta">{sectionCounts.answered} / {sectionCounts.total} answered</span>
                        {sectionLeft > 0 && <span className="sec-warn">{sectionLeft} unanswered</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="chipbtn"
                            title="Mark all questions in this section as N/A"
                            onClick={() => {
                              section.questions.forEach(question => {
                                const key = `${selectedTrack.id}-${question.index}`
                                updateAnswer(key, { answer: "na" })
                              })
                            }}
                            style={{ fontSize: '12px' }}
                          >
                            Mark all N/A
                          </button>
                          <button
                            type="button"
                            className="chipbtn"
                            title="Mark all questions in this section as NC"
                            onClick={() => {
                              section.questions.forEach(question => {
                                const key = `${selectedTrack.id}-${question.index}`
                                updateAnswer(key, { finding: "nc" })
                              })
                            }}
                            style={{ fontSize: '12px' }}
                          >
                            Mark all NC
                          </button>
                          <button
                            type="button"
                            className="chipbtn"
                            title="Mark all questions in this section as Observation"
                            onClick={() => {
                              section.questions.forEach(question => {
                                const key = `${selectedTrack.id}-${question.index}`
                                updateAnswer(key, { finding: "obs" })
                              })
                            }}
                            style={{ fontSize: '12px' }}
                          >
                            Mark all Obs
                          </button>
                        </div>
                      </div>
                      <div className="sec-body">
                        {section.questions.map(question => {
                          const key = `${selectedTrack.id}-${question.index}`
                          const record = answers[key] ?? blankAuditAnswer()
                          const commentCount = [record.customerComment, record.auditorComment, record.shariaComment].filter(comment => comment.trim()).length
                          const commentsOpen = !!openComments[key]
                          return (
                            <article className="q" id={`q-${key}`} key={key}>
                              <div className="q-top">
                                <span className="q-n" style={record.answer ? { background:"var(--green)", color:"#fff" } : undefined}>{question.label}</span>
                                <div>
                                  <p className="q-t">{question.text}</p>
                                </div>
                              </div>
                              <div className="q-ctl">
                                <div className="seg" role="group" aria-label={`Answer for question ${question.label}`}>
                                  <button type="button" data-v="yes" aria-pressed={record.answer === "yes"} onClick={() => updateAnswer(key, { answer: record.answer === "yes" ? "" : "yes" })}>Yes</button>
                                  <button type="button" data-v="no" aria-pressed={record.answer === "no"} onClick={() => updateAnswer(key, { answer: record.answer === "no" ? "" : "no" })}>No</button>
                                  <button type="button" data-v="na" aria-pressed={record.answer === "na"} onClick={() => updateAnswer(key, { answer: record.answer === "na" ? "" : "na" })}>N/A</button>
                                </div>
                                <div className="findbtns">
                                  <button type="button" className="findbtn" data-f="nc" aria-pressed={record.finding === "nc"} onClick={() => updateAnswer(key, { finding: record.finding === "nc" ? "" : "nc" })}>NC</button>
                                  <button type="button" className="findbtn" data-f="obs" aria-pressed={record.finding === "obs"} onClick={() => updateAnswer(key, { finding: record.finding === "obs" ? "" : "obs" })}>Observation</button>
                                </div>
                                <button
                                  type="button"
                                  className="cmt-btn"
                                  aria-expanded={commentsOpen}
                                  aria-controls={`comments-${key}`}
                                  onClick={() => toggleComments(key)}
                                >
                                  <MessageSquare size={14} />
                                  <span>{commentsOpen ? "Hide comments" : "Comments"}</span>
                                  {commentCount > 0 && <span className="cnt">{commentCount}</span>}
                                </button>
                              </div>
                              {record.finding && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: record.finding === 'nc' ? '#fde7e9' : '#fff8e5', color: record.finding === 'nc' ? '#d13438' : '#8a6000', textTransform: 'uppercase' }}>
                                      {record.finding === 'nc' ? 'Non-Conformity' : 'Observation'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Ref {question.label}</span>
                                  </div>
                                  <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      State the {record.finding === 'nc' ? 'non-conformity' : 'observation'}: what was found, where, and which requirement it breaches.
                                    </label>
                                    <textarea
                                      value={record.finding === 'nc' ? (record.ncDescription || '') : (record.obsDescription || '')}
                                      onChange={e => updateAnswer(key, { [record.finding === 'nc' ? 'ncDescription' : 'obsDescription']: e.target.value })}
                                      placeholder={`Describe the ${record.finding === 'nc' ? 'non-conformity' : 'observation'}...`}
                                      style={{ width: '100%', minHeight: '80px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d13438', marginBottom: '8px', textTransform: 'uppercase' }}>
                                      Evidence required for a {record.finding === 'nc' ? 'non-conformity' : 'observation'}
                                    </label>
                                    <div style={{ marginBottom: '8px' }}>
                                      <input
                                        type="file"
                                        id={`evidence-${key}-${record.finding}`}
                                        onChange={(e) => handleEvidenceUpload(key, record.finding as any, e)}
                                        style={{ display: 'none' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => document.getElementById(`evidence-${key}-${record.finding}`)?.click()}
                                        style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}
                                      >
                                        📎 Attach evidence
                                      </button>
                                    </div>
                                    {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).length > 0 && (
                                      <div style={{ marginTop: '8px' }}>
                                        {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).map((file, idx) => (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                                            <span>📄 {file.name}</span>
                                            <button
                                              type="button"
                                              onClick={() => updateAnswer(key, { [(record.finding === 'nc' ? 'ncEvidence' : 'obsEvidence') as keyof AuditQuestionAnswer]: ((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).filter((_, i) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {commentsOpen && (
                                <div className="cmts" id={`comments-${key}`}>
                                  {[
                                    ["customerComment", "customer", "Customer comment", "customerEvidence"],
                                    ["auditorComment", "auditor", "Auditor comment", "auditorEvidence"],
                                    ["shariaComment", "sharia", "Sharia comment", "shariaEvidence"],
                                  ].map(([field, role, label, evidenceField]) => (
                                    <div className="cmt" data-role={role} key={field}>
                                      <div className="lbl"><i className="tag" /><span>{label}</span></div>
                                      <textarea
                                        value={record[field as keyof AuditQuestionAnswer] as string}
                                        onChange={e => updateAnswer(key, { [field]: e.target.value } as Partial<AuditQuestionAnswer>)}
                                      />
                                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <input
                                          type="file"
                                          id={`evidence-comment-${key}-${field}`}
                                          onChange={(e) => handleEvidenceUpload(key, role as any, e)}
                                          style={{ display: 'none' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => document.getElementById(`evidence-comment-${key}-${field}`)?.click()}
                                          style={{ padding: '4px 10px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#2563eb' }}
                                        >
                                          📎 Attach evidence
                                        </button>
                                        {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).length > 0 && (
                                          <div style={{ marginTop: '6px' }}>
                                            {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).map((file: any, idx: number) => (
                                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '3px', fontSize: '11px' }}>
                                                <span>📄 {file.name}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateAnswer(key, { [evidenceField]: ((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).filter((_: any, i: number) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 2px', fontSize: '11px' }}
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {showReference && (
          <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(15,23,42,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div className="panel refpanel" style={{ width:"min(980px, 100%)", maxHeight:"82vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
              <div className="panel-hd" style={{ justifyContent:"space-between" }}>
                <div>
                  <div className="eyebrow">Audit Reference</div>
                  <h2>Risk &amp; Definitions</h2>
                </div>
                <button type="button" className="btn" onClick={() => setShowReference(false)} aria-label="Close risk and definitions">
                  <X size={16} />
                </button>
              </div>
              <div className="panel-bd" style={{ overflow:"auto" }}>
                <div className="refgrid">
                  <div>
                    <h3>Risk Classifications</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Complexity Class</th>
                          <th>Example of Sectors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {REFERENCE.risk.map(([label, definition]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{hcbText(definition)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3>Terms and Definitions</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Term</th>
                          <th>Definition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {REFERENCE.terms.map(([term, definition]) => (
                          <tr key={term}>
                            <td>{term}</td>
                            <td dangerouslySetInnerHTML={{ __html: hcbText(definition) }} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StaffSelect({ label, value, users, loading, placeholder, disabled = false, onChange }: {
  label:string; value:string; users:UserListDto[]; loading:boolean; placeholder:string; disabled?:boolean; onChange:(value:string) => void
}) {
  return (
    <label style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <span style={{ fontSize:"0.76rem", fontWeight:600, color:"#334155" }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading || disabled}
        style={{ width:"100%", height:40, border:`1px solid ${value ? "#93c5fd" : "#cbd5e1"}`, borderRadius:8, background:disabled ? "#f1f5f9" : "#fff", color:value ? DARK : "#64748b", padding:"0 11px", fontFamily:F, fontSize:"0.78rem", fontWeight:500, cursor:loading ? "wait" : disabled ? "not-allowed" : "pointer", outline:"none", boxShadow:value ? "0 0 0 3px rgba(37,99,235,0.08)" : "none" }}
      >
        <option value="">{disabled ? "Select audit dates first" : loading ? "Loading staff..." : placeholder}</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
        ))}
      </select>
      {!loading && users.length === 0 && (
        <span style={{ fontSize:"0.65rem", color:"#dc2626", fontWeight:700 }}>No active staff found for this role.</span>
      )}
    </label>
  )
}

function dateKey(year:number, month:number, day:number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function MonthCalendar({ year, month, large = false, startDate = "", endDate = "", onDateClick }: {
  year:number; month:number; large?:boolean; startDate?:string; endDate?:string; onDateClick?:(date:string) => void
}) {
  const monthName = new Date(year, month, 1).toLocaleString("en-GB", { month:"long" })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const cells = [
    ...Array.from({ length:offset }, () => null),
    ...Array.from({ length:daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length < 42) cells.push(null)
  const today = new Date()

  return (
    <div style={{ padding:large ? 0 : 10, height:large ? "100%" : undefined, display:large ? "flex" : undefined, flexDirection:large ? "column" : undefined }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:large ? 10 : 8 }}>
        <span style={{ fontSize:large ? "1rem" : "0.78rem", fontWeight:900, color:DARK }}>{monthName}</span>
        <span style={{ fontSize:large ? "0.78rem" : "0.66rem", fontWeight:800, color:"#64748b", background:"#f1f5f9", padding:"3px 10px", borderRadius:999 }}>{year}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0, 1fr))", gap:large ? 5 : 3, flex:large ? 1 : undefined, minHeight:large ? 0 : undefined }}>
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={`${d}-${i}`} style={{ height:large ? 22 : 18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:large ? "0.66rem" : "0.58rem", fontWeight:800, color:"#94a3b8" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const key = day ? dateKey(year, month, day) : ""
          const isEdge = !!day && (key === startDate || key === endDate)
          const inRange = !!day && !!startDate && !!endDate && key >= startDate && key <= endDate
          return (
            <button key={i} type="button" onClick={() => day && onDateClick?.(key)} disabled={!day} style={{
              minHeight:large ? 0 : 24, height:large ? "100%" : undefined, display:"flex", alignItems:"flex-start", justifyContent:"flex-start", borderRadius:large ? 8 : 6,
              padding:large ? 7 : 0, border:large && day ? `1px solid ${isEdge ? BLUE : inRange ? "#93c5fd" : "#e2e8f0"}` : "1px solid transparent",
              background: isEdge ? BLUE : inRange ? "#dbeafe" : isToday ? "#eff6ff" : day ? "#f8fafc" : "transparent", color: isEdge ? "#fff" : isToday ? BLUE : day ? "#334155" : "transparent",
              fontSize:large ? "0.76rem" : "0.66rem", fontWeight: isToday ? 900 : 700,
              cursor:day ? "pointer" : "default", fontFamily:F, textAlign:"left",
            }}>
              {day ?? ""}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// "" Helpers """"""""""""""""""""""""""""""""""""""""""""

interface LocalApp {
  id:string; status:string; savedAt:string; companyName?:string
  factoryId?:string; factoryName?:string
  products?:{name:string}[]; selectedMarkets?:string[]; selectedStandards?:string[]
  snapshotFactories?:{id:string; name:string; address?:string; city?:string; country?:string}[]
  remarks?:string; editPermission?: boolean
}
function loadLocalApps(): LocalApp[] {
  localStorage.removeItem('hcs_local_applications')
  return []
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
function hydrateApplication(app: any): any {
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
  }
}
function factoryLocation(app: LocalApp) {
  const factories = app.snapshotFactories ?? ls<any[]>('hcs_factories', [])
  const factory = factories.find((f:any) => !app.factoryId || f.id === app.factoryId)
  const parts = [factory?.city || factory?.address, factory?.country].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

// "" Page """"""""""""""""""""""""""""""""""""""""""""""

export default function ApplicationsPage() {
  const { user } = useAuthStore()
  const [search, setSearch]             = useState("")
  const [statusGroup, setStatusGroup]   = useState(ACTIVE_STATUSES)
  const [page, setPage]                 = useState(0)
  const [localApps, setLocalApps]       = useState<LocalApp[]>(loadLocalApps)
  const [viewApp, setViewApp]           = useState<any|null>(null)
  const [appTab, setAppTab]             = useState("Application")
  const [docPreview, setDocPreview]     = useState<{url:string;name:string}|null>(null)
  const [editCertCats, setEditCertCats]   = useState<string[]>([])
  const [editStandards, setEditStandards] = useState<string[]>([])
  const [hcbModal, setHcbModal]           = useState<"certCat"|"standard"|null>(null)
  const [modalDraft, setModalDraft]       = useState<string[]>([])
  const [approveConfirm, setApproveConfirm] = useState(false)
  const [discountType,  setDiscountType]    = useState<"%"|"fixed">("%")
  const [discountValue, setDiscountValue]   = useState("")
  const [rejectModal, setRejectModal]       = useState(false)
  const [rejectReason, setRejectReason]     = useState("")
  const detailRef                       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewApp) {
      setEditCertCats(viewApp.selectedCertCats ?? [])
      setEditStandards(viewApp.selectedStandards ?? [])
    }
  }, [viewApp?.id])

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["applications", { page, search, statusGroup }],
    queryFn: () => getApplications({ page, size: PAGE_SIZE, search: search || undefined, statuses: statusGroup || undefined }),
    retry: false,
  })
  const { data: allData }    = useQuery({ queryKey: ["off-apps-all"],    queryFn: () => getApplications({ page: 0, size: 1 }), retry: false })
  const { data: activeData } = useQuery({ queryKey: ["off-apps-active"], queryFn: () => getApplications({ page: 0, size: 1, statuses: ACTIVE_STATUSES }), retry: false })
  const { data: certData }   = useQuery({ queryKey: ["off-apps-cert"],   queryFn: () => getApplications({ page: 0, size: 1, statuses: "CERTIFIED" }), retry: false })
  const { data: draftData }  = useQuery({ queryKey: ["off-apps-draft"],  queryFn: () => getApplications({ page: 0, size: 1, statuses: "DRAFT" }), retry: false })
  const { data: companyInfoData } = useQuery({
    queryKey: ["application-company-info", viewApp?.id],
    queryFn: () => viewApp?.id ? getCompanyInfo(viewApp.id) : null,
    retry: false,
    enabled: !!viewApp?.id,
  })

  const apiApps       = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const filteredLocal = localApps.filter(la => {
    if (statusGroup) {
      const statuses = statusGroup.split(",")
      if (!statuses.includes(la.status)) return false
    }
    if (search) return la.companyName?.toLowerCase().includes(search.toLowerCase()) || la.id.includes(search)
    return true
  })

  const localActiveCount = localApps.filter(la => ACTIVE_STATUSES.split(",").includes(la.status)).length
  const localDraftCount  = localApps.filter(la => la.status === "DRAFT").length
  const totalAll    = allData?.totalElements    ?? 0
  const totalActive = activeData?.totalElements ?? 0
  const totalCert   = certData?.totalElements   ?? 0
  const totalDraft  = draftData?.totalElements  ?? 0

  const STATS = [
    { label: "Total",     value: totalAll + localApps.length,   bg: "#1e3a8a" },
    { label: "Active",    value: totalActive + localActiveCount, bg: "#0ea5e9" },
    { label: "Certified", value: totalCert,                      bg: "#009999" },
    { label: "Draft",     value: totalDraft + localDraftCount,   bg: "#64748b" },
  ]
  const tabCounts: Record<string, number> = {
    [ACTIVE_STATUSES]: totalActive + localActiveCount,
    "CERTIFIED": totalCert,
    "DRAFT": totalDraft + localDraftCount,
  }

  const applications = [
    ...filteredLocal.map(la => ({
      id: la.id, _local: true,
      applicationNumber: la.id.replace("local_", "#L"),
      companyName: la.companyName || la.factoryName || "-",
      country: null, type: "New Application",
      status: la.status as ApplicationStatus,
      submittedAt: la.savedAt,
      updatedAt: la.savedAt,
      assignedAuditorName: null,
      halalStandard: la.selectedStandards?.[0] ?? null,
      productCount: la.products?.length ?? 0,
      factoryLocation: factoryLocation(la),
      approvedBy: (la as any).approvedBy ?? null,
    } as any)),
    ...apiApps,
  ]

  function selectApp(app: any) {
    const found = app._local ? (localApps.find(la => la.id === app.id) ?? app) : app
    const raw   = hydrateApplication(app._local ? { ...found, _local: true } : found)
    if (viewApp?.id === raw.id) { setViewApp(null); return }
    setViewApp(raw)
    setAppTab("Application")
  }


  function openModal(type: "certCat"|"standard") {
    setModalDraft(type === "certCat" ? [...editCertCats] : [...editStandards])
    setHcbModal(type)
  }
  function saveModal() {
    if (hcbModal === "certCat") setEditCertCats(modalDraft)
    else setEditStandards(modalDraft)
    if (viewApp) {
      const updated = { ...viewApp,
        selectedCertCats:  hcbModal === "certCat" ? modalDraft : editCertCats,
        selectedStandards: hcbModal === "standard" ? modalDraft : editStandards,
      }
      setViewApp(updated)
      if (viewApp._local) {
        const all = loadLocalApps().map(la => la.id === viewApp.id ? { ...la, ...updated } : la)
        localStorage.setItem('hcs_local_applications', JSON.stringify(all))
        setLocalApps(all as LocalApp[])
      }
    }
    setHcbModal(null)
  }
  function toggleDraft(v: string) { setModalDraft(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]) }

  function buildInitialLog(app: any) {
    return app.logs?.length ? app.logs : [{
      timestamp: app.savedAt || app.submittedAt || new Date().toISOString(),
      action: "Application Submitted", by: "Customer", color: "#16a34a",
    }]
  }

  function approveApp() {
    if (!a) return
    const now = new Date().toISOString()
    const appRef = a.applicationNumber ?? String(a.id).replace('local_', '#L')
    const coName = a.companyName || (a as any).factoryName || '-'
    const actorName = user?.name ?? 'HCB Office'

    // Apply discount to billing if entered
    const billing = loadApplicationBilling(a.id)
    if (billing && discountValue && parseFloat(discountValue) > 0) {
      const dv = parseFloat(discountValue)
      const discountAmt = discountType === "%" ? billing.subtotal * (dv / 100) : Math.min(dv, billing.subtotal)
      const newSubtotal = Math.max(0, billing.subtotal - discountAmt)
      const newVat      = newSubtotal * billing.vatPct / 100
      const discountLine = { description: `Discount ${discountType === "%" ? `(${dv}%)` : "(Fixed)"}`, quantity: 1, unitPrice: -discountAmt, total: -discountAmt }
      saveApplicationBilling({ ...billing, lineItems: [...billing.lineItems, discountLine], subtotal: newSubtotal, vatAmount: newVat, total: newSubtotal + newVat, savedAt: now })
    }

    const logs = [...buildInitialLog(a), {
      timestamp: now,
      action: "Application Approved", by: actorName,
      note: "Status changed to Agreement Pending. Profile data locked. Customer notified by email to sign agreement.",
      color: "#2563eb",
    }]
    const updated = {
      ...a,
      status: "AGREEMENT_PENDING" as ApplicationStatus,
      approvedAt: now,
      approvedBy: actorName,
      logs,
    }
    setApproveConfirm(false)
    setDiscountValue("")
    setDiscountType("%")
    setViewApp(updated)
    if (a._local) {
      try {
        const all = loadLocalApps().map((la: any) => String(la.id) === String(a.id) ? { ...la, ...updated } : la)
        localStorage.setItem('hcs_local_applications', JSON.stringify(all))
        setLocalApps(all as LocalApp[])
      } catch {
        const all = loadLocalApps().map((la: any) => String(la.id) === String(a.id) ? { ...la, status: "AGREEMENT_PENDING", approvedAt: now, approvedBy: actorName } : la)
        localStorage.setItem('hcs_local_applications', JSON.stringify(all))
        setLocalApps(all as LocalApp[])
      }
    }

    // Audit - approval action
    addAuditLog({
      applicationId: String(a.id),
      applicationNumber: appRef,
      companyName: coName,
      actor: actorName,
      role: 'HCB Office',
      action: 'Application Approved',
      details: `Application approved by ${actorName}. Profile data locked. Status moved to Agreement Pending.`,
      oldStatus: a.status,
      newStatus: 'AGREEMENT_PENDING',
      category: 'APPLICATION',
    })

    // Audit - email sent
    addAuditLog({
      applicationId: String(a.id),
      applicationNumber: appRef,
      companyName: coName,
      actor: 'System',
      role: 'System',
      action: 'Email Notification Sent',
      details: `Approval email sent to customer for application ${appRef}. Customer requested to sign the agreement.`,
      category: 'SYSTEM',
    })

    // Customer notification
    addNotification('customer', {
      type: 'success',
      title: 'Application Approved',
      body: `Your application ${appRef} has been approved by HCB. Please sign the agreement to proceed.`,
    })

    // Office confirmation
    addNotification('office', {
      type: 'info',
      title: 'Email Sent to Customer',
      body: `Approval notification email sent to ${coName} for application ${appRef}.`,
    })
  }

  function rejectApp() {
    if (!a) return
    const logs = [...buildInitialLog(a), {
      timestamp: new Date().toISOString(),
      action: "Application Rejected", by: "HCB Office",
      note: rejectReason.trim() || undefined, color: "#dc2626",
    }]
    const updated = {
      ...a,
      status: "REJECTED" as ApplicationStatus,
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectReason.trim(),
      logs,
    }
    setViewApp(updated)
    if (a._local) {
      const all = loadLocalApps().map(la => la.id === a.id ? { ...la, ...updated } : la)
      localStorage.setItem('hcs_local_applications', JSON.stringify(all))
      setLocalApps(all as LocalApp[])
    }
    addAuditLog({
      applicationId: String(a.id),
      applicationNumber: a.applicationNumber ?? String(a.id).replace('local_', '#L'),
      companyName: a.companyName || (a as any).factoryName || '-',
      actor: user?.name ?? 'HCB Office',
      role: 'HCB Office',
      action: 'Application Rejected',
      details: rejectReason.trim() ? `Reason: ${rejectReason.trim()}` : 'No reason provided',
      oldStatus: a.status,
      newStatus: 'REJECTED',
      category: 'APPLICATION',
    })
    addNotification('customer', {
      type: 'error',
      title: 'Application Rejected',
      body: `Your application ${a.applicationNumber ?? a.id} was rejected.${rejectReason.trim() ? ` Reason: ${rejectReason.trim()}` : ''}`,
    })
    setRejectModal(false)
    setRejectReason("")
  }

  const a       = viewApp
  const isLocal = !!a?._local
  const appNum  = a ? (a.applicationNumber ?? (a.id ? String(a.id).replace("local_","#L") : "-")) : ""
  const company = a ? (a.companyName || a.factoryName || "-") : ""
  const status  = a?.status ?? ""
  const s       = status ? getStatusStyle(status as ApplicationStatus) : { bg:"#f1f5f9", color:"#64748b", dot:"#94a3b8", label:"-" }

  // "" Application tab - same visual structure as CustomerApplyPage """"""
  const applicationTab = !a ? null : (() => {
    const PRE_APPROVAL = ["DRAFT", "SUBMITTED", "UNDER_REVIEW"]
    const draftLocked = a.status === "DRAFT" && !(a as any).editPermission
    const frozen = !PRE_APPROVAL.includes(a.status) || draftLocked
    const profile   = a.snapshotProfile || ls<any>('hcs_profile', {})
    const regDocs   = a.snapshotRegDocs || ls<any>('hcs_reg_docs', {})
    const cats      = activityCategoriesFromApp(a).length ? activityCategoriesFromApp(a) : ls<string[]>('hcs_categories', []).map(normalizeActivityCategory).filter(Boolean)
    const acts      = specificActivitiesFromApp(a).length ? specificActivitiesFromApp(a) : ls<string[]>('hcs_activities', [])
    const desc      = frozen && a.snapshotDescription != null ? a.snapshotDescription : (localStorage.getItem('hcs_description') || '')
    const factories = frozen && a.snapshotFactories  ? a.snapshotFactories  : ls<any[]>('hcs_factories', [])

    const email   = a.companyEmail || profile.email   || companyInfoData?.email || "-"
    const phone   = a.companyPhone || profile.phone   || companyInfoData?.phone || "-"
    const website = a.companyWeb   || profile.website || companyInfoData?.website || "-"
    const compType= profile.companyType || a.businessType || companyInfoData?.companyType || ""
    const compReg = profile.companyReg  || a.registrationNumber || companyInfoData?.registrationNumber || ""

    const licenseNo   = regDocs.licenseNo     || a.licenseNo     || companyInfoData?.businessLicenseNo || "-"
    const licExpiry   = regDocs.licenseExpiry || a.licenseExpiry || companyInfoData?.licenseExpiry || "-"
    const issuingAuth = regDocs.issuingAuth   || a.issuingAuthority || companyInfoData?.issuingAuthority || "-"
    const vatNo       = regDocs.vatNo         || a.vatNo         || companyInfoData?.vatSstNo || "-"
    const sstNo       = regDocs.sstNo         || a.sstNo         || "-"

    const markets: string[]   = a.selectedMarkets  ?? []
    const certCats: string[]  = a.selectedCertCats ?? []
    const standards: string[] = a.selectedStandards ?? []
    const halalCerts: any[]   = a.halalCerts        ?? []
    const trainingRecs: any[] = a.trainingRecs       ?? []

    const appFactories = factories.filter((f:any) => !a.factoryId || f.id === a.factoryId)

    const ci = STATUS_IDX[a.status] ?? -1

    return (
      <div style={{ fontFamily:F }}>

        {/* View-only banner for locked drafts */}
        {draftLocked && (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 16px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontSize:13, color:"#92400e", fontWeight:600 }}>View only — customer has not granted permission to edit this draft.</span>
          </div>
        )}

        {/* "" Progress stepper "" */}
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


        {/* " 1 + 2 + 2b. Company Information | Services & Activities + Application Details " */}
        <div style={{ display:"flex", gap:16, alignItems:"stretch", marginBottom:16 }}>

          {/* Left: Company Information */}
          <div style={{ ...card, flex:"0 0 58%", marginBottom:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, paddingBottom:12, borderBottom:"1px solid #e2e8f0" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>COMPANY INFORMATION</p>
              <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
            </div>
            <div style={{ background:"#fff", borderRadius:8, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))" }}>
                {[
                  { Icon:Building2,    label:"Company Name",        value: company,                           attach:false },
                  { Icon:Mail,         label:"Email",               value: email,                             attach:false },
                  { Icon:Phone,        label:"Phone",               value: phone,                             attach:false },
                  { Icon:Globe,        label:"Website",             value: website,                           attach:false },
                  { Icon:Briefcase,    label:"Company Type",        value: compType   || "-",                 attach:false },
                  { Icon:Hash,         label:"Registration No",     value: compReg    || "-",                 attach:false },
                  { Icon:FileText,     label:"Business License No", value: licenseNo,                         attach:true  },
                  { Icon:CalendarDays, label:"License Expiry",      value: licExpiry,                         attach:false },
                  { Icon:Landmark,     label:"Issuing Authority",   value: issuingAuth,                       attach:false },
                  { Icon:Receipt,      label:"VAT / SST No",        value: vatNo !== "-" ? vatNo : sstNo,    attach:false },
                ].map(r => {
                  const hasFile = r.attach && !!regDocs.licenseFileData
                  return (
                    <div key={r.label}
                      onClick={() => hasFile && setDocPreview({ url: regDocs.licenseFileData, name: regDocs.licenseFileName || "Business License" })}
                      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"13px 16px",
                        cursor: hasFile ? "pointer" : "default", transition:"background 0.1s" }}
                      onMouseOver={e => { if (hasFile) e.currentTarget.style.background = "#f8fbff" }}
                      onMouseOut={e  => { e.currentTarget.style.background = "transparent" }}>
                      <div style={{ width:16, height:16, flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", fontFamily:F }}>{r.label}</span>
                          {r.attach && <Paperclip size={10} color={hasFile ? BLUE : "#cbd5e1"} />}
                        </div>
                        <div style={{ fontSize:"0.83rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F }}>{r.value}</div>
                        {hasFile && <div style={{ fontSize:"0.62rem", color:BLUE, fontWeight:700, marginTop:2, fontFamily:F }}>Preview document</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right column: Services & Activities + Application Details stacked */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Services & Activities */}
            {(cats.length > 0 || acts.length > 0 || desc) && (
              <div style={{ ...card, marginBottom:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #e2e8f0" }}>
                  <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>SERVICES & ACTIVITIES</p>
                  <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
                </div>
                <div style={{ background:"#fff", borderRadius:8, overflow:"hidden" }}>
                  {[
                    cats.length > 0 && { Icon:Tags,      label:"Activity Category",   value: cats.map((k:string) => `${CAT_EMOJIS[k] || ""} ${CAT_LABELS[k] || k}`.trim()).join("  ·  ") },
                    acts.length > 0 && { Icon:List,      label:"Specific Activities", value: acts.map((k:string) => `${ACT_INFO[k]?.emoji || ""} ${ACT_INFO[k]?.label || k}`.trim()).join("  ·  ") },
                    desc           && { Icon:AlignLeft,  label:"Company Description", value: desc },
                  ].filter(Boolean).map((r:any) => (
                    <div key={r.label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px" }}>
                      <div style={{ width:16, height:16, flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <r.Icon size={13} color="#64748b" strokeWidth={1.9} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3, fontFamily:F }}>{r.label}</div>
                        <div style={{ fontSize:"0.82rem", fontWeight:600, color: r.value==="-"?"#cbd5e1":DARK, fontFamily:F, lineHeight:1.55, wordBreak:"break-word" as const }}>{r.value || "-"}</div>
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
              <div style={{ background:"#fff", borderRadius:8, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))" }}>
                {[
                  { Icon:Hash,         label:"Application No",         value: appNum },
                  { Icon:Briefcase,    label:"Type",                   value: a.type || "New Application" },
                  { Icon:CalendarDays, label:"Submitted",              value: a.savedAt ? new Date(a.savedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "-" },
                  { Icon:Shield,       label:"Certification Standard", value: standards.length > 0 ? standards.join(" · ") : "-" },
                  { Icon:Tags,         label:"Certification Category", value: certCats.length > 0 ? certCats.join(" · ") : "-" },
                  { Icon:Building,     label:"Factory / Facility",     value: appFactories.length > 0 ? appFactories.map((f:any)=>f.name).join(", ") : (a.factoryName || "-") },
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
        </div>

        {/* " 3. Target Market " */}
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

        {/* " 3b. Certification Category " */}
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
            <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>CERTIFICATION CATEGORY</p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {editCertCats.length > 0 && <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{editCertCats.length} selected</span>}
              <button onClick={() => openModal("certCat")}
                style={{ padding:"5px 14px", background:BLUE, color:"#fff", border:"none", borderRadius:7, fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:F }}>
                Replace
              </button>
            </div>
          </div>
          {editCertCats.length > 0 ? (
            <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              {editCertCats.map((cat, i) => (
                <div key={cat} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom: i < editCertCats.length-1 ? "1px solid #f1f5f9" : "none", background:"#fff" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:"2px solid #374151", background:"#374151", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:"0.82rem", fontWeight:500, color:DARK, fontFamily:F }}>{cat}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8", fontFamily:F }}>No certification category selected</p>
          )}
        </div>

        {/* " 3c. Halal Standards " */}
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
            <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>HALAL STANDARDS</p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {editStandards.length > 0 && <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{editStandards.length} selected</span>}
              <button onClick={() => openModal("standard")}
                style={{ padding:"5px 14px", background:BLUE, color:"#fff", border:"none", borderRadius:7, fontSize:"0.72rem", fontWeight:700, cursor:"pointer", fontFamily:F }}>
                Replace
              </button>
            </div>
          </div>
          {editStandards.length > 0 ? (
            <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
              {editStandards.map((std, i) => (
                <div key={std} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom: i < editStandards.length-1 ? "1px solid #f1f5f9" : "none", background:"#fff" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:"2px solid #374151", background:"#374151", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:"0.82rem", fontWeight:500, color:DARK, fontFamily:F }}>{std}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8", fontFamily:F }}>No halal standards selected</p>
          )}
        </div>

        {/* " 3b. Certification Status " */}
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

        {/* " 3d. Conducted Training " */}
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

        {/* " 4. Production Data " */}
        {(appFactories.length > 0 || a.factoryName) && (
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
              <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>PRODUCTION DATA</p>
              <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From registration profile</span>
            </div>

            {/* Factory cards */}
            {(appFactories.length > 0
              ? appFactories
              : [{ id:"x", name: a.factoryName, country:"-", city:"-", lat:"3.1390", lng:"101.6869" }]
            ).map((f:any, i:number) => (
              <ReadonlyFactoryCard key={f.id} f={f} idx={i}
                floorPlan={a.floorPlanData ? { data: a.floorPlanData, name: a.floorPlanName || "Floor Plan" } : null} />
            ))}

          </div>
        )}

        {/* " 4b. Production Compliance " */}
        {[a.outsource,a.privateLab,a.porkProd,a.porkStore,a.freeFromMeat,a.freeFromDeriv,a.vegCert,a.fsmCert,a.alcoholProd,a.alcoholItem,a.dedicDays,a.dedicEquip,a.dedicStore].some(Boolean) && (
          <div style={card}>
            <p style={secHead}>PRODUCTION COMPLIANCE</p>
            <ReadonlyQRow q="Does the company outsource any production activities to third parties?"     val={a.outsource     || ""} />
            <ReadonlyQRow q="Does the company provide private labeling services?"                        val={a.privateLab    || ""} />
            <ReadonlyQRow q="Are any pork derivatives used in the production process?"                   val={a.porkProd      || ""} />
            <ReadonlyQRow q="Are any pork derivatives present in the storage area?"                      val={a.porkStore     || ""} />
            <ReadonlyQRow q="Is the facility free from any animal meat?"                                 val={a.freeFromMeat  || ""} />
            <ReadonlyQRow q="Is the facility free from any animal derivatives?"                          val={a.freeFromDeriv || ""} />
            <ReadonlyQRow q="Does the company hold a valid Vegetarian Certificate?"                      val={a.vegCert       || ""} />
            <ReadonlyQRow q="Does the company hold a valid Food Safety Management Certificate?"          val={a.fsmCert       || ""} />
            <ReadonlyQRow q="Are alcohols used in the production process (excluding cleaning)?"          val={a.alcoholProd   || ""} />
            <ReadonlyQRow q="Is alcohol present in any of the products?"                                 val={a.alcoholItem   || ""} />
            <ReadonlyQRow q="Does the facility have dedicated days for Halal production?"                val={a.dedicDays     || ""} />
            <ReadonlyQRow q="Does the facility use dedicated equipment for Halal production?"            val={a.dedicEquip    || ""} />
            <ReadonlyQRow q="Does the facility use dedicated storage for Halal production?"              val={a.dedicStore    || ""} last />
          </div>
        )}



      </div>
    )
  })()

  // "" Tab content """""""""""""""""""""""""""""""""""""""
  const tabContent: Record<string,React.ReactNode> = !a ? {} : {
    "Application": applicationTab,
    "Products": (() => {
      const products: any[]   = a.products ?? []
      const appFactories: any[] = (() => {
        const factories = ls<any[]>('hcs_factories', [])
        return factories.filter((f:any) => !a.factoryId || f.id === a.factoryId)
      })()
      return (
        <div style={{ fontFamily:F }}>
          {products.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:12 }}>📦</div>
              <div style={{ fontSize:"0.9rem", fontWeight:600, color:"#64748b" }}>No products submitted</div>
              <div style={{ fontSize:"0.8rem", marginTop:4 }}>Products added by the customer will appear here.</div>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <span style={{ fontSize:"0.82rem", fontWeight:700, color:DARK, fontFamily:F }}>Products for Certification</span>
                <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#fff", background:BLUE, padding:"1px 10px", borderRadius:10 }}>{products.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {products.map((p:any, i:number) => {
                  const fac = appFactories.find((f:any) => f.id === p.factoryId)
                  return <ProductCard key={p.id || i} p={p} i={i} fac={fac} />
                })}
              </div>
              {a.remarks && (
                <div style={{ marginTop:20, ...card }}>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:6, fontFamily:F }}>Remarks</div>
                  <div style={{ fontSize:"0.83rem", color:"#374151", lineHeight:1.65, fontFamily:F }}>{a.remarks}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    })(),
    "Agreement": (() => {
      const agrPdfs: Record<string, { fileName: string; pdfData: string }> = (() => {
        try { return JSON.parse(localStorage.getItem("hcs_agreement_pdfs") || "{}") } catch { return {} }
      })()
      const agrLangCodes: string[] = (() => {
        try { return JSON.parse(localStorage.getItem("hcs_agreement_langs") || "[]") } catch { return [] }
      })()
      const AGR_LANG_META: Record<string, { label: string; flag: string }> = {
        en: "", ar: "", ms: "", id: "", tr: "",
        fr: "", de: "", ur: "", zh: "",
        "zh-TW": "", es: "", pt: "",
        ru: "", ja: "", ko: "", th: "",
        bn: "", hi: "", nl: "", it: "",
      } as any
      const getLang = (code: string) => (AGR_LANG_META[code]?.label ?? code) as any

      const signedLang: string = (a as any).agreementLanguage ?? ""
      const signedAt: string   = (a as any).agreementSignedAt ?? ""
      const signatureSrc: string = (a as any).agreementSignature ?? ""
      const signedPdf = agrPdfs[signedLang]

      // AGREEMENT_PENDING - waiting for customer
      if (a.status === "AGREEMENT_PENDING") {
        const uploaded = agrLangCodes.filter(c => agrPdfs[c])
        return (
          <div>
            <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "1.4rem" }}></span>
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#78350f" }}>Waiting for Customer Signature</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#92400e" }}>The customer has been notified to sign the agreement. This tab will update once they sign.</p>
              </div>
            </div>
            {uploaded.length > 0 ? (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Available agreement PDFs ({uploaded.length} language{uploaded.length > 1 ? "s" : ""}):</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploaded.map(code => (
                    <div key={code} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827", flex: 1 }}>{getLang(code)}</span>
                      <a href={agrPdfs[code].pdfData} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        View PDF 
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>No agreement PDFs uploaded yet</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}>Go to Settings  Agreement Template to upload PDFs for each language.</p>
              </div>
            )}
          </div>
        )
      }

      // AGREEMENT_REVIEW - customer signed, HCB must review
      if (a.status === "AGREEMENT_REVIEW") {
        function approveAgreement() {
          if (!a) return
          const now = new Date().toISOString()
          const actorName = user?.name ?? "HCB Office"
          const appRef = a.applicationNumber ?? `#${a.id}`
          const coName = a.companyName ?? "-"
          const updated = {
            ...a, status: "PENDING_PAYMENT" as ApplicationStatus,
            agreementApprovedAt: now, agreementApprovedBy: actorName,
            logs: [...(a.logs ?? []), { timestamp: now, action: "Agreement Approved", by: actorName, note: "Agreement reviewed and approved by HCB. Proceeding to payment.", color: "#16a34a" }],
          }
          setViewApp(updated)
          if ((a as any)._local) {
            const all = JSON.parse(localStorage.getItem("hcs_local_applications") || "[]")
            localStorage.setItem("hcs_local_applications", JSON.stringify(all.map((la: any) => la.id === a.id ? { ...la, ...updated } : la)))
          }

          // Auto-create and issue invoice when agreement is approved
          const billing = loadApplicationBilling(a.id)
          if (billing && !loadInvoiceByApp(a.id)) {
            const inv = createInvoiceFromBilling({ ...billing, applicationId: String(a.id), applicationNumber: appRef })
            const issued = { ...inv, status: "ISSUED" as const, sentAt: now }
            saveInvoice(issued)
          }

          addAuditLog({ applicationId: String(a.id), applicationNumber: appRef, companyName: coName, actor: actorName, role: "HCB Office", action: "Agreement Approved", details: "HCB reviewed and approved the signed agreement.", oldStatus: "AGREEMENT_REVIEW", newStatus: "PENDING_PAYMENT", category: "APPLICATION" })
          addNotification("customer", { type: "success", title: "", body: `Your agreement for ${appRef} has been approved. An invoice has been issued  please proceed to payment.` })
        }
        function rejectAgreement() {
          if (!a) return
          const now = new Date().toISOString()
          const actorName = user?.name ?? "HCB Office"
          const appRef = a.applicationNumber ?? `#${a.id}`
          const coName = a.companyName ?? "-"
          const updated = {
            ...a, status: "AGREEMENT_PENDING" as ApplicationStatus,
            agreementSignedAt: undefined, agreementSignature: undefined, agreementLanguage: undefined,
            logs: [...(a.logs ?? []), { timestamp: now, action: "Agreement Returned", by: actorName, note: "HCB requested the customer to re-sign the agreement.", color: "#f59e0b" }],
          }
          setViewApp(updated)
          if ((a as any)._local) {
            const all = JSON.parse(localStorage.getItem("hcs_local_applications") || "[]")
            localStorage.setItem("hcs_local_applications", JSON.stringify(all.map((la: any) => la.id === a.id ? { ...la, ...updated } : la)))
          }
          addAuditLog({ applicationId: String(a.id), applicationNumber: appRef, companyName: coName, actor: actorName, role: "HCB Office", action: "Agreement Returned", details: "HCB returned the agreement to customer for re-signing.", oldStatus: "AGREEMENT_REVIEW", newStatus: "AGREEMENT_PENDING", category: "APPLICATION" })
          addNotification("customer", { type: "warning", title: "Agreement Returned", body: `HCB has returned your agreement for ${appRef}. Please re-read and sign again.` })
        }
        return (
          <div>
            {/* Action bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#111827" }}>Customer has signed - review required</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                  Signed in <strong>{getLang(signedLang)}</strong> on {signedAt ? new Date(signedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={rejectAgreement}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#b45309", cursor: "pointer", fontFamily: F }}>
                   Return for Re-signing
                </button>
                <button onClick={approveAgreement}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#16a34a", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: F }}>
                  <CheckCircle2 size={14} /> Approve Agreement
                </button>
              </div>
            </div>

            {/* PDF viewer */}
            {signedPdf && (
              <iframe src={signedPdf.pdfData} title="Signed Agreement"
                style={{ width: "100%", height: "calc(100vh - 340px)", minHeight: 480, border: "1px solid #e2e8f0", borderRadius: "10px 10px 0 0", display: "block", background: "#f8fafc" }} />
            )}

            {/* Signature section */}
            <div style={{ border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 10px 10px", background: "#fff", padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>- Signature Page -</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* HCB left */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>HCB Authorised Signatory</p>
                  <div style={{ height: 110, borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Signed by HCB</p>
                  </div>
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>Halal Certification Body</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Date: {new Date().toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
                {/* Customer right */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer Signature</p>
                  {signatureSrc ? (
                    <div style={{ height: 110, borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" }}>
                      <img src={signatureSrc} alt="Customer signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div style={{ height: 110, borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Signature not captured</p>
                    </div>
                  )}
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{a.companyName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Signed: {signedAt ? new Date(signedAt).toLocaleDateString("en-GB") : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Post-agreement statuses - read-only record
      const isPostAgreement = ["PENDING_PAYMENT","PAYMENT_REVIEW","AUDIT_SCHEDULED","DOCUMENT_SUBMISSION","AUDIT_IN_PROGRESS","AUDIT_COMPLETED","NC_CLEARANCE","DECISION_MAKING","CERTIFICATION_REVIEW","CERTIFIED"].includes(a.status)
      if (isPostAgreement && signedAt) {
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#15803d" }}>Agreement Approved</p>
                <p style={{ margin: "1px 0 0", fontSize: "0.71rem", color: "#166534" }}>
                  Signed by customer in <strong>{getLang(signedLang)}</strong> on {new Date(signedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            {signedPdf && (
              <iframe src={signedPdf.pdfData} title="Signed Agreement"
                style={{ width: "100%", height: "calc(100vh - 320px)", minHeight: 400, border: "1px solid #e2e8f0", borderRadius: "10px 10px 0 0", display: "block", background: "#f8fafc" }} />
            )}
            <div style={{ border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 10px 10px", background: "#fff", padding: "20px 24px" }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>- Signature Page -</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>HCB Authorised Signatory</p>
                  <div style={{ height: 90, borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Signed by HCB</p>
                  </div>
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>Halal Certification Body</p>
                  </div>
                </div>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Customer Signature</p>
                  {signatureSrc ? (
                    <div style={{ height: 90, borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#f0f9ff", overflow: "hidden", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={signatureSrc} alt="Customer signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div style={{ height: 90, borderRadius: 8, border: "1.5px dashed #cbd5e1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>-</p>
                    </div>
                  )}
                  <div style={{ borderTop: "1.5px solid #374151", paddingTop: 8 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#111827" }}>{a.companyName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Signed: {new Date(signedAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      return <PlaceholderTab icon="" label="Agreement" />
    })(),
    "Billing":        <OfficeBillingTab app={a} />,
    "Audit plan":     <AuditPlanTab app={a} />,
    "Documents":      <OfficeDocumentsTab app={a} />,
    "Audit":          <AuditChecklistTab app={a} />,
    "NCs":            <NcsTab applicationId={a.id} />,
    "Summary":        <PlaceholderTab icon="" label="Summary" />,
    "Assignment":     <PlaceholderTab icon="" label="Assignment" />,
    "Decision":       <PlaceholderTab icon="" label="Decision" />,
    "Final Decision": <PlaceholderTab icon="" label="Final Decision" />,
    "Logs": (() => {
      const entries: { timestamp:string; action:string; by:string; note?:string; color:string }[] =
        a.logs?.length ? [...a.logs].reverse() : [{
          timestamp: a.savedAt || a.submittedAt || "",
          action: "Application Submitted", by: "Customer", color: "#16a34a",
        }]
      return (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:F }}>Audit Trail</p>
            <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:6, fontFamily:F }}>{entries.length} event{entries.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0, borderLeft:"2px solid #e2e8f0", marginLeft:10 }}>
            {entries.map((log, i) => (
              <div key={i} style={{ display:"flex", gap:14, paddingBottom: i < entries.length-1 ? 20 : 0, position:"relative" }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:log.color, flexShrink:0, marginLeft:-8, marginTop:2, border:"2px solid #fff", boxShadow:"0 0 0 2px " + log.color + "33" }} />
                <div style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, padding:"10px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom: log.note ? 4 : 0 }}>
                    <p style={{ margin:0, fontSize:"0.8rem", fontWeight:700, color:"#0f172a", fontFamily:F }}>{log.action}</p>
                    <span style={{ fontSize:"0.66rem", fontWeight:600, color:"#fff", background:log.color, padding:"2px 8px", borderRadius:6, fontFamily:F, flexShrink:0 }}>{log.by}</span>
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
    "Chat":        <PlaceholderTab icon="" label="Chat" />,
    "Certificate": <PlaceholderTab icon="" label="Certificate" />,
  }

  return (
    <OfficeLayout title="Applications">
      <div className="office-applications-page" style={{ padding:"20px 24px", fontFamily:F }}>

        {/* Page header with stats + tabs */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e9ecef", padding:"18px 24px 0", marginBottom:20, borderRadius:"12px 12px 0 0", border:"1px solid #e9ecef" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <h1 style={{ margin:0, fontSize:"1.1rem", fontWeight:800, color:"#0f172a" }}>Applications</h1>
              <p style={{ margin:"3px 0 0", fontSize:"0.72rem", color:"#64748b" }}>
                {isLoading ? "Loading..." : `${(totalAll + localApps.length).toLocaleString()} applications total`}
              </p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:10, background:s.bg }}>
                  <div>
                    <div style={{ fontSize:"1rem", fontWeight:800, color:"#fff", lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.8)", marginTop:2, fontWeight:500 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:0 }}>
            {TABS.map(tab => {
              const isActive = statusGroup === tab.value
              const cnt = tab.badge ? (tabCounts[tab.value] ?? 0) : null
              return (
                <button key={tab.value || "all"} onClick={() => { setStatusGroup(tab.value); setPage(0) }}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 18px", border:"none", cursor:"pointer", fontSize:"0.8rem", fontWeight:isActive?700:500, fontFamily:F, background:"transparent", color:isActive?"#0f2170":"#64748b", borderBottom:isActive?"2.5px solid #0f2170":"2.5px solid transparent", marginBottom:-1, whiteSpace:"nowrap" as const }}>
                  {tab.label}
                  {cnt !== null && cnt > 0 && (
                    <span style={{ minWidth:18, height:18, padding:"0 5px", borderRadius:99, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, background:isActive?"#0f2170":"#e2e8f0", color:isActive?"#fff":"#64748b" }}>{cnt}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search + refresh */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ position:"relative", flex:1, maxWidth:320 }}>
            <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.muted, width:13, height:13 }} />
            <input type="text" placeholder="Search by company or app number..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              style={{ width:"100%", paddingLeft:30, paddingRight:10, height:32, border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.text, outline:"none", fontSize:"0.75rem", fontFamily:F, boxSizing:"border-box" as const }}
              onFocus={e => (e.target.style.borderColor = BLUE)}
              onBlur={e  => (e.target.style.borderColor = C.border)} />
          </div>
          <button onClick={() => { refetch(); setLocalApps(loadLocalApps()) }}
            style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.muted, cursor:"pointer" }}
            onMouseOver={e => (e.currentTarget.style.background = C.bg)}
            onMouseOut={e  => (e.currentTarget.style.background = C.white)}>
            <RefreshCw style={{ width:13, height:13 }} className={isRefetching ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", boxShadow:C.cardShadow }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}`, background:"#fafbfc" }}>
                {["App #","Company","Type","Status","Country","Factory Location","Standard","Products","Submitted","Updated","Auditor","Approved By","Progress"].map(h => (
                  <th key={h} style={{ padding:"13px 14px", textAlign:"left", fontSize:"0.64rem", fontWeight:700, color:C.muted, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap", fontFamily:F }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                    {Array.from({ length: 14 }).map((_,j) => (
                      <td key={j} style={{ padding:"14px 14px" }}>
                        <div className="animate-pulse" style={{ height:12, borderRadius:4, background:"#f0f0f0", width: j===13?50:"75%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ padding:"60px 20px", textAlign:"center" }}>
                    <FileText style={{ width:34, height:34, margin:"0 auto 10px", display:"block", color:"#d1d5db" }} />
                    <p style={{ margin:0, fontSize:"0.8rem", fontWeight:600, color:C.muted, fontFamily:F }}>No applications found</p>
                    <p style={{ margin:"4px 0 0", fontSize:"0.7rem", color:"#9ca3af", fontFamily:F }}>Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                applications.map(app => {
                  const isLoc = (app as any)._local
                  const isSelected = viewApp?.id === app.id
                  const flow = STATUS_FLOW[app.status] ?? { done: app.status, upcoming: "-" }
                  return (
                    <tr key={app.id} onClick={() => selectApp(app)}
                      style={{ borderBottom:`1px solid ${C.border}`, borderLeft: isSelected?`3px solid ${BLUE}`:"3px solid transparent", background: isSelected?"#eff6ff":"transparent", cursor:"pointer", transition:"background 0.12s" }}
                      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "#f9fafb" }}
                      onMouseOut={e  => { e.currentTarget.style.background = isSelected ? "#eff6ff" : "transparent" }}>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          <span style={{ fontFamily:"monospace", fontSize:"0.72rem", fontWeight:700, color:C.primary }}>{app.applicationNumber}</span>
                          {isLoc && <span style={{ fontSize:"0.6rem", color:"#94a3b8", fontWeight:600 }}>Pending sync</span>}
                        </div>
                      </td>
                      <td style={{ padding:"13px 14px", minWidth:200 }}><span style={{ fontSize:"0.78rem", fontWeight:600, color:C.textDark, fontFamily:F }}>{app.companyName}</span></td>
                      <td style={{ padding:"13px 14px" }}><span style={{ fontSize:"0.7rem", padding:"2px 8px", borderRadius:20, background:"#f3f4f6", color:C.muted, fontFamily:F, fontWeight:500, whiteSpace:"nowrap" }}>{app.type}</span></td>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, whiteSpace:"nowrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#16a34a" }}></span>
                            <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#374151", fontFamily:F }}>{flow.done}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:"0.62rem", fontWeight:700, color:BLUE }}></span>
                            <span style={{ fontSize:"0.68rem", fontWeight:600, color:BLUE, fontFamily:F }}>{flow.upcoming}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"13px 14px", fontSize:"0.75rem", color:C.muted, fontFamily:F }}>{app.country ?? "-"}</td>
                      <td style={{ padding:"13px 14px", fontSize:"0.72rem", color:C.muted, fontFamily:F, maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={app.factoryLocation ?? "-"}>{app.factoryLocation ?? "-"}</td>
                      <td style={{ padding:"13px 14px", fontSize:"0.72rem", color:C.muted, fontFamily:F, maxWidth:170, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={app.halalStandard ?? "-"}>{app.halalStandard ?? "-"}</td>
                      <td style={{ padding:"13px 14px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:24, height:22, padding:"0 8px", borderRadius:20, background:"#eef2ff", color:"#3730a3", fontSize:"0.7rem", fontWeight:700, fontFamily:F }}>
                          {app.productCount ?? 0}
                        </span>
                      </td>
                      <td style={{ padding:"13px 14px", fontSize:"0.75rem", color:C.muted, fontFamily:F, whiteSpace:"nowrap" }}>{app.submittedAt ? formatDate(app.submittedAt) : "-"}</td>
                      <td style={{ padding:"13px 14px", fontSize:"0.75rem", color:C.muted, fontFamily:F, whiteSpace:"nowrap" }}>{app.updatedAt ? formatDate(app.updatedAt) : "-"}</td>
                      <td style={{ padding:"13px 14px", fontSize:"0.75rem", color:C.muted, fontFamily:F }}>{app.assignedAuditorName ?? "-"}</td>
                      <td style={{ padding:"13px 14px", fontSize:"0.75rem", color:C.muted, fontFamily:F }}>{(app as any).approvedBy ?? "-"}</td>
                      <td style={{ padding:"13px 14px", minWidth:110 }}>
                        {app.status === "CERTIFIED"
                          ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:"0.69rem", color:"#15803d", fontWeight:600 }}><CheckCircle2 size={12} />Certified</span>
                          : ["REJECTED","SUSPENDED","EXPIRED"].includes(app.status)
                            ? <span style={{ fontSize:"0.69rem", color:"#94a3b8" }}>-</span>
                            : (() => {
                                const pct = Math.round((STATUS_IDX[app.status] ?? 0) / 14 * 100)
                                const st  = getStatusStyle(app.status)
                                return (
                                  <div>
                                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                      <span style={{ fontSize:"0.6rem", color:"#94a3b8" }}>Progress</span>
                                      <span style={{ fontSize:"0.6rem", fontWeight:700, color:st.color }}>{pct}%</span>
                                    </div>
                                    <div style={{ height:4, borderRadius:99, overflow:"hidden", background:"#f1f5f9", width:100 }}>
                                      <div style={{ height:"100%", width:`${pct}%`, borderRadius:99, background:st.dot }} />
                                    </div>
                                  </div>
                                )
                              })()
                        }
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
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14 }}>
            <p style={{ margin:0, fontSize:"0.72rem", color:C.muted, fontFamily:F }}>Page {page+1} of {totalPages}</p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, border:`1px solid ${C.border}`, background:C.white, cursor:"pointer", opacity:page===0?0.4:1 }}>
                <ChevronLeft style={{ width:13, height:13, color:C.text }} />
              </button>
              {Array.from({ length: Math.min(5,totalPages) }, (_,i) => Math.max(0,Math.min(page-2,totalPages-5))+i).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, fontSize:"0.72rem", fontFamily:F, cursor:"pointer", background:page===n?C.primary:C.white, color:page===n?"#fff":C.text, border:`1px solid ${page===n?C.primary:C.border}`, fontWeight:page===n?700:400 }}>
                  {n+1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, border:`1px solid ${C.border}`, background:C.white, cursor:"pointer", opacity:page>=totalPages-1?0.4:1 }}>
                <ChevronRight style={{ width:13, height:13, color:C.text }} />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen detail popup */}
        {viewApp && (
          <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:"4vh 3vw" }}>
          <div ref={detailRef} style={{ width:"100%", height:"100%", maxWidth:1600, background:"#f1f5f9", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}>

            {/* Panel header */}
            <div style={{ padding:"14px 20px", background:"#2563eb", borderBottom:"1px solid #1d4ed8", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontFamily:"monospace", fontSize:"0.8rem", fontWeight:700, color:"#fff", background:"rgba(255,255,255,0.15)", padding:"3px 10px", borderRadius:6, flexShrink:0 }}>{appNum}</span>
              <span style={{ fontSize:"0.95rem", fontWeight:700, color:"#fff", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company}</span>
              {/* Status flow badges */}
              {(() => {
                const flow = STATUS_FLOW[status] ?? { done: s.label, upcoming: "-" }
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, background:"#ffffff", padding:"5px 14px", borderRadius:20, boxShadow:"0 2px 10px rgba(0,0,0,0.25)" }}>
                      <span style={{ fontSize:"0.68rem", fontWeight:900, color:BLUE, fontFamily:F }}>Current Status:</span>
                      <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#111827", fontFamily:F }}>{flow.done}</span>
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:"1rem" }}></span>
                    <div style={{ display:"flex", alignItems:"center", gap:5, background:"#ffffff", padding:"5px 14px", borderRadius:20, boxShadow:"0 2px 10px rgba(0,0,0,0.25)" }}>
                      <span style={{ fontSize:"0.68rem", fontWeight:900, color:BLUE, fontFamily:F }}>Pending Work:</span>
                      <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#111827", fontFamily:F }}>{flow.upcoming}</span>
                    </div>
                  </div>
                )
              })()}
              {isLocal && <span style={{ fontSize:"0.67rem", color:"rgba(255,255,255,0.75)", background:"rgba(255,255,255,0.12)", padding:"2px 9px", borderRadius:9, fontWeight:600, flexShrink:0 }}>Pending sync</span>}
              {(status === "SUBMITTED" || status === "UNDER_REVIEW") && (
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={() => setRejectModal(true)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.4)", color:"#fca5a5", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:F, transition:"background 0.15s" }}
                    onMouseOver={e => (e.currentTarget.style.background = "rgba(220,38,38,0.25)")}
                    onMouseOut={e  => (e.currentTarget.style.background = "rgba(220,38,38,0.15)")}>
                    <X style={{ width:13, height:13 }} />
                    Reject
                  </button>
                  <button onClick={() => setApproveConfirm(true)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:8, background:"#16a34a", border:"1px solid #15803d", color:"#fff", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:F, transition:"background 0.15s" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#15803d")}
                    onMouseOut={e  => (e.currentTarget.style.background = "#16a34a")}>
                    <CheckCircle2 style={{ width:14, height:14 }} />
                    Approve
                  </button>
                </div>
              )}
              <button onClick={() => setViewApp(null)}
                style={{ width:28, height:28, borderRadius:8, border:"1px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.12)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}>
                <X style={{ width:14, height:14 }} />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", overflowX:"auto", scrollbarWidth:"none", background:"#fff" }}>
              {APP_TABS.map(tab => {
                const active = appTab === tab
                return (
                  <button key={tab} onClick={() => setAppTab(tab)}
                    style={{ padding:"10px 17px", fontSize:"0.77rem", fontWeight: active?700:400, color: active?BLUE:"#64748b", borderBottom:`2px solid ${active?BLUE:"transparent"}`, background:"transparent", border:"none", borderBottomStyle:"solid", borderBottomWidth:2, borderBottomColor: active?BLUE:"transparent", cursor:"pointer", whiteSpace:"nowrap", fontFamily:F, flexShrink:0, transition:"color 0.1s" }}>
                    {tab}
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

      {/* "" Document preview popup "" */}
      {docPreview && (
        <div onClick={() => setDocPreview(null)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(920px,95vw)", maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.35)" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0, background:"#fff" }}>
              <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Paperclip size={15} color="#d97706" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:"0.88rem", fontWeight:700, color:DARK, fontFamily:F }}>{docPreview.name}</p>
                <p style={{ margin:0, fontSize:"0.7rem", color:"#94a3b8", fontFamily:F }}>Document Preview</p>
              </div>
              <a href={docPreview.url} download={docPreview.name}
                style={{ padding:"6px 14px", borderRadius:7, background:"#fffbeb", border:"1px solid #fde68a", color:"#d97706", fontSize:"0.75rem", fontWeight:600, textDecoration:"none", fontFamily:F, flexShrink:0 }}>
                Download
              </a>
              <button onClick={() => setDocPreview(null)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X style={{ width:14, height:14, color:"#64748b" }} />
              </button>
            </div>
            {/* Preview */}
            <div style={{ flex:1, overflow:"auto", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
              {docPreview.url.startsWith("data:image") ? (
                <img src={docPreview.url} alt={docPreview.name} style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", display:"block" }} />
              ) : (
                <iframe src={docPreview.url} title={docPreview.name} style={{ width:"100%", height:"80vh", border:"none", display:"block" }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* "" HCB Edit Modal "" */}
      {hcbModal && (
        <div onClick={() => setHcbModal(null)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(520px,95vw)", maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}>

            {/* Modal header */}
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:"0.88rem", fontWeight:700, color:DARK }}>{hcbModal === "certCat" ? "Certification Category" : "Halal Standards"}</p>
                <p style={{ margin:"2px 0 0", fontSize:"0.7rem", color:"#94a3b8" }}>Select options for this application</p>
              </div>
              {modalDraft.length > 0 && (
                <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>{modalDraft.length} selected</span>
              )}
              <button onClick={() => setHcbModal(null)}
                style={{ width:28, height:28, borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X style={{ width:13, height:13, color:"#64748b" }} />
              </button>
            </div>

            {/* Options list */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {(hcbModal === "certCat" ? CERT_CATEGORIES : loadConfiguredHalalStandards()).map((item, i, arr) => {
                const sel = modalDraft.includes(item)
                return (
                  <div key={item} onClick={() => toggleDraft(item)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 20px", cursor:"pointer",
                      borderBottom: i < arr.length-1 ? "1px solid #f1f5f9" : "none",
                      background: sel ? "#eff6ff" : "transparent", transition:"background 0.1s", userSelect:"none" as const }}
                    onMouseOver={e => { if (!sel) e.currentTarget.style.background = "#f8fafc" }}
                    onMouseOut={e  => { e.currentTarget.style.background = sel ? "#eff6ff" : "transparent" }}>
                    <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                      border: sel ? `2px solid ${BLUE}` : "1.5px solid #d1d5db",
                      background: sel ? BLUE : "#fff",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize:"0.84rem", color: sel ? BLUE : DARK, fontWeight: sel ? 600 : 400 }}>{item}</span>
                  </div>
                )
              })}
            </div>

            {/* Modal footer */}
            <div style={{ padding:"14px 20px", borderTop:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"#fafbfc" }}>
              <button onClick={() => setModalDraft([])}
                style={{ padding:"7px 16px", background:"transparent", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:7, fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:F }}>
                Clear all
              </button>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setHcbModal(null)}
                  style={{ padding:"7px 16px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:7, fontSize:"0.78rem", fontWeight:600, cursor:"pointer", fontFamily:F }}>
                  Cancel
                </button>
                <button onClick={saveModal}
                  style={{ padding:"7px 20px", background:BLUE, color:"#fff", border:"none", borderRadius:7, fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:F }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "" Reject modal "" */}
      {rejectModal && (
        <div onClick={() => { setRejectModal(false); setRejectReason("") }}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(440px,95vw)", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"flex-start", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X size={20} color="#dc2626" />
              </div>
              <div>
                <p style={{ margin:0, fontSize:"0.95rem", fontWeight:700, color:DARK, fontFamily:F }}>Reject Application?</p>
                <p style={{ margin:"4px 0 0", fontSize:"0.78rem", color:"#64748b", fontFamily:F, lineHeight:1.5 }}>
                  The customer will be notified and can resubmit after addressing the issues.
                </p>
              </div>
            </div>
            <div style={{ padding:"16px 22px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:14 }}>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>Application</p>
                  <p style={{ margin:0, fontFamily:"monospace", fontSize:"0.78rem", fontWeight:700, color:BLUE }}>{appNum}</p>
                </div>
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>Company</p>
                  <p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:DARK }}>{company}</p>
                </div>
              </div>
              <label style={{ display:"block", fontSize:"0.72rem", fontWeight:600, color:"#374151", marginBottom:6, fontFamily:F }}>
                Rejection Reason <span style={{ color:"#94a3b8", fontWeight:400 }}>(required)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                rows={3}
                style={{ width:"100%", padding:"9px 11px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:"0.8rem", fontFamily:F, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6, color:DARK }}
                onFocus={e => (e.target.style.borderColor = "#dc2626")}
                onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div style={{ padding:"16px 22px", display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={() => { setRejectModal(false); setRejectReason("") }}
                style={{ padding:"8px 18px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:F }}>
                Cancel
              </button>
              <button onClick={rejectApp} disabled={!rejectReason.trim()}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 20px", background: rejectReason.trim() ? "#dc2626" : "#f1f5f9", color: rejectReason.trim() ? "#fff" : "#94a3b8", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:700, cursor: rejectReason.trim() ? "pointer" : "not-allowed", fontFamily:F, transition:"background 0.15s" }}>
                <X style={{ width:14, height:14 }} />
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "" Approve confirmation modal "" */}
      {approveConfirm && (() => {
        const billing  = a ? loadApplicationBilling(a.id) : null
        const sym      = billing ? (billing.currency === "AED" ? "AED " : billing.currency + " ") : "AED "
        const fmt      = (n: number) => `${sym}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}`
        const dv       = parseFloat(discountValue) || 0
        const discountAmt = billing && dv > 0
          ? discountType === "%" ? billing.subtotal * (dv / 100) : Math.min(dv, billing.subtotal)
          : 0
        const newSubtotal = billing ? Math.max(0, billing.subtotal - discountAmt) : 0
        const newVat      = billing ? newSubtotal * billing.vatPct / 100 : 0
        const newTotal    = newSubtotal + newVat
        return (
          <div onClick={() => setApproveConfirm(false)}
            style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:"#fff", borderRadius:14, overflow:"hidden", width:"min(520px,95vw)", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" }}>

              {/* Header */}
              <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                </div>
                <div>
                  <p style={{ margin:0, fontSize:"0.95rem", fontWeight:700, color:DARK }}>Approve Application</p>
                  <p style={{ margin:"4px 0 0", fontSize:"0.78rem", color:"#64748b", lineHeight:1.5 }}>
                    Review the fee breakdown and apply a discount if applicable before confirming approval.
                  </p>
                </div>
              </div>

              {/* App summary strip */}
              <div style={{ padding:"12px 22px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", display:"flex", gap:24 }}>
                <div><p style={{ margin:"0 0 1px", fontSize:"0.6rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Application</p><p style={{ margin:0, fontFamily:"monospace", fontSize:"0.78rem", fontWeight:700, color:BLUE }}>{appNum}</p></div>
                <div><p style={{ margin:"0 0 1px", fontSize:"0.6rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Company</p><p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:DARK }}>{company}</p></div>
                <div><p style={{ margin:"0 0 1px", fontSize:"0.6rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Status</p><p style={{ margin:0, fontSize:"0.78rem", fontWeight:600, color:"#d97706" }}>{status}</p></div>
              </div>

              {/* Price breakdown */}
              <div style={{ padding:"18px 22px", borderBottom:"1px solid #e2e8f0" }}>
                <p style={{ margin:"0 0 12px", fontSize:"0.68rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Fee Breakdown</p>
                {billing ? (
                  <div style={{ display:"flex", flexDirection:"column" as const, gap:0 }}>
                    {billing.lineItems.map((li, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
                        <span style={{ fontSize:"0.8rem", color:"#374151" }}>{li.description}</span>
                        <span style={{ fontSize:"0.8rem", fontWeight:600, color:DARK }}>{fmt(li.total)}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <span style={{ fontSize:"0.8rem", color:"#374151" }}>VAT ({billing.vatPct}%)</span>
                      <span style={{ fontSize:"0.8rem", fontWeight:600, color:DARK }}>{fmt(billing.vatAmount)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0" }}>
                      <span style={{ fontSize:"0.85rem", fontWeight:700, color:DARK }}>Original Total</span>
                      <span style={{ fontSize:"0.85rem", fontWeight:700, color:DARK }}>{fmt(billing.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8" }}>No billing record found for this application.</p>
                )}
              </div>

              {/* Discount */}
              <div style={{ padding:"16px 22px", borderBottom:"1px solid #e2e8f0", background:"#fafbfd" }}>
                <p style={{ margin:"0 0 10px", fontSize:"0.68rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Apply Discount <span style={{ fontWeight:400, textTransform:"none" as const }}>(optional)</span></p>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as "%"|"fixed")}
                    style={{ height:34, padding:"0 8px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:"0.8rem", color:DARK, fontFamily:F, outline:"none", background:"#fff", cursor:"pointer" }}>
                    <option value="%">% Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input type="number" min="0" placeholder={discountType === "%" ? "e.g. 10" : "e.g. 500"}
                    value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                    style={{ flex:1, height:34, padding:"0 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:"0.8rem", color:DARK, fontFamily:F, outline:"none" }}/>
                  {dv > 0 && <span style={{ fontSize:"0.78rem", color:"#16a34a", fontWeight:600, whiteSpace:"nowrap" as const }}>− {fmt(discountAmt)}</span>}
                </div>
              </div>

              {/* Adjusted total */}
              {billing && (
                <div style={{ padding:"14px 22px", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ margin:0, fontSize:"0.72rem", color:"#64748b" }}>Subtotal after discount</p>
                    <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#64748b" }}>VAT ({billing.vatPct}%)</p>
                  </div>
                  <div style={{ textAlign:"right" as const }}>
                    <p style={{ margin:0, fontSize:"0.72rem", color:DARK, fontWeight:600 }}>{fmt(newSubtotal)}</p>
                    <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:DARK, fontWeight:600 }}>{fmt(newVat)}</p>
                  </div>
                  <div style={{ marginLeft:20, padding:"8px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, textAlign:"center" as const }}>
                    <p style={{ margin:"0 0 1px", fontSize:"0.6rem", fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Final Total</p>
                    <p style={{ margin:0, fontSize:"1rem", fontWeight:800, color:"#15803d" }}>{fmt(newTotal)}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ padding:"14px 22px", display:"flex", justifyContent:"flex-end", gap:8 }}>
                <button onClick={() => { setApproveConfirm(false); setDiscountValue(""); setDiscountType("%") }}
                  style={{ padding:"8px 18px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:F }}>
                  Cancel
                </button>
                <button onClick={approveApp}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 20px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:700, cursor:"pointer", fontFamily:F }}>
                  <CheckCircle2 style={{ width:14, height:14 }} />
                  Confirm Approval
                </button>
              </div>

            </div>
          </div>
        )
      })()}

    </OfficeLayout>
  )
}
