<template>
  <h3 class="flex items-center gap-2 text-sm font-bold text-text-main">
    <span class="inline-block h-4 w-1 rounded-full bg-primary"></span>
    {{ title }}
    <span v-if="optional" class="text-xs font-normal text-text-muted">(선택)</span>
  </h3>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  optional?: boolean
}>()
</script>
