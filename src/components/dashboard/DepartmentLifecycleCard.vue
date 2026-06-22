<template>
  <article class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h2 class="mb-5 text-lg font-bold text-text-main">라이프 사이클 진행 현황</h2>

    <div class="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-base font-bold text-text-main">카테고리 필터링</h3>
        <div class="space-y-2">
          <label
            v-for="item in categoryItems"
            :key="item.type"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-secondary"
          >
            <input
              v-model="selectedTypes"
              type="checkbox"
              :value="item.type"
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            >
            <span class="flex-1 font-semibold text-text-main">{{ item.type }}</span>
            <span class="text-text-sub">{{ item.count }}건</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-secondary">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              :checked="isAllSelected"
              @change="handleSelectAll"
            >
            <span class="flex-1 font-semibold text-text-main">전체 선택</span>
            <span class="text-text-sub">{{ events.length }}건</span>
          </label>
        </div>
        <Button class="mt-5 w-full" @click="applyFilter">필터 적용</Button>
      </section>

      <section class="min-w-0 rounded-lg border border-border p-4">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-bold text-text-main">인사 이벤트</h3>
          <div class="flex gap-1">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-sub disabled:opacity-30"
              :disabled="eventPage === 0"
              aria-label="이전 이벤트"
              @click="eventPage -= 1"
            >
              <ChevronLeft :size="15" />
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-sub disabled:opacity-30"
              :disabled="eventPage >= eventTotalPages - 1"
              aria-label="다음 이벤트"
              @click="eventPage += 1"
            >
              <ChevronRight :size="15" />
            </button>
          </div>
        </div>

        <div v-if="pagedEvents.length" class="divide-y divide-border">
          <div
            v-for="event in pagedEvents"
            :key="event.eventId"
            class="grid gap-3 py-3 md:grid-cols-[2rem_minmax(0,1fr)_8rem_5rem] md:items-center"
          >
            <component :is="eventIcon(event.eventType)" :size="20" class="text-text-main" />
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-text-main">{{ event.memberName }} 님 {{ event.eventType }}</p>
              <p class="mt-1 truncate text-xs text-text-sub">{{ event.departmentName || '-' }}</p>
            </div>
            <p class="text-sm text-text-sub">{{ formatDate(event.eventDate) }}</p>
            <p class="text-right text-sm font-semibold text-text-sub">{{ dDayText(event) }}</p>
          </div>
        </div>
        <p v-else class="py-16 text-center text-sm text-text-sub">조건에 맞는 인사 이벤트가 없습니다.</p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-2">
      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-base font-bold text-text-main">소속 부서 통계</h3>
        <div v-if="departmentItems.length" class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div v-for="item in departmentItems" :key="item.name" class="flex justify-between text-sm">
            <span class="font-semibold text-text-main">{{ item.name }}</span>
            <span class="text-text-sub">{{ item.count }}건</span>
          </div>
        </div>
        <p v-else class="py-8 text-center text-sm text-text-sub">집계할 부서 정보가 없습니다.</p>
      </section>

      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-base font-bold text-text-main">HR 이벤트 상태</h3>
        <div class="space-y-5">
          <div v-for="item in statusItems" :key="item.label" class="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_3rem] sm:items-center">
            <div>
              <p class="text-sm font-bold text-text-main">{{ item.label }}</p>
              <p class="mt-1 text-xs text-text-sub">{{ item.count }}건/{{ item.total }}건</p>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div class="h-full rounded-full" :class="item.colorClass" :style="{ width: `${item.percentage}%` }" />
            </div>
            <span class="text-right text-sm font-semibold text-text-sub">{{ item.percentage }}%</span>
          </div>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, LogIn, LogOut, MoveRight, Pause, RotateCcw } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import type { HrLifecycleEvent } from '@/types'

const EVENT_TYPES = ['입사', '퇴사', '부서이동', '휴직', '복직'] as const
const PAGE_SIZE = 5

const props = defineProps<{
  events: HrLifecycleEvent[]
}>()

const selectedTypes = ref<string[]>([...EVENT_TYPES])
const appliedTypes = ref<string[]>([...EVENT_TYPES])
const eventPage = ref(0)

const categoryItems = computed(() => EVENT_TYPES.map((type) => ({
  type,
  count: props.events.filter((event) => event.eventType === type).length,
})))
const isAllSelected = computed(() => selectedTypes.value.length === EVENT_TYPES.length)
const filteredEvents = computed(() => props.events.filter((event) => appliedTypes.value.includes(event.eventType)))
const eventTotalPages = computed(() => Math.max(1, Math.ceil(filteredEvents.value.length / PAGE_SIZE)))
const pagedEvents = computed(() => {
  const start = eventPage.value * PAGE_SIZE
  return filteredEvents.value.slice(start, start + PAGE_SIZE)
})
const departmentItems = computed(() => {
  const counts = new Map<string, number>()
  filteredEvents.value.forEach((event) => {
    const departmentName = event.departmentName || '부서 미지정'
    counts.set(departmentName, (counts.get(departmentName) ?? 0) + 1)
  })
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
})

const statusItems = computed(() => {
  const onboarding = filteredEvents.value.filter((event) => event.eventType === '입사')
  const offboarding = filteredEvents.value.filter((event) => event.eventType === '퇴사')
  return [
    createStatusItem('지급 완료', onboarding, ['지급완료', '지급 완료'], 'bg-success'),
    createStatusItem('회수 중', offboarding, ['회수중', '회수 중'], 'bg-primary'),
    createStatusItem('반품', offboarding, ['반납', '반품'], 'bg-warning'),
  ]
})

watch(filteredEvents, () => {
  if (eventPage.value >= eventTotalPages.value) eventPage.value = eventTotalPages.value - 1
})

function createStatusItem(
  label: string,
  source: HrLifecycleEvent[],
  statuses: string[],
  colorClass: string,
) {
  const count = source.filter((event) => statuses.includes(event.status.replaceAll(' ', '')) || statuses.includes(event.status)).length
  const total = source.length
  return { label, count, total, percentage: total ? Math.round((count / total) * 100) : 0, colorClass }
}

function handleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  selectedTypes.value = checked ? [...EVENT_TYPES] : []
}

function applyFilter() {
  appliedTypes.value = [...selectedTypes.value]
  eventPage.value = 0
}

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
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function dDayText(event: HrLifecycleEvent) {
  const value = event.dDay ?? event.dday
  if (value === null || value === undefined) return '-'
  if (value === 0) return 'D-Day'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}
</script>
