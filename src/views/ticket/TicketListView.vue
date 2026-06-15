<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">서비스데스크 > 나의 요청</p>
        <h1 class="page-title">나의 요청</h1>
      </div>

      <Button v-if="canCreateTicket" @click="openRequestDrawer">
        <Plus :size="17" />
        새 티켓 요청
      </Button>
    </header>

    <section class="card relative z-10 mb-4 flex min-h-0 flex-1 flex-col overflow-visible border border-border">
      <div class="relative z-30 flex shrink-0 items-center gap-3 overflow-visible border-b border-border pb-3">
        <div class="flex shrink-0 items-center gap-2">
          <Dropdown
            :model-value="pageSize"
            :options="PAGE_SIZE_OPTIONS"
            class="w-30! shrink-0"
            menu-direction="down"
            aria-label="페이지당 표시 개수"
            @update:model-value="handlePageSizeChange"
          />
          <span class="whitespace-nowrap text-xs text-text-sub">
            총 {{ filteredTickets.length }}건 중 {{ rangeText }}
          </span>
        </div>

        <div class="ml-auto flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2">
          <Dropdown
            :model-value="filterForm.status"
            :options="STATUS_FILTER_OPTIONS"
            class="w-28! shrink-0"
            menu-align="right"
            menu-direction="down"
            aria-label="진행 상태"
            @update:model-value="handleStatusChange"
          />
          <Dropdown
            :model-value="filterForm.ticketType"
            :options="TYPE_FILTER_OPTIONS"
            class="w-36! shrink-0"
            menu-align="right"
            menu-direction="down"
            aria-label="티켓 유형"
            @update:model-value="handleTicketTypeChange"
          />
          <TicketSearchBar
            v-model="keywordInput"
            @search="handleSearch"
          />
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
      >
        <p class="text-sm text-danger">{{ errorMessage }}</p>
        <Button variant="outline" size="sm" @click="fetchTickets">
          <RefreshCw :size="15" />
          다시 시도
        </Button>
      </div>

      <div class="min-h-0 flex-1 overflow-auto py-4">
        <TicketTable
          :tickets="pagedTickets"
          :loading="isLoading"
          :empty-text="emptyText"
          @detail="openTicketDetail"
        />
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border pt-3">
        <div class="flex items-center justify-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="page === 0 || isLoading"
            aria-label="이전 페이지"
            @click="page -= 1"
          >
            <ChevronLeft :size="16" />
          </button>
          <template v-for="item in paginationItems" :key="String(item)">
            <span
              v-if="item === 'ellipsis'"
              class="inline-flex h-8 min-w-8 items-center justify-center text-xs text-text-muted"
            >
              ...
            </span>
            <button
              v-else
              type="button"
              :class="[
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
                page === item
                  ? 'bg-primary text-white'
                  : 'text-text-sub hover:bg-surface-secondary',
              ]"
              @click="page = item"
            >
              {{ item + 1 }}
            </button>
          </template>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="totalPages === 0 || page >= totalPages - 1 || isLoading"
            aria-label="다음 페이지"
            @click="page += 1"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <TicketRequestDrawer
      :is-open="isRequestDrawerOpen"
      @close="closeRequestDrawer"
      @created="handleTicketCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import TicketRequestDrawer from '@/components/ticket/TicketRequestDrawer.vue'
import TicketSearchBar from '@/components/ticket/TicketSearchBar.vue'
import TicketTable from '@/components/ticket/TicketTable.vue'
import { usePermission } from '@/composables'
import { useNotificationStore } from '@/stores'
import type {
  DropdownOption,
  TicketCreateResponse,
  TicketListItem,
  TicketStatus,
  TicketType,
} from '@/types'
import { TICKET_STATUS_LABEL, TICKET_TYPE_LABEL } from '@/utils/labels'

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: '10개씩 보기', value: 10 },
  { label: '20개씩 보기', value: 20 },
  { label: '50개씩 보기', value: 50 },
]
const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: '전체 상태', value: '' },
  ...Object.entries(TICKET_STATUS_LABEL).map(([value, label]) => ({ value, label })),
]
const TYPE_FILTER_OPTIONS: DropdownOption[] = [
  { label: '전체 유형', value: '' },
  ...Object.entries(TICKET_TYPE_LABEL).map(([value, label]) => ({ value, label })),
]

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const { canCreateTicket } = usePermission()

