import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FilePlus2,
  FileText,
  Filter,
  Grid2X2,
  Headphones,
  LayoutList,
  Plus,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"

const F = "'Inter', system-ui, sans-serif"
const NAVY = "#0f2170"
const BLUE = "#0b5ed7"
const SOFT_BLUE = "#edf5ff"
const TEXT = "#0f172a"
const MUTED = "#5c6f85"

const stats = [
  { label: "Total Certificates", helper: "All issued batch certificates", value: 0, icon: FileText, accent: "#0b5ed7", bg: "#e8f2ff" },
  { label: "Valid Certificates", helper: "Currently active", value: 0, icon: ShieldCheck, accent: "#2563eb", bg: "#eaf1ff" },
  { label: "Expiring Soon", helper: "Within 3 months", value: 0, icon: Clock3, accent: "#b45309", bg: "#fff4df" },
  { label: "Expired Certificates", helper: "No longer valid", value: 0, icon: XCircle, accent: "#dc2626", bg: "#feeaea" },
]

const quickActions = [
  { label: "Apply for New Certificate", helper: "Start a new batch certificate application", icon: FilePlus2, color: "#0b5ed7", path: "/customer/batch-certificates/new" },
  { label: "View My Applications", helper: "Track your application status", icon: CalendarDays, color: "#2563eb", path: "/customer/applications" },
  { label: "My Factories", helper: "Manage your registered factories", icon: ShieldCheck, color: "#7c3aed", path: "/customer/factories" },
]

function HeroArtwork() {
  return (
    <div className="batch-hero-art" aria-hidden="true">
      <div className="batch-sky" />
      <div className="batch-dome dome-one" />
      <div className="batch-dome dome-two" />
      <div className="batch-minaret" />
      <div className="batch-leaf leaf-one" />
      <div className="batch-leaf leaf-two" />
      <div className="batch-cert-card">
        <div style={{ fontWeight: 850, color: NAVY, fontSize: 18, lineHeight: 1.1 }}>HALAL<br />CERTIFICATE</div>
        <div style={{ height: 7, background: "#dce7f4", borderRadius: 99, marginTop: 20, width: "74%" }} />
        <div style={{ height: 7, background: "#dce7f4", borderRadius: 99, marginTop: 9, width: "88%" }} />
        <div style={{ height: 7, background: "#dce7f4", borderRadius: 99, marginTop: 9, width: "58%" }} />
        <div className="batch-seal">★</div>
      </div>
    </div>
  )
}

