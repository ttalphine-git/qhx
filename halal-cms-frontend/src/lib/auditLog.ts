export type AuditCategory = 'APPLICATION' | 'PROFILE' | 'PAYMENT' | 'AUDIT' | 'CERTIFICATE' | 'SYSTEM'
export type AuditRole = 'Customer' | 'HCB Office' | 'System'

export interface AuditLogEntry {
  id: string
  applicationId: string
  applicationNumber: string
  companyName: string
  timestamp: string
  actor: string
  role: AuditRole
  action: string
  details?: string
  oldStatus?: string
  newStatus?: string
  category: AuditCategory
}

const STORAGE_KEY = 'hcs_audit_logs'
const MAX_LOGS = 2000

export function getAuditLogs(): AuditLogEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  const all = getAuditLogs()
  localStorage.setItem(KEY, JSON.stringify([log, ...all].slice(0, MAX)))
  return log
}

export function getLogsForApp(applicationId: string): AuditLogEntry[] {
  return getAuditLogs().filter(l => l.applicationId === applicationId)
}

export function clearAuditLogs() {
  localStorage.removeItem(KEY)
}
