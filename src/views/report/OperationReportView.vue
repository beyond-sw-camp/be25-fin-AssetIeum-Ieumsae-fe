<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-8">
      <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="page-subtitle mb-1">운영 리포트</p>
          <h1 class="page-title">자산 운영 변화 리포트</h1>
        </div>
        <div>
          <Button variant="outline" :loading="isRefreshing" @click="refreshAll">
            <RefreshCw :size="16" />
            새로고침
          </Button>
        </div>
      </header>

      <div
        v-if="!canViewOperationReports"
        class="rounded-xl border border-border bg-surface p-8 text-center shadow-sm"
      >
        <ShieldAlert :size="32" class="mx-auto mb-3 text-danger" />
        <p class="text-base font-semibold text-text-main">운영 리포트 조회 권한이 없습니다.</p>
        <p class="mt-1 text-sm text-text-sub">구매자산팀과 구매자산팀장만 접근할 수 있습니다.</p>
      </div>

      <template v-else>
        <section class="rounded-xl border border-border bg-surface p-7 shadow-sm">
          <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <div class="grid content-center gap-5">
              <SummaryTile
                label="전체 미반납 자산 수"
                caption="전체 부서 대상"
                :value="`${formatNumber(totalUnreturnedAssets)}건`"
              />
              <SummaryTile
                label="전체 반납 지연 건수"
                caption="반납 예정일 초과 건"
                :value="`${formatNumber(totalDelayedReturns)}건`"
              />
            </div>

            <div class="min-h-80">
              <GroupedBarChart
                :items="departmentChartItems"
                primary-label="미반납 자산 수"
                secondary-label="반납 지연 건수"
              />
              <p v-if="overdueError" class="mt-2 text-xs font-semibold text-danger">{{ overdueError }}</p>
            </div>
          </div>
        </section>

        <NumberedReportSection number="1" title="사용자별 반복 지연 현황">
          <template #description>
            동일한 사용자가 상습적으로 반납을 지연시키는 사용자별 반복 지연 현황을 분석하고 목록을 조회할 수 있습니다.
          </template>

          <div class="grid gap-4 lg:grid-cols-[11rem_1fr]">
            <MetricCard
              tone="blue"
              label="상습 지연 사용자 수"
              :value="`${formatNumber(repeatedUserCount)}명`"
              caption="전체 사용자 대비 8.5%"
            />

            <div class="rounded-lg border border-border bg-surface p-3">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-bold text-text-main">상습 지연 사용자 TOP 5</h3>
                <Button variant="outline" size="sm" disabled>엑셀 다운로드</Button>
              </div>
              <Table
                :columns="userColumns"
                :rows="userTopRows"
                :loading="usersLoading"
                row-key="rank"
                empty-text="사용자별 반복 지연 데이터가 없습니다."
              />
              <p v-if="usersError" class="mt-2 text-xs font-semibold text-danger">{{ usersError }}</p>
            </div>
          </div>
        </NumberedReportSection>

        <NumberedReportSection number="2" title="회수 요청 및 처리 현황">
          <template #description>
            회수 요청 생성 수, 회수 완료 처리 수, 평균 회수 소요 기간, 회수 지연 기간 현황을 조회할 수 있습니다.
          </template>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              tone="blue"
              label="회수 요청 생성 수"
              :value="`${formatNumber(returnSummary.created)}건`"
              caption="전 기간 대비 ▲ 12.5%"
            />
            <MetricCard
              tone="green"
              label="회수 완료 처리 수"
              :value="`${formatNumber(returnSummary.completed)}건`"
              caption="전 기간 대비 ▲ 8.3%"
            />
            <MetricCard
              tone="amber"
              label="평균 회수 소요 기간"
              :value="formatDays(returnSummary.averageDays)"
              caption="전 기간 대비 ▼ 0.7일"
            />
            <MetricCard
              tone="red"
              label="회수 지연 기간 (합계)"
              :value="formatDays(returnSummary.delayedDays)"
              caption="전 기간 대비 ▲ 15.2%"
            />
          </div>
          <p v-if="returnError" class="mt-2 text-xs font-semibold text-danger">{{ returnError }}</p>
        </NumberedReportSection>

        <NumberedReportSection number="3" title="신규 구매 및 부서별 구매 요청 현황">
          <template #description>
            특정 기간 동안 새로 구매하여 자산 시스템에 등록된 신규 구매 수량과 부서별 구매 요청 현황 및 누적 수량을 조회할 수 있습니다.
          </template>

          <div class="grid gap-4 xl:grid-cols-[11rem_1fr_23rem]">
            <MetricCard
              tone="purple"
              label="신규 구매 수량"
              :value="`${formatNumber(totalPurchaseQuantity)}개`"
              caption="전 기간 대비 ▲ 14.7%"
            />

            <div class="rounded-lg border border-border bg-surface p-3">
              <h3 class="mb-2 text-sm font-bold text-text-main">부서별 구매 요청 현황</h3>
              <Table
                :columns="purchaseColumns"
                :rows="purchaseTopRows"
                :loading="purchaseLoading"
                row-key="departmentName"
                empty-text="부서별 구매 요청 데이터가 없습니다."
              />
            </div>

            <div class="rounded-lg border border-border bg-surface p-4">
              <h3 class="mb-3 text-sm font-bold text-text-main">부서별 누적 구매 수량</h3>
              <HorizontalBarChart :items="purchaseQuantityChartItems" unit="개" />
            </div>
          </div>
          <p v-if="purchaseError" class="mt-2 text-xs font-semibold text-danger">{{ purchaseError }}</p>
        </NumberedReportSection>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw, ShieldAlert } from 'lucide-vue-next'

