<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
      <h1 class="text-2xl font-bold text-center mb-6">자산이음</h1>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">사번</label>
          <input
            v-model="form.memberNo"
            type="text"
            placeholder="사번을 입력하세요"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
        <p v-if="errorMsg" class="text-sm text-red-500 text-center">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ memberNo: '', password: '' })
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!form.memberNo || !form.password) {
    errorMsg.value = '사번과 비밀번호를 입력해주세요.'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  try {
    await auth.login(form)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || '/')
  } catch (e: unknown) {
    errorMsg.value = (e as { message?: string })?.message || '로그인에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>
