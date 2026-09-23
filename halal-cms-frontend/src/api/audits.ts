import apiClient from './client'
import type {
  AuditStatusResponse, ApplicationAuditResponse,
  NonConformityResponse, RecommendationResponse, AuditEventLogsResponseDto,
} from '@/types'
import type { AuditTrack } from '@/lib/hcbWorkflow'

export interface AuditQuestionDto {
  id?: number
  questionText: string
  sortOrder?: number
}

export interface AuditReportConfigurationDto {
  id?: number
  name: string
  reportTitle?: string
  appliesTo: string
  activityCategoryKeys: string[]
  riskLevel: AuditTrack['riskLevel']
  formCode?: string
  revision?: string
  stages: string[]
  active?: boolean
  sortOrder?: number
  questions: AuditQuestionDto[]
}

export interface AuditAnswerDto {
  id?: number
  questionId?: number
  questionText: string
  answer?: '' | 'yes' | 'no' | 'na'
  finding?: '' | 'nc' | 'obs'
  customerComment?: string
  auditorComment?: string
  shariaComment?: string
}

export interface ApplicationAuditReportDto {
  id?: number
  applicationId: number
  configurationId?: number
  activityCategoryKey?: string
  status: string
  generalComment?: string
  completedAt?: string
  configuration?: AuditReportConfigurationDto
  answers: AuditAnswerDto[]
}

export const getAuditStatus = (applicationId: number) =>
  apiClient.get<AuditStatusResponse>(`/audits/status/${applicationId}`).then(r => r.data)

export const getAuditPlan = (applicationId: number) =>
  apiClient.get<ApplicationAuditResponse>(`/audit-plans/application/${applicationId}`).then(r => r.data)

export const saveAuditPlan = (applicationId: number, data: {
  auditorId?: string
  auditorName?: string
  scheduledDate?: string
  durationDays?: number
  scope?: string
  status?: string
}) =>
  apiClient.put<ApplicationAuditResponse>(`/audit-plans/application/${applicationId}`, data).then(r => r.data)

export const getNonConformities = (applicationId: number) =>
  apiClient.get<NonConformityResponse[]>(`/audits/non-conformities/application/${applicationId}`).then(r => r.data)

export const getRecommendations = (applicationId: number) =>
  apiClient.get<RecommendationResponse[]>(`/audits/recommendations/${applicationId}`).then(r => r.data)

export const startF1Audit = (applicationId: number) =>
  apiClient.post<ApplicationAuditResponse>(`/audits/start-f1/${applicationId}`).then(r => r.data)

export const finalizeCertification = (applicationId: number) =>
  apiClient.post(`/audits/finalize-certification/${applicationId}`).then(r => r.data)

export const rejectApplication = (applicationId: number) =>
  apiClient.post(`/audits/reject-application/${applicationId}`).then(r => r.data)

export const getEventLogs = (applicationId: number, p?: { page?: number; size?: number }) =>
  apiClient.get<AuditEventLogsResponseDto>(`/audits/eventlogs/${applicationId}`, { params: p }).then(r => r.data)

export const getAuditReportConfigurations = () =>
  apiClient.get<AuditReportConfigurationDto[]>('/audits/report-configurations').then(r => r.data)

export const saveAuditReportConfigurations = (data: AuditReportConfigurationDto[]) =>
  apiClient.put<AuditReportConfigurationDto[]>('/audits/report-configurations', data).then(r => r.data)

export const getApplicationAuditReport = (applicationId: number, activityCategoryKey?: string) =>
  apiClient.get<ApplicationAuditReportDto>(`/audits/reports/application/${applicationId}`, { params: { activityCategoryKey } }).then(r => r.data)

export const saveApplicationAuditReport = (applicationId: number, data: ApplicationAuditReportDto) =>
  apiClient.put<ApplicationAuditReportDto>(`/audits/reports/application/${applicationId}`, data).then(r => r.data)
