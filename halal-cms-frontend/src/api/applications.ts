import apiClient from './client'
import type {
  ApplicationResponseDTO, ApplicationsPageableDTO,
  ApplicationSmallResponseDTO, CompanyInformationDTO,
  ServiceInformationDTO, UserDocumentsDto, ApplicationPaymentStatusDto,
  ApplicationStatus, AuditEventLogsResponseDto, UserDocumentDto,
} from '@/types'

export const getApplications = (p?: { statuses?: string; search?: string; page?: number; size?: number }) =>
  apiClient.get<ApplicationsPageableDTO>('/applications', { params: p }).then(r => r.data)

export const getApplication = (id: number) =>
  apiClient.get<ApplicationResponseDTO>(`/applications/${id}`).then(r => r.data)

export const createApplication = (payload: Record<string, unknown>) =>
  apiClient.post<ApplicationResponseDTO>('/applications', payload).then(r => r.data)

export const deleteApplication = (id: number) =>
  apiClient.delete(`/applications/${id}`).then(r => r.data)

export const updateApplicationStatus = (id: number, status: ApplicationStatus) =>
  apiClient.patch<ApplicationResponseDTO>(`/applications/${id}/status`, JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  }).then(r => r.data)

export const signApplicationAgreement = (id: number, payload: {
  agreementSignedAt: string
  agreementSignature: string
  agreementLanguage: string
}) =>
  apiClient.patch<ApplicationResponseDTO>(`/applications/${id}/agreement`, payload).then(r => r.data)

export const confirmApplicationPayment = (id: number, payload: {
  method?: string
  reference?: string
  amount?: number
  currency?: string
}) =>
  apiClient.patch<ApplicationResponseDTO>(`/applications/${id}/payment/confirm`, payload).then(r => r.data)

export const getCompanyInfo = (id: number) =>
  apiClient.get<CompanyInformationDTO>(`/applications/${id}/personal`).then(r => r.data)

export const getServiceInfo = (id: number) =>
  apiClient.get<ServiceInformationDTO>(`/applications/${id}/service-information`).then(r => r.data)

export const getApplicationDocuments = (id: number) =>
  apiClient.get<UserDocumentsDto>(`/applications/${id}/documents`).then(r => r.data)

export const saveApplicationDocument = (id: number, document: Omit<UserDocumentDto, 'id' | 'uploadedAt'>) =>
  apiClient.post<UserDocumentDto>(`/applications/${id}/documents`, document).then(r => r.data)

export const deleteApplicationDocument = (id: number, documentId: number) =>
  apiClient.delete(`/applications/${id}/documents/${documentId}`).then(r => r.data)

export const getApplicationWorkflowData = <T>(id: number, key: string) =>
  apiClient.get<T>(`/applications/${id}/workflow-data/${encodeURIComponent(key)}`).then(r => r.data)

export const saveApplicationWorkflowData = <T>(id: number, key: string, value: T) =>
  apiClient.put<T>(`/applications/${id}/workflow-data/${encodeURIComponent(key)}`, value).then(r => r.data)

export const getPaymentStatus = (id: number) =>
  apiClient.get<ApplicationPaymentStatusDto>(`/applications/${id}/payment-status`).then(r => r.data)

export const getEventLogs = (applicationId: number, p?: { page?: number; size?: number }) =>
  apiClient.get<AuditEventLogsResponseDto>(`/audits/eventlogs/${applicationId}`, { params: p }).then(r => r.data)

export const getAllApplicationsSmall = () =>
  apiClient.get<ApplicationSmallResponseDTO[]>('/applications/small').then(r => r.data)
