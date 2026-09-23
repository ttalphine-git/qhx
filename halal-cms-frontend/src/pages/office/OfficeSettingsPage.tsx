import { useMemo, useRef, useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Award,
  CreditCard,
  ClipboardCheck,
  Users,
  CheckCircle2,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  UserPlus,
  Database,
} from "lucide-react"
import toast from "react-hot-toast"
import OfficeLayout from "./OfficeLayout"
import {
  getAuditReportConfigurations,
  saveAuditReportConfigurations,
  type AuditReportConfigurationDto,
} from "@/api/audits"
import { getMgmtUsers, updateUserStatus, createEmployee, updateEmployee } from "@/api/users"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import { PRICING_STORAGE, CURRENCIES, type PricingConfig, loadPricing, getCurrencySymbol } from "@/lib/pricing"
import { loadStripeConfig, saveStripeConfig, type StripeConfig, loadBankDetails, saveBankDetails, type BankDetails } from "@/lib/billing"
import {
  CERTIFICATE_TEMPLATE_STORAGE_KEY,
  DEFAULT_AUDIT_TRACKS,
  DEFAULT_CERTIFICATE_TEMPLATE,
  type AuditTrack,
  type CertificateTemplateSettings,
  loadCertificateTemplate,
} from "@/lib/hcbWorkflow"
import {
  ACTIVITY_ICON_OPTIONS,
  DEFAULT_ACTIVITY_CATEGORY_SETTINGS,
  loadActivityCategorySettings,
  saveActivityCategorySettings,
  type ActivityCategorySetting,
  type ActivityIconKey,
} from "@/lib/activityOptions"
import {
  createAccreditationScope,
  deleteAccreditationScope,
  getAccreditationScopes,
  getDatabaseRows,
  getDatabaseTables,
  updateAccreditationScope,
  type DatabaseTable,
} from "@/api/system"

type SettingsTab = "certificate" | "audits" | "employees" | "scope" | "activity" | "pricelist" | "agreement" | "payments" | "database"

const SYSTEM_DATABASES = [
  "halalcms_auth",
  "halalcms_companies",
  "halalcms_applications",
  "halalcms_certificates",
  "halalcms_inspections",
  "halalcms_notifications",
]

// ── Agreement Template (multi-language) ───────────────────────────────────────
const AGR_STORAGE = "hcs_agreement_pdfs"
interface AgreementPdf { fileName: string; pdfData: string }
type AgreementPdfs = Record<string, AgreementPdf>

const AGR_LANGUAGES = [
  { code: "en",    label: "English",              flag: "🇬🇧" },
  { code: "ar",    label: "Arabic",               flag: "🇸🇦" },
  { code: "ms",    label: "Malay",                flag: "🇲🇾" },
  { code: "id",    label: "Indonesian",           flag: "🇮🇩" },
  { code: "tr",    label: "Turkish",              flag: "🇹🇷" },
  { code: "fr",    label: "French",               flag: "🇫🇷" },
  { code: "de",    label: "German",               flag: "🇩🇪" },
  { code: "ur",    label: "Urdu",                 flag: "🇵🇰" },
  { code: "zh",    label: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)",flag: "🇹🇼" },
  { code: "es",    label: "Spanish",              flag: "🇪🇸" },
  { code: "pt",    label: "Portuguese",           flag: "🇧🇷" },
  { code: "ru",    label: "Russian",              flag: "🇷🇺" },
  { code: "ja",    label: "Japanese",             flag: "🇯🇵" },
  { code: "ko",    label: "Korean",               flag: "🇰🇷" },
  { code: "th",    label: "Thai",                 flag: "🇹🇭" },
  { code: "bn",    label: "Bengali",              flag: "🇧🇩" },
  { code: "hi",    label: "Hindi",                flag: "🇮🇳" },
  { code: "nl",    label: "Dutch",                flag: "🇳🇱" },
  { code: "it",    label: "Italian",              flag: "🇮🇹" },
]
function loadAgreementPdfs(): AgreementPdfs {
  try { return JSON.parse(localStorage.getItem(AGR_STORAGE) || "{}") } catch { return {} }
}
function saveAgreementPdfs(pdfs: AgreementPdfs) {
  localStorage.setItem(AGR_STORAGE, JSON.stringify(pdfs))
}

// ── HCB Accreditation types ────────────────────────────────────────────────────
interface HCBAccreditation {
  id: string
  body: string
  standard: string
  certNumber: string
  scope: string
  country: string
  issueDate: string
  expiryDate: string
  certFileData?: string
  certFileName?: string
  notes: string
  unitPrice?: number
}

const ACC_COUNTRIES = [
  "Malaysia","Indonesia","United Arab Emirates","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman","Jordan","Egypt",
  "Turkey","Pakistan","Bangladesh","India","Singapore","Brunei","Philippines","United Kingdom","Germany","France",
  "Netherlands","Belgium","Switzerland","United States","Canada","Australia","South Africa","Morocco","Nigeria","Others",
]

const ACC_BODY_LIST = [
  { abbr: "EIAC",           full: "Emirates International Accreditation Centre",         country: "UAE",          countryFull: "United Arab Emirates", iso: "ae" },
  { abbr: "UKAS",           full: "United Kingdom Accreditation Service",                 country: "UK",           countryFull: "United Kingdom",        iso: "gb" },
  { abbr: "DAkkS",          full: "Deutsche Akkreditierungsstelle",                       country: "Germany",      countryFull: "Germany",               iso: "de" },
  { abbr: "COFRAC",         full: "Comité Français d'Accréditation",                     country: "France",       countryFull: "France",                iso: "fr" },
  { abbr: "RvA",            full: "Raad voor Accreditatie",                               country: "Netherlands",  countryFull: "Netherlands",           iso: "nl" },
  { abbr: "JAKIM",          full: "Jabatan Kemajuan Islam Malaysia",                      country: "Malaysia",     countryFull: "Malaysia",              iso: "my" },
  { abbr: "MUI",            full: "Majelis Ulama Indonesia",                              country: "Indonesia",    countryFull: "Indonesia",             iso: "id" },
  { abbr: "ESMA",           full: "Emirates Authority for Standardization & Metrology",   country: "UAE",          countryFull: "United Arab Emirates",  iso: "ae" },
  { abbr: "GSO",            full: "Gulf Standardization Organization",                    country: "GCC",          countryFull: "Saudi Arabia",          iso: "sa" },
  { abbr: "SASO",           full: "Saudi Standards, Metrology & Quality Organization",    country: "Saudi Arabia", countryFull: "Saudi Arabia",          iso: "sa" },
  { abbr: "BSI",            full: "British Standards Institution",                        country: "UK",           countryFull: "United Kingdom",        iso: "gb" },
  { abbr: "TÜV SÜD",       full: "TÜV SÜD AG",                                          country: "Germany",      countryFull: "Germany",               iso: "de" },
  { abbr: "Bureau Veritas", full: "Bureau Veritas",                                       country: "France",       countryFull: "France",                iso: "fr" },
  { abbr: "SGS",            full: "SGS SA",                                               country: "Switzerland",  countryFull: "Switzerland",           iso: "ch" },
  { abbr: "Intertek",       full: "Intertek Group",                                       country: "UK",           countryFull: "United Kingdom",        iso: "gb" },
]

const ACC_STANDARD_LIST = [
  { code: "ISO/IEC 17065",  full: "ISO/IEC 17065:2012", desc: "Bodies certifying products, processes and services" },
  { code: "ISO/IEC 17021",  full: "ISO/IEC 17021-1:2015", desc: "Audit and certification of management systems" },
  { code: "ISO/IEC 17020",  full: "ISO/IEC 17020:2012", desc: "Bodies performing inspection" },
  { code: "ISO/IEC 17025",  full: "ISO/IEC 17025:2017", desc: "Testing and calibration laboratories" },
  { code: "ISO 9001",       full: "ISO 9001:2015", desc: "Quality management systems" },
  { code: "ISO 22000",      full: "ISO 22000:2018", desc: "Food safety management systems" },
  { code: "FSSC 22000",     full: "FSSC 22000 v6", desc: "Food Safety System Certification" },
  { code: "GSO 2055-1",     full: "GSO 2055-1:2015", desc: "Halal food — General requirements" },
  { code: "GSO 2055-2",     full: "GSO 2055-2:2015", desc: "Halal food — Management system" },
  { code: "OIC/SMIIC 1",   full: "OIC/SMIIC 1:2019", desc: "Halal food — General guidelines" },
  { code: "MS 1500",        full: "MS 1500:2019", desc: "Halal food — Production, handling and storage" },
  { code: "HAS 23000",      full: "HAS 23000", desc: "Indonesian Halal Assurance System (MUI)" },
]

function accDaysLeft(expiryDate: string): number {
  if (!expiryDate) return 9999
  return Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000)
}
function accStatusBadge(days: number) {
  if (days < 0)   return { label: "Expired",         bg: "#fee2e2", color: "#dc2626", border: "#fecaca" }
  if (days <= 30) return { label: "Expiring Soon",   bg: "#fef3c7", color: "#d97706", border: "#fde68a" }
  if (days <= 90) return { label: "Due for Renewal", bg: "#fef9c3", color: "#ca8a04", border: "#fef08a" }
  return                  { label: "Active",          bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" }
}
const ACC_STORAGE = "hcs_hcb_accreditations"
function loadAccreditations(): HCBAccreditation[] {
  try { return JSON.parse(localStorage.getItem(ACC_STORAGE) || "[]") } catch { return [] }
}
function normalizeAccreditation(row: Partial<HCBAccreditation> & { id: string | number }): HCBAccreditation {
  return {
    id: String(row.id),
    body: row.body || "",
    standard: row.standard || "",
    certNumber: row.certNumber || "",
    scope: row.scope || "",
    country: row.country || "",
    issueDate: row.issueDate || "",
    expiryDate: row.expiryDate || "",
    certFileData: row.certFileData || "",
    certFileName: row.certFileName || "",
    notes: row.notes || "",
    unitPrice: Number(row.unitPrice || 0),
  }
}

const ROLES = [
  "ADMIN", "AUDITOR", "SHARIA_AUDITOR", "REVIEWER", "OFFICER",
  "DECISION_MAKER", "FINANCE", "HALAL_REVIEWER",
  "AUDIT_PLANNER", "CERTIFICATE_CONTROLLER", "QUALITY_MANAGER",
]

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  SUPER_ADMIN:            { bg: "#1e1b4b", color: "#c7d2fe" },
  OFFICE_ADMIN:           { bg: "#fde7e9", color: "#d13438" },
  OFFICE_INSPECTOR:       { bg: "#e5f4f0", color: "#005e4e" },
  OFFICE_REVIEWER:        { bg: "#f0e6f6", color: "#6b4fa0" },
  CUSTOMER:               { bg: "#f0f9ff", color: "#0369a1" },
  ADMIN:                  { bg: "#fde7e9", color: "#d13438" },
  AUDITOR:                { bg: "#e5f0ff", color: "#004ea8" },
  SHARIA_AUDITOR:         { bg: "#e6f4e8", color: "#156b20" },
  REVIEWER:               { bg: "#f0e6f6", color: "#6b4fa0" },
  OFFICER:                { bg: "#e5f4f0", color: "#005e4e" },
  DECISION_MAKER:         { bg: "#e8f0fe", color: "#1a56db" },
  FINANCE:                { bg: "#fff8e5", color: "#8a6000" },
  HALAL_REVIEWER:         { bg: "#e6f4e8", color: "#156b20" },
  AUDIT_PLANNER:          { bg: "#e0f0ff", color: "#0057a3" },
  CERTIFICATE_CONTROLLER: { bg: "#dcfce7", color: "#15803d" },
  QUALITY_MANAGER:        { bg: "#fef3e5", color: "#7a4500" },
}

const CERT_FIELD_PALETTE = [
  { key: "frame", label: "Decorative Frame", sample: "Certificate border", group: "Layout", w: 92, h: 92, fontSize: 12 },
  { key: "logo", label: "Logo", sample: "Uploaded logo", group: "Brand", w: 12, h: 10, fontSize: 12 },
  { key: "heading", label: "Main Heading", sample: "HALAL CERTIFICATE", group: "Text", w: 46, h: 6, fontSize: 24 },
  { key: "subtitle", label: "Subtitle", sample: "Awarded to:", group: "Text", w: 34, h: 4, fontSize: 18 },
  { key: "smallText", label: "Small Text", sample: "Small certificate note", group: "Text", w: 38, h: 4, fontSize: 8 },
  { key: "certificateNumber", label: "Certificate Number", sample: "HCB-HAL-2026-0001" },
  { key: "companyName", label: "Company Name", sample: "Client Company Sdn. Bhd." },
  { key: "factoryAddress", label: "Factory Address", sample: "Factory Address, City, Country" },
  { key: "scope", label: "Certification Scope", sample: "Manufacturing of halal certified products" },
  { key: "standard", label: "Halal Standard", sample: "OIC/SMIIC 1:2019" },
  { key: "productsTable", label: "Products Table", sample: "Product | Category | Brand", group: "Tables", w: 72, h: 14, fontSize: 11 },
  { key: "issueDate", label: "Issue Date", sample: "15 Sep 2026" },
  { key: "expiryDate", label: "Expiry Date", sample: "14 Sep 2027" },
  { key: "signatoryName", label: "Signatory Name", sample: "Authorized Signatory" },
  { key: "signatoryTitle", label: "Signatory Title", sample: "Certification Decision Authority" },
  { key: "signature", label: "Signature Image", sample: "Uploaded signature", group: "Approval", w: 24, h: 8, fontSize: 12 },
  { key: "qrCode", label: "QR Code", sample: "QR CODE", group: "Verification", w: 12, h: 10, fontSize: 13 },
  { key: "footerNote", label: "Footer Note", sample: "Certificate validity note", group: "Text", w: 76, h: 8, fontSize: 10 },
]
const CERT_BLUE = "#0f2170"

const auditDtoToTrack = (config: AuditReportConfigurationDto): AuditTrack => ({
  dbId: config.id,
  id: config.id ? `db-${config.id}` : config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name: config.name,
  reportTitle: config.reportTitle,
  appliesTo: config.appliesTo,
  activityCategoryKeys: config.activityCategoryKeys ?? [],
  riskLevel: config.riskLevel,
  formCode: config.formCode,
  revision: config.revision,
  stages: config.stages ?? [],
  questions: (config.questions ?? []).map(question => question.questionText),
})

