import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, FileText, CreditCard,
  Activity, CheckCircle, Circle, AlertTriangle, Download,
  User, ClipboardList, CalendarCheck, ShieldAlert, ShieldCheck,
  Award, Plus, Trash2, Save, ChevronDown, ChevronUp, CheckSquare, Square, X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getApplication, getCompanyInfo, getServiceInfo, getApplicationDocuments, getPaymentStatus, getEventLogs } from '@/api/applications'
import {
  getApplicationAuditReport,
  getAuditReportConfigurations,
  getAuditStatus,
  getAuditPlan,
  getNonConformities,
  saveApplicationAuditReport,
  saveAuditPlan as saveAuditPlanApi,
  type ApplicationAuditReportDto,
  type AuditReportConfigurationDto,
} from '@/api/audits'
import { C, getStatusStyle, APPLICATION_STAGES, getStageIndex, formatDate, formatDateTime, formatCurrency, timeAgo } from '@/lib/utils'
import { DEFAULT_AUDIT_TRACKS, loadCertificateTemplate, type AuditTrack } from '@/lib/hcbWorkflow'
import { CHECKLISTS, type AuditType } from '@/lib/uploaded-audit/checklists'
import { loadActivityCategorySettings, type ActivityCategorySetting } from '@/lib/activityOptions'
import {
  loadApplicationBilling, loadInvoiceByApp, createInvoiceFromBilling, saveInvoice,
  invoiceStatusStyle, formatInvoiceDate,
  type Invoice, type InvoiceStatus,
} from '@/lib/billing'
import type {
  LocalApplicationReview, LocalAuditPlanDetail, LocalNonConformity,
  LocalCorrectiveAction, LocalTechnicalReview, LocalHalalReview,
  LocalCertDecision, LocalGeneratedCertificate,
} from '@/types'
import { NcsTab } from '@/components/NcsTab'
import { AuditSummaryTab } from '@/components/AuditSummaryTab'
import { DecisionMakingTab } from '@/components/DecisionMakingTab'
import { CertificateManagementTab } from '@/components/CertificateManagementTab'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsLoad<T>(key: string, def: T): T {
  try { return { ...def, ...JSON.parse(localStorage.getItem(key) || '{}') } }
  catch { return def }
}
function lsArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[] }
  catch { return [] }
}
function lsSave(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

// ─── Status Pipeline ──────────────────────────────────────────────────────────

function StatusPipeline({ currentStatus }: { currentStatus: string }) {
  const TERMINAL = ['REJECTED', 'SUSPENDED', 'WITHDRAWN', 'EXPIRED']
  const isTerminal = TERMINAL.includes(currentStatus)
  const currentIndex = isTerminal ? APPLICATION_STAGES.length - 1 : getStageIndex(currentStatus)

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ minWidth: 700, position: 'relative', paddingTop: 8, paddingBottom: 4 }}>
        <div style={{ position: 'absolute', top: 22, left: 24, right: 24, height: 2, background: '#e5e7eb' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {APPLICATION_STAGES.map((stage, idx) => {
            const done = idx < currentIndex
            const active = idx === currentIndex
            const upcoming = idx > currentIndex
            const style = getStatusStyle(stage.key)
            return (
              <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {idx > 0 && <div style={{ position: 'absolute', top: 20, right: '50%', width: '50%', height: 2, background: idx <= currentIndex ? C.primary : '#e5e7eb' }} />}
                {idx < APPLICATION_STAGES.length - 1 && <div style={{ position: 'absolute', top: 20, left: '50%', width: '50%', height: 2, background: idx < currentIndex ? C.primary : '#e5e7eb' }} />}
                {done && <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f4e6', border: '2px solid #107c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={16} color="#107c10" /></div>}
                {active && !isTerminal && <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, border: `3px solid ${C.primary}`, boxShadow: `0 0 0 4px ${C.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /></div>}
                {active && isTerminal && <div style={{ width: 40, height: 40, borderRadius: '50%', background: style.bg, border: `2px solid ${style.dot}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: style.color }}>!</div>}
                {upcoming && <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} /></div>}
                <p style={{ marginTop: 6, fontSize: 10, fontWeight: active ? 700 : 500, textAlign: 'center', lineHeight: 1.3, padding: '0 4px', color: done ? '#107c10' : active ? (isTerminal ? style.color : C.primary) : '#9ca3af' }}>{stage.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function EventDot({ event }: { event: string }) {
  const name = event?.toUpperCase() ?? ''
  let color: string = C.primary
  if (name.includes('PAYMENT') || name.includes('INVOICE')) color = '#ffb900'
  else if (name.includes('DOCUMENT') || name.includes('UPLOAD')) color = '#8764b8'
  else if (name.includes('AUDIT') || name.includes('SCHEDULE')) color = '#107c10'
  else if (name.includes('REJECT') || name.includes('SUSPEND')) color = '#d13438'
  return <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
}

function StatusChip({ status }: { status: string }) {
  const s = getStatusStyle(status)
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{status.replace(/_/g, ' ')}</span>
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, color: C.textDark }}>{value ?? '—'}</p>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, color = C.primary }: { title: string; icon: React.ElementType; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fafbfc', borderBottom: `1px solid ${C.border}` }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function BoolRow({ label, value, onChange }: { label: string; value: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange?.(!value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', textAlign: 'left', width: '100%' }}>
      {value ? <CheckSquare size={16} color="#107c10" /> : <Square size={16} color="#9ca3af" />}
      <span style={{ fontSize: 13, color: value ? '#107c10' : C.muted }}>{label}</span>
    </button>
  )
}

