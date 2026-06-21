<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          ASSET ITEM
        </p>
        <h1 class="page-title">
          유형자산 전수조사
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

    <section class="grid shrink-0 grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-lg border border-border bg-surface p-5"
      >
        <p class="text-sm font-bold text-text-main">
          {{ card.label }}
        </p>
        <p class="mt-4 text-3xl font-bold text-text-main">
          {{ card.value }}건
        </p>
        <div class="mt-5 grid grid-cols-3 gap-2 text-xs">
          <div v-for="item in card.items" :key="item.label">
            <p class="font-semibold text-text-main">
              {{ item.label }}
            </p>
            <p class="mt-2 font-bold text-text-sub">
              {{ item.value }}건
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
            @update:model-value="handlePageSizeChange"
          />
          <span class="w-full text-xs text-text-sub">
            총 {{ filteredRows.length }}건 중 {{ rangeText }}
          </span>
        </div>

        <div class="flex justify-end gap-2">
          <Dropdown
            v-model="filters.status"
            :options="statusFilterOptions"
            menu-strategy="fixed"
            menu-align="right"
            class="w-35!"
          />
          <Dropdown
            v-model="filters.inspector"
            :options="inspectorFilterOptions"
            menu-strategy="fixed"
            class="w-40!"
            menu-align="right"
          />
          <Input
            id="inspection-keyword"
            v-model="filters.keyword"
            class="w-40!"
            placeholder="조사 대상 검색"
            @keyup.enter="applySearch"
          />
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
          row-key="inspectionId"
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

    <TangibleInspectionRegister
      :is-open="isRegisterDrawerOpen"
      @close="closeRegisterDrawer"
      @registered="handleInspectionRegistered"
    />

    <TangibleInspectionDetail
      :is-open="Boolean(selectedInspection)"
      :inspection="selectedInspection"
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
import TangibleInspectionDetail from '@/components/inspection/tangible/TangibleInspectionDetail.vue'
import TangibleInspectionRegister from '@/components/inspection/tangible/TangibleInspectionRegister.vue'
import { tangibleInspectionApi } from '@/api/inspection.api'
import { usePermission } from '@/composables'
import type { DropdownOption } from '@/types'
import type { InspectionSearchResponse, InspectionStatisticsResponse, InspectionStatus, InspectorType } from '@/types/inspection'

type TangibleInspectionStatus = InspectionStatus

interface TangibleInspectionRow extends Record<string, unknown> {
  inspectionId: string
  targetName: string
  executor: string
  status: TangibleInspectionStatus
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

const STATUS_LABEL: Record<TangibleInspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const { hasRole } = usePermission()

const inspections = ref<TangibleInspectionRow[]>([])
const statistics = ref<InspectionStatisticsResponse | null>(null)
const selectedInspection = ref<TangibleInspectionRow | null>(null)
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
  hasRole('ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER')
))

const columns: Column<TangibleInspectionRow>[] = [
  { key: 'targetName', label: '조사 대상', width: '18%' },
  { key: 'executor', label: '조사 방식', width: '16%' },
  { key: 'status', label: '조사 상태', width: '16%' },
  { key: 'inspectorName', label: '조사 수행자', width: '22%' },
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
  { label: '- 조사 수행자 -', value: '' },
  ...Array.from(new Set(inspections.value.map((item) => item.inspectorName))).map((name) => ({
    label: name,
    value: name,
  })),
])

