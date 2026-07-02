<template>
  <BaseDrawer
    :is-open="isOpen"
    :title="mode === 'owned' ? '보유 자산 현황 상세' : '만료 예정 자산 현황 상세'"
    panel-class="w-full max-w-6xl"
    body-class="p-0"
    hide-footer
    @close="emit('close')"
  >
    <div class="flex h-full min-h-0 flex-col">
      <div class="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap gap-2">
          <div
            v-if="mode === 'owned'"
            class="flex flex-wrap gap-2"
            aria-label="자산 구분"
          >
            <Button
              v-for="option in OWNED_ASSET_TYPE_OPTIONS"
              :key="option.value"
              :variant="selectedAssetType === option.value ? 'primary' : 'outline'"
              size="md"
              class="text-sm!"
              @click="selectAssetType(option.value)"
            >
              {{ option.label }}
            </Button>
          </div>

          <div
            v-if="mode === 'owned'"
            class="ml-1 flex flex-wrap gap-2 border-l border-border pl-3"
            aria-label="보유 상태"
          >
            <Button
              v-for="option in modeOptions"
              :key="option.value"
              :variant="selectedOption === option.value ? 'secondary' : 'outline'"
              size="md"
              class="text-sm!"
              @click="selectOption(option.value)"
            >
              {{ option.label }}
            </Button>
          </div>

          <div v-else class="flex flex-wrap gap-2" aria-label="자산 구분">
            <Button
              v-for="option in modeOptions"
              :key="option.value"
              :variant="selectedOption === option.value ? 'primary' : 'outline'"
              size="md"
              class="text-sm!"
              @click="selectOption(option.value)"
            >
              {{ option.label }}
            </Button>
          </div>
        </div>

        <div class="flex gap-2">
          <Input
            id="dashboard-asset-detail-keyword"
            v-model="keyword"
            class="w-58!"
            placeholder="자산명, 코드, 사용자 검색"
            @keyup.enter="handleSearch"
          />
          <Button :loading="isLoading" @click="handleSearch">검색</Button>
        </div>
      </div>

      <div class="flex shrink-0 items-center justify-between px-5 py-3 text-xs text-text-sub">
        <span>총 {{ totalElements.toLocaleString() }}건</span>
        <Button variant="secondary" size="sm" :disabled="isLoading" @click="loadDetails">
          <RefreshCw :size="14" />
          새로고침
        </Button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <p
          v-if="errorMessage"
          class="mb-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>

        <Table
          :columns="columns"
          :rows="rows"
          row-key="id"
          :loading="isLoading"
          empty-text="조건에 맞는 자산이 없습니다."
        >
          <template #cell-kind="{ value }">
            <span class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
              {{ value }}
            </span>
          </template>
          <template #cell-date="{ value }">
            {{ formatDateTime(String(value ?? '')) }}
          </template>
          <template #cell-note="{ value }">
            <span :class="noteClass(value)">
              {{ noteText(value) }}
            </span>
          </template>
        </Table>
      </div>

      <div
        v-if="totalElements > 0"
        class="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-5 py-3"
      >
        <span class="text-xs text-text-sub">{{ rangeText }}</span>
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="isLoading"
          @change="changePage"
        />
        <span aria-hidden="true" />
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Pagination from '@/components/common/Pagination.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { dashboardApi } from '@/api/dashboard.api'
import { ApiError } from '@/api/client'
import type {
  ExpiringAssetDetail,
  OwnedAssetDetail,
  OwnedAssetDetailStatus,
} from '@/types'

type DrawerMode = 'owned' | 'expiring'
type ExpiringAssetType = 'ALL' | 'TANGIBLE' | 'INTANGIBLE'
const PAGE_SIZE = 20

interface DetailRow extends Record<string, unknown> {
  id: string
  kind: string
  name: string
  code: string
  category: string
  owner: string
  department: string
  ownerDepartment: string
  date: string
  note: number | string
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  mode: DrawerMode
  departmentId?: string
  initialOwnedStatus?: OwnedAssetDetailStatus
  initialAssetType?: ExpiringAssetType
  showUnassigned?: boolean
}>(), {
  departmentId: undefined,
  initialOwnedStatus: 'UNASSIGNED',
  initialAssetType: 'ALL',
  showUnassigned: true,
})

const emit = defineEmits<{
  close: []
}>()

const OWNED_STATUS_OPTIONS: Array<{ label: string; value: OwnedAssetDetailStatus }> = [
  { label: '미배정', value: 'UNASSIGNED' },
  { label: '배정 예정', value: 'RENTAL_SCHEDULED' },
  { label: '보유 중', value: 'RENTED' },
  { label: '연체', value: 'OVERDUE' },
]

