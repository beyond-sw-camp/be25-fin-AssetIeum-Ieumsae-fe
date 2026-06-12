import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api'
import type { AuthUser, LoginRequest, PasswordChangeRequest, Role } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const AUTH_USER_KEY = 'authUser'

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = decodeURIComponent(
      Array.from(atob(normalizedPayload), (char) => (
        `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
      )).join(''),
    )

    return JSON.parse(decodedPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

function stringClaim(payload: Record<string, unknown> | null, keys: string[]) {
  if (!payload) return undefined

  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value) return value
  }

  return undefined
}

function withTokenClaims(userInfo: AuthUser, token: string): AuthUser {
  const payload = decodeTokenPayload(token)

  return {
    ...userInfo,
    companyId: userInfo.companyId ?? stringClaim(payload, ['companyId', 'company_id']),
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
  const isLoading = ref(false)
  const isChangingPassword = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const currentRole = computed<Role | null>(() => user.value?.role ?? null)
  const isSuperAdmin = computed(() => currentRole.value === 'SUPER_ADMIN')
  const isAdmin = computed(() => currentRole.value === 'ADMIN')
  const isDepartmentManager = computed(() => currentRole.value === 'DEPARTMENT_MANAGER')
  const isAssetTeam = computed(() => currentRole.value === 'ASSET_TEAM')
  const isAssetManager = computed(() => currentRole.value === 'ASSET_MANAGER')

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    try {
      const res = await authApi.login(credentials)
      const { accessToken: token, refreshToken: _refreshToken, ...userInfo } = res.data
      void _refreshToken
      const normalizedUserInfo = withTokenClaims(userInfo, token)

      user.value = normalizedUserInfo
      accessToken.value = token

      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      localStorage.removeItem('refreshToken')
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUserInfo))

      return true
    } catch (error) {
      console.error('로그인 실패:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('로그아웃 API 실패:', error)
    } finally {
      clearAuth()
    }
  }

  async function changePassword(body: PasswordChangeRequest) {
    isChangingPassword.value = true
    try {
      await authApi.changePassword(body)
      clearAuth()
    } finally {
      isChangingPassword.value = false
    }
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem(AUTH_USER_KEY)
  }

  async function restoreSession() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (!token || !storedUser) {
      clearAuth()
      return false
    }

    try {
      user.value = withTokenClaims(JSON.parse(storedUser) as AuthUser, token)
      accessToken.value = token
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.value))
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  return {
    user,
    accessToken,
    isLoading,
    isChangingPassword,
    isAuthenticated,
    currentRole,
    isSuperAdmin,
    isAdmin,
    isDepartmentManager,
    isAssetTeam,
    isAssetManager,
    login,
    logout,
    changePassword,
    clearAuth,
    restoreSession,
  }
})
