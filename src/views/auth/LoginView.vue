<template>
  <AuthLayout title="로그인">
    <form class="space-y-4" novalidate @submit.prevent="handleLogin">
      <p
        v-if="successMessage"
        class="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
        role="status"
      >
        {{ successMessage }}
      </p>

      <Input
        id="company-code"
        v-model="form.companyCode"
        label="회사 코드"
        placeholder="회사 코드를 입력하세요"
        autocomplete="organization"
        required
        :show-required-indicator="false"
        :disabled="auth.isLoading"
        :error="Boolean(errors.companyCode)"
        :error-message="errors.companyCode"
      />

      <Input
        id="member-no"
        v-model="form.memberNo"
        label="사번"
        placeholder="사번을 입력하세요"
        autocomplete="username"
        required
        :show-required-indicator="false"
        :disabled="auth.isLoading"
        :error="Boolean(errors.memberNo)"
        :error-message="errors.memberNo"
      />

      <Input
        id="password"
        v-model="form.password"
        type="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        autocomplete="current-password"
        required
        :show-required-indicator="false"
        :disabled="auth.isLoading"
        :error="Boolean(errors.password)"
        :error-message="errors.password"
      />

      <p
        v-if="errorMessage"
        class="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <Button
        type="submit"
        size="m"
        class="mt-5 w-full"
        :loading="auth.isLoading"
      >
        {{ auth.isLoading ? '로그인 중...' : '로그인' }}
      </Button>
    </form>

    <template #below-card>
      <section class="mt-3 rounded-2xl bg-surface px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="text-xs font-bold text-text-main">데모 빠른 로그인</p>
          <p class="text-[11px] font-medium text-text-sub">비밀번호 자동 입력</p>
        </div>

        <div class="grid gap-2 lg:grid-cols-[0.9fr_1fr_1fr]">
          <div class="rounded-lg border border-border bg-surface-secondary/60 p-2">
            <p class="mb-1.5 text-[11px] font-bold text-text-sub">공용 계정</p>
            <div class="grid gap-1.5">
              <button
                v-for="account in commonDemoAccounts"
                :key="account.memberNo"
                type="button"
                :disabled="auth.isLoading"
                class="min-h-10 min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-center text-xs font-semibold leading-4 text-text-main transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleDemoLogin(account)"
              >
                <span class="block whitespace-normal break-keep">{{ account.label }}</span>
              </button>
            </div>
          </div>

          <div
            v-for="group in testerDemoAccountGroups"
            :key="group.label"
            class="rounded-lg border border-border bg-surface-secondary/60 p-2"
          >
            <p class="mb-1.5 text-[11px] font-bold text-text-sub">{{ group.label }}</p>
            <div class="grid gap-1.5">
              <button
                v-for="account in group.accounts"
                :key="account.memberNo"
                type="button"
                :disabled="auth.isLoading"
                class="min-h-10 min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-center text-xs font-semibold leading-4 text-text-main transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                @click="handleDemoLogin(account)"
              >
                <span class="block whitespace-normal break-keep">{{ account.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import { useAuthStore } from '@/stores'

interface LoginFormErrors {
  companyCode: string
  memberNo: string
  password: string
}

interface DemoAccount {
  label: string
  companyCode: string
  memberNo: string
}

interface DemoAccountGroup {
  label: string
  accounts: DemoAccount[]
}

const commonDemoAccounts: DemoAccount[] = [
  { label: '시스템 관리자', companyCode: 'assetieum', memberNo: 'superadmin' },
  { label: '최고 관리자', companyCode: 'hanwha', memberNo: 'admin' },
  { label: '구매자산팀장', companyCode: 'hanwha', memberNo: 'EMP0001' },
]

const testerDemoAccountGroups: DemoAccountGroup[] = [
  {
    label: '테스터 1',
    accounts: [
      { label: '구매자산팀1', companyCode: 'hanwha', memberNo: 'EMP0002' },
      { label: '부서책임자1', companyCode: 'hanwha', memberNo: 'EMP0004' },
      { label: '사원1', companyCode: 'hanwha', memberNo: 'EMP0005' },
    ],
  },
  {
    label: '테스터 2',
    accounts: [
      { label: '구매자산팀2', companyCode: 'hanwha', memberNo: 'EMP0012' },
      { label: '부서책임자2', companyCode: 'hanwha', memberNo: 'EMP0014' },
      { label: '사원2', companyCode: 'hanwha', memberNo: 'EMP0015' },
    ],
  },
]

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
const successMessage = computed(() =>
  route.query.passwordChanged === 'true'
    ? '비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.'
    : '',
)

function validateForm() {
  errors.companyCode = form.companyCode.trim() ? '' : '회사 코드를 입력해주세요.'
  errors.memberNo = form.memberNo.trim() ? '' : '사번을 입력해주세요.'
  errors.password = form.password ? '' : '비밀번호를 입력해주세요.'

  return !errors.companyCode && !errors.memberNo && !errors.password
}

function getRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  if (redirect?.startsWith('/') && redirect !== '/login') return redirect
  return isMobileViewport() ? '/mobile/inspections' : '/'
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
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

    await router.replace(getRedirectPath())
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
}

async function handleDemoLogin(account: DemoAccount) {
  form.companyCode = account.companyCode
  form.memberNo = account.memberNo
  form.password = account.memberNo

  await handleLogin()
}
</script>
