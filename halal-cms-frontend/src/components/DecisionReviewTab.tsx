import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, AlertCircle, Save, Loader, X } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "@/api/client"

const F = "'Inter', system-ui, sans-serif"

interface ReviewQuestion {
  id: number
  text: string
  answer: string
  finding?: string
  auditorComment?: string
}

interface DecisionReviewTabProps {
  applicationId: number
  roleType: "decision_maker" | "sharia_reviewer"
  questions?: ReviewQuestion[]
  existingReview?: {
    summary?: string
    approved?: boolean
  }
}

export const DecisionReviewTab: React.FC<DecisionReviewTabProps> = ({
  applicationId,
  roleType,
  questions = [],
  existingReview,
}) => {
  const queryClient = useQueryClient()
  const [summary, setSummary] = useState(existingReview?.summary || "")
  const [allQuestionsReviewed, setAllQuestionsReviewed] = useState(true)

  const roleLabel = roleType === "decision_maker" ? "Decision Maker" : "Sharia Reviewer"
  const roleColor = roleType === "decision_maker" ? "#2563eb" : "#16a34a"

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!summary.trim()) {
        throw new Error(`Please provide a summary from ${roleLabel}`)
      }

      await apiClient.post(`/applications/${applicationId}/review/${roleType}`, {
        summary,
        approved: true,
      })
    },
    onSuccess: () => {
      toast.success(`${roleLabel} review submitted successfully!`)
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
    },
    onError: (err) => {
      console.error("Error submitting review:", err)
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    },
  })

  const rejectReviewMutation = useMutation({
    mutationFn: async () => {
      if (!summary.trim()) {
        throw new Error(`Please provide feedback from ${roleLabel}`)
      }

      await apiClient.post(`/applications/${applicationId}/review/${roleType}`, {
        summary,
        approved: false,
      })
    },
    onSuccess: () => {
      toast.success(`Application sent back for corrections`)
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
    },
    onError: (err) => {
      console.error("Error submitting review:", err)
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    },
  })

  const isSubmitting = submitReviewMutation.isPending || rejectReviewMutation.isPending

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: roleColor,
            }}
          />
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            {roleLabel} Review
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          {roleType === "decision_maker"
            ? "Review the audit findings, questions, and provide your decision on the application."
            : "Review the audit findings for sharia compliance and provide your decision."}
        </p>
      </div>

      {/* Questions Summary */}
      {questions.length > 0 && (
        <div style={{ marginBottom: 24, padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
            Audit Questions Summary ({questions.length} total)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{ fontSize: "0.75rem", color: "#475569", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Q{idx + 1}:</strong> {q.text}
                </div>
                <div style={{ marginBottom: 2 }}>
                  <span style={{ color: "#64748b" }}>Answer:</span> {q.answer}
                </div>
                {q.finding && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ color: "#64748b" }}>Finding:</span>{" "}
                    <span style={{ textTransform: "uppercase", fontWeight: 600, color: q.finding === "nc" ? "#dc2626" : "#f59e0b" }}>
                      {q.finding}
                    </span>
                  </div>
                )}
                {q.auditorComment && (
                  <div style={{ color: "#64748b", fontStyle: "italic" }}>
                    Auditor Note: {q.auditorComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div style={{ marginBottom: 24, padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 12, fontFamily: F }}>
          {roleLabel} Summary & Recommendation
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={
            roleType === "decision_maker"
              ? "Provide your decision summary, recommendations, and any conditions for certification..."
              : "Provide your sharia compliance assessment and any concerns or approvals..."
          }
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: "0.8rem",
            minHeight: "150px",
            fontFamily: F,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          onClick={() => rejectReviewMutation.mutate()}
          disabled={isSubmitting || !summary.trim()}
          style={{
            padding: "12px 20px",
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: isSubmitting || !summary.trim() ? "not-allowed" : "pointer",
            fontFamily: F,
            opacity: isSubmitting || !summary.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <X size={16} />
          Send Back
        </button>

        <button
          onClick={() => submitReviewMutation.mutate()}
          disabled={isSubmitting || !summary.trim()}
          style={{
            padding: "12px 20px",
            background: roleColor,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: isSubmitting || !summary.trim() ? "not-allowed" : "pointer",
            fontFamily: F,
            opacity: isSubmitting || !summary.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Approve
            </>
          )}
        </button>
      </div>

      {/* Status Message */}
      {existingReview?.approved && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 6,
            fontSize: "0.8rem",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>✓ {roleLabel} review completed and approved</span>
        </div>
      )}
    </div>
  )
}
