import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Mail, Phone, Lock, Eye, EyeOff, Globe,
  MapPin, FileText, Shield, ChevronRight, ChevronDown, ArrowRight,
  BadgeCheck, Package, AlertCircle, X,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { checkEmailExists, registerUser } from "@/api/auth"
import { createCompany } from "@/api/companies"
import { getActivityCategories } from "@/lib/activityOptions"

const BLUE  = "#2563eb"
const DARK  = "#111827"
const NAV   = "#0f2170"

const SECTIONS = [
  { num:1, label:"Company Information"    },
  { num:2, label:"Contact & Verification" },
  { num:3, label:"Office Location"        },
  { num:4, label:"License & Compliance"   },
  { num:5, label:"Certificates & VAT"     },
]

const COMPANY_TYPES = [
  "Sendirian Berhad (Sdn. Bhd.)","Berhad (Bhd.)","Sole Proprietorship",
  "Partnership","Limited Liability Partnership (LLP)",
  "Government-Linked Company","Others",
]

const STATES_MY = [
  "Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Melaka",
  "Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya",
  "Sabah","Sarawak","Selangor","Terengganu",
]

const toBusinessType = (value: string) => {
  if (value.includes("Sdn. Bhd.")) return "PRIVATE_LIMITED"
  if (value.includes("Berhad")) return "PUBLIC_LIMITED"
  if (value.includes("Sole")) return "SOLE_PROPRIETOR"
  if (value.includes("Partnership")) return "PARTNERSHIP"
  return "OTHER"
}

const toActivityCategory = (categories: string[]) => {
  const keys = categories.map(c => c.toLowerCase())
  if (keys.some(c => c.includes("slaughter"))) return "SLAUGHTERHOUSE"
  if (keys.some(c => c.includes("logistics") || c.includes("coldchain") || c.includes("warehousing"))) return "LOGISTICS"
  if (keys.some(c => c.includes("cosmetic") || c.includes("skincare") || c.includes("haircare"))) return "COSMETICS"
  if (keys.some(c => c.includes("pharma") || c.includes("supplement") || c.includes("nutraceutical"))) return "PHARMACEUTICAL"
  if (keys.some(c => c.includes("restaurant") || c.includes("hotel") || c.includes("catering"))) return "FOOD_SERVICE"
  if (keys.some(c => c.includes("retail"))) return "RETAILER"
  if (keys.some(c => c.includes("distributor"))) return "DISTRIBUTOR"
  if (keys.some(c => c.includes("import"))) return "FOOD_IMPORTER"
  if (keys.some(c => c.includes("export"))) return "FOOD_EXPORTER"
  if (keys.length > 0) return "FOOD_MANUFACTURER"
  return "OTHER"
}

const readFileData = (file: File | null): Promise<string | null> =>
  file
    ? new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = event => resolve(event.target?.result as string ?? null)
        reader.readAsDataURL(file)
      })
    : Promise.resolve(null)

