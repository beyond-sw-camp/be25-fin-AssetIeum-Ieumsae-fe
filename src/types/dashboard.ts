import type { PageResponse } from './common'

export interface TicketProgressSummary {
  waitingReceipt: number
  receiptCompleted: number
  processing: number
  completed: number
}

export interface OwnedAssetSummary {
  unassigned: number
  rentalScheduled: number
  rented: number
  overdue: number
}

export interface ExpiringAssetSummary {
  tangibleAssetCount: number
  intangibleAssetCount: number
}

export interface AssetDemand {
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  itemId: string
  assetName: string
  expectedDemand: number
  currentInventory: number
  scheduledReturn: number
  availabilityRate: number
  status: '충분' | '부족'
}

export interface CommonBudgetSummary {
  totalAmount: number
  remainingAmount: number
  remainingRate: number
}

export interface DepartmentBudgetOverview {
  departmentId: string
  departmentName: string
  totalAmount: number
  usedAmount: number
  usageRate: number
}

export interface BudgetOverview {
  commonBudget: CommonBudgetSummary | null
  departmentBudgets: PageResponse<DepartmentBudgetOverview>
}

export interface DashboardLifecycleEvent {
  eventType: string
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  assetId: string
  assetCode: string
  assetName: string
  dueAt: string | null
  dday?: number | null
  dDay?: number | null
  status: string
}

export interface BudgetCategoryUsage {
  categoryName: string
  amount: number
  percentage: number
}

export interface DepartmentBudgetDetail {
  departmentName: string
  totalAmount: number
  usedAmount: number
  remainingAmount: number
  usageRate: number
  categoryUsages: BudgetCategoryUsage[]
}

export interface HrLifecycleEvent {
  eventId: string
  eventType: string
  memberName: string
  departmentName: string
  eventDate: string
  dday?: number
  dDay?: number
  status: string
}

export interface HrEventStatistics {
  totalCount: number
  pendingCount: number
  pendingPercentage: number
  inProgressCount: number
  inProgressPercentage: number
  completedCount: number
  completedPercentage: number
  cancelledCount: number
  cancelledPercentage: number
}
