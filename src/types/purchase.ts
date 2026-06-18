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
  itemName: string
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
  requestedCount: number
  approvedCount: number
  rejectedCount: number
  orderedCount: number
  deliveredCount: number
  completedCount: number
  cancelledCount: number
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
  category: string
  itemName: string
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
