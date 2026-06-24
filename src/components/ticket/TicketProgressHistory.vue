<template>
  <TicketDetailCard title="진행 히스토리">
    <template #icon>
      <History :size="18" class="text-primary" />
    </template>

    <ol
      class="relative ml-2 space-y-6 border-l border-dashed border-border pb-1"
    >
      <li
        v-for="step in processSteps"
        :key="step.key"
        class="relative pl-7 last:pb-0"
      >
        <span
          :class="[
            'absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface',
            stepStateClass[step.state],
          ]"
        >
          <Check v-if="step.state === 'completed'" :size="13" />
          <X v-else-if="step.state === 'rejected' || step.state === 'canceled'" :size="13" />
          <Clock3 v-else-if="step.state === 'current'" :size="13" />
          <Circle v-else :size="10" />
        </span>

        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p :class="['text-sm font-bold', stepTextClass[step.state]]">
            {{ step.label }}
          </p>
          <span :class="['text-xs font-semibold', stepTextClass[step.state]]">
            {{ stepStateLabel[step.state] }}
          </span>
        </div>

        <p class="mt-1 text-xs text-text-muted">
          {{ step.date ? formatDate(step.date, 'YYYY-MM-DD HH:mm') : stepDateFallback[step.state] }}
        </p>
        <p
          v-if="step.description"
          :class="[
            'mt-2 rounded-lg px-3 py-2 text-xs',
            step.state === 'rejected' || step.state === 'canceled'
              ? 'bg-danger/5 text-danger'
              : 'bg-surface-secondary text-text-sub',
          ]"
        >
          {{ step.description }}
        </p>
        <div
          v-if="step.reason"
          class="mb-4 mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger shadow-sm"
        >
          <p class="mb-1 font-semibold">{{ stepReasonTitle(step.key) }}</p>
          <p class="whitespace-pre-line leading-relaxed">{{ step.reason }}</p>
        </div>
      </li>
    </ol>
  </TicketDetailCard>
</template>

<script setup lang="ts">
import { Check, Circle, Clock3, History, X } from 'lucide-vue-next'
import { computed } from 'vue'

import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import type { TicketDetail, TicketStatus, TicketType } from '@/types'
import { formatDate } from '@/utils/labels'

type ProcessStepState = 'completed' | 'current' | 'pending' | 'rejected' | 'canceled'
type ProcessStepKey = 'created' | 'department' | 'review' | 'action' | 'result' | 'completed'

interface ProcessDefinition {
  key: ProcessStepKey
  label: string
}

interface ProcessStep extends ProcessDefinition {
  state: ProcessStepState
  date?: string
  description?: string
  reason?: string
}

