import type { AssetType, TicketType, TicketStatus } from './common'

// =====================================================
// 티켓(Ticket) 공통 타입
// =====================================================

export interface TicketListItem extends Record<string, unknown> {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  assetItemName: string | null
  status: TicketStatus
  requesterId: number
  requesterName: string
  departmentId: number
  departmentName: string
  createdAt: string
}

export interface TicketDetail {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  status: TicketStatus
  requesterId: number
  requesterName: string
  departmentId: number
  departmentName: string
  approverId: number | null
  approverName: string | null
  assigneeId: number | null
  assigneeName: string | null
  requestReason: string | null
  departmentApprovedAt: string | null
  departmentRejectedAt: string | null
  departmentRejectionReason: string | null
  purchaseApprovedAt: string | null
  purchaseRejectedAt: string | null
  purchaseRejectionReason: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TicketListFilter {
  page?: number
  size?: number
  ticketType?: TicketType
  status?: TicketStatus
  requesterId?: number
  departmentId?: number
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

export interface TicketCreateResponse {
  ticketId: number
  ticketNo: string
  ticketType: TicketType
  status?: TicketStatus
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
  assetId: string
  requestedDueDate: string
  requestReason: string
}

export interface MaintenanceRequestCreate {
  assetId: string
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
  ticketId: number
  authorId: number
  authorName: string
  content: string
  createdAt: string
}
