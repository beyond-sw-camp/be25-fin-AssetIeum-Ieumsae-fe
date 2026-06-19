import api from './client'
import type {
  DepartmentOverdueReportFilter,
  DepartmentOverdueReportResponse,
  PurchaseRequestReportFilter,
  PurchaseRequestReportResponse,
  RepeatedOverdueUserReportFilter,
  RepeatedOverdueUserReportResponse,
  ReturnRequestReportFilter,
  ReturnRequestReportResponse,
} from '@/types'

function compactParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

function baseParams(params?: DepartmentOverdueReportFilter) {
  return compactParams({
    company_id: params?.companyId,
    department_id: params?.departmentId,
    start_date: params?.startDate,
    end_date: params?.endDate,
    page: params?.page,
    size: params?.size,
  })
}

export const reportApi = {
  getOverdueAssets: (params?: DepartmentOverdueReportFilter) =>
    api.get<DepartmentOverdueReportResponse>('/reports/overdue-assets', baseParams(params)),

  getRepeatedOverdueUsers: (params?: RepeatedOverdueUserReportFilter) =>
    api.get<RepeatedOverdueUserReportResponse>('/reports/repeated-overdue-users', compactParams({
      ...baseParams(params),
      member_id: params?.memberId,
      assignment_type: params?.assignmentType,
      assignment_status: params?.assignmentStatus,
      min_overdue_count: params?.minOverdueCount,
    })),

  getReturnRequests: (params?: ReturnRequestReportFilter) =>
    api.get<ReturnRequestReportResponse>('/reports/return-requests', compactParams({
      ...baseParams(params),
      current_user_id: params?.currentUserId,
      usage_type: params?.usageType,
      status: params?.status,
    })),

  getPurchaseRequests: (params?: PurchaseRequestReportFilter) =>
    api.get<PurchaseRequestReportResponse>('/reports/purchase-requests', compactParams({
      ...baseParams(params),
      requester_id: params?.requesterId,
      approver_id: params?.approverId,
      assignee_id: params?.assigneeId,
      ticket_type: params?.ticketType,
      status: params?.status,
    })),
}
