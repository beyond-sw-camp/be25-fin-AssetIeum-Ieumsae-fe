<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">운영 리포트</p>
        <h1 class="page-title">자산 운영 변화 리포트</h1>
      </div>
      <Button variant="outline" :loading="isRefreshing" @click="refreshAll">
        <RefreshCw :size="15" />
        새로고침
      </Button>
    </header>

    <main class="flex-1 overflow-y-auto px-3 pb-6">
      <div
        v-if="!canViewOperationReports"
        class="rounded-lg border border-border bg-surface p-8 text-center shadow-sm"
      >
        <ShieldAlert :size="32" class="mx-auto mb-3 text-danger" />
        <p class="text-lg font-semibold text-text-main">운영 리포트 조회 권한이 없습니다.</p>
        <p class="mt-1 text-base text-text-sub">구매자산팀과 구매자산관리자만 접근할 수 있습니다.</p>
      </div>

      <template v-else>
        <div
          v-if="loadError"
          class="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-base font-semibold text-danger"
        >
          {{ loadError }}
        </div>

        <section
          v-if="summaryTiles.length > 0 || departmentChartItems.length > 0"
          class="mb-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <div class="grid items-stretch gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
            <div v-if="summaryTiles.length > 0" class="grid h-full gap-3">
              <SummaryTile
                v-for="tile in summaryTiles"
                :key="tile.label"
                :label="tile.label"
                :caption="tile.caption"
                :value="tile.value"
              />
            </div>

            <div v-if="departmentChartItems.length > 0" class="flex min-h-80 flex-col rounded-lg border border-border bg-surface p-4">
              <div class="mb-2 flex items-center justify-between">
                <h2 class="text-base font-bold text-text-main">부서별 미반납 현황</h2>
                <span class="text-sm font-semibold text-text-sub">상위 {{ departmentChartItems.length }}개 부서</span>
              </div>
              <GroupedBarChart
                class="min-h-0 flex-1"
                :items="departmentChartItems"
                primary-label="미반납 자산 수"
                secondary-label="반납 지연 건수"
              />
            </div>
          </div>
        </section>

        <NumberedReportSection v-if="userRows.length > 0" title="사용자별 반복 지연 분석">
          <template #description>
            같은 사용자가 반복적으로 반납을 지연시키는 현황을 조회합니다.
          </template>

          <Table
            :columns="userColumns"
            :rows="userRows"
            :loading="unreturnedLoading"
            row-key="rank"
            empty-text="반복 지연 사용자 데이터가 없습니다."
          />
        </NumberedReportSection>

        <section class="mt-5 space-y-5">
          <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-base font-extrabold text-text-main">기간별 운영 분석</h2>
              <p class="mt-1 text-sm font-semibold text-text-sub">
                선택한 기간은 회수 프로세스 분석과 자산 구매 분석에만 적용됩니다.
              </p>
            </div>
            <div class="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Input
                id="operation-report-start-date"
                v-model="filters.startDate"
                type="date"
                label="시작일"
                placeholder="시작일 선택"
              />
              <Input
                id="operation-report-end-date"
                v-model="filters.endDate"
                type="date"
                label="종료일"
                placeholder="종료일 선택"
              />
              <Button :loading="datedReportsLoading" @click="refreshDatedReports">
                기간 조회
              </Button>
            </div>
          </div>

          <NumberedReportSection v-if="recoveryMetricCards.length > 0" title="자산 회수 프로세스 분석">
            <template #description>
              회수 요청 생성, 회수 완료, 평균 회수 소요 기간, 회수 지연 기간을 조회합니다.
            </template>

            <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                v-for="metric in recoveryMetricCards"
                :key="metric.label"
                :tone="metric.tone"
                :label="metric.label"
                :badge="metric.badge"
                :value="metric.value"
                :caption="metric.caption"
                :change-rate="metric.changeRate"
              />
            </div>
          </NumberedReportSection>

          <NumberedReportSection v-if="purchaseMetricCards.length > 0 || purchaseRows.length > 0" title="자산 구매 분석">
            <template #description>
              신규 구매 수량과 부서별 구매 요청, 승인, 완료, 누적 구매 수량을 조회합니다.
            </template>

            <div class="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)_24rem]">
              <MetricCard
                v-for="metric in purchaseMetricCards"
                :key="metric.label"
                :tone="metric.tone"
                :label="metric.label"
                :badge="metric.badge"
                :value="metric.value"
                :caption="metric.caption"
                :change-rate="metric.changeRate"
              />

              <Table
                v-if="purchaseRows.length > 0"
                :columns="purchaseColumns"
                :rows="purchaseRows"
                :loading="purchaseLoading"
                row-key="departmentId"
                empty-text="부서별 구매 요청 데이터가 없습니다."
              />

              <div v-if="purchaseQuantityChartItems.length > 0" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
                <h3 class="mb-3 text-base font-bold text-text-main">부서별 누적 구매 수량</h3>
                <HorizontalBarChart :items="purchaseQuantityChartItems" unit="개" />
              </div>
            </div>
          </NumberedReportSection>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RefreshCw, ShieldAlert } from 'lucide-vue-next'

