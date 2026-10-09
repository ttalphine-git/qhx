import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Save } from "lucide-react"
import { getApplication } from "@/api/applications"
import { getApplicationAuditReport, saveApplicationAuditReport, type ApplicationAuditReportDto, type AuditReportConfigurationDto } from "@/api/audits"
import { C, formatDate } from "@/lib/utils"
import { CHECKLISTS } from "@/lib/uploaded-audit/checklists"
import { toast } from "react-hot-toast"
import CustomerLayout from "./CustomerLayout"

const BLUE = "#2563eb"
const DARK = "#0f172a"

interface QuestionAnswer {
  customerComment: string
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
          customerComment: answer.customerComment || ""
        }
      })
      setAnswers(initialized)
    }
  }, [auditData])

  const auditConfig = auditData?.configuration as AuditReportConfigurationDto | undefined
  const auditQuestions = auditConfig?.questions || []

  // Group questions into sections
  const sections = useMemo(() => {
    const grouped: Record<string, number[]> = {}
    auditQuestions.forEach((q: any, idx: number) => {
      const part = q.part || "General"
      if (!grouped[part]) grouped[part] = []
      grouped[part].push(idx)
    })
    return Object.entries(grouped).map(([title, indices]) => ({
      id: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      questionIndices: indices
    }))
  }, [auditQuestions])

  // Count answered
  const totalQuestions = auditQuestions.length
  const answeredQuestions = auditQuestions.filter((_, idx) => answers[`q-${idx}`]?.customerComment?.trim()).length
  const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const setComment = (qIdx: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`q-${qIdx}`]: { customerComment: value }
    }))
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
      const auditAnswers = auditQuestions.map((q: any, idx: number) => {
        const ans = answers[`q-${idx}`] || { customerComment: "" }
        return {
          questionId: q.id,
          questionText: q.questionText,
          answer: "" as "" | "yes" | "no" | "na" | undefined,
          finding: "" as "" | "nc" | "obs" | undefined,
          customerComment: ans.customerComment || "",
          auditorComment: "",
          shariaComment: ""
        }
      })

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
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        color: DARK,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderLeft: `3px solid ${BLUE}`
                      }}
                    >
                      <span>{section.title}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{sectionAnswered}/{section.questionIndices.length}</span>
                    </button>
                    {openSections.has(section.id) && (
                      <div style={{ background: "#f9fafb", paddingLeft: 16 }}>
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
                                padding: "8px 12px",
                                background: "none",
                                border: "none",
                                textAlign: "left",
                                fontSize: 12,
                                color: hasComment ? "#107c10" : "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                borderLeft: `2px solid ${hasComment ? "#107c10" : "transparent"}`
                              }}
                            >
                              <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600 }}>{qIdx + 1}</span>
                              <span style={{ fontSize: 11 }}>Q{qIdx + 1}</span>
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
              {auditQuestions.map((question, idx) => {
                const qKey = `q-${idx}`
                const record = answers[qKey] || { customerComment: "" }
                const hasComment = record.customerComment?.trim()

                return (
                  <div key={qKey} id={`question-${idx}`} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <span style={{ minWidth: 36, height: 32, borderRadius: 8, background: hasComment ? "#e6f4e6" : "#f0f7ff", color: hasComment ? "#107c10" : BLUE, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: DARK, fontWeight: 600 }}>
                          {question.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                        Your Comment
                      </label>
                      <textarea
                        value={record.customerComment}
                        onChange={e => setComment(idx, e.target.value)}
                        placeholder="Add your comment or response..."
                        style={{ width: "100%", minHeight: 70, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", color: DARK }}
                        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
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
