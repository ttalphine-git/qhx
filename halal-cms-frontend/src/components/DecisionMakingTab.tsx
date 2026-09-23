import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, XCircle, Clock, Send, AlertCircle, Loader } from "lucide-react"
import toast from "react-hot-toast"

const F = "'Inter', system-ui, sans-serif"
const API_BASE = "/api"

interface DecisionRequestData {
  id: number
  auditId: number
  applicationId?: number
  assignedTo: number
  decisionType: string
  status: string
  decisionValue?: string
  decisionText?: string
  conditions?: string
  decidedBy?: number
  decidedAt?: string
  createdAt?: string
}

interface DecisionMakingTabProps {
  applicationId?: number
  auditId?: number
  userRole: "decision_maker" | "sharia_compliance" | "admin"
  allNCsCleared: boolean
  summarySubmitted: boolean
}

interface LocalDecision {
  requestId: number
  decision: "APPROVED" | "REJECTED" | "CONDITIONAL"
  reasoning: string
  conditions?: string
}

export const DecisionMakingTab: React.FC<DecisionMakingTabProps> = ({
  applicationId,
  auditId,
  userRole,
  allNCsCleared = false,
  summarySubmitted = false,
}) => {
  const queryClient = useQueryClient()
  const [decisionData, setDecisionData] = useState<Record<number, LocalDecision>>({})
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null)

  // Fetch my decision requests
  const { data: myRequests = [], isLoading: myRequestsLoading } = useQuery({
    queryKey: ["my-decisions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/decisions/my-requests`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch decisions")
      return res.json()
    },
  })

  // Fetch audit decisions (for admin view)
  const { data: auditDecisions = [] } = useQuery({
    queryKey: ["audit-decisions", auditId],
    queryFn: async () => {
      if (!auditId) return []
      const res = await fetch(`${API_BASE}/decisions/audit/${auditId}`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch audit decisions")
      return res.json()
    },
    enabled: !!auditId && userRole === "admin",
  })

  // Submit decision mutation
  const submitDecisionMutation = useMutation({
    mutationFn: async ({ requestId, decision, reasoning, conditions }: { requestId: number; decision: string; reasoning: string; conditions?: string }) => {
      const res = await fetch(`${API_BASE}/decisions/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decision, reasoning, conditions }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Decision submitted!")
      setDecisionData({})
      setExpandedRequest(null)
      queryClient.invalidateQueries({ queryKey: ["my-decisions"] })
      if (auditId) {
        queryClient.invalidateQueries({ queryKey: ["audit-decisions", auditId] })
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    },
  })

  const handleDecision = (requestId: number, decision: "APPROVED" | "REJECTED" | "CONDITIONAL") => {
    setDecisionData((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], requestId, decision },
    }))
  }

  const handleReasoningChange = (requestId: number, reasoning: string) => {
    setDecisionData((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], requestId, reasoning },
    }))
  }

  const handleSubmitDecision = async (requestId: number) => {
    const decision = decisionData[requestId]
    if (!decision?.decision || !decision?.reasoning) {
      toast.error("Please select a decision and provide reasoning")
      return
    }

    submitDecisionMutation.mutate({
      requestId,
      decision: decision.decision,
      reasoning: decision.reasoning,
      conditions: decision.conditions,
    })
  }

  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case "APPROVED":
        return { bg: "#dcfce7", border: "#bbf7d0", text: "#166534", icon: CheckCircle2 }
      case "REJECTED":
        return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b", icon: XCircle }
      case "CONDITIONAL":
        return { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", icon: AlertCircle }
      default:
        return { bg: "#f0f9ff", border: "#bfdbfe", text: "#0c4a6e", icon: Clock }
    }
  }

  if (!allNCsCleared || !summarySubmitted) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ margin: "0 auto 16px", color: "#f59e0b" }} />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
          {!allNCsCleared ? "All NCs Must Be Cleared First" : "Audit Summary Must Be Submitted"}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: F }}>
          {!allNCsCleared ? "Complete all non-conformity reviews" : "Main auditor must submit audit summary"}
        </p>
      </div>
    )
  }

  if (myRequestsLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Loader size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
        Loading decisions...
      </div>
    )
  }

  const displayRequests = userRole === "admin" ? auditDecisions : myRequests

  return (
    <div style={{ padding: "20px 0" }}>
      {userRole === "admin" && (
        <div style={{ marginBottom: 20, padding: "16px", background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#0c4a6e", fontFamily: F }}>
            📋 As Admin: Assign decision requests to decision makers and sharia compliance team
          </p>
        </div>
      )}

      {userRole !== "admin" && (
        <div style={{ marginBottom: 20, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#166534", fontFamily: F }}>
            ✓ You have {myRequests.length} decision request(s) assigned to you
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayRequests.map((request: DecisionRequestData) => {
          const decision = decisionData[request.id]
          const isExpanded = expandedRequest === request.id
          const config = getDecisionColor(decision?.decision || request.decisionValue)
          const Icon = config.icon
          const completed = request.status === "COMPLETED"

          return (
            <div
              key={request.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                disabled={completed && userRole !== "admin"}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "none",
                  background: completed ? "#f8fafc" : "#fff",
                  cursor: completed && userRole !== "admin" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                    {request.decisionType === "DECISION_MAKER"
                      ? "Certification Decision"
                      : "Sharia Compliance Decision"}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>
                    Audit #{request.auditId}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {(decision?.decision || request.decisionValue) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                        borderRadius: 6,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: config.text,
                      }}
                    >
                      <Icon size={14} />
                      {decision?.decision || request.decisionValue}
                    </div>
                  )}
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b" }}>
                    {completed ? "✓ Done" : request.status}
                  </div>
                </div>
              </button>

              {isExpanded && !completed && (
                <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  {/* Decision options */}
                  <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                    Make Your Decision
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {[
                      { value: "APPROVED" as const, label: "✓ APPROVE Certification", color: "#16a34a" },
                      { value: "REJECTED" as const, label: "✗ REJECT Certification", color: "#dc2626" },
                      {
                        value: "CONDITIONAL" as const,
                        label: "⚠ CONDITIONAL - Require Additional Action",
                        color: "#f59e0b",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDecision(request.id, option.value)}
                        style={{
                          padding: "12px 16px",
                          background: decision?.decision === option.value ? option.color : "#fff",
                          color: decision?.decision === option.value ? "#fff" : "#0f172a",
                          border: `2px solid ${option.color}`,
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: F,
                          textAlign: "left",
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Reasoning */}
                  <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                    Decision Reasoning
                  </p>
                  <textarea
                    value={decision?.reasoning || ""}
                    onChange={(e) => handleReasoningChange(request.id, e.target.value)}
                    placeholder={`Explain your ${decision?.decision ? decision.decision.toLowerCase() : "decision"}...`}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontFamily: F,
                      minHeight: "120px",
                      boxSizing: "border-box",
                      marginBottom: 16,
                    }}
                  />

                  {decision?.decision === "CONDITIONAL" && (
                    <>
                      <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                        Conditions to Satisfy
                      </p>
                      <textarea
                        value={decision?.conditions || ""}
                        onChange={(e) => setDecisionData((prev) => ({
                          ...prev,
                          [request.id]: { ...prev[request.id], conditions: e.target.value },
                        }))}
                        placeholder="List specific conditions that must be met for certification..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontFamily: F,
                          minHeight: "100px",
                          boxSizing: "border-box",
                          marginBottom: 16,
                        }}
                      />
                    </>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={() => handleSubmitDecision(request.id)}
                    disabled={submitDecisionMutation.isPending || !decision?.decision || !decision?.reasoning}
                    style={{
                      padding: "12px 24px",
                      background: "#1d4ed8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: submitDecisionMutation.isPending ? "not-allowed" : "pointer",
                      fontFamily: F,
                      opacity: submitDecisionMutation.isPending ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Send size={16} />
                    {submitDecisionMutation.isPending ? "Submitting..." : "Submit Decision"}
                  </button>
                </div>
              )}

              {isExpanded && completed && (
                <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0", background: "#f0fdf4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#166534", fontFamily: F }}>
                      Decision completed on {request.decidedAt ? new Date(request.decidedAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
                    Final Decision: {request.decisionValue || "N/A"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#475569", fontFamily: F, lineHeight: 1.4 }}>
                    {request.decisionText}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {displayRequests.length === 0 && userRole !== "admin" && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontFamily: F }}>
            No decision requests assigned yet
          </p>
        </div>
      )}
    </div>
  )
}
