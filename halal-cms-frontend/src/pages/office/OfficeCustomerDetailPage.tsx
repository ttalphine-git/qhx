import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft, Building2, User, MapPin, Mail, Phone, Globe,
  Factory, Package, Award, Clock, CheckCircle, XCircle,
  Tag, FileText, Layers, ShieldCheck, X as XIcon, TrendingUp, Eye, ChevronDown, Map, Download, RefreshCw,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getCompany, type Company } from "@/api/companies"
import { getFactories, type Factory as ApiFactory } from "@/api/factories"
import { getProducts, type Product as ApiProduct } from "@/api/products"

// ── Font constant ──────────────────────────────────────────────────────────────
const F = "'Inter', system-ui, sans-serif"

// ── Shared style tokens ────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e9ecef",
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  padding: "20px 22px",
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Profile {
  clientId?: string
  companyName: string; email: string; phone: string
  contactName: string; designation: string; website: string
  address1: string; address2: string; city: string
  state: string; postcode: string; country: string
}

interface FieldChange { field: string; label: string; oldVal: string; newVal: string }
type ReqStatus = "PENDING" | "APPROVED" | "REJECTED"
interface ChangeRequest {
  id: string; companyId?: string; companyName?: string; submittedAt: string
  changes: FieldChange[]; status: ReqStatus
  reviewedAt?: string; reviewedBy?: string; reviewNote?: string
}

interface CertUpload { type: string; fileName: string; fileSize: number; fileData?: string }
interface Factory {
  id: string; name: string; country: string; city: string; address: string
  lat: string; lng: string; prodLines: string; prodVolume: string; volUnit: string
  activityCategories: string[]; specificActivities: string[]
  certUploads: CertUpload[]; photo?: string
}
interface LocationPoint {
  id: string
  label: string
  type: "company" | "factory"
  lat: string
  lng: string
  address?: string
}

interface IngredientRow { id: string; name: string; certFile?: string; certName?: string }
interface StoredProduct {
  id: string; catalogKey: string; emoji: string; name: string
  code: string; barcode: string; factoryId: string; ingredients: IngredientRow[]
  addedAt: string; photo?: string
}
interface RegistrationDocs {
  licenseNo?: string
  licenseExpiry?: string
  issuingAuth?: string
  licenseFileName?: string
  licenseFileSize?: number
  licenseFileData?: string | null
  vatNo?: string
  sstNo?: string
  vatFileName?: string
  vatFileSize?: number
  vatFileData?: string | null
}

interface LocalGeneratedCertificate {
  id: string; applicationId: string; certNumber: string
  issuedAt: string; validUntil: string; scope?: string
  companyName?: string; status?: string
}

