<template>
  <section class="rounded-lg border border-border bg-surface p-6 shadow-sm">
    <div class="mb-4 flex flex-col gap-1">
      <h2 class="text-lg font-extrabold text-text-main">{{ number }}. {{ title }}</h2>
      <p class="text-base font-semibold text-text-sub">
        <slot name="description" />
      </p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  number: string
  title: string
}>()
</script>
