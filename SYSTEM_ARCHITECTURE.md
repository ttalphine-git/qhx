# 🏗️ HalalCMS System Architecture

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HALAL CMS SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐                ┌──────────────────────────┐
│   FRONTEND (Vite)   │                │  BACKEND (Spring Boot)   │
│    React/TypeScript │                │   Microservices          │
│                     │                │                          │
│ ┌─────────────────┐ │                │ ┌────────────────────┐   │
│ │  NcsTab         │ │                │ │ Inspection Service │   │
│ │  (NC Workflow)  │──────API────────│ │                    │   │
│ └─────────────────┘ │                │ │ • NCWorkflow       │   │
│                     │                │ │ • AuditSummary     │   │
│ ┌─────────────────┐ │                │ │ • DecisionMaking   │   │
│ │ AuditSummary    │ │                │ │ • Certificate      │   │
│ │ Tab             │──────API────────│ │                    │   │
│ └─────────────────┘ │                │ │ • Email Service    │   │
│                     │                │ │ • Notification     │   │
│ ┌─────────────────┐ │                │ │ • WorkflowLog      │   │
│ │ DecisionMaking  │ │                │ │                    │   │
│ │ Tab             │──────API────────│ └────────────────────┘   │
│ └─────────────────┘ │                │                          │
│                     │                │ Port: 8084               │
│ ┌─────────────────┐ │                └──────────────────────────┘
│ │ Certificate     │ │                         ↓
│ │ Management Tab  │──────API────────┐        ↓
│ └─────────────────┘ │                │        │
│                     │                │  ┌──────────────┐
│ Ports: 5173 (dev)   │                │  │ PostgreSQL   │
│ Ports: 80/443 (prod)│                │  │ Database     │
└─────────────────────┘                │  │              │
         ↓                             │  │ • 11 Tables  │
    nginx/vercel                       │  │ • Flyway V1-9│
                                       └→ └──────────────┘
```

## Request/Response Flow

```
1. CUSTOMER SUBMITS CORRECTIVE ACTION
   ┌──────────────┐
   │ Customer UI  │
   └──────┬───────┘
          │ POST /api/nc/{ncId}/customer-response
          │ { correctiveAction, dueDate }
          ↓
   ┌─────────────────┐
   │ NCWorkflow      │
   │ Controller      │
   └────────┬────────┘
            │ Validate input
            │ Call service
            ↓
   ┌──────────────────┐
   │ NCWorkflowService│
   │ (Business Logic) │
   └────────┬─────────┘
            │ Update NC status
            │ Log action
            │ Send notifications
            │ Send email
            ↓
   ┌──────────────────┐
   │ PostgreSQL       │
   │ Database         │
   │ Tables:          │
   │ • non_conformities
   │ • nc_evidence
   │ • workflow_logs
   │ • emails_sent
   │ • notifications
   └──────────────────┘

2. RESPONSE BACK TO CUSTOMER
   NCWorkflowService returns updated NC object
                    ↓
   NCWorkflowController returns JSON response
                    ↓
   Frontend receives response
                    ↓
   React Query updates cache
                    ↓
   Toast notification "Corrective action submitted!"
                    ↓
   UI re-renders with new status
```

## Data Flow Through System

```
┌──────────────────────────────────────────────────────────────┐
│ COMPLETE HALAL CERTIFICATION WORKFLOW                        │
└──────────────────────────────────────────────────────────────┘

Stage 1: NC (Non-Conformity)
┌─────────────────────────────────────────────────────────────┐
│ Customer                                                     │
│  ├─ View assigned NCs                                       │
│  ├─ Submit corrective action                                │
│  └─ Submit evidence (multiple iterations)                   │
│                                                              │
│ Auditor                                                      │
│  ├─ Review evidence                                         │
│  ├─ Approve/Reject                                          │
│  └─ Update NC status                                        │
│                                                              │
│ System                                                       │
│  ├─ Send notifications on each status change               │
│  ├─ Send emails to relevant parties                         │
│  └─ Log all actions for audit trail                         │
└─────────────────────────────────────────────────────────────┘

