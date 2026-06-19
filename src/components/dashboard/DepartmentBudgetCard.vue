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
        ></div>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-border bg-surface">
      <table class="w-full table-fixed border-collapse text-sm">
        <thead class="bg-surface-secondary text-text-main">
          <tr class="border-b border-border">
            <th class="px-6 py-5 text-center font-bold">부서</th>
            <th class="px-6 py-5 text-center font-bold">예산(총액)</th>
            <th class="px-6 py-5 text-center font-bold">사용 금액</th>
            <th class="px-6 py-5 text-center font-bold">사용률</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="budget in budgetRows"
            :key="budget.department"
            class="border-b border-border last:border-b-0"
          >
            <td class="px-6 py-5 text-center font-bold text-text-main">
              {{ budget.department }}
            </td>
            <td class="px-6 py-5 text-center font-bold text-text-main">
              {{ formatCurrency(budget.limit) }}
            </td>
            <td class="px-6 py-5 text-center font-bold text-text-main">
              {{ formatCurrency(budget.used) }}
            </td>
            <td class="px-6 py-5">
              <div class="flex items-center justify-center gap-3">
                <span class="w-10 text-right text-sm font-semibold text-text-sub">
                  {{ budget.percent }}%
                </span>
                <div class="h-2 w-24 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    class="h-full rounded-full bg-primary"
                    :style="{ width: `${clampPercent(budget.percent)}%` }"
                  ></div>
                </div>
              </div>
            </td>
          </tr>

          <tr v-if="budgetRows.length === 0">
            <td colspan="4" class="px-6 py-10 text-center text-sm text-text-sub">
              부서별 예산 정보가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
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

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100)

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`
</script>
