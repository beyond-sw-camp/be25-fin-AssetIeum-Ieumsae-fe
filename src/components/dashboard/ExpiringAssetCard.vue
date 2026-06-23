<template>
  <button
    type="button"
    :class="[
      'rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition',
      interactive ? 'hover:border-primary/40 hover:shadow-md' : 'cursor-default',
    ]"
    @click="interactive && emit('click')"
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-bold text-text-main">만료 예정 자산 현황</h2>
      <CalendarClock class="text-primary" :size="18" />
    </div>
    <div class="grid grid-cols-2 gap-3 text-center">
      <button
        type="button"
        class="rounded-lg bg-surface-secondary px-3 py-4 transition hover:bg-surface-secondary/80"
        @click.stop="interactive && emit('click-tangible')"
      >
        <p class="text-xs font-semibold text-text-sub">유형자산</p>
        <p class="mt-2 text-2xl font-bold text-text-main">{{ tangibleCount }}</p>
      </button>
      <button
        type="button"
        class="rounded-lg bg-surface-secondary px-3 py-4 transition hover:bg-surface-secondary/80"
        @click.stop="interactive && emit('click-intangible')"
      >
        <p class="text-xs font-semibold text-text-sub">무형자산</p>
        <p class="mt-2 text-2xl font-bold text-text-main">{{ intangibleCount }}</p>
      </button>
    </div>
  </button>
</template>

<script setup lang="ts">
import { CalendarClock } from 'lucide-vue-next'

withDefaults(defineProps<{
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
</script>
