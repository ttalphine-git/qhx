import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, HH:mm')
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(d, new Date())
}

export function formatCurrency(amount: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(amount)
}

export function truncate(str: string, length = 40): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

// ─── Design tokens — exact SOMLITS theme ──────────────────────────────────────

export const C = {
  // Navigation bar — deep navy #0f2170, matching SOMLITS app.layout.module.css
  nav:             '#0f2170',
  navHover:        'rgba(255,255,255,0.15)',
  navActive:       'rgba(255,255,255,0.22)',
  navText:         'rgba(255,255,255,0.55)',
  navTextActive:   '#ffffff',
  navBorder:       'rgba(255,255,255,0.08)',

  // Sub-header — light blue bar below nav, the most distinctive SOMLITS element
  subheaderBg:     '#eaf2ff',
  subheaderBorder: '#c7dff7',
  subheaderTitle:  '#0f2170',
  subheaderMuted:  '#7aaed6',

  // Brand
  primary:         '#0b5ed7',
  primaryHover:    '#063b88',
  accent:          '#0ea5e9',

  // Backgrounds — content area is white in SOMLITS
  bg:              '#ffffff',
  pageBg:          '#edf5ff',
  white:           '#ffffff',
  card:            '#ffffff',
  cardShadow:      '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',

  // Text
  textDark:        '#0f172a',
  text:            '#334155',
  muted:           '#64748b',

  // Borders
  border:          '#e5e7eb',
  borderStrong:    '#cbd5e1',
} as const

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusStyle { bg: string; color: string; dot: string; label: string }

