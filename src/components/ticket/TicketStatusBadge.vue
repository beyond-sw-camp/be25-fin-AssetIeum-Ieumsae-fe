<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      statusClass,
    ]"
  >
    {{ TICKET_STATUS_LABEL[status] }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { TicketStatus } from '@/types'
import { TICKET_STATUS_LABEL } from '@/utils/labels'

const props = defineProps<{
  status: TicketStatus
}>()

const statusClass = computed(() => {
  if (props.status === 'COMPLETED') return 'bg-green-100 text-green-700'
  if (
    props.status === 'DEPARTMENT_REJECTED'
    || props.status === 'ASSET_TEAM_REJECTED'
    || props.status === 'CANCELLED'
  ) {
    return 'bg-red-100 text-red-700'
  }
  if (props.status === 'REQUESTED') return 'bg-slate-100 text-slate-600'
  return 'bg-orange-100 text-orange-700'
})
</script>
