<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          HR 워크플로우
        </p>
        <h1 class="page-title">
          HR 워크플로우
        </h1>
      </div>
    </div>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      <section class="shrink-0">
        <HrTemplate />
      </section>

      <section class="shrink-0">
        <HrEvent />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import HrEvent from '@/components/hr/HrEvent.vue'
import HrTemplate from '@/components/hr/HrTemplate.vue'
</script>
