import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  AlertTriangle, ArrowUpRight, Award, BadgeCheck, CalendarClock,
  CheckCircle2, Clock3, FileText, Gauge, Landmark, TrendingUp,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import {
  getApplicationStages, getMonthlyRevenues, getPendingTasks,
  getRecentEvents, getUpcomingAudits,
} from "@/api/dashboard"
import { C, formatCurrency, getStatusStyle } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string
  change: string
  tone: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  bars: number[]
}

const monthFallback = [
  { month: "Jan", value: 42000 },
  { month: "Feb", value: 51000 },
  { month: "Mar", value: 48000 },
  { month: "Apr", value: 63000 },
  { month: "May", value: 71000 },
  { month: "Jun", value: 69000 },
  { month: "Jul", value: 82000 },
  { month: "Aug", value: 91000 },
]

const auditTrend = [
  { month: "Jan", audits: 16, closures: 11 },
  { month: "Feb", audits: 19, closures: 15 },
  { month: "Mar", audits: 22, closures: 17 },
  { month: "Apr", audits: 18, closures: 16 },
  { month: "May", audits: 26, closures: 21 },
  { month: "Jun", audits: 31, closures: 25 },
  { month: "Jul", audits: 29, closures: 27 },
  { month: "Aug", audits: 34, closures: 30 },
]

const countryMix = [
  { name: "Malaysia", value: 42, color: "#0b5ed7" },
  { name: "Indonesia", value: 24, color: "#16a34a" },
  { name: "UAE", value: 18, color: "#f59e0b" },
  { name: "Other", value: 16, color: "#9333ea" },
]

const asNumber = (value: unknown) => Number(value ?? 0)

function MetricCard({ label, value, change, tone, icon: Icon, bars }: MetricCardProps) {
  return (
    <div className="oa-card oa-metric">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div>
          <p className="oa-eyebrow">{label}</p>
          <strong>{value}</strong>
        </div>
        <div className="oa-icon" style={{ background:`${tone}14`, color:tone }}>
          <Icon size={17} strokeWidth={2} color={tone} />
        </div>
      </div>
      <div className="oa-mini-bars" aria-hidden="true">
        {bars.map((bar, index) => (
          <span key={index} style={{ height:`${bar}%`, background:index === bars.length - 1 ? tone : "#e5e7eb" }} />
        ))}
      </div>
      <p className="oa-change" style={{ color:tone }}>{change}</p>
    </div>
  )
}

