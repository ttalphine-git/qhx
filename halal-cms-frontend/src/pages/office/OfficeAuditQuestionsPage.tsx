import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { CHECKLISTS, AUDIT_TYPES } from "@/lib/uploaded-audit/checklists"
import type { AuditType } from "@/lib/uploaded-audit/checklists"
import OfficeLayout from "./OfficeLayout"
import { C } from "@/lib/utils"

export default function OfficeAuditQuestionsPage() {
  const [selectedType, setSelectedType] = useState<AuditType>("manufacturing")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const checklist = CHECKLISTS[selectedType]

  const toggleSection = (sectionId: string) => {
    const updated = new Set(expandedSections)
    if (updated.has(sectionId)) {
      updated.delete(sectionId)
    } else {
      updated.add(sectionId)
    }
    setExpandedSections(updated)
  }

  const filteredParts = checklist.parts.map(part => ({
    ...part,
    sections: part.sections.map(section => ({
      ...section,
      qs: section.qs.filter(q =>
        q[1].toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q[2] && q[2].toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(s => s.qs.length > 0)
  })).filter(p => p.sections.length > 0)

  return (
    <OfficeLayout title="Audit Questions">
      <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.textDark }}>Audit Questions</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted }}>Browse all audit checklist questions organized by section</p>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Audit Type Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
              Activity Category
            </label>
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value as AuditType)
                setExpandedSections(new Set())
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                background: "#fff",
                color: C.textDark,
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
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
              Search Questions
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: 12, color: C.muted }} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none"
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div style={{ background: "#f0f9ff", border: `1px solid #bfdbfe`, borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
            <strong>{checklist.name}</strong> • {checklist.form} • {checklist.rev}
          </p>
        </div>

        {/* Questions by Part */}
        <div style={{ display: "grid", gap: 24 }}>
          {filteredParts.map(part => (
            <div key={part.n} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: C.cardShadow }}>

              {/* Part Header */}
              <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textDark }}>
                  Part {part.n}: {part.title}
                </h2>
              </div>

              {/* Sections */}
              <div style={{ display: "grid", gap: 0 }}>
                {part.sections.map((section, sIdx) => {
                  const sectionId = `${part.n}-${section.id}`
                  const isExpanded = expandedSections.has(sectionId)
                  return (
                    <div key={sectionId} style={{ borderBottom: sIdx < part.sections.length - 1 ? `1px solid ${C.border}` : "none" }}>

                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(sectionId)}
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          background: isExpanded ? "#f1f5f9" : "#fff",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s"
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseOut={e => (e.currentTarget.style.background = isExpanded ? "#f1f5f9" : "#fff")}
                      >
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textDark }}>
                            Section {section.id}: {section.title}
                          </h3>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                            {section.qs.length} question{section.qs.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={18} color={C.muted} style={{ flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={18} color={C.muted} style={{ flexShrink: 0 }} />
                        )}
                      </button>

                      {/* Questions */}
                      {isExpanded && (
                        <div style={{ padding: "0 20px 20px", display: "grid", gap: 12 }}>
                          {section.qs.map((question, qIdx) => (
                            <div key={`${sectionId}-q${qIdx}`} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, background: "#f9fafb" }}>
                              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                  {question[0]}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textDark, lineHeight: 1.5, flex: 1 }}>
                                  {question[1]}
                                </p>
                              </div>
                              {question[2] && (
                                <div style={{ marginLeft: 40, padding: "10px 12px", background: "#eff6ff", borderLeft: "3px solid #2563eb", borderRadius: 4 }}>
                                  <p style={{ margin: 0, fontSize: 12, color: "#1e40af", lineHeight: 1.4 }}>
                                    <strong>Note:</strong> {question[2]}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredParts.length === 0 && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "60px 20px", textAlign: "center", boxShadow: C.cardShadow }}>
            <Search size={32} color={C.border} style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textDark }}>No questions found</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>Try adjusting your search or selecting a different category</p>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
