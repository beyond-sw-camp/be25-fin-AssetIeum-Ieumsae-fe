import api from './client'
import type {
  OperationReportFilter,
  PurchaseRequestsReport,
  PurchaseRequestsReportFilter,
  RecoveryReport,
  UnreturnedAssetsReport,
  UnreturnedAssetsReportFilter,
} from '@/types'

function compactParams(params?: Record<string, unknown>) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const reportApi = {
  getUnreturnedAssets: (params?: UnreturnedAssetsReportFilter) =>
    api.get<UnreturnedAssetsReport>('/reports/operations/unreturned-assets', compactParams({
      topDelayedUserLimit: params?.topDelayedUserLimit,
    })),

  getRecovery: (params?: OperationReportFilter) =>
    api.get<RecoveryReport>('/reports/operations/recovery', compactParams({
      startDate: params?.startDate,
      endDate: params?.endDate,
    })),

  getPurchaseRequests: (params?: PurchaseRequestsReportFilter) =>
    api.get<PurchaseRequestsReport>('/reports/operations/purchase-requests', compactParams({
      startDate: params?.startDate,
      endDate: params?.endDate,
      page: params?.page,
      size: params?.size,
    })),
}
