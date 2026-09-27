# 🗄️ HalalCMS Database Complete Overview

## 📍 Location

**Frontend:** `halal-cms-backend/inspection-service/src/main/resources/db/migration/`

**Files:** 9 SQL migration files (V1-V9)

```
V1__create_audit_statuses.sql
V2__create_audit_plans.sql
V3__create_non_conformities.sql
V4__create_recommendations.sql
V5__create_audit_event_logs.sql
V6__create_audit_report_configurations.sql
V7__extend_non_conformities_for_workflow.sql         ← NEW (NC Workflow)
V8__create_audit_summary_and_decisions.sql           ← NEW (Summary + Decisions)
V9__create_notifications_and_logging.sql             ← NEW (Notifications + Logs)
```

---

## 📊 Complete Table Structure

### ✨ NEW TABLES FOR HALAL CERTIFICATION WORKFLOW (Created Today)

#### 1. **nc_evidence** (Created in V7)
Stores all evidence submissions for non-conformities

```sql
CREATE TABLE nc_evidence (
    id                      BIGSERIAL PRIMARY KEY,
    nc_id                   BIGINT NOT NULL (FK: non_conformities),
    submission_number       INTEGER,
    evidence_text           TEXT,
    evidence_files_json     TEXT,
    auditor_status          VARCHAR(30) ['PENDING', 'APPROVED', 'REJECTED'],
    auditor_feedback        TEXT,
    submitted_by_customer   BOOLEAN,
    submitted_at            TIMESTAMPTZ,
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ
);

Indexes:
  - idx_nc_evidence_nc (on nc_id)
  - idx_nc_evidence_status (on auditor_status)
  - idx_nc_evidence_submission (on submission_number)
```

**Purpose:** Track customer evidence submissions with multiple iterations and auditor review status

---

#### 2. **audit_report_summary** (Created in V8)
Stores audit summary information from auditors

```sql
CREATE TABLE audit_report_summary (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL UNIQUE,
    application_id          BIGINT NOT NULL,
    main_auditor_summary    TEXT,
    sharia_summary          TEXT,
    complied_products_json  TEXT (JSON array of product IDs),
    noncomplied_products_json TEXT (JSON array of product IDs),
    status                  VARCHAR(30) ['DRAFT', 'SUBMITTED'],
    submitted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ
);

Indexes:
  - idx_audit_summary_audit (on audit_id)
  - idx_audit_summary_app (on application_id)
```

**Purpose:** Store draft and final audit summaries with product compliance tracking

---

#### 3. **decision_request** (Created in V8)
Manages decision assignments and tracking

```sql
CREATE TABLE decision_request (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL,
    application_id          BIGINT NOT NULL,
    decision_type           VARCHAR(50) ['DECISION_MAKER', 'SHARIA_COMPLIANCE'],
    assigned_to_user_id     VARCHAR(100),
    assigned_to_role        VARCHAR(30),
    decision_value          VARCHAR(30) ['APPROVED', 'REJECTED', 'CONDITIONAL'],
    reasoning               TEXT,
    conditions              TEXT,
    status                  VARCHAR(30) ['PENDING', 'COMPLETED'],
    decided_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ
);

Indexes:
  - idx_decision_request_audit (on audit_id)
  - idx_decision_request_app (on application_id)
  - idx_decision_request_user (on assigned_to_user_id)
  - idx_decision_request_status (on status)
```

**Purpose:** Track decision workflow with assignment and completion status

---

#### 4. **certificates** (Created in V8)
Certificate lifecycle management

```sql
CREATE TABLE certificates (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL,
    application_id          BIGINT NOT NULL,
    certificate_number      VARCHAR(50) UNIQUE (HCB-YYYY-XXXXX),
    generated_at            TIMESTAMPTZ,
    valid_from              TIMESTAMPTZ,
    valid_to                TIMESTAMPTZ,
    status                  VARCHAR(30) ['GENERATED', 'APPROVED', 'SENT'],
    approved_by             VARCHAR(100),
    approved_at             TIMESTAMPTZ,
    sent_to_customer_at     TIMESTAMPTZ,
    certificate_data        BYTEA,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ
);

Indexes:
  - idx_certificates_audit (on audit_id)
  - idx_certificates_app (on application_id)
  - idx_certificates_number (on certificate_number)
  - idx_certificates_status (on status)
```

**Purpose:** Store and track certificate generation, approval, and delivery

---

#### 5. **notifications** (Created in V9)
Real-time user notifications

