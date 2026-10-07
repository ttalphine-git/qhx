# HalalCMS - Complete System Requirements

## Project Overview

**HalalCMS** is a comprehensive Halal Certification Management System with dual portals for customers and HCB (Halal Certification Body) office staff. It manages the complete lifecycle of halal certification applications from submission through audit to certification.

---

## 1. System Architecture

### Technology Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Java Spring Boot microservices
- **Database:** PostgreSQL
- **State Management:** Zustand, TanStack React Query
- **UI Library:** Lucide React (icons), Tailwind CSS
- **Notifications:** React Hot Toast
- **Routing:** React Router v7

### Portal Structure
1. **Customer Portal** - `/customer/*`
2. **Office Portal** - `/office/*`
3. **Public Portal** - `/verify/*`

---

## 2. Application Statuses & Workflow

### Status Progression Pipeline

```
DRAFT 
  ↓
SUBMITTED 
  ↓
UNDER_REVIEW 
  ↓
AGREEMENT_PENDING 
  ↓
AGREEMENT_REVIEW 
  ↓
PENDING_PAYMENT 
  ↓
PAYMENT_REVIEW 
  ↓
AUDIT_SCHEDULED 
  ↓
DOCUMENT_SUBMISSION (Audit Plan Issued)
  ↓
AUDIT_IN_PROGRESS 
  ↓
AUDIT_COMPLETED 
  ↓
NC_CLEARANCE 
  ↓
DECISION_MAKING 
  ↓
CERTIFICATION_REVIEW 
  ↓
CERTIFIED ✓
  ↓
REJECTED ✗
SUSPENDED ✗
EXPIRED ✗
```

### Key Status Groups
- **Preparation:** DRAFT → UNDER_REVIEW
- **Agreement:** AGREEMENT_PENDING → AGREEMENT_REVIEW
- **Payment:** PENDING_PAYMENT → PAYMENT_REVIEW
- **Audit Preparation:** AUDIT_SCHEDULED → DOCUMENT_SUBMISSION
- **Audit Execution:** AUDIT_IN_PROGRESS → AUDIT_COMPLETED
- **Audit Resolution:** NC_CLEARANCE → DECISION_MAKING
- **Certification:** CERTIFICATION_REVIEW → CERTIFIED
- **Terminal:** REJECTED, SUSPENDED, EXPIRED

---

## 3. Core Features

### 3.1 Application Management

#### Customer Portal Features
- **Create Applications**
  - Draft mode (save & resume)
  - Multi-step form wizard
  - Profile information snapshot
  - Company registration documents
  - Business details & activities
  - Target markets & certification standards
  - Products & services list
  - Factory/facility information

- **Application Tracking**
  - Real-time status updates
  - Visual stage pipeline indicator
  - Application detail view with tabs
  - Activity/event log
  - Assigned auditor information

- **Application Detail Tabs (Modal)**
  - Application: Company info, details, breakdown
  - Agreement: PDF signing, signature capture
  - Billing: Invoice display, payment evidence upload
  - Audit plan: Schedule dates, audit team
  - **Check list: Audit questions for preparation**
  - Documents: Required document upload
  - Audit: Audit findings & auditor comments
  - Logs: Activity history
  - Certificate: Halal certificate display

#### Office Portal Features
- **Application Management**
  - Applications list with filtering
  - Batch application handling
  - Application detail review
  - Status transitions
  - Auditor assignment

- **Audit Management**
  - Audit planning
  - Audit question configuration
  - Audit report generation
  - Non-conformity (NC) tracking
  - Corrective actions workflow

- **Certificate Management**
  - Certificate generation
  - Certificate designer customization
  - Certificate verification
  - QR code generation

### 3.2 Audit Questions (Check List)

#### Availability
- **Trigger:** When audit plan issued (DOCUMENT_SUBMISSION status)
- **Visibility:** Customer and Office portals
- **Location:** "Check list" tab in application modal

#### Question Display
- Numbered cards (1, 2, 3, ...)
- Expandable/collapsible sections
- Question text display
- Status indicators:
  - YES (green badge)
  - NO (red badge)
  - N/A (gray badge)
- Finding status:
  - NON-CONFORMITY (red)
  - OBSERVATION (orange)

#### Customer Interaction
- **Read-only sections:**
  - Auditor answers
  - Auditor findings
  - Auditor comments (gray box, left border)
  
- **Editable section:**
  - Customer comment textarea
  - Save Comments button
  - Toast notifications (success/error)

#### Office Interaction
- View all questions
- Auditor fills answers
- Auditor adds findings
- Auditor adds comments
- Can be modified during audit phases

