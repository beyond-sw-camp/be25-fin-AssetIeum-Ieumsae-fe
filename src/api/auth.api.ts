import api from './client'
import type { LoginRequest, LoginResponse, PasswordChangeRequest } from '@/types'

export const authApi = {
  /** 로그인 */
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body),

  /** 로그아웃 */
  logout: () =>
    api.post<null>('/auth/logout'),

  /** 토큰 갱신 */
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  /** 비밀번호 변경 */
  changePassword: (body: PasswordChangeRequest) =>
    api.patch<{ memberId: number; changedAt: string }>('/members/me/password', body),
}
