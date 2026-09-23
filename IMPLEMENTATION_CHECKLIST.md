# HalalCMS Workflow Implementation - Quick Start Checklist

## ✅ Completed Components

### Frontend (100% Complete)
- [x] NcsTab.tsx - NC workflow UI (customer response, evidence submission, history)
- [x] AuditSummaryTab.tsx - Audit summary form (auditor + sharia reviews)
- [x] DecisionMakingTab.tsx - Decision submission UI
- [x] CertificateManagementTab.tsx - Certificate review & send UI

### Backend - Models & Repositories (100% Complete)
- [x] NCEvidence model & repository
- [x] AuditReportSummary model & repository
- [x] DecisionRequest model & repository
- [x] CertificateWorkflow model & repository
- [x] Updated NonConformityRepository with count methods

### Backend - Services (90% Complete - TODO methods present)
- [x] NCWorkflowService - Complete NC lifecycle
- [x] AuditSummaryService - Summary management
- [x] DecisionMakingService - Decision assignment & submission
- [x] CertificateGenerationService - Certificate workflow
- [ ] NotificationService - **TODO: Database + WebSocket**
- [ ] EmailService - **TODO: SMTP integration**
- [ ] WorkflowLogService - **TODO: Database logging**

### Backend - Controllers (100% Complete)
- [x] NCWorkflowController - 5 endpoints
- [x] AuditSummaryController - 4 endpoints
- [x] DecisionMakingController - 5 endpoints
- [x] CertificateController - 3 endpoints

### Database Migrations (100% Complete)
- [x] V008__extend_nc_workflow.sql
- [x] V009__audit_summary_decision.sql
- [x] V010__notifications_logging.sql

---

## 🔧 Integration Steps

### Phase 1: Database Setup (Today)
```bash
cd d:\QHXSASS\halal-cms-backend\inspection-service
# Run Liquibase or Flyway migrations
# Or manually run SQL files against PostgreSQL

psql -U halalcms -d halalcms_auth < database/migrations/V008__extend_nc_workflow.sql
psql -U halalcms -d halalcms_auth < database/migrations/V009__audit_summary_decision.sql
psql -U halalcms -d halalcms_auth < database/migrations/V010__notifications_logging.sql
```

### Phase 2: Implement TODO Services (1-2 hours)

#### Step 1: NotificationService
```java
// File: NotificationService.java
// TODO: Implement database storage
// TODO: Add WebSocket for real-time updates
// TODO: Add push notifications
```

**Sample Implementation:**
```java
@Transactional
public void notifyAuditor(Long auditorId, String eventType, String title, String actionUrl) {
    Notification notification = Notification.builder()
        .userId(auditorId)
        .eventType(eventType)
        .title(title)
        .actionUrl(actionUrl)
        .createdAt(LocalDateTime.now())
        .build();
    notificationRepository.save(notification);
    
    // Send via WebSocket (if connected)
    messagingTemplate.convertAndSendToUser(
        auditorId.toString(),
        "/queue/notifications",
        notification
    );
}
```

#### Step 2: EmailService
```java
// File: EmailService.java
// TODO: Implement SMTP sending
```

**Sample Implementation:**
```java
@Transactional
public void sendEmail(String recipientEmail, String subject, String emailType, Long entityId) {
    try {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipientEmail);
        message.setSubject(subject);
        message.setText(buildEmailBody(emailType, entityId));
        message.setFrom("noreply@halal-hcb.com");
        
        mailSender.send(message);
        
        // Log email sent
        emailsSentRepository.save(EmailSent.builder()
            .recipientEmail(recipientEmail)
            .emailType(emailType)
            .status("SENT")
            .sentAt(LocalDateTime.now())
            .build());
    } catch (Exception e) {
        log.error("Failed to send email", e);
    }
}
```

#### Step 3: WorkflowLogService
```java
// File: WorkflowLogService.java
// TODO: Implement database logging
```

**Sample Implementation:**
```java
@Transactional
public void logAction(Long applicationId, String entityType, Long entityId, 
                      String action, String description, Long performedBy) {
    WorkflowLog log = WorkflowLog.builder()
        .auditId(applicationId)
        .entityType(entityType)
        .entityId(entityId)
        .action(action)
        .description(description)
        .performedBy(performedBy)
        .createdAt(LocalDateTime.now())
        .build();
    workflowLogRepository.save(log);
}
```

### Phase 3: Maven Build & Test (1 hour)
```bash
cd d:\QHXSASS\halal-cms-backend\inspection-service

# Build
mvn clean install

# Run tests
mvn test

# Start service
mvn spring-boot:run
```

### Phase 4: API Testing (1 hour)
```bash
# Test NC workflow endpoint
curl -X POST http://localhost:8082/api/nc/1/customer-response \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "correctiveAction": "Implemented new training program",
    "dueDate": "2026-10-30"
  }'

# Expected Response:
# 200 OK
# {
#   "id": 1,
#   "applicationId": 1,
#   "status": "PENDING_EVIDENCE",
#   "customerCorrectiveAction": "Implemented new training program",
#   "customerDueDate": "2026-10-30",
#   ...
# }
```

### Phase 5: Frontend Integration (2 hours)
```bash
cd d:\QHXSASS\halal-cms-frontend

# Update proxy configuration in vite.config.ts
# Add backend service URL for inspection-service

# Install react-hot-toast if not present
npm install react-hot-toast

# Run dev server
npm run dev

# Open http://localhost:5173/office/applications
# Navigate to NC tab and test workflow
```

---

## 📋 Testing Checklist

### Unit Tests
- [ ] NCWorkflowService methods
- [ ] AuditSummaryService methods
- [ ] DecisionMakingService methods
- [ ] CertificateGenerationService methods

