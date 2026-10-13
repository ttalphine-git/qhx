import React, { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

const F = "'Inter', system-ui, sans-serif"

interface ShariaChecklistItem {
  id: number
  label: string
  answer?: boolean | null
}

interface ShariaChecklistProps {
  applicationId: number
}

export const ShariaChecklist: React.FC<ShariaChecklistProps> = ({ applicationId }) => {
  const [checklist, setChecklist] = useState<ShariaChecklistItem[]>([
    { id: 1, label: "No porcine material or derivatives in products or processing aids", answer: null },
    { id: 2, label: "No khamr (alcoholic beverage) used as an ingredient", answer: null },
    { id: 3, label: "All animal-derived inputs from halal-slaughtered sources", answer: null },
    { id: 4, label: "No cross-contamination with najs", answer: null },
    { id: 5, label: "Labelling and halal claims are truthful", answer: null },
  ])

  const answered = checklist.filter((item) => item.answer !== null).length
  const total = checklist.length
  const allPassed = checklist.every((item) => item.answer === true)

  const setAnswer = (id: number, answer: boolean) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, answer } : item)))
  }

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Sharia Checklist</h3>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "4px 12px", borderRadius: 12 }}>
            {answered} of {total} answered
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          Verify all sharia compliance requirements for this application
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {checklist.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "16px",
              background: "#fff",
              border: `1px solid ${
                item.answer === null ? "#e2e8f0" : item.answer === true ? "#d1fae5" : "#fee2e2"
              }`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ marginTop: 2 }}>
                  {item.answer === null ? (
                    <AlertCircle size={18} color="#f59e0b" />
                  ) : item.answer === true ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </p>
                  {item.answer !== null && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: item.answer === true ? "#059669" : "#dc2626",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.answer === true ? "✓ Compliant" : "✗ Non-Compliant"}
                    </span>
                  )}
                  {item.answer === null && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#f59e0b",
                        textTransform: "uppercase",
                      }}
                    >
                      Unanswered
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
              <button
                onClick={() => setAnswer(item.id, true)}
                style={{
                  padding: "6px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: `2px solid ${item.answer === true ? "#10b981" : "#e2e8f0"}`,
                  background: item.answer === true ? "#d1fae5" : "#fff",
                  color: item.answer === true ? "#059669" : "#64748b",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (item.answer !== true) {
                    e.currentTarget.style.borderColor = "#10b981"
                    e.currentTarget.style.background = "#f0fdf4"
                  }
                }}
                onMouseOut={(e) => {
                  if (item.answer !== true) {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.background = "#fff"
                  }
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setAnswer(item.id, false)}
                style={{
                  padding: "6px 16px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: `2px solid ${item.answer === false ? "#ef4444" : "#e2e8f0"}`,
                  background: item.answer === false ? "#fee2e2" : "#fff",
                  color: item.answer === false ? "#dc2626" : "#64748b",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (item.answer !== false) {
                    e.currentTarget.style.borderColor = "#ef4444"
                    e.currentTarget.style.background = "#fef2f2"
                  }
                }}
                onMouseOut={(e) => {
                  if (item.answer !== false) {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.background = "#fff"
                  }
                }}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {answered === total && (
        <div
          style={{
            marginTop: 20,
            padding: "12px 16px",
            background: allPassed ? "#f0fdf4" : "#fee2e2",
            border: `1px solid ${allPassed ? "#86efac" : "#fecaca"}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: allPassed ? "#166534" : "#7f1d1d",
            fontSize: "0.8rem",
          }}
        >
          {allPassed ? (
            <>
              <CheckCircle2 size={16} />
              All sharia compliance checks passed. Application is compliant.
            </>
          ) : (
            <>
              <AlertCircle size={16} />
              Some sharia compliance issues found. Application requires clarification.
            </>
          )}
        </div>
      )}
    </div>
  )
}
