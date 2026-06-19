<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold text-primary">운영 리포트</p>
          <h1 class="text-2xl font-bold text-text-main">자산 운영 변화 리포트</h1>
          <p class="mt-1 text-sm text-text-sub">
            미반납, 반복 지연, 회수 처리, 구매 요청 흐름을 조회합니다.
          </p>
        </div>

        <Button variant="primary" :loading="isRefreshing" @click="refreshAll">
          <RefreshCw :size="16" />
          조회
        </Button>
      </div>

      <div
        v-if="!canViewOperationReports"
        class="rounded-xl border border-border bg-surface p-8 text-center"
      >
        <ShieldAlert :size="32" class="mx-auto mb-3 text-danger" />
        <p class="text-base font-semibold text-text-main">운영 리포트 조회 권한이 없습니다.</p>
        <p class="mt-1 text-sm text-text-sub">최고관리자, 구매자산팀, 부서책임자만 접근할 수 있습니다.</p>
      </div>

      <template v-else>
        <div class="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-5">
          <Input id="report-start-date" v-model="filters.startDate" label="시작일" type="date" />
          <Input id="report-end-date" v-model="filters.endDate" label="종료일" type="date" />

          <label class="flex flex-col gap-2 text-sm font-semibold text-text-main">
            부서
            <select
              v-model="filters.departmentId"
              :disabled="isDepartmentLocked"
              class="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
            >
              <option value="">전체 부서</option>
              <option
                v-for="department in departments"
                :key="department.departmentId"
                :value="department.departmentId"
              >
                {{ department.name }}
              </option>
            </select>
          </label>

          <Input
            id="report-min-overdue-count"
            v-model="filters.minOverdueCount"
            label="반복 지연 기준"
            type="number"
            :min="1"
          />

          <Input
            id="report-page-size"
            v-model="filters.size"
            label="페이지 크기"
            type="number"
            :min="5"
          />
        </div>

        <div class="grid gap-3 md:grid-cols-4">
          <KpiCard
            label="회수 요청 생성"
            :value="formatNumber(returnSummary.created)"
            :loading="returnLoading"
          />
          <KpiCard
            label="회수 완료 처리"
            :value="formatNumber(returnSummary.completed)"
            :loading="returnLoading"
          />
          <KpiCard
            label="평균 회수 소요"
            :value="formatDays(returnSummary.averageDays)"
            :loading="returnLoading"
          />
          <KpiCard
            label="회수 지연 기간"
            :value="formatDays(returnSummary.delayedDays)"
            :loading="returnLoading"
          />
        </div>

        <ReportPanel
          title="부서별 미반납 현황"
          description="미반납 자산수와 반납 지연 건수가 많은 순서로 표시합니다."
          :error="overdueError"
          @retry="loadOverdueAssets"
        >
          <Table
            :columns="overdueColumns"
            :rows="overdueRows"
            :loading="overdueLoading"
            row-key="id"
            empty-text="부서별 미반납 현황이 없습니다."
          />
          <PaginationBar
            :page="overduePage.page"
            :total-pages="overduePage.totalPages"
            @prev="overduePage.page--"
            @next="overduePage.page++"
          />
        </ReportPanel>

        <ReportPanel
          title="사용자별 반복 지연 현황"
          description="지연 건수가 많은 사용자 순서로 표시합니다."
          :error="usersError"
          @retry="loadRepeatedOverdueUsers"
        >
          <Table
            :columns="userColumns"
            :rows="userRows"
            :loading="usersLoading"
            row-key="id"
            empty-text="사용자별 반복 지연 데이터가 없습니다."
          />
          <PaginationBar
            :page="usersPage.page"
            :total-pages="usersPage.totalPages"
            @prev="usersPage.page--"
            @next="usersPage.page++"
          />
        </ReportPanel>

        <ReportPanel
          title="회수 요청 및 처리 현황"
          description="회수 요청 생성, 완료 처리, 평균 소요 기간과 지연 기간을 확인합니다."
          :error="returnError"
          @retry="loadReturnRequests"
        >
          <Table
            :columns="returnColumns"
            :rows="returnRows"
            :loading="returnLoading"
            row-key="id"
            empty-text="회수 요청 처리 상세 데이터가 없습니다."
          />
        </ReportPanel>

        <ReportPanel
          title="부서별 구매 요청 현황"
          description="구매 요청 현황과 누적 수량을 부서별로 표시합니다."
          :error="purchaseError"
          @retry="loadPurchaseRequests"
        >
          <Table
            :columns="purchaseColumns"
            :rows="purchaseRows"
            :loading="purchaseLoading"
            row-key="id"
            empty-text="부서별 구매 요청 데이터가 없습니다."
          />
          <PaginationBar
            :page="purchasePage.page"
            :total-pages="purchasePage.totalPages"
            @prev="purchasePage.page--"
            @next="purchasePage.page++"
          />
        </ReportPanel>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RefreshCw, ShieldAlert } from 'lucide-vue-next'

