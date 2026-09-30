import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { AuthResponse, UserDto } from '@/types'

const apiClient = axios.create({ baseURL: '/api' })

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function redirectToLogin() {
  useAuthStore.getState().clearAuth()
  const loginPath = window.location.pathname.startsWith('/office') ? '/office/login' : '/customer/login'
  window.location.replace(loginPath)
}

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('hcs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const status = err.response?.status
    const original = err.config as RetriableRequestConfig | undefined
    const url = original?.url ?? ''
    const isAuthRequest = url.startsWith('/auth/login') || url.startsWith('/auth/register') || url.startsWith('/auth/refresh')

    if ((status === 401 || status === 403) && original && !original._retry && !isAuthRequest) {
      original._retry = true
      const refreshToken = localStorage.getItem('hcs_refresh_token')

      if (refreshToken) {
        try {
          const refresh = await axios.post<AuthResponse>('/auth/refresh', undefined, {
            baseURL: '/api',
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
          const currentUser = useAuthStore.getState().user
          const user: UserDto = {
            id: refresh.data.userId,
            email: refresh.data.email,
            name: refresh.data.fullName,
            role: refresh.data.role,
            status: currentUser?.status ?? 'ACTIVE',
            createdAt: currentUser?.createdAt ?? new Date().toISOString(),
            organization: currentUser?.organization,
            country: currentUser?.country,
            phone: currentUser?.phone,
          }

          useAuthStore.getState().setAuth(
            refresh.data.accessToken,
            user,
            refresh.data.refreshToken,
            refresh.data.expiresIn,
          )
          original.headers.Authorization = `Bearer ${refresh.data.accessToken}`
          return apiClient(original)
        } catch {
          redirectToLogin()
        }
      } else {
        redirectToLogin()
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient
