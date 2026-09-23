import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ChevronDown, Power, User, Bell } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { C } from "@/lib/utils"
import { getNotifications, markRead, markAllRead, clearNotifications, type AppNotification } from "@/lib/notifications"

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/customer/dashboard"    },
  { label: "My Applications", path: "/customer/applications" },
  { label: "My Factories",    path: "/customer/factories"    },
]

interface CustomerLayoutProps { children: React.ReactNode; title?: string }

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [ref, cb])
}

export default function CustomerLayout({ children, title }: CustomerLayoutProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, clearAuth } = useAuthStore()

  const isAuthorized = !!user && user.role?.toUpperCase?.() === 'CUSTOMER'

  useEffect(() => {
    if (!isAuthorized) navigate('/customer/login', { replace: true })
  }, [isAuthorized, navigate])

  if (!isAuthorized) return null

  const [showUser,  setShowUser]  = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifs,    setNotifs]    = useState<AppNotification[]>(() => getNotifications('customer'))
  const userRef  = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  useClickOutside(userRef,  () => setShowUser(false))
  useClickOutside(notifRef, () => setShowNotif(false))

  useEffect(() => {
    const refresh = () => setNotifs(getNotifications('customer'))
    window.addEventListener('storage', refresh)
    const id = setInterval(refresh, 3000)
    return () => { window.removeEventListener('storage', refresh); clearInterval(id) }
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  function handleMarkAllRead() { markAllRead('customer'); setNotifs(getNotifications('customer')) }
  function handleClear()       { clearNotifications('customer'); setNotifs([]) }
  function handleReadOne(id: string) { markRead('customer', id); setNotifs(getNotifications('customer')) }

  const logout = () => { clearAuth(); navigate("/customer/login") }

  const initials = user?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "C"

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar — 64px, #0f2170 ───────────────────────────── */}
      <nav style={{ background: C.nav, borderBottom: `1px solid ${C.navBorder}`, height: 64, padding: "0 2rem", display: "flex", alignItems: "center", gap: "2rem", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>

        {/* Brand */}
        <button onClick={() => navigate("/customer/dashboard")} style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}>
          <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.2)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>HC</div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>HalalCMS</div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>Customer Portal</div>
          </div>
        </button>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
          {NAV_ITEMS.map(({ label, path }) => {
            const active = path === "/customer/dashboard" ? location.pathname === path : location.pathname.startsWith(path)
            return (
              <button key={path} onClick={() => navigate(path)}
                style={{ padding: "0.5rem 0.875rem", borderRadius: 8, background: active ? C.navActive : "transparent", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8375rem", fontWeight: active ? 600 : 500, transition: "background 0.15s", whiteSpace: "nowrap" }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = C.navHover }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >{label}</button>
            )
          })}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(v => !v)}
              style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:9, background: showNotif ? "rgba(255,255,255,0.22)" : "transparent", border:"none", cursor:"pointer", color:"#fff" }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseOut={e => (e.currentTarget.style.background = showNotif ? "rgba(255,255,255,0.22)" : "transparent")}
            >
              <Bell size={18} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span style={{ position:"absolute", top:4, right:4, minWidth:16, height:16, padding:"0 4px", borderRadius:99, background:"#ef4444", color:"#fff", fontSize:"0.58rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, boxShadow:"0 0 0 2px #0f2170" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:330, background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.16)", zIndex:200, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Bell size={14} color="#374151" />
                    <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#0f172a" }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ padding:"1px 7px", borderRadius:99, background:"#eff6ff", color:"#2563eb", fontSize:"0.62rem", fontWeight:700 }}>{unreadCount} new</span>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ fontSize:"0.68rem", fontWeight:600, color:"#2563eb", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:5 }}>Mark all read</button>}
                    {notifs.length > 0 && <button onClick={handleClear} style={{ fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:5 }}>Clear</button>}
                  </div>
                </div>
                <div style={{ maxHeight:360, overflowY:"auto" }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding:"32px 16px", textAlign:"center" }}>
                      <Bell size={28} color="#e2e8f0" style={{ margin:"0 auto 8px" }} />
                      <p style={{ margin:0, fontSize:"0.78rem", color:"#94a3b8", fontWeight:500 }}>No notifications yet</p>
                    </div>
                  ) : notifs.map(n => {
                    const borderColor = { success:"#16a34a", error:"#dc2626", warning:"#f59e0b", info:"#2563eb" }[n.type]
                    const bg = n.read ? "#fff" : "#f8fafc"
                    return (
                      <div key={n.id} onClick={() => handleReadOne(n.id)}
                        style={{ display:"flex", gap:10, padding:"11px 16px", background:bg, cursor:"pointer", transition:"background 0.1s" }}
                        onMouseOver={e => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseOut={e => (e.currentTarget.style.background = bg)}
                      >
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                            {!n.read && <span style={{ width:6, height:6, borderRadius:"50%", background:borderColor, flexShrink:0 }} />}
                            <span style={{ fontSize:"0.77rem", fontWeight:700, color:"#0f172a" }}>{n.title}</span>
                          </div>
                          <p style={{ margin:0, fontSize:"0.71rem", color:"#64748b", lineHeight:1.45, wordBreak:"break-word" as const }}>{n.body}</p>
                          <span style={{ fontSize:"0.63rem", color:"#94a3b8", marginTop:4, display:"block" }}>{new Date(n.createdAt).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div ref={userRef} style={{ position: "relative" }}>
            <button onClick={() => setShowUser(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0.625rem", background: "transparent", border: "none", cursor: "pointer", borderRadius: 10 }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{user?.name ?? "Customer"}</div>
                <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>Customer Portal</div>
              </div>
              <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
            </button>
            {showUser && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 200, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>{user?.name ?? "Customer"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{user?.email ?? ""}</div>
                </div>
                <button onClick={() => { navigate("/customer/profile"); setShowUser(false) }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "#374151", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  <User size={14} strokeWidth={1.75} />Edit Profile
                </button>
                <button onClick={logout}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.875rem", fontWeight: 500 }}
                  onMouseOver={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Power size={14} strokeWidth={1.75} />Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Sub-header ──────────────────────────────────────── */}
      <div style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef", padding: "0.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151" }}>
          {title ?? NAV_ITEMS.find(n => n.path === "/customer/dashboard" ? location.pathname === n.path : location.pathname.startsWith(n.path))?.label ?? "Customer Portal"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "1.75rem 2rem", background: C.pageBg, overflowY: "auto" }}>{children}</main>
    </div>
  )
}
