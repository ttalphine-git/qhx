import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye, EyeOff, UserRound, KeyRound, ShieldCheck, Headphones, Moon,
  BarChart2, FileText, Users, ArrowRight,
} from "lucide-react"
import { loginUser, registerUser } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

const FEATURES = [
  { Icon: FileText,    title: "Apply for Certification",        sub: "Start your halal certification in minutes" },
  { Icon: BarChart2,   title: "Real-time Application Tracking", sub: "Stay updated at every stage" },
  { Icon: ShieldCheck, title: "Digital Halal Certificates",     sub: "Secure, reliable, and verifiable" },
  { Icon: Users,       title: "Multi-product Management",       sub: "Manage all your certified products in one place" },
]

const WHY = [
  { Icon: ShieldCheck, label: "Secure Login" },
  { Icon: Headphones,  label: "24/7 Support" },
  { Icon: Moon,        label: "Shariah Compliant" },
]


export default function CustomerLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Email and password are required."); return }
    setLoading(true)

    try {
      let data
      try {
        data = await loginUser({ email, password })
      } catch (err) {
        if (email !== "company@example.com" || password !== "company123") throw err
        data = await registerUser({
          email,
          password,
          fullName: "Al-Barakah Foods",
          companyName: "Al-Barakah Food Co.",
          role: "CUSTOMER",
        })
      }
      const user: import('@/types').UserDto = {
        id: data.userId, email: data.email, name: data.fullName,
        role: data.role, status: "ACTIVE", createdAt: new Date().toISOString(),
        organization: email === "company@example.com" ? "Al-Barakah Food Co." : undefined,
      }
      setAuth(data.accessToken, user)
      navigate("/customer/dashboard")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? "These credentials do not match our records.")
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", height: 52, paddingLeft: 44, paddingRight: 16,
    border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: "0.9rem",
    color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "rgba(255,255,255,0.08)",
  }

  return (
    <div className="login-page" style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden", backgroundImage: "url('/m.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="login-left" style={{
        flex: "0 0 58%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
      }}>

        {/* Content above overlay */}
        <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Top nav */}
          <div className="login-left-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 4.5rem", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "0.06em", lineHeight: 1 }}>QHX</span>
                <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.18em", marginTop: 3 }}>HALAL CERTIFICATION PLATFORM</span>
              </div>
            </div>
          </div>

          {/* Main text — left 60% only */}
          <div className="login-left-content" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 4.5rem 1rem", maxWidth: "60%" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em", color: "#22d3ee" }}>
              WELCOME TO QHX
            </p>
            <h1 style={{ margin: "0 0 1rem", fontSize: "2.25rem", fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
              Halal Certification<br />Management System
            </h1>
            <p style={{ margin: "0 0 2rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
              Apply for internationally recognised halal certification, track your application in real time and manage your certificates online.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              {FEATURES.map(({ Icon, title, sub }) => (
                <div key={title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={19} color="#38bdf8" strokeWidth={1.75} />
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
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>© 2025 QHX - Halal Certification Management System</span>
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
          <p style={{ margin: "0 0 0.375rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.55)" }}>Access your QHX customer account</p>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>
            No account?{" "}
            <button onClick={() => navigate("/customer/register")}
              style={{ color: "#60a5fa", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "0.85rem" }}>
              Create one
            </button>
          </p>

          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 8, fontSize: "0.85rem", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: "0.375rem" }}>
                Email <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <UserRound size={17} color="#2563eb" strokeWidth={2.1} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="company@example.com" style={inp}
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
                  placeholder="••••••••" style={{ ...inp, paddingRight: 48 }}
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
                  style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }} />
                Remember me
              </label>
              <button type="button" style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", height: 52, background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontFamily: "inherit" }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8" }}
              onMouseOut={e => { if (!loading) e.currentTarget.style.background = "#2563eb" }}
            >
              {loading
                ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Signing in…</>
                : <><span>Sign in</span><ArrowRight size={18} /></>
              }
            </button>

            <button type="button" onClick={() => { setEmail("company@example.com"); setPassword("company123") }}
              style={{ width: "100%", height: 34, border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >Virtual Support</button>

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
          .login-page { background-image: none !important; background: #fff !important; }
          .login-form-wrap h2 { color: #0f172a !important; }
          .login-form-wrap p { color: #64748b !important; }
          .login-form-wrap label { color: #374151 !important; }
          .login-form-wrap input[type="email"],
          .login-form-wrap input[type="password"],
          .login-form-wrap input[type="text"] { color: #0f172a !important; background: #fff !important; border-color: #e2e8f0 !important; }
          .login-form-wrap a { color: #2563eb !important; }
          .why-card { border-color: #e2e8f0 !important; background: transparent !important; }
          .why-label { color: #374151 !important; }
          .divider-line { background: #e2e8f0 !important; }
          .divider-text { color: #94a3b8 !important; }
          .footer-text { color: #94a3b8 !important; }
          .login-mobile-header span { color: #0f172a !important; }
          .login-mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
