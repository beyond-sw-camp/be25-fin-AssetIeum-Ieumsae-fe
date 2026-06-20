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
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  status?: PurchasePlanStatus
  purchaseRequestStatus?: PurchasePlanStatus
  requesterId?: number | string | null
  requesterName?: string | null
  itemSummary?: string | null
}

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
  purchaseItemId?: number | string
  planItemId?: number | string
  purchaseRequestItemId?: number | string
  id?: number | string
  assetItemId?: number | string | null
  tangibleItemId?: number | string | null
  intangibleItemId?: number | string | null
  category: string
  itemName: string
  productName?: string | null
  name?: string | null
  quantity: number
  estimatedUnitPrice: number
  totalAmount: number
  assetType?: AssetType
  isStandard?: boolean
  ticketId?: number | string | null
  receivedAt?: string | null
}

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
  requesterId?: number | string | null
  requesterName?: string | null
  items: PurchasePlanItem[]
}

export interface PurchasePlanStatusChangeRequest {
  status: PurchasePlanStatus
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
  purchaseMode: PurchasePolicyMode
  allowDirectPurchase: boolean
  allowParallelOperation: boolean
  overPercentageLimit: number
}

export interface PurchasePolicyUpdateResponse {
  policyId: string
  purchaseMethod: PurchasePolicyMode
  overPercentageLimit: number
}

export type PurchasePlanPage = PageResponse<PurchasePlanListItem>
