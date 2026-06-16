<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header px-3 pt-3">
      <p class="page-subtitle mb-1">
        로그 > 감사/활동 로그
      </p>
      <h1 class="page-title">
        감사/활동 로그
      </h1>
    </div>

    <div class="card mb-4 flex min-h-0 flex-1 flex-col border border-border">
      <div class="shrink-0 rounded-t-2xl border-b border-border bg-surface px-3 pb-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-surface-secondary p-1 lg:w-72">
            <button
              v-for="tab in logTabs"
              :key="tab.value"
              type="button"
              class="rounded-md px-3 py-2 text-sm font-semibold transition"
              :class="activeTab === tab.value ? 'bg-surface text-primary shadow-sm' : 'text-text-sub hover:text-text-main'"
              @click="changeTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Input
              id="log-member-id"
              v-model="filters.memberId"
              class="w-36"
              placeholder="회원 ID"
              autocomplete="off"
              @keyup.enter="handleSearch"
            />
            <Input
              id="log-start-date"
              v-model="filters.startDate"
              class="w-40"
              type="date"
              label="시작일"
            />
            <Input
              id="log-end-date"
              v-model="filters.endDate"
              class="w-40"
              type="date"
              label="종료일"
            />
            <Button variant="outline" :disabled="isLoading" @click="resetFilters">
              초기화
            </Button>
            <Button variant="primary" :loading="isLoading" @click="handleSearch">
              <Search :size="14" />
              조회하기
            </Button>
          </div>
        </div>

        <p class="mt-3 text-xs text-text-muted">
          TODO: API 명세에 actionType/activityType 필터가 확정되면 필터를 추가합니다.
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-surface p-3">
        <Table
          v-if="activeTab === 'audit'"
          :columns="auditColumns"
          :rows="auditRows"
          :loading="isLoading"
          row-key="auditLogId"
          empty-text="감사 로그가 없습니다."
        >
          <template #cell-targetId="{ value }">
            <span>{{ value ?? '-' }}</span>
          </template>
          <template #cell-createdAt="{ value }">
            <span>{{ formatDateTime(value as string) }}</span>
          </template>
        </Table>

        <Table
          v-else
          :columns="activityColumns"
          :rows="activityRows"
          :loading="isLoading"
          row-key="activityLogId"
          empty-text="활동 로그가 없습니다."
        >
          <template #cell-targetId="{ value }">
            <span>{{ value ?? '-' }}</span>
          </template>
          <template #cell-createdAt="{ value }">
            <span>{{ formatDateTime(value as string) }}</span>
          </template>
        </Table>
      </div>

      <div class="shrink-0 rounded-b-2xl border-t border-border bg-surface px-4 py-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2 text-xs text-text-sub">
            <Dropdown
              v-model="rowsPerPageText"
              :options="rowsPerPageOptions"
              class="w-36"
            />
            <span>총 {{ totalElements }}개 항목 중 {{ itemRangeText }}</span>
          </div>

          <div class="flex items-center justify-center gap-2">
            <button
              :disabled="page === 0 || isLoading"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent"
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
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent"
              @click="changePage(page + 1)"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="mx-3 mb-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next'

import { logApi } from '@/api/log.api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import type { ActivityLog, AuditLog, LogListFilter } from '@/types'

type LogTab = 'audit' | 'activity'

const logTabs: Array<{ value: LogTab; label: string }> = [
  { value: 'audit', label: '감사 로그' },
  { value: 'activity', label: '활동 로그' },
]

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기']
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
  memberId: '',
  startDate: '',
  endDate: '',
})

const auditColumns: Column<AuditLog>[] = [
  { key: 'auditLogId', label: 'ID', align: 'center', width: '7%' },
  { key: 'memberName', label: '사용자', align: 'center', width: '12%' },
  { key: 'targetType', label: '대상', align: 'center', width: '12%' },
  { key: 'targetId', label: '대상 ID', align: 'center', width: '10%' },
  { key: 'actionType', label: '액션', align: 'center', width: '14%' },
  { key: 'description', label: '설명', align: 'left', width: '28%' },
  { key: 'ipAddress', label: 'IP', align: 'center', width: '11%' },
  { key: 'createdAt', label: '일시', align: 'center', width: '16%' },
]

const activityColumns: Column<ActivityLog>[] = [
  { key: 'activityLogId', label: 'ID', align: 'center', width: '7%' },
  { key: 'memberName', label: '사용자', align: 'center', width: '12%' },
  { key: 'activityType', label: '활동', align: 'center', width: '14%' },
  { key: 'targetType', label: '대상', align: 'center', width: '12%' },
  { key: 'targetId', label: '대상 ID', align: 'center', width: '10%' },
  { key: 'description', label: '설명', align: 'left', width: '29%' },
  { key: 'createdAt', label: '일시', align: 'center', width: '16%' },
]

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

const formatDateTime = (value: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

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

const resetFilters = () => {
  filters.memberId = ''
  filters.startDate = ''
  filters.endDate = ''
  page.value = 0
  void loadLogs()
}

const changeTab = (tab: LogTab) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
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

onMounted(loadLogs)
</script>
