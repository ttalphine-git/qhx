import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, FileText, Download, Loader, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "@/api/client"
import { updateApplicationStatus } from "@/api/applications"

const F = "'Inter', system-ui, sans-serif"

interface CertificatePreparationTabProps {
  applicationId: number
  applicationData?: {
    companyName?: string
    applicationNumber?: string
    products?: any[]
    country?: string
  }
}

export const CertificatePreparationTab: React.FC<CertificatePreparationTabProps> = ({
  applicationId,
  applicationData = {},
}) => {
  const queryClient = useQueryClient()
  const [certificateNumber] = useState(
    `HCB-${new Date().getFullYear()}-${applicationId.toString().padStart(5, "0")}`
  )
  const [issueDateStr] = useState(new Date().toISOString().split("T")[0])
  const [expiryDateStr] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0]
  )

  const sendCertificateMutation = useMutation({
    mutationFn: async () => {
      // Save certificate data
      await apiClient.post(`/applications/${applicationId}/certificate`, {
        certificateNumber,
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
      })

      // Update application status to CERTIFIED
      await updateApplicationStatus(applicationId, "CERTIFIED" as any)
    },
    onSuccess: () => {
      toast.success("Certificate sent to customer successfully!")
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
    },
    onError: (err) => {
      console.error("Error sending certificate:", err)
      toast.error(err instanceof Error ? err.message : "Failed to send certificate")
    },
  })

  const isSubmitting = sendCertificateMutation.isPending

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Certificate Preparation
        </h3>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          Review and send the halal certificate to the customer. This will finalize the application.
        </p>
      </div>

      {/* Certificate Details */}
      <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Certificate Number
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
            {certificateNumber}
          </p>
        </div>

        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Issue Date
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
            {new Date(issueDateStr).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Expiry Date
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
            {new Date(expiryDateStr).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Company
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
            {applicationData.companyName || "Unknown"}
          </p>
        </div>
      </div>

      {/* Certificate Preview */}
      <div style={{ marginBottom: 24, padding: "20px", background: "#fff", border: "2px solid #e2e8f0", borderRadius: 8 }}>
        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
          Certificate Preview
        </p>
        <div
          style={{
            width: "100%",
            maxWidth: "660px",
            margin: "0 auto",
            aspectRatio: "660/932",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
            color: "#9ca3af",
          }}
        >
          <FileText size={48} />
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
            Certificate Template Preview
          </p>
          <p style={{ margin: "0 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
            Based on configured template from Settings
          </p>
          <p style={{ margin: "12px 20px 0", fontSize: "0.8rem", color: "#9ca3af", textAlign: "center", lineHeight: 1.4 }}>
            To customize the template, visit:{" "}
            <a
              href="/office/certificate-designer"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}
            >
              Certificate Designer
            </a>
          </p>
        </div>
      </div>

      {/* Products List */}
      {applicationData.products && applicationData.products.length > 0 && (
        <div style={{ marginBottom: 24, padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
            Products Certified ({applicationData.products.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {applicationData.products.slice(0, 5).map((product: any, idx: number) => (
              <div key={idx} style={{ fontSize: "0.75rem", color: "#475569", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                <strong>{product.name || `Product ${idx + 1}`}</strong> - {product.category || "General"}
              </div>
            ))}
            {applicationData.products.length > 5 && (
              <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                + {applicationData.products.length - 5} more products
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info Message */}
      <div style={{ marginBottom: 24, padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <AlertCircle size={16} color="#0c4a6e" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 600, color: "#0c4a6e" }}>
            Certificate will be sent to customer
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#0c4a6e" }}>
            This action will finalize the certification and update the application status to CERTIFIED.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          style={{
            padding: "12px 20px",
            background: "#f3f4f6",
            color: "#475569",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: F,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Download size={16} />
          Download PDF
        </button>

        <button
          onClick={() => sendCertificateMutation.mutate()}
          disabled={isSubmitting}
          style={{
            padding: "12px 20px",
            background: "#0f2170",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontFamily: F,
            opacity: isSubmitting ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Certificate to Customer
            </>
          )}
        </button>
      </div>
    </div>
  )
}
