<template>
  <div class="relative flex h-full min-h-0 flex-col bg-background text-text-main">
    <div class="min-h-0 flex-1 overflow-y-auto pb-14">
      <div class="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-2">
        <div class="mb-3 flex items-center">
          <button
            type="button"
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-sub transition hover:border-primary/40 hover:text-primary"
            aria-label="나의 요청 목록으로 돌아가기"
            @click="router.push({ name: 'TicketList' })"
          >
            <ArrowLeft :size="14" />
          </button>
          <p class="page-subtitle">서비스데스크 > 나의 요청 > 상세 내용</p>
        </div>

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
                :action-error-message="commentActionErrorMessage"
                :current-member-id="authStore.user?.memberId"
                :submit-version="commentSubmitVersion"
                :action-version="commentActionVersion"
                :updating-comment-id="updatingCommentId"
                :deleting-comment-id="deletingCommentId"
                @retry="loadComments"
                @submit="handleCommentSubmit"
                @update="handleCommentUpdate"
                @delete="handleCommentDeleteRequest"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <div
      v-if="ticket && !isLoading && !errorMessage"
      class="absolute -inset-x-4 -bottom-4 z-20 flex h-14 items-center justify-end border-t border-border bg-surface px-6"
    >
      <Button
        v-if="showsDirectPurchasePaymentAction"
        class="mr-2 shrink-0 bg-orange-500! text-white! hover:bg-orange-600! focus:ring-orange-500/50!"
        :disabled="!canRegisterDirectPurchasePayment || isPurchasePaymentSubmitting"
        :title="directPurchasePaymentActionMessage"
        @click="openPurchasePaymentDrawer"
      >
        <ReceiptText :size="15" />
        결제 정보 등록
      </Button>
      <Button
        v-if="canCollectMaintenanceAsset"
        variant="outline"
        class="mr-2 shrink-0"
        :loading="isCollectingMaintenanceAsset"
        :disabled="isCancelling || isPurchasePaymentSubmitting"
        @click="isMaintenanceCollectModalOpen = true"
      >
        <PackageCheck :size="15" />
        유지보수 자산 회수
      </Button>
      <Button
        variant="outline"
        class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
        :disabled="!canCancelTicket"
        :loading="isCancelling"
        :title="cancelActionMessage"
        @click="isCancelModalOpen = true"
      >
        요청 취소
      </Button>
    </div>

    <ConfirmationModal
      :is-open="isCancelModalOpen"
      title="요청 취소"
      message="이 티켓의 요청을 취소하시겠습니까? 취소한 요청은 다시 진행할 수 없습니다."
      confirm-text="요청 취소"
      :loading="isCancelling"
      @cancel="isCancelModalOpen = false"
      @confirm="handleCancelTicket"
    />

    <ConfirmationModal
      :is-open="isMaintenanceCollectModalOpen"
      title="유지보수 자산 회수"
      message="유지보수 대상 자산을 회수 처리하시겠습니까? 처리 후 자산 상태가 수리중으로 변경됩니다."
      confirm-text="회수 처리"
      :loading="isCollectingMaintenanceAsset"
      @cancel="isMaintenanceCollectModalOpen = false"
      @confirm="handleCollectMaintenanceAsset"
    />

    <DirectPurchasePaymentDrawer
      v-if="ticket"
      :is-open="isPurchasePaymentDrawerOpen"
      :ticket="ticket"
      :submitting="isPurchasePaymentSubmitting"
      :error-message="purchasePaymentErrorMessage"
      @close="closePurchasePaymentDrawer"
      @submit="handlePurchasePaymentSubmit"
    />

    <ConfirmationModal
      :is-open="Boolean(commentToDelete)"
      title="댓글 삭제"
      message="이 댓글을 삭제하시겠습니까? 삭제한 댓글은 복구할 수 없습니다."
      confirm-text="삭제"
      :loading="deletingCommentId !== null"
      @cancel="handleCommentDeleteCancel"
      @confirm="handleCommentDelete"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  TicketCheck,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import DirectPurchasePaymentDrawer from '@/components/ticket/DirectPurchasePaymentDrawer.vue'
import TicketCommunication from '@/components/ticket/TicketCommunication.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import TicketProgressHistory from '@/components/ticket/TicketProgressHistory.vue'
import TicketRequestDetailTable from '@/components/ticket/TicketRequestDetailTable.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type {
  AssetType,
  TicketComment,
  TicketDetail,
  TicketStatus,
} from '@/types'
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

