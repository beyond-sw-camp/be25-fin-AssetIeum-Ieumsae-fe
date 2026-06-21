import type { ActivityLogAction, AuditLogAction, LogSubjectType } from '@/types/log'

export const AUDIT_LOG_ACTION_LABEL: Record<AuditLogAction, string> = {
  INFORMATION_CHANGE: '정보 변경',
  CREATE: '생성',
  ASSIGN: '배정',
  INVITE: '초대',
  RETURN: '반납',
  DELETE: '삭제',
}

export const ACTIVITY_LOG_ACTION_LABEL: Record<ActivityLogAction, string> = {
  VIEW: '조회',
  SEARCH: '검색',
  LOGIN: '로그인',
}

export const LOG_SUBJECT_TYPE_LABEL: Record<LogSubjectType, string> = {
  COMPANY: '회사',
  DEPARTMENT: '부서',
  MEMBER: '사용자',
  TANGIBLE_ASSET: '유형자산',
  INTANGIBLE_ASSET: '무형자산',
  TANGIBLE_ASSET_ITEM: '유형자산 품목',
  INTANGIBLE_ASSET_ITEM: '무형자산 품목',
  TICKET: '티켓',
  PURCHASE_PLAN: '구매 계획',
  BUDGET: '예산',
  HR_EVENT: 'HR 이벤트',
  INSPECTION: '전수조사',
  SYSTEM: '시스템',
}