Stage 2: Audit Summary
┌─────────────────────────────────────────────────────────────┐
│ Auditor                                                      │
│  ├─ Write main audit findings                               │
│  ├─ Write sharia compliance summary                         │
│  ├─ Mark products as complied/non-complied                  │
│  └─ Submit final summary                                    │
│                                                              │
│ System                                                       │
│  ├─ Verify all NCs are cleared                              │
│  ├─ Allow draft saving                                      │
│  ├─ Lock after final submission                             │
│  └─ Notify admin of completion                              │
└─────────────────────────────────────────────────────────────┘

Stage 3: Decision Making
┌─────────────────────────────────────────────────────────────┐
│ Admin                                                        │
│  ├─ Assign decision requests to decision makers             │
│  └─ Assign to sharia experts                                │
│                                                              │
│ Decision Makers / Sharia Experts                            │
│  ├─ Review audit summary                                    │
│  ├─ Make decision (Approved/Rejected/Conditional)           │
│  ├─ Provide reasoning                                       │
│  └─ Specify conditions if conditional                       │
│                                                              │
│ System                                                       │
│  ├─ Check if all decisions complete                         │
│  ├─ If all approved → Auto-generate certificate             │
│  ├─ Notify stakeholders                                     │
│  └─ Log all decisions                                       │
└─────────────────────────────────────────────────────────────┘

Stage 4: Certificate
┌─────────────────────────────────────────────────────────────┐
│ System                                                       │
│  ├─ Generate certificate with unique number (HCB-YYYY-XXXXX)│
│  ├─ Store in database                                       │
│  └─ Notify admin of generation                              │
│                                                              │
│ Admin                                                        │
│  ├─ Review certificate                                      │
│  ├─ Add approval notes                                      │
│  ├─ Approve certificate                                     │
│  ├─ Specify customer email                                  │
│  └─ Send to customer                                        │
│                                                              │
│ Customer                                                     │
│  ├─ Receive certificate via email                           │
│  ├─ Download certificate                                    │
│  └─ Print and display halal mark                            │
│                                                              │
│ System                                                       │
│  ├─ Log all certificate actions                             │
│  ├─ Track delivery status                                   │
│  └─ Maintain audit trail                                    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│ non_conformities (Extended)                                  │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ application_id → applications.id                             │
│ auditor_id → users.id                                        │
│ clause                                                       │
│ description                                                  │
│ severity (CRITICAL/MAJOR/MINOR/OBSERVATION)                │
│ status (OPEN/PENDING_EVIDENCE/APPROVED/REJECTED)            │
│ customer_corrective_action (NEW)                             │
│ customer_due_date (NEW)                                      │
│ is_cleared (NEW)                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ nc_evidence (NEW)                                            │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ nc_id → non_conformities.id                                  │
│ submission_number                                            │
│ evidence_text                                                │
│ auditor_review_status (PENDING/APPROVED/REJECTED)           │
│ auditor_feedback                                             │
│ submitted_at                                                 │
│ reviewed_at                                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ audit_report_summary (NEW)                                   │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ audit_id → audit_plans.id                                    │
│ main_auditor_summary                                         │
│ sharia_summary                                               │
│ complied_products (JSON)                                     │
│ non_complied_products (JSON)                                 │
│ status (DRAFT/SUBMITTED)                                     │
│ submitted_by → users.id                                      │
│ submitted_at                                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ decision_request (NEW)                                       │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ audit_id → audit_plans.id                                    │
│ application_id → applications.id                             │
│ assigned_to → users.id                                       │
│ decision_type (DECISION_MAKER/SHARIA_COMPLIANCE)            │
│ status (PENDING/COMPLETED)                                   │
│ decision_value (APPROVED/REJECTED/CONDITIONAL)              │
│ decision_text (reasoning)                                    │
│ conditions                                                   │
│ decided_by → users.id                                        │
│ decided_at                                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ certificates (NEW)                                           │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ audit_id → audit_plans.id                                    │
│ certificate_number (HCB-YYYY-XXXXX)                         │
│ status (GENERATED/APPROVED/SENT)                             │
│ generated_at                                                 │
│ approved_at                                                  │
│ approved_by (user name)                                      │
│ approval_notes                                               │
│ sent_to_customer_at                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ notifications (NEW)                                          │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ user_id → users.id                                           │
│ type (NC_SUBMITTED/EVIDENCE_REJECTED/DECISION_ASSIGNED...)  │
│ title                                                        │
│ message                                                      │
│ audit_id → audit_plans.id                                    │
│ application_id → applications.id                             │
│ is_read                                                      │
│ read_at                                                      │
│ created_at                                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ workflow_logs (NEW - Audit Trail)                            │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ application_id → applications.id                             │
│ audit_id → audit_plans.id                                    │
│ entity_type (NC/AUDIT_SUMMARY/DECISION/CERTIFICATE)        │
│ entity_id                                                    │
│ action_type (CREATED/UPDATED/SUBMITTED/APPROVED/SENT)       │
│ status_transition                                            │
│ description                                                  │
│ performed_by → users.id                                      │
│ metadata (JSON - additional details)                         │
│ created_at                                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ emails_sent (NEW - Email Tracking)                           │
├──────────────────────────────────────────────────────────────┤
│ id                                                           │
│ recipient                                                    │
│ subject                                                      │
│ body                                                         │
│ email_type (NC_ASSIGNED/DECISION_ASSIGNED/CERT_READY...)   │
│ status (SENT/FAILED/BOUNCED)                                │
│ error_message                                                │
│ sent_at                                                      │
│ delivery_timestamp                                           │
└──────────────────────────────────────────────────────────────┘
```

## API Endpoints (17 total)

```
NC Workflow (5)
├─ GET  /api/nc/application/{applicationId} ........... Get all NCs
├─ GET  /api/nc/{ncId}/status ......................... Get NC detail
├─ POST /api/nc/{ncId}/customer-response ............. Submit action
├─ POST /api/nc/{ncId}/evidence ....................... Submit evidence
└─ POST /api/nc/{ncId}/auditor-review ................ Auditor review

