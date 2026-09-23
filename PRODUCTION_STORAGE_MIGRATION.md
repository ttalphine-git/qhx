# Production Storage Migration

This system must not store business records in browser `localStorage`. Browser storage is per browser/profile/device and causes data loss when users switch browsers, use incognito mode, clear cache, or work from another machine.

## Converted in this pass

- Office customer list now reads companies from `GET /companies`.
- Office customer detail now reads company, factories, and products from:
  - `GET /companies/{id}`
  - `GET /companies/{id}/factories`
  - `GET /companies/{id}/products`
- Public certificate verification now reads certificates from `GET /certificates/{key}`.
- Certificate service now permits public read access for `GET /certificates/**`.
- Office customer pages no longer create or mutate customer profile records from `hcs_user` / `hcs_profile`.
- Office audit plan screens save the lead auditor, scheduled date, duration, scope, and status to `PUT /audit-plans/application/{applicationId}`.

## Remaining localStorage areas to migrate

- Customer profile edit/review workflow:
  - `hcs_profile_requests`
  - Requires backend profile-change request endpoints.
- Customer onboarding and registration metadata:
  - `hcs_categories`
  - `hcs_activities`
  - `hcs_description`
  - `hcs_reg_docs`
  - `hcs_target_market`
  - Requires company profile extension fields and document upload/storage.
- Local applications and drafts:
  - `hcs_application_draft`
  - `hcs_local_applications`
  - Requires the customer application pages to use `application-service` create/update/list endpoints only.
- Audit review records:
  - `hcs_app_review_*`
  - `hcs_ncs_*`
  - `hcs_tech_review_*`
  - `hcs_halal_review_*`
  - `hcs_cert_decision_*`
  - Requires create/update endpoints in `inspection-service` for NCs, technical review, halal review, and certification decision.
- Audit planning follow-up:
  - The core audit plan is database-backed.
  - Dedicated database columns are still needed for Sharia auditor, audit end date, agenda, criteria, conflict checks, and impartiality checks.
- Billing and payment records:
  - Local invoices, bank details, payment evidence, Stripe config
  - Requires billing/payment persistence, file/object storage, and payment provider configuration tables.
- Office settings:
  - Accreditation markets/scopes
  - Auditor competence
  - Complaints/appeals/surveillance
  - Agreement PDFs/languages
  - Audit tracks
  - Certificate templates/designer state
  - Requires settings/configuration endpoints and database tables.
- Notifications and audit trail:
  - `hcs_notifications_*`
  - `hcs_audit_log`
  - Requires notification-service endpoints and server-side audit log writes.
- Shipments:
  - Local shipment records
  - Requires shipment endpoints and certificate linkage.

## Acceptable browser storage

- Auth/session cache only:
  - `hcs_token`
  - `hcs_user`

Even these should eventually move toward secure HTTP-only cookies for production deployments.
