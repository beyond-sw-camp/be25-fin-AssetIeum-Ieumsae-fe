<template>
  <div
    :class="[
      'rounded-xl border border-border bg-surface p-5 shadow-sm',
      interactive && 'cursor-pointer transition hover:border-primary/40 hover:shadow-md',
    ]"
    @click="interactive && emit('click')"
  >
    <div class="mb-5">
      <h2 class="text-base font-bold text-text-main">부서 예산 현황</h2>
      <p class="mt-1 text-xs text-text-sub">소속 부서의 예산 사용 금액과 잔여 예산을 확인합니다.</p>
    </div>

    <div class="grid gap-15 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div class="flex justify-center">
        <DashboardDonutChart :value="usageRate" :used-value="usedRate" label="사용률" />
      </div>

      <div class="space-y-3 mr-6">
        <div class="rounded-lg border border-border bg-surface px-6 py-5">
          <h3 class="mb-6 text-m font-bold text-text-main">{{ summary.departmentName }} 예산 현황</h3>
          <div class="grid gap-3 text-sm md:grid-cols-4 xl:grid-cols-5">
            <div
              v-for="item in summaryItems"
              :key="item.label"
              class="rounded-lg border border-border bg-surface px-4 py-3"
            >
              <p class="text-xs font-semibold text-text-muted">{{ item.label }}</p>
              <p class="mt-2 font-bold text-text-main">{{ item.value }}</p>
            </div>
          </div>
          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between text-xs font-semibold">
              <span class="text-text-sub">사용률</span>
              <span class="text-primary">{{ usageRate }}%</span>
            </div>
            <div class="relative h-2.5 overflow-hidden rounded-full bg-surface-secondary">
              <div
                class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full bg-primary-trans"
                :style="{ width: `${usageRate}%` }"
              ></div>
              <div
                class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full bg-primary"
                :style="{ width: `${usedRate}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import DashboardDonutChart from '@/components/dashboard/DashboardDonutChart.vue'
import type { DepartmentBudgetDetail } from '@/types'

const props = defineProps<{
  summary: DepartmentBudgetDetail
  interactive?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const formatCurrency = (value: number) => `₩ ${value.toLocaleString('ko-KR')}`

const heldAmount = computed(() => Math.max(props.summary.heldAmount ?? props.summary.holdAmount ?? 0, 0))
const usedAmount = computed(() => Math.max(props.summary.usedAmount ?? 0, 0))
const totalAmount = computed(() => Math.max(props.summary.totalAmount ?? 0, 0))
const availableAmount = computed(() => (
  Math.max(totalAmount.value - usedAmount.value - heldAmount.value, 0)
))
const usageRate = computed(() => {
  if (totalAmount.value <= 0) return 0
  const committedAmount = usedAmount.value + heldAmount.value
  return Math.min(Math.max(Math.round((committedAmount / totalAmount.value) * 1000) / 10, 0), 100)
})
const usedRate = computed(() => {
  if (totalAmount.value <= 0) return 0
  return Math.min(Math.max(Math.round((usedAmount.value / totalAmount.value) * 1000) / 10, 0), 100)
})

const summaryItems = computed(() => [
  { label: '가용 예산', value: formatCurrency(availableAmount.value) },
  { label: '사용 예산', value: formatCurrency(usedAmount.value) },
  { label: '집행 대기 금액', value: formatCurrency(heldAmount.value) },
  { label: '총 예산', value: formatCurrency(totalAmount.value) },
  { label: '사용률', value: `${usageRate.value}%` },
])
</script>
