import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  FileText, Award, AlertTriangle,
  ChevronRight, Download, Plus, ShieldCheck, ArrowUpRight,
  ClipboardCheck,
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { getApplications } from "@/api/applications"
import { getCertificates } from "@/api/certificates"
import { C, getStatusStyle, formatDate, daysUntil } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"

const A  = "#0ea5e9"
const AL = "#f0f9ff"

const PROGRESS: Record<string, number> = {
  DRAFT:5, SUBMITTED:15, UNDER_REVIEW:25, PENDING_PAYMENT:35,
  PAYMENT_REVIEW:45, AGREEMENT_PENDING:52, AGREEMENT_REVIEW:60,
  AUDIT_SCHEDULED:68, AUDIT_IN_PROGRESS:78, AUDIT_COMPLETED:88,
  CERTIFICATION_REVIEW:94, CERTIFIED:100,
  REJECTED:100, SUSPENDED:100, EXPIRED:100,
}

// Certification process steps
const STEPS = [
  {
    title: "Submit Application",
    detail: "Complete company, factory, product, market, and halal standard information.",
  },
  {
    title: "Document Review",
    detail: "HCB reviews submitted documents and confirms whether anything is missing.",
  },
  {
    title: "Inspector Assigned",
    detail: "An auditor is assigned and the audit plan is prepared for the selected facility.",
  },
  {
    title: "On-site Audit",
    detail: "The auditor verifies production, records, ingredients, and halal controls on site.",
  },
  {
    title: "Certificate Issued",
    detail: "After approval, the halal certificate is generated and made available here.",
  },
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: appsData,  isLoading: loadingApps  } = useQuery({ queryKey:["ca"], queryFn:() => getApplications({ size:5 }) })
  const { data: certsData, isLoading: loadingCerts } = useQuery({ queryKey:["cc"], queryFn:() => getCertificates({ size:5 }) })

  const apps  = appsData?.content  ?? []
  const certs = certsData?.content ?? []

  const totalApps    = appsData?.totalElements  ?? apps.length
  const totalCerts   = certsData?.totalElements ?? certs.length
  const activeCerts  = certs.filter(c => c.status === "ACTIVE").length
  const pendingApps  = apps.filter(a => !["CERTIFIED","REJECTED","EXPIRED","SUSPENDED"].includes(a.status)).length
  const expiringSoon = certs.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30 }).length

  // figure out which step the most active app is at
  const latestApp = apps.find(a => !["CERTIFIED","REJECTED","EXPIRED","SUSPENDED"].includes(a.status))
  const currentStep = latestApp
    ? ["DRAFT","SUBMITTED"].includes(latestApp.status) ? 0
      : ["UNDER_REVIEW","PENDING_PAYMENT","PAYMENT_REVIEW"].includes(latestApp.status) ? 1
      : ["AGREEMENT_PENDING","AGREEMENT_REVIEW"].includes(latestApp.status) ? 2
      : ["AUDIT_SCHEDULED","AUDIT_IN_PROGRESS","AUDIT_COMPLETED"].includes(latestApp.status) ? 3
      : latestApp.status === "CERTIFICATION_REVIEW" ? 4
      : -1
    : -1

  return (
    <CustomerLayout>
      <style>{`
        .customer-dashboard-main {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
          height: min(560px, 90vh);
        }
        .customer-dashboard-card {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: ${C.cardShadow};
        }
        .customer-dashboard-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
        @media (max-width: 900px) {
          .customer-dashboard-main {
            grid-template-columns: 1fr;
            height: auto;
          }
          .customer-dashboard-card {
            height: min(520px, 90vh);
          }
        }
      `}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:20, paddingBottom:40 }}>


        {/* ── Alert ───────────────────────────────────────────────── */}
        {expiringSoon > 0 && (
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"13px 20px", display:"flex", alignItems:"center", gap:12 }}>
            <AlertTriangle style={{ width:18, height:18, color:"#ea580c", flexShrink:0 }} />
            <p style={{ fontSize:"0.8125rem", color:"#7c2d12", flex:1 }}>
              <strong>{expiringSoon} certificate{expiringSoon>1?"s":""}</strong> expiring within 30 days — renew to maintain your halal status.
            </p>
            <button onClick={() => navigate("/customer/certificates")}
              style={{ fontSize:"0.8125rem", fontWeight:700, color:"#ea580c", background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
              Renew now →
            </button>
          </div>
        )}

        {/* ── Welcome card ─────────────────────────────────────────── */}
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, boxShadow:C.cardShadow, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"stretch" }}>

            {/* Left: greeting */}
            <div style={{ flex:1, padding:"22px 28px" }}>
              <p style={{ fontSize:"0.625rem", fontWeight:700, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                Halal Certification Portal
              </p>
              <h1 style={{ fontSize:"1.125rem", fontWeight:800, color:C.textDark, marginBottom:5 }}>
                Welcome back, {user?.name ?? "Customer"}
              </h1>
              <p style={{ fontSize:"0.8125rem", color:C.muted, marginBottom:18, maxWidth:360 }}>
                Here is an overview of your halal certification status today.
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { Icon:FileText,       label:`${totalApps} Application${totalApps!==1?"s":""}` },
                  { Icon:ClipboardCheck, label:`${pendingApps} Pending`                          },
                  { Icon:Award,          label:`${activeCerts} Active Cert${activeCerts!==1?"s":""}` },
                  { Icon:ShieldCheck,    label:`${expiringSoon} Expiring`                        },
                ].map(({ Icon, label }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:"0.75rem", fontWeight:500, color:C.text }}>
                    <Icon style={{ width:12, height:12, color:C.primary }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Stat row */}
            <div style={{ display:"flex" }}>
              {[
                { label:"Applications", value:totalApps,   Icon:FileText       },
                { label:"Pending",      value:pendingApps,  Icon:ClipboardCheck },
                { label:"Certificates", value:totalCerts,  Icon:Award          },
                { label:"Active",       value:activeCerts,  Icon:ShieldCheck    },
              ].map(({ label, value, Icon }) => (
                <div key={label} style={{ padding:"32px 24px 16px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon style={{ width:18, height:18, color:"#374151" }} />
                  </div>
                  <p style={{ fontSize:"0.6875rem", color:C.muted, fontWeight:500 }}>{label}</p>
                  <p style={{ fontSize:"1.625rem", fontWeight:800, color:C.textDark, lineHeight:1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 24px", gap:8 }}>
              <button onClick={() => navigate("/customer/factories")}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:9, background:"#0f2170", color:"#fff", fontWeight:600, fontSize:"0.8125rem", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}
                onMouseOver={e => (e.currentTarget.style.background = "#0a1a5c")}
                onMouseOut={e => (e.currentTarget.style.background = "#0f2170")}>
                <Plus style={{ width:14, height:14 }} />Apply for Certificate
              </button>
              <button onClick={() => navigate("/customer/applications")}
                style={{ padding:"8px 4px", background:"none", color:C.primary, fontWeight:500, fontSize:"0.8125rem", border:"none", cursor:"pointer", whiteSpace:"nowrap", textDecoration:"underline", textUnderlineOffset:3 }}>
                View Applications
              </button>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="customer-dashboard-main">

          {/* Applications */}
          <div className="customer-dashboard-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
              <div>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>My Applications</p>
                <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:2 }}>{pendingApps} in progress</p>
              </div>
              <button onClick={() => navigate("/customer/applications")}
                style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.8125rem", fontWeight:600, color:A, background:"none", border:"none", cursor:"pointer" }}>
                View all <ArrowUpRight style={{ width:13, height:13 }} />
              </button>
            </div>
            <div className="customer-dashboard-scroll">
            {loadingApps ? (
              <div style={{ padding:20 }}>
                {[1,2,3].map(i => <div key={i} style={{ height:64, borderRadius:8, background:"#f8fafc", marginBottom:10 }} />)}
              </div>
            ) : apps.length === 0 ? (
              <div style={{ padding:"40px 22px", textAlign:"center" }}>
                <FileText style={{ width:32, height:32, color:"#e2e8f0", margin:"0 auto 10px" }} />
                <p style={{ fontSize:"0.8125rem", color:C.muted, marginBottom:10 }}>No applications yet</p>
                <button onClick={() => navigate("/customer/factories")}
                  style={{ fontSize:"0.8125rem", fontWeight:600, color:A, background:AL, border:"none", padding:"8px 16px", borderRadius:8, cursor:"pointer" }}>
                  Apply for certification
                </button>
              </div>
            ) : apps.map((app, i) => {
              const s = getStatusStyle(app.status)
              const pct = PROGRESS[app.status] ?? 0
              return (
                <div key={app.id} onClick={() => navigate(`/customer/applications/${app.id}`)}
                  style={{ padding:"14px 22px", cursor:"pointer", borderBottom: i < apps.length-1 ? "1px solid #f8fafc" : "none" }}
                  onMouseOver={e => (e.currentTarget.style.background="#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.background="transparent")}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"monospace", fontSize:"0.75rem", fontWeight:700, color:A }}>{app.applicationNumber}</span>
                        <span style={{ fontSize:"0.6875rem", fontWeight:600, color:s.color, background:s.bg, padding:"2px 8px", borderRadius:6 }}>{s.label}</span>
                      </div>
                      <p style={{ fontSize:"0.8125rem", fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.companyName}</p>
                      <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:1 }}>{app.submittedAt ? formatDate(app.submittedAt) : "Draft"}{app.type ? ` · ${app.type}` : ""}</p>
                    </div>
                    <ChevronRight style={{ width:14, height:14, color:"#cbd5e1", flexShrink:0, marginTop:3 }} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:5, borderRadius:5, background:"#f1f5f9" }}>
                      <div style={{ height:"100%", borderRadius:5, background:s.dot, width:`${pct}%` }} />
                    </div>
                    <span style={{ fontSize:"0.6875rem", fontWeight:700, color:C.muted, minWidth:28, textAlign:"right" }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
            </div>
          </div>

          {/* Certificates */}
          <div className="customer-dashboard-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
              <div>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>My Certificates</p>
                <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:2 }}>{activeCerts} active · {totalCerts} total</p>
              </div>
              <button onClick={() => navigate("/customer/certificates")}
                style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.8125rem", fontWeight:600, color:A, background:"none", border:"none", cursor:"pointer" }}>
                View all <ArrowUpRight style={{ width:13, height:13 }} />
              </button>
            </div>
            <div className="customer-dashboard-scroll">
            {loadingCerts ? (
              <div style={{ padding:20 }}>
                {[1,2,3].map(i => <div key={i} style={{ height:64, borderRadius:8, background:"#f8fafc", marginBottom:10 }} />)}
              </div>
            ) : certs.length === 0 ? (
              <div style={{ padding:"40px 22px", textAlign:"center" }}>
                <Award style={{ width:32, height:32, color:"#e2e8f0", margin:"0 auto 10px" }} />
                <p style={{ fontSize:"0.8125rem", color:C.muted, marginBottom:4 }}>No certificates yet</p>
                <p style={{ fontSize:"0.6875rem", color:C.muted }}>Complete an application to receive your certificate</p>
              </div>
            ) : certs.map((cert, i) => {
              const s = getStatusStyle(cert.status)
              const d = daysUntil(cert.expiryDate)
              const expiring = d >= 0 && d <= 30
              const expired  = d < 0
              return (
                <div key={cert.id}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 22px", borderBottom: i < certs.length-1 ? "1px solid #f8fafc" : "none" }}
                  onMouseOver={e => (e.currentTarget.style.background="#f8fafc")}
                  onMouseOut={e => (e.currentTarget.style.background="transparent")}>
                  <div style={{ width:40, height:40, borderRadius:11, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <ShieldCheck style={{ width:20, height:20, color:s.color }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"monospace", fontSize:"0.75rem", fontWeight:700, color:A }}>{cert.certificateNumber}</span>
                      <span style={{ fontSize:"0.6875rem", fontWeight:600, color:s.color, background:s.bg, padding:"2px 7px", borderRadius:6 }}>{s.label}</span>
                      {expiring && <span style={{ fontSize:"0.6875rem", fontWeight:700, color:"#ea580c", background:"#fff7ed", padding:"2px 7px", borderRadius:6 }}>{d}d left</span>}
                      {expired  && <span style={{ fontSize:"0.6875rem", fontWeight:700, color:"#dc2626", background:"#fef2f2", padding:"2px 7px", borderRadius:6 }}>Expired</span>}
                    </div>
                    <p style={{ fontSize:"0.8125rem", fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cert.companyName}</p>
                    <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:1 }}>{cert.halalStandard} · Expires {formatDate(cert.expiryDate)}</p>
                  </div>
                  <button
                    style={{ width:32, height:32, borderRadius:8, background:AL, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                    onMouseOver={e => (e.currentTarget.style.background="#bae6fd")}
                    onMouseOut={e => (e.currentTarget.style.background=AL)}>
                    <Download style={{ width:14, height:14, color:A }} />
                  </button>
                </div>
              )
            })}
            </div>
          </div>

          {/* Certification Process */}
          <div className="customer-dashboard-card">
              <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>Your Progress</p>
                <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:2 }}>Certification process</p>
              </div>
              <div className="customer-dashboard-scroll" style={{ padding:"16px 20px" }}>
                <div style={{ position:"relative", paddingLeft:28 }}>
                  <div style={{ position:"absolute", left:9, top:12, bottom:12, width:2, background:"#f1f5f9" }} />
                  {STEPS.map((step, idx) => {
                    const done    = idx < currentStep
                    const current = idx === currentStep
                    const state = done ? "Completed" : current ? "Current step" : "Pending"
                    return (
                      <div key={step.title} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom: idx < STEPS.length-1 ? 18 : 0, position:"relative" }}>
                        <div style={{
                          position:"absolute", left:-28, width:20, height:20, borderRadius:"50%", top:1,
                          background: done ? A : current ? "#fff" : "#f8fafc",
                          border: done ? `2px solid ${A}` : current ? `2px solid ${A}` : "2px solid #e2e8f0",
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1,
                        }}>
                          {done && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }} />}
                          {current && <div style={{ width:8, height:8, borderRadius:"50%", background:A }} />}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            <p style={{ margin:0, fontSize:"0.78rem", fontWeight: current ? 800 : 700, color: done || current ? C.textDark : C.muted }}>
                              {step.title}
                            </p>
                            <span style={{ fontSize:"0.58rem", fontWeight:800, padding:"2px 7px", borderRadius:999, background: done ? "#dcfce7" : current ? "#eff6ff" : "#f8fafc", color: done ? "#15803d" : current ? A : "#94a3b8" }}>
                              {state}
                            </span>
                          </div>
                          <p style={{ margin:"4px 0 0", fontSize:"0.68rem", lineHeight:1.5, color:C.muted }}>
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
