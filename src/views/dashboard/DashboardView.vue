<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">대시보드</p>
        <h1 class="page-title">{{ dashboardTitle }}</h1>
      </div>
      <Button variant="outline" :loading="isLoading" @click="loadDashboardData">
        <RefreshCw :size="15" />
        새로고침
      </Button>
    </header>

    <main class="flex-1 overflow-y-auto px-3 pb-6">
      <div
        v-if="loadError"
        class="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ loadError }}
      </div>

      <section class="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProgressTicketCard :segments="progressTicketSegments" />
        <HoldingAssetCard
          :title="holdingAssetCardTitle"
          :segments="holdingAssetSegments"
          @click="openAssetDrawer('holding')"
        />
        <ExpiringAssetCard
          :tangible-count="expiringSummary.tangibleAssetCount"
          :intangible-count="expiringSummary.intangibleAssetCount"
          @click="openAssetDrawer('expiring')"
          @click-tangible="openAssetDrawer('expiring-tangible')"
          @click-intangible="openAssetDrawer('expiring-intangible')"
        />
      </section>

      <section class="mb-4">
        <AssetDemandTableCard :columns="demandColumns" :rows="demandRows" />
      </section>

      <section class="mb-4">
        <DepartmentBudgetSummaryCard
          v-if="isDepartmentManager"
          :summary="departmentBudget"
        />
        <DepartmentBudgetCard
          v-else
          :budget-rows="budgetRows"
          :total-budget-used="totalBudgetUsed"
          :total-budget-limit="totalBudgetLimit"
          :budget-usage-percent="budgetUsagePercent"
        />
      </section>

      <section v-if="isDepartmentManager || isAssetOperator" class="mb-4">
        <DepartmentLifecycleCard
          :events="departmentHrEvents"
        />
      </section>
    </main>

    <BaseDrawer
      :is-open="assetDrawerMode !== null"
      :title="assetDrawerTitle"
      panel-class="w-full max-w-5xl"
      body-class="p-5"
      hide-footer
      @close="assetDrawerMode = null"
    >
      <p class="mb-4 text-sm text-text-sub">
        총 {{ assetDrawerRows.length.toLocaleString() }}건
      </p>
      <Table
        :columns="assetDetailColumns"
        :rows="assetDrawerRows"
        row-key="id"
        empty-text="표시할 자산이 없습니다."
      >
        <template #cell-kind="{ value }">
          <span class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
            {{ value }}
          </span>
        </template>
        <template #cell-date="{ value }">
          {{ formatDate(value as string) }}
        </template>
      </Table>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import AssetDemandTableCard, { type DemandRow } from '@/components/dashboard/AssetDemandTableCard.vue'
