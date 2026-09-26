import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye, EyeOff, UserRound, KeyRound, ShieldCheck, Headphones, Moon,
  BarChart2, FileText, Users, ArrowRight,
} from "lucide-react"
import { loginUser } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

const BLUE = "#2563eb"
const FEATURES = [
  { Icon: ShieldCheck, title: "Online Audit Management",        sub: "Streamline and digitize your audit process" },
  { Icon: BarChart2,   title: "Real-time Application Tracking", sub: "Stay updated at every stage" },
  { Icon: FileText,    title: "Halal Certificate Generation",   sub: "Secure, reliable, and verifiable" },
  { Icon: Users,       title: "Batch Certificate Management",   sub: "Efficiently handle multiple applications" },
]

const WHY = [
  { Icon: ShieldCheck, label: "Secure Login" },
  { Icon: Headphones,  label: "24/7 Support" },
  { Icon: Moon,        label: "Shariah Compliant" },
]


export default function OfficeLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Please enter your email and password."); return }
    setLoading(true)

    try {
      const data = await loginUser({ email, password })
      const user: import('@/types').UserDto = {
        id: data.userId,
        email: data.email,
        name: data.fullName,
        role: data.role,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      }
      setAuth(data.accessToken, user)
      navigate("/office/dashboard")
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      const status = axErr?.response?.status
      const serverMsg = axErr?.response?.data?.message
      if (status === 401) setError("Invalid email or password.")
      else if (status === 403) setError("Your account is disabled. Contact support.")
      else setError(serverMsg ?? axErr?.message ?? "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden", backgroundImage: "url('/l.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="login-left" style={{
        flex: "0 0 58%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
      }}>

        {/* All content above overlay */}
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Top nav */}
          <div className="login-left-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 4.5rem", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "0.06em", lineHeight: 1 }}>QHX</span>
              <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.18em", marginTop: 3 }}>HALAL CERTIFICATION PLATFORM</span>
            </div>
          </div>

          {/* Main text — left half only */}
          <div className="login-left-content" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 4.5rem 1rem", maxWidth: "60%" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em", color: "#22d3ee" }}>
              WELCOME TO QHX
            </p>
            <h1 style={{ margin: "0 0 1rem", fontSize: "2.25rem", fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
              Halal Certification<br />Management System
            </h1>
            <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
              Manage applications, assign auditors, conduct compliance checks,
              and issue certified Halal certificates — all in one system.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              {FEATURES.map(({ Icon, title, sub }) => (
                <div key={title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={19} color="#60a5fa" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="login-left-footer" style={{ padding: "0.875rem 4.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>© 2025 QHX - Halal Certification Management</span>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>— PEOPLE | INTEGRITY | IMPACT</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="login-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "2rem" }}>

        <div className="login-form-wrap" style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

          {/* Mobile-only logo */}
          <div className="login-mobile-header" style={{ display: "none", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", letterSpacing: "0.06em" }}>QHX</span>
          </div>

          <h2 style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontWeight: 800, color: "#fff" }}>Sign in</h2>
          <p style={{ margin: "0 0 0.375rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.55)" }}>Access your QHX account</p>
          <p style={{ margin: "0 0 1.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>
            Not an officer?{" "}
            <button onClick={() => navigate("/customer/login")}
              style={{ color: "#60a5fa", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "0.85rem" }}>
              Customer Portal
            </button>
          </p>

          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 8, fontSize: "0.85rem", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} noValidate>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.375rem" }}>
                Email or username <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <UserRound size={17} color="#2563eb" strokeWidth={2.1} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Email or username"
                  style={{ width: "100%", height: 52, paddingLeft: 44, paddingRight: 16, border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: "0.9rem", color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "rgba(255,255,255,0.08)" }}
                  onFocus={e => (e.target.style.borderColor = "#60a5fa")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.375rem" }}>
                Password <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound size={17} color="#2563eb" strokeWidth={2.1} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: "100%", height: 52, paddingLeft: 44, paddingRight: 48, border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: "0.9rem", color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "rgba(255,255,255,0.08)" }}
                  onFocus={e => (e.target.style.borderColor = "#60a5fa")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  {showPw ? <EyeOff size={16} color="rgba(255,255,255,0.4)" /> : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: BLUE, cursor: "pointer" }} />
                Remember me
              </label>
              <button type="button"
                style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", height: 52, background: loading ? "#93c5fd" : BLUE, color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontFamily: "inherit" }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8" }}
              onMouseOut={e => { if (!loading) e.currentTarget.style.background = BLUE }}
            >
              {loading
                ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Signing in…</>
                : <><span>Sign in</span><ArrowRight size={18} /></>
              }
            </button>

          </form>

          <div style={{ margin: "1.5rem 0 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="divider-line" style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span className="divider-text" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>Why choose QHX</span>
            <div className="divider-line" style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
            {WHY.map(({ Icon, label }) => (
              <div key={label} className="why-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", padding: "0.75rem 0.5rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
                <Icon size={20} color="#60a5fa" strokeWidth={1.75} />
                <span className="why-label" style={{ fontSize: "0.6875rem", fontWeight: 500, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
              </div>
            ))}
          </div>

          <p className="footer-text" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.7 }}>
            By signing in, you agree to our{" "}
            <a href="#" style={{ color: "#60a5fa", textDecoration: "none" }}>Terms of Service</a>{" "}
            and <a href="#" style={{ color: "#60a5fa", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1279px) {
          .login-left { display: none !important; }
          .login-right { padding: 2.5rem 1.5rem !important; align-items: flex-start !important; background: #fff !important; }
          .login-form-wrap { max-width: 460px !important; margin: 0 auto !important; }
          .login-mobile-header { display: flex !important; }
          .login-page { background-image: none !important; background: #fff !important; }
          .login-form-wrap h2 { color: #0f172a !important; }
          .login-form-wrap p { color: #64748b !important; }
          .login-form-wrap label { color: #374151 !important; }
          .login-form-wrap input[type="email"],
          .login-form-wrap input[type="password"],
          .login-form-wrap input[type="text"] { color: #0f172a !important; background: #fff !important; border-color: #e2e8f0 !important; }
          .login-form-wrap a { color: #2563eb !important; }
          .login-form-wrap .why-card { border-color: #e2e8f0 !important; background: transparent !important; }
          .login-form-wrap .why-label { color: #374151 !important; }
          .login-form-wrap .divider-line { background: #e2e8f0 !important; }
          .login-form-wrap .divider-text { color: #94a3b8 !important; }
          .login-form-wrap .footer-text { color: #94a3b8 !important; }
          .login-mobile-header span { color: #0f172a !important; }
        }
      `}</style>
    </div>
  )
}
