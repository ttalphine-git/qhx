import React, { useState, useEffect } from "react"
import { Check, X, AlertCircle } from "lucide-react"

const F = "'Inter', system-ui, sans-serif"

interface ReadinessChecklistProps {
  applicationId: number
  applicationData?: any
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ applicationId, applicationData }) => {
  const [checklist, setChecklist] = useState([
    { id: 1, label: "Application fee paid and verified", completed: false },
    { id: 2, label: "Certification agreement signed", completed: false },
    { id: 3, label: "F1 and F2 audits complete", completed: false },
    { id: 4, label: "All non-conformities closed (0 / 0)", completed: false },
    { id: 5, label: "Auditor recommendation signed", completed: false },
    { id: 6, label: "Sharia opinion: pending", completed: false },
    { id: 7, label: "No conflict of interest declared for you", completed: false },
  ])

  const completed = checklist.filter((item) => item.completed).length
  const total = checklist.length

  const toggleItem = (id: number) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Readiness Check</h3>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "4px 12px", borderRadius: 12 }}>
            {completed} of {total}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          Verify all requirements are met before the decision maker can approve
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checklist.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: item.completed ? "#f0fdf4" : "#fff",
              border: `1px solid ${item.completed ? "#86efac" : "#e2e8f0"}`,
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = item.completed ? "#f0fdf4" : "#f8fafc"
              e.currentTarget.style.borderColor = item.completed ? "#86efac" : "#cbd5e1"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = item.completed ? "#f0fdf4" : "#fff"
              e.currentTarget.style.borderColor = item.completed ? "#86efac" : "#e2e8f0"
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: item.completed ? "#22c55e" : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.completed && <Check size={16} color="#fff" />}
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: item.completed ? "#166534" : "#475569",
                textDecoration: item.completed ? "line-through" : "none",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {completed === total && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#166534",
            fontSize: "0.8rem",
          }}
        >
          <Check size={16} />
          All readiness checks passed. Application is ready for decision.
        </div>
      )}
    </div>
  )
}
