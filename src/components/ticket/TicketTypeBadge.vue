<template>
  <span
    :class="[
      'inline-flex items-center font-semibold',
      variant === 'badge'
        ? 'rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary'
        : 'text-sm text-text-main',
    ]"
  >
    {{ TICKET_TYPE_LABEL[type] }}
  </span>
</template>

<script setup lang="ts">
import type { TicketType } from '@/types'
import { TICKET_TYPE_LABEL } from '@/utils/labels'

withDefaults(defineProps<{
  type: TicketType
  variant?: 'text' | 'badge'
}>(), {
  variant: 'text',
})
</script>
