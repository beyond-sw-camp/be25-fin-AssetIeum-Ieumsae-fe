<template>
  <div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
    <h2 class="mb-5 text-base font-bold text-text-main">부서 예산 현황</h2>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div class="flex justify-center">
        <div
          class="relative h-56 w-56 rounded-full border border-text-main/40"
          :style="donutStyle"
        >
          <div class="absolute inset-14 rounded-full border border-text-main/40 bg-surface"></div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="rounded-lg border border-border bg-surface px-4 py-3">
          <h3 class="mb-4 text-sm font-bold text-text-main">{{ summary.departmentName }} 예산 현황</h3>
          <div class="grid gap-4 text-sm md:grid-cols-4">
            <div>
              <p class="mb-2 font-semibold text-text-main">총 예산</p>
              <p class="font-bold text-text-main">{{ formatCurrency(summary.totalAmount) }}</p>
            </div>
            <div>
              <p class="mb-2 font-semibold text-text-main">사용 금액</p>
              <p class="font-bold text-text-main">{{ formatCurrency(summary.usedAmount) }}</p>
            </div>
            <div>
              <p class="mb-2 font-semibold text-text-main">잔여 예산</p>
              <p class="font-bold text-text-main">{{ formatCurrency(summary.remainingAmount) }}</p>
            </div>
            <div>
              <p class="mb-2 font-semibold text-text-main">소진율</p>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-primary">{{ summary.usageRate }}%</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    class="h-full rounded-full bg-primary"
                    :style="{ width: `${summary.usageRate}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-border bg-surface px-4 py-3">
          <h3 class="mb-3 text-sm font-bold text-text-main">{{ summary.departmentName }} 예산 사용 내역</h3>
          <div class="space-y-4">
            <div
              v-for="usage in summary.categoryUsages"
              :key="usage.categoryName"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold text-text-main">{{ usage.categoryName }}</span>
                <span class="font-bold text-primary">{{ usage.percentage }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: `${usage.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DepartmentBudgetDetail } from '@/types'

const props = defineProps<{
  summary: DepartmentBudgetDetail
}>()

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`

const donutStyle = computed(() => {
  const usages = props.summary.categoryUsages
  const first = usages[0]?.percentage ?? 0
  const second = first + (usages[1]?.percentage ?? 0)
  const third = second + (usages[2]?.percentage ?? 0)

  return {
    background: `conic-gradient(#ff8f34 0 ${first}%, #ffad68 ${first}% ${second}%, #ffd0a8 ${second}% ${third}%, #e5e7eb ${third}% 100%)`,
  }
})
</script>
