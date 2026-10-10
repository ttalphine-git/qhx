import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { X, MessageSquare } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import "@/styles/audit.css"
import apiClient from "@/api/client"
import { getApplications } from "@/api/applications"
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

// ============================================================================
// AUDIT CHECKLIST COMPONENT
// ============================================================================

function AuditChecklistTab({ app }: { app: any }) {
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
        customerComment: answer.customerComment ?? "",
        auditorComment: answer.auditorComment ?? "",
        shariaComment: answer.shariaComment ?? "",
      } as any
    })
    setAnswers(next)
  }, [reportQ.data?.id, selectedTrack?.id])

  const updateAnswer = (key: string, patch: Partial<AuditQuestionAnswer>) => {
    setAnswers(prev => ({ ...prev, [key]: { ...(prev[key] ?? blankAuditAnswer()), ...patch } }))
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

      addNotification('office', {
        title: 'Report saved',
        body: `Audit report saved successfully`,
        type: 'success'
      })

      await reportQ.refetch()
    } catch (err) {
      console.error('[Audit Save Error]', err)
      addNotification('office', {
        title: 'Failed to save report',
        body: err instanceof Error ? err.message : 'An unexpected error occurred',
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
    <div id="app" style={{ background: "var(--page)", margin: -22, maxHeight: "calc(100vh - 190px)", overflow: "auto" }}>
      <div className="wrap" style={{ maxWidth: "none", padding: "20px" }}>
        <div className="pagehead">
          <div className="grow">
            <h1>{selectedTrack.reportTitle || selectedTrack.name}</h1>
            <p>{app.applicationNumber || app.id} · {app.companyName || "-"}</p>
          </div>
          <div className="prog">
            <div className="bar"><i style={{ width: `${percent}%` }} /></div>
            <span>{completed} of {total} answered</span>
          </div>
          <button type="button" className="btn primary" onClick={saveReport} disabled={saving}>
            {saving ? "Saving..." : "Save Report"}
          </button>
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
                      <div className="sec-body">
                        {section.questions.map(question => {
                          const key = `${selectedTrack.id}-${question.index}`
                          const record = answers[key] ?? blankAuditAnswer()
                          const commentCount = [record.customerComment, record.auditorComment, record.shariaComment].filter(comment => comment.trim()).length
                          const commentsOpen = !!openComments[key]
                          return (
                            <article className="q" id={`q-${key}`} key={key}>
                              <div className="q-top">
                                <span className="q-n" style={record.answer ? { background: "var(--green)", color: "#fff" } : undefined}>{question.label}</span>
                                <div>
                                  <p className="q-t">{question.text}</p>
                                </div>
                              </div>
                              <div className="q-ctl">
                                <div className="seg" role="group" aria-label={`Answer for question ${question.label}`}>
                                  <button type="button" data-v="yes" aria-pressed={record.answer === "yes"} onClick={() => updateAnswer(key, { answer: record.answer === "yes" ? "" : "yes" })}>Yes</button>
                                  <button type="button" data-v="no" aria-pressed={record.answer === "no"} onClick={() => updateAnswer(key, { answer: record.answer === "no" ? "" : "no" })}>No</button>
                                  <button type="button" data-v="na" aria-pressed={record.answer === "na"} onClick={() => updateAnswer(key, { answer: record.answer === "na" ? "" : "na" })}>N/A</button>
                                </div>
                                <div className="findbtns">
                                  <button type="button" className="findbtn" data-f="nc" aria-pressed={record.finding === "nc"} onClick={() => updateAnswer(key, { finding: record.finding === "nc" ? "" : "nc" })}>NC</button>
                                  <button type="button" className="findbtn" data-f="obs" aria-pressed={record.finding === "obs"} onClick={() => updateAnswer(key, { finding: record.finding === "obs" ? "" : "obs" })}>Observation</button>
                                </div>
                                <button
                                  type="button"
                                  className="cmt-btn"
                                  aria-expanded={commentsOpen}
                                  aria-controls={`comments-${key}`}
                                  onClick={() => toggleComments(key)}
                                >
                                  <MessageSquare size={14} />
                                  <span>{commentsOpen ? "Hide comments" : "Comments"}</span>
                                  {commentCount > 0 && <span className="cnt">{commentCount}</span>}
                                </button>
                              </div>
                              {record.finding && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: record.finding === 'nc' ? '#fde7e9' : '#fff8e5', color: record.finding === 'nc' ? '#d13438' : '#8a6000', textTransform: 'uppercase' }}>
                                      {record.finding === 'nc' ? 'Non-Conformity' : 'Observation'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Ref {question.label}</span>
                                  </div>
                                  <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      State the {record.finding === 'nc' ? 'non-conformity' : 'observation'}: what was found, where, and which requirement it breaches.
                                    </label>
                                    <textarea
                                      value={record.finding === 'nc' ? (record.ncDescription || '') : (record.obsDescription || '')}
                                      onChange={e => updateAnswer(key, { [record.finding === 'nc' ? 'ncDescription' : 'obsDescription']: e.target.value })}
                                      placeholder={`Describe the ${record.finding === 'nc' ? 'non-conformity' : 'observation'}...`}
                                      style={{ width: '100%', minHeight: '80px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d13438', marginBottom: '8px', textTransform: 'uppercase' }}>
                                      Evidence required for a {record.finding === 'nc' ? 'non-conformity' : 'observation'}
                                    </label>
                                    <div style={{ marginBottom: '8px' }}>
                                      <input
                                        type="file"
                                        id={`evidence-${key}-${record.finding}`}
                                        onChange={(e) => handleEvidenceUpload(key, record.finding as any, e)}
                                        style={{ display: 'none' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => document.getElementById(`evidence-${key}-${record.finding}`)?.click()}
                                        style={{ padding: '8px 14px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}
                                      >
                                        📎 Attach evidence
                                      </button>
                                    </div>
                                    {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).length > 0 && (
                                      <div style={{ marginTop: '8px' }}>
                                        {((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).map((file, idx) => (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                                            <span>📄 {file.name}</span>
                                            <button
                                              type="button"
                                              onClick={() => updateAnswer(key, { [(record.finding === 'nc' ? 'ncEvidence' : 'obsEvidence') as keyof AuditQuestionAnswer]: ((record.finding === 'nc' ? record.ncEvidence : record.obsEvidence) || []).filter((_, i) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {commentsOpen && (
                                <div className="cmts" id={`comments-${key}`}>
                                  {[
                                    ["customerComment", "customer", "Customer comment", "customerEvidence"],
                                    ["auditorComment", "auditor", "Auditor comment", "auditorEvidence"],
                                    ["shariaComment", "sharia", "Sharia comment", "shariaEvidence"],
                                  ].map(([field, role, label, evidenceField]) => (
                                    <div className="cmt" data-role={role} key={field}>
                                      <div className="lbl"><i className="tag" /><span>{label}</span></div>
                                      <textarea
                                        value={record[field as keyof AuditQuestionAnswer] as string}
                                        onChange={e => updateAnswer(key, { [field]: e.target.value } as Partial<AuditQuestionAnswer>)}
                                      />
                                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <input
                                          type="file"
                                          id={`evidence-comment-${key}-${field}`}
                                          onChange={(e) => handleEvidenceUpload(key, role as any, e)}
                                          style={{ display: 'none' }}
                                        />
                                        {role !== 'customer' && (
                                          <button
                                            type="button"
                                            onClick={() => document.getElementById(`evidence-comment-${key}-${field}`)?.click()}
                                            style={{ padding: '4px 10px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#2563eb' }}
                                          >
                                            📎 Attach evidence
                                          </button>
                                        )}
                                        {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).length > 0 && (
                                          <div style={{ marginTop: '6px' }}>
                                            {((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).map((file: any, idx: number) => (
                                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '3px', fontSize: '11px' }}>
                                                <span>📄 {file.name}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateAnswer(key, { [evidenceField]: ((record[evidenceField as keyof AuditQuestionAnswer] as any) || []).filter((_: any, i: number) => i !== idx) } as Partial<AuditQuestionAnswer>)}
                                                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', padding: '0 2px', fontSize: '11px' }}
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </article>
                          )
                        })}
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
          <AuditChecklistTab app={viewApp} />
        </div>
      </div>
    </OfficeLayout>
  )
}
