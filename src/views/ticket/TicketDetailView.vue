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
        <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xl font-semibold text-text-muted">#{{ ticket.ticketNo }}</span>
              <span class="text-text-muted">|</span>
              <h1 class="text-2xl font-bold text-text-main">
                {{ ticket.requestReason || '요청 사유가 등록되지 않았습니다.' }}
              </h1>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <TicketTypeBadge :type="ticket.ticketType" variant="badge" />
            <TicketStatusBadge :status="ticket.status" />
          </div>
        </header>

        <div class="space-y-4">
          <TicketDetailCard title="기본 정보">
            <template #icon>
              <TicketCheck :size="18" class="text-primary" />
            </template>

            <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="item in basicInfoItems" :key="item.label" class="border-b border-border pb-3">
                <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                <dd class="mt-1.5 text-sm font-semibold text-text-main">{{ item.value }}</dd>
              </div>
            </dl>
          </TicketDetailCard>

          <TicketDetailCard title="요청 상세 내역" padding="none">
            <template #icon>
              <ClipboardList :size="18" class="text-primary" />
            </template>

            <div class="overflow-x-auto">
              <div class="min-w-[640px]">
                <div
                  class="grid grid-cols-[minmax(160px,1fr)_minmax(420px,3fr)] border-b border-border bg-surface-secondary text-center text-xs font-semibold text-text-sub"
                >
                  <div class="px-5 py-3">요청 유형</div>
                  <div class="border-l border-border px-5 py-3">요청 사유</div>
                </div>
                <div
                  class="grid grid-cols-[minmax(160px,1fr)_minmax(420px,3fr)] items-center text-sm text-text-main"
                >
                  <div class="px-5 py-4 text-center font-semibold">
                    {{ TICKET_TYPE_LABEL[ticket.ticketType] }}
                  </div>
                  <div class="border-l border-border px-5 py-4 font-medium">
                    <p class="whitespace-pre-wrap leading-6">
                      {{ ticket.requestReason || '-' }}
                    </p>
                  </div>
                </div>
              </div>
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
            <!-- TODO: 상세 API에 자산 분류, 품목명, 수량 등 유형별 필드가 추가되면 표의 열을 확장한다. -->
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
              :current-member-no="authStore.user?.memberNo"
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
import TicketStatusBadge from '@/components/ticket/TicketStatusBadge.vue'
import TicketTypeBadge from '@/components/ticket/TicketTypeBadge.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type { TicketComment, TicketDetail } from '@/types'
import { formatDate, TICKET_TYPE_LABEL } from '@/utils/labels'

interface DetailItem {
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

const basicInfoItems = computed<DetailItem[]>(() => {
  if (!ticket.value) return []

  return [
    { label: '요청자', value: ticket.value.requesterName },
    { label: '소속 부서', value: ticket.value.departmentName },
    { label: '요청 일시', value: formatDate(ticket.value.createdAt, 'YYYY-MM-DD HH:mm') },
    { label: '부서 승인자', value: ticket.value.approverName ?? '미지정' },
    { label: '부서 처리 일시', value: formatDate(departmentDecisionAt.value, 'YYYY-MM-DD HH:mm') },
    { label: '구매자산팀 담당자', value: ticket.value.assigneeName ?? '미지정' },
  ]
})

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
