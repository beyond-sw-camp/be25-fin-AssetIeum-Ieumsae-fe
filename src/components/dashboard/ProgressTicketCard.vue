<template>
  <button
    type="button"
    class="flex min-h-30 flex-col rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
    @click="emit('click')"
  >
    <div class="mb-5 flex h-6 shrink-0 items-center justify-between">
      <h2 class="m-0 text-sm font-bold leading-5 text-text-main">진행중인 티켓 현황</h2>
      <RefreshCw class="text-primary" :size="18" />
    </div>
    <div class="mb-5 h-3 overflow-hidden rounded-full bg-surface-secondary">
      <div class="relative h-full">
        <div
          v-for="item in layeredSegments"
          :key="item.label"
          class="dashboard-bar-fill absolute inset-y-0 left-0 rounded-full"
          :class="item.barClass"
          :style="{ width: `${item.cumulativePercent}%`, zIndex: item.zIndex }"
        ></div>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-2 text-center text-xs">
      <div v-for="item in segments" :key="item.label">
        <div class="mb-1 flex items-center justify-center gap-1">
          <span class="h-2 w-2 rounded-full" :class="item.barClass"></span>
          <p class="font-bold text-text-main">{{ item.count }}</p>
        </div>
        <p class="text-text-sub">{{ item.label }}</p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

export interface DashboardSegment {
  label: string
  count: number
  percent: number
  barClass: string
}

interface LayeredDashboardSegment extends DashboardSegment {
  cumulativePercent: number
  zIndex: number
}

const props = defineProps<{
  segments: DashboardSegment[]
}>()

const emit = defineEmits<{
  click: []
}>()

const layeredSegments = computed<LayeredDashboardSegment[]>(() => {
  let cumulativePercent = 0

  return props.segments.map((item, index) => {
    cumulativePercent += item.percent

    return {
      ...item,
      cumulativePercent: clampPercent(cumulativePercent),
      zIndex: props.segments.length - index,
    }
  })
})

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100)
}
</script>
