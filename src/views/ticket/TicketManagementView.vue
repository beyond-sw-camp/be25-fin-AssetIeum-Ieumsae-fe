<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">서비스데스크 &gt; 티켓 관리</p>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </header>

    <section class="card mb-4 grid shrink-0 grid-cols-1 gap-3 border border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in statCards"
        :key="card.label"
        :class="[
          'rounded-2xl border bg-surface p-4 shadow-sm transition-colors duration-300',
          card.highlight ? 'border-rose-300/70 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-950/10' : 'border-border',
        ]"
      >
        <p :class="['text-xs font-semibold', card.highlight ? 'text-rose-600 dark:text-rose-300' : 'text-text-sub']">
          {{ card.label }}
        </p>
        <p :class="['mt-2 text-2xl font-bold', card.highlight ? 'text-rose-600 dark:text-rose-300' : 'text-text-main']">
          {{ card.value }}건
        </p>
      </article>
    </section>

    <section class="card relative z-10 flex min-h-0 flex-1 flex-col overflow-visible border border-border">
      <div class="relative z-30 flex shrink-0 flex-col gap-3 overflow-visible border-b border-border pb-3 xl:flex-row xl:items-center">
        <div class="flex shrink-0 items-center gap-2">
          <Dropdown
            :model-value="pageSize"
            :options="PAGE_SIZE_OPTIONS"
            class="w-30! shrink-0"
            menu-direction="down"
            aria-label="페이지 표시 개수"
            @update:model-value="handlePageSizeChange"
          />
          <span class="whitespace-nowrap text-xs text-text-sub">
            총 {{ tickets.length }}건 중 {{ rangeText }}
          </span>
        </div>

        <div class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <Dropdown
            v-if="isAssetTeamRole"
            :model-value="filterForm.departmentId"
            :options="departmentOptions"
            class="w-40! shrink-0"
            menu-align="right"
            menu-direction="down"
            aria-label="부서"
            @update:model-value="handleDepartmentChange"
          />
          <Dropdown
            :model-value="filterForm.requesterId"
            :options="memberOptions"
            class="w-40! shrink-0"
            menu-align="right"
            menu-direction="down"
            aria-label="사원"
            @update:model-value="handleRequesterChange"
          />
          <Dropdown
            :model-value="filterForm.status"
            :options="STATUS_FILTER_OPTIONS"
            class="w-32! shrink-0"
            menu-align="right"
            menu-direction="down"
            aria-label="진행 상태"
            @update:model-value="handleStatusChange"
          />
          <Dropdown
            :model-value="filterForm.ticketType"
            :options="TYPE_FILTER_OPTIONS"
            class="w-40! shrink-0"
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
        <Table
          :columns="columns"
          :rows="pagedTickets"
          :loading="isLoading"
          row-key="ticketId"
          empty-text="조회된 티켓이 없습니다."
          @row-click="openTicketDetail"
        >
          <template #cell-ticketNo="{ value }">
            <span class="font-semibold text-text-main">{{ value }}</span>
          </template>

          <template #cell-ticketType="{ row }">
            <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {{ getTicketTypeLabel(row) }}
            </span>
          </template>

          <template #cell-requestedItemName="{ value }">
            <span class="line-clamp-1 font-medium text-text-main">
              {{ value || '-' }}
            </span>
          </template>

          <template #cell-requester="{ row }">
            <div class="min-w-0">
              <p class="truncate font-medium text-text-main">{{ row.requesterName || '-' }}</p>
              <p class="truncate text-xs text-text-sub">{{ row.departmentName || '-' }}</p>
            </div>
          </template>

          <template #cell-requestedAt="{ value }">
            <span class="text-sm text-text-sub">{{ formatDate(String(value)) }}</span>
          </template>

          <template #cell-ticketStatus="{ row }">
            <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', getStatusBadgeClass(row.ticketStatus)]">
              {{ TICKET_STATUS_LABEL[row.ticketStatus] }}
            </span>
          </template>

          <template #cell-management="{ row }">
            <Button
              size="sm"
              :variant="getManagementButtonVariant(row)"
              @click.stop="openTicketDetail(row)"
            >
              {{ getManagementButtonLabel(row) }}
            </Button>
          </template>
        </Table>
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
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError, departmentApi, memberApi, ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table from '@/components/common/Table.vue'
import TicketSearchBar from '@/components/ticket/TicketSearchBar.vue'
import { useAuthStore } from '@/stores'
import type {
  Department,
  DropdownOption,
  Member,
  PurchaseRequestMethod,
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
  ...Object.entries(TICKET_TYPE_LABEL).flatMap(([value, label]) => (
    value === 'PURCHASE_REQUEST'
      ? [
          { value, label },
          { value: 'DIRECT_PURCHASE', label: '직접 구매 요청' },
        ]
      : [{ value, label }]
  )),
]
interface TableColumn<T> {
  key: keyof T | string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

const columns: TableColumn<TicketListItem>[] = [
  { key: 'ticketNo', label: '티켓 번호', width: '140px' },
  { key: 'ticketType', label: '유형', width: '150px' },
  { key: 'requestedItemName', label: '요청 내용' },
  { key: 'requester', label: '요청자(부서)', width: '180px' },
  { key: 'requestedAt', label: '요청일', width: '130px' },
  { key: 'ticketStatus', label: '상태', width: '150px', align: 'center' },
  { key: 'management', label: '관리', width: '110px', align: 'center' },
]
const IN_PROGRESS_STATUSES: TicketStatus[] = ['ASSET_APPROVED', 'IN_PROGRESS']

type TicketTypeFilter = TicketType | Extract<PurchaseRequestMethod, 'DIRECT_PURCHASE'>

const router = useRouter()
const authStore = useAuthStore()

const tickets = ref<TicketListItem[]>([])
const departments = ref<Department[]>([])
const members = ref<Member[]>([])
const filterForm = ref({
  departmentId: '',
  requesterId: '',
  status: '' as TicketStatus | '',
  ticketType: '' as TicketTypeFilter | '',
})
const keywordInput = ref('')
const appliedKeyword = ref('')
const page = ref(0)
const pageSize = ref(20)
const isLoading = ref(false)
const errorMessage = ref('')

const isAssetTeamRole = computed(() => (
  authStore.currentRole === 'ADMIN'
  || authStore.currentRole === 'SUPER_ADMIN'
  || authStore.currentRole === 'ASSET_TEAM'
  || authStore.currentRole === 'ASSET_MANAGER'
))
const pageTitle = computed(() => (isAssetTeamRole.value ? '전체 티켓 관리' : '티켓 관리'))
const departmentOptions = computed<DropdownOption[]>(() => [
  { label: '전체 부서', value: '' },
  ...flattenDepartments(departments.value).map((department) => ({
    label: department.name,
    value: department.departmentId,
  })),
])
const selectableDepartmentIds = computed(() => {
  if (isAssetTeamRole.value) return []
  return authStore.user?.departmentId ? [authStore.user.departmentId] : []
})
const selectableMembers = computed(() => {
  if (isAssetTeamRole.value) return members.value
  return members.value.filter((member) => selectableDepartmentIds.value.includes(member.departmentId))
})
const memberOptions = computed<DropdownOption[]>(() => [
  { label: '전체 사원', value: '' },
  ...selectableMembers.value.map((member) => ({
    label: `${member.name} (${member.departmentName})`,
    value: member.memberId,
  })),
])
const totalPages = computed(() => Math.ceil(tickets.value.length / pageSize.value))
const pagedTickets = computed(() => {
  const start = page.value * pageSize.value
  return tickets.value.slice(start, start + pageSize.value)
})
const rangeText = computed(() => {
  if (tickets.value.length === 0) return '0건'
  const start = page.value * pageSize.value + 1
  const end = Math.min((page.value + 1) * pageSize.value, tickets.value.length)
  return `${start}-${end}건`
})
const statCards = computed(() => {
  const pendingStatus: TicketStatus = isAssetTeamRole.value ? 'DEPARTMENT_APPROVED' : 'REQUESTED'

  return [
    {
      label: '총 신청 건수',
      value: tickets.value.length,
      description: isAssetTeamRole.value ? '전체 티켓 기준' : '담당 부서 티켓 기준',
      highlight: false,
    },
    {
      label: '신규 요청 / 검토 대기',
      value: tickets.value.filter((ticket) => ticket.ticketStatus === pendingStatus).length,
      description: isAssetTeamRole.value ? '구매자산팀 검토 대기' : '부서책임자 검토 대기',
      highlight: true,
    },
    {
      label: '처리 중',
      value: tickets.value.filter((ticket) => IN_PROGRESS_STATUSES.includes(ticket.ticketStatus)).length,
      description: '승인 후 진행 중인 티켓',
      highlight: false,
    },
    {
      label: '처리 완료',
      value: tickets.value.filter((ticket) => ticket.ticketStatus === 'COMPLETED').length,
      description: '완료된 티켓',
      highlight: false,
    },
  ]
})
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

function flattenDepartments(items: Department[]): Department[] {
  return items.flatMap((department) => [
    department,
    ...flattenDepartments(department.children ?? []),
  ])
}

async function fetchTickets() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await ticketApi.getList({
      page: 0,
      size: 999,
      ticketStatus: filterForm.value.status || undefined,
      ticketType: filterForm.value.ticketType === 'DIRECT_PURCHASE'
        ? 'PURCHASE_REQUEST'
        : filterForm.value.ticketType || undefined,
      keyword: appliedKeyword.value.trim() || undefined,
      departmentId: isAssetTeamRole.value
        ? filterForm.value.departmentId || undefined
        : authStore.user?.departmentId,
      requesterId: filterForm.value.requesterId || undefined,
    })