export default function CustomerBatchCertificatesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  return (
    <CustomerLayout title="Batch Certificates">
      <div className="batch-page" style={{ fontFamily: F }}>
        <section className="batch-hero">
          <div className="batch-hero-copy">
            <p style={{ margin: "0 0 8px", color: "#4b5563", fontSize: "0.83rem", fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase" }}>Batch Certificates</p>
            <h1 style={{ margin: 0, color: "#09204f", fontSize: "clamp(2.15rem, 4vw, 4.15rem)", lineHeight: 1.04, fontWeight: 900, letterSpacing: "-0.045em" }}>
              Your Halal Certifications<br />
              in <span style={{ color: BLUE }}>One Place</span>
            </h1>
            <p style={{ margin: "18px 0 0", color: "#405779", maxWidth: 760, fontSize: "clamp(1rem, 1.4vw, 1.27rem)", lineHeight: 1.55 }}>
              View, download, and manage all batch certificates issued by HalalCMS. Keep your certifications organized, secure, and always accessible.
            </p>
          </div>
          <HeroArtwork />
        </section>

        <section className="batch-stats">
          {stats.map(({ label, helper, value, icon: Icon, accent, bg }) => (
            <article key={label} className="batch-stat-card">
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon size={34} color={accent} strokeWidth={2.35} />
              </div>
              <div>
                <div style={{ color: "#071d35", fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ color: "#41546c", marginTop: 8, fontSize: "1.02rem", fontWeight: 700 }}>{label}</div>
                <div style={{ color: "#6a7890", marginTop: 6, fontSize: "0.9rem" }}>{helper}</div>
              </div>
            </article>
          ))}
        </section>

        <div className="batch-content-grid">
          <section className="batch-panel">
            <div className="batch-panel-head">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, background: "#e8f2ff", display: "grid", placeItems: "center" }}>
                  <FileText size={31} color={BLUE} strokeWidth={2.45} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: TEXT, fontSize: "1.55rem", fontWeight: 850, letterSpacing: "-0.025em" }}>Batch Certificates</h2>
                  <p style={{ margin: "6px 0 0", color: MUTED, fontSize: "0.95rem" }}>Manage and access your batch certificates</p>
                </div>
              </div>

              <div className="batch-toolbar">
                <label style={{ position: "relative", display: "block" }}>
                  <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search certificates..."
                    style={{ width: 230, height: 44, border: "1px solid #d7e3f2", borderRadius: 10, background: "#f8fbff", color: TEXT, padding: "0 14px 0 42px", fontSize: "0.86rem" }}
                  />
                </label>
                <button className="batch-tool-button"><Filter size={17} />Filter</button>
                <button className="batch-tool-button"><CalendarDays size={17} />All Dates<ChevronDown size={16} /></button>
                <div style={{ display: "flex", border: "1px solid #d7e3f2", borderRadius: 10, overflow: "hidden" }}>
                  <button className="batch-view-button" aria-label="List view" onClick={() => setView("list")} data-active={view === "list"}><LayoutList size={20} /></button>
                  <button className="batch-view-button" aria-label="Grid view" onClick={() => setView("grid")} data-active={view === "grid"}><Grid2X2 size={18} /></button>
                </div>
              </div>
            </div>

            <div className="batch-empty">
              <div className="batch-empty-art">
                <div className="batch-folder">
                  <div className="batch-folder-tab" />
                  <div style={{ width: 76, height: 52, borderRadius: 10, background: "linear-gradient(180deg, #b8d1eb 0%, #8eb7dd 100%)", boxShadow: "0 18px 35px rgba(15,33,112,0.14)" }} />
                </div>
              </div>
              <h3 style={{ margin: "0 0 10px", color: TEXT, fontSize: "1.5rem", fontWeight: 850, letterSpacing: "-0.025em" }}>No Batch Certificates Yet</h3>
              <p style={{ margin: "0 auto", maxWidth: 540, color: "#536783", lineHeight: 1.55, fontSize: "1rem" }}>
                Your issued batch certificates will appear here. You can view, download, and manage your certificates once they are available.
              </p>
              <button onClick={() => navigate("/customer/batch-certificates/new")} className="batch-primary-button">
                <Plus size={19} />
                Apply for Batch Certificate
              </button>
            </div>
          </section>

          <aside className="batch-sidebar">
            <section className="batch-side-panel tinted">
              <h3 style={{ margin: "0 0 12px", color: TEXT, fontSize: "1.18rem", fontWeight: 850, display: "flex", alignItems: "center", gap: 10 }}>
                <Zap size={23} color={BLUE} fill="#0b5ed7" />Quick Actions
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                {quickActions.map(({ label, helper, icon: Icon, color, path }) => (
                  <button key={label} onClick={() => navigate(path)} className="batch-action-row">
                    <span style={{ width: 42, height: 42, borderRadius: 12, background: `${color}14`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={22} color={color} strokeWidth={2.4} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span style={{ display: "block", color: "#152238", fontSize: "0.88rem", fontWeight: 800 }}>{label}</span>
                      <span style={{ display: "block", color: "#63758f", fontSize: "0.74rem", marginTop: 3 }}>{helper}</span>
                    </span>
                    <ChevronRight size={19} color="#44617e" />
                  </button>
                ))}
              </div>
            </section>

            <section className="batch-side-panel help">
              <CircleHelp size={28} color={NAVY} />
              <h3 style={{ margin: "10px 0 8px", color: TEXT, fontSize: "1.16rem", fontWeight: 850 }}>Need Help?</h3>
              <p style={{ margin: "0 auto 18px", color: "#5d6f86", maxWidth: 280, lineHeight: 1.55, fontSize: "0.82rem" }}>
                If you have any questions about your batch certificates, please contact our support team.
              </p>
              <button className="batch-support-button">
                <Headphones size={18} />
                Contact Support
              </button>
            </section>
          </aside>
        </div>
      </div>
    </CustomerLayout>
  )
}
