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

const STORAGE_KEY = 'hcs_color_settings'

export const getColorSettings = async (): Promise<ColorSettings> => {
  try {
    const response = await apiClient.get<ColorSettings>('/settings/colors')
    return response.data
  } catch {
    // Fallback to localStorage if backend endpoint doesn't exist
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return getDefaultColors()
  }
}

export const updateColorSettings = async (data: Partial<ColorSettings>): Promise<ColorSettings> => {
  const updated = { ...getDefaultColors(), ...data }
  try {
    const response = await apiClient.put<ColorSettings>('/settings/colors', data)
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
    return response.data
  } catch {
    // If backend fails, save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  }
}

export const resetColorSettings = async (): Promise<ColorSettings> => {
  const defaults = getDefaultColors()
  try {
    const response = await apiClient.post<ColorSettings>('/settings/colors/reset')
    // Also save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
    return response.data
  } catch {
    // If backend fails, use defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    return defaults
  }
}

export const getDefaultColors = (): ColorSettings => ({
  topBarBackground: '#003d82',
  topBarText: '#ffffff',
  buttonPrimary: '#2563eb',
  buttonPrimaryHover: '#1d4ed8',
  buttonSecondary: '#64748b',
  buttonSecondaryHover: '#475569',
  accentColor: '#0099bc',
  borderColor: '#e2e8f0',
})
