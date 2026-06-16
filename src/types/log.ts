export interface LogListFilter {
  page?: number
  size?: number
  memberId?: string
  startDate?: string
  endDate?: string
}

export interface AuditLog extends Record<string, unknown> {
  auditLogId: string
  memberId: string
  memberName: string
  targetType: string
  targetId: string
  logType: string
  description: string
  createdAt: string
}

export interface ActivityLog extends Record<string, unknown> {
  activityLogId: string
  memberId: string
  memberName: string
  activityType: string
  targetType: string
  targetId: string | null
  description: string
  createdAt: string
}