// ── Category maps ──────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  food:        "Food & Beverages",
  cosmetics:   "Cosmetics & Personal Care",
  pharma:      "Pharmaceuticals",
  logistics:   "Logistics & Warehousing",
  restaurant:  "Restaurant & F&B",
  mfg:         "Manufacturing",
  slaughter:   "Slaughterhouse",
  others:      "Others",
  food_manufacturer: "Food Manufacturer",
  food_importer: "Food Importer",
  food_exporter: "Food Exporter",
  food_service: "Food Service",
  retailer: "Retailer",
  distributor: "Distributor",
  pharmaceutical: "Pharmaceuticals",
  other: "Other",
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  food:       { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  cosmetics:  { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  pharma:     { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  logistics:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  restaurant: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  mfg:        { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  slaughter:  { bg: "#fefce8", color: "#854d0e", border: "#fef08a" },
  others:     { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
}

function catStyle(key: string) {
  return CATEGORY_COLORS[key] ?? { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" }
}

function companyToProfile(c: Company): Profile {
  return {
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
  }
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  try { return value ? { ...fallback, ...JSON.parse(value) } : fallback } catch { return fallback }
}

function apiFactoryToLocal(f: ApiFactory): Factory {
  const extra = parseJson(f.notes, {
    lat: "",
    lng: "",
    prodLines: "",
    prodVolume: "",
    volUnit: "",
    activityCategories: [] as string[],
    specificActivities: [] as string[],
    certUploads: [] as CertUpload[],
    photo: "",
  })
  return {
    id: f.id,
    name: f.name,
    country: f.country || "",
    city: f.city || "",
    address: f.address || "",
    lat: extra.lat,
    lng: extra.lng,
    prodLines: extra.prodLines,
    prodVolume: extra.prodVolume,
    volUnit: extra.volUnit,
    activityCategories: extra.activityCategories,
    specificActivities: extra.specificActivities,
    certUploads: extra.certUploads,
    photo: extra.photo,
  }
}

function apiProductToLocal(p: ApiProduct): StoredProduct {
  return {
    id: p.id,
    catalogKey: p.category || "",
    emoji: "?",
    name: p.name,
    code: p.sku || "",
    barcode: "",
    factoryId: p.factoryId || "",
    ingredients: (p.ingredients || []).map((name, i) => ({ id: `${p.id}-${i}`, name })),
    addedAt: p.createdAt,
  }
}

// ── localStorage loaders ───────────────────────────────────────────────────────
const PROFILE_REQUESTS_KEY = "hcs_profile_change_requests"

function loadRequests(company?: Company): ChangeRequest[] {
  try {
    const requests = JSON.parse(localStorage.getItem(PROFILE_REQUESTS_KEY) || "[]") as ChangeRequest[]
    if (!company) return requests
    return requests.filter(r => r.companyId === company.id || (!r.companyId && r.companyName === company.name))
  } catch { return [] }
}
function categoriesFromCompany(company?: Company): string[] {
  if (!company) return []
  const parsed = parseJson(company.specificActivities, [] as string[])
  if (parsed.length > 0) return parsed
  return company.activityCategory ? [company.activityCategory.toLowerCase()] : []
}
function activitiesFromCompany(company?: Company): string[] {
  if (!company?.specificActivities) return []
  return parseJson(company.specificActivities, [] as string[])
}
function docsFromCompany(company?: Company): RegistrationDocs {
  if (!company) return {}
  return {
    licenseNo: company.licenseNo || company.registrationNumber || "",
    licenseExpiry: company.licenseExpiry || "",
    issuingAuth: company.issuingAuthority || "",
    licenseFileName: company.licenseFileName || "",
    licenseFileSize: company.licenseFileSize || 0,
    licenseFileData: company.licenseFileData || "",
    vatNo: company.vatNo || "",
    sstNo: company.sstNo || "",
    vatFileName: company.vatFileName || "",
    vatFileSize: company.vatFileSize || 0,
    vatFileData: company.vatFileData || "",
  }
}
function loadCerts(): LocalGeneratedCertificate[] {
  try { return JSON.parse(localStorage.getItem("hcs_gen_certs") || "[]") }
  catch { return [] }
}
function asCoord(lat?: string, lng?: string): { lat: string; lng: string } | null {
  const latNum = Number(lat)
  const lngNum = Number(lng)
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return null
  return { lat: String(lat), lng: String(lng) }
}
function loadOfficeLoc(company?: Company): { lat: string; lng: string } | null {
  return asCoord(company?.latitude, company?.longitude)
}

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return iso }
}
const fmtDt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch { return iso }
}

// ── Helper components ──────────────────────────────────────────────────────────
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
      {icon}
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>{label}</span>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>{label}</span>
      <span style={{ fontSize: "0.825rem", color: value ? "#0f172a" : "#cbd5e1", fontFamily: F }}>{value || "—"}</span>
    </div>
  )
}

function Badge({ children, bg = "#f1f5f9", color = "#475569", border = "#e2e8f0" }: {
  children: React.ReactNode; bg?: string; color?: string; border?: string
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, background: bg, color, border: `1px solid ${border}`, fontSize: "0.7rem", fontWeight: 600, fontFamily: F, whiteSpace: "nowrap" as const }}>
      {children}
    </span>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  if (s === "APPROVED" || s === "ACTIVE" || s === "ISSUED" || s === "CERTIFIED" || s === "CERTIFICATE_ISSUED") {
    return <Badge bg="#dcfce7" color="#15803d" border="#bbf7d0"><CheckCircle size={10} />{status}</Badge>
  }
  if (s === "REJECTED" || s === "EXPIRED" || s === "REVOKED") {
    return <Badge bg="#fee2e2" color="#dc2626" border="#fecaca"><XCircle size={10} />{status}</Badge>
  }
  if (s === "PENDING") {
    return <Badge bg="#fffbeb" color="#92400e" border="#fde68a"><Clock size={10} />{status}</Badge>
  }
  return <Badge><Tag size={10} />{status || "—"}</Badge>
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#475569", fontFamily: F }}>{message}</p>
    </div>
  )
}

// ── Certificate viewer overlay ─────────────────────────────────────────────────
function LocationMapPanel({ points, profile }: { points: LocationPoint[]; profile: Profile }) {
  const validPoints = points.filter(p => asCoord(p.lat, p.lng))
  const center = validPoints[0] ?? { lat: "3.1390", lng: "101.6869" }
  const mapHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body,#map{height:100%;margin:0;font-family:Inter,Arial,sans-serif}
    .leaflet-popup-content{font-size:12px;line-height:1.35}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var points = ${JSON.stringify(validPoints)};
    var map = L.map('map', { zoomControl: true }).setView([${Number(center.lat)}, ${Number(center.lng)}], points.length > 1 ? 8 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    var markers = points.map(function(p) {
      var marker = L.marker([Number(p.lat), Number(p.lng)]).addTo(map);
      marker.bindPopup('<strong>' + p.label + '</strong><br/>' + (p.type === 'company' ? 'Company location' : 'Factory location') + (p.address ? '<br/>' + p.address : ''));
      return marker;
    });
    if (markers.length > 1) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25));
  </script>
