import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { X, ChevronLeft, ChevronRight, MessageSquare, CalendarDays } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import "@/styles/audit.css"
import apiClient from "@/api/client"
import { getApplications, updateApplicationStatus } from "@/api/applications"
import {
  getApplicationAuditReport,
  getAuditPlan,
  getAuditReportConfigurations,
  saveApplicationAuditReport,
  saveAuditPlan as saveAuditPlanApi,
  type ApplicationAuditReportDto,
  type AuditReportConfigurationDto,
} from "@/api/audits"
import { getMgmtUsers } from "@/api/users"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import { DEFAULT_AUDIT_TRACKS, type AuditTrack } from "@/lib/hcbWorkflow"
import { CHECKLISTS, REFERENCE, type AuditType } from "@/lib/uploaded-audit/checklists"
import { DEFAULT_ACTIVITY_CATEGORY_SETTINGS } from "@/lib/activityOptions"
import { addNotification } from "@/lib/notifications"
import { useAuthStore } from "@/store/authStore"
import type { UserListDto } from "@/types"
import {
  loadAuditDatePreference, markAuditDatePreferenceOverwritten,
} from "@/lib/billing"

const F    = "'Inter', system-ui, sans-serif"
const BLUE = "#2563eb"
const DARK = "#111827"

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type AuditAnswerValue = "" | "yes" | "no" | "na"
type AuditFindingValue = "" | "nc" | "obs"
type AuditQuestionAnswer = {
  answer: AuditAnswerValue
  finding: AuditFindingValue
  customerComment: string
  auditorComment: string
  shariaComment: string
  ncDescription: string
  obsDescription: string
  ncEvidence: { name: string; data: string; size: number }[]
  obsEvidence: { name: string; data: string; size: number }[]
  customerEvidence: { name: string; data: string; size: number }[]
  auditorEvidence: { name: string; data: string; size: number }[]
  shariaEvidence: { name: string; data: string; size: number }[]
}
type AuditQuestionNode = { index: number; label: string; text: string }
type AuditSectionNode = { id: string; title: string; questions: AuditQuestionNode[] }
type AuditPartNode = { id: string; title: string; sections: AuditSectionNode[] }

const blankAuditAnswer = (): AuditQuestionAnswer => ({
  answer: "",
  finding: "",
  customerComment: "",
  auditorComment: "",
  shariaComment: "",
  ncDescription: "",
  obsDescription: "",
  ncEvidence: [],
  obsEvidence: [],
  customerEvidence: [],
  auditorEvidence: [],
  shariaEvidence: [],
})

// ============================================================================
// HELPERS
// ============================================================================

const normalizeActivityCategory = (key?: string) => {
  if (!key) return ""
  const raw = key.toLowerCase().trim()
  if (["manufacturing", "factory", "mfg"].includes(raw)) return "mfg"
  if (["slaughterhouse", "slaughter"].includes(raw)) return "slaughterhouse"
  if (["meat", "meatprocessing", "meat-processing"].includes(raw)) return "meatprocessing"
  return raw
}

const activityCategoriesFromApp = (app: any): string[] => {
  const values = [
    app.activityCategoryKey,
    app.category,
    app.businessCategory,
    app.facilityType,
    app.selectedProductCategory,
  ].filter(Boolean)
  return Array.from(new Set(values))
}

const ls = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback } catch { return fallback }
}

const hydrateApplication = (app: any): any => {
  const payload = parsePayloadJson(app)
  return {
    ...payload,
    ...app,
    id: app.id ?? payload.id,
    status: app.status ?? payload.status,
    savedAt: payload.savedAt ?? app.submittedAt ?? app.createdAt ?? app.updatedAt ?? new Date().toISOString(),
    applicationNumber: app.applicationNumber ?? payload.applicationNumber,
    companyName: app.companyName ?? payload.companyName ?? payload.snapshotProfile?.companyName,
  }
}

