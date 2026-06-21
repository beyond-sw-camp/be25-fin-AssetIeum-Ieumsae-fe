import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api'
import type { AuthUser, LoginRequest, PasswordChangeRequest, Role } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const AUTH_USER_KEY = 'authUser'
const VALID_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'DEPARTMENT_MANAGER',
  'ASSET_TEAM',
  'ASSET_MANAGER',
  'EMPLOYEE',
]

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

function roleClaim(payload: Record<string, unknown> | null) {
  if (!payload) return undefined

  for (const key of ['role', 'authority', 'auth']) {
    const value = payload[key]
    if (typeof value === 'string' && value) return value
  }

  for (const key of ['roles', 'authorities']) {
    const value = payload[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item) return item

        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          if (typeof record.authority === 'string' && record.authority) return record.authority
          if (typeof record.role === 'string' && record.role) return record.role
        }
      }
    }
  }

  return undefined
}

function normalizeRole(role: unknown): Role | null {
  const normalizedRole = typeof role === 'string'
    ? role.replace(/^ROLE_/, '').trim().toUpperCase()
    : null

  return VALID_ROLES.find((roleValue) => roleValue === normalizedRole) ?? null
}

function withTokenClaims(userInfo: AuthUser, token: string): AuthUser | null {
  const payload = decodeTokenPayload(token)
  const role = normalizeRole(roleClaim(payload)) ?? normalizeRole(userInfo.role)

  if (!role) return null

  return {
    ...userInfo,
    role,
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
      if (!normalizedUserInfo) {
        throw new Error('사용자 권한 정보를 확인할 수 없습니다.')
      }

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
      const restoredUser = withTokenClaims(JSON.parse(storedUser) as AuthUser, token)
      if (!restoredUser) {
        clearAuth()
        return false
      }

      user.value = restoredUser
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
