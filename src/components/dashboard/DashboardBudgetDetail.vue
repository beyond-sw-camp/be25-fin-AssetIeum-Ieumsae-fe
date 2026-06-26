<template>
  <BaseDrawer
    :is-open="isOpen"
    title="부서 예산 상세"
    panel-class="w-full max-w-6xl"
    body-class="p-0"
    hide-footer
    @close="emit('close')"
  >
    <div class="flex h-full min-h-0 flex-col">
      <div class="shrink-0 border-b border-border px-6 py-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-primary">{{ summary.departmentName || departmentName }}</p>
            <h3 class="mt-1 text-lg font-bold text-text-main">{{ currentYear }}년 예산 현황</h3>
          </div>
          <Button variant="secondary" size="sm" :disabled="isLoading" @click="loadDetails">
            <RefreshCw :size="14" />
            새로고침
          </Button>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="item in summaryItems" :key="item.label" class="border-l-2 border-primary/30 px-4 py-2">
            <p class="text-xs font-semibold text-text-sub">{{ item.label }}</p>
            <p class="mt-2 text-lg font-bold text-text-main">{{ item.value }}</p>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p
          v-if="errorMessage"
          class="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>

        <section class="mb-6">
          <h4 class="mb-3 text-sm font-bold text-text-main">카테고리별 사용 내역</h4>
          <div v-if="summary.categoryUsages.length" class="grid gap-3 md:grid-cols-2">
            <div v-for="usage in summary.categoryUsages" :key="usage.categoryName" class="border-b border-border px-1 py-3">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-semibold text-text-main">{{ usage.categoryName }}</span>
                <span class="font-bold text-primary">{{ formatCurrency(usage.amount) }} · {{ usage.percentage }}%</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  class="dashboard-bar-fill h-full rounded-full bg-primary"
                  :style="{ width: `${clampPercent(usage.percentage)}%` }"
                />
              </div>
            </div>
          </div>
          <p v-else class="py-6 text-center text-sm text-text-sub">예산 사용 내역이 없습니다.</p>
        </section>

        <section v-if="canViewBudgetHistories">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-bold text-text-main">예산 집행 장부</h4>
            <span class="text-xs text-text-sub">총 {{ ledgerRows.length.toLocaleString() }}건</span>
          </div>
          <Table
            :columns="ledgerColumns"
            :rows="ledgerRows"
            row-key="historyId"
            :loading="isLoading"
            empty-text="예산 집행 이력이 없습니다."
          >
            <template #cell-date="{ value }">{{ formatDate(String(value ?? '')) }}</template>
            <template #cell-amount="{ value }">
              <span class="font-semibold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
            </template>
            <template #cell-usedAmountChange="{ row }">
              {{ formatAmountChange(row.usedAmountBefore, row.usedAmountAfter) }}
            </template>
            <template #cell-holdAmountChange="{ row }">
              {{ formatAmountChange(row.holdAmountBefore, row.holdAmountAfter) }}
            </template>
            <template #cell-totalBudget="{ value }">{{ formatCurrency(Number(value ?? 0)) }}</template>
          </Table>
        </section>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { budgetApi } from '@/api/budget.api'
import { dashboardApi } from '@/api/dashboard.api'
import { usePermission } from '@/composables'
import type { BudgetHistoryItem, BudgetHistoryType, DepartmentBudgetDetail } from '@/types'

interface LedgerRow extends Record<string, unknown> {
  historyId: string
  date: string
  type: string
  usage: string
  amount: number
  usedAmountBefore: number
  usedAmountAfter: number
  holdAmountBefore: number
  holdAmountAfter: number
  totalBudget: number
}

const EMPTY_SUMMARY: DepartmentBudgetDetail = {
  departmentName: '-',
  totalAmount: 0,
  usedAmount: 0,
  remainingAmount: 0,
  usageRate: 0,
  categoryUsages: [],
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  departmentId?: string
  departmentName?: string
}>(), {
  departmentId: undefined,
  departmentName: '-',
})

const emit = defineEmits<{
  close: []
}>()

const { hasRole } = usePermission()
const canViewBudgetHistories = computed(() => hasRole('ASSET_MANAGER', 'ASSET_TEAM', 'ADMIN'))
const currentYear = new Date().getFullYear()
const summary = ref<DepartmentBudgetDetail>({ ...EMPTY_SUMMARY })
const historyItems = ref<BudgetHistoryItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const ledgerColumns: Column<LedgerRow>[] = [
  { key: 'date', label: '일자', width: '12%' },
  { key: 'type', label: '유형', width: '12%', align: 'center' },
  { key: 'usage', label: '상세 내용', width: '20%' },
  { key: 'amount', label: '금액', width: '14%', align: 'right' },
  { key: 'usedAmountChange', label: '사용 금액', width: '16%', align: 'right' },
  { key: 'holdAmountChange', label: '집행 대기', width: '16%', align: 'right' },
  { key: 'totalBudget', label: '총예산', width: '14%', align: 'right' },
]

const summaryItems = computed(() => [
  { label: '총 예산', value: formatCurrency(summary.value.totalAmount) },
  { label: '사용 금액', value: formatCurrency(summary.value.usedAmount) },
  { label: '가용 예산', value: formatCurrency(summary.value.remainingAmount) },
  { label: '소진율', value: `${summary.value.usageRate}%` },
])

const ledgerRows = computed<LedgerRow[]>(() => historyItems.value.map((item) => ({
  historyId: String(item.historyId),
  date: item.createdAt,
  type: historyTypeLabel(item.historyType),
  usage: item.description || '-',
  amount: item.amount,
  usedAmountBefore: item.usedAmountBefore,
  usedAmountAfter: item.usedAmountAfter,
  holdAmountBefore: item.holdAmountBefore,
  holdAmountAfter: item.holdAmountAfter,
  totalBudget: item.totalBudget,
})))

watch(
  () => [props.isOpen, props.departmentId],
  ([isOpen]) => {
    if (isOpen) void loadDetails()
  },
)

async function loadDetails() {
  if (!props.isOpen || !props.departmentId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const summaryResponse = await dashboardApi.getDepartmentBudgetDetails(props.departmentId, currentYear)
    summary.value = summaryResponse.data

    if (canViewBudgetHistories.value) {
      try {
        const historyResponse = await budgetApi.getHistories({
          departmentId: props.departmentId,
          budgetYear: currentYear,
          page: 0,
          size: 1000,
        })
        historyItems.value = historyResponse.data.content
      } catch {
        historyItems.value = []
        errorMessage.value = '예산 이력 목록을 불러오지 못했습니다.'
      }
    } else {
      historyItems.value = []
    }
  } catch {
    summary.value = { ...EMPTY_SUMMARY, departmentName: props.departmentName }
    historyItems.value = []
    errorMessage.value = '부서 예산 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(value: number) {
  return `₩ ${Number(value || 0).toLocaleString('ko-KR')}`
}

function formatAmountChange(before: number, after: number) {
  return `${Number(before || 0).toLocaleString('ko-KR')} → ${Number(after || 0).toLocaleString('ko-KR')}원`
}

function historyTypeLabel(type: BudgetHistoryType) {
  const labels: Record<BudgetHistoryType, string> = {
    HOLD_INCREASE: '집행 대기',
    HOLD_DECREASE: '대기 해제',
    USE_INCREASE: '예산 사용',
    RECOVERY: '예산 복구',
    TRANSFER: '예산 이체',
  }
  return labels[type]
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100)
}
</script>
