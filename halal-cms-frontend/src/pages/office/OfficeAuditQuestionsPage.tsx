import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { CHECKLISTS, AUDIT_TYPES } from "@/lib/uploaded-audit/checklists"
import type { AuditType, Section } from "@/lib/uploaded-audit/checklists"
import OfficeLayout from "./OfficeLayout"
import { C } from "@/lib/utils"

const BLUE = "#2563eb"
const DARK = "#0f172a"

interface QuestionAnswer {
  answer?: "yes" | "no" | "na" | "nc"
  finding?: "nc" | "obs"
  comment: string
}

export default function OfficeAuditQuestionsPage() {
  const [selectedType, setSelectedType] = useState<AuditType>("manufacturing")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})

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

  const setAnswer = (qKey: string, field: keyof QuestionAnswer, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [qKey]: { ...prev[qKey], [field]: value }
    }))
  }

  const getAnswerStyle = (answer?: string, selected?: boolean) => {
    if (!selected) return { background: "#f3f4f6", color: "#6b7280", borderColor: "#d1d5db" }
    if (answer === "yes") return { background: "#dcfce7", color: "#15803d", borderColor: "#16a34a" }
    if (answer === "no") return { background: "#fee2e2", color: "#991b1b", borderColor: "#dc2626" }
    if (answer === "nc") return { background: "#fee2e2", color: "#991b1b", borderColor: "#dc2626" }
    if (answer === "na") return { background: "#f3f4f6", color: "#6b7280", borderColor: "#9ca3af" }
    return { background: "#f3f4f6", color: "#6b7280", borderColor: "#d1d5db" }
  }

  return (
    <OfficeLayout title="Audit Questions">
      <div style={{ padding: "1.5rem 2rem", height: "100%", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: DARK }}>{checklist.name} Audit Checklist</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{checklist.form} • {checklist.rev}</p>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 16 }}>
          {/* Activity Category Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
              Activity Category
            </label>
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value as AuditType)
                setSelectedSection(null)
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

          {/* Search */}
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
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, flex: 1, minHeight: 0 }}>

          {/* Left Sidebar - Sections List */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Audit Sections</p>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredSections.map((section, idx) => {
                const sectionKey = `${section.partNum}-${section.id}`
                const isSelected = currentSectionId === sectionKey
                return (
                  <button
                    key={sectionKey}
                    onClick={() => setSelectedSection(sectionKey)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "none",
                      background: isSelected ? "#eff6ff" : "#fff",
                      borderLeft: isSelected ? `3px solid ${BLUE}` : "3px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: idx < filteredSections.length - 1 ? "1px solid #f1f5f9" : "none",
                      transition: "background 0.1s"
                    }}
                    onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc" }}
                    onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = "#fff" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "space-between" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isSelected ? BLUE : DARK, lineHeight: 1.3 }}>
                          {section.id}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
                          {section.title}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", flexShrink: 0 }}>
                        {section.qs.length}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Content - Questions */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {currentSection ? (
              <>
                {/* Section Header */}
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: DARK }}>
                    Section {currentSection.id}: {currentSection.title}
                  </h2>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                    {currentSection.qs.length} questions
                  </p>
                </div>

                {/* Questions */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "grid", gap: 16 }}>
                  {currentSection.qs.map((question, qIdx) => {
                    const qKey = `${currentSectionId}-q${qIdx}`
                    const ans = answers[qKey]
                    return (
                      <div key={qKey} style={{ borderBottom: qIdx < currentSection.qs.length - 1 ? `1px solid #e2e8f0` : "none", paddingBottom: 16 }}>
                        {/* Question Number and Text */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 4, background: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {question[0]}
                          </div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: DARK, lineHeight: 1.5, flex: 1 }}>
                            {question[1]}
                          </p>
                        </div>

                        {/* Guidance Note */}
                        {question[2] && (
                          <div style={{ marginLeft: 34, padding: "8px 10px", background: "#f0f7ff", borderLeft: "2px solid #3b82f6", borderRadius: 4, marginBottom: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color: "#1e40af", lineHeight: 1.4 }}>
                              {question[2]}
                            </p>
                          </div>
                        )}

                        {/* Answer Options */}
                        <div style={{ marginLeft: 34, display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          {["yes", "no", "na", "nc"].map(opt => {
                            const style = getAnswerStyle(opt, ans?.answer === opt)
                            return (
                              <button
                                key={opt}
                                onClick={() => setAnswer(qKey, "answer", opt as any)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  border: `1px solid ${style.borderColor}`,
                                  background: style.background,
                                  color: style.color,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  textTransform: "uppercase",
                                  transition: "all 0.1s"
                                }}
                              >
                                {opt === "na" ? "N/A" : opt === "nc" ? "NC" : opt.toUpperCase()}
                              </button>
                            )
                          })}
                          <button
                            onClick={() => setAnswer(qKey, "finding", ans?.finding === "nc" ? undefined : "nc")}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 6,
                              border: ans?.finding === "nc" ? "1px solid #dc2626" : "1px solid #d1d5db",
                              background: ans?.finding === "nc" ? "#fee2e2" : "#f3f4f6",
                              color: ans?.finding === "nc" ? "#991b1b" : "#6b7280",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.1s"
                            }}
                          >
                            Non-Conformity
                          </button>
                          <button
                            onClick={() => setAnswer(qKey, "finding", ans?.finding === "obs" ? undefined : "obs")}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 6,
                              border: ans?.finding === "obs" ? "1px solid #f59e0b" : "1px solid #d1d5db",
                              background: ans?.finding === "obs" ? "#fef3c7" : "#f3f4f6",
                              color: ans?.finding === "obs" ? "#92400e" : "#6b7280",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.1s"
                            }}
                          >
                            Observation
                          </button>
                        </div>

                        {/* Comments */}
                        <div style={{ marginLeft: 34 }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
                            Comments
                          </label>
                          <textarea
                            value={ans?.comment ?? ""}
                            onChange={e => setAnswer(qKey, "comment", e.target.value)}
                            placeholder="Add comments or observations..."
                            style={{
                              width: "100%",
                              minHeight: 60,
                              padding: "10px 12px",
                              border: `1px solid #e2e8f0`,
                              borderRadius: 6,
                              fontSize: 12,
                              fontFamily: "inherit",
                              outline: "none",
                              resize: "vertical",
                              color: DARK
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                            onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No sections found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
