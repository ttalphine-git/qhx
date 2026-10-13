import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Save, User, CheckCircle2, AlertCircle, Loader } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "@/api/client"
import { getMgmtUsers } from "@/api/users"

const F = "'Inter', system-ui, sans-serif"

interface AssignmentTabProps {
  applicationId: number
  currentAssignments?: {
    decisionMakerId?: number
    decisionMakerName?: string
    shariaReviewerId?: number
    shariaReviewerName?: string
  }
}

export const AssignmentTab: React.FC<AssignmentTabProps> = ({
  applicationId,
  currentAssignments,
}) => {
  const queryClient = useQueryClient()
  const [decisionMakerId, setDecisionMakerId] = useState<number | null>(
    currentAssignments?.decisionMakerId || null
  )
  const [shariaReviewerId, setShariaReviewerId] = useState<number | null>(
    currentAssignments?.shariaReviewerId || null
  )

  // Fetch available users (auditors for decision maker, sharia reviewers)
  const { data: usersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const response = await getMgmtUsers({ page: 0, size: 100 })
      return response.content || []
    },
  })

  const decisionMakers = usersData?.filter(
    (user: any) =>
      user.role?.toLowerCase().includes("auditor") ||
      user.role?.toLowerCase().includes("decision") ||
      user.role?.toLowerCase().includes("manager")
  ) || []

  const shariaReviewers = usersData?.filter(
    (user: any) =>
      user.role?.toLowerCase().includes("sharia") ||
      user.role?.toLowerCase().includes("halal") ||
      user.role?.toLowerCase().includes("compliance")
  ) || []

  // Save assignments
  const saveAssignmentsMutation = useMutation({
    mutationFn: async () => {
      if (!decisionMakerId || !shariaReviewerId) {
        throw new Error("Please assign both decision maker and sharia reviewer")
      }

      await apiClient.post(`/applications/${applicationId}/assignments`, {
        decisionMakerId,
        shariaReviewerId,
      })
    },
    onSuccess: () => {
      toast.success("Assignments saved successfully!")
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
    },
    onError: (err) => {
      console.error("Error saving assignments:", err)
      toast.error(err instanceof Error ? err.message : "Failed to save assignments")
    },
  })

  const getDisplayName = (userId: number | null) => {
    if (!userId) return "Not assigned"
    const user = usersData?.find((u: any) => u.id == userId)
    return user ? `${user.name || "Unknown"} (${user.email || ""})` : "Unknown"
  }

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Assign Roles
        </h3>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          Assign a decision maker for the Decision Making stage and a sharia compliance reviewer.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Decision Maker Assignment */}
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 12, fontFamily: F }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <User size={16} color="#2563eb" />
              <span>Decision Maker</span>
            </div>
          </label>

          {decisionMakerId ? (
            <div style={{ padding: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 600, color: "#0c4a6e" }}>
                    ✓ Assigned
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#0c4a6e" }}>
                    {getDisplayName(decisionMakerId)}
                  </p>
                </div>
                <button
                  onClick={() => setDecisionMakerId(null)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    color: "#0c4a6e",
                    border: "1px solid #bfdbfe",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <select
              value={decisionMakerId || ""}
              onChange={(e) => setDecisionMakerId(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontFamily: F,
                boxSizing: "border-box",
              }}
            >
              <option value="">-- Select Decision Maker --</option>
              {decisionMakers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          )}

          {decisionMakers.length === 0 && (
            <div style={{ padding: "12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, fontSize: "0.75rem", color: "#92400e" }}>
              ℹ️ No users with auditor or decision maker role found
            </div>
          )}
        </div>

        {/* Sharia Reviewer Assignment */}
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 12, fontFamily: F }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Sharia Compliance Reviewer</span>
            </div>
          </label>

          {shariaReviewerId ? (
            <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 600, color: "#166534" }}>
                    ✓ Assigned
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#166534" }}>
                    {getDisplayName(shariaReviewerId)}
                  </p>
                </div>
                <button
                  onClick={() => setShariaReviewerId(null)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <select
              value={shariaReviewerId || ""}
              onChange={(e) => setShariaReviewerId(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontFamily: F,
                boxSizing: "border-box",
              }}
            >
              <option value="">-- Select Sharia Reviewer --</option>
              {shariaReviewers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.name} ({user.email})
                </option>
              ))}
            </select>
          )}

          {shariaReviewers.length === 0 && (
            <div style={{ padding: "12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, fontSize: "0.75rem", color: "#92400e" }}>
              ℹ️ No users with sharia or compliance role found
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={() => saveAssignmentsMutation.mutate()}
          disabled={saveAssignmentsMutation.isPending || !decisionMakerId || !shariaReviewerId}
          style={{
            padding: "12px 20px",
            background: decisionMakerId && shariaReviewerId ? "#0f2170" : "#cbd5e1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: saveAssignmentsMutation.isPending || !decisionMakerId || !shariaReviewerId ? "not-allowed" : "pointer",
            fontFamily: F,
            opacity: saveAssignmentsMutation.isPending ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
          }}
        >
          {saveAssignmentsMutation.isPending ? (
            <>
              <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Assignments
            </>
          )}
        </button>

        {/* Current Assignments Display */}
        {decisionMakerId && shariaReviewerId && (
          <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
            <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#166534" }}>
              Current Assignments:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: "0.75rem", color: "#166534" }}>
                <strong>Decision Maker:</strong> {getDisplayName(decisionMakerId)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#166534" }}>
                <strong>Sharia Reviewer:</strong> {getDisplayName(shariaReviewerId)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
