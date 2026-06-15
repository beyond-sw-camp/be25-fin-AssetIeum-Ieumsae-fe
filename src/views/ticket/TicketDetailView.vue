<template>
  <div class="h-full overflow-y-auto bg-background text-text-main">
    <div class="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-2">
      <button
        type="button"
        class="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-text-sub transition hover:text-primary"
        @click="router.push({ name: 'TicketList' })"
      >
        <ArrowLeft :size="16" />
        목록으로 돌아가기
      </button>

      <div v-if="isLoading" class="space-y-4">
        <div class="h-12 animate-pulse rounded-xl bg-surface-secondary" />
        <div class="h-44 animate-pulse rounded-2xl bg-surface-secondary" />
        <div class="h-48 animate-pulse rounded-2xl bg-surface-secondary" />
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="h-80 animate-pulse rounded-2xl bg-surface-secondary" />
          <div class="h-80 animate-pulse rounded-2xl bg-surface-secondary" />
        </div>
      </div>

      <div
        v-else-if="errorMessage"
        class="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-danger/20 bg-surface p-8"
      >
        <CircleAlert :size="36" class="text-danger" />
        <div class="text-center">
          <p class="font-bold text-text-main">티켓 정보를 불러오지 못했습니다.</p>
          <p class="mt-1 text-sm text-text-sub">{{ errorMessage }}</p>
        </div>
        <Button variant="outline" @click="loadTicketDetail">
          <RefreshCw :size="16" />
          다시 시도
        </Button>
      </div>

      <template v-else-if="ticket">
        <header class="mb-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xl font-semibold text-text-muted">#{{ ticket.ticketNo }}</span>
              <span class="text-text-muted">|</span>
              <h1 class="text-2xl font-bold text-text-main">
                {{ ticket.requestReason || '요청 사유가 등록되지 않았습니다.' }}
              </h1>
            </div>
          </div>
        </header>

        <div class="space-y-4">
          <div class="grid items-stretch gap-4 lg:grid-cols-2">
            <TicketDetailCard title="티켓 상세 내역" class="h-full">
              <template #icon>
                <TicketCheck :size="18" class="text-primary" />
              </template>

              <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in ticketInfoItems"
                  :key="item.label"
                  class="border-b border-border pb-3"
                >
                  <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                  <dd class="mt-1.5 text-sm font-semibold text-text-main">{{ item.value }}</dd>
                </div>
              </dl>
            </TicketDetailCard>

            <TicketDetailCard title="처리 및 상세 정보" class="h-full">
              <template #icon>
                <ClipboardCheck :size="18" class="text-primary" />
              </template>

              <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in processingInfoItems"
                  :key="item.label"
                  class="border-b border-border pb-3"
                >
                  <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                  <dd class="mt-1.5 text-sm font-semibold text-text-main">{{ item.value }}</dd>
                </div>
              </dl>
            </TicketDetailCard>
          </div>

          <TicketDetailCard title="요청 상세 내역" padding="none">
            <template #icon>
              <ClipboardList :size="18" class="text-primary" />
            </template>

            <TicketRequestDetailTable
              :columns="requestDetailColumns"
              :rows="requestDetailRows"
            />

            <div
              v-if="requestDetailReason"
              class="border-t border-border bg-surface-secondary/40 px-5 py-4"
            >
              <p class="text-xs font-semibold text-text-muted">{{ requestDetailReason.label }}</p>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-main">
                {{ requestDetailReason.value }}
              </p>
            </div>

            <dl v-if="rejectionReason" class="border-t border-border p-4">
              <div
                class="rounded-xl border border-danger/20 bg-danger/5 p-4"
              >
                <dt class="text-xs font-semibold text-danger">반려 사유</dt>
                <dd class="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-main">
                  {{ rejectionReason }}
                </dd>
              </div>
            </dl>
          </TicketDetailCard>

          <div class="grid items-stretch gap-4 lg:grid-cols-2">
            <TicketProgressHistory :ticket="ticket" />
            <TicketCommunication
              :comments="comments"
              :loading="isCommentsLoading"
              :submitting="isCommentSubmitting"
              :error-message="commentsErrorMessage"
              :submit-error-message="commentSubmitErrorMessage"
              :current-member-id="authStore.user?.memberId"
              :submit-version="commentSubmitVersion"
              @retry="loadComments"
              @submit="handleCommentSubmit"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  RefreshCw,
  TicketCheck,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import TicketCommunication from '@/components/ticket/TicketCommunication.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import TicketProgressHistory from '@/components/ticket/TicketProgressHistory.vue'