const CANCELLABLE_TICKET_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'REQUESTED',
  'DEPARTMENT_APPROVED',
])
const DIRECT_PURCHASE_PAYMENT_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'ASSET_APPROVED',
  'IN_PROGRESS',
])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const ticket = ref<TicketDetail | null>(null)
const comments = ref<TicketComment[]>([])
const isLoading = ref(false)
const isCommentsLoading = ref(false)
const isCommentSubmitting = ref(false)
const updatingCommentId = ref<number | null>(null)
const deletingCommentId = ref<number | null>(null)
const isCancelling = ref(false)
const isCancelModalOpen = ref(false)
const isCollectingMaintenanceAsset = ref(false)
const isMaintenanceCollectModalOpen = ref(false)
const isPurchasePaymentDrawerOpen = ref(false)
const isPurchasePaymentSubmitting = ref(false)
const commentToDelete = ref<TicketComment | null>(null)
const errorMessage = ref('')
const commentsErrorMessage = ref('')
const commentSubmitErrorMessage = ref('')
const purchasePaymentErrorMessage = ref('')
const commentActionErrorMessage = ref('')
const commentSubmitVersion = ref(0)
const commentActionVersion = ref(0)
let commentActionRequestVersion = 0

const ticketId = computed(() => {
  const value = route.params.ticketId
  return typeof value === 'string' ? value.trim() : ''
})

const isRequester = computed(() => (
  Boolean(
    ticket.value
    && authStore.user?.memberId
    && String(ticket.value.requesterId) === authStore.user.memberId,
  )
))

const canCancelTicket = computed(() => (
  Boolean(
    ticket.value
    && isRequester.value
    && CANCELLABLE_TICKET_STATUSES.has(ticket.value.status),
  )
))

const canRegisterDirectPurchasePayment = computed(() => (
  Boolean(
    ticket.value
    && ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod === 'DIRECT_PURCHASE'
    && isRequester.value
    && DIRECT_PURCHASE_PAYMENT_STATUSES.has(ticket.value.status),
  )
))

const isAssetTeamRole = computed(() => (
  authStore.currentRole === 'ADMIN'
  || authStore.currentRole === 'SUPER_ADMIN'
  || authStore.currentRole === 'ASSET_TEAM'
  || authStore.currentRole === 'ASSET_MANAGER'
))

const canCollectMaintenanceAsset = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && ticket.value.ticketType === 'MAINTENANCE_REQUEST'
    && ticket.value.status === 'ASSET_APPROVED'
    && !ticket.value.collectedAt,
  )
))

const showsDirectPurchasePaymentAction = computed(() => (
  Boolean(
    ticket.value
    && ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod === 'DIRECT_PURCHASE'
    && DIRECT_PURCHASE_PAYMENT_STATUSES.has(ticket.value.status),
  )
))

const directPurchasePaymentActionMessage = computed(() => (
  isRequester.value
    ? '실제 결제 금액과 영수증 증빙을 등록합니다.'
    : '요청자 본인만 결제 정보를 등록할 수 있습니다.'
))