import { ApiError, reportApi } from '@/api'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import GroupedBarChart, { type GroupedBarItem } from '@/components/report/GroupedBarChart.vue'
import HorizontalBarChart from '@/components/report/HorizontalBarChart.vue'
import MetricCard from '@/components/report/MetricCard.vue'
import NumberedReportSection from '@/components/report/NumberedReportSection.vue'
import SummaryTile from '@/components/report/SummaryTile.vue'
import { usePermission } from '@/composables'
import type {
  DepartmentPurchaseRequest,
  PurchaseRequestsReport,
  RecoveryReport,
  TopDelayedUser,
  UnreturnedAssetsReport,
} from '@/types'

type TableRow = Record<string, string | number>
type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'purple'

interface MetricCardModel {
  label: string
  value: string
  caption: string
  badge: string
  tone: MetricTone
  changeRate?: number
}

interface SummaryTileModel {
  label: string
  caption: string
  value: string
}

const DEFAULT_TOP_USER_LIMIT = 5
const DEFAULT_PAGE_SIZE = 10

const permission = usePermission()
const canViewOperationReports = computed(() => permission.hasRole('ASSET_TEAM', 'ASSET_MANAGER'))

const filters = reactive({
  startDate: '',
  endDate: '',
})

const unreturnedLoading = ref(false)
const recoveryLoading = ref(false)
const purchaseLoading = ref(false)
const loadError = ref('')

const unreturnedReport = ref<UnreturnedAssetsReport | null>(null)
const recoveryReport = ref<RecoveryReport | null>(null)
const purchaseReport = ref<PurchaseRequestsReport | null>(null)

const userColumns: Column<TableRow>[] = [
  { key: 'rank', label: '순위', align: 'center', width: '4rem' },
  { key: 'memberName', label: '사용자' },
  { key: 'departmentName', label: '소속 부서' },
  { key: 'delayCount', label: '지연 건수', align: 'right' },
  { key: 'averageDelayDays', label: '평균 지연 기간', align: 'right' },
  { key: 'recentDelayedAt', label: '최근 지연 일시' },
]

const purchaseColumns: Column<TableRow>[] = [
  { key: 'departmentName', label: '부서' },
  { key: 'purchaseRequestCount', label: '구매 요청', align: 'right' },
  { key: 'purchaseApprovedCount', label: '구매 승인', align: 'right' },
  { key: 'purchaseCompletedCount', label: '구매 완료', align: 'right' },
  { key: 'accumulatedPurchaseQuantity', label: '누적 수량', align: 'right' },
]

const isRefreshing = computed(() =>
  unreturnedLoading.value || recoveryLoading.value || purchaseLoading.value,
)

const datedReportsLoading = computed(() =>
  recoveryLoading.value || purchaseLoading.value,
)