</body>
</html>`

  return (
    <div style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column" as const, minHeight: 420 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <SectionTitle icon={<MapPin size={13} color="#2563eb" />} label="Locations" />
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: -6 }}>
          <MapPin size={10} color="#94a3b8" />
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: F }}>
            {[profile.city, profile.country].filter(Boolean).join(", ") || "Company and factory map"}
          </span>
        </div>
      </div>

      {validPoints.length > 0 ? (
        <iframe
          srcDoc={mapHtml}
          style={{ width: "100%", flex: 1, border: "none", display: "block", minHeight: 280 }}
          title="Company and factory locations"
        />
      ) : (
        <div style={{ minHeight: 280, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600, fontFamily: F }}>
          No coordinates saved yet
        </div>
      )}

      <div style={{ padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column" as const, gap: 7, maxHeight: 150, overflowY: "auto" as const }}>
        {validPoints.length > 0 ? validPoints.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: p.type === "company" ? "#2563eb" : "#16a34a", flexShrink: 0 }} />
                <span style={{ fontSize: "0.74rem", color: "#0f172a", fontWeight: 700, fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.label}</span>
              </div>
              {p.address && <div style={{ marginLeft: 14, fontSize: "0.68rem", color: "#64748b", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.address}</div>}
            </div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontFamily: "monospace", flexShrink: 0 }}>{p.lat}, {p.lng}</span>
          </div>
        )) : (
          <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: F }}>Ask the customer to save office and factory map pins from their portal.</span>
        )}
      </div>
    </div>
  )
}

function CertViewer({ src, name, onClose }: { src: string; name?: string; onClose: () => void }) {
  const isImage = src.startsWith("data:image")
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}
    >
      {/* toolbar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "92vw", maxWidth: 1100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0f172a", borderRadius: "12px 12px 0 0" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={16} color="#94a3b8" />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0", fontFamily: F }}>{name || "Certificate"}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={src}
            download={name || "certificate"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 7, background: "#1e3a8a", color: "#93c5fd", border: "1px solid #1d4ed8", fontSize: "0.75rem", fontWeight: 600, fontFamily: F, textDecoration: "none" }}
          >
            Download
          </a>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 7, background: "#1e293b", border: "1px solid #334155", cursor: "pointer" }}
          >
            <XIcon size={15} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* content */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "92vw", maxWidth: 1100, height: "82vh", background: "#fff", borderRadius: "0 0 12px 12px", overflow: "hidden" }}
      >
        {isImage ? (
          <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <iframe src={src} style={{ width: "100%", height: "100%", border: "none" }} title={name} />
        )}
      </div>
    </div>
  )
}

// ── Tab types ──────────────────────────────────────────────────────────────────
type Tab = "overview" | "factories" | "certificates"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",     label: "Overview",            icon: <Building2 size={13} /> },
  { id: "factories",    label: "Factories & Products", icon: <Factory size={13} /> },
  { id: "certificates", label: "Certificates",        icon: <Award size={13} /> },
]

// ── Document preview modal ─────────────────────────────────────────────────────
function DocPreviewModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  const isPdf = src.startsWith("data:application/pdf") || name.toLowerCase().endsWith(".pdf")
  const isImg = /data:image\//i.test(src) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name)

  function handleDownload() {
    const a = document.createElement("a")
    a.href = src
    a.download = name || "document"
    a.click()
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 24px 80px rgba(0,0,0,0.3)", width:"100%", maxWidth:820, maxHeight:"90vh", display:"flex", flexDirection:"column" as const, overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #e9ecef", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <FileText size={16} color="#2563eb" />
            <span style={{ fontSize:"0.85rem", fontWeight:700, color:"#0f172a", fontFamily:F }}>{name || "Document"}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={handleDownload} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:F }}>
              <Download size={13} /> Download
            </button>
            <button onClick={onClose} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, background:"#f1f5f9", border:"none", cursor:"pointer", color:"#64748b" }}>
              <XIcon size={16} />
            </button>
          </div>
        </div>
        {/* body */}
        <div style={{ flex:1, overflow:"auto", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          {isPdf
            ? <iframe src={src} style={{ width:"100%", height:"70vh", border:"none", borderRadius:8 }} title={name} />
            : isImg
              ? <img src={src} alt={name} style={{ maxWidth:"100%", maxHeight:"70vh", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.12)" }} />
              : <div style={{ textAlign:"center", padding:40 }}>
                  <FileText size={48} color="#cbd5e1" style={{ marginBottom:12 }} />
                  <p style={{ margin:"0 0 16px", fontSize:"0.85rem", color:"#64748b", fontFamily:F }}>Preview not available for this file type.</p>
                  <button onClick={handleDownload} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.82rem", fontWeight:600, fontFamily:F }}>
                    <Download size={14} /> Download to view
                  </button>
                </div>
          }
        </div>
      </div>
    </div>
  )
}

// ── Tab panels ─────────────────────────────────────────────────────────────────

function OverviewTab({ profile, categories, activities, description, officeLoc, factories, docs, requests }: {
  profile: Profile | null
  categories: string[]
  activities: string[]
  description: string
  officeLoc: { lat: string; lng: string } | null
  factories: Factory[]
  docs: RegistrationDocs
  requests: ChangeRequest[]
}) {
  const [docPreview, setDocPreview] = useState<{ src: string; name: string } | null>(null)

  if (!profile) {
    return <EmptyState icon={<Building2 size={22} color="#cbd5e1" />} message="No customer profile found" />
  }

  const locationPoints: LocationPoint[] = [
    ...(officeLoc ? [{
      id: "company-location",
      label: profile.companyName || "Company",
      type: "company" as const,
      lat: officeLoc.lat,
      lng: officeLoc.lng,
      address: [profile.address1, profile.city, profile.country].filter(Boolean).join(", "),
    }] : []),
    ...factories
      .filter(f => asCoord(f.lat, f.lng))
      .map(f => ({
        id: f.id,
        label: f.name || "Factory",
        type: "factory" as const,
        lat: f.lat,
        lng: f.lng,
        address: [f.address, f.city, f.country].filter(Boolean).join(", "),
      })),
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>

      {/* ── Top row: info left / map right ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(380px, 0.85fr)", gap: 14, alignItems: "stretch" }}>

        {/* Left — all profile info */}
        <div style={CARD}>
          <SectionTitle icon={<Building2 size={13} color="#2563eb" />} label="Company Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <FieldRow label="Company Name" value={profile.companyName} />
            <FieldRow label="Email" value={profile.email} />
            <FieldRow label="Phone" value={profile.phone} />
            <FieldRow label="Website" value={profile.website} />
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
          <SectionTitle icon={<User size={13} color="#2563eb" />} label="Contact Person" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <FieldRow label="Contact Person" value={profile.contactName} />
            <FieldRow label="Designation" value={profile.designation} />
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
          <SectionTitle icon={<MapPin size={13} color="#2563eb" />} label="Address" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            {profile.address1 && <div style={{ gridColumn: "1 / -1" }}><FieldRow label="Address Line 1" value={profile.address1} /></div>}
            {profile.address2 && <div style={{ gridColumn: "1 / -1" }}><FieldRow label="Address Line 2" value={profile.address2} /></div>}
            <FieldRow label="City" value={profile.city} />
            <FieldRow label="State / Province" value={profile.state} />
            <FieldRow label="Postcode" value={profile.postcode} />
            <FieldRow label="Country" value={profile.country} />
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
          <SectionTitle icon={<Layers size={13} color="#2563eb" />} label="Business Description" />
          {description
            ? <p style={{ margin: 0, fontSize: "0.825rem", color: "#334155", lineHeight: 1.7, fontFamily: F }}>{description}</p>
            : <p style={{ margin: 0, fontSize: "0.8rem", color: "#cbd5e1", fontStyle: "italic", fontFamily: F }}>No description provided.</p>
          }
        </div>

        {/* Right — map */}
        {false && officeLoc && (
          <div style={{ background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <SectionTitle icon={<MapPin size={13} color="#2563eb" />} label="Office Location" />
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: -6 }}>
                <MapPin size={10} color="#94a3b8" />
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: F }}>
                  {[profile!.city, profile!.country].filter(Boolean).join(", ") || "Location set"}
                </span>
              </div>
            </div>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${+officeLoc!.lng - 0.08},${+officeLoc!.lat - 0.06},${+officeLoc!.lng + 0.08},${+officeLoc!.lat + 0.06}&layer=mapnik&marker=${officeLoc!.lat},${officeLoc!.lng}`}
              style={{ width: "100%", flex: 1, border: "none", display: "block", minHeight: 200 }}
              title="Office location"
            />
            <div style={{ padding: "8px 16px", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace" }}>{officeLoc!.lat}, {officeLoc!.lng}</span>
            </div>
          </div>
        )}
        <LocationMapPanel points={locationPoints} profile={profile} />
      </div>

      {/* ── Business Profile (categories / activities) ── */}
      {(categories.length > 0 || activities.length > 0) && (
        <div style={CARD}>
          <SectionTitle icon={<Layers size={13} color="#2563eb" />} label="Business Profile" />

          {categories.length > 0 && (
            <div style={{ marginBottom: activities.length > 0 ? 12 : 0 }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Business Categories</p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {categories.map(key => {
                  const s = catStyle(key)
                  return <Badge key={key} bg={s.bg} color={s.color} border={s.border}><Tag size={10} />{CATEGORY_LABELS[key] ?? key}</Badge>
                })}
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Specific Activities</p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {activities.map(key => (
                  <span key={key} style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.7rem", fontFamily: F }}>{key}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Registration Documents ── */}
      {(() => {
        const fmtSize = (b: number) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

        const DocIcon = ({ fileData, fileName }: { fileData?: string; fileName?: string }) => {
          if (!fileData) return <span style={{ fontSize:"0.68rem", color:"#cbd5e1", fontFamily:F }}>No file uploaded</span>
          const isPdf = fileData.startsWith("data:application/pdf") || (fileName || "").toLowerCase().endsWith(".pdf")
          return (
            <button
              onClick={() => setDocPreview({ src: fileData, name: fileName || "document" })}
              style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:7, background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", fontSize:"0.72rem", fontWeight:600, cursor:"pointer", fontFamily:F }}
              onMouseOver={e => (e.currentTarget.style.background = "#dbeafe")}
              onMouseOut={e => (e.currentTarget.style.background = "#eff6ff")}
            >
              {isPdf ? <FileText size={12} /> : <Eye size={12} />}
              View file
            </button>
          )
        }

        return (
          <div style={CARD}>
            <SectionTitle icon={<FileText size={13} color="#2563eb" />} label="Registration Documents" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* License */}
              <div style={{ padding:"12px 14px", borderRadius:9, background:"#f8fafc", border:"1px solid #e9ecef" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <FileText size={14} color="#2563eb" />
                    </div>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#374151", textTransform:"uppercase" as const, letterSpacing:"0.06em", fontFamily:F }}>Business License</span>
                  </div>
                  <DocIcon fileData={docs.licenseFileData || undefined} fileName={docs.licenseFileName} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px" }}>
                  {[
                    { l:"License No.", v: docs.licenseNo },
                    { l:"Expiry",      v: docs.licenseExpiry },
                    { l:"Issuing Authority", v: docs.issuingAuth },
                    { l:"File", v: docs.licenseFileName ? `${docs.licenseFileName} (${fmtSize(docs.licenseFileSize || 0)})` : "" },
                  ].map(r => (
                    <div key={r.l}>
                      <div style={{ fontSize:"0.62rem", color:"#94a3b8", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em", fontFamily:F }}>{r.l}</div>
                      <div style={{ fontSize:"0.78rem", color: r.v ? "#0f172a" : "#cbd5e1", fontWeight:500, marginTop:1, fontFamily:F }}>{r.v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* VAT */}
              <div style={{ padding:"12px 14px", borderRadius:9, background:"#f8fafc", border:"1px solid #e9ecef" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <FileText size={14} color="#16a34a" />
                    </div>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#374151", textTransform:"uppercase" as const, letterSpacing:"0.06em", fontFamily:F }}>VAT / SST</span>
                  </div>
                  <DocIcon fileData={docs.vatFileData || undefined} fileName={docs.vatFileName} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px" }}>
                  {[
                    { l:"VAT / CIF No.", v: docs.vatNo },
                    { l:"SST No.",       v: docs.sstNo },
                    { l:"File", v: docs.vatFileName ? `${docs.vatFileName} (${fmtSize(docs.vatFileSize || 0)})` : "" },
                  ].map(r => (
                    <div key={r.l}>
                      <div style={{ fontSize:"0.62rem", color:"#94a3b8", fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em", fontFamily:F }}>{r.l}</div>
                      <div style={{ fontSize:"0.78rem", color: r.v ? "#0f172a" : "#cbd5e1", fontWeight:500, marginTop:1, fontFamily:F }}>{r.v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Document preview modal */}
      {docPreview && <DocPreviewModal src={docPreview.src} name={docPreview.name} onClose={() => setDocPreview(null)} />}

      {/* ── Profile History ── */}
      {requests.length > 0 && (
        <div style={CARD}>
          <SectionTitle icon={<Clock size={13} color="#2563eb" />} label="Profile History" />
          <HistoryTab requests={requests} />
        </div>
      )}
    </div>
  )
}

function FactoriesAndProductsTab({ factories, products, onViewCert }: {
  factories: Factory[]; products: StoredProduct[]; onViewCert: (src: string, name?: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string>(factories[0]?.id ?? "")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [mapFactory, setMapFactory] = useState<Factory | null>(null)

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  if (factories.length === 0) {
    return <EmptyState icon={<Factory size={22} color="#cbd5e1" />} message="No factories registered" />
  }

  const visibleProducts = selectedId ? products.filter(p => p.factoryId === selectedId) : []
  const selectedFactory = factories.find(f => f.id === selectedId)

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>

      {/* ── Factory cards grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {factories.map(f => {
          const isSelected = selectedId === f.id
          const prodCount = products.filter(p => p.factoryId === f.id).length
          const hasMap = f.lat && f.lng && !isNaN(+f.lat) && !isNaN(+f.lng)
          return (
            <div key={f.id}
              onClick={() => setSelectedId(f.id)}
              style={{
                background: "#fff", border: `2px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                boxShadow: isSelected ? "0 4px 20px rgba(37,99,235,0.18)" : "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                transition: "border-color 0.15s,box-shadow 0.15s", position: "relative" as const,
              }}
              onMouseOver={e => { if (!isSelected) e.currentTarget.style.borderColor = "#bfdbfe" }}
              onMouseOut={e => { if (!isSelected) e.currentTarget.style.borderColor = "#e2e8f0" }}
            >
              {isSelected && (
                <div style={{ position: "absolute", top: 10, left: 10, width: 8, height: 8, borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 0 3px rgba(37,99,235,0.2)" }} />
              )}

              {/* Map icon button */}
              {hasMap && (
                <button
                  onClick={e => { e.stopPropagation(); setMapFactory(f) }}
                  title="View on map"
                  style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#dbeafe" }}
                  onMouseOut={e => { e.currentTarget.style.background = "#eff6ff" }}
                >
                  <Map size={13} color="#2563eb" />
                </button>
              )}

              {/* Factory identity */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
                  {f.photo
                    ? <img src={f.photo} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Factory size={26} color="#2563eb" strokeWidth={1.5} />
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.2, paddingRight: hasMap ? 36 : 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: F }}>{f.name || "Unnamed Factory"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4, fontFamily: F }}>
                    <MapPin size={10} color="#94a3b8" />
                    {[f.city, f.country].filter(Boolean).join(", ") || "Location not set"}
                  </div>
                </div>
              </div>

              {/* Production stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <Layers size={11} color="#2563eb" />
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Prod. Lines</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", fontFamily: F }}>{f.prodLines || "0"}</div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <TrendingUp size={11} color="#16a34a" />
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", fontFamily: F }}>Volume</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", fontFamily: F }}>
                    {f.prodVolume || "0"} <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 400, fontFamily: F }}>{f.volUnit}</span>
                  </div>
                </div>
              </div>

              {/* Product count */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Package size={11} color={isSelected ? "#2563eb" : "#94a3b8"} />
                <span style={{ fontSize: "0.72rem", color: isSelected ? "#2563eb" : "#94a3b8", fontWeight: isSelected ? 600 : 400, fontFamily: F }}>
                  {prodCount} product{prodCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Factory map popup ── */}
      {mapFactory && (
        <div
          onClick={() => setMapFactory(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, overflow: "hidden", width: "min(90vw, 620px)", boxShadow: "0 24px 80px rgba(0,0,0,0.28)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Map size={14} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>{mapFactory.name || "Factory"}</div>
                  {(mapFactory.city || mapFactory.country) && (
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: F, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} color="#94a3b8" />
                      {[mapFactory.city, mapFactory.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMapFactory(null)}
                style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <XIcon size={14} color="#64748b" />
              </button>
            </div>

            {/* Map */}
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${+mapFactory.lng - 0.1},${+mapFactory.lat - 0.07},${+mapFactory.lng + 0.1},${+mapFactory.lat + 0.07}&layer=mapnik&marker=${mapFactory.lat},${mapFactory.lng}`}
              style={{ width: "100%", height: 360, border: "none", display: "block" }}
              title={`${mapFactory.name || "Factory"} location`}
            />

            {/* Footer */}
            {mapFactory.address && (
              <div style={{ padding: "10px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={11} color="#94a3b8" />
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>{mapFactory.address}</span>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace", marginLeft: "auto" }}>{mapFactory.lat}, {mapFactory.lng}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Products section ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={15} color="#2563eb" />
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", fontFamily: F }}>Products</span>
            {selectedFactory && (
              <>
                <span style={{ color: "#cbd5e1" }}>—</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Factory size={13} color="#2563eb" />
                  <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", fontFamily: F }}>{selectedFactory.name}</span>
                </div>
                <span style={{ fontSize: "0.7rem", padding: "1px 8px", borderRadius: 10, background: "#eff6ff", color: "#2563eb", fontWeight: 600, fontFamily: F }}>{visibleProducts.length}</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedId ? (
          <div style={{ textAlign: "center", padding: "52px 20px" }}>
            <Factory size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.9rem", color: "#111827", fontFamily: F }}>No factory selected</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontFamily: F }}>Select a factory above to view its products</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "52px 20px" }}>
            <Package size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.9rem", color: "#111827", fontFamily: F }}>No products yet</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontFamily: F }}>No products registered at {selectedFactory?.name}</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
            <colgroup>
              <col style={{ width: "28%" }} /><col style={{ width: "17%" }} /><col style={{ width: "13%" }} />
              <col style={{ width: "22%" }} /><col style={{ width: "10%" }} /><col />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "2px solid #e9ecef", background: "#fafbfc" }}>
                {["Product & Details", "Barcode / SKU", "Ingredients", "Ingredient Certificates", "Added", ""].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left" as const, fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, fontFamily: F }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map(p => {
                const ingTotal = p.ingredients.length
                const certifiedCount = p.ingredients.filter(i => i.certFile).length
                const halalPct = ingTotal > 0 ? Math.round(certifiedCount / ingTotal * 100) : 0
                const isExpanded = expanded.has(p.id)
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      style={{ borderBottom: isExpanded ? "none" : "1px solid #e9ecef", transition: "background 0.1s" }}
                      onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Product & Details */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0, overflow: "hidden" }}>
                            {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.emoji}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: F }}>{p.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Barcode / SKU */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                          {p.barcode
                            ? <span style={{ fontSize: "0.76rem", fontFamily: "monospace", fontWeight: 600, color: "#0f172a", letterSpacing: "0.03em" }}>{p.barcode}</span>
                            : <span style={{ fontSize: "0.73rem", color: "#cbd5e1", fontFamily: F }}>No barcode</span>
                          }
                          {p.code
                            ? <span style={{ display: "inline-block", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "1px 7px", borderRadius: 5, alignSelf: "flex-start" as const }}>SKU: {p.code}</span>
                            : <span style={{ fontSize: "0.7rem", color: "#cbd5e1", fontFamily: F }}>No SKU</span>
                          }
                        </div>
                      </td>

                      {/* Ingredients count */}
                      <td style={{ padding: "13px 16px" }}>
                        {ingTotal > 0
                          ? <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Layers size={13} color="#94a3b8" />
                              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", fontFamily: F }}>{ingTotal}</span>
                              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: F }}>items</span>
                            </div>
                          : <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontFamily: F }}>—</span>
                        }
                      </td>

                      {/* Certificates Uploaded */}
                      <td style={{ padding: "13px 16px" }}>
                        {ingTotal === 0
                          ? <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontFamily: F }}>—</span>
                          : <div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, fontFamily: F, color: certifiedCount === ingTotal ? "#16a34a" : certifiedCount > 0 ? "#2563eb" : "#94a3b8" }}>
                                  {halalPct}%
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: F }}>{certifiedCount}/{ingTotal} certified</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${halalPct}%`, borderRadius: 99, transition: "width 0.4s ease", background: certifiedCount === ingTotal ? "#16a34a" : "#2563eb" }} />
                              </div>
                            </div>
                        }
                      </td>

                      {/* Added */}
                      <td style={{ padding: "13px 16px", color: "#94a3b8", fontSize: "0.77rem", whiteSpace: "nowrap" as const, fontFamily: F }}>
                        {new Date(p.addedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      {/* Expand toggle */}
                      <td style={{ padding: "13px 16px", textAlign: "right" as const }}>
                        <button
                          onClick={() => toggleExpand(p.id)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb" }}
                          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#94a3b8" }}>
                          <ChevronDown size={12} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded ingredients row */}
                    {isExpanded && (
                      <tr style={{ borderBottom: "1px solid #e9ecef" }}>
                        <td colSpan={6} style={{ padding: "0 20px 16px", background: "#f8fafc" }}>
                          <p style={{ margin: "12px 0 8px", fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: F }}>Ingredients</p>
                          {p.ingredients.length === 0
                            ? <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontFamily: F }}>No ingredients listed</p>
                            : <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                                {p.ingredients.map(ing => (
                                  <div key={ing.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "6px 10px", borderRadius: 7, background: "#fff", border: "1px solid #e9ecef" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#334155", fontFamily: F }}>{ing.name}</span>
                                    {ing.certFile ? (
                                      <button
                                        onClick={() => onViewCert(ing.certFile!, ing.certName)}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "0.7rem", fontWeight: 600, fontFamily: F, whiteSpace: "nowrap" as const, cursor: "pointer" }}>
                                        <ShieldCheck size={10} />View Certificate
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: "0.68rem", color: "#cbd5e1", fontFamily: F }}>No certificate</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                          }
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CertificatesTab({ certs }: { certs: LocalGeneratedCertificate[] }) {
  if (certs.length === 0) {
    return <EmptyState icon={<Award size={22} color="#cbd5e1" />} message="No certificates generated" />
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
      {certs.map(cert => (
        <div key={cert.id} style={CARD}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Award size={18} color="#d97706" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>{cert.certNumber}</p>
                {cert.applicationId && (
                  <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#94a3b8", fontFamily: F }}>App: {cert.applicationId}</p>
                )}
              </div>
            </div>
            <StatusBadge status={cert.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FieldRow label="Issued" value={fmtDate(cert.issuedAt)} />
            <FieldRow label="Valid Until" value={fmtDate(cert.validUntil)} />
            {cert.companyName && <div style={{ gridColumn: "1 / -1" }}><FieldRow label="Company" value={cert.companyName} /></div>}
            {cert.scope && <div style={{ gridColumn: "1 / -1" }}><FieldRow label="Scope" value={cert.scope} /></div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoryTab({ requests }: { requests: ChangeRequest[] }) {
  if (requests.length === 0) {
    return <EmptyState icon={<FileText size={22} color="#cbd5e1" />} message="No change requests submitted" />
  }

  const sorted = [...requests].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const statusColor = (s: string) =>
    s === "APPROVED" ? "#15803d" : s === "REJECTED" ? "#dc2626" : "#92400e"

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: "0.78rem" }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
            {["Submitted", "Field", "Previous Value", "New Value", "Status", "Reviewed By"].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left" as const, fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.flatMap(req =>
            req.changes.map((ch, i) => (
              <tr key={`${req.id}-${ch.field}`} style={{ borderBottom: "1px solid #f1f5f9", background: "#fff" }}
                onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseOut={e  => (e.currentTarget.style.background = "#fff")}>
                <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" as const }}>
                  {i === 0 ? fmtDt(req.submittedAt) : ""}
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#374151" }}>{ch.label}</td>
                <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{ch.oldVal || "—"}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{ch.newVal || "—"}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" as const }}>
                  {i === 0 && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: statusColor(req.status) }}>
                      {req.status}
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" as const }}>
                  {i === 0 && req.reviewedBy ? (
                    <span>
                      {req.reviewedBy}
                      {req.reviewedAt && <span style={{ color: "#94a3b8", marginLeft: 4 }}>· {fmtDt(req.reviewedAt)}</span>}
                    </span>
                  ) : i === 0 ? "—" : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Phone QR code ─────────────────────────────────────────────────────────────
function PhoneQR({ phone }: { phone: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!phone || !canvasRef.current) return
    import("qrcode").then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, `tel:${phone}`, { width: 88, margin: 1, color: { dark: "#0f172a", light: "#edf5ff" } })
    })
  }, [phone])
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
      <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block" }} />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function OfficeCustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [certViewer, setCertViewer] = useState<{ src: string; name?: string } | null>(null)
  const companyQ = useQuery({
    queryKey: ["office", "company", id],
    queryFn: () => getCompany(id!),
    enabled: !!id,
    retry: false,
  })
  const factoriesQ = useQuery({
    queryKey: ["office", "company", id, "factories"],
    queryFn: () => getFactories(id!, 0, 100),
    enabled: !!id && !!companyQ.data,
    retry: false,
  })
  const productsQ = useQuery({
    queryKey: ["office", "company", id, "products"],
    queryFn: () => getProducts(id!, 0, 100),
    enabled: !!id && !!companyQ.data,
    retry: false,
  })

  // Load all data once
  const profile      = companyQ.data ? companyToProfile(companyQ.data) : null
  const requests     = loadRequests(companyQ.data)
  const factories    = (factoriesQ.data?.content ?? []).map(apiFactoryToLocal)
  const products     = (productsQ.data?.content ?? []).map(apiProductToLocal)
  const categories   = categoriesFromCompany(companyQ.data)
  const activities   = activitiesFromCompany(companyQ.data)
  const description  = companyQ.data?.description || ""
  const docs         = docsFromCompany(companyQ.data)
  const certs        = loadCerts()
  const officeLoc    = loadOfficeLoc(companyQ.data)
  const databaseLoading = companyQ.isLoading || factoriesQ.isLoading || productsQ.isLoading
  const databaseError = companyQ.isError

  const AVATAR_COLORS = ["#0f2170","#0e7490","#6d28d9","#b45309","#065f46","#9f1239","#1d4ed8"]
  const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 65) % AVATAR_COLORS.length]

  return (
    <OfficeLayout title="Customer Detail">
      <div style={{ fontFamily: F, padding: "0 0 24px" }}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 0, flexWrap: "wrap" as const }}>
          {/* Back + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => navigate("/office/customers")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseOut={e => (e.currentTarget.style.background = "#fff")}
            >
              <ArrowLeft size={14} />Back to Customers
            </button>

            {profile && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: avatarColor(profile.companyName), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                  {(profile.companyName || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                    <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>{profile.companyName}</h1>
                    {profile.clientId && (
                      <span style={{ fontSize: "0.68rem", fontFamily: "monospace", padding: "2px 8px", borderRadius: 5, background: "#f1f5f9", color: "#334155", fontWeight: 700, border: "1px solid #e2e8f0", letterSpacing: "0.04em" }}>
                        {profile.clientId}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap" as const }}>
                    {profile.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={11} color="#94a3b8" />
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={11} color="#94a3b8" />
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>{profile.phone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Globe size={11} color="#94a3b8" />
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>{profile.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!profile && (
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>Customer Detail</h1>
            )}
          </div>

          {/* QR code — scan to dial */}
          {profile?.phone && <PhoneQR phone={profile.phone} />}
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: "1px solid #e9ecef", marginBottom: 20, marginTop: -16 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  background: "transparent",
                  color: isActive ? "#0f2170" : "#64748b",
                  fontSize: "0.82rem", fontWeight: isActive ? 700 : 500,
                  fontFamily: F, transition: "color 0.15s",
                  borderBottom: isActive ? "2.5px solid #0f2170" : "2.5px solid transparent",
                  marginBottom: -1, whiteSpace: "nowrap" as const,
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.color = "#1e293b" }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.color = "#64748b" }}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        {databaseLoading && (
          <EmptyState icon={<RefreshCw size={22} color="#94a3b8" />} message="Loading customer from database..." />
        )}
        {!databaseLoading && databaseError && (
          <EmptyState icon={<Building2 size={22} color="#cbd5e1" />} message="Customer not found in database" />
        )}
        {!databaseLoading && !databaseError && activeTab === "overview" && (
          <OverviewTab
            profile={profile}
            categories={categories}
            activities={activities}
            description={description}
            officeLoc={officeLoc}
            factories={factories}
            docs={docs}
            requests={requests}
          />
        )}
        {!databaseLoading && !databaseError && activeTab === "factories" && (
          <FactoriesAndProductsTab factories={factories} products={products} onViewCert={(src, name) => setCertViewer({ src, name })} />
        )}
        {!databaseLoading && !databaseError && activeTab === "certificates" && (
          <CertificatesTab certs={certs} />
        )}

      </div>

      {certViewer && (
        <CertViewer src={certViewer.src} name={certViewer.name} onClose={() => setCertViewer(null)} />
      )}
    </OfficeLayout>
  )
}

