// Diagnostic script to check application statuses
export default async function run(page, ui) {
  // Get the page content to see what application statuses exist
  const snapshot = await ui.snapshot({ full: true })

  // Log the entire page structure
  console.log(snapshot)

  // Try to find any mention of audit statuses
  const auditStatuses = ["AUDIT_SCHEDULED", "AUDIT_IN_PROGRESS", "AUDIT_COMPLETED", "CERTIFICATION_REVIEW", "CERTIFIED"]
  const hasAuditStatus = auditStatuses.some(status => snapshot.includes(status))

  return {
    pageContent: snapshot.substring(0, 500),
    hasAuditStatusOnPage: hasAuditStatus,
    message: "Audit questions require app status to be one of: AUDIT_SCHEDULED, AUDIT_IN_PROGRESS, AUDIT_COMPLETED, CERTIFICATION_REVIEW, or CERTIFIED"
  }
}