import { reportApi } from '@/api'
import Button from '@/components/common/Button.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import GroupedBarChart, { type GroupedBarItem } from '@/components/report/GroupedBarChart.vue'
import HorizontalBarChart from '@/components/report/HorizontalBarChart.vue'
import MetricCard from '@/components/report/MetricCard.vue'
import NumberedReportSection from '@/components/report/NumberedReportSection.vue'
import SummaryTile from '@/components/report/SummaryTile.vue'
import { usePermission } from '@/composables'
import { useAuthStore } from '@/stores'
import type {
  DepartmentOverdueReportItem,
  PurchaseRequestReportItem,
  RepeatedOverdueUserReportItem,
  ReturnRequestReportItem,
  ReturnRequestReportResponse,
  ReturnRequestReportSummary,
} from '@/types'

type TableRow = Record<string, string | number>

const authStore = useAuthStore()
const { hasRole } = usePermission()

const canViewOperationReports = computed(() => hasRole('ASSET_TEAM', 'ASSET_MANAGER'))
const companyId = computed(() => authStore.user?.companyId ?? '')

const overdueLoading = ref(false)
const usersLoading = ref(false)
const returnLoading = ref(false)
const purchaseLoading = ref(false)
const overdueError = ref('')
const usersError = ref('')
const returnError = ref('')
const purchaseError = ref('')

const overdueItems = ref<DepartmentOverdueReportItem[]>([])
const userItems = ref<RepeatedOverdueUserReportItem[]>([])
const returnItems = ref<ReturnRequestReportItem[]>([])
const purchaseItems = ref<PurchaseRequestReportItem[]>([])
const returnSummaryRaw = ref<ReturnRequestReportSummary>({})

const userColumns: Column<TableRow>[] = [
  { key: 'rank', label: '순위', align: 'center', width: '4rem' },
  { key: 'memberName', label: '사용자' },
  { key: 'departmentName', label: '소속 부서' },
  { key: 'delayCount', label: '지연 건수', align: 'right' },
  { key: 'averageDays', label: '평균 지연 기간', align: 'right' },
  { key: 'latestOverdueDate', label: '최근 지연일' },
]

const purchaseColumns: Column<TableRow>[] = [
  { key: 'departmentName', label: '부서' },
  { key: 'requestCount', label: '구매 요청 수', align: 'right' },
  { key: 'approvedCount', label: '구매 승인 수', align: 'right' },
  { key: 'completedCount', label: '구매 완료 수', align: 'right' },
  { key: 'quantity', label: '누적 구매 수량', align: 'right' },
]

const isRefreshing = computed(() =>
  overdueLoading.value || usersLoading.value || returnLoading.value || purchaseLoading.value,
)

const requestParams = computed(() => ({
  companyId: companyId.value || undefined,
  page: 0,
  size: 10,
}))

const totalUnreturnedAssets = computed(() =>
  overdueItems.value.reduce((sum, item) => sum + pickNumber(item.unreturnedAssetCount, item.overdueAssetCount, item.assetCount), 0),
)

const totalDelayedReturns = computed(() =>
  overdueItems.value.reduce((sum, item) => sum + pickNumber(item.delayedReturnCount, item.overdueCount), 0),
)

const repeatedUserCount = computed(() => userItems.value.length)

const returnSummary = computed(() => {
  const summary = returnSummaryRaw.value
  return {
    created: pickNumber(summary.createdCount, summary.requestedCount),
    completed: pickNumber(summary.completedCount),
    averageDays: pickNumber(summary.averageProcessingDays, summary.averageReturnDays),
    delayedDays: pickNumber(summary.overdueDays, summary.delayedDays),
  }
})

const totalPurchaseQuantity = computed(() =>
  purchaseItems.value.reduce((sum, item) => sum + pickNumber(item.cumulativeQuantity, item.totalQuantity), 0),
)

