import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle, XCircle, AlertTriangle, Award, Shield } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getCertificate } from "@/api/certificates"

function QRPattern({ value }: { value: string }) {
  const seed = value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rows = 11, cells = 11
  return (
    <div style={{ display: "inline-block", padding: 8, background: "#fff", border: "2px solid #0f172a", borderRadius: 4 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex" }}>
          {Array.from({ length: cells }).map((_, c) => {
            const topL = (r < 3 && c < 3)
            const topR = (r < 3 && c >= cells - 3)
            const btmL = (r >= rows - 3 && c < 3)
            const corner = topL || topR || btmL
            const bit = corner ? 1 : (seed + r * 13 + c * 9 + r * c) % 3 === 0 ? 1 : 0
            return <div key={c} style={{ width: 7, height: 7, background: bit ? "#0f172a" : "#fff" }} />
          })}
        </div>
      ))}
    </div>
  )
}

export default function CertificateVerifyPage() {
  const { key } = useParams<{ key: string }>()
  const certQ = useQuery({
    queryKey: ["public-certificate", key],
    queryFn: () => getCertificate(key!),
    enabled: !!key,
    retry: false,
  })
  const cert = certQ.data

  const isExpired = cert ? new Date(cert.expiryDate) < new Date() : false
  const isActive  = cert && cert.status === "ACTIVE" && !isExpired

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7f0", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 600 }}>

        {/* HCB header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "#fff", borderRadius: 12, border: "1px solid #d1fae5", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Shield size={20} color="#107c10" />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Halal Certificate Verification</span>
          </div>
        </div>

        {certQ.isLoading ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", border: "2px solid #d1fae5", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <Award size={42} color="#107c10" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Checking Certificate</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Reading the official certificate registry...</p>
          </div>
        ) : !cert ? (
          /* Not found */
          <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", border: "2px solid #fde7e9", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <XCircle size={48} color="#d13438" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Certificate Not Found</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>The certificate key <strong style={{ fontFamily: "monospace" }}>{key}</strong> does not match any record in this certification body's registry.</p>
            <div style={{ padding: "10px 16px", background: "#fef9e7", border: "1px solid #f59e0b", borderRadius: 8, fontSize: 13, color: "#92400e", textAlign: "left" }}>
              If you received this certificate from a third party, please contact the issuing certification body directly to verify its authenticity.
            </div>
          </div>
        ) : cert.status === "WITHDRAWN" || cert.status === "SUSPENDED" ? (
          /* Revoked / suspended */
          <div style={{ background: "#fff", borderRadius: 14, padding: 32, border: `2px solid ${cert.status === "WITHDRAWN" ? "#b91c1c" : "#ffb900"}`, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AlertTriangle size={36} color={cert.status === "WITHDRAWN" ? "#b91c1c" : "#8a6000"} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: cert.status === "WITHDRAWN" ? "#b91c1c" : "#8a6000", marginBottom: 2 }}>
                  Certificate {cert.status === "WITHDRAWN" ? "Withdrawn" : "Suspended"}
                </h2>
                <p style={{ fontSize: 13, color: "#64748b" }}>This certificate is no longer valid.</p>
              </div>
            </div>
            <div style={{ padding: "10px 14px", background: "#fde7e9", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
              Certificate number <strong>{cert.certificateNumber}</strong> has been {cert.status.toLowerCase()} and should not be accepted as a valid halal certification.
            </div>
          </div>
        ) : (
          /* Valid certificate */
          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `2px solid ${isActive ? "#107c10" : "#d13438"}`, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            {/* Status banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", background: isActive ? "#107c10" : "#d13438", color: "#fff" }}>
              {isActive ? <CheckCircle size={22} /> : <XCircle size={22} />}
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{isActive ? "Certificate Verified — Active" : "Certificate Expired"}</p>
                <p style={{ fontSize: 12, opacity: 0.8 }}>{isActive ? "This halal certificate is valid and currently active." : "This certificate has expired and is no longer valid."}</p>
              </div>
            </div>

            <div style={{ padding: "24px 24px 20px" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Award size={18} color="#107c10" />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Certificate Number</p>
                      <p style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#107c10" }}>{cert.certificateNumber}</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {[
                      ["Certified Company", cert.companyName],
                      ["Halal Standard", cert.halalStandard],
                      ["Certified Scope", cert.products?.join(", ")],
                      ["Issuing Body", cert.issuedBy],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.4 }}>{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <QRPattern value={cert.key} />
                  <p style={{ fontSize: 9, color: "#94a3b8", marginTop: 6, maxWidth: 80 }}>Scan to verify authenticity</p>
                </div>
              </div>

              {/* Validity dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "14px 16px", background: isActive ? "#f0fff4" : "#fef2f2", borderRadius: 8, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Issue Date</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{formatDate(cert.issueDate)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Expiry Date</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#107c10" : "#d13438" }}>{formatDate(cert.expiryDate)}</p>
                </div>
              </div>

              {/* Signatory */}
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Authorized By</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{cert.issuedBy}</p>
                  <p style={{ fontSize: 11, color: "#64748b" }}>Authorized issuer</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: isActive ? "#e6f4e6" : "#fde7e9", color: isActive ? "#107c10" : "#d13438" }}>{isActive ? "ACTIVE" : "EXPIRED"}</span>
              </div>

              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 16, lineHeight: 1.6 }}>
                This certificate is issued by <strong>{cert.issuedBy}</strong> and remains property of the issuing body. Validity is subject to the certified factory maintaining continuous compliance with the applicable halal standard. Contact the issuing body to report any suspected misuse of this certificate.
              </p>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 20 }}>
          Verified at {new Date().toLocaleString()} · Certificate key: <span style={{ fontFamily: "monospace" }}>{key}</span>
        </p>
      </div>
    </div>
  )
}
