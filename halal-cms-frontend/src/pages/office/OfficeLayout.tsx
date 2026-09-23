import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Settings, ChevronDown, Power, Menu, X, Bell } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { C } from "@/lib/utils"
import { getNotifications, markRead, markAllRead, clearNotifications, type AppNotification } from "@/lib/notifications"
import OnboardingWizard from "@/components/OnboardingWizard"
import { isOnboardingComplete } from "@/lib/onboarding"

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/office/dashboard"    },
  { label: "Customers",    path: "/office/customers"    },
  { label: "Applications", path: "/office/applications" },
  { label: "Audits",       path: "/office/audits"       },
]

const SETTINGS_ITEMS = [
  { label: "Audit Trail",       sub: "View system activity logs",     path: "/office/audit-trail" },
  { label: "Audit Reports",     sub: "Configure category questions",  path: "/office/settings?tab=audits" },
  { label: "Advanced Settings",  sub: "Portal configuration",          path: "/office/settings?tab=scope"      },
  { label: "Manage Employees",  sub: "Add or modify officer access",  path: "/office/settings?tab=employees" },
]

interface OfficeLayoutProps { children: React.ReactNode; title?: string }

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [ref, cb])
}

const OFFICE_ROLES = ['ADMIN', 'OFFICER', 'AUDITOR', 'REVIEWER', 'SUPER_ADMIN']

