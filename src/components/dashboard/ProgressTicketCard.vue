<template>
  <button
    type="button"
    class="flex min-h-30 flex-col rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
    @click="emit('click')"
  >
    <div class="mb-6 flex h-6 shrink-0 items-center justify-between">
      <h2 class="m-0 text-sm font-bold leading-5 text-text-main">진행중인 티켓 현황</h2>
      <RefreshCw class="text-primary" :size="18" />
    </div>
    <div class="h-3 shrink-0 overflow-hidden rounded-full bg-surface-secondary">
      <DashboardStackedProgressChart :segments="segments" />
    </div>
    <div class="flex flex-1 items-center pt-4">
      <div class="grid w-full grid-cols-4 gap-2 text-center text-xs">
        <div v-for="item in segments" :key="item.label">
          <div class="flex items-center justify-center gap-1.5">
            <span class="h-2 w-2 rounded-full" :class="item.barClass"></span>
            <p class="font-semibold text-text-sub">{{ item.label }}</p>
          </div>
          <p class="mt-2 text-lg font-semibold text-text-main">{{ item.count }}</p>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'

import DashboardStackedProgressChart from '@/components/dashboard/DashboardStackedProgressChart.vue'

export interface DashboardSegment {
  label: string
  count: number
  percent: number
  barClass: string
}

defineProps<{
  segments: DashboardSegment[]
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
