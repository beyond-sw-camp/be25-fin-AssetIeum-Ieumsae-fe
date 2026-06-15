<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-max border-collapse">
      <thead>
        <tr class="border-b border-border bg-surface-secondary">
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="whitespace-nowrap px-5 py-3 text-center text-xs font-semibold text-text-sub"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
          class="border-b border-border last:border-b-0"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-text-main"
          >
            {{ row[column.key] ?? '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface TicketRequestDetailColumn {
  key: string
  label: string
}

defineProps<{
  columns: TicketRequestDetailColumn[]
  rows: Array<Record<string, string>>
}>()
</script>
