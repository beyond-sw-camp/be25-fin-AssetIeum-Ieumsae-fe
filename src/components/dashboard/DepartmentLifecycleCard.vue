<template>
  <div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
    <h2 class="mb-5 text-base font-bold text-text-main">라이프 사이클 진행 현황</h2>

    <div class="grid gap-4 lg:grid-cols-[0.7fr_1.25fr_1.1fr]">
      <section class="rounded-lg border border-border bg-surface p-4">
        <h3 class="mb-4 text-base font-bold text-text-main">카테고리 필터링</h3>
        <div class="space-y-3">
          <div
            v-for="category in data.categories"
            :key="category.id"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-5 w-5 items-center justify-center rounded border"
                :class="category.checked ? 'border-primary bg-primary text-white' : 'border-border bg-surface'"
              >
                <Check v-if="category.checked" :size="14" />
              </span>
              <span class="font-semibold text-text-main">{{ category.label }}</span>
            </div>
            <span class="text-text-sub">{{ category.count }}건</span>
          </div>
        </div>
        <Button class="mt-5 w-full" variant="primary" size="sm">
          필터 적용
        </Button>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-bold text-text-main">인사 이벤트</h3>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded border border-border text-text-sub"
              aria-label="이전 이벤트"
            >
              <ChevronLeft :size="14" />
            </button>
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded border border-border text-text-sub"
              aria-label="다음 이벤트"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <div class="space-y-5">
          <div
            v-for="event in data.events"
            :key="event.id"
            class="grid grid-cols-[32px_1fr_auto_auto] items-center gap-3 text-sm"
          >
            <component :is="eventIcon(event.type)" class="text-text-main" :size="24" />
            <div>
              <p class="font-bold text-text-main">{{ event.title }}</p>
              <p class="mt-1 text-xs text-text-sub">{{ event.description }}</p>
            </div>
            <span class="text-text-sub">{{ event.date }}</span>
            <span class="font-semibold text-text-sub">{{ event.dueText }}</span>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h3 class="mb-5 text-base font-bold text-text-main">HR 이벤트 상태</h3>
        <div class="space-y-5">
          <div
            v-for="status in data.statuses"
            :key="status.id"
            class="grid grid-cols-[44px_1fr] gap-3"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="status.iconClass"
            >
              <component :is="statusIcon(status.id)" :size="20" />
            </div>
            <div>
              <p class="font-bold text-text-main">{{ status.label }}</p>
              <div class="mt-1 flex items-center gap-3 text-sm text-text-sub">
                <span>{{ status.current }}건/{{ status.total }}건</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    class="h-full rounded-full"
                    :class="status.colorClass"
                    :style="{ width: `${status.percent}%` }"
                  ></div>
                </div>
                <span>{{ status.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  MoveLeft,
  RefreshCcw,
} from 'lucide-vue-next'
import Button from '@/components/common/Button.vue'
import type { DashboardDepartmentLifecycle, DashboardLifecycleEvent } from '@/mocks/dashboard.data'

defineProps<{
  data: DashboardDepartmentLifecycle
}>()

const eventIcon = (type: DashboardLifecycleEvent['type']) => {
  if (type === 'join') return LogIn
  if (type === 'move') return MoveLeft
  return LogOut
}

const statusIcon = (id: string) => {
  if (id === 'paid') return CheckCircle2
  if (id === 'collecting') return RefreshCcw
  return Box
}
</script>