const tickets = ref<TicketListItem[]>([])
const filterForm = ref({
  status: '' as TicketStatus | '',
  ticketType: '' as TicketType | '',
})
const keywordInput = ref('')
const appliedKeyword = ref('')
const page = ref(0)
const pageSize = ref(20)
const isLoading = ref(false)
const errorMessage = ref('')
const isRequestDrawerOpen = ref(false)

const filteredTickets = computed(() => {
  const keyword = appliedKeyword.value.trim().toLowerCase()

  return tickets.value.filter((ticket) => {
    if (!keyword) return true

    return [
      ticket.ticketNo,
      ticket.assetItemName,
    ].some((value) => value?.toLowerCase().includes(keyword))
  })
})

const totalPages = computed(() => Math.ceil(filteredTickets.value.length / pageSize.value))
const pagedTickets = computed(() => {
  const start = page.value * pageSize.value
  return filteredTickets.value.slice(start, start + pageSize.value)
})
const rangeText = computed(() => {
  if (filteredTickets.value.length === 0) return '0건'
  const start = page.value * pageSize.value + 1
  const end = Math.min((page.value + 1) * pageSize.value, filteredTickets.value.length)
  return `${start}-${end}건`
})
const emptyText = computed(() => (
  appliedKeyword.value || filterForm.value.status || filterForm.value.ticketType
    ? '조건에 맞는 요청이 없습니다.'
    : '등록된 요청이 없습니다.'
))
const paginationItems = computed<Array<number | 'ellipsis'>>(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, index) => index)
  }

  const items: Array<number | 'ellipsis'> = [0]
  const start = Math.max(1, page.value - 1)
  const end = Math.min(totalPages.value - 2, page.value + 1)

  if (start > 1) items.push('ellipsis')
  for (let index = start; index <= end; index += 1) items.push(index)
  if (end < totalPages.value - 2) items.push('ellipsis')
  items.push(totalPages.value - 1)

  return items
})

async function fetchTickets() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // TODO: 로그인 사용자 memberId는 UUID지만 명세의 requesterId는 integer다.
    // 백엔드가 인증 사용자 범위로 목록을 제한하는지 확인 후 requesterId 전달 여부를 확정한다.
    const response = await ticketApi.getList({
      page: 0,
      size: 999,
      status: filterForm.value.status || undefined,
      ticketType: filterForm.value.ticketType || undefined,
    })
    tickets.value = response.data.content
  } catch (error) {
    const isEmpty = error instanceof ApiError
      && error.status === 404
      && error.errorCode === 'TICKET_NOT_FOUND'

    if (isEmpty) {
      tickets.value = []
      return
    }

    errorMessage.value = error instanceof Error
      ? error.message
      : '나의 요청 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  // TODO: 티켓 목록 API에 티켓 번호/품목명 검색 파라미터가 확정되면 서버 요청에 전달한다.
  appliedKeyword.value = keywordInput.value
  page.value = 0
  fetchTickets()
}

function handlePageSizeChange(value: string | number) {
  if (typeof value !== 'number') return
  pageSize.value = value
  page.value = 0
}

function handleStatusChange(value: string | number) {
  if (typeof value !== 'string') return
  filterForm.value.status = value as TicketStatus | ''
}

function handleTicketTypeChange(value: string | number) {
  if (typeof value !== 'string') return
  filterForm.value.ticketType = value as TicketType | ''
}

function openRequestDrawer() {
  isRequestDrawerOpen.value = true
  router.replace({ query: { ...route.query, create: '1' } })
}

function closeRequestDrawer() {
  isRequestDrawerOpen.value = false
  const { create: _create, ...query } = route.query
  void _create
  router.replace({ query })
}

async function handleTicketCreated(ticket: TicketCreateResponse) {
  isRequestDrawerOpen.value = false
  notificationStore.success(
    '요청이 등록되었습니다.',
    `${ticket.ticketNo} 티켓이 생성되었습니다.`,
  )
  await router.replace({ name: 'TicketList' })
  await fetchTickets()
}

function openTicketDetail(ticketId: TicketListItem['ticketId']) {
  router.push({ name: 'TicketDetail', params: { ticketId } })
}

watch(totalPages, (nextTotalPages) => {
  if (nextTotalPages === 0) {
    page.value = 0
  } else if (page.value >= nextTotalPages) {
    page.value = nextTotalPages - 1
  }
})

onMounted(async () => {
  isRequestDrawerOpen.value = route.query.create === '1' && canCreateTicket.value
  await fetchTickets()
})
</script>
