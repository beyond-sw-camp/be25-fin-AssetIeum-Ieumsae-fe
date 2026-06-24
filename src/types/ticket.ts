import type { AssetType, PageResponse, Role, TicketType, TicketStatus } from './common'

// =====================================================
// 티켓(Ticket) 공통 타입
// =====================================================

export interface TicketListItem extends Record<string, unknown> {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  requestMethod: PurchaseRequestMethod | null
  requestedItemName: string | null
  requesterId?: string | number
  requesterName?: string
  departmentId?: string | number
  departmentName?: string
  requestedAt: string
  ticketStatus: TicketStatus
  status?: TicketStatus
  detailStatus?: string | null
  assetType?: AssetType | null
  assetItemId?: string | number | null
  isStandard?: number | boolean | null
  categoryName?: string | null
  requestedItemDetail?: string | null
  productName?: string | null
  manufacturer?: string | null
  modelName?: string | null
  quantity?: number | null
  expectedPrice?: number | null
  purchasePrice?: number | null
  unitPrice?: number | null
  availableCount?: number | null
  availableAssetCount?: number | null
}

export interface TicketDetail {
  // TODO: API 명세/백엔드 확인 필요 - 상세 응답 표는 integer지만 목록과 path는 UUID string이다.
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  requestMethod?: PurchaseRequestMethod | null
  status: TicketStatus
  detailStatus?: string | null
  // TODO: API 명세/백엔드 확인 필요 - 구매 계획 기능 확정 후 실제 응답 필드명에 맞춰 정리
  linkedPurchaseId?: string | null
  linkedPurchaseNo?: string | null
  linkedPurchasePlanId?: string | null
  purchasePlanId?: string | null
  linkedPurchasePlanNo?: string | null
  purchasePlanNo?: string | null
  purchaseId?: string | null
  requesterId: string | number
  requesterName: string
  departmentId: string | number
  departmentName: string
  approverId: string | number | null
  approverName: string | null
  assigneeId: string | number | null
  assigneeName: string | null
  actions?: TicketActions | null
  histories?: TicketHistory[] | null
  requestReason: string | null
  // TODO: API 명세/백엔드 확인 필요 - 티켓 상세 응답은 현재 공통 정보만 정의되어 있다.
  // 아래 필드는 생성/처리 API와 DB에 존재하지만 상세 응답 포함 여부가 확정되지 않았다.
  requestedUsageType?: RequestedUsageType | null
  assetType?: AssetType | null
  assetItemId?: string | null
  isStandard?: number | boolean | null
  categoryName?: string | null
  requestedItemName?: string | null
  requestedItemDetail?: string | null
  productName?: string | null
  manufacturer?: string | null
  modelName?: string | null
  quantity?: number | null
  expectedPrice?: number | null
  actualAmount?: number | null
  assetId?: string | null
  assignmentId?: string | null
  assetStatus?: string | null
  startedAt?: string | null
  rentalStartDate?: string | null
  requestedDueDate?: string | null
  rentalDueDate?: string | null
  previousDueDate?: string | null
  changedDueDate?: string | null
  currentReturnDueDate?: string | null
  maintenanceReason?: string | null
  maintenanceResult?: string | null
  maintenanceCompletedAt?: string | null
  maintenanceCost?: number | null
  // TODO: API 명세/백엔드 확인 필요 - 직접 구매 증빙 상세 응답 필드명 확정 후 정리
  purchaseVendor?: string | null
  purchaseDate?: string | null
  serialNumber?: string | null
  location?: string | null
  warrantyEndDate?: string | null
  warrantyExpiredAt?: string | null
  licenseCode?: string | null
  seatCount?: number | null
  isAutoRenewal?: boolean | null
  paymentCycle?: string | null
  billingCycle?: string | null
  expirationDate?: string | null
  directPurchaseEvidenceFileName?: string | null
  directPurchaseEvidenceUploadedAt?: string | null
  directPurchaseEvidenceUrl?: string | null
  directPurchaseConfirmationStatus?: string | null
  returnReason?: string | null
  returnResult?: string | null
  returnProcessedAt?: string | null
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
  assignedAt?: string | null
  completedAt: string | null
  canceledAt: string | null
  requestedAt: string
  updatedAt: string
}

