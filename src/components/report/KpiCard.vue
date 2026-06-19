<template>
  <div class="rounded-xl border border-border bg-surface p-4">
    <p class="text-sm text-text-sub">{{ label }}</p>
    <p class="mt-2 text-2xl font-bold text-text-main">
      {{ loading ? '...' : value }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  loading?: boolean
}>()
</script>
