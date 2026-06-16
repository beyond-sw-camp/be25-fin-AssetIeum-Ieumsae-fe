<template>
  <div class="relative flex h-full min-h-0 flex-col bg-background text-text-main">
    <div class="min-h-0 flex-1 overflow-y-auto pb-4">
      <div class="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-2">
        <div class="mb-3 flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary hover:text-primary"
            aria-label="티켓 관리 목록으로 돌아가기"
            @click="emit('back')"
          >
            <ArrowLeft :size="15" />
          </button>
          <p class="page-subtitle">서비스데스크 &gt; 티켓 관리 &gt; 상세내용</p>
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
            <TicketDetailCard v-if="shouldShowManagementCard" title="관리 액션">
              <template #icon>
                <ShieldCheck :size="18" class="text-primary" />
              </template>

              <div class="space-y-4">
                <div
                  v-if="!canManageCurrentTicket"
                  class="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-sub"
                >
                  현재 계정으로는 이 티켓을 처리할 수 없습니다. 티켓 관리는 부서책임자와 구매자산팀 권한에서만 가능합니다.
                </div>

                <div class="flex flex-wrap items-center gap-4">
                  <Button
                    v-if="canAssetReview"
                    :loading="isApproving"
                    :disabled="isActionSubmitting"
                    @click="handleApprove('ASSET_TEAM')"
                  >
                    <CheckCircle2 :size="15" />
                    승인
                  </Button>
                  <Button
                    v-if="canAssetReview"
                    variant="danger"
                    :disabled="isActionSubmitting"
                    @click="openRejectDrawer('ASSET_TEAM')"
                  >
                    <XCircle :size="15" />
                    반려
                  </Button>
                  <Button
                    v-if="canAssignAsset"
                    variant="outline"
                    :disabled="isActionSubmitting"
                    @click="openAssetAssignDrawer"
                  >
                    <PackageCheck :size="15" />
                    자산 검색 및 할당
                  </Button>
                </div>

                <div
                  v-if="isAssetTeamRole"
                  class="grid gap-2 rounded-xl border border-border bg-surface-secondary/40 p-4 md:grid-cols-[220px_auto_1fr]"
                >
                  <Dropdown
                    :model-value="selectedTicketStatus"
                    :options="ticketStatusOptions"
                    :disabled="isActionSubmitting"
                    aria-label="티켓 상태"
                    @update:model-value="handleTicketStatusSelect"
                  />
                  <Button
                    variant="outline"
                    :loading="isChangingStatus"
                    :disabled="!canChangeStatus"
                    @click="handleChangeStatus"
                  >
                    <Save :size="15" />
                    상태 저장
                  </Button>
                  <p class="self-center text-xs text-text-sub">
                    구매자산팀은 API 명세에 있는 상태 변경 endpoint로만 상태를 변경합니다.
                  </p>
                </div>

                <div
                  v-if="unsupportedActionMessage"
                  class="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-sub"
                >
                  {{ unsupportedActionMessage }}
                </div>
              </div>
            </TicketDetailCard>

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
                <div class="rounded-xl border border-danger/20 bg-danger/5 p-4">
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
      v-if="ticket && !isLoading && !errorMessage && canDepartmentReview"
      class="absolute -inset-x-4 -bottom-4 z-20 flex h-14 items-center justify-end gap-4 border-t border-border bg-surface px-6"
    >
      <Button
        variant="outline"
        class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
        :disabled="isActionSubmitting"
        @click="openRejectDrawer('DEPARTMENT_MANAGER')"
      >
        <XCircle :size="15" />
        반려
      </Button>
      <Button
        class="shrink-0"
        :loading="isApproving"
        :disabled="isActionSubmitting"
        @click="handleApprove('DEPARTMENT_MANAGER')"
      >
        <CheckCircle2 :size="15" />
        승인
      </Button>
    </div>

    <TicketRejectDrawer
      :is-open="rejectDrawerOpen"
      :title="rejectDrawerTitle"
      :submitting="isRejecting"
      :error-message="rejectErrorMessage"
      @close="closeRejectDrawer"
      @submit="handleReject"
    />

    <TicketAssetAssignDrawer
      :is-open="assetAssignDrawerOpen"
      :ticket="ticket"
      :submitting="isAssigningAsset"
      :error-message="assetAssignErrorMessage"
      @close="closeAssetAssignDrawer"
      @submit="handleAssetAssign"
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
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  Save,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

import { ApiError, ticketApi } from '@/api'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import TicketAssetAssignDrawer from '@/components/ticket/TicketAssetAssignDrawer.vue'
import TicketCommunication from '@/components/ticket/TicketCommunication.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import TicketProgressHistory from '@/components/ticket/TicketProgressHistory.vue'
import TicketRejectDrawer from '@/components/ticket/TicketRejectDrawer.vue'
import TicketRequestDetailTable from '@/components/ticket/TicketRequestDetailTable.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type {
  AssetAssignRequest,
  AssetType,
  DropdownOption,
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