Audit Summary (4)
├─ GET  /api/audit-summary/{auditId}/check-ncs ....... Check NCs cleared
├─ POST /api/audit-summary/{auditId}/draft ........... Save draft
├─ POST /api/audit-summary/{auditId}/submit .......... Final submit
└─ GET  /api/audit-summary/{auditId} ................. Get summary

Decision Making (5)
├─ GET  /api/decisions/my-requests ................... Get my decisions
├─ GET  /api/decisions/audit/{auditId} ............... Get all decisions
├─ GET  /api/decisions/{requestId} ................... Get one decision
├─ POST /api/decisions/assign ......................... Admin assign
└─ POST /api/decisions/{requestId}/decide ............ Submit decision

Certificate (3)
├─ POST /api/certificates/generate/{auditId} ........ Generate
├─ POST /api/certificates/{certificateId}/approve ... Approve
└─ POST /api/certificates/{certificateId}/send ...... Send to customer
```

## Technology Stack

```
Frontend:
  • React 18
  • TypeScript 5
  • Vite (build tool)
  • React Query (server state)
  • React Router (navigation)
  • react-hot-toast (notifications)
  • lucide-react (icons)

Backend:
  • Spring Boot 3.3.4
  • Spring Data JPA
  • Spring Security
  • Spring Mail (SMTP)
  • PostgreSQL 15
  • Flyway (migrations)
  • Lombok (annotations)
  • JWT (authentication)
  • SLF4J (logging)

Database:
  • PostgreSQL 15+
  • Flyway 9.x

Deployment:
  • DigitalOcean Droplet
  • Ubuntu 22.04 LTS
  • Nginx (reverse proxy)
  • Let's Encrypt (SSL)
  • SystemD (service management)
```

## Security Layers

```
1. AUTHENTICATION
   ├─ JWT tokens
   ├─ Token validation on each request
   └─ Role-based access control

2. API SECURITY
   ├─ HTTPS/TLS encryption
   ├─ CORS configuration
   ├─ Input validation
   └─ SQL injection prevention (JPA parameterized queries)

3. DATA PROTECTION
   ├─ Database encryption (password hashing)
   ├─ Secure password storage
   ├─ Email logging without exposing credentials
   └─ Audit trail for compliance

4. APPLICATION SECURITY
   ├─ Transaction management
   ├─ Exception handling
   ├─ Logging (sensitive data masked)
   └─ Rate limiting (can be added)
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-09-23
**Ready for Production**: ✅ YES
