import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Building2, ExternalLink, LocateFixed, MapPin, Search } from "lucide-react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import OfficeLayout from "./OfficeLayout"
import { getApplications } from "@/api/applications"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import type { ApplicationResponseDTO } from "@/types"

type AppPayload = {
  factoryId?: string
  factoryName?: string
  snapshotFactories?: Array<{
    id?: string
    name?: string
    address?: string
    city?: string
    country?: string
    lat?: string | number
    lng?: string | number
  }>
}

type MapPoint = {
  id: string
  applicationId: number
  applicationNumber: string
  companyName: string
  status: string
  submittedAt?: string
  factoryName: string
  address: string
  city?: string
  country?: string
  lat: number
  lng: number
}

const DEFAULT_CENTER: [number, number] = [23.4241, 53.8478]

const markerIcon = L.divIcon({
  className: "office-map-pin",
  html: '<span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -28],
})

function parsePayload(app: ApplicationResponseDTO): AppPayload {
  const raw = app.payloadJson
  if (!raw) return {}
  if (typeof raw === "object") return raw as AppPayload
  try {
    return JSON.parse(raw) as AppPayload
  } catch {
    return {}
  }
}

function toNumber(value: unknown) {
  const next = Number.parseFloat(String(value ?? ""))
  return Number.isFinite(next) ? next : null
}

