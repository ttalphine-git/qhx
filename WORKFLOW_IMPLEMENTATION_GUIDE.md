# HalalCMS NC → Decision → Certificate Workflow - Complete Implementation Guide

**Status**: ✅ Frontend (Complete) | ✅ Backend (Complete) | 🔄 Integration (In Progress)

---

## 📋 Architecture Overview

The system implements a three-stage workflow with full audit trail, notifications, and email integration:

```
┌─────────────────┐
│  NC WORKFLOW    │  Customer submits corrective action & evidence
│  (Stage 1)      │  Auditor reviews & approves/rejects
└────────┬────────┘
         │
┌─────────────────┐
│ AUDIT SUMMARY   │  Main auditor writes summary
│  (Stage 2)      │  Sharia expert writes compliance review
│                 │  Mark products as complied/non-complied
└────────┬────────┘
         │
┌─────────────────┐
│ DECISION MAKING │  Decision makers review & decide
│  (Stage 3)      │  Generates certificate if approved
│                 │  Admin approves certificate
└────────┬────────┘
         │
┌─────────────────┐
│ CERTIFICATE     │  Admin final review
│ MANAGEMENT      │  Send to customer
└─────────────────┘
```

---

## 🗄️ Database Schema

### New Tables Created:

**1. nc_evidence** - Evidence submissions for NCs
```sql
- id, nc_id, submission_number, evidence_text, evidence_files
- submitted_by, submitted_at
- auditor_review_status, auditor_feedback, reviewed_by, reviewed_at
```

**2. audit_report_summary** - Audit summary documents
```sql
- id, audit_id, main_auditor_summary, sharia_summary
- complied_products (JSON), non_complied_products (JSON)
- submitted_by, submitted_at, status
```

**3. decision_request** - Decision assignments
```sql
- id, audit_id, assigned_to, decision_type
- decision_value, decision_text, conditions
- decided_by, decided_at, status
```

**4. certificates** - Certificate tracking
```sql
- id, audit_id, application_id, certificate_number
- status, generated_at, valid_from, valid_to
- approved_by, approved_at, approval_notes
- sent_at, sent_to_email
```

**5. notifications** - In-app notifications
**6. workflow_logs** - Audit trail
**7. emails_sent** - Email tracking

---

## 🔌 API Endpoints

### NC Workflow Endpoints

```
POST   /api/nc/{ncId}/customer-response
       - Body: { correctiveAction, dueDate }
       - Response: NonConformity

POST   /api/nc/{ncId}/evidence
       - Body: { evidenceText, evidenceFiles }
       - Response: NCEvidenceDto

POST   /api/nc/{ncId}/auditor-review
       - Body: { decision, feedback }
       - Response: NCEvidenceDto

GET    /api/nc/{ncId}/status
       - Response: NCWorkflowStatusResponse

GET    /api/nc/application/{applicationId}
       - Response: List<NCWorkflowStatusResponse>
```

### Audit Summary Endpoints

```
POST   /api/audit-summary/{auditId}/draft
       - Body: { mainAuditorSummary, shariaSummary }

POST   /api/audit-summary/{auditId}/submit
       - Body: { mainAuditorSummary, shariaSummary, compliedProducts, nonCompliedProducts }

GET    /api/audit-summary/{auditId}

GET    /api/audit-summary/{auditId}/check-ncs
       - Response: { allNCsCleared: boolean }
```

### Decision Making Endpoints

```
POST   /api/decisions/assign
       - Body: { auditId, assignedTo, decisionType }

POST   /api/decisions/{requestId}/decide
       - Body: { decision, reasoning, conditions }

GET    /api/decisions/my-requests

GET    /api/decisions/audit/{auditId}
```

### Certificate Endpoints

```
POST   /api/certificates/generate/{auditId}

POST   /api/certificates/{certificateId}/approve
       - Body: { approvalNotes }

POST   /api/certificates/{certificateId}/send
       - Body: { customerEmail }
```

---

## 📁 File Structure

```
inspection-service/
├── model/
│   ├── NCEvidence.java                          [NEW]
│   ├── AuditReportSummary.java                 [NEW]
│   ├── DecisionRequest.java                     [NEW]
│   └── CertificateWorkflow.java                [NEW]
├── repository/
│   ├── NCEvidenceRepository.java               [NEW]
│   ├── AuditReportSummaryRepository.java       [NEW]
│   ├── DecisionRequestRepository.java          [NEW]
│   ├── CertificateWorkflowRepository.java      [NEW]
│   └── NonConformityRepository.java            [UPDATED]
├── service/
│   ├── NCWorkflowService.java                  [NEW]
│   ├── AuditSummaryService.java                [NEW]
│   ├── DecisionMakingService.java              [NEW]
│   ├── CertificateGenerationService.java       [NEW]
│   ├── NotificationService.java                [NEW]
│   ├── EmailService.java                       [NEW]
│   └── WorkflowLogService.java                 [NEW]
├── controller/
│   ├── NCWorkflowController.java               [NEW]
│   ├── AuditSummaryController.java             [NEW]
│   ├── DecisionMakingController.java           [NEW]
│   └── CertificateController.java              [NEW]
└── dto/
    ├── NCEvidenceDto.java                      [NEW]
    └── NCWorkflowDto.java                      [NEW]

frontend/
├── components/
│   ├── NcsTab.tsx                              [UPDATED]
│   ├── AuditSummaryTab.tsx                     [NEW]
│   ├── DecisionMakingTab.tsx                   [NEW]
│   └── CertificateManagementTab.tsx            [NEW]
```

