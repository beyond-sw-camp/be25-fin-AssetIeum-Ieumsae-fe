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
            <span :class="Number(value) > 0 ? 'font-semibold text-danger' : 'text-text-sub'">
              {{ noteText(Number(value)) }}
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
import { intangibleAssetApi, tangibleAssetApi } from '@/api/asset.api'
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
  note: number
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
  { label: '대여 예정', value: 'RENTAL_SCHEDULED' },
  { label: '대여 중', value: 'RENTED' },
  { label: '연체', value: 'OVERDUE' },
]

const EXPIRING_TYPE_OPTIONS: Array<{ label: string; value: ExpiringAssetType }> = [
  { label: '전체', value: 'ALL' },
  { label: '유형자산', value: 'TANGIBLE' },
  { label: '무형자산', value: 'INTANGIBLE' },
]

const baseColumns: Column<DetailRow>[] = [
  { key: 'name', label: '자산명', width: '18%', align: 'center', maxLines: 2 },
  { key: 'code', label: '자산코드', width: '15%', align: 'center' },
  { key: 'category', label: '카테고리', width: '11%', align: 'center' },
  { key: 'ownerDepartment', label: '사용자(부서)', width: '18%', align: 'center' },
  { key: 'date', label: '만료/반납 예정일', width: '13%', align: 'center' },
  { key: 'note', label: '잔여/연체', width: '15%', align: 'center' },
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

const modeOptions = computed(() => (
  props.mode === 'owned'
    ? OWNED_STATUS_OPTIONS.filter((option) => props.showUnassigned || option.value !== 'UNASSIGNED')
    : EXPIRING_TYPE_OPTIONS
))
const columns = computed<Column<DetailRow>[]>(() => {
  if (props.mode === 'owned' && selectedOwnedStatus.value === 'UNASSIGNED') {
    return baseColumns.filter((column) => column.key !== 'ownerDepartment')
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
    if (!isOpen) return
    selectedOwnedStatus.value = props.initialOwnedStatus
    selectedAssetType.value = props.initialAssetType
    keyword.value = ''
    currentPage.value = 0
    void loadDetails()
  },
)

function selectOption(value: string) {
  if (props.mode === 'owned') {
    selectedOwnedStatus.value = value as OwnedAssetDetailStatus
  } else {
    selectedAssetType.value = value as ExpiringAssetType
  }
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

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (props.mode === 'owned') {
      const response = await dashboardApi.getOwnedAssetDetails({
        status: selectedOwnedStatus.value,
        departmentId: props.departmentId,
        keyword: keyword.value.trim() || undefined,
        page: currentPage.value,
        size: PAGE_SIZE,
      })
      rows.value = response.data.content.map((item) => toOwnedRow(item, selectedOwnedStatus.value))
      totalElements.value = response.data.totalElements
      totalPages.value = Math.max(response.data.totalPages, 1)
      return
    }

    const assetTypes = selectedAssetType.value === 'ALL'
      ? ['TANGIBLE', 'INTANGIBLE'] as const
      : [selectedAssetType.value]
    if (assetTypes.length === 1) {
      const response = await dashboardApi.getExpiringAssetDetails({
        assetType: assetTypes[0],
        departmentId: props.departmentId,
        keyword: keyword.value.trim() || undefined,
        page: currentPage.value,
        size: PAGE_SIZE,
      })
      rows.value = await Promise.all(response.data.content.map(toExpiringRow))
      totalElements.value = response.data.totalElements
      totalPages.value = Math.max(response.data.totalPages, 1)
      return
    }

    const detailGroups = await Promise.all(assetTypes.map(loadAllExpiringDetails))
    const allRows = (await Promise.all(detailGroups.flat().map(toExpiringRow)))
      .sort((a, b) => a.date.localeCompare(b.date))
    totalElements.value = allRows.length
    totalPages.value = Math.max(Math.ceil(allRows.length / PAGE_SIZE), 1)
    const start = currentPage.value * PAGE_SIZE
    rows.value = allRows.slice(start, start + PAGE_SIZE)
  } catch (error) {
    rows.value = []
    totalElements.value = 0
    totalPages.value = 1
    errorMessage.value = error instanceof ApiError && error.status === 403
      ? '현재 계정에는 자산 상세 조회 권한이 없습니다.'
      : '자산 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function loadAllExpiringDetails(assetType: 'TANGIBLE' | 'INTANGIBLE') {
  const params = {
    assetType,
    departmentId: props.departmentId,
    keyword: keyword.value.trim() || undefined,
    size: 100,
  }
  const firstResponse = await dashboardApi.getExpiringAssetDetails({ ...params, page: 0 })
  const remainingPages = Array.from(
    { length: Math.max(firstResponse.data.totalPages - 1, 0) },
    (_, index) => index + 1,
  )
  const remainingResponses = await Promise.all(
    remainingPages.map((page) => dashboardApi.getExpiringAssetDetails({ ...params, page })),
  )

  return [
    ...firstResponse.data.content,
    ...remainingResponses.flatMap((response) => response.data.content),
  ]
}

function toOwnedRow(item: OwnedAssetDetail, status: OwnedAssetDetailStatus): DetailRow {
  const owner = ownedAssetOwnerText(item, status)
  const department = textValue(item.departmentName) || '부서 미지정'

  return {
    id: item.assetId,
    kind: OWNED_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status,
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: textValue(item.categoryOrProvider, item.categoryName) || '-',
    owner,
    department,
    ownerDepartment: ownerDepartmentText(owner, department),
    date: textValue(item.returnDueDate, item.dueDate, item.warrantyExpiredAt),
    note: item.overdueDays ?? item.dayCount ?? 0,
  }
}

function ownedAssetOwnerText(item: OwnedAssetDetail, status: OwnedAssetDetailStatus) {
  const owner = textValue(item.renterName, item.userName, item.currentUserInfo)
  if (owner) return owner
  if (status === 'UNASSIGNED') return '미배정'
  if (status === 'RENTAL_SCHEDULED') return '대여 예정'
  return '사용자 없음'
}

async function toExpiringRow(item: ExpiringAssetDetail): Promise<DetailRow> {
  const itemRecord = item as ExpiringAssetDetail & Record<string, unknown>
  const assignment = await loadActiveAssignmentInfo(item)
  const memberRecord = recordValue(
    itemRecord.assignedMember
    ?? itemRecord.member
    ?? itemRecord.user
    ?? itemRecord.currentUser
    ?? itemRecord.renter,
  )
  const departmentRecord = recordValue(
    itemRecord.department
    ?? itemRecord.assignedDepartment
    ?? itemRecord.currentDepartment
    ?? itemRecord.ownerDepartment
    ?? memberRecord?.department,
  )
  const owner = textValue(
    item.userName,
    assignment.owner,
    item.assignedMemberName,
    item.assignedUserName,
    item.currentUserName,
    item.memberName,
    item.renterName,
    itemRecord.assigneeName,
    itemRecord.ownerName,
    memberRecord?.name,
    memberRecord?.memberName,
    memberRecord?.userName,
    memberRecord?.employeeName,
  ) || '-'
  const department = textValue(
    item.departmentName,
    assignment.department,
    item.assignedDepartmentName,
    item.currentDepartmentName,
    item.ownerDepartmentName,
    itemRecord.deptName,
    itemRecord.teamName,
    departmentRecord?.departmentName,
    departmentRecord?.name,
    departmentRecord?.deptName,
    departmentRecord?.teamName,
    memberRecord?.departmentName,
    memberRecord?.deptName,
    memberRecord?.teamName,
  ) || '-'

  return {
    id: item.assetId,
    kind: item.assetType === 'TANGIBLE' ? '유형자산' : '무형자산',
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: item.manufacturer ?? item.issuer ?? '-',
    owner,
    department,
    ownerDepartment: ownerDepartmentText(owner, department),
    date: item.expiredAt,
    note: item.remainingDays,
  }
}

async function loadActiveAssignmentInfo(item: ExpiringAssetDetail) {
  if ((item.userName && item.departmentName) || !item.assetId) {
    return { owner: '', department: '' }
  }

  try {
    const response = item.assetType === 'TANGIBLE'
      ? await tangibleAssetApi.getAssignments(item.assetId, { assignmentStatus: 'ACTIVE' })
      : await intangibleAssetApi.getAssignments(item.assetId, { assignmentStatus: 'ACTIVE' })
    const activeAssignment = response.data.find(isActiveAssignment) ?? response.data[0]
    const record = activeAssignment as Record<string, unknown> | undefined

    return {
      owner: textValue(
        activeAssignment?.memberName,
        record?.userName,
        record?.assignedMemberName,
        record?.assigneeName,
      ),
      department: textValue(
        activeAssignment?.departmentName,
        record?.assignedDepartmentName,
        record?.departmentName,
        recordValue(record?.department)?.name,
        recordValue(record?.member)?.departmentName,
        recordValue(recordValue(record?.member)?.department)?.name,
      ),
    }
  } catch (error) {
    console.warn('만료 예정 자산 배정 정보 조회 실패', {
      assetType: item.assetType,
      assetId: item.assetId,
      error,
    })
    return { owner: '', department: '' }
  }
}

function isActiveAssignment(assignment: { assignmentStatus?: string }) {
  return assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'
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

function noteText(value: number) {
  if (props.mode === 'owned') {
    if (selectedOwnedStatus.value === 'OVERDUE') return value > 0 ? `${value}일 연체` : '연체'
    if (selectedOwnedStatus.value === 'UNASSIGNED') return value > 0 ? `D-${value}` : '-'
    return value > 0 ? `D-${value}` : '-'
  }
  if (value === 0) return 'D-Day'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}
</script>
