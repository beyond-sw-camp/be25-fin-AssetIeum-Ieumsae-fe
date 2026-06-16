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
  activityLogId: number
  createdAt: string
  actor: string
  category: string
  subject: string
  description: string
  action: string
  note: string
}

const props = defineProps<{
  rows: ActivityLog[]
  loading: boolean
}>()

const activityColumns: Column<ActivityLogDisplayRow>[] = [
  { key: 'createdAt', label: '생성일', align: 'left', width: '16%' },
  { key: 'actor', label: '활동 사용자', align: 'left', width: '20%' },
  { key: 'category', label: '카테고리', align: 'center', width: '10%' },
  { key: 'subject', label: '로그 주체', align: 'left', width: '16%' },
  { key: 'description', label: '상세 내용', align: 'left', width: '24%' },
  { key: 'action', label: '로그 액션', align: 'center', width: '10%' },
  { key: 'note', label: '비고 ?', align: 'center', width: '6%' },
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

const displayRows = computed<ActivityLogDisplayRow[]>(() => props.rows.map((row) => ({
  activityLogId: row.activityLogId,
  createdAt: formatDateTime(row.createdAt),
  actor: row.memberName,
  category: row.targetType,
  subject: row.targetId === null ? '-' : String(row.targetId),
  description: row.description,
  action: row.activityType,
  note: '-',
})))
</script>
