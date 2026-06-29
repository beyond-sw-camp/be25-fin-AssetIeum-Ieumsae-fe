<template>
  <section class="card mx-0! border border-border p-7">
    <div class="mb-5 flex flex-col gap-2">
      <h2 class="text-lg font-extrabold text-text-main">{{ title }}</h2>
      <p class="text-base font-semibold text-text-sub">
        <slot name="description" />
      </p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