const PROCESS_BY_TICKET_TYPE: Record<TicketType, ProcessDefinition[]> = {
  ASSET_REQUEST: [
    { key: 'created', label: '품목 선택 및 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '품목 확인 및 자산 배정' },
    { key: 'completed', label: '처리 완료' },
  ],
  RENTAL: [
    { key: 'created', label: '대여 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '대여 자산 배정' },
    { key: 'completed', label: '대여 처리 완료' },
  ],
  RENTAL_EXTENSION: [
    { key: 'created', label: '대여 연장 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '반납 예정일 변경' },
    { key: 'completed', label: '연장 처리 완료' },
  ],
  MAINTENANCE_REQUEST: [
    { key: 'created', label: '유지보수 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '유지보수 대상 자산 회수' },
    { key: 'result', label: '유지보수 결과 처리' },
    { key: 'completed', label: '유지보수 처리 완료' },
  ],
  ASSET_RETURN: [
    { key: 'created', label: '반납·해지 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '반납 대상 자산 회수' },
    { key: 'result', label: '자산 반납·해지 처리' },
    { key: 'completed', label: '반납·해지 처리 완료' },
  ],
  PURCHASE_RETURN: [
    { key: 'created', label: '반품 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '반품 대상 자산 회수' },
    { key: 'result', label: '반품·환불 결과 처리' },
    { key: 'completed', label: '반품 처리 완료' },
  ],
  PURCHASE_REQUEST: [
    { key: 'created', label: '구매 요청 생성' },
    { key: 'department', label: '부서 승인' },
    { key: 'review', label: '구매자산팀 검토' },
    { key: 'action', label: '구매 요청 처리' },
    { key: 'completed', label: '구매 처리 완료' },
  ],
}

const STATUS_PROGRESS_INDEX: Partial<Record<TicketStatus | string, number>> = {
  REQUESTED: 1,
  DEPARTMENT_APPROVED: 2,
  ASSET_APPROVED: 3,
  IN_PROGRESS: 3,
  COLLECTED: 4,
}

const stepStateClass: Record<ProcessStepState, string> = {
  completed: 'bg-success text-white',
  current: 'bg-primary/15 text-primary',
  pending: 'border border-border bg-surface-secondary text-text-muted',
  rejected: 'bg-danger/15 text-danger',
  canceled: 'bg-danger/15 text-danger',
}

const stepTextClass: Record<ProcessStepState, string> = {
  completed: 'text-success',
  current: 'text-primary',
  pending: 'text-text-muted',
  rejected: 'text-danger',
  canceled: 'text-danger',
}

const stepStateLabel: Record<ProcessStepState, string> = {
  completed: '완료',
  current: '진행 중',
  pending: '대기',
  rejected: '반려',
  canceled: '취소',
}

const stepDateFallback: Record<ProcessStepState, string> = {
  completed: '완료',
  current: '현재 단계',
  pending: '대기 중',
  rejected: '반려 처리',
  canceled: '취소 처리',
}

const props = defineProps<{
  ticket: TicketDetail
}>()

function stepDate(ticket: TicketDetail, key: ProcessStepKey, state: ProcessStepState) {
  const historyDate = historyStepDate(ticket, key)
  if (historyDate) return historyDate

  if (key === 'created') return ticket.requestedAt
  if (key === 'department') {
    return ticket.departmentApprovedAt ?? ticket.departmentRejectedAt ?? undefined
  }
  if (key === 'review') {
    return ticket.purchaseApprovedAt
      ?? ticket.purchaseRejectedAt
      ?? (state === 'current' ? ticket.updatedAt : undefined)
  }
  if (key === 'completed') {
    return ticket.completedAt ?? ticket.canceledAt ?? undefined
  }
  if (key === 'action' && ticket.ticketType === 'MAINTENANCE_REQUEST') {
    return ticket.collectedAt ?? (state === 'current' ? ticket.updatedAt : undefined)
  }
  if (key === 'result' && ticket.ticketType === 'MAINTENANCE_REQUEST') {
    return ticket.maintenanceCompletedAt ?? (state === 'current' ? ticket.updatedAt : undefined)
  }
  if (key === 'action' && (ticket.ticketType === 'ASSET_RETURN' || ticket.ticketType === 'PURCHASE_RETURN')) {
    return ticket.collectedAt ?? (state === 'current' ? ticket.updatedAt : undefined)
  }
  return state === 'current' ? ticket.updatedAt : undefined
}

function historyStepDate(ticket: TicketDetail, key: ProcessStepKey) {
  return historyForStep(ticket, key)?.processedAt
}

function historyForStep(ticket: TicketDetail, key: ProcessStepKey) {
  const histories = ticket.histories ?? []
  const statusesByStep: Partial<Record<ProcessStepKey, string[]>> = {
    created: ['REQUESTED'],
    department: ['DEPARTMENT_APPROVED', 'DEPARTMENT_REJECTED'],
    review: ['ASSET_APPROVED', 'ASSET_REJECTED'],
    action: ['IN_PROGRESS', 'COLLECTED'],
    completed: ['COMPLETED', 'CANCELLED'],
  }
  const statuses = statusesByStep[key] ?? []

  return histories.find((history) => statuses.includes(String(history.status)))
}

function failureStepIndex(status: TicketStatus) {
  if (status === 'DEPARTMENT_REJECTED') return 1
  if (status === 'ASSET_REJECTED') return 2
  if (status === 'CANCELLED') return 1
  return -1
}

function progressIndex(ticket: TicketDetail) {
  if (ticket.ticketType === 'MAINTENANCE_REQUEST') {
    if (ticket.status === 'IN_PROGRESS' && ticket.maintenanceCompletedAt) return 5
    if (ticket.status === 'IN_PROGRESS' && ticket.assetStatus === 'REPAIRING') return 4
  }
  if (
    (ticket.ticketType === 'ASSET_RETURN' || ticket.ticketType === 'PURCHASE_RETURN')
    && ticket.collectedAt
    && !ticket.completedAt
  ) {
    return 4
  }

  return STATUS_PROGRESS_INDEX[ticket.status] ?? 0
}

function stepDescription(ticket: TicketDetail, key: ProcessStepKey, state: ProcessStepState) {
  if (key === 'created') return ticket.requestReason ?? undefined
  if (state === 'canceled') return '요청이 취소되었습니다.'
  return undefined
}

function textOrUndefined(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function historyReason(ticket: TicketDetail, key: ProcessStepKey) {
  const history = historyForStep(ticket, key)

  return textOrUndefined(history?.rejectionReason)
    ?? textOrUndefined(history?.reason)
    ?? textOrUndefined(history?.comment)
    ?? textOrUndefined(history?.memo)
}

function stepReason(ticket: TicketDetail, key: ProcessStepKey, state: ProcessStepState) {
  if (state !== 'rejected') return undefined

  return historyReason(ticket, key)
    ?? (key === 'department'
      ? textOrUndefined(ticket.departmentRejectionReason)
      : textOrUndefined(ticket.purchaseRejectionReason))
}

function stepReasonTitle(key: ProcessStepKey) {
  if (key === 'department') return '부서 반려 사유'
  if (key === 'review') return '구매자산팀 반려 사유'
  return '반려 사유'
}

const processSteps = computed<ProcessStep[]>(() => {
  const ticket = props.ticket
  const definitions = ticket.ticketType === 'PURCHASE_REQUEST'
    && ticket.requestMethod === 'DIRECT_PURCHASE'
      ? [
        { key: 'created', label: '품목 구분 및 직접 구매 요청 생성' },
        { key: 'department', label: '부서 승인' },
        { key: 'review', label: '구매자산팀 승인' },
        { key: 'action', label: '직접 구매 및 증빙 등록' },
        { key: 'completed', label: '구매 완료 및 자산 등록' },
      ] satisfies ProcessDefinition[]
    : PROCESS_BY_TICKET_TYPE[ticket.ticketType]
  const failureIndex = failureStepIndex(ticket.status)
  const isCompleted = ticket.status === 'COMPLETED'
  const currentIndex = progressIndex(ticket)

  return definitions.map((definition, index) => {
    let state: ProcessStepState

    if (isCompleted) {
      state = 'completed'
    } else if (index < failureIndex) {
      state = 'completed'
    } else if (index === failureIndex) {
      state = ticket.status === 'CANCELLED' ? 'canceled' : 'rejected'
    } else if (failureIndex >= 0) {
      state = 'pending'
    } else if (index < currentIndex) {
      state = 'completed'
    } else if (index === currentIndex) {
      state = 'current'
    } else {
      state = 'pending'
    }

    return {
      ...definition,
      state,
      date: stepDate(ticket, definition.key, state),
      description: stepDescription(ticket, definition.key, state),
      reason: stepReason(ticket, definition.key, state),
    }
  })
})

// TODO: 상세 API가 도메인별 세부 상태를 제공하면 IN_PROGRESS 단계의 회수/결과 처리 위치를 구분한다.
</script>
