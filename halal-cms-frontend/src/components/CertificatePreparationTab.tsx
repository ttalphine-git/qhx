import React, { useState, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Send, FileText, Download, Loader, AlertCircle, Eye, History, Mail, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "@/api/client"
import { updateApplicationStatus } from "@/api/applications"

declare const html2pdf: any

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

interface CertificateRecord {
  id: number
  certificateNumber: string
  issueDate: string
  expiryDate: string
  sentAt?: string
  sentTo?: string
  status: "draft" | "sent" | "delivered"
}

export const CertificatePreparationTab: React.FC<CertificatePreparationTabProps> = ({
  applicationId,
  applicationData = {},
}) => {
  const queryClient = useQueryClient()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [certificateNumber] = useState(
    `HCB-${new Date().getFullYear()}-${applicationId.toString().padStart(5, "0")}`
  )
  const [issueDateStr] = useState(new Date().toISOString().split("T")[0])
  const [expiryDateStr] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split("T")[0]
  )

  // Fetch certificate history
  const { data: certificateHistory = [] } = useQuery({
    queryKey: ["certificates", applicationId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<CertificateRecord[]>(`/applications/${applicationId}/certificates`)
        return response.data
      } catch {
        return []
      }
    },
  })

  const downloadPDF = async () => {
    if (!certificateRef.current) return

    try {
      const element = certificateRef.current
      const opt = {
        margin: 0,
        filename: `certificate-${certificateNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }

      html2pdf().set(opt).from(element).save()
      toast.success("Certificate PDF downloaded!")
    } catch (err) {
      console.error("Error generating PDF:", err)
      toast.error("Failed to generate PDF")
    }
  }

  const sendCertificateMutation = useMutation({
    mutationFn: async () => {
      // Save certificate data
      const response = await apiClient.post(`/applications/${applicationId}/certificate`, {
        certificateNumber,
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
      })

      // Send email to customer
      await apiClient.post(`/applications/${applicationId}/send-certificate`, {
        certificateNumber,
        companyName: applicationData.companyName,
      })

      // Update application status to CERTIFIED
      await updateApplicationStatus(applicationId, "CERTIFIED" as any)
    },
    onSuccess: () => {
      toast.success("Certificate sent to customer successfully!")
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["certificates", applicationId] })
    },
    onError: (err) => {
      console.error("Error sending certificate:", err)
      toast.error(err instanceof Error ? err.message : "Failed to send certificate")
    },
  })

  const isSubmitting = sendCertificateMutation.isPending
  const lastCertificate = certificateHistory[0]

  return (
    <div style={{ padding: "24px", fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Certificate Issuance
        </h3>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
          Review, download, and send the halal certificate to the customer.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "2px solid #e2e8f0" }}>
        <button
          onClick={() => setShowPreview(true)}
          style={{
            padding: "12px 16px",
            background: showPreview ? "#0f2170" : "transparent",
            color: showPreview ? "#fff" : "#64748b",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontFamily: F,
            fontWeight: 600,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Eye size={16} />
          Preview
        </button>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            padding: "12px 16px",
            background: showHistory ? "#0f2170" : "transparent",
            color: showHistory ? "#fff" : "#64748b",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontFamily: F,
            fontWeight: 600,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <History size={16} />
          History
        </button>
      </div>

      {/* Preview Tab */}
      {showPreview && (
        <div>
          {/* Certificate Details */}
          <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Certificate #
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
                  month: "short",
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
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Certificate Preview */}
          <div
            ref={certificateRef}
            style={{
              marginBottom: 24,
              padding: "40px",
              background: "#fff",
              border: "3px solid #b8860b",
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              textAlign: "center",
              fontFamily: "Georgia, serif",
            }}
          >
            {/* Decorative border */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
                bottom: 20,
                border: "2px solid #b8860b",
                borderRadius: 8,
                pointerEvents: "none",
              }}
            />

            {/* Certificate Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: 30 }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f2170", marginBottom: 10 }}>
                  ✓
                </div>
                <h1 style={{ margin: "0 0 20px", fontSize: "2.2rem", fontWeight: 700, color: "#0f2170" }}>
                  HALAL CERTIFICATE
                </h1>
                <p style={{ margin: "0 0 30px", fontSize: "1rem", color: "#64748b" }}>
                  Certificate of Halal Compliance
                </p>
              </div>

              {/* Main Content */}
              <div style={{ marginBottom: 30, fontSize: "0.95rem", color: "#1e293b", lineHeight: 1.8 }}>
                <p style={{ margin: "0 0 20px" }}>
                  This is to certify that the products and services of
                </p>
                <p style={{ margin: "0 0 20px", fontSize: "1.3rem", fontWeight: 700, color: "#0f2170" }}>
                  {applicationData.companyName || "COMPANY NAME"}
                </p>
                <p style={{ margin: "0 0 20px" }}>
                  have been examined and found to be in compliance with Halal requirements
                </p>

                {/* Products */}
                {applicationData.products && applicationData.products.length > 0 && (
                  <div style={{ margin: "30px 0" }}>
                    <p style={{ fontWeight: 700, marginBottom: 15 }}>CERTIFIED PRODUCTS:</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
                      {applicationData.products.slice(0, 6).map((p: any, i: number) => (
                        <p key={i} style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                          • {p.name || `Product ${i + 1}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Certificate Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 30, marginTop: 40 }}>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 15 }}>
                  <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "#64748b" }}>CERTIFICATE NUMBER</p>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f2170", fontFamily: "monospace" }}>
                    {certificateNumber}
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 15 }}>
                  <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "#64748b" }}>ISSUE DATE</p>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f2170" }}>
                    {new Date(issueDateStr).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 15 }}>
                  <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "#64748b" }}>EXPIRY DATE</p>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f2170" }}>
                    {new Date(expiryDateStr).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <p style={{ margin: "30px 0 0", fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                Valid for 3 years from the date of issue. This certificate is issued subject to periodic inspection and compliance verification.
              </p>
            </div>
          </div>

          {/* Info Message */}
          <div style={{ marginBottom: 24, padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertCircle size={16} color="#0c4a6e" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 600, color: "#0c4a6e" }}>
                Ready to issue certificate
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#0c4a6e" }}>
                Download as PDF or send directly to the customer. This will finalize the certification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={downloadPDF}
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
                  <Mail size={16} />
                  Send to Customer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {showHistory && (
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
            Certificate History
          </h4>
          {certificateHistory.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 8, color: "#94a3b8" }}>
              <FileText size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "0.85rem" }}>No certificates issued yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {certificateHistory.map((cert, idx) => (
                <div key={idx} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                        {cert.certificateNumber}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#64748b" }}>
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {cert.status === "sent" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, color: "#0c4a6e", fontSize: "0.75rem", fontWeight: 600 }}>
                          <Mail size={12} />
                          Sent to {cert.sentTo}
                        </div>
                      )}
                      {cert.status === "delivered" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, color: "#166534", fontSize: "0.75rem", fontWeight: 600 }}>
                          <CheckCircle2 size={12} />
                          Delivered
                        </div>
                      )}
                    </div>
                  </div>
                  {cert.sentAt && (
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>
                      Sent on {new Date(cert.sentAt).toLocaleDateString()} at {new Date(cert.sentAt).toLocaleTimeString()}
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
}
