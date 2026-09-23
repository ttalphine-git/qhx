import { CHECKLISTS, type AuditType } from "./uploaded-audit/checklists"

export interface CertificateTemplateSettings {
  logoDataUrl?: string
  signatureDataUrl?: string
  sourceTemplateDataUrl?: string
  sourceTemplateName?: string
  sourceTemplateMime?: string
  pageCount?: number
  placedFields?: { id: string; key: string; label: string; page?: number; x: number; y: number; w?: number; h?: number; fontSize?: number }[]
  bodyTitle: string
  certificatePrefix: string
  issuingBodyName: string
  accreditationLine: string
  standardLine: string
  validityMonths: string
  signatoryName: string
  signatoryTitle: string
  footerNote: string
  customFields: { id: string; label: string; value: string }[]
}

export interface AuditTrack {
  dbId?: number
  id: string
  name: string
  reportTitle?: string
  appliesTo: string
  activityCategoryKeys?: string[]
  riskLevel: "Standard" | "High" | "Critical"
  formCode?: string
  revision?: string
  stages: string[]
  questions: string[]
}

export const CERTIFICATE_TEMPLATE_STORAGE_KEY = "hcs_certificate_template_settings"
export const AUDIT_TRACKS_STORAGE_KEY = "hcs_audit_tracks"

const flattenChecklistQuestions = (type: AuditType): string[] =>
  CHECKLISTS[type].parts.flatMap(part =>
    part.sections.flatMap(section =>
      section.qs.map(([number, text, note]) => {
        const label = `${section.id}.${number}`
        return note ? `${label} ${text} (${note})` : `${label} ${text}`
      })
    )
  )

const checklistMeta = (type: AuditType) => ({
  reportTitle: `${CHECKLISTS[type].short} Audit Report`,
  formCode: CHECKLISTS[type].form,
  revision: CHECKLISTS[type].rev,
})

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateSettings = {
  logoDataUrl: "",
  signatureDataUrl: "",
  sourceTemplateDataUrl: "",
  sourceTemplateName: "",
  sourceTemplateMime: "",
  pageCount: 1,
  placedFields: [],
  bodyTitle: "Halal Factory Certification",
  certificatePrefix: "HCB-HAL",
  issuingBodyName: "Halal Certification Body",
  accreditationLine: "Issued under the approved halal certification scheme and applicable accreditation scope.",
  standardLine: "Certification criteria: GSO 2055-1 / OIC-SMIIC 1 / applicable market halal standard.",
  validityMonths: "12",
  signatoryName: "Authorized Signatory",
  signatoryTitle: "Certification Decision Authority",
  footerNote: "This certificate remains property of the issuing HCB and is valid only for the listed factory, products, scope, and validity period.",
  customFields: [
    { id: "scheme", label: "Scheme", value: "Factory Halal Certification" },
    { id: "audit-type", label: "Audit Type", value: "Manufacturing Audit" },
  ],
}

export const DEFAULT_AUDIT_TRACKS: AuditTrack[] = [
  {
    id: "manufacturing",
    name: "Manufacturing Audit",
    ...checklistMeta("manufacturing"),
    appliesTo: "Food, beverages, cosmetics, pharmaceuticals, ingredients, packaging, and general production factories",
    activityCategoryKeys: ["mfg"],
    riskLevel: "High",
    stages: [
      "Document review",
      "Audit planning",
      "Opening meeting",
      "Site and process inspection",
      "Ingredient and supplier verification",
      "Traceability and label review",
      "Nonconformity closure",
      "Technical and halal review",
    ],
    questions: flattenChecklistQuestions("manufacturing"),
  },
  {
    id: "slaughterhouse",
    name: "Slaughterhouse Audit",
    ...checklistMeta("slaughterhouse"),
    appliesTo: "Poultry, meat, abattoir, deboning, cutting, chilling, freezing, and animal-origin processing sites",
    activityCategoryKeys: ["slaughter"],
    riskLevel: "Critical",
    stages: [
      "Animal/source eligibility review",
      "Slaughter team competence check",
      "Stunning and slaughter observation",
      "Line segregation and carcass control",
      "Post-slaughter handling review",
      "Traceability and dispatch review",
      "Nonconformity closure",
      "Shariah and technical decision review",
    ],
    questions: flattenChecklistQuestions("slaughterhouse"),
  },
  {
    id: "meatprocessing",
    name: "Meat Processing Audit",
    ...checklistMeta("meatprocessing"),
    appliesTo: "Meat processing, cutting, deboning, packing, chilling, freezing, and animal-origin product facilities",
    activityCategoryKeys: ["meat-processing"],
    riskLevel: "Critical",
    stages: [
      "Document review",
      "Audit planning",
      "Opening meeting",
      "Site and process inspection",
      "Raw meat and supplier verification",
      "Segregation and traceability review",
      "Nonconformity closure",
      "Shariah and technical decision review",
    ],
    questions: flattenChecklistQuestions("meatprocessing"),
  },
  {
    id: "logistics",
    name: "Logistics and Warehousing Audit",
    reportTitle: "Logistics and Warehousing Audit Report",
    appliesTo: "Storage, cold chain, transport, import/export handling, distribution, and warehousing facilities",
    activityCategoryKeys: [],
    riskLevel: "Standard",
    stages: [
      "Service scope review",
      "Warehouse and vehicle inspection",
      "Segregation and temperature-control review",
      "Cleaning and contamination-control review",
      "Document and shipment traceability review",
      "Nonconformity closure",
      "Certification review",
    ],
    questions: [
      "Are halal goods identified and segregated from non-halal or doubtful goods?",
      "Are vehicles, containers, cold rooms, and storage areas cleaned and controlled before halal use?",
      "Are temperature, seal, container, delivery, and transfer records maintained where applicable?",
      "Can each shipment be traced from receiving through storage and dispatch?",
      "Are subcontracted transport or storage providers controlled by approved procedures?",
    ],
  },
]

export function loadCertificateTemplate(): CertificateTemplateSettings {
  try {
    return { ...DEFAULT_CERTIFICATE_TEMPLATE, ...JSON.parse(localStorage.getItem(CERTIFICATE_TEMPLATE_STORAGE_KEY) || "{}") }
  } catch {
    return DEFAULT_CERTIFICATE_TEMPLATE
  }
}

export function loadAuditTracks(): AuditTrack[] {
  try {
    const stored = JSON.parse(localStorage.getItem(AUDIT_TRACKS_STORAGE_KEY) || "[]") as AuditTrack[]
    if (stored.length > 0) {
      return stored.map(track => {
        const fallback = DEFAULT_AUDIT_TRACKS.find(item => item.id === track.id)
        const shouldUseUploadedQuestions = Boolean(fallback?.formCode && !track.formCode && track.questions.length <= 5)
        return {
          ...track,
          reportTitle: track.reportTitle ?? fallback?.reportTitle ?? track.name,
          activityCategoryKeys: track.activityCategoryKeys ?? fallback?.activityCategoryKeys ?? [],
          formCode: track.formCode ?? fallback?.formCode,
          revision: track.revision ?? fallback?.revision,
          questions: shouldUseUploadedQuestions ? fallback!.questions : track.questions,
        }
      })
    }
    return DEFAULT_AUDIT_TRACKS
  } catch {
    return DEFAULT_AUDIT_TRACKS
  }
}
