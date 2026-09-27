import apiClient from './client'
import type { LoginRequest, AuthResponse, UserProfileDto } from '@/types'

export const loginUser = (data: LoginRequest) =>
  apiClient.post<AuthResponse>('/auth/login', data).then(r => r.data)

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  companyName: string
  role: 'CUSTOMER' | 'OFFICE'
}

export const registerUser = (data: RegisterRequest) =>
  apiClient.post<AuthResponse>('/auth/register', data).then(r => r.data)

export const logoutUser = (token: string) =>
  apiClient.post('/auth/logout', token).then(r => r.data)

export const getCurrentUser = () =>
  apiClient.get<UserProfileDto>('/users/me').then(r => r.data)

export const checkEmailExists = (email: string) =>
  apiClient.get<{ exists: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`).then(r => r.data)

export interface UserRoleOption {
  value: string
  label: string
}

export interface AuthDatabaseStatus {
  connected: boolean
  database: string
  userCount: number
  adminExists: boolean
  superAdminExists: boolean
  checkedAt: string
}

export const getUserRoles = () =>
  apiClient.get<UserRoleOption[]>('/auth/roles').then(r => r.data)

export const getAuthDatabaseStatus = () =>
  apiClient.get<AuthDatabaseStatus>('/auth/database-status').then(r => r.data)
