import { create } from 'zustand'
import type { UserDto } from '@/types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
  user: UserDto | null
  isAuthenticated: boolean
  setAuth: (token: string, user: UserDto, refreshToken?: string, expiresIn?: number) => void
  clearAuth: () => void
}

const load = <T>(key: string): T | null => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : null } catch { return null }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('hcs_token'),
  refreshToken: localStorage.getItem('hcs_refresh_token'),
  expiresAt: Number(localStorage.getItem('hcs_token_expires_at')) || null,
  user: load<UserDto>('hcs_user'),
  isAuthenticated: !!(localStorage.getItem('hcs_token') && load('hcs_user')),

  setAuth: (token, user, refreshToken, expiresIn) => {
    const storedRefreshToken = refreshToken ?? localStorage.getItem('hcs_refresh_token')
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : Number(localStorage.getItem('hcs_token_expires_at')) || null

    localStorage.setItem('hcs_token', token)
    localStorage.setItem('hcs_user', JSON.stringify(user))
    if (storedRefreshToken) localStorage.setItem('hcs_refresh_token', storedRefreshToken)
    if (expiresAt) localStorage.setItem('hcs_token_expires_at', String(expiresAt))
    set({ token, refreshToken: storedRefreshToken, expiresAt, user, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('hcs_token')
    localStorage.removeItem('hcs_refresh_token')
    localStorage.removeItem('hcs_token_expires_at')
    localStorage.removeItem('hcs_user')
    set({ token: null, refreshToken: null, expiresAt: null, user: null, isAuthenticated: false })
  },
}))
