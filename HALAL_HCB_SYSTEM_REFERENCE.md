# Halal HCB Certification System Reference

Last updated: 2026-09-15

This file is the project reference for implementation decisions in this repository. When adding or changing features, treat this document as the product and workflow baseline unless the user explicitly says otherwise.

## Product Purpose

This software is for a Halal Certification Body (HCB), meaning an organization that certifies client factories, products, services, or production systems as halal. The system should help the HCB manage certification work from client onboarding through factory audit, certification decision, certificate issuance, surveillance, renewal, suspension, withdrawal, and shipment support.

The system is not only a customer portal. It is an operational platform for the HCB and a service portal for certified factories.

Primary business goals:

- Help factories apply for halal certification.
- Help the HCB evaluate factories, products, ingredients, processes, documents, labels, and halal assurance controls.
- Help auditors plan and record factory audits.
- Help technical reviewers and halal/Shariah reviewers make defensible certification decisions.
- Issue controlled halal certificates and marks/logos.
- Maintain surveillance, renewals, complaints, appeals, suspensions, withdrawals, and certificate history.
- Help certified factories prepare product and shipment evidence for export/import clearance.

## Standards And Regulatory Baseline

The system should be designed around conformity assessment and halal certification body requirements, especially:

- ISO/IEC 17065:2012: requirements for bodies certifying products, processes, and services. ISO lists process requirements including application, application review, evaluation, review, certification decision, certification documentation, directory of certified products, surveillance, changes affecting certification, termination, reduction, suspension or withdrawal, records, complaints, and appeals.
- GSO 2055-2:2021: general requirements for Halal Certification Bodies in the Gulf context. It covers issuing halal certificates for products, services, and systems, and defines concepts such as contract, audit, auditor, certification body, accreditation body, nonconformity, suspension, applicant, audit team, halal mark/logo, and risk-assessment approach.
- OIC/SMIIC 2:2019: conformity assessment requirements for bodies providing halal certification. OIC/SMIIC also has related halal food, cosmetics, supply-chain, quality-management, laboratory, inspection, and certification-scheme standards.
- Local authority rules for target markets, for example UAE.S/GSO standards and MoIAT registration/recognition of HCBs in UAE, or JAKIM procedures for Malaysia-related certification.

Important design implication: the software must preserve impartiality, competence, traceability, controlled decisions, documented evidence, and audit records. It should not allow sales/customer-service users to directly approve certificates without independent review and decision authority.

Sources used:

- ISO certification bodies overview: https://committee.iso.org/bodies.html
- ISO/IEC 17065 page: https://www.iso.org/standard/46568.html
- GSO 2055-2:2021 preview: https://gso-sims-preview-doc-aws.s3-eu-west-1.amazonaws.com/gso-2055-2-2021-en.html
- SMIIC standards catalogue: https://smiic.org/en/standards
- SMIIC conformity assessment committee: https://smiic.org/en/technical-committees/47
- UAE MoIAT halal program: https://qc.moiat.gov.ae/en/halal
- UAE MoIAT HCB registration: https://qc.moiat.gov.ae/en/services/registration-of-halal-certification-bodies
- EIAC halal conformity assessment bodies: https://eiac.gov.ae/services/halal-conformity-assessment-bodies/
- JAKIM halal procedure page: https://www.halal.gov.my/?data=bW9kdWxlcy9jb2xsYXBzaWJsZV9jb250ZW50Ozs7Ow%3D%3D&utama=panduan
- JAKIM international manufacturing procedure notice: https://www.halal.gov.my/?content_id=202312216583f5b3aa5d9&data=bW9kdWxlcy9jb250ZW50X2RldGFpbHM7Ozs%3D&page_title=Berita
- Sharjah shipment-release service example: https://shjmun.gov.ae/servicedirectory/details/683d3a96ff3e1753c064e724

## Main Actors

External/client side:

- Factory/company applicant
- Factory halal executive or halal coordinator
- Factory document controller
- Export/shipping officer
- Ingredient/material supplier contact
- Importer/distributor/trader/agent

HCB side:

- Sales/client onboarding officer
- Application reviewer
- Scheme manager
- Audit planner
- Auditor
- Technical expert
- Halal/Shariah expert
- Technical reviewer
- Certification decision maker
- Certificate controller
- Finance officer
- Complaint/appeal handler
- Accreditation/quality manager
- System administrator

Important segregation:

- Auditor/evaluation role records findings.
- Reviewer verifies evaluation completeness.
- Decision maker approves/rejects certification.
- Certificate controller issues controlled certificate documents.
- Quality manager monitors impartiality, competence, complaints, appeals, and accreditation evidence.

## Core Certification Workflow

1. Client onboarding

- Register company/client account.
- Capture legal entity, trade license, address, contacts, tax/VAT details, company activity category, and responsible persons.
- Verify email/phone.
- Link one company to many factories.

2. Factory registration

- Capture factory/plant name, physical address, map location, country, production lines, annual capacity, factory activity category, and specific activities.
- Capture factory documents such as manufacturing license, factory layout, process flow, location map, existing certifications, hygiene/quality certificates, and halal assurance system documents.
- A certification application should usually be tied to one factory or one manufacturing address unless the scheme explicitly supports multi-site certification.

