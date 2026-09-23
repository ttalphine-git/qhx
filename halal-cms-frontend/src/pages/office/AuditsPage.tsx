import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Calendar, Clock, User, ChevronRight, ClipboardCheck,
  AlertTriangle, CheckCircle2, Eye,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { getUpcomingAudits } from "@/api/dashboard"
import { getApplications } from "@/api/applications"
import { getAuditReportConfigurations, type AuditReportConfigurationDto } from "@/api/audits"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import { DEFAULT_AUDIT_TRACKS, type AuditTrack } from "@/lib/hcbWorkflow"
import { loadActivityCategorySettings } from "@/lib/activityOptions"

type Tab = "upcoming" | "scheduled" | "in_progress" | "completed"

const TABS: { key: Tab; label: string; icon: typeof Calendar; statuses: string }[] = [
  { key: "upcoming",    label: "Upcoming",    icon: Calendar,      statuses: "" },
  { key: "scheduled",   label: "Scheduled",   icon: Clock,         statuses: "AUDIT_SCHEDULED" },
  { key: "in_progress", label: "In Progress", icon: AlertTriangle, statuses: "AUDIT_IN_PROGRESS" },
  { key: "completed",   label: "Completed",   icon: CheckCircle2,  statuses: "AUDIT_COMPLETED" },
]

const auditConfigToTrack = (config: AuditReportConfigurationDto): AuditTrack => ({
  dbId: config.id,
  id: config.id ? `db-${config.id}` : config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name: config.name,
  reportTitle: config.reportTitle,
  appliesTo: config.appliesTo,
  activityCategoryKeys: config.activityCategoryKeys ?? [],
  riskLevel: config.riskLevel,
  formCode: config.formCode,
  revision: config.revision,
  stages: config.stages ?? [],
  questions: (config.questions ?? []).map(question => question.questionText),
})