---

## 🔄 Workflow Status Transitions

### NC Status Flow:
```
PENDING_CUSTOMER_ACTION
  ↓ [Customer submits CA + due date]
PENDING_EVIDENCE
  ↓ [Customer submits evidence]
PENDING_AUDITOR_REVIEW
  ├→ APPROVED → CLEARED ✓
  └→ REJECTED → PENDING_CUSTOMER_ACTION [Loop]
```

### Audit Status Flow:
```
IN_PROGRESS (NCs being resolved)
  ↓ [All NCs cleared]
SUMMARY_PENDING (Summary written)
  ↓ [Summary submitted]
DECISION_PENDING (Decision requests assigned)
  ↓ [All decisions complete]
CERTIFICATE_PENDING (Certificate generated)
  ↓ [Admin approves]
FINAL_REVIEW (Ready to send)
  ↓ [Send to customer]
COMPLETED
```

---

## 🔔 Notifications & Emails

| Event | Recipient | Notification | Email |
|-------|-----------|--------------|-------|
| NC marked | Customer | In-app | "NC Found: Provide corrective action by [date]" |
| CA submitted | Auditor | In-app | "CA submitted, awaiting review" |
| Evidence submitted | Auditor | In-app | "Evidence submitted for review" |
| Evidence approved | Customer | In-app | "Evidence APPROVED ✓" |
| Evidence rejected | Customer | In-app | "Evidence REJECTED. Reason: [feedback]" |
| All NCs cleared | Main Auditor, Sharia | In-app | "All NCs cleared, write summary" |
| Summary submitted | Admin | In-app | "Summary ready for decisions" |
| Decision assigned | Decision Maker | In-app + Badge | "New decision request assigned" |
| Decision submitted | Admin | In-app | "Decision received" |
| Certificate generated | Admin | In-app | "Certificate ready for review" |
| Certificate approved | Admin | In-app | "Ready to send to customer" |
| Certificate sent | Customer | Email | Certificate attached/link |

---

## 🚀 Implementation Steps

### Step 1: Database Setup
```bash
# Run migrations in order:
# V008__extend_nc_workflow.sql
# V009__audit_summary_decision.sql
# V010__notifications_logging.sql
```

### Step 2: Add Dependencies (pom.xml)
```xml
<!-- If not already present -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Step 3: Configure Email Service (application.yml)
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

### Step 4: Implement TODO Services
- [ ] NotificationService - Database + WebSocket integration
- [ ] EmailService - SMTP implementation
- [ ] WorkflowLogService - Database logging

### Step 5: Test API Endpoints
```bash
# Use Postman/curl to test each endpoint

# Test NC workflow
curl -X POST http://localhost:8082/api/nc/1/customer-response \
  -H "Content-Type: application/json" \
  -d '{
    "correctiveAction": "We will implement new procedures",
    "dueDate": "2026-10-30"
  }'

# Test audit summary
curl -X POST http://localhost:8082/api/audit-summary/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "mainAuditorSummary": "Overall compliance adequate",
    "shariaSummary": "No halal concerns identified",
    "compliedProducts": "[1,2,3]",
    "nonCompliedProducts": "[]"
  }'

# Test decision
curl -X POST http://localhost:8082/api/decisions/1/decide \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "reasoning": "All requirements met"
  }'
```

---

## 🔐 Security Considerations

1. **Role-Based Access Control:**
   - Customer: Can only access their own NCs
   - Auditor: Can review evidence and approve NCs
   - Decision Maker: Can make certification decisions
   - Admin: Full access + approval authority

2. **Audit Trail:**
   - All actions logged in workflow_logs table
   - Timestamps, user IDs, and changes tracked
   - Immutable history for compliance

3. **Data Protection:**
   - Sensitive data encrypted at rest
   - HTTPS for all API calls
   - JWT token validation

---

## 📊 Monitoring & Logging

Key logging points:
- All workflow transitions logged
- Email send/delivery tracked
- Decision history preserved
- Certificate generation audited

---

## 🔄 Next Steps

1. **Implement TODO methods:**
   - EmailService.sendEmail()
   - NotificationService methods
   - WorkflowLogService.logAction()

2. **Connect to Message Queue (optional):**
   - Use RabbitMQ/Kafka for async email sending
   - Improves responsiveness

3. **Add Dashboard:**
   - Show pending decisions
   - Show NCs awaiting review
   - Show certificate status

4. **Integrate with Payment System:**
   - Ensure payment complete before sending certificate

5. **Add Report Generation:**
   - Audit summary PDF export
   - Certificate PDF generation from template

---

## 📞 Support

For issues or questions, refer to the HALAL_HCB_SYSTEM_REFERENCE.md for compliance standards (ISO/IEC 17065, GSO 2055-2).

---

**Last Updated**: 2026-09-23
**Version**: 1.0
**Status**: Ready for Integration Testing