const OWNED_ASSET_TYPE_OPTIONS: Array<{ label: string; value: Exclude<ExpiringAssetType, 'ALL'> }> = [
  { label: '유형자산', value: 'TANGIBLE' },
  { label: '무형자산', value: 'INTANGIBLE' },
]

const EXPIRING_TYPE_OPTIONS: Array<{ label: string; value: ExpiringAssetType }> = [
  { label: '전체', value: 'ALL' },
  { label: '유형자산', value: 'TANGIBLE' },
  { label: '무형자산', value: 'INTANGIBLE' },
]

const baseColumns: Column<DetailRow>[] = [
  { key: 'kind', label: '자산 구분', width: '10%', align: 'center' },
  { key: 'name', label: '자산명', width: '17%', align: 'center', maxLines: 2 },
  { key: 'code', label: '자산코드', width: '15%', align: 'center' },
  { key: 'category', label: '카테고리', width: '11%', align: 'center' },
  { key: 'ownerDepartment', label: '사용자(부서)', width: '12%', align: 'center' },
  { key: 'date', label: '만료/반납 예정일', width: '8%', align: 'center' },
  { key: 'note', label: '잔여/연체', width: '8%', align: 'center' },
]

const selectedOwnedStatus = ref<OwnedAssetDetailStatus>('UNASSIGNED')
const selectedAssetType = ref<ExpiringAssetType>('ALL')
const keyword = ref('')
const rows = ref<DetailRow[]>([])
const totalElements = ref(0)
const currentPage = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
let detailRequestSequence = 0

const modeOptions = computed(() => (
  props.mode === 'owned'
    ? OWNED_STATUS_OPTIONS.filter((option) => props.showUnassigned || option.value !== 'UNASSIGNED')
    : EXPIRING_TYPE_OPTIONS
))
const columns = computed<Column<DetailRow>[]>(() => {
  if (props.mode === 'owned' && selectedOwnedStatus.value === 'UNASSIGNED') {
    return baseColumns
      .filter((column) => column.key !== 'ownerDepartment' && column.key !== 'date')
      .map((column) => (
        column.key === 'note' ? { ...column, label: '배정 가능/전체' } : column
      ))
  }

  return baseColumns
})
const selectedOption = computed(() => (
  props.mode === 'owned' ? selectedOwnedStatus.value : selectedAssetType.value
))
const rangeText = computed(() => {
  if (totalElements.value === 0) return '0-0건'
  const start = currentPage.value * PAGE_SIZE + 1
  const end = Math.min(start + rows.value.length - 1, totalElements.value)
  return `${start.toLocaleString()}-${end.toLocaleString()}건`
})

watch(
  () => [props.isOpen, props.mode, props.initialOwnedStatus, props.initialAssetType],
  ([isOpen]) => {
    if (!isOpen) {
      detailRequestSequence += 1
      return
    }
    selectedOwnedStatus.value = props.initialOwnedStatus
    selectedAssetType.value = props.mode === 'owned' && props.initialAssetType === 'ALL'
      ? 'TANGIBLE'
      : props.initialAssetType
    keyword.value = ''
    currentPage.value = 0
    void loadDetails()
  },
)

function selectOption(value: string) {
  if (props.mode === 'owned') {
    const nextStatus = value as OwnedAssetDetailStatus
    if (selectedOwnedStatus.value === nextStatus) return
    selectedOwnedStatus.value = nextStatus
  } else {
    const nextType = value as ExpiringAssetType
    if (selectedAssetType.value === nextType) return
    selectedAssetType.value = nextType
  }
  currentPage.value = 0
  void loadDetails()
}

function selectAssetType(value: ExpiringAssetType) {
  if (selectedAssetType.value === value) return
  selectedAssetType.value = value
  currentPage.value = 0
  void loadDetails()
}

function changePage(page: number) {
  if (page < 0 || page >= totalPages.value || page === currentPage.value) return
  currentPage.value = page
  void loadDetails()
}

function handleSearch() {
  currentPage.value = 0
  void loadDetails()
}

