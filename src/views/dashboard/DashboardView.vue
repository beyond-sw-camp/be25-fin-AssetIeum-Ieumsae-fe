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
          :interactive="canViewAssetDetails"
          @click="openAssetDrawer('holding')"
        />
        <ExpiringAssetCard
          :tangible-count="expiringSummary.tangibleAssetCount"
          :intangible-count="expiringSummary.intangibleAssetCount"
          :interactive="canViewAssetDetails"
          @click="openAssetDrawer('expiring')"
          @click-tangible="openAssetDrawer('expiring-tangible')"
          @click-intangible="openAssetDrawer('expiring-intangible')"
        />
      </section>

      <section class="mb-4">
        <AssetDemandTableCard v-if="isDepartmentManager || isAssetOperator" :columns="demandColumns" :rows="demandRows" />
      </section>

      <section class="mb-4">
        <DepartmentBudgetSummaryCard
          v-if="isDepartmentManager || isEmployee"
          :summary="departmentBudget"
          :interactive="false"
        />
        <DepartmentBudgetCard
          v-else
          :budget-rows="budgetRows"
          :total-budget-used="totalBudgetUsed"
          :total-budget-limit="totalBudgetLimit"
          :budget-usage-percent="budgetUsagePercent"
        />
      </section>

      <section v-if="isAssetOperator" class="mb-4">
        <BudgetHistoryTableCard :departments="budgetHistoryDepartments" />
      </section>

      <section v-if="isDepartmentManager || isAssetOperator" class="mb-4">
        <DepartmentLifecycleCard
          :events="departmentHrEvents"
          :statistics="departmentHrStatistics"
          :department-manager="isDepartmentManager"
        />
      </section>
    </main>

    <DashboardAssetDetailDrawer
      :is-open="assetDrawerMode !== null"
      :mode="assetDrawerMode ?? 'owned'"
      :initial-asset-type="assetDrawerType"
      :initial-owned-status="holdingInitialStatus"
      :show-unassigned="isAssetOperator"
      :department-id="assetDetailDepartmentId"
      @close="assetDrawerMode = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import AssetDemandTableCard, { type DemandRow } from '@/components/dashboard/AssetDemandTableCard.vue'
import BudgetHistoryTableCard from '@/components/dashboard/BudgetHistoryTableCard.vue'
import DashboardAssetDetailDrawer from '@/components/dashboard/DashboardAssetDetailDrawer.vue'
import DepartmentBudgetCard, { type BudgetRow } from '@/components/dashboard/DepartmentBudgetCard.vue'
import DepartmentBudgetSummaryCard from '@/components/dashboard/DepartmentBudgetSummaryCard.vue'
import DepartmentLifecycleCard from '@/components/dashboard/DepartmentLifecycleCard.vue'
import ExpiringAssetCard from '@/components/dashboard/ExpiringAssetCard.vue'
import HoldingAssetCard from '@/components/dashboard/HoldingAssetCard.vue'
import ProgressTicketCard, { type DashboardSegment } from '@/components/dashboard/ProgressTicketCard.vue'
import { dashboardApi } from '@/api/dashboard.api'
import { useAuthStore } from '@/stores'
import type {
  AssetDemand,
  BudgetOverview,
  DepartmentBudgetDetail,
  DepartmentBudgetOverview,
  ExpiringAssetSummary,
  HrEventStatistics,
  HrLifecycleEvent,
  OwnedAssetSummary,
  OwnedAssetDetailStatus,
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

const EMPTY_HR_STATISTICS: HrEventStatistics = {
  totalCount: 0,
  pendingCount: 0,
  pendingPercentage: 0,
  inProgressCount: 0,
  inProgressPercentage: 0,
  completedCount: 0,
  completedPercentage: 0,
  cancelledCount: 0,
  cancelledPercentage: 0,
}

type AssetDrawerMode = 'owned' | 'expiring'
type AssetDrawerType = 'ALL' | 'TANGIBLE' | 'INTANGIBLE'

const auth = useAuthStore()
const ticketProgress = ref<TicketProgressSummary>({ ...EMPTY_TICKET_PROGRESS })
const ownedAssets = ref<OwnedAssetSummary>({ ...EMPTY_OWNED_ASSETS })
const expiringSummary = ref<ExpiringAssetSummary>({ ...EMPTY_EXPIRING_ASSETS })
const assetDemands = ref<AssetDemand[]>([])
const budgetOverview = ref<BudgetOverview | null>(null)
const departmentBudget = ref<DepartmentBudgetDetail>({ ...EMPTY_DEPARTMENT_BUDGET })
const departmentHrEvents = ref<HrLifecycleEvent[]>([])
const departmentHrStatistics = ref<HrEventStatistics>({ ...EMPTY_HR_STATISTICS })
const assetDrawerMode = ref<AssetDrawerMode | null>(null)
const assetDrawerType = ref<AssetDrawerType>('ALL')
const isLoading = ref(false)
const loadError = ref('')

const role = computed(() => auth.user?.role ?? 'EMPLOYEE')
const isDepartmentManager = computed(() => role.value === 'DEPARTMENT_MANAGER')
const isEmployee = computed(() => role.value === 'EMPLOYEE')
const isAssetOperator = computed(() => (
  ['ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'].includes(role.value)
))
const canViewAssetDetails = computed(() => (
  isAssetOperator.value || isDepartmentManager.value || isEmployee.value
))
const assetDetailDepartmentId = computed(() => (
  isDepartmentManager.value ? auth.user?.departmentId : undefined
))
const dashboardTitle = computed(() => role.value === 'EMPLOYEE' ? '내 자산 대시보드' : '대시보드')
const holdingAssetCardTitle = computed(() => (
  isDepartmentManager.value || isEmployee.value ? '자산 대여 현황' : '보유 자산 현황'
))
const holdingInitialStatus = computed<OwnedAssetDetailStatus>(() => (
  isAssetOperator.value ? 'UNASSIGNED' : 'RENTAL_SCHEDULED'
))

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
  ...(isAssetOperator.value
    ? [{ label: '미배정', count: ownedAssets.value.unassigned, barClass: 'bg-neutral-800' }]
    : []),
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

const demandRows = computed<DemandRow[]>(() => assetDemands.value
  .filter((item) => item.expectedDemand > 0)
  .map((item) => ({
    id: item.itemId,
    kind: item.assetType === 'TANGIBLE' ? '유형' : '무형',
    name: item.assetName,
    expectedDemand: item.expectedDemand,
    currentStock: item.currentInventory,
    returnExpected: item.scheduledReturn,
    availability: clampPercent(item.availabilityRate),
    status: item.status,
  })))

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}

