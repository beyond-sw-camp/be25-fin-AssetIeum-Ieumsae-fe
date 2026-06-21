import api from './client'
import type {
  AssetDemand,
  BudgetOverview,
  DashboardLifecycleEvent,
  DepartmentBudgetDetail,
  ExpiringAssetSummary,
  HrEventStatistics,
  HrLifecycleEvent,
  OwnedAssetSummary,
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

export const dashboardApi = {
  getTicketProgress: (params?: DashboardScopeParams) =>
    api.get<TicketProgressSummary>('/dashboard/ticket-progress', params),

  getOwnedAssets: (params?: DashboardScopeParams) =>
    api.get<OwnedAssetSummary>('/dashboard/owned-assets', params),

  getExpiringAssets: (params?: DashboardScopeParams) =>
    api.get<ExpiringAssetSummary>('/dashboard/expiring-assets', params),

  getAssetDemands: (params?: PageParams) =>
    api.get<PageResponse<AssetDemand>>('/dashboard/asset-demands', params),

  getBudgets: (params?: PageParams) =>
    api.get<BudgetOverview>('/dashboard/budgets', params),

  getLifecycleEvents: (params?: PageParams) =>
    api.get<PageResponse<DashboardLifecycleEvent>>('/dashboard/lifecycle-events', params),

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
