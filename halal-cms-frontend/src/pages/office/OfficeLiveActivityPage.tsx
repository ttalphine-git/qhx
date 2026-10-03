import { useEffect, useState } from "react"
import { Users, Clock, LogOut, Eye } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getCustomerActivities, isLiveActivityEnabled, setLiveActivityEnabled, type CustomerActivity } from "@/lib/liveActivity"

const F = "'Inter', system-ui, sans-serif"
const BLUE = "#2563eb"
const NAV = "#0f2170"

export default function OfficeLiveActivityPage() {
  const [activities, setActivities] = useState<CustomerActivity[]>([])
  const [enabled, setEnabled] = useState(isLiveActivityEnabled())
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(getCustomerActivities())
      setLastUpdate(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleToggle = () => {
    const newState = !enabled
    setEnabled(newState)
    setLiveActivityEnabled(newState)
  }

  const getPageLabel = (page: string) => {
    const labels: Record<string, string> = {
      "/customer/dashboard": "Dashboard",
      "/customer/applications": "My Applications",
      "/customer/factories": "My Factories",
      "/customer/batch-certificates": "Batch Certificates",
      "/customer/apply": "Apply for Certificate",
    }
    return labels[page] || page
  }

  return (
    <OfficeLayout>
      <div style={{ fontFamily: F, padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                Live Customer Activity
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                Monitor online customers and their activities in real-time
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={handleToggle}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Online Now</p>
                  <p style={{ margin: "2px 0 0", fontSize: "1.5rem", fontWeight: 800, color: NAV }}>{activities.length}</p>
                </div>
              </div>
            </div>

            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Last Update</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
                    {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!enabled && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: 14, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
              Live activity tracking is disabled. Enable it above to see customer activities in real-time.
            </p>
          </div>
        )}

        {/* Activities Table */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {activities.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <Eye size={40} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
                {enabled ? "No customers online" : "Tracking disabled"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>
                {enabled ? "Live activity will appear here when customers are using the system" : "Enable tracking to monitor customer activities"}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Customer
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Company
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Current Activity
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Last Active
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const lastActive = new Date(activity.lastActiveAt)
                    const timeAgo = Math.floor((Date.now() - lastActive.getTime()) / 1000)
                    const timeLabel =
                      timeAgo < 60 ? "Just now" : timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` : `${Math.floor(timeAgo / 3600)}h ago`

                    return (
                      <tr key={activity.customerId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                          {activity.customerName}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#6b7280" }}>
                          {activity.companyName}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#6b7280" }}>
                          {getPageLabel(activity.currentPage)}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "#6b7280" }}>
                          {timeLabel}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 12px",
                              borderRadius: 20,
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#15803d" }} />
                            Online
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ marginTop: 20, padding: 16, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#15803d", fontWeight: 600 }}>
            ℹ️ Updates every 5 seconds. Customers marked as offline after 2 minutes of inactivity.
          </p>
        </div>
      </div>
    </OfficeLayout>
  )
}
