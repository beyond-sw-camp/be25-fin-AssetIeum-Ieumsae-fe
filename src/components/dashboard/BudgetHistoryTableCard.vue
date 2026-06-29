<template>
  <section class="rounded-lg border border-border bg-surface shadow-sm">
    <div class="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-base font-bold text-text-main">예산 집행 이력 장부</h2>
        <p class="mt-1 text-xs text-text-sub">부서 예산의 집행·대기·복구 이력을 조회합니다.</p>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <Dropdown
          v-model="departmentId"
          :options="departmentOptions"
          class="w-40"
          menu-strategy="fixed"
          menu-align="right"
        />
        <Dropdown
          v-model="budgetYear"
          :options="yearOptions"
          class="w-32"
          menu-strategy="fixed"
          menu-align="right"
        />
        <Button :loading="isLoading" @click="applyFilters">
          <Search :size="14" />
          조회
        </Button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="mx-5 mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      {{ errorMessage }}
    </p>

    <div class="overflow-x-auto px-5 py-4">
      <Table
        :columns="columns"
        :rows="rows"
        row-key="historyId"
        :loading="isLoading"
        empty-text="예산 집행 이력이 없습니다."
      >
        <template #cell-createdAt="{ value }">
          {{ formatDateTime(String(value ?? '')) }}
        </template>
        <template #cell-historyTypeLabel="{ row }">
          <span :class="historyTypeBadgeClass(row.historyType)">
            {{ row.historyTypeLabel }}
          </span>
        </template>
        <template #cell-amount="{ row }">
          <span :class="amountClass(row.historyType)">
            {{ formatAmount(row.amount, row.historyType) }}
          </span>
        </template>
        <template #cell-balance="{ value }">
          <span class="font-semibold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
        </template>
      </Table>
    </div>

    <div
      v-if="totalElements > 0"
      class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-t border-border px-5 py-3"
    >
      <span class="text-xs text-text-sub">총 {{ totalElements.toLocaleString() }}건 중 {{ rangeText }}</span>
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :disabled="isLoading"
        @change="changePage"
      />
      <span aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Pagination from '@/components/common/Pagination.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { budgetApi } from '@/api/budget.api'
import { ApiError } from '@/api/client'
import type { BudgetHistoryItem, BudgetHistoryType, DropdownOption } from '@/types'

interface DepartmentOption {
  departmentId: string
  departmentName: string
}

interface BudgetHistoryRow extends Record<string, unknown> {
  historyId: string
  createdAt: string
  departmentName: string
  historyType: BudgetHistoryType
  historyTypeLabel: string
  description: string
  amount: number
  balance: number
}

const props = defineProps<{
  departments: DepartmentOption[]
}>()

const PAGE_SIZE = 10
const currentYear = new Date().getFullYear()
const historyItems = ref<BudgetHistoryItem[]>([])
const departmentId = ref('')
const budgetYear = ref(String(currentYear))
const page = ref(0)
const totalElements = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')

const columns: Column<BudgetHistoryRow>[] = [
  { key: 'createdAt', label: '날짜', width: '15%' },
  { key: 'departmentName', label: '부서명', width: '15%' },
  { key: 'historyTypeLabel', label: '구분', width: '12%', align: 'center' },
  { key: 'description', label: '사유', width: '28%' },
  { key: 'amount', label: '금액', width: '15%', align: 'right' },
  { key: 'balance', label: '가용 잔액', width: '15%', align: 'right' },
]

const departmentOptions = computed<DropdownOption[]>(() => [
  { label: '전체 부서', value: '' },
  ...props.departments.map((department) => ({
    label: department.departmentName,
    value: department.departmentId,
  })),
])
const yearOptions: DropdownOption[] = Array.from({ length: 5 }, (_, index) => {
  const year = currentYear - index
  return { label: `${year}년`, value: String(year) }
})
const rows = computed<BudgetHistoryRow[]>(() => historyItems.value.map((item) => ({
  historyId: String(item.historyId),
  createdAt: item.createdAt,
  departmentName: item.departmentName || '-',
  historyType: item.historyType,
  historyTypeLabel: historyTypeLabel(item.historyType),
  description: item.description || '-',
  amount: item.amount,
  balance: Math.max(item.totalBudget - item.usedAmountAfter - item.holdAmountAfter, 0),
})))
const rangeText = computed(() => {
  if (totalElements.value === 0) return '0건'
  const start = page.value * PAGE_SIZE + 1
  const end = Math.min(start + historyItems.value.length - 1, totalElements.value)
  return `${start}-${end}건`
})

function applyFilters() {
  page.value = 0
  void loadHistories()
}

function changePage(nextPage: number) {
  if (nextPage < 0 || nextPage >= totalPages.value || nextPage === page.value) return
  page.value = nextPage
  void loadHistories()
}

async function loadHistories() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await budgetApi.getHistories({
      departmentId: departmentId.value || undefined,
      budgetYear: Number(budgetYear.value),
      page: page.value,
      size: PAGE_SIZE,
    })
    historyItems.value = response.data.content
    page.value = response.data.page
    totalElements.value = response.data.totalElements
    totalPages.value = Math.max(response.data.totalPages, 1)
  } catch (error) {
    historyItems.value = []
    totalElements.value = 0
    totalPages.value = 1
    errorMessage.value = error instanceof ApiError
      ? error.message
      : '예산 집행 이력을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function historyTypeLabel(type: BudgetHistoryType) {
  const labels: Record<BudgetHistoryType, string> = {
    HOLD_INCREASE: '대기',
    HOLD_DECREASE: '해제',
    USE_INCREASE: '차감',
    RECOVERY: '복구',
    TRANSFER: '이체',
  }
  return labels[type]
}

function historyTypeBadgeClass(type: BudgetHistoryType) {
  const baseClass = 'rounded px-2 py-1 text-xs font-semibold'
  if (type === 'HOLD_INCREASE') return `${baseClass} bg-warning/10 text-warning`
  if (type === 'HOLD_DECREASE' || type === 'RECOVERY') return `${baseClass} bg-success/10 text-success`
  if (type === 'USE_INCREASE') return `${baseClass} bg-danger/10 text-danger`
  return `${baseClass} bg-primary/10 text-primary`
}

function amountClass(type: BudgetHistoryType) {
  return type === 'HOLD_DECREASE' || type === 'RECOVERY'
    ? 'font-bold text-success'
    : type === 'TRANSFER'
      ? 'font-bold text-primary'
      : 'font-bold text-danger'
}

function formatAmount(value: number, type: BudgetHistoryType) {
  const isIncrease = type === 'HOLD_DECREASE' || type === 'RECOVERY'
  const sign = type === 'TRANSFER' ? '' : isIncrease ? '+' : '-'
  return `${sign} ${formatCurrency(Math.abs(value))}`
}

function formatCurrency(value: number) {
  return `₩${Number(value || 0).toLocaleString('ko-KR')}`
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(loadHistories)
</script>
