import apiClient from './client'
import type { UserListDto, UserDto } from '@/types'

export const getMgmtUsers = (p?: { page?: number; size?: number; filterByRole?: string; search?: string }) =>
  apiClient.get<{ content: UserListDto[]; totalElements: number; totalPages: number }>('/mgmt/users', { params: p }).then(r => r.data)

export const updateUserStatus = (id: string, data: { status: string; reason?: string }) =>
  apiClient.patch<UserDto>(`/users/${id}/status`, data).then(r => r.data)

export const updateEmployee = (id: string, data: {
  name?: string; role?: string; phone?: string; employmentType?: string;
  jobTitle?: string; department?: string; idProof?: string; notes?: string;
  idDocName?: string; idDocData?: string; photoData?: string;
}) =>
  apiClient.patch(`/users/${id}/profile`, {
    fullName:       data.name,
    role:           data.role,
    phone:          data.phone,
    employmentType: data.employmentType,
    jobTitle:       data.jobTitle,
    department:     data.department,
    idProofNumber:  data.idProof,
    notes:          data.notes,
    idDocName:      data.idDocName,
    idDocData:      data.idDocData,
    photoData:      data.photoData,
  }).then(r => r.data)

export const createEmployee = (data: {
  name: string; email: string; password: string; role: string;
  phone?: string; employmentType?: string; jobTitle?: string;
  department?: string; idProof?: string; startDate?: string; notes?: string;
  idDocName?: string; idDocData?: string; photoData?: string;
}) =>
  apiClient.post('/auth/employees', {
    fullName:       data.name,
    email:          data.email,
    password:       data.password,
    role:           data.role,
    phone:          data.phone,
    employmentType: data.employmentType,
    jobTitle:       data.jobTitle,
    department:     data.department,
    idProofNumber:  data.idProof,
    startDate:      data.startDate,
    notes:          data.notes,
    idDocName:      data.idDocName,
    idDocData:      data.idDocData,
    photoData:      data.photoData,
  }).then(r => r.data)
