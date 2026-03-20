// web/lib/api.ts
import axios from 'axios'
import { clearAuthToken } from './auth'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
