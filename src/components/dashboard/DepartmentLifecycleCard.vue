<template>
  <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h2 class="mb-5 text-base font-bold text-text-main">HR 라이프 사이클 현황</h2>

    <div class="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-sm font-bold text-text-main">인사 이벤트</h3>
        <div v-if="events.length" class="space-y-3">
          <div
            v-for="event in events"
            :key="event.eventId"
            class="flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-3"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <component :is="eventIcon(event.eventType)" :size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-text-main">
                {{ event.eventType }} · {{ event.memberName }}
              </p>
              <p class="mt-1 truncate text-xs text-text-sub">
                {{ event.departmentName }} · {{ formatDate(event.eventDate) }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-xs font-semibold text-primary">{{ dDayText(event) }}</p>
              <p class="mt-1 text-xs text-text-sub">{{ event.status }}</p>
            </div>
          </div>
        </div>
        <p v-else class="py-10 text-center text-sm text-text-sub">인사 이벤트가 없습니다.</p>
      </section>

      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-sm font-bold text-text-main">이벤트 상태</h3>
        <div class="space-y-4">
          <div v-for="item in statusItems" :key="item.label">
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="font-semibold text-text-main">{{ item.label }}</span>
              <span class="text-text-sub">{{ item.count }}건 · {{ item.percentage }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div class="h-full rounded-full" :class="item.colorClass" :style="{ width: `${item.percentage}%` }" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LogIn, LogOut, MoveRight, Pause, RotateCcw } from 'lucide-vue-next'

import type { HrEventStatistics, HrLifecycleEvent } from '@/types'

const props = defineProps<{
  events: HrLifecycleEvent[]
  statistics: HrEventStatistics
}>()

const statusItems = computed(() => [
  { label: '대기', count: props.statistics.pendingCount, percentage: props.statistics.pendingPercentage, colorClass: 'bg-warning' },
  { label: '진행 중', count: props.statistics.inProgressCount, percentage: props.statistics.inProgressPercentage, colorClass: 'bg-primary' },
  { label: '완료', count: props.statistics.completedCount, percentage: props.statistics.completedPercentage, colorClass: 'bg-success' },
  { label: '취소', count: props.statistics.cancelledCount, percentage: props.statistics.cancelledPercentage, colorClass: 'bg-danger' },
])

function eventIcon(type: string) {
  if (type === '입사') return LogIn
  if (type === '퇴사') return LogOut
  if (type === '부서이동') return MoveRight
  if (type === '휴직') return Pause
  return RotateCcw
}

function formatDate(value: string) {
  if (!value) return '-'
  
  const date = new Date(value)
  
  if (isNaN(date.getTime())) {
    console.warn(`[formatDate] 유효하지 않은 날짜 데이터가 들어왔습니다: "${value}"`)
    return '-'
  }
  
  return new Intl.DateTimeFormat('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(date)
}

function dDayText(event: HrLifecycleEvent) {
  const value = event.dDay ?? event.dday ?? 0
  if (value === 0) return 'D-DAY'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}
</script>