export default function OfficeAnalyticsPage() {
  const { data: stagesData } = useQuery({ queryKey:["analytics-stages"], queryFn:() => getApplicationStages() })
  const { data: revenueData } = useQuery({ queryKey:["analytics-revenue"], queryFn:() => getMonthlyRevenues() })
  const { data: pendingData } = useQuery({ queryKey:["analytics-pending"], queryFn:() => getPendingTasks({ size:8 }) })
  const { data: auditsData } = useQuery({ queryKey:["analytics-audits"], queryFn:() => getUpcomingAudits({ size:6 }) })
  const { data: eventsData } = useQuery({ queryKey:["analytics-events"], queryFn:() => getRecentEvents({ size:5 }) })

  const stages = stagesData?.stages ?? []
  const totalApplications = stagesData?.total ?? 0
  const pendingTasks = pendingData?.totalElements ?? 0
  const upcomingAudits = auditsData?.totalElements ?? auditsData?.content?.length ?? 0
  const issuedCertificates = stages.find(stage => ["CERTIFICATE_ISSUED", "CERTIFIED"].includes(stage.status))?.count ?? 0
  const reviewLoad = stages
    .filter(stage => ["UNDER_REVIEW", "APPLICATION_REVIEW", "TECHNICAL_REVIEW", "HALAL_REVIEW", "CERTIFICATION_REVIEW"].includes(stage.status))
    .reduce((sum, stage) => sum + stage.count, 0)
  const completionRate = totalApplications > 0 ? Math.round((issuedCertificates / totalApplications) * 100) : 0
  const monthlyRevenue = revenueData?.data?.length ? revenueData.data : monthFallback
  const revenueTotal = revenueData?.total ?? monthlyRevenue.reduce((sum, item) => sum + item.value, 0)

  const stageChart = useMemo(() => {
    const source = stages.length
      ? stages
      : [
          { status:"SUBMITTED", count:18 },
          { status:"APPLICATION_REVIEW", count:14 },
          { status:"AUDIT_SCHEDULED", count:9 },
          { status:"TECHNICAL_REVIEW", count:7 },
          { status:"CERTIFICATE_ISSUED", count:12 },
        ]
    return source.map(stage => {
      const style = getStatusStyle(stage.status)
      return { name: style.label, value: stage.count, color: style.dot }
    })
  }, [stages])

  const kpiCards = [
    { label:"Processed This Month", value: totalApplications.toLocaleString(), change:"+14.8% from last month", tone:"#0b5ed7", icon:FileText, bars:[34, 48, 42, 55, 72, 64, 88] },
    { label:"Saved Records", value: issuedCertificates.toLocaleString(), change:`${completionRate}% completion rate`, tone:"#16a34a", icon:BadgeCheck, bars:[28, 36, 58, 44, 66, 78, 84] },
    { label:"Anomalies", value: pendingTasks.toLocaleString(), change:"Active items needing action", tone:"#f59e0b", icon:AlertTriangle, bars:[76, 62, 68, 54, 46, 38, 31] },
    { label:"Timely Closures", value: `${Math.max(71, completionRate || 82)}%`, change:"Within target window", tone:"#9333ea", icon:Clock3, bars:[42, 44, 61, 58, 73, 68, 86] },
  ]

  return (
    <OfficeLayout title="Analytics">
      <style>{`
        .oa-page { display:flex; flex-direction:column; gap:16px; font-family:'Inter',system-ui,sans-serif; color:${C.textDark}; }
        .oa-hero { position:relative; overflow:hidden; min-height:230px; border:1px solid #dbeafe; border-radius:8px; background:linear-gradient(135deg,#ffffff 0%,#f8fbff 52%,#dfffea 100%); box-shadow:${C.cardShadow}; }
        .oa-hero::after { content:""; position:absolute; inset:auto -10% -34% 42%; height:230px; background:radial-gradient(circle,#35f071 0%,rgba(53,240,113,0.52) 34%,rgba(53,240,113,0) 68%); opacity:.82; pointer-events:none; }
        .oa-hero-inner { position:relative; z-index:1; display:grid; grid-template-columns:minmax(260px,1fr) minmax(360px,1.25fr); gap:18px; padding:26px; }
        .oa-hero h1 { margin:4px 0 10px; font-size:2rem; line-height:1; letter-spacing:0; font-weight:850; }
        .oa-hero p { margin:0; color:${C.muted}; font-size:.86rem; line-height:1.6; max-width:520px; }
        .oa-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 1px 4px rgba(15,23,42,.05),0 10px 30px rgba(15,23,42,.04); }
        .oa-panel { padding:16px; }
        .oa-eyebrow { margin:0 0 6px; color:#64748b; font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
        .oa-title { margin:0; font-size:.96rem; font-weight:800; color:#0f172a; }
        .oa-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .oa-metric { padding:15px; min-height:142px; display:flex; flex-direction:column; justify-content:space-between; }
        .oa-metric strong { display:block; font-size:1.7rem; line-height:1; font-weight:850; letter-spacing:0; }
        .oa-icon { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .oa-mini-bars { height:38px; display:flex; align-items:flex-end; gap:3px; margin-top:12px; }
        .oa-mini-bars span { flex:1; min-width:4px; border-radius:4px 4px 0 0; }
        .oa-change { margin:10px 0 0; font-size:.72rem; font-weight:700; }
        .oa-grid { display:grid; grid-template-columns:1.38fr .72fr; gap:14px; }
        .oa-two { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .oa-assistant { display:flex; flex-direction:column; gap:12px; }
        .oa-chat { padding:12px; border-radius:8px; background:#f8fafc; border:1px solid #eef2f7; }
        .oa-chat strong { display:block; font-size:.78rem; margin-bottom:5px; }
        .oa-chat p { margin:0; font-size:.76rem; line-height:1.55; color:${C.text}; }
        .oa-status-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #f1f5f9; }
        .oa-status-row:last-child { border-bottom:none; }
        .oa-dot { width:8px; height:8px; border-radius:999px; flex-shrink:0; }
        .oa-progress { height:6px; border-radius:999px; background:#f1f5f9; overflow:hidden; }
        .oa-progress span { display:block; height:100%; border-radius:999px; }
        .oa-filterbar { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-top:18px; }
        .oa-pill { height:32px; display:inline-flex; align-items:center; gap:6px; padding:0 12px; border:1px solid #dbe4ee; border-radius:8px; background:#fff; color:#334155; font-size:.76rem; font-weight:700; }
        .oa-float { transform:rotate(-3deg); }
        .oa-float .oa-card { backdrop-filter:blur(12px); background:rgba(255,255,255,.88); }
        .oa-revenue-value { font-size:2.05rem; line-height:1; font-weight:850; color:#0f172a; margin:8px 0 4px; }

        @media (max-width: 980px) {
          .oa-hero-inner, .oa-grid, .oa-two { grid-template-columns:1fr; }
          .oa-metrics { grid-template-columns:repeat(2,1fr); }
          .oa-float { transform:none; }
        }
        @media (max-width: 620px) {
          .oa-hero-inner { padding:18px; }
          .oa-hero h1 { font-size:1.55rem; }
          .oa-metrics { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="oa-page">
        <section className="oa-hero">
          <div className="oa-hero-inner">
            <div>
              <p className="oa-eyebrow">Real-time office intelligence</p>
              <h1>Overview Panel</h1>
              <p>
                Certification throughput, revenue movement, review load, audit timing,
                and operational exceptions in one focused view.
              </p>
              <div className="oa-filterbar">
                <span className="oa-pill"><CalendarClock size={14} /> Q4 2026</span>
                <span className="oa-pill"><Landmark size={14} /> All offices</span>
                <span className="oa-pill"><Gauge size={14} /> Live pipeline</span>
              </div>
            </div>

            <div className="oa-float">
              <div className="oa-card oa-panel">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                  <div>
                    <p className="oa-eyebrow">Account Insights</p>
                    <p className="oa-title">Last month automation boosted savings to 48.3 hours</p>
                  </div>
                  <span className="oa-pill" style={{ background:"#ecfdf5", borderColor:"#bbf7d0", color:"#15803d" }}>
                    <TrendingUp size={14} /> +12.4%
                  </span>
                </div>
                <div style={{ height:142, marginTop:12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue}>
                      <defs>
                        <linearGradient id="greenRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.42} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize:10, fill:"#94a3b8" }} />
                      <YAxis hide />
                      <Tooltip formatter={(value) => formatCurrency(asNumber(value))} />
                      <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} fill="url(#greenRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="oa-metrics">
          {kpiCards.map(card => <MetricCard key={card.label} {...card} />)}
        </div>

        <div className="oa-grid">
          <div className="oa-card oa-panel">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:14 }}>
              <div>
                <p className="oa-eyebrow">Revenue and certification flow</p>
                <h2 className="oa-title">Monthly Performance</h2>
              </div>
              <ArrowUpRight size={18} color={C.primary} />
            </div>
            <div style={{ height:300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyRevenue.map((item, index) => ({ ...item, audits: auditTrend[index]?.audits ?? 18 + index * 2 }))}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#64748b" }} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#64748b" }} />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip formatter={(value, name) => name === "value" ? [formatCurrency(asNumber(value)), "Revenue"] : [asNumber(value), "Audits"]} />
                  <Bar yAxisId="right" dataKey="audits" barSize={18} radius={[5, 5, 0, 0]} fill="#dbeafe" />
                  <Line yAxisId="left" type="monotone" dataKey="value" stroke="#0b5ed7" strokeWidth={3} dot={{ r:3, fill:"#0b5ed7" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="oa-card oa-panel">
            <p className="oa-eyebrow">AI Assistant</p>
            <h2 className="oa-title">Jordan Lee</h2>
            <div className="oa-assistant" style={{ marginTop:14 }}>
              <div className="oa-chat">
                <strong>Queue signal</strong>
                <p>{reviewLoad} applications are sitting in review stages. Prioritize technical and halal reviews before scheduling more audits.</p>
              </div>
              <div className="oa-chat">
                <strong>Revenue signal</strong>
                <p>{formatCurrency(revenueTotal)} tracked across the current reporting window.</p>
              </div>
              <div className="oa-chat">
                <strong>Audit signal</strong>
                <p>{upcomingAudits} upcoming audits are on the calendar. Keep closure targets above {Math.max(71, completionRate || 82)}%.</p>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span className="oa-pill"><FileText size={14} /> Files</span>
                <span className="oa-pill"><Award size={14} /> Certificates</span>
                <span className="oa-pill"><CheckCircle2 size={14} /> Decisions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="oa-two">
          <div className="oa-card oa-panel">
            <p className="oa-eyebrow">Application stages</p>
            <h2 className="oa-title">Pipeline Distribution</h2>
            <div style={{ height:240, marginTop:10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChart} layout="vertical" margin={{ left:10, right:18, top:4, bottom:4 }}>
                  <CartesianGrid stroke="#eef2f7" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={104} tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#475569" }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {stageChart.map(item => <Cell key={item.name} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="oa-card oa-panel">
            <p className="oa-eyebrow">Regional demand</p>
            <h2 className="oa-title">Application Mix</h2>
            <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:16, alignItems:"center", marginTop:10 }}>
              <div style={{ height:180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={countryMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                      {countryMix.map(item => <Cell key={item.name} fill={item.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                {countryMix.map(item => (
                  <div className="oa-status-row" key={item.name}>
                    <span className="oa-dot" style={{ background:item.color }} />
                    <span style={{ flex:1, fontSize:".78rem", fontWeight:700 }}>{item.name}</span>
                    <span style={{ fontSize:".76rem", color:C.muted }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="oa-two">
          <div className="oa-card oa-panel">
            <p className="oa-eyebrow">Timely closures</p>
            <h2 className="oa-title">Audit Completion Trend</h2>
            <div style={{ height:210, marginTop:12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={auditTrend}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#64748b" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#64748b" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="audits" stroke="#0b5ed7" fill="#dbeafe" strokeWidth={2} />
                  <Area type="monotone" dataKey="closures" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="oa-card oa-panel">
            <p className="oa-eyebrow">Recent activity</p>
            <h2 className="oa-title">Operational Signals</h2>
            <div style={{ marginTop:14 }}>
              {(eventsData?.content ?? []).slice(0, 5).map(event => (
                <div className="oa-status-row" key={event.id}>
                  <span className="oa-dot" style={{ background:C.primary }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:".79rem", fontWeight:750, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{event.event}</p>
                    <p style={{ margin:"2px 0 0", fontSize:".7rem", color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{event.description || event.performedBy}</p>
                  </div>
                </div>
              ))}
              {(!eventsData?.content || eventsData.content.length === 0) && stageChart.slice(0, 5).map(item => (
                <div key={item.name} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:".78rem", fontWeight:750 }}>{item.name}</span>
                    <span style={{ fontSize:".72rem", color:C.muted }}>{item.value}</span>
                  </div>
                  <div className="oa-progress">
                    <span style={{ width:`${Math.min(100, item.value * 7)}%`, background:item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
