<template>
  <main class="mx-auto flex h-screen min-h-screen w-full max-w-md flex-col bg-background text-text-main md:border-x md:border-border">
    <section class="flex flex-1 flex-col px-5 pb-6 pt-10">
      <div class="mb-10">
        <p class="text-sm font-extrabold text-primary">
          자산이음
        </p>
        <h1 class="mt-4 text-3xl font-black leading-tight text-text-main">
          모바일<br />
          자산 검수
        </h1>
        <p class="mt-4 text-sm leading-relaxed text-text-sub">
          로그인 후 배정된 전수조사 자산을 확인하고 QR로 검수 결과를 등록하세요.
        </p>
      </div>

      <div
        v-if="isDebugAuth"
        class="mb-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-text-sub"
      >
        <p class="font-bold text-text-main">Auth Debug</p>
        <p class="mt-1">isAuthenticated: {{ auth.isAuthenticated }}</p>
        <p>currentRole: {{ auth.currentRole || '-' }}</p>
        <p>user.role: {{ auth.user?.role || '-' }}</p>
        <p>storedRole: {{ storedRole || '-' }}</p>
        <p>lastRejectedRole: {{ lastRejectedRole || '-' }}</p>
      </div>

      <form class="mt-auto space-y-4" novalidate @submit.prevent="handleLogin">
        <div
          v-if="previousUserName"
          class="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-sub"
        >
          <p class="font-semibold text-text-main">
            {{ previousUserName }} 계정의 로그인 상태를 정리했습니다.
          </p>
          <p class="mt-1 text-xs leading-relaxed">
            모바일 자산 검수는 사원 또는 구매자산팀 계정으로 이용할 수 있습니다. 아래에서 다시 로그인해주세요.
          </p>
        </div>

        <Input
          id="mobile-company-code"
          v-model="form.companyCode"
          label="회사 코드"
          placeholder="회사 코드를 입력하세요"
          autocomplete="organization"
          required
          :disabled="auth.isLoading"
          :error="Boolean(errors.companyCode)"
          :error-message="errors.companyCode"
        />

        <Input
          id="mobile-member-no"
          v-model="form.memberNo"
          label="사번"
          placeholder="사번을 입력하세요"
          autocomplete="username"
          required
          :disabled="auth.isLoading"
          :error="Boolean(errors.memberNo)"
          :error-message="errors.memberNo"
        />

        <Input
          id="mobile-password"
          v-model="form.password"
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          autocomplete="current-password"
          required
          :disabled="auth.isLoading"
          :error="Boolean(errors.password)"
          :error-message="errors.password"
        />

        <p
          v-if="errorMessage"
          class="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <Button
          type="submit"
          size="lg"
          class="w-full"
          :loading="auth.isLoading"
        >
          {{ auth.isLoading ? '로그인 중...' : '로그인' }}
        </Button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import { useAuthStore } from '@/stores'

interface LoginFormErrors {
  companyCode: string
  memberNo: string
  password: string
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  companyCode: '',
  memberNo: '',
  password: '',
})

const errors = reactive<LoginFormErrors>({
  companyCode: '',
  memberNo: '',
  password: '',
})

const errorMessage = ref('')
const previousUserName = ref('')
const lastRejectedRole = ref('')
const isDebugAuth = computed(() => route.query.debugAuth === '1')
const storedRole = computed(() => getStoredRole())

function canUseMobileInspectionRole(role: string | null | undefined) {
  return role === 'EMPLOYEE' || role === 'ASSET_TEAM'
}

function getStoredRole() {
  try {
    const authUser = localStorage.getItem('authUser')
    if (!authUser) return ''

    const parsedUser = JSON.parse(authUser) as { role?: unknown }
    return typeof parsedUser.role === 'string' ? parsedUser.role : ''
  } catch {
    return ''
  }
}

function validateForm() {
  errors.companyCode = form.companyCode.trim() ? '' : '회사 코드를 입력해주세요.'
  errors.memberNo = form.memberNo.trim() ? '' : '사번을 입력해주세요.'
  errors.password = form.password ? '' : '비밀번호를 입력해주세요.'

  return !errors.companyCode && !errors.memberNo && !errors.password
}

function getRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null

  if (redirect?.startsWith('/mobile') && redirect !== '/mobile/login') {
    return redirect
  }

  return '/mobile/inspections'
}

async function handleLogin() {
  errorMessage.value = ''

  if (!validateForm()) return

  try {
    await auth.login({
      companyCode: form.companyCode.trim(),
      memberNo: form.memberNo.trim(),
      password: form.password,
    })

    if (isDebugAuth.value) {
      lastRejectedRole.value = auth.currentRole ?? 'null'
      sessionStorage.setItem('mobileAuthDebugLastRole', lastRejectedRole.value)
    }

    if (!canUseMobileInspectionRole(auth.currentRole)) {
      errorMessage.value = '모바일 자산 검수는 사원 또는 구매자산팀 계정으로 이용할 수 있습니다.'
      previousUserName.value = auth.user?.name ?? ''
      auth.clearAuth()
      return
    }

    await router.replace(
      isDebugAuth.value
        ? { path: getRedirectPath(), query: { debugAuth: '1' } }
        : getRedirectPath(),
    )
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
}

onMounted(() => {
  lastRejectedRole.value = sessionStorage.getItem('mobileAuthDebugLastRole') ?? ''

  if (auth.user && !canUseMobileInspectionRole(auth.currentRole)) {
    lastRejectedRole.value = auth.currentRole ?? 'null'
    sessionStorage.setItem('mobileAuthDebugLastRole', lastRejectedRole.value)
    previousUserName.value = auth.user.name
    auth.clearAuth()
  }
})
</script>
