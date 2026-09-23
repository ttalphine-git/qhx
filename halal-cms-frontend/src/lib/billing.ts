// Billing, Invoice, and Stripe configuration utilities

export const BILLING_PREFIX   = "hcs_billing_"
export const INVOICES_KEY     = "hcs_invoices"
export const STRIPE_CFG_KEY   = "hcs_stripe_config"
export const BANK_DETAILS_KEY = "hcs_bank_details"

export interface BankDetails {
  bankName:      string
  accountName:   string
  accountNumber: string
  swiftBic:      string
  iban:          string
  branchCode:    string
  bankAddress:   string
}

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: "", accountName: "", accountNumber: "", swiftBic: "", iban: "", branchCode: "", bankAddress: "",
}

export function loadBankDetails(): BankDetails {
  try { return { ...DEFAULT_BANK_DETAILS, ...JSON.parse(localStorage.getItem(BANK_DETAILS_KEY) || "{}") } }
  catch { return DEFAULT_BANK_DETAILS }
}

export function saveBankDetails(d: BankDetails) {
  localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(d))
}

export interface BillingLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ApplicationBilling {
  applicationId: string
  applicationNumber: string
  companyName: string
  lineItems: BillingLineItem[]
  subtotal: number
  vatPct: number
  vatAmount: number
  total: number
  currency: string
  savedAt: string
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod  = 'STRIPE' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'

export interface Invoice {
  id: string
  applicationId: string
  applicationNumber: string
  companyName: string
  invoiceNumber: string
  issuedAt: string
  dueDate: string
  status: InvoiceStatus
  lineItems: BillingLineItem[]
  subtotal: number
  vatPct: number
  vatAmount: number
  total: number
  currency: string
  paymentMethod?: PaymentMethod
  paymentReference?: string
  paymentDate?: string
  paymentEvidenceBase64?: string
  paymentEvidenceFileName?: string
  stripeSessionId?: string
  notes?: string
  sentAt?: string
  emailedTo?: string
}

export interface StripeConfig {
  publishableKey: string
  webhookSecret: string
  enabled: boolean
}

// ── Application Billing ──────────────────────────────────────────────────────

export function loadApplicationBilling(applicationId: string | number): ApplicationBilling | null {
  try {
    const s = localStorage.getItem(`${BILLING_PREFIX}${applicationId}`)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function saveApplicationBilling(b: ApplicationBilling) {
  localStorage.setItem(`${BILLING_PREFIX}${b.applicationId}`, JSON.stringify(b))
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export function loadInvoices(): Invoice[] {
  try { return JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]') } catch { return [] }
}

export function loadInvoiceByApp(applicationId: string | number): Invoice | null {
  return loadInvoices().find(i => String(i.applicationId) === String(applicationId)) ?? null
}

export function saveInvoice(invoice: Invoice) {
  const list = loadInvoices()
  const idx  = list.findIndex(i => i.id === invoice.id)
  if (idx >= 0) list[idx] = invoice; else list.push(invoice)
  localStorage.setItem(INVOICES_KEY, JSON.stringify(list))
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const seq  = String(loadInvoices().length + 1).padStart(4, '0')
  return `INV-${year}-${seq}`
}

export function createInvoiceFromBilling(billing: ApplicationBilling): Invoice {
  const now = new Date()
  const due = new Date(now)
  due.setDate(due.getDate() + 30)
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    applicationId: billing.applicationId,
    applicationNumber: billing.applicationNumber,
    companyName: billing.companyName,
    invoiceNumber: generateInvoiceNumber(),
    issuedAt: now.toISOString(),
    dueDate: due.toISOString(),
    status: 'DRAFT',
    lineItems: billing.lineItems,
    subtotal: billing.subtotal,
    vatPct: billing.vatPct,
    vatAmount: billing.vatAmount,
    total: billing.total,
    currency: billing.currency,
  }
}

// ── Payment Evidence ──────────────────────────────────────────────────────────

export type EvidenceStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface PaymentEvidence {
  id: string
  base64: string
  fileName: string
  mimeType: string
  uploadedAt: string
  status: EvidenceStatus
  note?: string
  reviewedAt?: string
  transactionRef?: string
}

const EVIDENCE_PREFIX = 'hcs_evidences_'

export function loadPaymentEvidences(applicationId: string | number): PaymentEvidence[] {
  try {
    const stored = localStorage.getItem(EVIDENCE_PREFIX + String(applicationId))
    if (stored) return JSON.parse(stored)
    // Migrate old single-evidence format
    const old = JSON.parse(localStorage.getItem('hcs_pay_evidence_' + String(applicationId)) || 'null')
    if (old?.base64) {
      const migrated: PaymentEvidence[] = [{
        id: 'ev_legacy_' + Date.now(),
        base64: old.base64,
        fileName: old.fileName ?? 'evidence',
        mimeType: (old.fileName ?? '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedAt: old.uploadedAt ?? new Date().toISOString(),
        status: 'PENDING',
      }]
      savePaymentEvidences(applicationId, migrated)
      return migrated
    }
    return []
  } catch { return [] }
}

export function savePaymentEvidences(applicationId: string | number, list: PaymentEvidence[]) {
  localStorage.setItem(EVIDENCE_PREFIX + String(applicationId), JSON.stringify(list))
}

export function addPaymentEvidence(applicationId: string | number, ev: Omit<PaymentEvidence, 'id'>): PaymentEvidence {
  const list = loadPaymentEvidences(applicationId)
  const item: PaymentEvidence = { ...ev, id: 'ev_' + Math.random().toString(36).slice(2) + Date.now() }
  list.push(item)
  savePaymentEvidences(applicationId, list)
  return item
}

export function updatePaymentEvidence(applicationId: string | number, id: string, patch: Partial<PaymentEvidence>) {
  const list = loadPaymentEvidences(applicationId)
  const idx  = list.findIndex(e => e.id === id)
  if (idx >= 0) { list[idx] = { ...list[idx], ...patch }; savePaymentEvidences(applicationId, list) }
}

// ── Stripe Config ─────────────────────────────────────────────────────────────

export function loadStripeConfig(): StripeConfig {
  try {
    return { publishableKey: '', webhookSecret: '', enabled: false, ...JSON.parse(localStorage.getItem(STRIPE_CFG_KEY) || '{}') }
  } catch { return { publishableKey: '', webhookSecret: '', enabled: false } }
}

export function saveStripeConfig(cfg: StripeConfig) {
  localStorage.setItem(STRIPE_CFG_KEY, JSON.stringify(cfg))
}

// ── Status styling ────────────────────────────────────────────────────────────

export function invoiceStatusStyle(status: InvoiceStatus): { bg: string; color: string; dot: string } {
  switch (status) {
    case 'DRAFT':     return { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
    case 'ISSUED':    return { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' }
    case 'PAID':      return { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' }
    case 'OVERDUE':   return { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' }
    case 'CANCELLED': return { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' }
  }
}

export function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function downloadInvoicePDF(invoice: Invoice): void {
  const cur = invoice.currency
  const fmt = (n: number) => cur + ' ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fd  = (iso: string) => formatInvoiceDate(iso)

  const rows = invoice.lineItems.map((li, i) =>
    '<tr style="background:' + (i % 2 === 0 ? '#f8fafc' : '#fff') + ';border-bottom:1px solid #e2e8f0">' +
      '<td style="padding:10px 16px;font-size:13px;color:#111827">' + li.description + '</td>' +
      '<td style="padding:10px 16px;text-align:center;font-size:13px;color:#64748b">' + li.quantity + '</td>' +
      '<td style="padding:10px 16px;text-align:right;font-size:13px;color:#64748b">' + fmt(li.unitPrice) + '</td>' +
      '<td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:#111827">' + fmt(li.total) + '</td>' +
    '</tr>'
  ).join('')

  const paidStamp = invoice.status === 'PAID' ? (
    '<div style="margin-top:20px;padding:14px 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">' +
    '<span style="font-weight:700;font-size:14px;color:#15803d">PAID</span>' +
    (invoice.paymentDate ? '<span style="font-size:12px;color:#166534;margin-left:12px">' + fd(invoice.paymentDate) + (invoice.paymentReference ? ' &nbsp;Ref: ' + invoice.paymentReference : '') + '</span>' : '') +
    '</div>'
  ) : ''

  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
    '<title>Invoice ' + invoice.invoiceNumber + '</title>' +
    '<style>' +
    '@page{size:A4;margin:20mm 16mm}' +
    'body{margin:0;padding:0;font-family:"Helvetica Neue",Arial,sans-serif;color:#111827}' +
    'table{border-collapse:collapse;width:100%}' +
    '@media print{.no-print{display:none!important}}' +
    '</style></head><body>' +
    '<div style="max-width:720px;margin:0 auto;padding:40px 0">' +

    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;margin-bottom:28px;border-bottom:3px solid #0f2170">' +
      '<div>' +
        '<div style="font-size:16px;font-weight:800;color:#0f2170">HCS Halal Certification Body</div>' +
        '<div style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.8">' +
          'Level 12, Menara HCS, Jalan Semantan<br/>' +
          '50490 Kuala Lumpur, Malaysia<br/>' +
          'Tel: +60 3-2123 4567 &nbsp;|&nbsp; certification@hcs.com.my' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:36px;font-weight:900;color:#0f2170;line-height:1">INVOICE</div>' +
        '<div style="margin-top:12px;font-size:12px;color:#64748b;line-height:2">' +
          '<span style="color:#111827;font-weight:600">Invoice No.&nbsp;</span>' + invoice.invoiceNumber + '<br/>' +
          '<span style="color:#111827;font-weight:600">Date Issued&nbsp;</span>' + fd(invoice.issuedAt) + '<br/>' +
          '<span style="color:#111827;font-weight:600">Due Date&nbsp;</span>' + fd(invoice.dueDate) +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="margin-bottom:28px">' +
      '<div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:6px">Bill To</div>' +
      '<div style="font-size:16px;font-weight:700;color:#111827">' + (invoice.companyName || '—') + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:4px">Application Ref: ' + invoice.applicationNumber + '</div>' +
    '</div>' +

    '<table>' +
      '<thead><tr style="background:#0f2170">' +
        '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em">Description</th>' +
        '<th style="padding:11px 16px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;width:48px">Qty</th>' +
        '<th style="padding:11px 16px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;width:130px">Unit Price</th>' +
        '<th style="padding:11px 16px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.08em;width:130px">Amount</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>' +

    '<div style="display:flex;justify-content:flex-end;border-top:2px solid #e2e8f0">' +
      '<table style="min-width:280px;border-collapse:collapse">' +
        '<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;text-align:right">Subtotal</td><td style="padding:8px 16px;font-size:13px;text-align:right;min-width:110px">' + fmt(invoice.subtotal) + '</td></tr>' +
        '<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 16px;font-size:13px;color:#64748b;text-align:right">VAT / Tax (' + invoice.vatPct + '%)</td><td style="padding:8px 16px;font-size:13px;text-align:right">' + fmt(invoice.vatAmount) + '</td></tr>' +
        '<tr style="background:#0f2170"><td style="padding:13px 16px;font-size:14px;font-weight:800;color:#fff;text-align:right">TOTAL DUE</td><td style="padding:13px 16px;font-size:17px;font-weight:800;color:#fff;text-align:right">' + fmt(invoice.total) + '</td></tr>' +
      '</table>' +
    '</div>' +

    '<div style="margin-top:28px;padding:18px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">' +
      '<div style="font-size:11px;font-weight:700;color:#0f2170;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">Payment Instructions</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px">' +
        '<div style="line-height:2"><strong>Bank Name:</strong> Maybank Berhad<br/><strong>Account Name:</strong> HCS Halal Certification Body Sdn Bhd<br/><strong>Account No.:</strong> 5621-4567-8901</div>' +
        '<div style="line-height:2"><strong>SWIFT / BIC:</strong> MBBEMYKL<br/><strong>Payment Ref.:</strong> ' + invoice.invoiceNumber + '</div>' +
      '</div>' +
    '</div>' +

    paidStamp +

    '<div style="margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8">' +
      'Thank you for choosing HCS Halal Certification. For queries please contact certification@hcs.com.my' +
    '</div>' +

    '</div>' +
    '<script>window.onload=function(){window.print();}</script>' +
    '</body></html>'

  const win = window.open('', '_blank', 'width=900,height=1200')
  if (win) { win.document.write(html); win.document.close() }
}
