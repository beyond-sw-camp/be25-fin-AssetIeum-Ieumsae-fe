import type {
  TangibleAssetStatus,
  IntangibleAssetStatus,
  TicketStatus,
  TicketType,
  Role,
  MemberStatus,
  PurchaseRequestMethod,
} from '@/types'

// =====================================================
// 상태 코드 → 한국어 레이블 변환
// =====================================================

export const TANGIBLE_STATUS_LABEL: Record<TangibleAssetStatus | string, string> = {
  AVAILABLE: '사용가능',
  IN_USE: '사용중',
  REPAIR_REQUESTED: '수리요청',
  REPAIRING: '수리중',
  RETURN_REQUESTED: '반납요청',
  DISPOSED: '폐기완료',
  LOST: '분실',
  CANCELLED: '취소',
}

export const INTANGIBLE_STATUS_LABEL: Record<IntangibleAssetStatus | string, string> = {
  AVAILABLE: '사용가능',
  IN_USE: '사용중',
  EXPIRING_SOON: '만료예정',
  EXPIRED: '만료',
  TERMINATION_REQUESTED: '해지요청',
  TERMINATED: '해지',
  CANCELLED: '해지완료',
}

export function getIntangibleStatusLabel(status: string | null | undefined, fallback = '알 수 없음') {
  if (!status) return fallback
  return INTANGIBLE_STATUS_LABEL[status.trim().toUpperCase()] ?? fallback
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  REQUESTED: '요청됨',
  DEPARTMENT_APPROVED: '자산팀 검토 대기',
  DEPARTMENT_REJECTED: '부서 반려',
  ASSET_APPROVED: '자산팀 승인',
  ASSET_REJECTED: '자산팀 반려',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
  CANCELLED: '요청 취소',
}

export const TICKET_STATUS_ALIASES: Record<string, TicketStatus> = {
  ASSET_APPROVE: 'ASSET_APPROVED',
  CANCELLED: 'CANCELLED',
}

export function normalizeTicketStatus(status: string): TicketStatus {
  return TICKET_STATUS_ALIASES[status] ?? status as TicketStatus
}

export function getTicketStatusLabel(status: string): string {
  const normalizedStatus = normalizeTicketStatus(status)
  return TICKET_STATUS_LABEL[normalizedStatus] ?? status
}

export const TICKET_DETAIL_STATUS_LABEL: Record<string, string> = {
  REQUESTED: '요청 접수',
  DEPARTMENT_APPROVED: '부서 승인 완료',
  DEPARTMENT_REJECTED: '부서 반려',
  ASSET_APPROVED: '구매자산팀 승인 완료',
  ASSET_REJECTED: '구매자산팀 반려',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
  CANCELLED: '요청 취소',
  RESERVED: '자산 예약 완료',
  ASSIGNED: '자산 배정 완료',
  EXTENSION_REQUESTED: '대여 연장 요청',
  RETURN_DUE_DATE_UPDATED: '반납 예정일 변경 완료',
  COLLECTED: '자산 회수 완료',
  RETURN_COLLECTED: '자산 회수 완료',
  RETURNED: '반납 완료',
  RETURNED_TO_VENDOR: '공급처 반품 완료',
  REFUNDED: '환불 완료',
  REPAIRING: '수리 중',
  REPAIR_COMPLETED: '수리 완료',
  PURCHASE_PLANNED: '구매 계획 연결',
  ORDERED: '주문 완료',
  RECEIVED: '입고 완료',
  REGISTERED: '자산 등록 완료',
  PROOF_PENDING: '구매 증빙 대기',
  PROOF_SUBMITTED: '구매 증빙 제출',
  CONFIRMED: '확인 완료',
}

export function getTicketDetailStatusLabel(status: string | null | undefined): string {
  if (!status) return '-'
  const normalizedStatus = status.trim().toUpperCase()
  return TICKET_DETAIL_STATUS_LABEL[normalizedStatus]
    ?? TICKET_STATUS_LABEL[normalizeTicketStatus(normalizedStatus)]
    ?? status
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  ASSET_REQUEST: '자산 요청',
  RENTAL: '대여 요청',
  RENTAL_EXTENSION: '대여 연장',
  MAINTENANCE_REQUEST: '유지보수 요청',
  ASSET_RETURN: '반납·해지 요청',
  PURCHASE_REQUEST: '구매 요청',
  PURCHASE_RETURN: '반품 요청',
}

export function getTicketTypeLabel(
  ticketType: TicketType,
  requestMethod?: PurchaseRequestMethod | null,
): string {
  if (ticketType === 'PURCHASE_REQUEST' && requestMethod === 'DIRECT_PURCHASE') {
    return '직접 구매 요청'
  }

  return TICKET_TYPE_LABEL[ticketType]
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: '시스템 관리자',
  ADMIN: '최고 관리자',
  DEPARTMENT_MANAGER: '부서책임자',
  ASSET_TEAM: '구매자산팀',
  ASSET_MANAGER: '구매자산팀장',
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