export default function OfficeLayout({ children, title }: OfficeLayoutProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, clearAuth } = useAuthStore()

  const isAuthorized = !!user && OFFICE_ROLES.includes(user.role?.toUpperCase?.() ?? '')

  useEffect(() => {
    if (!isAuthorized) navigate('/office/login', { replace: true })
  }, [isAuthorized, navigate])

  if (!isAuthorized) return null

  const [onboarded,  setOnboarded]  = useState(isOnboardingComplete)
  const [showUser,   setShowUser]   = useState(false)
  const [showQuick,  setShowQuick]  = useState(false)
  const [showMobile, setShowMobile] = useState(false)
  const [showNotif,  setShowNotif]  = useState(false)
  const [notifs,     setNotifs]     = useState<AppNotification[]>(() => getNotifications('office'))
  const userRef  = useRef<HTMLDivElement>(null)
  const quickRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  useClickOutside(userRef,  () => setShowUser(false))
  useClickOutside(quickRef, () => setShowQuick(false))
  useClickOutside(notifRef, () => setShowNotif(false))

  useEffect(() => {
    const refresh = () => setNotifs(getNotifications('office'))
    window.addEventListener('storage', refresh)
    const id = setInterval(refresh, 3000)
    return () => { window.removeEventListener('storage', refresh); clearInterval(id) }
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  function handleMarkAllRead() {
    markAllRead('office')
    setNotifs(getNotifications('office'))
  }
  function handleClear() {
    clearNotifications('office')
    setNotifs([])
  }
  function handleReadOne(id: string) {
    markRead('office', id)
    setNotifs(getNotifications('office'))
  }

  const logout = () => { clearAuth(); navigate("/office/login") }
  const go = (path: string) => { navigate(path); setShowMobile(false) }

  const initials = user?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "A"

  const pendingCount = (() => {
    try {
      const reqs = JSON.parse(localStorage.getItem("hcs_profile_requests") || "[]")
      return reqs.filter((r: { status: string }) => r.status === "PENDING").length
    } catch { return 0 }
  })()

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif" }}>
      {!onboarded && <OnboardingWizard onComplete={() => setOnboarded(true)} />}
      <style>{`
        .ol-main      { padding: 1.75rem 2rem; }
        .ol-nav-links { display: flex; align-items: center; gap: 0.25rem; flex: 1; }
        .ol-desktop   { display: flex; align-items: center; gap: 0.375rem; }
        .ol-hamburger { display: none; }
        .ol-user-text { display: block; }

        @media (max-width: 768px) {
          .ol-main      { padding: 1rem; }
          .ol-nav-links { display: none !important; }
          .ol-desktop   { display: none !important; }
          .ol-hamburger { display: flex !important; }
          .ol-user-text { display: none !important; }
        }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav style={{ background:C.nav, borderBottom:`1px solid ${C.navBorder}`, height:64, padding:"0 1.25rem 0 1.5rem", display:"flex", alignItems:"center", gap:"1.5rem", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>

        {/* Brand */}
        <button onClick={() => go("/office/dashboard")} style={{ display:"flex", alignItems:"center", gap:"0.625rem", background:"none", border:"none", cursor:"pointer", flexShrink:0, padding:0 }}>
          <div style={{ width:36, height:36, background:"rgba(255,255,255,0.2)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem", fontWeight:800, color:"#fff", letterSpacing:"-0.5px", flexShrink:0 }}>HC</div>
          <div>
            <div style={{ fontSize:"1rem", fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>HalalCMS</div>
            <div style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.4)" }}>Office Portal</div>
          </div>
        </button>

        {/* Desktop nav links */}
        <div className="ol-nav-links">
          {NAV_ITEMS.map(({ label, path }) => {
            const active = path === "/office/dashboard" ? location.pathname === path : location.pathname.startsWith(path)
            const showBadge = label === "Customers" && pendingCount > 0
            return (
              <button key={path} onClick={() => navigate(path)}
                style={{ position:"relative", display:"inline-flex", alignItems:"center", gap:"0.375rem", padding:"0.5rem 0.875rem", borderRadius:8, background:active ? C.navActive : "transparent", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.8375rem", fontWeight:active ? 600 : 500, transition:"background 0.15s", whiteSpace:"nowrap", fontFamily:"inherit" }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = C.navHover }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                {label}
                {showBadge && (
                  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:18, height:18, padding:"0 5px", borderRadius:99, background:"#f59e0b", color:"#fff", fontSize:"0.6rem", fontWeight:800, lineHeight:1 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Desktop right */}
        <div className="ol-desktop" style={{ flexShrink:0 }}>
          <div ref={quickRef} style={{ position:"relative" }}>
            <button onClick={() => setShowQuick(v => !v)}
              style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.75rem", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.18)", borderRadius:8, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              <Settings size={14} strokeWidth={2} />Settings
              <ChevronDown size={12} style={{ transform:showQuick?"rotate(180deg)":"none", transition:"transform 0.15s" }} />
            </button>
            {showQuick && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, minWidth:240, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.14)", zIndex:200, overflow:"hidden" }}>
                <div style={{ fontSize:"0.6875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#9ca3af", padding:"0.75rem 1rem 0.5rem", borderBottom:"1px solid #f1f5f9" }}>Settings</div>
                {SETTINGS_ITEMS.map(a => (
                  <button key={a.path} onClick={() => { navigate(a.path); setShowQuick(false) }}
                    style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.625rem 1rem", width:"100%", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width:30, height:30, borderRadius:8, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Settings size={14} color="#374151" /></div>
                    <div>
                      <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#0f172a" }}>{a.label}</div>
                      <div style={{ fontSize:"0.7rem", color:"#9ca3af" }}>{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width:1, height:22, background:"rgba(255,255,255,0.15)", margin:"0 0.25rem" }} />

          {/* Notification bell */}
          <div ref={notifRef} style={{ position:"relative" }}>
            <button onClick={() => setShowNotif(v => !v)}
              style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:9, background: showNotif ? "rgba(255,255,255,0.22)" : "transparent", border:"none", cursor:"pointer", color:"#fff" }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseOut={e => (e.currentTarget.style.background = showNotif ? "rgba(255,255,255,0.22)" : "transparent")}
            >
              <Bell size={18} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span style={{ position:"absolute", top:4, right:4, minWidth:16, height:16, padding:"0 4px", borderRadius:99, background:"#ef4444", color:"#fff", fontSize:"0.58rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, boxShadow:"0 0 0 2px rgba(15,33,112,1)" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:340, background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.16)", zIndex:200, overflow:"hidden" }}>
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

          <div ref={userRef} style={{ position:"relative" }}>
            <button onClick={() => setShowUser(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.375rem 0.5rem", background:"transparent", border:"none", cursor:"pointer", borderRadius:10, fontFamily:"inherit" }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"1.5px solid rgba(255,255,255,0.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6875rem", fontWeight:700, color:"#fff", flexShrink:0 }}>{initials}</div>
              <div className="ol-user-text">
                <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#fff", lineHeight:1.2 }}>{user?.name ?? "Admin"}</div>
                <div style={{ fontSize:"0.625rem", color:"rgba(255,255,255,0.45)", lineHeight:1.2 }}>Office Portal</div>
              </div>
              <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
            </button>
            {showUser && (
              <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:200, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.14)", zIndex:200, overflow:"hidden" }}>
                <div style={{ padding:"0.75rem 1rem", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ fontSize:"0.875rem", fontWeight:600, color:"#0f172a" }}>{user?.name ?? "Admin"}</div>
                  <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:2 }}>{user?.role ?? "ADMIN"} · {user?.email ?? ""}</div>
                </div>
                <button onClick={logout}
                  style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1rem", width:"100%", background:"transparent", border:"none", cursor:"pointer", color:"#dc2626", fontSize:"0.875rem", fontWeight:500, fontFamily:"inherit" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Power size={14} strokeWidth={1.75} />Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile right: avatar + hamburger */}
        <div className="ol-hamburger" style={{ marginLeft:"auto", alignItems:"center", gap:"0.5rem" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"1.5px solid rgba(255,255,255,0.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6875rem", fontWeight:700, color:"#fff" }}>{initials}</div>
          <button onClick={() => setShowMobile(v => !v)}
            style={{ width:36, height:36, borderRadius:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
            {showMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      {showMobile && (
        <div style={{ background:C.nav, borderBottom:"1px solid rgba(255,255,255,0.1)", zIndex:99, fontFamily:"'Inter',system-ui,sans-serif" }}>
          {/* Nav links */}
          <div style={{ padding:"0.5rem 1rem" }}>
            {NAV_ITEMS.map(({ label, path }) => {
              const active = path === "/office/dashboard" ? location.pathname === path : location.pathname.startsWith(path)
              return (
                <button key={path} onClick={() => go(path)}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"0.75rem 1rem", borderRadius:8, background:active ? C.navActive : "transparent", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.9375rem", fontWeight:active ? 600 : 400, marginBottom:2, fontFamily:"inherit" }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"0 1rem" }} />

          {/* Settings */}
          <div style={{ padding:"0.75rem 1rem" }}>
            <p style={{ fontSize:"0.625rem", fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.5rem", paddingLeft:"0.5rem" }}>Settings</p>
            {SETTINGS_ITEMS.map(a => (
              <button key={a.path} onClick={() => go(a.path)}
                style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.625rem 0.75rem", width:"100%", background:"transparent", border:"none", cursor:"pointer", borderRadius:8, marginBottom:2, fontFamily:"inherit" }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={e => (e.currentTarget.style.background = "transparent")}
              >
                <Settings size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"0 1rem" }} />

          {/* User + sign out */}
          <div style={{ padding:"0.75rem 1rem 1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.5rem 0.75rem", marginBottom:4 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"1.5px solid rgba(255,255,255,0.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, color:"#fff", flexShrink:0 }}>{initials}</div>
              <div>
                <div style={{ fontSize:"0.875rem", fontWeight:600, color:"#fff" }}>{user?.name ?? "Admin"}</div>
                <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.45)" }}>{user?.email ?? ""}</div>
              </div>
            </div>
            <button onClick={logout}
              style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 0.75rem", borderRadius:8, background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.25)", color:"#fca5a5", fontSize:"0.875rem", fontWeight:500, cursor:"pointer", width:"100%", fontFamily:"inherit" }}>
              <Power size={14} />Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Sub-header ──────────────────────────────────────── */}
      <div style={{ background:"#f8f9fa", borderBottom:"1px solid #e9ecef", padding:"0.75rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#374151" }}>
          {title ?? NAV_ITEMS.find(n => n.path === "/office/dashboard" ? location.pathname === n.path : location.pathname.startsWith(n.path))?.label ?? "Office Portal"}
        </div>
        <div style={{ fontSize:"0.75rem", color:"#9ca3af" }}>
          {new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
        </div>
      </div>

      <main className="ol-main" style={{ flex:1, background:"#eff6ff", overflowY:"auto" }}>{children}</main>
    </div>
  )
}
