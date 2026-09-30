import { useState, useRef, useMemo, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  X, FileText, CheckCircle2,
  ChevronRight, Globe, Phone, Mail, Package, Building2, Building,
  AlertCircle, ArrowRight,
  ShoppingBasket, Sparkles, FlaskConical, Truck, UtensilsCrossed, Factory, Scissors,
} from "lucide-react"
import { loadPricing, getCurrencySymbol } from "@/lib/pricing"
import { saveApplicationBilling } from "@/lib/billing"
import apiClient from "@/api/client"
import { getMyCompany, type Company } from "@/api/companies"
import { getFactories, type Factory as ApiFactory } from "@/api/factories"
import { getProducts, type Product as ApiProduct } from "@/api/products"
import { getAccreditationScopes } from "@/api/system"
import { useAuthStore } from "@/store/authStore"
import { addNotification } from "@/lib/notifications"
import { addAuditLog } from "@/lib/auditLog"

const BLUE  = "#2563eb"
const DARK  = "#111827"
const NAV   = "#0f2170"
const GREEN = "#16a34a"
const RED   = "#dc2626"

interface AppFactory {
  id:string; name:string; country:string; city:string; address?:string; lat:string; lng:string
  prodLines?:string; prodVolume?:string; volUnit?:string
  activityCategories?:string[]; specificActivities?:string[]
}
interface AppProduct {
  id:string; catalogKey:string; emoji:string; name:string; code:string; factoryId:string
  ingredients:{id:string;name:string;status?:string;certFile?:string}[]; addedAt:string
}

const SECTIONS = [
  { num:1, label:"Company Information"       },
  { num:2, label:"Services & Activities"     },
  { num:3, label:"Certification Preferences" },
  { num:4, label:"Production Data"           },
  { num:5, label:"Products & Declaration"    },
]

const CATEGORIES: { key:string; label:string; Icon:React.ComponentType<{size?:number;color?:string;strokeWidth?:number}> }[] = [
  { key:"food",       label:"Food & Beverages",         Icon:ShoppingBasket  },
  { key:"cosmetics",  label:"Cosmetics & Personal Care", Icon:Sparkles        },
  { key:"pharma",     label:"Pharmaceuticals",           Icon:FlaskConical    },
  { key:"logistics",  label:"Logistics & Warehousing",   Icon:Truck           },
  { key:"restaurant", label:"Restaurant & F&B",          Icon:UtensilsCrossed },
  { key:"mfg",        label:"Manufacturing",             Icon:Factory         },
  { key:"slaughter",  label:"Slaughterhouse",            Icon:Scissors        },
  { key:"others",     label:"Others",                    Icon:Package         },
]

const ACTIVITIES = [
  // Food & Beverage
  { key:"dairy",           label:"Dairy",                     emoji:"🥛" },
  { key:"eggs",            label:"Eggs & Egg Processing",     emoji:"🥚" },
  { key:"meat",            label:"Meat & Poultry",            emoji:"🍖" },
  { key:"seafood",         label:"Seafood Processing",        emoji:"🐟" },
  { key:"baking",          label:"Baking Ingredients",        emoji:"🍞" },
  { key:"confectionery",   label:"Confectionery & Chocolate", emoji:"🍫" },
  { key:"readymeals",      label:"Ready-to-Eat Meals",        emoji:"🥡" },
  { key:"vegetarian",      label:"Vegetarian Products",       emoji:"🥗" },
  { key:"vegan",           label:"Vegan Products",            emoji:"🌱" },
  { key:"beverages",       label:"Beverages or Juices",       emoji:"🥤" },
  { key:"oils",            label:"Oils & Fats",               emoji:"🫒" },
  { key:"spices",          label:"Spices and Sauces",         emoji:"🌶️" },
  { key:"flavoring",       label:"Flavoring & Additives",     emoji:"🍬" },
  // Health & Science
  { key:"supplements",     label:"Supplements",               emoji:"💊" },
  { key:"nutraceuticals",  label:"Nutraceuticals",            emoji:"🌿" },
  { key:"chemicals",       label:"(Synthetic) Chemicals",     emoji:"🧪" },
  { key:"meddevices",      label:"Medical Devices",           emoji:"🩺" },
  // Cosmetics & Personal Care
  { key:"cosmeticprod",    label:"Cosmetic Products",         emoji:"💄" },
  { key:"skincare",        label:"Skincare & Bodycare",       emoji:"🧼" },
  { key:"haircare",        label:"Hair Care",                 emoji:"💇" },
  { key:"fragrance",       label:"Perfume & Fragrance",       emoji:"🌸" },
  // Manufacturing & Trade
  { key:"animalfeed",      label:"Animal Feed",               emoji:"🐾" },
  { key:"packaging",       label:"Packaging & Materials",     emoji:"📦" },
  { key:"privatelabel",    label:"Trading / Private Label",   emoji:"🏷️" },
  { key:"slaughter",       label:"Slaughterhouse",            emoji:"🔪" },
  // Logistics
  { key:"warehousing",     label:"Warehousing & Storage",     emoji:"🏢" },
  { key:"coldchain",       label:"Cold Chain Logistics",      emoji:"🧊" },
  { key:"importexport",    label:"Import / Export",           emoji:"🚢" },
  // F&B Service
  { key:"restaurant",      label:"Restaurant & Café",         emoji:"☕" },
  { key:"bakery",          label:"Bakery & Patisserie",       emoji:"🥐" },
  { key:"catering",        label:"Catering",                  emoji:"🍽️" },
  { key:"hotel",           label:"Hotel & Hospitality",       emoji:"🏨" },
  { key:"canteen",         label:"Canteen / Institutional",   emoji:"🏫" },
  // Cleaning & Hygiene
  { key:"cleaning",        label:"Cleaning Detergents",       emoji:"🧴" },
  { key:"cleaningservice", label:"Cleaning Services",         emoji:"🧹" },
  { key:"sanitization",    label:"Sanitization Products",     emoji:"🫧" },
]

const VOL_UNITS      = ["kg","tonnes","litres","units","pallets","containers"]
void VOL_UNITS

function parseJson<T>(value: string | undefined, fallback: T): T {
  try { return value ? { ...fallback, ...JSON.parse(value) } : fallback } catch { return fallback }
}

function toAppFactory(factory: ApiFactory): AppFactory {
  const extra = parseJson(factory.notes, {
    lat: "3.1390",
    lng: "101.6869",
    prodLines: "0",
    prodVolume: "0",
    volUnit: "kg",
    activityCategories: [] as string[],
    specificActivities: [] as string[],
  })
  return {
    id: factory.id,
    name: factory.name,
    country: factory.country || "",
    city: factory.city || "",
    address: factory.address,
    lat: extra.lat,
    lng: extra.lng,
    prodLines: extra.prodLines,
    prodVolume: extra.prodVolume,
    volUnit: extra.volUnit,
    activityCategories: extra.activityCategories,
    specificActivities: extra.specificActivities,
  }
}

function toAppProduct(product: ApiProduct): AppProduct {
  const extra = parseJson(product.description, {
    catalogKey: "custom",
    emoji: "PKG",
    ingredients: product.ingredients.map((name, index) => ({ id: `${product.id}-${index}`, name })),
  })
  return {
    id: product.id,
    catalogKey: extra.catalogKey,
    emoji: extra.emoji,
    name: product.name,
    code: product.sku || "",
    factoryId: product.factoryId || "",
    ingredients: extra.ingredients,
    addedAt: product.createdAt,
  }
}

