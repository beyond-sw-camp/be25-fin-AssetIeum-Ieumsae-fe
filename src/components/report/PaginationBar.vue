<template>
  <div class="mt-3 flex items-center justify-end gap-2 text-sm text-text-sub">
    <Button
      variant="outline"
      size="sm"
      :disabled="page <= 0"
      @click="$emit('prev')"
    >
      이전
    </Button>
    <span class="min-w-20 text-center">{{ page + 1 }} / {{ Math.max(totalPages, 1) }}</span>
    <Button
      variant="outline"
      size="sm"
      :disabled="totalPages <= 0 || page >= totalPages - 1"
      @click="$emit('next')"
    >
      다음
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'

defineProps<{
  page: number
  totalPages: number
}>()

defineEmits<{
  prev: []
  next: []
}>()
</script>
