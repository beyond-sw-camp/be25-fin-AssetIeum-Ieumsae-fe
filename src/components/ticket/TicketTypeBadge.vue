<template>
  <span class="text-sm font-semibold text-text-main">
    {{ TICKET_TYPE_LABEL[type] }}
  </span>
</template>

<script setup lang="ts">
import type { TicketType } from '@/types'
import { TICKET_TYPE_LABEL } from '@/utils/labels'

defineProps<{
  type: TicketType
}>()
</script>