function categoriesFromCompany(company: Company | null): string[] {
  if (!company?.activityCategory) return []
  return [company.activityCategory.toLowerCase()]
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

interface HCBAccreditation {
  id: string
  body?: string
  standard?: string
  certNumber?: string
  scope?: string
  country?: string
  issueDate?: string
  expiryDate?: string
  unitPrice?: number
}

const ACCREDITATIONS_STORAGE = "hcs_hcb_accreditations"

function loadAccreditations(): HCBAccreditation[] {
  try {
    const rows = JSON.parse(localStorage.getItem(ACCREDITATIONS_STORAGE) || "[]")
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

function loadRegisteredStandards(): { id: string; standard: string; scope?: string; country?: string; unitPrice?: number }[] {
  return loadAccreditations()
    .filter(acc => !!acc.standard)
    .map(acc => ({
      id: acc.id,
      standard: acc.standard || "",
      scope: acc.scope,
      country: acc.country,
      unitPrice: Number(acc.unitPrice || 0),
    }))
}

function toRegisteredStandards(rows: HCBAccreditation[]): { id: string; standard: string; scope?: string; country?: string; unitPrice?: number }[] {
  return rows
    .filter(acc => !!acc.standard)
    .map(acc => ({
      id: String(acc.id),
      standard: acc.standard || "",
      scope: acc.scope,
      country: acc.country,
      unitPrice: Number(acc.unitPrice || 0),
    }))
}

type YNA = "yes"|"no"|"na"|""

const fmtSize = (b:number) => b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`

function ReadOnlyFactoryCard({ f, idx }: { f:AppFactory; idx:number }) {
  const lat = f.lat || "3.1390"
  const lng = f.lng || "101.6869"
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(lng)-0.08).toFixed(4)},${(parseFloat(lat)-0.06).toFixed(4)},${(parseFloat(lng)+0.08).toFixed(4)},${(parseFloat(lat)+0.06).toFixed(4)}&layer=mapnik&marker=${lat},${lng}`
  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
        <Building size={13} color={BLUE} />
        <span style={{ fontSize:"0.78rem", fontWeight:700, color:DARK }}>Factory / Plant {idx+1}</span>
      </div>
      <div style={{ display:"flex" }}>
        {/* Left: details */}
        <div style={{ flex:1, padding:"16px 18px", display:"flex", flexDirection:"column", gap:16, borderRight:"1px solid #e2e8f0" }}>
          {[
            { label:"Factory Name",   value: f.name    || "—" },
            { label:"Country",        value: f.country || "—" },
            { label:"City / Address", value: f.city    || "—" },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3 }}>{item.label}</div>
              <div style={{ fontSize:"0.83rem", fontWeight:600, color:item.value==="—"?"#cbd5e1":DARK }}>{item.value}</div>
            </div>
          ))}
          {(f.prodLines || f.prodVolume) && (
            <>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3 }}>Production Lines</div>
                <div style={{ fontSize:"0.83rem", fontWeight:600, color:DARK }}>{f.prodLines || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:600, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:3 }}>Volume / Year</div>
                <div style={{ fontSize:"0.83rem", fontWeight:600, color:DARK }}>{f.prodVolume ? `${f.prodVolume} ${f.volUnit||""}`.trim() : "—"}</div>
              </div>
            </>
          )}
        </div>
        {/* Right: map */}
        <div style={{ width:"55%", flexShrink:0 }}>
          <iframe src={mapSrc} style={{ width:"100%", height:"100%", minHeight:200, border:"none", display:"block" }} title={`Factory ${idx+1}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Module-level components (never defined inside render) ────────────────────
function DocThumb() {
  return (
    <div style={{ width:42, height:54, flexShrink:0, position:"relative" }}>
      <div style={{ position:"absolute", inset:0, background:"#dbeafe", borderRadius:4, clipPath:"polygon(0 0,calc(100% - 11px) 0,100% 11px,100% 100%,0 100%)" }}>
        <div style={{ position:"absolute", top:14, left:7, right:7, display:"flex", flexDirection:"column", gap:3 }}>
          {[1,.75,1,.6,1].map((w,i)=><div key={i} style={{ height:2, borderRadius:1, background: i<2?"#93c5fd":"#bfdbfe", width:`${w*100}%` }} />)}
        </div>
        <div style={{ position:"absolute", bottom:5, left:0, right:0, textAlign:"center" as const, fontSize:"0.45rem", fontWeight:800, color:BLUE, letterSpacing:"0.1em" }}>FILE</div>
      </div>
      <div style={{ position:"absolute", top:0, right:0, width:11, height:11, background:"#93c5fd", clipPath:"polygon(0 0,100% 0,100% 100%)" }} />
    </div>
  )
}

function YesNo({ value, onChange }: { value:YNA; onChange:(v:YNA)=>void }) {
  const opts = [
    { k:"yes" as const, label:"Yes", activeColor:"#16a34a" },
    { k:"no"  as const, label:"No",  activeColor:"#dc2626" },
    { k:"na"  as const, label:"N/A", activeColor:"#64748b" },
  ]
  return (
    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
      {opts.map((o) => {
        const sel = value === o.k
        return (
          <button key={o.k} type="button" onClick={()=>onChange(sel?"":o.k)}
            style={{ padding:"6px 18px", borderRadius:7,
              border: sel?`2px solid ${o.activeColor}`:"2px solid #e2e8f0",
              background: sel?o.activeColor:"#fff",
              color: sel?"#fff":DARK,
              cursor:"pointer", fontFamily:"inherit", fontSize:"0.82rem", fontWeight:700,
              transition:"all 0.15s" }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function QRow({ q, value, onChange, last=false }: { q:string; value:YNA; onChange:(v:YNA)=>void; last?:boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8,
      padding:"12px 0", borderBottom:last?"none":"1px solid #f1f5f9" }}>
      <span style={{ fontSize:"0.72rem", color:"#64748b", lineHeight:1.5, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{q}</span>
      <YesNo value={value} onChange={onChange} />
    </div>
  )
}

function NumInput({ label, value, onChange, unit, onUnit, units, last=false }: {
  label:string; value:string; onChange:(v:string)=>void;
  unit?:string; onUnit?:(v:string)=>void; units?:string[]; last?:boolean
}) {
  const inpSm: React.CSSProperties = { height:32, padding:"0 8px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:"0.8rem", color:DARK, outline:"none", fontFamily:"inherit", background:"#fff" }
  const foc = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor = BLUE)
  const blr = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor = "#e2e8f0")
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"9px 0", borderBottom:last?"none":"1px solid #f1f5f9", gap:20 }}>
      <span style={{ fontSize:"0.72rem", color:"#64748b", flex:1, lineHeight:1.5, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>{label}</span>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        {units && onUnit && (
          <select value={unit} onChange={e=>onUnit(e.target.value)} style={{ ...inpSm, width:78 }} onFocus={foc} onBlur={blr}>
            {units.map(u=><option key={u}>{u}</option>)}
          </select>
        )}
        <input type="number" min="0" value={value} onChange={e=>onChange(e.target.value)}
          style={{ ...inpSm, width:96, textAlign:"right" as const }} onFocus={foc} onBlur={blr} />
      </div>
    </div>
  )
}
void NumInput

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user }  = useAuthStore()
  const [submitting, setSubmitting]         = useState(false)
  const [error, setError]                   = useState("")
  const [draftSaved]                        = useState(false)
  const [showPrefillNotice, setShowPrefillNotice] = useState(true)
  const [draftId]                           = useState(() => `local_${Date.now()}`)
  const [showPermModal, setShowPermModal]   = useState(false)
  const [editPermGranted, setEditPermGranted] = useState<boolean | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [regFactories, setRegFactories] = useState<AppFactory[]>([])
  const [portfolioProducts, setPortfolioProducts] = useState<AppProduct[]>([])
  const [registeredStandards, setRegisteredStandards] = useState(loadRegisteredStandards)
  const [registrationLoading, setRegistrationLoading] = useState(true)
  void registrationLoading
  const [valPos, setValPos]                 = useState({ right: 24, bottom: 24 })
  const valDragRef = useRef<{ startX:number; startY:number; origR:number; origB:number } | null>(null)
  const onValDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    valDragRef.current = { startX: e.clientX, startY: e.clientY, origR: valPos.right, origB: valPos.bottom }
    const onMove = (me: MouseEvent) => {
      if (!valDragRef.current) return
      const dx = me.clientX - valDragRef.current.startX
      const dy = me.clientY - valDragRef.current.startY
      setValPos({ right: Math.max(0, valDragRef.current.origR - dx), bottom: Math.max(0, valDragRef.current.origB - dy) })
    }
    const onUp = () => { valDragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const sec1Ref = useRef<HTMLDivElement>(null)
  const sec2Ref = useRef<HTMLDivElement>(null)
  const sec3Ref = useRef<HTMLDivElement>(null)
  const sec4Ref = useRef<HTMLDivElement>(null)
  const sec5Ref = useRef<HTMLDivElement>(null)
  const refs = [null, sec1Ref, sec2Ref, sec3Ref, sec4Ref, sec5Ref] as const

  // Sec 1 — pre-filled read-only from registration profile
  const companyName  = company?.name || user?.organization || user?.name || ""
  const companyEmail = company?.email || user?.email || ""
  const companyPhone = company?.phone || ""
  const companyWeb   = company?.website || ""
  // Sec 2 — auto-fetched from registration
  const selectedCategories: string[] = categoriesFromCompany(company)
  const selectedActivities: string[] = company?.specificActivities ? (() => { try { return JSON.parse(company.specificActivities) } catch { return [] } })() : []
  const regDescription: string = company?.description || ""
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const nextCompany = await getMyCompany()
        const [factoryPage, productPage] = await Promise.all([
          getFactories(nextCompany.id, 0, 200),
          getProducts(nextCompany.id, 0, 500),
        ])
        if (!alive) return
        setCompany(nextCompany)
        setRegFactories(factoryPage.content.map(toAppFactory))
        setPortfolioProducts(productPage.content.map(toAppProduct))
      } catch {
        if (alive) setError("Registration records could not be loaded from the database.")
      } finally {
        if (alive) setRegistrationLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])
  useEffect(() => {
    let alive = true
    getAccreditationScopes()
      .then(rows => {
        if (!alive) return
        if (rows.length === 0) {
          setRegisteredStandards(loadRegisteredStandards())
          return
        }
        const next = toRegisteredStandards(rows.map(row => ({ ...row, id: String(row.id), unitPrice: Number(row.unitPrice || 0) })))
        setRegisteredStandards(next)
        localStorage.setItem(ACCREDITATIONS_STORAGE, JSON.stringify(rows.map(row => ({ ...row, id: String(row.id), unitPrice: Number(row.unitPrice || 0) }))))
      })
      .catch(() => {
        if (alive) setRegisteredStandards(loadRegisteredStandards())
      })
    return () => { alive = false }
  }, [])
  // Sec 3 — target market: countries from HCB accreditation records
  const accreditedMarkets: string[] = Array.from(
    new Set(registeredStandards.map(acc => acc.country).filter((country): country is string => !!country))
  )
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const toggleMarket = (m: string) => {
    setSelectedMarkets(prev => {
      const next = prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
      return next
    })
  }
  // Sec 4 — factories from registration
  const requestedFactoryId = searchParams.get("factoryId") || ""
  const requestedFactory = regFactories.find(f => f.id === requestedFactoryId)
  const applicationFactories = requestedFactory ? [requestedFactory] : regFactories
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [showProductPicker, setShowProductPicker] = useState(false)
  const applicationProducts = portfolioProducts.filter(p => selectedProductIds.includes(p.id))
  const refreshProducts = () => {
    if (!company) return
    getProducts(company.id, 0, 500)
      .then(page => setPortfolioProducts(page.content.map(toAppProduct)))
      .catch(() => setError("Products could not be refreshed from the database."))
  }
  useEffect(() => {
    if (portfolioProducts.length === 0) return
    const initial = requestedFactoryId
      ? portfolioProducts.filter(p => p.factoryId === requestedFactoryId)
      : portfolioProducts
    setSelectedProductIds(initial.map(p => p.id))
  }, [portfolioProducts, requestedFactoryId])
  const effectiveCategories = requestedFactory?.activityCategories?.length
    ? requestedFactory.activityCategories
    : selectedCategories
  const effectiveActivities = requestedFactory?.specificActivities?.length
    ? requestedFactory.specificActivities
    : selectedActivities

  // Sec 3
  const [selectedCertCats,  setSelectedCertCats]  = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const toggleCertCat  = (v:string) => setSelectedCertCats(p  => p.includes(v) ? p.filter(x=>x!==v) : [...p,v])
  const toggleStandard = (v:string) => setSelectedStandards(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v])
  const [currCert,    setCurrCert]    = useState<YNA>("")

  // Halal certificate history
  interface HalalCertEntry { id: string; body: string; certNumber: string; issueDate: string; expiryDate: string }
  const [halalCerts, setHalalCerts] = useState<HalalCertEntry[]>([])
  const [halalCertForm, setHalalCertForm] = useState({ body: "", certNumber: "", issueDate: "", expiryDate: "" })
  const addHalalCert = () => {
    if (!halalCertForm.body) return
    setHalalCerts(prev => [...prev, { ...halalCertForm, id: Date.now().toString() }])
    setHalalCertForm({ body: "", certNumber: "", issueDate: "", expiryDate: "" })
  }

  // Training & certificates
  interface TrainingEntry { id: string; title: string; provider: string; date: string }
  const [trainingRecs, setTrainingRecs] = useState<TrainingEntry[]>([])
  const [trainingForm, setTrainingForm] = useState({ title: "", provider: "", date: "" })
  const addTraining = () => {
    if (!trainingForm.title) return
    setTrainingRecs(prev => [...prev, { ...trainingForm, id: Date.now().toString() }])
    setTrainingForm({ title: "", provider: "", date: "" })
  }
  const [trainingZip, setTrainingZip] = useState<File | null>(null)
  const [trainingQ, setTrainingQ] = useState<YNA>("")

  // Sec 4
  const [totProducts,   setTotProducts]   = useState(applicationProducts.length.toString())
  const [prodLines,     setProdLines]     = useState(requestedFactory?.prodLines || "0")
  const [prodVolume,    setProdVolume]    = useState(requestedFactory?.prodVolume || "0")
  const [volUnit,       setVolUnit]       = useState(requestedFactory?.volUnit || "kg")
  const [employees,     setEmployees]     = useState("0")
  const [facilities,    setFacilities]    = useState(applicationFactories.length.toString())
  void totProducts; void setTotProducts; void prodLines; void setProdLines; void prodVolume; void setProdVolume
  void volUnit; void setVolUnit; void employees; void setEmployees; void facilities; void setFacilities
  const [outsource,     setOutsource]     = useState<YNA>("")
  const [privateLab,    setPrivateLab]    = useState<YNA>("")
  const [porkProd,      setPorkProd]      = useState<YNA>("")
  const [porkStore,     setPorkStore]     = useState<YNA>("")
  const [freeFromMeat,  setFreeFromMeat]  = useState<YNA>("")
  const [freeFromDeriv, setFreeFromDeriv] = useState<YNA>("")
  const [vegCert,       setVegCert]       = useState<YNA>("")
  const [fsmCert,       setFsmCert]       = useState<YNA>("")
  const [alcoholProd,   setAlcoholProd]   = useState<YNA>("")
  const [alcoholItem,   setAlcoholItem]   = useState<YNA>("")
  const [dedicDays,     setDedicDays]     = useState<YNA>("")
  const [dedicEquip,    setDedicEquip]    = useState<YNA>("")
  const [dedicStore,    setDedicStore]    = useState<YNA>("")
  const [floorPlan,     setFloorPlan]     = useState<File|null>(null)
  const [floorPlanData, setFloorPlanData] = useState<string>("")
  const [floorPlanName, setFloorPlanName] = useState<string>("")
  const [showFloorPreview, setShowFloorPreview] = useState(false)
  const floorPlanUrl = useMemo(() => floorPlan ? URL.createObjectURL(floorPlan) : null, [floorPlan])
  const handleFloorPlan = (f: File | null) => {
    setFloorPlan(f)
    if (f) {
      setFloorPlanName(f.name)
      const reader = new FileReader()
      reader.onload = e => setFloorPlanData(e.target?.result as string ?? "")
      reader.readAsDataURL(f)
    } else {
      setFloorPlanData("")
      setFloorPlanName("")
    }
  }

  // Sec 5
  const [remarks,  setRemarks]  = useState("")
  const [agreed1,  setAgreed1]  = useState(false)
  const [agreed2,  setAgreed2]  = useState(false)
  const [agreed3,  setAgreed3]  = useState(false)

  const scrollTo = (n:number) => refs[n]?.current?.scrollIntoView({ behavior:"smooth", block:"start" })

  const sectionComplete: Record<number, boolean> = {
    1: !!(companyName || companyEmail),
    2: effectiveCategories.length > 0,
    3: selectedMarkets.length > 0 && selectedCertCats.length > 0 && currCert !== "" && trainingQ !== "",
    4: outsource !== "" && porkProd !== "" && porkStore !== "" && floorPlan !== null,
    5: applicationProducts.length > 0 && agreed1 && agreed2 && agreed3,
  }

  const buildPayload = (status: "DRAFT" | "SUBMITTED") => {
    const regDocs = company ? {
      licenseNo: company.licenseNo,
      licenseExpiry: company.licenseExpiry,
      issuingAuth: company.issuingAuthority,
      licenseFileName: company.licenseFileName,
      licenseFileSize: company.licenseFileSize,
      licenseFileData: company.licenseFileData,
      vatNo: company.vatNo,
      sstNo: company.sstNo,
      vatFileName: company.vatFileName,
      vatFileSize: company.vatFileSize,
      vatFileData: company.vatFileData,
    } : {}
    const profile = company ? {
      companyName: company.name,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address1: company.address,
      city: company.city,
      state: company.state,
      postcode: company.postcode,
      country: company.country,
      contactName: company.contactName,
      designation: company.contactDesignation,
      companyType: company.businessType,
      companyReg: company.registrationNumber,
    } : {}
    return {
      id: draftId,
      status,
      savedAt: new Date().toISOString(),
      companyName, companyEmail, companyPhone, companyWeb,
      factoryId: requestedFactory?.id,
      factoryName: requestedFactory?.name,
      selectedMarkets,
      selectedCertCats, selectedStandards,
      currCert, halalCerts,
      trainingQ, trainingRecs,
      outsource, privateLab, porkProd, porkStore, freeFromMeat,
      freeFromDeriv, vegCert, fsmCert, alcoholProd, alcoholItem,
      dedicDays, dedicEquip, dedicStore,
      floorPlanData, floorPlanName,
      productIds: applicationProducts.map(p => p.id),
      products: applicationProducts,
      remarks,
      companyId: company?.id,
      snapshotProfile:     profile,
      snapshotRegDocs:     regDocs,
      snapshotCategories:  selectedCategories,
      snapshotActivities:  selectedActivities,
      snapshotDescription: regDescription,
      snapshotFactories:   applicationFactories,
    }
  }

  const saveDraft = () => {
    if (editPermGranted === null) { setShowPermModal(true); return }
    doSaveDraft(editPermGranted)
  }

  const doSaveDraft = (perm: boolean) => {
    setEditPermGranted(perm)
    setShowPermModal(false)
    setError("Draft was not saved. Application drafts must be saved in the database; please submit when the backend is available.")
  }

  const validationFields = [
    { id:"markets",      label:"Target Market",               ok: selectedMarkets.length > 0 },
    { id:"currCert",     label:"Halal Certification Status",  ok: currCert !== "" },
    { id:"trainingQ",    label:"Conducted Training",          ok: trainingQ !== "" },
    { id:"outsource",    label:"Outsourcing Activities",      ok: outsource !== "" },
    { id:"privateLab",   label:"Private Labeling",            ok: privateLab !== "" },
    { id:"porkProd",     label:"Pork (Production)",           ok: porkProd !== "" },
    { id:"porkStore",    label:"Pork (Storage)",              ok: porkStore !== "" },
    { id:"freeFromMeat", label:"Animal Meat Free",            ok: freeFromMeat !== "" },
    { id:"freeDeriv",    label:"Animal Derivatives Free",     ok: freeFromDeriv !== "" },
    { id:"vegCert",      label:"Vegetarian Certificate",      ok: vegCert !== "" },
    { id:"fsmCert",      label:"Food Safety Certificate",     ok: fsmCert !== "" },
    { id:"alcoholProd",  label:"Alcohol in Production",       ok: alcoholProd !== "" },
    { id:"alcoholItem",  label:"Alcohol in Products",         ok: alcoholItem !== "" },
    { id:"dedicDays",    label:"Dedicated Halal Days",        ok: dedicDays !== "" },
    { id:"dedicEquip",   label:"Dedicated Halal Equipment",   ok: dedicEquip !== "" },
    { id:"dedicStore",   label:"Dedicated Halal Storage",     ok: dedicStore !== "" },
    { id:"floorPlan",    label:"Facility Floor Plan",         ok: floorPlan !== null },
    { id:"products",     label:"Products for Certification",  ok: applicationProducts.length > 0 },
    { id:"decl1",        label:"Declaration 1",               ok: agreed1 },
    { id:"decl2",        label:"Declaration 2",               ok: agreed2 },
    { id:"decl3",        label:"Declaration 3",               ok: agreed3 },
  ]
  const incompleteFields = validationFields.filter(f => !f.ok)
  const allComplete      = incompleteFields.length === 0

  function buildBilling(applicationId: string, applicationNumber: string) {
    const pricing = loadPricing()
    const accs = registeredStandards
    const appFeeRows = selectedStandards.length > 0
      ? accs.filter(a => a.standard && selectedStandards.includes(a.standard))
      : []
    const lineItems = [
      ...appFeeRows.map(a => ({
        description: `Application Fee — ${a.standard}`,
        quantity: 1,
        unitPrice: a.unitPrice ?? 0,
        total: a.unitPrice ?? 0,
      })),
      { description: "Audit Fee", quantity: 1, unitPrice: pricing.auditDayCost, total: pricing.auditDayCost },
    ]
    const subtotal  = lineItems.reduce((s, l) => s + l.total, 0)
    const vatAmount = subtotal * pricing.vatPct / 100
    saveApplicationBilling({
      applicationId,
      applicationNumber,
      companyName: companyName || '—',
      lineItems,
      subtotal,
      vatPct: pricing.vatPct,
      vatAmount,
      total: subtotal + vatAmount,
      currency: pricing.currency,
      savedAt: new Date().toISOString(),
    })
  }
  void buildBilling

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowValidation(true)
    if (!allComplete) return
    setError(""); setSubmitting(true)
    try {
      const res = await apiClient.post("/applications", buildPayload("SUBMITTED"))
      addAuditLog({
        applicationId: String(res.data.id),
        applicationNumber: res.data.applicationNumber || String(res.data.id),
        companyName: companyName || '—',
        actor: user?.name || 'Customer',
        role: 'Customer',
        action: 'Application Submitted',
        details: 'New halal certification application submitted via portal',
        oldStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        category: 'APPLICATION',
      })
      addNotification('office', {
        type: 'info',
        title: 'New Application Submitted',
        body: `A new halal certification application has been submitted and is awaiting review.`,
      })
      navigate(`/customer/applications/${res.data.id}`)
    } catch {
      setError("Application was not submitted. The backend is unavailable or rejected the request, and local fallback is disabled.")
      setSubmitting(false)
    }
    setSubmitting(false)
  }

  const inp: React.CSSProperties = {
    width:"100%", height:38, padding:"0 11px",
    border:"1px solid #e2e8f0", borderRadius:7, fontSize:"0.8125rem",
    color:DARK, outline:"none", boxSizing:"border-box" as const, fontFamily:"inherit", background:"#fff",
  }
const lbl: React.CSSProperties    = { display:"block", fontSize:"0.7rem", fontWeight:600, color:"#64748b", marginBottom:"0.3rem", textTransform:"uppercase" as const, letterSpacing:"0.06em" }
  const secHead: React.CSSProperties = {
    fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const,
    color:BLUE, marginBottom:20, paddingBottom:12, borderBottom:"1px solid #dbeafe",
  }
  const card: React.CSSProperties = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"22px 24px", marginBottom:14 }

  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.target.style.borderColor = BLUE)
  const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.target.style.borderColor = "#e2e8f0")

  const FileCard = ({ file, onRemove }: { file:File; onRemove:()=>void }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:"1px solid #bfdbfe", borderRadius:8, background:"#eff6ff" }}>
      <DocThumb />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"0.8125rem", fontWeight:600, color:DARK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{file.name}</div>
        <div style={{ fontSize:"0.6875rem", color:"#64748b", marginTop:2 }}>{fmtSize(file.size)} · Document</div>
      </div>
      <button type="button" onClick={onRemove}
        style={{ width:26, height:26, borderRadius:"50%", border:"1px solid #bfdbfe", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <X size={13} color="#64748b" />
      </button>
    </div>
  )
  void FileCard

  const UploadBox = ({ onChange, accept=".pdf,.jpg,.jpeg,.png", icon }: { onChange:(f:File|null)=>void; accept?:string; icon:React.ReactNode }) => (
    <div style={{ border:"1px dashed #cbd5e1", borderRadius:7, padding:"11px 14px", background:"#fafbfc", display:"flex", alignItems:"center", gap:10 }}>
      {icon}
      <span style={{ fontSize:"0.8rem", color:"#9ca3af", flex:1 }}>No file chosen</span>
      <label style={{ padding:"5px 14px", borderRadius:6, background:BLUE, color:"#fff", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" as const, flexShrink:0 }}>
        Choose File
        <input type="file" accept={accept} onChange={e=>onChange(e.target.files?.[0]??null)} style={{ display:"none" }} />
      </label>
    </div>
  )

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:"#f1f5f9" }}>

      {/* Nav */}
      <nav style={{ background:NAV, height:56, padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
          <div style={{ width:34, height:34, background:"rgba(255,255,255,0.18)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:800, color:"#fff" }}>HC</div>
          <div>
            <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#fff" }}>HalalCMS</div>
            <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.4)" }}>Certification Application</div>
          </div>
        </div>
        <button type="button" onClick={saveDraft}
          style={{ padding:"6px 14px", borderRadius:7, background: draftSaved?"rgba(34,197,94,0.25)":"rgba(255,255,255,0.12)", border:`1px solid ${draftSaved?"rgba(34,197,94,0.6)":"rgba(255,255,255,0.2)"}`, color:"#fff", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:"inherit", transition:"all 0.2s" }}>
          {draftSaved ? "✓ Draft Saved" : "Save Draft"}
        </button>
      </nav>

      {/* Sub-header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0.6rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button type="button" onClick={()=>navigate("/customer/applications")}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, background:"transparent", border:"1px solid #e2e8f0", cursor:"pointer", fontSize:"0.75rem", fontWeight:500, color:"#374151", fontFamily:"inherit" }}>
            ← Back
          </button>
          <div style={{ width:1, height:16, background:"#e2e8f0" }} />
          <div>
            <div style={{ fontSize:"0.875rem", fontWeight:700, color:DARK }}>New Application</div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:1 }}>
              <span style={{ fontSize:"0.65rem", color:"#9ca3af" }}>Customer Portal</span>
              <ChevronRight size={10} color="#d1d5db" />
              <span style={{ fontSize:"0.65rem", color:"#6b7280" }}>Certification Application</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize:"0.75rem", color:"#9ca3af" }}>
          {new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden", background:"#f1f5f9" }}>

        {/* ── Left sidebar ── */}
        <aside style={{ width:228, flexShrink:0, marginLeft:28, marginTop:20, borderRadius:"12px 0 0 0", borderRight:"1px solid #e2e8f0", background:"#fff", overflowY:"auto", position:"sticky", top:97, height:"calc(100vh - 117px)" }}>

          <div style={{ padding:"16px 14px 14px", borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:NAV, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:800, color:"#fff", flexShrink:0 }}>
                {companyName ? companyName.slice(0,2).toUpperCase() : user?.name?.slice(0,2).toUpperCase() ?? "HC"}
              </div>
              <div>
                <div style={{ fontSize:"0.8125rem", fontWeight:700, color:DARK }}>{companyName || "New Application"}</div>
                <div style={{ fontSize:"0.65rem", color:"#94a3b8" }}>Halal Certification</div>
              </div>
            </div>
          </div>

          <div style={{ padding:"12px 12px 8px" }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" as const, padding:"0 4px", marginBottom:6 }}>SECTIONS</div>
            {SECTIONS.map(s => {
              const done = sectionComplete[s.num]
              return (
                <button key={s.num} type="button" onClick={()=>scrollTo(s.num)}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 8px", borderRadius:7, background:"transparent", border:"none", cursor:"pointer", textAlign:"left" as const, fontFamily:"inherit", marginBottom:1 }}
                  onMouseOver={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseOut={e=>(e.currentTarget.style.background="transparent")}
                >
                  <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, transition:"all 0.2s",
                    background: done ? "#dcfce7" : "#eff6ff",
                    border: done ? "1.5px solid #86efac" : "1px solid #bfdbfe",
                    color: done ? GREEN : BLUE,
                  }}>
                    {done ? <CheckCircle2 size={13} color={GREEN} strokeWidth={2.5}/> : s.num}
                  </div>
                  <span style={{ fontSize:"0.8rem", color: done ? GREEN : DARK, fontWeight: done ? 600 : 500 }}>{s.label}</span>
                </button>
              )
            })}
          </div>

          <div style={{ padding:"12px 14px", borderTop:"1px solid #f1f5f9", marginTop:4 }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" as const, marginBottom:10 }}>WHAT HAPPENS NEXT</div>
            {[
              { n:1, t:"Application Reviewed",  s:"Our team reviews your submission within 2 business days." },
              { n:2, t:"Audit Scheduled",        s:"An auditor will contact you to schedule a site visit."    },
              { n:3, t:"Certificate Issued",     s:"Upon passing the audit, your certificate is issued."      },
            ].map(i=>(
              <div key={i.n} style={{ display:"flex", gap:10, marginBottom:14 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:BLUE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, color:"#fff", flexShrink:0 }}>{i.n}</div>
                <div>
                  <div style={{ fontSize:"0.75rem", fontWeight:600, color:DARK }}>{i.t}</div>
                  <div style={{ fontSize:"0.65rem", color:"#94a3b8", marginTop:2, lineHeight:1.5 }}>{i.s}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin:"8px 12px 12px", padding:"10px 12px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
            <p style={{ fontSize:"0.65rem", color:"#6b7280", margin:0, lineHeight:1.6 }}>
              Your progress is saved automatically. You can return to complete this application at any time.
            </p>
          </div>
        </aside>

        {/* ── Main form ── */}
        <main style={{ flex:1, padding:"18px 22px", overflowY:"auto", maxHeight:"calc(100vh - 97px)", maxWidth:1200 }}>
          <form onSubmit={handleSubmit} noValidate autoComplete="off">

            {error && (
              <div style={{ marginBottom:12, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, fontSize:"0.8125rem", color:RED, display:"flex", gap:8, alignItems:"center" }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} />{error}
                <button type="button" onClick={()=>setError("")} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", padding:0, display:"flex" }}><X size={14}/></button>
              </div>
            )}

            {/* ─ 1. Company Information ─ */}
            <div ref={sec1Ref} style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
                <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:BLUE }}>COMPANY INFORMATION</p>
                <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From your registration profile</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:0, background:"#fff", borderRadius:8, overflow:"hidden" }}>
                {[
                  { Icon:Building2, label:"Company Name", value:companyName  || "—" },
                  { Icon:Mail,      label:"Email",        value:companyEmail || "—" },
                  { Icon:Phone,     label:"Phone",        value:companyPhone || "—" },
                  { Icon:Globe,     label:"Website",      value:companyWeb   || "—" },
                ].map(f => (
                  <div key={f.label} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"15px 18px",
                    borderRight:"none", borderBottom:"none" }}>
                    <div style={{ width:18, height:18, flexShrink:0, marginTop:2,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <f.Icon size={14} color="#64748b" strokeWidth={1.9} />
                    </div>
                    <div>
                      <div style={{ fontSize:"0.64rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em", marginBottom:5 }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize:"0.875rem", fontWeight:600, color: f.value==="—"?"#cbd5e1":DARK }}>
                        {f.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ 2. Services & Activities ─ */}
            <div ref={sec2Ref} style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
                <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:BLUE }}>SERVICES & ACTIVITIES</p>
                <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>Categories from your registration</span>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Activity Category</label>
                {effectiveCategories.length > 0 ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                    {effectiveCategories.map(key => {
                      const cat = CATEGORIES.find(c => c.key === key)
                      if (!cat) return null
                      return (
                        <div key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px",
                          borderRadius:8, background:"#eff6ff", border:"1.5px solid #bfdbfe" }}>
                          <cat.Icon size={14} color={BLUE} strokeWidth={1.75} />
                          <span style={{ fontSize:"0.8rem", fontWeight:600, color:BLUE }}>{cat.label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop:8, padding:"12px 14px", borderRadius:8, background:"#f8fafc", border:"1px dashed #e2e8f0" }}>
                    <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8" }}>No activity categories found. Please complete your registration profile.</p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Specific Activities</label>
                {effectiveActivities.length > 0 ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:8 }}>
                    {effectiveActivities.map(key => {
                      const act = ACTIVITIES.find(a => a.key === key)
                      if (!act) return null
                      return (
                        <div key={key} style={{ padding:"6px 13px", borderRadius:999, display:"flex", alignItems:"center", gap:5,
                          border:"1.5px solid #bfdbfe", background:"#eff6ff" }}>
                          <span style={{ fontSize:"0.85rem" }}>{act.emoji}</span>
                          <span style={{ fontSize:"0.78rem", fontWeight:600, color:BLUE }}>{act.label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop:8, padding:"12px 14px", borderRadius:8, background:"#f8fafc", border:"1px dashed #e2e8f0" }}>
                    <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8" }}>No specific activities selected. Please complete your registration profile.</p>
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Company Description</label>
                {regDescription ? (
                  <div style={{ marginTop:6, padding:"12px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:"0.83rem", color:DARK, lineHeight:1.7 }}>
                    {regDescription}
                  </div>
                ) : (
                  <div style={{ marginTop:6, padding:"12px 14px", borderRadius:8, background:"#f8fafc", border:"1px dashed #e2e8f0" }}>
                    <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8" }}>No description provided. Complete your registration profile.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ─ 3. Certification Preferences ─ */}
            <div ref={sec3Ref} style={card}>
              <p style={secHead}>CERTIFICATION PREFERENCES</p>

              {/* ── Target Market ── */}
              {(() => {
                const COUNTRY_ISO: Record<string, string> = {
                  "Malaysia":"my","Indonesia":"id","United Arab Emirates":"ae","Saudi Arabia":"sa",
                  "Qatar":"qa","Kuwait":"kw","Bahrain":"bh","Oman":"om","Jordan":"jo","Egypt":"eg",
                  "Turkey":"tr","Pakistan":"pk","Bangladesh":"bd","India":"in","Singapore":"sg",
                  "Brunei":"bn","Philippines":"ph","United Kingdom":"gb","Germany":"de","France":"fr",
                  "Netherlands":"nl","Belgium":"be","Switzerland":"ch","United States":"us",
                  "Canada":"ca","Australia":"au","South Africa":"za","Morocco":"ma","Nigeria":"ng",
                  "GCC":"sa","Others":"un",
                }
                return (
                  <div style={{ marginBottom:22 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <label style={{ ...lbl, marginBottom:0 }}>Target Market</label>
                      {selectedMarkets.length > 0 && (
                        <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>
                          {selectedMarkets.length} selected
                        </span>
                      )}
                    </div>
                    {accreditedMarkets.length === 0 ? (
                      <div style={{ padding:"14px 16px", borderRadius:10, background:"#f8fafc", border:"1px dashed #e2e8f0", fontSize:"0.78rem", color:"#94a3b8", textAlign:"center" as const }}>
                        No accredited markets configured by the office yet.
                      </div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:8 }}>
                        {accreditedMarkets.map((m: string) => {
                          const sel = selectedMarkets.includes(m)
                          const iso = COUNTRY_ISO[m] || "un"
                          return (
                            <button key={m} type="button" onClick={() => toggleMarket(m)}
                              style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:7, padding:"12px 8px", borderRadius:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s",
                                border: sel ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                                background: sel ? "#eff6ff" : "#fff",
                                boxShadow: sel ? "0 0 0 3px rgba(37,99,235,0.1)" : "0 1px 4px rgba(0,0,0,0.05)",
                              }}>
                              <img src={`https://flagcdn.com/w40/${iso}.png`} alt={m}
                                style={{ width:36, height:24, objectFit:"cover", borderRadius:5, border:"1px solid #e2e8f0", flexShrink:0 }} />
                              <span style={{ fontSize:"0.72rem", fontWeight:600, color: sel ? "#1d4ed8" : "#374151", textAlign:"center" as const, lineHeight:1.3 }}>{m}</span>
                              {sel && (
                                <span style={{ width:16, height:16, borderRadius:"50%", background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  <CheckCircle2 size={10} color="#fff" />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>

            {/* ─ 3b. Certification Category ─ */}
            <div style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
                <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>CERTIFICATION CATEGORY</p>
                {selectedCertCats.length > 0 && (
                  <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>
                    {selectedCertCats.length} selected
                  </span>
                )}
              </div>
              <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", background:"#fff" }}>
                {CERT_CATEGORIES.map((cat, i) => {
                  const sel = selectedCertCats.includes(cat)
                  return (
                    <div key={cat} onClick={() => toggleCertCat(cat)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", borderBottom: i < CERT_CATEGORIES.length-1 ? "1px solid #f1f5f9" : "none", background: sel ? "#eff6ff" : "transparent", transition:"background 0.1s", userSelect:"none" as const }}
                      onMouseOver={e => { if (!sel) e.currentTarget.style.background = "#f8fafc" }}
                      onMouseOut={e  => { e.currentTarget.style.background = sel ? "#eff6ff" : "transparent" }}>
                      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, border: sel ? `2px solid ${BLUE}` : "1.5px solid #d1d5db", background: sel ? BLUE : "#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize:"0.82rem", color: sel ? BLUE : DARK, fontWeight: sel ? 600 : 400 }}>{cat}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ─ 3c. Halal Standards ─ */}
            <div style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:"1px solid #dbeafe" }}>
                <p style={{ margin:0, ...secHead, marginBottom:0, paddingBottom:0, borderBottom:"none" }}>HALAL STANDARDS</p>
                {selectedStandards.length > 0 && (
                  <span style={{ fontSize:"0.72rem", fontWeight:600, color:BLUE, background:"#eff6ff", padding:"2px 10px", borderRadius:20 }}>
                    {selectedStandards.length} selected
                  </span>
                )}
              </div>
              {(() => {
                if (registeredStandards.length === 0) {
                  return (
                    <div style={{ padding:"24px 16px", textAlign:"center" as const, color:"#94a3b8", fontSize:"0.8rem", border:"1px solid #e2e8f0", borderRadius:8, background:"#f8fafc" }}>
                      No Halal standards configured yet. Ask your certification officer to add them in Settings.
                    </div>
                  )
                }
                return (
                  <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", background:"#fff" }}>
                    {registeredStandards.map((acc, i) => {
                      const sel = selectedStandards.includes(acc.standard)
                      return (
                        <div key={acc.id} onClick={() => toggleStandard(acc.standard)}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", borderBottom: i < registeredStandards.length - 1 ? "1px solid #f1f5f9" : "none", background: sel ? "#eff6ff" : "transparent", transition:"background 0.1s", userSelect:"none" as const }}
                          onMouseOver={e => { if (!sel) e.currentTarget.style.background = "#f8fafc" }}
                          onMouseOut={e  => { e.currentTarget.style.background = sel ? "#eff6ff" : "transparent" }}>
                          <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, border: sel ? `2px solid ${BLUE}` : "1.5px solid #d1d5db", background: sel ? BLUE : "#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize:"0.82rem", color: sel ? BLUE : DARK, fontWeight: sel ? 600 : 400, flex:1 }}>{acc.standard}</span>
                          {acc.unitPrice != null && acc.unitPrice > 0 && (
                            <span style={{ fontSize:"0.7rem", fontWeight:600, color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:6, flexShrink:0 }}>
                              {loadPricing().currency} {acc.unitPrice.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* ─ 3d. Certification Status ─ */}
            <div style={card}>
              <p style={secHead}>CERTIFICATION STATUS</p>
              <div style={{ marginBottom: currCert === "yes" ? 16 : 0 }}>
                <QRow q="Is your company currently Halal Certified?" value={currCert} onChange={setCurrCert} last={currCert !== "yes"} />
              </div>

              {currCert === "yes" && (
                <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <label style={{ ...lbl, marginBottom:0 }}>Current Halal Certificate &amp; History</label>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e9ecef", marginBottom:10 }}>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Certifying Body</p>
                      <input value={halalCertForm.body} onChange={e => setHalalCertForm(f => ({ ...f, body: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Certificate Number</p>
                      <input value={halalCertForm.certNumber} onChange={e => setHalalCertForm(f => ({ ...f, certNumber: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Issue Date</p>
                      <input type="date" value={halalCertForm.issueDate} onChange={e => setHalalCertForm(f => ({ ...f, issueDate: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Expiry Date</p>
                      <input type="date" value={halalCertForm.expiryDate} onChange={e => setHalalCertForm(f => ({ ...f, expiryDate: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <button type="button" onClick={addHalalCert} disabled={!halalCertForm.body}
                        style={{ padding:"7px 16px", background: halalCertForm.body ? BLUE : "#94a3b8", color:"#fff", border:"none", borderRadius:7, fontSize:"0.8rem", fontWeight:600, cursor: halalCertForm.body ? "pointer" : "not-allowed", fontFamily:"inherit" }}>
                        + Add Certificate
                      </button>
                    </div>
                  </div>
                  {halalCerts.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column" as const, gap:6 }}>
                      {halalCerts.map(c => (
                        <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:"#fff", borderRadius:8, border:"1px solid #e2e8f0" }}>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:"0.82rem", fontWeight:700, color:DARK }}>{c.body}</p>
                            <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#64748b" }}>{c.certNumber && `No. ${c.certNumber} · `}{c.issueDate && `Issued ${c.issueDate}`}{c.expiryDate && ` · Expires ${c.expiryDate}`}</p>
                          </div>
                          <button type="button" onClick={() => setHalalCerts(prev => prev.filter(x => x.id !== c.id))}
                            style={{ width:24, height:24, borderRadius:6, background:"#fee2e2", border:"none", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─ 3b. Conducted Training ─ */}
            <div ref={undefined} style={card}>
              <p style={secHead}>CONDUCTED TRAINING</p>

              <div style={{ marginBottom: 16 }}>
                <QRow q="Has the company conducted training on Halal certification requirements or Halal Standards?" value={trainingQ} onChange={setTrainingQ} last />
              </div>

              {trainingQ === "yes" && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px 12px", padding:"12px 14px", background:"#f8fafc", borderRadius:9, border:"1px solid #e9ecef", marginBottom:12 }}>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Training Title</p>
                      <input value={trainingForm.title} onChange={e => setTrainingForm(f => ({ ...f, title: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Training Provider</p>
                      <input value={trainingForm.provider} onChange={e => setTrainingForm(f => ({ ...f, provider: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:3 }}>Date</p>
                      <input type="date" value={trainingForm.date} onChange={e => setTrainingForm(f => ({ ...f, date: e.target.value }))}
                        style={{ ...inp, fontSize:"0.8rem" }} onFocus={focus} onBlur={blur} />
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-end" }}>
                      <button type="button" onClick={addTraining} disabled={!trainingForm.title}
                        style={{ padding:"7px 16px", background: trainingForm.title ? BLUE : "#94a3b8", color:"#fff", border:"none", borderRadius:7, fontSize:"0.8rem", fontWeight:600, cursor: trainingForm.title ? "pointer" : "not-allowed", fontFamily:"inherit", whiteSpace:"nowrap" as const }}>
                        + Add Training
                      </button>
                    </div>
                  </div>

                  {trainingRecs.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column" as const, gap:6, marginBottom:16 }}>
                      {trainingRecs.map(t => (
                        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:"#fff", borderRadius:8, border:"1px solid #e2e8f0" }}>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:"0.82rem", fontWeight:700, color:"#111827" }}>{t.title}</p>
                            <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#64748b" }}>{t.provider && `${t.provider}`}{t.date && ` · ${t.date}`}</p>
                          </div>
                          <button type="button" onClick={() => setTrainingRecs(prev => prev.filter(x => x.id !== t.id))}
                            style={{ width:24, height:24, borderRadius:6, background:"#fee2e2", border:"none", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label style={lbl}>Upload All Training Certificates (ZIP)</label>
                    <div style={{ marginTop:6, padding:"14px 16px", borderRadius:9, border:"2px dashed #bfdbfe", background:"#f0f7ff", display:"flex", alignItems:"center", gap:12 }}>
                      <input type="file" accept=".zip,.rar" id="training-zip" style={{ display:"none" }}
                        onChange={e => setTrainingZip(e.target.files?.[0] || null)} />
                      <label htmlFor="training-zip"
                        style={{ padding:"7px 14px", background:BLUE, color:"#fff", borderRadius:7, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                        Choose File
                      </label>
                      {trainingZip
                        ? <span style={{ fontSize:"0.8rem", color:"#111827", fontWeight:600 }}>{trainingZip.name}</span>
                        : <span style={{ fontSize:"0.78rem", color:"#94a3b8" }}>No file selected — ZIP or RAR accepted</span>
                      }
                      {trainingZip && (
                        <button type="button" onClick={() => setTrainingZip(null)}
                          style={{ marginLeft:"auto", width:24, height:24, borderRadius:6, background:"#fee2e2", border:"none", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ─ 4. Production Data ─ */}
            <div ref={sec4Ref} style={card}>
              <p style={secHead}>PRODUCTION DATA</p>

              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #f1f5f9" }}>
                  <label style={{ ...lbl, marginBottom:0 }}>Production Facilities</label>
                  <span style={{ fontSize:"0.68rem", color:"#94a3b8", fontStyle:"italic" }}>From your registration profile</span>
                </div>
                {applicationFactories.length > 0 ? (
                  applicationFactories.map((f, i) => <ReadOnlyFactoryCard key={f.id} f={f} idx={i} />)
                ) : (
                  <div style={{ padding:"20px 14px", borderRadius:8, background:"#f8fafc", border:"1px dashed #e2e8f0", textAlign:"center" as const }}>
                    <Building size={24} color="#cbd5e1" style={{ marginBottom:8 }} />
                    <p style={{ margin:0, fontSize:"0.8rem", color:"#94a3b8" }}>No facilities registered. Add production facilities in your registration profile.</p>
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Facility Floor Plan <span style={{ fontWeight:400, color:"#94a3b8", fontSize:"0.62rem" }}>— PDF / Image / DWG</span></label>
                {floorPlan ? (
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:"1px solid #bfdbfe", borderRadius:8, background:"#eff6ff" }}>
                    <DocThumb />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.8125rem", fontWeight:600, color:DARK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{floorPlan.name}</div>
                      <div style={{ fontSize:"0.6875rem", color:"#64748b", marginTop:2 }}>{fmtSize(floorPlan.size)} · Floor Plan</div>
                    </div>
                    {(floorPlan.type.startsWith("image/") || floorPlan.type === "application/pdf") && (
                      <button type="button" onClick={()=>setShowFloorPreview(true)}
                        style={{ padding:"5px 13px", borderRadius:6, border:"1px solid #bfdbfe", background:"#fff", color:BLUE, fontSize:"0.75rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                        Preview
                      </button>
                    )}
                    <button type="button" onClick={()=>handleFloorPlan(null)}
                      style={{ width:26, height:26, borderRadius:"50%", border:"1px solid #bfdbfe", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <X size={13} color="#64748b" />
                    </button>
                  </div>
                ) : (
                  <UploadBox onChange={f=>handleFloorPlan(f)} accept=".pdf,.jpg,.jpeg,.png,.dwg" icon={<FileText size={15} color="#94a3b8" style={{ flexShrink:0 }} />} />
                )}
              </div>
            </div>

            {/* ─ 4b. Production Compliance ─ */}
            <div style={card}>
              <p style={secHead}>PRODUCTION COMPLIANCE</p>
              <QRow q="Does the company outsource any production activities to third parties?"      value={outsource}     onChange={setOutsource} />
              <QRow q="Does the company provide private labeling services?"                         value={privateLab}    onChange={setPrivateLab} />
              <QRow q="Are any pork derivatives used in the production process?"                    value={porkProd}      onChange={setPorkProd} />
              <QRow q="Are any pork derivatives present in the storage area?"                       value={porkStore}     onChange={setPorkStore} />
              <QRow q="Is the facility free from any animal meat?"                                  value={freeFromMeat}  onChange={setFreeFromMeat} />
              <QRow q="Is the facility free from any animal derivatives?"                           value={freeFromDeriv} onChange={setFreeFromDeriv} />
              <QRow q="Does the company hold a valid Vegetarian Certificate?"                       value={vegCert}       onChange={setVegCert} />
              <QRow q="Does the company hold a valid Food Safety Management Certificate?"           value={fsmCert}       onChange={setFsmCert} />
              <QRow q="Are alcohols used in the production process (excluding cleaning)?"           value={alcoholProd}   onChange={setAlcoholProd} />
              <QRow q="Is alcohol present in any of the products?"                                  value={alcoholItem}   onChange={setAlcoholItem} />
              <QRow q="Does the facility have dedicated days for Halal production?"                 value={dedicDays}     onChange={setDedicDays} />
              <QRow q="Does the facility use dedicated equipment for Halal production?"             value={dedicEquip}    onChange={setDedicEquip} />
              <QRow q="Does the facility use dedicated storage for Halal production?"               value={dedicStore}    onChange={setDedicStore} last />
            </div>

            {/* ─ 5. Products & Declaration ─ */}
            <div ref={sec5Ref} style={card}>
              <p style={secHead}>PRODUCTS & DECLARATION</p>

              {/* Products for Certification */}
              <div style={{ marginBottom:22 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <label style={{ ...lbl, marginBottom:0 }}>
                    Products for Certification
                    <span style={{ marginLeft:8, fontSize:"0.72rem", fontWeight:600, color:"#fff", background:BLUE, padding:"1px 8px", borderRadius:10 }}>{applicationProducts.length}</span>
                  </label>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button type="button" onClick={refreshProducts}
                      style={{ padding:"5px 11px", borderRadius:6, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      ↻ Refresh
                    </button>
                    <button type="button" onClick={()=>setShowProductPicker(true)}
                      style={{ padding:"5px 13px", borderRadius:6, border:"none", background:BLUE, color:"#fff", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      + Add Products
                    </button>
                    <a href="/customer/factories" target="_blank" rel="noreferrer"
                      style={{ padding:"5px 11px", borderRadius:6, border:"1px solid #e2e8f0", background:"#f8fafc", color:BLUE, fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
                      Manage <ArrowRight size={10} />
                    </a>
                  </div>
                </div>

                {applicationProducts.length === 0 ? (
                  <div style={{ padding:"28px", textAlign:"center" as const, background:"#f8fafc", border:"1px dashed #e2e8f0", borderRadius:8 }}>
                    <Package size={24} color="#cbd5e1" style={{ marginBottom:8 }} />
                    <p style={{ margin:"0 0 8px", color:"#9ca3af", fontSize:"0.8rem" }}>No products added yet.</p>
                    <button type="button" onClick={()=>setShowProductPicker(true)}
                      style={{ fontSize:"0.8rem", fontWeight:600, color:BLUE, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                      + Add products from your portfolio
                    </button>
                  </div>
                ) : (
                  <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.8125rem" }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          {["#","","Product Name","Code","Ingredients","Factory",""].map((h,i)=>(
                            <th key={i} style={{ padding:"8px 12px", textAlign:"left" as const, fontWeight:700, color:"#64748b", borderBottom:"1px solid #e2e8f0", fontSize:"0.68rem", letterSpacing:"0.04em", width:i===0?36:i===1?36:i===6?40:undefined }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applicationProducts.map((p,i) => {
                          const factory = applicationFactories.find(f => f.id === p.factoryId) ?? regFactories.find(f => f.id === p.factoryId)
                          return (
                            <tr key={p.id} style={{ borderBottom:"1px solid #f8fafc" }}>
                              <td style={{ padding:"8px 12px", color:"#94a3b8", fontWeight:600, fontSize:"0.8rem" }}>{i+1}</td>
                              <td style={{ padding:"8px 6px", fontSize:"1.1rem" }}>{p.emoji}</td>
                              <td style={{ padding:"8px 12px", fontWeight:600, color:DARK }}>{p.name}</td>
                              <td style={{ padding:"8px 12px", color:"#64748b", fontSize:"0.78rem" }}>{p.code || "—"}</td>
                              <td style={{ padding:"8px 12px" }}>
                                <span style={{ fontSize:"0.72rem", fontWeight:600, color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:12 }}>
                                  {p.ingredients.length} ingredient{p.ingredients.length!==1?"s":""}
                                </span>
                              </td>
                              <td style={{ padding:"8px 12px", fontSize:"0.75rem", color:BLUE }}>{factory?.name || "—"}</td>
                              <td style={{ padding:"8px 12px" }}>
                                <button type="button" onClick={()=>setSelectedProductIds(prev=>prev.filter(id=>id!==p.id))}
                                  style={{ width:22, height:22, borderRadius:6, border:"none", background:"#fee2e2", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                                  ×
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Remarks <span style={{ fontWeight:400, color:"#94a3b8" }}>(optional)</span></label>
                <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}
                  style={{ ...inp, height:"auto", padding:"9px 11px", resize:"vertical" as const, lineHeight:1.65 } as React.CSSProperties}
                  onFocus={focus} onBlur={blur} placeholder="Additional notes for the certification team..." />
              </div>

              <label style={{ ...lbl, marginBottom:12 }}>Declaration <Req /></label>
              {[
                { val:agreed1, set:setAgreed1, title:"Data confidentiality commitment",
                  text:"All information provided is confidential and will be used only for the official purpose of applying for Halal Certification through HalalCMS." },
                { val:agreed2, set:setAgreed2, title:"Acknowledgement of authority",
                  text:"I confirm the information is true and accurate. I agree the service provider may request additional documentation if information is missing or unclear." },
                { val:agreed3, set:setAgreed3, title:"Application form commitment",
                  text:"I authorise the processing of this Halal certification application and confirm all submitted details are complete and correct." },
              ].map((d,i)=>(
                <label key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10, cursor:"pointer", padding:"10px 12px", borderRadius:8, background:d.val?"#eff6ff":"#fafafa", border:`1px solid ${d.val?"#bfdbfe":"#e2e8f0"}` }}>
                  <div style={{ marginTop:2, flexShrink:0 }}>
                    <input type="checkbox" checked={d.val} onChange={e=>d.set(e.target.checked)} style={{ width:15, height:15, cursor:"pointer", accentColor:BLUE }} />
                  </div>
                  <span style={{ fontSize:"0.8125rem", color:"#374151", lineHeight:1.6 }}>
                    <strong style={{ color:d.val?BLUE:DARK }}>{d.title}:</strong> {d.text}
                  </span>
                </label>
              ))}

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16, paddingBottom:4 }}>
                <button type="submit" disabled={submitting}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 28px", borderRadius:8, background:submitting?"#93c5fd":BLUE, color:"#fff", border:"none", cursor:submitting?"default":"pointer", fontFamily:"inherit", fontSize:"0.9rem", fontWeight:700, transition:"background 0.15s" }}
                  onMouseOver={e=>{ if(!submitting) e.currentTarget.style.background="#1d4ed8" }}
                  onMouseOut={e=>{ if(!submitting) e.currentTarget.style.background=BLUE }}>
                  {submitting
                    ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />Submitting…</>
                    : <><span>Submit Application</span><ArrowRight size={15} /></>
                  }
                </button>
              </div>
            </div>

          </form>
        </main>

        {/* ── Right sidebar — Fee Summary ── */}
        {(() => {
          const pricing = loadPricing()
          const sym = getCurrencySymbol(pricing.currency)
          const fmt = (n: number) => `${pricing.currency} ${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

          const accs = registeredStandards

          const appFeeRow = selectedStandards.length > 0
            ? accs.filter(a => a.standard && selectedStandards.includes(a.standard))
            : []

          const hasStandard  = selectedStandards.length > 0
          const appFeeTotal  = appFeeRow.reduce((s, a) => s + (a.unitPrice ?? 0), 0)
          const auditFee     = hasStandard ? pricing.auditDayCost : 0
          const subtotal     = hasStandard ? appFeeTotal + auditFee : 0
          const vat          = hasStandard ? subtotal * pricing.vatPct / 100 : 0
          const total        = hasStandard ? subtotal + vat : 0

          return (
            <aside style={{ width:400, flexShrink:0, marginRight:28, marginTop:20, position:"sticky", top:97, height:"calc(100vh - 117px)", overflowY:"auto", paddingLeft:56 }}>

              {/* Fee card */}
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.07)" }}>
                {/* Header */}
                <div style={{ background:"#f8fafc", borderBottom:"1px solid #e9ecef", padding:"16px 20px" }}>
                  <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" as const, marginBottom:4 }}>Fee Summary</div>
                  <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#111827", letterSpacing:"-0.5px" }}>
                    {fmt(total)}
                  </div>
                  <div style={{ fontSize:"0.68rem", color:"#6b7280", marginTop:2 }}>Estimated total including VAT</div>
                </div>

                {/* Breakdown */}
                <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column" as const, gap:0 }}>

                  {/* Application Fee rows */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.1em", textTransform:"uppercase" as const, marginBottom:8 }}>Application Fee</div>
                    {hasStandard && appFeeRow.length > 0 ? appFeeRow.map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <span style={{ fontSize:"0.75rem", color:"#374151", flex:1, paddingRight:8 }}>{a.standard}</span>
                        <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#111827", whiteSpace:"nowrap" as const }}>{fmt(a.unitPrice ?? 0)}</span>
                      </div>
                    )) : (
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:"0.75rem", color:"#94a3b8" }}>{hasStandard ? "No fee configured" : "No standard selected"}</span>
                        <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#94a3b8" }}>{fmt(0)}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ height:1, background:"#f1f5f9", margin:"4px 0 12px" }} />

                  {/* Audit Fee */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:"0.78rem", color:"#374151" }}>Audit Fee</span>
                    <span style={{ fontSize:"0.78rem", fontWeight:600, color: auditFee > 0 ? "#111827" : "#94a3b8" }}>
                      {fmt(auditFee)}
                    </span>
                  </div>

                  {/* VAT */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:"0.78rem", color:"#374151" }}>VAT ({pricing.vatPct}%)</span>
                    <span style={{ fontSize:"0.78rem", fontWeight:600, color: vat > 0 ? "#111827" : "#94a3b8" }}>
                      {fmt(vat)}
                    </span>
                  </div>

                  {/* Total */}
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e9ecef" }}>
                    <span style={{ fontSize:"0.85rem", fontWeight:700, color:"#111827" }}>Total</span>
                    <span style={{ fontSize:"0.85rem", fontWeight:800, color:"#111827" }}>
                      {fmt(total)}
                    </span>
                  </div>

                </div>
              </div>
            </aside>
          )
        })()}
      </div>

      {/* ── Pre-fill notice popup ── */}
      {showPrefillNotice && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.35)", fontFamily:"'Inter',system-ui,sans-serif" }}>
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"18px 22px", width:480, boxShadow:"0 8px 32px rgba(0,0,0,0.1)", display:"flex", gap:14, alignItems:"flex-start" }}>
            <CheckCircle2 size={20} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 12px", fontSize:"0.85rem", color:DARK, lineHeight:1.6 }}>
                Sections 1 &amp; 2 are pre-filled from your registration. Please start from <strong>Section 3</strong>.
              </p>
              <button type="button" onClick={()=>{setShowPrefillNotice(false);setTimeout(()=>refs[3]?.current?.scrollIntoView({behavior:"smooth",block:"start"}),150)}}
                style={{ padding:"6px 16px", borderRadius:7, background:GREEN, color:"#fff", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:"inherit" }}>
                Got it
              </button>
            </div>
            <button type="button" onClick={()=>setShowPrefillNotice(false)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", padding:0, flexShrink:0, display:"flex" }}>
              <X size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* ── Validation floating panel ── */}
      {showValidation && (
        <div style={{ position:"fixed", bottom:valPos.bottom, right:valPos.right, zIndex:9996, width:260, background:"#2563eb", borderRadius:13, border:"1px solid #3b82f6", boxShadow:"0 8px 36px rgba(37,99,235,0.35)", overflow:"hidden", fontFamily:"'Inter',system-ui,sans-serif" }}>
          {/* Header — drag target */}
          <div onMouseDown={onValDragStart} style={{ padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.1)", borderBottom:"1px solid rgba(255,255,255,0.12)", cursor:"grab", userSelect:"none" as const }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: allComplete ? "#4ade80" : "#fca5a5", flexShrink:0 }} />
              <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>
                {allComplete ? "Ready to Submit" : `${incompleteFields.length} field${incompleteFields.length !== 1 ? "s" : ""} not filled`}
              </span>
            </div>
            <button type="button" onClick={() => setShowValidation(false)} onMouseDown={e => e.stopPropagation()}
              style={{ width:22, height:22, borderRadius:6, border:"none", background:"rgba(255,255,255,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <X size={12} color="rgba(255,255,255,0.8)" />
            </button>
          </div>
          {/* Body — scrollable, no scrollbar */}
          <div className="val-body" style={{ maxHeight:"calc(100vh - 120px)", overflowY:"auto" }}>
            {allComplete ? (
              <div style={{ padding:"20px 14px", textAlign:"center" as const }}>
                <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🎉</div>
                <p style={{ margin:0, fontSize:"0.82rem", fontWeight:700, color:"#4ade80" }}>All fields complete!</p>
                <p style={{ margin:"4px 0 0", fontSize:"0.72rem", color:"rgba(255,255,255,0.6)" }}>You can now submit your application.</p>
              </div>
            ) : (
              <div style={{ padding:"6px 0" }}>
                {incompleteFields.map(f => (
                  <div key={f.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 14px" }}>
                    <div style={{ width:15, height:15, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                      background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)" }}>
                      <span style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.8)", display:"block" }} />
                    </div>
                    <span style={{ fontSize:"0.75rem", color:"#fff", flex:1 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .val-body::-webkit-scrollbar { display:none; } .val-body { scrollbar-width:none; }`}</style>

      {/* ── Product Picker Modal ── */}
      {showProductPicker && (
        <div onClick={()=>setShowProductPicker(false)}
          style={{ position:"fixed", inset:0, zIndex:9997, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#fff", borderRadius:12, width:"min(640px,95vw)", maxHeight:"80vh", display:"flex", flexDirection:"column", boxShadow:"0 16px 48px rgba(0,0,0,0.22)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
              <div>
                <p style={{ margin:0, fontSize:"0.9rem", fontWeight:700, color:DARK }}>Add Products</p>
                <p style={{ margin:0, fontSize:"0.72rem", color:"#94a3b8", marginTop:2 }}>Select from your product portfolio</p>
              </div>
              <button type="button" onClick={()=>setShowProductPicker(false)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={14} color="#64748b" />
              </button>
            </div>
            <div style={{ overflowY:"auto", padding:"12px 18px", flex:1 }}>
              {portfolioProducts.length === 0 ? (
                <div style={{ padding:"32px", textAlign:"center" as const }}>
                  <p style={{ color:"#94a3b8", fontSize:"0.85rem", margin:0 }}>No products in your portfolio.</p>
                  <a href="/customer/factories" target="_blank" rel="noreferrer"
                    style={{ fontSize:"0.8rem", fontWeight:600, color:BLUE, textDecoration:"none", display:"inline-block", marginTop:8 }}>
                    Go to Factories →
                  </a>
                </div>
              ) : portfolioProducts.map(p => {
                const added = selectedProductIds.includes(p.id)
                const factory = regFactories.find(f => f.id === p.factoryId)
                return (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, marginBottom:6, background:added?"#eff6ff":"#fafafa", border:`1px solid ${added?"#bfdbfe":"#e2e8f0"}` }}>
                    <span style={{ fontSize:"1.2rem", flexShrink:0 }}>{p.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:"0.83rem", fontWeight:700, color:DARK }}>{p.name}</p>
                      <p style={{ margin:"2px 0 0", fontSize:"0.7rem", color:"#94a3b8" }}>
                        {p.ingredients.length} ingredient{p.ingredients.length!==1?"s":""}{factory ? ` · ${factory.name}` : ""}
                      </p>
                    </div>
                    <button type="button"
                      onClick={()=>setSelectedProductIds(prev=>added?prev.filter(id=>id!==p.id):[...prev,p.id])}
                      style={{ padding:"5px 14px", borderRadius:7, border:"none", background:added?"#fee2e2":BLUE, color:added?"#dc2626":"#fff", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                      {added ? "Remove" : "Add"}
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{ padding:"12px 18px", borderTop:"1px solid #e2e8f0", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.78rem", color:"#64748b" }}>{selectedProductIds.length} product{selectedProductIds.length!==1?"s":""} selected</span>
              <button type="button" onClick={()=>setShowProductPicker(false)}
                style={{ padding:"7px 20px", borderRadius:7, border:"none", background:BLUE, color:"#fff", fontSize:"0.82rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floor Plan Preview Modal ── */}
      {showFloorPreview && floorPlanUrl && (
        <div onClick={()=>setShowFloorPreview(false)}
          style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#fff", borderRadius:12, overflow:"hidden", width:"min(900px,95vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
              <div>
                <p style={{ margin:0, fontSize:"0.875rem", fontWeight:700, color:DARK }}>{floorPlan!.name}</p>
                <p style={{ margin:0, fontSize:"0.72rem", color:"#94a3b8", marginTop:2 }}>Facility Floor Plan</p>
              </div>
              <button type="button" onClick={()=>setShowFloorPreview(false)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={14} color="#64748b" />
              </button>
            </div>
            <div style={{ flex:1, overflow:"auto", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
              {floorPlan!.type.startsWith("image/") ? (
                <img src={floorPlanUrl} alt="Floor plan" style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", display:"block" }} />
              ) : (
                <iframe src={floorPlanUrl} title="Floor plan" style={{ width:"100%", height:"80vh", border:"none", display:"block" }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICE EDIT PERMISSION MODAL ─────────────────────── */}
      {showPermModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 28px", maxWidth:440, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width:48, height:48, borderRadius:12, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p style={{ margin:"0 0 8px", fontSize:17, fontWeight:700, color:"#0f172a" }}>Allow office to edit this draft?</p>
            <p style={{ margin:"0 0 24px", fontSize:13, color:"#64748b", lineHeight:1.6 }}>
              Would you like to give permission to the <strong>HCS office team</strong> to edit and assist with your draft application?
              If you choose <strong>No</strong>, they will only be able to view it.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => doSaveDraft(true)}
                style={{ flex:1, padding:"11px 0", background:BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer" }}>
                Yes, allow editing
              </button>
              <button onClick={() => doSaveDraft(false)}
                style={{ flex:1, padding:"11px 0", background:"#f8fafc", color:"#374151", border:"1px solid #e2e8f0", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                No, view only
              </button>
            </div>
            <button onClick={() => setShowPermModal(false)}
              style={{ display:"block", margin:"14px auto 0", fontSize:12, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

const Req = () => <span style={{ color:RED, marginLeft:2 }}>*</span>