### Integration Tests
- [ ] NC workflow end-to-end (CA → Evidence → Review)
- [ ] Audit summary submission
- [ ] Decision assignment & submission
- [ ] Certificate generation & approval

### UI Tests
- [ ] NcsTab renders correctly
- [ ] Customer can submit CA & evidence
- [ ] Auditor review workflow
- [ ] Audit summary submission
- [ ] Decision making interface
- [ ] Certificate approval flow

### Data Tests
- [ ] All NCs cleared status works
- [ ] Summary submission clears draft
- [ ] Decision completion triggers certificate generation
- [ ] Certificate approval enables send

---

## 🔌 Configuration Files to Update

### application.yml (inspection-service)
```yaml
spring:
  mail:
    host: smtp.gmail.com          # or your SMTP provider
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      
  websocket:
    path: /ws
    allowed-origins: http://localhost:5173
```

### vite.config.ts (frontend)
```typescript
// Add inspection-service proxy
server: {
  proxy: {
    '/api/nc': 'http://localhost:8082',
    '/api/audit-summary': 'http://localhost:8082',
    '/api/decisions': 'http://localhost:8082',
    '/api/certificates': 'http://localhost:8082',
  }
}
```

---

## 📊 Estimated Effort

| Phase | Task | Effort | Status |
|-------|------|--------|--------|
| 1 | Database Setup | 15 min | ✅ Ready |
| 2 | Implement Services | 2 hours | 🔄 Code ready, needs implementation |
| 3 | Build & Test | 1 hour | ⏳ Pending |
| 4 | API Testing | 1 hour | ⏳ Pending |
| 5 | Frontend Integration | 2 hours | ⏳ Pending |
| **Total** | | **6.5 hours** | |

---

## 🚨 Common Issues & Fixes

### Issue 1: "Table doesn't exist" errors
**Fix:** Run migrations first
```bash
psql -U halalcms -d halalcms_auth < V008__extend_nc_workflow.sql
```

### Issue 2: Repository methods not found
**Fix:** Make sure to update NonConformityRepository with new count methods

### Issue 3: Email not sending
**Fix:** Check SMTP credentials and firewall rules

### Issue 4: WebSocket not connecting
**Fix:** Ensure WebSocket endpoint is properly configured

### Issue 5: CORS errors
**Fix:** Check Vite proxy configuration and backend CORS settings

---

## 📚 Files Created

**Frontend (4 files)**
- halal-cms-frontend/src/components/NcsTab.tsx (UPDATED)
- halal-cms-frontend/src/components/AuditSummaryTab.tsx (NEW)
- halal-cms-frontend/src/components/DecisionMakingTab.tsx (NEW)
- halal-cms-frontend/src/components/CertificateManagementTab.tsx (NEW)

**Backend Models (4 files)**
- inspection-service/model/NCEvidence.java
- inspection-service/model/AuditReportSummary.java
- inspection-service/model/DecisionRequest.java
- inspection-service/model/CertificateWorkflow.java

**Backend Repositories (4 files)**
- inspection-service/repository/NCEvidenceRepository.java
- inspection-service/repository/AuditReportSummaryRepository.java
- inspection-service/repository/DecisionRequestRepository.java
- inspection-service/repository/CertificateWorkflowRepository.java

**Backend Services (7 files)**
- inspection-service/service/NCWorkflowService.java
- inspection-service/service/AuditSummaryService.java
- inspection-service/service/DecisionMakingService.java
- inspection-service/service/CertificateGenerationService.java
- inspection-service/service/NotificationService.java
- inspection-service/service/EmailService.java
- inspection-service/service/WorkflowLogService.java

**Backend Controllers (4 files)**
- inspection-service/controller/NCWorkflowController.java
- inspection-service/controller/AuditSummaryController.java
- inspection-service/controller/DecisionMakingController.java
- inspection-service/controller/CertificateController.java

**Backend DTOs (2 files)**
- inspection-service/dto/NCEvidenceDto.java
- inspection-service/dto/NCWorkflowDto.java

**Database Migrations (3 files)**
- database/migrations/V008__extend_nc_workflow.sql
- database/migrations/V009__audit_summary_decision.sql
- database/migrations/V010__notifications_logging.sql

**Documentation (2 files)**
- WORKFLOW_IMPLEMENTATION_GUIDE.md
- IMPLEMENTATION_CHECKLIST.md

**Total: 30 files created/updated**

---

## ✨ What's Included

✅ **Complete NC Workflow**
- Customer submits corrective action
- Customer submits evidence with files
- Auditor reviews and approves/rejects
- Loop support for rejections
- Full history tracking

✅ **Audit Summary**
- Main auditor summary
- Sharia expert summary
- Product compliance marking
- Status tracking (Draft → Submitted)

✅ **Decision Making**
- Decision assignment to decision makers
- Multiple decision types (Decision Maker, Sharia Compliance)
- Decision submission with reasoning
- Conditional decisions with conditions
- Role-based visibility

✅ **Certificate Management**
- Auto-generate from template
- Admin approval workflow
- Send to customer
- Email delivery tracking

✅ **Cross-Cutting Features**
- Notifications (in-app)
- Email triggers
- Workflow logging/audit trail
- User role validation
- Status tracking at each stage

---

## 🎯 Ready to Deploy?

Once all steps are complete, the system will:
1. ✅ Accept NC corrective actions from customers
2. ✅ Allow auditor review & approval loops
3. ✅ Enable audit summaries with role separation
4. ✅ Support decision making by designated roles
5. ✅ Auto-generate & send halal certificates
6. ✅ Maintain complete audit trail for ISO/IEC 17065 compliance

---

**Version**: 1.0  
**Last Updated**: 2026-09-23  
**Created By**: Claude Code  
**Status**: 🟢 Ready for Integration
