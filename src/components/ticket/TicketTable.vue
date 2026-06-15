<template>
  <Table
    :columns="columns"
    :rows="tickets"
    :loading="loading"
    :empty-text="emptyText"
    row-key="ticketId"
    class="min-w-[920px]"
    @row-click="handleRowClick"
  >
    <template #cell-ticketNo="{ value }">
      <span class="text-text-main">{{ value }}</span>
    </template>

    <template #cell-ticketType="{ row }">
      <TicketTypeBadge
        :type="row.ticketType"
        :request-method="row.requestMethod"
      />
    </template>

    <template #cell-requestedItemName="{ value }">
      <span :class="value ? 'text-text-main' : 'text-text-muted'">
        {{ value || '-' }}
      </span>
    </template>

    <template #cell-requestedAt="{ value }">
      <span class="text-text-main">{{ formatDate(String(value), 'YYYY-MM-DD HH:mm') }}</span>
    </template>

    <template #cell-ticketStatus="{ row }">
      <TicketStatusBadge :status="row.ticketStatus" />
    </template>
  </Table>
</template>

<script setup lang="ts">
import Table from '@/components/common/Table.vue'
import type { Column } from '@/components/common/Table.vue'
import TicketStatusBadge from '@/components/ticket/TicketStatusBadge.vue'
import TicketTypeBadge from '@/components/ticket/TicketTypeBadge.vue'
import type { TicketListItem } from '@/types'
import { formatDate } from '@/utils/labels'

withDefaults(defineProps<{
  tickets: TicketListItem[]
  loading?: boolean
  emptyText?: string
}>(), {
  loading: false,
  emptyText: '조회된 요청이 없습니다.',
})

const emit = defineEmits<{
  detail: [ticketId: TicketListItem['ticketId']]
}>()

function handleRowClick(ticket: TicketListItem) {
  emit('detail', ticket.ticketId)
}

const columns: Column<TicketListItem>[] = [
  { key: 'ticketNo', label: '티켓 번호', width: '20%', align: 'center' },
  { key: 'ticketType', label: '티켓 유형', width: '18%', align: 'center' },
  { key: 'requestedItemName', label: '품목명', width: '27%', align: 'center' },
  { key: 'requestedAt', label: '요청일시', width: '20%', align: 'center' },
  { key: 'ticketStatus', label: '진행 상태', width: '15%', align: 'center' },
]
</script>
