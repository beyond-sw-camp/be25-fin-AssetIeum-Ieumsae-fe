import api from './client'
import type {
  TicketListItem,
  TicketDetail,
  TicketListFilter,
  TicketStatistics,
  StandardAssetRequestCreate,
  NonStandardAssetRequestCreate,
  DirectPurchaseRequestCreate,
  RentalRequestCreate,
  RentalExtensionRequestCreate,
  MaintenanceRequestCreate,
  ReturnRequestCreate,
  PurchaseReturnRequestCreate,
  TicketCreateResponse,
  TicketApproveRequest,
  TicketRejectRequest,
  AssetAssignRequest,
  MaintenanceCollectResponse,
  AssetCollectResponse,
  MaintenanceCompleteRequest,
  MaintenanceCompleteResponse,
  TicketAssignMeResponse,
  RentalExtensionProcessRequest,
  RentalExtensionProcessResponse,
  TicketActualAmountResponse,
  DirectPurchasePaymentRequest,
  TicketComment,
  TicketEvidenceUploadResponse,
  TicketStatus,
  TicketCommentDeleteResponse,
  ApiResponse,
  PageResponse,
} from '@/types'
import { normalizeTicketStatus } from '@/utils/labels'

type TicketDetailResponse = Partial<TicketDetail> & Record<string, unknown>

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function pickString(source: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!source) return undefined

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return undefined
}

function pickId(source: Record<string, unknown> | null, keys: string[]): string | number | undefined {
  if (!source) return undefined

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return value
  }

  return undefined
}

function normalizeTicketDetail(rawDetail: TicketDetailResponse): TicketDetail {
  const requester = asRecord(rawDetail.requester)
    ?? asRecord(rawDetail.requestMember)
    ?? asRecord(rawDetail.member)
  const department = asRecord(rawDetail.department)
    ?? asRecord(rawDetail.requesterDepartment)
  const rawStatus = pickString(rawDetail, ['status', 'ticketStatus']) ?? 'REQUESTED'

  return {
    ...rawDetail,
    ticketId: String(rawDetail.ticketId ?? ''),
    ticketNo: String(rawDetail.ticketNo ?? ''),
    ticketType: rawDetail.ticketType ?? 'ASSET_REQUEST',
    status: normalizeTicketStatus(rawStatus),
    requesterId: rawDetail.requesterId ?? pickId(requester, ['memberId', 'employeeId', 'id']) ?? '',
    requesterName: rawDetail.requesterName
      ?? pickString(rawDetail, ['requestMemberName', 'employeeName'])
      ?? pickString(requester, ['memberName', 'name', 'employeeName'])
      ?? '',
    departmentId: rawDetail.departmentId ?? pickId(department, ['departmentId', 'id']) ?? '',
    departmentName: rawDetail.departmentName
      ?? pickString(rawDetail, ['requesterDepartmentName'])
      ?? pickString(department, ['departmentName', 'name'])
      ?? '',
    approverId: rawDetail.approverId ?? pickId(rawDetail, ['departmentApproverId']) ?? null,
    approverName: rawDetail.approverName
      ?? pickString(rawDetail, ['departmentApproverName'])
      ?? null,
    assigneeId: rawDetail.assigneeId ?? null,
    assigneeName: rawDetail.assigneeName ?? null,
    requestReason: rawDetail.requestReason ?? null,
    departmentApprovedAt: rawDetail.departmentApprovedAt ?? null,
    departmentRejectedAt: rawDetail.departmentRejectedAt ?? null,
    departmentRejectionReason: rawDetail.departmentRejectionReason ?? null,
    purchaseApprovedAt: rawDetail.purchaseApprovedAt ?? null,
    purchaseRejectedAt: rawDetail.purchaseRejectedAt ?? null,
    purchaseRejectionReason: rawDetail.purchaseRejectionReason ?? null,
    completedAt: rawDetail.completedAt ?? null,
    canceledAt: rawDetail.canceledAt ?? (rawDetail.cancelledAt as string | null | undefined) ?? null,
    requestedAt: rawDetail.requestedAt ?? pickString(rawDetail, ['createdAt']) ?? '',
    updatedAt: rawDetail.updatedAt ?? '',
  }
}

function normalizeTicketDetailResponse(
  response: ApiResponse<TicketDetailResponse>,
): ApiResponse<TicketDetail> {
  return {
    ...response,
    data: normalizeTicketDetail(response.data),
  }
}

// ─── 티켓 공통 API ───────────────────────────────────────────────────────────