import TicketRequestDetailTable from '@/components/ticket/TicketRequestDetailTable.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type { AssetType, TicketComment, TicketDetail } from '@/types'
import {
  formatCurrency,
  formatDate,
  getTicketTypeLabel,
  INTANGIBLE_STATUS_LABEL,
  TANGIBLE_STATUS_LABEL,
  TICKET_STATUS_LABEL,
} from '@/utils/labels'

interface DetailItem {
  label: string
  value: string
}

interface RequestDetailColumn {
  key: string
  label: string
}

interface RequestDetailReason {
  label: string
  value: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const ticket = ref<TicketDetail | null>(null)
const comments = ref<TicketComment[]>([])
const isLoading = ref(false)
const isCommentsLoading = ref(false)
const isCommentSubmitting = ref(false)
const errorMessage = ref('')
const commentsErrorMessage = ref('')
const commentSubmitErrorMessage = ref('')
const commentSubmitVersion = ref(0)

const ticketId = computed(() => {
  const value = route.params.ticketId
  return typeof value === 'string' ? value.trim() : ''
})

const departmentDecisionAt = computed(() => (
  ticket.value?.departmentApprovedAt
  ?? ticket.value?.departmentRejectedAt
  ?? null
))

const rejectionReason = computed(() => (
  ticket.value?.departmentRejectionReason
  ?? ticket.value?.purchaseRejectionReason
  ?? ''
))

const ticketInfoItems = computed<DetailItem[]>(() => {
  if (!ticket.value) return []

  return [
    {
      label: '티켓 유형',
      value: getTicketTypeLabel(ticket.value.ticketType, ticket.value.requestMethod),
    },
    { label: '요청자', value: ticket.value.requesterName },
    { label: '소속 부서', value: ticket.value.departmentName },
    { label: '부서 승인자', value: ticket.value.approverName ?? '미지정' },
    { label: '부서 처리 일시', value: formatDate(departmentDecisionAt.value, 'YYYY-MM-DD HH:mm') },
    { label: '요청 일시', value: formatDate(ticket.value.requestedAt, 'YYYY-MM-DD HH:mm') },
  ]
})

const processingInfoItems = computed<DetailItem[]>(() => {
  if (!ticket.value) return []

  const commonItems: DetailItem[] = [
    { label: '현재 상태', value: TICKET_STATUS_LABEL[ticket.value.status] },
    { label: '세부 상태', value: ticket.value.detailStatus ?? '-' },
    { label: '구매자산팀 담당자', value: ticket.value.assigneeName ?? '미지정' },
  ]

  switch (ticket.value.ticketType) {
    case 'PURCHASE_REQUEST':
      return [
        ...commonItems,
        { label: '발주 일시', value: formatDate(ticket.value.orderedAt, 'YYYY-MM-DD HH:mm') },
        { label: '납품 확인일', value: formatDate(ticket.value.receivedAt, 'YYYY-MM-DD HH:mm') },
        processingCompletedItem(ticket.value, '등록 일시', ticket.value.registeredAt),
      ]
    case 'RENTAL':
      return [
        ...commonItems,
        { label: '대여 시작일', value: formatDate(ticket.value.rentalStartDate) },
        { label: '반납 예정일', value: formatDate(ticket.value.rentalDueDate) },
        processingCompletedItem(ticket.value),
      ]
    case 'RENTAL_EXTENSION':
      return [
        ...commonItems,
        { label: '기존 반납 예정일', value: formatDate(ticket.value.previousDueDate) },
        { label: '희망 대여 연장일', value: formatDate(ticket.value.requestedDueDate) },
        processingCompletedItem(ticket.value, '변경 처리 일시', ticket.value.processedAt),
      ]
    case 'MAINTENANCE_REQUEST':
      return [
        ...commonItems,
        { label: '자산 회수 일시', value: formatDate(ticket.value.collectedAt, 'YYYY-MM-DD HH:mm') },
        {
          label: '유지보수 완료 일시',
          value: formatDate(ticket.value.maintenanceCompletedAt, 'YYYY-MM-DD HH:mm'),
        },
        processingCompletedItem(ticket.value),
      ]
    case 'ASSET_RETURN':
      return [
        ...commonItems,
        { label: '자산 회수 일시', value: formatDate(ticket.value.collectedAt, 'YYYY-MM-DD HH:mm') },
        { label: '반납·해지 처리 일시', value: formatDate(ticket.value.processedAt, 'YYYY-MM-DD HH:mm') },
        processingCompletedItem(ticket.value),
      ]
    case 'PURCHASE_RETURN':
      return [
        ...commonItems,
        { label: '자산 회수 일시', value: formatDate(ticket.value.collectedAt, 'YYYY-MM-DD HH:mm') },
        { label: '반품 처리 일시', value: formatDate(ticket.value.processedAt, 'YYYY-MM-DD HH:mm') },
        processingCompletedItem(ticket.value),
      ]
    case 'ASSET_REQUEST':
    default:
      return [
        ...commonItems,
        {
          label: '자산팀 처리 일시',
          value: formatDate(
            ticket.value.purchaseApprovedAt ?? ticket.value.purchaseRejectedAt,
            'YYYY-MM-DD HH:mm',
          ),
        },
        { label: '자산 등록 일시', value: formatDate(ticket.value.registeredAt, 'YYYY-MM-DD HH:mm') },
        processingCompletedItem(ticket.value),
      ]
  }
})

const requestDetailColumns = computed<RequestDetailColumn[]>(() => {
  if (!ticket.value) return []

  switch (ticket.value.ticketType) {
    case 'PURCHASE_REQUEST':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
        { key: 'expectedPrice', label: '예상 단가' },
        { key: 'expectedAmount', label: '예상 합계 금액' },
        { key: 'actualAmount', label: '실제 결제 금액' },
      ]
    case 'RENTAL':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
        { key: 'rentalStartDate', label: '희망 대여 시작일' },
        { key: 'requestedDueDate', label: '희망 반납 예정일' },
      ]
    case 'RENTAL_EXTENSION':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
        { key: 'requestedDueDate', label: '희망 대여 연장일' },
      ]
    case 'MAINTENANCE_REQUEST':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'assetId', label: '자산 ID' },
        { key: 'maintenanceReason', label: '요청 내용' },
        { key: 'processedAt', label: '처리 날짜' },
        { key: 'maintenanceResult', label: '처리 상태' },
      ]
    case 'ASSET_RETURN':
      return [
        { key: 'assetType', label: '자산 구분' },
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
        { key: 'startedAt', label: '사용 시작일' },
        { key: 'assetStatus', label: '자산 상태' },
      ]
    case 'PURCHASE_RETURN':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'assetId', label: '자산 ID' },
        { key: 'returnReason', label: '반품 사유' },
        { key: 'collected', label: '회수 여부' },
        { key: 'refundAmount', label: '환불 금액' },
      ]
    case 'ASSET_REQUEST':
    default:
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
      ]
  }
})

