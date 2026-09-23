import apiClient from './client'

export interface Company {
  id: string
  ownerId: string
  registrationNumber: string
  name: string
  businessType: string
  address: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postcode?: string
  country: string
  phone?: string
  email?: string
  website?: string
  activityCategory?: string
  specificActivities?: string
  description?: string
  incorporationDate?: string
  contactName?: string
  contactDesignation?: string
  employeeCount?: number
  latitude?: string
  longitude?: string
  licenseNo?: string
  licenseExpiry?: string
  issuingAuthority?: string
  licenseFileName?: string
  licenseFileSize?: number
  licenseFileData?: string | null
  vatNo?: string
  sstNo?: string
  vatFileName?: string
  vatFileSize?: number
  vatFileData?: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface CompanyRequest {
  registrationNumber: string
  name: string
  businessType: string
  address: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postcode?: string
  country: string
  phone?: string
  email?: string
  website?: string
  activityCategory?: string
  specificActivities?: string
  description?: string
  incorporationDate?: string
  contactName?: string
  contactDesignation?: string
  employeeCount?: number
  latitude?: string
  longitude?: string
  licenseNo?: string
  licenseExpiry?: string
  issuingAuthority?: string
  licenseFileName?: string
  licenseFileSize?: number
  licenseFileData?: string | null
  vatNo?: string
  sstNo?: string
  vatFileName?: string
  vatFileSize?: number
  vatFileData?: string | null
}

export const getMyCompany = () =>
  apiClient.get<Company>('/companies/me').then(r => r.data)

export const getCompany = (id: string) =>
  apiClient.get<Company>(`/companies/${id}`).then(r => r.data)

export const getCompanies = (page = 0, size = 100) =>
  apiClient.get<{ content: Company[]; totalElements: number; totalPages: number }>('/companies', { params: { page, size } }).then(r => r.data)

export const createCompany = (data: CompanyRequest) =>
  apiClient.post<Company>('/companies', data).then(r => r.data)

export const updateCompany = (id: string, data: CompanyRequest) =>
  apiClient.put<Company>(`/companies/${id}`, data).then(r => r.data)
