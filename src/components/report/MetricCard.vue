<template>
  <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm font-bold text-text-main">{{ label }}</p>
      <span :class="['rounded-md px-2 py-1 text-xs font-bold', toneClass]">
        {{ badge }}
      </span>
    </div>
    <p class="mt-4 text-3xl font-extrabold text-text-main">{{ value }}</p>
    <p class="mt-3 text-xs font-semibold text-text-sub">{{ caption }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string
  caption: string
  badge?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}>(), {
  badge: '지표',
  tone: 'blue',
})

const toneClass = computed(() => ({
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
}[props.tone]))
</script>
