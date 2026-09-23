import axios from 'axios'

const apiClient = axios.create({ baseURL: '/api' })

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('hcs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
)

export default apiClient
