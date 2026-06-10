<script setup lang="ts">
import { KeyRound } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import Button from '@/components/common/Button.vue'

const router = useRouter()
</script>

<template>
  <div class="page-container h-full overflow-y-auto">
    <div class="page-header">
      <h1 class="page-title">설정</h1>
      <p class="page-subtitle">계정과 서비스 이용 설정을 관리합니다.</p>
    </div>

    <section class="card mx-0 max-w-3xl p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary "
            aria-hidden="true" 
          >
            <div class="p-3">
              <KeyRound :size="20" />
            </div>  
          </div>
          <div>
            <h2 class="text-base font-semibold text-text-main">비밀번호</h2>
            <p class="mt-1 text-sm text-text-sub">
              계정 보안을 위해 비밀번호를 변경합니다.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          @click="router.push({ name: 'PasswordChange' })"
        >
          비밀번호 변경
        </Button>
      </div>
    </section>
  </div>
</template>
