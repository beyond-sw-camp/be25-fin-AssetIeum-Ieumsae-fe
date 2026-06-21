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
        <HoldingAssetCard :title="holdingAssetCardTitle" :segments="holdingAssetSegments" />
        <ExpiringAssetCard
          :tangible-count="expiringSummary.tangibleAssetCount"
          :intangible-count="expiringSummary.intangibleAssetCount"
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

      <section v-if="isDepartmentManager" class="mb-4">
        <DepartmentLifecycleCard
          :events="departmentHrEvents"
          :statistics="departmentHrStatistics"
        />
      </section>

      <section v-else-if="isAssetOperator" class="mb-4">
        <LifecycleStatusCard :events="lifecycleEvents" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarClock, KeyRound, RefreshCw, RotateCw } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import AssetDemandTableCard, { type DemandRow } from '@/components/dashboard/AssetDemandTableCard.vue'
import DepartmentBudgetCard, { type BudgetRow } from '@/components/dashboard/DepartmentBudgetCard.vue'
import DepartmentBudgetSummaryCard from '@/components/dashboard/DepartmentBudgetSummaryCard.vue'
import DepartmentLifecycleCard from '@/components/dashboard/DepartmentLifecycleCard.vue'
import ExpiringAssetCard from '@/components/dashboard/ExpiringAssetCard.vue'
import HoldingAssetCard from '@/components/dashboard/HoldingAssetCard.vue'
import LifecycleStatusCard, { type LifecycleEvent } from '@/components/dashboard/LifecycleStatusCard.vue'
import ProgressTicketCard, { type DashboardSegment } from '@/components/dashboard/ProgressTicketCard.vue'
import { dashboardApi } from '@/api/dashboard.api'
import { useAuthStore } from '@/stores'
import type {
  AssetDemand,
  BudgetOverview,
  DashboardLifecycleEvent,
  DepartmentBudgetDetail,
  ExpiringAssetSummary,
  HrEventStatistics,
  HrLifecycleEvent,
  OwnedAssetSummary,
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

const auth = useAuthStore()
const ticketProgress = ref<TicketProgressSummary>({ ...EMPTY_TICKET_PROGRESS })
const ownedAssets = ref<OwnedAssetSummary>({ ...EMPTY_OWNED_ASSETS })
const expiringSummary = ref<ExpiringAssetSummary>({ ...EMPTY_EXPIRING_ASSETS })
const assetDemands = ref<AssetDemand[]>([])
const budgetOverview = ref<BudgetOverview | null>(null)
const departmentBudget = ref<DepartmentBudgetDetail>({ ...EMPTY_DEPARTMENT_BUDGET })
const dashboardLifecycleEvents = ref<DashboardLifecycleEvent[]>([])
const departmentHrEvents = ref<HrLifecycleEvent[]>([])
const departmentHrStatistics = ref<HrEventStatistics>({ ...EMPTY_HR_STATISTICS })
const isLoading = ref(false)
const loadError = ref('')

const role = computed(() => auth.user?.role ?? 'EMPLOYEE')
const isDepartmentManager = computed(() => role.value === 'DEPARTMENT_MANAGER')
const isAssetOperator = computed(() => (
  ['ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'].includes(role.value)
))
const dashboardTitle = computed(() => role.value === 'EMPLOYEE' ? '내 자산 대시보드' : '대시보드')
const holdingAssetCardTitle = computed(() => isDepartmentManager.value ? '자산 대여 현황' : '보유 자산 현황')

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

const lifecycleEvents = computed<LifecycleEvent[]>(() => dashboardLifecycleEvents.value.map((event) => ({
  id: `${event.eventType}-${event.assetId}`,
  title: event.status,
  description: `${event.assetName} · ${event.assetCode}`,
  dueText: dDayText(event.dDay ?? event.dday),
  icon: lifecycleIcon(event),
})))

function dDayText(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  if (value === 0) return 'D-DAY'
  return value > 0 ? `D-${value}` : `D+${Math.abs(value)}`
}

function lifecycleIcon(event: DashboardLifecycleEvent) {
  if (event.eventType.includes('EXPIR')) return KeyRound
  if (event.eventType.includes('RETURN')) return CalendarClock
  return RotateCw
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
        dashboardApi.getDepartmentHrEvents({ departmentId, page: 0, size: 10 }),
        dashboardApi.getDepartmentHrStatistics(departmentId),
      ])
      departmentBudget.value = budgetResponse.data
      departmentHrEvents.value = eventsResponse.data.content
      departmentHrStatistics.value = statisticsResponse.data
      return
    }

    const budgetResponse = await dashboardApi.getBudgets({ page: 0, size: 100 })
    budgetOverview.value = budgetResponse.data

    if (isAssetOperator.value) {
      const lifecycleResponse = await dashboardApi.getLifecycleEvents({ page: 0, size: 10 })
      dashboardLifecycleEvents.value = lifecycleResponse.data.content
    }
  } catch {
    loadError.value = '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboardData)
</script>
