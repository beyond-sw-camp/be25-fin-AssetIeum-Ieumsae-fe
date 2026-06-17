<template>
  <div class="relative flex h-full min-h-0 flex-col bg-background text-text-main">
    <div class="min-h-0 flex-1 overflow-y-auto pb-14">
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
          <header class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xl font-semibold text-text-muted">#{{ ticket.ticketNo }}</span>
                <span class="text-text-muted">|</span>
                <h1 class="text-2xl font-bold text-text-main">
                  {{ ticket.requestReason || '요청 사유가 등록되지 않았습니다.' }}
                </h1>
              </div>
            </div>
            <div v-if="isAssetTeamRole" class="w-full shrink-0 lg:w-60">
              <div class="mb-1.5 flex items-center justify-between gap-2">
                <label
                  for="ticket-status-selector"
                  class="text-xs font-semibold text-text-muted"
                >
                  상태 변경
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  class="shrink-0"
                  :loading="isChangingStatus"
                  :disabled="!canChangeStatus"
                  @click="handleChangeStatus"
                >
                  <Save :size="14" />
                  상태 저장
                </Button>
              </div>
              <Dropdown
                id="ticket-status-selector"
                :model-value="selectedTicketStatus"
                :options="ticketStatusOptions"
                :disabled="isActionSubmitting"
                menu-align="right"
                aria-label="티켓 상태"
                @update:model-value="handleTicketStatusSelect"
              />
            </div>
          </header>

          <div class="space-y-4">
            <TicketDetailCard v-if="shouldShowManagementCard" title="관리 안내">
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
                    <dd class="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-main">
                      <span>{{ item.value }}</span>
                      <RouterLink
                        v-if="item.linkTo"
                        :to="item.linkTo"
                        class="text-xs font-semibold text-primary hover:underline"
                      >
                        {{ item.linkLabel }}
                      </RouterLink>
                    </dd>
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
                    <dd class="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-main">
                      <span>{{ item.value }}</span>
                      <button
                        v-if="item.actionLabel"
                        type="button"
                        class="inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="item.actionDisabled"
                        @click="item.action"
                      >
                        <span>{{ item.actionLoading ? '배정 중...' : item.actionLabel }}</span>
                      </button>
                    </dd>
                  </div>
                </dl>
              </TicketDetailCard>
            </div>

            <TicketDetailCard v-if="shouldShowDirectPurchasePaymentCard" title="직접 구매 결제 증빙">
              <template #icon>
                <ReceiptText :size="18" class="text-orange-500" />
              </template>

              <div class="space-y-4">
                <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="item in directPurchasePaymentInfoItems"
                    :key="item.label"
                    class="border-b border-border pb-3"
                  >
                    <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                    <dd class="mt-1.5 break-words text-sm font-semibold text-text-main">
                      {{ item.value }}
                    </dd>
                  </div>
                </dl>

                <div
                  :class="[
                    'rounded-xl border px-4 py-3 text-sm leading-6',
                    isDirectPurchasePaymentReady
                      ? 'border-success/30 bg-success/5 text-text-main'
                      : 'border-warning/30 bg-warning/5 text-text-sub',
                  ]"
                >
                  {{ directPurchasePaymentGuideMessage }}
                </div>
              </div>
            </TicketDetailCard>

            <TicketDetailCard v-if="assetCollectPanel" :title="assetCollectPanel.title">
              <template #icon>
                <PackageCheck :size="18" class="text-primary" />
              </template>

              <div class="space-y-4">
                <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="item in assetCollectInfoItems"
                    :key="item.label"
                    class="border-b border-border pb-3"
                  >
                    <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                    <dd class="mt-1.5 break-words text-sm font-semibold text-text-main">
                      {{ item.value }}
                    </dd>
                  </div>
                </dl>

                <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p class="text-sm leading-6 text-text-sub">
                    {{ assetCollectPanel.description }}
                  </p>
                  <Button
                    v-if="canCollectAsset"
                    class="shrink-0"
                    :loading="isCollectingAsset"
                    :disabled="isActionSubmitting"
                    @click="handleCollectAsset"
                  >
                    <PackageCheck :size="15" />
                    {{ assetCollectPanel.buttonText }}
                  </Button>
                  <Button
                    v-else-if="canCompleteMaintenance"
                    class="shrink-0"
                    :disabled="isActionSubmitting"
                    @click="openMaintenanceCompleteDrawer"
                  >
                    <PackageCheck :size="15" />
                    수리 완료 및 재할당
                  </Button>
                </div>
              </div>
            </TicketDetailCard>

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
      v-if="shouldShowActionBottomBar"
      class="absolute -inset-x-4 -bottom-4 z-20 flex min-h-14 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-6 py-2"
    >
      <Button
        v-if="canDepartmentReview"
        variant="outline"
        class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
        :disabled="isActionSubmitting"
        @click="openRejectDrawer('DEPARTMENT_MANAGER')"
      >
        <XCircle :size="15" />
        반려
      </Button>
      <Button
        v-if="canDepartmentReview"
        class="shrink-0"
        :loading="isApproving"
        :disabled="isActionSubmitting"
        @click="handleApprove('DEPARTMENT_MANAGER')"
      >
        <CheckCircle2 :size="15" />
        승인
      </Button>
      <Button
        v-if="canAssignAsset"
        variant="outline"
        class="shrink-0"
        :disabled="isActionSubmitting"
        @click="openAssetAssignDrawer"
      >
        <PackageCheck :size="15" />
        자산 검색 및 할당
      </Button>
      <Button
        v-if="canChangeRentalExtensionDueDate"
        variant="outline"
        class="shrink-0"
        :disabled="isActionSubmitting"
        @click="openRentalExtensionDrawer"
      >
        <CalendarClock :size="15" />
        반납 예정일 변경
      </Button>
      <Button
        v-if="canAssetReview"
        variant="outline"
        class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
        :disabled="isActionSubmitting"
        @click="openRejectDrawer('ASSET_TEAM')"
      >
        <XCircle :size="15" />
        반려
      </Button>
      <Button
        v-if="canAssetReview"
        class="shrink-0"
        :loading="isApproving"
        :disabled="isActionSubmitting"
        @click="handleApprove('ASSET_TEAM')"
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

    <BaseDrawer
      :is-open="rentalExtensionDrawerOpen"
      title="반납 예정일 변경"
      panel-class="w-full max-w-[420px]"
      @close="closeRentalExtensionDrawer"
    >
      <div class="space-y-5">
        <section class="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
          <p class="font-semibold text-text-main">{{ ticket?.requesterName || '-' }}님의 대여 연장 요청</p>
          <p class="mt-1 text-text-sub">{{ requestItemName(ticket) }}</p>
          <dl class="mt-4 grid gap-3 text-xs">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-text-muted">기존 반납 예정일</dt>
              <dd class="font-semibold text-text-main">{{ formatDate(ticket?.previousDueDate) }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-text-muted">희망 연장일</dt>
              <dd class="font-semibold text-text-main">{{ formatDate(ticket?.requestedDueDate) }}</dd>
            </div>
          </dl>
        </section>

        <Input
          id="rental-extension-changed-due-date"
          v-model="rentalExtensionDueDate"
          type="date"
          label="변경 반납 예정일"
          required
          :disabled="isChangingRentalExtensionDueDate"
          :error="Boolean(rentalExtensionDueDateError)"
          :error-message="rentalExtensionDueDateError"
        />

        <p
          v-if="rentalExtensionSubmitErrorMessage"
          class="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {{ rentalExtensionSubmitErrorMessage }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="m"
            :disabled="isChangingRentalExtensionDueDate"
            @click="closeRentalExtensionDrawer"
          >
            취소
          </Button>
          <Button
            size="m"
            :loading="isChangingRentalExtensionDueDate"
            :disabled="!rentalExtensionDueDate"
            @click="handleRentalExtensionDueDateChange"
          >
            변경 완료
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <BaseDrawer
      :is-open="maintenanceCompleteDrawerOpen"
      title="수리 완료 처리"
      panel-class="w-full max-w-[520px]"
      @close="closeMaintenanceCompleteDrawer"
    >
      <div class="space-y-5">
        <section class="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
          <p class="font-semibold text-text-main">{{ requestItemName(ticket) }}</p>
          <dl class="mt-4 grid gap-3 text-xs">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-text-muted">대상 자산</dt>
              <dd class="font-semibold text-text-main">{{ ticket?.assetId ?? '-' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-text-muted">재할당 대상</dt>
              <dd class="font-semibold text-text-main">{{ ticket?.requesterName ?? '-' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-text-muted">현재 자산 상태</dt>
              <dd class="font-semibold text-text-main">{{ assetStatusLabel(ticket?.assetStatus) }}</dd>
            </div>
          </dl>
        </section>

        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-text-main">
            수리 결과 <span class="font-bold text-primary">*</span>
          </span>
          <textarea
            v-model="maintenanceResult"
            rows="5"
            class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
            placeholder="예: 배터리 교체 및 충전 테스트 완료"
            :disabled="isCompletingMaintenance"
          />
          <p v-if="maintenanceResultError" class="mt-1.5 text-xs font-medium text-danger">
            {{ maintenanceResultError }}
          </p>
        </label>

        <Input
          id="maintenance-completed-at"
          v-model="maintenanceCompletedAt"
          type="datetime-local"
          label="수리 완료 일시"
          required
          :disabled="isCompletingMaintenance"
          :error="Boolean(maintenanceCompletedAtError)"
          :error-message="maintenanceCompletedAtError"
        />

        <Input
          id="maintenance-cost"
          v-model="maintenanceCost"
          type="number"
          label="수리 비용"
          required
          :min="0"
          :disabled="isCompletingMaintenance"
          :error="Boolean(maintenanceCostError)"
          :error-message="maintenanceCostError"
        />

        <p
          v-if="maintenanceCompleteSubmitErrorMessage"
          class="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {{ maintenanceCompleteSubmitErrorMessage }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="m"
            :disabled="isCompletingMaintenance"
            @click="closeMaintenanceCompleteDrawer"
          >
            취소
          </Button>
          <Button
            size="m"
            :loading="isCompletingMaintenance"
            :disabled="!maintenanceResult.trim() || !maintenanceCompletedAt || maintenanceCost === ''"
            @click="handleMaintenanceComplete"
          >
            완료 및 재할당
          </Button>
        </div>
      </template>
    </BaseDrawer>

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
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  ReceiptText,
  Save,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

import { ApiError, intangibleItemApi, tangibleItemApi, ticketApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import TicketAssetAssignDrawer from '@/components/ticket/TicketAssetAssignDrawer.vue'
import TicketCommunication from '@/components/ticket/TicketCommunication.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import TicketProgressHistory from '@/components/ticket/TicketProgressHistory.vue'
import TicketRejectDrawer from '@/components/ticket/TicketRejectDrawer.vue'
import TicketRequestDetailTable from '@/components/ticket/TicketRequestDetailTable.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type {
  AssetType,
  DropdownOption,
  IntangibleItem,
  TangibleAssetItem,
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
  linkLabel?: string
  linkTo?: {
    name: string
    query?: Record<string, string>
  }
  actionLabel?: string
  action?: () => void
  actionLoading?: boolean
  actionDisabled?: boolean
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

interface AssetItemAssignPayload {
  assetType: AssetType
  assetItemId: string
  itemName: string
  assetIds: string[]
  quantity: number
  memberId: string
  returnDueDate?: string
}

const TERMINAL_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'COMPLETED',
  'CANCELED',
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
const isAssigningMe = ref(false)
const isCollectingAsset = ref(false)
const isCompletingMaintenance = ref(false)
const isChangingRentalExtensionDueDate = ref(false)
const isCheckingPurchaseAssignable = ref(false)
const updatingCommentId = ref<number | null>(null)
const deletingCommentId = ref<number | null>(null)
const rejectDrawerOpen = ref(false)
const rejectTarget = ref<ApproverType | null>(null)
const assetAssignDrawerOpen = ref(false)
const rentalExtensionDrawerOpen = ref(false)
const maintenanceCompleteDrawerOpen = ref(false)
const commentToDelete = ref<TicketComment | null>(null)
const errorMessage = ref('')
const commentsErrorMessage = ref('')
const commentSubmitErrorMessage = ref('')
const commentActionErrorMessage = ref('')
const rejectErrorMessage = ref('')
const assetAssignErrorMessage = ref('')
const rentalExtensionDueDate = ref('')
const rentalExtensionDueDateError = ref('')
const rentalExtensionSubmitErrorMessage = ref('')
const maintenanceResult = ref('')
const maintenanceCompletedAt = ref('')
const maintenanceCost = ref<string | number>('')
const maintenanceResultError = ref('')
const maintenanceCompletedAtError = ref('')
const maintenanceCostError = ref('')
const maintenanceCompleteSubmitErrorMessage = ref('')
const purchaseRequestAssignable = ref(false)
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
const isDirectPurchaseTicket = computed(() => (
  Boolean(
    ticket.value
    && ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod === 'DIRECT_PURCHASE',
  )
))
const shouldShowDirectPurchasePaymentCard = computed(() => (
  Boolean(
    isDirectPurchaseTicket.value
    && ticket.value
    && ['ASSET_APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(ticket.value.status),
  )
))
const hasDirectPurchasePaymentInfo = computed(() => (
  Boolean(
    ticket.value
    && ticket.value.requestMethod === 'DIRECT_PURCHASE'
    && typeof ticket.value.actualAmount === 'number'
    && ticket.value.actualAmount > 0,
  )
))
const directPurchaseEvidenceFileName = computed(() => (
  ticket.value?.directPurchaseEvidenceFileName ?? ''
))
const hasDirectPurchaseEvidence = computed(() => (
  Boolean(directPurchaseEvidenceFileName.value || ticket.value?.directPurchaseEvidenceUploadedAt)
))
const isDirectPurchasePaymentReady = computed(() => (
  hasDirectPurchasePaymentInfo.value && hasDirectPurchaseEvidence.value
))
const isAssetCollectTicket = computed(() => (
  Boolean(
    ticket.value
    && (
      ticket.value.ticketType === 'MAINTENANCE_REQUEST'
      || ticket.value.ticketType === 'ASSET_RETURN'
      || ticket.value.ticketType === 'PURCHASE_RETURN'
    ),
  )
))
const canAssignAsset = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && ASSET_ASSIGNABLE_TYPES.has(ticket.value.ticketType)
    && (
      ticket.value.ticketType === 'PURCHASE_REQUEST'
        ? ['ASSET_APPROVED', 'IN_PROGRESS'].includes(ticket.value.status)
        : ticket.value.status === 'ASSET_APPROVED'
    )
    && (
      ticket.value.ticketType !== 'PURCHASE_REQUEST'
      || (
        purchaseRequestAssignable.value
        && (
          ticket.value.requestMethod !== 'DIRECT_PURCHASE'
          || isDirectPurchasePaymentReady.value
        )
      )
    )
  )
))
const canChangeRentalExtensionDueDate = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && ticket.value.ticketType === 'RENTAL_EXTENSION'
    && ticket.value.status === 'ASSET_APPROVED',
  )
))
const canAssignMe = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && !ticket.value.assigneeId
    && !TERMINAL_STATUSES.has(ticket.value.status)
    && ticket.value.status !== 'REQUESTED',
  )
))
const canCollectAsset = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && isAssetCollectTicket.value
    && ticket.value.status === 'ASSET_APPROVED'
    && !ticket.value.collectedAt,
  )
))
const canCompleteMaintenance = computed(() => (
  Boolean(
    ticket.value
    && isAssetTeamRole.value
    && ticket.value.ticketType === 'MAINTENANCE_REQUEST'
    && ticket.value.status === 'IN_PROGRESS'
    && ticket.value.collectedAt
    && ticket.value.assetStatus === 'REPAIRING'
    && !ticket.value.maintenanceCompletedAt
    && !ticket.value.completedAt,
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
  || Boolean(unsupportedActionMessage.value)
))
const shouldShowActionBottomBar = computed(() => (
  Boolean(
    ticket.value
    && !isLoading.value
    && !errorMessage.value
    && (
      canDepartmentReview.value
      || canAssetReview.value
      || canAssignAsset.value
      || canChangeRentalExtensionDueDate.value
    ),
  )
))
const isActionSubmitting = computed(() => (
  isApproving.value
  || isRejecting.value
  || isChangingStatus.value
  || isAssigningAsset.value
  || isAssigningMe.value
  || isCollectingAsset.value
  || isCompletingMaintenance.value
  || isChangingRentalExtensionDueDate.value
))
const rejectDrawerTitle = computed(() => '반려')
const directPurchasePaymentInfoItems = computed<DetailItem[]>(() => {
  if (!ticket.value) return []

  const quantity = ticket.value.quantity
  const expectedAmount = ticket.value.expectedPrice === null
    || ticket.value.expectedPrice === undefined
    || quantity === null
    || quantity === undefined
    ? null
    : ticket.value.expectedPrice * quantity
  const actualAmount = ticket.value.actualAmount
  const difference = actualAmount === null
    || actualAmount === undefined
    || expectedAmount === null
    || expectedAmount === undefined
    ? null
    : actualAmount - expectedAmount

  return [
    { label: '예상 합계 금액', value: formatCurrency(expectedAmount) },
    { label: '실제 결제 금액', value: formatCurrency(actualAmount) },
    { label: '차액', value: formatCurrency(difference) },
    { label: '증빙 파일', value: directPurchaseEvidenceFileName.value || '-' },
    {
      label: '증빙 업로드 일시',
      value: formatDate(ticket.value.directPurchaseEvidenceUploadedAt, 'YYYY-MM-DD HH:mm'),
    },
    {
      label: '확인 상태',
      value: isDirectPurchasePaymentReady.value ? '결제 증빙 등록 완료' : '결제 증빙 대기',
    },
  ]
})
const directPurchasePaymentGuideMessage = computed(() => {
  if (!hasDirectPurchasePaymentInfo.value) {
    return '사원이 실제 결제 금액과 영수증 증빙을 등록하면 구매자산팀에서 확인할 수 있습니다.'
  }
  if (!hasDirectPurchaseEvidence.value) {
    return '실제 결제 금액은 등록되었지만 영수증 증빙 파일이 아직 없습니다.'
  }
  if (!purchaseRequestAssignable.value) {
    return '결제 증빙이 등록되었습니다. 금액과 증빙을 확인한 뒤 자산을 등록하면 자산 검색 및 할당으로 티켓을 처리 완료할 수 있습니다.'
  }
  return '결제 증빙이 등록되었습니다. 자산 검색 및 할당을 완료하면 티켓이 처리 완료 상태로 변경됩니다.'
})
const assetCollectPanel = computed(() => {
  if (!ticket.value || !isAssetCollectTicket.value) return null
  if (!['ASSET_APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(ticket.value.status)) return null

  const collected = Boolean(ticket.value.collectedAt)

  if (ticket.value.ticketType === 'MAINTENANCE_REQUEST') {
    return {
      title: '유지보수 대상 자산 회수',
      description: collected
        ? '유지보수 대상 자산이 회수되었습니다. 자산 상태와 회수 일시를 확인하세요.'
        : '승인된 유지보수 요청입니다. 대상 자산을 회수하면 자산 상태가 수리중으로 변경됩니다.',
      buttonText: '유지보수 자산 회수',
    }
  }

  if (ticket.value.ticketType === 'ASSET_RETURN') {
    return {
      title: '반납 및 해지 대상 자산 회수',
      description: collected
        ? '반납 및 해지 대상 자산이 회수되었습니다. 회수 상태와 일시를 확인하세요.'
        : '승인된 반납 및 해지 요청입니다. 대상 자산을 회수 처리하면 회수 완료 상태로 기록됩니다.',
      buttonText: '반납 자산 회수',
    }
  }

  return {
    title: '반품 대상 자산 회수',
    description: collected
      ? '반품 대상 자산이 회수되었습니다. 이후 공급처 반품 또는 환불 처리를 진행할 수 있습니다.'
      : '승인된 반품 요청입니다. 대상 자산을 먼저 회수 처리한 뒤 반품 및 환불 처리를 진행하세요.',
    buttonText: '반품 자산 회수',
  }
})
const assetCollectInfoItems = computed<DetailItem[]>(() => {
  if (!ticket.value || !assetCollectPanel.value) return []

  return [
    { label: '대상 자산', value: requestItemName(ticket.value) },
    { label: '자산 구분', value: assetTypeLabel(ticket.value.assetType) },
    { label: '자산 ID', value: ticket.value.assetId ?? '-' },
    { label: '자산 상태', value: assetStatusLabel(ticket.value.assetStatus) },
    { label: '회수 여부', value: ticket.value.collectedAt ? '회수 완료' : '회수 대기' },
    { label: '회수 일시', value: formatDate(ticket.value.collectedAt, 'YYYY-MM-DD HH:mm') },
  ]
})
const unsupportedActionMessage = computed(() => {
  if (!ticket.value || !isAssetTeamRole.value) return ''
  if (
    ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod === 'DIRECT_PURCHASE'
    && ['ASSET_APPROVED', 'IN_PROGRESS'].includes(ticket.value.status)
    && !isDirectPurchasePaymentReady.value
  ) {
    return directPurchasePaymentGuideMessage.value
  }
  if (
    ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod === 'DIRECT_PURCHASE'
    && ['ASSET_APPROVED', 'IN_PROGRESS'].includes(ticket.value.status)
    && isDirectPurchasePaymentReady.value
    && !purchaseRequestAssignable.value
  ) {
    if (isCheckingPurchaseAssignable.value) {
      return '직접 구매 증빙 확인 후 할당할 자산을 확인하고 있습니다.'
    }
    return directPurchasePaymentGuideMessage.value
  }
  if (
    ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod !== 'DIRECT_PURCHASE'
    && ticket.value.status === 'ASSET_APPROVED'
    && !purchaseRequestAssignable.value
  ) {
    if (isCheckingPurchaseAssignable.value) {
      return '관리 중인 같은 비표준 품목을 확인하고 있습니다.'
    }
    return '자산팀 승인 완료 상태입니다. 할당 가능한 같은 비표준 품목이 없으므로 구매 계획 생성 화면의 대상 목록에 표시됩니다.'
  }
  if (
    ticket.value.ticketType === 'PURCHASE_REQUEST'
    && ticket.value.requestMethod !== 'DIRECT_PURCHASE'
    && ticket.value.status === 'IN_PROGRESS'
    && !purchaseRequestAssignable.value
  ) {
    if (isCheckingPurchaseAssignable.value) {
      return '구매 완료 후 등록된 품목을 확인하고 있습니다.'
    }
    return '구매 계획 처리 중입니다. 구매 완료 후 품목과 자산을 등록하면 자산 할당으로 티켓을 완료할 수 있습니다.'
  }
  if (!UNIMPLEMENTED_WORKFLOW_TYPES.has(ticket.value.ticketType)) return ''
  if (TERMINAL_STATUSES.has(ticket.value.status)) return ''

  return ''
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
const isPurchasePlanLinkableTicket = computed(() => (
  Boolean(
    ticket.value
    && (
      ticket.value.ticketType === 'ASSET_REQUEST'
      || (
        ticket.value.ticketType === 'PURCHASE_REQUEST'
        && ticket.value.requestMethod !== 'DIRECT_PURCHASE'
      )
    ),
  )
))
const linkedPurchasePlanId = computed(() => {
  const detail = ticket.value
  if (!detail) return ''

  return detail.linkedPurchasePlanId
    ?? detail.purchasePlanId
    ?? detail.purchaseId
    ?? ''
})
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

  const purchasePlanItem: DetailItem = linkedPurchasePlanId.value
    ? {
        label: '연결된 구매 id',
        value: linkedPurchasePlanId.value,
        linkLabel: '구매 계획으로 가기',
        linkTo: {
          name: 'Purchase',
          query: { purchasePlanId: linkedPurchasePlanId.value },
        },
      }
    : {
        label: '연결된 구매 id',
        value: '',
      }

  return [
    { label: '현재 상태', value: TICKET_STATUS_LABEL[ticket.value.status] },
    isPurchasePlanLinkableTicket.value
      ? purchasePlanItem
      : { label: '내부 상태', value: internalStatusLabel(ticket.value) },
    {
      label: '구매자산팀 담당자',
      value: ticket.value.assigneeName ?? '미지정',
      actionLabel: canAssignMe.value ? '+ 나에게 배정' : undefined,
      action: canAssignMe.value ? handleAssignMe : undefined,
      actionLoading: isAssigningMe.value,
      actionDisabled: isActionSubmitting.value,
    },
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

function requestItemName(detail: TicketDetail | null | undefined): string {
  return detail?.requestedItemName
    ?? detail?.requestedItemDetail
    ?? detail?.productName
    ?? '-'
}

function assetTypeLabel(assetType: AssetType | null | undefined): string {
  if (assetType === 'TANGIBLE') return '유형자산'
  if (assetType === 'INTANGIBLE') return '무형자산'
  return '-'
}

function internalStatusLabel(detail: TicketDetail): string {
  if (detail.ticketType === 'MAINTENANCE_REQUEST' && detail.maintenanceCompletedAt) {
    return detail.status === 'COMPLETED'
      ? '유지보수 완료'
      : '유지보수 결과 등록 완료 - 재할당 대기'
  }

  return detail.detailStatus ?? '-'
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
    await resolvePurchaseRequestAssignability(response.data)
  } catch (error) {
    ticket.value = null
    purchaseRequestAssignable.value = false
    errorMessage.value = detailErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function resolvePurchaseRequestAssignability(detail: TicketDetail) {
  purchaseRequestAssignable.value = false
  if (
    detail.ticketType !== 'PURCHASE_REQUEST'
    || !['ASSET_APPROVED', 'IN_PROGRESS'].includes(detail.status)
  ) return

  isCheckingPurchaseAssignable.value = true
  try {
    if (detail.assetType === 'TANGIBLE') {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        categoryName: detail.categoryName ?? undefined,
      })
      purchaseRequestAssignable.value = response.data.content.some((item) => (
        isNonStandardItem(item.isStandard)
        && numberValue(item.availableCount) >= requestedQuantity(detail)
        && isSameRequestedItem(detail, tangibleItemName(item))
      ))
      return
    }

    if (detail.assetType === 'INTANGIBLE') {
      const response = await intangibleItemApi.getList({
        page: 0,
        size: 100,
        category: detail.categoryName ?? undefined,
      })
      purchaseRequestAssignable.value = response.data.content.some((item) => (
        isNonStandardItem(item.isStandard)
        && numberValue(item.availableCount) >= requestedQuantity(detail)
        && isSameRequestedItem(detail, item.productName)
      ))
    }
  } catch {
    purchaseRequestAssignable.value = false
  } finally {
    isCheckingPurchaseAssignable.value = false
  }
}

function requestedQuantity(detail: TicketDetail) {
  const quantity = Number(detail.quantity)
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1
}

function isNonStandardItem(value: TangibleAssetItem['isStandard'] | IntangibleItem['isStandard']) {
  if (typeof value === 'boolean') return !value
  return Number(value) === 0
}

function tangibleItemName(item: TangibleAssetItem) {
  const aliases = item as TangibleAssetItem & { assetName?: string }
  return item.name ?? item.productName ?? aliases.assetName ?? item.itemCode ?? ''
}

function isSameRequestedItem(detail: TicketDetail, itemName: string | null | undefined) {
  const item = normalizeItemName(itemName)
  if (!item) return false

  return [
    detail.requestedItemName,
    detail.requestedItemDetail,
    detail.productName,
  ].some((name) => {
    const requested = normalizeItemName(name)
    return Boolean(requested && (requested.includes(item) || item.includes(requested)))
  })
}

function normalizeItemName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\d+\s*(개|석|seat|seats|user|users|명)/g, '')
    .replace(/[^a-z0-9가-힣]/g, '')
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
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

async function handleAssignMe() {
  if (!ticket.value || !canAssignMe.value || isAssigningMe.value) return

  isAssigningMe.value = true

  try {
    await ticketApi.assignMe(ticket.value.ticketId)
    await reloadAfterAction()
    notificationStore.success('티켓 담당자로 지정되었습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '티켓 담당자 지정에 실패했습니다.'
    notificationStore.error('담당자 지정 실패', message)
  } finally {
    isAssigningMe.value = false
  }
}

async function handleCollectAsset() {
  if (!ticket.value || !canCollectAsset.value || isCollectingAsset.value) return

  isCollectingAsset.value = true

  try {
    if (ticket.value.ticketType === 'MAINTENANCE_REQUEST') {
      await ticketApi.collectMaintenanceAsset(ticket.value.ticketId)
    } else if (ticket.value.ticketType === 'ASSET_RETURN') {
      await ticketApi.collectReturnAsset(ticket.value.ticketId)
    } else if (ticket.value.ticketType === 'PURCHASE_RETURN') {
      await ticketApi.collectPurchaseReturnAsset(ticket.value.ticketId)
    }

    await reloadAfterAction()
    notificationStore.success(`${assetCollectPanel.value?.buttonText ?? '자산 회수'} 처리가 완료되었습니다.`)
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '자산 회수 처리에 실패했습니다.'
    notificationStore.error('자산 회수 실패', message)
  } finally {
    isCollectingAsset.value = false
  }
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

function openRentalExtensionDrawer() {
  if (!ticket.value || !canChangeRentalExtensionDueDate.value) return

  rentalExtensionDueDate.value = toDateInputValue(
    ticket.value.changedDueDate
      ?? ticket.value.requestedDueDate
      ?? ticket.value.rentalDueDate
      ?? '',
  )
  rentalExtensionDueDateError.value = ''
  rentalExtensionSubmitErrorMessage.value = ''
  rentalExtensionDrawerOpen.value = true
}

function closeRentalExtensionDrawer() {
  if (isChangingRentalExtensionDueDate.value) return

  rentalExtensionDrawerOpen.value = false
  rentalExtensionDueDateError.value = ''
  rentalExtensionSubmitErrorMessage.value = ''
}

function openMaintenanceCompleteDrawer() {
  if (!ticket.value || !canCompleteMaintenance.value) return

  maintenanceResult.value = ticket.value.maintenanceResult ?? ''
  maintenanceCompletedAt.value = toDateTimeLocalInputValue(ticket.value.maintenanceCompletedAt)
    || toDateTimeLocalInputValue(new Date().toISOString())
  maintenanceCost.value = ticket.value.maintenanceCost ?? ''
  maintenanceResultError.value = ''
  maintenanceCompletedAtError.value = ''
  maintenanceCostError.value = ''
  maintenanceCompleteSubmitErrorMessage.value = ''
  maintenanceCompleteDrawerOpen.value = true
}

function closeMaintenanceCompleteDrawer() {
  if (isCompletingMaintenance.value) return

  maintenanceCompleteDrawerOpen.value = false
  maintenanceResultError.value = ''
  maintenanceCompletedAtError.value = ''
  maintenanceCostError.value = ''
  maintenanceCompleteSubmitErrorMessage.value = ''
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDateTimeLocalInputValue(value: string | null | undefined) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function validateRentalExtensionDueDate() {
  if (!ticket.value) return false

  if (!rentalExtensionDueDate.value) {
    rentalExtensionDueDateError.value = '변경할 반납 예정일을 선택해주세요.'
    return false
  }

  const previousDueDate = toDateInputValue(ticket.value.previousDueDate)
  if (previousDueDate && rentalExtensionDueDate.value < previousDueDate) {
    rentalExtensionDueDateError.value = '변경 반납 예정일은 기존 반납 예정일보다 빠를 수 없습니다.'
    return false
  }

  rentalExtensionDueDateError.value = ''
  return true
}

async function handleRentalExtensionDueDateChange() {
  if (
    !ticket.value
    || !canChangeRentalExtensionDueDate.value
    || isChangingRentalExtensionDueDate.value
    || !validateRentalExtensionDueDate()
  ) return

  isChangingRentalExtensionDueDate.value = true
  rentalExtensionSubmitErrorMessage.value = ''

  try {
    await ticketApi.changeRentalExtensionDueDate(ticket.value.ticketId, {
      changedDueDate: rentalExtensionDueDate.value,
    })
    rentalExtensionDrawerOpen.value = false
    await reloadAfterAction()
    notificationStore.success('반납 예정일이 변경되고 티켓이 처리 완료되었습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '반납 예정일 변경에 실패했습니다.'
    rentalExtensionSubmitErrorMessage.value = message
    notificationStore.error('반납 예정일 변경 실패', message)
  } finally {
    isChangingRentalExtensionDueDate.value = false
  }
}

function validateMaintenanceCompleteForm() {
  const result = maintenanceResult.value.trim()
  const cost = Number(maintenanceCost.value)
  let isValid = true

  if (!result) {
    maintenanceResultError.value = '수리 결과를 입력해주세요.'
    isValid = false
  } else {
    maintenanceResultError.value = ''
  }

  if (!maintenanceCompletedAt.value) {
    maintenanceCompletedAtError.value = '수리 완료 일시를 입력해주세요.'
    isValid = false
  } else {
    maintenanceCompletedAtError.value = ''
  }

  if (!Number.isFinite(cost) || cost < 0) {
    maintenanceCostError.value = '수리 비용은 0원 이상으로 입력해주세요.'
    isValid = false
  } else {
    maintenanceCostError.value = ''
  }

  return isValid
}

async function handleMaintenanceComplete() {
  if (
    !ticket.value
    || !canCompleteMaintenance.value
    || isCompletingMaintenance.value
    || !validateMaintenanceCompleteForm()
  ) return

  const currentTicket = ticket.value
  const assetId = currentTicket.assetId
  if (!assetId) {
    maintenanceCompleteSubmitErrorMessage.value = '재할당할 자산 ID를 확인할 수 없습니다.'
    return
  }

  isCompletingMaintenance.value = true
  maintenanceCompleteSubmitErrorMessage.value = ''

  try {
    await ticketApi.completeMaintenance(currentTicket.ticketId, {
      maintenanceResult: maintenanceResult.value.trim(),
      maintenanceCompletedAt: maintenanceCompletedAt.value,
      maintenanceCost: Number(maintenanceCost.value),
    })
    await ticketApi.assignAsset(currentTicket.ticketId, {
      assetType: 'TANGIBLE',
      assetId,
      memberId: String(currentTicket.requesterId),
    })
    await ticketApi.changeStatus(currentTicket.ticketId, 'COMPLETED')
    maintenanceCompleteDrawerOpen.value = false
    await reloadAfterAction()
    notificationStore.success('수리 결과와 비용을 등록하고 자산을 다시 할당했습니다.')
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : '수리 완료 처리에 실패했습니다.'
    maintenanceCompleteSubmitErrorMessage.value = message
    notificationStore.error('수리 완료 처리 실패', message)
  } finally {
    isCompletingMaintenance.value = false
  }
}

async function handleAssetAssign(payload: AssetItemAssignPayload) {
  if (!ticket.value || isAssigningAsset.value) return

  isAssigningAsset.value = true
  assetAssignErrorMessage.value = ''

  try {
    for (const assetId of payload.assetIds) {
      await ticketApi.assignAsset(ticket.value.ticketId, {
        assetType: payload.assetType,
        assetId,
        memberId: payload.memberId,
        returnDueDate: payload.returnDueDate,
      })
    }
    await ticketApi.changeStatus(ticket.value.ticketId, 'COMPLETED')
    assetAssignDrawerOpen.value = false
    await reloadAfterAction()
    notificationStore.success(`${payload.itemName} ${payload.quantity}개가 할당되어 티켓이 처리 완료되었습니다.`)
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
  rentalExtensionDrawerOpen.value = false
  rentalExtensionDueDate.value = ''
  rentalExtensionDueDateError.value = ''
  rentalExtensionSubmitErrorMessage.value = ''
  maintenanceCompleteDrawerOpen.value = false
  maintenanceResult.value = ''
  maintenanceCompletedAt.value = ''
  maintenanceCost.value = ''
  maintenanceResultError.value = ''
  maintenanceCompletedAtError.value = ''
  maintenanceCostError.value = ''
  maintenanceCompleteSubmitErrorMessage.value = ''
  isApproving.value = false
  isRejecting.value = false
  isChangingStatus.value = false
  isAssigningAsset.value = false
  isAssigningMe.value = false
  isCollectingAsset.value = false
  isCompletingMaintenance.value = false
  isChangingRentalExtensionDueDate.value = false
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
