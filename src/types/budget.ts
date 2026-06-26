// =====================================================
// 예산(Budget) 관련 타입
// =====================================================

export interface DepartmentBudget {
  budgetId: number
  departmentId: string
  departmentName: string
  totalBudget: number
  usedBudget: number
  pendingBudget: number    // 집행 대기(잠금) 금액
  availableBudget: number  // 가용 예산
  fiscalYear: number
  createdAt: string
  updatedAt: string
}

export interface BudgetListItem {
  budgetId: string
  budgetYear: number
  departmentId: string | null
  departmentName: string | null
  totalAmount: number
  heldAmount: number
  usedAmount: number
  createdAt?: string
  updatedAt?: string
}

export interface BudgetSetRequest {
  departmentId: string
  totalBudget: number
  fiscalYear: number
}

export interface BudgetTransferRequest {
  fromDepartmentId: string
  toDepartmentId: string
  amount: number
  reason?: string
}

export interface BudgetOverrunConfig {
  allowedOverrunPercent: number  // 초과 허용 범위(%)
}

export type BudgetHistoryType =
  | 'HOLD_INCREASE'
  | 'HOLD_DECREASE'
  | 'USE_INCREASE'
  | 'RECOVERY'
  | 'TRANSFER'

export interface BudgetHistoryItem {
  historyId: string | number
  departmentId: string | null
  departmentName: string | null
  budgetId: string
  budgetYear: number
  historyType: BudgetHistoryType
  amount: number
  usedAmountBefore: number
  usedAmountAfter: number
  holdAmountBefore: number
  holdAmountAfter: number
  totalBudget: number
  description: string | null
  createdAt: string
}

export interface BudgetHistorySearchRequest extends Record<string, unknown> {
  page?: number
  size?: number
  departmentId?: string
  budgetYear?: number
}

// =====================================================
// 대시보드 통계 타입
// =====================================================

export interface TicketStatusSummary {
  requested: number
  departmentApproved: number
  reviewing: number
  processing: number
  completed: number
}

export interface AssetExpiryItem {
  assetId: string
  assetCode: string
  assetName: string
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  expiryDate: string
  daysRemaining: number
  notificationInterval: number
}

export interface DemandForecastItem {
  assetItemId: number
  assetItemName: string
  expectedDemand: number
  currentStock: number
  pendingReturn: number
  shortage: number
  status: 'SHORTAGE' | 'SUFFICIENT'
  availabilityRate: number
}

export interface DepartmentOperationScore {
  departmentId: string
  departmentName: string
  score: number
  grade: 'EXCELLENT' | 'CAUTION' | 'NEEDS_IMPROVEMENT' | 'DANGER'
  unreturned: number
  longUnchecked: number
}