export interface TicketActions {
  canApproveDepartment?: boolean
  canRejectDepartment?: boolean
  canAssignAsset?: boolean
  canApproveAsset?: boolean
  canRejectAsset?: boolean
  canChangeProcessingStatus?: boolean
  canUpdateReturnDueDate?: boolean
  canCollectAsset?: boolean
  canCompleteReturn?: boolean
}

export interface TicketHistory {
  status: TicketStatus
  processedAt: string
  rejectionReason?: string | null
  reason?: string | null
  comment?: string | null
  memo?: string | null
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

export interface PurchasePlanCandidateTicket {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  assetType: AssetType
  requesterId: string
  requesterName: string
  itemName: string
  categoryName: string
  quantity: number
  estimatedUnitPrice: number
  assetItemId?: string | number | null
  tangibleAssetItemId?: string | number | null
  intangibleAssetItemId?: string | number | null
  isStandard?: number | boolean | null
  requestedItemName?: string | null
  requestedItemDetail?: string | null
  productName?: string | null
  expectedPrice?: number | null
  purchasePrice?: number | null
  unitPrice?: number | null
}

export interface TicketStatistics {
  totalCount: number
  newOrPendingReviewCount: number
  inProgressCount: number
  completedCount: number
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

export type RequestedUsageType = 'PERSONAL' | 'DEPARTMENT'
export type PurchaseRequestMethod = 'TEAM_PURCHASE' | 'DIRECT_PURCHASE'

export interface TicketCreateResponse {
  ticketId: string
  ticketNo: string
  ticketType: TicketType
  ticketStatus?: TicketStatus
  createdAt?: string
}

export interface StandardAssetRequestCreate {
  requestedUsageType?: RequestedUsageType
  assetType: AssetType
  assetItemId: string
  assignmentTargetMemberIds: string[]
  quantity: number
  requestReason: string
}

export interface NonStandardAssetRequestCreate {
  requestedUsageType?: RequestedUsageType
  assetType: AssetType
  categoryId: string
  assignmentTargetMemberIds: (string | null)[]
  requestedItemDetail: string
  manufacturer: string
  licenseType: string | null
  purchaseUrl: string
  quantity: number
  seatCount: number | null
  expectedPrice: number
  requestReason: string
}

export interface DirectPurchaseRequestCreate {
  requestedUsageType?: RequestedUsageType
  assetType: AssetType
  isStandard: boolean
  assetItemId: string | null
  assignmentTargetMemberIds: (string | null)[]
  categoryId: string | null
  requestedItemDetail: string | null
  manufacturer: string | null
  licenseType: string | null
  quantity: number
  seatCount: number | null
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

export interface RentalAvailableItem {
  tangibleAssetItemId?: string
  assetItemId?: string
  itemId?: string
  categoryId?: string
  categoryName?: string
  productName?: string
  name?: string
  manufacturer?: string
  modelName?: string
  isStandard?: boolean | number
  availableAssetCount?: number
}

export interface ActiveRentalAsset {
  assignmentId?: string
  assetId?: string
  assetCode?: string
  tangibleAssetItemId?: string
  categoryId?: string
  categoryName?: string
  productName?: string
  manufacturer?: string
  modelName?: string
  serialNumber?: string
  assignedAt?: string
  currentReturnDueDate?: string
}

export interface MaintenanceAvailableAsset {
  assetType?: AssetType
  assignmentId?: string
  assetId?: string
  assetCode?: string
  itemId?: string
  tangibleAssetItemId?: string
  intangibleAssetItemId?: string
  categoryId?: string
  categoryName?: string
  productName?: string
  manufacturer?: string
  modelName?: string
  provider?: string | null
  serialNumber?: string
  licenseCode?: string | null
  assignedAt?: string
  returnDueDate?: string | null
  expiredAt?: string | null
}

export interface RentalExtensionRequestCreate {
  assignmentId: string
  requestedDueDate: string
  requestReason: string
}

export interface MaintenanceRequestCreate {
  assignmentId: string
  requestDetail: string
}

export interface ReturnRequestCreate {
  assetType: AssetType
  assignmentId: string
  requestReason: string
}

export interface PurchaseReturnRequestCreate {
  assetType: AssetType
  assignmentId: string
  requestReason: string
}

// =====================================================
// 티켓 처리 요청 타입들
// =====================================================

export interface TicketApproveRequest {
  approver: 'DEPARTMENT_MANAGER' | 'ASSET_TEAM'
  approverMemberId: string
}

export interface TicketRejectRequest {
  rejectionType: 'DEPARTMENT_MANAGER' | 'ASSET_TEAM'
  rejecterMemberId: string
  rejectionReason: string
}

export interface AssetAssignRequest {
  assetType: AssetType
  assetId: string
  memberId: string
  returnDueDate?: string
}

export interface AssetRequestAssignRequest {
  assetType: AssetType
  itemId: string
}

export interface AssetRequestAssignableItem {
  assetType?: AssetType
  itemId?: string | number
  assetItemId?: string | number
  tangibleAssetItemId?: string | number
  intangibleAssetItemId?: string | number
  categoryId?: string | number
  categoryName?: string | null
  productName?: string | null
  name?: string | null
  itemIdentifier?: string | number | null
  itemNo?: string | null
  itemCode?: string | null
  manufacturerOrProvider?: string | null
  modelName?: string | null
  licenseType?: string | null
  isStandard?: boolean | number | null
  requestedItem?: boolean
  availableCount?: number | string | null
  availableSeatCount?: number | string | null
  remainingSeatCount?: number | string | null
  remainingSeats?: number | string | null
  availableSeats?: number | string | null
  assignableSeatCount?: number | string | null
  remainingAssignableCount?: number | string | null
  remainingAssignableSeatCount?: number | string | null
  availableUserCount?: number | string | null
  remainingUserCount?: number | string | null
  availableMemberCount?: number | string | null
  remainingMemberCount?: number | string | null
  availableAssignmentCount?: number | string | null
  remainingAssignmentCount?: number | string | null
  availableAssetCount?: number | string | null
  assetCount?: number | string | null
  stockCount?: number | string | null
}

export interface AssetRequestAssignableItemsResponse {
  requestedItem?: AssetRequestAssignableItem | null
  items: PageResponse<AssetRequestAssignableItem>
}

export interface RentalAssignableAsset {
  assetId: string
  assetCode: string
  serialNumber?: string | null
  status: string
  location?: string | null
  reservedAsset?: boolean
}

export interface RentalAssignableAssetsResponse {
  requestedItem: {
    itemId: string
    name: string
    manufacturer?: string | null
  }
  reservedAsset?: RentalAssignableAsset | null
  assets: PageResponse<RentalAssignableAsset>
}

export interface RentalAssignRequest {
  assetId: string
}

export interface RentalAssignResponse {
  ticketId: string
  ticketNo: string
  ticketStatus: TicketStatus
  rentalStatus: string
  requesterId: string
  requesterName: string
  assetId: string
  assetCode: string
  serialNumber?: string | null
  itemId: string
  itemName: string
  rentalStartDate: string
  requestedDueDate: string
}

export interface MaintenanceCollectResponse {
  ticketId: string
  tangibleAssetId: string | number
  assetStatus: string
  collectedAt: string
}

export interface AssetCollectResponse {
  ticketId: string | number
  assetType: AssetType
  assetId: string | number
  status?: string
  ticketStatus?: string
  assetStatus: string
  collectedAt: string
}

export interface ReturnCompleteResponse {
  ticketId: string | number
  ticketNo?: string
  ticketStatus: TicketStatus | string
  detailStatus?: string
  assetReturnStatus?: string
  refundAmount?: number
  returnProcessedAt?: string
  completedAt: string
}

export interface MaintenanceCompleteRequest {
  maintenanceResult: string
  maintenanceCompletedAt: string
  maintenanceCost: number
}

export interface MaintenanceCompleteResponse {
  maintenanceTicketId?: string | number
  maintenance_ticket_id?: string | number
  ticketId?: string | number
  status: string
  tangibleAssetId?: string | number
  tangible_asset_id?: string | number
  maintenanceResult?: string
  maintenance_result?: string
  maintenanceCompletedAt?: string
  maintenance_completed_at?: string
  maintenanceCost?: number
  maintenance_cost?: number
}

export interface TicketAssignMeResponse {
  ticketId: string
  ticketNo: string
  ticketStatus: TicketStatus
  assigneeId: string
  assigneeName: string
}

export interface RentalExtensionProcessRequest {
  changedDueDate?: string
  returnDueDate?: string
}

export interface RentalExtensionProcessResponse {
  ticketId: string
  ticketNo?: string
  assetId: string | null
  assetCode?: string
  serialNumber?: string | null
  changedDueDate?: string
  previousReturnDueDate?: string
  returnDueDate?: string
  ticketStatus: TicketStatus
  rentalStatus?: string
  processedAt: string
  completedAt: string
}

export interface TicketActualAmountResponse {
  ticketId: string
  ticketNo?: string
  ticketType?: TicketType
  ticketStatus?: TicketStatus
  assetType?: AssetType
  expectedPrice: number
  actualPrice: number
  actualAmount?: number
  priceDifference: number
  requiresReapproval: boolean
  purchaseDate?: string | null
  purchaseVendor?: string | null
  serialNumbers?: string[] | null
  serialNumber?: string | null
  location?: string | null
  warrantyExpiredAt?: string | null
  licenseCodes?: string[] | null
  licenseCode?: string | null
  seatCount?: number | null
  isAutoRenewal?: boolean | null
  startedAt?: string | null
  expiredAt?: string | null
  billingCycle?: string | null
  expectedTotalPrice?: number | null
  proofFileUrl?: string | null
  proofFileUploadedAt?: string | null
  confirmationStatus?: string | null
  updatedAt: string
}

export interface DirectPurchasePaymentRequest {
  actualPrice: number
  purchaseDate?: string | null
  purchaseVendor?: string | null
  serialNumbers?: string[] | null
  serialNumber?: string | null
  location?: string | null
  warrantyExpiredAt?: string | null
  licenseCodes?: string[] | null
  licenseCode?: string | null
  seatCount?: number | null
  isAutoRenewal?: boolean | null
  startedAt?: string | null
  expiredAt?: string | null
  billingCycle?: string | null
}

export interface TicketEvidenceUploadResponse {
  ticketId: string
  directPurchaseEvidenceFileName?: string | null
  purchaseDate: string
  updatedAt: string
}

export interface DirectPurchaseAssetAssignRequest {
  itemId?: string
  assetItemId?: string
  productName: string
  manufacturer: string
  modelName: string
}

export interface DirectPurchaseAssetAssignResponse {
  ticketId: string
  ticketNo: string
  ticketStatus: TicketStatus
  purchaseRequestStatus?: string
  requesterId?: string
  requesterName?: string
  assetType?: AssetType
  itemId?: string
  itemName?: string
  assetIds?: string[]
  assetCodes?: string[]
  assignmentIds?: string[]
  assetId?: string
  assetCode?: string
  assignmentId?: string
  actualPrice?: number
  confirmationStatus?: string
}

// =====================================================
// 댓글(Comment) 타입
// =====================================================

export interface TicketComment {
  commentId: number
  ticketId: string
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
