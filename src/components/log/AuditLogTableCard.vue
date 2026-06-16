<template>
  <Table
    :columns="auditColumns"
    :rows="displayRows"
    :loading="loading"
    row-key="auditLogId"
    empty-text="감사 로그가 없습니다."
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Table, { type Column } from '@/components/common/Table.vue'
import type { AuditLog } from '@/types'

const props = defineProps<{
  rows: AuditLog[]
  loading: boolean
}>()

interface AuditLogDisplayRow extends Record<string, unknown> {
  auditLogId: number
  createdAt: string
  actor: string
  category: string
  subject: string
  description: string
  action: string
  note: string
}

const auditColumns: Column<AuditLogDisplayRow>[] = [
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

const displayRows = computed<AuditLogDisplayRow[]>(() => props.rows.map((row) => ({
  auditLogId: row.auditLogId,
  createdAt: formatDateTime(row.createdAt),
  actor: row.memberName,
  category: row.targetType,
  subject: String(row.targetId),
  description: row.description,
  action: row.actionType,
  note: '-',
})))
</script>
