<template>
  <span
    :class="[
      'inline-flex items-center font-semibold',
      variant === 'badge'
        ? 'rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary'
        : 'text-sm text-text-main',
    ]"
  >
    {{ getTicketTypeLabel(type, requestMethod) }}
  </span>
</template>

<script setup lang="ts">
import type { PurchaseRequestMethod, TicketType } from '@/types'
import { getTicketTypeLabel } from '@/utils/labels'

withDefaults(defineProps<{
  type: TicketType
  requestMethod?: PurchaseRequestMethod | null
  variant?: 'text' | 'badge'
}>(), {
  requestMethod: null,
  variant: 'text',
})
</script>
