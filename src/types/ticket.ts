import type { AssetType, Role, TicketType, TicketStatus } from './common'

// =====================================================
// 티켓(Ticket) 공통 타입
// =====================================================

export interface TicketListItem extends Record<string, unknown> {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  requestMethod: PurchaseRequestMethod | null
  requestedItemName: string | null
  requestedAt: string
  ticketStatus: TicketStatus
}

export interface TicketDetail {
  // TODO: API 명세/백엔드 확인 필요 - 상세 응답 표는 integer지만 목록과 path는 UUID string이다.
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  requestMethod?: PurchaseRequestMethod | null
  status: TicketStatus
  detailStatus?: string | null
  requesterId: string | number
  requesterName: string
  departmentId: string | number
  departmentName: string
  approverId: string | number | null
  approverName: string | null
  assigneeId: string | number | null
  assigneeName: string | null
  requestReason: string | null
  // TODO: API 명세/백엔드 확인 필요 - 티켓 상세 응답은 현재 공통 정보만 정의되어 있다.
  // 아래 필드는 생성/처리 API와 DB에 존재하지만 상세 응답 포함 여부가 확정되지 않았다.
  requestedUsageType?: RequestedUsageType | null
  assetType?: AssetType | null
  categoryName?: string | null
  requestedItemName?: string | null
  requestedItemDetail?: string | null
  productName?: string | null
  quantity?: number | null
  expectedPrice?: number | null
  actualAmount?: number | null
  assetId?: string | number | null
  assetStatus?: string | null
  startedAt?: string | null
  rentalStartDate?: string | null
  requestedDueDate?: string | null
  rentalDueDate?: string | null
  previousDueDate?: string | null
  changedDueDate?: string | null
  maintenanceReason?: string | null
  maintenanceResult?: string | null
  maintenanceCompletedAt?: string | null
  maintenanceCost?: number | null
  returnReason?: string | null
  returnResult?: string | null
  refundAmount?: number | null
  collectedAt?: string | null
  processedAt?: string | null
  departmentApprovedAt: string | null
  departmentRejectedAt: string | null
  departmentRejectionReason: string | null
  purchaseApprovedAt: string | null
  purchaseRejectedAt: string | null
  purchaseRejectionReason: string | null
  // TODO: API 명세/백엔드 확인 필요 - DB의 purchase_request_items.received_at을 포함한
  // 구매 처리 일시 필드가 티켓 상세 응답에는 아직 정의되지 않았다.
  orderedAt?: string | null
  receivedAt?: string | null
  registeredAt?: string | null
  completedAt: string | null
  cancelledAt: string | null
  requestedAt: string
  updatedAt: string
}

export interface TicketListFilter {
  page?: number
  size?: number
  ticketType?: TicketType
  ticketStatus?: TicketStatus
  keyword?: string
  requesterId?: string
  departmentId?: string
}

// =====================================================
// 티켓 생성 요청 타입들
// =====================================================

export type TicketRequestKind =
  | 'STANDARD_ASSET_REQUEST'
  | 'NON_STANDARD_ASSET_REQUEST'
  | 'DIRECT_PURCHASE'
  | 'RENTAL'
  | 'RENTAL_EXTENSION'
  | 'MAINTENANCE'
  | 'RETURN'
  | 'PURCHASE_RETURN'

export type RequestedUsageType = 'PERSONAL' | 'TEAM'
export type PurchaseRequestMethod = 'TEAM_PURCHASE' | 'DIRECT_PURCHASE'

export interface TicketCreateResponse {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  ticketStatus?: TicketStatus
  createdAt?: string
}

export interface StandardAssetRequestCreate {
  requestedUsageType: RequestedUsageType
  assetType: AssetType
  assetItemId: string
  quantity: number
  requestReason: string
}

export interface NonStandardAssetRequestCreate {
  requestedUsageType: RequestedUsageType
  assetType: AssetType
  categoryId: string
  requestedItemDetail: string
  manufacturer: string
  licenseType: string | null
  purchaseUrl: string
  quantity: number
  expectedPrice: number
  requestReason: string
}

export interface DirectPurchaseRequestCreate {
  requestedUsageType: RequestedUsageType
  assetType: AssetType
  categoryId: string
  requestedItemDetail: string
  manufacturer: string
  licenseType: string | null
  quantity: number
  expectedPrice: number
  requestReason: string
}

// TODO: API 명세 Params 표의 assetItemId/rentalDueDate는 Body 예시와 불일치하므로 백엔드 확인 필요
export interface RentalRequestCreate {
  requestedUsageType: RequestedUsageType
  tangibleAssetItemId: string
  rentalStartDate: string
  requestedDueDate: string
  requestReason: string
}

export interface RentalExtensionRequestCreate {
  assetId: number
  requestedDueDate: string
  requestReason: string
}

export interface MaintenanceRequestCreate {
  assetId: number
  maintenanceReason: string
}

export interface ReturnRequestCreate {
  assetType: AssetType
  assetId: number
  returnReason: string
}

export interface PurchaseReturnRequestCreate {
  assetType: AssetType
  assetId: number
  type: 'EMPLOYEE' | 'PURCHASE_TEAM'
  returnReason: string
}

// =====================================================
// 티켓 처리 요청 타입들
// =====================================================

export interface TicketApproveRequest {
  approver: 'DEPARTMENT_MANAGER' | 'ASSET_TEAM'
  approverMemberId: number
}

export interface TicketRejectRequest {
  rejectionType: 'DEPARTMENT_MANAGER' | 'ASSET_TEAM'
  rejecterMemberId: number
  rejectionReason: string
}

export interface AssetAssignRequest {
  assetType: AssetType
  assetId: number
  memberId: number
  returnDueDate?: string
}

// =====================================================
// 댓글(Comment) 타입
// =====================================================

export interface TicketComment {
  commentId: number
  ticketId: string
  // TODO: API 명세/백엔드 확인 필요 - 응답 예시는 writerId, 스키마 표는 writerMemberNo를 사용한다.
  writerId: string
  writerName: string
  writerRole: Role
  content: string
  createdAt: string
  updatedAt: string
}

export interface TicketCommentDeleteResponse {
  commentId: number
  deletedAt: string
}
