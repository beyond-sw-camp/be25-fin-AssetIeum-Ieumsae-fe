import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { AuthUser, LoginRequest, Role } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_USER_KEY = 'authUser'

// =====================================================
// Auth Store - 인증 / 사용자 정보 전역 상태
// =====================================================

export const useAuthStore = defineStore('auth', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  /** 로그인된 사용자 정보 */
  const user = ref<AuthUser | null>(null)

  /** Access Token */
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))

  /** 로딩 상태 */
  const isLoading = ref(false)

  // ─── Getters ─────────────────────────────────────────────────────────────────

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  const currentRole = computed<Role | null>(() => user.value?.role ?? null)

  /** 최고 관리자 여부 */
  const isSuperAdmin = computed(() => currentRole.value === 'SUPER_ADMIN')

  /** 부서 책임자 여부 */
  const isDepartmentManager = computed(() => currentRole.value === 'DEPARTMENT_MANAGER')

  /** 구매자산팀 여부 */
  const isAssetTeam = computed(() => currentRole.value === 'ASSET_TEAM')

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    try {
      const res = await authApi.login(credentials)
      const { accessToken: token, refreshToken, ...userInfo } = res.data

      user.value = userInfo
      accessToken.value = token
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo))

      return res
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
    }
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }

  /** 페이지 새로고침 시 사용자 정보 복원 */
  async function restoreSession() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (!token || !storedUser) {
      clearAuth()
      return false
    }

    try {
      user.value = JSON.parse(storedUser) as AuthUser
      accessToken.value = token
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
    isAuthenticated,
    currentRole,
    isSuperAdmin,
    isDepartmentManager,
    isAssetTeam,
    login,
    logout,
    clearAuth,
    restoreSession,
  }
})