const requestDetailRows = computed<Array<Record<string, string>>>(() => {
  if (!ticket.value) return []

  if (!hasRequestDetailData(ticket.value)) return []

  const quantity = ticket.value.quantity
  const expectedAmount = ticket.value.expectedPrice === null
    || ticket.value.expectedPrice === undefined
    || quantity === null
    || quantity === undefined
    ? null
    : ticket.value.expectedPrice * quantity

  return [{
    assetType: assetTypeLabel(ticket.value.assetType),
    category: ticket.value.categoryName ?? '-',
    itemName: requestItemName(ticket.value),
    quantity: quantity === null || quantity === undefined ? '-' : String(quantity),
    expectedPrice: formatCurrency(ticket.value.expectedPrice),
    expectedAmount: formatCurrency(expectedAmount),
    actualAmount: formatCurrency(ticket.value.actualAmount),
    assetId: ticket.value.assetId === null || ticket.value.assetId === undefined
      ? '-'
      : String(ticket.value.assetId),
    startedAt: formatDate(ticket.value.startedAt),
    assetStatus: assetStatusLabel(ticket.value.assetStatus),
    rentalStartDate: formatDate(ticket.value.rentalStartDate),
    requestedDueDate: formatDate(ticket.value.requestedDueDate),
    maintenanceReason: ticket.value.maintenanceReason ?? ticket.value.requestReason ?? '-',
    processedAt: formatDate(ticket.value.processedAt),
    maintenanceResult: ticket.value.maintenanceResult ?? ticket.value.detailStatus ?? '-',
    returnReason: ticket.value.returnReason ?? ticket.value.requestReason ?? '-',
    collected: ticket.value.collectedAt ? 'Y' : 'N',
    refundAmount: formatCurrency(ticket.value.refundAmount),
  }]
})

