import { create } from 'zustand'
import type { UserDto } from '@/types'

interface AuthState {
  token: string | null
  user: UserDto | null
  isAuthenticated: boolean
  setAuth: (token: string, user: UserDto) => void
  clearAuth: () => void
}

const load = <T>(key: string): T | null => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : null } catch { return null }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('hcs_token'),
  user: load<UserDto>('hcs_user'),
  isAuthenticated: !!(localStorage.getItem('hcs_token') && load('hcs_user')),

  setAuth: (token, user) => {
    localStorage.setItem('hcs_token', token)
    localStorage.setItem('hcs_user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('hcs_token')
    localStorage.removeItem('hcs_user')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