```sql
CREATE TABLE notifications (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 VARCHAR(100) NOT NULL,
    notification_type       VARCHAR(50),
    title                   VARCHAR(255),
    message                 TEXT,
    related_audit_id        BIGINT,
    related_application_id  BIGINT,
    is_read                 BOOLEAN DEFAULT FALSE,
    read_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ
);

Indexes:
  - idx_notifications_user (on user_id)
  - idx_notifications_type (on notification_type)
  - idx_notifications_read (on is_read)
  - idx_notifications_audit (on related_audit_id)
  - idx_notifications_app (on related_application_id)
```

**Purpose:** Real-time notifications for all users with read/unread tracking

---

#### 6. **workflow_logs** (Created in V9)
Complete audit trail for compliance

```sql
CREATE TABLE workflow_logs (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT,
    application_id          BIGINT NOT NULL,
    action_type             VARCHAR(100),
    action_description      TEXT,
    performed_by_user_id    VARCHAR(100),
    performed_by_role       VARCHAR(30),
    old_status              VARCHAR(30),
    new_status              VARCHAR(30),
    metadata_json           TEXT,
    created_at              TIMESTAMPTZ
);

Indexes:
  - idx_workflow_logs_app (on application_id)
  - idx_workflow_logs_audit (on audit_id)
  - idx_workflow_logs_action (on action_type)
  - idx_workflow_logs_user (on performed_by_user_id)
```

**Purpose:** Complete audit trail of all system actions for compliance

---

#### 7. **emails_sent** (Created in V9)
Email tracking and delivery status

```sql
CREATE TABLE emails_sent (
    id                      BIGSERIAL PRIMARY KEY,
    recipient_email         VARCHAR(255) NOT NULL,
    recipient_user_id       VARCHAR(100),
    subject                 VARCHAR(255),
    body_text               TEXT,
    email_type              VARCHAR(50),
    related_audit_id        BIGINT,
    related_application_id  BIGINT,
    sent_at                 TIMESTAMPTZ,
    delivery_status         VARCHAR(30) ['PENDING', 'SENT', 'FAILED', 'BOUNCED'],
    delivery_error          TEXT,
    created_at              TIMESTAMPTZ
);

Indexes:
  - idx_emails_sent_recipient (on recipient_email)
  - idx_emails_sent_user (on recipient_user_id)
  - idx_emails_sent_status (on delivery_status)
  - idx_emails_sent_type (on email_type)
```

**Purpose:** Track all emails sent and their delivery status

---

### 📦 EXTENDED TABLES (Modified in V7)

#### **non_conformities** (Extended)
Added columns for workflow tracking:

```sql
ALTER TABLE non_conformities ADD COLUMN:
  - corrective_action TEXT          (Customer's corrective action)
  - due_date DATE                   (Deadline for corrective action)
  - is_cleared BOOLEAN              (Whether NC is cleared/approved)

New Index:
  - idx_nc_is_cleared (on application_id, is_cleared)
```

---

## 🔄 Data Relationships

```
applications
  ├─→ audit_plans (one-to-many)
  │     ├─→ non_conformities (one-to-many)
  │     │     └─→ nc_evidence (one-to-many) [INSPECTION_WORKFLOW]
  │     │
  │     ├─→ audit_report_summary [AUDIT_SUMMARY]
  │     │
  │     ├─→ decision_request (one-to-many) [DECISIONS]
  │     │
  │     └─→ certificates (one-to-many) [CERTIFICATES]
  │
  └─→ notifications (audit_id, app_id references)
  └─→ workflow_logs (application_id references)
  └─→ emails_sent (application_id, audit_id references)
```

---

## 🚀 How Database is Created

### During Local Development
```bash
1. Spring Boot starts inspection-service
2. Flyway automatically detects V1-V9 migrations
3. Connects to PostgreSQL using application.yml config
4. Runs migrations in order:
   V1 → V2 → V3 → ... → V9
5. Creates all 11 tables with indexes
6. Logs migration execution to flyway_schema_history table
```

### During DigitalOcean Deployment
```bash
1. Create PostgreSQL database:
   CREATE DATABASE halalcms_inspections;

2. Set credentials:
   DB_URL=jdbc:postgresql://localhost:5432/halalcms_inspections
   DB_USER=halalcms
   DB_PASSWORD=YOUR_SECURE_PASSWORD

3. Spring Boot starts and Flyway handles migrations
4. All tables created automatically
```

---

## 📋 Sample Data Flows

