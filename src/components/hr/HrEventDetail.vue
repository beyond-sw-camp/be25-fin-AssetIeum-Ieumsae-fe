<template>
  <BaseDrawer
    :is-open="isOpen"
    title="HR 이벤트 상세"
    panel-class="w-full md:w-[58%] xl:w-[48%]"
    body-class="p-0"
    hide-footer
    @close="emit('close')"
  >
    <div v-if="event" class="flex min-h-full flex-col">
      <header class="border-b border-border px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-primary">{{ event.eventNo }}</p>
            <h3 class="mt-2 text-xl font-bold text-text-main">
              {{ event.targetMemberName }} {{ event.eventTypeLabel }}
            </h3>
            <p class="mt-1 text-sm text-text-sub">예정일 {{ event.eventDate }}</p>
          </div>
          <span :class="statusBadgeClass(event.status)">{{ event.statusLabel }}</span>
        </div>
      </header>

      <main class="flex-1 space-y-4 px-6 py-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-text-main">
              {{ event.eventType === 'ONBOARDING' ? '입사 자산 요청' : '자산 처리 대상' }}
            </h4>
            <p class="mt-1 text-xs text-text-sub">
              {{
                event.eventType === 'ONBOARDING'
                  ? '입사 템플릿 기준으로 자산 요청 티켓이 자동 생성됩니다.'
                  : '배치 실행 결과와 대상별 처리 방식을 확인합니다.'
              }}
            </p>
          </div>
          <Button variant="outline" size="sm" :disabled="isLoading" @click="emit('refresh')">
            <RefreshCw :size="14" />
            새로고침
          </Button>
        </div>

        <p
          v-if="errorMessage"
          class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>

        <div v-if="isLoading" class="py-16 text-center text-sm text-text-muted">
          처리 대상을 불러오는 중입니다.
        </div>
        <div
          v-else-if="targets.length === 0 && event.eventType === 'ONBOARDING' && onboardingTemplateItems.length > 0"
          class="divide-y divide-border rounded-lg border border-border bg-surface"
        >
          <article
            v-for="item in onboardingTemplateItems"
            :key="String(item.hrTemplateItemId ?? item.assetItemId)"
            class="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-text-main">{{ item.productName || '-' }}</p>
              <p class="mt-1 text-xs text-text-sub">
                {{ templateAssetTypeLabel(item.assetType) }} · 요청 수량 {{ item.quantity }}개
              </p>
            </div>
            <span class="inline-flex shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
              티켓 생성 대기
            </span>
          </article>
        </div>
        <div
          v-else-if="targets.length === 0"
          class="rounded-lg border border-border bg-surface-secondary px-4 py-12 text-center text-sm text-text-muted"
        >
          {{
            event.eventType === 'ONBOARDING'
              ? '입사 이벤트는 별도 자산 처리 대상 없이 입사 템플릿으로 자산 요청 티켓을 생성합니다.'
              : '등록된 자산 처리 대상이 없습니다.'
          }}
        </div>
        <article
          v-for="(target, index) in targets"
          v-else
          :key="target.hrEventAssetTargetId ?? target.assetTargetId ?? `${target.assetCode}-${index}`"
          class="rounded-lg border border-border bg-surface p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-bold text-text-main">{{ targetProductName(target) }}</p>
              <p class="mt-1 text-xs text-text-sub">
                {{ targetMetaText(target) }}
              </p>
            </div>
            <span :class="targetStatusBadgeClass(target)">
              {{ targetStatusLabel(target) }}
            </span>
          </div>
          <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div v-if="target.ticketNo">
              <dt class="text-xs font-semibold text-text-muted">연결 티켓</dt>
              <dd class="mt-1 font-semibold text-text-main">{{ target.ticketNo }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold text-text-muted">처리 방식</dt>
              <dd class="mt-1 font-semibold text-text-main">
                {{ actionTypeLabel(target.actionType ?? target.targetActionType) }}
              </dd>
            </div>
            <div v-if="target.transferMemberName">
              <dt class="text-xs font-semibold text-text-muted">전달 대상자</dt>
              <dd class="mt-1 font-semibold text-text-main">{{ target.transferMemberName }}</dd>
            </div>
            <div v-if="target.targetDepartmentName">
              <dt class="text-xs font-semibold text-text-muted">이동 부서</dt>
              <dd class="mt-1 font-semibold text-text-main">{{ target.targetDepartmentName }}</dd>
            </div>
            <div v-if="targetProcessedAtText(target)">
              <dt class="text-xs font-semibold text-text-muted">처리 시각</dt>
              <dd class="mt-1 font-semibold text-text-main">{{ targetProcessedAtText(target) }}</dd>
            </div>
          </dl>
        </article>
      </main>

      <footer v-if="event.status === 'IN_PROGRESS'" class="shrink-0 border-t border-border px-6 py-4">
        <Button class="w-full" :loading="isCompleting" :disabled="isCompleting" @click="emit('complete')">
          이벤트 완료 처리
        </Button>
      </footer>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type {
  HrEventAssetActionType,
  HrEventAssetTargetResponse,
  HrEventAssetTargetStatus,
  HrEventAssetType,
  HrEventStatus,
  HrEventType,
  HrTemplateAssetType,
  HrTemplateResponse,
} from '@/types/hr'
import { getTicketStatusLabel, normalizeTicketStatus } from '@/utils/labels'

export interface HrEventDetailRow {
  eventNo: string
  targetMemberName: string
  eventType: HrEventType
  eventTypeLabel: string
  eventDate: string
  status: HrEventStatus
  statusLabel: string
}

const props = defineProps<{
  isOpen: boolean
  event: HrEventDetailRow | null
  targets: HrEventAssetTargetResponse[]
  template?: HrTemplateResponse | null
  isLoading?: boolean
  isCompleting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  refresh: []
  complete: []
}>()

const ACTION_TYPE_LABEL: Record<HrEventAssetActionType, string> = {
  RETURN_REQUIRED: '반납 요청 생성',
  TRANSFER_REQUIRED: '다른 사용자에게 전달',
  KEEP: '동일 사용자 유지',
}

const onboardingTemplateItems = computed(() => props.template?.items ?? [])

function actionTypeLabel(value?: HrEventAssetActionType) {
  return value ? ACTION_TYPE_LABEL[value] : '-'
}

function assetTypeLabel(value?: HrEventAssetType) {
  if (value === 'TANGIBLE') return '유형자산'
  if (value === 'INTANGIBLE') return '무형자산'
  return '-'
}

function templateAssetTypeLabel(value?: HrTemplateAssetType) {
  if (value === 'TANGIBLE') return '유형자산'
  if (value === 'INTANGIBLE') return '무형자산'
  return '-'
}

function targetProductName(target: HrEventAssetTargetResponse) {
  return target.productName || target.requestedItemName || '-'
}

function targetMetaText(target: HrEventAssetTargetResponse) {
  const parts = [
    target.ticketNo ? `티켓 ${target.ticketNo}` : null,
    target.assetCode,
    assetTypeLabel(target.assetType),
  ].filter((part): part is string => Boolean(part && part !== '-'))

  return parts.length > 0 ? parts.join(' · ') : '-'
}

function targetStatusValue(target: HrEventAssetTargetResponse): HrEventAssetTargetStatus {
  const explicitStatus = normalizeStatus(
    target.status
    ?? target.targetStatus
    ?? target.hrEventAssetTargetStatus
    ?? target.assetTargetStatus,
  )

  if (explicitStatus === 'COMPLETED') return 'COMPLETED'
  if (explicitStatus === 'PROCESSED') return 'PROCESSED'

  const ticketStatus = normalizeStatus(
    target.ticketStatus
    ?? target.returnTicketStatus
    ?? target.requestTicketStatus
    ?? target.assetReturnStatus,
  )

  return ticketStatus ?? explicitStatus ?? 'PENDING'
}

function targetTicketStatusValue(target: HrEventAssetTargetResponse) {
  return firstStatusText(
    target.ticketStatus,
    target.currentStatus,
    target.detailStatus,
    target.assetRequestStatus,
    target.requestTicketStatus,
    target.returnTicketStatus,
    target.assetReturnStatus,
  )
}

function firstStatusText(...values: unknown[]) {
  return values.find((value): value is string => (
    typeof value === 'string' && value.trim().length > 0
  ))?.trim() ?? ''
}

function targetStatusLabel(target: HrEventAssetTargetResponse) {
  const ticketStatus = targetTicketStatusValue(target)
  if (ticketStatus) return getTicketStatusLabel(ticketStatus)

  return statusLabel(targetStatusValue(target))
}

function targetStatusBadgeClass(target: HrEventAssetTargetResponse) {
  const ticketStatus = targetTicketStatusValue(target)
  if (!ticketStatus) return statusBadgeClass(targetStatusValue(target))

  const normalizedStatus = normalizeTicketStatus(ticketStatus)
  const base = 'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold'
  if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'COLLECTED') {
    return `${base} bg-success/10 text-success`
  }
  if (normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'ASSET_APPROVED' || normalizedStatus === 'DEPARTMENT_APPROVED') {
    return `${base} bg-primary/10 text-primary`
  }
  if (normalizedStatus === 'ASSET_REJECTED' || normalizedStatus === 'DEPARTMENT_REJECTED' || normalizedStatus === 'CANCELLED') {
    return `${base} bg-danger/10 text-danger`
  }
  return `${base} bg-primary/10 text-primary`
}