const summaryTiles = computed<SummaryTileModel[]>(() => {
  const report = unreturnedReport.value
  if (!report) return []

  const tiles: SummaryTileModel[] = []

  if (hasNumber(report.totalUnreturnedAssetCount)) {
    tiles.push({
      label: '전체 미반납 자산 수',
      caption: '전체 부서 기준',
      value: `${formatNumber(report.totalUnreturnedAssetCount)}건`,
    })
  }

  if (hasNumber(report.overdueReturnCount)) {
    tiles.push({
      label: '전체 반납 지연 건수',
      caption: '반납 예정일 초과',
      value: `${formatNumber(report.overdueReturnCount)}건`,
    })
  }

  if (hasNumber(report.repeatDelayedUserCount)) {
    tiles.push({
      label: '반복 지연 사용자',
      caption: hasNumber(report.repeatDelayedUserRate)
        ? `전체 사용자 대비 ${formatRate(report.repeatDelayedUserRate)}`
        : '반복 지연 사용자 수',
      value: `${formatNumber(report.repeatDelayedUserCount)}명`,
    })
  }

  return tiles
})

const departmentChartItems = computed<GroupedBarItem[]>(() =>
  (unreturnedReport.value?.departmentUnreturnedAssets ?? [])
    .filter((item) => hasNumber(item.unreturnedAssetCount) || hasNumber(item.overdueReturnCount))
    .slice(0, 10)
    .map((item) => ({
      label: item.departmentName ?? '-',
      primary: item.unreturnedAssetCount ?? 0,
      secondary: item.overdueReturnCount ?? 0,
    })),
)

const userRows = computed<TableRow[]>(() =>
  (unreturnedReport.value?.topDelayedUsers ?? []).map((item: TopDelayedUser, index) => ({
    rank: item.rank ?? index + 1,
    memberName: item.memberName ?? '-',
    departmentName: item.departmentName ?? '-',
    delayCount: hasNumber(item.delayCount) ? `${formatNumber(item.delayCount)}건` : '-',
    averageDelayDays: hasNumber(item.averageDelayDays) ? formatDays(item.averageDelayDays) : '-',
    recentDelayedAt: formatDateTime(item.recentDelayedAt),
  })),
)

const recoveryMetricCards = computed<MetricCardModel[]>(() => {
  const report = recoveryReport.value
  if (!report) return []

  return [
    createMetricCard(
      hasNumber(report.returnRequestCreatedCount),
      '회수 요청 생성',
      `${formatNumber(report.returnRequestCreatedCount ?? 0)}건`,
      '이전 기간 대비',
      '요청',
      'blue',
      report.returnRequestCreatedChangeRate,
    ),
    createMetricCard(
      hasNumber(report.returnCompletedCount),
      '회수 완료 처리',
      `${formatNumber(report.returnCompletedCount ?? 0)}건`,
      '이전 기간 대비',
      '완료',
      'green',
      report.returnCompletedChangeRate,
    ),
    createMetricCard(
      hasNumber(report.averageRecoveryDays),
      '평균 회수 소요 기간',
      formatDays(report.averageRecoveryDays ?? 0),
      '이전 기간 대비',
      '평균',
      'amber',
      report.averageRecoveryDaysChangeRate,
    ),
    createMetricCard(
      hasNumber(report.totalRecoveryDelayDays),
      '회수 지연 기간 합계',
      formatDays(report.totalRecoveryDelayDays ?? 0),
      '이전 기간 대비',
      '지연',
      'red',
      report.totalRecoveryDelayDaysChangeRate,
    ),
  ].filter((card): card is MetricCardModel => card !== null)
})

const purchaseItems = computed<DepartmentPurchaseRequest[]>(() =>
  purchaseReport.value?.departmentPurchaseRequests?.content ?? [],
)

const purchaseMetricCards = computed<MetricCardModel[]>(() => {
  const report = purchaseReport.value
  if (!report || !hasNumber(report.newPurchaseQuantity)) return []

  return [{
    label: '신규 구매 수량',
    value: `${formatNumber(report.newPurchaseQuantity)}개`,
    caption: '이전 기간 대비',
    badge: '신규',
    tone: 'purple',
    changeRate: report.newPurchaseQuantityChangeRate,
  }]
})