export default function AuditsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("upcoming")
  const activityCategories = loadActivityCategorySettings()
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(activityCategories[0]?.key ?? "mfg")
  const { data: auditConfigs } = useQuery({
    queryKey: ["audit-report-configurations"],
    queryFn: getAuditReportConfigurations,
  })
  const auditTracks = auditConfigs?.length ? auditConfigs.map(auditConfigToTrack) : DEFAULT_AUDIT_TRACKS
  const selectedCategory = activityCategories.find(category => category.key === selectedCategoryKey) ?? activityCategories[0]
  const selectedTrack = auditTracks.find(track => (track.activityCategoryKeys ?? []).includes(selectedCategoryKey)) ?? auditTracks[0]

  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-audits"],
    queryFn: () => getUpcomingAudits({ size: 30 }),
    enabled: tab === "upcoming",
  })

  const currentTab = TABS.find(t => t.key === tab)!

  const { data: appsData, isLoading: loadingApps } = useQuery({
    queryKey: ["audit-apps", tab],
    queryFn: () => getApplications({ statuses: currentTab.statuses, size: 30 }),
    enabled: tab !== "upcoming" && !!currentTab.statuses,
  })

  return (
    <OfficeLayout title="Audits">
      <div className="p-6">
        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === key ? C.white : "transparent",
                color: tab === key ? C.primary : C.muted,
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {selectedTrack && (
          <div className="rounded-xl p-5 mb-6" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: C.textDark }}>{selectedTrack.reportTitle ?? selectedTrack.name}</h2>
                <p className="text-sm mt-1" style={{ color: C.muted }}>
                  {selectedCategory ? `${selectedCategory.label} activity category` : "Activity category"} | {selectedTrack.appliesTo}
                </p>
                {(selectedTrack.formCode || selectedTrack.revision) && (
                  <p className="text-xs mt-1" style={{ color: C.muted }}>{[selectedTrack.formCode, selectedTrack.revision].filter(Boolean).join(" | ")}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {activityCategories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategoryKey(category.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: selectedCategoryKey === category.key ? C.primary : "#f8fafc",
                      color: selectedCategoryKey === category.key ? C.white : C.text,
                      border: `1px solid ${selectedCategoryKey === category.key ? C.primary : C.border}`,
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="flex flex-wrap gap-2">
                {selectedTrack.stages.map((stage, index) => (
                  <div key={stage} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" style={{ background: "#f0f7ff", color: C.primary }}>
                      {index + 1}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#f8fafc", color: C.text }}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ background: "#f8fafc", border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Configured Questions ({selectedTrack.questions.length})</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: selectedTrack.riskLevel === "Critical" ? "#fde7e9" : selectedTrack.riskLevel === "High" ? "#fff8e5" : "#e6f4e6", color: selectedTrack.riskLevel === "Critical" ? "#d13438" : selectedTrack.riskLevel === "High" ? "#8a6000" : "#107c10" }}>
                    {selectedTrack.riskLevel}
                  </span>
                </div>
                <ul className="space-y-2">
                  {selectedTrack.questions.slice(0, 3).map(question => (
                    <li key={question} className="text-xs leading-relaxed" style={{ color: C.text }}>{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming tab — card list */}
        {tab === "upcoming" && (
          <div className="space-y-3">
            {loadingUpcoming ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 animate-pulse"
                  style={{ background: C.white, border: `1px solid ${C.border}`, height: 84 }}
                />
              ))
            ) : (upcomingData?.content ?? []).length === 0 ? (
              <div
                className="rounded-xl p-16 text-center"
                style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
              >
                <Calendar className="w-9 h-9 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                <p className="font-medium" style={{ color: C.muted }}>No upcoming audits</p>
              </div>
            ) : (
              (upcomingData?.content ?? []).map(audit => {
                const days = Math.ceil(
                  (new Date(audit.scheduledDate).getTime() - Date.now()) / 86_400_000
                )
                const urgent = days >= 0 && days <= 3
                const daysLabel =
                  days < 0 ? "Overdue" :
                  days === 0 ? "Today" :
                  days === 1 ? "Tomorrow" :
                  `In ${days} days`

                return (
                  <div
                    key={audit.applicationId}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
                    style={{
                      background: C.white,
                      border: `1px solid ${urgent ? "#ffb900" : C.border}`,
                    }}
                    onClick={() => navigate(`/office/applications/${audit.applicationId}`)}
                    onMouseOver={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseOut={e => (e.currentTarget.style.background = C.white)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: urgent ? "#fff8e5" : "#f0f7ff" }}
                      >
                        <Calendar
                          className="w-5 h-5"
                          style={{ color: urgent ? "#ffb900" : C.primary }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm" style={{ color: C.textDark }}>
                            {audit.companyName}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#f3f4f6", color: C.muted }}
                          >
                            {audit.applicationNumber}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#dbeef9", color: "#0067b8" }}
                          >
                            {audit.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: C.muted }}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(audit.scheduledDate)}
                            {audit.durationDays > 1 && ` · ${audit.durationDays} days`}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {audit.auditorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {days <= 7 && (
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{
                            background: urgent ? "#fff8e5" : "#f0f7ff",
                            color: urgent ? "#8a6000" : C.primary,
                          }}
                        >
                          {daysLabel}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" style={{ color: C.muted }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Other tabs — table */}
        {tab !== "upcoming" && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                  {["App #", "Company", "Status", "Auditor", "Country", "Updated", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingApps ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 rounded animate-pulse" style={{ background: "#f0f0f0" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (appsData?.content ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                      <p className="text-sm" style={{ color: C.muted }}>No applications in this stage</p>
                    </td>
                  </tr>
                ) : (
                  (appsData?.content ?? []).map(app => {
                    const s = getStatusStyle(app.status)
                    return (
                      <tr
                        key={app.id}
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-semibold" style={{ color: C.primary }}>
                            {app.applicationNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-sm" style={{ color: C.textDark }}>
                          {app.companyName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: s.bg, color: s.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>
                          {app.assignedAuditorName ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>
                          {app.country ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>
                          {formatDate(app.updatedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/office/applications/${app.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: "#f0f7ff", color: C.primary }}
                            onMouseOver={e => (e.currentTarget.style.background = "#dbeef9")}
                            onMouseOut={e => (e.currentTarget.style.background = "#f0f7ff")}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
