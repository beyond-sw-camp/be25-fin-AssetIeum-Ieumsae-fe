<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          HR 워크플로우
        </p>
        <h1 class="page-title">
          HR 워크플로우
        </h1>
      </div>
    </div>

    <section>
      <HrTemplate />
    </section>
    <section>
      <HrEvent />
    </section>
  </div>    
</template>

<script setup lang="ts">
import HrTemplate from '@/components/hr/HrTemplate.vue';
import HrEvent from '@/components/hr/HrEvent.vue';
</script>