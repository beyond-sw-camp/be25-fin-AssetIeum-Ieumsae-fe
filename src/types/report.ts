import type { PageResponse } from './common'

export type ReportAssignmentType = 'ASSIGNED' | 'RENTAL'
export type ReportAssignmentStatus = 'ACTIVE' | 'ENDED'
export type ReportUsageType = 'ASSIGNED' | 'RENTAL'
export type ReportReturnStatus = 'RETURN_REQUESTED' | 'IN_USE' | 'AVAILABLE'

export interface ReportBaseFilter {
  companyId?: string
  departmentId?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export type DepartmentOverdueReportFilter = ReportBaseFilter

export interface RepeatedOverdueUserReportFilter extends ReportBaseFilter {
  memberId?: string
  assignmentType?: ReportAssignmentType
  assignmentStatus?: ReportAssignmentStatus
  minOverdueCount?: number
}

export interface ReturnRequestReportFilter extends ReportBaseFilter {
  currentUserId?: string
  usageType?: ReportUsageType
  status?: ReportReturnStatus
}

export interface PurchaseRequestReportFilter extends ReportBaseFilter {
  requesterId?: string
  approverId?: string
  assigneeId?: string
  ticketType?: string
  status?: string
}

// TODO: API 명세/백엔드 확인 필요 - 운영 리포트 응답 schema가 비어 있어 표시용 alias를 허용한다.
export interface DepartmentOverdueReportItem {
  departmentId?: string
  departmentName?: string
  name?: string
  unreturnedAssetCount?: number
  overdueAssetCount?: number
  assetCount?: number
  delayedReturnCount?: number
  overdueCount?: number
  totalOverdueDays?: number
}

export interface RepeatedOverdueUserReportItem {
  memberId?: string
  memberNo?: string
  memberName?: string
  name?: string
  departmentId?: string
  departmentName?: string
  delayedReturnCount?: number
  overdueCount?: number
  totalOverdueDays?: number
  latestOverdueDate?: string
}

export interface ReturnRequestReportSummary {
  createdCount?: number
  requestedCount?: number
  completedCount?: number
  averageProcessingDays?: number
  averageReturnDays?: number
  overdueDays?: number
  delayedDays?: number
}

export interface ReturnRequestReportItem {
  departmentId?: string
  departmentName?: string
  createdCount?: number
  requestedCount?: number
  completedCount?: number
  averageProcessingDays?: number
  overdueDays?: number
}

export interface ReturnRequestReportResponse {
  summary?: ReturnRequestReportSummary
  content?: ReturnRequestReportItem[]
  items?: ReturnRequestReportItem[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export interface PurchaseRequestReportItem {
  departmentId?: string
  departmentName?: string
  name?: string
  requestCount?: number
  purchaseRequestCount?: number
  cumulativeQuantity?: number
  totalQuantity?: number
  approvedCount?: number
  completedCount?: number
  estimatedAmount?: number
  actualAmount?: number
}

export type DepartmentOverdueReportResponse = PageResponse<DepartmentOverdueReportItem>
export type RepeatedOverdueUserReportResponse = PageResponse<RepeatedOverdueUserReportItem>
export type PurchaseRequestReportResponse = PageResponse<PurchaseRequestReportItem>
