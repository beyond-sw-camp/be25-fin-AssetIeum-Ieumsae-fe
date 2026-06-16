export interface LogListFilter {
  page?: number
  size?: number
  memberId?: string | number
  startDate?: string
  endDate?: string
}

export interface AuditLog {
  auditLogId: number
  memberId: number
  memberName: string
  targetType: string
  targetId: number
  actionType: string
  description: string
  ipAddress: string
  createdAt: string
}

export interface ActivityLog {
  activityLogId: number
  memberId: number
  memberName: string
  activityType: string
  targetType: string
  targetId: number | null
  description: string
  createdAt: string
}
