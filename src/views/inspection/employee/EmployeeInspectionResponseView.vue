<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">ASSET ITEM</p>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </header>

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

        <div class="flex flex-wrap justify-end gap-2">
          <div class="w-36 shrink-0">
            <Dropdown
              v-model="filters.status"
              :options="statusFilterOptions"
              menu-strategy="fixed"
              menu-align="right"
            />
          </div>
          <div class="w-36 shrink-0">
            <Dropdown
              v-model="filters.responded"
              :options="respondedFilterOptions"
              menu-strategy="fixed"
              menu-align="right"
            />
          </div>
          <div class="w-52 shrink-0">
            <Input
              :id="`${props.assetType}-inspection-keyword`"
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
          row-key="inspectionId"
          :loading="isLoading"
          :empty-text="emptyText"
        >
          <template #cell-targetName="{ row }">
            <div>
              <p class="font-semibold text-text-main">{{ row.targetName }}</p>
              <p class="mt-1 text-xs text-text-muted">대상 자산 {{ row.assetCount }}개</p>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span :class="statusBadgeClass(row.status)">
              {{ STATUS_LABEL[row.status] }}
            </span>
          </template>

          <template #cell-responseStatus="{ row }">
            <span :class="row.respondedCount === row.assetCount ? 'badge-success' : 'badge-warning'">
              {{ row.respondedCount }}/{{ row.assetCount }} 응답
            </span>
          </template>

          <template #cell-startDate="{ value: startDate }">
            <span>{{ formatDate(startDate as string) }}</span>
          </template>

          <template #cell-endDate="{ value: endDate }">
            <span>{{ formatDate(endDate as string) }}</span>
          </template>
        </Table>
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border px-4 py-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="currentPage === 0"
            aria-label="이전 페이지"
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
            aria-label="다음 페이지"
            @click="changePage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { intangibleInspectionApi, tangibleInspectionApi } from '@/api/inspection.api'
import type { DropdownOption } from '@/types'
import type { EmployeeInspectionTargetResponse, InspectionStatus } from '@/types/inspection'

interface EmployeeInspectionRow extends Record<string, unknown> {
  inspectionId: string
  targetName: string
  executor: string
  status: InspectionStatus
  responseStatus: string
  assetCount: number
  respondedCount: number
  startDate: string
  endDate: string
}

const props = withDefaults(defineProps<{
  assetType?: 'tangible' | 'intangible'
}>(), {
  assetType: 'tangible',
})

const inspections = ref<EmployeeInspectionRow[]>([])
const isLoading = ref(false)
const loadError = ref('')
const currentPage = ref(0)
const pageSize = ref(10)

const filters = reactive({
  status: '',
  responded: '',
  keyword: '',
})

const appliedFilters = reactive({
  status: '',
  responded: '',
  keyword: '',
})

const inspectionApi = computed(() => (
  props.assetType === 'intangible' ? intangibleInspectionApi : tangibleInspectionApi
))
const pageTitle = computed(() => (
  props.assetType === 'intangible' ? '무형자산 전수조사' : '유형자산 전수조사'
))
const emptyText = computed(() => (
  loadError.value || `배정된 ${props.assetType === 'intangible' ? '무형자산' : '유형자산'} 전수조사가 없습니다.`
))

const STATUS_LABEL: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const columns: Column<EmployeeInspectionRow>[] = [
  { key: 'targetName', label: '조사 대상', width: '24%' },
  { key: 'executor', label: '조사 방식', width: '16%' },
  { key: 'status', label: '조사 상태', width: '15%' },
  { key: 'responseStatus', label: '응답 현황', width: '17%' },
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

const respondedFilterOptions: DropdownOption[] = [
  { label: '- 응답 여부 -', value: '' },
  { label: '응답 대기', value: 'pending' },
  { label: '응답 완료', value: 'completed' },
]

const filteredRows = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return inspections.value.filter((inspection) => {
    const isCompleted = inspection.respondedCount === inspection.assetCount
    const matchesStatus = !appliedFilters.status || inspection.status === appliedFilters.status
    const matchesResponded = !appliedFilters.responded
      || (appliedFilters.responded === 'completed' ? isCompleted : !isCompleted)
    const matchesKeyword = !keyword
      || inspection.targetName.toLowerCase().includes(keyword)

    return matchesStatus && matchesResponded && matchesKeyword
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

function textValue(...values: unknown[]) {
  return values.find((value): value is string | number => (
    (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
  ))?.toString() ?? ''
}

function isResponded(target: EmployeeInspectionTargetResponse) {
  return target.isResponded === true || target.responded === true
}

function inspectionStatusValue(value: unknown): InspectionStatus {
  if (value === 'READY' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'CLOSED') {
    return value
  }
  return 'READY'
}

function targetLabel(targets: EmployeeInspectionTargetResponse[]) {
  const productNames = Array.from(new Set(
    targets.map((target) => textValue(target.productName, target.itemName)).filter(Boolean),
  ))
  if (productNames.length === 0) return '배정 자산'
  if (productNames.length === 1) return productNames[0] ?? '배정 자산'
  return `${productNames[0]} 외 ${productNames.length - 1}개 품목`
}

function toInspectionRows(targets: EmployeeInspectionTargetResponse[]) {
  const groupedTargets = new Map<string, EmployeeInspectionTargetResponse[]>()

  targets.forEach((target) => {
    const inspectionId = textValue(target.inspectionId)
    if (!inspectionId) return
    groupedTargets.set(inspectionId, [...(groupedTargets.get(inspectionId) ?? []), target])
  })

  return Array.from(groupedTargets.entries()).map(([inspectionId, inspectionTargets]) => {
    const firstTarget = inspectionTargets[0]
    const respondedCount = inspectionTargets.filter(isResponded).length

    return {
      inspectionId,
      targetName: targetLabel(inspectionTargets),
      executor: '소유자 응답',
      status: inspectionStatusValue(firstTarget?.inspectionStatus),
      responseStatus: '',
      assetCount: inspectionTargets.length,
      respondedCount,
      startDate: textValue(firstTarget?.startDate),
      endDate: textValue(firstTarget?.endDate),
    }
  })
}

function applySearch() {
  appliedFilters.status = filters.status
  appliedFilters.responded = filters.responded
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
  if (page < 0 || page >= totalPages.value) return
  currentPage.value = page
}

function statusBadgeClass(status: InspectionStatus) {
  if (status === 'READY') return 'badge-warning'
  if (status === 'IN_PROGRESS') return 'rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'
  if (status === 'COMPLETED') return 'badge-success'
  return 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function loadInspections() {
  isLoading.value = true
  loadError.value = ''
  try {
    const response = await inspectionApi.value.getMyTargets({ page: 0, size: 100 })
    const content = Array.isArray(response.data?.content) ? response.data.content : []
    inspections.value = toInspectionRows(content)
    currentPage.value = 0
  } catch {
    inspections.value = []
    loadError.value = '전수조사 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadInspections)
</script>
