<template>
  <section class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-sm font-bold text-text-main">후속 처리</p>
        <p class="mt-1 text-xs text-text-sub">후속 처리가 필요한 전수조사 결과의 처리 상태를 관리합니다.</p>
      </div>
      <Button size="sm" variant="secondary" :disabled="isLoading" @click="emit('refresh')">
        새로고침
      </Button>
    </div>

    <div
      v-if="rows.length === 0"
      class="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted"
    >
      후속 처리가 필요한 결과가 없습니다.
    </div>

    <div
      v-for="row in rows"
      :key="row.followUpId || row.inspectionResultId || row.assetCode"
      class="rounded-lg border border-border bg-surface p-5"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0">
          <p class="truncate text-sm font-bold text-text-main">
            {{ row.assetCode || '-' }}
          </p>
          <p class="mt-1 text-xs text-text-sub">
            {{ row.productName || '-' }}
          </p>
          <p v-if="row.memberName !== '-'" class="mt-1 text-xs text-text-sub">
            대상 사용자 {{ row.memberName }}
          </p>
          <p v-if="row.responseContent" class="mt-2 text-xs leading-relaxed text-text-sub">
            {{ row.responseContent }}
          </p>
        </div>
        <span :class="followUpStatusBadgeClass(row.status)">
          {{ followUpStatusLabel[row.status] ?? row.status }}
        </span>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-[12rem_1fr]">
        <Dropdown
          :model-value="drafts[row.key]?.status ?? row.status"
          :options="getFollowUpStatusOptions(row.status)"
          :disabled="!row.followUpId || row.status === 'COMPLETED'"
          menu-strategy="fixed"
          @update:model-value="updateDraftStatus(row.key, $event)"
        />
        <textarea
          :value="drafts[row.key]?.actionDetail ?? row.actionDetail"
          :disabled="!row.followUpId || row.status === 'COMPLETED'"
          class="min-h-20 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          placeholder="처리 내용을 입력하세요."
          @input="updateDraftAction(row.key, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <p v-if="!row.followUpId" class="mt-3 text-xs text-text-muted">
        후속 처리 상세 정보를 확인할 수 없습니다.
      </p>

      <div class="mt-3 flex justify-end">
        <Button
          size="sm"
          :disabled="!row.followUpId || row.status === 'COMPLETED' || !isChanged(row)"
          :loading="submittingId === row.followUpId"
          @click="emit('update-status', row, normalizeDraft(row))"
        >
          상태 변경
        </Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import type { DropdownOption } from '@/types'
import type { InspectionFollowUpStatus } from '@/types/inspection'

export interface InspectionFollowUpPanelRow {
  key: string
  followUpId: string
  inspectionResultId: string
  productName: string
  assetCode: string
  memberName: string
  responseContent: string
  actionDetail: string
  status: InspectionFollowUpStatus
}

interface FollowUpDraft {
  status: InspectionFollowUpStatus
  actionDetail: string
}

const props = defineProps<{
  rows: InspectionFollowUpPanelRow[]
  isLoading?: boolean
  submittingId?: string
}>()

const emit = defineEmits<{
  refresh: []
  'update-status': [row: InspectionFollowUpPanelRow, draft: FollowUpDraft]
}>()

const followUpStatusLabel: Record<InspectionFollowUpStatus, string> = {
  PENDING: '처리 대기',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
}

const followUpStatusOptions: Record<InspectionFollowUpStatus, DropdownOption[]> = {
  PENDING: [
    { label: '처리 대기', value: 'PENDING' },
    { label: '처리 중', value: 'IN_PROGRESS' },
  ],
  IN_PROGRESS: [
    { label: '처리 중', value: 'IN_PROGRESS' },
    { label: '처리 완료', value: 'COMPLETED' },
  ],
  COMPLETED: [
    { label: '처리 완료', value: 'COMPLETED' },
  ],
}

const drafts = ref<Record<string, FollowUpDraft>>({})

watch(() => props.rows, (rows) => {
  drafts.value = rows.reduce<Record<string, FollowUpDraft>>((acc, row) => {
    acc[row.key] = {
      status: row.status,
      actionDetail: row.actionDetail,
    }
    return acc
  }, {})
}, { immediate: true })

function updateDraftStatus(key: string, value: string | number) {
  const nextValue = String(value)
  if (!isFollowUpStatus(nextValue)) return
  drafts.value[key] = {
    status: nextValue,
    actionDetail: drafts.value[key]?.actionDetail ?? '',
  }
}

function updateDraftAction(key: string, value: string) {
  drafts.value[key] = {
    status: drafts.value[key]?.status ?? 'PENDING',
    actionDetail: value,
  }
}

function normalizeDraft(row: InspectionFollowUpPanelRow): FollowUpDraft {
  return drafts.value[row.key] ?? {
    status: row.status,
    actionDetail: row.actionDetail,
  }
}

function getFollowUpStatusOptions(status: InspectionFollowUpStatus) {
  return followUpStatusOptions[status]
}

function isChanged(row: InspectionFollowUpPanelRow) {
  const draft = normalizeDraft(row)
  return draft.status !== row.status || draft.actionDetail.trim() !== row.actionDetail.trim()
}

function isFollowUpStatus(value: string): value is InspectionFollowUpStatus {
  return value === 'PENDING' || value === 'IN_PROGRESS' || value === 'COMPLETED'
}

function followUpStatusBadgeClass(status: InspectionFollowUpStatus) {
  if (status === 'COMPLETED') return 'badge-success'
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'
  return 'badge-warning'
}
</script>
