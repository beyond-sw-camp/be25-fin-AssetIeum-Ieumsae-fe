// =====================================================
// 공통 API 응답 타입
// =====================================================

export interface ApiResponse<T = null> {
  status: number
  errorCode: string | null
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// =====================================================
// 권한(Role) 타입
// =====================================================

export type Role =
  | 'SUPER_ADMIN'      // 플랫폼 시스템 관리자
  | 'ADMIN'            // 회사 최고 관리자
  | 'DEPARTMENT_MANAGER' // 부서책임자
  | 'ASSET_TEAM'       // 구매자산팀
  | 'EMPLOYEE'         // 사원

// =====================================================
// 자산 공통 상태
// =====================================================

export type AssetType = 'TANGIBLE' | 'INTANGIBLE'

export type TangibleAssetStatus =
  | 'AVAILABLE'        // 사용가능
  | 'IN_USE'           // 사용중
  | 'REPAIR_REQUESTED' // 수리요청
  | 'REPAIRING'        // 수리중
  | 'RETURN_REQUESTED' // 반납요청
  | 'DISPOSED'         // 폐기완료

export type IntangibleAssetStatus =
  | 'AVAILABLE'            // 사용가능
  | 'IN_USE'               // 사용중
  | 'EXPIRING_SOON'        // 만료예정
  | 'EXPIRED'              // 만료
  | 'TERMINATION_REQUESTED'// 해지요청
  | 'TERMINATED'           // 해지

// =====================================================
// 티켓 타입 / 상태
// =====================================================

export type TicketType =
  | 'ASSET_REQUEST'          // 표준 자산 요청
  | 'NON_STANDARD_REQUEST'   // 비표준 자산 요청
  | 'DIRECT_PURCHASE'        // 직접 구매 요청
  | 'RENTAL_REQUEST'         // 대여 요청
  | 'RENTAL_EXTENSION'       // 대여 연장
  | 'MAINTENANCE_REQUEST'    // 유지보수 요청
  | 'RETURN_REQUEST'         // 반납 요청
  | 'TERMINATION_REQUEST'    // 해지 요청
  | 'PURCHASE_REQUEST'       // 구매 요청 (구매자산팀)
  | 'RETURN_PRODUCT_REQUEST'  // 반품 요청

export type TicketStatus =
  | 'REQUESTED'              // 접수 대기
  | 'DEPARTMENT_APPROVED'    // 부서 승인
  | 'DEPARTMENT_REJECTED'    // 부서 반려
  | 'ASSET_TEAM_REVIEWING'   // 검토 중
  | 'ASSET_TEAM_REJECTED'    // 구매자산팀 반려
  | 'PROCESSING'             // 처리 중
  | 'COMPLETED'              // 처리 완료
  | 'CANCELLED'              // 취소

// =====================================================
// 사원 상태
// =====================================================

export type MemberStatus = 'ACTIVE' | 'RESIGNED' | 'ON_LEAVE'
