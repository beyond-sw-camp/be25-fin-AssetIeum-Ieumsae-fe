<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          로그 > {{ currentTabLabel }}
        </p>
        <h1 class="page-title">
          {{ currentTabLabel }}
        </h1>
      </div>

      <Button variant="outline" size="md" disabled title="TODO: 로그 엑셀 다운로드 API 확정 후 연결">
        <Download :size="18" />
        엑셀 다운로드
      </Button>
    </div>

    <div class="card mb-4 flex-1 min-h-0 flex flex-col border border-border overflow-visible relative z-10">
      <div class="shrink-0 rounded-t-2xl bg-surface border-b border-border px-2 pb-3 flex flex-col gap-3 relative z-30 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2 text-text-main shrink-0">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
            class="w-30"
          />
          <span class="text-xs text-text-sub whitespace-nowrap">
            총 {{ totalElements }}개 항목 중 {{ itemRangeText }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-text-main">
          <Dropdown
            v-model="filters.action"
            :options="actionFilterOptions"
            class="w-40"
            menu-align="right"
          />

          <Input
            id="log-keyword"
            v-model="filters.keyword"
            placeholder="로그 검색"
            autocomplete="off"
            @keyup.enter="handleSearch"
          />

          <Button
            variant="primary"
            size="md"
            class="shrink-0"
            @click="handleSearch"
          >
            <Search :size="14" />
            조회하기
          </Button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mx-3 mt-3 flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
      >
        <span>{{ errorMessage }}</span>
        <Button variant="outline" size="sm" :loading="isLoading" @click="loadLogs">
          다시 시도
        </Button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden whitespace-pre-line bg-surface p-3 relative z-10">
        <AuditLogTableCard
          v-if="activeTab === 'audit'"
          :rows="auditRows"
          :loading="isLoading"
        />

        <ActivityLogTableCard
          v-else
          :rows="activityRows"
          :loading="isLoading"
        />
      </div>

      <div class="shrink-0 rounded-b-2xl border-t border-border bg-surface px-4 pt-3 flex items-center justify-center relative z-20">
        <div class="flex items-center gap-2">
          <button
            :disabled="page === 0 || isLoading"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
              page === pageNumber - 1
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'text-text-sub hover:bg-surface-secondary'
            ]"
            @click="changePage(pageNumber - 1)"
          >
            {{ pageNumber }}
          </button>

          <button
            :disabled="page >= totalPages - 1 || isLoading"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            @click="changePage(page + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import { logApi } from '@/api/log.api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import ActivityLogTableCard from '@/components/log/ActivityLogTableCard.vue'
import AuditLogTableCard from '@/components/log/AuditLogTableCard.vue'
import { ACTIVITY_LOG_ACTION_LABEL, AUDIT_LOG_ACTION_LABEL } from '@/utils/logLabels'
import type {
  ActivityLog,
  ActivityLogAction,
  AuditLog,
  AuditLogAction,
  DropdownOption,
  LogListFilter,
} from '@/types'

type LogTab = 'audit' | 'activity'

const logTabs: Array<{ value: LogTab; label: string }> = [
  { value: 'audit', label: '감사 로그' },
  { value: 'activity', label: '활동 로그' },
]

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기']
const ALL_ACTION_OPTION = ''
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
  action: ALL_ACTION_OPTION,
})

const appliedFilters = reactive({
  keyword: '',
  action: ALL_ACTION_OPTION,
})

const currentTabLabel = computed(() => (
  logTabs.find((tab) => tab.value === activeTab.value)?.label ?? '로그'
))

const actionFilterOptions = computed<DropdownOption[]>(() => {
  const actions = activeTab.value === 'audit'
    ? Object.entries(AUDIT_LOG_ACTION_LABEL)
    : Object.entries(ACTIVITY_LOG_ACTION_LABEL)

  return [
    { label: '전체 액션', value: ALL_ACTION_OPTION },
    ...actions.map(([value, label]) => ({ label, value })),
  ]
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
  action: activeTab.value === 'audit'
    ? appliedFilters.action as AuditLogAction || undefined
    : appliedFilters.action as ActivityLogAction || undefined,
  keyword: appliedFilters.keyword.trim() || undefined,
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
      auditRows.value = Array.isArray(response.data.content) ? response.data.content : []
      totalElements.value = response.data.totalElements
      totalPages.value = response.data.totalPages
      return
    }

    const response = await logApi.getActivityLogs(requestParams())
    activityRows.value = Array.isArray(response.data.content) ? response.data.content : []
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch {
    errorMessage.value = '로그 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  appliedFilters.keyword = filters.keyword
  appliedFilters.action = filters.action

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
    filters.action = ALL_ACTION_OPTION
    appliedFilters.action = ALL_ACTION_OPTION
    void loadLogs()
  },
  { immediate: true },
)
</script>
