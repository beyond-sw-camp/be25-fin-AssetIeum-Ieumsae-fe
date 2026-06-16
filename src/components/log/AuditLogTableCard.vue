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
  auditLogId: string
  createdAt: string
  memberInfo: string
  targetSummary: string
  description: string
  action: string
}

const auditColumns: Column<AuditLogDisplayRow>[] = [
  { key: 'createdAt', label: '생성일', align: 'center', width: '19%' },
  { key: 'memberInfo', label: '활동 사용자', align: 'center', width: '20%' },
  { key: 'action', label: '로그 액션', align: 'center', width: '15%' },
  { key: 'targetSummary', label: '로그유형(로그주체)', align: 'center', width: '24%' },
  { key: 'description', label: '상세 내용', align: 'center', width: '27%' },
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

const displayRows = computed<AuditLogDisplayRow[]>(() => props.rows.map((row) => {
  const auditRow = row as AuditLog & {
    memberInfo?: string
    logType?: string
    actionType?: string
  }

  return {
    auditLogId: String(auditRow.auditLogId),
    createdAt: formatDateTime(auditRow.createdAt),
    memberInfo: auditRow.memberInfo ?? `${auditRow.memberName}(${auditRow.memberId})`,
    targetSummary: `${auditRow.targetType}(${auditRow.targetId})`,
    description: auditRow.description,
    action: auditRow.logType ?? auditRow.actionType ?? '-',
  }
}))
</script>