#### Activity Categories & Questions
- **Manufacturing Audit:** Questions for food factories
- **Slaughterhouse Audit:** Questions for slaughter facilities
- **Meat Processing Audit:** Questions for meat processing facilities

---

## 4. Customer Portal Features

### 4.1 Dashboard
- Application statistics cards
- Recent applications list
- Quick action buttons
- Status summary

### 4.2 My Applications
- Applications list (all statuses)
- Filter by status (Active, Certified, Rejected, Suspended)
- Search functionality
- Click to open application modal

### 4.3 Application Modal/Detail
- All tabs as listed in 3.1
- Real-time updates
- Modal overlay interface

### 4.4 My Factories
- Factory/facility management
- Factory details
- Activity categories per factory
- Multi-facility support

### 4.5 My Products
- Product listing
- Product details
- Product-to-facility mapping
- Certification status per product

### 4.6 Batch Certificates
- Group certification management
- Batch operations
- Batch detail view
- Download certificates

### 4.7 My Certificates
- Individual certificate list
- Certificate detail view
- QR code verification
- Certificate download

### 4.8 User Profile
- User information edit
- Password change
- Notification preferences
- Company information

### 4.9 Color Settings
- Global color customization
- 8 color parameters
- Color picker UI
- Save to database/localStorage
- Reset to defaults
- Live preview

---

## 5. Office Portal Features

### 5.1 Dashboard
- Key metrics cards
- Active applications count
- Pending actions
- Recent activity
- Statistics visualization

### 5.2 Customers
- Customer list
- Customer detail view
- Customer information
- Associated applications

### 5.3 Factory Applications
- Application list with status
- Modal detail view
- Application tabs
- Auditor assignment
- Status transitions

### 5.4 Batch Applications
- Batch application management
- Batch detail view
- Batch operations

### 5.5 Batch Certificates
- Batch certificate management
- Certificate generation
- Certificate customization

### 5.6 Live Activity
- Real-time customer actions
- Activity tracking
- Event log
- Search & filter

### 5.7 Audit Management
- Audit planning
- Audit question configuration
- Audit reports
- Non-conformity management

### 5.8 Map View
- Geographic visualization
- Customer locations
- Facility locations
- Application distribution

### 5.9 Certificate Designer
- Certificate template customization
- WYSIWYG editor
- Logo upload
- Text formatting
- QR code placement

### 5.10 Users Management
- Officer/staff management
- Role assignment
- Access control
- User list

### 5.11 Settings
- Advanced Settings
- Portal configuration
- Audit question management
- Employee management
- Color Settings (global)

### 5.12 Audit Trail
- System activity log
- User actions tracking
- Change history
- Export functionality

---

## 6. API Endpoints Required

### Applications API
```
GET    /applications
POST   /applications
GET    /applications/{id}
PUT    /applications/{id}
PATCH  /applications/{id}/status
GET    /applications/{id}/documents
POST   /applications/{id}/documents
GET    /applications/{id}/logs
GET    /applications/{id}/payment-status
POST   /applications/{id}/sign-agreement
```

### Audit API
```
GET    /audits/reports/application/{applicationId}
PUT    /audits/reports/application/{applicationId}
PATCH  /audits/reports/application/{applicationId}/customer-comments
GET    /audits/configurations
GET    /audits/plans/{applicationId}
POST   /audits/plans
PUT    /audits/plans/{id}
GET    /audits/status/{applicationId}
```

### Settings API
```
GET    /settings/colors
PUT    /settings/colors
POST   /settings/colors/reset
```

### Certificate API
```
GET    /certificates
GET    /certificates/{id}
POST   /certificates
PUT    /certificates/{id}
GET    /certificates/verify/{key}
```

### Company API
```
GET    /companies/{id}
PUT    /companies/{id}
GET    /companies/{id}/factories
POST   /companies/factories
```

### Notifications API
```
GET    /notifications
POST   /notifications/{id}/read
POST   /notifications/read-all
DELETE /notifications
```

### Users API
```
GET    /users
POST   /users
PUT    /users/{id}
DELETE /users/{id}
GET    /users/roles
```

### Dashboard API
```
GET    /dashboard/statistics
GET    /dashboard/recent-applications
GET    /dashboard/metrics
```

---

## 7. Database Schema Concepts

### Core Entities

