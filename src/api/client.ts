import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse } from '@/types'
import { AUTH_EXPIRED_EVENT } from '@/utils/authSession'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  accessToken: string
}

function isPublicAuthRequest(url?: string) {
  return url === '/auth/login' || url === '/auth/reissue'
}

export class ApiError extends Error {
  status: number | null
  errorCode: string | null
  details: unknown

  constructor(message: string, options: {
    status?: number | null
    errorCode?: string | null
    details?: unknown
  } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? null
    this.errorCode = options.errorCode ?? null
    this.details = options.details
  }
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (accessToken && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken() {
  const response = await axios.post<ApiResponse<RefreshResponse>>(
    `${API_BASE_URL}/auth/reissue`,
    null,
    { withCredentials: true },
  )

  const tokens = response.data.data
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)

  return tokens.accessToken
}

function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('authUser')

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryRequestConfig | undefined
    const isUnauthorized = error.response?.status === 401
    const isForbidden = error.response?.status === 403
    const isPublicAuthEndpoint = isPublicAuthRequest(originalRequest?.url)

    if (isUnauthorized) {
      console.warn('API 401 Unauthorized 응답', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
      })
    }

    if (isForbidden) {
      console.error('API 403 Forbidden 응답', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
      })
    }

    if (isUnauthorized && originalRequest && !originalRequest._retry && !isPublicAuthEndpoint) {
      originalRequest._retry = true

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })

        const accessToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return httpClient(originalRequest)
      } catch {
        clearStoredAuth()
      }
    }

    const responseBody = error.response?.data
    const message = responseBody?.message
      ?? error.message
      ?? '서버 요청 중 오류가 발생했습니다.'

    return Promise.reject(new ApiError(message, {
      status: error.response?.status ?? null,
      errorCode: responseBody?.errorCode ?? null,
      details: responseBody,
    }))
  },
)

async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await httpClient.request<ApiResponse<T>>(config)
  return response.data
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'GET', url, params }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'PUT', url, data }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'DELETE', url }),

  upload: <T>(url: string, formData: FormData, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'POST', url, data: formData }),

  download: async (url: string, config?: AxiosRequestConfig) => {
    const response = await httpClient.get<Blob>(url, {
      ...config,
      responseType: 'blob',
    })
    return response.data
  },
}

export default api
