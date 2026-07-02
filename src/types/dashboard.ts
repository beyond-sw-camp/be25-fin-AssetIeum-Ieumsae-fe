import type { PageResponse } from './common'
import type { BudgetHistoryType } from './budget'

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
  assetType?: 'TANGIBLE' | 'INTANGIBLE'
  assetId: string
  assetName: string
  categoryName?: string | null
  assetCode?: string | null
  seatCount?: number | null
  availableSeatCount?: number | null
  departmentId?: string | null
  departmentName?: string | null
  renterId?: string | null
  renterName?: string | null
  dueDate?: string | null
  dayCount?: number | null
  overdueDays?: number | null
  availableCount?: number | null
  totalCount?: number | null
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
  assignedDepartmentName?: string | null
  currentDepartmentName?: string | null
  ownerDepartmentName?: string | null
  userId?: string | null
  userName?: string | null
  assignedMemberName?: string | null
  assignedUserName?: string | null
  currentUserName?: string | null
  memberName?: string | null
  renterName?: string | null
  expiredAt: string
  expirationDate: string
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
  heldAmount?: number | null
  holdAmount?: number | null
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
  eventDate: string | number[]
  dDay?: number
  status: string
}

export interface LifecycleEvent {
  eventType: string
  assetType: string
  assetId: string
  assetCode: string
  asseetName: string
  dueAt: string
  dDay: number
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
