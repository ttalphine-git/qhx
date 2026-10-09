import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Save, Upload, X, FileText } from "lucide-react"
import { getApplication } from "@/api/applications"
import { getApplicationAuditReport, saveApplicationAuditReport, type ApplicationAuditReportDto, type AuditReportConfigurationDto } from "@/api/audits"
import { C } from "@/lib/utils"
import { CHECKLISTS, type AuditType, type Section as ChecklistSection } from "@/lib/uploaded-audit/checklists"
import { toast } from "react-hot-toast"
import CustomerLayout from "./CustomerLayout"

const BLUE = "#2563eb"
const DARK = "#0f172a"

interface QuestionAnswer {
  customerComment: string
  files: File[]
}

interface Section {
  id: string
  title: string
  questionIndices: number[]
}

export default function CustomerAuditChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
  const [saving, setSaving] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const appId = id ? parseInt(id, 10) : 0

  // Fetch application
  const { data: app } = useQuery({
    queryKey: ["application", id],
    queryFn: () => appId ? getApplication(appId) : Promise.resolve(null),
    enabled: !!appId,
    retry: 1
  })

  // Fetch audit report
  const { data: auditData } = useQuery({
    queryKey: ["audit-report", id],
    queryFn: () => appId ? getApplicationAuditReport(appId) : Promise.resolve(null),
    enabled: !!appId,
    retry: 1,
    staleTime: 5 * 60 * 1000
  })

  // Initialize answers from audit data
  useMemo(() => {
    if (auditData?.answers) {
      const initialized: Record<string, QuestionAnswer> = {}
      auditData.answers.forEach((answer: { customerComment?: string }, idx: number) => {
        initialized[`q-${idx}`] = {
          customerComment: answer.customerComment || "",
          files: []
        }
      })
      setAnswers(initialized)
    }
  }, [auditData])

  const auditConfig = auditData?.configuration as AuditReportConfigurationDto | undefined
  const auditType: AuditType = "manufacturing"
  const checklist = CHECKLISTS[auditType]

  // Flatten all sections from checklist with part info
  const allSections = useMemo(() => {
    const result: (ChecklistSection & { partNum: string; partTitle: string })[] = []
    checklist.parts.forEach(part => {
      part.sections.forEach(section => {
        result.push({ ...section, partNum: part.n, partTitle: part.title })
      })
    })
    return result
  }, [checklist])

  // Map questions to section indices
  const sections = useMemo(() => {
    return allSections.map((section, sectionIdx) => ({
      id: `${section.partNum}-${section.id}`,
      title: section.title,
      partTitle: section.partTitle,
      questionIndices: section.qs.map((_, qIdx) => {
        // Calculate global question index based on all previous sections
        const globalIdx = allSections.slice(0, sectionIdx).reduce((sum, s) => sum + s.qs.length, 0) + qIdx
        return globalIdx
      })
    }))
  }, [allSections])

  // Count answered
  const totalQuestions = allSections.reduce((sum, s) => sum + s.qs.length, 0)
  const answeredQuestions = Array.from({ length: totalQuestions }, (_, idx) => answers[`q-${idx}`]?.customerComment?.trim()).filter(Boolean).length
  const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const setComment = (qIdx: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`q-${qIdx}`]: { ...prev[`q-${qIdx}`], customerComment: value }
    }))
  }

  const addFiles = (qIdx: number, newFiles: File[]) => {
    setAnswers(prev => {
      const current = prev[`q-${qIdx}`] || { customerComment: "", files: [] }
      const combined = [...(current.files || []), ...newFiles]
      const limited = combined.slice(0, 5)
      return {
        ...prev,
        [`q-${qIdx}`]: { ...current, files: limited }
      }
    })
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file(s) added`)
    }
  }

  const removeFile = (qIdx: number, fileIdx: number) => {
    setAnswers(prev => {
      const current = prev[`q-${qIdx}`] || { customerComment: "", files: [] }
      const updated = current.files.filter((_, idx) => idx !== fileIdx)
      return {
        ...prev,
        [`q-${qIdx}`]: { ...current, files: updated }
      }
    })
  }

  const toggleSection = (sectionId: string) => {
    const updated = new Set(openSections)
    if (updated.has(sectionId)) {
      updated.delete(sectionId)
    } else {
      updated.add(sectionId)
    }
    setOpenSections(updated)
  }

  const handleSave = async () => {
    if (!appId || !auditData) return
    setSaving(true)
    try {
      const formData = new FormData()
      const auditAnswers: any[] = []
      let fileIndex = 0

      allSections.forEach(section => {
        section.qs.forEach((question, qIdx) => {
          const globalIdx = allSections.slice(0, allSections.indexOf(section)).reduce((sum, s) => sum + s.qs.length, 0) + qIdx
          const ans = answers[`q-${globalIdx}`] || { customerComment: "", files: [] }

          auditAnswers.push({
            questionId: globalIdx,
            questionText: question[1],
            answer: "" as "" | "yes" | "no" | "na" | undefined,
            finding: "" as "" | "nc" | "obs" | undefined,
            customerComment: ans.customerComment || "",
            auditorComment: "",
            shariaComment: ""
          })

          // Add files to FormData
          if (ans.files && ans.files.length > 0) {
            ans.files.forEach((file: File) => {
              formData.append(`files_q${globalIdx}`, file)
            })
          }
        })
      })

      formData.append("data", JSON.stringify({
        ...auditData,
        answers: auditAnswers
      }))

      await saveApplicationAuditReport(appId, {
        ...auditData,
        answers: auditAnswers
      })
      toast.success("Audit checklist saved successfully!")
    } catch (error) {
      toast.error("Failed to save audit checklist")
    } finally {
      setSaving(false)
    }
  }


  if (!app) return <CustomerLayout><div style={{ padding: 20, textAlign: "center" }}>Loading...</div></CustomerLayout>

  return (
    <CustomerLayout title="Audit Checklist">
      <div style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>

        {/* Header */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: "#fafbfc" }}>
          <button onClick={() => navigate("/customer/applications")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={18} color={BLUE} />
            <span style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>Back to Applications</span>
          </button>
        </div>

        {/* Application Info & Save */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{app.applicationNumber} - {app.companyName}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Audit Checklist</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: saving ? "#cbd5e1" : BLUE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              <Save size={14} />{saving ? "Saving..." : "Save Checklist"}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
          <div style={{ height: 6, borderRadius: 99, background: "#e5e7eb", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${completionPct}%`, height: "100%", background: completionPct === 100 ? "#107c10" : BLUE, transition: "width 0.3s" }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{answeredQuestions} of {totalQuestions} questions answered</p>
        </div>

        {/* Main Content with Sidebar */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 240, borderRight: `1px solid ${C.border}`, background: C.white, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ padding: "12px 0" }}>
              {sections.map((section) => {
                const sectionAnswered = section.questionIndices.filter(idx => answers[`q-${idx}`]?.customerComment?.trim()).length
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: DARK,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        borderLeft: `3px solid ${BLUE}`,
                        lineHeight: 1.3
                      }}
                    >
                      <span style={{ flex: 1, paddingRight: 8 }}>{section.title}</span>
                      <span style={{ fontSize: 10, color: C.muted, minWidth: 35, textAlign: "right" }}>{sectionAnswered}/{section.questionIndices.length}</span>
                    </button>
                    {openSections.has(section.id) && (
                      <div style={{ background: "#f9fafb", paddingLeft: 12 }}>
                        {section.questionIndices.map((qIdx) => {
                          const record = answers[`q-${qIdx}`] || { customerComment: "" }
                          const hasComment = record.customerComment?.trim()
                          return (
                            <button
                              key={`q-${qIdx}`}
                              onClick={() => {
                                const elem = document.getElementById(`question-${qIdx}`)
                                elem?.scrollIntoView({ behavior: "smooth", block: "start" })
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 10px",
                                background: "none",
                                border: "none",
                                textAlign: "left",
                                fontSize: 11,
                                color: hasComment ? "#107c10" : "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                borderLeft: `2px solid ${hasComment ? "#107c10" : "transparent"}`
                              }}
                            >
                              <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: 10 }}>{qIdx + 1}</span>
                              <span style={{ fontSize: 10 }}>Q{qIdx + 1}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Questions Content */}
          <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
            <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
              {allSections.map((section, sectionIdx) => {
                const globalQStartIdx = allSections.slice(0, sectionIdx).reduce((sum, s) => sum + s.qs.length, 0)
                return (
                  <div key={section.id}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: DARK }}>{section.title}</h3>
                    {section.qs.map((question, localQIdx) => {
                      const globalIdx = globalQStartIdx + localQIdx
                      const qKey = `q-${globalIdx}`
                      const record = answers[qKey] || { customerComment: "" }
                      const hasComment = record.customerComment?.trim()

                      return (
                        <div key={qKey} id={`question-${globalIdx}`} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <span style={{ minWidth: 36, height: 32, borderRadius: 8, background: hasComment ? "#e6f4e6" : "#f0f7ff", color: hasComment ? "#107c10" : BLUE, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                              {globalIdx + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: DARK, fontWeight: 600 }}>
                                {question[1]}
                              </p>
                              {question[2] && (
                                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                                  {question[2]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Comment */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                              Your Comment
                            </label>
                            <textarea
                              value={record.customerComment}
                              onChange={e => setComment(globalIdx, e.target.value)}
                              placeholder="Add your comment or response..."
                              style={{ width: "100%", minHeight: 70, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", color: DARK }}
                              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                            />
                          </div>

                          {/* File Upload */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                              Supporting Documents ({(record.files?.length || 0)}/5)
                            </label>
                            <div
                              style={{
                                padding: 12,
                                border: `2px dashed ${C.border}`,
                                borderRadius: 6,
                                textAlign: "center",
                                cursor: "pointer",
                                background: "#fafbfc",
                                marginBottom: 12,
                                transition: "all 0.2s"
                              }}
                              onDragOver={e => {
                                e.preventDefault()
                                e.currentTarget.style.borderColor = BLUE
                                e.currentTarget.style.background = `${BLUE}08`
                              }}
                              onDragLeave={e => {
                                e.currentTarget.style.borderColor = C.border
                                e.currentTarget.style.background = "#fafbfc"
                              }}
                              onDrop={e => {
                                e.preventDefault()
                                e.currentTarget.style.borderColor = C.border
                                e.currentTarget.style.background = "#fafbfc"
                                const files = Array.from(e.dataTransfer.files)
                                if (files.length > 0) {
                                  addFiles(globalIdx, files)
                                }
                              }}
                              onClick={() => {
                                const input = document.createElement("input")
                                input.type = "file"
                                input.multiple = true
                                input.onchange = (e: any) => {
                                  const files = Array.from(e.target.files || [])
                                  if (files.length > 0) {
                                    addFiles(globalIdx, files as File[])
                                  }
                                }
                                input.click()
                              }}
                            >
                              <Upload size={16} style={{ margin: "0 auto 8px", color: BLUE }} />
                              <p style={{ margin: 0, fontSize: 12, color: DARK, fontWeight: 500 }}>
                                Drag files here or click to upload
                              </p>
                              <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>
                                Maximum 5 files per question
                              </p>
                            </div>

                            {/* File List */}
                            {record.files && record.files.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                {record.files.map((file, fIdx) => (
                                  <div
                                    key={fIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 10px",
                                      background: "#f0f7ff",
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 6,
                                      marginBottom: 8,
                                      fontSize: 12
                                    }}
                                  >
                                    <FileText size={14} color={BLUE} style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {file.name}
                                    </span>
                                    <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <button
                                      onClick={() => removeFile(globalIdx, fIdx)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        color: "#d13438",
                                        flexShrink: 0
                                      }}
                                      title="Remove file"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {totalQuestions === 0 && (
                <div style={{ padding: 40, textAlign: "center", background: C.white, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 14, color: C.muted }}>No audit questions available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