    tickets.value = response.data.content.filter((ticket) => (
      filterForm.value.ticketType === 'DIRECT_PURCHASE'
        ? ticket.requestMethod === 'DIRECT_PURCHASE'
        : true
    ))
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
      : '티켓 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function loadDepartments() {
  const response = await departmentApi.getList({ page: 0, size: 200 })
  departments.value = response.data.content
}

async function loadMembers() {
  const response = await memberApi.getList({
    page: 0,
    size: 200,
    departmentId: isAssetTeamRole.value
      ? filterForm.value.departmentId || undefined
      : authStore.user?.departmentId,
    status: 'ACTIVE',
  })
  members.value = response.data.content

  if (
    !isAssetTeamRole.value
    && filterForm.value.requesterId
    && !selectableMembers.value.some((member) => member.memberId === filterForm.value.requesterId)
  ) {
    filterForm.value.requesterId = ''
  }
}

function handleSearch() {
  appliedKeyword.value = keywordInput.value
  page.value = 0
  fetchTickets()
}

function handlePageSizeChange(value: string | number) {
  if (typeof value !== 'number') return
  pageSize.value = value
  page.value = 0
}

async function handleDepartmentChange(value: string | number) {
  filterForm.value.departmentId = String(value)
  filterForm.value.requesterId = ''
  page.value = 0
  await loadMembers()
  await fetchTickets()
}

