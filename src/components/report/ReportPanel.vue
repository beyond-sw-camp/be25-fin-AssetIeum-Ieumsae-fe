<template>
  <section class="rounded-xl border border-border bg-surface p-4">
    <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="text-base font-semibold text-text-main">{{ title }}</h2>
        <p class="mt-1 text-sm text-text-sub">{{ description }}</p>
      </div>
      <Button v-if="error" variant="outline" size="sm" @click="$emit('retry')">
        다시 시도
      </Button>
    </div>

    <p
      v-if="error"
      class="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <slot />
  </section>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'

defineProps<{
  title: string
  description: string
  error?: string
}>()

defineEmits<{
  retry: []
}>()
</script>
