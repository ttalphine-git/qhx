import apiClient from './client'

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string | null
  primaryKey: boolean
  ordinalPosition: number
}

export interface DatabaseTable {
  database?: string
  schema: string
  name: string
  type: string
  estimatedRows: number
  columns: DatabaseColumn[]
}

export interface DatabaseRows {
  database?: string
  schema: string
  table: string
  page: number
  size: number
  totalRows: number
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface AccreditationScope {
  id: string
  body: string
  standard: string
  certNumber?: string
  scope?: string
  country?: string
  issueDate?: string
  expiryDate: string
  certFileData?: string
  certFileName?: string
  notes?: string
  unitPrice?: number
  createdAt?: string
  updatedAt?: string
}

export interface AccreditationScopeRequest {
  body: string
  standard: string
  certNumber?: string
  scope?: string
  country?: string
  issueDate?: string
  expiryDate: string
  certFileData?: string
  certFileName?: string
  notes?: string
  unitPrice?: number
}

export const getDatabaseTables = () =>
  apiClient.get<DatabaseTable[]>('/system/database/tables').then(r => r.data)

export const getDatabaseRows = (database: string, schema: string, table: string, page = 0, size = 50) =>
  apiClient.get<DatabaseRows>('/system/database/rows', { params: { database, schema, table, page, size } }).then(r => r.data)

export const getAccreditationScopes = () =>
  apiClient.get<AccreditationScope[]>('/system/accreditation-scopes').then(r => r.data)

export const createAccreditationScope = (data: AccreditationScopeRequest) =>
  apiClient.post<AccreditationScope>('/system/accreditation-scopes', data).then(r => r.data)

export const updateAccreditationScope = (id: string, data: AccreditationScopeRequest) =>
  apiClient.put<AccreditationScope>(`/system/accreditation-scopes/${id}`, data).then(r => r.data)

export const deleteAccreditationScope = (id: string) =>
  apiClient.delete(`/system/accreditation-scopes/${id}`)