import { departmentApi, reportApi } from '@/api'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import KpiCard from '@/components/report/KpiCard.vue'
import PaginationBar from '@/components/report/PaginationBar.vue'
import ReportPanel from '@/components/report/ReportPanel.vue'
import { usePermission } from '@/composables'
import { useAuthStore } from '@/stores'
import type {
  Department,
  DepartmentOverdueReportItem,
  PurchaseRequestReportItem,
  RepeatedOverdueUserReportItem,
  ReturnRequestReportItem,
  ReturnRequestReportResponse,
  ReturnRequestReportSummary,
} from '@/types'

type TableRow = Record<string, string | number>
type PageState = { page: number; size: number; totalPages: number; totalElements: number }

const authStore = useAuthStore()
const { hasRole } = usePermission()

const canViewOperationReports = computed(() =>
  hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER', 'DEPARTMENT_MANAGER'),
)
const isDepartmentLocked = computed(() => hasRole('DEPARTMENT_MANAGER'))
const companyId = computed(() => authStore.user?.companyId ?? '')

const filters = reactive({
  startDate: '',
  endDate: '',
  departmentId: '',
  minOverdueCount: 2,
  size: 10,
})

const departments = ref<Department[]>([])

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

const overduePage = reactive<PageState>({ page: 0, size: 10, totalPages: 0, totalElements: 0 })
const usersPage = reactive<PageState>({ page: 0, size: 10, totalPages: 0, totalElements: 0 })
const purchasePage = reactive<PageState>({ page: 0, size: 10, totalPages: 0, totalElements: 0 })

const overdueColumns: Column<TableRow>[] = [
  { key: 'departmentName', label: '부서' },
  { key: 'assetCount', label: '미반납 자산수', align: 'right' },
  { key: 'delayCount', label: '반납 지연 건수', align: 'right' },
  { key: 'overdueDays', label: '누적 지연일', align: 'right' },
]

const userColumns: Column<TableRow>[] = [
  { key: 'memberName', label: '사용자' },
  { key: 'departmentName', label: '부서' },
  { key: 'delayCount', label: '지연 건수', align: 'right' },
  { key: 'overdueDays', label: '누적 지연일', align: 'right' },
  { key: 'latestOverdueDate', label: '최근 지연일' },
]

const returnColumns: Column<TableRow>[] = [
  { key: 'departmentName', label: '부서' },
  { key: 'createdCount', label: '요청 생성', align: 'right' },
  { key: 'completedCount', label: '완료 처리', align: 'right' },
  { key: 'averageDays', label: '평균 소요일', align: 'right' },
  { key: 'overdueDays', label: '지연 기간', align: 'right' },
]

const purchaseColumns: Column<TableRow>[] = [
  { key: 'departmentName', label: '부서' },
  { key: 'requestCount', label: '구매 요청', align: 'right' },
  { key: 'quantity', label: '누적 수량', align: 'right' },
  { key: 'approvedCount', label: '승인', align: 'right' },
  { key: 'completedCount', label: '완료', align: 'right' },
]

const isRefreshing = computed(() =>
  overdueLoading.value || usersLoading.value || returnLoading.value || purchaseLoading.value,
)

const scopedDepartmentId = computed(() => (
  isDepartmentLocked.value ? authStore.user?.departmentId : filters.departmentId
))

const baseRequestParams = computed(() => ({
  // TODO: API 명세/백엔드 확인 필요 - 운영 리포트 endpoint는 company_id를 필수로 요구한다.
  companyId: companyId.value || undefined,
  departmentId: scopedDepartmentId.value || undefined,
  startDate: filters.startDate || undefined,
  endDate: filters.endDate || undefined,
  size: Number(filters.size) || 10,
}))

const returnSummary = computed(() => {
  const summary = returnSummaryRaw.value
  return {
    created: pickNumber(summary.createdCount, summary.requestedCount),
    completed: pickNumber(summary.completedCount),
    averageDays: pickNumber(summary.averageProcessingDays, summary.averageReturnDays),
    delayedDays: pickNumber(summary.overdueDays, summary.delayedDays),
  }
})

const overdueRows = computed<TableRow[]>(() => (
  [...overdueItems.value]
    .sort((a, b) => (
      pickNumber(b.unreturnedAssetCount, b.overdueAssetCount, b.assetCount)
      - pickNumber(a.unreturnedAssetCount, a.overdueAssetCount, a.assetCount)
    ) || (
      pickNumber(b.delayedReturnCount, b.overdueCount)
      - pickNumber(a.delayedReturnCount, a.overdueCount)
    ))
    .map((item, index) => ({
      id: item.departmentId ?? `overdue-${index}`,
      departmentName: item.departmentName ?? item.name ?? '-',
      assetCount: formatNumber(pickNumber(item.unreturnedAssetCount, item.overdueAssetCount, item.assetCount)),
      delayCount: formatNumber(pickNumber(item.delayedReturnCount, item.overdueCount)),
      overdueDays: formatDays(pickNumber(item.totalOverdueDays)),
    }))
))

