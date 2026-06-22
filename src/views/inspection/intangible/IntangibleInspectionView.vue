<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          ASSET ITEM
        </p>
        <h1 class="page-title">
          무형자산 전수조사
        </h1>
      </div>

      <Button
        v-if="canRegisterInspection"
        size="md"
        @click="openRegisterDrawer"
      >
        <Plus :size="15" />
        전수조사 계획 등록
      </Button>
    </header>

    <section
      v-if="canManageInspection"
      class="grid shrink-0 grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-2 xl:grid-cols-5"
    >
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-lg border border-border bg-surface p-5"
      >
        <p class="text-sm font-bold text-text-main">
          {{ card.label }}
        </p>
        <p class="mt-4 text-3xl font-bold text-text-main">
          {{ card.value.toLocaleString() }}건
        </p>
        <div
          :class="[
            'mt-5 grid gap-2 text-xs',
            card.items.length === 1 ? 'grid-cols-1' : 'grid-cols-3',
          ]"
        >
          <div v-for="item in card.items" :key="item.label">
            <p class="font-semibold text-text-main">
              {{ item.label }}
            </p>
            <p class="mt-2 font-bold text-text-sub">
              {{ item.value.toLocaleString() }}건
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="card mx-3 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-surface">
      <div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2">
          <Dropdown
            :model-value="String(pageSize)"
            :options="pageSizeOptions"
            menu-strategy="fixed"
            class="w-30"
            @update:model-value="handlePageSizeChange"
          />
          <span class="whitespace-nowrap text-xs text-text-sub">
            총 {{ filteredRows.length }}건 중 {{ rangeText }}
          </span>
        </div>

        <div class="flex justify-end gap-2">
          <div class="w-36 shrink-0">
            <Dropdown
              v-model="filters.status"
              :options="statusFilterOptions"
              menu-strategy="fixed"
              menu-align="right"
            />
          </div>
          <div v-if="canManageInspection" class="w-40 shrink-0">
            <Dropdown
              v-model="filters.inspector"
              :options="inspectorFilterOptions"
              menu-strategy="fixed"
              menu-align="right"
            />
          </div>
          <div class="w-40 shrink-0">
            <Input
              id="intangible-inspection-keyword"
              v-model="filters.keyword"
              placeholder="조사 대상 검색"
              @keyup.enter="applySearch"
            />
          </div>
          <Button class="w-20" @click="applySearch">
            <Search :size="14" />
            검색
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <Table
          :columns="columns"
          :rows="pagedRows"
          row-key="rowKey"
          :loading="isLoading"
          :empty-text="emptyText"
          @row-click="openDetailDrawer"
        >
          <template #cell-targetName="{ value: targetName }">
            <span class="font-semibold text-text-main">{{ targetName }}</span>
          </template>

          <template #cell-status="{ row }">
            <span :class="statusBadgeClass(row.status)">
              {{ STATUS_LABEL[row.status] }}
            </span>
          </template>

          <template #cell-inspectorName="{ row }">
            <span class="text-text-sub">{{ row.inspectorName }}</span>
          </template>

          <template #cell-startDate="{ value: startDate }">
            <span class="text-text-main">{{ formatDate(startDate as string) }}</span>
          </template>

          <template #cell-endDate="{ value: endDate }">
            <span class="text-text-main">{{ formatDate(endDate as string) }}</span>
          </template>
        </Table>
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border bg-surface px-4 py-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="currentPage === 0"
            @click="changePage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            :class="[
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
              currentPage === page - 1
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-surface-secondary',
            ]"
            @click="changePage(page - 1)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="currentPage >= totalPages - 1"
            @click="changePage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <IntangibleInspectionRegister
      v-if="canManageInspection"
      :is-open="isRegisterDrawerOpen"
      @close="closeRegisterDrawer"
      @registered="handleInspectionRegistered"
    />

    <IntangibleInspectionDetail
      :is-open="Boolean(selectedInspection)"
      :inspection="selectedInspection"
      :assigned-targets="selectedAssignedTargets"
      @close="selectedInspection = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import IntangibleInspectionDetail from '@/components/inspection/intangible/IntangibleInspectionDetail.vue'