function InputField({ label, value, onChange, type = 'text', rows, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void
  type?: string; rows?: number; placeholder?: string
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.textDark, background: onChange ? '#fff' : '#f9fafb',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    resize: rows ? 'vertical' : undefined,
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={rows} placeholder={placeholder} readOnly={!onChange}
          style={baseStyle} onFocus={e => onChange && (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
      ) : (
        <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={!onChange}
          style={baseStyle} onFocus={e => onChange && (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange?: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={e => onChange?.(e.target.value)} disabled={!onChange}
        style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        <option value="">— select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SaveBtn({ onClick, label = 'Save' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      onMouseOver={e => (e.currentTarget.style.background = C.primaryHover)}
      onMouseOut={e => (e.currentTarget.style.background = C.primary)}>
      <Save size={14} />{label}
    </button>
  )
}

function card(style?: React.CSSProperties): React.CSSProperties {
  return { background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow, borderRadius: 12, padding: 20, ...style }
}

type AuditAnswerValue = '' | 'yes' | 'no' | 'na'
type AuditFindingValue = '' | 'nc' | 'obs'
type AuditQuestionAnswer = {
  answer: AuditAnswerValue
  finding: AuditFindingValue
  customerComment: string
  auditorComment: string
  shariaComment: string
}
type AuditReportAnswers = Record<string, AuditQuestionAnswer>
type AuditReportQuestionNode = { index: number; label: string; text: string }
type AuditReportSectionNode = { id: string; title: string; questions: AuditReportQuestionNode[] }
type AuditReportPartNode = { id: string; title: string; sections: AuditReportSectionNode[] }

const blankAuditQuestionAnswer = (): AuditQuestionAnswer => ({
  answer: '',
  finding: '',
  customerComment: '',
  auditorComment: '',
  shariaComment: '',
})

const auditConfigToTrack = (config: AuditReportConfigurationDto): AuditTrack => ({
  dbId: config.id,
  id: config.id ? `db-${config.id}` : config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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

const auditTypes = Object.keys(CHECKLISTS) as AuditType[]
const normalizeAuditText = (value?: string) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

const checklistTypeForTrack = (track: AuditTrack): AuditType | undefined => {
  const haystack = [
    track.id,
    track.name,
    track.reportTitle,
    track.formCode,
    ...(track.activityCategoryKeys ?? []),
  ].map(normalizeAuditText).join('|')

  return auditTypes.find(type => {
    const checklist = CHECKLISTS[type]
    const aliases = [
      type,
      checklist.key,
      checklist.name,
      checklist.short,
      checklist.form,
      type === 'manufacturing' ? 'mfg' : '',
      type === 'meatprocessing' ? 'meatprocessing' : '',
      type === 'slaughterhouse' ? 'slaughter' : '',
    ].map(normalizeAuditText).filter(Boolean)
    return aliases.some(alias => haystack.includes(alias))
  })
}

const stripQuestionPrefix = (question: string) =>
  question.replace(/^\s*\d+(?:\.\d+){1,2}\s+/, '').trim()

const buildAuditReportParts = (track: AuditTrack): AuditReportPartNode[] => {
  const checklistType = checklistTypeForTrack(track)
  const checklist = checklistType ? CHECKLISTS[checklistType] : undefined

  if (checklist) {
    let questionIndex = 0
    return checklist.parts.map(part => ({
      id: part.n,
      title: part.title,
      sections: part.sections.map(section => ({
        id: section.id,
        title: section.title,
        questions: section.qs.map(([number, text, note]) => {
          const index = questionIndex++
          const fallbackText = note ? `${text} (${note})` : text
          return {
            index,
            label: `${section.id}.${number}`,
            text: stripQuestionPrefix(track.questions[index] ?? fallbackText),
          }
        }).filter(question => question.index < track.questions.length),
      })).filter(section => section.questions.length > 0),
    })).filter(part => part.sections.length > 0)
  }

  const partMap = new Map<string, AuditReportPartNode>()
  track.questions.forEach((question, index) => {
    const match = question.match(/^\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?\s+(.+)/)
    const partId = match?.[1] ?? '1'
    const sectionId = match?.[2] ? `${partId}.${match[2]}` : partId
    const label = match?.[3] ? `${sectionId}.${match[3]}` : String(index + 1)
    const text = match?.[4] ?? question

    if (!partMap.has(partId)) {
      partMap.set(partId, { id: partId, title: `Section ${partId}`, sections: [] })
    }
    const part = partMap.get(partId)!
    let section = part.sections.find(item => item.id === sectionId)
    if (!section) {
      section = { id: sectionId, title: sectionId === partId ? 'Audit Questions' : `Subsection ${sectionId}`, questions: [] }
      part.sections.push(section)
    }
    section.questions.push({ index, label, text })
  })

  return Array.from(partMap.values())
}

function AuditReportModal({
  appNumber,
  companyName,
  track,
  categories,
  selectedCategoryKey,
  onCategoryChange,
  answers,
  onUpdate,
  onClose,
  onSave,
}: {
  appNumber: string
  companyName: string
  track: AuditTrack
  categories: ActivityCategorySetting[]
  selectedCategoryKey: string
  onCategoryChange: (key: string) => void
  answers: AuditReportAnswers
  onUpdate: (questionKey: string, patch: Partial<AuditQuestionAnswer>) => void
  onClose: () => void
  onSave: () => void
}) {
  const [openPart, setOpenPart] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const auditParts = useMemo(() => buildAuditReportParts(track), [track])
  const firstPartId = auditParts[0]?.id ?? null
  const activeOpenPart = openPart ?? firstPartId
  const completed = track.questions.filter((_, index) => answers[`${track.id}-${index}`]?.answer).length
  const pct = track.questions.length ? Math.round((completed / track.questions.length) * 100) : 0
  const countQuestions = (questions: AuditReportQuestionNode[]) => ({
    answered: questions.filter(question => answers[`${track.id}-${question.index}`]?.answer).length,
    total: questions.length,
  })
  const countPart = (part: AuditReportPartNode) => {
    const total = part.sections.reduce((sum, section) => sum + section.questions.length, 0)
    const answered = part.sections.reduce((sum, section) => sum + countQuestions(section.questions).answered, 0)
    return { answered, total }
  }
  const scrollToNode = (nodeId: string) => {
    document.getElementById(nodeId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const answerBtn = (active: boolean, color: string): React.CSSProperties => ({
    border: `1px solid ${active ? color : C.border}`,
    background: active ? `${color}18` : C.white,
    color: active ? color : C.muted,
    borderRadius: 7,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  })
  const areaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 58,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.48)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 'min(1180px, 100%)', height: 'min(86vh, 900px)', background: C.white, borderRadius: 14, boxShadow: '0 24px 80px rgba(15,23,42,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{appNumber}</p>
            <h2 style={{ margin: '3px 0 0', fontSize: 20, color: C.textDark }}>{track.reportTitle ?? track.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{companyName} | {[track.formCode, track.revision].filter(Boolean).join(' | ')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={selectedCategoryKey} onChange={e => onCategoryChange(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: C.textDark, background: C.white }}>
              {categories.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}
            </select>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, color: C.muted, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', background: '#fafbfc' }}>
          <div>
            <div style={{ height: 8, borderRadius: 99, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: completed === track.questions.length && track.questions.length ? '#107c10' : C.primary }} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>{completed} of {track.questions.length} questions answered</p>
          </div>
          <button onClick={onSave}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Save size={14} />Save Report
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 20, background: '#eef3fb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
            <nav aria-label="Audit sections" style={{ position: 'sticky', top: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, maxHeight: 'calc(86vh - 190px)', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>Audit Sections</p>
              <div style={{ display: 'grid', gap: 5 }}>
                {auditParts.map(part => {
                  const partCounts = countPart(part)
                  const partDone = partCounts.total > 0 && partCounts.answered === partCounts.total
                  const open = activeOpenPart === part.id
                  return (
                    <div key={part.id}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => {
                          setOpenPart(open ? null : part.id)
                          scrollToNode(`audit-part-${part.id}`)
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', border: 'none', borderRadius: 8, padding: '8px 9px', background: open ? '#eef3fb' : C.white, color: C.textDark, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: C.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{part.id}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>{part.title}</span>
                        {partDone ? <span style={{ width: 9, height: 9, borderRadius: 99, background: '#107c10', flexShrink: 0 }} /> : <span style={{ fontSize: 10, fontWeight: 800, color: '#8a6000', whiteSpace: 'nowrap' }}>{partCounts.total - partCounts.answered} left</span>}
                      </button>
                      {open && (
                        <div style={{ display: 'grid', gap: 3, margin: '4px 0 10px 20px', paddingLeft: 10, borderLeft: `1px solid ${C.border}` }}>
                          {part.sections.map(section => {
                            const sectionCounts = countQuestions(section.questions)
                            const sectionDone = sectionCounts.total > 0 && sectionCounts.answered === sectionCounts.total
                            const active = currentSection === section.id
                            return (
                              <button
                                key={section.id}
                                type="button"
                                aria-current={active || undefined}
                                onClick={() => {
                                  setCurrentSection(section.id)
                                  scrollToNode(`audit-section-${section.id}`)
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left', border: 'none', borderRadius: 7, padding: '7px 8px', background: active ? '#e6f4e6' : 'transparent', color: active ? '#107c10' : C.text, cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                <span style={{ width: 36, flexShrink: 0, fontSize: 11, fontWeight: 800, color: active ? '#107c10' : C.primary }}>{section.id}</span>
                                <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 650, lineHeight: 1.35 }}>{section.title}</span>
                                {sectionDone ? <span style={{ width: 8, height: 8, borderRadius: 99, background: '#107c10', flexShrink: 0 }} /> : <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, whiteSpace: 'nowrap' }}>{sectionCounts.answered}/{sectionCounts.total}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </nav>

            <div style={{ display: 'grid', gap: 16 }}>
              {auditParts.map(part => (
                <div key={part.id} id={`audit-part-${part.id}`} style={{ scrollMarginTop: 12 }}>
                  <div style={{ background: C.primary, color: '#fff', borderRadius: '10px 10px 0 0', padding: '14px 16px' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.78 }}>Section {part.id}</p>
                    <h3 style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800 }}>{part.title}</h3>
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {part.sections.map(section => {
                      const sectionCounts = countQuestions(section.questions)
                      const sectionDone = sectionCounts.total > 0 && sectionCounts.answered === sectionCounts.total
                      return (
                        <section key={section.id} id={`audit-section-${section.id}`} style={{ scrollMarginTop: 12, background: C.white, border: `1px solid ${C.border}`, borderTop: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f7f9fc', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ minWidth: 42, height: 26, borderRadius: 7, background: C.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{section.id}</span>
                            <h4 style={{ margin: 0, flex: 1, fontSize: 14, color: C.textDark }}>{section.title}</h4>
                            <span style={{ fontSize: 12, fontWeight: 700, color: sectionDone ? '#107c10' : C.muted }}>{sectionCounts.answered} / {sectionCounts.total} answered</span>
                            <span style={{ width: 9, height: 9, borderRadius: 99, background: sectionDone ? '#107c10' : '#cbd5e1' }} />
                          </div>
                          <div style={{ display: 'grid', gap: 0 }}>
                            {section.questions.map(question => {
                              const key = `${track.id}-${question.index}`
                              const record = answers[key] ?? blankAuditQuestionAnswer()
                              const answered = Boolean(record.answer)
                              return (
                                <div key={key} style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <span style={{ minWidth: 44, height: 28, borderRadius: 8, background: answered ? '#e6f4e6' : '#f0f7ff', color: answered ? '#107c10' : C.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{question.label}</span>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.textDark, fontWeight: 600 }}>{question.text}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                                        <button onClick={() => onUpdate(key, { answer: record.answer === 'yes' ? '' : 'yes' })} style={answerBtn(record.answer === 'yes', '#107c10')}>Yes</button>
                                        <button onClick={() => onUpdate(key, { answer: record.answer === 'no' ? '' : 'no' })} style={answerBtn(record.answer === 'no', '#d13438')}>No</button>
                                        <button onClick={() => onUpdate(key, { answer: record.answer === 'na' ? '' : 'na' })} style={answerBtn(record.answer === 'na', '#64748b')}>N/A</button>
                                        <span style={{ width: 1, height: 24, background: C.border, margin: '0 2px' }} />
                                        <button onClick={() => onUpdate(key, { finding: record.finding === 'nc' ? '' : 'nc' })} style={answerBtn(record.finding === 'nc', '#d13438')}>Non-conformity</button>
                                        <button onClick={() => onUpdate(key, { finding: record.finding === 'obs' ? '' : 'obs' })} style={answerBtn(record.finding === 'obs', '#d98207')}>Observation</button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          Customer Comment
                                          <textarea value={record.customerComment} onChange={e => onUpdate(key, { customerComment: e.target.value })} style={{ ...areaStyle, marginTop: 5 }} />
                                        </label>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          Auditor Comment
                                          <textarea value={record.auditorComment} onChange={e => onUpdate(key, { auditorComment: e.target.value })} style={{ ...areaStyle, marginTop: 5 }} />
                                        </label>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          Sharia Comment
                                          <textarea value={record.shariaComment} onChange={e => onUpdate(key, { shariaComment: e.target.value })} style={{ ...areaStyle, marginTop: 5 }} />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Severity colors ──────────────────────────────────────────────────────────

const SEV: Record<string, { color: string; bg: string }> = {
  CRITICAL:    { color: '#d13438', bg: '#fde7e9' },
  MAJOR:       { color: '#ca5010', bg: '#fff0e5' },
  MINOR:       { color: '#8a6000', bg: '#fff8e5' },
  OBSERVATION: { color: '#0067b8', bg: '#dbeef9' },
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'app_review' | 'documents' | 'audit_plan' | 'nonconformity' | 'nc_workflow' | 'audit_summary' | 'decision_making' | 'certificate' | 'reviews' | 'cert_decision' | 'billing' | 'payment' | 'activity'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',        label: 'Overview' },
  { key: 'app_review',      label: 'App. Review' },
  { key: 'documents',       label: 'Documents' },
  { key: 'audit_plan',      label: 'Audit Plan' },
  { key: 'nonconformity',   label: 'NC & Actions' },
  { key: 'nc_workflow',     label: 'NC Workflow' },
  { key: 'audit_summary',   label: 'Audit Summary' },
  { key: 'decision_making', label: 'Decisions' },
  { key: 'certificate',     label: 'Certificate' },
  { key: 'reviews',         label: 'Reviews' },
  { key: 'cert_decision',   label: 'Cert Decision' },
  { key: 'billing',         label: 'Billing' },
  { key: 'payment',         label: 'Payment' },
  { key: 'activity',        label: 'Activity Log' },
]

// ─── Default state ────────────────────────────────────────────────────────────

const DEF_APP_REVIEW: LocalApplicationReview = {
  reviewer: '', reviewedAt: '', decision: 'PENDING', notes: '',
  eligibilityConfirmed: false, documentsComplete: false, scopeValid: false,
  missingItems: '', infoRequested: '',
}
const DEF_AUDIT_PLAN: LocalAuditPlanDetail = {
  auditTrack: 'manufacturing', plannedDate: '', durationDays: '1',
  leadAuditor: '', additionalAuditors: '', halalExpert: '', technicalExpert: '',
  conflictChecked: false, impartialityConfirmed: false,
  scope: '', criteria: 'GSO 2055-1 / OIC-SMIIC 1', agenda: '', status: 'DRAFT',
}
const DEF_TECH_REVIEW: LocalTechnicalReview = {
  reviewer: '', reviewDate: '', fileComplete: false, auditReportReviewed: false,
  ncClosed: false, productStatusOk: false, labelReviewed: false,
  technicalNotes: '', opinion: '',
}
const DEF_HALAL_REVIEW: LocalHalalReview = {
  reviewer: '', reviewDate: '', ingredientStatus: '', slaughterNotes: '',
  alcoholNotes: '', animalDerivNotes: '', religiousNotes: '', opinion: '', conditions: '',
}
const DEF_CERT_DECISION: LocalCertDecision = {
  decisionMaker: '', decisionDate: '', decision: '', basis: '', scope: '',
  conditions: '', validityMonths: '12', nextSurveillance: '', decisionRef: '',
  certificateGenerated: false, certificateKey: '',
}
const DEF_NC: Omit<LocalNonConformity, 'id' | 'raisedAt'> = {
  clause: '', description: '', severity: 'MINOR', evidence: '',
  raisedBy: '', status: 'OPEN',
}
const DEF_CA: LocalCorrectiveAction = {
  rootCause: '', correction: '', correctiveAction: '', evidence: '',
  targetDate: '', submittedBy: '', reviewStatus: 'PENDING', reviewNotes: '',
}

// ─── Status → default tab mapping ────────────────────────────────────────────

const STATUS_TO_TAB: Record<string, Tab> = {
  // Application review
  SUBMITTED:                  'app_review',
  APPLICATION_REVIEW:         'app_review',
  UNDER_REVIEW:               'app_review',
  INFORMATION_REQUESTED:      'documents',
  // Billing / payment / agreement
  QUOTED:                     'billing',
  AGREEMENT_PENDING:          'billing',
  AGREEMENT_REVIEW:           'billing',
  AGREEMENT_APPROVED_BY_HCB:  'billing',
  PENDING_PAYMENT:            'payment',
  PAYMENT_REVIEW:             'payment',
  // Audit
  AUDIT_PLANNING:             'audit_plan',
  AUDIT_SCHEDULED:            'audit_plan',
  AUDIT_IN_PROGRESS:          'audit_plan',
  // Nonconformity
  AUDIT_COMPLETED:            'nonconformity',
  NONCONFORMITY_RESPONSE:     'nc_workflow',
  CORRECTIVE_ACTION_REVIEW:   'nc_workflow',
  EVIDENCE_SUBMISSION:        'nc_workflow',
  EVIDENCE_REVIEW:            'nc_workflow',
  // Audit Summary
  AUDIT_SUMMARY_PENDING:      'audit_summary',
  // Decision Making
  DECISION_PENDING:           'decision_making',
  // Certificate
  CERTIFICATE_PENDING:        'certificate',
  CERTIFICATE_GENERATION:     'certificate',
  // Reviews
  TECHNICAL_REVIEW:           'reviews',
  HALAL_REVIEW:               'reviews',
  CERTIFICATION_REVIEW:       'cert_decision',
  // Decision
  CERTIFICATION_DECISION:     'cert_decision',
  // Everything else (DRAFT, APPROVED, CERTIFIED, CERTIFICATE_ISSUED,
  // REJECTED, SUSPENDED, WITHDRAWN, EXPIRED, RENEWAL_DUE) → 'overview'
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = parseInt(idParam ?? '0', 10)
  const [tab, setTab] = useState<Tab>('overview')
  const [eventPage, setEventPage] = useState(0)
  const [eventFilter, setEventFilter] = useState('all')
  const initialTabSet = useRef(false)

  // App Review
  const [appReview, setAppReview] = useState<LocalApplicationReview>(() => lsLoad(`hcs_app_review_${id}`, DEF_APP_REVIEW))

  // Audit Plan
  const [auditPlan, setAuditPlan] = useState<LocalAuditPlanDetail>(() => lsLoad(`hcs_audit_plan_${id}`, DEF_AUDIT_PLAN))
  const fallbackAuditTracks = DEFAULT_AUDIT_TRACKS
  const activityCategories = loadActivityCategorySettings()
  const [showAuditReport, setShowAuditReport] = useState(false)
  const [auditCategoryKey, setAuditCategoryKey] = useState(() => {
    try { return localStorage.getItem(`hcs_audit_category_${id}`) || activityCategories[0]?.key || 'mfg' }
    catch { return activityCategories[0]?.key || 'mfg' }
  })
  const [auditReportAnswers, setAuditReportAnswers] = useState<AuditReportAnswers>({})

  // NCs (local)
  const [localNCs, setLocalNCs] = useState<LocalNonConformity[]>(() => lsArr(`hcs_ncs_${id}`))
  const [showNCForm, setShowNCForm] = useState(false)
  const [newNC, setNewNC] = useState({ ...DEF_NC })
  const [expandedNC, setExpandedNC] = useState<string | null>(null)
  const [caForms, setCaForms] = useState<Record<string, LocalCorrectiveAction>>({})

  // Reviews
  const [techReview, setTechReview] = useState<LocalTechnicalReview>(() => lsLoad(`hcs_tech_review_${id}`, DEF_TECH_REVIEW))
  const [halalReview, setHalalReview] = useState<LocalHalalReview>(() => lsLoad(`hcs_halal_review_${id}`, DEF_HALAL_REVIEW))

  // Certification Decision
  const [certDecision, setCertDecision] = useState<LocalCertDecision>(() => lsLoad(`hcs_cert_decision_${id}`, DEF_CERT_DECISION))

  // Billing / Invoice
  const [invoice, setInvoice] = useState<Invoice | null>(() => loadInvoiceByApp(id))
  const billing = loadApplicationBilling(id)

  function handleCreateInvoice() {
    if (!billing || !app) return
    const inv = createInvoiceFromBilling({ ...billing, applicationId: String(id), applicationNumber: app.applicationNumber })
    saveInvoice(inv)
    setInvoice(inv)
    toast.success(`Invoice ${inv.invoiceNumber} created`)
  }

  function handleIssueInvoice() {
    if (!invoice) return
    const updated: Invoice = { ...invoice, status: 'ISSUED', sentAt: new Date().toISOString() }
    saveInvoice(updated); setInvoice(updated)
    toast.success('Invoice issued and sent to customer')
  }

  function handleMarkPaid(method: string, ref: string) {
    if (!invoice) return
    const updated: Invoice = { ...invoice, status: 'PAID', paymentMethod: method as Invoice['paymentMethod'], paymentReference: ref, paymentDate: new Date().toISOString() }
    saveInvoice(updated); setInvoice(updated)
    toast.success('Invoice marked as paid')
  }

  function handleInvoiceStatus(s: InvoiceStatus) {
    if (!invoice) return
    const updated: Invoice = { ...invoice, status: s }
    saveInvoice(updated); setInvoice(updated)
  }

  const [showPaidForm, setShowPaidForm] = useState(false)
  const [paidMethod,   setPaidMethod]   = useState('BANK_TRANSFER')
  const [paidRef,      setPaidRef]      = useState('')

  // API queries
  const appQ    = useQuery({ queryKey: ['app', id], queryFn: () => getApplication(id), enabled: !!id, retry: false })
  const companyQ = useQuery({ queryKey: ['app', id, 'company'], queryFn: () => getCompanyInfo(id), enabled: !!id && tab === 'overview' })
  const serviceQ = useQuery({ queryKey: ['app', id, 'service'], queryFn: () => getServiceInfo(id), enabled: !!id && tab === 'overview' })
  const docsQ    = useQuery({ queryKey: ['app', id, 'docs'], queryFn: () => getApplicationDocuments(id), enabled: !!id && tab === 'documents' })
  const auditConfigsQ = useQuery({ queryKey: ['audit-report-configurations'], queryFn: getAuditReportConfigurations, enabled: !!id && tab === 'audit_plan' })
  const auditStatusQ = useQuery({ queryKey: ['app', id, 'audit-status'], queryFn: () => getAuditStatus(id), enabled: !!id && tab === 'audit_plan' })
  const auditPlanQ   = useQuery({ queryKey: ['app', id, 'audit-plan'],   queryFn: () => getAuditPlan(id),   enabled: !!id && tab === 'audit_plan' })
  const auditReportQ = useQuery({ queryKey: ['app', id, 'audit-report', auditCategoryKey], queryFn: () => getApplicationAuditReport(id, auditCategoryKey), enabled: !!id && tab === 'audit_plan' })
  const ncsQ     = useQuery({ queryKey: ['app', id, 'ncs'], queryFn: () => getNonConformities(id), enabled: !!id && tab === 'nonconformity' })
  const paymentQ = useQuery({ queryKey: ['app', id, 'payment'], queryFn: () => getPaymentStatus(id), enabled: !!id && tab === 'payment' })
  const eventsQ  = useQuery({ queryKey: ['app', id, 'events', eventPage], queryFn: () => getEventLogs(id, { page: eventPage, size: 20 }), enabled: !!id && tab === 'activity' })

  useEffect(() => {
    const plan = auditPlanQ.data
    if (!plan?.id) return
    setAuditPlan(p => ({
      ...p,
      leadAuditor: plan.auditorName || p.leadAuditor,
      plannedDate: plan.scheduledDate || p.plannedDate,
      durationDays: plan.durationDays ? String(plan.durationDays) : p.durationDays,
      scope: plan.scope || p.scope,
      status: (plan.status as LocalAuditPlanDetail['status']) || p.status,
    }))
  }, [auditPlanQ.data?.id, auditPlanQ.data?.scheduledDate, auditPlanQ.data?.auditorName])

  useEffect(() => {
    const report = auditReportQ.data
    if (!report) return
    if (report.activityCategoryKey) setAuditCategoryKey(report.activityCategoryKey)
    const next: AuditReportAnswers = {}
    const trackKey = report.configuration?.id ? `db-${report.configuration.id}` : String(report.configurationId ?? 'report')
    const questions = report.configuration?.questions ?? []
    ;(report.answers ?? []).forEach((answer, index) => {
      const questionIndex = questions.findIndex(question =>
        (answer.questionId && question.id === answer.questionId) || question.questionText === answer.questionText
      )
      const key = `${trackKey}-${questionIndex >= 0 ? questionIndex : index}`
      next[key] = {
        answer: answer.answer ?? '',
        finding: answer.finding ?? '',
        customerComment: answer.customerComment ?? '',
        auditorComment: answer.auditorComment ?? '',
        shariaComment: answer.shariaComment ?? '',
      }
    })
    setAuditReportAnswers(next)
  }, [auditReportQ.data])

  // ── Auto-focus tab based on application status (fires once on first load) ──
  useEffect(() => {
    if (appQ.data?.status && !initialTabSet.current) {
      initialTabSet.current = true
      const autoTab = STATUS_TO_TAB[appQ.data.status]
      if (autoTab) setTab(autoTab)
    }
  }, [appQ.data?.status])

  // ── Save helpers ──
  const auditTracks = auditConfigsQ.data?.length ? auditConfigsQ.data.map(auditConfigToTrack) : fallbackAuditTracks
  const selectedAuditTrack =
    auditTracks.find(track => track.id === auditPlan.auditTrack) ??
    auditTracks.find(track => (track.activityCategoryKeys ?? []).includes(auditCategoryKey)) ??
    auditTracks[0]

  const handleAuditCategoryChange = (key: string) => {
    setAuditCategoryKey(key)
    const mappedTrack = auditTracks.find(track => (track.activityCategoryKeys ?? []).includes(key))
    if (mappedTrack) setAuditPlan(plan => ({ ...plan, auditTrack: mappedTrack.id }))
  }

  const saveAppReview  = () => { lsSave(`hcs_app_review_${id}`, appReview);    toast.success('Application review saved') }
  const saveAuditPlan  = async () => {
    const applicationId = Number(id)
    if (!Number.isFinite(applicationId)) {
      toast.error('This application must exist in the database before saving an audit plan')
      return
    }
    try {
      await saveAuditPlanApi(applicationId, {
        auditorName: auditPlan.leadAuditor || undefined,
        scheduledDate: auditPlan.plannedDate || undefined,
        durationDays: Number(auditPlan.durationDays) || 1,
        scope: [
          auditPlan.scope,
          auditPlan.halalExpert ? `Sharia auditor: ${auditPlan.halalExpert}` : '',
          auditPlan.technicalExpert ? `Technical expert: ${auditPlan.technicalExpert}` : '',
          auditPlan.criteria ? `Criteria: ${auditPlan.criteria}` : '',
          auditPlan.agenda ? `Agenda: ${auditPlan.agenda}` : '',
        ].filter(Boolean).join('\n'),
        status: auditPlan.status,
      })
      toast.success('Audit plan saved to database')
    } catch {
      toast.error('Could not save audit plan to database')
    }
  }
  const saveTechReview = () => { lsSave(`hcs_tech_review_${id}`, techReview);  toast.success('Technical review saved') }
  const saveHalalReview= () => { lsSave(`hcs_halal_review_${id}`, halalReview);toast.success('Halal review saved') }
  const saveCertDecision = () => { lsSave(`hcs_cert_decision_${id}`, certDecision); toast.success('Decision recorded') }
  const updateAuditReportAnswer = (questionKey: string, patch: Partial<AuditQuestionAnswer>) => {
    setAuditReportAnswers(prev => ({
      ...prev,
      [questionKey]: { ...(prev[questionKey] ?? blankAuditQuestionAnswer()), ...patch },
    }))
  }
  const saveAuditReport = async () => {
    if (!selectedAuditTrack) return
    const sourceConfig = auditConfigsQ.data?.find(config => config.id === selectedAuditTrack.dbId)
    const answers = selectedAuditTrack.questions.map((questionText, index) => {
      const question = sourceConfig?.questions?.[index]
      const record = auditReportAnswers[`${selectedAuditTrack.id}-${index}`] ?? blankAuditQuestionAnswer()
      return {
        questionId: question?.id,
        questionText,
        answer: record.answer,
        finding: record.finding,
        customerComment: record.customerComment,
        auditorComment: record.auditorComment,
        shariaComment: record.shariaComment,
      }
    })
    const payload: ApplicationAuditReportDto = {
      id: auditReportQ.data?.id,
      applicationId: id,
      configurationId: selectedAuditTrack.dbId,
      activityCategoryKey: auditCategoryKey,
      status: 'DRAFT',
      generalComment: auditReportQ.data?.generalComment ?? '',
      answers,
    }
    try {
      await saveApplicationAuditReport(id, payload)
      await auditReportQ.refetch()
      toast.success('Audit report saved to database')
    } catch {
      toast.error('Could not save audit report to database')
    }
  }

  const addNC = () => {
    if (!newNC.description.trim()) { toast.error('Description required'); return }
    const nc: LocalNonConformity = { ...newNC, id: uid(), raisedAt: new Date().toISOString(), status: 'OPEN' }
    const updated = [...localNCs, nc]
    setLocalNCs(updated); lsSave(`hcs_ncs_${id}`, updated)
    setNewNC({ ...DEF_NC }); setShowNCForm(false)
    toast.success('Nonconformity recorded')
  }

  const removeNC = (ncId: string) => {
    const updated = localNCs.filter(n => n.id !== ncId)
    setLocalNCs(updated); lsSave(`hcs_ncs_${id}`, updated)
  }

  const submitCA = (ncId: string) => {
    const ca = caForms[ncId] ?? { ...DEF_CA }
    if (!ca.rootCause.trim()) { toast.error('Root cause required'); return }
    const updated = localNCs.map(n => n.id === ncId ? { ...n, ca, status: 'RESPONSE_SUBMITTED' as const } : n)
    setLocalNCs(updated); lsSave(`hcs_ncs_${id}`, updated)
    toast.success('Corrective action submitted')
  }

  const acceptCA = (ncId: string) => {
    const updated = localNCs.map(n => n.id === ncId
      ? { ...n, status: 'CLOSED' as const, ca: n.ca ? { ...n.ca, reviewStatus: 'ACCEPTED' as const } : n.ca }
      : n)
    setLocalNCs(updated); lsSave(`hcs_ncs_${id}`, updated)
    toast.success('Corrective action accepted — NC closed')
  }

  const generateCertificate = () => {
    if (certDecision.decision !== 'APPROVE') { toast.error('Decision must be APPROVE to generate certificate'); return }
    const tmpl = loadCertificateTemplate()
    const app = appQ.data!
    const issueDate = new Date().toISOString().slice(0, 10)
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + parseInt(certDecision.validityMonths || '12'))
    const key = uid()
    const certNum = `${tmpl.certificatePrefix}-${id.toString().padStart(5, '0')}`
    const cert: LocalGeneratedCertificate = {
      key, certificateNumber: certNum,
      applicationId: id, companyName: app.companyName,
      factoryAddress: certDecision.scope || '',
      products: certDecision.scope, standard: app.halalStandard || '',
      issueDate, expiryDate: expiry.toISOString().slice(0, 10),
      signatoryName: certDecision.decisionMaker || tmpl.signatoryName,
      signatoryTitle: tmpl.signatoryTitle,
      issuingBodyName: tmpl.issuingBodyName,
      scope: certDecision.scope, status: 'ACTIVE',
      template: {
        logoDataUrl: tmpl.logoDataUrl,
        signatureDataUrl: tmpl.signatureDataUrl,
        sourceTemplateDataUrl: tmpl.sourceTemplateDataUrl,
        sourceTemplateName: tmpl.sourceTemplateName,
        sourceTemplateMime: tmpl.sourceTemplateMime,
        pageCount: tmpl.pageCount,
        placedFields: tmpl.placedFields,
        bodyTitle: tmpl.bodyTitle,
        certificatePrefix: tmpl.certificatePrefix,
        issuingBodyName: tmpl.issuingBodyName,
        accreditationLine: tmpl.accreditationLine,
        standardLine: tmpl.standardLine,
        validityMonths: tmpl.validityMonths,
        signatoryName: certDecision.decisionMaker || tmpl.signatoryName,
        signatoryTitle: tmpl.signatoryTitle,
        footerNote: tmpl.footerNote,
        customFields: tmpl.customFields,
      },
    }
    const allCerts: LocalGeneratedCertificate[] = lsArr('hcs_gen_certs')
    allCerts.push(cert)
    lsSave('hcs_gen_certs', allCerts)
    const updated = { ...certDecision, certificateGenerated: true, certificateKey: key, decisionRef: certDecision.decisionRef || certNum }
    setCertDecision(updated); lsSave(`hcs_cert_decision_${id}`, updated)
    toast.success(`Certificate ${certNum} generated!`)
  }

  if (appQ.isLoading) return <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>
  if (appQ.isError || !appQ.data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#d13438" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: C.text }}>Application not found.</p>
        <button onClick={() => navigate('/office/applications')} style={{ marginTop: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back to Applications</button>
      </div>
    )
  }

  const app = appQ.data
  const appStatus = getStatusStyle(app.status)
  const typeColor: Record<string, string> = { NEW: '#0078d4', RENEWAL: '#8764b8', EXTENSION: '#ca5010' }

  const events = eventsQ.data?.content ?? []
  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'all') return true
    const n = ev.event?.toUpperCase() ?? ''
    if (eventFilter === 'status')   return !!(ev.oldStatus || ev.newStatus)
    if (eventFilter === 'payment')  return n.includes('PAYMENT') || n.includes('INVOICE')
    if (eventFilter === 'document') return n.includes('DOCUMENT') || n.includes('UPLOAD')
    if (eventFilter === 'audit')    return n.includes('AUDIT') || n.includes('SCHEDULE')
    return true
  })

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Back */}
      <button onClick={() => navigate('/office/applications')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Applications
      </button>

      {/* Header card */}
      <div style={{ ...card(), marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textDark, margin: 0 }}>{app.companyName}</h1>
            <p style={{ fontFamily: 'monospace', color: C.primary, fontSize: 13, marginTop: 4 }}>{app.applicationNumber}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${typeColor[app.type] ?? C.muted}18`, color: typeColor[app.type] ?? C.muted }}>{app.type}</span>
              {app.country && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: C.bg, color: C.muted }}>{app.country}</span>}
              {app.halalStandard && <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#e6f4e6', color: '#107c10' }}>{app.halalStandard}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: appStatus.bg, color: appStatus.color }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: appStatus.dot }} />{appStatus.label}
            </span>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Updated {timeAgo(app.updatedAt)}</p>
            {app.assignedAuditorName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                <User size={12} color={C.muted} />
                <span style={{ fontSize: 12, color: C.muted }}>{app.assignedAuditorName}</span>
              </div>
            )}
            {billing && (
              <div style={{ marginTop: 10, padding: '8px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'inline-block' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Total Fee</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: 0 }}>
                  {billing.currency} {billing.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {billing.vatPct > 0 && (
                  <p style={{ fontSize: 10, color: '#166534', margin: '2px 0 0' }}>incl. {billing.vatPct}% VAT</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Application Progress</p>
          <StatusPipeline currentStatus={app.status} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '13px 18px', fontSize: 13, fontWeight: tab === t.key ? 600 : 500, cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t.key ? `2px solid ${C.primary}` : '2px solid transparent', color: tab === t.key ? C.primary : C.muted, whiteSpace: 'nowrap', marginBottom: -1, transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Building2 size={16} color={C.primary} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>Company Information</span>
                </div>
                {companyQ.isLoading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p> : companyQ.data ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Company Name" value={companyQ.data.companyName} />
                    <Field label="Reg. Number" value={companyQ.data.registrationNumber} />
                    <Field label="Company Type" value={companyQ.data.companyType} />
                    <Field label="Business License No" value={companyQ.data.businessLicenseNo} />
                    <Field label="License Expiry" value={companyQ.data.licenseExpiry} />
                    <Field label="Issuing Authority" value={companyQ.data.issuingAuthority} />
                    <Field label="VAT / SST No" value={companyQ.data.vatSstNo} />
                    <Field label="Address" value={companyQ.data.address} />
                    <Field label="City" value={companyQ.data.city} />
                    <Field label="Country" value={companyQ.data.country} />
                    <Field label="Phone" value={companyQ.data.phone} />
                    <Field label="Email" value={companyQ.data.email} />
                    {companyQ.data.website && <Field label="Website" value={companyQ.data.website} />}
                  </div>
                ) : <p style={{ color: C.muted, fontSize: 13 }}>No data</p>}
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ClipboardList size={16} color={C.primary} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>Service Information</span>
                </div>
                {serviceQ.isLoading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p> : serviceQ.data ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <Field label="Service Type" value={serviceQ.data.serviceType} />
                    <Field label="Halal Standard" value={serviceQ.data.halalStandard} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Product Categories</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {serviceQ.data.productCategories?.map(c => (
                          <span key={c} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#dbeef9', color: C.primary }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p style={{ color: C.muted, fontSize: 13 }}>No data</p>}
              </div>
            </div>
          )}

          {/* ── Application Review ── */}
          {tab === 'app_review' && (
            <div>
              <SectionCard title="Eligibility & Completeness Check" icon={ClipboardList}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 4 }}>
                  <BoolRow label="Eligibility confirmed (company type, activity, product category)" value={appReview.eligibilityConfirmed} onChange={v => setAppReview(r => ({ ...r, eligibilityConfirmed: v }))} />
                  <BoolRow label="All required documents submitted and complete" value={appReview.documentsComplete} onChange={v => setAppReview(r => ({ ...r, documentsComplete: v }))} />
                  <BoolRow label="Scope and target standard are within HCB accreditation" value={appReview.scopeValid} onChange={v => setAppReview(r => ({ ...r, scopeValid: v }))} />
                </div>
              </SectionCard>

              <SectionCard title="Reviewer Details" icon={User}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <InputField label="Reviewed By" value={appReview.reviewer} onChange={v => setAppReview(r => ({ ...r, reviewer: v }))} placeholder="Reviewer name" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Review Date" value={appReview.reviewedAt} type="date" onChange={v => setAppReview(r => ({ ...r, reviewedAt: v }))} />
                  </div>
                </div>
                <InputField label="Reviewer Notes" value={appReview.notes} rows={3} onChange={v => setAppReview(r => ({ ...r, notes: v }))} placeholder="Enter notes on the application completeness and eligibility…" />
                <InputField label="Missing Items (if any)" value={appReview.missingItems} rows={2} onChange={v => setAppReview(r => ({ ...r, missingItems: v }))} placeholder="List any missing or incomplete items…" />
                <InputField label="Information Requested from Applicant" value={appReview.infoRequested} rows={2} onChange={v => setAppReview(r => ({ ...r, infoRequested: v }))} placeholder="Describe what additional information has been requested…" />
              </SectionCard>

              <SectionCard title="Review Decision" icon={Award}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {([
                    { v: 'ACCEPT', label: 'Accept & Progress', color: '#107c10', bg: '#e6f4e6' },
                    { v: 'REQUEST_INFO', label: 'Request Information', color: '#8a6000', bg: '#fff8e5' },
                    { v: 'REJECT', label: 'Reject Application', color: '#d13438', bg: '#fde7e9' },
                  ] as const).map(({ v, label, color, bg }) => (
                    <button key={v} onClick={() => setAppReview(r => ({ ...r, decision: v }))}
                      style={{ padding: '8px 18px', borderRadius: 8, border: `2px solid ${appReview.decision === v ? color : C.border}`, background: appReview.decision === v ? bg : '#fff', color: appReview.decision === v ? color : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {appReview.decision !== 'PENDING' && (
                  <div style={{ padding: '8px 14px', borderRadius: 8, background: appReview.decision === 'ACCEPT' ? '#e6f4e6' : appReview.decision === 'REQUEST_INFO' ? '#fff8e5' : '#fde7e9', marginBottom: 14, fontSize: 13, fontWeight: 500, color: appReview.decision === 'ACCEPT' ? '#107c10' : appReview.decision === 'REQUEST_INFO' ? '#8a6000' : '#d13438' }}>
                    Decision: <strong>{appReview.decision.replace(/_/g, ' ')}</strong>
                  </div>
                )}
                <SaveBtn onClick={saveAppReview} label="Save Review" />
              </SectionCard>
            </div>
          )}

          {/* ── Documents ── */}
          {tab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color={C.primary} />
                  <span style={{ fontWeight: 600, color: C.textDark }}>Uploaded Documents</span>
                </div>
                <button style={{ fontSize: 13, padding: '6px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.text, cursor: 'pointer' }}>Upload Document</button>
              </div>
              {docsQ.isLoading ? <p style={{ color: C.muted }}>Loading…</p> : !docsQ.data?.documents?.length ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>
                  <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>No documents uploaded</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {docsQ.data.documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.bg, borderRadius: 8 }}>
                      <span style={{ fontSize: 22 }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: C.textDark }}>{doc.filename}</p>
                        <p style={{ fontSize: 12, color: C.muted }}>{formatDate(doc.uploadedAt)}</p>
                      </div>
                      {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: C.muted }}><Download size={16} /></a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Audit Plan ── */}
          {tab === 'audit_plan' && (
            <div>
              {/* API audit status chips */}
              {auditStatusQ.data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'F1 Started',          done: auditStatusQ.data.f1Started },
                    { label: 'F1 Completed',         done: auditStatusQ.data.f1Completed },
                    { label: 'F2 Started',           done: auditStatusQ.data.f2Started },
                    { label: 'F2 Completed',         done: auditStatusQ.data.f2Completed },
                    { label: 'Compliance Assigned',  done: auditStatusQ.data.complianceAssigned },
                    { label: 'Certification Final',  done: auditStatusQ.data.certificationFinalized },
                  ].map(({ label, done }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: done ? '#e6f4e6' : C.bg, border: `1px solid ${done ? '#107c10' : C.border}` }}>
                      {done ? <CheckCircle size={14} color="#107c10" /> : <Circle size={14} color="#9ca3af" />}
                      <span style={{ fontSize: 12, color: done ? '#107c10' : C.muted }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}

              <SectionCard title="Audit Team & Assignment" icon={CalendarCheck}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <InputField label="Lead Auditor" value={auditPlan.leadAuditor} onChange={v => setAuditPlan(p => ({ ...p, leadAuditor: v }))} placeholder="Lead auditor name" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Additional Auditors" value={auditPlan.additionalAuditors} onChange={v => setAuditPlan(p => ({ ...p, additionalAuditors: v }))} placeholder="Comma-separated names" />
                  </div>
                  <InputField label="Halal / Shariah Expert" value={auditPlan.halalExpert} onChange={v => setAuditPlan(p => ({ ...p, halalExpert: v }))} placeholder="Expert name (if required)" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Technical Expert" value={auditPlan.technicalExpert} onChange={v => setAuditPlan(p => ({ ...p, technicalExpert: v }))} placeholder="Technical expert name (if required)" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 4 }}>
                  <BoolRow label="Conflict of interest checked for all team members" value={auditPlan.conflictChecked} onChange={v => setAuditPlan(p => ({ ...p, conflictChecked: v }))} />
                  <BoolRow label="Impartiality confirmed for audit team" value={auditPlan.impartialityConfirmed} onChange={v => setAuditPlan(p => ({ ...p, impartialityConfirmed: v }))} />
                </div>
              </SectionCard>

              <SectionCard title="Audit Schedule & Scope" icon={CalendarCheck} color="#107c10">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
                  <InputField label="Planned Date" value={auditPlan.plannedDate} type="date" onChange={v => setAuditPlan(p => ({ ...p, plannedDate: v }))} />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Duration (days)" value={auditPlan.durationDays} type="number" onChange={v => setAuditPlan(p => ({ ...p, durationDays: v }))} />
                  </div>
                  <SelectField label="Activity Category" value={auditCategoryKey}
                    options={activityCategories.map(category => ({ value: category.key, label: category.label }))}
                    onChange={handleAuditCategoryChange}
                  />
                  <div style={{ paddingLeft: 12 }}>
                    <SelectField label="Audit Template" value={auditPlan.auditTrack}
                      options={auditTracks.map(track => ({ value: track.id, label: track.name }))}
                      onChange={v => setAuditPlan(p => ({ ...p, auditTrack: v }))}
                    />
                  </div>
                  <div style={{ paddingLeft: 12 }}>
                    <SelectField label="Plan Status" value={auditPlan.status}
                      options={[
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'CONFIRMED', label: 'Confirmed' },
                        { value: 'COMPLETED', label: 'Completed' },
                      ]}
                      onChange={v => setAuditPlan(p => ({ ...p, status: v as LocalAuditPlanDetail['status'] }))}
                    />
                  </div>
                </div>
                <InputField label="Scope" value={auditPlan.scope} rows={2} onChange={v => setAuditPlan(p => ({ ...p, scope: v }))} placeholder="Factory site, product lines, processes to be covered…" />
                <InputField label="Audit Criteria / Standards" value={auditPlan.criteria} onChange={v => setAuditPlan(p => ({ ...p, criteria: v }))} placeholder="e.g. GSO 2055-1, OIC-SMIIC 1, UAE.S 2055-1" />
                <InputField label="Audit Agenda / Programme" value={auditPlan.agenda} rows={3} onChange={v => setAuditPlan(p => ({ ...p, agenda: v }))} placeholder="Opening meeting, site walk, document review, closing meeting…" />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <SaveBtn onClick={saveAuditPlan} label="Save Audit Plan" />
                  <button onClick={() => setShowAuditReport(true)} disabled={!selectedAuditTrack}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#1c2e69', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selectedAuditTrack ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: selectedAuditTrack ? 1 : 0.55 }}>
                    <ClipboardList size={14} />Open Audit Report
                  </button>
                </div>
              </SectionCard>

              {/* API audit plan if exists */}
              {auditPlanQ.data && (
                <SectionCard title="Assigned Audit Plan (from system)" icon={CalendarCheck} color="#8764b8">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                    <Field label="Auditor" value={auditPlanQ.data.auditorName} />
                    <Field label="Scheduled Date" value={auditPlanQ.data.scheduledDate ? formatDate(auditPlanQ.data.scheduledDate) : undefined} />
                    <Field label="Duration" value={auditPlanQ.data.durationDays ? `${auditPlanQ.data.durationDays} days` : undefined} />
                    <Field label="Status" value={auditPlanQ.data.status} />
                  </div>
                  {auditPlanQ.data.scope && <div style={{ marginTop: 12 }}><Field label="Scope" value={auditPlanQ.data.scope} /></div>}
                </SectionCard>
              )}
            </div>
          )}

          {/* ── Nonconformity & Corrective Actions ── */}
          {tab === 'nonconformity' && (
            <div>
              {/* API NCs */}
              {ncsQ.data && ncsQ.data.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Nonconformities from System</p>
                  {ncsQ.data.map(nc => {
                    const sc = SEV[nc.severity] ?? { color: C.muted, bg: C.bg }
                    return (
                      <div key={nc.id} style={{ display: 'flex', gap: 12, padding: 14, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${sc.color}`, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.color, flexShrink: 0, height: 'fit-content' }}>{nc.severity}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, color: C.textDark }}>{nc.description}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: C.muted }}>{nc.category}</span>
                            <StatusChip status={nc.status} />
                            <span style={{ fontSize: 11, color: C.muted }}>{formatDate(nc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Local NCs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>Nonconformities — Local Record ({localNCs.length})</span>
                <button onClick={() => setShowNCForm(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fde7e9', color: '#d13438', border: '1px solid #f5c6cb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Plus size={14} />Add Nonconformity
                </button>
              </div>

              {showNCForm && (
                <div style={{ border: `2px solid #d13438`, borderRadius: 10, padding: 16, marginBottom: 16, background: '#fffbfb' }}>
                  <p style={{ fontWeight: 700, color: '#d13438', marginBottom: 12, fontSize: 13 }}>New Nonconformity</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    <SelectField label="Severity" value={newNC.severity}
                      options={[
                        { value: 'CRITICAL', label: 'Critical' },
                        { value: 'MAJOR', label: 'Major' },
                        { value: 'MINOR', label: 'Minor' },
                        { value: 'OBSERVATION', label: 'Observation' },
                      ]}
                      onChange={v => setNewNC(n => ({ ...n, severity: v as LocalNonConformity['severity'] }))}
                    />
                    <div style={{ paddingLeft: 12 }}>
                      <InputField label="Clause / Reference" value={newNC.clause} onChange={v => setNewNC(n => ({ ...n, clause: v }))} placeholder="e.g. Clause 6.2.1" />
                    </div>
                  </div>
                  <InputField label="Description *" value={newNC.description} rows={3} onChange={v => setNewNC(n => ({ ...n, description: v }))} placeholder="Describe the nonconformity found during the audit…" />
                  <InputField label="Evidence" value={newNC.evidence} rows={2} onChange={v => setNewNC(n => ({ ...n, evidence: v }))} placeholder="Photo ref, document ref, observation…" />
                  <InputField label="Raised By" value={newNC.raisedBy} onChange={v => setNewNC(n => ({ ...n, raisedBy: v }))} placeholder="Auditor name" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={addNC}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#d13438', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Plus size={14} />Record NC
                    </button>
                    <button onClick={() => { setShowNCForm(false); setNewNC({ ...DEF_NC }) }}
                      style={{ padding: '7px 14px', background: '#f3f4f6', color: C.muted, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {localNCs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>
                  <ShieldAlert size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>No local nonconformities recorded</p>
                </div>
              ) : (
                localNCs.map(nc => {
                  const sc = SEV[nc.severity] ?? { color: C.muted, bg: C.bg }
                  const isExpanded = expandedNC === nc.id
                  const ca = caForms[nc.id] ?? nc.ca ?? { ...DEF_CA }
                  const setCA = (val: LocalCorrectiveAction) => setCaForms(f => ({ ...f, [nc.id]: val }))
                  return (
                    <div key={nc.id} style={{ border: `1px solid ${sc.color}30`, borderLeft: `3px solid ${sc.color}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                      {/* NC header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: `${sc.bg}66`, cursor: 'pointer' }}
                        onClick={() => setExpandedNC(isExpanded ? null : nc.id)}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.color, flexShrink: 0 }}>{nc.severity}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{nc.description}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                            {nc.clause && <span style={{ fontSize: 11, color: C.muted }}>{nc.clause}</span>}
                            <StatusChip status={nc.status} />
                            <span style={{ fontSize: 11, color: C.muted }}>{nc.raisedBy && `by ${nc.raisedBy} · `}{formatDate(nc.raisedAt)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {isExpanded ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
                          {nc.status === 'OPEN' && (
                            <button onClick={e => { e.stopPropagation(); removeNC(nc.id) }}
                              style={{ padding: '3px 6px', background: '#fde7e9', color: '#d13438', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Corrective Action section */}
                      {isExpanded && (
                        <div style={{ padding: 16, background: '#fff', borderTop: `1px solid ${C.border}` }}>
                          {nc.evidence && <div style={{ marginBottom: 12 }}><Field label="Evidence" value={nc.evidence} /></div>}

                          <p style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Corrective Action</p>
                          {(nc.status === 'CLOSED' || nc.ca?.reviewStatus === 'ACCEPTED') ? (
                            <div style={{ padding: 12, background: '#e6f4e6', borderRadius: 8 }}>
                              <p style={{ color: '#107c10', fontSize: 13, fontWeight: 600 }}>✓ Corrective action accepted — NC closed</p>
                              {nc.ca && <>
                                <Field label="Root Cause" value={nc.ca.rootCause} />
                                <Field label="Corrective Action" value={nc.ca.correctiveAction} />
                              </>}
                            </div>
                          ) : (
                            <>
                              <InputField label="Root Cause *" value={ca.rootCause} rows={2} onChange={v => setCA({ ...ca, rootCause: v })} placeholder="Describe the root cause of this nonconformity…" />
                              <InputField label="Immediate Correction" value={ca.correction} rows={2} onChange={v => setCA({ ...ca, correction: v })} placeholder="Immediate action taken to fix the issue…" />
                              <InputField label="Corrective Action (systemic)" value={ca.correctiveAction} rows={2} onChange={v => setCA({ ...ca, correctiveAction: v })} placeholder="Action to prevent recurrence…" />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                                <InputField label="Evidence" value={ca.evidence} onChange={v => setCA({ ...ca, evidence: v })} placeholder="Photo, document, record reference…" />
                                <div style={{ paddingLeft: 12 }}>
                                  <InputField label="Target Completion Date" value={ca.targetDate} type="date" onChange={v => setCA({ ...ca, targetDate: v })} />
                                </div>
                              </div>
                              <InputField label="Submitted By" value={ca.submittedBy} onChange={v => setCA({ ...ca, submittedBy: v })} placeholder="Factory representative name" />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => submitCA(nc.id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  <Save size={13} />Submit CA
                                </button>
                                {nc.status === 'RESPONSE_SUBMITTED' && (
                                  <button onClick={() => acceptCA(nc.id)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#e6f4e6', color: '#107c10', border: '1px solid #107c10', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    <CheckCircle size={13} />Accept & Close NC
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── NC Workflow ── */}
          {tab === 'nc_workflow' && (
            <div style={{ padding: '20px 0' }}>
              <NcsTab applicationId={id} />
            </div>
          )}

          {/* ── Audit Summary ── */}
          {tab === 'audit_summary' && (
            <div style={{ padding: '20px 0' }}>
              <AuditSummaryTab
                applicationId={id}
                auditId={id}
                products={[]}
              />
            </div>
          )}

          {/* ── Decision Making ── */}
          {tab === 'decision_making' && (
            <div style={{ padding: '20px 0' }}>
              <DecisionMakingTab
                applicationId={id}
                auditId={id}
                userRole="admin"
                allNCsCleared={ncsQ.data?.every(nc => nc.status === 'APPROVED') ?? false}
                summarySubmitted={true}
              />
            </div>
          )}

          {/* ── Certificate Management ── */}
          {tab === 'certificate' && (
            <div style={{ padding: '20px 0' }}>
              <CertificateManagementTab
                applicationId={id}
                auditId={id}
                userRole="admin"
                decisionApproved={true}
              />
            </div>
          )}

          {/* ── Technical & Halal Review ── */}
          {tab === 'reviews' && (
            <div>
              <SectionCard title="Technical Review" icon={ShieldCheck} color="#5c2d91">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <InputField label="Technical Reviewer" value={techReview.reviewer} onChange={v => setTechReview(r => ({ ...r, reviewer: v }))} placeholder="Reviewer name" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Review Date" value={techReview.reviewDate} type="date" onChange={v => setTechReview(r => ({ ...r, reviewDate: v }))} />
                  </div>
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Review Checklist</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 4, marginBottom: 14 }}>
                  <BoolRow label="Application file complete and consistent" value={techReview.fileComplete} onChange={v => setTechReview(r => ({ ...r, fileComplete: v }))} />
                  <BoolRow label="Audit report reviewed and accepted" value={techReview.auditReportReviewed} onChange={v => setTechReview(r => ({ ...r, auditReportReviewed: v }))} />
                  <BoolRow label="All nonconformities closed satisfactorily" value={techReview.ncClosed} onChange={v => setTechReview(r => ({ ...r, ncClosed: v }))} />
                  <BoolRow label="Product and ingredient status confirmed halal" value={techReview.productStatusOk} onChange={v => setTechReview(r => ({ ...r, productStatusOk: v }))} />
                  <BoolRow label="Labels and halal mark usage reviewed and approved" value={techReview.labelReviewed} onChange={v => setTechReview(r => ({ ...r, labelReviewed: v }))} />
                </div>
                <InputField label="Technical Review Notes" value={techReview.technicalNotes} rows={3} onChange={v => setTechReview(r => ({ ...r, technicalNotes: v }))} placeholder="Notes on technical review findings and any conditions…" />
                <SelectField label="Technical Opinion" value={techReview.opinion}
                  options={[
                    { value: 'SATISFACTORY', label: 'Satisfactory — Recommend for decision' },
                    { value: 'CONDITIONAL', label: 'Conditional — Subject to conditions' },
                    { value: 'UNSATISFACTORY', label: 'Unsatisfactory — Return for further evaluation' },
                  ]}
                  onChange={v => setTechReview(r => ({ ...r, opinion: v as LocalTechnicalReview['opinion'] }))}
                />
                <SaveBtn onClick={saveTechReview} label="Save Technical Review" />
              </SectionCard>

              <SectionCard title="Halal / Shariah Review" icon={ShieldCheck} color="#156b20">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <InputField label="Halal / Shariah Reviewer" value={halalReview.reviewer} onChange={v => setHalalReview(r => ({ ...r, reviewer: v }))} placeholder="Halal expert name" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Review Date" value={halalReview.reviewDate} type="date" onChange={v => setHalalReview(r => ({ ...r, reviewDate: v }))} />
                  </div>
                </div>
                <SelectField label="Ingredient / Material Status" value={halalReview.ingredientStatus}
                  options={[
                    { value: 'ACCEPTABLE', label: 'Acceptable — All materials confirmed halal/permissible' },
                    { value: 'CONDITIONAL', label: 'Conditional — Acceptable subject to conditions' },
                    { value: 'NOT_ACCEPTABLE', label: 'Not Acceptable — Haram or doubtful materials present' },
                  ]}
                  onChange={v => setHalalReview(r => ({ ...r, ingredientStatus: v as LocalHalalReview['ingredientStatus'] }))}
                />
                <InputField label="Slaughter / Meat Process Review" value={halalReview.slaughterNotes} rows={2} onChange={v => setHalalReview(r => ({ ...r, slaughterNotes: v }))} placeholder="Notes on slaughter method, animal source, competence (if applicable)…" />
                <InputField label="Alcohol / Ethanol Review" value={halalReview.alcoholNotes} rows={2} onChange={v => setHalalReview(r => ({ ...r, alcoholNotes: v }))} placeholder="Notes on alcohol/ethanol use, source, level, permissibility…" />
                <InputField label="Animal Derivatives Review" value={halalReview.animalDerivNotes} rows={2} onChange={v => setHalalReview(r => ({ ...r, animalDerivNotes: v }))} placeholder="Gelatin, enzymes, emulsifiers, collagen — source and status…" />
                <InputField label="Religious Compliance Notes" value={halalReview.religiousNotes} rows={3} onChange={v => setHalalReview(r => ({ ...r, religiousNotes: v }))} placeholder="Overall Shariah compliance assessment, conditions, concerns…" />
                <InputField label="Conditions (if conditional)" value={halalReview.conditions} rows={2} onChange={v => setHalalReview(r => ({ ...r, conditions: v }))} placeholder="List any conditions or restrictions…" />
                <SelectField label="Shariah / Halal Opinion" value={halalReview.opinion}
                  options={[
                    { value: 'RECOMMENDED', label: 'Recommended — Products and processes are compliant' },
                    { value: 'CONDITIONAL', label: 'Conditional — Compliant subject to conditions listed' },
                    { value: 'NOT_RECOMMENDED', label: 'Not Recommended — Non-compliant issues found' },
                  ]}
                  onChange={v => setHalalReview(r => ({ ...r, opinion: v as LocalHalalReview['opinion'] }))}
                />
                <SaveBtn onClick={saveHalalReview} label="Save Halal Review" />
              </SectionCard>
            </div>
          )}

          {/* ── Certification Decision ── */}
          {tab === 'cert_decision' && (
            <div>
              {certDecision.certificateGenerated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#e6f4e6', border: '1px solid #107c10', borderRadius: 10, marginBottom: 16 }}>
                  <Award size={20} color="#107c10" />
                  <div>
                    <p style={{ fontWeight: 700, color: '#107c10', fontSize: 14 }}>Certificate Generated</p>
                    <p style={{ fontSize: 12, color: '#1d7a1d' }}>Key: {certDecision.certificateKey} · <a href={`/verify/${certDecision.certificateKey}`} target="_blank" rel="noreferrer" style={{ color: '#107c10' }}>View verification page</a></p>
                  </div>
                </div>
              )}

              <SectionCard title="Certification Decision" icon={Award} color="#1a56db">
                <div style={{ padding: '10px 14px', background: '#fef9e7', border: '1px solid #f59e0b', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#92400e' }}>
                  The decision maker must be independent from the auditor who conducted the evaluation. Record the decision only when the technical and halal reviews are complete.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <InputField label="Decision Maker" value={certDecision.decisionMaker} onChange={v => setCertDecision(d => ({ ...d, decisionMaker: v }))} placeholder="Full name of certification decision maker" />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Decision Date" value={certDecision.decisionDate} type="date" onChange={v => setCertDecision(d => ({ ...d, decisionDate: v }))} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Decision *</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([
                      { v: 'APPROVE',          label: 'Approve',              color: '#107c10', bg: '#e6f4e6' },
                      { v: 'REJECT',           label: 'Reject',               color: '#d13438', bg: '#fde7e9' },
                      { v: 'SUSPEND',          label: 'Suspend',              color: '#8a6000', bg: '#fff8e5' },
                      { v: 'REDUCE_SCOPE',     label: 'Reduce Scope',         color: '#8a3c00', bg: '#fff0e5' },
                      { v: 'MORE_EVALUATION',  label: 'Request More Evaluation', color: '#5c2d91', bg: '#f0e6f6' },
                    ] as const).map(({ v, label, color, bg }) => (
                      <button key={v} onClick={() => setCertDecision(d => ({ ...d, decision: v }))}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${certDecision.decision === v ? color : C.border}`, background: certDecision.decision === v ? bg : '#fff', color: certDecision.decision === v ? color : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <InputField label="Basis for Decision" value={certDecision.basis} rows={3} onChange={v => setCertDecision(d => ({ ...d, basis: v }))} placeholder="Summarize the basis for this certification decision, referencing reviews and audit findings…" />
                <InputField label="Certified Scope" value={certDecision.scope} rows={2} onChange={v => setCertDecision(d => ({ ...d, scope: v }))} placeholder="Factory name, address, products, production lines, and activities covered…" />
                <InputField label="Conditions / Restrictions (if any)" value={certDecision.conditions} rows={2} onChange={v => setCertDecision(d => ({ ...d, conditions: v }))} placeholder="List any conditions attached to this certification decision…" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
                  <InputField label="Certificate Validity (months)" value={certDecision.validityMonths} type="number" onChange={v => setCertDecision(d => ({ ...d, validityMonths: v }))} />
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Next Surveillance Date" value={certDecision.nextSurveillance} type="date" onChange={v => setCertDecision(d => ({ ...d, nextSurveillance: v }))} />
                  </div>
                  <div style={{ paddingLeft: 12 }}>
                    <InputField label="Decision Reference Number" value={certDecision.decisionRef} onChange={v => setCertDecision(d => ({ ...d, decisionRef: v }))} placeholder="e.g. DEC-2026-0042" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <SaveBtn onClick={saveCertDecision} label="Record Decision" />
                  {certDecision.decision === 'APPROVE' && !certDecision.certificateGenerated && (
                    <button onClick={generateCertificate}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#107c10', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#0a5e0a')}
                      onMouseOut={e => (e.currentTarget.style.background = '#107c10')}>
                      <Award size={14} />Generate Certificate
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === 'billing' && (() => {
            const sym = billing ? billing.currency : ''
            const fmt = (n: number) => `${sym} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            const ivStyle = invoice ? invoiceStatusStyle(invoice.status) : null
            return (
              <div style={{ maxWidth: 700 }}>
                {/* Fee Breakdown */}
                <SectionCard title="Fee Breakdown" icon={CreditCard}>
                  {!billing ? (
                    <p style={{ color: C.muted, fontSize: 13 }}>No billing data found for this application. Fee breakdown is saved when the customer submits the application.</p>
                  ) : (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {billing.lineItems.map((li, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '8px 10px', color: C.textDark }}>{li.description}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: C.muted }}>{li.quantity}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: C.textDark }}>{fmt(li.unitPrice)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: C.textDark }}>{fmt(li.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: C.muted }}>Subtotal</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(billing.subtotal)}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: C.muted }}>VAT ({billing.vatPct}%)</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(billing.vatAmount)}</td>
                          </tr>
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={3} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>Total</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: C.primary }}>{fmt(billing.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p style={{ marginTop: 8, fontSize: 11, color: C.muted }}>Saved at: {new Date(billing.savedAt).toLocaleString()}</p>
                    </div>
                  )}
                </SectionCard>

                {/* Invoice */}
                <SectionCard title="Invoice" icon={FileText}>
                  {!invoice ? (
                    <div>
                      <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>No invoice created yet. Create one from the fee breakdown above.</p>
                      <button onClick={handleCreateInvoice} disabled={!billing}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: billing ? C.primary : '#e2e8f0', color: billing ? '#fff' : C.muted, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: billing ? 'pointer' : 'not-allowed' }}>
                        <Plus size={14} /> Create Invoice
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Invoice header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textDark }}>{invoice.invoiceNumber}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Issued: {formatInvoiceDate(invoice.issuedAt)} · Due: {formatInvoiceDate(invoice.dueDate)}</p>
                        </div>
                        {ivStyle && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: ivStyle.bg, color: ivStyle.color }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: ivStyle.dot }} />{invoice.status}
                          </span>
                        )}
                      </div>

                      {/* Line items */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                        <tbody>
                          {invoice.lineItems.map((li, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '7px 10px', color: C.textDark }}>{li.description}</td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{invoice.currency} {li.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr>
                            <td style={{ padding: '7px 10px', color: C.muted, fontSize: 12 }}>VAT ({invoice.vatPct}%)</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: C.muted }}>{invoice.currency} {invoice.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr style={{ background: '#f8fafc' }}>
                            <td style={{ padding: '10px', fontWeight: 700, fontSize: 14 }}>Total Due</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: C.primary }}>{invoice.currency} {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {invoice.status === 'DRAFT' && (
                          <button onClick={handleIssueInvoice}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <Download size={13} /> Issue & Send to Customer
                          </button>
                        )}
                        {(invoice.status === 'ISSUED' || invoice.status === 'OVERDUE') && !showPaidForm && (
                          <button onClick={() => setShowPaidForm(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={13} /> Mark as Paid
                          </button>
                        )}
                        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                          <button onClick={() => handleInvoiceStatus('CANCELLED')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <Trash2 size={13} /> Cancel Invoice
                          </button>
                        )}
                        {invoice.status === 'ISSUED' && (
                          <button onClick={() => handleInvoiceStatus('OVERDUE')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Mark Overdue
                          </button>
                        )}
                      </div>

                      {/* Mark paid form */}
                      {showPaidForm && (
                        <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 13, color: '#15803d' }}>Confirm Payment</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Method</label>
                              <select value={paidMethod} onChange={e => setPaidMethod(e.target.value)}
                                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, background: '#fff' }}>
                                {['STRIPE', 'BANK_TRANSFER', 'CASH', 'OTHER'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Reference / TxID</label>
                              <input value={paidRef} onChange={e => setPaidRef(e.target.value)} placeholder="TXN-12345"
                                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, boxSizing: 'border-box' as const }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { handleMarkPaid(paidMethod, paidRef); setShowPaidForm(false) }}
                              style={{ padding: '7px 16px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Confirm
                            </button>
                            <button onClick={() => setShowPaidForm(false)}
                              style={{ padding: '7px 16px', background: '#fff', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment details if paid */}
                      {invoice.status === 'PAID' && invoice.paymentDate && (
                        <div style={{ marginTop: 16, padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: '#15803d' }}>Payment Received</p>
                          <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
                            <span><b>Date:</b> {formatInvoiceDate(invoice.paymentDate)}</span>
                            {invoice.paymentMethod && <span><b>Method:</b> {invoice.paymentMethod.replace('_', ' ')}</span>}
                            {invoice.paymentReference && <span><b>Ref:</b> {invoice.paymentReference}</span>}
                          </div>
                          {invoice.paymentEvidenceBase64 && (
                            <div style={{ marginTop: 10 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: C.muted }}>PAYMENT EVIDENCE</p>
                              <a href={invoice.paymentEvidenceBase64} download={invoice.paymentEvidenceFileName || 'evidence'}
                                style={{ fontSize: 13, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Download size={13} /> {invoice.paymentEvidenceFileName || 'Download evidence'}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>
              </div>
            )
          })()}

          {/* ── Payment ── */}
          {tab === 'payment' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CreditCard size={16} color={C.primary} />
                <span style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>Payment Status</span>
              </div>
              {paymentQ.isLoading ? <p style={{ color: C.muted }}>Loading…</p> : !paymentQ.data ? (
                <p style={{ color: C.muted }}>No payment information</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {paymentQ.data.paymentRequired && paymentQ.data.paymentStatus !== 'COMPLETED' && (
                    <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 8, background: '#fff8e5', border: '1px solid #ffb900' }}>
                      <AlertTriangle size={16} color="#8a6000" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#8a6000' }}>Payment Required</p>
                        {paymentQ.data.amount != null && <p style={{ fontSize: 13, color: '#8a6000', marginTop: 2 }}>{formatCurrency(paymentQ.data.amount, paymentQ.data.currency ?? 'MYR')} is due</p>}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: C.bg, padding: 16, borderRadius: 8 }}>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Status</p>
                      <StatusChip status={paymentQ.data.paymentStatus} />
                    </div>
                    {paymentQ.data.amount != null && <Field label="Amount" value={formatCurrency(paymentQ.data.amount, paymentQ.data.currency ?? 'MYR')} />}
                    {paymentQ.data.reference && <Field label="Reference" value={paymentQ.data.reference} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Activity Log ── */}
          {tab === 'activity' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} color={C.primary} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>Full Activity Log</span>
                </div>
                <select value={eventFilter} onChange={e => { setEventFilter(e.target.value); setEventPage(0) }}
                  style={{ fontSize: 13, padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.text, outline: 'none', cursor: 'pointer' }}>
                  <option value="all">All Events</option>
                  <option value="status">Status Changes</option>
                  <option value="payment">Payments</option>
                  <option value="document">Documents</option>
                  <option value="audit">Audit Events</option>
                </select>
              </div>
              {eventsQ.isLoading ? <p style={{ color: C.muted }}>Loading…</p> : !filteredEvents.length ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>
                  <Activity size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>No events recorded yet</p>
                </div>
              ) : (
                <div>
                  {filteredEvents.map((ev, idx) => (
                    <div key={ev.id} style={{ display: 'flex', gap: 14, paddingBottom: idx < filteredEvents.length - 1 ? 20 : 0, position: 'relative' }}>
                      {idx < filteredEvents.length - 1 && <div style={{ position: 'absolute', top: 14, left: 4, width: 2, height: 'calc(100% - 14px)', background: C.border }} />}
                      <EventDot event={ev.event} />
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: C.textDark }}>{ev.event?.replace(/_/g, ' ')}</p>
                          <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{timeAgo(ev.performedAt)}</span>
                        </div>
                        {ev.description && <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{ev.description}</p>}
                        {ev.oldStatus && ev.newStatus && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <StatusChip status={ev.oldStatus} />
                            <span style={{ color: C.muted, fontSize: 12 }}>→</span>
                            <StatusChip status={ev.newStatus} />
                          </div>
                        )}
                        {ev.performedBy && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                            <User size={11} color={C.muted} />
                            <span style={{ fontSize: 12, color: C.muted }}>{ev.performedBy} · {formatDateTime(ev.performedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(eventsQ.data?.totalPages ?? 0) > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Page {eventPage + 1} of {eventsQ.data?.totalPages}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEventPage(p => Math.max(0, p - 1))} disabled={eventPage === 0}
                          style={{ fontSize: 13, padding: '5px 12px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.white, color: C.text, cursor: 'pointer', opacity: eventPage === 0 ? 0.4 : 1 }}>Prev</button>
                        <button onClick={() => setEventPage(p => p + 1)} disabled={eventPage >= (eventsQ.data?.totalPages ?? 1) - 1}
                          style={{ fontSize: 13, padding: '5px 12px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.white, color: C.text, cursor: 'pointer', opacity: eventPage >= (eventsQ.data?.totalPages ?? 1) - 1 ? 0.4 : 1 }}>Next</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      {showAuditReport && selectedAuditTrack && (
        <AuditReportModal
          appNumber={app.applicationNumber}
          companyName={app.companyName}
          track={selectedAuditTrack}
          categories={activityCategories}
          selectedCategoryKey={auditCategoryKey}
          onCategoryChange={handleAuditCategoryChange}
          answers={auditReportAnswers}
          onUpdate={updateAuditReportAnswer}
          onClose={() => setShowAuditReport(false)}
          onSave={saveAuditReport}
        />
      )}
    </div>
  )
}
