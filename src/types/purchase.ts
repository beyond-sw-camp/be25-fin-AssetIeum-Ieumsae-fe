// TODO: 데이터 타입 확인 필요
import type { AssetType, PageResponse } from './common'
import type { FileMetadata } from './file'

export type PurchasePlanStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type PurchasePolicyMode = 'ONLY_ASSET_TEAM' | 'ONLY_DIRECT_PURCHASE' | 'PARALLEL'

export interface PurchasePlanCreateItem {
  ticketId: string | null
  productName: string
  assetType: AssetType
  assetItemId?: string | null
  tangibleAssetItemId?: string | null
  intangibleAssetItemId?: string | null
  categoryName?: string
  requesterId?: string | null
  requesterName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  ticketRequesterId?: string | null
  ticketRequesterName?: string | null
  ticketDepartmentId?: string | null
  ticketDepartmentName?: string | null
  quantity: number
  isStandard: boolean
  estimatedUnitPrice: number
  estimatedAmount: number
  externalUrl: string | null
}

export interface PurchasePlanCreateRequest {
  items: PurchasePlanCreateItem[]
}

export interface PurchasePlanCreateResponse {
  planId: string
  planNo: string
  estimatedAmount: number
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface PurchasePlanListItem {
  planId: string
  planNo: string
  estimatedAmount: number
  itemCount: number
  itemName: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  status?: PurchasePlanStatus
  purchaseRequestStatus?: PurchasePlanStatus
  requesterId?: string | null
  requesterName?: string | null
  itemSummary?: string | null
}

export type PurchasePlanSearchResponse = PurchasePlanListItem

export interface PurchasePlanStatistics {
  totalCount: number
  approvalWaitingCount: number
  orderedCount: number
  completedCount: number
}

export interface PurchasePlanListFilter {
  status?: PurchasePlanStatus
  requesterId?: string
  keyword?: string
  page?: number
  size?: number
}

export interface PurchasePlanItem {
  itemId?: string
  purchasePlanItemId?: string
  purchasePlanItemDetailId?: string
  purchaseItemId?: string
  planItemId?: string
  purchaseRequestItemId?: string
  purchasePlanId?: string
  purchaseId?: string
  planPurchaseItemId?: string
  purchasePlanItemNo?: string
  itemNo?: string
  id?: string
  purchasePlanItemStatus?: string | null
  itemStatus?: string | null
  status?: string | null
  assetItemId?: string | null
  tangibleItemId?: string | null
  intangibleItemId?: string | null
  tangibleAssetItemId?: string | null
  intangibleAssetItemId?: string | null
  category: string
  categoryId?: string | null
  categoryName?: string | null
  itemName: string
  productName?: string | null
  name?: string | null
  quantity: number
  estimatedUnitPrice: number
  totalAmount: number
  registeredCount?: number | null
  registeredAssetCount?: number | null
  assetRegisteredCount?: number | null
  registeredQuantity?: number | null
  registeredAssetQuantity?: number | null
  assetType?: AssetType | null
  isStandard?: boolean
  ticketId?: string | null
  ticket?: {
    ticketRequesterId?: string | null
    ticketRequesterName?: string | null
    ticketDepartmentId?: string | null
    ticketDepartmentName?: string | null
    ticketTargetMemberIds?: (string | null)[]
  } | null
  ticketRequesterId?: string | null
  ticketRequesterName?: string | null
  requesterId?: string | null
  requesterName?: string | null
  assignmentTargetMemberIds?: (string | null)[]
  assigneeIds?: (string | null)[]
  assignmentTargets?: {
    targetId?: string | null
    memberId?: string | null
    assigneeId?: string | null
    targetMemberId?: string | null
    name?: string | null
    memberName?: string | null
    assigneeName?: string | null
    departmentId?: string | null
    departmentName?: string | null
  }[]
  ticketDepartmentId?: string | null
  requestDepartmentId?: string | null
  ticketDepartmentName?: string | null
  requestDepartmentName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  receivedAt?: string | null
  actualAmount?: number | null
  actualUnitPrice?: number | null
  evidenceFiles?: FileMetadata[]
}

export type PurchasePlanItemDetailResponse = PurchasePlanItem

export interface PurchasePlanDetail {
  planId: number | string
  planNo: string
  purchaseRequestStatus: PurchasePlanStatus
  status?: PurchasePlanStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  estimatedAmount: number
  actualAmount: number | null
  receivedAt?: string | null
  deliveredAt?: string | null
  requesterId?: number | string | null
  requesterName?: string | null
  items: PurchasePlanItem[]
}

export interface PurchasePlanStatusChangeRequest {
  status: PurchasePlanStatus
}

export interface PurchasePlanPurchaseResultRequest {
  actualAmount: number
}

export interface PurchasePlanItemRegisterRequest {
  categoryId: string
  manufacturer?: string
  modelName?: string
  provider?: string
  licenseType?: 'SUBSCRIPTION' | 'PERPETUAL' | 'TERM'
  isStandard: boolean
}

/** 구매 계획 자산 등록 요청 - 유형자산 */
export interface PurchasePlanTangibleAssetRegisterRequest {
  usageType?: 'TEMPORARY' | 'PERMANENT'
  assetUsageType?: 'PERSONAL' | 'DEPARTMENT' | string
  serialNumbers: string[]
  memberIds?: (string | null)[]
  location: string
  purchaseDate: string
  purchasePrice: number
  purchaseVendor: string
  warrantyExpiredAt: string
  departmentId?: string | null
  usedStartedAt?: string | null
  returnDueDate?: string | null
}

/** 구매 계획 자산 등록 요청 - 무형자산 */
export interface PurchasePlanIntangibleAssetRegisterRequest {
  licenseCodes?: string[]
  memberIds?: string[][]
  purchaseDate: string
  purchasePrice: number
  purchaseVendor: string
  seatCount: number
  isAutoRenewal: boolean
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | null
  startedAt?: string | null
  expiredAt?: string | null
  departmentId?: string | null
}

/** @deprecated 대신 PurchasePlanTangibleAssetRegisterRequest / PurchasePlanIntangibleAssetRegisterRequest 사용 */
export type PurchasePlanAssetRegisterRequest =
  | PurchasePlanTangibleAssetRegisterRequest
  | PurchasePlanIntangibleAssetRegisterRequest

export interface PurchasePolicyUpdateRequest {
  purchaseMethod: PurchasePolicyMode
  overPercentageLimit: number
}

export interface PurchasePolicy {
  policyId: string
  purchaseMethod: PurchasePolicyMode
  overPercentageLimit: number
}

export type PurchasePolicyUpdateResponse = PurchasePolicy

export type PurchasePlanPage = PageResponse<PurchasePlanListItem>
