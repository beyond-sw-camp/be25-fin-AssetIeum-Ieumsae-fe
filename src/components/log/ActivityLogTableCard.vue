<template>
  <Table
    :columns="activityColumns"
    :rows="displayRows"
    :loading="loading"
    row-key="activityLogId"
    empty-text="활동 로그가 없습니다."
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { ACTIVITY_LOG_ACTION_LABEL, LOG_SUBJECT_TYPE_LABEL } from '@/utils/logLabels'
import type { ActivityLog } from '@/types'

interface ActivityLogDisplayRow extends Record<string, unknown> {
  activityLogId: string | number
  createdAt: string
  actor: string
  targetSummary: string
  action: string
  detail: string
  targetPath?: string | null
}

const props = defineProps<{
  rows: ActivityLog[]
  loading: boolean
}>()

const activityColumns: Column<ActivityLogDisplayRow>[] = [
  { key: 'createdAt', label: '생성일', align: 'center', width: '20%' },
  { key: 'actor', label: '활동 사용자', align: 'center', width: '18%' },
  { key: 'action', label: '로그 액션', align: 'center', width: '12%' },
  { key: 'targetSummary', label: '로그 유형', align: 'center', width: '16%' },
]

const formatDateTime = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16)

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(/\. /g, '-').replace('.', '')
}

function subjectSummary(row: ActivityLog) {
  return LOG_SUBJECT_TYPE_LABEL[row.subjectType] ?? '-'
}

function textValue(row: ActivityLog, key: string) {
  const value = (row as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : ''
}

const displayRows = computed<ActivityLogDisplayRow[]>(() => props.rows.map((row) => {
  const memberName = row.actorName ?? row.memberName ?? '-'
  const memberNumber = row.actorMemberNo ?? row.memberNo ?? row.actorId ?? row.memberId ?? '-'

  return {
    activityLogId: row.activityLogId,
    createdAt: formatDateTime(row.createdAt),
    actor: `${memberName}(${memberNumber})`,
    targetSummary: subjectSummary(row),
    action: ACTIVITY_LOG_ACTION_LABEL[row.action],
    detail: textValue(row, 'detail') || textValue(row, 'description') || '-',
  }
}))
</script>