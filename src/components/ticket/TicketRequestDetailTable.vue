<template>
  <Table
    :columns="tableColumns"
    :rows="props.rows"
    :empty-text="props.emptyText"
    table-class="min-w-180"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import Table, { type Column } from '@/components/common/Table.vue'

interface TicketRequestDetailColumn {
  key: string
  label: string
}

type TicketRequestDetailRow = Record<string, string>

const props = withDefaults(defineProps<{
  columns: TicketRequestDetailColumn[]
  rows: TicketRequestDetailRow[]
  emptyText?: string
}>(), {
  emptyText: '요청 상세 내역이 없습니다.',
})

const tableColumns = computed<Column<TicketRequestDetailRow>[]>(() => (
  props.columns.map((column) => ({
    key: column.key,
    label: column.label,
    width: `${100 / props.columns.length}%`,
    align: 'center',
    maxLines: column.key === 'itemName' ? 2 : 1,
  }))
))
</script>
