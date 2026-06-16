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
import type { ActivityLog } from '@/types'

interface ActivityLogDisplayRow extends Record<string, unknown> {
  activityLogId: string | number
  createdAt: string
  actor: string
  targetSummary: string
  description: string
  action: string
  note: string
}

const props = defineProps<{
  rows: ActivityLog[]
  loading: boolean
}>()

const activityColumns: Column<ActivityLogDisplayRow>[] = [
  { key: 'createdAt', label: '생성일', align: 'center', width: '16%' },
  { key: 'actor', label: '활동 사용자', align: 'center', width: '20%' },
  { key: 'action', label: '로그 액션', align: 'center', width: '10%' },
  { key: 'targetSummary', label: '로그유형(로그주체)', align: 'center', width: '24%' },
  { key: 'description', label: '상세 내용', align: 'center', width: '30%' },
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

const displayRows = computed<ActivityLogDisplayRow[]>(() => props.rows.map((row) => {
  const activityRow = row as ActivityLog & {
    memberInfo?: string
  }

  return {
    activityLogId: activityRow.activityLogId,
    createdAt: formatDateTime(activityRow.createdAt),
    actor: activityRow.memberInfo ?? `${activityRow.memberName}(${activityRow.memberId})`,
    targetSummary: activityRow.targetId === null
      ? `${activityRow.targetType}(-)`
      : `${activityRow.targetType}(${activityRow.targetId})`,
    description: activityRow.description,
    action: activityRow.activityType,
    note: '-',
  }
}))
</script>
