import apiClient from './client'
import type {
  PendingTaskDto, UpcomingAuditsResultDto, ApplicationStagesResultDto,
  MonthlyRevenueDto, AuditEventLogsResponseDto,
} from '@/types'

export const getPendingTasks = (p?: { statuses?: string; country?: string; page?: number; size?: number }) =>
  apiClient.get<PendingTaskDto>('/dashboard/pending/tasks', { params: p }).then(r => r.data)

export const getUpcomingAudits = (p?: { country?: string; page?: number; size?: number }) =>
  apiClient.get<UpcomingAuditsResultDto>('/dashboard/audits/upcoming', { params: p }).then(r => r.data)

export const getApplicationStages = (country?: string) =>
  apiClient.get<ApplicationStagesResultDto>('/dashboard/applications/stage', { params: { country } }).then(r => r.data)

export const getMonthlyRevenues = (country?: string) =>
  apiClient.get<MonthlyRevenueDto>('/dashboard/monthly/revenues', { params: { country } }).then(r => r.data)

export const getRecentEvents = (p?: { country?: string; page?: number; size?: number }) =>
  apiClient.get<AuditEventLogsResponseDto>('/dashboard/recent/events', { params: p }).then(r => r.data)