async function loadDetails() {
  if (!props.isOpen) return

  const requestSequence = ++detailRequestSequence
  const mode = props.mode
  const ownedStatus = selectedOwnedStatus.value
  const assetType = selectedAssetType.value
  const departmentId = props.departmentId
  const searchKeyword = keyword.value.trim() || undefined
  const page = currentPage.value

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (mode === 'owned') {
      const response = await dashboardApi.getOwnedAssetDetails({
        status: ownedStatus,
        assetType: assetType === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE',
        departmentId,
        keyword: searchKeyword,
        page,
        size: PAGE_SIZE,
      })
      if (requestSequence !== detailRequestSequence) return

      const requestedAssetType = assetType === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE'
      const filteredContent = response.data.content.filter((item) => item.assetType === requestedAssetType)
      const hasMismatchedType = filteredContent.length !== response.data.content.length

      rows.value = filteredContent.map((item) => toOwnedRow(item, ownedStatus))
      totalElements.value = hasMismatchedType ? filteredContent.length : response.data.totalElements
      totalPages.value = hasMismatchedType
        ? Math.max(Math.ceil(filteredContent.length / PAGE_SIZE), 1)
        : Math.max(response.data.totalPages, 1)
      return
    }

    const response = await dashboardApi.getExpiringAssetDetails({
      assetType: assetType === 'ALL' ? undefined : assetType,
      departmentId,
      keyword: searchKeyword,
      page,
      size: PAGE_SIZE,
    })
    if (requestSequence !== detailRequestSequence) return

    rows.value = response.data.content.map(toExpiringRow)
    totalElements.value = response.data.totalElements
    totalPages.value = Math.max(response.data.totalPages, 1)
  } catch (error) {
    if (requestSequence !== detailRequestSequence) return

    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
    errorMessage.value = error instanceof ApiError && error.status === 403
      ? '현재 계정에는 자산 상세 조회 권한이 없습니다.'
      : '자산 상세 정보를 불러오지 못했습니다.'
  } finally {
    if (requestSequence === detailRequestSequence) {
      isLoading.value = false
    }
  }
}

function toOwnedRow(item: OwnedAssetDetail, status: OwnedAssetDetailStatus): DetailRow {
  const owner = ownedAssetOwnerText(item, status)
  const department = textValue(item.departmentName) || '부서 미지정'

  return {
    id: item.assetId,
    kind: item.assetType === 'TANGIBLE'
      ? '유형자산'
      : item.assetType === 'INTANGIBLE'
        ? '무형자산'
        : OWNED_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status,
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: textValue(item.categoryName) || '-',
    owner,
    department,
    ownerDepartment: ownerDepartmentText(owner, department),
    date: textValue(item.dueDate),
    note: status === 'UNASSIGNED'
      ? `${item.availableSeatCount ?? 1}/${item.seatCount ?? 1}`
      : item.overdueDays ?? item.dayCount ?? 0,
  }
}

function ownedAssetOwnerText(item: OwnedAssetDetail, status: OwnedAssetDetailStatus) {
  const owner = textValue(item.renterName)
  if (owner) return owner
  if (status === 'UNASSIGNED') return '미배정'
  if (status === 'RENTAL_SCHEDULED') return '배정 예정'
  return '사용자 없음'
}

function toExpiringRow(item: ExpiringAssetDetail): DetailRow {
  const owner = textValue(item.userName) || '-'
  const department = textValue(item.departmentName) || '-'

  return {
    id: item.assetId,
    kind: item.assetType === 'TANGIBLE' ? '유형자산' : '무형자산',
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: item.categoryOrProvider ?? item.manufacturer ?? item.issuer ?? '-',
    owner,
    department,
    ownerDepartment: ownerDepartmentText(owner, department),
    date: item.expiredAt,
    note: item.remainingDays,
  }
}

function ownerDepartmentText(owner: string, department: string) {
  if (owner === '-' && department === '-') return '-'
  if (owner === '-') return department
  if (department === '-') return owner
  return `${owner}(${department})`
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function noteText(value: unknown) {
  if (props.mode === 'owned' && selectedOwnedStatus.value === 'UNASSIGNED') {
    return typeof value === 'string' ? value : '-'
  }

  const numericValue = Number(value)
  if (props.mode === 'owned') {
    if (selectedOwnedStatus.value === 'OVERDUE') return numericValue > 0 ? `${numericValue}일 연체` : '연체'
    return numericValue > 0 ? `D-${numericValue}` : '-'
  }
  if (numericValue === 0) return 'D-Day'
  return numericValue > 0 ? `D-${numericValue}` : `D+${Math.abs(numericValue)}`
}

function noteClass(value: unknown) {
  if (props.mode === 'owned' && selectedOwnedStatus.value === 'UNASSIGNED') {
    return 'font-semibold text-text-main'
  }
  return Number(value) > 0 ? 'font-semibold text-danger' : 'text-text-sub'
}

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

</script>
