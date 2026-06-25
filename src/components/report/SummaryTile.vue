<template>
  <div class="rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
    <p class="text-sm font-bold text-text-sub">{{ label }}</p>
    <div class="mt-5 flex items-end justify-between gap-3">
      <p class="text-xs font-semibold text-text-sub">{{ caption }}</p>
      <p class="text-3xl font-extrabold text-text-main">{{ value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  caption: string
  value: string
}>()
</script>
