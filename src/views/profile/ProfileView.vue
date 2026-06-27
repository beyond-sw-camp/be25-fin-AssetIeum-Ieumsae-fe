<template>
  <div class="page-container space-y-5">
    <div class="page-header">
      <div>
        <p class="page-subtitle mb-1">
          계정
        </p>
        <h1 class="page-title">내 정보</h1>
      </div>
    </div>

    <section class="card border border-border bg-surface p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-xl font-bold text-text-main">
              {{ profile.name }}
            </h2>
          </div>
        </div>
      </div>

      <dl class="mt-6 divide-y divide-border border-t border-border">
        <div
          v-for="item in profileItems"
          :key="item.label"
          class="grid gap-2 py-4 sm:grid-cols-[180px_1fr]"
        >
          <dt class="flex items-center gap-2 text-sm font-semibold text-text-muted">
            <component :is="item.icon" :size="16" />
            {{ item.label }}
          </dt>
          <dd class="wrap-break-word text-sm font-bold text-text-main sm:text-right">
            {{ item.value }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IdCard,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'

import { useAuthStore } from '@/stores'
import { ROLE_LABEL } from '@/utils/labels'

const authStore = useAuthStore()

const userRecord = computed(() => (
  authStore.user ? authStore.user as unknown as Record<string, unknown> : null
))

const profile = computed(() => {
  const user = authStore.user
  const record = userRecord.value
  const company = toRecord(record?.company)

  return {
    name: textValue(user?.name),
    memberNo: textValue(user?.memberNo),
    departmentName: textValue(user?.departmentName),
    company: firstText(
      record?.companyName,
      company?.companyName,
      company?.name,
      record?.companyCode,
      company?.companyCode,
      company?.code,
    ),
    roleLabel: user?.role ? ROLE_LABEL[user.role] : '-',
    email: textValue(user?.email),
  }
})

const userInitial = computed(() => {
  const name = profile.value.name
  return name === '-' ? '?' : name.slice(0, 1)
})

const profileItems = computed(() => [
  { label: '사용자 이름(사번)', value: `${profile.value.name} (${profile.value.memberNo})`, icon: IdCard },
  { label: '부서', value: profile.value.departmentName, icon: Users },
  { label: '권한', value: profile.value.roleLabel, icon: ShieldCheck },
  { label: '이메일', value: profile.value.email, icon: Mail },
])

function textValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '-'
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => (
    typeof value === 'string' && value.trim().length > 0
  ))?.trim() ?? '-'
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}
</script>
