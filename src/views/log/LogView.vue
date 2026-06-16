<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="flex shrink-0 items-center justify-between px-1 pb-6 pt-3">
      <div class="flex items-center gap-3">
        <h1 class="text-4xl font-black leading-none text-text-main">
          {{ currentTabLabel }}
        </h1>
        <span class="rounded-full bg-primary/20 px-4 py-2 text-xl font-black text-primary">
          {{ totalElements }}
        </span>
      </div>

      <Button variant="outline" size="lg" disabled title="TODO: 로그 엑셀 다운로드 API 확정 후 연결">
        <Download :size="18" />
        엑셀 다운로드
      </Button>
    </div>

    <div class="mb-6 shrink-0">
      <div class="relative">
        <Search :size="22" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          id="log-keyword"
          v-model="filters.keyword"
          class="h-14 w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-base font-medium text-text-main outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="로그 검색"
          autocomplete="off"
          @keyup.enter="handleSearch"
        />
      </div>
      <p class="mt-2 text-xs text-text-muted">
        TODO: API 명세에 keyword/actionType/activityType 필터가 확정되면 서버 검색으로 연결합니다.
      </p>
    </div>

    <div class="mb-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AuditLogTableCard
          v-if="activeTab === 'audit'"
          :rows="filteredAuditRows"
          :loading="isLoading"
        />

        <ActivityLogTableCard
          v-else
          :rows="filteredActivityRows"
          :loading="isLoading"
        />
      </div>

      <div class="shrink-0 px-0 pt-6">
        <div class="grid grid-cols-3 items-center">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
            class="w-36"
          />

          <div class="flex items-center justify-center gap-2">
            <button
              :disabled="page === 0 || isLoading"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-surface"
              @click="changePage(0)"
            >
              <ChevronsLeft :size="16" />
            </button>
            <button
              :disabled="page === 0 || isLoading"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-surface"
              @click="changePage(page - 1)"
            >
              <ChevronLeft :size="16" />
            </button>

            <button
              v-for="pageNumber in visiblePages"
              :key="pageNumber"
              type="button"
              :disabled="isLoading"
              :class="[
                'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-all',
                page === pageNumber - 1
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-surface text-text-main hover:bg-surface-secondary'
              ]"
              @click="changePage(pageNumber - 1)"
            >
              {{ pageNumber }}
            </button>

            <button
              :disabled="page >= totalPages - 1 || isLoading"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-surface"
              @click="changePage(page + 1)"
            >
              <ChevronRight :size="16" />
            </button>
            <button
              :disabled="page >= totalPages - 1 || isLoading"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-surface"
              @click="changePage(totalPages - 1)"
            >
              <ChevronsRight :size="16" />
            </button>
          </div>

          <span class="justify-self-end text-xs text-text-sub">
            총 {{ totalElements }}개 항목 중 {{ itemRangeText }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="mx-3 mb-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Search } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import { logApi } from '@/api/log.api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import ActivityLogTableCard from '@/components/log/ActivityLogTableCard.vue'
import AuditLogTableCard from '@/components/log/AuditLogTableCard.vue'
import type { ActivityLog, AuditLog, LogListFilter } from '@/types'

type LogTab = 'audit' | 'activity'

const logTabs: Array<{ value: LogTab; label: string }> = [
  { value: 'audit', label: '감사 로그' },
  { value: 'activity', label: '활동 로그' },
]

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기']
const route = useRoute()
const rowsPerPageText = ref('20개씩 보기')
const activeTab = ref<LogTab>('audit')
const page = ref(0)
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const auditRows = ref<AuditLog[]>([])
const activityRows = ref<ActivityLog[]>([])
const filters = reactive({
  keyword: '',
  memberId: '',
  startDate: '',
  endDate: '',
})

const currentTabLabel = computed(() => (
  logTabs.find((tab) => tab.value === activeTab.value)?.label ?? '로그'
))

const normalizedKeyword = computed(() => filters.keyword.trim().toLowerCase())

const filteredAuditRows = computed(() => {
  if (!normalizedKeyword.value) return auditRows.value

  return auditRows.value.filter((row) => [
    row.memberName,
    row.targetType,
    String(row.targetId),
    row.actionType,
    row.description,
    row.ipAddress,
    row.createdAt,
  ].some((value) => value.toLowerCase().includes(normalizedKeyword.value)))
})

const filteredActivityRows = computed(() => {
  if (!normalizedKeyword.value) return activityRows.value

  return activityRows.value.filter((row) => [
    row.memberName,
    row.activityType,
    row.targetType,
    row.targetId === null ? '' : String(row.targetId),
    row.description,
    row.createdAt,
  ].some((value) => value.toLowerCase().includes(normalizedKeyword.value)))
})

const pageSize = computed(() => {
  const matches = rowsPerPageText.value.match(/\d+/)
  return matches ? Number(matches[0]) : 20
})

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0'
  const start = page.value * pageSize.value + 1
  const end = Math.min(start + pageSize.value - 1, totalElements.value)
  return `${start}-${end}`
})

const visiblePages = computed(() => {
  const maxPages = 5
  const total = totalPages.value
  if (total <= 0) return [1]

  const current = page.value + 1
  const start = Math.max(1, Math.min(current - 2, total - maxPages + 1))
  const end = Math.min(total, start + maxPages - 1)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const requestParams = (): LogListFilter => ({
  page: page.value,
  size: pageSize.value,
  memberId: filters.memberId.trim() || undefined,
  startDate: filters.startDate || undefined,
  endDate: filters.endDate || undefined,
})

const tabFromRoute = (): LogTab => (
  route.name === 'ActivityLog' ? 'activity' : 'audit'
)

const loadLogs = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (activeTab.value === 'audit') {
      const response = await logApi.getAuditLogs(requestParams())
      auditRows.value = response.data.content
      totalElements.value = response.data.totalElements
      totalPages.value = response.data.totalPages
      return
    }

    const response = await logApi.getActivityLogs(requestParams())
    activityRows.value = response.data.content
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('로그 목록 조회 실패', error)
    errorMessage.value = '로그 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  page.value = 0
  void loadLogs()
}

const changePage = (targetPage: number) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  page.value = targetPage
  void loadLogs()
}

watch(rowsPerPageText, () => {
  page.value = 0
  void loadLogs()
})

watch(
  () => route.name,
  () => {
    activeTab.value = tabFromRoute()
    page.value = 0
    void loadLogs()
  },
  { immediate: true },
)
</script>
