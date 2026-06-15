import api from './client'
import type {
  TicketListItem,
  TicketDetail,
  TicketListFilter,
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
  TicketComment,
  TicketCommentDeleteResponse,
  TicketStatus,
  PageResponse,
} from '@/types'

// ─── 티켓 공통 API ───────────────────────────────────────────────────────────

export const ticketApi = {
  /** 티켓 목록 조회 */
  getList: (params?: TicketListFilter) =>
    api.get<PageResponse<TicketListItem>>('/tickets', params as Record<string, unknown>),

  /** 티켓 상세 조회 */
  getDetail: (ticketId: string) =>
    api.get<TicketDetail>(`/tickets/${ticketId}`),

  /** 티켓 승인 */
  approve: (ticketId: string, body: TicketApproveRequest) =>
    api.patch(`/tickets/${ticketId}/approve`, body),

  /** 티켓 반려 */
  reject: (ticketId: string, body: TicketRejectRequest) =>
    api.patch(`/tickets/${ticketId}/reject`, body),

  /** 티켓 상태 변경 */
  changeStatus: (ticketId: string, status: TicketStatus) =>
    api.patch(`/tickets/${ticketId}/status`, { status }),

  /** 자산 할당 */
  assignAsset: (ticketId: string, body: AssetAssignRequest) =>
    api.post(`/tickets/${ticketId}/asset-assignment`, body),

  /** 구매 증빙 업로드 */
  uploadEvidence: (ticketId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload(`/tickets/${ticketId}/evidences`, formData)
  },

  /** 실제 결제 금액 입력 */
  setActualPrice: (ticketId: string, actualPrice: number) =>
    api.post(`/tickets/${ticketId}/actual-amount`, { actualPrice }),

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
    api.post<TicketCreateResponse>('/tickets/asset-requests/standard', body),

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
