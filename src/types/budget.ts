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
  assetId: number
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
