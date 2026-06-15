<template>
  <div class="flex flex-wrap items-center gap-2" aria-label="티켓 진행 상태 빠른 필터">
    <button
      v-for="option in FILTER_OPTIONS"
      :key="option.value"
      type="button"
      :class="[
        'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
        modelValue === option.value
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-surface text-text-sub hover:border-primary/40 hover:text-primary',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export type TicketQuickFilter = 'ALL' | 'PROCESSING' | 'COMPLETED' | 'REJECTED_CANCELLED'

const FILTER_OPTIONS: Array<{ label: string; value: TicketQuickFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '처리 중', value: 'PROCESSING' },
  { label: '완료', value: 'COMPLETED' },
  { label: '반려·취소', value: 'REJECTED_CANCELLED' },
]

defineProps<{
  modelValue: TicketQuickFilter
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TicketQuickFilter]
}>()
</script>
