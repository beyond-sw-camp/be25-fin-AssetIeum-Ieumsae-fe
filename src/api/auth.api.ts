import api from './client'
import type {
  LoginRequest,
  LoginResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
} from '@/types'

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body),

  logout: () =>
    api.post<null>('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  changePassword: (body: PasswordChangeRequest) =>
    api.patch<PasswordChangeResponse>('/members/me/password', body),
}
