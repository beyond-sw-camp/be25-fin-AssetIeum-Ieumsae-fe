<template>
  <div class="page-container h-full overflow-y-auto">
    <div class="page-header">
      <h1 class="page-title">비밀번호 변경</h1>
      <p class="page-subtitle">
        현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
      </p>
    </div>

    <section class="card mx-0 p-6 sm:p-8">
      <form class="space-y-6" novalidate @submit.prevent="handlePasswordChange">
        <Input
          id="current-password"
          v-model="form.currentPassword"
          type="password"
          label="기존 비밀번호"
          placeholder="기존 비밀번호를 입력하세요"
          autocomplete="current-password"
          required
          :disabled="auth.isChangingPassword"
          :error="Boolean(errors.currentPassword)"
          :error-message="errors.currentPassword"
        />

        <Input
          id="new-password"
          v-model="form.newPassword"
          type="password"
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          autocomplete="new-password"
          required
          :disabled="auth.isChangingPassword"
          :error="Boolean(errors.newPassword)"
          :error-message="errors.newPassword"
        />

        <Input
          id="new-password-confirm"
          v-model="form.newPasswordConfirm"
          type="password"
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 다시 입력하세요"
          autocomplete="new-password"
          required
          :disabled="auth.isChangingPassword"
          :error="Boolean(errors.newPasswordConfirm)"
          :error-message="errors.newPasswordConfirm"
        />

        <p
          v-if="errorMessage"
          class="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            :disabled="auth.isChangingPassword"
            @click="router.push({ name: 'Settings' })"
          >
            취소
          </Button>
          <Button
            type="submit"
            :loading="auth.isChangingPassword"
          >
            {{ auth.isChangingPassword ? '변경 중...' : '비밀번호 변경' }}
          </Button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import { getApiErrorMessage } from '@/utils/apiError'

interface PasswordChangeFormErrors {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

const auth = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
})

const errors = reactive<PasswordChangeFormErrors>({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
})

const errorMessage = ref('')

function validateForm() {
  errors.currentPassword = form.currentPassword
    ? ''
    : '기존 비밀번호를 입력해주세요.'
  errors.newPassword = form.newPassword
    ? ''
    : '새 비밀번호를 입력해주세요.'
  errors.newPasswordConfirm = form.newPasswordConfirm
    ? ''
    : '새 비밀번호 확인을 입력해주세요.'

  if (form.newPassword && form.currentPassword === form.newPassword) {
    errors.newPassword = '새 비밀번호는 기존 비밀번호와 달라야 합니다.'
  }

  if (form.newPasswordConfirm && form.newPassword !== form.newPasswordConfirm) {
    errors.newPasswordConfirm = '새 비밀번호가 일치하지 않습니다.'
  }

  return !errors.currentPassword && !errors.newPassword && !errors.newPasswordConfirm
}

async function handlePasswordChange() {
  errorMessage.value = ''

  if (!validateForm()) return

  try {
    await auth.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    notificationStore.success('비밀번호가 변경되었습니다.', '새 비밀번호로 다시 로그인해주세요.')
    await router.replace({
      name: 'Login',
      query: { passwordChanged: 'true' },
    })
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, '비밀번호 변경에 실패했습니다.')
    notificationStore.error('비밀번호 변경 실패', errorMessage.value)
  }
}
</script>