const budgetRows = computed<BudgetRow[]>(() => (
  budgetOverview.value?.departmentBudgets.content.map((item) => ({
    departmentId: item.departmentId,
    department: item.departmentName,
    limit: item.totalAmount,
    used: item.usedAmount,
    percent: item.usageRate,
  })) ?? []
))
const budgetHistoryDepartments = computed(() => (
  budgetOverview.value?.departmentBudgets.content.map((item) => ({
    departmentId: item.departmentId,
    departmentName: item.departmentName,
  })) ?? []
))

const totalBudgetLimit = computed(() => {
  const overview = budgetOverview.value
  if (!overview) return 0

  const departmentBudgetTotal = overview.departmentBudgets.content.reduce(
    (sum, budget) => sum + budget.totalAmount,
    0,
  )
  return (overview.commonBudget?.totalAmount ?? 0) + departmentBudgetTotal
})

const totalBudgetUsed = computed(() => {
  const overview = budgetOverview.value
  if (!overview) return 0

  const commonBudgetUsed = overview.commonBudget
    ? overview.commonBudget.totalAmount - overview.commonBudget.remainingAmount
    : 0
  const departmentBudgetUsed = overview.departmentBudgets.content.reduce(
    (sum, budget) => sum + budget.usedAmount,
    0,
  )

  return commonBudgetUsed + departmentBudgetUsed
})

const budgetUsagePercent = computed(() => {
  if (totalBudgetLimit.value <= 0) return 0
  return Math.round((totalBudgetUsed.value / totalBudgetLimit.value) * 1000) / 10
})

function openAssetDrawer(mode: 'holding' | 'expiring' | 'expiring-tangible' | 'expiring-intangible') {
  if (!canViewAssetDetails.value) return
  assetDrawerMode.value = mode === 'holding' ? 'owned' : 'expiring'
  assetDrawerType.value = mode === 'expiring-tangible'
    ? 'TANGIBLE'
    : mode === 'expiring-intangible'
      ? 'INTANGIBLE'
      : 'ALL'
}

function toDepartmentBudgetDetail(budget: DepartmentBudgetOverview): DepartmentBudgetDetail {
  return {
    ...budget,
    remainingAmount: Math.max(budget.totalAmount - budget.usedAmount, 0),
    categoryUsages: [],
  }
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
    if (isDepartmentManager.value && departmentId) {
      const [budgetResponse, eventsResponse, statisticsResponse] = await Promise.all([
        dashboardApi.getDepartmentBudgetDetails(departmentId),
        dashboardApi.getDepartmentHrEvents({ departmentId, page: 0, size: 1000 }),
        dashboardApi.getDepartmentHrStatistics(departmentId),
      ])
      departmentBudget.value = budgetResponse.data
      departmentHrEvents.value = eventsResponse.data.content
      departmentHrStatistics.value = statisticsResponse.data
      return
    }

    if (isEmployee.value) {
      const budgetResponse = await dashboardApi.getBudgets({ page: 0, size: 1 })
      const employeeBudget = budgetResponse.data.departmentBudgets.content[0]
      departmentBudget.value = employeeBudget
        ? toDepartmentBudgetDetail(employeeBudget)
        : {
            ...EMPTY_DEPARTMENT_BUDGET,
            departmentName: auth.user?.departmentName || '-',
          }
      return
    }
    const budgetResponse = await dashboardApi.getBudgets({ page: 0, size: 1000 })
    budgetOverview.value = budgetResponse.data

    if (isAssetOperator.value) {
      const [eventsResponse, statisticsResponse] = await Promise.all([
        dashboardApi.getDepartmentHrEvents({ page: 0, size: 1000 }),
        dashboardApi.getDepartmentHrStatistics(),
      ])
      departmentHrEvents.value = eventsResponse.data.content
      departmentHrStatistics.value = statisticsResponse.data
    }
  } catch {
    loadError.value = '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboardData)
</script>
