<template>
  <button
    type="button"
    :class="[
      'w-full min-w-0 rounded-lg border bg-surface p-4 text-left transition',
      selected ? 'border-primary shadow-card' : 'border-border',
    ]"
    @click="$emit('select')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-base font-bold text-text-main">
          {{ target.productName }}
        </p>
        <p class="mt-1 truncate text-xs text-text-sub">
          {{ target.assetCode }} · {{ target.category }}
        </p>
      </div>
      <span :class="target.isResponded ? 'badge-success' : 'badge-warning'">
        {{ target.isResponded ? '완료' : '대기' }}
      </span>
    </div>

    <p class="mt-3 text-xs text-text-sub">
      {{ formatDate(target.startDate) }} ~ {{ formatDate(target.endDate) }}
    </p>
  </button>
</template>

<script setup lang="ts">
export interface MobileInspectionTarget {
  inspectionTargetId: string
  inspectionId: string
  productName: string
  assetCode: string
  category: string
  isResponded: boolean
  startDate: string
  endDate: string
}

defineProps<{
  target: MobileInspectionTarget
  selected?: boolean
}>()

defineEmits<{
  select: []
}>()

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
</script>
