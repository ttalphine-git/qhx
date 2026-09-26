import apiClient from './client'
import type { CertificatesPageableDTO, CertificateDto } from '@/types'

export type { CertificatesPageableDTO, CertificateDto } from '@/types'

export const getCertificates = (p?: { page?: number; size?: number; search?: string }) =>
  apiClient.get<CertificatesPageableDTO>('/certificates', { params: p }).then(r => r.data)

export const getCertificate = (key: string) =>
  apiClient.get<CertificateDto>(`/certificates/${key}`).then(r => r.data)