import DepartmentBudgetCard, { type BudgetRow } from '@/components/dashboard/DepartmentBudgetCard.vue'
import DepartmentBudgetSummaryCard from '@/components/dashboard/DepartmentBudgetSummaryCard.vue'
import DepartmentLifecycleCard from '@/components/dashboard/DepartmentLifecycleCard.vue'
import ExpiringAssetCard from '@/components/dashboard/ExpiringAssetCard.vue'
import HoldingAssetCard from '@/components/dashboard/HoldingAssetCard.vue'
import ProgressTicketCard, { type DashboardSegment } from '@/components/dashboard/ProgressTicketCard.vue'
import { intangibleAssetApi, tangibleAssetApi } from '@/api/asset.api'
import { dashboardApi } from '@/api/dashboard.api'
import { useAuthStore } from '@/stores'
import { formatDate, INTANGIBLE_STATUS_LABEL, TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type {
  AssetDemand,
  BudgetOverview,
  DepartmentBudgetDetail,
  ExpiringAssetSummary,
  HrLifecycleEvent,
  IntangibleAsset,
  OwnedAssetSummary,
  TangibleAsset,
  TicketProgressSummary,
} from '@/types'

const EMPTY_TICKET_PROGRESS: TicketProgressSummary = {
  waitingReceipt: 0,
  receiptCompleted: 0,
  processing: 0,
  completed: 0,
}

const EMPTY_OWNED_ASSETS: OwnedAssetSummary = {
  unassigned: 0,
  rentalScheduled: 0,
  rented: 0,
  overdue: 0,
}

const EMPTY_EXPIRING_ASSETS: ExpiringAssetSummary = {
  tangibleAssetCount: 0,
  intangibleAssetCount: 0,
}

const EMPTY_DEPARTMENT_BUDGET: DepartmentBudgetDetail = {
  departmentName: '-',
  totalAmount: 0,
  usedAmount: 0,
  remainingAmount: 0,
  usageRate: 0,
  categoryUsages: [],
}

type AssetDrawerMode = 'holding' | 'expiring' | 'expiring-tangible' | 'expiring-intangible'

interface DashboardAssetRow extends Record<string, unknown> {
  id: string
  kind: '유형자산' | '무형자산'
  name: string
  code: string
  owner: string
  department: string
  status: string
  date: string
  isExpiring: boolean
}

const auth = useAuthStore()
const ticketProgress = ref<TicketProgressSummary>({ ...EMPTY_TICKET_PROGRESS })
const ownedAssets = ref<OwnedAssetSummary>({ ...EMPTY_OWNED_ASSETS })
const expiringSummary = ref<ExpiringAssetSummary>({ ...EMPTY_EXPIRING_ASSETS })
const assetDemands = ref<AssetDemand[]>([])
const budgetOverview = ref<BudgetOverview | null>(null)
const departmentBudget = ref<DepartmentBudgetDetail>({ ...EMPTY_DEPARTMENT_BUDGET })
const departmentHrEvents = ref<HrLifecycleEvent[]>([])
const dashboardAssets = ref<DashboardAssetRow[]>([])
const assetDrawerMode = ref<AssetDrawerMode | null>(null)
const isLoading = ref(false)
const loadError = ref('')

const role = computed(() => auth.user?.role ?? 'EMPLOYEE')
const isDepartmentManager = computed(() => role.value === 'DEPARTMENT_MANAGER')
const isAssetOperator = computed(() => (
  ['ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'].includes(role.value)
))
const dashboardTitle = computed(() => role.value === 'EMPLOYEE' ? '내 자산 대시보드' : '대시보드')
const holdingAssetCardTitle = computed(() => isDepartmentManager.value ? '자산 대여 현황' : '보유 자산 현황')

const assetDetailColumns: Column<DashboardAssetRow>[] = [
  { key: 'kind', label: '구분', width: '11%' },
  { key: 'name', label: '자산명', width: '20%' },
  { key: 'code', label: '자산 번호', width: '17%' },
  { key: 'owner', label: '사용자', width: '13%' },
  { key: 'department', label: '부서', width: '14%' },
  { key: 'status', label: '상태', width: '12%' },
  { key: 'date', label: '만료/반납 예정일', width: '13%' },
]

const assetDrawerTitle = computed(() => (
  assetDrawerMode.value === 'holding' ? `${holdingAssetCardTitle.value} 상세` : '만료 예정 자산 현황 상세'
))
const assetDrawerRows = computed(() => {
  if (assetDrawerMode.value === 'holding') return dashboardAssets.value
  if (assetDrawerMode.value === 'expiring-tangible') {
    return dashboardAssets.value.filter((item) => item.isExpiring && item.kind === '유형자산')
  }
  if (assetDrawerMode.value === 'expiring-intangible') {
    return dashboardAssets.value.filter((item) => item.isExpiring && item.kind === '무형자산')
  }
  return dashboardAssets.value.filter((item) => item.isExpiring)
})

function toSegments(items: Array<Omit<DashboardSegment, 'percent'>>): DashboardSegment[] {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    percent: total ? Math.round((item.count / total) * 100) : 0,
  }))
}

const progressTicketSegments = computed(() => toSegments([
  { label: '접수 대기', count: ticketProgress.value.waitingReceipt, barClass: 'bg-warning' },
  { label: '접수 완료', count: ticketProgress.value.receiptCompleted, barClass: 'bg-primary' },
  { label: '처리 중', count: ticketProgress.value.processing, barClass: 'bg-danger' },
  { label: '처리 완료', count: ticketProgress.value.completed, barClass: 'bg-success' },
]))

const holdingAssetSegments = computed(() => toSegments([
  { label: '미배정', count: ownedAssets.value.unassigned, barClass: 'bg-neutral-800' },
  { label: '대여 예정', count: ownedAssets.value.rentalScheduled, barClass: 'bg-warning' },
  { label: '대여 중', count: ownedAssets.value.rented, barClass: 'bg-success' },
  { label: '연체', count: ownedAssets.value.overdue, barClass: 'bg-danger' },
]))

const demandColumns = [
  { key: 'kind', label: '자산 구분', align: 'left' as const, width: '13%' },
  { key: 'name', label: '자산명', align: 'left' as const, width: '22%' },
  { key: 'expectedDemand', label: '예상 수요', align: 'center' as const, width: '13%' },
  { key: 'currentStock', label: '현재 재고', align: 'center' as const, width: '13%' },
  { key: 'returnExpected', label: '회수 예정', align: 'center' as const, width: '13%' },
  { key: 'availability', label: '가용률', align: 'center' as const, width: '13%' },
  { key: 'status', label: '상태', align: 'center' as const, width: '13%' },
]

const demandRows = computed<DemandRow[]>(() => assetDemands.value.map((item) => ({
  id: item.itemId,
  kind: item.assetType === 'TANGIBLE' ? '유형' : '무형',
  name: item.assetName,
  expectedDemand: item.expectedDemand,
  currentStock: item.currentInventory,
  returnExpected: item.scheduledReturn,
  availability: item.availabilityRate,
  status: item.status,
})))

