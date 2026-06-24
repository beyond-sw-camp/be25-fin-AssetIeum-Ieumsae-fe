<template>
  <section class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-sm font-bold text-text-main">후속 처리</p>
        <p class="mt-1 text-xs text-text-sub">후속 처리가 필요한 전수조사 결과의 처리 상태를 관리합니다.</p>
      </div>
    </div>

    <div
      v-if="!effectiveLoading && displayRows.length === 0"
      class="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted"
    >
      후속 처리가 필요한 결과가 없습니다.
    </div>

    <div
      v-for="row in displayRows"
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
          <p v-if="row.processorName && row.processorName !== '-'" class="mt-1 text-xs text-text-sub">
            후속처리 담당자 {{ row.processorName }}
          </p>
          <p v-if="row.responseContent" class="mt-2 text-xs leading-relaxed text-text-sub">
            {{ row.responseContent }}
          </p>
        </div>
        <span :class="followUpStatusBadgeClass(row.status)">
          {{ followUpStatusLabel[row.status] ?? row.status }}
        </span>
      </div>

      <div
        v-if="editable === false"
        class="mt-4 rounded-lg bg-surface-secondary px-4 py-3"
      >
        <p class="text-xs font-semibold text-text-muted">처리 내용</p>
        <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-main">
          {{ row.actionDetail || '등록된 처리 내용이 없습니다.' }}
        </p>
      </div>

      <div v-else class="mt-4">
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

      <div
        v-if="editable !== false && row.status !== 'COMPLETED'"
        class="mt-3 flex justify-end gap-2"
      >
        <Button
          size="sm"
          variant="secondary"
          :disabled="!row.followUpId || !isActionDetailChanged(row)"
          :loading="submittingId === row.followUpId"
          @click="emit('update-status', row, draftWithStatus(row, row.status))"
        >
          처리 내용 저장
        </Button>
        <Button
          size="sm"
          :disabled="!row.followUpId"
          :loading="submittingId === row.followUpId"
          @click="submitNextStatus(row)"
        >
          {{ nextStatusButtonLabel(row.status) }}
        </Button>
      </div>
    </div>

    <p
      v-if="loadError"
      class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      {{ loadError }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Button from '@/components/common/Button.vue'
import { inspectionFollowUpApi } from '@/api/inspection.api'
import { ApiError } from '@/api/client'
import type {
  InspectionFollowUpResponse,
  InspectionFollowUpStatus,
} from '@/types/inspection'

export interface InspectionFollowUpPanelRow {
  key: string
  followUpId: string
  inspectionResultId: string
  productName: string
  assetCode: string
  memberName: string
  processorName: string
  responseContent: string
  actionDetail: string
  status: InspectionFollowUpStatus
}

interface FollowUpDraft {
  status: InspectionFollowUpStatus
  actionDetail: string
}

const props = withDefaults(defineProps<{
  rows?: InspectionFollowUpPanelRow[]
  followUpIds?: string[]
  loadFromApi?: boolean
  isLoading?: boolean
  submittingId?: string
  editable?: boolean
}>(), {
  rows: () => [],
  followUpIds: () => [],
  loadFromApi: false,
  isLoading: false,
  submittingId: '',
  editable: true,
})

const emit = defineEmits<{
  refresh: []
  'update-status': [row: InspectionFollowUpPanelRow, draft: FollowUpDraft]
}>()

const followUpStatusLabel: Record<InspectionFollowUpStatus, string> = {
  PENDING: '처리 대기',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
}

const drafts = ref<Record<string, FollowUpDraft>>({})
const fetchedRows = ref<InspectionFollowUpPanelRow[]>([])
const isFetching = ref(false)
const loadError = ref('')
const displayRows = computed(() => props.loadFromApi ? fetchedRows.value : props.rows)
const effectiveLoading = computed(() => props.isLoading || isFetching.value)

watch(displayRows, (rows) => {
  drafts.value = rows.reduce<Record<string, FollowUpDraft>>((acc, row) => {
    acc[row.key] = {
      status: row.status,
      actionDetail: row.actionDetail,
    }
    return acc
  }, {})
}, { immediate: true })

watch(
  () => [props.loadFromApi, ...props.followUpIds],
  () => {
    if (props.loadFromApi) void loadFollowUps()
  },
  { immediate: true },
)

function toPanelRow(item: InspectionFollowUpResponse): InspectionFollowUpPanelRow {
  const followUpId = String(item.followUpId ?? item.inspectionFollowUpId ?? '')
  const seedRow = props.rows.find((row) => row.followUpId === followUpId)

  return {
    key: followUpId || seedRow?.key || '',
    followUpId,
    inspectionResultId: String(item.inspectionResultId ?? seedRow?.inspectionResultId ?? ''),
    productName: item.productName ?? seedRow?.productName ?? '-',
    assetCode: item.assetCode ?? seedRow?.assetCode ?? '-',
    memberName: item.memberName ?? seedRow?.memberName ?? '-',
    processorName: item.processorName ?? seedRow?.processorName ?? '-',
    responseContent: item.responseContent ?? seedRow?.responseContent ?? '',
    actionDetail: item.actionDetail ?? seedRow?.actionDetail ?? '',
    status: item.status ?? item.followUpStatus ?? item.inspectionFollowUpStatus ?? 'PENDING',
  }
}

async function loadFollowUps() {
  if (props.followUpIds.length === 0) {
    fetchedRows.value = []
    loadError.value = ''
    return
  }

  isFetching.value = true
  loadError.value = ''

  try {
    const results = await Promise.allSettled(
      props.followUpIds.map((followUpId) => inspectionFollowUpApi.getFollowUp(followUpId)),
    )
    fetchedRows.value = results.flatMap((result) => (
      result.status === 'fulfilled' ? [toPanelRow(result.value.data)] : []
    ))

    if (fetchedRows.value.length === 0) {
      loadError.value = '후속 처리 정보를 불러오지 못했습니다.'
    }
  } catch (error) {
    fetchedRows.value = []
    loadError.value = error instanceof ApiError
      ? error.message
      : '후속 처리 정보를 불러오지 못했습니다.'
  } finally {
    isFetching.value = false
  }
}

function updateDraftAction(key: string, value: string) {
  drafts.value[key] = {
    status: drafts.value[key]?.status ?? 'PENDING',
    actionDetail: value,
  }
}

function draftWithStatus(
  row: InspectionFollowUpPanelRow,
  status: InspectionFollowUpStatus,
): FollowUpDraft {
  return {
    status,
    actionDetail: drafts.value[row.key]?.actionDetail ?? row.actionDetail,
  }
}

function isActionDetailChanged(row: InspectionFollowUpPanelRow) {
  return (drafts.value[row.key]?.actionDetail ?? row.actionDetail).trim()
    !== row.actionDetail.trim()
}

function nextFollowUpStatus(status: InspectionFollowUpStatus): InspectionFollowUpStatus | null {
  if (status === 'PENDING') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  return null
}

function nextStatusButtonLabel(status: InspectionFollowUpStatus) {
  return status === 'PENDING' ? '처리 시작' : '처리 완료'
}

function submitNextStatus(row: InspectionFollowUpPanelRow) {
  const nextStatus = nextFollowUpStatus(row.status)
  if (!nextStatus) return

  emit('update-status', row, draftWithStatus(row, nextStatus))
}

function followUpStatusBadgeClass(status: InspectionFollowUpStatus) {
  if (status === 'COMPLETED') return 'badge-success'
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'
  return 'badge-warning'
}
</script>
