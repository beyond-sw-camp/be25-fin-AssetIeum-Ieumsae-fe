<template>
  <section class="rounded-xl border border-border bg-surface p-6 shadow-sm">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <h2 class="text-base font-extrabold text-text-main">{{ number }}. {{ title }}</h2>
      <p class="text-xs font-semibold text-text-muted">
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