async function handleRequesterChange(value: string | number) {
  const requesterId = String(value)
  if (
    !isAssetTeamRole.value
    && requesterId
    && !selectableMembers.value.some((member) => member.memberId === requesterId)
  ) {
    return
  }

  filterForm.value.requesterId = requesterId
  page.value = 0
  await fetchTickets()
}

async function handleStatusChange(value: string | number) {
  if (typeof value !== 'string') return
  filterForm.value.status = value as TicketStatus | ''
  page.value = 0
  await fetchTickets()
}

async function handleTicketTypeChange(value: string | number) {
  if (typeof value !== 'string') return
  filterForm.value.ticketType = value as TicketTypeFilter | ''
  page.value = 0
  await fetchTickets()
}

function openTicketDetail(ticket: TicketListItem) {
  router.push({ name: 'TicketDetail', params: { ticketId: ticket.ticketId } })
}

function getTicketTypeLabel(ticket: TicketListItem) {
  if (ticket.requestMethod === 'DIRECT_PURCHASE') return '직접 구매 요청'
  return TICKET_TYPE_LABEL[ticket.ticketType]
}

function getManagementButtonLabel(ticket: TicketListItem) {
  if (!isAssetTeamRole.value && ticket.ticketStatus === 'REQUESTED') return '검토하기'
  if (isAssetTeamRole.value && ticket.ticketStatus === 'DEPARTMENT_APPROVED') return '처리하기'
  return '상세 보기'
}

function getManagementButtonVariant(ticket: TicketListItem) {
  return getManagementButtonLabel(ticket) === '상세 보기' ? 'outline' : 'primary'
}

function getStatusBadgeClass(status: TicketStatus) {
  if (status === 'COMPLETED') return 'bg-success/10 text-success'
  if (status === 'DEPARTMENT_REJECTED' || status === 'ASSET_REJECTED' || status === 'CANCELLED') {
    return 'bg-danger/10 text-danger'
  }
  if (status === 'IN_PROGRESS' || status === 'ASSET_APPROVED') return 'bg-primary/10 text-primary'
  return 'bg-warning/10 text-warning'
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

watch(totalPages, (nextTotalPages) => {
  if (nextTotalPages === 0) {
    page.value = 0
  } else if (page.value >= nextTotalPages) {
    page.value = nextTotalPages - 1
  }
})

onMounted(async () => {
  try {
    await loadDepartments()
    await loadMembers()
  } catch {
    errorMessage.value = '필터 정보를 불러오지 못했습니다.'
  }

  await fetchTickets()
})
</script>