const parsePayloadJson = (app: any): any => {
  const raw = app?.payloadJson
  if (!raw) return {}
  if (typeof raw === "object") return raw
  try { return JSON.parse(raw) } catch { return {} }
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

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
  questions: (config.questions ?? []).map(q => q.questionText),
})

const auditTypes = Object.keys(CHECKLISTS) as AuditType[]
const normalizeAuditText = (value?: string) => (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")

function checklistTypeForTrack(track: AuditTrack): AuditType | undefined {
  const haystack = [
    track.id,
    track.name,
    track.reportTitle,
    track.formCode,
    ...(track.activityCategoryKeys ?? []),
  ].map(normalizeAuditText).join("|")

  return auditTypes.find(type => {
    const checklist = CHECKLISTS[type]
    const aliases = [
      type,
      checklist.key,
      checklist.name,
      checklist.short,
      checklist.form,
      type === "manufacturing" ? "mfg" : "",
      type === "slaughterhouse" ? "slaughter" : "",
      type === "meatprocessing" ? "meatprocessing" : "",
    ].map(normalizeAuditText).filter(Boolean)
    return aliases.some(alias => haystack.includes(alias))
  })
}

function stripQuestionPrefix(question: string) {
  return question.replace(/^\s*\d+(?:\.\d+){1,2}\s+/, "").trim()
}

function hcbText(value: string) {
  return value.replace(/Halal Quality Control/g, "HCB").replace(/\bHQC\b/g, "HCB")
}

function buildAuditParts(track: AuditTrack): AuditPartNode[] {
  const checklistType = checklistTypeForTrack(track)
  const checklist = checklistType ? CHECKLISTS[checklistType] : undefined

  if (checklist) {
    let questionIndex = 0
    return checklist.parts.map(part => ({
      id: part.n,
      title: part.title,
      sections: part.sections.map(section => ({
        id: section.id,
        title: section.title,
        questions: section.qs.map(([number, text, note]) => {
          const index = questionIndex++
          const fallbackText = note ? `${text} (${note})` : text
          return {
            index,
            label: `${section.id}.${number}`,
            text: hcbText(stripQuestionPrefix(track.questions[index] ?? fallbackText)),
          }
        }).filter(question => question.index < track.questions.length),
      })).filter(section => section.questions.length > 0),
    })).filter(part => part.sections.length > 0)
  }

  const parts = new Map<string, AuditPartNode>()
  track.questions.forEach((question, index) => {
    const match = question.match(/^\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?\s+(.+)/)
    const partId = match?.[1] ?? "1"
    const sectionId = match?.[2] ? `${partId}.${match[2]}` : partId
    const label = match?.[3] ? `${sectionId}.${match[3]}` : String(index + 1)
    const text = hcbText(match?.[4] ?? question)

    if (!parts.has(partId)) parts.set(partId, { id: partId, title: `Section ${partId}`, sections: [] })
    const part = parts.get(partId)!
    let section = part.sections.find(item => item.id === sectionId)
    if (!section) {
      section = { id: sectionId, title: sectionId === partId ? "Audit Questions" : `Subsection ${sectionId}`, questions: [] }
      part.sections.push(section)
    }
    section.questions.push({ index, label, text })
  })
  return Array.from(parts.values())
}

// ============================================================================
// COMPONENTS
// ============================================================================

function PlaceholderTab({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ padding: "44px 20px", textAlign: "center", color: "#94a3b8" }}>
      <p style={{ marginBottom: 10, fontSize: 20 }}>{icon}</p>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600 }}>
        {label} tab is not configured for this application.
      </p>
    </div>
  )
}

