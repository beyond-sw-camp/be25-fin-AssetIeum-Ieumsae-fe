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
            class="w-30!"
            menu-align="right"
          />

          <Input
            id="log-keyword"
            v-model="filters.keyword"
            placeholder="로그 검색"
            class="w-50!"
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
        <Pagination
          :current-page="page"
          :total-pages="totalPages"
          :disabled="isLoading"
          @change="changePage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import { logApi } from '@/api/log.api'
import { intangibleInspectionApi, tangibleInspectionApi } from '@/api/inspection.api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Pagination from '@/components/common/Pagination.vue'
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

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

function validSubjectId(subjectId: unknown) {
  if (typeof subjectId !== 'string' || subjectId === EMPTY_UUID) return null
  return subjectId
}

function pathUuid(path: string) {
  return path.match(/[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}/)?.[0] ?? null
}

function logTargetPath(row: AuditLog | ActivityLog) {
  const value = row.targetPath
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function logSubjectId(row: AuditLog | ActivityLog) {
  return validSubjectId(row.subjectId)
}

function normalizeTargetPath(targetPath: string | null | undefined, subjectId: unknown) {
  if (!targetPath) return null

  const path = targetPath.replace(/^\/api\/v1/, '')
  const id = pathUuid(path) ?? validSubjectId(subjectId)

  if (path.startsWith('/assets/tangible')) return '/assets/tangible'
  if (path.startsWith('/assets/intangible')) {
    return id ? `/assets/intangible/${id}` : '/assets/intangible'
  }
  if (path.startsWith('/item/tangible')) return '/item/tangible'
  if (path.startsWith('/item/intangible')) return '/item/intangible'
  if (path.startsWith('/tickets')) return id ? `/tickets/${id}` : '/tickets'
  if (path.startsWith('/members')) return '/members'
  if (path.startsWith('/purchase')) return '/purchase'
  if (path.startsWith('/hrworkflows')) return '/hrworkflows'
  if (path.startsWith('/inspections/tangible')) return '/inspections/tangible'
  if (path.startsWith('/inspections/intangible')) return '/inspections/intangible'

  if (path.startsWith('/tangible-asset/assets') || path.startsWith('/tangible-assets')) {
    return '/assets/tangible'
  }
  if (path.startsWith('/intangible-asset/assets') || path.startsWith('/intangible-assets')) {
    return id ? `/assets/intangible/${id}` : '/assets/intangible'
  }
  if (path.startsWith('/tangible-asset/items')) return '/item/tangible'
  if (path.startsWith('/intangible-asset/items')) return '/item/intangible'
  if (path.startsWith('/tangible-asset/inspections')) return '/inspections/tangible'
  if (path.startsWith('/intangible-asset/inspections')) return '/inspections/intangible'
  if (path.startsWith('/purchase-plans')) return '/purchase'
  if (path.startsWith('/departments')) return '/organization'
  if (path.startsWith('/hr-events') || path.startsWith('/hr-')) return '/hrworkflows'

  return null
}

function resolveTargetPath(subjectType: AuditLog['subjectType'] | ActivityLog['subjectType'], subjectId: unknown) {
  const id = validSubjectId(subjectId)

  if (subjectType === 'TANGIBLE_ASSET') return '/assets/tangible'
  if (subjectType === 'INTANGIBLE_ASSET') return id ? `/assets/intangible/${id}` : '/assets/intangible'
  if (subjectType === 'TANGIBLE_ASSET_ITEM') return '/item/tangible'
  if (subjectType === 'INTANGIBLE_ASSET_ITEM') return '/item/intangible'
  if (subjectType === 'TICKET') return id ? `/tickets/${id}` : '/tickets'
  if (subjectType === 'MEMBER') return '/members'
  if (subjectType === 'PURCHASE_PLAN') return '/purchase'
  if (subjectType === 'HR_EVENT') return '/hrworkflows'

  return null
}

async function enrichLogTargetPaths<T extends AuditLog | ActivityLog>(rows: T[]): Promise<T[]> {
  const inspectionIds = new Set(
    rows
      .filter((row) => row.subjectType === 'INSPECTION' && !logTargetPath(row))
      .map((row) => logSubjectId(row))
      .filter((subjectId): subjectId is string => Boolean(subjectId)),
  )
  const inspectionPathById = new Map<string, string>()

  if (inspectionIds.size > 0) {
    const inspectionResults = await Promise.allSettled([
      tangibleInspectionApi.getList({ page: 0, size: 1000 }),
      intangibleInspectionApi.getList({ page: 0, size: 1000 }),
    ])
    inspectionResults.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      const targetPath = index === 0 ? '/inspections/tangible' : '/inspections/intangible'

      result.value.data.content.forEach((inspection) => {
        if (!inspection.inspectionId) return
        inspectionPathById.set(String(inspection.inspectionId), targetPath)
      })
    })
  }

  return rows.map((row) => {
    const subjectId = logSubjectId(row)
    const inspectionPath = row.subjectType === 'INSPECTION' && subjectId
      ? inspectionPathById.get(subjectId) ?? null
      : null
    const normalizedTargetPath = normalizeTargetPath(logTargetPath(row), subjectId)

    return {
      ...row,
      targetPath: normalizedTargetPath
        ?? inspectionPath
        ?? resolveTargetPath(row.subjectType, subjectId),
    } as T
  })
}

const loadLogs = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (activeTab.value === 'audit') {
      const response = await logApi.getAuditLogs(requestParams())
      const rows = Array.isArray(response.data.content) ? response.data.content : []
      auditRows.value = await enrichLogTargetPaths(rows)
      totalElements.value = response.data.totalElements
      totalPages.value = response.data.totalPages
      return
    }

    const response = await logApi.getActivityLogs(requestParams())
    const rows = Array.isArray(response.data.content) ? response.data.content : []
    activityRows.value = await enrichLogTargetPaths(rows)
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