const departmentChartItems = computed<GroupedBarItem[]>(() =>
  overdueItems.value.slice(0, 10).map((item) => ({
    label: shortenLabel(item.departmentName ?? item.name ?? '-'),
    primary: pickNumber(item.unreturnedAssetCount, item.overdueAssetCount, item.assetCount),
    secondary: pickNumber(item.delayedReturnCount, item.overdueCount),
  })),
)

const userTopRows = computed<TableRow[]>(() =>
  [...userItems.value]
    .sort((a, b) => pickNumber(b.delayedReturnCount, b.overdueCount) - pickNumber(a.delayedReturnCount, a.overdueCount))
    .slice(0, 5)
    .map((item, index) => ({
      rank: index + 1,
      memberName: item.memberName ?? item.name ?? '-',
      departmentName: item.departmentName ?? '-',
      delayCount: `${formatNumber(pickNumber(item.delayedReturnCount, item.overdueCount))}건`,
      averageDays: formatDays(Math.round(pickNumber(item.totalOverdueDays) / Math.max(pickNumber(item.delayedReturnCount, item.overdueCount), 1))),
      latestOverdueDate: item.latestOverdueDate ?? '-',
    })),
)

const purchaseTopRows = computed<TableRow[]>(() =>
  [...purchaseItems.value]
    .sort((a, b) => pickNumber(b.cumulativeQuantity, b.totalQuantity) - pickNumber(a.cumulativeQuantity, a.totalQuantity))
    .slice(0, 5)
    .map((item) => ({
      departmentName: item.departmentName ?? item.name ?? '-',
      requestCount: `${formatNumber(pickNumber(item.requestCount, item.purchaseRequestCount))}건`,
      approvedCount: `${formatNumber(pickNumber(item.approvedCount))}건`,
      completedCount: `${formatNumber(pickNumber(item.completedCount))}건`,
      quantity: `${formatNumber(pickNumber(item.cumulativeQuantity, item.totalQuantity))}개`,
    })),
)

const purchaseQuantityChartItems = computed(() =>
  purchaseTopRows.value.map((row) => ({
    label: String(row.departmentName),
    value: Number(String(row.quantity).replace(/[^\d]/g, '')) || 0,
  })),
)

async function loadOverdueAssets() {
  overdueLoading.value = true
  overdueError.value = ''
  try {
    const response = await reportApi.getOverdueAssets(requestParams.value)
    overdueItems.value = response.data.content
  } catch (error) {
    overdueError.value = getErrorMessage(error)
  } finally {
    overdueLoading.value = false
  }
}

async function loadRepeatedOverdueUsers() {
  usersLoading.value = true
  usersError.value = ''
  try {
    const response = await reportApi.getRepeatedOverdueUsers({
      ...requestParams.value,
      minOverdueCount: 2,
    })
    userItems.value = response.data.content
  } catch (error) {
    usersError.value = getErrorMessage(error)
  } finally {
    usersLoading.value = false
  }
}

async function loadReturnRequests() {
  returnLoading.value = true
  returnError.value = ''
  try {
    const response = await reportApi.getReturnRequests(requestParams.value)
    const data = response.data
    returnSummaryRaw.value = data.summary ?? buildSummaryFromReturnItems(data)
    returnItems.value = data.content ?? data.items ?? []
  } catch (error) {
    returnError.value = getErrorMessage(error)
  } finally {
    returnLoading.value = false
  }
}

async function loadPurchaseRequests() {
  purchaseLoading.value = true
  purchaseError.value = ''
  try {
    const response = await reportApi.getPurchaseRequests(requestParams.value)
    purchaseItems.value = response.data.content
  } catch (error) {
    purchaseError.value = getErrorMessage(error)
  } finally {
    purchaseLoading.value = false
  }
}

async function refreshAll() {
  if (!canViewOperationReports.value) return
  await Promise.all([
    loadOverdueAssets(),
    loadRepeatedOverdueUsers(),
    loadReturnRequests(),
    loadPurchaseRequests(),
  ])
}

function buildSummaryFromReturnItems(data: ReturnRequestReportResponse): ReturnRequestReportSummary {
  const items = data.content ?? data.items ?? []
  return items.reduce<ReturnRequestReportSummary>((summary, item) => ({
    createdCount: pickNumber(summary.createdCount) + pickNumber(item.createdCount, item.requestedCount),
    completedCount: pickNumber(summary.completedCount) + pickNumber(item.completedCount),
    averageProcessingDays: pickNumber(summary.averageProcessingDays, item.averageProcessingDays),
    overdueDays: pickNumber(summary.overdueDays) + pickNumber(item.overdueDays),
  }), {})
}

function pickNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function formatDays(value: number) {
  return value > 0 ? `${formatNumber(value)}일` : '-'
}

function shortenLabel(value: string) {
  return value.replace('개발', '').replace('본부', '').replace('팀', '팀')
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return '운영 리포트 데이터를 불러오지 못했습니다.'
}

onMounted(() => {
  void refreshAll()
})
</script>