const cancelActionMessage = computed(() => {
  if (!ticket.value) return ''
  if (!isRequester.value) return '요청자 본인만 이 티켓을 취소할 수 있습니다.'
  if (CANCELLABLE_TICKET_STATUSES.has(ticket.value.status)) {
    return '구매자산팀 승인 전까지 요청을 취소할 수 있습니다.'
  }

  switch (ticket.value.status) {
    case 'ASSET_APPROVED':
    case 'IN_PROGRESS':
      return '구매자산팀 승인 후에는 요청을 취소할 수 없습니다.'
    case 'COMPLETED':
      return '이미 처리가 완료된 요청입니다.'
    case 'DEPARTMENT_REJECTED':
    case 'ASSET_REJECTED':
      return '반려된 요청은 취소할 수 없습니다.'
    case 'CANCELED':
      return '이미 취소된 요청입니다.'
    default:
      return '현재 상태에서는 요청을 취소할 수 없습니다.'
  }
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

async function handleCommentUpdate(commentId: number, content: string) {
  if (!ticketId.value || updatingCommentId.value !== null || deletingCommentId.value !== null) return

  const requestVersion = ++commentActionRequestVersion
  updatingCommentId.value = commentId
  commentActionErrorMessage.value = ''

  try {
    const response = await ticketApi.updateComment(ticketId.value, commentId, content)
    if (requestVersion !== commentActionRequestVersion) return

    comments.value = comments.value.map((comment) => (
      comment.commentId === commentId ? response.data : comment
    ))
    commentActionVersion.value += 1
    notificationStore.success('댓글이 수정되었습니다.')
  } catch (error) {
    if (requestVersion !== commentActionRequestVersion) return

    commentActionErrorMessage.value = error instanceof Error
      ? error.message
      : '댓글을 수정하지 못했습니다.'
  } finally {
    if (requestVersion === commentActionRequestVersion) {
      updatingCommentId.value = null
    }
  }
}

function handleCommentDeleteRequest(comment: TicketComment) {
  if (updatingCommentId.value !== null || deletingCommentId.value !== null) return

  commentActionErrorMessage.value = ''
  commentToDelete.value = comment
}

function handleCommentDeleteCancel() {
  if (deletingCommentId.value !== null) return
  commentToDelete.value = null
}

async function handleCommentDelete() {
  const targetComment = commentToDelete.value
  if (!ticketId.value || !targetComment || deletingCommentId.value !== null) return

  const requestVersion = ++commentActionRequestVersion
  deletingCommentId.value = targetComment.commentId
  commentActionErrorMessage.value = ''

  try {
    await ticketApi.deleteComment(ticketId.value, targetComment.commentId)
    if (requestVersion !== commentActionRequestVersion) return

    comments.value = comments.value.filter(
      (comment) => comment.commentId !== targetComment.commentId,
    )
    commentToDelete.value = null
    commentActionVersion.value += 1
    notificationStore.success('댓글이 삭제되었습니다.')
  } catch (error) {
    if (requestVersion !== commentActionRequestVersion) return

    const message = error instanceof Error
      ? error.message
      : '댓글을 삭제하지 못했습니다.'
    commentActionErrorMessage.value = message
    notificationStore.error('댓글 삭제 실패', message)
  } finally {
    if (requestVersion === commentActionRequestVersion) {
      deletingCommentId.value = null
    }
  }
}

async function handleCancelTicket() {
  if (!ticketId.value || !canCancelTicket.value || isCancelling.value) return

  isCancelling.value = true

  try {
    await ticketApi.changeStatus(ticketId.value, 'CANCELED')
    isCancelModalOpen.value = false
    await loadTicketDetail()
    notificationStore.success('요청이 취소되었습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '요청을 취소하지 못했습니다.'
    notificationStore.error('요청 취소 실패', message)
  } finally {
    isCancelling.value = false
  }
}

async function handleCollectMaintenanceAsset() {
  if (
    !ticketId.value
    || !canCollectMaintenanceAsset.value
    || isCollectingMaintenanceAsset.value
  ) return

  isCollectingMaintenanceAsset.value = true

  try {
    await ticketApi.collectMaintenanceAsset(ticketId.value)
    isMaintenanceCollectModalOpen.value = false
    await loadTicketDetail()
    notificationStore.success('유지보수 대상 자산을 회수 처리했습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '유지보수 대상 자산 회수 처리에 실패했습니다.'
    notificationStore.error('유지보수 자산 회수 실패', message)
  } finally {
    isCollectingMaintenanceAsset.value = false
  }
}

function openPurchasePaymentDrawer() {
  if (!canRegisterDirectPurchasePayment.value) return
  purchasePaymentErrorMessage.value = ''
  isPurchasePaymentDrawerOpen.value = true
}

function closePurchasePaymentDrawer() {
  if (isPurchasePaymentSubmitting.value) return
  isPurchasePaymentDrawerOpen.value = false
  purchasePaymentErrorMessage.value = ''
}

async function handlePurchasePaymentSubmit(payload: { actualPrice: number; file: File }) {
  if (
    !ticketId.value
    || !canRegisterDirectPurchasePayment.value
    || isPurchasePaymentSubmitting.value
  ) return

  isPurchasePaymentSubmitting.value = true
  purchasePaymentErrorMessage.value = ''

  try {
    await ticketApi.setActualPrice(ticketId.value, payload.actualPrice)
    await ticketApi.uploadEvidence(ticketId.value, payload.file)
    await loadTicketDetail()
    isPurchasePaymentDrawerOpen.value = false
    notificationStore.success('결제 정보가 저장되었습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '결제 정보를 저장하지 못했습니다.'
    purchasePaymentErrorMessage.value = message
    notificationStore.error('결제 정보 저장 실패', message)
  } finally {
    isPurchasePaymentSubmitting.value = false
  }
}

async function loadPage() {
  await Promise.all([loadTicketDetail(), loadComments()])
}

function resetCommentActionState() {
  commentActionRequestVersion += 1
  commentToDelete.value = null
  updatingCommentId.value = null
  deletingCommentId.value = null
  commentActionErrorMessage.value = ''
  commentActionVersion.value += 1
}

function resetTicketActionState() {
  isPurchasePaymentDrawerOpen.value = false
  isPurchasePaymentSubmitting.value = false
  purchasePaymentErrorMessage.value = ''
}

watch(ticketId, () => {
  isPurchasePaymentDrawerOpen.value = false
  isPurchasePaymentSubmitting.value = false
  purchasePaymentErrorMessage.value = ''
  isMaintenanceCollectModalOpen.value = false
  isCollectingMaintenanceAsset.value = false
  resetTicketActionState()
  resetCommentActionState()
  void loadPage()
})
onMounted(loadPage)
</script>