function pointsFromApplication(app: ApplicationResponseDTO): MapPoint[] {
  const payload = parsePayload(app)
  const factories = payload.snapshotFactories ?? []
  const selectedFactories = factories.filter(factory => !payload.factoryId || factory.id === payload.factoryId)
  const source = selectedFactories.length ? selectedFactories : factories

  return source.flatMap((factory, index) => {
    const lat = toNumber(factory.lat)
    const lng = toNumber(factory.lng)
    if (lat == null || lng == null) return []
    return [{
      id: `${app.id}-${factory.id ?? index}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      companyName: app.companyName,
      status: app.status,
      submittedAt: app.submittedAt,
      factoryName: factory.name || payload.factoryName || "Factory",
      address: [factory.address, factory.city, factory.country].filter(Boolean).join(", "),
      city: factory.city,
      country: factory.country || app.country,
      lat,
      lng,
    }]
  })
}

function FitMapToPoints({ points, selected }: { points: MapPoint[]; selected: MapPoint | null }) {
  const map = useMap()

  useEffect(() => {
    if (selected) {
      map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 13), { animate: true })
      return
    }
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 5)
      return
    }
    const bounds = L.latLngBounds(points.map(point => [point.lat, point.lng]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map, points, selected])

  return null
}

export default function OfficeMapViewPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [selectedId, setSelectedId] = useState("")

  const applicationsQ = useQuery({
    queryKey: ["office-map-applications"],
    queryFn: () => getApplications({ page: 0, size: 500 }),
  })

  const applications = applicationsQ.data?.content ?? []
  const points = useMemo(() => applications.flatMap(pointsFromApplication), [applications])
  const statuses = useMemo(() => Array.from(new Set(points.map(point => point.status))).sort(), [points])
  const filteredPoints = useMemo(() => {
    const term = search.trim().toLowerCase()
    return points.filter(point => {
      const matchesStatus = status === "ALL" || point.status === status
      const matchesSearch = !term || [
        point.companyName,
        point.applicationNumber,
        point.factoryName,
        point.address,
        point.country,
      ].some(value => String(value ?? "").toLowerCase().includes(term))
      return matchesStatus && matchesSearch
    })
  }, [points, search, status])
  const selected = filteredPoints.find(point => point.id === selectedId) ?? filteredPoints[0] ?? null

  return (
    <OfficeLayout title="Map View">
      <style>{`
        .office-map-page { display:grid; grid-template-columns: minmax(0, 1fr) 360px; gap:14px; min-height:calc(100vh - 150px); }
        .office-map-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04); }
        .office-map-canvas { height:100%; min-height:620px; }
        .office-map-canvas .leaflet-container { height:100%; min-height:620px; font-family:'Inter',system-ui,sans-serif; }
        .office-map-pin { position:relative; }
        .office-map-pin span { width:24px; height:24px; display:block; background:#2563eb; border:3px solid #fff; border-radius:999px; box-shadow:0 8px 20px rgba(37,99,235,0.35); }
        .office-map-pin span:after { content:""; position:absolute; left:12px; bottom:-2px; width:9px; height:9px; background:#2563eb; transform:rotate(45deg); border-right:3px solid #fff; border-bottom:3px solid #fff; }
        .office-map-list { display:flex; flex-direction:column; max-height:calc(100vh - 150px); }
        .office-map-scroll { overflow:auto; padding:10px; display:flex; flex-direction:column; gap:8px; }
        @media (max-width: 980px) {
          .office-map-page { grid-template-columns:1fr; }
          .office-map-canvas, .office-map-canvas .leaflet-container { min-height:520px; }
          .office-map-list { max-height:none; }
        }
      `}</style>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14 }}>
        <div>
          <button onClick={() => navigate("/office/dashboard")}
            style={{ display:"inline-flex", alignItems:"center", gap:6, border:"none", background:"transparent", color:"#64748b", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, padding:0, marginBottom:8, fontFamily:"inherit" }}>
            <ArrowLeft size={14} />Dashboard
          </button>
          <h1 style={{ margin:0, fontSize:"1.2rem", fontWeight:800, color:"#0f172a" }}>Application Map</h1>
          <p style={{ margin:"3px 0 0", fontSize:"0.78rem", color:"#64748b" }}>Factory locations from submitted customer applications.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <div style={{ position:"relative", width:260 }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company or factory"
              style={{ width:"100%", height:36, padding:"0 12px 0 32px", border:"1px solid #e2e8f0", borderRadius:9, outline:"none", fontSize:"0.78rem", color:"#0f172a", fontFamily:"inherit", boxSizing:"border-box" }} />
          </div>
          <select value={status} onChange={event => setStatus(event.target.value)}
            style={{ height:36, border:"1px solid #e2e8f0", borderRadius:9, background:"#fff", color:"#0f172a", padding:"0 10px", fontSize:"0.78rem", fontWeight:700, fontFamily:"inherit" }}>
            <option value="ALL">All statuses</option>
            {statuses.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="office-map-page">
        <div className="office-map-card office-map-canvas">
          {applicationsQ.isLoading ? (
            <div style={{ height:"100%", minHeight:620, display:"grid", placeItems:"center", color:"#64748b", fontWeight:800 }}>Loading map locations...</div>
          ) : filteredPoints.length === 0 ? (
            <div style={{ height:"100%", minHeight:620, display:"grid", placeItems:"center", textAlign:"center", padding:24 }}>
              <div>
                <MapPin size={32} color="#cbd5e1" style={{ margin:"0 auto 10px" }} />
                <p style={{ margin:0, fontSize:"0.9rem", fontWeight:800, color:"#0f172a" }}>No mapped factories found</p>
                <p style={{ margin:"4px 0 0", fontSize:"0.78rem", color:"#64748b" }}>Ask customers to save factory pins in their portal.</p>
              </div>
            </div>
          ) : (
            <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom className="leaflet-map">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitMapToPoints points={filteredPoints} selected={selected} />
              {filteredPoints.map(point => {
                const statusStyle = getStatusStyle(point.status as any)
                return (
                  <Marker key={point.id} position={[point.lat, point.lng]} icon={markerIcon} eventHandlers={{ click: () => setSelectedId(point.id) }}>
                    <Popup>
                      <div style={{ minWidth:220 }}>
                        <div style={{ fontWeight:800, color:"#0f172a", marginBottom:4 }}>{point.companyName}</div>
                        <div style={{ fontSize:12, color:"#475569", marginBottom:8 }}>{point.factoryName}</div>
                        <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>{point.address || point.country || "Location saved"}</div>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:999, background:statusStyle.bg, color:statusStyle.color, fontSize:11, fontWeight:800 }}>
                          <span style={{ width:6, height:6, borderRadius:99, background:statusStyle.dot }} />
                          {statusStyle.label}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}
        </div>

        <aside className="office-map-card office-map-list">
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div>
              <p style={{ margin:0, fontSize:"0.9rem", fontWeight:800, color:"#0f172a" }}>Mapped Locations</p>
              <p style={{ margin:"2px 0 0", fontSize:"0.7rem", color:"#64748b" }}>{filteredPoints.length} of {points.length} factories</p>
            </div>
            <button onClick={() => setSelectedId("")} title="Fit all locations"
              style={{ width:34, height:34, borderRadius:9, border:"1px solid #e2e8f0", background:"#fff", display:"grid", placeItems:"center", cursor:"pointer", color:C.primary }}>
              <LocateFixed size={15} />
            </button>
          </div>

          <div className="office-map-scroll">
            {applicationsQ.isError && (
              <div style={{ padding:12, border:"1px solid #fecaca", background:"#fef2f2", color:"#b91c1c", borderRadius:10, fontSize:"0.76rem", fontWeight:800 }}>
                Could not load application locations.
              </div>
            )}
            {filteredPoints.map(point => {
              const active = selected?.id === point.id
              const statusStyle = getStatusStyle(point.status as any)
              return (
                <button key={point.id} onClick={() => setSelectedId(point.id)}
                  style={{ textAlign:"left", border:`1px solid ${active ? "#2563eb" : "#e2e8f0"}`, background:active ? "#eff6ff" : "#fff", borderRadius:12, padding:12, cursor:"pointer", fontFamily:"inherit", boxShadow:active ? "0 8px 22px rgba(37,99,235,0.12)" : "none" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:active ? "#2563eb" : "#f1f5f9", display:"grid", placeItems:"center", flexShrink:0 }}>
                      <Building2 size={15} color={active ? "#fff" : "#475569"} />
                    </div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ margin:0, fontSize:"0.8rem", fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{point.companyName}</p>
                      <p style={{ margin:"2px 0 0", fontSize:"0.72rem", fontWeight:700, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{point.factoryName}</p>
                      <p style={{ margin:"4px 0 0", fontSize:"0.68rem", color:"#64748b", lineHeight:1.4 }}>{point.address || point.country || "Location saved"}</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginTop:10 }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 8px", borderRadius:999, background:statusStyle.bg, color:statusStyle.color, fontSize:"0.63rem", fontWeight:800 }}>
                      <span style={{ width:6, height:6, borderRadius:99, background:statusStyle.dot }} />
                      {statusStyle.label}
                    </span>
                    <span style={{ fontSize:"0.66rem", color:"#94a3b8", fontWeight:700 }}>{point.submittedAt ? formatDate(point.submittedAt) : point.applicationNumber}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginTop:8, borderTop:"1px solid #e2e8f0", paddingTop:8 }}>
                    <span style={{ fontSize:"0.66rem", color:"#64748b", fontFamily:"monospace" }}>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:"0.66rem", fontWeight:800, color:"#2563eb" }}>
                      View <ExternalLink size={10} />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </OfficeLayout>
  )
}