import IntangibleInspectionRegister from '@/components/inspection/intangible/IntangibleInspectionRegister.vue'
import { intangibleInspectionApi } from '@/api/inspection.api'
import { usePermission } from '@/composables'
import { groupMyInspectionTargets } from '@/utils/inspectionTargets'
import type { DropdownOption } from '@/types'
import type {
  EmployeeInspectionTargetResponse,
  InspectionSearchResponse,
  InspectionStatisticsResponse,
  InspectionStatus,
  InspectorType,
} from '@/types/inspection'

type IntangibleInspectionStatus = InspectionStatus

interface IntangibleInspectionRow extends Record<string, unknown> {
  rowKey: string
  inspectionId: string
  targetName: string
  executor: string
  status: IntangibleInspectionStatus
  inspectorDepartment: string
  inspectorName: string
  startDate: string
  endDate: string
  targetAssetCount: number
  completedAssetCount: number
  followUpCount: number
  description: string
}

interface SummaryCard {
  label: string
  value: number
  items: Array<{
    label: string
    value: number
  }>
}

const STATUS_LABEL: Record<IntangibleInspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '조사 종료',
}

const { canManageInspection } = usePermission()

const inspections = ref<IntangibleInspectionRow[]>([])
const employeeTargets = ref<EmployeeInspectionTargetResponse[]>([])
const statistics = ref<InspectionStatisticsResponse>({})
const selectedInspection = ref<IntangibleInspectionRow | null>(null)
const isRegisterDrawerOpen = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const currentPage = ref(0)
const pageSize = ref(10)

const filters = reactive({
  status: '',
  inspector: '',
  keyword: '',
})

const appliedFilters = reactive({
  status: '',
  inspector: '',
  keyword: '',
})

const canRegisterInspection = computed(() => (
  canManageInspection.value
))
const selectedAssignedTargets = computed(() => (
  selectedInspection.value
    ? employeeTargets.value.filter((target) => (
      String(target.inspectionId) === selectedInspection.value?.inspectionId
    ))
    : []
))

const columns: Column<IntangibleInspectionRow>[] = [
  { key: 'targetName', label: '조사 대상', width: '18%' },
  { key: 'executor', label: '조사 방식', width: '16%' },
  { key: 'status', label: '조사 상태', width: '16%' },
  { key: 'inspectorName', label: '조사 담당자', width: '22%' },
  { key: 'startDate', label: '시작일', width: '14%', align: 'center' },
  { key: 'endDate', label: '종료일', width: '14%', align: 'center' },
]

const pageSizeOptions: DropdownOption[] = [10, 20, 50].map((value) => ({
  label: `${value}개씩 보기`,
  value: String(value),
}))

const statusFilterOptions: DropdownOption[] = [
  { label: '- 전체 -', value: '' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ label, value })),
]

const inspectorFilterOptions = computed<DropdownOption[]>(() => [
  { label: '- 조사 담당자 -', value: '' },
  ...Array.from(new Set(inspections.value.map((item) => item.inspectorName))).map((name) => ({
    label: name,
    value: name,
  })),
])

const emptyText = computed(() => (
  loadError.value
  || (canManageInspection.value
    ? '등록된 무형자산 전수조사가 없습니다.'
    : '배정된 무형자산 전수조사가 없습니다.')
))

const filteredRows = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return inspections.value.filter((item) => {
    const matchesStatus = !appliedFilters.status || item.status === appliedFilters.status
    const matchesInspector = !appliedFilters.inspector || item.inspectorName === appliedFilters.inspector
    const matchesKeyword = !keyword || [
      item.targetName,
      item.executor,
      item.inspectorDepartment,
      item.inspectorName,
      item.description,
    ].some((value) => value.toLowerCase().includes(keyword))

    return matchesStatus && matchesInspector && matchesKeyword
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))

