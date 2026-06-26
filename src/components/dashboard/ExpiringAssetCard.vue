<template>
  <div
    :class="[
      'flex min-h-30 flex-col rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition',
      interactive ? 'hover:border-primary/40 hover:shadow-md' : 'cursor-default',
    ]"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @click="interactive && emit('click')"
    @keydown.enter="interactive && emit('click')"
    @keydown.space.prevent="interactive && emit('click')"
  >
    <div class="mb-6 flex h-6 shrink-0 items-center justify-between">
      <h2 class="m-0 text-sm font-bold leading-5 text-text-main">만료 예정 자산 현황</h2>
      <CalendarClock class="text-primary" :size="18" />
    </div>
    <div class="h-3 shrink-0 overflow-hidden rounded-full bg-surface-secondary">
      <DashboardStackedProgressChart :segments="segments" />
    </div>
    <div class="flex flex-1 items-center pt-4">
      <div class="grid w-full grid-cols-2 gap-3 text-center">
        <button
          type="button"
          class="rounded-lg px-3 py-4 transition hover:bg-surface-secondary/50"
          @click.stop="interactive && emit('click-tangible')"
        >
          <div class="flex items-center justify-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-primary"></span>
            <p class="text-xs font-semibold text-text-sub">유형자산</p>
          </div>
          <p class="mt-2 text-lg font-semibold text-text-main">{{ tangibleCount }}</p>
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-4 transition hover:bg-surface-secondary/50"
          @click.stop="interactive && emit('click-intangible')"
        >
          <div class="flex items-center justify-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-warning"></span>
            <p class="text-xs font-semibold text-text-sub">무형자산</p>
          </div>
          <p class="mt-2 text-lg font-semibold text-text-main">{{ intangibleCount }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock } from 'lucide-vue-next'

import DashboardStackedProgressChart from '@/components/dashboard/DashboardStackedProgressChart.vue'

const props = withDefaults(defineProps<{
  tangibleCount: number
  intangibleCount: number
  interactive?: boolean
}>(), {
  interactive: true,
})

const emit = defineEmits<{
  click: []
  'click-tangible': []
  'click-intangible': []
}>()

const segments = computed(() => {
  const total = props.tangibleCount + props.intangibleCount
  const tangiblePercent = total > 0 ? Math.round((props.tangibleCount / total) * 100) : 0

  return [
    {
      label: '유형자산',
      count: props.tangibleCount,
      percent: tangiblePercent,
      barClass: 'bg-primary',
    },
    {
      label: '무형자산',
      count: props.intangibleCount,
      percent: total > 0 ? 100 - tangiblePercent : 0,
      barClass: 'bg-warning',
    },
  ]
})
</script>
