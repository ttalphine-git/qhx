import { Building2, MapPin, Navigation, Search, ShieldCheck } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { C } from "@/lib/utils"

const F = "'Inter', system-ui, sans-serif"

const markers = [
  { city: "Amsterdam", country: "Netherlands", x: 49, y: 35, status: "Active", count: 6, color: "#2563eb" },
  { city: "Dubai", country: "United Arab Emirates", x: 59, y: 50, status: "Audit", count: 3, color: "#f59e0b" },
  { city: "Kuala Lumpur", country: "Malaysia", x: 73, y: 65, status: "Certified", count: 8, color: "#16a34a" },
  { city: "Jakarta", country: "Indonesia", x: 75, y: 72, status: "Pending", count: 4, color: "#ea580c" },
  { city: "Chicago", country: "United States", x: 25, y: 42, status: "Review", count: 2, color: "#7c3aed" },
  { city: "Cape Town", country: "South Africa", x: 52, y: 80, status: "Active", count: 1, color: "#0ea5e9" },
]

export default function OfficeMapViewPage() {
  return (
    <OfficeLayout title="Map View">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: F }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <section style={{ position: "relative", minHeight: 560, border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff", overflow: "hidden", boxShadow: C.cardShadow }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#f8fbff 0%,#eef6ff 100%)" }} />
            <svg viewBox="0 0 1000 520" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <path d="M112 170 C170 115 250 112 300 158 C337 192 326 250 267 257 C206 265 169 231 110 244 C75 252 50 226 64 196 C72 181 91 180 112 170Z" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2" />
              <path d="M430 142 C492 100 594 111 648 157 C702 203 681 276 614 288 C564 298 542 261 494 279 C442 298 386 268 376 220 C369 187 391 166 430 142Z" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2" />
              <path d="M573 287 C622 302 642 352 620 414 C600 470 544 486 500 446 C459 409 475 335 520 300 C535 288 552 283 573 287Z" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2" />
              <path d="M686 181 C755 141 872 161 925 225 C958 265 930 315 879 307 C829 299 805 263 756 282 C697 305 642 258 655 213 C660 198 671 189 686 181Z" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2" />
              <path d="M809 350 C850 336 898 359 914 399 C930 438 897 465 853 455 C816 446 787 410 795 378 C798 365 803 356 809 350Z" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2" />
            </svg>

            {markers.map(marker => (
              <div key={`${marker.city}-${marker.country}`} style={{ position: "absolute", left: `${marker.x}%`, top: `${marker.y}%`, transform: "translate(-50%, -50%)" }}>
                <div style={{ position: "absolute", inset: -10, borderRadius: 999, background: marker.color, opacity: 0.13 }} />
                <div style={{ position: "relative", width: 30, height: 30, borderRadius: 999, background: marker.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(15,23,42,0.22)", border: "3px solid #fff" }}>
                  <MapPin size={15} color="#fff" fill="#fff" />
                </div>
                <div style={{ position: "absolute", left: 20, top: -8, minWidth: 132, padding: "7px 9px", borderRadius: 9, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 22px rgba(15,23,42,0.12)" }}>
                  <p style={{ margin: 0, fontSize: "0.73rem", fontWeight: 800, color: C.textDark }}>{marker.city}</p>
                  <p style={{ margin: "1px 0 0", fontSize: "0.63rem", color: C.muted }}>{marker.country} - {marker.count} facilities</p>
                </div>
              </div>
            ))}
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
