import type {
  TangibleAssetStatus,
  IntangibleAssetStatus,
  TicketStatus,
  TicketType,
  Role,
  MemberStatus,
} from '@/types'

// =====================================================
// 상태 코드 → 한국어 레이블 변환
// =====================================================

export const TANGIBLE_STATUS_LABEL: Record<TangibleAssetStatus, string> = {
  AVAILABLE: '사용가능',
  IN_USE: '사용중',
  REPAIR_REQUESTED: '수리요청',
  REPAIRING: '수리중',
  RETURN_REQUESTED: '반납요청',
  RENTING: '대여중',
  DISCARDED: '폐기완료',
}

export const INTANGIBLE_STATUS_LABEL: Record<IntangibleAssetStatus, string> = {
  AVAILABLE: '사용가능',
  IN_USE: '사용중',
  EXPIRING_SOON: '만료예정',
  EXPIRED: '만료',
  TERMINATION_REQUESTED: '해지요청',
  TERMINATED: '해지',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  REQUESTED: '접수 대기',
  DEPARTMENT_APPROVED: '부서 승인',
  DEPARTMENT_REJECTED: '부서 반려',
  ASSET_TEAM_REVIEWING: '검토 중',
  ASSET_TEAM_REJECTED: '구매자산팀 반려',
  PROCESSING: '처리 중',
  COMPLETED: '처리 완료',
  CANCELLED: '취소',
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  ASSET_REQUEST: '표준 자산 요청',
  NON_STANDARD_REQUEST: '비표준 자산 요청',
  DIRECT_PURCHASE: '직접 구매 요청',
  RENTAL_REQUEST: '대여 요청',
  RENTAL_EXTENSION: '대여 연장',
  MAINTENANCE_REQUEST: '유지보수 요청',
  RETURN_REQUEST: '반납 요청',
  TERMINATION_REQUEST: '해지 요청',
  PURCHASE_REQUEST: '구매 요청',
  RETURN_PRODUCT_REQUEST: '반품 요청',
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: '시스템 관리자',
  ADMIN: '최고 관리자',
  DEPARTMENT_MANAGER: '부서책임자',
  ASSET_TEAM: '구매자산팀',
  EMPLOYEE: '사원',
}

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: '재직',
  RESIGNED: '퇴사',
  ON_LEAVE: '휴직',
}

// =====================================================
// 날짜 포맷 유틸
// =====================================================

export function formatDate(dateStr: string | null | undefined, format = 'YYYY-MM-DD'): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(yyyy))
    .replace('MM', mm)
    .replace('DD', dd)
    .replace('HH', hh)
    .replace('mm', min)
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// =====================================================
// 숫자 포맷 유틸
// =====================================================

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}
