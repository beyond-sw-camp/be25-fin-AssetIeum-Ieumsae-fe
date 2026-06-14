<template>
  <button
    type="button"
    class="rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
    @click="emit('click')"
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-bold text-text-main">진행중인 티켓 현황</h2>
      <RefreshCw class="text-primary" :size="18" />
    </div>
    <div class="mb-3 flex h-3 overflow-hidden rounded-full bg-surface-secondary">
      <div
        v-for="item in segments"
        :key="item.label"
        class="h-full first:rounded-l-full last:rounded-r-full"
        :class="item.barClass"
        :style="{ width: `${item.percent}%` }"
      ></div>
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
import { RefreshCw } from 'lucide-vue-next'

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