const emptyText = computed(() => loadError.value || '등록된 유형자산 전수조사가 없습니다.')

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
  const ready = numberValue(statistics.value?.readyCount, statistics.value?.ready_count)
    ?? rows.filter((item) => item.status === 'READY').length
  const inProgress = numberValue(statistics.value?.inProgressCount, statistics.value?.in_progress_count)
    ?? rows.filter((item) => item.status === 'IN_PROGRESS').length
  const completed = numberValue(statistics.value?.completedCount, statistics.value?.completed_count)
    ?? rows.filter((item) => item.status === 'COMPLETED').length
  const closed = numberValue(statistics.value?.closedCount, statistics.value?.closed_count)
    ?? rows.filter((item) => item.status === 'CLOSED').length
  const targetAssets = numberValue(statistics.value?.targetAssetCount, statistics.value?.target_asset_count)
    ?? rows.reduce((sum, item) => sum + item.targetAssetCount, 0)
  const completedAssets = numberValue(statistics.value?.inspectedAssetCount, statistics.value?.inspected_asset_count)
    ?? rows.reduce((sum, item) => sum + item.completedAssetCount, 0)
  const followUps = numberValue(statistics.value?.followUpRequiredCount, statistics.value?.follow_up_required_count)
    ?? rows.reduce((sum, item) => sum + item.followUpCount, 0)
  const totalCount = numberValue(
    statistics.value?.totalCount,
    statistics.value?.total_count,
    statistics.value?.totalInspectionCount,
    statistics.value?.total_inspection_count,
    statistics.value?.total,
  ) ?? rows.length

  return [
    {
      label: '전체 전수조사 현황',
      value: totalCount,
      items: [
        { label: '진행 전', value: ready },
        { label: '진행 중', value: inProgress },
        { label: '완료', value: completed },
      ],
    },
    {
      label: '진행 중인 전수조사',
      value: inProgress,
      items: [
        { label: '조사 대상 자산', value: targetAssets },
        { label: '응답 완료 자산', value: completedAssets },
        { label: '후속 처리', value: followUps },
      ],
    },
    {
      label: '완료된 전수조사',
      value: completed,
      items: [
        { label: '조사 완료 자산', value: completedAssets },
        { label: '후속 처리 완료', value: closed },
        { label: '미처리', value: followUps },
      ],
    },
    {
      label: '미처리 자산',
      value: rows.reduce((sum, item) => sum + Math.max(item.targetAssetCount - item.completedAssetCount, 0), 0),
      items: [
        { label: '조사 대상 자산', value: targetAssets },
        { label: '응답 완료', value: completedAssets },
        { label: '미응답', value: targetAssets - completedAssets },
      ],
    },
    {
      label: '후속 처리 중',
      value: followUps,
      items: [
        { label: '처리 대기', value: Math.max(followUps - closed, 0) },
        { label: '처리 완료', value: closed },
        { label: '전체 후속', value: followUps },
      ],
    },
  ]
})

function statusBadgeClass(status: TangibleInspectionStatus) {
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

function openDetailDrawer(row: TangibleInspectionRow) {
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

function numberValue(...values: Array<number | undefined>) {
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

function toInspectionRow(item: InspectionSearchResponse, index: number): TangibleInspectionRow {
  const status = item.inspectionStatus ?? item.inspection_status ?? item.status ?? 'READY'
  const inspectorType = item.inspectorType ?? item.inspector_type
  const inspectorName = textValue(item.inspectorName, item.inspector_name)

  return {
    inspectionId: textValue(item.inspectionId, item.inspection_id) || `inspection-${index}`,
    targetName: textValue(item.targetName, item.target_name) || '조사 대상',
    executor: getInspectorTypeLabel(inspectorType),
    status,
    inspectorDepartment: '-',
    inspectorName: inspectorName || '-',
    startDate: textValue(item.startDate, item.start_date),
    endDate: textValue(item.endDate, item.end_date),
    targetAssetCount: numberValue(item.targetAssetCount, item.target_asset_count) ?? 0,
    completedAssetCount: numberValue(
      item.inspectedAssetCount,
      item.inspected_asset_count,
      item.completedAssetCount,
      item.completed_asset_count,
    ) ?? 0,
    followUpCount: numberValue(item.followUpRequiredCount, item.follow_up_required_count) ?? 0,
    description: item.description ?? '',
  }
}

async function loadInspectionData() {
  isLoading.value = true
  loadError.value = ''

  try {
    const [listResult, statisticsResult] = await Promise.allSettled([
      tangibleInspectionApi.getList({ page: 0, size: 1000 }),
      tangibleInspectionApi.getStatistics(),
    ])

    if (listResult.status === 'fulfilled') {
      const content = listResult.value.data.content
      inspections.value = Array.isArray(content) ? content.map(toInspectionRow) : []
      currentPage.value = 0
    } else {
      inspections.value = []
      loadError.value = '전수조사 목록을 불러오지 못했습니다.'
    }

    statistics.value = statisticsResult.status === 'fulfilled'
      ? statisticsResult.value.data
      : null
  } finally {
    isLoading.value = false
  }
}

onMounted(loadInspectionData)
</script>
