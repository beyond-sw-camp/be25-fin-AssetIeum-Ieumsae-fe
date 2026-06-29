<template>
  <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <div class="mb-4">
      <h2 class="text-base font-bold text-text-main">부서별 예산 현황</h2>
      <p class="mt-1 text-xs text-text-sub">부서별 가용 예산과 집행 대기, 실제 사용 금액을 확인합니다.</p>
    </div>

    <div class="mb-4 rounded-lg border border-border bg-surface p-4">
      <div class="text-sm font-bold text-text-main">전사 예산 총괄</div>

      <div class="mb-4 flex flex-col gap-2 items-end">
        <div class="flex gap-4 text-xs font-semibold text-text-sub">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-slate-100 ring-1 ring-border dark:bg-slate-600"></span>
            전체 예산 
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-primary-trans"></span>
            집행 대기 
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
            실제 사용 
          </span>
        </div>
      </div>

      <div class="relative h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-600">
        <div
          class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full bg-primary-trans"
          :style="{ width: `${clampPercent(budgetCommittedPercent)}%` }"
        />
        <div
          class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full bg-primary"
          :style="{ width: `${clampPercent(budgetUsedPercent)}%` }"
        />
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-4">
        <div
          v-for="item in summaryItems"
          :key="item.label"
          class="rounded-lg border border-border bg-surface px-4 py-3"
        >
          <p class="text-xs font-semibold text-text-muted">{{ item.label }}</p>
          <p class="mt-2 text-sm font-bold text-text-main">{{ formatCurrency(item.value) }}</p>
        </div>
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

      <template #cell-available="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-limit="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-used="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-held="{ value }">
        <span class="font-bold text-text-main">{{ formatCurrency(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-percent="{ row }">
        <div class="flex items-center justify-center gap-2">
          <div class="relative h-2 w-25 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-600">
            <div
              class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full bg-primary"
              :style="{ width: `${clampPercent(row.percent)}%` }"
            />
          </div>
          <span class="w-11 text-xs font-semibold text-text-sub">
            {{ clampPercent(row.percent) }}%
          </span>
        </div>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import Table, { type Column } from '@/components/common/Table.vue'

export interface BudgetRow extends Record<string, unknown> {
  departmentId: string
  department: string
  limit: number
  available: number
  held: number
  committed: number
  used: number
  percent: number
  isCommon?: boolean
}

const budgetColumns: Column<BudgetRow>[] = [
  { key: 'department', label: '부서명', width: '15%', align: 'center' },
  { key: 'available', label: '가용 예산', width: '17%', align: 'center' },
  { key: 'held', label: '집행 대기', width: '17%', align: 'center' },
  { key: 'used', label: '실제 사용', width: '17%', align: 'center' },
  { key: 'limit', label: '총 예산', width: '17%', align: 'center' },
  { key: 'percent', label: '가용률', width: '14%', align: 'center' },
]

const props = defineProps<{
  budgetRows: BudgetRow[]
  totalBudgetHeld: number
  totalBudgetCommitted: number
  totalBudgetUsed: number
  totalBudgetLimit: number
  budgetCommittedPercent: number
  budgetUsedPercent: number
}>()

const summaryItems = computed(() => [
  { label: '가용 예산', value: Math.max(props.totalBudgetLimit - props.totalBudgetCommitted, 0) },
  { label: '집행 대기 금액', value: props.totalBudgetHeld },
  { label: '실제 사용 금액', value: props.totalBudgetUsed },
  { label: '총 예산', value: props.totalBudgetLimit },
])

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100)

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`
</script>
