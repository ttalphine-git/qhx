import apiClient from './client'

export interface ColorSettings {
  id?: string
  topBarBackground: string
  topBarText: string
  buttonPrimary: string
  buttonPrimaryHover: string
  buttonSecondary: string
  buttonSecondaryHover: string
  accentColor: string
  borderColor: string
  createdAt?: string
  updatedAt?: string
}

export const getColorSettings = () =>
  apiClient.get<ColorSettings>('/settings/colors').then(r => r.data).catch(() => getDefaultColors())

export const updateColorSettings = (data: Partial<ColorSettings>) =>
  apiClient.put<ColorSettings>('/settings/colors', data).then(r => r.data)

export const resetColorSettings = () =>
  apiClient.post<ColorSettings>('/settings/colors/reset').then(r => r.data)

export const getDefaultColors = (): ColorSettings => ({
  topBarBackground: '#0f172a',
  topBarText: '#ffffff',
  buttonPrimary: '#2563eb',
  buttonPrimaryHover: '#1d4ed8',
  buttonSecondary: '#64748b',
  buttonSecondaryHover: '#475569',
  accentColor: '#0099bc',
  borderColor: '#e2e8f0',
})
