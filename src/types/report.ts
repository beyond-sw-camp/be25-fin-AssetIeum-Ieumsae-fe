import type { PageResponse } from './common'

export interface OperationReportFilter {
  startDate?: string
  endDate?: string
}

export interface UnreturnedAssetsReportFilter {
  topDelayedUserLimit?: number
}

export interface PurchaseRequestsReportFilter extends OperationReportFilter {
  page?: number
  size?: number
}

export interface DepartmentUnreturnedAsset {
  departmentId?: string
  departmentName?: string
  unreturnedAssetCount?: number
  overdueReturnCount?: number
}

export interface TopDelayedUser {
  rank?: number
  memberId?: string
  memberName?: string
  departmentName?: string
  delayCount?: number
  averageDelayDays?: number
  recentDelayedAt?: string
}

export interface UnreturnedAssetsReport {
  totalUnreturnedAssetCount: number
  overdueReturnCount: number
  departmentUnreturnedAssets: DepartmentUnreturnedAsset[]
  repeatDelayedUserCount: number
  repeatDelayedUserRate: number
  topDelayedUsers: TopDelayedUser[]
}

export interface RecoveryReport {
  returnRequestCreatedCount: number
  returnRequestCreatedChangeRate: number
  returnCompletedCount: number
  returnCompletedChangeRate: number
  averageRecoveryDays: number
  averageRecoveryDaysChangeRate: number
  totalRecoveryDelayDays: number
  totalRecoveryDelayDaysChangeRate: number
}

export interface DepartmentPurchaseRequest {
  departmentId?: string
  departmentName?: string
  purchaseRequestCount?: number
  purchaseApprovedCount?: number
  purchaseCompletedCount?: number
  accumulatedPurchaseQuantity?: number
}

export interface PurchaseRequestsReport {
  newPurchaseQuantity: number
  newPurchaseQuantityChangeRate: number
  departmentPurchaseRequests: PageResponse<DepartmentPurchaseRequest>
}
