import { useEffect, useRef } from "react"
import { Building2, MapPin, Navigation, Search, ShieldCheck } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { C } from "@/lib/utils"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const F = "'Inter', system-ui, sans-serif"

const markers = [
  { city: "Amsterdam", country: "Netherlands", lat: 52.37, lng: 4.89, status: "Active", count: 6, color: "#2563eb" },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.20, lng: 55.27, status: "Audit", count: 3, color: "#f59e0b" },
  { city: "Kuala Lumpur", country: "Malaysia", lat: 3.14, lng: 101.69, status: "Certified", count: 8, color: "#16a34a" },
  { city: "Jakarta", country: "Indonesia", lat: -6.20, lng: 106.82, status: "Pending", count: 4, color: "#ea580c" },
  { city: "Chicago", country: "United States", lat: 41.88, lng: -87.63, status: "Review", count: 2, color: "#7c3aed" },
  { city: "Cape Town", country: "South Africa", lat: -33.93, lng: 18.42, status: "Active", count: 1, color: "#0ea5e9" },
]

function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || map.current) return

    map.current = L.map(mapRef.current, {
      worldCopyJump: true,
      zoomControl: true,
      attributionControl: true,
    }).setView([18, 35], 2)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map.current)

    markers.forEach(marker => {
      const customIcon = L.divIcon({
        html: `<div style="width: 30px; height: 30px; border-radius: 50%; background: ${marker.color}; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 8px 20px rgba(15,23,42,0.22);"><svg viewBox="0 0 24 24" width="15" height="15" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg></div>`,
        iconSize: [30, 30],
        className: "",
      })

      const popup = L.popup().setContent(
        `<div style="font-family: Inter, system-ui, sans-serif;"><p style="margin: 0; font-size: 0.73rem; font-weight: 800; color: #1e293b;">${marker.city}</p><p style="margin: 3px 0 0; font-size: 0.63rem; color: #94a3b8;">${marker.country} - ${marker.count} facilities</p></div>`
      )

      L.marker([marker.lat, marker.lng], { icon: customIcon })
        .bindPopup(popup)
        .addTo(map.current!)
    })

    const bounds = L.latLngBounds(markers.map(marker => [marker.lat, marker.lng]))
    map.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 3 })

    window.setTimeout(() => {
      map.current?.invalidateSize()
    }, 120)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 0, flex: 1 }}>
      <div ref={mapRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", minHeight: 0 }} />
      <div style={{ position: "absolute", left: 14, top: 14, zIndex: 500, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.94)", border: "1px solid #dbe3ef", boxShadow: "0 8px 24px rgba(15,23,42,0.12)", fontSize: "0.68rem", fontWeight: 800, color: C.primary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: F }}>
        Live OpenStreetMap
      </div>
    </div>
  )
}

export default function OfficeMapViewPage() {
  return (
    <OfficeLayout title="Map View">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: F, height: "100%", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.primary }}>
              Global Certification Map
            </p>
            <h1 style={{ margin: "5px 0 0", fontSize: "1.25rem", fontWeight: 800, color: C.textDark }}>
              Certified Facilities by Region
            </h1>
          </div>
          <div style={{ position: "relative", width: 280 }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search country or facility..."
              style={{ width: "100%", height: 38, border: "1px solid #dbe3ef", borderRadius: 9, padding: "0 12px 0 36px", fontSize: "0.8rem", outline: "none", fontFamily: F }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, minHeight: 0, flex: 1 }}>
          <section style={{ position: "relative", minHeight: 400, border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff", overflow: "hidden", boxShadow: C.cardShadow, display: "flex" }}>
            <MapComponent />
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflowY: "auto" }}>
            <div style={{ padding: 16, border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff", boxShadow: C.cardShadow }}>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800, color: C.textDark }}>Map Summary</p>
              <p style={{ margin: "3px 0 16px", fontSize: "0.72rem", color: C.muted }}>Dummy regional distribution</p>
              {[
                { label: "Mapped Facilities", value: 24, Icon: Building2 },
                { label: "Certified Sites", value: 8, Icon: ShieldCheck },
                { label: "Active Regions", value: 6, Icon: Navigation },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.Icon size={16} color={C.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: C.textDark }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff", boxShadow: C.cardShadow }}>
              <p style={{ margin: "0 0 12px", fontSize: "0.88rem", fontWeight: 800, color: C.textDark }}>Locations</p>
              {markers.map(marker => (
                <div key={marker.city} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderTop: "1px solid #f8fafc" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: marker.color }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.76rem", fontWeight: 700, color: C.textDark }}>{marker.city}</p>
                    <p style={{ margin: 0, fontSize: "0.66rem", color: C.muted }}>{marker.status}</p>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.primary }}>{marker.count}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </OfficeLayout>
  )
}
