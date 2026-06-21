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
        <p v-if="target.memberName !== '-'" class="mt-1 truncate text-xs text-text-sub">
          대상 사용자 {{ target.memberName }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span :class="inspectionStatusBadgeClass(target.inspectionStatus)">
          {{ inspectionStatusLabel[target.inspectionStatus] }}
        </span>
        <span :class="target.isResponded ? 'badge-success' : 'badge-warning'">
          {{ target.isResponded ? '응답 완료' : '응답 대기' }}
        </span>
      </div>
    </div>

    <p class="mt-3 text-xs text-text-sub">
      {{ formatDate(target.startDate) }} ~ {{ formatDate(target.endDate) }}
    </p>
  </button>
</template>

<script setup lang="ts">
import type { InspectionStatus } from '@/types/inspection'

export interface MobileInspectionTarget {
  inspectionTargetId: string
  inspectionId: string
  inspectionStatus: InspectionStatus
  memberId: string
  memberName: string
  productName: string
  assetCode: string
  category: string
  isResponded: boolean
  startDate: string
  endDate: string
}

const inspectionStatusLabel: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '조사 완료',
  CLOSED: '조사 종료',
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

function inspectionStatusBadgeClass(status: InspectionStatus) {
  if (status === 'IN_PROGRESS') {
    return 'rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'
  }
  if (status === 'COMPLETED') return 'badge-success'
  return 'badge-warning'
}
</script>