function hasRequestDetailData(detail: TicketDetail): boolean {
  return [
    detail.assetType,
    detail.categoryName,
    detail.requestedItemName,
    detail.requestedItemDetail,
    detail.productName,
    detail.quantity,
    detail.expectedPrice,
    detail.actualAmount,
    detail.assetId,
    detail.assetStatus,
    detail.startedAt,
    detail.rentalStartDate,
    detail.requestedDueDate,
    detail.rentalDueDate,
    detail.previousDueDate,
    detail.changedDueDate,
    detail.maintenanceReason,
    detail.maintenanceResult,
    detail.returnReason,
    detail.returnResult,
    detail.refundAmount,
    detail.collectedAt,
    detail.processedAt,
  ].some((value) => value !== null && value !== undefined && value !== '')
}

const requestDetailReason = computed<RequestDetailReason | null>(() => {
  if (!ticket.value || ticket.value.ticketType !== 'ASSET_RETURN') return null

  return {
    label: ticket.value.assetType === 'INTANGIBLE' ? '해지 신청 사유' : '반납 신청 사유',
    value: ticket.value.returnReason ?? ticket.value.requestReason ?? '-',
  }
})

function processingCompletedItem(
  detail: TicketDetail,
  pendingLabel = '처리 일시',
  pendingValue?: string | null,
): DetailItem {
  return detail.completedAt
    ? {
        label: '완료 일시',
        value: formatDate(detail.completedAt, 'YYYY-MM-DD HH:mm'),
      }
    : {
        label: pendingLabel,
        value: formatDate(pendingValue, 'YYYY-MM-DD HH:mm'),
      }
}

function requestItemName(detail: TicketDetail): string {
  return detail.requestedItemName
    ?? detail.requestedItemDetail
    ?? detail.productName
    ?? '-'
}

function assetTypeLabel(assetType: AssetType | null | undefined): string {
  if (assetType === 'TANGIBLE') return '유형자산'
  if (assetType === 'INTANGIBLE') return '무형자산'
  return '-'
}

function assetStatusLabel(status: string | null | undefined): string {
  if (!status) return '-'

  const statusLabels: Record<string, string> = {
    ...TANGIBLE_STATUS_LABEL,
    ...INTANGIBLE_STATUS_LABEL,
    UNDER_MAINTENANCE: '유지보수 중',
    RETURN_COLLECTED: '회수 완료',
    RETURNED_TO_VENDOR: '공급처 반품 완료',
  }

  return statusLabels[status] ?? status
}

function detailErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return '이 티켓을 조회할 권한이 없습니다.'
    if (error.status === 404) return '요청한 티켓을 찾을 수 없습니다.'
    return error.message
  }
  return error instanceof Error ? error.message : '티켓 상세 정보를 불러오지 못했습니다.'
}

async function loadTicketDetail() {
  if (!ticketId.value) {
    ticket.value = null
    errorMessage.value = '올바르지 않은 티켓 ID입니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await ticketApi.getDetail(ticketId.value)
    ticket.value = response.data
  } catch (error) {
    ticket.value = null
    errorMessage.value = detailErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function loadComments() {
  if (!ticketId.value) return

  isCommentsLoading.value = true
  commentsErrorMessage.value = ''

  try {
    const response = await ticketApi.getComments(ticketId.value, { page: 0, size: 100 })
    comments.value = response.data.content
  } catch (error) {
    comments.value = []
    commentsErrorMessage.value = error instanceof Error
      ? error.message
      : '댓글을 불러오지 못했습니다.'
  } finally {
    isCommentsLoading.value = false
  }
}

async function handleCommentSubmit(content: string) {
  if (!ticketId.value || isCommentSubmitting.value) return

  isCommentSubmitting.value = true
  commentSubmitErrorMessage.value = ''

  try {
    const response = await ticketApi.addComment(ticketId.value, content)
    comments.value = [...comments.value, response.data]
    commentSubmitVersion.value += 1
    notificationStore.success('댓글이 등록되었습니다.')
  } catch (error) {
    commentSubmitErrorMessage.value = error instanceof Error
      ? error.message
      : '댓글을 등록하지 못했습니다.'
  } finally {
    isCommentSubmitting.value = false
  }
}

async function loadPage() {
  await Promise.all([loadTicketDetail(), loadComments()])
}

watch(ticketId, loadPage)
onMounted(loadPage)
</script>
