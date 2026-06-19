<template>
  <div class="rounded-xl bg-[#f4f4f5] px-5 py-4">
    <p class="text-base font-extrabold text-text-main">{{ label }}</p>
    <div class="mt-8 flex items-end justify-between gap-3">
      <p class="text-xs font-bold text-text-sub">{{ caption }}</p>
      <p class="text-4xl font-extrabold text-text-main">{{ value }}</p>
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
