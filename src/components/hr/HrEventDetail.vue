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
              <p class="font-bold text-text-main">{{ target.productName || '-' }}</p>
              <p class="mt-1 text-xs text-text-sub">
                {{ target.assetCode || '-' }} · {{ assetTypeLabel(target.assetType) }}
              </p>
            </div>
            <span :class="statusBadgeClass(targetStatusValue(target))">
              {{ statusLabel(targetStatusValue(target)) }}
            </span>
          </div>
          <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
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
import { RefreshCw } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type {
  HrEventAssetActionType,
  HrEventAssetTargetResponse,
  HrEventAssetType,
  HrEventStatus,
  HrEventType,
} from '@/types/hr'

export interface HrEventDetailRow {
  eventNo: string
  targetMemberName: string
  eventType: HrEventType
  eventTypeLabel: string
  eventDate: string
  status: HrEventStatus
  statusLabel: string
}

defineProps<{
  isOpen: boolean
  event: HrEventDetailRow | null
  targets: HrEventAssetTargetResponse[]
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
  RETURN_REQUIRED: '자산 반납',
  UNASSIGN_REQUIRED: '배정 해제',
  TRANSFER_REQUIRED: '다른 사용자에게 전달',
  KEEP: '동일 사용자 유지',
}

function actionTypeLabel(value?: HrEventAssetActionType) {
  return value ? ACTION_TYPE_LABEL[value] : '-'
}

function assetTypeLabel(value?: HrEventAssetType) {
  if (value === 'TANGIBLE') return '유형자산'
  if (value === 'INTANGIBLE') return '무형자산'
  return '-'
}

function targetStatusValue(target: HrEventAssetTargetResponse): HrEventStatus {
  const explicitStatus = normalizeStatus(
    target.status
    ?? target.targetStatus
    ?? target.hrEventAssetTargetStatus
    ?? target.assetTargetStatus,
  )

  if (explicitStatus === 'COMPLETED') return 'COMPLETED'

  const ticketStatus = normalizeStatus(
    target.ticketStatus
    ?? target.returnTicketStatus
    ?? target.requestTicketStatus
    ?? target.assetReturnStatus,
  )

  return ticketStatus ?? explicitStatus ?? 'PENDING'
}

function normalizeStatus(value: unknown): HrEventStatus | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase().replaceAll(' ', '_')
  if (normalized === 'COMPLETED' || normalized === 'COMPLETE' || normalized === 'DONE' || normalized === 'CLOSED') {
    return 'COMPLETED'
  }
  if (normalized === 'IN_PROGRESS' || normalized === 'PROCESSING' || normalized === 'PROCESS') {
    return 'IN_PROGRESS'
  }
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'CANCELLED'
  }
  if (normalized === 'PENDING' || normalized === 'WAITING') {
    return 'PENDING'
  }
  if (value.includes('완료')) return 'COMPLETED'
  if (value.includes('처리') || value.includes('진행') || value.includes('실행')) return 'IN_PROGRESS'
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

function statusLabel(value?: HrEventStatus) {
  if (value === 'IN_PROGRESS') return '처리 중'
  if (value === 'COMPLETED') return '처리 완료'
  if (value === 'CANCELLED') return '취소'
  return '대기 중'
}

function statusBadgeClass(value: HrEventStatus) {
  const base = 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold'
  if (value === 'COMPLETED') return `${base} bg-success/10 text-success`
  if (value === 'IN_PROGRESS') return `${base} bg-primary/10 text-primary`
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
