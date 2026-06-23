import api from './client'
import type {
  AssetDemand,
  BudgetHistoryType,
  BudgetLedgerItem,
  BudgetOverview,
  DashboardLifecycleEvent,
  DepartmentBudgetDetail,
  ExpiringAssetSummary,
  ExpiringAssetDetail,
  HrEventStatistics,
  HrLifecycleEvent,
  OwnedAssetSummary,
  OwnedAssetDetail,
  OwnedAssetDetailStatus,
  PageResponse,
  TicketProgressSummary,
} from '@/types'

interface DashboardScopeParams extends Record<string, unknown> {
  departmentId?: string
}

interface PageParams extends Record<string, unknown> {
  page?: number
  size?: number
}

interface AssetDetailParams extends PageParams {
  departmentId?: string
  keyword?: string
}

export const dashboardApi = {
  getTicketProgress: (params?: DashboardScopeParams) =>
    api.get<TicketProgressSummary>('/dashboard/ticket-progress', params),

  getOwnedAssets: (params?: DashboardScopeParams) =>
    api.get<OwnedAssetSummary>('/dashboard/owned-assets', params),

  getOwnedAssetDetails: (params: AssetDetailParams & { status: OwnedAssetDetailStatus }) =>
    api.get<PageResponse<OwnedAssetDetail>>('/dashboard/owned-assets/details', params),

  getExpiringAssets: (params?: DashboardScopeParams) =>
    api.get<ExpiringAssetSummary>('/dashboard/expiring-assets', params),

  getExpiringAssetDetails: (params: AssetDetailParams & { assetType: 'TANGIBLE' | 'INTANGIBLE' }) =>
    api.get<PageResponse<ExpiringAssetDetail>>('/dashboard/expiring-assets/details', params),

  getAssetDemands: (params?: PageParams) =>
    api.get<PageResponse<AssetDemand>>('/dashboard/asset-demands', params),

  getBudgets: (params?: PageParams) =>
    api.get<BudgetOverview>('/dashboard/budgets', params),

  getLifecycleEvents: (params?: PageParams) =>
    api.get<PageResponse<DashboardLifecycleEvent>>('/dashboard/lifecycle-events', params),

  getBudgetLedger: (params?: PageParams & {
    departmentId?: string
    budgetYear?: number
    historyType?: BudgetHistoryType
    keyword?: string
  }) => api.get<PageResponse<BudgetLedgerItem>>('/dashboard/budget-ledger', params),

  getDepartmentBudgetDetails: (departmentId: string, year?: number) =>
    api.get<DepartmentBudgetDetail>('/department-dashboard/budget-details', {
      departmentId,
      year,
    }),

  getDepartmentHrEvents: (params?: PageParams & { departmentId?: string; eventType?: string }) =>
    api.get<PageResponse<HrLifecycleEvent>>('/department-dashboard/hr-events', params),

  getDepartmentHrStatistics: (departmentId?: string) =>
    api.get<HrEventStatistics>('/department-dashboard/hr-events/statistics', { departmentId }),
}
