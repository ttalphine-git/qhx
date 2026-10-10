import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { X, MessageSquare, CheckCircle2 } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { NcsTab } from "@/components/NcsTab"
import { useAuthStore } from "@/store/authStore"
import "@/styles/audit.css"
import apiClient from "@/api/client"
import { getApplications, updateApplicationStatus } from "@/api/applications"
import {
  getApplicationAuditReport,
  getAuditReportConfigurations,
  saveApplicationAuditReport,
  type ApplicationAuditReportDto,
  type AuditReportConfigurationDto,
} from "@/api/audits"
import { C, getStatusStyle } from "@/lib/utils"
import { DEFAULT_AUDIT_TRACKS, type AuditTrack } from "@/lib/hcbWorkflow"
import { CHECKLISTS, REFERENCE, type AuditType } from "@/lib/uploaded-audit/checklists"
import { DEFAULT_ACTIVITY_CATEGORY_SETTINGS } from "@/lib/activityOptions"
import { addNotification } from "@/lib/notifications"

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

const canEditCommentSection = (userRole: string | undefined, sectionRole: string): boolean => {
  if (!userRole) return false
  const normalizedUserRole = userRole.toLowerCase()
  const normalizedSectionRole = sectionRole.toLowerCase()

  if (normalizedSectionRole === 'customer') {
    return normalizedUserRole === 'customer'
  }
  if (normalizedSectionRole === 'auditor') {
    return normalizedUserRole === 'auditor' || normalizedUserRole.includes('auditor')
  }
  if (normalizedSectionRole === 'sharia') {
    return normalizedUserRole === 'sharia' || normalizedUserRole === 'halal_reviewer' || normalizedUserRole.includes('halal')
  }
  return false
}

// ============================================================================
// AUDIT CHECKLIST COMPONENT
// ============================================================================

