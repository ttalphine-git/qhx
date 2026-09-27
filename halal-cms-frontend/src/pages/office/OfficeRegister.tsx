import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Database, RefreshCw, UserPlus } from "lucide-react"
import { createEmployee } from "@/api/users"
import { getAuthDatabaseStatus, getUserRoles, type AuthDatabaseStatus, type UserRoleOption } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

const fallbackRoles: UserRoleOption[] = [
  { value: "OFFICE_ADMIN", label: "OFFICE ADMIN" },
  { value: "OFFICE_INSPECTOR", label: "OFFICE INSPECTOR" },
  { value: "OFFICE_REVIEWER", label: "OFFICE REVIEWER" },
  { value: "AUDITOR", label: "AUDITOR" },
  { value: "SHARIA_AUDITOR", label: "SHARIA AUDITOR" },
  { value: "HALAL_REVIEWER", label: "HALAL REVIEWER" },
  { value: "DECISION_MAKER", label: "DECISION MAKER" },
  { value: "FINANCE", label: "FINANCE" },
  { value: "AUDIT_PLANNER", label: "AUDIT PLANNER" },
  { value: "CERTIFICATE_CONTROLLER", label: "CERTIFICATE CONTROLLER" },
  { value: "QUALITY_MANAGER", label: "QUALITY MANAGER" },
]

export default function OfficeRegister() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [roles, setRoles] = useState<UserRoleOption[]>(fallbackRoles)
  const [dbStatus, setDbStatus] = useState<AuthDatabaseStatus | null>(null)
  const [dbError, setDbError] = useState("")
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "OFFICE_INSPECTOR",
    phone: "",
    jobTitle: "",
    department: "",
    employmentType: "OWN",
  })

  const loadLiveMeta = async () => {
    setLoadingMeta(true)
    setDbError("")
    try {
      const [roleRows, status] = await Promise.all([getUserRoles(), getAuthDatabaseStatus()])
      if (roleRows.length > 0) {
        setRoles(roleRows.filter(role => role.value !== "SUPER_ADMIN"))
        setForm(prev => ({ ...prev, role: roleRows.some(role => role.value === prev.role) ? prev.role : roleRows[0].value }))
      }
      setDbStatus(status)
    } catch {
      setDbError("Live auth database status could not be loaded.")
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    loadLiveMeta()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email, and password are required.")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setSubmitting(true)
    try {
      const data = await createEmployee({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        department: form.department.trim() || undefined,
        employmentType: form.employmentType,
      })
      setAuth(data.accessToken, {
        id: data.userId,
        email: data.email,
        name: data.fullName,
        role: data.role,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      })
      navigate("/office/dashboard")
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      if (axErr.response?.status === 409) setError("That email is already registered.")
      else setError(axErr.response?.data?.message ?? axErr.message ?? "Registration failed.")
    } finally {
      setSubmitting(false)
    }
  }

  const input: React.CSSProperties = {
    width: "100%",
    height: 46,
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
    color: "#0f172a",
    background: "#fff",
  }

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 6,
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(320px, 520px) 1fr", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section style={{ background: "#fff", padding: "36px 48px", borderRight: "1px solid #e2e8f0" }}>
        <button type="button" onClick={() => navigate("/office/login")} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "none", background: "transparent", color: "#2563eb", fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Back to login
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <UserPlus size={24} color="#2563eb" />
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, color: "#0f172a" }}>User registration</h1>
        </div>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
          Create an office user directly in the live auth database.
        </p>

        {error && <div style={{ marginBottom: 16, padding: "11px 13px", borderRadius: 8, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13 }}>{error}</div>}

        <form onSubmit={submit}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={label}>Full name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={input} />
            </div>
            <div>
              <label style={label}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={input} />
            </div>
            <div>
              <label style={label}>Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={input} />
            </div>
            <div>
              <label style={label}>Role from settings database</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={label}>Job title</label>
                <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>Department</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={input} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={label}>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>Employment type</label>
                <select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} style={{ ...input, cursor: "pointer" }}>
                  <option value="OWN">Own staff</option>
                  <option value="OUTSOURCE">Outsource</option>
                </select>
              </div>
            </div>
          </div>
          <button type="submit" disabled={submitting} style={{ marginTop: 22, width: "100%", height: 50, border: "none", borderRadius: 8, background: submitting ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 800, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting ? "Creating user..." : <>Create user <ArrowRight size={18} /></>}
          </button>
        </form>
      </section>

      <section style={{ padding: "44px 56px" }}>
        <div style={{ maxWidth: 620 }}>
          <h2 style={{ margin: "0 0 12px", color: "#0f172a", fontSize: 22 }}>Live database check</h2>
          <p style={{ margin: "0 0 22px", color: "#64748b", lineHeight: 1.6, fontSize: 14 }}>
            This panel calls `auth-service` before registration. If it shows connected, the live app can reach the auth database and load roles.
          </p>
          <div style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Database size={20} color={dbStatus?.connected ? "#16a34a" : "#64748b"} />
                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{dbStatus?.connected ? "Database connected" : loadingMeta ? "Checking database..." : "Database not confirmed"}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{dbStatus?.database ?? "halalcms_auth"}</div>
                </div>
              </div>
              <button type="button" onClick={loadLiveMeta} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #dbe3ef", background: "#fff", borderRadius: 8, padding: "8px 11px", cursor: "pointer", color: "#334155", fontWeight: 700 }}>
                <RefreshCw size={15} className={loadingMeta ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {dbError ? (
              <p style={{ margin: "16px 0 0", color: "#b91c1c", fontSize: 13 }}>{dbError}</p>
            ) : dbStatus ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 18 }}>
                <Metric label="Users" value={String(dbStatus.userCount)} />
                <Metric label="Admin seed" value={dbStatus.adminExists ? "Yes" : "No"} />
                <Metric label="Super admin seed" value={dbStatus.superAdminExists ? "Yes" : "No"} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#f8fafc" }}>
      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 900, marginTop: 3 }}>{value}</div>
    </div>
  )
}