export const ticketApi = {
  /** 티켓 목록 조회 */
  getList: (params?: TicketListFilter) =>
    api.get<PageResponse<TicketListItem>>('/tickets', params as Record<string, unknown>),

  getStatistics: () =>
    api.get<TicketStatistics>('/tickets/statistics'),

  /** 티켓 상세 조회 */
  getDetail: async (ticketId: string) => {
    const response = await api.get<TicketDetailResponse>(`/tickets/asset-requests/${ticketId}`)
    return normalizeTicketDetailResponse(response)
  },

  /** 티켓 승인 */
  approve: (ticketId: string, body: TicketApproveRequest) =>
    api.patch(`/tickets/${ticketId}/approve`, body),

  /** 티켓 반려 */
  reject: (ticketId: string, body: TicketRejectRequest) =>
    api.patch(`/tickets/${ticketId}/reject`, body),

  /** 티켓 상태 변경 */
  changeStatus: (ticketId: string, status: TicketStatus) =>
    api.patch(`/tickets/${ticketId}/status`, { status }),

  cancel: (ticketId: string) =>
    api.patch<TicketCreateResponse>(`/tickets/${ticketId}/cancel`, {}),

  /** 자산 할당 */
  assignAsset: (ticketId: string, body: AssetAssignRequest) =>
    api.post(`/tickets/${ticketId}/asset-assignment`, body),

  /** 유지보수 대상 자산 회수 처리 */
  collectMaintenanceAsset: (ticketId: string) =>
    api.patch<MaintenanceCollectResponse>(`/tickets/${ticketId}/maintence/collect`, {}),

  /** 반납/해지 대상 자산 회수 처리 */
  collectReturnAsset: (ticketId: string) =>
    api.patch<AssetCollectResponse>(`/tickets/${ticketId}/returns/collect`, {}),

  /** 반품 대상 자산 회수 처리 */
  collectPurchaseReturnAsset: (ticketId: string) =>
    api.patch<AssetCollectResponse>(`/tickets/${ticketId}/purchase-returns/collect`, {}),

  /** 구매자산팀 티켓 담당자 나에게 배정 */
  completeMaintenance: (maintenanceTicketId: string, body: MaintenanceCompleteRequest) =>
    api.patch<MaintenanceCompleteResponse>(`/maintenance-tickets/${maintenanceTicketId}/complete`, {
      maintenance_result: body.maintenanceResult,
      maintenance_completed_at: body.maintenanceCompletedAt,
      maintenance_cost: body.maintenanceCost,
    }),

  assignMe: (ticketId: string) =>
    api.patch<TicketAssignMeResponse>(`/tickets/${ticketId}/assign-me`, {}),

  /** 대여 연장 반납 예정일 변경 처리 */
  changeRentalExtensionDueDate: (ticketId: string, body: RentalExtensionProcessRequest) =>
    api.patch<RentalExtensionProcessResponse>(`/tickets/${ticketId}/rental-extension`, body),

  /** 구매 증빙 업로드 */
  uploadEvidence: (ticketId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<TicketEvidenceUploadResponse>(`/tickets/${ticketId}/evidences`, formData)
  },

  /** 실제 결제 금액 입력 */
  setActualPrice: (ticketId: string, body: DirectPurchasePaymentRequest) =>
    api.post<TicketActualAmountResponse>(`/tickets/${ticketId}/actual-amount`, body),

  /** 댓글 목록 조회 */
  getComments: (ticketId: string, params?: { page?: number; size?: number }) =>
    api.get<PageResponse<TicketComment>>(`/tickets/${ticketId}/comments`, params),

  /** 댓글 작성 */
  addComment: (ticketId: string, content: string) =>
    api.post<TicketComment>(`/tickets/${ticketId}/comments`, { content }),

  /** 댓글 수정 */
  updateComment: (ticketId: string, commentId: number, content: string) =>
    api.patch<TicketComment>(`/tickets/${ticketId}/comments/${commentId}`, { content }),

  /** 댓글 삭제 */
  deleteComment: (ticketId: string, commentId: number) =>
    api.delete<TicketCommentDeleteResponse>(`/tickets/${ticketId}/comments/${commentId}`),
}

// ─── 티켓 종류별 생성 API ───────────────────────────────────────────────────

export const ticketCreateApi = {
  /** 표준 자산 요청 */
  createStandardRequest: (body: StandardAssetRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/asset-requests', body),

  /** 비표준 자산 요청 */
  createNonStandardRequest: (body: NonStandardAssetRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-requests/non-standard', body),

  /** 직접 구매 자산 요청 */
  createDirectPurchaseRequest: (body: DirectPurchaseRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-requests/direct-purchase', body),

  /** 대여 요청 */
  createRentalRequest: (body: RentalRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/rentals', body),

  /** 대여 연장 요청 */
  createRentalExtension: (body: RentalExtensionRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/rental-extensions', body),

  /** 유지보수 요청 */
  createMaintenanceRequest: (body: MaintenanceRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/maintenance-requests', body),

  /** 반납 요청 */
  createReturnRequest: (body: ReturnRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/returns', body),

  /** 반품/환불 요청 */
  createPurchaseReturnRequest: (body: PurchaseReturnRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-returns', body),
}