3. Product and scope definition

- Register products under the factory.
- Capture product category, product name, brand, SKU/barcode, packaging artwork, label, intended markets, shelf life, HS code if used for shipping, and certificate scope.
- Capture ingredients/raw materials, additives, processing aids, packaging-contact materials, water treatment aids, suppliers, supplier halal certificates/specifications, certificate expiry dates, and risk level.
- Track whether product contains animal-derived materials, gelatin, enzymes, alcohol/ethanol, flavors, emulsifiers, colorants, or other critical materials.

4. Application creation

- Application types should include new certification, renewal, extension/add product, change request, suspension-lift request, and possibly shipment certificate request.
- Capture target standard/scheme, country/market, factory, products, requested scope, and applicant declaration.
- Generate application number and preserve immutable submitted snapshot.

5. Application review

- Check eligibility, scope, target standard, completeness, required documents, fees, and whether the HCB is accredited/recognized for that scheme/category/market.
- Decide whether to accept, request information, reject, or quote.
- Assign responsible reviewer and audit planner.

6. Contract/quotation/payment

- Issue quotation or fee schedule.
- Capture agreement/contract granting conditions for using halal certificate and halal mark.
- Track payment status before audit or certificate issuance, based on the HCB business rule.

7. Audit planning

- Determine audit type and duration using risk, product category, factory size, process complexity, number of products, slaughter/meat involvement, outsourced processes, prior history, and target scheme.
- Assign competent auditor(s), technical expert, and halal/Shariah expert where required.
- Check conflict of interest and impartiality before assignment.
- Create audit plan with date, duration, scope, criteria/standard, audit team, agenda, and sites/areas to inspect.

8. Factory audit/evaluation

- Audit should cover receiving, storage, production, cleaning/sanitation, personnel hygiene, segregation, non-halal contamination risks, pest control, water, equipment, labels, traceability, recall, supplier controls, ingredients, processing aids, packaging, halal assurance system, internal halal committee, training, and records.
- Collect evidence with checklist answers, notes, photos, documents, product/ingredient samples if needed, and traceability tests.
- Record nonconformities as major/minor/critical according to the scheme.
- Generate audit report.

9. Corrective action and closure

- Factory submits root cause, correction, corrective action, evidence, and target completion date.
- Auditor/reviewer accepts, rejects, or requests more evidence.
- Major or critical findings may require follow-up audit or decision escalation.

10. Technical and halal review

- Independent reviewer checks file completeness, audit report, nonconformity closure, product/ingredient status, label/mark usage, test results, and scheme compliance.
- Halal/Shariah expert reviews sensitive ingredients, slaughter/meat issues, alcohol/ethanol, animal derivatives, contamination risk, and religious compliance questions.

11. Certification decision

- Decision maker approves, rejects, suspends, reduces scope, or requests more evaluation.
- Decision must be recorded with date, person, basis, scope, and conditions.
- Auditor should not be the sole uncontrolled certificate decision maker.

12. Certificate issuance

- Issue certificate number, scope, products, factory/site address, owner/client, standard/scheme, issue date, expiry date, status, and authorized signatory.
- Store certificate PDF/version, QR verification key, and public verification record.
- Control halal mark/logo usage and packaging artwork approval.

13. Public/private certificate verification

- Public QR page should show certificate number, company/factory, product scope, standard/scheme, issue/expiry date, status, and verifying HCB.
- It should not expose confidential ingredients or internal audit evidence.

14. Surveillance and post-certification control

- Schedule surveillance audits, unannounced inspections where required, annual reviews, certificate expiry reminders, complaints, market feedback, product changes, supplier changes, factory changes, and label changes.
- Manage suspension, withdrawal, scope reduction, expiry, and renewal.

15. Shipment/export support

- Certified factories may need shipment documents for export/import clearance.
- System should support consignment/shipment certificate requests linked to active product/factory certificates.
- Capture invoice, packing list, bill of lading/airway bill/delivery order, container/seal numbers, batch/lot numbers, production/expiry dates, destination country, importer, port, certificate of origin, health certificate if required, and halal certificate reference.
- Validate that shipped products, factory, batches, dates, and destination requirements match the active certificate scope.
- Generate shipment support letter/certificate or document pack, depending on the HCB service model and importing authority rules.

## Data Model Guidance

Company:

- Legal name, registration number, company type, trade license, address, contact persons, tax/VAT, website, activity category, status.

Factory:

- Company ID, plant name, address, map location, country, city, production lines, annual volume, activity category, specific activities, license documents, layout, process flow, existing certificates, halal assurance documents, status.

Product:

- Factory ID, product name, brand, category, SKU/barcode, HS code, packaging, label artwork, ingredients, processing aids, suppliers, markets, certification status.

Ingredient/material:

- Product ID, material name, supplier, source type, halal certificate/specification, certificate expiry, risk level, animal-derived flag, alcohol flag, status.

Application:

- Application number, company, factory, products, type, scheme/standard, target market, status, submitted snapshot, assigned people, payment, agreement, timestamps.

