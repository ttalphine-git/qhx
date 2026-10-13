import React, { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, AlertCircle, Save, Loader } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "@/api/client"
import { updateApplicationStatus } from "@/api/applications"

const F = "'Inter', system-ui, sans-serif"

interface Product {
  id?: string | number
  name: string
  productName?: string
  category: string
  productCategory?: string
  sku?: string
  brand?: string
  [key: string]: any
}

interface ProductComplianceTab {
  applicationId: number
  products: Product[]
  onStatusChange?: () => void
}

export const ProductComplianceTab: React.FC<ProductComplianceTab> = ({
  applicationId,
  products,
  onStatusChange,
}) => {
  const queryClient = useQueryClient()
  const [compliance, setCompliance] = useState<Record<string, "compliant" | "non-compliant">>({})
  const [auditSummary, setAuditSummary] = useState("")

  useEffect(() => {
    // Initialize compliance status from existing data if available
    const initialCompliance: Record<string, "compliant" | "non-compliant"> = {}
    products.forEach((p, idx) => {
      const key = String(p.id || idx)
      initialCompliance[key] = "compliant"
    })
    setCompliance(initialCompliance)
  }, [products])

  // Submit product compliance review
  const submitComplianceMutation = useMutation({
    mutationFn: async () => {
      const complianceData = products.map((p, idx) => ({
        productId: p.id || idx,
        productName: p.name || p.productName,
        complianceStatus: compliance[String(p.id || idx)],
      }))

      // Save compliance review
      await apiClient.post(`/applications/${applicationId}/product-compliance`, {
        auditSummary,
        products: complianceData,
      })

      // Update application status to DECISION_MAKING
      await updateApplicationStatus(applicationId, "DECISION_MAKING" as any)
    },
    onSuccess: () => {
      toast.success("Product compliance review submitted! Status updated to Decision Making")
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      if (onStatusChange) onStatusChange()
    },
    onError: (err) => {
      console.error("Error submitting compliance review:", err)
      toast.error(err instanceof Error ? err.message : "Failed to submit compliance review")
    },
  })

  if (products.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontFamily: F }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#64748b" }}>No products to review</div>
      </div>
    )
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 16px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
          Product Compliance Review
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", fontFamily: F }}>
          Review each product and mark as compliant or non-compliant. Submit to proceed to Decision Making.
        </p>
      </div>

      {/* Audit Summary Box */}
      <div style={{ marginBottom: 20, padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", marginBottom: 8, fontFamily: F }}>
          Audit Summary
        </label>
        <textarea
          value={auditSummary}
          onChange={(e) => setAuditSummary(e.target.value)}
          placeholder="Write a comprehensive summary of the audit findings, including key observations, areas of concern, and recommendations..."
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: "0.8rem",
            minHeight: "120px",
            fontFamily: F,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {products.map((product, idx) => {
          const key = String(product.id || idx)
          const productName = product.name || product.productName || `Product ${idx + 1}`
          const category = product.category || product.productCategory || "Unknown"
          const currentStatus = compliance[key] || "compliant"

          return (
            <div
              key={key}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#fff",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 200px",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "0.8rem", fontWeight: 700, color: "#475569", fontFamily: F }}>
                  {productName}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>
                  Category: {category}
                </p>
                {product.sku && (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontFamily: F }}>
                    SKU: {product.sku}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setCompliance({ ...compliance, [key]: "compliant" })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: currentStatus === "compliant" ? "2px solid #16a34a" : "1px solid #d1d5db",
                    background: currentStatus === "compliant" ? "#f0fdf4" : "#fff",
                    color: currentStatus === "compliant" ? "#166534" : "#64748b",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontFamily: F,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Compliant
                </button>
                <button
                  onClick={() => setCompliance({ ...compliance, [key]: "non-compliant" })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: currentStatus === "non-compliant" ? "2px solid #dc2626" : "1px solid #d1d5db",
                    background: currentStatus === "non-compliant" ? "#fef2f2" : "#fff",
                    color: currentStatus === "non-compliant" ? "#991b1b" : "#64748b",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontFamily: F,
                  }}
                >
                  <AlertCircle size={14} />
                  Non-Compliant
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => submitComplianceMutation.mutate()}
        disabled={submitComplianceMutation.isPending}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "#0f2170",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: submitComplianceMutation.isPending ? "not-allowed" : "pointer",
          fontFamily: F,
          opacity: submitComplianceMutation.isPending ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
        }}
      >
        {submitComplianceMutation.isPending ? (
          <>
            <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
            Submitting...
          </>
        ) : (
          <>
            <Save size={16} />
            Submit Product Compliance Review
          </>
        )}
      </button>
    </div>
  )
}