#### Applications
```
- id (PK)
- applicationNumber (unique)
- companyId (FK)
- status (enum: DRAFT, SUBMITTED, ...)
- type (enum: NEW, RENEWAL)
- submittedAt
- selectedStandards (array)
- selectedCertCats (array)
- selectedMarkets (array)
- products (array)
- halalStandard
- assignedAuditorId (FK)
- assignedAuditorName
- snapshotProfile (JSON)
- snapshotCategories (array)
- snapshotActivities (array)
- snapshotFactories (array)
- snapshotDescription
- snapshotRegDocs (JSON)
- registrationNumber
- businessType
- licenseNo, licenseExpiry
- vatNo, sstNo
- companyEmail, companyPhone, companyWeb
- createdAt, updatedAt
```

#### AuditReports
```
- id (PK)
- applicationId (FK)
- activityCategoryKey (mfg, slaughter, meat-processing)
- configurationId (FK)
- status (DRAFT, SUBMITTED, etc.)
- answers (array of AuditAnswers)
  - questionId
  - questionText
  - answer (yes, no, na)
  - finding (nc, obs)
  - auditorComment
  - customerComment
  - shariaComment
- generalComment
- completedAt
- createdAt, updatedAt
```

#### AuditQuestions
```
- id (PK)
- configurationId (FK)
- questionText
- sortOrder
- activityCategoryKey (mfg, slaughter, meat-processing)
```

#### Companies
```
- id (PK)
- name
- email
- phone
- website
- companyType
- registrationNumber
- businessLicenseNo
- licenseExpiry
- issuingAuthority
- vatSstNo
- createdAt, updatedAt
```

#### Certificates
```
- id (PK)
- applicationId (FK)
- certificateNumber
- issueDate
- expiryDate
- status
- pdf (file reference)
- qrCode
- createdAt
```

#### Users
```
- id (PK)
- email (unique)
- password (hashed)
- name
- role (CUSTOMER, ADMIN, OFFICER, AUDITOR, etc.)
- createdAt, updatedAt
```

#### AuditPlans
```
- id (PK)
- applicationId (FK)
- scheduledDate
- durationDays
- auditTeam (array)
- status
- createdAt, updatedAt
```

---

## 8. UI/UX Design System

### Color Scheme
```
Primary: #0061fe (top bar - bright blue)
Secondary: #2563eb (buttons)
Accent: #0099bc (highlights)
Success: #15803d (green)
Error: #dc2626 (red)
Warning: #f59e0b (orange)
Info: #2563eb (blue)

Text Dark: #0f172a
Text Muted: #64748b
Border: #e2e8f0
Background: #f8fafc
White: #ffffff
```

### Top Navigation Bar
- Background: #0061fe (customizable)
- Text: White
- Logo/Brand: "HalalCMS"
- Search bar
- Notifications bell (with unread count)
- User profile dropdown
- Responsive hamburger menu

### User Dropdowns
**Customer Portal:**
- Edit Profile
- Color Settings
- Sign Out

**Office Portal:**
- Settings Menu (Live Activity, Audit Trail, Color Settings, Advanced Settings)
- Sign Out

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Font
- Family: "Segoe UI", system-ui, sans-serif
- Sizes: 11px, 12px, 13px, 14px, 16px, 18px, 20px, 24px

---

## 9. Authentication & Authorization

### User Roles

**Customer Portal:**
- CUSTOMER: View own applications, manage profile

**Office Portal:**
- ADMIN: Full system access
- OFFICER: Application management, audit assignment
- AUDITOR: Audit execution, report generation
- REVIEWER: Certification review
- FINANCE: Payment management
- SUPER_ADMIN: All permissions
- OFFICE_ADMIN: Office configuration
- OFFICE_INSPECTOR: Audit inspection
- OFFICE_REVIEWER: Application review
- SHARIA_AUDITOR: Sharia compliance
- DECISION_MAKER: Final decision authority
- HALAL_REVIEWER: Halal standards review
- AUDIT_PLANNER: Audit schedule planning
- CERTIFICATE_CONTROLLER: Certificate issuance

### Authentication
- Email/password login
- JWT tokens
- Session management
- Remember me functionality

---

## 10. Key Features Implementation Details

### 10.1 Color Settings System
- **Storage:** Database (with localStorage fallback)
- **Scope:** Global (all users, all sessions)
- **Parameters Customizable:**
  1. Top Bar Background
  2. Top Bar Text
  3. Button Primary
  4. Button Primary Hover
  5. Button Secondary
  6. Button Secondary Hover
  7. Accent Color
  8. Border Color

- **UI:**
  - Color picker interface
  - Hex value display
  - Live preview
  - Save button
  - Reset to default button

- **Access:** `/settings/colors` (both portals)

### 10.2 Audit Questions System
- **Triggered:** When application enters DOCUMENT_SUBMISSION status
- **Display:** "Check list" tab in application modal
- **Format:**
  - Grouped by question number
  - Expandable cards
  - Status badges
  - Comment sections

