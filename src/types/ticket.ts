import type { AssetType, TicketType, TicketStatus } from './common'

// =====================================================
// 티켓(Ticket) 공통 타입
// =====================================================

export interface TicketListItem {
  ticketId: number
  ticketNo: string
  ticketType: TicketType
  status: TicketStatus
  requesterId: number
  requesterName: string
  departmentId: string
  departmentName: string
  createdAt: string
}

export interface TicketDetail {
  ticketId: number
  ticketNo: string
  ticketType: TicketType
  status: TicketStatus
  requesterId: number
  requesterName: string
  departmentId: string
  departmentName: string
  approverId: number | null
  approverName: string | null
  assigneeId: number | null
  assigneeName: string | null
  requestReason: string | null
  expectedPrice: number | null
  actualPrice: number | null
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
  // 자산 정보
  assetType?: AssetType
  assetItemId?: number
  assetItemName?: string
  assetId?: number
}

export interface TicketListFilter {
  page?: number
  size?: number
  ticketType?: TicketType
  status?: TicketStatus
  requesterId?: number
  departmentId?: string
}

// =====================================================
// 티켓 생성 요청 타입들
// =====================================================

export interface StandardAssetRequestCreate {
  assetType: AssetType
  assetItemId: number
  quantity: number
  expectedPrice: number
  requestReason: string
}

export interface NonStandardAssetRequestCreate {
  assetType: AssetType
  productName: string
  vendor?: string
  purchaseLink?: string
  modelName?: string
  expectedPrice: number
  requestReason: string
}

export interface RentalRequestCreate {
  assetType: AssetType
  assetItemId: number
  returnDueDate: string
  requestReason: string
}

export interface MaintenanceRequestCreate {
  assetId: number
  assetType: AssetType
  requestReason: string
}

export interface ReturnRequestCreate {
  assetId: number
  assetType: AssetType
  requestReason?: string
}

export interface TerminationRequestCreate {
  assetId: number
  requestReason?: string
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