function StaffSelect({ label, value, users, loading, placeholder, disabled = false, onChange }: {
  label: string; value: string; users: UserListDto[]; loading: boolean; placeholder: string; disabled?: boolean; onChange: (value: string) => void
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#334155" }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading || disabled}
        style={{ width: "100%", height: 40, border: `1px solid ${value ? "#93c5fd" : "#cbd5e1"}`, borderRadius: 8, background: disabled ? "#f1f5f9" : "#fff", color: value ? DARK : "#64748b", padding: "0 11px", fontFamily: F, fontSize: "0.78rem", fontWeight: 500, cursor: loading ? "wait" : disabled ? "not-allowed" : "pointer", outline: "none", boxShadow: value ? "0 0 0 3px rgba(37,99,235,0.08)" : "none" }}
      >
        <option value="">{disabled ? "Select audit dates first" : loading ? "Loading staff..." : placeholder}</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
        ))}
      </select>
      {!loading && users.length === 0 && (
        <span style={{ fontSize: "0.65rem", color: "#dc2626", fontWeight: 700 }}>No active staff found for this role.</span>
      )}
    </label>
  )
}

function MonthCalendar({ year, month, large = false, startDate = "", endDate = "", preferredStartDate = "", preferredEndDate = "", onDateClick }: {
  year: number; month: number; large?: boolean; startDate?: string; endDate?: string; preferredStartDate?: string; preferredEndDate?: string; onDateClick?: (date: string) => void
}) {
  const monthName = new Date(year, month, 1).toLocaleString("en-GB", { month: "long" })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length < 42) cells.push(null)
  const today = new Date()

  return (
    <div style={{ padding: large ? 0 : 10, height: large ? "100%" : undefined, display: large ? "flex" : undefined, flexDirection: large ? "column" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: large ? 10 : 8 }}>
        <span style={{ fontSize: large ? "1rem" : "0.78rem", fontWeight: 900, color: DARK }}>{monthName}</span>
        <span style={{ fontSize: large ? "0.78rem" : "0.66rem", fontWeight: 800, color: "#64748b", background: "#f1f5f9", padding: "3px 10px", borderRadius: 999 }}>{year}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: large ? 5 : 3, flex: large ? 1 : undefined, minHeight: large ? 0 : undefined }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={`${d}-${i}`} style={{ height: large ? 22 : 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? "0.66rem" : "0.58rem", fontWeight: 800, color: "#94a3b8" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const key = day ? dateKey(year, month, day) : ""
          const isEdge = !!day && (key === startDate || key === endDate)
          const inRange = !!day && !!startDate && !!endDate && key >= startDate && key <= endDate
          const isPreferredEdge = !!day && (key === preferredStartDate || key === preferredEndDate)
          const inPreferredRange = !!day && !!preferredStartDate && !!preferredEndDate && key >= preferredStartDate && key <= preferredEndDate
          return (
            <button key={i} type="button" onClick={() => day && onDateClick?.(key)} disabled={!day} style={{
              minHeight: large ? 0 : 24, height: large ? "100%" : undefined, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", borderRadius: large ? 8 : 6,
              padding: large ? 7 : 0, border: large && day ? `1px solid ${isEdge ? BLUE : inRange ? "#93c5fd" : isPreferredEdge ? "#f59e0b" : inPreferredRange ? "#fde68a" : "#e2e8f0"}` : "1px solid transparent",
              background: isEdge ? BLUE : inRange ? "#dbeafe" : isPreferredEdge ? "#fef3c7" : inPreferredRange ? "#fffbeb" : isToday ? "#eff6ff" : day ? "#f8fafc" : "transparent", color: isEdge ? "#fff" : isPreferredEdge || inPreferredRange ? "#92400e" : isToday ? BLUE : day ? "#334155" : "transparent",
              fontSize: large ? "0.76rem" : "0.66rem", fontWeight: isToday ? 900 : 700,
              cursor: day ? "pointer" : "default", fontFamily: F, textAlign: "left", flexDirection: "column",
            }}>
              <span>{day ?? ""}</span>
              {large && (isPreferredEdge || inPreferredRange) && !isEdge && (
                <span style={{ marginTop: "auto", fontSize: "0.56rem", fontWeight: 900, color: "#92400e" }}>Preferred</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AuditPlanInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 9, borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: DARK, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  )
}

function AuditPlanTab({ app }: { app: any }) {
  const today = new Date()
  const existingPlan = ls<any>(`hcs_audit_plan_${app.id}`, {})
  const preferredDates = loadAuditDatePreference(app.id ?? 0)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [startDate, setStartDate] = useState<string>(() => existingPlan.startDate || existingPlan.plannedDate || "")
  const [endDate, setEndDate] = useState<string>(() => existingPlan.endDate || existingPlan.plannedDate || "")
  const [leadAuditorId, setLeadAuditorId] = useState<string>(() => existingPlan.leadAuditorId || "")
  const [shariaAuditorId, setShariaAuditorId] = useState<string>(() => existingPlan.shariaAuditorId || "")
  const [savedAt, setSavedAt] = useState<string>(() => existingPlan.savedAt || "")
  const [saveError, setSaveError] = useState("")
  const [savingPlan, setSavingPlan] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [datePromptOpen, setDatePromptOpen] = useState(() => app.status === "AUDIT_SCHEDULED" && !existingPlan.startDate && !existingPlan.plannedDate)

  const auditorQ = useQuery({
    queryKey: ["audit-plan-staff", "AUDITOR"],
    queryFn: () => getMgmtUsers({ page: 0, size: 200, filterByRole: "AUDITOR" }),
    retry: false,
  })
  const shariaQ = useQuery({
    queryKey: ["audit-plan-staff", "SHARIA_AUDITOR"],
    queryFn: () => getMgmtUsers({ page: 0, size: 200, filterByRole: "SHARIA_AUDITOR" }),
    retry: false,
  })

  const auditors = auditorQ.data?.content ?? []
  const shariaAuditors = shariaQ.data?.content ?? []
  const leadAuditor = auditors.find(u => u.id === leadAuditorId)
  const shariaAuditor = shariaAuditors.find(u => u.id === shariaAuditorId)
  const canGoNext = visibleMonth.getFullYear() < 2030 || visibleMonth.getMonth() < 11
  const canGoPrev = visibleMonth.getFullYear() > today.getFullYear() || visibleMonth.getMonth() > today.getMonth()
  const submitted = app.savedAt || app.submittedAt
  const appRef = app.applicationNumber ?? `#${app.id}`
  const numericApplicationId = Number(app.id)
  const canUseDatabasePlan = Number.isFinite(numericApplicationId)
  const datesReady = !!startDate && !!endDate

  const auditPlanQ = useQuery({
    queryKey: ["audit-plan", numericApplicationId],
    queryFn: () => getAuditPlan(numericApplicationId),
    enabled: canUseDatabasePlan,
    retry: false,
  })

  const goNextMonth = () => {
    if (!canGoNext) return
    setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }
  const goPrevMonth = () => {
    if (!canGoPrev) return
    setVisibleMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  useEffect(() => {
    const plan = auditPlanQ.data
    if (!plan) return
    if (plan.scheduledDate) {
      setStartDate(plan.scheduledDate)
      const duration = Math.max(1, plan.durationDays || 1)
      const end = new Date(plan.scheduledDate)
      end.setDate(end.getDate() + duration - 1)
      setEndDate(dateKey(end.getFullYear(), end.getMonth(), end.getDate()))
      setVisibleMonth(new Date(end.getFullYear(), end.getMonth(), 1))
    }
    if (plan.auditorId) setLeadAuditorId(String(plan.auditorId))
    if (plan.status && plan.id) setSavedAt(new Date().toISOString())
  }, [auditPlanQ.data?.id])

  const pickDate = (date: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate("")
      setLeadAuditorId("")
      setShariaAuditorId("")
      return
    }
    if (date < startDate) {
      setEndDate(startDate)
      setStartDate(date)
      setTeamModalOpen(true)
      return
    }
    setEndDate(date)
    setTeamModalOpen(true)
  }

  const clearSelection = () => {
    setStartDate("")
    setEndDate("")
    setLeadAuditorId("")
    setShariaAuditorId("")
    setSaveError("")
    setTeamModalOpen(false)
    setDatePromptOpen(true)
  }

  const savePlan = async () => {
    if (!canUseDatabasePlan) {
      setSaveError("This application is still local. Submit/create it in the database before saving an audit plan.")
      return
    }
    setSavingPlan(true)
    setSaveError("")
    const now = new Date().toISOString()
    try {
      await saveAuditPlanApi(numericApplicationId, {
        auditorId: undefined,
        auditorName: leadAuditor?.name || undefined,
        scheduledDate: startDate || undefined,
        durationDays: startDate && endDate ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 1,
        scope: [
          app.companyName ? `Company: ${app.companyName}` : "",
          endDate ? `Audit window: ${startDate} to ${endDate}` : startDate ? `Audit date: ${startDate}` : "",
          leadAuditor?.name ? `Lead auditor: ${leadAuditor.name}` : "",
          shariaAuditor?.name ? `Sharia auditor: ${shariaAuditor.name}` : "",
        ].filter(Boolean).join("\n"),
        status: "CONFIRMED",
      })
      if (app.status === "AUDIT_SCHEDULED") {
        await updateApplicationStatus(numericApplicationId, "DOCUMENT_SUBMISSION")
      }
      if (preferredDates && (preferredDates.preferredStartDate !== startDate || preferredDates.preferredEndDate !== endDate)) {
        markAuditDatePreferenceOverwritten(app.id ?? 0)
      }
      setSavedAt(now)
    } catch {
      setSaveError("Could not save audit plan to database.")
    } finally {
      setSavingPlan(false)
    }
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "22px 24px", marginBottom: 14 }
  const secHead: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #dbeafe" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 0, padding: "10px 14px", flexShrink: 0 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, color: BLUE, textTransform: "uppercase", letterSpacing: "0.08em" }}>Audit Plan</p>
          <p style={{ margin: "3px 0 0", fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>Plan the audit window and save the draft.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={savePlan}
            disabled={savingPlan}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, padding: "0 20px", background: savingPlan ? "#94a3b8" : "#15803d", color: "#fff", border: "none", borderRadius: 8, boxShadow: "0 8px 18px rgba(21,128,61,0.22)", fontSize: "0.78rem", fontWeight: 800, cursor: savingPlan ? "wait" : "pointer", fontFamily: F }}
            onMouseOver={e => (e.currentTarget.style.background = "#166534")}
            onMouseOut={e => (e.currentTarget.style.background = savingPlan ? "#94a3b8" : "#15803d")}
          >
            {savingPlan ? "Saving..." : "Save Plan"}
          </button>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: savedAt ? "#15803d" : "#64748b", background: savedAt ? "#dcfce7" : "#f1f5f9", padding: "5px 12px", borderRadius: 999 }}>
            {savedAt ? `Saved ${new Date(savedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Draft not saved"}
          </span>
        </div>
      </div>
      {saveError && (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 10, padding: "9px 12px", fontSize: "0.74rem", fontWeight: 800 }}>
          {saveError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "stretch", height: "calc(100vh - 315px)", minHeight: 430, maxHeight: 620, overflow: "hidden" }}>
        <div style={{ flex: "0 0 calc(28% - 5px)", minWidth: 245, ...card, marginBottom: 0, padding: "16px 18px", overflow: "auto" }}>
          <p style={{ ...secHead, marginBottom: 14, paddingBottom: 10 }}>AUDIT PLAN</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <AuditPlanInfo label="Application No" value={appRef} />
            <AuditPlanInfo label="Company" value={app.companyName || "-"} />
            <AuditPlanInfo label="Current Status" value={getStatusStyle(app.status as any).label || app.status || "-"} />
            <AuditPlanInfo label="Submitted" value={submitted ? new Date(submitted).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"} />
          </div>

          <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid #dbeafe", background: "#eff6ff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <CalendarDays size={15} color={BLUE} />
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: DARK }}>Planning Window</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#475569", lineHeight: 1.45 }}>
              Click the first audit date, then click the last audit date. A popup will open to choose employee names.
            </p>
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan Details</p>
            {[
              ["Start date", startDate ? formatDate(startDate) : "Click first date"],
              ["End date", endDate ? formatDate(endDate) : "Click last date"],
              ["Customer preferred", preferredDates ? `${formatDate(preferredDates.preferredStartDate)} to ${formatDate(preferredDates.preferredEndDate)}` : "None"],
              ["Lead auditor", leadAuditor?.name || "Pending"],
              ["Sharia auditor", shariaAuditor?.name || "Pending"],
              ["Duration", startDate && endDate ? `${Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)} day(s)` : "Pending"],
            ].map(([item, value]) => (
              <div key={item} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155" }}>{item}</span>
                <span style={{ fontSize: "0.72rem", color: value === "Pending" ? "#94a3b8" : "#334155", fontWeight: value === "Pending" ? 500 : 800, textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "0 0 calc(72% - 5px)", minWidth: 0, ...card, marginBottom: 0, padding: "16px 18px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #dbeafe" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE }}>MONTHLY CALENDAR</p>
              <p style={{ margin: "3px 0 0", fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>Load one month at a time until December 2030</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setTeamModalOpen(true)}
                disabled={!datesReady}
                style={{ height: 30, padding: "0 13px", borderRadius: 8, border: "none", background: datesReady ? BLUE : "#dbeafe", color: datesReady ? "#fff" : "#64748b", fontSize: "0.72rem", fontWeight: 700, cursor: datesReady ? "pointer" : "not-allowed", fontFamily: F }}
              >
                Choose employees
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={!startDate && !endDate && !leadAuditorId && !shariaAuditorId}
                style={{ height: 30, padding: "0 11px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.72rem", fontWeight: 600, cursor: (!startDate && !endDate && !leadAuditorId && !shariaAuditorId) ? "not-allowed" : "pointer", opacity: (!startDate && !endDate && !leadAuditorId && !shariaAuditorId) ? 0.55 : 1, fontFamily: F }}
              >
                Clear
              </button>
              <button onClick={goPrevMonth} disabled={!canGoPrev}
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #dbeafe", background: "#fff", cursor: canGoPrev ? "pointer" : "not-allowed", opacity: canGoPrev ? 1 : 0.45 }}>
                <ChevronLeft size={15} color={BLUE} />
              </button>
              <button onClick={goNextMonth} disabled={!canGoNext}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid #2563eb", background: canGoNext ? BLUE : "#94a3b8", color: "#fff", cursor: canGoNext ? "pointer" : "not-allowed", fontSize: "0.72rem", fontWeight: 800, fontFamily: F }}>
                Next Month
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MonthCalendar
              year={visibleMonth.getFullYear()}
              month={visibleMonth.getMonth()}
              large
              startDate={startDate}
              endDate={endDate}
              preferredStartDate={preferredDates?.preferredStartDate}
              preferredEndDate={preferredDates?.preferredEndDate}
              onDateClick={pickDate}
            />
          </div>
        </div>
      </div>

      {datePromptOpen && !datesReady && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div style={{ width: "min(430px, 96vw)", background: "#fff", borderRadius: 12, boxShadow: "0 24px 70px rgba(15,23,42,0.32)", border: "1px solid #dbeafe", overflow: "hidden", fontFamily: F }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: DARK }}>Choose audit dates</p>
                <p style={{ margin: "5px 0 0", fontSize: "0.76rem", fontWeight: 500, color: "#64748b" }}>
                  Payment is confirmed. Use the calendar to select the audit start date, then select the audit end date.
                </p>
              </div>
              <button onClick={() => setDatePromptOpen(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: "18px" }}>
              <div style={{ display: "flex", gap: 12, padding: "14px", border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 10 }}>
                <CalendarDays size={20} color={BLUE} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: "0.84rem", fontWeight: 800, color: DARK }}>Select dates from the calendar</p>
                  <p style={{ margin: 0, fontSize: "0.76rem", lineHeight: 1.55, color: "#475569" }}>
                    First click the audit start date. Then click the audit end date. After that, the employee selection popup will open automatically.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#f8fafc" }}>
              <button onClick={() => setDatePromptOpen(false)}
                style={{ height: 34, padding: "0 13px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                Later
              </button>
              <button onClick={() => setDatePromptOpen(false)}
                style={{ height: 34, padding: "0 18px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: "0.76rem", fontWeight: 800, cursor: "pointer", fontFamily: F }}>
                Choose on Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {teamModalOpen && datesReady && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div style={{ width: "min(500px, 96vw)", background: "#fff", borderRadius: 12, boxShadow: "0 24px 70px rgba(15,23,42,0.32)", border: "1px solid #dbeafe", overflow: "hidden", fontFamily: F }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: DARK }}>Select employees</p>
                <p style={{ margin: "5px 0 0", fontSize: "0.76rem", fontWeight: 500, color: "#64748b" }}>
                  {formatDate(startDate)} to {formatDate(endDate)}
                </p>
              </div>
              <button onClick={() => setTeamModalOpen(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}>
              <StaffSelect
                label="Lead auditor"
                value={leadAuditorId}
                users={auditors}
                loading={auditorQ.isLoading}
                placeholder="Select lead auditor"
                onChange={setLeadAuditorId}
              />
              <StaffSelect
                label="Sharia auditor"
                value={shariaAuditorId}
                users={shariaAuditors}
                loading={shariaQ.isLoading}
                placeholder="Select Sharia auditor"
                onChange={setShariaAuditorId}
              />
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#f8fafc" }}>
              <button onClick={clearSelection}
                style={{ height: 34, padding: "0 13px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                Clear Selection
              </button>
              <button onClick={() => setTeamModalOpen(false)}
                style={{ height: 34, padding: "0 18px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// AUDIT CHECKLIST TAB (ABBREVIATED - FULL VERSION IN ApplicationsPage)
// ============================================================================

function AuditChecklistTab({ app }: { app: any }) {
  return <PlaceholderTab icon="📋" label="Audit Checklist" />
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function OfficeApplicationAuditPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [appTab, setAppTab] = useState("Audit plan")

  const { data: applicationsData } = useQuery({
    queryKey: ["applications", { page: 0, size: 1, search: applicationId }],
    queryFn: () => getApplications({ page: 0, size: 1, search: applicationId || undefined }),
    retry: false,
  })

  const app = applicationsData?.content?.[0]
  const viewApp = app ? hydrateApplication(app) : null

  if (!viewApp) {
    return (
      <OfficeLayout title="Audit">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: 10 }}>Application not found</p>
          <button
            onClick={() => navigate("/office/applications")}
            style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
          >
            Back to Applications
          </button>
        </div>
      </OfficeLayout>
    )
  }

  return (
    <OfficeLayout title="Audit">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              {viewApp.applicationNumber || viewApp.id} · {viewApp.companyName || "-"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Audit data for this application</p>
          </div>
          <button
            onClick={() => navigate("/office/applications")}
            style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}
          >
            ← Back
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fafbfc", padding: "0 20px", gap: 0 }}>
            {["Audit plan", "Audit"].map(tab => {
              const isActive = appTab === tab
              return (
                <button key={tab} onClick={() => setAppTab(tab)}
                  style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#0f2170" : "#64748b", borderBottom: isActive ? "2.5px solid #0f2170" : "2.5px solid transparent", marginBottom: -1, background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {tab}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {appTab === "Audit plan" && <AuditPlanTab app={viewApp} />}
            {appTab === "Audit" && <AuditChecklistTab app={viewApp} />}
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