type ApproverType = 'DEPARTMENT_MANAGER' | 'ASSET_TEAM'

const TERMINAL_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
  'DEPARTMENT_REJECTED',
  'ASSET_REJECTED',
])
const ASSET_ASSIGNABLE_TYPES = new Set(['ASSET_REQUEST', 'RENTAL', 'PURCHASE_REQUEST'])
const UNIMPLEMENTED_WORKFLOW_TYPES = new Set([
  'RENTAL_EXTENSION',
  'MAINTENANCE_REQUEST',
  'ASSET_RETURN',
  'PURCHASE_RETURN',
])

const props = defineProps<{
  ticketId: string
}>()

const emit = defineEmits<{
  back: []
  updated: []
}>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const ticket = ref<TicketDetail | null>(null)
const comments = ref<TicketComment[]>([])
const selectedTicketStatus = ref<TicketStatus>('REQUESTED')
const isLoading = ref(false)
const isCommentsLoading = ref(false)
const isCommentSubmitting = ref(false)
const isApproving = ref(false)
const isRejecting = ref(false)
const isChangingStatus = ref(false)
const isAssigningAsset = ref(false)
const updatingCommentId = ref<number | null>(null)
const deletingCommentId = ref<number | null>(null)
const rejectDrawerOpen = ref(false)
const rejectTarget = ref<ApproverType | null>(null)
const assetAssignDrawerOpen = ref(false)
const commentToDelete = ref<TicketComment | null>(null)
const errorMessage = ref('')
const commentsErrorMessage = ref('')
const commentSubmitErrorMessage = ref('')
const commentActionErrorMessage = ref('')
const rejectErrorMessage = ref('')
const assetAssignErrorMessage = ref('')
const commentSubmitVersion = ref(0)
const commentActionVersion = ref(0)
let commentActionRequestVersion = 0

const ticketStatusOptions = computed<DropdownOption[]>(() => (
  Object.entries(TICKET_STATUS_LABEL).map(([value, label]) => ({ value, label }))
))