function AuditChecklistTab({ app }: { app: any }) {
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const numericApplicationId = Number(app.id)
  const canUseDatabase = Number.isFinite(numericApplicationId)
  const appCategoryKeys = activityCategoriesFromApp(app)
  const categories = DEFAULT_ACTIVITY_CATEGORY_SETTINGS.filter(category => appCategoryKeys.includes(category.key))
  const visibleCategories = categories.length ? categories : DEFAULT_ACTIVITY_CATEGORY_SETTINGS.filter(category => category.key === "mfg")
  const inferredCategory = normalizeActivityCategory(app.activityCategoryKey) || appCategoryKeys[0] || visibleCategories[0]?.key || "mfg"
  const [activityCategoryKey, setActivityCategoryKey] = useState(inferredCategory)
  const [answers, setAnswers] = useState<Record<string, AuditQuestionAnswer>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [openPart, setOpenPart] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const [showReference, setShowReference] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAuditCompleteDialog, setShowAuditCompleteDialog] = useState(false)

  const configsQ = useQuery({
    queryKey: ["audit-report-configurations"],
    queryFn: getAuditReportConfigurations,
    enabled: canUseDatabase,
  })
  const reportQ = useQuery({
    queryKey: ["application-audit-report", numericApplicationId, activityCategoryKey],
    queryFn: () => getApplicationAuditReport(numericApplicationId, activityCategoryKey),
    enabled: canUseDatabase,
  })

  const tracks = configsQ.data?.length ? configsQ.data.map(auditConfigToTrack) : DEFAULT_AUDIT_TRACKS
  const allowedTrackKeys = visibleCategories.map(category => category.key)
  const visibleTracks = tracks.filter(track => (track.activityCategoryKeys ?? []).some(key => allowedTrackKeys.includes(key)))
  const selectedTrack = visibleTracks.find(track => (track.activityCategoryKeys ?? []).includes(activityCategoryKey)) ?? visibleTracks[0] ?? tracks[0]
  const sourceConfig = configsQ.data?.find(config => config.id === selectedTrack?.dbId)
  const completed = selectedTrack?.questions.filter((_, i) => answers[`${selectedTrack.id}-${i}`]?.answer).length ?? 0
  const total = selectedTrack?.questions.length ?? 0
  const percent = total ? Math.round((completed / total) * 100) : 0
  const auditParts = React.useMemo(() => selectedTrack ? buildAuditParts(selectedTrack) : [], [selectedTrack])
  const activeOpenPart = openPart

  const countQuestions = (questions: AuditQuestionNode[]) => ({
    answered: questions.filter(question => selectedTrack && answers[`${selectedTrack.id}-${question.index}`]?.answer).length,
    total: questions.length,
  })
  const countPart = (part: AuditPartNode) => ({
    answered: part.sections.reduce((sum, section) => sum + countQuestions(section.questions).answered, 0),
    total: part.sections.reduce((sum, section) => sum + section.questions.length, 0),
  })
  const scrollToAuditNode = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (visibleCategories.some(category => category.key === activityCategoryKey)) return
    setActivityCategoryKey(visibleCategories[0]?.key || "mfg")
  }, [activityCategoryKey, visibleCategories.map(category => category.key).join("|")])

  useEffect(() => {
    if (!reportQ.data || !selectedTrack) return
    const next: Record<string, AuditQuestionAnswer> = {}
    const configQuestions = reportQ.data.configuration?.questions ?? []
    ;(reportQ.data.answers ?? []).forEach((answer, index) => {
      const questionIndex = configQuestions.findIndex(q =>
        (answer.questionId && q.id === answer.questionId) || q.questionText === answer.questionText
      )
      next[`${selectedTrack.id}-${questionIndex >= 0 ? questionIndex : index}`] = {
        answer: answer.answer ?? "",
        finding: answer.finding ?? "",
        ncDescription: answer.ncDescription ?? "",
        obsDescription: answer.obsDescription ?? "",
        customerComment: answer.customerComment ?? "",
        auditorComment: answer.auditorComment ?? "",
        shariaComment: answer.shariaComment ?? "",
        ncEvidence: (answer as any).ncEvidence ?? [],
        obsEvidence: (answer as any).obsEvidence ?? [],
        customerEvidence: (answer as any).customerEvidence ?? [],
        auditorEvidence: (answer as any).auditorEvidence ?? [],
        shariaEvidence: (answer as any).shariaEvidence ?? [],
      } as any
    })
    setAnswers(next)
  }, [reportQ.data?.id, selectedTrack?.id])

  const updateAnswer = (key: string, patch: Partial<AuditQuestionAnswer>) => {
    console.log(`[updateAnswer] Key: ${key}, Patch:`, patch)
    setAnswers(prev => {
      const updated = { ...prev, [key]: { ...(prev[key] ?? blankAuditAnswer()), ...patch } }
      console.log(`[updateAnswer] Updated state for ${key}:`, updated[key])
      return updated
    })
  }

  const toggleComments = (key: string) => {
    setOpenComments(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  const handleEvidenceUpload = (key: string, type: 'nc' | 'obs' | 'customer' | 'auditor' | 'sharia', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      addNotification('office', { title: 'File too large', body: `File size must be less than 50MB`, type: 'error' })
      event.target.value = ''
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      addNotification('office', { title: 'Invalid file type', body: 'Only PDF, images, and Word documents are allowed', type: 'error' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      addNotification('office', { title: 'Error reading file', body: 'Failed to read the selected file', type: 'error' })
    }

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result as string
        const evidenceKey = `${type}Evidence` as keyof AuditQuestionAnswer
        const record = answers[key] ?? blankAuditAnswer()
        const currentEvidence = (record[evidenceKey] as any[]) || []
        const newEvidence = [...currentEvidence, { name: file.name, data: fileData, size: file.size, type: file.type }]
        updateAnswer(key, { [evidenceKey]: newEvidence } as Partial<AuditQuestionAnswer>)
        addNotification('office', { title: 'File uploaded', body: `${file.name} uploaded successfully`, type: 'success' })
      } catch (err) {
        console.error('Error processing file:', err)
        addNotification('office', { title: 'Error uploading file', body: 'Failed to process the file', type: 'error' })
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const saveReport = async () => {
    if (!canUseDatabase || !selectedTrack) return

    try {
      setSaving(true)

      const formData = new FormData()
      let totalFileSize = 0
      let fileCount = 0

      const payload: ApplicationAuditReportDto = {
        id: reportQ.data?.id,
        applicationId: numericApplicationId,
        configurationId: selectedTrack.dbId,
        activityCategoryKey,
        status: "DRAFT",
        generalComment: reportQ.data?.generalComment ?? "",
        answers: selectedTrack.questions.map((questionText, index) => {
          const question = sourceConfig?.questions?.[index]
          const record = answers[`${selectedTrack.id}-${index}`] ?? blankAuditAnswer()

          const processEvidenceFiles = (evidenceArray: any[], prefix: string) => {
            if (evidenceArray && evidenceArray.length > 0) {
              evidenceArray.forEach((file, idx) => {
                try {
                  const base64Data = file.data.split(',')[1]
                  if (!base64Data) return

                  const binaryString = atob(base64Data)
                  const bytes = new Uint8Array(binaryString.length)
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                  }
                  const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' })

                  const fieldName = `${prefix}-q${index}-f${idx}`
                  formData.append(fieldName, blob, file.name)

                  totalFileSize += file.size
                  fileCount++
                } catch (err) {
                  console.error(`Error processing file ${file.name}:`, err)
                }
              })
            }
          }

          processEvidenceFiles(record.ncEvidence, 'nc-evidence')
          processEvidenceFiles(record.obsEvidence, 'obs-evidence')
          processEvidenceFiles(record.customerEvidence, 'customer-evidence')
          processEvidenceFiles(record.auditorEvidence, 'auditor-evidence')
          processEvidenceFiles(record.shariaEvidence, 'sharia-evidence')

          return {
            questionId: question?.id,
            questionText,
            answer: record.answer,
            finding: record.finding,
            customerComment: record.customerComment,
            auditorComment: record.auditorComment,
            shariaComment: record.shariaComment,
            ncDescription: record.ncDescription,
            obsDescription: record.obsDescription,
            ncEvidenceCount: record.ncEvidence?.length || 0,
            obsEvidenceCount: record.obsEvidence?.length || 0,
          }
        }),
      }

      await saveApplicationAuditReport(numericApplicationId, payload)

      formData.append('payload', JSON.stringify(payload))
      formData.append('fileCount', fileCount.toString())
      formData.append('totalFileSize', totalFileSize.toString())

      if (fileCount > 0) {
        console.log(`[Audit Save] Saving evidence metadata with ${fileCount} files`)
        await apiClient.post(`/applications/${numericApplicationId}/audit-report`, formData, { timeout: 300000 })
          .catch(error => {
            console.warn('[Audit Save] Evidence metadata upload failed:', error?.response?.data?.message || error?.message)
          })
      }

      // Save NCs and Observations to separate database tables
      const stripBase64 = (files: any[]) => files?.map(f => ({ name: f.name, size: f.size, type: f.type })) || []
      let savedNcCount = 0
      let savedObservationCount = 0

      console.log(`[Audit Save] Starting NC/Observation save for ${selectedTrack.questions.length} questions`)
      console.log(`[Audit Save] Application ID: ${numericApplicationId}, Category: ${activityCategoryKey}`)

      for (let index = 0; index < selectedTrack.questions.length; index++) {
        const question = sourceConfig?.questions?.[index]
        const record = (answers[`${selectedTrack.id}-${index}`] ?? blankAuditAnswer()) as any
        const questionText = selectedTrack.questions[index]

        console.log(`[Audit Save] Question ${index}: finding="${record.finding}", ncDesc="${record.ncDescription?.substring(0, 50)}..."`)

        if (record.finding === 'nc' && record.ncDescription) {
          const ncPayload = {
            questionId: question?.id || `q-${index}`,
            questionText,
            category: activityCategoryKey,
            description: record.ncDescription,
            ncEvidence: stripBase64(record.ncEvidence),
            customerComment: record.customerComment || '',
            customerEvidence: stripBase64(record.customerEvidence),
            auditorComment: record.auditorComment || '',
            auditorEvidence: stripBase64(record.auditorEvidence),
            shariaComment: record.shariaComment || '',
            shariaEvidence: stripBase64(record.shariaEvidence),
          }

          console.log(`[Audit Save] Saving NC for question ${index}:`, ncPayload)

          try {
            const response = await apiClient.post(`/nc/application/${numericApplicationId}/findings`, ncPayload)
            console.log(`[Audit Save] NC saved successfully for question ${index}:`, response.data)
            savedNcCount++
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error'
            const status = err?.response?.status || 'unknown'
            console.error(`[Audit Save] Failed to save NC at question ${index} (${status}):`, errorMsg)
          }
        } else if (record.finding === 'obs' && record.obsDescription) {
          const obsPayload = {
            questionId: question?.id || `q-${index}`,
            questionText,
            category: activityCategoryKey,
            obsEvidence: stripBase64(record.obsEvidence),
            customerComment: record.customerComment || '',
            customerEvidence: stripBase64(record.customerEvidence),
            auditorComment: record.auditorComment || '',
            auditorEvidence: stripBase64(record.auditorEvidence),
            shariaComment: record.shariaComment || '',
            shariaEvidence: stripBase64(record.shariaEvidence),
          }

          console.log(`[Audit Save] Saving Observation for question ${index}:`, obsPayload)

          try {
            const response = await apiClient.post(`/applications/${numericApplicationId}/observations`, obsPayload)
            console.log(`[Audit Save] Observation saved successfully for question ${index}:`, response.data)
            savedObservationCount++
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error'
            const status = err?.response?.status || 'unknown'
            console.error(`[Audit Save] Failed to save Observation at question ${index} (${status}):`, errorMsg)
          }
        }
      }

      // Invalidate NCs query to refresh the NCs tab
      console.log(`[Audit Save] Completed NC/Observation save: ${savedNcCount} NCs, ${savedObservationCount} Observations`)
      await queryClient.invalidateQueries({ queryKey: ['ncs', numericApplicationId] })

      const findingsSummary = [
        savedNcCount ? `${savedNcCount} NC${savedNcCount !== 1 ? 's' : ''}` : '',
        savedObservationCount ? `${savedObservationCount} observation${savedObservationCount !== 1 ? 's' : ''}` : '',
      ].filter(Boolean).join(' and ')

      addNotification('office', {
        title: 'Report saved',
        body: findingsSummary
          ? `Audit report saved with ${findingsSummary}`
          : `Audit report saved successfully`,
        type: 'success'
      })

      await reportQ.refetch()

      // Show audit completion dialog
      setShowAuditCompleteDialog(true)
    } catch (err: any) {
      console.error('[Audit Save Error]', err)
      const errorMsg = err?.response?.data?.message || err?.message || 'An unexpected error occurred'
      const status = err?.response?.status
      const statusText = status === 401 ? ' (Unauthorized - check your permissions)' : status === 403 ? ' (Forbidden)' : ''
      addNotification('office', {
        title: 'Failed to save report',
        body: `${errorMsg}${statusText}`,
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canUseDatabase) {
    return (
      <div style={{ padding: "44px 20px", textAlign: "center", color: "#64748b", fontFamily: F }}>
        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: DARK }}>Audit requires a database application</div>
        <div style={{ marginTop: 6, fontSize: "0.78rem" }}>Create or sync this application in the database before completing the audit form.</div>
      </div>
    )
  }

  if (!selectedTrack) return <div style={{ padding: "44px 20px" }}>Loading audit configuration...</div>

  return (
    <div id="app" style={{ background: "var(--page)", margin: -22, maxHeight: "calc(100vh - 190px)", overflow: "auto", paddingBottom: "80px" }}>
      <div className="wrap" style={{ maxWidth: "none", padding: "20px" }}>
        <div className="pagehead">
          <div className="grow">
            <h1>{selectedTrack.reportTitle || selectedTrack.name}</h1>
            <p>{app.applicationNumber || app.id} · {app.companyName || "-"}</p>
          </div>
        </div>

        <div className="toolbar">
          <button type="button" className="chipbtn" style={{ marginLeft: "auto" }} onClick={() => setShowReference(true)}>
            Risk &amp; Definitions
          </button>
        </div>

        <div className="cols">
          <nav className="side" aria-label="Sections">
            <h4>Audit Sections</h4>
            {auditParts.map(part => {
              const partCounts = countPart(part)
              const partOpen = activeOpenPart === part.id
              const partLeft = partCounts.total - partCounts.answered
              return (
                <React.Fragment key={part.id}>
                  <button
                    type="button"
                    className="navlink"
                    aria-expanded={partOpen}
                    onClick={() => {
                      setOpenPart(partOpen ? null : part.id)
                      scrollToAuditNode(`part-${part.id}`)
                    }}
                  >
                    <span className="nid">{part.id}</span>
                    <span>{part.title}</span>
                    {partLeft > 0 ? (
                      <span className="npend" title={`${partLeft} question${partLeft > 1 ? "s" : ""} not answered`}>{partLeft} left</span>
                    ) : (
                      <i className="ndot done" />
                    )}
                  </button>

                  {partOpen && (
                    <div className="subnav">
                      {part.sections.map(section => {
                        const sectionCounts = countQuestions(section.questions)
                        const sectionLeft = sectionCounts.total - sectionCounts.answered
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className="sublink"
                            aria-current={currentSection === section.id || undefined}
                            onClick={() => {
                              setCurrentSection(section.id)
                              scrollToAuditNode(`sec-${section.id}`)
                            }}
                          >
                            <span className="nid">{section.id}</span>
                            <span>{section.title}</span>
                            {sectionLeft > 0 ? (
                              <span className="npend" title={`${sectionLeft} question${sectionLeft > 1 ? "s" : ""} not answered`}>{sectionLeft} left</span>
                            ) : (
                              <i className="ndot done" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          <div className="colmain">
            {auditParts.map(part => (
              <React.Fragment key={part.id}>
                <div className="parthead" id={`part-${part.id}`}>
                  <div className="eyebrow">Section {part.id}</div>
                  <h2>{part.title}</h2>
                </div>

                {part.sections.map(section => {
                  const sectionCounts = countQuestions(section.questions)
                  const sectionLeft = sectionCounts.total - sectionCounts.answered
                  return (
                    <section className="sec" id={`sec-${section.id}`} key={section.id}>
                      <div className="sec-hd" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="sid">{section.id}</span>
                        <h3>{section.title}</h3>
                        <span className="sec-meta">{sectionCounts.answered} / {sectionCounts.total} answered</span>
                        {sectionLeft > 0 && <span className="sec-warn">{sectionLeft} unanswered</span>}
                      </div>
                      <div className="sec-body" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
                        <div>
                          {section.questions.map(question => {
                            const key = `${selectedTrack.id}-${question.index}`
                            const record = answers[key] ?? blankAuditAnswer()
                            const commentCount = [record.customerComment, record.auditorComment, record.shariaComment].filter(comment => comment.trim()).length
                            const commentsOpen = !!openComments[key]
                            return (
                              <article className="q" id={`q-${key}`} key={key} style={{ marginBottom: '12px', padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                              <div className="q-top" style={{ marginBottom: '10px' }}>
                                <span className="q-n" style={record.answer ? { background: "var(--green)", color: "#fff", fontSize: '12px', padding: '2px 8px', borderRadius: '4px' } : { background: '#f1f5f9', color: '#64748b', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>{question.label}</span>
                                <div style={{ marginTop: '6px' }}>
                                  <p className="q-t" style={{ fontSize: '13px', lineHeight: '1.4', margin: 0 }}>{question.text}</p>
                                </div>
                              </div>
                              <div className="q-ctl" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="seg" role="group" aria-label={`Answer for question ${question.label}`} style={{ display: 'flex', gap: '4px' }}>
                                  <button type="button" data-v="yes" aria-pressed={record.answer === "yes"} onClick={() => updateAnswer(key, { answer: record.answer === "yes" ? "" : "yes" })} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: record.answer === 'yes' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: record.answer === 'yes' ? '#eff6ff' : '#fff', cursor: 'pointer' }}>Yes</button>
                                  <button type="button" data-v="no" aria-pressed={record.answer === "no"} onClick={() => updateAnswer(key, { answer: record.answer === "no" ? "" : "no" })} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: record.answer === 'no' ? '2px solid #d13438' : '1px solid #e2e8f0', background: record.answer === 'no' ? '#fef2f2' : '#fff', cursor: 'pointer' }}>No</button>
                                  <button type="button" data-v="na" aria-pressed={record.answer === "na"} onClick={() => updateAnswer(key, { answer: record.answer === "na" ? "" : "na" })} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: record.answer === 'na' ? '2px solid #f59e0b' : '1px solid #e2e8f0', background: record.answer === 'na' ? '#fffbeb' : '#fff', cursor: 'pointer' }}>N/A</button>
                                </div>
                                <div className="findbtns" style={{ display: 'flex', gap: '4px' }}>
                                  <button type="button" className="findbtn" data-f="nc" aria-pressed={record.finding === "nc"} onClick={() => {
                                    console.log(`[NC Button] Clicked for question ${question.label}, current finding: ${record.finding}`)
                                    updateAnswer(key, { finding: record.finding === "nc" ? "" : "nc" })
                                  }} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', background: record.finding === 'nc' ? '#d13438' : '#fff', color: record.finding === 'nc' ? '#fff' : '#d13438', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 }}>NC</button>
                                  <button type="button" className="findbtn" data-f="obs" aria-pressed={record.finding === "obs"} onClick={() => {
                                    console.log(`[Obs Button] Clicked for question ${question.label}, current finding: ${record.finding}`)
                                    updateAnswer(key, { finding: record.finding === "obs" ? "" : "obs" })
                                  }} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', background: record.finding === 'obs' ? '#f59e0b' : '#fff', color: record.finding === 'obs' ? '#fff' : '#f59e0b', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 }}>Obs</button>
                                </div>
                                <button
                                  type="button"
                                  className="cmt-btn"
                                  aria-expanded={commentsOpen}
                                  aria-controls={`comments-${key}`}
                                  onClick={() => toggleComments(key)}
                                  style={{ padding: '6px 8px', fontSize: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#475569' }}
                                >
                                  <MessageSquare size={12} />
                                  <span>{commentsOpen ? "Hide" : "Cmts"}</span>
                                  {commentCount > 0 && <span style={{ marginLeft: 'auto', background: '#2563eb', color: '#fff', borderRadius: '2px', padding: '1px 4px', fontSize: '10px' }}>{commentCount}</span>}
                                </button>
                              </div>
                              {record.finding && (
                                <div className="cmts" style={{ marginTop: '10px', padding: '10px', background: '#fafbfc', borderRadius: '4px', borderLeft: `3px solid ${record.finding === 'nc' ? '#d13438' : '#f59e0b'}` }}>
                                  <div className="cmt" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontWeight: 700, fontSize: '12px', color: record.finding === 'nc' ? '#d13438' : '#f59e0b' }}>
                                        {record.finding === 'nc' ? '🔴 NC' : '🟡 Obs'}
                                      </span>
                                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>
                                        Ref {question.label}
                                      </span>
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                                        Describe:
                                      </label>
                                      <textarea
                                        value={record.finding === 'nc' ? (record.ncDescription || '') : (record.obsDescription || '')}
                                        onChange={e => {
                                          console.log(`[NC/Obs Description] Changed for ${record.finding === 'nc' ? 'NC' : 'Obs'}: ${e.target.value.substring(0, 50)}...`)
                                          updateAnswer(key, { [record.finding === 'nc' ? 'ncDescription' : 'obsDescription']: e.target.value })
                                        }}
                                        placeholder={`Describe...`}
                                        style={{ width: '100%', minHeight: '60px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '3px', fontFamily: 'inherit', fontSize: '12px', resize: 'vertical' }}
                                      />
                                    </div>
                                    <div style={{ paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#d13438', marginBottom: '4px' }}>
                                        Evidence required
                                      </label>
                                      <div style={{ marginBottom: '4px' }}>
                                        <input
                                          type="file"
                                          id={`evidence-${key}-${record.finding}`}
                                          onChange={(e) => handleEvidenceUpload(key, record.finding as any, e)}
                                          style={{ display: 'none' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => document.getElementById(`evidence-${key}-${record.finding}`)?.click()}
                                          style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', color: '#2563eb', fontWeight: 600 }}
                                        >
                                          📎 Attach
                                        </button>
                                      </div>
                                      {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).length > 0 && (
                                        <div style={{ marginTop: '4px' }}>
                                          {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).map((file, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 4px', background: '#fff', borderRadius: '3px', marginBottom: '2px', fontSize: '10px', border: '1px solid #e2e8f0' }}>
                                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>📄 {file.name}</span>
                                              <button
                                                type="button"
                                                onClick={() => updateAnswer(key, { [(record.finding === 'nc' ? 'ncEvidence' : 'obsEvidence') as keyof AuditQuestionAnswer]: ((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).filter((_, i) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 2px', fontSize: '10px', flexShrink: 0 }}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {commentsOpen && (
                                <div className="cmts" id={`comments-${key}`} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                                  {[
                                    ["customerComment", "customer", "👤 Customer", "customerEvidence"],
                                    ["auditorComment", "auditor", "✓ Auditor", "auditorEvidence"],
                                    ["shariaComment", "sharia", "🕌 Sharia", "shariaEvidence"],
                                  ].map(([field, role, label, evidenceField]) => {
                                    const canEdit = canEditCommentSection(user?.role, role)
                                    const isReadOnly = !canEdit
                                    return (
                                      <div className="cmt" data-role={role} key={field} style={{ opacity: isReadOnly ? 0.6 : 1, marginBottom: '8px', padding: '8px', background: '#fafbfc', borderRadius: '4px' }}>
                                        <div className="lbl" style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}><span>{label}{isReadOnly ? ' (view)' : ''}</span></div>
                                        <textarea
                                          value={record[field as keyof AuditQuestionAnswer] as string}
                                          onChange={e => canEdit && updateAnswer(key, { [field]: e.target.value } as Partial<AuditQuestionAnswer>)}
                                          disabled={isReadOnly}
                                          style={{
                                            width: '100%',
                                            minHeight: '50px',
                                            padding: '6px',
                                            fontSize: '12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '3px',
                                            opacity: isReadOnly ? 0.6 : 1,
                                            cursor: isReadOnly ? 'not-allowed' : 'auto',
                                            backgroundColor: isReadOnly ? '#f5f5f5' : '#fff',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                          }}
                                        />
                                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                                          <input
                                            type="file"
                                            id={`evidence-comment-${key}-${field}`}
                                            onChange={(e) => canEdit && handleEvidenceUpload(key, role as any, e)}
                                            style={{ display: 'none' }}
                                            disabled={isReadOnly}
                                          />
                                          {canEdit && (
                                            <button
                                              type="button"
                                              onClick={() => document.getElementById(`evidence-comment-${key}-${field}`)?.click()}
                                              style={{ padding: '3px 8px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', color: '#2563eb', fontWeight: 600 }}
                                            >
                                              📎 Attach
                                            </button>
                                          )}
                                          {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).length > 0 && (
                                            <div style={{ marginTop: '4px' }}>
                                              {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).map((file: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 4px', background: '#fff', borderRadius: '3px', marginBottom: '2px', fontSize: '10px', border: '1px solid #e2e8f0' }}>
                                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>📄 {file.name}</span>
                                                  {canEdit && (
                                                    <button
                                                      type="button"
                                                      onClick={() => updateAnswer(key, { [evidenceField]: ((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).filter((_: any, i: number) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 2px', fontSize: '10px', flexShrink: 0 }}
                                                    >
                                                      ✕
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </article>
                            )
                          })}
                        </div>

                        {/* Documents Card */}
                        <div style={{
                          background: '#fafbfc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '12px',
                          maxHeight: 'calc(100vh - 300px)',
                          overflow: 'auto',
                          position: 'sticky',
                          top: '16px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            📁 Documents
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {section.questions.map(question => {
                              const key = `${selectedTrack.id}-${question.index}`
                              const record = answers[key] ?? blankAuditAnswer()
                              const allDocuments = [
                                ...((record.ncEvidence || []).map(f => ({ name: f.name, type: 'NC', label: question.label }))),
                                ...((record.obsEvidence || []).map(f => ({ name: f.name, type: 'Obs', label: question.label }))),
                                ...((record.customerEvidence || []).map(f => ({ name: f.name, type: 'Customer', label: question.label }))),
                                ...((record.auditorEvidence || []).map(f => ({ name: f.name, type: 'Auditor', label: question.label }))),
                                ...((record.shariaEvidence || []).map(f => ({ name: f.name, type: 'Sharia', label: question.label }))),
                              ]

                              if (allDocuments.length === 0) return null

                              return (
                                <div key={key}>
                                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Q{question.label}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {allDocuments.map((doc, idx) => (
                                      <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 6px',
                                        background: '#fff',
                                        borderRadius: '3px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '10px',
                                        overflow: 'hidden'
                                      }}>
                                        <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600 }}>
                                          {doc.type === 'NC' ? '🔴' : doc.type === 'Obs' ? '🟡' : doc.type === 'Customer' ? '👤' : doc.type === 'Auditor' ? '✓' : '🕌'}
                                        </span>
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                                          {doc.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {!section.questions.some(q => {
                            const key = `${selectedTrack.id}-${q.index}`
                            const record = answers[key] ?? blankAuditAnswer()
                            const hasAnyDocs = (record.ncEvidence?.length || 0) + (record.obsEvidence?.length || 0) +
                                              (record.customerEvidence?.length || 0) + (record.auditorEvidence?.length || 0) +
                                              (record.shariaEvidence?.length || 0) > 0
                            return hasAnyDocs
                          }) && (
                            <div style={{ textAlign: 'center', padding: '20px 8px', color: '#94a3b8', fontSize: '12px' }}>
                              No documents yet
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {showReference && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div className="panel refpanel" style={{ width: "min(980px, 100%)", maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="panel-hd" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="eyebrow">Audit Reference</div>
                  <h2>Risk &amp; Definitions</h2>
                </div>
                <button type="button" className="btn" onClick={() => setShowReference(false)} aria-label="Close risk and definitions">
                  <X size={16} />
                </button>
              </div>
              <div className="panel-bd" style={{ overflow: "auto" }}>
                <div className="refgrid">
                  <div>
                    <h3>Risk Classifications</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Complexity Class</th>
                          <th>Example of Sectors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {REFERENCE.risk.map(([label, definition]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{hcbText(definition)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3>Terms and Definitions</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Term</th>
                          <th>Definition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {REFERENCE.terms.map(([term, definition]) => (
                          <tr key={term}>
                            <td>{term}</td>
                            <td>{hcbText(definition)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Save Bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -2px 8px rgba(15, 23, 42, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          zIndex: 100,
          fontFamily: F,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 120, height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percent}%`, background: BLUE, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: DARK, minWidth: 100 }}>{completed} of {total} answered</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={saveReport}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              padding: '0 28px',
              background: saving ? '#94a3b8' : BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              fontFamily: F,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => !saving && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={e => !saving && (e.currentTarget.style.background = BLUE)}
          >
            {saving ? '💾 Saving...' : '💾 Save Report'}
          </button>
        </div>

        {/* Audit Complete Confirmation Dialog */}
        {showAuditCompleteDialog && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 420, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700, color: "#111827" }}>Audit Complete?</h2>
              <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
                Did you complete the audit for this application? This action will update the status to <strong>"NC Clearance"</strong> (next step: clear NCs).
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAuditCompleteDialog(false)}
                  style={{
                    padding: "8px 20px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    fontFamily: F
                  }}
                >
                  No, Not yet
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowAuditCompleteDialog(false)
                    try {
                      await updateApplicationStatus(numericApplicationId, "NC_CLEARANCE")
                      addNotification('office', {
                        title: 'Status updated',
                        body: 'Application status changed to: NC Clearance (Next step: Clear NCs)',
                        type: 'success'
                      })
                      queryClient.invalidateQueries({ queryKey: ["applications"] })
                    } catch (err) {
                      console.error("Failed to update status:", err)
                      addNotification('office', {
                        title: 'Failed to update status',
                        body: 'Could not update application status',
                        type: 'error'
                      })
                    }
                  }}
                  style={{
                    padding: "8px 20px",
                    background: BLUE,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    fontFamily: F
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseOut={e => (e.currentTarget.style.background = BLUE)}
                >
                  Yes, Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function OfficeApplicationAuditPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("Audit")

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
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Audit Questions</p>
          </div>
          <button
            onClick={() => navigate("/office/applications")}
            style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}
          >
            ← Back
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fafbfc", padding: "0 20px", gap: 0, overflowX: "auto" }}>
            {["Audit", "NCs", "Application", "Products", "Documents"].map(tab => {
              const isActive = activeTab === tab
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#0f2170" : "#64748b", borderBottom: isActive ? "2.5px solid #0f2170" : "2.5px solid transparent", marginBottom: -1, background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {tab}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {activeTab === "Audit" && <AuditChecklistTab app={viewApp} />}
            {activeTab === "NCs" && <NcsTab applicationId={viewApp.id} />}
            {activeTab === "Application" && (
              <div style={{ padding: "24px", fontFamily: F }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company Name</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.companyName || "-"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Application #</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.applicationNumber || "-"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Business Category</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.businessCategory || viewApp.category || "-"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.email || "-"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.phone || "-"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Country</p>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>{viewApp.country || "-"}</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Products" && (
              <div style={{ padding: "24px", fontFamily: F }}>
                {viewApp.products && viewApp.products.length > 0 ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: DARK, fontFamily: F }}>Products for Certification</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff", background: BLUE, padding: "1px 10px", borderRadius: 10 }}>{viewApp.products.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {viewApp.products.map((p: any, i: number) => (
                        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: "16px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px", gap: 12, alignItems: "start" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: "0 0 8px", fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Name</p>
                            <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#111827" }}>{p.name || p.productName || "-"}</p>
                          </div>
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: "0.76rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</p>
                            <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#111827" }}>{p.category || p.productCategory || "-"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#64748b" }}>No products submitted</div>
                    <div style={{ fontSize: "0.8rem", marginTop: 4 }}>Products added by the customer will appear here.</div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "Documents" && (
              <div style={{ padding: "24px", fontFamily: F }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Customer uploaded documents</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>0 files uploaded</p>
                  </div>
                </div>
                <div style={{ padding: "40px 24px", textAlign: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>No documents uploaded yet</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}>Documents uploaded by the customer will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
