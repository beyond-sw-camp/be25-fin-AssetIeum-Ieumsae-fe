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
          <button
            v-for="option in modeOptions"
            :key="option.value"
            type="button"
            :class="[
              'h-9 rounded-lg border px-3 text-sm font-semibold transition',
              selectedOption === option.value
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-text-sub hover:border-primary/40',
            ]"
            @click="selectOption(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="flex gap-2">
          <Input
            id="dashboard-asset-detail-keyword"
            v-model="keyword"
            class="w-56"
            placeholder="자산명, 코드, 사용자 검색"
            @keyup.enter="loadDetails"
          />
          <Button :loading="isLoading" @click="loadDetails">검색</Button>
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
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { dashboardApi } from '@/api/dashboard.api'
import type {
  ExpiringAssetDetail,
  OwnedAssetDetail,
  OwnedAssetDetailStatus,
} from '@/types'

type DrawerMode = 'owned' | 'expiring'
type ExpiringAssetType = 'ALL' | 'TANGIBLE' | 'INTANGIBLE'

interface DetailRow extends Record<string, unknown> {
  id: string
  kind: string
  name: string
  code: string
  category: string
  owner: string
  department: string
  date: string
  note: number
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  mode: DrawerMode
  departmentId?: string
  initialOwnedStatus?: OwnedAssetDetailStatus
  initialAssetType?: ExpiringAssetType
}>(), {
  departmentId: undefined,
  initialOwnedStatus: 'UNASSIGNED',
  initialAssetType: 'ALL',
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

const columns: Column<DetailRow>[] = [
  { key: 'kind', label: '구분', width: '11%' },
  { key: 'name', label: '자산명', width: '18%' },
  { key: 'code', label: '자산코드', width: '15%' },
  { key: 'category', label: '카테고리/공급자', width: '15%' },
  { key: 'owner', label: '사용자', width: '12%' },
  { key: 'department', label: '부서', width: '12%' },
  { key: 'date', label: '만료/반납 예정일', width: '13%' },
  { key: 'note', label: '잔여/연체', width: '10%', align: 'center' },
]

const selectedOwnedStatus = ref<OwnedAssetDetailStatus>('UNASSIGNED')
const selectedAssetType = ref<ExpiringAssetType>('ALL')
const keyword = ref('')
const rows = ref<DetailRow[]>([])
const totalElements = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

const modeOptions = computed(() => (
  props.mode === 'owned' ? OWNED_STATUS_OPTIONS : EXPIRING_TYPE_OPTIONS
))
const selectedOption = computed(() => (
  props.mode === 'owned' ? selectedOwnedStatus.value : selectedAssetType.value
))

watch(
  () => [props.isOpen, props.mode, props.initialOwnedStatus, props.initialAssetType],
  ([isOpen]) => {
    if (!isOpen) return
    selectedOwnedStatus.value = props.initialOwnedStatus
    selectedAssetType.value = props.initialAssetType
    keyword.value = ''
    void loadDetails()
  },
)

function selectOption(value: string) {
  if (props.mode === 'owned') {
    selectedOwnedStatus.value = value as OwnedAssetDetailStatus
  } else {
    selectedAssetType.value = value as ExpiringAssetType
  }
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
        page: 0,
        size: 1000,
      })
      rows.value = response.data.content.map((item) => toOwnedRow(item, selectedOwnedStatus.value))
      totalElements.value = response.data.totalElements
      return
    }

    const assetTypes = selectedAssetType.value === 'ALL'
      ? ['TANGIBLE', 'INTANGIBLE'] as const
      : [selectedAssetType.value]
    const responses = await Promise.all(
      assetTypes.map((assetType) => dashboardApi.getExpiringAssetDetails({
        assetType,
        departmentId: props.departmentId,
        keyword: keyword.value.trim() || undefined,
        page: 0,
        size: 1000,
      })),
    )
    rows.value = responses.flatMap((response) => response.data.content.map(toExpiringRow))
      .sort((a, b) => a.date.localeCompare(b.date))
    totalElements.value = responses.reduce((sum, response) => sum + response.data.totalElements, 0)
  } catch {
    rows.value = []
    totalElements.value = 0
    errorMessage.value = '자산 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function toOwnedRow(item: OwnedAssetDetail, status: OwnedAssetDetailStatus): DetailRow {
  return {
    id: item.assetId,
    kind: OWNED_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status,
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: item.categoryName || '-',
    owner: item.renterName || '-',
    department: item.departmentName || '-',
    date: item.returnDueDate ?? item.warrantyExpiredAt ?? '',
    note: item.overdueDays ?? 0,
  }
}

function toExpiringRow(item: ExpiringAssetDetail): DetailRow {
  return {
    id: item.assetId,
    kind: item.assetType === 'TANGIBLE' ? '유형자산' : '무형자산',
    name: item.assetName || '-',
    code: item.assetCode || '-',
    category: item.manufacturer ?? item.issuer ?? '-',
    owner: item.userName || '-',
    department: item.departmentName || '-',
    date: item.expiredAt,
    note: item.remainingDays,
  }
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
  if (props.mode === 'owned') return value > 0 ? `${value}일 연체` : '-'
  if (value === 0) return 'D-Day'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}
</script>
