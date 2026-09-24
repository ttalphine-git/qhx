import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Send, CheckCircle2, AlertCircle, Eye, Clock, FileText } from "lucide-react"
import toast from "react-hot-toast"

const F = "'Inter', system-ui, sans-serif"
const API_BASE = "/api"

interface Certificate {
  id: number
  auditId: number
  certificateNumber: string
  generatedAt: string
  validFrom: string
  validTo: string
  status: "GENERATED" | "APPROVED" | "SENT"
  qrCodeData?: string
  approvedBy?: string
  approvedAt?: string
  sentToCustomerAt?: string
}

interface CertificateManagementTabProps {
  applicationId?: number
  auditId?: number
  userRole: "admin" | "customer" | "auditor"
  decisionApproved: boolean
}

export const CertificateManagementTab: React.FC<CertificateManagementTabProps> = ({
  applicationId,
  auditId,
  userRole,
  decisionApproved = false,
}) => {
  const queryClient = useQueryClient()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Generate certificate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!auditId || !applicationId) throw new Error("Missing audit or application ID")
      const res = await fetch(`${API_BASE}/certificates/generate/${auditId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ applicationId }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      toast.success("Certificate generated!")
      queryClient.invalidateQueries({ queryKey: ["audit-certificates", auditId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate")
    },
  })

  // Approve certificate mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!certificate?.id) throw new Error("Certificate ID required")
      if (!approvalNotes) throw new Error("Please provide approval notes")

      const res = await fetch(`${API_BASE}/certificates/${certificate.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approvalNotes }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      setCertificate((prev) => prev ? { ...prev, status: "APPROVED" } : null)
      setApprovalNotes("")
      toast.success("Certificate approved!")
      queryClient.invalidateQueries({ queryKey: ["audit-certificates", auditId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve")
    },
  })

  // Send certificate mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!certificate?.id) throw new Error("Certificate ID required")
      const res = await fetch(`${API_BASE}/certificates/${certificate.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customerEmail: "customer@example.com", applicationId }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      return res.json()
    },
    onSuccess: () => {
      setCertificate((prev) => prev ? { ...prev, status: "SENT", sentToCustomerAt: new Date().toISOString() } : null)
      toast.success("Certificate sent to customer!")
      queryClient.invalidateQueries({ queryKey: ["audit-certificates", auditId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send")
    },
  })

  const statusConfig = {
    GENERATED: { bg: "#f0f9ff", border: "#bfdbfe", text: "#0c4a6e", icon: Clock, label: "Generated - Awaiting Review" },
    APPROVED: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", icon: AlertCircle, label: "Approved - Ready to Send" },
    SENT: { bg: "#dcfce7", border: "#bbf7d0", text: "#166534", icon: CheckCircle2, label: "Sent to Customer" },
  }

  const config = certificate ? statusConfig[certificate.status] : statusConfig.GENERATED
  const Icon = config.icon

  if (!decisionApproved && userRole === "admin") {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ margin: "0 auto 16px", color: "#f59e0b" }} />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
          All Decisions Must Be Completed First
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: F }}>
          Decision makers must complete their reviews before certificate generation
        </p>
      </div>
    )
  }

  // Show prompt to generate certificate if not yet generated
  if (!certificate && userRole === "admin" && decisionApproved) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <CheckCircle2 size={40} style={{ margin: "0 auto 16px", color: "#16a34a" }} />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
          Ready to Generate Certificate
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#64748b", fontFamily: F, marginBottom: 20 }}>
          All decisions are approved. Generate the halal certificate now.
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          style={{
            padding: "12px 24px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: generateMutation.isPending ? "not-allowed" : "pointer",
            fontFamily: F,
            opacity: generateMutation.isPending ? 0.6 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileText size={16} />
          {generateMutation.isPending ? "Generating..." : "Generate Certificate"}
        </button>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <AlertCircle size={40} style={{ margin: "0 auto 16px", color: "#f59e0b" }} />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#0f172a", fontFamily: F }}>
          Certificate Not Generated Yet
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Status indicator */}
      <div
        style={{
          marginBottom: 20,
          padding: "16px",
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Icon size={20} color={config.text} />
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: config.text, fontFamily: F }}>
            {config.label}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: config.text, fontFamily: F }}>
            Certificate: {certificate.certificateNumber}
          </p>
        </div>
      </div>

      {/* Certificate preview */}
      <div
        style={{
          marginBottom: 20,
          padding: "20px",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
            📄 Certificate Details
          </p>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: "8px 16px",
              background: "#f3f4f6",
              color: "#0f172a",
              border: "none",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Eye size={14} />
            {showPreview ? "Hide" : "Preview"} Template
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", fontFamily: F }}>
              Certificate Number
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
              {certificate.certificateNumber}
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", fontFamily: F }}>
              Generated Date
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
              {new Date(certificate.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", fontFamily: F }}>
              Valid From
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
              {new Date(certificate.validFrom).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", fontFamily: F }}>
              Valid To
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
              {new Date(certificate.validTo).toLocaleDateString()}
            </p>
          </div>
        </div>

        {certificate.qrCodeData && (
          <div style={{ marginBottom: 20, padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", fontFamily: F }}>
              🔍 QR Code for Verification
            </p>
            <img src={certificate.qrCodeData} alt="Certificate QR Code" style={{ width: "150px", height: "150px", border: "1px solid #d1d5db", borderRadius: 4 }} />
            <p style={{ margin: "12px 0 0", fontSize: "0.7rem", color: "#94a3b8", fontFamily: F }}>
              Scan to verify certificate authenticity
            </p>
          </div>
        )}

        {showPreview && (
          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              marginBottom: 16,
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <FileText size={40} style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: "0.8rem", fontFamily: F }}>
                Certificate Template Preview
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "0.7rem", color: "#94a3b8", fontFamily: F }}>
                [Rendered certificate design from settings template]
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Admin approval section */}
      {userRole === "admin" && certificate.status === "GENERATED" && (
        <div style={{ marginBottom: 20, padding: "20px", background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0c4a6e", fontFamily: F }}>
            Final Review & Approval
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", fontFamily: F, display: "block", marginBottom: 6 }}>
              Approval Notes
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Verify certificate details, compliance with standards, and confirm ready to send..."
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontFamily: F,
                minHeight: "100px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || !approvalNotes}
            style={{
              padding: "12px 24px",
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: approveMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: F,
              opacity: approveMutation.isPending ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            {approveMutation.isPending ? "Approving..." : "Approve Certificate"}
          </button>
        </div>
      )}

      {/* Send to customer section */}
      {userRole === "admin" && certificate.status === "APPROVED" && (
        <div style={{ marginBottom: 20, padding: "20px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#92400e", fontFamily: F }}>
            Ready to Send to Customer
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "0.75rem", color: "#78350f", fontFamily: F }}>
            Certificate is approved and ready to be sent to the customer. They will receive it via email with instructions for halal mark usage.
          </p>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            style={{
              padding: "12px 24px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: sendMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: F,
              opacity: sendMutation.isPending ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Send size={16} />
            {sendMutation.isPending ? "Sending..." : "Send to Customer"}
          </button>
        </div>
      )}

      {/* Customer view - certificate received */}
      {userRole === "customer" && certificate.status === "SENT" && (
        <div style={{ marginBottom: 20, padding: "20px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#166534", fontFamily: F }}>
                Certificate Approved & Sent
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#15803d", fontFamily: F }}>
                Sent on {certificate.sentToCustomerAt ? new Date(certificate.sentToCustomerAt).toLocaleDateString() : ""}
              </p>
            </div>
          </div>
          <button
            style={{
              padding: "10px 16px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={16} />
            Download Certificate
          </button>
        </div>
      )}

      {/* Download & Print options */}
      {certificate.status !== "GENERATED" && (
        <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", fontFamily: F }}>
            Certificate Actions
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                padding: "10px 16px",
                background: "#fff",
                color: "#1d4ed8",
                border: "1px solid #1d4ed8",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              style={{
                padding: "10px 16px",
                background: "#fff",
                color: "#1d4ed8",
                border: "1px solid #1d4ed8",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              🖨 Print
            </button>
            <button
              style={{
                padding: "10px 16px",
                background: "#fff",
                color: "#1d4ed8",
                border: "1px solid #1d4ed8",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Send size={14} />
              Resend Email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
