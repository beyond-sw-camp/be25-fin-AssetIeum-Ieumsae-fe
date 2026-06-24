import type { AssetType, PageResponse } from './common'

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
  requesterId?: number | string | null
  requesterName?: string | null
  departmentId?: number | string | null
  departmentName?: string | null
  ticketRequesterId?: number | string | null
  ticketRequesterName?: string | null
  ticketDepartmentId?: number | string | null
  ticketDepartmentName?: string | null
  quantity: number
  isStandard: 0 | 1
  estimatedUnitPrice: number
  estimatedAmount: number
  externalUrl: string | null
}

export interface PurchasePlanCreateRequest {
  items: PurchasePlanCreateItem[]
}

export interface PurchasePlanCreateResponse {
  planId: number | string
  planNo: string
  estimatedAmount: number
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface PurchasePlanListItem {
  planId: number | string
  planNo: string
  estimatedAmount: number
  itemCount: number
  itemName: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  status?: PurchasePlanStatus
  purchaseRequestStatus?: PurchasePlanStatus
  requesterId?: number | string | null
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
  requesterId?: number | string
  keyword?: string
  page?: number
  size?: number
}

export interface PurchasePlanItem {
  itemId?: number | string
  purchasePlanItemId?: number | string
  purchasePlanItemDetailId?: number | string
  purchasePlanItemDetailID?: number | string
  purchase_plan_item_detail_id?: number | string
  purchasePlanItemDetail_id?: number | string
  purchasePlanItemID?: number | string
  purchase_plan_item_id?: number | string
  purchasePlanItem_id?: number | string
  purchaseItemId?: number | string
  purchase_item_id?: number | string
  planItemId?: number | string
  plan_item_id?: number | string
  purchaseRequestItemId?: number | string
  purchase_request_item_id?: number | string
  purchasePlanId?: number | string
  purchaseId?: number | string
  purchase_id?: number | string
  planPurchaseItemId?: number | string
  plan_purchase_item_id?: number | string
  purchasePlanItemNo?: number | string
  itemNo?: number | string
  id?: number | string
  assetItemId?: number | string | null
  tangibleItemId?: number | string | null
  intangibleItemId?: number | string | null
  tangibleAssetItemId?: number | string | null
  intangibleAssetItemId?: number | string | null
  category: string
  categoryId?: number | string | null
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
  ticketId?: number | string | null
  ticketRequesterId?: number | string | null
  ticketRequesterName?: string | null
  requesterId?: number | string | null
  requesterName?: string | null
  assignmentTargetMemberIds?: (number | string | null)[]
  assigneeIds?: (number | string | null)[]
  assignmentTargets?: {
    targetId?: number | string | null
    memberId?: number | string | null
    assigneeId?: number | string | null
    targetMemberId?: number | string | null
    name?: string | null
    memberName?: string | null
    assigneeName?: string | null
    departmentId?: number | string | null
    departmentName?: string | null
  }[]
  ticketDepartmentId?: number | string | null
  ticketDepartmentName?: string | null
  departmentId?: number | string | null
  departmentName?: string | null
  receivedAt?: string | null
  actualAmount?: number | null
  actualUnitPrice?: number | null
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
  usageType: 'TEMPORARY' | 'PERMANENT'
  assetUsageType: 'PERSONAL' | 'DEPARTMENT' | string
  serialNumbers: string[]
  memberIds: (string | null)[]
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
  licenseCodes: string[]
  memberIds: string[][]
  purchaseDate: string
  purchasePrice: number
  purchaseVendor: string
  licenseType: 'SUBSCRIPTION' | 'PERPETUAL' | 'TERM'
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
