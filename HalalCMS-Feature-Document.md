# HalalCMS – Feature & Workflow Document

*Date: 2026-09-17*

---

## 1. Project Overview

**HalalCMS** is a SaaS platform for managing the end-to-end halal certification process. It connects companies seeking halal certification with the Halal Certification Body (HCB) that reviews, audits, and issues certificates.

### Portals

| Portal | Users | Path prefix |
|---|---|---|
| **Office Portal** | HCB officers, auditors, reviewers, admins | `/office/` |
| **Customer Portal** | Company representatives applying for certification | `/customer/` |

### Technology Stack
- **Frontend:** React + TypeScript, React Query for API data
- **Backend:** Java microservices (REST API)
- **Hosting:** DigitalOcean
- **Local data store:** `localStorage` for offline/unsynced records pending backend integration

### Key Actors
- **Customer** — submits application, uploads documents, signs agreement, pays fees
- **HCB Officer** — reviews application, approves or rejects, manages the audit schedule
- **HCB Auditor** — conducts F1 and F2 site audits
- **System** — sends automated notifications and email alerts

---

## 2. Application Lifecycle

Applications move through 18 statuses in sequence. Terminal statuses (REJECTED, SUSPENDED, EXPIRED) break out of the main flow.

| # | Status | Who acts | Meaning |
|---|---|---|---|
| 1 | DRAFT | Customer | Saved but not yet submitted |
| 2 | SUBMITTED | Customer | Submitted; awaiting HCB review |
| 3 | UNDER_REVIEW | HCB | Officer actively reviewing the application |
| 4 | AGREEMENT_PENDING | HCB | HCB approved; waiting for customer to sign agreement |
| 5 | AGREEMENT_REVIEW | Customer | Customer signed; HCB reviews the signed agreement |
| 6 | PENDING_PAYMENT | HCB | Agreement approved; customer must pay fees |
| 7 | PAYMENT_REVIEW | Customer | Payment submitted; HCB verifying |
| 8 | AUDIT_SCHEDULED | HCB | Payment verified; audit date booked |
| 9 | DOCUMENT_SUBMISSION | Customer | Audit plan issued; customer submits required documents |
| 10 | AUDIT_IN_PROGRESS | HCB | F1 site audit underway |
| 11 | AUDIT_COMPLETED | HCB | F2 audit completed |
| 12 | NC_CLEARANCE | Customer | Customer must clear all non-conformance items |
| 13 | DECISION_MAKING | HCB | Reviewing audit findings; making certification decision |
| 14 | CERTIFICATION_REVIEW | HCB | Final review before certificate issuance |
| 15 | CERTIFIED | HCB | Certificate issued; process complete |
| — | REJECTED | HCB | Application rejected; customer may resubmit |
| — | SUSPENDED | HCB | Certificate suspended; re-audit required |
| — | EXPIRED | System | Certificate validity period ended |

---

## 3. Approval Workflow

When an HCB officer clicks **Approve** on a SUBMITTED or UNDER_REVIEW application, the following actions fire in sequence:

1. **Status change** — application moves to `AGREEMENT_PENDING`
2. **Profile data locked** — a snapshot of the customer's profile, registration documents, categories, activities, description, and factory details is frozen on the application record at the moment of approval
3. **Application log entry** — an entry is appended to the application's own log: "Application Approved" by [officer's real name], with timestamp and note
4. **Global audit log — approval** — an `APPLICATION` category entry written to `hcs_audit_logs`: actor = officer's real name, oldStatus, newStatus = AGREEMENT_PENDING
5. **Global audit log — email** — a `SYSTEM` category entry "Email Notification Sent" written to `hcs_audit_logs` by System
6. **Customer notification** — a success-type notification in the customer portal bell: "Your application has been approved — please sign the agreement"
7. **Office notification** — an info-type confirmation to the office bell: "Approval email sent to [company]"
8. **Progress stepper** — step 2 "Application approved" becomes the active step
9. **Status flow badges** — panel header updates to: ✓ Approved by HCB → Agreement signing by customer

### Confirmation Modal

Before executing approval, the officer sees a dialog showing: application number, company name, current status, and the message: *Status will change to Agreement Pending. Profile data will be locked and an email notification will be sent to the customer to sign the agreement.*

---

## 4. Rejection & Resubmission Workflow