const pagedRows = computed(() => {
  const start = currentPage.value * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const visiblePages = computed(() => (
  Array.from({ length: totalPages.value }, (_, index) => index + 1).slice(0, 5)
))

const rangeText = computed(() => {
  if (filteredRows.value.length === 0) return '0-0건'
  const start = currentPage.value * pageSize.value + 1
  const end = Math.min((currentPage.value + 1) * pageSize.value, filteredRows.value.length)
  return `${start}-${end}건`
})

const summaryCards = computed<SummaryCard[]>(() => {
  const rows = inspections.value
  const readyRows = rows.filter((item) => item.status === 'READY')
  const inProgressRows = rows.filter((item) => item.status === 'IN_PROGRESS')
  const completedRows = rows.filter((item) => item.status === 'COMPLETED')
  const totalAssets = rows.reduce((sum, item) => sum + item.targetAssetCount, 0)
  const readyAssets = readyRows.reduce((sum, item) => sum + item.targetAssetCount, 0)
  const inProgressAssets = inProgressRows.reduce((sum, item) => sum + item.targetAssetCount, 0)
  const completedAssets = completedRows.reduce((sum, item) => sum + item.completedAssetCount, 0)
  const unprocessedAssets = rows.reduce(
    (sum, item) => sum + Math.max(item.targetAssetCount - item.completedAssetCount, 0),
    0,
  )
  const followUpInProgressAssets = numberValue(
    statistics.value.followUpInProgressAssetCount,
  ) ?? rows.reduce((sum, item) => sum + item.followUpCount, 0)
  const followUpCompletedAssets = numberValue(
    statistics.value.followUpCompletedAssetCount,
  ) ?? 0

  return [
    {
      label: '전체 전수조사 현황',
      value: totalAssets,
      items: [
        { label: '진행 전', value: readyAssets },
        { label: '진행 중', value: inProgressAssets },
        { label: '완료', value: completedAssets },
      ],
    },
    {
      label: '진행 중인 전수조사',
      value: inProgressAssets,
      items: [
        { label: '조사 대상 자산', value: inProgressAssets },
      ],
    },
    {
      label: '완료된 전수조사',
      value: completedAssets,
      items: [
        { label: '조사 완료 자산', value: completedAssets },
      ],
    },
    {
      label: '미처리 자산',
      value: unprocessedAssets,
      items: [
        { label: '조사 대상 자산', value: unprocessedAssets },
      ],
    },
    {
      label: '후속 처리 중',
      value: followUpInProgressAssets,
      items: [
        { label: '처리 완료', value: followUpCompletedAssets },
      ],
    },
  ]
})

function statusBadgeClass(status: IntangibleInspectionStatus) {
  if (status === 'READY') return 'badge-warning'
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'
  if (status === 'COMPLETED') return 'badge-success'
  return 'bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-semibold'
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function applySearch() {
  appliedFilters.status = filters.status
  appliedFilters.inspector = filters.inspector
  appliedFilters.keyword = filters.keyword
  currentPage.value = 0
}

function handlePageSizeChange(value: string | number) {
  const nextSize = Number(value)
  if (!Number.isInteger(nextSize) || nextSize <= 0) return
  pageSize.value = nextSize
  currentPage.value = 0
}

function changePage(page: number) {
  if (page < 0 || page > totalPages.value - 1) return
  currentPage.value = page
}

function openDetailDrawer(row: IntangibleInspectionRow) {
  selectedInspection.value = row
}

function openRegisterDrawer() {
  isRegisterDrawerOpen.value = true
}

function closeRegisterDrawer() {
  isRegisterDrawerOpen.value = false
}

async function handleInspectionRegistered() {
  await loadInspectionData()
}

function numberValue(...values: Array<number | null | undefined>) {
  return values.find((value): value is number => typeof value === 'number')
}

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

function getInspectorTypeLabel(inspectorType: InspectorType | undefined) {
  return inspectorType === 'ASSET_TEAM' ? '자산팀 처리' : '소유자 응답'
}

function getTargetNameLabel(item: InspectionSearchResponse) {
  const targetName = textValue(item.targetName)
  const targetType = item.targetType

  if (targetType === 'ALL' || targetName.toUpperCase() === 'ALL') {
    return '전체 무형자산'
  }
  if (targetName) return targetName
  return '조사 대상'
}

function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function dateTimeValue(value: string) {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolveInspectionStatusByPeriod(
  startDate: string,
  endDate: string,
  fallbackStatus: IntangibleInspectionStatus,
): IntangibleInspectionStatus {
  if (fallbackStatus === 'CLOSED') return 'CLOSED'

  const today = startOfDay(new Date())
  const start = dateTimeValue(startDate)
  const end = dateTimeValue(endDate)

  if (!start || !end) return fallbackStatus

  const startDay = startOfDay(start)
  const endDay = startOfDay(end)

  if (today < startDay) return 'READY'
  if (today <= endDay) return 'IN_PROGRESS'
  return 'COMPLETED'
}

function toInspectionRow(item: InspectionSearchResponse, index: number): IntangibleInspectionRow {
  const rawStatus = item.inspectionStatus ?? item.status ?? 'READY'
  const inspectorType = item.inspectorType
  const inspectorName = textValue(item.inspectorName)
  const startDate = textValue(item.startDate)
  const endDate = textValue(item.endDate)

  const inspectionId = textValue(item.inspectionId) || `inspection-${index}`

  return {
    rowKey: textValue(item.groupKey) || inspectionId,
    inspectionId,
    targetName: getTargetNameLabel(item),
    executor: getInspectorTypeLabel(inspectorType),
    status: resolveInspectionStatusByPeriod(startDate, endDate, rawStatus),
    inspectorDepartment: '-',
    inspectorName: inspectorName || '-',
    startDate,
    endDate,
    targetAssetCount: numberValue(item.targetAssetCount) ?? 0,
    completedAssetCount: numberValue(
      item.inspectedAssetCount,
      item.completedAssetCount,
    ) ?? 0,
    followUpCount: numberValue(item.followUpRequiredCount) ?? 0,
    description: item.description ?? '',
  }
}

async function hydrateDetailCounts(row: IntangibleInspectionRow): Promise<IntangibleInspectionRow> {
  if (!row.inspectionId) return row

  try {
    const response = await intangibleInspectionApi.getDetail(row.inspectionId)
    const inspectionResults = Array.isArray(response.data.inspectionResults)
      ? response.data.inspectionResults
      : []
    const uninspectedAssets = Array.isArray(response.data.uninspectedAssets)
      ? response.data.uninspectedAssets
      : []

    return {
      ...row,
      targetAssetCount: inspectionResults.length + uninspectedAssets.length,
      completedAssetCount: inspectionResults.length,
      followUpCount: inspectionResults.filter((item) => item.followUpRequired).length,
    }
  } catch {
    return row
  }
}

async function loadInspectionData() {
  isLoading.value = true
  loadError.value = ''

  try {
    if (!canManageInspection.value) {
      const response = await intangibleInspectionApi.getMyTargets({ page: 0, size: 100 })
      const content = Array.isArray(response.data.content) ? response.data.content : []
      employeeTargets.value = content
      inspections.value = groupMyInspectionTargets(content).map(toInspectionRow)
      statistics.value = {}
      currentPage.value = 0
      return
    }

    employeeTargets.value = []
    const [listResult, statisticsResult] = await Promise.allSettled([
      intangibleInspectionApi.getList({ page: 0, size: 1000 }),
      intangibleInspectionApi.getStatistics(),
    ])

    if (listResult.status === 'rejected') {
      inspections.value = []
      loadError.value = '전수조사 목록을 불러오지 못했습니다.'
    } else {
      const content = listResult.value.data.content
      const rows = Array.isArray(content) ? content.map(toInspectionRow) : []
      inspections.value = await Promise.all(rows.map(hydrateDetailCounts))
    }

    statistics.value = statisticsResult.status === 'fulfilled'
      ? statisticsResult.value.data
      : {}
    currentPage.value = 0
  } catch {
    inspections.value = []
    statistics.value = {}
    loadError.value = '전수조사 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadInspectionData)
</script>