Audit:

- Application ID, audit plan, audit team, criteria, checklist, findings, evidence, nonconformities, report, corrective actions, status.

Certificate:

- Certificate number, application, company, factory, products/scope, standard, issue/expiry, status, QR key, PDF/version, public verification fields.

Shipment:

- Shipment request number, certificate reference, products, lots/batches, invoice, packing list, transport document, destination, importer, port, status, issued document.

Quality/accreditation:

- HCB accreditation scopes, recognized markets, auditor competence, conflict-of-interest records, impartiality declarations, complaints, appeals, internal audits, management reviews.

## Recommended Application Status Model

Use explicit stages:

- DRAFT
- SUBMITTED
- APPLICATION_REVIEW
- INFORMATION_REQUESTED
- QUOTED
- PAYMENT_PENDING
- AGREEMENT_PENDING
- AUDIT_PLANNING
- AUDIT_SCHEDULED
- AUDIT_IN_PROGRESS
- NONCONFORMITY_RESPONSE_PENDING
- CORRECTIVE_ACTION_REVIEW
- TECHNICAL_REVIEW
- HALAL_REVIEW
- CERTIFICATION_DECISION
- APPROVED
- CERTIFICATE_ISSUED
- REJECTED
- SUSPENDED
- WITHDRAWN
- EXPIRED
- RENEWAL_DUE

The current frontend already has a useful lifecycle, but it should be refined to make technical review, halal review, decision, certificate issued, surveillance, suspension, withdrawal, and renewal more explicit.

## UI/UX Implementation Principles

- Customer registration should capture company-level details only.
- Factory registration should capture factory-specific operations, activity category, specific activities, licenses, location, factory documents, and production capacity.
- Product pages should capture product, ingredient, supplier, packaging, label, and market data.
- Application pages should connect company + one factory + product scope + scheme/standard + target market.
- Office/admin pages should be workflow dashboards, not generic CRUD pages.
- Every decision should have an audit trail.
- Every document should have status, owner, uploaded date, expiry date where relevant, and review result.
- Do not hide certification-critical data inside generic notes fields.
- Avoid allowing users to issue certificates from an incomplete application file.

## What Is Left To Build Or Improve

High priority:

- Real backend integration for customer registration, factory registration, product registration, application submission, document uploads, audit planning, audit findings, corrective actions, decisions, and certificates.
- Strong role-based access control for HCB roles, customer roles, auditors, reviewers, decision makers, finance, and admins.
- Application review checklist and completeness gate.
- Document management with required-document templates per scheme/category/market.
- Factory-specific specific activities, already started in the frontend.
- Product and ingredient halal-risk workflow.
- Audit planning and checklist module.
- Nonconformity and corrective-action workflow.
- Independent technical review and halal/Shariah review stage.
- Certification decision screen separated from audit entry.
- Certificate generator with QR verification and public certificate lookup.
- Certificate status lifecycle: active, suspended, withdrawn, expired, renewed.
- Audit trail/event log for every status, assignment, document review, finding, decision, and certificate change.

Medium priority:

- Accreditation scope management for the HCB by standard, category, country, and product type.
- Auditor competence matrix and conflict-of-interest declarations.
- Fee quotation, invoice, and payment tracking.
- Agreement/contract workflow and halal mark/logo usage conditions.
- Renewal reminders and surveillance audit scheduler.
- Complaint and appeal workflows.
- Label/artwork approval workflow.
- Supplier certificate expiry tracking.
- Batch/lot traceability support.
- Product extension/change request workflow.
- Dashboard metrics for office operations and customer status.

Shipment/export support:

- Shipment certificate/request module.
- Link shipments only to active certificates and approved product scope.
- Capture invoice, packing list, bill of lading/airway bill, container/seal, batch/lot, production/expiry dates, importer, destination country, and port.
- Destination-country rules checklist.
- Shipment document pack generator.
- QR or verification page for shipment certificates if the HCB issues them.

Quality/accreditation support:

- HCB quality manual records.
- Impartiality committee records.
- Internal audit and management review records.
- Complaints and appeals registers.
- Personnel training and competence records.
- Controlled templates/forms for applications, audits, decisions, certificates, and reports.

Technical foundation:

- Replace demo/localStorage persistence with API-backed persistence.
- Add validation schemas shared between frontend and backend where practical.
- Add file storage for documents and generated certificates.
- Add database migrations for missing entities.
- Add tests around status transitions and permissions.
- Add seed/demo data for HCB workflows.
- Fix existing TypeScript build errors unrelated to this document.

## Implementation Rule For Future Prompts

Before implementing new features in this project, check this file and align the feature with the HCB certification workflow above. If a user request conflicts with this reference, ask whether the request is an intentional exception or update this file first.

## Implementation Notes

2026-09-15:

- Added office system settings for editable certificate template text, certificate number prefix, validity months, signatory, and footer note.
- Added editable audit templates for manufacturing, slaughterhouse, and logistics/warehousing tracks. These tracks are the starter audit process until the user adds more questions or track types.
- Added the audit-process overview to the office audit screen so HCB staff can see the correct audit path before opening application work.
