<template>
  <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-base font-bold text-text-main">자산 수요 정보 조회</h2>
        <p class="mt-1 text-xs text-text-sub">예상 수요와 현재 재고 기준으로 가용률을 계산합니다.</p>
      </div>
      <span class="text-xs text-text-sub">총 {{ rows.length }}건</span>
    </div>

    <Table
      :columns="columns"
      :rows="rows"
      row-key="id"
      empty-text="자산 수요 정보가 없습니다."
    >
      <template #cell-availability="{ value }">
        <div class="flex items-center justify-center gap-2 whitespace-nowrap">
          <span class="w-10 text-right text-xs font-semibold text-text-main">{{ displayPercent(value) }}%</span>
          <DashboardMiniProgressChart :value="displayPercent(value)" />
        </div>
      </template>

      <template #cell-status="{ value }">
        <span
          class="rounded-full px-2 py-1 text-xs font-bold"
          :class="value === '부족' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
        >
          {{ value }}
        </span>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import Table, { type Column } from '@/components/common/Table.vue'
import DashboardMiniProgressChart from '@/components/dashboard/DashboardMiniProgressChart.vue'

export interface DemandRow extends Record<string, unknown> {
  id: string
  kind: string
  name: string
  expectedDemand: number
  currentStock: number
  returnExpected: number
  availability: number
  status: '충분' | '부족'
}

defineProps<{
  columns: Column<DemandRow>[]
  rows: DemandRow[]
}>()

function displayPercent(value: unknown) {
  const percent = Number(value)
  if (!Number.isFinite(percent)) return 0
  return Math.min(Math.max(Math.round(percent), 0), 100)
}
</script>
