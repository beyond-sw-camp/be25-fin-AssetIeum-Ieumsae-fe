<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      statusClass[status],
    ]"
  >
    {{ TICKET_STATUS_LABEL[status] }}
  </span>
</template>

<script setup lang="ts">
import type { TicketStatus } from '@/types'
import { TICKET_STATUS_LABEL } from '@/utils/labels'

defineProps<{
  status: TicketStatus
}>()

const statusClass: Record<TicketStatus, string> = {
  REQUESTED: 'bg-slate-100 text-slate-600',
  DEPARTMENT_APPROVED: 'bg-orange-100 text-orange-700',
  DEPARTMENT_REJECTED: 'bg-red-100 text-red-700',
  ASSET_APPROVED: 'bg-orange-100 text-orange-700',
  ASSET_REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-700',
}
</script>
