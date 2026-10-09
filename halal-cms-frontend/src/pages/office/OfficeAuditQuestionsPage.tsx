import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronUp, Save, X } from "lucide-react"
import { CHECKLISTS, AUDIT_TYPES } from "@/lib/uploaded-audit/checklists"
import type { AuditType, Section } from "@/lib/uploaded-audit/checklists"
import OfficeLayout from "./OfficeLayout"
import { C } from "@/lib/utils"
import { toast } from "react-hot-toast"

const BLUE = "#2563eb"
const DARK = "#0f172a"

interface QuestionAnswer {
  answer?: "yes" | "no" | "na"
  finding?: "nc" | "obs"
  customerComment: string
  auditorComment: string
  shariaComment: string
  ncDescription?: string
  obsDescription?: string
}

interface NCModal {
  isOpen: boolean
  qKey: string
  description: string
}

interface ObsModal {
  isOpen: boolean
  qKey: string
  description: string
}

export default function OfficeAuditQuestionsPage() {
  const [selectedType, setSelectedType] = useState<AuditType>("manufacturing")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
  const [openParts, setOpenParts] = useState<Set<string>>(new Set())
  const [ncModal, setNcModal] = useState<NCModal>({ isOpen: false, qKey: "", description: "" })
  const [obsModal, setObsModal] = useState<ObsModal>({ isOpen: false, qKey: "", description: "" })
  const [saving, setSaving] = useState(false)

  const checklist = CHECKLISTS[selectedType]

  const allSections = useMemo(() => {
    const sections: (Section & { partNum: string; partTitle: string })[] = []
    checklist.parts.forEach(part => {
      part.sections.forEach(section => {
        sections.push({ ...section, partNum: part.n, partTitle: part.title })
      })
    })
    return sections
  }, [checklist])

  const filteredSections = useMemo(() => {
    if (!searchQuery) return allSections
    return allSections.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.qs.some(q =>
        q[1].toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q[2] && q[2].toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
  }, [allSections, searchQuery])

  const currentSection = selectedSection
    ? allSections.find(s => `${s.partNum}-${s.id}` === selectedSection)
    : filteredSections[0]

  const currentSectionId = currentSection ? `${currentSection.partNum}-${currentSection.id}` : null

  // Count answered questions
  const totalQuestions = allSections.reduce((sum, s) => sum + s.qs.length, 0)
  const answeredQuestions = Object.values(answers).filter(a => a.answer || a.finding).length
  const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const setAnswer = (qKey: string, field: keyof QuestionAnswer, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [qKey]: { ...prev[qKey], [field]: value || "" }
    }))
  }

  const togglePart = (partNum: string) => {
    const updated = new Set(openParts)
    if (updated.has(partNum)) {
      updated.delete(partNum)
    } else {
      updated.add(partNum)
    }
    setOpenParts(updated)
  }

  const openNCModal = (qKey: string) => {
    setNcModal({ isOpen: true, qKey, description: answers[qKey]?.ncDescription || "" })
  }

  const saveNCModal = () => {
    setAnswer(ncModal.qKey, "ncDescription", ncModal.description)
    setAnswer(ncModal.qKey, "finding", "nc")
    setNcModal({ isOpen: false, qKey: "", description: "" })
    toast.success("Non-Conformity recorded")
  }

  const openObsModal = (qKey: string) => {
    setObsModal({ isOpen: true, qKey, description: answers[qKey]?.obsDescription || "" })
  }

  const saveObsModal = () => {
    setAnswer(obsModal.qKey, "obsDescription", obsModal.description)
    setAnswer(obsModal.qKey, "finding", "obs")
    setObsModal({ isOpen: false, qKey: "", description: "" })
    toast.success("Observation recorded")
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Audit checklist saved! ${answeredQuestions}/${totalQuestions} questions answered`)
    } catch (error) {
      toast.error("Failed to save checklist")
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

  return (
    <OfficeLayout title="Audit Checklist">
      <div style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>

        {/* Header with Progress */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", background: "#fafbfc" }}>
          <div>
            <div style={{ height: 8, borderRadius: 99, background: "#e5e7eb", overflow: "hidden" }}>
              <div style={{ width: `${completionPct}%`, height: "100%", background: completionPct === 100 ? "#107c10" : BLUE, transition: "width 0.3s" }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>{answeredQuestions} of {totalQuestions} questions answered</p>
          </div>
          <button onClick={handleSaveAll} disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: saving ? "#cbd5e1" : BLUE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            <Save size={14} />{saving ? "Saving..." : "Save Checklist"}
          </button>
        </div>

        {/* Search and Category */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: "#fafbfc", display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
              Activity Category
            </label>
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value as AuditType)
                setSelectedSection(null)
                setOpenParts(new Set())
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: `1px solid #e2e8f0`,
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "inherit",
                background: "#fff",
                color: DARK,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {AUDIT_TYPES.map(type => (
                <option key={type} value={type}>
                  {CHECKLISTS[type].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
              Search Sections
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={14} style={{ position: "absolute", left: 10, color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSelectedSection(null)
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 36px",
                  border: `1px solid #e2e8f0`,
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none"
                }}
                onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ overflowY: "auto", padding: 20, background: "#eef3fb", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>

            {/* Left Sidebar - Sections Navigation */}
            <nav style={{ position: "sticky", top: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>Audit Sections</p>
              <div style={{ display: "grid", gap: 5 }}>
                {checklist.parts.map(part => {
                  const partSections = part.sections.filter(s =>
                    !searchQuery || filteredSections.some(fs => fs.id === s.id && fs.partNum === part.n)
                  )
                  if (partSections.length === 0) return null

                  const open = openParts.has(part.n)
                  const partAnswered = partSections.reduce((sum, s) => {
                    return sum + s.qs.filter((_, qIdx) => answers[`${part.n}-${s.id}-q${qIdx}`]?.answer || answers[`${part.n}-${s.id}-q${qIdx}`]?.finding).length
                  }, 0)
                  const partTotal = partSections.reduce((sum, s) => sum + s.qs.length, 0)

                  return (
                    <div key={part.n}>
                      <button
                        onClick={() => togglePart(part.n)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          textAlign: "left",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 9px",
                          background: open ? "#eef3fb" : C.white,
                          color: DARK,
                          cursor: "pointer",
                          fontFamily: "inherit"
                        }}
                      >
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: BLUE, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                          {part.n}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>{part.title}</span>
                        {partAnswered === partTotal && partTotal > 0 ? (
                          <span style={{ width: 9, height: 9, borderRadius: 99, background: "#107c10", flexShrink: 0 }} />
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#8a6000", whiteSpace: "nowrap" }}>{partTotal - partAnswered} left</span>
                        )}
                      </button>

                      {open && (
                        <div style={{ display: "grid", gap: 3, margin: "4px 0 10px 20px", paddingLeft: 10, borderLeft: `1px solid ${C.border}` }}>
                          {partSections.map(section => {
                            const sectionAnswered = section.qs.filter((_, qIdx) => answers[`${part.n}-${section.id}-q${qIdx}`]?.answer || answers[`${part.n}-${section.id}-q${qIdx}`]?.finding).length
                            const sectionKey = `${part.n}-${section.id}`
                            const isActive = currentSectionId === sectionKey

                            return (
                              <button
                                key={sectionKey}
                                onClick={() => setSelectedSection(sectionKey)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                  textAlign: "left",
                                  border: "none",
                                  borderRadius: 7,
                                  padding: "7px 8px",
                                  background: isActive ? "#e6f4e6" : "transparent",
                                  color: isActive ? "#107c10" : DARK,
                                  cursor: "pointer",
                                  fontFamily: "inherit"
                                }}
                              >
                                <span style={{ width: 36, flexShrink: 0, fontSize: 11, fontWeight: 800, color: isActive ? "#107c10" : BLUE }}>
                                  {section.id}
                                </span>
                                <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 650, lineHeight: 1.35 }}>
                                  {section.title}
                                </span>
                                {sectionAnswered === section.qs.length && section.qs.length > 0 ? (
                                  <span style={{ width: 8, height: 8, borderRadius: 99, background: "#107c10", flexShrink: 0 }} />
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, whiteSpace: "nowrap" }}>
                                    {sectionAnswered}/{section.qs.length}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </nav>

            {/* Right Content - Questions */}
            {currentSection ? (
              <div style={{ display: "grid", gap: 16 }}>
                {checklist.parts.map(part => {
                  if (part.n !== currentSection.partNum) return null

                  return (
                    <div key={part.n}>
                      <div style={{ background: BLUE, color: "#fff", borderRadius: "10px 10px 0 0", padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.78 }}>Part {part.n}</p>
                        <h3 style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800 }}>{part.title}</h3>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {part.sections.map(section => {
                          if (section.id !== currentSection.id) return null

                          const sectionAnswered = section.qs.filter((_, qIdx) => answers[`${part.n}-${section.id}-q${qIdx}`]?.answer || answers[`${part.n}-${section.id}-q${qIdx}`]?.finding).length

                          return (
                            <section key={section.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f7f9fc", borderBottom: `1px solid ${C.border}` }}>
                                <span style={{ minWidth: 42, height: 26, borderRadius: 7, background: BLUE, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                                  {section.id}
                                </span>
                                <h4 style={{ margin: 0, flex: 1, fontSize: 14, color: DARK }}>{section.title}</h4>
                                <span style={{ fontSize: 12, fontWeight: 700, color: sectionAnswered === section.qs.length && section.qs.length > 0 ? "#107c10" : C.muted }}>
                                  {sectionAnswered} / {section.qs.length} answered
                                </span>
                                <span style={{ width: 9, height: 9, borderRadius: 99, background: sectionAnswered === section.qs.length && section.qs.length > 0 ? "#107c10" : "#cbd5e1" }} />
                              </div>

                              <div style={{ display: "grid", gap: 0 }}>
                                {section.qs.map((question, qIdx) => {
                                  const qKey = `${part.n}-${section.id}-q${qIdx}`
                                  const record = answers[qKey] || { answer: undefined, finding: undefined, customerComment: "", auditorComment: "", shariaComment: "", ncDescription: "", obsDescription: "" }
                                  const answered = Boolean(record.answer)

                                  return (
                                    <div key={qKey} style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: 14 }}>
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                        <span style={{ minWidth: 44, height: 28, borderRadius: 8, background: answered ? "#e6f4e6" : "#f0f7ff", color: answered ? "#107c10" : BLUE, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                          {question[0]}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: DARK, fontWeight: 600 }}>
                                            {question[1]}
                                          </p>
                                          {question[2] && (
                                            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                                              {question[2]}
                                            </p>
                                          )}

                                          {/* Answer Buttons */}
                                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                                            <button onClick={() => setAnswer(qKey, "answer", record.answer === "yes" ? undefined : "yes")} style={answerBtn(record.answer === "yes", "#107c10")}>Yes</button>
                                            <button onClick={() => setAnswer(qKey, "answer", record.answer === "no" ? undefined : "no")} style={answerBtn(record.answer === "no", "#d13438")}>No</button>
                                            <button onClick={() => setAnswer(qKey, "answer", record.answer === "na" ? undefined : "na")} style={answerBtn(record.answer === "na", "#64748b")}>N/A</button>
                                            <span style={{ width: 1, height: 24, background: C.border, margin: "0 2px" }} />
                                            <button onClick={() => openNCModal(qKey)} style={answerBtn(record.finding === "nc", "#d13438")}>Non-conformity</button>
                                            <button onClick={() => openObsModal(qKey)} style={answerBtn(record.finding === "obs", "#d98207")}>Observation</button>
                                          </div>

                                          {/* NC/Obs Tags */}
                                          {(record.ncDescription || record.obsDescription) && (
                                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                              {record.ncDescription && (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", fontSize: "0.7rem", fontWeight: 600 }}>
                                                  🚩 NC: {record.ncDescription.substring(0, 30)}{record.ncDescription.length > 30 ? "..." : ""}
                                                </span>
                                              )}
                                              {record.obsDescription && (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontSize: "0.7rem", fontWeight: 600 }}>
                                                  ⚠️ Obs: {record.obsDescription.substring(0, 30)}{record.obsDescription.length > 30 ? "..." : ""}
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {/* Comments */}
                                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                              Customer Comment
                                              <textarea value={record.customerComment} onChange={e => setAnswer(qKey, "customerComment", e.target.value)} style={{ width: "100%", minHeight: 70, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", marginTop: 5, resize: "vertical", outline: "none", color: DARK }} />
                                            </label>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                              Auditor Comment
                                              <textarea value={record.auditorComment} onChange={e => setAnswer(qKey, "auditorComment", e.target.value)} style={{ width: "100%", minHeight: 70, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", marginTop: 5, resize: "vertical", outline: "none", color: DARK }} />
                                            </label>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                              Sharia Comment
                                              <textarea value={record.shariaComment} onChange={e => setAnswer(qKey, "shariaComment", e.target.value)} style={{ width: "100%", minHeight: 70, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", marginTop: 5, resize: "vertical", outline: "none", color: DARK }} />
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </section>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
                No sections found
              </div>
            )}
          </div>
        </div>

        {/* NC Registration Modal */}
        {ncModal.isOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 500, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>Register Non-Conformity</h3>
                <button onClick={() => setNcModal({ isOpen: false, qKey: "", description: "" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <X size={20} color={C.muted} />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
                  Description *
                </label>
                <textarea
                  value={ncModal.description}
                  onChange={e => setNcModal({ ...ncModal, description: e.target.value })}
                  placeholder="Describe the non-conformity..."
                  style={{ width: "100%", minHeight: 120, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", color: DARK }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setNcModal({ isOpen: false, qKey: "", description: "" })} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: DARK, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={saveNCModal} disabled={!ncModal.description.trim()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: !ncModal.description.trim() ? "#cbd5e1" : "#d13438", color: "#fff", fontSize: 13, fontWeight: 600, cursor: !ncModal.description.trim() ? "not-allowed" : "pointer" }}>
                  Register NC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Observation Registration Modal */}
        {obsModal.isOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 500, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>Register Observation</h3>
                <button onClick={() => setObsModal({ isOpen: false, qKey: "", description: "" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <X size={20} color={C.muted} />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
                  Description *
                </label>
                <textarea
                  value={obsModal.description}
                  onChange={e => setObsModal({ ...obsModal, description: e.target.value })}
                  placeholder="Describe the observation..."
                  style={{ width: "100%", minHeight: 120, padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", color: DARK }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setObsModal({ isOpen: false, qKey: "", description: "" })} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: DARK, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={saveObsModal} disabled={!obsModal.description.trim()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: !obsModal.description.trim() ? "#cbd5e1" : "#d98207", color: "#fff", fontSize: 13, fontWeight: 600, cursor: !obsModal.description.trim() ? "not-allowed" : "pointer" }}>
                  Register Observation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
