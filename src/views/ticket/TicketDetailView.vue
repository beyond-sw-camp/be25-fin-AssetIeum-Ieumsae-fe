<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">티켓 상세</h2>
    <p class="text-gray-400">ticketId: {{ route.params.ticketId }}</p>
    <!-- TODO: 티켓 상세 정보, 승인/반려 액션, 댓글 -->
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ticketApi } from '@/api'
import type { TicketDetail } from '@/types'

const route = useRoute()
const ticket = ref<TicketDetail | null>(null)

onMounted(async () => {
  const res = await ticketApi.getDetail(Number(route.params.ticketId))
  ticket.value = res.data
})
</script>
