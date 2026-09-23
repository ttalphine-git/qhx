import apiClient from './client'
import type {
  ApplicationResponseDTO, ApplicationsPageableDTO,
  ApplicationSmallResponseDTO, CompanyInformationDTO,
  ServiceInformationDTO, UserDocumentsDto, ApplicationPaymentStatusDto,
  ApplicationStatus, AuditEventLogsResponseDto,
} from '@/types'

export const getApplications = (p?: { statuses?: string; search?: string; page?: number; size?: number }) =>
  apiClient.get<ApplicationsPageableDTO>('/applications', { params: p }).then(r => r.data)

export const getApplication = (id: number) =>
  apiClient.get<ApplicationResponseDTO>(`/applications/${id}`).then(r => r.data)

export const createApplication = () =>
  apiClient.post<ApplicationResponseDTO>('/applications').then(r => r.data)

export const deleteApplication = (id: number) =>
  apiClient.delete(`/applications/${id}`).then(r => r.data)

export const updateApplicationStatus = (id: number, status: ApplicationStatus) =>
  apiClient.patch<ApplicationResponseDTO>(`/applications/${id}/status`, status).then(r => r.data)

export const getCompanyInfo = (id: number) =>
  apiClient.get<CompanyInformationDTO>(`/applications/${id}/personal`).then(r => r.data)

export const getServiceInfo = (id: number) =>
  apiClient.get<ServiceInformationDTO>(`/applications/${id}/service-information`).then(r => r.data)

export const getApplicationDocuments = (id: number) =>
  apiClient.get<UserDocumentsDto>(`/applications/${id}/documents`).then(r => r.data)

export const getPaymentStatus = (id: number) =>
  apiClient.get<ApplicationPaymentStatusDto>(`/applications/${id}/payment-status`).then(r => r.data)

export const getEventLogs = (applicationId: number, p?: { page?: number; size?: number }) =>
  apiClient.get<AuditEventLogsResponseDto>(`/audits/eventlogs/${applicationId}`, { params: p }).then(r => r.data)

export const getAllApplicationsSmall = () =>
  apiClient.get<ApplicationSmallResponseDTO[]>('/applications/small').then(r => r.data)
