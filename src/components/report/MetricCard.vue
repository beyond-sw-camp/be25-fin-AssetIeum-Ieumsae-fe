<template>
  <div :class="['rounded-lg bg-gradient-to-br p-5', toneClass]">
    <p class="text-sm font-bold text-text-main">{{ label }}</p>
    <p class="mt-3 text-3xl font-extrabold">{{ value }}</p>
    <p class="mt-5 text-xs font-bold text-text-sub">{{ caption }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string
  caption: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}>(), {
  tone: 'blue',
})

const toneClass = computed(() => ({
  blue: 'from-blue-50 to-blue-100 text-blue-600',
  green: 'from-green-50 to-green-100 text-green-600',
  amber: 'from-amber-50 to-amber-100 text-amber-600',
  red: 'from-red-50 to-red-100 text-red-600',
  purple: 'from-purple-50 to-purple-100 text-purple-600',
}[props.tone]))
</script>