const STATUS_MAP: Record<string, StatusStyle> = {
  DRAFT:                        { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: 'Draft' },
  SUBMITTED:                    { bg: '#dbeef9', color: '#0067b8', dot: '#0078d4', label: 'Submitted' },
  APPLICATION_REVIEW:           { bg: '#f0e6f6', color: '#6b4fa0', dot: '#8764b8', label: 'App. Review' },
  UNDER_REVIEW:                 { bg: '#f0e6f6', color: '#6b4fa0', dot: '#8764b8', label: 'Under Review' },
  INFORMATION_REQUESTED:        { bg: '#fff0e5', color: '#8a3c00', dot: '#ca5010', label: 'Info Requested' },
  QUOTED:                       { bg: '#e5e9ff', color: '#3b3fb8', dot: '#4f52b2', label: 'Quoted' },
  PENDING_PAYMENT:              { bg: '#fff8e5', color: '#8a6000', dot: '#ffb900', label: 'Pending Payment' },
  PAYMENT_REVIEW:               { bg: '#fff8e5', color: '#8a6000', dot: '#ffb900', label: 'Payment Review' },
  AGREEMENT_PENDING:            { bg: '#fff0e5', color: '#8a3c00', dot: '#ca5010', label: 'Agreement Pending' },
  AGREEMENT_REVIEW:             { bg: '#fff0e5', color: '#8a3c00', dot: '#ca5010', label: 'Agreement Review' },
  AGREEMENT_APPROVED_BY_HCB:   { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Agreement Approved' },
  AUDIT_PLANNING:               { bg: '#e0f0ff', color: '#0057a3', dot: '#0078d4', label: 'Audit Planning' },
  AUDIT_SCHEDULED:              { bg: '#e5f0ff', color: '#004ea8', dot: '#0063b1', label: 'Audit Scheduled' },
  AUDIT_IN_PROGRESS:            { bg: '#e5e9ff', color: '#3b3fb8', dot: '#4f52b2', label: 'Audit In Progress' },
  AUDIT_COMPLETED:              { bg: '#e5f4f0', color: '#005e4e', dot: '#008272', label: 'Audit Completed' },
  NONCONFORMITY_RESPONSE:       { bg: '#fff0e5', color: '#8a3c00', dot: '#ca5010', label: 'NC Response' },
  CORRECTIVE_ACTION_REVIEW:     { bg: '#fef3e5', color: '#7a4500', dot: '#d07a00', label: 'CA Review' },
  TECHNICAL_REVIEW:             { bg: '#f0e6f6', color: '#5c2d91', dot: '#7719aa', label: 'Technical Review' },
  HALAL_REVIEW:                 { bg: '#e6f4e8', color: '#156b20', dot: '#1a8a27', label: 'Halal Review' },
  CERTIFICATION_REVIEW:         { bg: '#f0e5f4', color: '#5c2d91', dot: '#7719aa', label: 'Cert. Review' },
  CERTIFICATION_DECISION:       { bg: '#e8f0fe', color: '#1a56db', dot: '#1c64f2', label: 'Cert. Decision' },
  APPROVED:                     { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Approved' },
  CERTIFICATE_ISSUED:           { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Certificate Issued' },
  CERTIFIED:                    { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Certified' },
  REJECTED:                     { bg: '#fde7e9', color: '#d13438', dot: '#d13438', label: 'Rejected' },
  SUSPENDED:                    { bg: '#fff8e5', color: '#8a6000', dot: '#ffb900', label: 'Suspended' },
  WITHDRAWN:                    { bg: '#fde7e9', color: '#7a1a1a', dot: '#b91c1c', label: 'Withdrawn' },
  EXPIRED:                      { bg: '#fde7e9', color: '#a80000', dot: '#d13438', label: 'Expired' },
  RENEWAL_DUE:                  { bg: '#fff3cd', color: '#664d03', dot: '#fd7e14', label: 'Renewal Due' },
  // Payment
  PENDING:              { bg: '#fff8e5', color: '#8a6000', dot: '#ffb900', label: 'Pending' },
  PROCESSING:           { bg: '#dbeef9', color: '#0067b8', dot: '#0078d4', label: 'Processing' },
  COMPLETED:            { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Completed' },
  FAILED:               { bg: '#fde7e9', color: '#d13438', dot: '#d13438', label: 'Failed' },
  REFUNDED:             { bg: '#f0e6f6', color: '#6b4fa0', dot: '#8764b8', label: 'Refunded' },
  // Generic
  ACTIVE:               { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Active' },
  INACTIVE:             { bg: '#fde7e9', color: '#d13438', dot: '#d13438', label: 'Inactive' },
  OPEN:                 { bg: '#fff8e5', color: '#8a6000', dot: '#ffb900', label: 'Open' },
  CLOSED:               { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Closed' },
  RESOLVED:             { bg: '#e6f4e6', color: '#107c10', dot: '#107c10', label: 'Resolved' },
  ISSUED:               { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Issued' },
  PENDING_RENEWAL:      { bg: '#fff3cd', color: '#664d03', dot: '#fd7e14', label: 'Pending Renewal' },
}

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_MAP[status] ?? { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: status }
}

// ─── Application stages ───────────────────────────────────────────────────────

export const APPLICATION_STAGES = [
  { key: 'DRAFT',                    label: 'Draft' },
  { key: 'SUBMITTED',                label: 'Submitted' },
  { key: 'APPLICATION_REVIEW',       label: 'App Review' },
  { key: 'PENDING_PAYMENT',          label: 'Payment' },
  { key: 'AUDIT_PLANNING',           label: 'Audit Plan' },
  { key: 'AUDIT_SCHEDULED',          label: 'Scheduled' },
  { key: 'AUDIT_IN_PROGRESS',        label: 'In Progress' },
  { key: 'AUDIT_COMPLETED',          label: 'Audit Done' },
  { key: 'TECHNICAL_REVIEW',         label: 'Tech Review' },
  { key: 'HALAL_REVIEW',             label: 'Halal Review' },
  { key: 'CERTIFICATION_DECISION',   label: 'Decision' },
  { key: 'CERTIFICATE_ISSUED',       label: 'Certified' },
] as const

export function getStageIndex(status: string): number {
  return APPLICATION_STAGES.findIndex(s => s.key === status)
}

export function getPriorityStyle(priority: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    CRITICAL: { color: '#d13438', bg: '#fde7e9' },
    HIGH:     { color: '#ca5010', bg: '#fff0e5' },
    MEDIUM:   { color: '#8a6000', bg: '#fff8e5' },
    LOW:      { color: '#107c10', bg: '#e6f4e6' },
  }
  return map[priority] ?? { color: '#6c757d', bg: '#f3f4f6' }
}