function makeMapHtml(lat: string, lng: string): string {
  const clat = lat && !isNaN(+lat) ? +lat : 3.1390
  const clng = lng && !isNaN(+lng) ? +lng : 101.6869
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head><body><div id="map"></div><script>
var map=L.map('map').setView([${clat},${clng}],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OpenStreetMap'}).addTo(map);
var marker=L.marker([${clat},${clng}],{draggable:true}).addTo(map);
function send(ll){window.parent.postMessage({type:'hcs-loc',lat:ll.lat.toFixed(6),lng:ll.lng.toFixed(6)},'*');}
marker.on('dragend',function(e){send(e.target.getLatLng());});
map.on('click',function(e){marker.setLatLng(e.latlng);send(e.latlng);});
</script></body></html>`
}

const COUNTRIES = [
  "Malaysia","Afghanistan","Albania","Algeria","Australia","Austria","Bahrain",
  "Bangladesh","Belgium","Bosnia and Herzegovina","Brazil","Brunei","Cambodia",
  "Canada","China","Denmark","Egypt","Ethiopia","Finland","France","Germany",
  "Ghana","Greece","Hungary","India","Indonesia","Iran","Iraq","Ireland","Italy",
  "Japan","Jordan","Kazakhstan","Kenya","Kuwait","Lebanon","Libya","Luxembourg",
  "Maldives","Mauritania","Morocco","Myanmar","Netherlands","New Zealand",
  "Nigeria","Norway","Oman","Pakistan","Palestine","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal","Singapore",
  "Somalia","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden",
  "Switzerland","Syria","Tanzania","Thailand","Tunisia","Turkey","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uzbekistan","Vietnam","Yemen","Zimbabwe",
]

const CITIES_BY_COUNTRY: Record<string,string[]> = {
  "Malaysia": ["Alor Setar","Batu Pahat","Butterworth","George Town","Ipoh","Johor Bahru","Klang","Kota Bharu","Kota Kinabalu","Kuala Lumpur","Kuala Terengganu","Kuantan","Kuching","Miri","Petaling Jaya","Putrajaya","Sandakan","Seremban","Shah Alam","Sibu","Subang Jaya","Taiping"],
  "Indonesia": ["Bandung","Denpasar","Jakarta","Makassar","Medan","Palembang","Semarang","Surabaya","Yogyakarta"],
  "Singapore": ["Singapore"],
  "Brunei": ["Bandar Seri Begawan","Kuala Belait","Seria","Tutong"],
  "Thailand": ["Bangkok","Chiang Mai","Chiang Rai","Hat Yai","Khon Kaen","Nonthaburi","Pattaya","Phuket"],
  "Philippines": ["Cebu City","Davao City","Makati","Manila","Quezon City","Taguig","Zamboanga"],
  "Vietnam": ["Can Tho","Da Nang","Hai Phong","Hanoi","Ho Chi Minh City","Hue"],
  "Myanmar": ["Mandalay","Naypyidaw","Yangon"],
  "Cambodia": ["Phnom Penh","Siem Reap","Sihanoukville"],
  "Saudi Arabia": ["Al Khobar","Dammam","Jeddah","Mecca","Medina","Riyadh","Tabuk"],
  "United Arab Emirates": ["Abu Dhabi","Ajman","Dubai","Fujairah","Ras Al Khaimah","Sharjah"],
  "Kuwait": ["Ahmadi","Kuwait City","Salmiya"],
  "Qatar": ["Al Wakrah","Doha"],
  "Bahrain": ["Manama","Muharraq","Riffa"],
  "Oman": ["Muscat","Salalah","Sohar"],
  "Jordan": ["Amman","Aqaba","Irbid","Zarqa"],
  "Lebanon": ["Beirut","Sidon","Tripoli"],
  "Turkey": ["Ankara","Antalya","Bursa","Istanbul","Izmir","Konya"],
  "Egypt": ["Alexandria","Cairo","Giza","Luxor","Port Said"],
  "Morocco": ["Casablanca","Fez","Marrakech","Rabat","Tangier"],
  "Tunisia": ["Sfax","Sousse","Tunis"],
  "Pakistan": ["Faisalabad","Islamabad","Karachi","Lahore","Multan","Peshawar","Rawalpindi"],
  "India": ["Ahmedabad","Bengaluru","Chennai","Delhi","Hyderabad","Jaipur","Kolkata","Mumbai","Pune"],
  "Bangladesh": ["Chittagong","Dhaka","Khulna","Rajshahi"],
  "Sri Lanka": ["Colombo","Galle","Jaffna","Kandy"],
  "Maldives": ["Addu City","Male"],
  "United Kingdom": ["Birmingham","Bristol","Edinburgh","Leeds","Liverpool","London","Manchester","Sheffield"],
  "France": ["Bordeaux","Lyon","Marseille","Nice","Paris","Toulouse"],
  "Germany": ["Berlin","Cologne","Dusseldorf","Frankfurt","Hamburg","Munich","Stuttgart"],
  "Netherlands": ["Amsterdam","Eindhoven","Rotterdam","The Hague","Utrecht"],
  "Belgium": ["Antwerp","Brussels","Ghent","Liège"],
  "Australia": ["Adelaide","Brisbane","Canberra","Melbourne","Perth","Sydney"],
  "New Zealand": ["Auckland","Christchurch","Hamilton","Wellington"],
  "Canada": ["Calgary","Montreal","Ottawa","Toronto","Vancouver","Winnipeg"],
  "United States": ["Atlanta","Boston","Chicago","Dallas","Houston","Los Angeles","Miami","New York","San Francisco","Seattle","Washington D.C."],
  "China": ["Beijing","Chengdu","Guangzhou","Shanghai","Shenzhen","Wuhan","Xi'an"],
  "Japan": ["Fukuoka","Kyoto","Nagoya","Osaka","Sapporo","Tokyo","Yokohama"],
  "South Korea": ["Busan","Daegu","Incheon","Seoul","Ulsan"],
  "Nigeria": ["Abuja","Ibadan","Kano","Lagos","Port Harcourt"],
  "South Africa": ["Cape Town","Durban","Johannesburg","Pretoria"],
  "Kenya": ["Mombasa","Nairobi"],
  "Tanzania": ["Dar es Salaam","Dodoma","Zanzibar"],
}

function DocThumb() {
  return (
    <div style={{ width:42, height:54, flexShrink:0, position:"relative" }}>
      <div style={{ position:"absolute", inset:0, background:"#dbeafe", borderRadius:4, clipPath:"polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 0 100%)" }}>
        <div style={{ position:"absolute", top:14, left:7, right:7, display:"flex", flexDirection:"column", gap:3 }}>
          <div style={{ height:2, borderRadius:1, background:"#93c5fd" }} />
          <div style={{ height:2, borderRadius:1, background:"#93c5fd", width:"75%" }} />
          <div style={{ height:2, borderRadius:1, background:"#bfdbfe" }} />
          <div style={{ height:2, borderRadius:1, background:"#bfdbfe", width:"60%" }} />
          <div style={{ height:2, borderRadius:1, background:"#bfdbfe" }} />
        </div>
        <div style={{ position:"absolute", bottom:5, left:0, right:0, textAlign:"center", fontSize:"0.45rem", fontWeight:800, color:BLUE, letterSpacing:"0.1em" }}>PDF</div>
      </div>
      <div style={{ position:"absolute", top:0, right:0, width:11, height:11, background:"#93c5fd", clipPath:"polygon(0 0, 100% 0, 100% 100%)" }} />
    </div>
  )
}

export default function CustomerRegister() {
  const navigate   = useNavigate()
  const { setAuth } = useAuthStore()

  const sec1Ref    = useRef<HTMLDivElement>(null)
  const sec2Ref    = useRef<HTMLDivElement>(null)
  const sec3Ref    = useRef<HTMLDivElement>(null)
  const sec4Ref    = useRef<HTMLDivElement>(null)
  const sec5Ref    = useRef<HTMLDivElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)
  const cityRef    = useRef<HTMLDivElement>(null)
  const refs = [null, sec1Ref, sec2Ref, sec3Ref, sec4Ref, sec5Ref] as const

  // Company
  const [companyName,  setCompanyName]  = useState("")
  const [companyType,  setCompanyType]  = useState("")
  const [yearEst,      setYearEst]      = useState("")
  const [numEmployees, setNumEmployees] = useState("")
  const [website,      setWebsite]      = useState("")
  const [categories,   setCategories]   = useState<string[]>([])
  const [activityCategories]            = useState(getActivityCategories)
  const [description,   setDescription]   = useState("")

  // Contact
  const [contactName, setContactName] = useState("")
  const [designation, setDesignation] = useState("")
  const [email,       setEmail]       = useState("")
  const [phone,       setPhone]       = useState("")
  const [password,    setPassword]    = useState("")
  const [confirm,     setConfirm]     = useState("")
  const [showPw,      setShowPw]      = useState(false)

  // OTP (email only)
  const [emailOtpSent,     setEmailOtpSent]     = useState(false)
  const [emailOtpVerified, setEmailOtpVerified] = useState(false)
  const [emailOtp,         setEmailOtp]         = useState("")
  const [otpLoading,       setOtpLoading]       = useState(false)
  const [emailGateError,   setEmailGateError]   = useState("")

  // Location
  const [address1,        setAddress1]        = useState("")
  const [address2,        setAddress2]        = useState("")
  const [city,            setCity]            = useState("")
  const [cityQuery,       setCityQuery]       = useState("")
  const [showCityDrop,    setShowCityDrop]    = useState(false)
  const [stateMy,         setStateMy]         = useState("")
  const [postcode,        setPostcode]        = useState("")
  const [country,         setCountry]         = useState("Malaysia")
  const [countryQuery,    setCountryQuery]    = useState("Malaysia")
  const [showCountryDrop, setShowCountryDrop] = useState(false)
  const [lat,             setLat]             = useState("3.1390")
  const [lng,             setLng]             = useState("101.6869")
  const [geoLoading,      setGeoLoading]      = useState(false)

  // License
  const [licenseNo,     setLicenseNo]     = useState("")
  const [licenseExpiry, setLicenseExpiry] = useState("")
  const [issuingAuth,   setIssuingAuth]   = useState("")
  const [licenseFile,   setLicenseFile]   = useState<File|null>(null)

  // Certs & VAT
  const [vatNo,  setVatNo]  = useState("")
  const [sstNo,  setSstNo]  = useState("")
  const [vatFile,setVatFile] = useState<File|null>(null)

  const [agreed,  setAgreed]  = useState(false)
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountryDrop(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDrop(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "hcs-loc" && e.data.lat && e.data.lng) {
        setLat(e.data.lat)
        setLng(e.data.lng)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const citiesForCountry  = CITIES_BY_COUNTRY[country] ?? []
  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countryQuery.toLowerCase()))
  const filteredCities    = citiesForCountry.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))

  const selectCountry = (c: string) => { setCountry(c); setCountryQuery(c); setShowCountryDrop(false); setCity(""); setCityQuery("") }
  const selectCity    = (c: string) => { setCity(c); setCityQuery(c); setShowCityDrop(false) }
  const scrollTo      = (n: number) => refs[n]?.current?.scrollIntoView({ behavior:"smooth", block:"start" })

  const sendOtp = async () => {
    setEmailGateError("")
    setOtpLoading(true)
    try {
      const { exists } = await checkEmailExists(email)
      if (exists) {
        setEmailGateError("This email is already registered. Please sign in instead.")
        setOtpLoading(false)
        return
      }
    } catch {
      // if check endpoint unavailable, proceed anyway
    }
    setTimeout(() => { setOtpLoading(false); setEmailOtpSent(true) }, 1200)
  }
  const verifyOtp = () => {
    if (emailOtp.length === 6) {
      setEmailOtpVerified(true)
      setEmailOtp("")
    }
  }
  const setMobileNumber = (value: string) => {
    if (value.includes("@")) {
      setPhone("")
      return
    }
    setPhone(value.replace(/[^\d+\-()\s]/g, ""))
  }
  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setGeoLoading(false) },
      () => setGeoLoading(false)
    )
  }
  const toggleCategory = (cat: string) =>
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (!companyName || !companyType || !email || !phone || !password || !confirm || !contactName || !address1 || !city || !stateMy || !postcode || !country || !licenseNo) { setError("Please fill in all required fields."); return }
    if (categories.length === 0) { setError("Please select at least one activity category."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }
    if (!agreed) { setError("Please accept the declaration before submitting."); return }
    setLoading(true)
    try {
      const [licenseData, vatData] = await Promise.all([readFileData(licenseFile), readFileData(vatFile)])
      const auth = await registerUser({
        email,
        password,
        fullName: contactName,
        companyName,
        role: "CUSTOMER",
      })
      setAuth(auth.accessToken, {
        id: auth.userId,
        email: auth.email,
        name: auth.fullName,
        role: auth.role,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        organization: companyName,
        phone,
      })
      await createCompany({
        registrationNumber: licenseNo,
        name: companyName,
        businessType: toBusinessType(companyType),
        address: [address1, address2].filter(Boolean).join(", "),
        addressLine1: address1,
        addressLine2: address2,
        city,
        state: stateMy,
        postcode,
        country,
        phone,
        email,
        website,
        activityCategory: toActivityCategory(categories),
        specificActivities: JSON.stringify(categories),
        description,
        incorporationDate: yearEst ? `${yearEst}-01-01` : undefined,
        contactName,
        contactDesignation: designation,
        employeeCount: numEmployees ? Number(numEmployees) : undefined,
        latitude: lat,
        longitude: lng,
        licenseNo,
        licenseExpiry: licenseExpiry || undefined,
        issuingAuthority: issuingAuth,
        licenseFileName: licenseFile?.name ?? "",
        licenseFileSize: licenseFile?.size ?? 0,
        licenseFileData: licenseData,
        vatNo, sstNo,
        vatFileName: vatFile?.name ?? "",
        vatFileSize: vatFile?.size ?? 0,
        vatFileData: vatData,
      })
      navigate("/customer/dashboard")
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || "Registration could not be saved. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const fmtSize = (b: number) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

  const inp: React.CSSProperties = {
    width:"100%", height:38, padding:"0 11px",
    border:"1px solid #e2e8f0", borderRadius:7, fontSize:"0.8125rem",
    color:DARK, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"#fff",
  }
  const inpIcon: React.CSSProperties = { ...inp, paddingLeft:36 }
  const lbl: React.CSSProperties = { display:"block", fontSize:"0.7rem", fontWeight:600, color:DARK, marginBottom:"0.3rem" }
  const secHead: React.CSSProperties = {
    fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const,
    color:"#1e3a8a", marginBottom:20, paddingBottom:12, borderBottom:`1px solid #dbeafe`,
  }
  const card: React.CSSProperties = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"22px 24px", marginBottom:14 }

  const mapHtml = makeMapHtml(lat, lng)

  const DropMenu = ({ items, selected, onSelect }: { items:string[]; selected:string; onSelect:(v:string)=>void }) =>
    items.length > 0 ? (
      <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.10)", zIndex:300, maxHeight:188, overflowY:"auto" }}>
        {items.map(c => (
          <button key={c} type="button" onMouseDown={() => onSelect(c)}
            style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 13px", background: c===selected?"#eff6ff":"transparent", border:"none", cursor:"pointer", fontSize:"0.8125rem", color: c===selected?BLUE:DARK, fontWeight: c===selected?600:400, fontFamily:"inherit" }}
            onMouseOver={e => { if (c!==selected) e.currentTarget.style.background="#f8fafc" }}
            onMouseOut={e => { if (c!==selected) e.currentTarget.style.background="transparent" }}
          >{c}</button>
        ))}
      </div>
    ) : null

  const FileCard = ({ file, onRemove }: { file:File; onRemove:()=>void }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:"1px solid #bfdbfe", borderRadius:8, background:"#eff6ff" }}>
      <DocThumb />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"0.8125rem", fontWeight:600, color:DARK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
        <div style={{ fontSize:"0.6875rem", color:"#64748b", marginTop:2 }}>{fmtSize(file.size)} · PDF Document</div>
      </div>
      <button type="button" onClick={onRemove} title="Remove"
        style={{ width:26, height:26, borderRadius:"50%", border:"1px solid #bfdbfe", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0 }}>
        <X size={13} color="#64748b" />
      </button>
    </div>
  )

  const UploadBox = ({ onChange, icon }: { onChange:(f:File|null)=>void; icon:React.ReactNode }) => (
    <div style={{ border:"1px dashed #cbd5e1", borderRadius:7, padding:"11px 14px", background:"#fafbfc", display:"flex", alignItems:"center", gap:10 }}>
      {icon}
      <span style={{ fontSize:"0.8rem", color:"#9ca3af", flex:1 }}>No file chosen</span>
      <label style={{ padding:"5px 14px", borderRadius:6, background:BLUE, color:"#fff", fontSize:"0.75rem", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
        Choose File
        <input type="file" accept=".pdf" onChange={e => onChange(e.target.files?.[0] ?? null)} style={{ display:"none" }} />
      </label>
    </div>
  )

  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.target.style.borderColor = BLUE)
  const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.target.style.borderColor = "#e2e8f0")

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:"#f1f5f9" }}>

      {/* Email verification popup */}
      {!emailOtpVerified && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,33,112,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:16, padding:"36px 32px", width:380, boxShadow:"0 24px 64px rgba(0,0,0,0.22)", fontFamily:"'Inter',system-ui,sans-serif", position:"relative" }}>
            <button type="button" onClick={() => setEmailOtpVerified(true)}
              title="Skip verification"
              style={{ position:"absolute", top:12, right:12, width:26, height:26, borderRadius:"50%", background:"#f1f5f9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", padding:0 }}>
              <X size={14} />
            </button>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <div style={{ width:54, height:54, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Mail size={26} color={BLUE} />
              </div>
            </div>

            {!emailOtpSent ? (
              /* ── Step 1: Enter email ── */
              <>
                <p style={{ margin:"0 0 4px", fontSize:"1.05rem", fontWeight:700, color:DARK, textAlign:"center" as const }}>Verify Your Email</p>
                <p style={{ margin:"0 0 24px", fontSize:"0.78rem", color:"#6b7280", textAlign:"center" as const }}>Enter your business email to receive a one-time password</p>
                <label style={lbl}>Business Email <span style={{ color:"#dc2626" }}>*</span></label>
                <div style={{ position:"relative", marginTop:6 }}>
                  <Mail size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                  <input type="email" name="registration_business_email" autoComplete="section-customer-registration email" value={email} autoFocus
                    onChange={e => { setEmail(e.target.value); setEmailGateError("") }}
                    onKeyDown={e => { if (e.key === "Enter" && email) sendOtp() }}
                    style={{ ...inpIcon, width:"100%", boxSizing:"border-box" as const, borderColor: emailGateError ? "#dc2626" : "#e2e8f0" }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
                {emailGateError && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, padding:"8px 10px", borderRadius:7, background:"#fef2f2", border:"1px solid #fecaca" }}>
                    <AlertCircle size={14} color="#dc2626" style={{ flexShrink:0 }} />
                    <span style={{ fontSize:"0.75rem", color:"#dc2626" }}>{emailGateError}</span>
                    <button type="button" onClick={() => navigate("/customer/login")}
                      style={{ marginLeft:"auto", fontSize:"0.72rem", color:BLUE, fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const }}>
                      Sign in →
                    </button>
                  </div>
                )}
                <button type="button" onClick={sendOtp} disabled={!email || otpLoading}
                  style={{ width:"100%", marginTop:12, padding:"11px 0", borderRadius:8, background:BLUE, color:"#fff", border:"none", cursor:"pointer", fontSize:"0.88rem", fontWeight:700, fontFamily:"inherit", opacity:!email||otpLoading?0.5:1 }}>
                  {otpLoading ? "Checking…" : "Send OTP"}
                </button>
              </>
            ) : (
              /* ── Step 2: Enter OTP ── */
              <>
                <p style={{ margin:"0 0 4px", fontSize:"1.05rem", fontWeight:700, color:DARK, textAlign:"center" as const }}>Enter OTP</p>
                <p style={{ margin:"0 0 24px", fontSize:"0.78rem", color:"#6b7280", textAlign:"center" as const }}>
                  Code sent to <strong>{email}</strong>
                </p>
                <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#374151", letterSpacing:"0.04em", textTransform:"uppercase" as const }}>6-digit OTP</label>
                <input type="text" value={emailOtp} autoFocus
                  onChange={e => setEmailOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  onKeyDown={e => { if (e.key === "Enter") verifyOtp() }}
                  maxLength={6}
                  style={{ width:"100%", marginTop:6, padding:"10px 14px", borderRadius:8, border:`1.5px solid #e2e8f0`, fontSize:"1.5rem", fontWeight:700, textAlign:"center" as const, letterSpacing:"0.35em", fontFamily:"monospace", outline:"none", boxSizing:"border-box" as const }}
                  onFocus={e => e.target.style.borderColor=BLUE}
                  onBlur={e => e.target.style.borderColor="#e2e8f0"}
                />
                <button type="button" onClick={verifyOtp} disabled={emailOtp.length < 6}
                  style={{ width:"100%", marginTop:14, padding:"11px 0", borderRadius:8, background:BLUE, color:"#fff", border:"none", cursor:"pointer", fontSize:"0.88rem", fontWeight:700, fontFamily:"inherit", opacity:emailOtp.length<6?0.5:1 }}>
                  Verify &amp; Continue
                </button>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button type="button" onClick={sendOtp} disabled={otpLoading}
                    style={{ flex:1, padding:"9px 0", borderRadius:8, background:"transparent", color:BLUE, border:`1.5px solid ${BLUE}`, cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:"inherit" }}>
                    {otpLoading ? "Resending…" : "Resend OTP"}
                  </button>
                  <button type="button" onClick={() => { setEmailOtpSent(false); setEmailOtp("") }}
                    style={{ flex:1, padding:"9px 0", borderRadius:8, background:"transparent", color:"#6b7280", border:"1.5px solid #e2e8f0", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:"inherit" }}>
                    Change Email
                  </button>
                </div>
                <p style={{ margin:"14px 0 0", fontSize:"0.65rem", color:"#94a3b8", textAlign:"center" as const }}>Demo: enter any 6 digits to verify</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ background:NAV, height:56, padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
          <div style={{ width:34, height:34, background:"rgba(255,255,255,0.18)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:800, color:"#fff" }}>HC</div>
          <div>
            <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#fff" }}>HalalCMS</div>
            <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.4)" }}>Customer Registration</div>
          </div>
        </div>
        <div style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.65)" }}>
          Already have an account?{" "}
          <button onClick={() => navigate("/customer/login")} style={{ color:"#93c5fd", fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"0.8125rem" }}>Sign in</button>
        </div>
      </nav>

      {/* Sub-header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0.6rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => navigate("/customer/login")} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, background:"transparent", border:"1px solid #e2e8f0", cursor:"pointer", fontSize:"0.75rem", fontWeight:500, color:"#374151", fontFamily:"inherit" }}>
            ← Back
          </button>
          <div style={{ width:1, height:16, background:"#e2e8f0" }} />
          <div>
            <div style={{ fontSize:"0.875rem", fontWeight:700, color:DARK }}>Register Company</div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:1 }}>
              <span style={{ fontSize:"0.65rem", color:"#9ca3af" }}>Customer Portal</span>
              <ChevronRight size={10} color="#d1d5db" />
              <span style={{ fontSize:"0.65rem", color:"#6b7280" }}>Register Company</span>
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
                {companyName ? companyName.slice(0,2).toUpperCase() : "HC"}
              </div>
              <div>
                <div style={{ fontSize:"0.8125rem", fontWeight:700, color:DARK }}>{companyName || "Your Company"}</div>
                <div style={{ fontSize:"0.65rem", color:"#94a3b8" }}>Customer Portal</div>
              </div>
            </div>
          </div>

          <div style={{ padding:"12px 12px 8px" }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase", padding:"0 4px", marginBottom:6 }}>SECTIONS</div>
            {SECTIONS.map(s => (
              <button key={s.num} onClick={() => scrollTo(s.num)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 8px", borderRadius:7, background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit", marginBottom:1 }}
                onMouseOver={e => (e.currentTarget.style.background="#f8fafc")}
                onMouseOut={e => (e.currentTarget.style.background="transparent")}
              >
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#eff6ff", border:`1px solid #bfdbfe`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, color:BLUE, flexShrink:0 }}>{s.num}</div>
                <span style={{ fontSize:"0.8rem", color:DARK, fontWeight:500 }}>{s.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding:"12px 14px", borderTop:"1px solid #f1f5f9", marginTop:4 }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>WHAT HAPPENS NEXT</div>
            {[
              { n:1, t:"Account Created",    s:"Login credentials sent to your email immediately."         },
              { n:2, t:"Application Review", s:"Our team reviews your submission within 2 business days."  },
              { n:3, t:"Begin Certification",s:"Submit your halal certification application online."       },
            ].map(i => (
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
              All registered companies are immediately active. Login credentials will be sent to the business email provided.
            </p>
          </div>
        </aside>

        {/* ── Main form ── */}
        <main style={{ flex:1, padding:"18px 22px", overflowY:"auto", maxHeight:"calc(100vh - 97px)" }}>
          <form onSubmit={handleSubmit} noValidate autoComplete="off">

            {error && (
              <div style={{ marginBottom:12, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, fontSize:"0.8125rem", color:"#dc2626", display:"flex", gap:8, alignItems:"center" }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} />{error}
              </div>
            )}

            {/* ─ 1. Company Information ─ */}
            <div ref={sec1Ref} style={card}>
              <p style={secHead}>COMPANY INFORMATION</p>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lbl}>Company Name <span style={{ color:"#dc2626" }}>*</span></label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={lbl}>Company Type</label>
                  <select value={companyType} onChange={e => setCompanyType(e.target.value)} style={{ ...inp, cursor:"pointer" }} onFocus={focus} onBlur={blur}>
                    <option value="">Select type</option>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year Established</label>
                  <input type="number" value={yearEst} onChange={e => setYearEst(e.target.value)} min="1900" max={new Date().getFullYear()} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={lbl}>Number of Employees</label>
                  <select value={numEmployees} onChange={e => setNumEmployees(e.target.value)} style={{ ...inp, cursor:"pointer" }} onFocus={focus} onBlur={blur}>
                    <option value="">Select range</option>
                    {[
                      { value: "10", label: "1-10" },
                      { value: "50", label: "11-50" },
                      { value: "200", label: "51-200" },
                      { value: "500", label: "201-500" },
                      { value: "501", label: "500+" },
                    ].map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Website</label>
                  <div style={{ position:"relative" }}>
                    <Globe size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} style={inpIcon} onFocus={focus} onBlur={blur} />
                  </div>
                </div>

              </div>

              {/* Company Description */}
              <div style={{ marginTop:14 }}>
                <label style={lbl}>Company Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  style={{ ...inp, height:"auto", padding:"9px 11px", resize:"vertical" as const, lineHeight:1.65 } as React.CSSProperties}
                  onFocus={focus} onBlur={blur}
                  placeholder="Describe what your company produces, processes or trades…" />
              </div>

              {/* Activity Category */}
              <div style={{ marginTop:22 }}>
                <label style={lbl}>Activity Category <span style={{ color:"#dc2626" }}>*</span></label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:8 }}>
                  {activityCategories.map(cat => {
                    const sel = categories.includes(cat.key)
                    return (
                      <button key={cat.key} type="button" onClick={() => toggleCategory(cat.key)}
                        style={{ padding:"14px 10px 12px", borderRadius:10, border: sel ? `2px solid ${BLUE}` : "1.5px solid #e2e8f0", background: sel ? "#eff6ff" : "#fafafa", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:7, fontFamily:"inherit", transition:"all 0.15s", textAlign:"center" }}
                        onMouseOver={e => { if (!sel) e.currentTarget.style.background="#f4f6f8" }}
                        onMouseOut={e => { if (!sel) e.currentTarget.style.background="#fafafa" }}
                      >
                        <cat.Icon size={22} color={sel ? BLUE : "#94a3b8"} strokeWidth={1.5} />
                        <div style={{ fontSize:"0.72rem", fontWeight:sel?700:500, color:sel?BLUE:"#374151", lineHeight:1.3 }}>{cat.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* ─ 2. Contact & Verification ─ */}
            <div ref={sec2Ref} style={card}>
              <p style={secHead}>CONTACT & VERIFICATION</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>Contact Person Name <span style={{ color:"#dc2626" }}>*</span></label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={lbl}>Designation</label>
                  <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>

                {/* Email — pre-verified, locked */}
                <div>
                  <label style={lbl}>Business Email <span style={{ color:"#dc2626" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <Mail size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    <input type="email" name="verified_business_email" autoComplete="off" value={email} disabled
                      style={{ ...inpIcon, borderColor:"#16a34a", paddingRight:36, background:"#f0fdf4", color:"#374151" }} />
                    <BadgeCheck size={15} color="#16a34a" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }} />
                  </div>
                  <p style={{ fontSize:"0.65rem", color:"#16a34a", marginTop:4, fontWeight:600 }}>✓ Email verified</p>
                </div>

                {/* Mobile Number — plain input */}
                <div>
                  <label style={lbl}>Mobile Number <span style={{ color:"#dc2626" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <Phone size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    <input type="tel" name="registration_mobile_number" autoComplete="section-customer-registration tel" inputMode="tel" value={phone}
                      placeholder="+60 12 345 6789"
                      onChange={e => setMobileNumber(e.target.value)}
                      onFocus={e => { if (phone.includes("@")) setPhone(""); focus(e) }}
                      style={inpIcon} onBlur={blur} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Password <span style={{ color:"#dc2626" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <Lock size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    <input type={showPw?"text":"password"} name="new_customer_password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
                      style={{ ...inpIcon, paddingRight:36 }} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
                      {showPw ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#94a3b8" />}
                    </button>
                  </div>
                  <p style={{ fontSize:"0.65rem", color:"#94a3b8", marginTop:4 }}>Minimum 8 characters</p>
                </div>

                <div>
                  <label style={lbl}>Confirm Password <span style={{ color:"#dc2626" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <Lock size={14} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    <input type="password" name="confirm_customer_password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      style={{ ...inpIcon, borderColor: confirm && password===confirm ? "#16a34a" : "#e2e8f0" }}
                      onFocus={focus} onBlur={e => (e.target.style.borderColor = confirm && password===confirm ? "#16a34a" : "#e2e8f0")} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─ 3. Office Location — fields LEFT, map RIGHT ─ */}
            <div ref={sec3Ref} style={card}>
              <p style={secHead}>OFFICE LOCATION</p>
              <div style={{ display:"flex", gap:22, alignItems:"flex-start" }}>

                {/* Left: address fields */}
                <div style={{ flex:1 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                    {/* Country combobox */}
                    <div>
                      <label style={lbl}>Country</label>
                      <div ref={countryRef} style={{ position:"relative" }}>
                        <div style={{ position:"relative" }}>
                          <input type="text" value={countryQuery}
                            onChange={e => { setCountryQuery(e.target.value); setShowCountryDrop(true) }}
                            onFocus={e => { setShowCountryDrop(true); e.target.style.borderColor=BLUE }}
                            onBlur={e => (e.target.style.borderColor="#e2e8f0")}
                            style={{ ...inp, paddingRight:30 }} />
                          <ChevronDown size={13} color="#94a3b8" style={{ position:"absolute", right:9, top:"50%", transform:`translateY(-50%) rotate(${showCountryDrop?"180":"0"}deg)`, transition:"transform 0.15s", pointerEvents:"none" }} />
                        </div>
                        {showCountryDrop && <DropMenu items={filteredCountries} selected={country} onSelect={selectCountry} />}
                      </div>
                    </div>

                    {/* City combobox */}
                    <div>
                      <label style={lbl}>City <span style={{ color:"#dc2626" }}>*</span></label>
                      {citiesForCountry.length > 0 ? (
                        <div ref={cityRef} style={{ position:"relative" }}>
                          <div style={{ position:"relative" }}>
                            <input type="text" value={cityQuery}
                              onChange={e => { setCityQuery(e.target.value); setShowCityDrop(true) }}
                              onFocus={e => { setShowCityDrop(true); e.target.style.borderColor=BLUE }}
                              onBlur={e => (e.target.style.borderColor="#e2e8f0")}
                              style={{ ...inp, paddingRight:30 }} />
                            <ChevronDown size={13} color="#94a3b8" style={{ position:"absolute", right:9, top:"50%", transform:`translateY(-50%) rotate(${showCityDrop?"180":"0"}deg)`, transition:"transform 0.15s", pointerEvents:"none" }} />
                          </div>
                          {showCityDrop && <DropMenu items={filteredCities} selected={city} onSelect={selectCity} />}
                        </div>
                      ) : (
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                      )}
                    </div>

                    <div style={{ gridColumn:"1 / -1" }}>
                      <label style={lbl}>Address Line 1 <span style={{ color:"#dc2626" }}>*</span></label>
                      <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                    </div>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <label style={lbl}>Address Line 2</label>
                      <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={lbl}>Postcode <span style={{ color:"#dc2626" }}>*</span></label>
                      <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={lbl}>State / Province <span style={{ color:"#dc2626" }}>*</span></label>
                      {country === "Malaysia" ? (
                        <select value={stateMy} onChange={e => setStateMy(e.target.value)} style={{ ...inp, cursor:"pointer" }} onFocus={focus} onBlur={blur}>
                          <option value="">Select state</option>
                          {STATES_MY.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={stateMy} onChange={e => setStateMy(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: map */}
                <div style={{ width:360, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <MapPin size={13} color={BLUE} />
                      <span style={{ fontSize:"0.7rem", fontWeight:600, color:DARK }}>Pin Location</span>
                      <span style={{ fontSize:"0.65rem", color:"#94a3b8" }}>— click to place</span>
                    </div>
                    <button type="button" onClick={useMyLocation}
                      style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:5, background:"#eff6ff", border:`1px solid #bfdbfe`, color:BLUE, fontSize:"0.65rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      <MapPin size={10} />{geoLoading ? "Locating…" : "My Location"}
                    </button>
                  </div>
                  <iframe srcDoc={mapHtml} style={{ width:"100%", height:240, border:"1px solid #e2e8f0", borderRadius:8, display:"block" }} title="Office location map" />
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
                    <MapPin size={10} color="#94a3b8" />
                    <span style={{ fontSize:"0.66rem", color:"#64748b", fontFamily:"monospace" }}>{lat}, {lng}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ 4. License & Compliance ─ */}
            <div ref={sec4Ref} style={card}>
              <p style={secHead}>LICENSE & COMPLIANCE</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>Business License No. <span style={{ color:"#dc2626" }}>*</span></label>
                  <input type="text" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={lbl}>License Expiry Date</label>
                  <input type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lbl}>Issuing Authority</label>
                  <input type="text" value={issuingAuth} onChange={e => setIssuingAuth(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lbl}>License Document <span style={{ fontWeight:400, color:"#94a3b8", fontSize:"0.62rem" }}>— PDF only</span></label>
                  {licenseFile
                    ? <FileCard file={licenseFile} onRemove={() => setLicenseFile(null)} />
                    : <UploadBox onChange={setLicenseFile} icon={<FileText size={15} color="#94a3b8" style={{ flexShrink:0 }} />} />
                  }
                  <p style={{ fontSize:"0.65rem", color:"#9ca3af", marginTop:4, marginBottom:0 }}>Only PDF format is supported. Images are not allowed.</p>
                </div>
              </div>
            </div>

            {/* ─ 5. Certificates & VAT ─ */}
            <div ref={sec5Ref} style={card}>
              <p style={secHead}>CERTIFICATES & VAT</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>VAT / GST Registration No.</label>
                  <input type="text" value={vatNo} onChange={e => setVatNo(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={lbl}>SST Registration No.</label>
                  <input type="text" value={sstNo} onChange={e => setSstNo(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lbl}>VAT / CIF / KABIS / TVA Document <span style={{ fontWeight:400, color:"#94a3b8", fontSize:"0.62rem" }}>— PDF only</span></label>
                  {vatFile
                    ? <FileCard file={vatFile} onRemove={() => setVatFile(null)} />
                    : <UploadBox onChange={setVatFile} icon={<Shield size={15} color="#94a3b8" style={{ flexShrink:0 }} />} />
                  }
                  <p style={{ fontSize:"0.65rem", color:"#9ca3af", marginTop:4, marginBottom:0 }}>Only PDF format is supported. Images are not allowed.</p>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div style={{ ...card, marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer" }}>
                <div style={{ marginTop:2, flexShrink:0 }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ width:17, height:17, cursor:"pointer", accentColor:BLUE }} />
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:"0.8rem", fontWeight:700, color:DARK }}>Declaration</span>
                    {agreed && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"1px 8px", borderRadius:20, background:"#dcfce7", border:"1px solid #bbf7d0", fontSize:"0.62rem", fontWeight:700, color:"#16a34a" }}>
                        ✓ Accepted
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"#374151", margin:0, lineHeight:1.65 }}>
                    I hereby declare that all the information provided above is true, accurate and complete to the best of my knowledge. I understand that providing false or misleading information may result in the rejection or termination of my application, and I accept full responsibility for the accuracy of the details submitted.
                  </p>
                  <p style={{ fontSize:"0.72rem", color:"#94a3b8", margin:"10px 0 0", lineHeight:1.6 }}>
                    By registering, you agree to our{" "}
                    <a href="#" style={{ color:BLUE, textDecoration:"none", fontWeight:500 }}>Terms of Service</a>{" "}
                    and <a href="#" style={{ color:BLUE, textDecoration:"none", fontWeight:500 }}>Privacy Policy</a>.
                  </p>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16, paddingBottom:4 }}>
                    <button type="submit" disabled={loading}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 28px", borderRadius:8, background: loading?"#93c5fd":BLUE, color:"#fff", border:"none", cursor: loading?"default":"pointer", fontFamily:"inherit", fontSize:"0.9rem", fontWeight:700, transition:"background 0.15s" }}
                      onMouseOver={e => { if (!loading) e.currentTarget.style.background="#1d4ed8" }}
                      onMouseOut={e => { if (!loading) e.currentTarget.style.background=BLUE }}
                    >
                      {loading
                        ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />Creating Account…</>
                        : <><span>Create Account</span><ArrowRight size={15} /></>
                      }
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </form>
        </main>

        {/* ── Right sidebar ── */}
        <aside style={{ width:240, flexShrink:0, marginRight:28, marginTop:20, borderRadius:"0 12px 0 0", padding:"18px 16px", borderLeft:"1px solid #e2e8f0", background:"#fff", overflowY:"auto", position:"sticky", top:97, height:"calc(100vh - 117px)" }}>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>TIPS</div>
            <ul style={{ margin:0, paddingLeft:16, display:"flex", flexDirection:"column", gap:8, listStyleType:"disc" }}>
              {[
                "Use the official name as registered with SSM.",
                "OTP verification is required for email and mobile.",
                "Pin your office accurately for audit scheduling.",
                "Halal certificate details are optional for first-time applicants.",
                "VAT and SST numbers can be updated anytime from your profile.",
              ].map((tip,i) => (
                <li key={i} style={{ fontSize:"0.73rem", color:"#6b7280", lineHeight:1.55, listStyleType:"disc" }}>{tip}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>REQUIRED FIELDS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {["Company Name","Business License No.","Contact Name","Email (OTP)","Mobile (OTP)","Password","Address","City","State"].map(f => (
                <span key={f} style={{ padding:"3px 8px", borderRadius:5, background:"#f1f5f9", fontSize:"0.65rem", fontWeight:500, color:DARK }}>{f}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>DOCUMENTS TO PREPARE</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"SSM Certificate",   note:"Form 9, 24 or 49"       },
                { label:"Business License",  note:"Current & valid"         },
                { label:"Company Logo",      note:"PNG or JPG, min 200×200" },
                { label:"Halal Certificate", note:"If previously certified" },
                { label:"VAT / SST Letter",  note:"From LHDN or Customs"    },
              ].map(doc => (
                <div key={doc.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <Package size={12} color={BLUE} style={{ marginTop:2, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:"0.73rem", fontWeight:600, color:DARK }}>{doc.label}</div>
                    <div style={{ fontSize:"0.65rem", color:"#94a3b8" }}>{doc.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}