const userRows = computed<TableRow[]>(() => (
  [...userItems.value]
    .sort((a, b) => pickNumber(b.delayedReturnCount, b.overdueCount) - pickNumber(a.delayedReturnCount, a.overdueCount))
    .map((item, index) => ({
      id: item.memberId ?? `user-${index}`,
      memberName: `${item.memberName ?? item.name ?? '-'}${item.memberNo ? ` (${item.memberNo})` : ''}`,
      departmentName: item.departmentName ?? '-',
      delayCount: formatNumber(pickNumber(item.delayedReturnCount, item.overdueCount)),
      overdueDays: formatDays(pickNumber(item.totalOverdueDays)),
      latestOverdueDate: item.latestOverdueDate ?? '-',
    }))
))

const returnRows = computed<TableRow[]>(() => (
  returnItems.value.map((item, index) => ({
    id: item.departmentId ?? `return-${index}`,
    departmentName: item.departmentName ?? '-',
    createdCount: formatNumber(pickNumber(item.createdCount, item.requestedCount)),
    completedCount: formatNumber(pickNumber(item.completedCount)),
    averageDays: formatDays(pickNumber(item.averageProcessingDays)),
    overdueDays: formatDays(pickNumber(item.overdueDays)),
  }))
))

const purchaseRows = computed<TableRow[]>(() => (
  [...purchaseItems.value]
    .sort((a, b) => (
      pickNumber(b.cumulativeQuantity, b.totalQuantity)
      - pickNumber(a.cumulativeQuantity, a.totalQuantity)
    ) || (
      pickNumber(b.requestCount, b.purchaseRequestCount)
      - pickNumber(a.requestCount, a.purchaseRequestCount)
    ))
    .map((item, index) => ({
      id: item.departmentId ?? `purchase-${index}`,
      departmentName: item.departmentName ?? item.name ?? '-',
      requestCount: formatNumber(pickNumber(item.requestCount, item.purchaseRequestCount)),
      quantity: formatNumber(pickNumber(item.cumulativeQuantity, item.totalQuantity)),
      approvedCount: formatNumber(pickNumber(item.approvedCount)),
      completedCount: formatNumber(pickNumber(item.completedCount)),
    }))
))

async function loadDepartments() {
  if (isDepartmentLocked.value) {
    departments.value = authStore.user?.departmentId
      ? [{
          departmentId: authStore.user.departmentId,
          name: authStore.user.departmentName,
          parentDepartmentId: null,
          memberCount: 0,
          createdAt: '',
        }]
      : []
    filters.departmentId = authStore.user?.departmentId ?? ''
    return
  }

  const response = await departmentApi.getList({ page: 0, size: 200 })
  departments.value = response.data.content
}

async function loadOverdueAssets() {
  overdueLoading.value = true
  overdueError.value = ''
  try {
    const response = await reportApi.getOverdueAssets({
      ...baseRequestParams.value,
      page: overduePage.page,
    })
    overdueItems.value = response.data.content
    updatePage(overduePage, response.data)
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
      ...baseRequestParams.value,
      page: usersPage.page,
      minOverdueCount: Number(filters.minOverdueCount) || undefined,
    })
    userItems.value = response.data.content
    updatePage(usersPage, response.data)
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
    const response = await reportApi.getReturnRequests({
      ...baseRequestParams.value,
      page: 0,
    })
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
    const response = await reportApi.getPurchaseRequests({
      ...baseRequestParams.value,
      page: purchasePage.page,
    })
    purchaseItems.value = response.data.content
    updatePage(purchasePage, response.data)
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

function updatePage<T>(state: PageState, page: { page: number; size: number; totalPages: number; totalElements: number; content: T[] }) {
  state.page = page.page
  state.size = page.size
  state.totalPages = page.totalPages
  state.totalElements = page.totalElements
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return '운영 리포트 데이터를 불러오지 못했습니다.'
}

watch(() => filters.size, () => {
  overduePage.page = 0
  usersPage.page = 0
  purchasePage.page = 0
})

watch(() => [filters.startDate, filters.endDate, filters.departmentId, filters.minOverdueCount, filters.size], () => {
  if (!canViewOperationReports.value) return
  overduePage.page = 0
  usersPage.page = 0
  purchasePage.page = 0
  void refreshAll()
})

watch(() => overduePage.page, () => { void loadOverdueAssets() })
watch(() => usersPage.page, () => { void loadRepeatedOverdueUsers() })
watch(() => purchasePage.page, () => { void loadPurchaseRequests() })

onMounted(async () => {
  if (!canViewOperationReports.value) return
  await loadDepartments()
  await refreshAll()
})
</script>
