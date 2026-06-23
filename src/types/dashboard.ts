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

export interface RentalAssetSummary {
  rentalScheduled: number
  rented: number
  overdue: number
}

export interface ExpiringAssetSummary {
  tangibleAssetCount: number
  intangibleAssetCount: number
}

export type OwnedAssetDetailStatus = 'UNASSIGNED' | 'RENTAL_SCHEDULED' | 'RENTED' | 'OVERDUE'

export interface OwnedAssetDetail {
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  assetId: string
  assetName: string
  categoryName?: string | null
  categoryOrProvider: string
  assetCode?: string | null
  warrantyExpiredAt?: string | null
  departmentId?: string | null
  departmentName?: string | null
  renterId?: string | null
  renterName?: string | null
  usedStartedAt?: string | null
  returnDueDate?: string | null
  dayCount: number
  dayStatusLabel: string
  overdueDays?: number | null
}

export interface ExpiringAssetDetail {
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  assetId: string
  assetName: string
  remainingDays: number
  dayCount: number
  dayStatusLabel: string
  departmentId?: string | null
  departmentName?: string | null
  userId?: string | null
  userName?: string | null
  expiredAt: string
  expriationDate: string
  remainingPeriodDays: number
  remainingPeriodStatus: string
  dueDate: string
  assetCode: string
  categoryOrProvider: string 
  manufacturer?: string | null
  issuer?: string | null
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

export interface EmployeeDepartmentBudget {
  departmentId: string
  departmentName: string
  totalAmount: number
  usedAmount: number
  remainingAmount: number
  usageRate: number
  remainingRate: number
}

export type BudgetHistoryType = 'HOLD_INCREASE' | 'HOLD_DECREASE' | 'USE_INCREASE' | 'RECOVERY' | 'TRANSFER'

export interface BudgetLedgerItem {
  historyId: string
  date: string
  departmentId?: string | null
  departmentName: string
  type: string
  historyType: BudgetHistoryType
  usage: string
  amount: number
  balance: number
  ticketId?: string | null
  ticketNo?: string | null
  purchasePlanId?: string | null
  purchasePlanNo?: string | null
}

export interface HrLifecycleEvent {
  eventId: string
  eventType: string
  memberName: string
  departmentName: string
  eventDate: string
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
