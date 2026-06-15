<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
    <header class="flex min-h-12 items-center justify-between gap-3 border-b border-border px-5 py-3">
      <div class="flex items-center gap-2">
        <slot name="icon" />
        <h2 class="text-base font-bold text-text-main">{{ title }}</h2>
      </div>
      <slot name="actions" />
    </header>
    <div :class="contentClass">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  padding?: 'none' | 'sm' | 'md'
}>(), {
  padding: 'md',
})

const contentClass = computed(() => ({
  none: '',
  sm: 'p-4',
  md: 'p-5',
})[props.padding])
</script>
