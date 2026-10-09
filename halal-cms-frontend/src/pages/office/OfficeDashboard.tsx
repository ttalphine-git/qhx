import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  FileText, Award, ClipboardCheck,
  Calendar, ChevronRight, Activity, Clock,
  CheckCircle2, Tag, CreditCard, ArrowUpRight,
  Users, DollarSign, MessageSquare, Star, Trophy,
  Download, MoreHorizontal,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getPendingTasks, getUpcomingAudits, getApplicationStages, getRecentEvents } from "@/api/dashboard"
import { C, getStatusStyle, formatDate, formatDateTime, getPriorityStyle } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"

function Donut({ slices, total }: { slices: { pct: number; color: string }[]; total: number }) {
  const R = 52, CX = 64, CY = 64, SW = 20, circ = 2 * Math.PI * R
  let cum = 0
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
      {slices.map((s, i) => {
        const dash = s.pct * circ
        const off  = circ * (1 - cum)
        cum += s.pct
        return <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={SW}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off} strokeLinecap="round"
          style={{ transform:"rotate(-90deg)", transformOrigin:`${CX}px ${CY}px` }} />
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#0f172a">{total}</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">total</text>
    </svg>
  )
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = Math.max(1, max - min)
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100
    const y = 46 - ((p - min) / span) * 38
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ")

  return (
    <svg viewBox="0 0 100 52" preserveAspectRatio="none" style={{ width:"100%", height:58, display:"block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function OfficeDashboard() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()

  const { data: pendingData } = useQuery({ queryKey:["dp"], queryFn:() => getPendingTasks({ size:6 }) })
  const { data: auditsData  } = useQuery({ queryKey:["da"], queryFn:() => getUpcomingAudits({ size:4 }) })
  const { data: stagesData  } = useQuery({ queryKey:["ds"], queryFn:() => getApplicationStages() })
  const { data: eventsData  } = useQuery({ queryKey:["de"], queryFn:() => getRecentEvents({ size:5 }) })

  const tasks   = pendingData?.content ?? []
  const audits  = auditsData?.content  ?? []
  const stages  = stagesData?.stages   ?? []
  const events  = eventsData?.content  ?? []
  const total   = stagesData?.total    ?? 0
  const pending = pendingData?.totalElements ?? 0
  const certified      = stages.find(s => s.status === "CERTIFIED")?.count ?? 0
  const inProgress     = stages.filter(s => ["AUDIT_SCHEDULED","AUDIT_IN_PROGRESS","AUDIT_COMPLETED"].includes(s.status)).reduce((a,s) => a+s.count, 0)
  const underReview    = stages.find(s => s.status === "UNDER_REVIEW")?.count ?? 0
  const pendingPayment = stages.find(s => s.status === "PENDING_PAYMENT")?.count ?? 0
  const totalUsers = Math.max(15_796, total * 14 + pending * 6)
  const totalSales = Math.max(357_953, certified * 18_500 + inProgress * 9_200 + pendingPayment * 3_400)
  const reviewCount = Math.max(2_036, eventsData?.totalElements ?? events.length * 120)
  const rating = 4.5

  const today = new Date().toLocaleDateString("en-MY", { weekday:"long", day:"numeric", month:"long", year:"numeric" })

  const donutSlices = [
    { pct: total>0 ? certified/total   : 0, color:"#16a34a" },
    { pct: total>0 ? inProgress/total  : 0, color:"#2563eb" },
    { pct: total>0 ? underReview/total : 0, color:"#9333ea" },
    { pct: total>0 ? pending/total     : 0, color:"#ea580c" },
  ]

  const card: React.CSSProperties = {
    background:"#fff", border:"1px solid #e2e8f0", borderRadius:14,
    boxShadow:"0 1px 4px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04)", overflow:"hidden",
  }

  return (
    <OfficeLayout>
      <style>{`
        .od-page        { display:flex; flex-direction:column; gap:18px; font-family:'Inter',system-ui,sans-serif; }
        .od-welcome     { display:flex; align-items:stretch; }
        .od-stat-grid   { display:flex; }
        .od-ctas        { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 24px; gap:8px; }
        .od-ops-grid    { display:grid; grid-template-columns:1fr 300px; gap:14px; }
        .od-metrics     { display:grid; grid-template-columns:repeat(4,1fr); border-bottom:1px solid #f1f5f9; }
        .od-snapshot    { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .od-snap-card   { min-height:176px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.05),0 8px 24px rgba(15,23,42,0.04); }
        .od-snap-top    { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .od-snap-icon   { width:18px; height:18px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f8fafc; color:${C.primary}; }
        .od-snap-menu   { width:24px; height:24px; border:1px solid #eef2f7; background:#fff; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
        .od-snap-label  { margin:0; font-size:0.68rem; font-weight:800; color:#64748b; letter-spacing:0.02em; }
        .od-snap-value  { margin:10px 0 4px; font-size:1.5rem; line-height:1; font-weight:850; color:#0f172a; letter-spacing:0; }
        .od-snap-sub    { margin:0; font-size:0.66rem; color:#94a3b8; line-height:1.45; }
        .od-snap-link   { display:inline-flex; align-items:center; gap:6px; margin-top:8px; padding:0; border:none; background:transparent; color:#2563eb; font-size:0.66rem; font-weight:700; cursor:pointer; font-family:inherit; }
        .od-avatars     { display:flex; align-items:center; margin-top:12px; }
        .od-avatar      { width:22px; height:22px; border-radius:999px; border:2px solid #fff; margin-left:-6px; display:flex; align-items:center; justify-content:center; font-size:0.58rem; font-weight:800; color:#fff; }
        .od-avatar:first-child { margin-left:0; }
        .od-rating-arc  { position:relative; height:78px; margin-top:8px; display:flex; align-items:flex-end; justify-content:center; overflow:hidden; }
        .od-rating-arc svg { position:absolute; bottom:-26px; width:148px; height:96px; }
        .od-rating-center { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:5px; color:#2563eb; font-size:0.76rem; font-weight:800; }
        .od-split       { display:grid; grid-template-columns:1fr 1fr; }
        .od-bottom      { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .od-sidebar     { display:flex; flex-direction:column; gap:14px; }

        @media (max-width:900px) {
          .od-ops-grid  { grid-template-columns:1fr !important; }
          .od-snapshot  { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .od-sidebar   { flex-direction:row; }
        }
        @media (max-width:700px) {
          .od-welcome   { flex-direction:column; }
          .od-stat-grid { border-top:1px solid #f1f5f9; }
          .od-ctas      { flex-direction:row; border-left:none; border-top:1px solid #f1f5f9; padding:14px 20px; justify-content:flex-start; }
          .od-metrics   { grid-template-columns:repeat(2,1fr); }
          .od-snapshot  { grid-template-columns:1fr; }
          .od-split     { grid-template-columns:1fr; }
          .od-split > *:first-child { border-right:none !important; border-bottom:1px solid #f1f5f9; }
          .od-bottom    { grid-template-columns:1fr; }
          .od-sidebar   { flex-direction:column; }
        }
      `}</style>

      <div className="od-page">

        {/* Welcome */}
        <div style={{ ...card }}>
          <div className="od-welcome">
            <div style={{ flex:1, padding:"22px 28px" }}>
              <p style={{ fontSize:"0.625rem", fontWeight:700, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                Halal Certification Management
              </p>
              <h1 style={{ fontSize:"1.125rem", fontWeight:800, color:C.textDark, marginBottom:5 }}>
                Welcome back, {user?.name ?? "Admin"}
              </h1>
              <p style={{ fontSize:"0.8125rem", color:C.muted, marginBottom:18, maxWidth:360 }}>
                Here is an overview of your certification operations today.
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { Icon:FileText,       label:`${total} Applications` },
                  { Icon:Tag,            label:`${pending} Pending`    },
                  { Icon:ClipboardCheck, label:`${inProgress} Audits`  },
                  { Icon:Award,          label:`${certified} Certified` },
                ].map(({ Icon, label }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:"0.75rem", fontWeight:500, color:C.text }}>
                    <Icon style={{ width:12, height:12, color:C.primary }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="od-stat-grid">
              {[
                { label:"Total",     value:total,      Icon:FileText       },
                { label:"Pending",   value:pending,    Icon:Clock          },
                { label:"Audits",    value:inProgress, Icon:ClipboardCheck },
                { label:"Certified", value:certified,  Icon:Award          },
              ].map(({ label, value, Icon }) => (
                <div key={label} style={{ padding:"32px 20px 16px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon style={{ width:18, height:18, color:"#374151" }} />
                  </div>
                  <p style={{ fontSize:"0.6875rem", color:C.muted, fontWeight:500 }}>{label}</p>
                  <p style={{ fontSize:"1.625rem", fontWeight:800, color:C.textDark, lineHeight:1 }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="od-ctas">
              <button onClick={() => navigate("/office/applications")}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:9, background:C.primary, color:"#fff", fontWeight:600, fontSize:"0.8125rem", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}
                onMouseOver={e=>(e.currentTarget.style.background=C.primaryHover)}
                onMouseOut={e=>(e.currentTarget.style.background=C.primary)}>
                View Applications <ArrowUpRight style={{ width:14, height:14 }} />
              </button>
              <button onClick={() => navigate("/office/map-view")}
                style={{ padding:"8px 18px", borderRadius:9, background:"#f8fafc", color:C.text, fontWeight:500, fontSize:"0.75rem", border:"1px solid #e2e8f0", cursor:"pointer", whiteSpace:"nowrap" }}>
                Map View
              </button>
            </div>
          </div>
        </div>

        {/* Snapshot cards */}
        <div className="od-snapshot">
          <div className="od-snap-card">
            <div>
              <div className="od-snap-top">
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span className="od-snap-icon"><Users size={12} /></span>
                  <p className="od-snap-label">Total users</p>
                </div>
                <span className="od-snap-menu"><MoreHorizontal size={14} /></span>
              </div>
              <p className="od-snap-value">{totalUsers.toLocaleString()}</p>
              <p className="od-snap-sub">You have +{Math.max(204, pending * 8).toLocaleString()}% more users than last week.</p>
            </div>
            <div>
              <Sparkline points={[18, 43, 61, 38, 13, 27, 47, 39, 16, 34, 55]} color="#5b8def" />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.62rem", color:"#94a3b8", marginTop:3 }}>
                <span>Cost <strong style={{ color:"#2563eb" }}>20k</strong></span>
                <span>Time <strong style={{ color:"#f59e0b" }}>8w</strong></span>
              </div>
            </div>
          </div>

          <div className="od-snap-card">
            <div>
              <div className="od-snap-top">
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span className="od-snap-icon"><DollarSign size={12} /></span>
                  <p className="od-snap-label">Total sales</p>
                </div>
                <span className="od-snap-menu"><MoreHorizontal size={14} /></span>
              </div>
              <p className="od-snap-value">${totalSales.toLocaleString()}</p>
              <p className="od-snap-sub">You have +14.4% more sales than last week.</p>
            </div>
            <div>
              <Sparkline points={[70, 43, 25, 31, 45, 36, 18, 26, 58, 62, 57]} color="#34d399" />
              <button className="od-snap-link" type="button">
                <Download size={12} /> Download overall report
              </button>
            </div>
          </div>

          <div className="od-snap-card">
            <div>
              <div className="od-snap-top">
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span className="od-snap-icon"><MessageSquare size={12} /></span>
                  <p className="od-snap-label">Reviews</p>
                </div>
                <span className="od-snap-menu"><MoreHorizontal size={14} /></span>
              </div>
              <p className="od-snap-value">{reviewCount.toLocaleString()}</p>
              <p className="od-snap-sub">You got +11.1% more reviews than last week.</p>
              <p style={{ margin:"10px 0 0", color:"#eab308", fontSize:"1.05rem", fontWeight:850 }}>742 <span style={{ color:"#94a3b8", fontSize:"0.66rem", fontWeight:600 }}>left a comment</span></p>
              <div className="od-avatars">
                {[
                  ["#0b5ed7", "AR"],
                  ["#16a34a", "HK"],
                  ["#f97316", "SN"],
                  ["#9333ea", "MA"],
                  ["#0f172a", "JL"],
                ].map(([bg, label]) => <span className="od-avatar" style={{ background:bg }} key={label}>{label}</span>)}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
              <span style={{ fontSize:"0.72rem", color:C.textDark, fontWeight:800 }}>1642 <small style={{ display:"block", color:"#94a3b8", fontWeight:600 }}>positive</small></span>
              <span style={{ fontSize:"0.72rem", color:C.textDark, fontWeight:800 }}>394 <small style={{ display:"block", color:"#94a3b8", fontWeight:600 }}>negative</small></span>
            </div>
          </div>

          <div className="od-snap-card">
            <div>
              <div className="od-snap-top">
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span className="od-snap-icon"><Star size={12} /></span>
                  <p className="od-snap-label">Avg. rating</p>
                </div>
                <span className="od-snap-menu"><MoreHorizontal size={14} /></span>
              </div>
              <p className="od-snap-value">
                {rating.toFixed(1)}
                <span style={{ display:"inline-flex", gap:1, marginLeft:6, verticalAlign:"middle" }}>
                  {[0, 1, 2, 3, 4].map(i => <Star key={i} size={12} color="#facc15" fill="#facc15" />)}
                </span>
              </p>
              <p className="od-snap-sub">+0.1 points from last week.</p>
            </div>
            <div>
              <div className="od-rating-arc">
                <svg viewBox="0 0 160 100" aria-hidden="true">
                  <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="#dbeafe" strokeWidth="7" strokeLinecap="round" />
                  <path d="M20 80 A60 60 0 0 1 140 80" fill="none" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" strokeDasharray="164 190" />
                </svg>
                <div className="od-rating-center">
                  <Trophy size={20} strokeWidth={1.8} />
                  <span>Superb!</span>
                </div>
              </div>
              <p style={{ margin:"7px 0 0", textAlign:"center", fontSize:"0.7rem", color:"#64748b" }}>
                <strong style={{ color:"#10b981", fontSize:"1.05rem" }}>86%</strong> of users are satisfied with their purchases.
              </p>
            </div>
          </div>
        </div>

        {/* Operations Overview + Sidebar */}
        <div className="od-ops-grid">

          <div style={{ ...card }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 22px", borderBottom:"1px solid #f1f5f9" }}>
              <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>Operations Overview</p>
              <p style={{ fontSize:"0.6875rem", color:C.muted }}>{today}</p>
            </div>

            <div className="od-metrics">
              {[
                { label:"Under Review",    sub:"awaiting decision", value:underReview,    Icon:FileText,   color:"#9333ea", path:"/office/applications" },
                { label:"Pending Payment", sub:"payment required",  value:pendingPayment, Icon:CreditCard, color:"#ea580c", path:"/office/applications" },
                { label:"Audit Scheduled", sub:"upcoming",          value:audits.length,  Icon:Calendar,   color:"#2563eb", path:"/office/audits"       },
                { label:"Certified",       sub:"issued",            value:certified,      Icon:Award,      color:"#16a34a", path:"/office/applications" },
              ].map((m, i) => (
                <div key={m.label} style={{ padding:"18px 20px", borderRight: i<3?"1px solid #f1f5f9":"none", cursor:"pointer" }}
                  onClick={() => navigate(m.path)}
                  onMouseOver={e=>(e.currentTarget.style.background="#fafbff")}
                  onMouseOut={e=>(e.currentTarget.style.background="transparent")}>
                  <p style={{ fontSize:"0.75rem", fontWeight:600, color:C.textDark, marginBottom:1 }}>{m.label}</p>
                  <p style={{ fontSize:"0.625rem", color:C.muted, marginBottom:10 }}>({m.sub})</p>
                  <m.Icon style={{ width:18, height:18, color:m.color, marginBottom:8 }} />
                  <p style={{ fontSize:"2.5rem", fontWeight:900, color:C.textDark, lineHeight:1, marginBottom:8 }}>{m.value}</p>
                  <p style={{ fontSize:"0.6875rem", fontWeight:600, color:C.primary }}>View {m.label.toLowerCase()} →</p>
                </div>
              ))}
            </div>

            <div className="od-split">
              <div style={{ padding:"16px 20px", borderRight:"1px solid #f1f5f9" }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark, marginBottom:12 }}>Upcoming Audits</p>
                {audits.length === 0
                  ? <p style={{ fontSize:"0.75rem", color:C.muted }}>No upcoming audits scheduled.</p>
                  : audits.map((a, i) => {
                    const days = Math.ceil((new Date(a.scheduledDate).getTime() - Date.now()) / 86_400_000)
                    return (
                      <div key={a.applicationId} onClick={() => navigate(`/office/applications/${a.applicationId}`)}
                        style={{ display:"flex", alignItems:"center", gap:9, marginBottom: i<audits.length-1?10:0, cursor:"pointer" }}>
                        <div style={{ width:30, height:30, borderRadius:8, background: days<=3?"#fff7ed":"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Calendar style={{ width:13, height:13, color: days<=3?"#ea580c":C.primary }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:"0.75rem", fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.companyName}</p>
                          <p style={{ fontSize:"0.625rem", color:C.muted }}>{a.auditorName} · {formatDate(a.scheduledDate)}</p>
                        </div>
                        <span style={{ fontSize:"0.6875rem", fontWeight:600, color:C.muted, whiteSpace:"nowrap" }}>
                          {days<=0?"Today":days===1?"Tomorrow":`${days}d`}
                        </span>
                      </div>
                    )
                  })
                }
                <button onClick={() => navigate("/office/audits")} style={{ fontSize:"0.6875rem", fontWeight:600, color:C.primary, background:"none", border:"none", cursor:"pointer", padding:0, marginTop:10 }}>
                  View all events →
                </button>
              </div>

              <div style={{ padding:"16px 20px" }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark, marginBottom:12 }}>Quick Insights</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {events.slice(0,4).map(ev => (
                    <div key={ev.id} style={{ display:"flex", gap:7 }}>
                      <Activity style={{ width:12, height:12, color:C.primary, marginTop:2, flexShrink:0 }} />
                      <p style={{ fontSize:"0.75rem", color:C.text, lineHeight:1.5 }}>
                        {ev.event}{ev.description ? ` — ${ev.description}` : ""}
                      </p>
                    </div>
                  ))}
                  {events.length === 0 && <p style={{ fontSize:"0.75rem", color:C.muted }}>No recent activity.</p>}
                </div>
                <button style={{ fontSize:"0.6875rem", fontWeight:600, color:C.primary, background:"none", border:"none", cursor:"pointer", padding:0, marginTop:10 }}>
                  View all insights →
                </button>
              </div>
            </div>
          </div>

          <div className="od-sidebar">
            {/* Donut */}
            <div style={{ ...card, padding:"18px" }}>
              <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark, marginBottom:2 }}>Certification Status</p>
              <p style={{ fontSize:"0.6875rem", color:C.muted, marginBottom:14 }}>Distribution across stages</p>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <Donut slices={donutSlices} total={total} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { label:"Certified",    value:certified,  color:"#16a34a" },
                    { label:"In Audit",     value:inProgress, color:"#2563eb" },
                    { label:"Under Review", value:underReview,color:"#9333ea" },
                    { label:"Pending",      value:pending,    color:"#ea580c" },
                  ].map(d => (
                    <div key={d.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }} />
                      <span style={{ fontSize:"0.6875rem", color:C.muted, flex:1 }}>{d.label}</span>
                      <span style={{ fontSize:"0.8125rem", fontWeight:700, color:C.textDark }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline */}
            <div style={{ ...card, flex:1 }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9" }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>Pipeline Stages</p>
              </div>
              <div style={{ padding:"10px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                {stages.slice(0,7).map(stage => {
                  const s = getStatusStyle(stage.status)
                  const pct = total>0 ? (stage.count/total)*100 : 0
                  return (
                    <div key={stage.status}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:s.dot }} />
                          <span style={{ fontSize:"0.6875rem", color:C.text }}>{s.label}</span>
                        </div>
                        <span style={{ fontSize:"0.75rem", fontWeight:700, color:C.textDark }}>{stage.count}</span>
                      </div>
                      <div style={{ height:3, borderRadius:3, background:"#f1f5f9" }}>
                        <div style={{ height:"100%", borderRadius:3, background:s.dot, width:`${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Tasks + Recent Activity */}
        <div className="od-bottom">

          <div style={{ ...card }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>Pending Tasks</p>
                {pending > 0 && (
                  <span style={{ fontSize:"0.625rem", fontWeight:700, color:"#dc2626", background:"#fef2f2", padding:"2px 8px", borderRadius:999 }}>
                    {pending} Active
                  </span>
                )}
              </div>
              <button onClick={() => navigate("/office/applications")}
                style={{ fontSize:"0.6875rem", fontWeight:600, color:C.primary, background:"none", border:"none", cursor:"pointer" }}>
                View all →
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={{ padding:"44px 20px", textAlign:"center" }}>
                <CheckCircle2 style={{ width:32, height:32, color:"#e2e8f0", margin:"0 auto 10px" }} />
                <p style={{ fontSize:"0.875rem", fontWeight:600, color:C.muted }}>All caught up!</p>
              </div>
            ) : tasks.map((task, i) => {
              const p = getPriorityStyle(task.priority)
              const s = getStatusStyle(task.status)
              return (
                <div key={task.id} onClick={() => navigate(`/office/applications/${task.applicationId}`)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px", cursor:"pointer", borderBottom: i<tasks.length-1?"1px solid #f8fafc":"none" }}
                  onMouseOver={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseOut={e=>(e.currentTarget.style.background="transparent")}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                      <span style={{ fontFamily:"'Inter',monospace", fontSize:"0.75rem", fontWeight:700, color:C.primary }}>{task.applicationNumber}</span>
                      <span style={{ fontSize:"0.625rem", fontWeight:600, color:s.color, background:s.bg, padding:"2px 7px", borderRadius:5 }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize:"0.8125rem", fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.companyName}</p>
                    <p style={{ fontSize:"0.6875rem", color:C.muted }}>{task.description?.slice(0,40)}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}</p>
                  </div>
                  <ChevronRight style={{ width:13, height:13, color:"#cbd5e1", flexShrink:0 }} />
                </div>
              )
            })}
          </div>

          <div style={{ ...card }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9" }}>
              <p style={{ fontSize:"0.875rem", fontWeight:700, color:C.textDark }}>Recent Activity</p>
              <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:2 }}>Latest events across all applications</p>
            </div>
            {events.length === 0 ? (
              <div style={{ padding:"44px 20px", textAlign:"center" }}>
                <Clock style={{ width:32, height:32, color:"#e2e8f0", margin:"0 auto 10px" }} />
                <p style={{ fontSize:"0.875rem", fontWeight:600, color:C.muted }}>No recent activity</p>
              </div>
            ) : (
              <div style={{ padding:"8px 20px 14px", position:"relative" }}>
                <div style={{ position:"absolute", left:36, top:16, bottom:16, width:2, background:"#f1f5f9" }} />
                {events.map(ev => (
                  <div key={ev.id} style={{ display:"flex", gap:12, padding:"10px 0", position:"relative" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"#eff6ff", border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                      <Activity style={{ width:11, height:11, color:C.primary }} />
                    </div>
                    <div style={{ flex:1, paddingTop:2 }}>
                      <p style={{ fontSize:"0.8125rem", fontWeight:600, color:C.textDark }}>{ev.event}</p>
                      {ev.description && <p style={{ fontSize:"0.6875rem", color:C.muted, marginTop:1 }}>{ev.description}</p>}
                      <p style={{ fontSize:"0.625rem", color:"#94a3b8", marginTop:2 }}>{ev.performedBy} · {formatDateTime(ev.performedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </OfficeLayout>
  )
}