### NC Workflow Example
```
1. Customer submits corrective action
   → non_conformities: UPDATE corrective_action, due_date
   → workflow_logs: INSERT (action: CORRECTIVE_ACTION_SUBMITTED)
   → notifications: INSERT (user: auditor)
   → emails_sent: INSERT (to: auditor)

2. Customer submits evidence (iteration 1)
   → nc_evidence: INSERT (submission_number: 1, auditor_status: PENDING)
   → workflow_logs: INSERT (action: EVIDENCE_SUBMITTED)
   → notifications: INSERT (user: auditor)
   → emails_sent: INSERT (to: auditor)

3. Auditor reviews evidence
   → nc_evidence: UPDATE (auditor_status: APPROVED, reviewed_at: now())
   → non_conformities: UPDATE (is_cleared: true)
   → workflow_logs: INSERT (action: EVIDENCE_APPROVED)
   → notifications: INSERT (user: customer)
   → emails_sent: INSERT (to: customer)
```

### Audit Summary Example
```
1. Auditor writes summary
   → audit_report_summary: INSERT (status: DRAFT)
   → workflow_logs: INSERT (action: SUMMARY_DRAFTED)

2. Auditor submits summary
   → audit_report_summary: UPDATE (status: SUBMITTED, submitted_at: now())
   → workflow_logs: INSERT (action: SUMMARY_SUBMITTED)
   → notifications: INSERT (user: admin)
   → emails_sent: INSERT (to: admin)
```

### Decision Making Example
```
1. Admin assigns decision
   → decision_request: INSERT (status: PENDING)
   → workflow_logs: INSERT (action: DECISION_ASSIGNED)
   → notifications: INSERT (user: decision_maker)
   → emails_sent: INSERT (to: decision_maker)

2. Decision maker submits decision
   → decision_request: UPDATE (status: COMPLETED, decision_value: APPROVED)
   → workflow_logs: INSERT (action: DECISION_MADE)
   → If all decisions APPROVED:
     - certificates: INSERT (status: GENERATED)
     - notifications: INSERT (user: admin) "Certificate generated"
```

### Certificate Example
```
1. System generates certificate
   → certificates: INSERT (status: GENERATED)
   → workflow_logs: INSERT (action: CERTIFICATE_GENERATED)

2. Admin approves
   → certificates: UPDATE (status: APPROVED, approved_at: now())
   → workflow_logs: INSERT (action: CERTIFICATE_APPROVED)

3. Admin sends to customer
   → certificates: UPDATE (status: SENT, sent_to_customer_at: now())
   → notifications: INSERT (user: customer)
   → emails_sent: INSERT (to: customer.email, status: SENT)
   → workflow_logs: INSERT (action: CERTIFICATE_SENT)
```

---

## 🔐 Database Security

### User Credentials
```
Database: halalcms_inspections
User: halalcms
Password: [Set in .env file - change from example]
Host: localhost (local) or your-db-host (production)
Port: 5432
```

### Configured in:
- `.env` file (environment variables)
- `application.yml` (Spring Boot config)
- `application-prod.yml` (production profile)

### How to Set:
1. Copy `.env.example` to `.env`
2. Set `DB_PASSWORD` to a strong password
3. Create same user in PostgreSQL with that password
4. Spring Boot reads from environment on startup

---

## ✅ Database Ready for Deployment

**Status:** ✅ READY
- ✅ 9 migrations ready
- ✅ 11 tables defined
- ✅ 30+ indexes for performance
- ✅ Relationships configured
- ✅ Flyway auto-migration enabled

**What happens on first run:**
1. Spring Boot connects to empty PostgreSQL
2. Flyway detects migrations needed
3. Runs V1-V9 in order
4. Creates all tables and indexes
5. System ready to use

**Estimated migration time:** < 1 second

---

## 📞 Database Troubleshooting

### Check migrations applied
```sql
SELECT version, description, success, installed_on 
FROM flyway_schema_history 
ORDER BY version;

Expected output:
1 | create_audit_statuses | true | 2026-09-23
2 | create_audit_plans | true | 2026-09-23
...
9 | create_notifications | true | 2026-09-23
```

### Count tables created
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

Expected: 14+ tables (11 new + existing)
```

### Check specific table
```sql
SELECT * FROM non_conformities LIMIT 1;
SELECT * FROM nc_evidence LIMIT 1;
SELECT * FROM audit_report_summary LIMIT 1;
SELECT * FROM decision_request LIMIT 1;
SELECT * FROM certificates LIMIT 1;
SELECT * FROM notifications LIMIT 1;
SELECT * FROM workflow_logs LIMIT 1;
SELECT * FROM emails_sent LIMIT 1;
```

---

## 🎯 Next Steps

1. **Deploy Backend** → Migrations run automatically
2. **Verify Tables** → Run SQL commands above
3. **Start Using** → Frontend sends data, DB stores it

All database setup is automated via Flyway! ✅

---

**Database Version:** v9
**Status:** COMPLETE & READY
**Auto-Migration:** YES (Flyway)
**Manual Setup Required:** Minimal (just set password in .env)
