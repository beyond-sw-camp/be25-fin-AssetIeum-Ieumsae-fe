import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api' // 💡 주석 해제!
import type { AuthUser, LoginRequest, Role } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_USER_KEY = 'authUser'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const currentRole = computed<Role | null>(() => user.value?.role ?? null)
  const isSuperAdmin = computed(() => currentRole.value === 'SUPER_ADMIN')
  const isDepartmentManager = computed(() => currentRole.value === 'DEPARTMENT_MANAGER')
  const isAssetTeam = computed(() => currentRole.value === 'ASSET_TEAM')

  /**
   * 로그인 (이제 Mock 로직은 MSW 핸들러로 이동합니다)
   */
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    try {
      // 💡 실제 API를 호출하듯이 작성합니다.
      const res = await authApi.login(credentials)
      const { accessToken: token, refreshToken, ...userInfo } = res.data

      user.value = userInfo
      accessToken.value = token

      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo))

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
      await authApi.logout() // 💡 주석 해제!
    } catch (error) {
      console.error('로그아웃 API 실패:', error)
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