const purchaseRows = computed<TableRow[]>(() =>
  purchaseItems.value.map((item, index) => ({
    departmentId: item.departmentId ?? `department-${index}`,
    departmentName: item.departmentName ?? '-',
    purchaseRequestCount: hasNumber(item.purchaseRequestCount) ? `${formatNumber(item.purchaseRequestCount)}건` : '-',
    purchaseApprovedCount: hasNumber(item.purchaseApprovedCount) ? `${formatNumber(item.purchaseApprovedCount)}건` : '-',
    purchaseCompletedCount: hasNumber(item.purchaseCompletedCount) ? `${formatNumber(item.purchaseCompletedCount)}건` : '-',
    accumulatedPurchaseQuantity: hasNumber(item.accumulatedPurchaseQuantity) ? `${formatNumber(item.accumulatedPurchaseQuantity)}개` : '-',
  })),
)

const purchaseQuantityChartItems = computed(() =>
  purchaseItems.value
    .filter((item) => hasNumber(item.accumulatedPurchaseQuantity))
    .slice(0, 8)
    .map((item) => ({
      label: item.departmentName ?? '-',
      value: item.accumulatedPurchaseQuantity ?? 0,
    })),
)

async function refreshAll() {
  if (!canViewOperationReports.value) return
  if (!isValidDateRange()) return

  loadError.value = ''
  await Promise.all([
    loadUnreturnedReport(),
    loadRecoveryReport(),
    loadPurchaseReport(),
  ])
}

async function refreshDatedReports() {
  if (!canViewOperationReports.value) return
  if (!isValidDateRange()) return

  loadError.value = ''
  await Promise.all([
    loadRecoveryReport(),
    loadPurchaseReport(),
  ])
}

async function loadUnreturnedReport() {
  unreturnedLoading.value = true

  try {
    const response = await reportApi.getUnreturnedAssets({
      topDelayedUserLimit: DEFAULT_TOP_USER_LIMIT,
    })
    unreturnedReport.value = response.data
  } catch (error) {
    loadError.value = getErrorMessage(error, '미반납 자산 리포트를 불러오지 못했습니다.')
  } finally {
    unreturnedLoading.value = false
  }
}

async function loadRecoveryReport() {
  recoveryLoading.value = true

  try {
    const response = await reportApi.getRecovery(getDateFilterParams())
    recoveryReport.value = response.data
  } catch (error) {
    loadError.value = getErrorMessage(error, '회수 프로세스 리포트를 불러오지 못했습니다.')
  } finally {
    recoveryLoading.value = false
  }
}

async function loadPurchaseReport() {
  purchaseLoading.value = true

  try {
    const response = await reportApi.getPurchaseRequests({
      ...getDateFilterParams(),
      page: 0,
      size: DEFAULT_PAGE_SIZE,
    })
    purchaseReport.value = response.data
  } catch (error) {
    loadError.value = getErrorMessage(error, '구매 분석 리포트를 불러오지 못했습니다.')
  } finally {
    purchaseLoading.value = false
  }
}

function getDateFilterParams() {
  if (!filters.startDate || !filters.endDate) return {}

  return {
    startDate: toStartDateTime(filters.startDate),
    endDate: toEndDateTime(filters.endDate),
  }
}

function isValidDateRange() {
  if (Boolean(filters.startDate) !== Boolean(filters.endDate)) {
    loadError.value = '시작일과 종료일을 함께 입력해주세요.'
    return false
  }

  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    loadError.value = '시작일은 종료일보다 늦을 수 없습니다.'
    return false
  }

  return true
}

function createMetricCard(
  shouldShow: boolean,
  label: string,
  value: string,
  caption: string,
  badge: string,
  tone: MetricTone,
  changeRate?: number,
) {
  if (!shouldShow) return null

  return {
    label,
    value,
    caption,
    badge,
    tone,
    changeRate,
  }
}

function hasNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toStartDateTime(value: string) {
  return `${value}T00:00:00`
}

function toEndDateTime(value: string) {
  return `${value}T23:59:59`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function formatRate(value: number) {
  return `${new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 1,
  }).format(value)}%`
}

function formatDays(value: number) {
  if (!hasNumber(value)) return '-'
  return `${new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 1,
  }).format(value)}일`
}

function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

onMounted(() => {
  void refreshAll()
})
</script>
