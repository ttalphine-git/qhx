import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Bell, ChevronDown, Factory, FileText, Files, Home, Power, Search, User } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { getNotifications, markRead, markAllRead, clearNotifications, type AppNotification } from "@/lib/notifications"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/customer/dashboard", icon: Home },
  { label: "My Applications", path: "/customer/applications", icon: FileText },
  { label: "Batch Certificates", path: "/customer/batch-certificates", icon: Files },
  { label: "My Factories", path: "/customer/factories", icon: Factory },
]

interface CustomerLayoutProps {
  children: React.ReactNode
  title?: string
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [ref, cb])
}

function BrandMark() {
  return (
    <div style={{ width: 56, height: 56, position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 6, border: "2px solid #bcd7ff", transform: "rotate(45deg)", borderRadius: 8 }} />
      <div style={{ position: "absolute", inset: 11, border: "2px solid #bcd7ff", borderRadius: 8 }} />
      <div style={{ width: 25, height: 25, borderRadius: "50%", border: "2px solid #bcd7ff", boxShadow: "0 0 0 5px rgba(188,215,255,0.14)" }} />
    </div>
  )
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const isAuthorized = !!user && user.role?.toUpperCase?.() === "CUSTOMER"

  const [showUser, setShowUser] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifs, setNotifs] = useState<AppNotification[]>(() => getNotifications("customer"))
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useClickOutside(userRef, () => setShowUser(false))
  useClickOutside(notifRef, () => setShowNotif(false))

  useEffect(() => {
    if (!isAuthorized) navigate("/customer/login", { replace: true })
  }, [isAuthorized, navigate])

  useEffect(() => {
    const refresh = () => setNotifs(getNotifications("customer"))
    window.addEventListener("storage", refresh)
    const id = setInterval(refresh, 3000)
    return () => {
      window.removeEventListener("storage", refresh)
      clearInterval(id)
    }
  }, [])

  if (!isAuthorized) return null

  const unreadCount = notifs.filter((n) => !n.read).length
  const initials = user?.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "C"
  const logout = () => {
    clearAuth()
    navigate("/customer/login")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#edf5ff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ minHeight: 78, padding: "0 clamp(1rem, 4vw, 5rem)", display: "flex", alignItems: "center", gap: "clamp(1rem, 2vw, 2.4rem)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0, background: "linear-gradient(135deg, #0f2170 0%, #12337f 54%, #0b5ed7 100%)", borderBottom: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 30px rgba(15,33,112,0.18)" }}>
        <button onClick={() => navigate("/customer/dashboard")} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}>
          <BrandMark />
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontSize: "1.45rem", fontWeight: 850, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>HalalCMS</span>
            <span style={{ display: "block", fontSize: "0.82rem", color: "rgba(255,255,255,0.78)", marginTop: 3 }}>Customer Portal</span>
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = path === "/customer/dashboard" ? location.pathname === path : location.pathname.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.74rem 1rem", borderRadius: 12, background: active ? "rgba(255,255,255,0.18)" : "transparent", color: "#fff", border: active ? "1px solid rgba(188,215,255,0.42)" : "1px solid transparent", cursor: "pointer", fontSize: "0.86rem", fontWeight: active ? 800 : 650, whiteSpace: "nowrap", boxShadow: active ? "inset 0 -3px 0 #7aaed6, 0 8px 24px rgba(0,0,0,0.08)" : "none" }}
                onMouseOver={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.1)"
                }}
                onMouseOut={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent"
                }}
              >
                <Icon size={17} strokeWidth={2.4} />
                {label}
              </button>
            )
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div className="customer-shell-search" style={{ position: "relative", width: "min(420px, 26vw)", minWidth: 250 }}>
            <Search size={18} style={{ position: "absolute", left: 17, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.9)" }} />
            <input aria-label="Global search" placeholder="Search certificates, applications, factories..." style={{ width: "100%", height: 44, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.16)", color: "#fff", padding: "0 16px 0 46px", fontSize: "0.86rem", outline: "none" }} />
          </div>

          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => setShowNotif((v) => !v)} style={{ position: "relative", display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 12, background: showNotif ? "rgba(255,255,255,0.22)" : "transparent", border: "none", cursor: "pointer", color: "#fff" }}>
              <Bell size={22} strokeWidth={2.2} />
              {unreadCount > 0 && <span style={{ position: "absolute", top: 3, right: 2, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "#ef4444", color: "#fff", fontSize: "0.58rem", fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1, boxShadow: "0 0 0 2px #0f2170" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 330, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.16)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 750, color: "#0f172a" }}>Notifications</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {unreadCount > 0 && <button onClick={() => { markAllRead("customer"); setNotifs(getNotifications("customer")) }} style={{ fontSize: "0.68rem", fontWeight: 650, color: "#0b5ed7", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>}
                    {notifs.length > 0 && <button onClick={() => { clearNotifications("customer"); setNotifs([]) }} style={{ fontSize: "0.68rem", fontWeight: 650, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
                  </div>
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center" }}>
                      <Bell size={28} color="#d8e7df" style={{ margin: "0 auto 8px" }} />
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#7b8c86", fontWeight: 550 }}>No notifications yet</p>
                    </div>
                  ) : notifs.map((n) => (
                    <button key={n.id} onClick={() => { markRead("customer", n.id); setNotifs(getNotifications("customer")) }} style={{ display: "block", width: "100%", padding: "11px 16px", background: n.read ? "#fff" : "#f7fbff", border: "none", borderBottom: "1px solid #edf5ff", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ display: "block", fontSize: "0.77rem", fontWeight: 750, color: "#0f172a" }}>{n.title}</span>
                      <span style={{ display: "block", marginTop: 2, fontSize: "0.71rem", color: "#64748b", lineHeight: 1.45 }}>{n.body}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={userRef} style={{ position: "relative" }}>
            <button onClick={() => setShowUser((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.25rem 0.5rem", background: "transparent", border: "none", cursor: "pointer", borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid #bcd7ff", display: "grid", placeItems: "center", fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{initials}</div>
              <span className="customer-user-label" style={{ textAlign: "left" }}>
                <span style={{ display: "block", fontSize: "0.86rem", fontWeight: 750, color: "#fff", lineHeight: 1.2 }}>{user?.name ?? "Customer"}</span>
                <span style={{ display: "block", fontSize: "0.74rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.2 }}>Customer Portal</span>
              </span>
              <ChevronDown size={13} color="rgba(255,255,255,0.72)" />
            </button>
            {showUser && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 210, background: "#fff", border: "1px solid #dfe9e5", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #edf5ff" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>{user?.name ?? "Customer"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6d7e79", marginTop: 2 }}>{user?.email ?? ""}</div>
                </div>
                <button onClick={() => { navigate("/customer/profile"); setShowUser(false) }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.625rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "#374151", fontSize: "0.875rem", fontWeight: 550, fontFamily: "inherit" }}>
                  <User size={14} strokeWidth={1.75} />Edit Profile
                </button>
                <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.625rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.875rem", fontWeight: 550, fontFamily: "inherit" }}>
                  <Power size={14} strokeWidth={1.75} />Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 0, background: "#edf5ff", overflowY: "auto" }}>{children}</main>
    </div>
  )
}