const budgetRows = computed<BudgetRow[]>(() => (
  budgetOverview.value?.departmentBudgets.content.map((item) => ({
    department: item.departmentName,
    limit: item.totalAmount,
    used: item.usedAmount,
    percent: item.usageRate,
  })) ?? []
))

const totalBudgetLimit = computed(() => budgetOverview.value?.commonBudget?.totalAmount ?? 0)
const totalBudgetUsed = computed(() => {
  const commonBudget = budgetOverview.value?.commonBudget
  return commonBudget ? commonBudget.totalAmount - commonBudget.remainingAmount : 0
})
const budgetUsagePercent = computed(() => {
  const commonBudget = budgetOverview.value?.commonBudget
  return commonBudget ? Math.max(0, 100 - commonBudget.remainingRate) : 0
})

function openAssetDrawer(mode: AssetDrawerMode) {
  assetDrawerMode.value = mode
}

function isWithinNextDays(value: string | null | undefined, days: number) {
  if (!value) return false
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return false
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + days)
  return target >= now && target <= end
}

function toTangibleRow(asset: TangibleAsset, index: number): DashboardAssetRow {
  const status = asset.tangibleAssetStatus ?? asset.status ?? '-'
  return {
    id: String(asset.assetId ?? asset.tangibleAssetId ?? asset.id ?? `tangible-${index}`),
    kind: '유형자산',
    name: asset.productName ?? asset.assetItemName ?? '-',
    code: asset.assetCode || '-',
    owner: asset.currentUserName ?? asset.assignedMemberName ?? asset.memberName ?? '-',
    department: asset.departmentName ?? '-',
    status: TANGIBLE_STATUS_LABEL[status] ?? status,
    date: asset.warrantyExpiredAt ?? asset.returnDueDate ?? '',
    isExpiring: isWithinNextDays(asset.warrantyExpiredAt, 30),
  }
}

function toIntangibleRow(asset: IntangibleAsset, index: number): DashboardAssetRow {
  const status = asset.intangibleAssetStatus ?? asset.status ?? '-'
  return {
    id: String(asset.assetId || `intangible-${index}`),
    kind: '무형자산',
    name: asset.assetItemName || '-',
    code: asset.assetCode || '-',
    owner: asset.assignedMemberName ?? '-',
    department: asset.departmentName ?? '-',
    status: INTANGIBLE_STATUS_LABEL[status] ?? status,
    date: asset.expiredAt ?? '',
    isExpiring: isWithinNextDays(asset.expiredAt, 30),
  }
}

async function loadAssetDetails() {
  const departmentId = isDepartmentManager.value ? auth.user?.departmentId : undefined
  const currentUserId = role.value === 'EMPLOYEE' ? auth.user?.memberId : undefined
  const [tangibleResult, intangibleResult] = await Promise.allSettled([
    tangibleAssetApi.getList({ page: 0, size: 1000, departmentId, currentUserId }),
    intangibleAssetApi.getList({ page: 0, size: 1000, departmentId, currentUserId }),
  ])
  const tangibleRows = tangibleResult.status === 'fulfilled'
    ? tangibleResult.value.data.content.map(toTangibleRow)
    : []
  const intangibleRows = intangibleResult.status === 'fulfilled'
    ? intangibleResult.value.data.content.map(toIntangibleRow)
    : []
  dashboardAssets.value = [...tangibleRows, ...intangibleRows]
}

async function loadDashboardData() {
  isLoading.value = true
  loadError.value = ''

  try {
    const departmentId = auth.user?.departmentId
    const scope = isDepartmentManager.value && departmentId ? { departmentId } : undefined
    const [ticketResponse, ownedResponse, expiringResponse, demandResponse] = await Promise.all([
      dashboardApi.getTicketProgress(scope),
      dashboardApi.getOwnedAssets(scope),
      dashboardApi.getExpiringAssets(scope),
      dashboardApi.getAssetDemands({ page: 0, size: 100 }),
    ])

    ticketProgress.value = ticketResponse.data
    ownedAssets.value = ownedResponse.data
    expiringSummary.value = expiringResponse.data
    assetDemands.value = demandResponse.data.content
    await loadAssetDetails()

    if (isDepartmentManager.value && departmentId) {
      const [budgetResponse, eventsResponse] = await Promise.all([
        dashboardApi.getDepartmentBudgetDetails(departmentId),
        dashboardApi.getDepartmentHrEvents({ departmentId, page: 0, size: 1000 }),
      ])
      departmentBudget.value = budgetResponse.data
      departmentHrEvents.value = eventsResponse.data.content
      return
    }

    const budgetResponse = await dashboardApi.getBudgets({ page: 0, size: 100 })
    budgetOverview.value = budgetResponse.data

    if (isAssetOperator.value) {
      const eventsResponse = await dashboardApi.getDepartmentHrEvents({ page: 0, size: 1000 })
      departmentHrEvents.value = eventsResponse.data.content
    }
  } catch {
    loadError.value = '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboardData)
</script>