### Rejection (HCB)

1. Officer clicks **Reject** — visible when status is SUBMITTED or UNDER_REVIEW
2. A modal opens requiring a rejection reason (Confirm button disabled until reason is entered)
3. On confirm:
   - Status → `REJECTED`; `rejectionReason` and `rejectedAt` saved on the application
   - Application log entry: "Application Rejected" with the reason
   - Global audit log entry (APPLICATION category) by officer's real name
   - Customer notification (error type): "Your application was rejected — Reason: [reason]"

### Customer Resubmission

1. A red banner appears at the top of the My Applications page: "N application(s) rejected by HCB — Review the rejection reason and resubmit"
2. Banner has a **View** button that switches to the Rejected tab
3. Rejected apps in the table show:
   - **View** button to inspect the full application
   - **Resubmit** button (replaces Delete for rejected apps)
   - Rejection reason displayed inline in red below the buttons
4. On **Resubmit**:
   - Status → `SUBMITTED`
   - New log entry appended: "Application Resubmitted" by Customer
   - Global audit log entry (APPLICATION category)
   - Office notification: "[Company] has resubmitted their application after rejection — please review"

---

## 5. Notification Center

Both portals have a **bell icon** in the navbar. A red badge shows the unread count.

### Storage
- Customer: `localStorage` key `hcs_notifications_customer` (max 50)
- Office: `localStorage` key `hcs_notifications_office` (max 50)

### Notification Object Fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | `notif_<timestamp>` |
| `title` | string | Short heading |
| `body` | string | Full message text |
| `type` | enum | `success`, `error`, `warning`, `info` |
| `read` | boolean | false on creation |
| `createdAt` | ISO string | Creation timestamp |

### Triggers

| Action | Target | Type |
|---|---|---|
| HCB approves application | Customer | success |
| HCB rejects application | Customer | error (includes reason) |
| Approval email sent | Office | info |
| Customer submits new application | Office | info |
| Customer resubmits after rejection | Office | info |

### Panel Features
- Unread badge on bell icon (red, capped at "9+")
- Dropdown: newest first, colored left border by notification type
- Blue dot per unread item; click any item to mark it read
- "Mark all read" and "Clear" buttons
- Polls `localStorage` every 3 seconds + listens to `storage` events for cross-tab sync

---

## 6. Audit Trail / Log Database

A global audit trail in `localStorage` key `hcs_audit_logs` (max 2,000 entries; oldest dropped when full).

### Log Entry Fields

| Field | Description |
|---|---|
| `id` | `log_<timestamp>_<random4>` |
| `applicationId` | Application ID string |
| `applicationNumber` | Human-readable e.g. `#L1234` |
| `companyName` | Company name at time of action |
| `timestamp` | ISO 8601 datetime |
| `actor` | Real name of the person who acted |
| `role` | `Customer`, `HCB Office`, or `System` |
| `action` | Label e.g. "Application Approved" |
| `details` | Free-text detail string |
| `oldStatus` | Status before action (optional) |
| `newStatus` | Status after action (optional) |
| `category` | `APPLICATION`, `PROFILE`, `PAYMENT`, `AUDIT`, `CERTIFICATE`, `SYSTEM` |

### Trigger Points

| Action | Actor | Category |
|---|---|---|
| Draft saved | Customer (real name) | APPLICATION |
| Application submitted | Customer (real name) | APPLICATION |
| Application resubmitted | Customer | APPLICATION |
| Application approved | HCB officer (real name) | APPLICATION |
| Approval email sent | System | SYSTEM |
| Application rejected | HCB officer (real name) | APPLICATION |
| Profile change requested | Customer (real name) | PROFILE |

### Audit Trail Page (Office only)

Route: `/office/audit-trail` — "Audit Trail" nav item

- Stats: total entries, today count, filtered count
- Filters: free-text search, category, role, date-from/to range
- Table: Timestamp · App # · Company · Actor/Role · Action · Category · Status change · Details
- Export CSV (filtered entries), Clear (with confirmation), Refresh
- 25 entries per page, paginated

---

## 7. Progress Stepper

Displayed at the top of the Application tab in the office detail panel. Shows 12 major milestones.

