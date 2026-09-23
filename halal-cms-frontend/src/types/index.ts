// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string }
export interface AuthResponse {
  accessToken: string; refreshToken: string; expiresIn: number;
  userId: string; email: string; role: string; fullName: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface UserDto {
  id: string; email: string; name: string; role: string; status: string
  createdAt: string; phone?: string; organization?: string; country?: string
  jobTitle?: string; department?: string; employmentType?: string; idProofNumber?: string; notes?: string
  idDocName?: string; idDocData?: string; photoData?: string
}
export interface UserProfileDto extends UserDto { companyInfo?: CompanyInformationDTO }
export interface UserListDto extends UserDto { important?: boolean }

// ─── Applications ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW'
  | 'AGREEMENT_PENDING' | 'AGREEMENT_REVIEW'
  | 'PENDING_PAYMENT' | 'PAYMENT_REVIEW'
  | 'AUDIT_SCHEDULED' | 'DOCUMENT_SUBMISSION'
  | 'AUDIT_IN_PROGRESS' | 'AUDIT_COMPLETED'
  | 'NC_CLEARANCE' | 'DECISION_MAKING'
  | 'CERTIFICATION_REVIEW' | 'CERTIFIED'
  | 'REJECTED' | 'SUSPENDED' | 'EXPIRED'

export type ApplicationType = 'NEW' | 'RENEWAL' | 'EXTENSION'

export interface ApplicationResponseDTO {
  id: number; applicationNumber: string; status: ApplicationStatus; type: ApplicationType
  companyName: string; createdAt: string; updatedAt: string; submittedAt?: string
  userId: number; assignedAuditorId?: number; assignedAuditorName?: string
  halalStandard?: string; country?: string; productCount?: number
  payloadJson?: string
}
export interface ApplicationSmallResponseDTO {
  id: number; applicationNumber: string; status: ApplicationStatus; companyName: string
}
export interface ApplicationsPageableDTO {
  content: ApplicationResponseDTO[]; totalElements: number; totalPages: number; page: number; size: number
}
export interface CompanyInformationDTO {
  companyName: string; registrationNumber: string; address: string
  city: string; country: string; phone: string; email: string
  website?: string; industry?: string
  companyType?: string; businessLicenseNo?: string; licenseExpiry?: string
  issuingAuthority?: string; vatSstNo?: string
}
export interface ServiceInformationDTO {
  serviceType: string; description: string; halalStandard: string; productCategories: string[]
}

// ─── Audits ───────────────────────────────────────────────────────────────────
export type AuditCategory = 'F1' | 'F2' | 'COMPLIANCE'
export type AuditPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AuditStatusResponse {
  applicationId: number; currentPhase: string
  f1Started: boolean; f1Completed: boolean; f2Started: boolean; f2Completed: boolean
  complianceAssigned: boolean; certificationFinalized: boolean
}
export interface ApplicationAuditResponse {
  id: number; applicationId: number; auditorId?: number; auditorName?: string
  scheduledDate?: string; durationDays?: number; scope?: string; status: string
}
export interface NonConformityResponse {
  id: number; applicationId: number; category: string; description: string
  severity: string; status: string; createdAt: string; updatedAt: string; resolvedAt?: string
}
export interface RecommendationResponse {
  id: number; applicationId: number; text: string; priority: AuditPriority
  createdAt: string; createdBy: string
}
export interface AuditEventLog {
  id: number; applicationId: number; event: string; description: string
  performedBy: string; performedAt: string; oldStatus?: string; newStatus?: string
  metadata?: Record<string, string>
}
export interface AuditEventLogsResponseDto {
  content: AuditEventLog[]; totalElements: number; totalPages: number; page: number; size: number
}

// ─── Certificates ─────────────────────────────────────────────────────────────
export interface CertificateDto {
  id: number; key: string; applicationId: number; companyName: string
  certificateNumber: string; issueDate: string; expiryDate: string
  status: string; halalStandard: string; products?: string[]; issuedBy?: string
}
export interface CertificatesPageableDTO {
  content: CertificateDto[]; totalElements: number; totalPages: number; page: number; size: number
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface PendingTaskItem {
  id: number; applicationId: number; applicationNumber: string; companyName: string
  taskType: string; status: ApplicationStatus; priority: AuditPriority
  dueDate?: string; description: string; assignedTo?: string
}
export interface PendingTaskDto {
  content: PendingTaskItem[]; totalElements: number; totalPages: number
}
export interface UpcomingAudit {
  applicationId: number; applicationNumber: string; companyName: string
  scheduledDate: string; auditorName: string; category: AuditCategory; durationDays: number
}
export interface UpcomingAuditsResultDto {
  content: UpcomingAudit[]; totalElements: number; totalPages: number
}
export interface ApplicationStageCount { status: ApplicationStatus; count: number }
export interface ApplicationStagesResultDto { stages: ApplicationStageCount[]; total: number }
export interface MonthlyData { month: string; value: number }
export interface MonthlyRevenueDto { data: MonthlyData[]; total: number }

// ─── Documents ────────────────────────────────────────────────────────────────
export interface UserDocumentDto {
  id: number; filename: string; description?: string; uploadedAt: string; url?: string
}
export interface UserDocumentsDto { documents: UserDocumentDto[] }

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export interface ApplicationPaymentStatusDto {
  applicationId: number; paymentRequired: boolean; paymentStatus: PaymentStatus
  amount?: number; currency?: string; reference?: string
}

// ─── HCB Roles ────────────────────────────────────────────────────────────────
export type HCBRole =
  | 'ADMIN' | 'AUDITOR' | 'REVIEWER' | 'OFFICER'
  | 'DECISION_MAKER' | 'FINANCE' | 'HALAL_REVIEWER'
  | 'AUDIT_PLANNER' | 'CERTIFICATE_CONTROLLER' | 'QUALITY_MANAGER'

// ─── Local workflow types (localStorage-backed) ────────────────────────────
export interface LocalApplicationReview {
  reviewer: string; reviewedAt: string
  decision: 'ACCEPT' | 'REQUEST_INFO' | 'REJECT' | 'PENDING'
  notes: string; eligibilityConfirmed: boolean
  documentsComplete: boolean; scopeValid: boolean
  missingItems: string; infoRequested: string
}

export interface LocalAuditPlanDetail {
  auditTrack: string; plannedDate: string; durationDays: string
  leadAuditor: string; additionalAuditors: string
  halalExpert: string; technicalExpert: string
  conflictChecked: boolean; impartialityConfirmed: boolean
  scope: string; criteria: string; agenda: string
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED'
}

export interface LocalCorrectiveAction {
  rootCause: string; correction: string; correctiveAction: string
  evidence: string; targetDate: string; submittedBy: string
  reviewStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED'; reviewNotes: string
}

export interface LocalNonConformity {
  id: string; clause: string; description: string
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION'
  evidence: string; raisedBy: string; raisedAt: string
  status: 'OPEN' | 'RESPONSE_SUBMITTED' | 'ACCEPTED' | 'CLOSED'
  ca?: LocalCorrectiveAction
}

export interface LocalTechnicalReview {
  reviewer: string; reviewDate: string
  fileComplete: boolean; auditReportReviewed: boolean
  ncClosed: boolean; productStatusOk: boolean; labelReviewed: boolean
  technicalNotes: string; opinion: 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | ''
}

export interface LocalHalalReview {
  reviewer: string; reviewDate: string
  ingredientStatus: 'ACCEPTABLE' | 'CONDITIONAL' | 'NOT_ACCEPTABLE' | ''
  slaughterNotes: string; alcoholNotes: string; animalDerivNotes: string
  religiousNotes: string; opinion: 'RECOMMENDED' | 'CONDITIONAL' | 'NOT_RECOMMENDED' | ''
  conditions: string
}

export interface LocalCertDecision {
  decisionMaker: string; decisionDate: string
  decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REDUCE_SCOPE' | 'MORE_EVALUATION' | ''
  basis: string; scope: string; conditions: string
  validityMonths: string; nextSurveillance: string; decisionRef: string
  certificateGenerated: boolean; certificateKey: string
}

export interface LocalCertificateTemplateSnapshot {
  logoDataUrl?: string
  signatureDataUrl?: string
  sourceTemplateDataUrl?: string
  sourceTemplateName?: string
  sourceTemplateMime?: string
  pageCount?: number
  placedFields?: { id: string; key: string; label: string; page?: number; x: number; y: number; w?: number; h?: number; fontSize?: number }[]
  bodyTitle?: string
  certificatePrefix?: string
  issuingBodyName?: string
  accreditationLine?: string
  standardLine?: string
  validityMonths?: string
  signatoryName?: string
  signatoryTitle?: string
  footerNote?: string
  customFields?: { id: string; label: string; value: string }[]
}

export interface LocalGeneratedCertificate {
  key: string; certificateNumber: string; applicationId: number
  companyName: string; factoryAddress: string; products: string
  standard: string; issueDate: string; expiryDate: string
  signatoryName: string; signatoryTitle: string; issuingBodyName: string
  scope: string; status: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | 'EXPIRED'
  template?: LocalCertificateTemplateSnapshot
}

export interface LocalShipment {
  id: string; shipmentNumber: string; certificateRef: string
  companyName: string; products: string; batches: string
  invoiceNumber: string; packingListRef: string; bolRef: string
  containerNumbers: string; sealNumbers: string
  productionDate: string; expiryDate: string
  destinationCountry: string; importerName: string
  portOfLoading: string; portOfDestination: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ISSUED' | 'REJECTED'
  createdAt: string
}

export interface AccreditationScope {
  id: string; standard: string; category: string; countries: string
  accreditationBody: string; accreditationNumber: string
  accreditationDate: string; expiryDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL'
}

export interface AuditorCompetenceRecord {
  id: string; auditorName: string; qualifications: string
  approvedSectors: string; approvedStandards: string; languages: string
  lastTrainingDate: string; competenceValidUntil: string; conflictDeclarations: string
}

export interface ComplaintRecord {
  id: string; complaintNumber: string; complainantName: string
  complainantEmail: string; category: string; description: string
  receivedAt: string; status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED'
  resolution: string; closedAt: string
}

export interface AppealRecord {
  id: string; appealNumber: string; appellantName: string
  relatedCertificate: string; grounds: string; receivedAt: string
  status: 'RECEIVED' | 'PANEL_REVIEW' | 'UPHELD' | 'DISMISSED' | 'WITHDRAWN'
  decision: string; decidedAt: string
}

export interface SurveillanceRecord {
  id: string; certificateNumber: string; companyName: string
  survType: 'ANNOUNCED' | 'UNANNOUNCED' | 'DOCUMENT_REVIEW'
  scheduledDate: string; assignedTo: string
  status: 'SCHEDULED' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'
  notes: string
}
