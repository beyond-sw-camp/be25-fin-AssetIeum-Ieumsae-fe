<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ticketApi } from '@/api'
import { usePagination, useFilter } from '@/composables'
import type { TicketListItem, TicketListFilter } from '@/types'

const tickets = ref<TicketListItem[]>([])
const { page, size, updateFromResponse } = usePagination({ syncUrl: true })
const { activeParams } = useFilter<TicketListFilter>({})

async function fetchTickets() {
  const res = await ticketApi.getList({
    page: page.value,
    size: size.value,
    ...activeParams.value,
  })
  tickets.value = res.data.content
  updateFromResponse(res.data)
}
onMounted(fetchTickets)
watch(page, fetchTickets)
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">티켓 목록</h2>
    <!-- TODO: 티켓 목록 테이블, 종류별 필터, 새 티켓 생성 버튼 -->
    <p class="text-gray-400">티켓 목록 구현 예정</p>
  </div>
</template>
