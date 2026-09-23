import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileText, CheckCircle, Send, AlertCircle, Loader } from "lucide-react"
import toast from "react-hot-toast"

const F = "'Inter', system-ui, sans-serif"
const API_BASE = "/api"

interface Product {
  id: number
  name: string
  sku: string
}

interface AuditSummaryTabProps {
  applicationId?: number
  auditId?: number
  products: Product[]
}

interface AuditReportSummary {
  id?: number
  auditId: number
  mainAuditorSummary: string
  shariaSummary: string
  compliedProducts: string
  nonCompliedProducts: string
  status: "DRAFT" | "SUBMITTED"
  submittedAt?: string
  submittedBy?: number
}

export const AuditSummaryTab: React.FC<AuditSummaryTabProps> = ({
  applicationId,
  auditId,
  products = [],
}) => {
  const queryClient = useQueryClient()
  const [summaryData, setSummaryData] = useState<Omit<AuditReportSummary, "id" | "auditId">>({
    mainAuditorSummary: "",
    shariaSummary: "",
    compliedProducts: "[]",
    nonCompliedProducts: "[]",
    status: "DRAFT",
  })
  const [currentRole, setCurrentRole] = useState<"auditor" | "sharia">("auditor")

  // Fetch if NCs are cleared
  const { data: ncsCheckData } = useQuery({
    queryKey: ["ncs-cleared", auditId],
    queryFn: async () => {
      if (!auditId) return { allNCsCleared: false }
      const res = await fetch(`${API_BASE}/audit-summary/${auditId}/check-ncs`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to check NCs")
      return res.json()
    },
    enabled: !!auditId,
  })

  // Fetch audit summary if it exists
  const { data: existingSummary } = useQuery({
    queryKey: ["audit-summary", auditId],
    queryFn: async () => {
      if (!auditId) return null
      try {
        const res = await fetch(`${API_BASE}/audit-summary/${auditId}`, {
          headers: { "Accept": "application/json" },
          credentials: "include",
        })
        if (!res.ok) return null
        return res.json() as Promise<AuditReportSummary>
      } catch {
        return null
      }
    },
    enabled: !!auditId,
  })

  // Update local state when existing summary is loaded
  React.useEffect(() => {
    if (existingSummary) {
      setSummaryData({
        mainAuditorSummary: existingSummary.mainAuditorSummary || "",
        shariaSummary: existingSummary.shariaSummary || "",
        compliedProducts: existingSummary.compliedProducts || "[]",
        nonCompliedProducts: existingSummary.nonCompliedProducts || "[]",
        status: existingSummary.status || "DRAFT",
        submittedAt: existingSummary.submittedAt,
        submittedBy: existingSummary.submittedBy,
      })
    }
  }, [existingSummary])

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!auditId) throw new Error("Audit ID required")
      if (!summaryData.mainAuditorSummary || !summaryData.shariaSummary) {
        throw new Error("Please fill in both summaries")
      }
      const res = await fetch(`${API_BASE}/audit-summary/${auditId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mainAuditorSummary: summaryData.mainAuditorSummary,
          shariaSummary: summaryData.shariaSummary,
        }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Draft saved!")
      queryClient.invalidateQueries({ queryKey: ["audit-summary", auditId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save draft")
    },
  })

  // Submit summary mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!auditId) throw new Error("Audit ID required")
      if (!summaryData.mainAuditorSummary || !summaryData.shariaSummary) {
        throw new Error("Please fill in both summaries")
      }

      const compliedIds = JSON.parse(summaryData.compliedProducts)
      const nonCompliedIds = JSON.parse(summaryData.nonCompliedProducts)

      if (compliedIds.length + nonCompliedIds.length === 0) {
        throw new Error("Please mark at least one product")
      }

      const res = await fetch(`${API_BASE}/audit-summary/${auditId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mainAuditorSummary: summaryData.mainAuditorSummary,
          shariaSummary: summaryData.shariaSummary,
          compliedProducts: JSON.stringify(compliedIds),
          nonCompliedProducts: JSON.stringify(nonCompliedIds),
        }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Audit summary submitted!")
      queryClient.invalidateQueries({ queryKey: ["audit-summary", auditId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    },
  })

  const handleToggleProduct = (productId: number, complied: boolean) => {
    setSummaryData((prev) => {
      const compliedIds = JSON.parse(prev.compliedProducts)
      const nonCompliedIds = JSON.parse(prev.nonCompliedProducts)

      if (complied) {
        const idx = nonCompliedIds.indexOf(productId)
        if (idx >= 0) nonCompliedIds.splice(idx, 1)
        if (!compliedIds.includes(productId)) compliedIds.push(productId)
      } else {
        const idx = compliedIds.indexOf(productId)
        if (idx >= 0) compliedIds.splice(idx, 1)
        if (!nonCompliedIds.includes(productId)) nonCompliedIds.push(productId)
      }

      return {
        ...prev,
        compliedProducts: JSON.stringify(compliedIds),
        nonCompliedProducts: JSON.stringify(nonCompliedIds),
      }
    })
  }

  const allNCsCleared = ncsCheckData?.allNCsCleared ?? false

  if (!allNCsCleared) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ margin: "0 auto 16px", color: "#f59e0b" }} />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
          All NCs Must Be Cleared First
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: F }}>
          Complete all non-conformity reviews and approvals before writing audit summary
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Status indicator */}
      <div style={{ marginBottom: 20, padding: "16px", background: summaryData.status === "SUBMITTED" ? "#dcfce7" : "#f0f9ff", border: `1px solid ${summaryData.status === "SUBMITTED" ? "#bbf7d0" : "#bfdbfe"}`, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {summaryData.status === "SUBMITTED" ? (
            <>
              <CheckCircle size={18} color="#16a34a" />
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#166534", fontFamily: F }}>
                Summary Submitted on {summaryData.submittedAt ? new Date(summaryData.submittedAt).toLocaleDateString() : ""}
              </p>
            </>
          ) : (
            <>
              <FileText size={18} color="#1d4ed8" />
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#1e40af", fontFamily: F }}>
                Draft - Both summaries must be completed before submission
              </p>
            </>
          )}
        </div>
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e2e8f0", marginBottom: 20 }}>
        {[
          { value: "auditor" as const, label: "Main Auditor Summary" },
          { value: "sharia" as const, label: "Sharia Expert Summary" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCurrentRole(tab.value)}
            disabled={summaryData.status === "SUBMITTED"}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "transparent",
              cursor: summaryData.status === "SUBMITTED" ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: currentRole === tab.value ? 600 : 500,
              color: currentRole === tab.value ? "#1d4ed8" : "#64748b",
              borderBottom: currentRole === tab.value ? "2px solid #1d4ed8" : "2px solid transparent",
              marginBottom: "-2px",
              fontFamily: F,
              opacity: summaryData.status === "SUBMITTED" ? 0.6 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary content */}
      {!summaryData.status || summaryData.status === "DRAFT" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Auditor Summary */}
          {currentRole === "auditor" && (
            <div style={{ padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                Audit Findings Summary
              </p>
              <textarea
                value={summaryData.mainAuditorSummary}
                onChange={(e) => setSummaryData({ ...summaryData, mainAuditorSummary: e.target.value })}
                placeholder="Summarize key findings from the audit, overall factory state, critical issues resolved, and readiness for certification..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  fontFamily: F,
                  minHeight: "150px",
                  boxSizing: "border-box",
                  marginBottom: 20,
                }}
              />

              {/* Product compliance marking */}
              <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                Mark Product Compliance Status
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {products.map((product) => {
                  const compliedIds = JSON.parse(summaryData.compliedProducts)
                  const nonCompliedIds = JSON.parse(summaryData.nonCompliedProducts)
                  const isComplied = compliedIds.includes(product.id)
                  const isNonComplied = nonCompliedIds.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      style={{
                        padding: "12px",
                        background: isComplied ? "#f0fdf4" : isNonComplied ? "#fef2f2" : "#f8fafc",
                        border: `1px solid ${isComplied ? "#bbf7d0" : isNonComplied ? "#fecaca" : "#e2e8f0"}`,
                        borderRadius: 6,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
                          {product.name}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b", fontFamily: F }}>
                          SKU: {product.sku}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleToggleProduct(product.id, true)}
                          style={{
                            padding: "8px 16px",
                            background: isComplied ? "#16a34a" : "#e5e7eb",
                            color: isComplied ? "#fff" : "#374151",
                            border: "none",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: F,
                          }}
                        >
                          ✓ Complied
                        </button>
                        <button
                          onClick={() => handleToggleProduct(product.id, false)}
                          style={{
                            padding: "8px 16px",
                            background: isNonComplied ? "#dc2626" : "#e5e7eb",
                            color: isNonComplied ? "#fff" : "#374151",
                            border: "none",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: F,
                          }}
                        >
                          ✗ Non-Complied
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sharia Summary */}
          {currentRole === "sharia" && (
            <div style={{ padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
                Sharia/Halal Compliance Summary
              </p>
              <textarea
                value={summaryData.shariaSummary}
                onChange={(e) => setSummaryData({ ...summaryData, shariaSummary: e.target.value })}
                placeholder="Document halal compliance review, sensitive ingredients (gelatin, alcohol, enzymes), animal-derived materials, contamination risks, slaughter/meat process issues (if applicable), and halal assurance system adequacy..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  fontFamily: F,
                  minHeight: "150px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Submit button */}
      {summaryData.status === "DRAFT" && (
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            onClick={() => saveDraftMutation.mutate()}
            disabled={saveDraftMutation.isPending || !summaryData.mainAuditorSummary || !summaryData.shariaSummary}
            style={{
              padding: "12px 24px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: saveDraftMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: F,
              opacity: saveDraftMutation.isPending ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !summaryData.mainAuditorSummary || !summaryData.shariaSummary}
            style={{
              padding: "12px 24px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: submitMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: F,
              opacity: submitMutation.isPending ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Send size={16} />
            {submitMutation.isPending ? "Submitting..." : "Submit Summary"}
          </button>
        </div>
      )}
    </div>
  )
}