const auditTrackToDto = (track: AuditTrack, sortOrder: number): AuditReportConfigurationDto => ({
  id: track.dbId,
  name: track.name,
  reportTitle: track.reportTitle || track.name,
  appliesTo: track.appliesTo,
  activityCategoryKeys: track.activityCategoryKeys ?? [],
  riskLevel: track.riskLevel,
  formCode: track.formCode,
  revision: track.revision,
  stages: track.stages,
  active: true,
  sortOrder,
  questions: track.questions.map((questionText, index) => ({ questionText, sortOrder: index })),
})

export default function OfficeSettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<SettingsTab>((searchParams.get("tab") as SettingsTab) || "certificate")
  useEffect(() => {
    const t = searchParams.get("tab") as SettingsTab | null
    if (t) setTab(t)
  }, [searchParams])
  const [template, setTemplate] = useState<CertificateTemplateSettings>(loadCertificateTemplate)
  const [auditTracks, setAuditTracks] = useState<AuditTrack[]>(DEFAULT_AUDIT_TRACKS)
  const [saved, setSaved] = useState("")
  const [draggingField, setDraggingField] = useState(false)
  const [activeCertPage, setActiveCertPage] = useState(1)
  const [selectedFieldId, setSelectedFieldId] = useState("")
  const [dbSearch, setDbSearch] = useState("")
  const [selectedDbTable, setSelectedDbTable] = useState("")
  const [dbRowsPage, setDbRowsPage] = useState(0)
  const [dbRowsSize, setDbRowsSize] = useState(50)

  // Employee management
  const qc = useQueryClient()
  const databaseQ = useQuery({
    queryKey: ["database-tables"],
    queryFn: getDatabaseTables,
    enabled: tab === "database",
  })
  const databaseTables = databaseQ.data ?? []
  const filteredDatabaseTables = databaseTables.filter(table => {
    const needle = dbSearch.trim().toLowerCase()
    if (!needle) return true
    return `${table.database ?? "halalcms_applications"}.${table.schema}.${table.name}`.toLowerCase().includes(needle)
      || table.columns.some(column => `${column.name} ${column.type}`.toLowerCase().includes(needle))
  })
  const databaseGroups = SYSTEM_DATABASES.map(database => ({
    database,
    tables: filteredDatabaseTables.filter(table => (table.database ?? "halalcms_applications") === database),
  }))
  const activeDatabaseTable: DatabaseTable | undefined =
    filteredDatabaseTables.find(table => `${table.database ?? "halalcms_applications"}.${table.schema}.${table.name}` === selectedDbTable)
    ?? filteredDatabaseTables[0]
  const activeDbKey = activeDatabaseTable ? `${activeDatabaseTable.database ?? "halalcms_applications"}.${activeDatabaseTable.schema}.${activeDatabaseTable.name}` : ""
  const databaseRowsQ = useQuery({
    queryKey: ["database-rows", activeDbKey, dbRowsPage, dbRowsSize],
    queryFn: () => getDatabaseRows(activeDatabaseTable!.database ?? "halalcms_applications", activeDatabaseTable!.schema, activeDatabaseTable!.name, dbRowsPage, dbRowsSize),
    enabled: tab === "database" && !!activeDatabaseTable,
  })
  const databaseRows = databaseRowsQ.data
  const dbTotalRows = databaseRows?.totalRows ?? activeDatabaseTable?.estimatedRows ?? 0
  const dbTotalPages = Math.max(1, Math.ceil(dbTotalRows / dbRowsSize))
  const formatDbValue = (value: unknown) => {
    if (value === null || value === undefined) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>NULL</span>
    if (typeof value === "boolean") return value ? "true" : "false"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }
  const auditConfigsQ = useQuery({
    queryKey: ["audit-report-configurations"],
    queryFn: getAuditReportConfigurations,
    enabled: tab === "audits",
  })
  const saveAuditConfigsMutation = useMutation({
    mutationFn: saveAuditReportConfigurations,
    onSuccess: data => {
      const next = data.length ? data.map(auditDtoToTrack) : DEFAULT_AUDIT_TRACKS
      setAuditTracks(next)
      qc.invalidateQueries({ queryKey: ["audit-report-configurations"] })
      setSaved("Audit templates saved to database")
      window.setTimeout(() => setSaved(""), 1800)
    },
    onError: () => toast.error("Failed to save audit templates to database"),
  })
  useEffect(() => {
    if (tab !== "audits" || !auditConfigsQ.data) return
    if (auditConfigsQ.data.length === 0 && !saveAuditConfigsMutation.isPending) {
      saveAuditConfigsMutation.mutate(DEFAULT_AUDIT_TRACKS.map(auditTrackToDto))
      return
    }
    const next = auditConfigsQ.data.length ? auditConfigsQ.data.map(auditDtoToTrack) : DEFAULT_AUDIT_TRACKS
    setAuditTracks(next)
  }, [tab, auditConfigsQ.data, saveAuditConfigsMutation.isPending])
  const [empSearch, setEmpSearch] = useState("")
  const [empRole, setEmpRole] = useState("")
  const [empPage, setEmpPage] = useState(0)
  const { data: empData, isLoading: empLoading, isRefetching: empRefetching, refetch: empRefetch, isError: empError } = useQuery({
    queryKey: ["users", { page: empPage, search: empSearch, roleFilter: empRole }],
    queryFn: () => getMgmtUsers({ page: empPage, size: 20, search: empSearch || undefined, filterByRole: empRole || undefined }),
    enabled: tab === "employees",
  })
  const empUsers = empData?.content ?? []
  const empTotal = empData?.totalElements ?? 0
  const { mutate: toggleStatus, isPending: statusPending } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateUserStatus(String(id), { status }),
    onSuccess: u => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(`User ${u.status === "ACTIVE" ? "activated" : "suspended"}`)
    },
    onError: () => toast.error("Failed to update user status"),
  })

  // Add Employee
  const [showAddEmp, setShowAddEmp]     = useState(false)
  const emptyEmpForm = () => ({
    name: "", email: "", password: "", role: "OFFICER",
    employmentType: "OWN", phone: "", jobTitle: "", department: "",
    idProof: "", startDate: "", notes: "",
    idDocName: "", idDocData: "",
    photoData: ""
  })
  const empDocRef   = useRef<HTMLInputElement>(null)
  const empPhotoRef = useRef<HTMLInputElement>(null)
  const [empForm, setEmpForm]           = useState(emptyEmpForm)
  const [empFormErr, setEmpFormErr]     = useState("")
  const { mutate: addEmp, isPending: addEmpPending } = useMutation({
    mutationFn: () => createEmployee({
        name: empForm.name, email: empForm.email, password: empForm.password,
        role: empForm.role, phone: empForm.phone, employmentType: empForm.employmentType,
        jobTitle: empForm.jobTitle, department: empForm.department,
        idProof: empForm.idProof, startDate: empForm.startDate, notes: empForm.notes,
        idDocName: empForm.idDocName, idDocData: empForm.idDocData, photoData: empForm.photoData,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Employee created successfully")
      setShowAddEmp(false)
      setEmpForm(emptyEmpForm())
      setEmpFormErr("")
    },
    onError: (e: any) => setEmpFormErr(e?.response?.data?.message ?? "Failed to create employee"),
  })

  // Edit Employee
  const EMP_DOCS_KEY    = "hcs_emp_docs"
  const EMP_PHOTOS_KEY  = "hcs_emp_photos"
  const loadEmpDoc    = (id: string) => { try { return (JSON.parse(localStorage.getItem(EMP_DOCS_KEY) || "{}") as Record<string, { name: string; data: string }>)[id] ?? null } catch { return null } }
  const saveEmpDoc    = (id: string, doc: { name: string; data: string } | null) => { try { const all = JSON.parse(localStorage.getItem(EMP_DOCS_KEY) || "{}"); if (doc) all[id] = doc; else delete all[id]; localStorage.setItem(EMP_DOCS_KEY, JSON.stringify(all)) } catch {} }
  const loadEmpPhoto  = (id: string) => { try { return (JSON.parse(localStorage.getItem(EMP_PHOTOS_KEY) || "{}") as Record<string, string>)[id] ?? null } catch { return null } }
  const saveEmpPhoto  = (id: string, data: string | null) => { try { const all = JSON.parse(localStorage.getItem(EMP_PHOTOS_KEY) || "{}"); if (data) all[id] = data; else delete all[id]; localStorage.setItem(EMP_PHOTOS_KEY, JSON.stringify(all)) } catch {} }

  const emptyEditForm = () => ({ name: "", role: "", employmentType: "OWN", phone: "", jobTitle: "", department: "", idProof: "", notes: "", idDocName: "", idDocData: "", photoData: "" })
  const [editingEmp, setEditingEmp]   = useState<import("@/types").UserListDto | null>(null)
  const [editForm, setEditForm]       = useState(emptyEditForm())
  const editDocRef   = useRef<HTMLInputElement>(null)
  const editPhotoRef = useRef<HTMLInputElement>(null)

  const openEditEmp = (u: import("@/types").UserListDto) => {
    const doc   = loadEmpDoc(u.id)
    const photo = loadEmpPhoto(u.id)
    setEditForm({ name: u.name, role: u.role, employmentType: u.employmentType || "OWN", phone: u.phone || "", jobTitle: u.jobTitle || "", department: u.department || "", idProof: u.idProofNumber || "", notes: u.notes || "", idDocName: doc?.name || "", idDocData: doc?.data || "", photoData: photo || "" })
    setEditingEmp(u)
  }

  const { mutate: saveEmp, isPending: saveEmpPending } = useMutation({
    mutationFn: () => updateEmployee(editingEmp!.id, { name: editForm.name, role: editForm.role, phone: editForm.phone, employmentType: editForm.employmentType, jobTitle: editForm.jobTitle, department: editForm.department, idProof: editForm.idProof, notes: editForm.notes, idDocName: editForm.idDocName, idDocData: editForm.idDocData, photoData: editForm.photoData }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Employee updated")
      setEditingEmp(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update employee"),
  })

  const [previewFile, setPreviewFile] = useState<{ name: string; data: string } | null>(null)

  const selectedTrack = useMemo(() => auditTracks[0], [auditTracks])
  const isImageSourceTemplate = Boolean(template.sourceTemplateDataUrl && template.sourceTemplateMime?.startsWith("image/"))
  const isPdfSourceTemplate = Boolean(
    template.sourceTemplateDataUrl &&
    (template.sourceTemplateMime === "application/pdf" || template.sourceTemplateName?.toLowerCase().endsWith(".pdf"))
  )
  const useDesignerCanvas = true
  const certPageCount = Math.min(4, Math.max(1, template.pageCount ?? 1))
  const currentPageFields = (template.placedFields ?? []).filter(field => (field.page ?? 1) === activeCertPage)
  const selectedField = (template.placedFields ?? []).find(field => field.id === selectedFieldId)

  // ── Agreement Template state ──
  const [agrPdfs, setAgrPdfs] = useState<AgreementPdfs>(loadAgreementPdfs)
  const [agrLang, setAgrLang] = useState("")

  // ── Pricing config state ──
  const [pricing, setPricing] = useState<PricingConfig>(loadPricing)
  const [pricingSaved, setPricingSaved] = useState(false)
  const [stripe, setStripe] = useState<StripeConfig>(loadStripeConfig)
  const [stripeSaved, setStripeSaved] = useState(false)
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [bank, setBank] = useState<BankDetails>(loadBankDetails)
  const [bankSaved, setBankSaved] = useState(false)
  const [selectedScopeId, setSelectedScopeId] = useState<string>("")
  function savePricing(p: PricingConfig) {
    localStorage.setItem(PRICING_STORAGE, JSON.stringify(p))
    setPricing(p)
    setPricingSaved(true)
    setTimeout(() => setPricingSaved(false), 2000)
  }

  // ── HCB Accreditations state ──
  const [accreditations, setAccreditations] = useState<HCBAccreditation[]>(loadAccreditations)
  const [activityCategories, setActivityCategories] = useState<ActivityCategorySetting[]>(loadActivityCategorySettings)
  const [activityForm, setActivityForm] = useState<{ label: string; icon: ActivityIconKey }>({ label: "", icon: "factory" })
  const [activeIconPicker, setActiveIconPicker] = useState("")
  const [showAccForm, setShowAccForm] = useState(false)
  const [showBodyPicker, setShowBodyPicker] = useState(false)
  const [showStandardPicker, setShowStandardPicker] = useState(false)
  const [accViewFile, setAccViewFile] = useState<{ data: string; name: string } | null>(null)
  const emptyAccForm = (): Omit<HCBAccreditation, "id"> => ({
    body: "", standard: "", certNumber: "", scope: "", country: "", issueDate: "", expiryDate: "", certFileData: "", certFileName: "", notes: "", unitPrice: 0
  })
  const [accForm, setAccForm] = useState<Omit<HCBAccreditation, "id">>(emptyAccForm)
  const [editingAccId, setEditingAccId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const dbRows = await getAccreditationScopes()
        if (!alive) return
        if (dbRows.length > 0) {
          const rows = dbRows.map(normalizeAccreditation)
          setAccreditations(rows)
          localStorage.setItem(ACC_STORAGE, JSON.stringify(rows))
          return
        }
        const localRows = loadAccreditations()
        if (localRows.length === 0) return
        const savedRows = await Promise.all(localRows.map(row => createAccreditationScope({
          body: row.body,
          standard: row.standard,
          certNumber: row.certNumber,
          scope: row.scope,
          country: row.country,
          issueDate: row.issueDate || undefined,
          expiryDate: row.expiryDate,
          certFileData: row.certFileData,
          certFileName: row.certFileName,
          notes: row.notes,
          unitPrice: row.unitPrice || 0,
        })))
        if (!alive) return
        const rows = savedRows.map(normalizeAccreditation)
        setAccreditations(rows)
        localStorage.setItem(ACC_STORAGE, JSON.stringify(rows))
      } catch {
        setSaved("Scope database unavailable; using local copy")
        setTimeout(() => setSaved(""), 2200)
      }
    })()
    return () => { alive = false }
  }, [])

  const persistActivityCategories = (next: ActivityCategorySetting[]) => {
    setActivityCategories(next)
    saveActivityCategorySettings(next)
    setSaved("Activity categories saved")
    setTimeout(() => setSaved(""), 1800)
  }
  const slugifyActivity = (label: string) =>
    label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `activity-${Date.now()}`
  const addActivityCategory = () => {
    const label = activityForm.label.trim()
    if (!label) return
    const base = slugifyActivity(label)
    let key = base
    let i = 2
    while (activityCategories.some(c => c.key === key)) key = `${base}-${i++}`
    persistActivityCategories([...activityCategories, { key, label, icon: activityForm.icon }])
    setActivityForm({ label: "", icon: "factory" })
    setActiveIconPicker("")
  }
  const updateActivityCategory = (key: string, patch: Partial<ActivityCategorySetting>) => {
    persistActivityCategories(activityCategories.map(c => c.key === key ? { ...c, ...patch } : c))
  }
  const removeActivityCategory = (key: string) => {
    persistActivityCategories(activityCategories.filter(c => c.key !== key))
  }
  const resetActivityCategories = () => {
    persistActivityCategories(DEFAULT_ACTIVITY_CATEGORY_SETTINGS)
  }

  const saveAccreditation = async () => {
    if (!accForm.body.trim() || !accForm.expiryDate) return
    try {
      const payload = { ...accForm, issueDate: accForm.issueDate || undefined, unitPrice: accForm.unitPrice || 0 }
      const savedAcc = editingAccId
        ? await updateAccreditationScope(editingAccId, payload)
        : await createAccreditationScope(payload)
      const savedRow = normalizeAccreditation(savedAcc)
      const updated = editingAccId
        ? accreditations.map(a => a.id === editingAccId ? savedRow : a)
        : [...accreditations, savedRow]
      setAccreditations(updated)
      localStorage.setItem(ACC_STORAGE, JSON.stringify(updated))
      setAccForm(emptyAccForm())
      setEditingAccId(null)
      setShowAccForm(false)
      setSaved("Scope saved to database")
      setTimeout(() => setSaved(""), 1800)
    } catch {
      setSaved("Scope could not be saved to database")
      setTimeout(() => setSaved(""), 2200)
    }
  }
  const editAccreditation = (a: HCBAccreditation) => {
    const { id, ...rest } = a
    setAccForm(rest)
    setEditingAccId(id)
    setShowAccForm(true)
  }
  const deleteAccreditation = async (id: string) => {
    try {
      await deleteAccreditationScope(id)
      const updated = accreditations.filter(a => a.id !== id)
      setAccreditations(updated)
      localStorage.setItem(ACC_STORAGE, JSON.stringify(updated))
    } catch {
      setSaved("Scope could not be deleted from database")
      setTimeout(() => setSaved(""), 2200)
    }
  }
  const uploadAccCert = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = async ev => {
      const existing = accreditations.find(a => a.id === id)
      if (!existing) return
      const next = { ...existing, certFileData: ev.target?.result as string, certFileName: file.name }
      try {
        const savedAcc = await updateAccreditationScope(id, {
          body: next.body,
          standard: next.standard,
          certNumber: next.certNumber,
          scope: next.scope,
          country: next.country,
          issueDate: next.issueDate || undefined,
          expiryDate: next.expiryDate,
          certFileData: next.certFileData,
          certFileName: next.certFileName,
          notes: next.notes,
          unitPrice: next.unitPrice || 0,
        })
        const savedRow = normalizeAccreditation(savedAcc)
        const updated = accreditations.map(a => a.id === id ? savedRow : a)
        setAccreditations(updated)
        localStorage.setItem(ACC_STORAGE, JSON.stringify(updated))
      } catch {
        setSaved("Certificate file could not be saved to database")
        setTimeout(() => setSaved(""), 2200)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveCertificateTemplate = () => {
    localStorage.setItem(CERTIFICATE_TEMPLATE_STORAGE_KEY, JSON.stringify(template))
    setSaved("Certificate template saved")
    window.setTimeout(() => setSaved(""), 1800)
  }

  const resetCertificateTemplate = () => {
    setTemplate(DEFAULT_CERTIFICATE_TEMPLATE)
    localStorage.setItem(CERTIFICATE_TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_CERTIFICATE_TEMPLATE))
    setSaved("Certificate template reset")
    window.setTimeout(() => setSaved(""), 1800)
  }

  const setTemplateField = <K extends keyof CertificateTemplateSettings>(key: K, value: CertificateTemplateSettings[K]) => {
    setTemplate(prev => ({ ...prev, [key]: value }))
  }

  const uploadTemplateImage = (file: File | undefined, key: "logoDataUrl" | "signatureDataUrl") => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => setTemplateField(key, String(event.target?.result || ""))
    reader.readAsDataURL(file)
  }

  const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => resolve(String(event.target?.result || ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const convertCertificateTemplate = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await readAsDataUrl(file)
      const next: Partial<CertificateTemplateSettings> = {
        sourceTemplateDataUrl: dataUrl,
        sourceTemplateName: file.name,
        sourceTemplateMime: file.type,
      }
      setTemplate(prev => ({ ...prev, ...next }))
    } catch {
      toast.error("Background upload failed. Try a PDF, PNG, or JPG file.")
    }
  }

  const fieldSample = (key: string) => CERT_FIELD_PALETTE.find(field => field.key === key)?.sample ?? key

  const addCertificatePage = () => {
    setTemplate(prev => ({ ...prev, pageCount: Math.min(4, Math.max(1, prev.pageCount ?? 1) + 1) }))
    setActiveCertPage(Math.min(4, certPageCount + 1))
    setSelectedFieldId("")
  }

  const removeCertificatePage = () => {
    if (certPageCount <= 1) return
    setTemplate(prev => ({
      ...prev,
      pageCount: certPageCount - 1,
      placedFields: (prev.placedFields ?? [])
        .filter(field => (field.page ?? 1) !== activeCertPage)
        .map(field => (field.page ?? 1) > activeCertPage ? { ...field, page: (field.page ?? 1) - 1 } : field),
    }))
    setActiveCertPage(Math.max(1, activeCertPage - 1))
    setSelectedFieldId("")
  }

  const updateSelectedFontSize = (delta: number) => {
    if (!selectedFieldId) return
    setTemplate(prev => ({
      ...prev,
      placedFields: (prev.placedFields ?? []).map(field => (
        field.id === selectedFieldId
          ? { ...field, fontSize: Math.max(6, Math.min(48, (field.fontSize ?? 12) + delta)) }
          : field
      )),
    }))
  }

  const handleFieldDrop = (e: React.DragEvent<HTMLDivElement>, targetPage = activeCertPage) => {
    e.preventDefault()
    const fieldKey = e.dataTransfer.getData("fieldKey")
    const fieldId = e.dataTransfer.getData("fieldId")
    if (!fieldKey) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    const field = CERT_FIELD_PALETTE.find(item => item.key === fieldKey)
    if (!field) return

    setTemplate(prev => {
      const placedFields = prev.placedFields ?? []
      if (fieldId) {
        return {
          ...prev,
          placedFields: placedFields.map(item => item.id === fieldId ? { ...item, page: targetPage, x, y } : item),
        }
      }
      return {
        ...prev,
        placedFields: [
          ...placedFields,
          { id: `${fieldKey}-${Date.now()}`, key: field.key, label: field.label, page: targetPage, x, y, w: field.w, h: field.h, fontSize: field.fontSize ?? (field.key === "qrCode" ? 13 : 12) },
        ],
      }
    })
  }

  const removePlacedField = (id: string) => {
    setTemplate(prev => ({ ...prev, placedFields: (prev.placedFields ?? []).filter(field => field.id !== id) }))
  }

  const renderDesignerElement = (field: NonNullable<CertificateTemplateSettings["placedFields"]>[number]) => {
    if (field.key === "frame") {
      return <div style={{ width: "100%", height: "100%", border: "6px double #b88746", boxShadow: "inset 0 0 0 10px #f7ead8" }} />
    }
    if (field.key === "logo") {
      return template.logoDataUrl
        ? <img src={template.logoDataUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span>LOGO</span>
    }
    if (field.key === "signature") {
      return template.signatureDataUrl
        ? <img src={template.signatureDataUrl} alt="Signature" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <span>SIGNATURE</span>
    }
    if (field.key === "productsTable") {
      return (
        <div style={{ width: "100%", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.9)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", background: "#f8fafc", fontSize: 10, fontWeight: 800 }}>
            <span style={{ padding: 5 }}>Product</span><span style={{ padding: 5 }}>Category</span><span style={{ padding: 5 }}>Brand</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", fontSize: 10 }}>
            <span style={{ padding: 5 }}>Sample Product</span><span style={{ padding: 5 }}>Food</span><span style={{ padding: 5 }}>Client Brand</span>
          </div>
        </div>
      )
    }
    if (field.key === "qrCode") {
      return (
        <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
          {Array.from({ length: 25 }).map((_, i) => <span key={i} style={{ background: i % 3 === 0 || i < 6 || i > 18 ? "#0f172a" : "#fff" }} />)}
        </div>
      )
    }
    if (field.key === "heading") return template.bodyTitle || fieldSample(field.key)
    if (field.key === "smallText") return fieldSample(field.key)
    if (field.key === "footerNote") return template.footerNote || fieldSample(field.key)
    return fieldSample(field.key)
  }

  const addCustomField = () => {
    setTemplate(prev => ({
      ...prev,
      customFields: [...(prev.customFields ?? []), { id: Date.now().toString(), label: "New Field", value: "Value" }],
    }))
  }

  const updateCustomField = (id: string, key: "label" | "value", value: string) => {
    setTemplate(prev => ({
      ...prev,
      customFields: (prev.customFields ?? []).map(field => field.id === id ? { ...field, [key]: value } : field),
    }))
  }

  const removeCustomField = (id: string) => {
    setTemplate(prev => ({ ...prev, customFields: (prev.customFields ?? []).filter(field => field.id !== id) }))
  }

  const saveAuditTracks = (nextTracks = auditTracks) => {
    saveAuditConfigsMutation.mutate(nextTracks.map(auditTrackToDto))
  }

  const updateAuditTrack = (trackId: string, patch: Partial<AuditTrack>) => {
    setAuditTracks(prev => prev.map(track => track.id === trackId ? { ...track, ...patch } : track))
  }

  const toggleAuditTrackCategory = (trackId: string, categoryKey: string) => {
    setAuditTracks(prev => prev.map(track => {
      if (track.id !== trackId) return track
      const current = track.activityCategoryKeys ?? []
      return {
        ...track,
        activityCategoryKeys: current.includes(categoryKey)
          ? current.filter(key => key !== categoryKey)
          : [...current, categoryKey],
      }
    }))
  }

  const addAuditTrack = () => {
    const id = `audit-${Date.now()}`
    setAuditTracks(prev => ([
      ...prev,
      {
        id,
        name: "New Audit Configuration",
        reportTitle: "New Audit Report",
        appliesTo: "Describe which activities this audit report applies to",
        activityCategoryKeys: [],
        riskLevel: "Standard",
        stages: ["Document review", "Audit inspection", "Report review"],
        questions: ["New audit question"],
      },
    ]))
  }

  const removeAuditTrack = (trackId: string) => {
    setAuditTracks(prev => prev.filter(track => track.id !== trackId))
  }

  const updateQuestion = (trackId: string, index: number, value: string) => {
    setAuditTracks(prev => prev.map(track => (
      track.id === trackId
        ? { ...track, questions: track.questions.map((question, i) => i === index ? value : question) }
        : track
    )))
  }

  const addQuestion = (trackId: string) => {
    setAuditTracks(prev => prev.map(track => (
      track.id === trackId
        ? { ...track, questions: [...track.questions, "New audit question"] }
        : track
    )))
  }

  const removeQuestion = (trackId: string, index: number) => {
    setAuditTracks(prev => prev.map(track => (
      track.id === trackId
        ? { ...track, questions: track.questions.filter((_, i) => i !== index) }
        : track
    )))
  }

  const resetAuditTracks = () => {
    setAuditTracks(DEFAULT_AUDIT_TRACKS)
    saveAuditTracks(DEFAULT_AUDIT_TRACKS)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "0.65rem 0.75rem",
    fontSize: "0.875rem",
    color: C.textDark,
    outline: "none",
    background: C.white,
  }

  return (
    <OfficeLayout title="Settings">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: C.textDark }}>System Settings</h1>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Certificate templates and audit process controls</p>
          </div>
          {saved && (
            <span className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: "#e6f4e6", color: "#107c10" }}>
              {saved}
            </span>
          )}
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: "#f8fafc", border: `1px solid ${C.border}` }}>
          {[
            { key: "scope" as const,       label: "Scope",                Icon: ShieldCheck    },
            { key: "activity" as const,    label: "Activity Category",    Icon: Tag            },
            { key: "pricelist" as const,   label: "Price List",           Icon: DollarSign     },
            { key: "payments" as const,    label: "Payments",             Icon: CreditCard     },
            { key: "certificate" as const, label: "Certificate Template", Icon: Award          },
            { key: "agreement" as const,   label: "Agreement Template",   Icon: FileText       },
            { key: "audits" as const,      label: "Audit Templates",      Icon: ClipboardCheck },
            { key: "employees" as const,   label: "Employee Management",  Icon: Users          },
            { key: "database" as const,    label: "Database",             Icon: Database       },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: tab === item.key ? "#e5e7eb" : "transparent",
                color: tab === item.key ? CERT_BLUE : C.muted,
                boxShadow: "none",
              }}
            >
              <item.Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {tab === "database" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold" style={{ color: C.textDark }}>Database Tables</h2>
                <p className="text-sm mt-1" style={{ color: C.muted }}>Read-only database browser with table rows, columns, and pagination.</p>
              </div>
              <button
                onClick={() => { databaseQ.refetch(); databaseRowsQ.refetch() }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: C.white, border: `1px solid ${C.border}`, color: C.text }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${databaseQ.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
                <div className="p-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
                    <input
                      value={dbSearch}
                      onChange={e => setDbSearch(e.target.value)}
                      placeholder="Search tables or columns..."
                      className="w-full pl-9 pr-3 rounded-lg"
                      style={{ height: 36, border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none", fontSize: 12 }}
                    />
                  </div>
                </div>

                {databaseQ.isLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#f1f5f9" }} />
                    ))}
                  </div>
                ) : databaseQ.isError ? (
                  <div className="p-8 text-center">
                    <AlertTriangle className="w-7 h-7 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textDark }}>Unable to load database metadata</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>Check that application-service is running and your account is authenticated.</p>
                  </div>
                ) : dbSearch.trim() && filteredDatabaseTables.length === 0 ? (
                  <div className="p-8 text-center" style={{ color: C.muted, fontSize: 12 }}>No database tables found.</div>
                ) : (
                  <div style={{ maxHeight: 560, overflowY: "auto" }}>
                    <div className="p-3" style={{ borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Databases</p>
                      <div className="space-y-2">
                        {databaseGroups.map(group => {
                          const totalRows = group.tables.reduce((sum, table) => sum + table.estimatedRows, 0)
                          return (
                            <div key={group.database} className="flex items-center justify-between gap-2" style={{ fontSize: 12 }}>
                              <span style={{ fontWeight: 700, color: C.textDark }}>{group.database}</span>
                              <span style={{ color: C.muted }}>{group.tables.length} tables - {totalRows.toLocaleString()} rows</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {filteredDatabaseTables.map(table => {
                      const key = `${table.database ?? "halalcms_applications"}.${table.schema}.${table.name}`
                      const active = activeDatabaseTable && `${activeDatabaseTable.database ?? "halalcms_applications"}.${activeDatabaseTable.schema}.${activeDatabaseTable.name}` === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setSelectedDbTable(key); setDbRowsPage(0) }}
                          className="w-full text-left px-4 py-3"
                          style={{
                            border: "none",
                            borderBottom: `1px solid ${C.border}`,
                            background: active ? "#eff6ff" : C.white,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.primary : C.textDark }}>{table.name}</span>
                            <span style={{ fontSize: 11, color: C.muted }}>{table.estimatedRows.toLocaleString()} rows</span>
                          </div>
                          <div style={{ marginTop: 3, fontSize: 11, color: C.muted }}>{table.database ?? "halalcms_applications"} · {table.schema} · {table.columns.length} columns</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
                {activeDatabaseTable ? (
                  <>
                    <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.textDark }}>{activeDatabaseTable.database ?? "halalcms_applications"}.{activeDatabaseTable.schema}.{activeDatabaseTable.name}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{activeDatabaseTable.type} · estimated {activeDatabaseTable.estimatedRows.toLocaleString()} rows</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={dbRowsSize}
                          onChange={e => { setDbRowsSize(Number(e.target.value)); setDbRowsPage(0) }}
                          style={{ height: 32, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 8px", fontSize: 12, color: C.text, outline: "none" }}
                        >
                          {[25, 50, 100].map(size => <option key={size} value={size}>{size} rows</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => databaseRowsQ.refetch()}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ background: "#f8fafc", border: `1px solid ${C.border}`, color: C.text }}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${databaseRowsQ.isFetching ? "animate-spin" : ""}`} />
                          Data
                        </button>
                      </div>
                    </div>
                    <div style={{ borderBottom: `1px solid ${C.border}` }}>
                      {databaseRowsQ.isLoading ? (
                        <div className="p-5 space-y-2">
                          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "#f1f5f9" }} />)}
                        </div>
                      ) : databaseRowsQ.isError ? (
                        <div className="p-8 text-center">
                          <AlertTriangle className="w-7 h-7 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textDark }}>Unable to load table rows</p>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>Restart application-service after the backend update, then refresh this tab.</p>
                        </div>
                      ) : databaseRows && databaseRows.rows.length > 0 ? (
                        <div style={{ overflow: "auto", maxHeight: 420 }}>
                          <table className="w-full" style={{ fontSize: 12, borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead>
                              <tr style={{ background: "#f8fafc" }}>
                                <th className="px-3 py-2 text-left font-medium" style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: "#f8fafc", zIndex: 1, minWidth: 54 }}>#</th>
                                {databaseRows.columns.map(column => (
                                  <th key={column} className="px-3 py-2 text-left font-medium" style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: "#f8fafc", zIndex: 1, minWidth: 150 }}>
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {databaseRows.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  <td className="px-3 py-2" style={{ color: C.muted, background: "#fbfdff", borderBottom: `1px solid ${C.border}` }}>{dbRowsPage * dbRowsSize + rowIndex + 1}</td>
                                  {databaseRows.columns.map(column => (
                                    <td key={column} className="px-3 py-2" style={{ color: C.textDark, borderBottom: `1px solid ${C.border}`, maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row[column] == null ? "NULL" : String(row[column])}>
                                      {formatDbValue(row[column])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center" style={{ color: C.muted, fontSize: 12 }}>This table has no rows.</div>
                      )}
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}`, background: "#fbfdff" }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Page {dbRowsPage + 1} of {dbTotalPages} · {dbTotalRows.toLocaleString()} rows</span>
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={dbRowsPage === 0} onClick={() => setDbRowsPage(p => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${C.border}`, background: dbRowsPage === 0 ? "#f8fafc" : C.white, color: dbRowsPage === 0 ? "#cbd5e1" : C.text }}>Previous</button>
                          <button type="button" disabled={dbRowsPage + 1 >= dbTotalPages} onClick={() => setDbRowsPage(p => Math.min(dbTotalPages - 1, p + 1))} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${C.border}`, background: dbRowsPage + 1 >= dbTotalPages ? "#f8fafc" : C.white, color: dbRowsPage + 1 >= dbTotalPages ? "#cbd5e1" : C.text }}>Next</button>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3" style={{ background: "#fbfdff", borderBottom: `1px solid ${C.border}` }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.textDark }}>Columns</p>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="w-full" style={{ fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                            {["#", "Column", "Type", "Nullable", "Key", "Default"].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted, fontSize: 12 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDatabaseTable.columns.map(column => (
                            <tr key={column.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td className="px-4 py-3" style={{ color: C.muted }}>{column.ordinalPosition}</td>
                              <td className="px-4 py-3" style={{ color: C.textDark, fontWeight: 700 }}>{column.name}</td>
                              <td className="px-4 py-3">
                                <code style={{ fontSize: 11, color: "#334155", background: "#f8fafc", border: `1px solid ${C.border}`, padding: "2px 6px", borderRadius: 6 }}>{column.type}</code>
                              </td>
                              <td className="px-4 py-3" style={{ color: column.nullable ? C.muted : "#d13438", fontWeight: column.nullable ? 500 : 700 }}>
                                {column.nullable ? "YES" : "NO"}
                              </td>
                              <td className="px-4 py-3">
                                {column.primaryKey ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", background: "#dbeafe", padding: "2px 7px", borderRadius: 999 }}>PRIMARY</span>
                                ) : (
                                  <span style={{ color: C.muted }}>-</span>
                                )}
                              </td>
                              <td className="px-4 py-3" style={{ color: C.muted, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {column.defaultValue || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center" style={{ color: C.muted, fontSize: 12 }}>Select a table to inspect its columns.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "certificate" && (
          <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Certificate Designer</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Design and customize your Halal certificate layout using the full-featured designer.</div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/office/certificate-designer")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Open Certificate Designer
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_240px] gap-4">
            <div className="rounded-xl p-3 h-fit" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.muted }}>Toolbar</div>
              <div className="space-y-2">
                <div className="rounded-lg p-2.5" style={{ background: "#f8fafc", border: `1px solid ${C.border}` }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Pages</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {Array.from({ length: certPageCount }).map((_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => { setActiveCertPage(page); setSelectedFieldId("") }}
                          className="px-2 py-1.5 rounded text-xs font-semibold"
                          style={{ background: activeCertPage === page ? CERT_BLUE : "#fff", color: activeCertPage === page ? "#fff" : C.text, border: `1px solid ${activeCertPage === page ? CERT_BLUE : C.border}` }}
                        >
                          Page {page}
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={addCertificatePage} disabled={certPageCount >= 4} className="px-2 py-1.5 rounded text-xs font-semibold disabled:opacity-40" style={{ background: CERT_BLUE, color: "#fff", border: `1px solid ${CERT_BLUE}` }}>
                      + Page
                    </button>
                    <button type="button" onClick={removeCertificatePage} disabled={certPageCount <= 1} className="px-2 py-1.5 rounded text-xs font-semibold disabled:opacity-40" style={{ background: "#fff", color: "#d13438", border: `1px solid ${C.border}` }}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: "#f8fafc", border: `1px solid ${C.border}` }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Selected Block</div>
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" disabled={!selectedField} onClick={() => updateSelectedFontSize(-1)} className="w-8 h-8 rounded disabled:opacity-40" style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}>-</button>
                    <span className="text-xs font-semibold" style={{ color: C.textDark }}>{selectedField ? `${selectedField.fontSize ?? 12}px` : "No block"}</span>
                    <button type="button" disabled={!selectedField} onClick={() => updateSelectedFontSize(1)} className="w-8 h-8 rounded disabled:opacity-40" style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}>+</button>
                  </div>
                </div>
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: CERT_BLUE, color: "#fff" }}>
                  <FileText className="w-3.5 h-3.5" />
                  Upload Background
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => convertCertificateTemplate(e.target.files?.[0])} style={{ display: "none" }} />
                </label>
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: CERT_BLUE, color: "#fff" }}>
                  <FileText className="w-3.5 h-3.5" />
                  Upload Logo
                  <input type="file" accept="image/*" onChange={e => uploadTemplateImage(e.target.files?.[0], "logoDataUrl")} style={{ display: "none" }} />
                </label>
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: CERT_BLUE, color: "#fff" }}>
                  <FileText className="w-3.5 h-3.5" />
                  Upload Signature
                  <input type="file" accept="image/*" onChange={e => uploadTemplateImage(e.target.files?.[0], "signatureDataUrl")} style={{ display: "none" }} />
                </label>
                <button onClick={resetCertificateTemplate} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "#f8fafc", border: `1px solid ${C.border}`, color: C.text }}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button onClick={saveCertificateTemplate} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: CERT_BLUE, color: C.white }}>
                  <Save className="w-3.5 h-3.5" />
                  Save Template
                </button>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: C.primary }} />
                  <span className="text-xs font-semibold" style={{ color: C.textDark }}>Certificate Designer</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: "#f0f7ff", color: CERT_BLUE }}>Active Page {activeCertPage}</span>
              </div>
              <div className="space-y-5 overflow-x-auto rounded-xl p-3" style={{ border: `1px solid ${C.border}`, background: "#eef2f7" }}>
                {Array.from({ length: certPageCount }).map((_, index) => {
                  const page = index + 1
                  const pageFields = (template.placedFields ?? []).filter(field => (field.page ?? 1) === page)
                  return (
                    <div key={page}>
                      <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={() => { setActiveCertPage(page); setSelectedFieldId("") }}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: activeCertPage === page ? CERT_BLUE : "#fff", color: activeCertPage === page ? "#fff" : C.text, border: `1px solid ${activeCertPage === page ? CERT_BLUE : C.border}` }}>
                          Page {page}
                        </button>
                        <span className="text-[10px]" style={{ color: C.muted }}>{pageFields.length} block{pageFields.length === 1 ? "" : "s"}</span>
                      </div>
                      <div
                        className="mx-auto"
                        onClick={() => setActiveCertPage(page)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          handleFieldDrop(e, page)
                          setActiveCertPage(page)
                          setDraggingField(false)
                        }}
                        style={{ width: "min(100%, 660px)", minWidth: 610, minHeight: 860, background: "#fffdf8", border: "1px solid #d7dee8", boxShadow: "0 8px 24px rgba(15,23,42,0.10)", position: "relative", overflow: "hidden" }}
                      >
                        {template.sourceTemplateName && page === 1 && (
                          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, padding: "2px 7px", borderRadius: 20, background: "#e6f4e6", color: "#107c10", fontSize: 8, fontWeight: 800, letterSpacing: "0.04em" }}>HCB TEMPLATE</div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "#fffdf8" }}>
                          {page === 1 && isImageSourceTemplate && <img src={template.sourceTemplateDataUrl} alt={template.sourceTemplateName} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />}
                          {page === 1 && isPdfSourceTemplate && <object data={`${template.sourceTemplateDataUrl}#toolbar=0&navpanes=0&page=1&zoom=page-fit`} type="application/pdf" aria-label={template.sourceTemplateName} style={{ width: "100%", height: "100%", border: "none", pointerEvents: draggingField ? "none" : "auto" }} />}
                          {!template.sourceTemplateName && <div style={{ position: "absolute", inset: 24, border: "4px double #d7b56d", background: "linear-gradient(135deg,#fffdf7,#f8fafc)", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 11, textAlign: "center", padding: 20 }}>Page {page}<br />Drag blocks here.</div>}
                        </div>
                        {draggingField && (
                          <div onDragOver={e => e.preventDefault()} onDrop={e => { handleFieldDrop(e, page); setActiveCertPage(page); setDraggingField(false) }}
                            style={{ position: "absolute", inset: 0, zIndex: 3, background: "rgba(15,33,112,0.05)", border: `2px dashed ${CERT_BLUE}` }} />
                        )}
                        {pageFields.map(field => (
                          <div
                            key={field.id}
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData("fieldKey", field.key)
                              e.dataTransfer.setData("fieldId", field.id)
                              setDraggingField(true)
                              setSelectedFieldId(field.id)
                              setActiveCertPage(page)
                            }}
                            onDragEnd={() => setDraggingField(false)}
                            onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); setActiveCertPage(page) }}
                            style={{
                              position: "absolute",
                              left: `${field.x}%`,
                              top: `${field.y}%`,
                              transform: "translate(-50%, -50%)",
                              zIndex: field.key === "frame" ? 1 : 4,
                              width: `${field.w ?? (field.key === "qrCode" ? 12 : 24)}%`,
                              height: field.h ? `${field.h * 7.9}px` : field.key === "qrCode" ? 64 : undefined,
                              minHeight: field.h ? undefined : field.key === "qrCode" ? 64 : 22,
                              padding: field.key === "frame" ? 0 : field.key === "qrCode" || field.key === "productsTable" || field.key === "logo" || field.key === "signature" ? 5 : "4px 7px",
                              border: field.key === "frame" ? "none" : `1px solid ${CERT_BLUE}`,
                              borderRadius: field.key === "frame" ? 0 : 5,
                              background: field.key === "frame" ? "transparent" : "rgba(255,255,255,0.86)",
                              color: C.textDark,
                              fontSize: field.fontSize ?? 11,
                              fontWeight: 700,
                              cursor: "move",
                              boxShadow: "0 3px 10px rgba(15,23,42,0.10)",
                              textAlign: field.key === "qrCode" ? "center" : "left",
                              outline: selectedFieldId === field.id ? `2px solid ${CERT_BLUE}` : "none",
                            }}
                            title="Drag to reposition"
                          >
                            {renderDesignerElement(field)}
                            <button type="button" onClick={() => removePlacedField(field.id)}
                              style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: 8, border: "none", background: "#d13438", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Remove field">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="rounded-xl p-3 h-fit" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Design Blocks</div>
              <p className="text-[10px] mb-2" style={{ color: CERT_BLUE }}>Drop onto Page {activeCertPage}</p>
              <div className="space-y-1.5">
                {CERT_FIELD_PALETTE.map(field => (
                  <div
                    key={field.key}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("fieldKey", field.key)
                      setDraggingField(true)
                    }}
                    onDragEnd={() => setDraggingField(false)}
                    className="rounded-lg p-2.5 cursor-grab active:cursor-grabbing"
                    style={{ border: `1px solid ${C.border}`, background: "#f8fafc" }}
                  >
                    <div className="text-xs font-semibold" style={{ color: C.textDark }}>{field.label}</div>
                    <div className="text-[10px] truncate mt-0.5" style={{ color: C.muted }}>{field.sample}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-3 leading-relaxed" style={{ color: C.muted }}>
                Drag blocks onto the certificate. Move them into position, then save the template.
              </p>
            </div>
          </div>
          </div>
        )}

        {tab === "agreement" && (() => {
          const F2 = "'Inter',system-ui,sans-serif"
          // addedCodes = language codes that have been added (have a PDF entry, even if empty)
          const addedCodes: string[] = JSON.parse(localStorage.getItem("hcs_agreement_langs") || "[]")
          const addedLangs = addedCodes.map(c => AGR_LANGUAGES.find(l => l.code === c)).filter(Boolean) as typeof AGR_LANGUAGES
          const availableToAdd = AGR_LANGUAGES.filter(l => !addedCodes.includes(l.code))
          const activeLang = AGR_LANGUAGES.find(l => l.code === agrLang) ?? addedLangs[0]
          const current = activeLang ? agrPdfs[activeLang.code] : undefined

          function persistLangs(codes: string[]) {
            localStorage.setItem("hcs_agreement_langs", JSON.stringify(codes))
          }
          function addLanguage(code: string) {
            if (addedCodes.includes(code)) return
            const next = [...addedCodes, code]
            persistLangs(next)
            setAgrLang(code)
            setAgrPdfs(p => ({ ...p })) // trigger re-render
          }
          function removeLang(code: string) {
            const next = addedCodes.filter(c => c !== code)
            persistLangs(next)
            const updated = { ...agrPdfs }
            delete updated[code]
            setAgrPdfs(updated)
            saveAgreementPdfs(updated)
            if (agrLang === code) setAgrLang(next[0] ?? "")
          }
          function handleAgrUpload(e: React.ChangeEvent<HTMLInputElement>, code: string) {
            const file = e.target.files?.[0]
            if (!file) return
            const lang = AGR_LANGUAGES.find(l => l.code === code)
            const reader = new FileReader()
            reader.onload = ev => {
              const updated = { ...agrPdfs, [code]: { fileName: file.name, pdfData: ev.target?.result as string } }
              setAgrPdfs(updated)
              saveAgreementPdfs(updated)
              setSaved(`${lang?.label ?? code} agreement saved!`)
              setTimeout(() => setSaved(""), 2500)
            }
            reader.readAsDataURL(file)
            e.target.value = ""
          }

          return (
            <div style={{ maxWidth: 820 }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Agreement Templates</p>
              <p style={{ margin: "0 0 16px", fontSize: "0.75rem", color: C.muted }}>Add languages and upload the signed agreement PDF for each one. Customers will choose their language and sign online.</p>

              {/* ── Help tips ── */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em" }}>How to prepare your agreement PDF</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                  {[
                    { n: "1", t: "Leave the last page blank at the bottom", d: "The signature section is added digitally — reserve the bottom ~25% of the last page." },
                    { n: "2", t: "HCB signs on the LEFT, Customer on the RIGHT", d: "The system places HCB signature left and customer signature right, mirroring a standard agreement layout." },
                    { n: "3", t: "Use a clear, readable font (min 11 pt)", d: "Customers view the PDF in-browser at various screen sizes — avoid very small text." },
                    { n: "4", t: "One PDF per language", d: "Upload a separate translated PDF for each language you support. Customers choose at signing time." },
                  ].map(tip => (
                    <div key={tip.n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: "0.65rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{tip.n}</span>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: "0.75rem", fontWeight: 700, color: "#1e3a8a" }}>{tip.t}</p>
                        <p style={{ margin: 0, fontSize: "0.68rem", color: "#3b82f6", lineHeight: 1.45 }}>{tip.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Add language row ── */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
                <select
                  value=""
                  onChange={e => { if (e.target.value) addLanguage(e.target.value) }}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", fontFamily: F2, outline: "none" }}
                >
                  <option value="">— Select a language to add —</option>
                  {availableToAdd.map(l => (
                    <option key={l.code} value={l.code}>{l.flag}  {l.label}</option>
                  ))}
                </select>
              </div>

              {/* ── Added languages list ── */}
              {addedLangs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 32px", background: "#fff", border: `2px dashed ${C.border}`, borderRadius: 14, color: C.muted }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>No languages added yet</p>
                  <p style={{ margin: 0, fontSize: "0.75rem" }}>Select a language above to get started.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {addedLangs.map(lang => {
                    const pdf = agrPdfs[lang.code]
                    const isOpen = agrLang === lang.code
                    return (
                      <div key={lang.code} style={{ background: "#fff", border: `1px solid ${isOpen ? "#2563eb" : C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: C.cardShadow, transition: "border-color 0.15s" }}>
                        {/* Row header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", background: isOpen ? "#f8fbff" : "#fff" }}
                          onClick={() => setAgrLang(isOpen ? "" : lang.code)}>
                          <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{lang.flag}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>{lang.label}</p>
                            <p style={{ margin: 0, fontSize: "0.71rem", color: pdf ? "#16a34a" : C.muted }}>
                              {pdf ? `✓ ${pdf.fileName}` : "No PDF uploaded"}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {pdf ? (
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#f1f5f9", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F2 }}
                                onClick={e => e.stopPropagation()}>
                                <UploadCloud size={13} />Replace
                                <input type="file" accept="application/pdf" onChange={e => handleAgrUpload(e, lang.code)} style={{ display: "none" }} />
                              </label>
                            ) : (
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: CERT_BLUE, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: F2 }}
                                onClick={e => e.stopPropagation()}>
                                <UploadCloud size={13} />Upload PDF
                                <input type="file" accept="application/pdf" onChange={e => handleAgrUpload(e, lang.code)} style={{ display: "none" }} />
                              </label>
                            )}
                            <button onClick={e => { e.stopPropagation(); removeLang(lang.code) }}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", color: "#dc2626", flexShrink: 0 }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {/* Inline PDF preview */}
                        {isOpen && pdf && (
                          <iframe
                            key={lang.code}
                            src={pdf.pdfData}
                            title={`${lang.label} Agreement`}
                            style={{ width: "100%", height: "calc(100vh - 280px)", minHeight: 540, border: "none", borderTop: `1px solid ${C.border}`, display: "block" }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {tab === "audits" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: C.textDark }}>Audit Report Configuration</h2>
                <p className="text-sm mt-1" style={{ color: C.muted }}>
                  Questions are selected by the application's Activity Category. Active default: <span className="font-semibold" style={{ color: C.textDark }}>{selectedTrack?.name ?? "None"}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={addAuditTrack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#f0f7ff", border: `1px solid #dbeef9`, color: C.primary }}>
                  <Plus className="w-4 h-4" />
                  Add Configuration
                </button>
                <button onClick={resetAuditTracks} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#f8fafc", border: `1px solid ${C.border}`, color: C.text }}>
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button onClick={() => saveAuditTracks()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: C.primary, color: C.white }}>
                  <Save className="w-4 h-4" />
                  Save Audit Templates
                </button>
              </div>
            </div>

            {auditTracks.map(track => (
              <div key={track.id} className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-[280px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs font-semibold" style={{ color: C.muted }}>
                        Configuration Name
                        <input
                          value={track.name}
                          onChange={e => updateAuditTrack(track.id, { name: e.target.value })}
                          style={{ ...inputStyle, marginTop: 6 }}
                        />
                      </label>
                      <label className="text-xs font-semibold" style={{ color: C.muted }}>
                        Report Title
                        <input
                          value={track.reportTitle ?? ""}
                          onChange={e => updateAuditTrack(track.id, { reportTitle: e.target.value })}
                          style={{ ...inputStyle, marginTop: 6 }}
                        />
                      </label>
                    </div>
                    <label className="block text-xs font-semibold mt-3" style={{ color: C.muted }}>
                      Applies To
                      <textarea
                        value={track.appliesTo}
                        onChange={e => updateAuditTrack(track.id, { appliesTo: e.target.value })}
                        rows={2}
                        style={{ ...inputStyle, marginTop: 6, resize: "vertical" }}
                      />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mt-3">
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Activity Categories</p>
                        <div className="flex flex-wrap gap-2">
                          {activityCategories.map(category => {
                            const selected = (track.activityCategoryKeys ?? []).includes(category.key)
                            return (
                              <button
                                key={category.key}
                                onClick={() => toggleAuditTrackCategory(track.id, category.key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                  background: selected ? C.primary : "#f8fafc",
                                  color: selected ? C.white : C.text,
                                  border: `1px solid ${selected ? C.primary : C.border}`,
                                }}
                              >
                                {category.label}
                              </button>
                            )
                          })}
                          {activityCategories.length === 0 && (
                            <span className="text-xs" style={{ color: C.muted }}>Add activity categories in the Activity Category tab first.</span>
                          )}
                        </div>
                      </div>
                      <label className="text-xs font-semibold" style={{ color: C.muted }}>
                        Risk Level
                        <select
                          value={track.riskLevel}
                          onChange={e => updateAuditTrack(track.id, { riskLevel: e.target.value as AuditTrack["riskLevel"] })}
                          style={{ ...inputStyle, marginTop: 6 }}
                        >
                          <option value="Standard">Standard</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(track.formCode || track.revision) && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f0f7ff", color: C.primary }}>
                        {[track.formCode, track.revision].filter(Boolean).join(" | ")}
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: track.riskLevel === "Critical" ? "#fde7e9" : track.riskLevel === "High" ? "#fff8e5" : "#e6f4e6", color: track.riskLevel === "Critical" ? "#d13438" : track.riskLevel === "High" ? "#8a6000" : "#107c10" }}>
                      {track.riskLevel}
                    </span>
                    <button
                      onClick={() => removeAuditTrack(track.id)}
                      disabled={auditTracks.length <= 1}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
                      style={{ border: `1px solid ${C.border}`, color: "#d13438", background: C.white }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {track.stages.map(stage => (
                    <span key={stage} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#f0f7ff", color: C.primary }}>{stage}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Questions ({track.questions.length})</p>
                  <button onClick={() => addQuestion(track.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#f0f7ff", color: C.primary }}>
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-2">
                  {track.questions.map((question, index) => (
                    <div key={`${track.id}-${index}`} className="flex gap-2">
                      <input
                        value={question}
                        onChange={e => updateQuestion(track.id, index, e.target.value)}
                        style={inputStyle}
                      />
                      <button onClick={() => removeQuestion(track.id, index)} className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ border: `1px solid ${C.border}`, color: "#d13438", background: C.white }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "employees" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total",     value: empTotal,                                              accent: C.primary },
                { label: "Active",    value: empUsers.filter(u => u.status === "ACTIVE").length,    accent: "#107c10" },
                { label: "Suspended", value: empUsers.filter(u => u.status === "SUSPENDED").length, accent: "#d13438" },
                { label: "Admins",    value: empUsers.filter(u => u.role === "OFFICE_ADMIN" || u.role === "SUPER_ADMIN" || u.role === "ADMIN").length, accent: "#8764b8" },
              ].map(s => (
                <div key={s.label} className="rounded-xl" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow, padding: "12px 14px" }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{s.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 21, lineHeight: 1.1, fontWeight: 700, color: s.accent }}>{s.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-3" style={{ justifyContent: "space-between" }}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
                <input type="text" placeholder="Search by name or email…" value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setEmpPage(0) }}
                  className="w-full pl-9 pr-3 rounded-lg"
                  style={{ height: 34, border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none", fontSize: 12 }}
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
                <select value={empRole} onChange={e => { setEmpRole(e.target.value); setEmpPage(0) }}
                  className="pl-9 pr-8 rounded-lg appearance-none cursor-pointer"
                  style={{ height: 34, border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none", fontSize: 12 }}
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={() => empRefetch()}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ border: `1px solid ${C.border}`, background: C.white, color: C.muted }}
                onMouseOver={e => (e.currentTarget.style.background = C.bg)}
                onMouseOut={e => (e.currentTarget.style.background = C.white)}
              >
                <RefreshCw className={`w-4 h-4 ${empRefetching ? "animate-spin" : ""}`} />
              </button>
            </div>
              <button onClick={() => setShowAddEmp(true)}
                className="flex items-center gap-2 rounded-lg font-semibold"
                style={{ background: C.primary, color: "#fff", border: "none", cursor: "pointer", padding: "7px 12px", fontSize: 12 }}>
                <UserPlus className="w-3.5 h-3.5" />Add Employee
              </button>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <table className="w-full" style={{ fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                    {["Employee", "User ID", "Role", "Job Title", "Emp. Type", "ID / Passport", "Status", "Joined"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-4"><div className="h-4 rounded animate-pulse" style={{ background: "#f0f0f0" }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : empError ? (
                    <tr><td colSpan={8} className="py-14 text-center">
                      <AlertTriangle className="w-7 h-7 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                      <p style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>Unable to load employees</p>
                      <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Ensure you're signed in with a real account, then <button onClick={() => empRefetch()} style={{ color: C.primary, background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0, fontWeight: 600 }}>retry</button>.</p>
                    </td></tr>
                  ) : empUsers.length === 0 ? (
                    <tr><td colSpan={8} className="py-14 text-center">
                      <Users className="w-7 h-7 mx-auto mb-2" style={{ color: "#d1d5db" }} />
                      <p style={{ color: C.muted, fontSize: 12 }}>No employees found</p>
                    </td></tr>
                  ) : empUsers.map((u, idx) => {
                    const s = getStatusStyle(u.status)
                    const rs = ROLE_STYLE[u.role] ?? { bg: "#f3f4f6", color: "#6b7280" }
                    const isActive = u.status === "ACTIVE"
                    const empNum = String(idx + 1).padStart(3, "0")
                    const empType = u.employmentType
                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Employee name + email — click to edit */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: C.primary, fontSize: 11, fontWeight: 600 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: C.textDark }}>{u.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* User ID */}
                        <td className="px-3 py-2">
                          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#1e3a8a", background: "#eff6ff", padding: "3px 9px", borderRadius: 6, letterSpacing: "-0.01em" }}>
                            EMP-{empNum}
                          </span>
                        </td>
                        {/* Role */}
                        <td className="px-3 py-2">
                          <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{u.role}</span>
                        </td>
                        {/* Job Title */}
                        <td className="px-3 py-2 text-xs" style={{ color: "#6b7280" }}>{u.jobTitle || "—"}</td>
                        {/* Employment Type */}
                        <td className="px-3 py-2">
                          <span className="text-xs" style={{ color: "#6b7280" }}>
                            {empType === "OWN" ? "Own Staff" : empType === "OUTSOURCE" ? "Outsource" : "—"}
                          </span>
                        </td>
                        {/* ID / Passport */}
                        <td className="px-3 py-2">
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>
                              {u.idProofNumber || "—"}
                            </span>
                            {u.idDocName && u.idDocData && (
                              <button onClick={() => setPreviewFile({ name: u.idDocName!, data: u.idDocData! })}
                                title={u.idDocName}
                                style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 4, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#374151", fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {u.idDocName.length > 14 ? u.idDocName.slice(0, 14) + "…" : u.idDocName}
                              </button>
                            )}
                          </div>
                        </td>
                        {/* Status + inline actions */}
                        <td className="px-3 py-2">
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? "#16a34a" : "#dc2626", background: isActive ? "#dcfce7" : "#fee2e2", padding: "2px 8px", borderRadius: 20 }}>
                              {isActive ? "Active" : "Suspended"}
                            </span>
                            {u.role !== "SUPER_ADMIN" && (
                              <button disabled={statusPending} title={isActive ? "Suspend" : "Activate"}
                                onClick={() => toggleStatus({ id: Number(u.id), status: isActive ? "SUSPENDED" : "ACTIVE" })}
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#6b7280", padding: 0, flexShrink: 0 }}
                                onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#94a3b8" }}
                                onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0" }}
                              >
                                {isActive
                                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                              </button>
                            )}
                            {u.role !== "SUPER_ADMIN" && (
                              <button title="Edit employee" onClick={() => openEditEmp(u)}
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#6b7280", padding: 0, flexShrink: 0 }}
                                onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.color = "#2563eb" }}
                                onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#6b7280" }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            )}
                            {u.role === "SUPER_ADMIN" && <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>Protected</span>}
                          </div>
                        </td>
                        {/* Joined */}
                        <td className="px-3 py-2 text-xs" style={{ color: "#6b7280" }}>
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "pricelist" && (() => {
          const F = "'Inter',system-ui,sans-serif"
          return (
            <div style={{ fontFamily: F }}>

              {/* ── Pricing Configuration card ── */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 20, boxShadow: C.cardShadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DollarSign size={18} color="#2563eb" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Pricing Configuration</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: C.muted }}>Set cost of audit and VAT percentage used for price calculation</p>
                  </div>
                  {pricingSaved && (
                    <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: 20 }}>Saved</span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr", gap: 16 }}>
                  {/* System Currency */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>System Currency</label>
                    <select value={pricing.currency} onChange={e => setPricing(p => ({ ...p, currency: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: "#111827", background: "#fff", outline: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                    </select>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: C.muted }}>All prices follow this currency</p>
                  </div>
                  {/* Cost of Audit */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Rate Charged per Audit</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "#64748b", pointerEvents: "none" }}>
                        {getCurrencySymbol(pricing.currency)}
                      </span>
                      <input type="number" min={0} step={0.01} value={pricing.auditDayCost}
                        onChange={e => setPricing(p => ({ ...p, auditDayCost: parseFloat(e.target.value) || 0 }))}
                        style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: "#111827", outline: "none", fontFamily: F, boxSizing: "border-box" as const }} />
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: C.muted }}>Rate charged per audit</p>
                  </div>
                  {/* VAT Percentage */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>VAT Percentage</label>
                    <div style={{ position: "relative" }}>
                      <input type="number" min={0} max={100} step={0.1} value={pricing.vatPct}
                        onChange={e => setPricing(p => ({ ...p, vatPct: parseFloat(e.target.value) || 0 }))}
                        style={{ width: "100%", padding: "8px 36px 8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: "#111827", outline: "none", fontFamily: F, boxSizing: "border-box" as const }} />
                      <Percent size={13} color={C.muted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: C.muted }}>Applied to total invoice amount</p>
                  </div>
                  {/* Preview */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}` }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Cost Preview</p>
                    {(() => {
                      const selectedScope = accreditations.find(a => a.id === selectedScopeId)
                      const scopeCost = selectedScope?.unitPrice ?? 0
                      const base     = pricing.auditDayCost
                      const subtotal = base + scopeCost
                      const vat      = subtotal * pricing.vatPct / 100
                      const total    = subtotal + vat
                      const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: C.text }}>
                            <span>Cost of Audit</span>
                            <span style={{ fontWeight: 600 }}>{pricing.currency} {fmt(base)}</span>
                          </div>
                          {/* Scope row */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <select value={selectedScopeId} onChange={e => setSelectedScopeId(e.target.value)}
                              style={{ flex: 1, minWidth: 0, padding: 0, border: "none", background: "transparent", outline: "none", cursor: "pointer", fontFamily: F, fontSize: "0.75rem", color: C.text, appearance: "none", WebkitAppearance: "none" } as React.CSSProperties}>
                              <option value="">— Standard —</option>
                              {accreditations.filter(a => a.standard).map(a => (
                                <option key={a.id} value={a.id}>Application fee of {a.standard}</option>
                              ))}
                            </select>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.text, whiteSpace: "nowrap" as const }}>
                              {scopeCost > 0 ? `${pricing.currency} ${fmt(scopeCost)}` : "—"}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: C.muted }}>
                            <span>VAT ({pricing.vatPct}%)</span>
                            <span>{pricing.currency} {fmt(vat)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#111827", fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 2 }}>
                            <span>Total</span>
                            <span>{pricing.currency} {fmt(total)}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => savePricing(pricing)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <Save size={13} />Save Pricing
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {tab === "payments" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <CreditCard size={18} color="#0f2170" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f2170" }}>Stripe Payment Gateway</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Configure Stripe to accept online payments from customers.</p>
                </div>
              </div>

              {/* Enable toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#111827" }}>Enable Stripe Payments</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Allow customers to pay invoices online via Stripe</p>
                </div>
                <button onClick={() => setStripe(s => ({ ...s, enabled: !s.enabled }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: stripe.enabled ? "#2563eb" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: stripe.enabled ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                </button>
              </div>

              {/* Publishable key */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Publishable Key</label>
                <input value={stripe.publishableKey} onChange={e => setStripe(s => ({ ...s, publishableKey: e.target.value }))}
                  placeholder="pk_live_…"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "monospace", boxSizing: "border-box" as const, color: "#111827" }} />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Used in the browser to load Stripe.js. Safe to expose.</p>
              </div>

              {/* Webhook secret */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Webhook Secret</label>
                <div style={{ position: "relative" }}>
                  <input type={showStripeSecret ? "text" : "password"} value={stripe.webhookSecret} onChange={e => setStripe(s => ({ ...s, webhookSecret: e.target.value }))}
                    placeholder="whsec_…"
                    style={{ width: "100%", padding: "8px 40px 8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "monospace", boxSizing: "border-box" as const, color: "#111827" }} />
                  <button onClick={() => setShowStripeSecret(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                    {showStripeSecret ? "Hide" : "Show"}
                  </button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Used to validate Stripe webhook events. Keep this secret.</p>
              </div>

              {/* Info box */}
              <div style={{ padding: "12px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 9, marginBottom: 20, fontSize: 12, color: "#1e40af", lineHeight: 1.6 }}>
                <strong>Setup instructions:</strong> Go to <em>Stripe Dashboard → Developers → API Keys</em> to get your publishable key.
                For webhooks, set the endpoint to <code style={{ background: "#dbeafe", padding: "1px 5px", borderRadius: 4 }}>/api/webhooks/stripe</code> and copy the signing secret.
              </div>

              <button onClick={() => { saveStripeConfig(stripe); setStripeSaved(true); setTimeout(() => setStripeSaved(false), 2000) }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 22px", background: "#0f2170", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <Save size={14} /> {stripeSaved ? "Saved!" : "Save Stripe Config"}
              </button>
            </div>

            {/* Bank Transfer Details */}
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <DollarSign size={18} color="#0f2170" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f2170" }}>Bank Transfer Details</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>These details are shown to customers on invoices and payment pages.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {([
                  { key: "bankName",      label: "Bank Name",         placeholder: "e.g. Maybank Berhad"         },
                  { key: "accountName",   label: "Account Name",      placeholder: "e.g. HCS Halal Certification Body" },
                  { key: "accountNumber", label: "Account Number",    placeholder: "e.g. 1234567890"             },
                  { key: "swiftBic",      label: "SWIFT / BIC Code",  placeholder: "e.g. MBBEMYKL"              },
                  { key: "iban",          label: "IBAN",              placeholder: "e.g. MY89 3704 0044 0532 0130 00" },
                  { key: "branchCode",    label: "Branch / Sort Code",placeholder: "e.g. 04-00"                  },
                ] as { key: keyof BankDetails; label: string; placeholder: string }[]).map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5 }}>{f.label}</label>
                    <input value={bank[f.key]} onChange={e => setBank(b => ({ ...b, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, color: "#111827", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5 }}>Bank Address</label>
                <textarea value={bank.bankAddress} onChange={e => setBank(b => ({ ...b, bankAddress: e.target.value }))}
                  placeholder="Full bank branch address…" rows={2}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, color: "#111827", fontFamily: "inherit", resize: "vertical" as const }} />
              </div>

              <button onClick={() => { saveBankDetails(bank); setBankSaved(true); setTimeout(() => setBankSaved(false), 2000) }}
                style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 22px", background: "#0f2170", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                <Save size={14} /> {bankSaved ? "Saved!" : "Save Bank Details"}
              </button>
            </div>
          </div>
        )}

        {tab === "activity" && (() => {
          const F = "'Inter',system-ui,sans-serif"
          return (
            <div style={{ fontFamily: F }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag size={16} color={C.primary} />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#111827" }}>Activity Category</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: C.muted }}>Configure the category cards customers see when adding a factory.</p>
                  </div>
                </div>
                <button onClick={resetActivityCategories}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.text, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: F }}>
                  <RotateCcw size={13} />Defaults
                </button>
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, boxShadow: C.cardShadow }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                  {activityCategories.map(cat => {
                    const iconMeta = ACTIVITY_ICON_OPTIONS.find(i => i.key === cat.icon) ?? ACTIVITY_ICON_OPTIONS[0]
                    const Icon = iconMeta.Icon
                    const iconPickerOpen = activeIconPicker === cat.key
                    return (
                      <div key={cat.key} style={{ position: "relative", padding: "14px 10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minHeight: 72, textAlign: "center" as const }}>
                        <button onClick={() => removeActivityCategory(cat.key)} title="Remove category"
                          style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: "#cbd5e1", cursor: "pointer" }}>
                          <Trash2 size={11} />
                        </button>
                        <button onClick={() => setActiveIconPicker(iconPickerOpen ? "" : cat.key)} title="Change icon"
                          style={{ width: 28, height: 26, borderRadius: 7, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Icon size={22} color={iconPickerOpen ? C.primary : "#94a3b8"} strokeWidth={1.5} />
                        </button>
                        <input value={cat.label} onChange={e => updateActivityCategory(cat.key, { label: e.target.value })}
                          style={{ width: "100%", boxSizing: "border-box", textAlign: "center", padding: 0, borderRadius: 6, border: "1px solid transparent", background: "transparent", fontSize: "0.72rem", fontWeight: 500, color: "#111827", outline: "none", fontFamily: F, lineHeight: 1.3 }} />
                        {iconPickerOpen && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, width: "100%", marginTop: 4 }}>
                            {ACTIVITY_ICON_OPTIONS.map(opt => (
                              <button key={opt.key} onClick={() => { updateActivityCategory(cat.key, { icon: opt.key }); setActiveIconPicker("") }}
                                title={opt.label}
                                style={{ height: 28, borderRadius: 7, border: cat.icon === opt.key ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`, background: cat.icon === opt.key ? "#eff6ff" : "#fff", color: cat.icon === opt.key ? C.primary : C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <opt.Icon size={14} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {(() => {
                    const iconMeta = ACTIVITY_ICON_OPTIONS.find(i => i.key === activityForm.icon) ?? ACTIVITY_ICON_OPTIONS[0]
                    const Icon = iconMeta.Icon
                    const iconPickerOpen = activeIconPicker === "__new"
                    return (
                      <div style={{ padding: "14px 10px 12px", border: `1.5px dashed ${C.border}`, borderRadius: 10, background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minHeight: 72, textAlign: "center" as const }}>
                        <button onClick={() => setActiveIconPicker(iconPickerOpen ? "" : "__new")} title="Choose icon"
                          style={{ width: 28, height: 26, borderRadius: 7, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Icon size={22} color={iconPickerOpen ? C.primary : "#94a3b8"} strokeWidth={1.5} />
                        </button>
                        <input value={activityForm.label} onChange={e => setActivityForm(f => ({ ...f, label: e.target.value }))} placeholder="Meat Processing"
                          style={{ width: "100%", boxSizing: "border-box", textAlign: "center", padding: 0, borderRadius: 6, border: "1px solid transparent", background: "transparent", fontSize: "0.72rem", fontWeight: 500, color: "#111827", outline: "none", fontFamily: F, lineHeight: 1.3 }} />
                        {iconPickerOpen && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, width: "100%", marginTop: 4 }}>
                            {ACTIVITY_ICON_OPTIONS.map(opt => (
                              <button key={opt.key} onClick={() => { setActivityForm(f => ({ ...f, icon: opt.key })); setActiveIconPicker("") }}
                                title={opt.label}
                                style={{ height: 28, borderRadius: 7, border: activityForm.icon === opt.key ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`, background: activityForm.icon === opt.key ? "#eff6ff" : "#fff", color: activityForm.icon === opt.key ? C.primary : C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <opt.Icon size={14} />
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={addActivityCategory}
                          style={{ marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "none", background: C.primary, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: F }}>
                          <Plus size={14} />Add
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })()}

        {tab === "scope" && (() => {
          const expired      = accreditations.filter(a => accDaysLeft(a.expiryDate) < 0)
          const expiringSoon = accreditations.filter(a => { const d = accDaysLeft(a.expiryDate); return d >= 0 && d <= 90 })
          const active       = accreditations.filter(a => accDaysLeft(a.expiryDate) > 90)
          const F = "'Inter',system-ui,sans-serif"
          return (
            <div style={{ fontFamily: F }}>

              {/* ── Scope and Price List header ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color={C.primary} />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#111827" }}>Scope and Price List</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: C.muted }}>HCB accreditation scopes with unit price per service</p>
                  </div>
                </div>
                <button onClick={() => setShowAccForm(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, flexShrink: 0 }}>
                  <Plus size={14} />Add Scope
                </button>
              </div>


              {/* Add form — moved to modal */}
              {false && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: C.cardShadow }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.primary, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 14 }}>New Accreditation Record</p>

                  {(() => {
                    const af = accForm
                    const any = !!(af.body || af.standard || af.certNumber || af.scope || af.country || af.issueDate || af.expiryDate || af.notes)
                    // bg/border for a field: required=true means red when empty, false means amber
                    const fb = (val: string, _req = false) => ({
                      background: any && !val ? "#dbeafe" : "#fff",
                      border: `1px solid ${C.border}`,
                    })
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                        {/* Body */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Accreditation Body *</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input value={af.body} onChange={e => setAccForm(f => ({ ...f, body: e.target.value }))}
                              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.body, true) }} />
                            <button type="button" onClick={() => setShowBodyPicker(true)}
                              style={{ padding: "7px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: F }}>
                              Browse
                            </button>
                          </div>
                        </div>
                        {/* Standard */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Standard / Framework</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input value={af.standard} onChange={e => setAccForm(f => ({ ...f, standard: e.target.value }))}
                              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.standard) }} />
                            <button type="button" onClick={() => setShowStandardPicker(true)}
                              style={{ padding: "7px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: F }}>
                              Browse
                            </button>
                          </div>
                        </div>
                        {/* Cert number */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Certificate Number</label>
                          <input value={af.certNumber} onChange={e => setAccForm(f => ({ ...f, certNumber: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.certNumber) }} />
                        </div>
                        {/* Scope */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Scope Description</label>
                          <input value={af.scope} onChange={e => setAccForm(f => ({ ...f, scope: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.scope) }} />
                        </div>
                        {/* Country */}
                        <div style={{ gridColumn: "1 / -1", marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Country of Accreditation</label>
                          <select value={af.country} onChange={e => setAccForm(f => ({ ...f, country: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, cursor: "pointer", ...fb(af.country) }}>
                            <option value="">— select country —</option>
                            {ACC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        {/* Issue date */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Issue Date</label>
                          <input type="date" value={af.issueDate} onChange={e => setAccForm(f => ({ ...f, issueDate: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.issueDate) }} />
                        </div>
                        {/* Expiry date */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Expiry Date *</label>
                          <input type="date" value={af.expiryDate} onChange={e => setAccForm(f => ({ ...f, expiryDate: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, ...fb(af.expiryDate, true) }} />
                        </div>
                        {/* Notes */}
                        <div style={{ gridColumn: "1 / -1", marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Notes</label>
                          <textarea value={af.notes} onChange={e => setAccForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F, boxSizing: "border-box" as const, resize: "vertical" as const, ...fb(af.notes) }} />
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveAccreditation} disabled={!accForm.body || !accForm.expiryDate}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", background: accForm.body && accForm.expiryDate ? C.primary : "#94a3b8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: accForm.body && accForm.expiryDate ? "pointer" : "not-allowed", fontFamily: F }}>
                      <Save size={13} />Save Record
                    </button>
                    <button onClick={() => { setShowAccForm(false); setAccForm(emptyAccForm()) }}
                      style={{ padding: "7px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: F }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              {accreditations.length === 0 && !showAccForm ? (
                <div style={{ textAlign: "center", padding: "52px 20px", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <ShieldCheck size={36} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem", marginBottom: 4 }}>No scope records yet</p>
                  <p style={{ color: C.muted, fontSize: "0.82rem" }}>Add accreditation scopes with unit prices for each service offered by HCB.</p>
                </div>
              ) : accreditations.length > 0 && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: C.cardShadow }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}`, background: "#fafbfc" }}>
                        {["Accreditation Body", "Standard", "Cert. Number", "Scope", "Unit Price", "Country", "Issue Date", "Expiry Date", "Status", "Certificate", ""].map(h => (
                          <th key={h} style={{ padding: "11px 14px", textAlign: "left" as const, fontSize: "0.68rem", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {accreditations.map(a => {
                        const days = accDaysLeft(a.expiryDate)
                        const st = accStatusBadge(days)
                        return (
                          <tr key={a.id}
                            style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                            onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseOut={e => (e.currentTarget.style.background = "transparent")}>

                            {/* Body */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <ShieldCheck size={14} color="#2563eb" />
                                </div>
                                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827" }}>{a.body}</span>
                              </div>
                            </td>

                            {/* Standard */}
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontSize: "0.78rem", color: C.text }}>{a.standard || "—"}</span>
                            </td>

                            {/* Cert number */}
                            <td style={{ padding: "12px 14px" }}>
                              {a.certNumber
                                ? <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#374151" }}>{a.certNumber}</span>
                                : <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>—</span>
                              }
                            </td>

                            {/* Scope */}
                            <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                              <span style={{ fontSize: "0.75rem", color: C.muted, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={a.scope}>{a.scope || "—"}</span>
                            </td>

                            {/* Unit Price */}
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" as const }}>
                              {a.unitPrice ? (
                                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                                  {pricing.currency} {a.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>—</span>
                              )}
                            </td>

                            {/* Country */}
                            <td style={{ padding: "12px 14px" }}>
                              {a.country
                                ? <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#374151" }}>{a.country}</span>
                                : <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>—</span>
                              }
                            </td>

                            {/* Issue date */}
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" as const }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Calendar size={11} color={C.muted} />
                                <span style={{ fontSize: "0.75rem", color: C.muted }}>{a.issueDate ? new Date(a.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                              </div>
                            </td>

                            {/* Expiry date */}
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" as const }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Calendar size={11} color={days <= 90 && days >= 0 ? st.color : days < 0 ? st.color : C.muted} />
                                <span style={{ fontSize: "0.75rem", fontWeight: days <= 90 ? 600 : 400, color: days <= 90 ? st.color : C.muted }}>
                                  {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                </span>
                              </div>
                            </td>

                            {/* Status badge */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: "nowrap" as const }}>
                                  {days < 0 ? <AlertTriangle size={9} /> : <CheckCircle2 size={9} />}
                                  {st.label}
                                </span>
                                {a.expiryDate && (
                                  <span style={{ fontSize: "0.67rem", color: days < 0 ? "#dc2626" : days <= 30 ? "#d97706" : C.muted }}>
                                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Certificate file */}
                            <td style={{ padding: "12px 14px" }}>
                              {a.certFileData ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => setAccViewFile({ data: a.certFileData!, name: a.certFileName || "Certificate" })}
                                    title="View certificate"
                                    style={{ width: 28, height: 28, borderRadius: 7, background: "#eff6ff", border: "1px solid #bfdbfe", cursor: "pointer", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    <Eye size={12} />
                                  </button>
                                  <a href={a.certFileData} download={a.certFileName || "certificate"}
                                    style={{ width: 28, height: 28, borderRadius: 7, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                                    <Download size={12} />
                                  </a>
                                </div>
                              ) : (
                                <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 7, background: "#f8fafc", border: `1px solid ${C.border}`, color: C.muted, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" as const }}>
                                  <UploadCloud size={11} />Upload
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAccCert(a.id, f); e.target.value = "" }} />
                                </label>
                              )}
                            </td>

                            {/* Edit + Delete */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => editAccreditation(a)} title="Edit"
                                  style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button onClick={() => deleteAccreditation(a.id)} title="Delete"
                                  style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Certificate viewer overlay */}
              {accViewFile && (
                <div onClick={() => setAccViewFile(null)}
                  style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
                  <div onClick={e => e.stopPropagation()}
                    style={{ width: "92vw", maxWidth: 1100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0f172a", borderRadius: "12px 12px 0 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={15} color="#94a3b8" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0", fontFamily: F }}>{accViewFile.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={accViewFile.data} download={accViewFile.name}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "#1e3a8a", color: "#93c5fd", border: "1px solid #1d4ed8", fontSize: "0.75rem", fontWeight: 600, fontFamily: F, textDecoration: "none" }}>
                        <Download size={12} />Download
                      </a>
                      <button onClick={() => setAccViewFile(null)}
                        style={{ width: 32, height: 32, borderRadius: 7, background: "#1e293b", border: "1px solid #334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={15} color="#94a3b8" />
                      </button>
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()}
                    style={{ width: "92vw", maxWidth: 1100, height: "82vh", background: "#fff", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                    {accViewFile.data.startsWith("data:image")
                      ? <img src={accViewFile.data} alt={accViewFile.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <iframe src={accViewFile.data} style={{ width: "100%", height: "100%", border: "none" }} title={accViewFile.name} />
                    }
                  </div>
                </div>
              )}

            </div>
          )
        })()}

      </div>

      {/* ── Add Employee Modal ── */}
      {showAddEmp && (() => {
        const F2 = "'Inter',system-ui,sans-serif"
        const ef = empForm
        const initials = ef.name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?"
        const closeModal = () => { setShowAddEmp(false); setEmpForm(emptyEmpForm()); setEmpFormErr("") }
        const canSubmit = !!(ef.name && ef.email && ef.password && !addEmpPending)

        const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }
        const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12.5, color: "#111827", outline: "none", fontFamily: F2, boxSizing: "border-box", background: "#fff" }
        const sec: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9997, background: "rgba(10,15,30,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", width: "min(860px, 97vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", fontFamily: F2, background: "#fff" }}>

              {/* Header */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <input ref={empPhotoRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }}
                  onChange={e => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setEmpForm(f => ({ ...f, photoData: r.result as string })); r.readAsDataURL(file) }} />
                <div onClick={() => empPhotoRef.current?.click()}
                  style={{ width: 52, height: 52, borderRadius: 12, background: ef.photoData ? "transparent" : "#f1f5f9", border: "1.5px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                  {ef.photoData
                    ? <img src={ef.photoData} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {ef.photoData && (
                    <button onClick={e => { e.stopPropagation(); setEmpForm(f => ({ ...f, photoData: "" })) }}
                      style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      <X size={8} />
                    </button>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ef.name || "New Employee"}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{ef.jobTitle || "No title"}</span>
                    <span style={{ fontSize: 11, padding: "0px 7px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                      {ef.employmentType === "OWN" ? "Own Staff" : "Outsource"}
                    </span>
                  </div>
                </div>
                <button onClick={closeModal} style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
                  <X size={13} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Row 1: Name (wide) + Employment type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <div>
                    <label style={lbl}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
                    <input value={ef.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} style={{ ...inp, fontWeight: 600 }} autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>Employment Type</label>
                    <div style={{ display: "flex", gap: 4, height: 34 }}>
                      {(["OWN", "OUTSOURCE"] as const).map(t => (
                        <button key={t} type="button" onClick={() => setEmpForm(f => ({ ...f, employmentType: t }))}
                          style={{ padding: "0 14px", borderRadius: 7, border: ef.employmentType === t ? "1.5px solid #7c3aed" : "1px solid #e2e8f0", background: ef.employmentType === t ? "#f5f3ff" : "#fff", cursor: "pointer", fontFamily: F2, fontWeight: 600, fontSize: 12, color: ef.employmentType === t ? "#7c3aed" : "#6b7280", whiteSpace: "nowrap" as const }}>
                          {t === "OWN" ? "Own Staff" : "Outsource"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Account & Contact */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Account & Contact</p>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>Email <span style={{ color: "#dc2626" }}>*</span></label>
                      <input type="email" value={ef.email} onChange={e => setEmpForm(f => ({ ...f, email: e.target.value }))} autoComplete="new-password" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Password <span style={{ color: "#dc2626" }}>*</span></label>
                      <input type="password" value={ef.password} onChange={e => setEmpForm(f => ({ ...f, password: e.target.value }))} autoComplete="new-password" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input value={ef.phone} onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                    </div>
                  </div>
                </div>

                {/* Section: Work Details */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>Work Details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>Role <span style={{ color: "#dc2626" }}>*</span></label>
                      <select value={ef.role} onChange={e => setEmpForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Job Title</label>
                      <input value={ef.jobTitle} onChange={e => setEmpForm(f => ({ ...f, jobTitle: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Department</label>
                      <input value={ef.department} onChange={e => setEmpForm(f => ({ ...f, department: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Start Date</label>
                      <input type="date" value={ef.startDate} onChange={e => setEmpForm(f => ({ ...f, startDate: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Notes</label>
                      <input value={ef.notes} onChange={e => setEmpForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
                    </div>
                  </div>
                </div>

                {/* Section: Identity */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Identity Verification</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>IC / Passport Number</label>
                      <input value={ef.idProof} onChange={e => setEmpForm(f => ({ ...f, idProof: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Document <span style={{ fontWeight: 400, color: "#94a3b8" }}>— PDF / JPG / PNG</span></label>
                      <input ref={empDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                        onChange={e => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setEmpForm(f => ({ ...f, idDocName: file.name, idDocData: r.result as string })); r.readAsDataURL(file) }} />
                      {ef.idDocName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#1e3a8a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ef.idDocName}</span>
                          <button onClick={() => { setEmpForm(f => ({ ...f, idDocName: "", idDocData: "" })); if (empDocRef.current) empDocRef.current.value = "" }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: "1px dashed #cbd5e1", background: "#fafafa" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>No file chosen</span>
                          <button type="button" onClick={() => empDocRef.current?.click()}
                            style={{ padding: "3px 10px", borderRadius: 5, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: F2 }}>
                            Browse
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#fff", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: empFormErr ? "#dc2626" : "#94a3b8" }}>
                  {empFormErr || <>Fields marked <span style={{ color: "#dc2626" }}>*</span> are required</>}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={closeModal} style={{ padding: "7px 18px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: F2, fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={() => addEmp()} disabled={!canSubmit}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", background: canSubmit ? "#1e3a8a" : "#cbd5e1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: F2 }}
                    onMouseOver={e => { if (canSubmit) e.currentTarget.style.background = "#1d4ed8" }}
                    onMouseOut={e => { if (canSubmit) e.currentTarget.style.background = "#1e3a8a" }}>
                    {addEmpPending ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={12} />}
                    {addEmpPending ? "Creating…" : "Create Employee"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── Edit Employee Modal ── */}
      {editingEmp && (() => {
        const F2 = "'Inter',system-ui,sans-serif"
        const ef = editForm
        const closeModal = () => setEditingEmp(null)
        const canSave = !!(ef.name && !saveEmpPending)

        const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }
        const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12.5, color: "#111827", outline: "none", fontFamily: F2, boxSizing: "border-box", background: "#fff" }
        const sec: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,15,30,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", width: "min(860px, 97vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", fontFamily: F2, background: "#fff" }}>

              {/* Header */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <input ref={editPhotoRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }}
                  onChange={e => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setEditForm(f => ({ ...f, photoData: r.result as string })); r.readAsDataURL(file) }} />
                <div onClick={() => editPhotoRef.current?.click()}
                  style={{ width: 52, height: 52, borderRadius: 12, background: ef.photoData ? "transparent" : "#f1f5f9", border: "1.5px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                  {ef.photoData
                    ? <img src={ef.photoData} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {ef.photoData && (
                    <button onClick={e => { e.stopPropagation(); setEditForm(f => ({ ...f, photoData: "" })) }}
                      style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                      <X size={8} />
                    </button>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ef.name || editingEmp.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{editingEmp.email} · editing profile</p>
                </div>
                <button onClick={closeModal} style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
                  <X size={13} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Row 1: Name + Employment type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <div>
                    <label style={lbl}>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
                    <input value={ef.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ ...inp, fontWeight: 600 }} autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>Employment Type</label>
                    <div style={{ display: "flex", gap: 4, height: 34 }}>
                      {(["OWN", "OUTSOURCE"] as const).map(t => (
                        <button key={t} type="button" onClick={() => setEditForm(f => ({ ...f, employmentType: t }))}
                          style={{ padding: "0 14px", borderRadius: 7, border: ef.employmentType === t ? "1.5px solid #7c3aed" : "1px solid #e2e8f0", background: ef.employmentType === t ? "#f5f3ff" : "#fff", cursor: "pointer", fontFamily: F2, fontWeight: 600, fontSize: 12, color: ef.employmentType === t ? "#7c3aed" : "#6b7280", whiteSpace: "nowrap" as const }}>
                          {t === "OWN" ? "Own Staff" : "Outsource"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Account & Contact */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Account & Contact</p>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>Email (read-only)</label>
                      <input value={editingEmp?.email ?? ""} readOnly style={{ ...inp, background: "#f8fafc", color: "#94a3b8" }} />
                    </div>
                    <div>
                      <label style={lbl}>Phone</label>
                      <input value={ef.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                    </div>
                  </div>
                </div>

                {/* Section: Work Details */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>Work Details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>Role</label>
                      <select value={ef.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                        {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Job Title</label>
                      <input value={ef.jobTitle} onChange={e => setEditForm(f => ({ ...f, jobTitle: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Department</label>
                      <input value={ef.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Start Date</label>
                      <input type="date" style={{ ...inp, color: "#94a3b8" }} disabled />
                    </div>
                    <div>
                      <label style={lbl}>Notes</label>
                      <input value={ef.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
                    </div>
                  </div>
                </div>

                {/* Section: Identity */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8edf5", padding: "12px 14px" }}>
                  <p style={sec}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Identity Verification</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                    <div>
                      <label style={lbl}>IC / Passport Number</label>
                      <input value={ef.idProof} onChange={e => setEditForm(f => ({ ...f, idProof: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Document <span style={{ fontWeight: 400, color: "#94a3b8" }}>— PDF / JPG / PNG</span></label>
                      <input ref={editDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                        onChange={e => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setEditForm(f => ({ ...f, idDocName: file.name, idDocData: r.result as string })); r.readAsDataURL(file) }} />
                      {ef.idDocName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#1e3a8a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ef.idDocName}</span>
                          <a href={ef.idDocData} download={ef.idDocName} style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textDecoration: "none", fontFamily: F2 }}>Download</a>
                          <button onClick={() => { setEditForm(f => ({ ...f, idDocName: "", idDocData: "" })); if (editDocRef.current) editDocRef.current.value = "" }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: "1px dashed #cbd5e1", background: "#fafafa" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>No file chosen</span>
                          <button type="button" onClick={() => editDocRef.current?.click()}
                            style={{ padding: "3px 10px", borderRadius: 5, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: F2 }}>
                            Browse
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "10px 20px", background: "#fff", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
                <button onClick={closeModal} style={{ padding: "7px 18px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: F2, fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={() => saveEmp()} disabled={!canSave}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 20px", background: canSave ? "#1e3a8a" : "#cbd5e1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", fontFamily: F2 }}
                  onMouseOver={e => { if (canSave) e.currentTarget.style.background = "#1d4ed8" }}
                  onMouseOut={e => { if (canSave) e.currentTarget.style.background = "#1e3a8a" }}>
                  {saveEmpPending ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={12} />}
                  {saveEmpPending ? "Saving…" : "Save Changes"}
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── File Preview Modal ── */}
      {previewFile && (
        <div onClick={() => setPreviewFile(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#1e293b", borderRadius: 14, overflow: "hidden", width: "min(860px,96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #334155", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{previewFile.name}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={previewFile.data} download={previewFile.name}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, background: "#334155", color: "#e2e8f0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </a>
                <button onClick={() => setPreviewFile(null)}
                  style={{ width: 30, height: 30, borderRadius: 7, background: "#334155", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  ✕
                </button>
              </div>
            </div>
            {/* Preview area */}
            <div style={{ flex: 1, overflow: "auto", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              {previewFile.data.startsWith("data:image/") ? (
                <img src={previewFile.data} alt={previewFile.name}
                  style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
              ) : previewFile.data.startsWith("data:application/pdf") ? (
                <embed src={previewFile.data} type="application/pdf"
                  style={{ width: "100%", height: "80vh", border: "none" }} />
              ) : (
                <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>Preview not available for this file type.</p>
                  <a href={previewFile.data} download={previewFile.name}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "#334155", color: "#e2e8f0", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Accreditation Modal ── */}
      {showAccForm && (
        <div onClick={() => { setShowAccForm(false); setAccForm(emptyAccForm()); setEditingAccId(null) }}
          style={{ position: "fixed", inset: 0, zIndex: 9997, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 28, width: 680, maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", fontFamily: "'Inter',system-ui,sans-serif" }}>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>{editingAccId ? "Edit Scope Record" : "New Scope Record"}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{editingAccId ? "Update the accreditation scope details" : "Add an accreditation scope with unit price"}</p>
              </div>
              <button onClick={() => { setShowAccForm(false); setAccForm(emptyAccForm()); setEditingAccId(null) }}
                style={{ width: 30, height: 30, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Form fields */}
            {(() => {
              const af = accForm
              const any = !!(af.body || af.standard || af.certNumber || af.scope || af.country || af.issueDate || af.expiryDate || af.notes)
              const F2 = "'Inter',system-ui,sans-serif"
              const fb = (val: string, _req = false) => ({
                background: any && !val ? "#dbeafe" : "#fff",
                border: `1px solid ${C.border}`,
              })
              const lbl2: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  {/* Body */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Accreditation Body *</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={af.body} onChange={e => setAccForm(f => ({ ...f, body: e.target.value }))}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.body, true) }} />
                      <button type="button" onClick={() => setShowBodyPicker(true)}
                        style={{ padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", whiteSpace: "nowrap", fontFamily: F2 }}>
                        Browse
                      </button>
                    </div>
                  </div>
                  {/* Standard */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Standard / Framework</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={af.standard} onChange={e => setAccForm(f => ({ ...f, standard: e.target.value }))}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.standard) }} />
                      <button type="button" onClick={() => setShowStandardPicker(true)}
                        style={{ padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", whiteSpace: "nowrap", fontFamily: F2 }}>
                        Browse
                      </button>
                    </div>
                  </div>
                  {/* Cert number */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Certificate Number</label>
                    <input value={af.certNumber} onChange={e => setAccForm(f => ({ ...f, certNumber: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.certNumber) }} />
                  </div>
                  {/* Scope */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Scope Description</label>
                    <input value={af.scope} onChange={e => setAccForm(f => ({ ...f, scope: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.scope) }} />
                  </div>
                  {/* Unit Price */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Unit Price (per service)</label>
                    <div style={{ display: "flex", gap: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", padding: "0 12px", borderRadius: "7px 0 0 7px", border: `1px solid ${C.border}`, borderRight: "none", background: "#f8fafc", fontSize: 12, fontWeight: 700, color: "#374151", whiteSpace: "nowrap" as const }}>
                        {pricing.currency} {getCurrencySymbol(pricing.currency)}
                      </span>
                      <input type="number" min={0} step={0.01} value={af.unitPrice || ""}
                        placeholder="0.00"
                        onChange={e => setAccForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "0 7px 7px 0", border: `1px solid ${C.border}`, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2 }} />
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "0.67rem", color: C.muted }}>Using system currency. Change in Pricing Configuration.</p>
                  </div>
                  {/* Country */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Country of Accreditation</label>
                    <select value={af.country} onChange={e => setAccForm(f => ({ ...f, country: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, cursor: "pointer", ...fb(af.country) }}>
                      <option value="">— select country —</option>
                      {ACC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Issue date */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Issue Date</label>
                    <input type="date" value={af.issueDate} onChange={e => setAccForm(f => ({ ...f, issueDate: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.issueDate) }} />
                  </div>
                  {/* Expiry date */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl2}>Expiry Date *</label>
                    <input type="date" value={af.expiryDate} onChange={e => setAccForm(f => ({ ...f, expiryDate: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", ...fb(af.expiryDate, true) }} />
                  </div>
                  {/* Notes */}
                  <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                    <label style={lbl2}>Notes</label>
                    <textarea value={af.notes} onChange={e => setAccForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 13, color: C.textDark, outline: "none", fontFamily: F2, boxSizing: "border-box", resize: "vertical", ...fb(af.notes) }} />
                  </div>
                </div>
              )
            })()}

            {/* Footer */}
            <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
              <button onClick={saveAccreditation} disabled={!accForm.body || !accForm.expiryDate}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", background: accForm.body && accForm.expiryDate ? C.primary : "#94a3b8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: accForm.body && accForm.expiryDate ? "pointer" : "not-allowed", fontFamily: "'Inter',system-ui,sans-serif" }}>
                <Save size={13} />Save Record
              </button>
              <button onClick={() => { setShowAccForm(false); setAccForm(emptyAccForm()); setEditingAccId(null) }}
                style={{ padding: "8px 16px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',system-ui,sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body Picker Modal ── */}
      {showBodyPicker && (
        <div onClick={() => setShowBodyPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 24, width: 620, maxHeight: "78vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", fontFamily: "'Inter',system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Select Accreditation Body</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Click to fill, or type your own in the field above</p>
              </div>
              <button onClick={() => setShowBodyPicker(false)}
                style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {ACC_BODY_LIST.map(b => (
                <button key={b.abbr} type="button"
                  onClick={() => { setAccForm(f => ({ ...f, body: b.full, country: b.countryFull })); setShowBodyPicker(false) }}
                  style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left" as const, transition: "border-color 0.12s, background 0.12s", fontFamily: "'Inter',system-ui,sans-serif" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe" }}
                  onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <img src={`https://flagcdn.com/w40/${b.iso}.png`} alt={b.country}
                      style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 5, flexShrink: 0, border: "1px solid #e2e8f0" }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#111827" }}>{b.abbr}</p>
                      <p style={{ margin: 0, fontSize: "0.67rem", color: "#64748b" }}>{b.country}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.67rem", color: "#94a3b8", lineHeight: 1.35 }}>{b.full}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Standard Picker Modal ── */}
      {showStandardPicker && (
        <div onClick={() => setShowStandardPicker(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 24, width: 560, maxHeight: "78vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", fontFamily: "'Inter',system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Select Standard / Framework</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>Click to fill, or type your own in the field above</p>
              </div>
              <button onClick={() => setShowStandardPicker(false)}
                style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {ACC_STANDARD_LIST.map(s => (
                <button key={s.code} type="button"
                  onClick={() => { setAccForm(f => ({ ...f, standard: s.full })); setShowStandardPicker(false) }}
                  style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left" as const, display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.12s, background 0.12s", fontFamily: "'Inter',system-ui,sans-serif" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe" }}
                  onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.code}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>{s.full}</p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </OfficeLayout>
  )
}
