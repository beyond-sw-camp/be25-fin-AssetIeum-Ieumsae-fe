<template>
  <article class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-text-main">라이프 사이클 진행 현황</h2>
        <p class="mt-1 text-xs text-text-sub">예정된 HR 이벤트와 처리 상태를 기준으로 진행 상황을 확인합니다.</p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs font-semibold text-text-sub">
        <span
          v-for="item in summaryItems"
          :key="item.label"
          class="rounded-full px-2.5 py-1"
          :class="item.class"
        >
          {{ item.label }} {{ item.count }}건
        </span>
      </div>
    </div>

    <div
      :class="[
        'grid gap-4',
        departmentManager
          ? 'xl:grid-cols-[18rem_minmax(0,1fr)_minmax(20rem,0.8fr)]'
          : 'xl:grid-cols-[18rem_minmax(0,1fr)]',
      ]"
    >
      <section class="rounded-lg border border-border p-4">
        <h3 class="mb-4 text-base font-bold text-text-main">카테고리 필터링</h3>
        <div class="grid gap-2">
          <Button
            v-for="item in categoryItems"
            :key="item.type"
            :variant="selectedCategory === item.type ? 'secondary' : 'outline'"
            size="md"
            class="w-full justify-between text-sm!"
            @click="selectCategory(item.type)"
          >
            <span>{{ item.type }}</span>
            <span>{{ item.count }}건</span>
          </Button>
        </div>
        <div class="mt-4 rounded-lg bg-surface-secondary px-3 py-2 text-xs leading-5 text-text-sub">
          완료·취소된 지난 이벤트는 기본 목록에서 접어둡니다.
        </div>
      </section>

      <section class="min-w-0 rounded-lg border border-border p-4">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-base font-bold text-text-main">인사 이벤트</h3>
            <p class="mt-1 text-xs text-text-sub">
              {{ showPastEvents ? '지난 이벤트까지 함께 표시합니다.' : '진행이 필요한 이벤트를 먼저 표시합니다.' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="pastFinalEvents.length > 0"
              variant="outline"
              size="sm"
              class="h-8!"
              @click="togglePastEvents"
            >
              {{ showPastEvents ? '지난 이벤트 숨기기' : `지난 이벤트 ${pastFinalEvents.length}건 보기` }}
            </Button>
            <Pagination
              :current-page="eventPage"
              :total-pages="eventTotalPages"
              @change="eventPage = $event"
            />
          </div>
        </div>

        <div v-if="pagedEvents.length" class="divide-y divide-border">
          <div
            v-for="event in pagedEvents"
            :key="event.eventId"
            :class="[
              'grid gap-3 py-3 md:items-center',
              isCompletedPastEvent(event) ? 'opacity-60' : '',
              departmentManager
                ? 'md:grid-cols-[2rem_minmax(0,1fr)_8rem_5rem]'
                : 'md:grid-cols-[2rem_minmax(0,1fr)_7rem_8rem_5rem]',
            ]"
          >
            <component :is="eventIcon(event.eventType)" :size="20" class="text-text-main" />
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-text-main">{{ event.memberName }} 님 {{ event.eventType }}</p>
              <p class="mt-1 truncate text-xs text-text-sub">{{ event.departmentName || '-' }}</p>
            </div>
            <span v-if="!departmentManager" :class="eventStatusClass(event.status)">
              {{ event.status }}
            </span>
            <p class="text-sm text-text-sub">{{ formatDate(event.eventDate) }}</p>
            <p class="text-right text-sm font-semibold" :class="dDayTextClass(event)">
              {{ dDayText(event) }}
            </p>
          </div>
        </div>
        <p v-else class="py-16 text-center text-sm text-text-sub">조건에 맞는 인사 이벤트가 없습니다.</p>
      </section>

      <section v-if="departmentManager" class="rounded-lg border border-border p-5">
        <h3 class="mb-6 text-base font-bold text-text-main">HR 이벤트 상태</h3>
        <div class="space-y-6">
          <div
            v-for="item in statusItems"
            :key="item.label"
            class="grid gap-3 sm:grid-cols-[6rem_minmax(0,1fr)_3rem] sm:items-center"
          >
            <div>
              <p class="text-sm font-bold text-text-main">{{ item.label }}</p>
              <p class="mt-1 text-xs text-text-sub">{{ item.count }}건/{{ item.total }}건</p>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div class="dashboard-bar-fill h-full rounded-full" :class="item.colorClass" :style="{ width: `${item.percentage}%` }" />
            </div>
            <span class="text-right text-sm font-semibold text-text-sub">{{ item.percentage }}%</span>
          </div>
        </div>
      </section>
    </div>

    <div v-if="!departmentManager" class="mt-4 grid gap-4 xl:grid-cols-2">
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
              <div class="dashboard-bar-fill h-full rounded-full" :class="item.colorClass" :style="{ width: `${item.percentage}%` }" />
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
import { LogIn, LogOut, MoveRight } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Pagination from '@/components/common/Pagination.vue'
import type { HrEventStatistics, HrLifecycleEvent } from '@/types'

const EVENT_TYPES = ['입사', '퇴사', '부서이동'] as const
const CATEGORY_TYPES = ['전체', ...EVENT_TYPES] as const
const PAGE_SIZE = 5
type CategoryType = (typeof CATEGORY_TYPES)[number]

const props = defineProps<{
  events: HrLifecycleEvent[]
  statistics: HrEventStatistics
  departmentManager?: boolean
}>()

const selectedCategory = ref<CategoryType>('전체')
const showPastEvents = ref(false)
const eventPage = ref(0)

const categoryItems = computed(() => CATEGORY_TYPES.map((type) => ({
  type,
  count: type === '전체'
    ? props.events.length
    : props.events.filter((event) => event.eventType === type).length,
})))
const categoryFilteredEvents = computed(() => (
  selectedCategory.value === '전체'
    ? props.events
    : props.events.filter((event) => event.eventType === selectedCategory.value)
))
const pastFinalEvents = computed(() => categoryFilteredEvents.value.filter(isCompletedPastEvent))
const visibleEvents = computed(() => (
  showPastEvents.value
    ? categoryFilteredEvents.value
    : categoryFilteredEvents.value.filter((event) => !isCompletedPastEvent(event))
))
const eventTotalPages = computed(() => Math.max(1, Math.ceil(visibleEvents.value.length / PAGE_SIZE)))
const pagedEvents = computed(() => {
  const start = eventPage.value * PAGE_SIZE
  return visibleEvents.value.slice(start, start + PAGE_SIZE)
})
const summaryItems = computed(() => {
  const todayCount = categoryFilteredEvents.value.filter((event) => calculateDday(event.eventDate) === 0).length
  const upcomingCount = categoryFilteredEvents.value.filter((event) => {
    const dDay = calculateDday(event.eventDate)
    return typeof dDay === 'number' && dDay > 0
  }).length
  const pastCount = categoryFilteredEvents.value.filter((event) => {
    const dDay = calculateDday(event.eventDate)
    return typeof dDay === 'number' && dDay < 0
  }).length

  return [
    { label: '오늘', count: todayCount, class: 'bg-primary/10 text-primary' },
    { label: '예정', count: upcomingCount, class: 'bg-surface-secondary text-text-sub' },
    { label: '지난 이벤트', count: pastCount, class: 'bg-warning/10 text-warning' },
  ]
})
const departmentItems = computed(() => {
  const counts = new Map<string, number>()
  categoryFilteredEvents.value.forEach((event) => {
    const departmentName = event.departmentName || '부서 미지정'
    counts.set(departmentName, (counts.get(departmentName) ?? 0) + 1)
  })
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
})

const statusItems = computed(() => {
  return [
    createStatisticsItem('대기', props.statistics.pendingCount, props.statistics.pendingPercentage, 'bg-warning'),
    createStatisticsItem('진행 중', props.statistics.inProgressCount, props.statistics.inProgressPercentage, 'bg-primary'),
    createStatisticsItem('완료', props.statistics.completedCount, props.statistics.completedPercentage, 'bg-success'),
    createStatisticsItem('취소', props.statistics.cancelledCount, props.statistics.cancelledPercentage, 'bg-danger'),
  ]
})

watch(visibleEvents, () => {
  if (eventPage.value >= eventTotalPages.value) eventPage.value = eventTotalPages.value - 1
})

function createStatisticsItem(
  label: string,
  count: number,
  percentage: number,
  colorClass: string,
) {
  return {
    label,
    count,
    total: props.statistics.totalCount,
    percentage: Math.min(Math.max(Number(percentage) || 0, 0), 100),
    colorClass,
  }
}

function selectCategory(type: CategoryType) {
  selectedCategory.value = type
  eventPage.value = 0
}

function togglePastEvents() {
  showPastEvents.value = !showPastEvents.value
  eventPage.value = 0
}

function eventIcon(type: string) {
  if (type === '입사') return LogIn
  if (type === '퇴사') return LogOut
  return MoveRight
}

function eventStatusClass(status: string) {
  const baseClass = 'w-fit rounded-full px-2.5 py-1 text-xs font-semibold'
  if (status === '지급완료' || status === '완료' || status === '반납') {
    return `${baseClass} bg-success/10 text-success`
  }
  if (status === '진행중' || status === '회수중') {
    return `${baseClass} bg-primary/10 text-primary`
  }
  if (status === '취소') return `${baseClass} bg-danger/10 text-danger`
  return `${baseClass} bg-warning/10 text-warning`
}

function formatDate(value: HrLifecycleEvent['eventDate']) {
  const date = parseEventDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function dDayText(event: HrLifecycleEvent) {
  const value = calculateDday(event.eventDate) ?? event.dDay
  if (value === null || value === undefined) return '-'
  if (value === 0) return 'D-Day'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}

function dDayTextClass(event: HrLifecycleEvent) {
  const value = calculateDday(event.eventDate) ?? event.dDay
  if (typeof value !== 'number') return 'text-text-sub'
  if (value < 0 && !isFinalStatus(event.status)) return 'text-danger'
  if (value < 0) return 'text-warning'
  if (value === 0) return 'text-primary'
  return 'text-text-sub'
}

function isCompletedPastEvent(event: HrLifecycleEvent) {
  const dDay = calculateDday(event.eventDate) ?? event.dDay
  return typeof dDay === 'number' && dDay < 0 && isFinalStatus(event.status)
}

function isFinalStatus(status: string) {
  const normalizedStatus = status.replaceAll(' ', '')
  return ['완료', '취소', 'COMPLETED', 'CANCELLED'].includes(normalizedStatus)
}

function calculateDday(value: HrLifecycleEvent['eventDate']) {
  if (!value) return null
  const eventDate = startOfDay(value)
  const today = startOfDay(new Date())
  if (!eventDate || !today) return null

  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return Math.round((eventDate.getTime() - today.getTime()) / millisecondsPerDay)
}

function startOfDay(value: HrLifecycleEvent['eventDate'] | Date) {
  const date = parseEventDate(value)
  if (!date || Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function parseEventDate(value: HrLifecycleEvent['eventDate'] | Date) {
  if (value instanceof Date) return new Date(value)

  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    if (!year) return null
    return new Date(year, month - 1, day, hour, minute, second)
  }

  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
</script>
