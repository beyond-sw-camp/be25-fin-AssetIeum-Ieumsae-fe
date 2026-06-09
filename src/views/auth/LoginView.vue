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
  return redirect?.startsWith('/') && redirect !== '/login' ? redirect : '/'
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
</script>

<template>
  <AuthLayout title="로그인">
    <form class="space-y-6" novalidate @submit.prevent="handleLogin">
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
        size="lg"
        class="w-full"
        :loading="auth.isLoading"
      >
        {{ auth.isLoading ? '로그인 중...' : '로그인' }}
      </Button>
    </form>
  </AuthLayout>
</template>
