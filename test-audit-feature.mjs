// Test script to verify audit questions feature in customer portal
export default async function run(page, ui) {
  // Get the full accessibility tree to see what's on the page
  const snapshot = await ui.snapshot({ full: true })

  // Check for key elements
  const hasAuditSection = snapshot.includes('Audit Questions')
  const hasCustomerComment = snapshot.includes('Your Comment')
  const hasAuditorComment = snapshot.includes('Auditor Comment')
  const hasSaveButton = snapshot.includes('Save Comments')

  return {
    hasAuditQuestionsSection: hasAuditSection,
    hasCustomerCommentField: hasCustomerComment,
    hasReadOnlyAuditorComment: hasAuditorComment,
    hasSaveButton: hasSaveButton,
    snapshot: snapshot
  }
}