function normalizeStatus(value: unknown): HrEventAssetTargetStatus | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase().replaceAll(' ', '_')
  if (normalized === 'COMPLETED' || normalized === 'COMPLETE' || normalized === 'DONE' || normalized === 'CLOSED') {
    return 'COMPLETED'
  }
  if (
    normalized === 'PROCESSED'
    || normalized === 'IN_PROGRESS'
    || normalized === 'PROCESSING'
    || normalized === 'PROCESS'
    || normalized === 'REQUESTED'
    || normalized === 'DEPARTMENT_APPROVED'
    || normalized === 'ASSET_APPROVED'
  ) {
    return 'PROCESSED'
  }
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'CANCELLED'
  }
  if (normalized === 'PENDING' || normalized === 'WAITING') {
    return 'PENDING'
  }
  if (value.includes('완료')) return 'COMPLETED'
  if (value.includes('처리') || value.includes('진행') || value.includes('실행') || value.includes('요청')) return 'PROCESSED'
  if (value.includes('취소')) return 'CANCELLED'
  if (value.includes('대기')) return 'PENDING'

  return null
}

function targetProcessedAt(target: HrEventAssetTargetResponse) {
  return target.completedAt ?? target.processedAt ?? target.targetProcessedAt ?? null
}

function targetProcessedAtText(target: HrEventAssetTargetResponse) {
  const processedAt = targetProcessedAt(target)
  return processedAt ? formatDateTime(processedAt) : ''
}

function statusLabel(value?: HrEventAssetTargetStatus) {
  if (value === 'PROCESSED') return '반납/처리 진행 중'
  if (value === 'COMPLETED') return '처리 완료'
  if (value === 'CANCELLED') return '취소'
  return '대기 중'
}

function statusBadgeClass(value: HrEventStatus | HrEventAssetTargetStatus) {
  const base = 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold'
  if (value === 'COMPLETED') return `${base} bg-success/10 text-success`
  if (value === 'IN_PROGRESS' || value === 'PROCESSED') return `${base} bg-primary/10 text-primary`
  if (value === 'CANCELLED') return `${base} bg-danger/10 text-danger`
  return `${base} bg-surface-secondary text-text-sub`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>
