<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          대시보드
        </p>
        <h1 class="page-title">
          {{ dashboardTitle }}
        </h1>
      </div>
      <div>
        <!-- TODO: 새로고침 기능  -->
        <Button variant="outline" :loading="isLoading" @click="loadDashboardData">
          <RefreshCw :size="15" />
          새로고침
        </Button>
      </div>
    </div>

    <!-- 현황 -->
    <div class="flex-1 overflow-y-auto px-3 pb-6">
      <div
        v-if="loadError"
        class="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ loadError }}
      </div>

      <!-- 진행중인 티켓 현황 -->
      <section class="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProgressTicketCard
          v-if="canSeeProgressTicketCard"
          :segments="progressTicketSegments"
        />

        <!-- 보유 자산 현황 -->
        <HoldingAssetCard
          v-if="canSeeHoldingAssetCard"
          :title="holdingAssetCardTitle"
          :segments="holdingAssetSegments"
          @click="openDetail('holdingAll')"
        />

        <!-- 만료 예정 자산 현황 -->
        <ExpiringAssetCard
          v-if="canSeeExpiringAssetCard"
          :tangible-count="expiringTangibleCount"
          :intangible-count="expiringIntangibleCount"
          @click="openDetail('expiringAll')"
          @click-tangible="openDetail('expiringTangible')"
          @click-intangible="openDetail('expiringIntangible')"
        />
      </section>

      <!-- 자산 수요 정보 조회 -->
      <section class="mb-4">
        <AssetDemandTableCard
          v-if="canSeeDemandCard"
          :columns="demandColumns"
          :rows="demandRows"
        />
      </section>

      <!-- 부서별 예산 현황 -->
      <section class="mb-4">
        <DepartmentBudgetSummaryCard
          v-if="isDepartmentManager"
          :summary="departmentBudgetSummary"
        />

        <DepartmentBudgetCard
          v-else-if="canSeeBudgetCard"
          :budget-rows="budgetRows"
          :total-budget-used="totalBudgetUsed"
          :total-budget-limit="totalBudgetLimit"
          :budget-usage-percent="budgetUsagePercent"
        />
      </section>
      <!-- TODO: 예산 관리 기능... -->

      <!-- 라이프 사이클 진행 현황 -->
      <section class="mb-4">
        <DepartmentLifecycleCard
          v-if="isDepartmentManager"
          :data="departmentLifecycle"
        />

        <LifecycleStatusCard
          v-else-if="canSeeLifecycleCard"
          :events="lifecycleEvents"
        />
      </section>
    </div>

    <BaseDrawer
      :is-open="isDetailOpen"
      :title="detailTitle"
      @close="isDetailOpen = false"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between rounded-lg bg-surface-secondary px-4 py-3">
          <span class="text-sm font-semibold text-text-sub">대상 자산</span>
          <strong class="text-lg text-text-main">{{ detailRows.length }}개</strong>
        </div>

        <Table
          :columns="detailColumns"
          :rows="detailRows"
          row-key="id"
          empty-text="대상 자산이 없습니다."
        >
          <template #cell-kind="{ value }">
            <span class="font-semibold text-text-main">{{ value }}</span>
          </template>
          <template #cell-status="{ value }">
            <span class="font-medium text-text-main">{{ value }}</span>
          </template>
        </Table>
      </div>

      <template #footer>
        <Button class="w-full" variant="outline" @click="isDetailOpen = false">
          닫기
        </Button>
      </template>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CalendarClock,
  KeyRound,
  RefreshCw,
  RotateCw,
} from 'lucide-vue-next'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import AssetDemandTableCard, { type DemandRow } from '@/components/dashboard/AssetDemandTableCard.vue'
import DepartmentBudgetCard, { type BudgetRow } from '@/components/dashboard/DepartmentBudgetCard.vue'
import DepartmentBudgetSummaryCard from '@/components/dashboard/DepartmentBudgetSummaryCard.vue'
import DepartmentLifecycleCard from '@/components/dashboard/DepartmentLifecycleCard.vue'
import ExpiringAssetCard from '@/components/dashboard/ExpiringAssetCard.vue'
import HoldingAssetCard from '@/components/dashboard/HoldingAssetCard.vue'
import LifecycleStatusCard, { type LifecycleEvent } from '@/components/dashboard/LifecycleStatusCard.vue'
import ProgressTicketCard, { type DashboardSegment } from '@/components/dashboard/ProgressTicketCard.vue'
import { useAuthStore } from '@/stores'
import { formatDate, INTANGIBLE_STATUS_LABEL, TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import { dashboardApi } from '@/api/dashboard.api'
import {
  dashboardBudgetRows,
  dashboardDemandRows,
  dashboardDepartmentBudgetSummary,
  dashboardDepartmentDemandRows,
  dashboardDepartmentLifecycle,
} from '@/mocks/dashboard.data'
import type { IntangibleAsset, IntangibleAssetStatus, TangibleAsset, TangibleAssetStatus } from '@/types'

type AssetKind = '유형' | '무형'
type DetailKey =
  | 'unassigned'
  | 'holdingAll'
  | 'progressAll'
  | 'rentalScheduled'
  | 'rentalActive'
  | 'overdue'
  | 'expiringTangible'
  | 'expiringIntangible'
  | 'expiringAll'

interface DashboardAsset {
  id: string
  kind: AssetKind
  name: string
  code: string
  owner: string
  departmentName: string
  status: string
  statusCode: string
  startedAt: string | null
  dueDate: string | null
  expiryDate: string | null
  departmentId: string | null
  memberId: string | null
  usageType?: string | null
}

interface DetailRow extends Record<string, unknown> {
  id: string
  kind: AssetKind
  name: string
  code: string
  owner: string
  departmentName: string
  status: string
  dueDate: string
}

const auth = useAuthStore()
const tangibleAssets = ref<TangibleAsset[]>([])
const intangibleAssets = ref<IntangibleAsset[]>([])
const isLoading = ref(false)
const loadError = ref('')
const isDetailOpen = ref(false)
const activeDetailKey = ref<DetailKey>('rentalActive')

const today = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const dateValue = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

const daysUntilDate = (value: string | null | undefined) => {
  const target = dateValue(value)
  if (!target) return null
  return Math.ceil((target.getTime() - today().getTime()) / 86_400_000)
}

const role = computed(() => auth.user?.role ?? 'EMPLOYEE')
const isAssetOperator = computed(() => (
  ['SUPER_ADMIN', 'ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'].includes(role.value)
))
const isDepartmentManager = computed(() => role.value === 'DEPARTMENT_MANAGER')
const canSeeProgressTicketCard = computed(() => isAssetOperator.value || isDepartmentManager.value)
const canSeeHoldingAssetCard = computed(() => true)
const canSeeExpiringAssetCard = computed(() => true)
const canSeeDemandCard = computed(() => isAssetOperator.value || isDepartmentManager.value)
const canSeeBudgetCard = computed(() => isAssetOperator.value)
const canSeeLifecycleCard = computed(() => true)
const isAdminDashboard = computed(() => isAssetOperator.value)

const dashboardTitle = computed(() => {
  if (isAssetOperator.value || isDepartmentManager.value) return '대시보드'
  return '내 자산 대시보드'
})

const tangibleStatusLabel = (status: TangibleAssetStatus | string | null | undefined) => (
  status ? TANGIBLE_STATUS_LABEL[status as TangibleAssetStatus] ?? status : '-'
)

const intangibleStatusLabel = (status: IntangibleAssetStatus | string | null | undefined) => (
  status ? INTANGIBLE_STATUS_LABEL[status as IntangibleAssetStatus] ?? status : '-'
)

const tangibleIdOf = (asset: TangibleAsset) => (
  String(asset.assetId ?? asset.tangibleAssetId ?? asset.id ?? asset.assetCode)
)

const intangibleIdOf = (asset: IntangibleAsset) => (
  String(asset.assetId ?? asset.assetCode)
)

const tangibleMemberIdOf = (asset: TangibleAsset) => (
  asset.assignedMemberId ?? asset.memberId ?? null
)

const assetNameOf = (asset: TangibleAsset | IntangibleAsset) => {
  const aliases = asset as { assetItemName?: string; productName?: string }
  return aliases.assetItemName ?? aliases.productName ?? ''
}

const tangibleRows = computed<DashboardAsset[]>(() => (
  tangibleAssets.value.map((asset) => {
    const status = asset.status ?? asset.tangibleAssetStatus ?? asset.tangibleAssetstatus ?? 'AVAILABLE'
    return {
      id: `tangible-${tangibleIdOf(asset)}`,
      kind: '유형',
      name: assetNameOf(asset) || asset.assetCode,
      code: asset.assetCode,
      owner: asset.assignedMemberName ?? asset.memberName ?? asset.userName ?? '',
      departmentName: asset.departmentName ?? '',
      status: tangibleStatusLabel(status),
      statusCode: status,
      startedAt: asset.startedAt ?? asset.usedStartedAt ?? null,
      dueDate: asset.returnDueDate ?? null,
      expiryDate: asset.warrantyExpiredAt ?? null,
      departmentId: asset.departmentId ?? null,
      memberId: tangibleMemberIdOf(asset),
      usageType: asset.usageType ?? null,
    }
  })
))

const intangibleRows = computed<DashboardAsset[]>(() => (
  intangibleAssets.value.map((asset) => {
    const status = asset.status ?? asset.intangibleAssetStatus ?? 'AVAILABLE'
    return {
      id: `intangible-${intangibleIdOf(asset)}`,
      kind: '무형',
      name: assetNameOf(asset) || asset.assetCode,
      code: asset.assetCode,
      owner: asset.assignedMemberName ?? '',
      departmentName: asset.departmentName ?? '',
      status: intangibleStatusLabel(status),
      statusCode: status,
      startedAt: asset.startedAt ?? null,
      dueDate: null,
      expiryDate: asset.expiredAt ?? null,
      departmentId: asset.departmentId ?? null,
      memberId: asset.assignedMemberId ?? null,
    }
  })
))

const allAssets = computed(() => [...tangibleRows.value, ...intangibleRows.value])

const scopedAssets = computed(() => {
  if (isAssetOperator.value) return allAssets.value
  if (isDepartmentManager.value) {
    const departmentId = auth.user?.departmentId
    return allAssets.value.filter((asset) => asset.departmentId === departmentId)
  }

  const memberId = auth.user?.memberId
  return allAssets.value.filter((asset) => asset.memberId === memberId)
})

const unassignedAssets = computed(() => (
  scopedAssets.value.filter((asset) => !asset.memberId || asset.statusCode === 'AVAILABLE')
))

const rentalScheduledAssets = computed(() => (
  scopedAssets.value.filter((asset) => (
    asset.kind === '유형'
    && asset.dueDate
    && (daysUntilDate(asset.dueDate) ?? 999) >= 0
    && (daysUntilDate(asset.dueDate) ?? 999) <= 30
  ))
))

const rentalActiveAssets = computed(() => (
  scopedAssets.value.filter((asset) => (
    asset.kind === '유형'
    && asset.statusCode === 'IN_USE'
    && (!asset.dueDate || (daysUntilDate(asset.dueDate) ?? 0) >= 0)
  ))
))

const overdueAssets = computed(() => (
  scopedAssets.value.filter((asset) => (
    asset.kind === '유형'
    && asset.dueDate
    && (daysUntilDate(asset.dueDate) ?? 0) < 0
    && asset.statusCode !== 'AVAILABLE'
    && asset.statusCode !== 'DISPOSED'
  ))
))

const expiringTangibleAssets = computed(() => (
  scopedAssets.value.filter((asset) => (
    asset.kind === '유형'
    && asset.expiryDate
    && (daysUntilDate(asset.expiryDate) ?? 999) >= 0
    && (daysUntilDate(asset.expiryDate) ?? 999) <= 30
  ))
))

const expiringIntangibleAssets = computed(() => (
  scopedAssets.value.filter((asset) => (
    asset.kind === '무형'
    && (
      asset.statusCode === 'EXPIRING_SOON'
      || (
        asset.expiryDate
        && (daysUntilDate(asset.expiryDate) ?? 999) >= 0
        && (daysUntilDate(asset.expiryDate) ?? 999) <= 30
      )
    )
  ))
))

const progressTicketStats = computed(() => [
  ...(isAdminDashboard.value || isDepartmentManager.value
    ? [
        { label: '접수 대기', count: 12, barClass: 'bg-warning' },
        { label: '접수 완료', count: 8, barClass: 'bg-primary' },
        { label: '처리 중', count: 15, barClass: 'bg-danger' },
        { label: '처리 완료', count: 32, barClass: 'bg-success' },
      ]
    : [
        { label: '접수 대기', count: unassignedAssets.value.length, barClass: 'bg-warning' },
        { label: '승인 완료', count: rentalScheduledAssets.value.length, barClass: 'bg-primary' },
        { label: '처리 중', count: rentalActiveAssets.value.length, barClass: 'bg-danger' },
        { label: '처리 완료', count: overdueAssets.value.length, barClass: 'bg-success' },
      ]),
])

const progressTicketSegments = computed<DashboardSegment[]>(() => {
  const total = progressTicketStats.value.reduce((sum, item) => sum + item.count, 0)
  if (!total) {
    return progressTicketStats.value.map((item) => ({ ...item, percent: 0 }))
  }

  return progressTicketStats.value.map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
})

const holdingAssetStats = computed(() => [
  ...(isAdminDashboard.value
    ? [
        { label: '미배정', count: 10, barClass: 'bg-neutral-800' },
        { label: '대여 예정', count: 213, barClass: 'bg-warning' },
        { label: '대여 중', count: 124, barClass: 'bg-success' },
        { label: '연체', count: 9, barClass: 'bg-danger' },
      ]
    : isDepartmentManager.value
      ? [
          { label: '대여 가능', count: 213, barClass: 'bg-warning' },
          { label: '대여중', count: 124, barClass: 'bg-success' },
          { label: '연체', count: 9, barClass: 'bg-danger' },
        ]
    : [
        { label: '미배정', count: unassignedAssets.value.length, barClass: 'bg-neutral-800' },
        { label: '대여 예정', count: rentalScheduledAssets.value.length, barClass: 'bg-warning' },
        { label: '대여 중', count: rentalActiveAssets.value.length, barClass: 'bg-success' },
        { label: '연체', count: overdueAssets.value.length, barClass: 'bg-danger' },
      ]),
])

const holdingAssetSegments = computed<DashboardSegment[]>(() => {
  const total = holdingAssetStats.value.reduce((sum, item) => sum + item.count, 0)
  if (!total) {
    return holdingAssetStats.value.map((item) => ({ ...item, percent: 0 }))
  }

  return holdingAssetStats.value.map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
})

const holdingAssetCardTitle = computed(() => (
  isDepartmentManager.value ? '자산 대여 현황' : '보유 자산 현황'
))

const demandColumns: Column<DemandRow>[] = [
  { key: 'kind', label: '자산 구분', align: 'left', width: '13%' },
  { key: 'name', label: '자산명', align: 'left', width: '22%' },
  { key: 'expectedDemand', label: '예상 수요', align: 'center', width: '13%' },
  { key: 'currentStock', label: '현재 재고', align: 'center', width: '13%' },
  { key: 'returnExpected', label: '회수 예정', align: 'center', width: '13%' },
  { key: 'availability', label: '가용률', align: 'center', width: '13%' },
  { key: 'status', label: '상태', align: 'center', width: '13%' },
]

const demandRows = computed<DemandRow[]>(() => {
  if (isAdminDashboard.value) return dashboardDemandRows
  if (isDepartmentManager.value) return dashboardDepartmentDemandRows

  const tangibleAvailable = tangibleRows.value.filter((asset) => asset.statusCode === 'AVAILABLE').length
  const tangibleTotal = tangibleRows.value.length
  const tangibleReturnExpected = rentalScheduledAssets.value.length
  const tangibleAvailability = tangibleTotal
    ? Math.min(100, Math.round(((tangibleAvailable + tangibleReturnExpected) / tangibleTotal) * 100))
    : 0

  const intangibleAvailable = intangibleRows.value.filter((asset) => asset.statusCode === 'AVAILABLE').length
  const intangibleTotal = intangibleRows.value.length
  const intangibleAvailability = intangibleTotal
    ? Math.min(100, Math.round((intangibleAvailable / intangibleTotal) * 100))
    : 0

  return [
    {
      id: 'demand-tangible',
      kind: '유형',
      name: '유형자산',
      expectedDemand: tangibleTotal,
      currentStock: tangibleAvailable,
      returnExpected: tangibleReturnExpected,
      availability: tangibleAvailability,
      status: tangibleAvailability >= 50 ? '충분' : '부족',
    },
    {
      id: 'demand-intangible',
      kind: '무형',
      name: '무형자산',
      expectedDemand: intangibleTotal,
      currentStock: intangibleAvailable,
      returnExpected: 0,
      availability: intangibleAvailability,
      status: intangibleAvailability >= 50 ? '충분' : '부족',
    },
  ]
})

const budgetRows = computed<BudgetRow[]>(() => {
  if (isAdminDashboard.value) return dashboardBudgetRows

  const usedByDepartment = new Map<string, number>()

  scopedAssets.value.forEach((asset) => {
    const department = asset.departmentName || '미지정'
    const source = asset.kind === '유형'
      ? tangibleAssets.value.find((item) => `tangible-${tangibleIdOf(item)}` === asset.id)
      : intangibleAssets.value.find((item) => `intangible-${intangibleIdOf(item)}` === asset.id)
    const used = source?.purchasePrice ?? 0

    usedByDepartment.set(department, (usedByDepartment.get(department) ?? 0) + used)
  })

  return Array.from(usedByDepartment.entries()).map(([department, used]) => {
    const limit = Math.max(used, 1)

    return {
      department,
      limit,
      used,
      percent: limit ? Math.round((used / limit) * 100) : 0,
    }
  })
})

const totalBudgetLimit = computed(() => budgetRows.value.reduce((sum, row) => sum + row.limit, 0))
const totalBudgetUsed = computed(() => budgetRows.value.reduce((sum, row) => sum + row.used, 0))
const budgetUsagePercent = computed(() => (
  totalBudgetLimit.value ? Math.round((totalBudgetUsed.value / totalBudgetLimit.value) * 100) : 0
))

const expiringTangibleCount = computed(() => (
  isAdminDashboard.value || isDepartmentManager.value ? 23 : expiringTangibleAssets.value.length
))

const expiringIntangibleCount = computed(() => (
  isAdminDashboard.value || isDepartmentManager.value ? 4 : expiringIntangibleAssets.value.length
))

const departmentBudgetSummary = computed(() => dashboardDepartmentBudgetSummary)
const departmentLifecycle = computed(() => dashboardDepartmentLifecycle)

const lifecycleEvents = computed<LifecycleEvent[]>(() => {
  const returnEvents = rentalScheduledAssets.value.slice(0, 2).map((asset) => ({
    id: `return-${asset.id}`,
    title: '반납 예정 알림',
    description: `${asset.name} 반납 예정일이 다가왔습니다.`,
    dueText: `D-${Math.max(daysUntilDate(asset.dueDate) ?? 0, 0)}`,
    icon: CalendarClock,
  }))

  const activeEvents = rentalActiveAssets.value.slice(0, 2).map((asset) => ({
    id: `active-${asset.id}`,
    title: '대여 중 자산',
    description: `${asset.name} 대여가 진행 중입니다.`,
    dueText: asset.dueDate ? `D-${Math.max(daysUntilDate(asset.dueDate) ?? 0, 0)}` : '-',
    icon: RotateCw,
  }))

  const expiringEvents = expiringIntangibleAssets.value.slice(0, 2).map((asset) => ({
    id: `expiry-${asset.id}`,
    title: '라이선스 만료 예정',
    description: `${asset.name} 라이선스 만료 예정입니다.`,
    dueText: `D-${Math.max(daysUntilDate(asset.expiryDate) ?? 0, 0)}`,
    icon: KeyRound,
  }))

  return [...returnEvents, ...activeEvents, ...expiringEvents].slice(0, 3)
})

const detailTitleByKey: Record<DetailKey, string> = {
  progressAll: '진행중인 티켓 현황',
  holdingAll: '보유 자산 현황',
  unassigned: '보유 자산 현황 - 미배정',
  rentalScheduled: '보유 자산 현황 - 대여 예정',
  rentalActive: '보유 자산 현황 - 대여 중',
  overdue: '보유 자산 현황 - 연체',
  expiringTangible: '만료 예정 유형자산',
  expiringIntangible: '만료 예정 무형자산',
  expiringAll: '만료 예정 자산',
}

const detailTitle = computed(() => detailTitleByKey[activeDetailKey.value])

const detailAssets = computed(() => {
  if (activeDetailKey.value === 'holdingAll') return scopedAssets.value
  if (activeDetailKey.value === 'progressAll') return [...unassignedAssets.value, ...rentalScheduledAssets.value, ...rentalActiveAssets.value, ...overdueAssets.value]
  if (activeDetailKey.value === 'unassigned') return unassignedAssets.value
  if (activeDetailKey.value === 'rentalScheduled') return rentalScheduledAssets.value
  if (activeDetailKey.value === 'rentalActive') return rentalActiveAssets.value
  if (activeDetailKey.value === 'overdue') return overdueAssets.value
  if (activeDetailKey.value === 'expiringTangible') return expiringTangibleAssets.value
  if (activeDetailKey.value === 'expiringIntangible') return expiringIntangibleAssets.value
  return [...expiringTangibleAssets.value, ...expiringIntangibleAssets.value]
})

const detailRows = computed<DetailRow[]>(() => (
  detailAssets.value.map((asset) => ({
    id: asset.id,
    kind: asset.kind,
    name: asset.name,
    code: asset.code,
    owner: asset.owner || '미배정',
    departmentName: asset.departmentName || '-',
    status: asset.status,
    dueDate: formatDate(asset.dueDate ?? asset.expiryDate),
  }))
))

const detailColumns: Column<DetailRow>[] = [
  { key: 'kind', label: '구분', align: 'center', width: '10%' },
  { key: 'name', label: '자산명', align: 'left', width: '28%' },
  { key: 'code', label: '자산 번호', align: 'center', width: '16%' },
  { key: 'owner', label: '사용자', align: 'center', width: '14%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '16%' },
  { key: 'status', label: '상태', align: 'center', width: '10%' },
  { key: 'dueDate', label: '일자', align: 'center', width: '16%' },
]

const openDetail = (key: DetailKey) => {
  activeDetailKey.value = key
  isDetailOpen.value = true
}

const loadDashboardData = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await dashboardApi.getAssetsSnapshot(auth.user?.role, {
      companyId: auth.user?.companyId,
      departmentId: auth.user?.departmentId,
      memberId: auth.user?.memberId,
    })

    tangibleAssets.value = response.data.tangibleAssets
    intangibleAssets.value = response.data.intangibleAssets
  } catch (error) {
    console.error('대시보드 현황 조회 실패', error)
    loadError.value = '대시보드 데이터를 불러오지 못했습니다.'
    tangibleAssets.value = []
    intangibleAssets.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(loadDashboardData)
</script>
