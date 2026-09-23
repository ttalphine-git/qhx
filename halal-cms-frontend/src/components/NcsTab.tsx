import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, AlertCircle, CheckCircle, Clock, Upload, Send, FileText, Loader } from "lucide-react"
import toast from "react-hot-toast"

const F = "'Inter', system-ui, sans-serif"

interface NCWorkflowStatus {
  ncId: number
  currentStatus: string
  correctiveAction?: string
  dueDate?: string
  evidenceSubmissions: EvidenceSubmission[]
  currentIteration: number
}

interface EvidenceSubmission {
  id: number
  ncId: number
  submissionNumber: number
  evidenceText: string
  auditorReviewStatus?: string
  auditorFeedback?: string
  submittedAt: string
  reviewedAt?: string
}

interface NcsTabProps {
  applicationId: number
}

const API_BASE = "/api"

export const NcsTab: React.FC<NcsTabProps> = ({ applicationId }) => {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [activeWorkflowId, setActiveWorkflowId] = useState<number | null>(null)

  // Form states
  const [correctiveAction, setCorrectiveAction] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [evidenceText, setEvidenceText] = useState("")
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])

  // Fetch all NCs for application
  const { data: ncWorkflows = [], isLoading, error } = useQuery({
    queryKey: ["ncs", applicationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/nc/application/${applicationId}`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error(`Failed to fetch NCs: ${res.status}`)
      return res.json()
    },
    enabled: !!applicationId,
  })

  // Fetch single NC status (for expanded view)
  const { data: selectedNCStatus } = useQuery({
    queryKey: ["nc-status", activeWorkflowId],
    queryFn: async () => {
      if (!activeWorkflowId) return null
      const res = await fetch(`${API_BASE}/nc/${activeWorkflowId}/status`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch NC status")
      return res.json()
    },
    enabled: !!activeWorkflowId,
  })

  // Submit corrective action
  const submitCAMutation = useMutation({
    mutationFn: async (ncId: number) => {
      if (!correctiveAction || !dueDate) {
        throw new Error("Please fill in all fields")
      }
      const res = await fetch(`${API_BASE}/nc/${ncId}/customer-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          correctiveAction,
          dueDate,
        }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Corrective action submitted!")
      setCorrectiveAction("")
      setDueDate("")
      queryClient.invalidateQueries({ queryKey: ["ncs", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["nc-status", activeWorkflowId] })
      setActiveWorkflowId(null)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    },
  })

  // Submit evidence
  const submitEvidenceMutation = useMutation({
    mutationFn: async (ncId: number) => {
      if (!evidenceText) {
        throw new Error("Please provide evidence description")
      }
      const res = await fetch(`${API_BASE}/nc/${ncId}/evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          evidenceText,
          evidenceFiles: evidenceFiles.map(f => f.name),
        }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Evidence submitted!")
      setEvidenceText("")
      setEvidenceFiles([])
      queryClient.invalidateQueries({ queryKey: ["ncs", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["nc-status", activeWorkflowId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit evidence")
    },
  })

  // Review evidence (auditor)
  const reviewEvidenceMutation = useMutation({
    mutationFn: async ({ ncId, decision, feedback }: { ncId: number; decision: string; feedback: string }) => {
      if (!decision || !feedback) {
        throw new Error("Please provide decision and feedback")
      }
      const res = await fetch(`${API_BASE}/nc/${ncId}/auditor-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ decision, feedback }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Evidence reviewed!")
      queryClient.invalidateQueries({ queryKey: ["ncs", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["nc-status", activeWorkflowId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to review")
    },
  })

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; border: string; text: string; icon: any }> = {
      "PENDING_CUSTOMER_ACTION": { bg: "#fef08a", border: "#fcd34d", text: "#854d0e", icon: AlertCircle },
      "PENDING_EVIDENCE": { bg: "#dbeafe", border: "#bfdbfe", text: "#0c4a6e", icon: Clock },
      "PENDING_AUDITOR_REVIEW": { bg: "#fce7f3", border: "#fbcfe8", text: "#831843", icon: Clock },
      "APPROVED": { bg: "#dcfce7", border: "#bbf7d0", text: "#166534", icon: CheckCircle },
      "REJECTED": { bg: "#fee2e2", border: "#fecaca", text: "#991b1b", icon: AlertCircle },
    }
    const c = config[status] || config["PENDING_CUSTOMER_ACTION"]
    const Icon = c.icon
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, color: c.text }}>
        <Icon size={12} />
        {status.replace(/_/g, " ")}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <AlertCircle size={24} style={{ marginBottom: "10px" }} />
        Error loading NCs: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Loader size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
        Loading NCs...
      </div>
    )
  }

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ncWorkflows.map((nc: NCWorkflowStatus) => {
          const isExpanded = activeWorkflowId === nc.ncId
          const current = selectedNCStatus || nc

          return (
            <div
              key={nc.ncId}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setActiveWorkflowId(isExpanded ? null : nc.ncId)}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "none",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: F,
                }}
              >
                <div style={{ textAlign: "left", flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                    NC #{nc.ncId}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                    Status: {nc.currentStatus}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={nc.currentStatus} />
                  <ChevronDown
                    size={20}
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "0.2s",
                    }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  {/* Corrective Action */}
                  {(nc.currentStatus === "PENDING_CUSTOMER_ACTION" || nc.currentStatus === "PENDING_EVIDENCE") && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                        Corrective Action
                      </p>
                      {!nc.correctiveAction ? (
                        <>
                          <textarea
                            value={correctiveAction}
                            onChange={(e) => setCorrectiveAction(e.target.value)}
                            placeholder="Describe the corrective action..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              minHeight: "80px",
                              marginBottom: "12px",
                              boxSizing: "border-box",
                              fontFamily: F,
                            }}
                          />
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              marginBottom: "12px",
                              fontFamily: F,
                            }}
                          />
                          <button
                            onClick={() => submitCAMutation.mutate(nc.ncId)}
                            disabled={submitCAMutation.isPending}
                            style={{
                              padding: "10px 16px",
                              background: "#16a34a",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: submitCAMutation.isPending ? "not-allowed" : "pointer",
                              fontFamily: F,
                              opacity: submitCAMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            {submitCAMutation.isPending ? "Submitting..." : "Submit Corrective Action"}
                          </button>
                        </>
                      ) : (
                        <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6 }}>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#166534", fontFamily: F }}>
                            ✓ Action: {nc.correctiveAction}
                          </p>
                          <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#166534", fontFamily: F }}>
                            Due: {nc.dueDate}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence Submission */}
                  {(nc.currentStatus === "PENDING_EVIDENCE" || nc.currentStatus === "PENDING_AUDITOR_REVIEW") && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                        Submit Evidence
                      </p>
                      <textarea
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder="Describe your evidence..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          minHeight: "80px",
                          marginBottom: "12px",
                          boxSizing: "border-box",
                          fontFamily: F,
                        }}
                      />
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, fontFamily: F }}>
                          Attach Files
                        </label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                          style={{
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            width: "100%",
                            fontFamily: F,
                          }}
                        />
                        {evidenceFiles.length > 0 && (
                          <p style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: 6, fontFamily: F }}>
                            {evidenceFiles.length} file(s) selected
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => submitEvidenceMutation.mutate(nc.ncId)}
                        disabled={submitEvidenceMutation.isPending}
                        style={{
                          padding: "10px 16px",
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: submitEvidenceMutation.isPending ? "not-allowed" : "pointer",
                          fontFamily: F,
                          opacity: submitEvidenceMutation.isPending ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Upload size={14} />
                        {submitEvidenceMutation.isPending ? "Uploading..." : "Submit Evidence"}
                      </button>
                    </div>
                  )}

                  {/* Evidence History */}
                  {current.evidenceSubmissions.length > 0 && (
                    <div>
                      <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                        Evidence Submissions
                      </p>
                      {current.evidenceSubmissions.map((ev: EvidenceSubmission) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "12px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            marginBottom: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
                              Submission #{ev.submissionNumber}
                            </p>
                            <StatusBadge status={ev.auditorReviewStatus || "PENDING"} />
                          </div>
                          <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>
                            {ev.evidenceText}
                          </p>
                          {ev.auditorFeedback && (
                            <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#dc2626", fontStyle: "italic", fontFamily: F }}>
                              Feedback: {ev.auditorFeedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {ncWorkflows.length === 0 && !isLoading && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontFamily: F }}>
            No non-conformities found for this application
          </p>
        </div>
      )}
    </div>
  )
}
