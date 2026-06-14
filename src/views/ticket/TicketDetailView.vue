<template>
  <div class="h-full overflow-y-auto bg-background text-text-main">
    <header class="page-header flex items-center justify-between gap-3">
      <div>
        <p class="page-subtitle mb-1">서비스데스크 > 티켓 상세</p>
        <h1 class="page-title">티켓 상세</h1>
      </div>
      <Button variant="outline" @click="router.push({ name: 'TicketList' })">
        <ArrowLeft :size="16" />
        목록으로
      </Button>
    </header>

    <section class="card border border-border p-6">
      <div v-if="isLoading" class="flex min-h-72 items-center justify-center text-text-sub">
        <RefreshCw class="mr-2 animate-spin" :size="20" />
        티켓 정보를 불러오는 중입니다.
      </div>

      <div v-else-if="errorMessage" class="flex min-h-72 flex-col items-center justify-center gap-3">
        <p class="text-sm text-danger">{{ errorMessage }}</p>
        <Button variant="outline" @click="fetchTicket">
          <RefreshCw :size="16" />
          다시 시도
        </Button>
      </div>

      <div v-else-if="ticket" class="space-y-6">
        <div class="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary">{{ ticket.ticketNo }}</p>
            <h2 class="mt-2 text-xl font-bold text-text-main">
              {{ ticket.requestReason || '요청 상세' }}
            </h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <TicketTypeBadge :type="ticket.ticketType" />
            <TicketStatusBadge :status="ticket.status" />
          </div>
        </div>

        <dl class="grid gap-5 md:grid-cols-2">
          <div v-for="item in detailItems" :key="item.label" class="rounded-xl bg-surface-secondary p-4">
            <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
            <dd class="mt-2 text-sm font-medium text-text-main">{{ item.value }}</dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import TicketStatusBadge from '@/components/ticket/TicketStatusBadge.vue'
import TicketTypeBadge from '@/components/ticket/TicketTypeBadge.vue'
import type { TicketDetail } from '@/types'
import { formatDate } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const ticket = ref<TicketDetail | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const detailItems = computed(() => {
  if (!ticket.value) return []

  return [
    { label: '요청자', value: ticket.value.requesterName },
    { label: '소속 부서', value: ticket.value.departmentName },
    { label: '부서 승인자', value: ticket.value.approverName ?? '미지정' },
    { label: '구매자산팀 담당자', value: ticket.value.assigneeName ?? '미지정' },
    { label: '요청 일시', value: formatDate(ticket.value.createdAt, 'YYYY-MM-DD HH:mm') },
    { label: '최종 수정 일시', value: formatDate(ticket.value.updatedAt, 'YYYY-MM-DD HH:mm') },
  ]
})

async function fetchTicket() {
  const ticketId = Number(route.params.ticketId)
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    errorMessage.value = '올바르지 않은 티켓 번호입니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await ticketApi.getDetail(ticketId)
    ticket.value = response.data
  } catch (error) {
    ticket.value = null
    errorMessage.value = error instanceof Error
      ? error.message
      : '티켓 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTicket)
</script>
