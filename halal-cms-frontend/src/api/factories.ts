import apiClient from './client'

export interface Factory {
  id: string
  companyId: string
  name: string
  factoryType: string
  address: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  phone?: string
  pic?: string
  picPhone?: string
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface FactoryRequest {
  name: string
  factoryType: string
  address: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  phone?: string
  pic?: string
  picPhone?: string
  notes?: string
}

export interface FactoryPage {
  content: Factory[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const getFactories = (companyId: string, page = 0, size = 20) =>
  apiClient.get<FactoryPage>(`/companies/${companyId}/factories`, { params: { page, size } }).then(r => r.data)

export const createFactory = (companyId: string, data: FactoryRequest) =>
  apiClient.post<Factory>(`/companies/${companyId}/factories`, data).then(r => r.data)

export const updateFactory = (companyId: string, id: string, data: FactoryRequest) =>
  apiClient.put<Factory>(`/companies/${companyId}/factories/${id}`, data).then(r => r.data)

export const deleteFactory = (companyId: string, id: string) =>
  apiClient.delete(`/companies/${companyId}/factories/${id}`)