| Step | Label | Statuses covered |
|---|---|---|
| 1 | Application submitted | SUBMITTED, UNDER_REVIEW |
| 2 | Application approved | AGREEMENT_PENDING |
| 3 | Sign agreement | AGREEMENT_REVIEW |
| 4 | Payment | PENDING_PAYMENT, PAYMENT_REVIEW |
| 5 | Audit plan | AUDIT_SCHEDULED |
| 6 | Submit documents | DOCUMENT_SUBMISSION |
| 7 | F1 audit | AUDIT_IN_PROGRESS |
| 8 | F2 audit | AUDIT_COMPLETED |
| 9 | NC clearance | NC_CLEARANCE |
| 10 | Decision making | DECISION_MAKING |
| 11 | Factory certificate | CERTIFICATION_REVIEW |
| 12 | Issue certificate | CERTIFIED |

### Visual States
- **Done** — green filled circle with ✓ checkmark, green connector line, green label
- **Active** — white circle with blue border and glow, bold dark label
- **Upcoming** — light grey circle with step number, grey label

### Status Flow Badges (Panel Header)

Two pill-shaped badges always visible in the application panel header:
- **✓ Done** (green pill): what has been completed at the current status
- **▸ Upcoming** (amber pill): what action is required next

Both are driven by the `STATUS_FLOW` map which covers all 18 statuses.

---

## 8. Profile Change Requests

Customers can update their company profile at any time. Changes are submitted as change requests for HCB review rather than applying immediately.

### Editable Fields
- **Company fields:** Company Name, Registration Number, Company Type, Business License Number, License Expiry, Issuing Authority, VAT/SST Number, Phone, Email, Website, Country, City, Address, Industry
- **Document fields:** Business License, VAT Certificate, Company Registration Certificate, Bank Statement, Quality Certificate, Other Document
- **Description:** Free-text business description

### Workflow

1. Customer edits any field on the My Profile page
2. The **Submit for Approval** button activates when a difference from the last approved snapshot is detected
3. On submit:
   - New values written to `localStorage` immediately (so application views reflect them)
   - A change request object saved to `hcs_profile_requests`: changed field, old value, new value, timestamp, status = PENDING
   - Audit log entry created (PROFILE category)
4. In the Office portal a pending badge appears on the **Customers** nav item showing the count of open requests
5. The Submit button is disabled while any request is PENDING (one active request at a time)

### Data Strategy
- Pre-approval applications always read live `localStorage` profile data
- Post-approval applications read the frozen snapshot taken at approval time, regardless of later profile changes

---

## 9. Data Architecture

### localStorage Keys

| Key | Content |
|---|---|
| `hcs_local_applications` | Array of locally-saved application objects pending backend sync |
| `hcs_profile` | Customer company profile object |
| `hcs_reg_docs` | Registration document file references |
| `hcs_categories` | Array of selected certification categories |
| `hcs_activities` | Array of selected business activities |
| `hcs_description` | Company business description (string) |
| `hcs_factories` | Array of factory/plant records |
| `hcs_profile_requests` | Array of profile change request objects |
| `hcs_notifications_customer` | Customer notification objects (max 50) |
| `hcs_notifications_office` | Office notification objects (max 50) |
| `hcs_audit_logs` | Global audit trail entries (max 2,000) |
| `hcs_application_draft` | Single application draft in progress |

### Pre-Approval vs Post-Approval Data Freeze

Applications in pre-approval statuses (DRAFT, SUBMITTED, UNDER_REVIEW) read live `localStorage` for profile and document data. On approval (status → AGREEMENT_PENDING), a snapshot is frozen on the application record:

| Snapshot field | Content |
|---|---|
| `snapshotProfile` | Company profile at approval time |
| `snapshotRegDocs` | Registration documents at approval time |
| `snapshotCategories` | Selected categories at approval time |
| `snapshotActivities` | Selected activities at approval time |
| `snapshotDescription` | Business description at approval time |
| `snapshotFactories` | Factory list at approval time |

Post-approval views always read snapshot fields, not live `localStorage`, preserving the certified record even if the customer later updates their profile.

### Per-Application Log Array

Each application record carries a `logs` array (separate from the global audit trail) used for the per-application timeline in the Logs tab:

| Field | Description |
|---|---|
| `timestamp` | ISO string |
| `action` | Event label |
| `by` | Actor name |
| `note` | Optional detail text |
| `color` | Hex colour for the timeline dot |