const isDepartmentManagerRole = computed(() => authStore.currentRole === 'DEPARTMENT_MANAGER')
const isAssetTeamRole = computed(() => (
  authStore.currentRole === 'ADMIN'
  || authStore.currentRole === 'SUPER_ADMIN'
  || authStore.currentRole === 'ASSET_TEAM'
  || authStore.currentRole === 'ASSET_MANAGER'
))
const canManageCurrentTicket = computed(() => isDepartmentManagerRole.value || isAssetTeamRole.value)
const isRequester = computed(() => (
  Boolean(
    ticket.value
    && authStore.user?.memberId
    && String(ticket.value.requesterId) === authStore.user.memberId,
  )
))
const canDepartmentReview = computed(() => (
  Boolean(
    ticket.value
    && isDepartmentManagerRole.value
    && !isRequester.value
    && ticket.value.status === 'REQUESTED',
  )
))
const canAssetReview = computed(() => (
  Boolean(ticket.value && isAssetTeamRole.value && ticket.value.status === 'DEPARTMENT_APPROVED')
))
const canAssignAsset = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && ASSET_ASSIGNABLE_TYPES.has(ticket.value.ticketType)
    && !TERMINAL_STATUSES.has(ticket.value.status),
  )
))
const canChangeStatus = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && selectedTicketStatus.value !== ticket.value.status
    && !isActionSubmitting.value,
  )
))
const shouldShowManagementCard = computed(() => (
  !canManageCurrentTicket.value
  || canAssetReview.value
  || canAssignAsset.value
  || isAssetTeamRole.value
  || Boolean(unsupportedActionMessage.value)
))
const isActionSubmitting = computed(() => (
  isApproving.value
  || isRejecting.value
  || isChangingStatus.value
  || isAssigningAsset.value
))
const rejectDrawerTitle = computed(() => '반려')
const unsupportedActionMessage = computed(() => {
  if (!ticket.value || !isAssetTeamRole.value) return ''
  if (!UNIMPLEMENTED_WORKFLOW_TYPES.has(ticket.value.ticketType)) return ''
  if (TERMINAL_STATUSES.has(ticket.value.status)) return ''

  return 'TODO: API 명세/백엔드 확인 필요 - 이 유형의 자산 회수, 유지보수 결과 처리, 반납/해지 처리 endpoint가 확정되면 관리 액션을 연결해야 합니다.'
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

  return [
    { label: '현재 상태', value: TICKET_STATUS_LABEL[ticket.value.status] },
    { label: '내부 상태', value: ticket.value.detailStatus ?? '-' },
    { label: '구매자산팀 담당자', value: ticket.value.assigneeName ?? '미지정' },
    {
      label: '구매자산팀 처리 일시',
      value: formatDate(
        ticket.value.purchaseApprovedAt ?? ticket.value.purchaseRejectedAt,
        'YYYY-MM-DD HH:mm',
      ),
    },
    { label: '처리 일시', value: formatDate(ticket.value.processedAt, 'YYYY-MM-DD HH:mm') },
    { label: '완료 일시', value: formatDate(ticket.value.completedAt, 'YYYY-MM-DD HH:mm') },
  ]
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
    case 'MAINTENANCE_REQUEST':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'assetId', label: '자산 ID' },
        { key: 'maintenanceReason', label: '요청 내용' },
        { key: 'processedAt', label: '처리 일시' },
        { key: 'maintenanceResult', label: '처리 결과' },
      ]
    case 'ASSET_RETURN':
    case 'PURCHASE_RETURN':
      return [
        { key: 'assetType', label: '자산 구분' },
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'assetId', label: '자산 ID' },
        { key: 'assetStatus', label: '자산 상태' },
        { key: 'refundAmount', label: '환불 금액' },
      ]
    case 'RENTAL_EXTENSION':
      return [
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'previousDueDate', label: '기존 반납 예정일' },
        { key: 'requestedDueDate', label: '희망 연장일' },
        { key: 'changedDueDate', label: '변경 반납 예정일' },
      ]
    case 'ASSET_REQUEST':
    default:
      return [
        { key: 'assetType', label: '자산 구분' },
        { key: 'category', label: '자산 분류' },
        { key: 'itemName', label: '품목명' },
        { key: 'quantity', label: '수량' },
      ]
  }
})
const requestDetailRows = computed<Array<Record<string, string>>>(() => {
  if (!ticket.value || !hasRequestDetailData(ticket.value)) return []

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
    assetId: ticket.value.assetId ?? '-',
    assetStatus: assetStatusLabel(ticket.value.assetStatus),
    rentalStartDate: formatDate(ticket.value.rentalStartDate),
    requestedDueDate: formatDate(ticket.value.requestedDueDate),
    previousDueDate: formatDate(ticket.value.previousDueDate),
    changedDueDate: formatDate(ticket.value.changedDueDate),
    maintenanceReason: ticket.value.maintenanceReason ?? ticket.value.requestReason ?? '-',
    maintenanceResult: ticket.value.maintenanceResult ?? ticket.value.detailStatus ?? '-',
    processedAt: formatDate(ticket.value.processedAt),
    refundAmount: formatCurrency(ticket.value.refundAmount),
  }]
})
const requestDetailReason = computed<RequestDetailReason | null>(() => {
  if (!ticket.value) return null
  if (ticket.value.ticketType === 'ASSET_RETURN') {
    return {
      label: ticket.value.assetType === 'INTANGIBLE' ? '해지 요청 사유' : '반납 요청 사유',
      value: ticket.value.returnReason ?? ticket.value.requestReason ?? '-',
    }
  }
  if (ticket.value.ticketType === 'PURCHASE_RETURN') {
    return {
      label: '반품 요청 사유',
      value: ticket.value.returnReason ?? ticket.value.requestReason ?? '-',
    }
  }
  return null
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
    detail.rentalStartDate,
    detail.requestedDueDate,
    detail.previousDueDate,
    detail.changedDueDate,
    detail.maintenanceReason,
    detail.maintenanceResult,
    detail.returnReason,
    detail.refundAmount,
    detail.processedAt,
  ].some((value) => value !== null && value !== undefined && value !== '')
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
  if (!props.ticketId) {
    ticket.value = null
    errorMessage.value = '올바르지 않은 티켓 ID입니다.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await ticketApi.getDetail(props.ticketId)
    ticket.value = response.data
    selectedTicketStatus.value = response.data.status
  } catch (error) {
    ticket.value = null
    errorMessage.value = detailErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function loadComments() {
  if (!props.ticketId) return

  isCommentsLoading.value = true
  commentsErrorMessage.value = ''

  try {
    const response = await ticketApi.getComments(props.ticketId, { page: 0, size: 100 })
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

async function reloadAfterAction() {
  await loadTicketDetail()
  emit('updated')
}

async function handleApprove(approver: ApproverType) {
  if (!ticket.value || isActionSubmitting.value) return

  isApproving.value = true

  try {
    await ticketApi.approve(ticket.value.ticketId, {
      approver,
      approverMemberId: authStore.user?.memberId ?? '',
    })
    await reloadAfterAction()
    notificationStore.success('티켓이 승인되었습니다.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '티켓 승인에 실패했습니다.'
    notificationStore.error('티켓 승인 실패', message)
  } finally {
    isApproving.value = false
  }
}

function openRejectDrawer(target: ApproverType) {
  rejectTarget.value = target
  rejectErrorMessage.value = ''
  rejectDrawerOpen.value = true
}

function closeRejectDrawer() {
  if (isRejecting.value) return
  rejectDrawerOpen.value = false
  rejectTarget.value = null
  rejectErrorMessage.value = ''
}

async function handleReject(reason: string) {
  if (!ticket.value || !rejectTarget.value || isRejecting.value) return

  isRejecting.value = true
  rejectErrorMessage.value = ''

  try {
    await ticketApi.reject(ticket.value.ticketId, {
      rejectionType: rejectTarget.value,
      rejecterMemberId: authStore.user?.memberId ?? '',
      rejectionReason: reason,
    })
    rejectDrawerOpen.value = false
    rejectTarget.value = null
    await reloadAfterAction()
    notificationStore.success('티켓이 반려되었습니다.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '티켓 반려에 실패했습니다.'
    rejectErrorMessage.value = message
    notificationStore.error('티켓 반려 실패', message)
  } finally {
    isRejecting.value = false
  }
}

function handleTicketStatusSelect(value: string | number) {
  selectedTicketStatus.value = value as TicketStatus
}

async function handleChangeStatus() {
  if (!ticket.value || !canChangeStatus.value) return

  isChangingStatus.value = true

  try {
    await ticketApi.changeStatus(ticket.value.ticketId, selectedTicketStatus.value)
    await reloadAfterAction()
    notificationStore.success('티켓 상태가 변경되었습니다.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '티켓 상태 변경에 실패했습니다.'
    notificationStore.error('티켓 상태 변경 실패', message)
  } finally {
    isChangingStatus.value = false
  }
}

function openAssetAssignDrawer() {
  assetAssignErrorMessage.value = ''
  assetAssignDrawerOpen.value = true
}

function closeAssetAssignDrawer() {
  if (isAssigningAsset.value) return
  assetAssignDrawerOpen.value = false
  assetAssignErrorMessage.value = ''
}

async function handleAssetAssign(payload: AssetAssignRequest) {
  if (!ticket.value || isAssigningAsset.value) return

  isAssigningAsset.value = true
  assetAssignErrorMessage.value = ''

  try {
    await ticketApi.assignAsset(ticket.value.ticketId, payload)
    assetAssignDrawerOpen.value = false
    await reloadAfterAction()
    notificationStore.success('자산이 할당되었습니다.')
  } catch (error) {
    const message = error instanceof Error ? error.message : '자산 할당에 실패했습니다.'
    assetAssignErrorMessage.value = message
    notificationStore.error('자산 할당 실패', message)
  } finally {
    isAssigningAsset.value = false
  }
}

async function handleCommentSubmit(content: string) {
  if (!props.ticketId || isCommentSubmitting.value) return

  isCommentSubmitting.value = true
  commentSubmitErrorMessage.value = ''

  try {
    const response = await ticketApi.addComment(props.ticketId, content)
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
  if (!props.ticketId || updatingCommentId.value !== null || deletingCommentId.value !== null) return

  const requestVersion = ++commentActionRequestVersion
  updatingCommentId.value = commentId
  commentActionErrorMessage.value = ''

  try {
    const response = await ticketApi.updateComment(props.ticketId, commentId, content)
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
  if (!props.ticketId || !targetComment || deletingCommentId.value !== null) return

  const requestVersion = ++commentActionRequestVersion
  deletingCommentId.value = targetComment.commentId
  commentActionErrorMessage.value = ''

  try {
    await ticketApi.deleteComment(props.ticketId, targetComment.commentId)
    if (requestVersion !== commentActionRequestVersion) return

    comments.value = comments.value.filter((comment) => comment.commentId !== targetComment.commentId)
    commentToDelete.value = null
    commentActionVersion.value += 1
    notificationStore.success('댓글이 삭제되었습니다.')
  } catch (error) {
    if (requestVersion !== commentActionRequestVersion) return

    const message = error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.'
    commentActionErrorMessage.value = message
    notificationStore.error('댓글 삭제 실패', message)
  } finally {
    if (requestVersion === commentActionRequestVersion) {
      deletingCommentId.value = null
    }
  }
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
  rejectDrawerOpen.value = false
  rejectTarget.value = null
  rejectErrorMessage.value = ''
  assetAssignDrawerOpen.value = false
  assetAssignErrorMessage.value = ''
  isApproving.value = false
  isRejecting.value = false
  isChangingStatus.value = false
  isAssigningAsset.value = false
}

async function loadPage() {
  await Promise.all([loadTicketDetail(), loadComments()])
}

watch(() => props.ticketId, () => {
  resetTicketActionState()
  resetCommentActionState()
  void loadPage()
})

onMounted(loadPage)
</script>
