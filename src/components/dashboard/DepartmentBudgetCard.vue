<template>
  <div class="rounded-xl border border-border bg-surface p-6 shadow-sm">
    <h2 class="mb-8 text-xl font-bold text-text-main">부서별 예산 현황</h2>

    <div class="mb-7 rounded-xl border border-border bg-surface p-4">
      <div class="mb-6 text-sm font-bold text-text-main">전사 공통 예산</div>

      <div class="mb-4 flex items-center justify-between gap-4">
        <strong class="text-lg font-bold text-text-main">
          {{ formatCurrency(totalBudgetUsed) }} / {{ formatCurrency(totalBudgetLimit) }}
        </strong>
        <span class="text-lg font-bold text-primary">{{ budgetUsagePercent }}%</span>
      </div>

      <div class="h-4 overflow-hidden rounded-full bg-surface-secondary">
        <div
          class="h-full rounded-full bg-primary"
          :style="{ width: `${clampPercent(budgetUsagePercent)}%` }"
        />
      </div>
    </div>

    <Table
      :columns="budgetColumns"
      :rows="budgetRows"
      row-key="department"
      empty-text="부서별 예산 정보가 없습니다."
    >
      <template #cell-department="{ value }">
        <span class="font-bold text-text-main">{{ value }}</span>
      </template>

      <template #cell-limit="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-used="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-percent="{ row }">
        <div class="flex items-center justify-center gap-3">
          <span class="w-10 text-right text-sm font-semibold text-text-sub">
            {{ row.percent }}%
          </span>
          <div class="h-2 w-24 overflow-hidden rounded-full bg-surface-secondary">
            <div
              class="h-full rounded-full bg-primary"
              :style="{ width: `${clampPercent(row.percent)}%` }"
            />
          </div>
        </div>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import Table, { type Column } from '@/components/common/Table.vue'

export interface BudgetRow extends Record<string, unknown> {
  departmentId: string
  department: string
  limit: number
  used: number
  percent: number
}

const budgetColumns: Column<BudgetRow>[] = [
  { key: 'department', label: '부서', width: '25%', align: 'center' },
  { key: 'used', label: '사용 금액', width: '25%', align: 'center' },
  { key: 'limit', label: '총 예산', width: '25%', align: 'center' },
  { key: 'percent', label: '사용률', width: '25%', align: 'center' },
]

defineProps<{
  budgetRows: BudgetRow[]
  totalBudgetUsed: number
  totalBudgetLimit: number
  budgetUsagePercent: number
}>()

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100)

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`
</script>