- **Customer Abilities:**
  - Read auditor questions
  - Read auditor findings
  - Add/edit own comments
  - Save comments

- **Office Abilities:**
  - Configure questions (Advanced Settings)
  - Fill auditor answers
  - Add findings
  - Add comments

### 10.3 Document Management
- **Upload:** Application documents, payment evidence
- **Storage:** File system or cloud storage
- **Validation:** File type, size restrictions
- **Preview:** In-modal preview for images/PDFs
- **Download:** Allowed for customers on owned applications

### 10.4 Certificate Generation
- **Automatic:** On CERTIFIED status
- **QR Code:** Unique verification code
- **Template:** Customizable design
- **Verification:** Public `/verify/{key}` endpoint
- **Format:** PDF, PNG

### 10.5 Notifications
- **System:** Email/in-app notifications
- **Triggers:**
  - Status changes
  - New messages
  - Audit scheduled
  - Audit completed
  - NC assigned
  - Certificate ready

- **Management:**
  - Mark as read
  - Mark all as read
  - Clear all
  - Notification center UI

### 10.6 Activity Logging
- **Coverage:** All user actions
- **Storage:** Audit trail table
- **Display:** Audit Trail page
- **Export:** CSV/PDF export capability

---

## 11. Data Validation

### Application Form
- Company name: Required, min 3 chars
- Email: Valid email format
- Phone: Valid phone format
- Registration number: Alphanumeric
- License expiry: Future date
- Products: At least 1 required
- Standards: At least 1 required

### Audit Questions
- Answer: yes/no/na
- Finding: nc/obs (optional)
- Comments: Text (optional)

### Payment Evidence
- File type: PDF, images only
- File size: < 10MB
- Required for PENDING_PAYMENT status

---

## 12. Integration Points

### Email Service
- Application notifications
- User invitations
- Status change alerts
- Certificate delivery

### File Storage
- Document uploads
- Certificate PDFs
- Evidence files
- Design assets

### QR Code Generation
- Certificate verification
- Unique identifier per cert

### Export/Import
- Application data export
- Certificate batch export
- Audit reports export

---

## 13. Security Requirements

### XSS Protection
- React auto-escaping for JSX content
- Sandbox attributes on iframes
- File type validation on uploads
- Content Security Policy headers

### CSRF Protection
- CSRF tokens in forms
- SameSite cookies

### Authentication
- Password hashing (bcrypt)
- JWT token expiry
- Secure session cookies
- Email verification

### Data Protection
- HTTPS/TLS encryption
- Database encryption at rest
- Sensitive field masking
- Audit logging of data access

### API Security
- Rate limiting
- Input validation
- Output sanitization
- API key management

---

## 14. Deployment Requirements

### Frontend Build
```bash
npm run build
```
- Output: `/dist` directory
- Optimization: Code splitting, minification
- Assets: Images, fonts, icons

### Backend Services
- API Gateway
- Application Service
- Auth Service
- Company Service
- Certificate Service
- Audit Service
- Dashboard Service

### Infrastructure
- Docker containers
- Kubernetes orchestration
- PostgreSQL database
- File storage (S3 or similar)
- Email service
- QR code generator
- PDF generator

---

## 15. Performance Requirements

- Page load: < 3 seconds
- API response: < 500ms
- Database queries: < 100ms
- Search results: < 1 second
- Modal open: < 500ms
- Animations: 60fps

---

## 16. Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus indicators
- Alt text for images

---

## 17. Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android

---

## Summary Checklist for New Implementation

- [ ] Set up dual portal architecture
- [ ] Implement application status workflow
- [ ] Create application form with document upload
- [ ] Build audit questions system
- [ ] Implement check list feature with customer comments
- [ ] Create certificate generation & verification
- [ ] Build color settings system
- [ ] Implement user authentication & roles
- [ ] Create notification system
- [ ] Build audit trail logging
- [ ] Add payment evidence upload
- [ ] Implement activity categories & questions mapping
- [ ] Create office portal dashboard
- [ ] Build customer portal dashboard
- [ ] Implement audit planning
- [ ] Create audit report generation
- [ ] Build non-conformity tracking
- [ ] Add certificate designer
- [ ] Implement map view
- [ ] Create batch operations
- [ ] Add export/import functionality
- [ ] Set up email notifications
- [ ] Implement security measures
- [ ] Add accessibility features
- [ ] Optimize performance
- [ ] Test on multiple browsers

---

**Document Version:** 1.0
**Last Updated:** October 2026
**Platform:** HalalCMS v45o
