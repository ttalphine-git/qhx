import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Save } from "lucide-react"
import { getApplication, getApplicationAuditReport } from "@/api/applications"
import { saveApplicationAuditReport, type ApplicationAuditReportDto, type AuditReportConfigurationDto } from "@/api/audits"
import { C, formatDate } from "@/lib/utils"
import { CHECKLISTS } from "@/lib/uploaded-audit/checklists"
import { toast } from "react-hot-toast"
import CustomerLayout from "./CustomerLayout"

const BLUE = "#2563eb"
const DARK = "#0f172a"

interface QuestionAnswer {
  answer?: "yes" | "no" | "na"
  finding?: "nc" | "obs"
  customerComment: string
}

export default function CustomerAuditChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
  const [saving, setSaving] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  // Fetch application
  const { data: app } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id || ""),
    enabled: !!id
  })

  // Fetch audit report
  const { data: auditData } = useQuery({
    queryKey: ["audit-report", id],
    queryFn: () => getApplicationAuditReport(id || ""),
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000
  })

  // Initialize answers from audit data
  useMemo(() => {
    if (auditData?.answers) {
      const initialized: Record<string, QuestionAnswer> = {}
      auditData.answers.forEach((answer, idx) => {
        initialized[`q-${idx}`] = {
          answer: answer.answer as any,
          finding: answer.finding as any,
          customerComment: answer.customerComment || ""
        }
      })
      setAnswers(initialized)
    }
  }, [auditData])

  const auditConfig = auditData?.configuration as AuditReportConfigurationDto | undefined
  const auditQuestions = auditConfig?.questions || []

  // Count answered
  const totalQuestions = auditQuestions.length
  const answeredQuestions = auditQuestions.filter((_, idx) => answers[`q-${idx}`]?.answer || answers[`q-${idx}`]?.finding).length
  const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const setAnswer = (qIdx: number, field: keyof QuestionAnswer, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [`q-${qIdx}`]: { ...prev[`q-${qIdx}`], [field]: value || "" }
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
    if (!id || !auditData) return
    setSaving(true)
    try {
      const auditAnswers = auditQuestions.map((q, idx) => ({
        questionId: q.id,
        questionText: q.questionText,
        answer: answers[`q-${idx}`]?.answer || "",
        finding: answers[`q-${idx}`]?.finding || "",
        customerComment: answers[`q-${idx}`]?.customerComment || "",
        auditorComment: "",
        shariaComment: ""
      }))

      await saveApplicationAuditReport(id, {
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

  const answerBtn = (selected: boolean, color: string) => ({
    padding: "6px 12px",
    borderRadius: 6,
    border: selected ? `1px solid ${color}` : "1px solid #d1d5db",
    background: selected ? `${color}20` : "#f3f4f6",
    color: selected ? color : "#6b7280",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.1s"
  })

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

        {/* Application Info */}
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

        {/* Questions */}
        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
          <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
            {auditQuestions.map((question, idx) => {
              const qKey = `q-${idx}`
              const record = answers[qKey] || { answer: undefined, finding: undefined, customerComment: "" }
              const answered = Boolean(record.answer)

              return (
                <div key={qKey} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <span style={{ minWidth: 36, height: 32, borderRadius: 8, background: answered ? "#e6f4e6" : "#f0f7ff", color: answered ? "#107c10" : BLUE, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: DARK, fontWeight: 600 }}>
                        {question.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Answer Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                    <button onClick={() => setAnswer(idx, "answer", record.answer === "yes" ? undefined : "yes")} style={answerBtn(record.answer === "yes", "#107c10")}>Yes</button>
                    <button onClick={() => setAnswer(idx, "answer", record.answer === "no" ? undefined : "no")} style={answerBtn(record.answer === "no", "#d13438")}>No</button>
                    <button onClick={() => setAnswer(idx, "answer", record.answer === "na" ? undefined : "na")} style={answerBtn(record.answer === "na", "#64748b")}>N/A</button>
                    <span style={{ width: 1, height: 24, background: C.border, margin: "0 2px" }} />
                    <button onClick={() => setAnswer(idx, "finding", record.finding === "nc" ? undefined : "nc")} style={answerBtn(record.finding === "nc", "#d13438")}>NC</button>
                    <button onClick={() => setAnswer(idx, "finding", record.finding === "obs" ? undefined : "obs")} style={answerBtn(record.finding === "obs", "#d98207")}>Obs</button>
                  </div>

                  {/* Comment */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                      Your Comment
                    </label>
                    <textarea
                      value={record.customerComment}
                      onChange={e => setAnswer(idx, "customerComment", e.target.value)}
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
    </CustomerLayout>
  )
}
