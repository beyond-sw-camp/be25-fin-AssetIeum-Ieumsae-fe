<template>
  <div class="rounded-xl border border-border bg-surface p-4 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-bold text-text-main">부서별 예산 현황</h2>
      <span class="text-xs font-semibold text-primary">{{ budgetUsagePercent }}%</span>
    </div>
    <div class="mb-4 h-3 overflow-hidden rounded-full bg-surface-secondary">
      <div
        class="h-full rounded-full bg-primary"
        :style="{ width: `${budgetUsagePercent}%` }"
      ></div>
    </div>
    <div class="mb-4 flex items-center justify-between text-xs">
      <span class="text-text-sub">전체 사용 예산</span>
      <strong class="text-text-main">{{ formatCurrency(totalBudgetUsed) }} / {{ formatCurrency(totalBudgetLimit) }}</strong>
    </div>
    <div class="space-y-3">
      <div v-for="budget in budgetRows" :key="budget.department">
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-semibold text-text-main">{{ budget.department }}</span>
          <span class="text-text-sub">{{ budget.percent }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <div
            class="h-full rounded-full bg-primary"
            :style="{ width: `${budget.percent}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BudgetRow {
  department: string
  limit: number
  used: number
  percent: number
}

defineProps<{
  budgetRows: BudgetRow[]
  totalBudgetUsed: number
  totalBudgetLimit: number
  budgetUsagePercent: number
}>()

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`
</script>
