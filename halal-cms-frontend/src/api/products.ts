import apiClient from './client'

export interface Product {
  id: string
  companyId: string
  factoryId?: string
  name: string
  sku?: string
  brand?: string
  category: string
  description?: string
  ingredients: string[]
  halalStatus: string
  certificationNumber?: string
  createdAt: string
  updatedAt: string
}

export interface ProductRequest {
  name: string
  sku?: string
  brand?: string
  category: string
  description?: string
  ingredients?: string[]
  factoryId?: string
}

export interface ProductPage {
  content: Product[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const getProducts = (companyId: string, page = 0, size = 20) =>
  apiClient.get<ProductPage>(`/companies/${companyId}/products`, { params: { page, size } }).then(r => r.data)

export const createProduct = (companyId: string, data: ProductRequest) =>
  apiClient.post<Product>(`/companies/${companyId}/products`, data).then(r => r.data)

export const updateProduct = (companyId: string, id: string, data: ProductRequest) =>
  apiClient.put<Product>(`/companies/${companyId}/products/${id}`, data).then(r => r.data)

export const deleteProduct = (companyId: string, id: string) =>
  apiClient.delete(`/companies/${companyId}/products/${id}`)
