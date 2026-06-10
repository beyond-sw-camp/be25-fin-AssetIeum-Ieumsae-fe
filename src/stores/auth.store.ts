import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api'
import type { AuthUser, LoginRequest, PasswordChangeRequest, Role } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_USER_KEY = 'authUser'

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
    isChangingPassword,
    isAuthenticated,
    currentRole,
    isSuperAdmin,
    isAdmin,
    isDepartmentManager,
    isAssetTeam,
    login,
    logout,
    changePassword,
    clearAuth,
    restoreSession,
  }
})
