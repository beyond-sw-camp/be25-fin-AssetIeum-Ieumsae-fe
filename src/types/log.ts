export type LogSubjectType =
  | 'COMPANY'
  | 'DEPARTMENT'
  | 'MEMBER'
  | 'TANGIBLE_ASSET'
  | 'INTANGIBLE_ASSET'
  | 'TANGIBLE_ASSET_ITEM'
  | 'INTANGIBLE_ASSET_ITEM'
  | 'TICKET'
  | 'PURCHASE_PLAN'
  | 'BUDGET'
  | 'HR_EVENT'
  | 'INSPECTION'
  | 'SYSTEM'

export type AuditLogAction =
  | 'INFORMATION_CHANGE'
  | 'CREATE'
  | 'ASSIGN'
  | 'INVITE'
  | 'RETURN'
  | 'DELETE'

export type ActivityLogAction = 'VIEW' | 'SEARCH' | 'LOGIN'

export interface LogListFilter {
  page?: number
  size?: number
  action?: AuditLogAction | ActivityLogAction
  subjectType?: LogSubjectType
  subjectId?: string
  keyword?: string
}

export interface AuditLog extends Record<string, unknown> {
  auditLogId: string | number
  actorId?: string | null
  actorName?: string | null
  actorMemberNo?: string | null
  memberId?: string | null
  memberName?: string | null
  memberNo?: string | null
  action: AuditLogAction
  subjectType: LogSubjectType
  subjectId: string | null
  beforeValue: string | null
  afterValue: string | null
  createdAt: string
}

export interface ActivityLog extends Record<string, unknown> {
  activityLogId: string | number
  actorId?: string | null
  actorName?: string | null
  actorMemberNo?: string | null
  memberId?: string | null
  memberName?: string | null
  memberNo?: string | null
  action: ActivityLogAction
  subjectType: LogSubjectType
  subjectId: string | null
  createdAt: string
}
