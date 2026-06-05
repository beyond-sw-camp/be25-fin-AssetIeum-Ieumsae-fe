import api from './client'
import type {
  TicketListItem,
  TicketDetail,
  TicketListFilter,
  StandardAssetRequestCreate,
  NonStandardAssetRequestCreate,
  RentalRequestCreate,
  MaintenanceRequestCreate,
  ReturnRequestCreate,
  TerminationRequestCreate,
  TicketApproveRequest,
  TicketRejectRequest,
  AssetAssignRequest,
  TicketComment,
  PageResponse,
} from '@/types'

// ─── 티켓 공통 API ───────────────────────────────────────────────────────────

export const ticketApi = {
  /** 티켓 목록 조회 */
  getList: (params?: TicketListFilter) =>
    api.get<PageResponse<TicketListItem>>('/tickets', params as Record<string, unknown>),

  /** 티켓 상세 조회 */
  getDetail: (ticketId: number) =>
    api.get<TicketDetail>(`/tickets/${ticketId}`),

  /** 티켓 승인 */
  approve: (ticketId: number, body: TicketApproveRequest) =>
    api.patch(`/tickets/${ticketId}/approve`, body),

  /** 티켓 반려 */
  reject: (ticketId: number, body: TicketRejectRequest) =>
    api.patch(`/tickets/${ticketId}/reject`, body),

  /** 티켓 상태 변경 */
  changeStatus: (ticketId: number, status: string) =>
    api.patch(`/tickets/${ticketId}/status`, { status }),

  /** 자산 할당 */
  assignAsset: (ticketId: number, body: AssetAssignRequest) =>
    api.post(`/tickets/${ticketId}/asset-assignment`, body),

  /** 구매 증빙 업로드 */
  uploadEvidence: (ticketId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload(`/tickets/${ticketId}/evidence`, formData)
  },

  /** 실제 결제 금액 입력 */
  setActualPrice: (ticketId: number, actualPrice: number) =>
    api.patch(`/tickets/${ticketId}/actual-price`, { actualPrice }),

  /** 댓글 목록 조회 */
  getComments: (ticketId: number) =>
    api.get<TicketComment[]>(`/tickets/${ticketId}/comments`),

  /** 댓글 작성 */
  addComment: (ticketId: number, content: string) =>
    api.post<TicketComment>(`/tickets/${ticketId}/comments`, { content }),
}

// ─── 티켓 종류별 생성 API ───────────────────────────────────────────────────

export const ticketCreateApi = {
  /** 표준 자산 요청 */
  createStandardRequest: (body: StandardAssetRequestCreate) =>
    api.post('/tickets/asset-requests/standard', body),

  /** 비표준 자산 요청 */
  createNonStandardRequest: (body: NonStandardAssetRequestCreate) =>
    api.post('/tickets/asset-requests/non-standard', body),

  /** 대여 요청 */
  createRentalRequest: (body: RentalRequestCreate) =>
    api.post('/tickets/rental-requests', body),

  /** 대여 연장 요청 */
  createRentalExtension: (body: { assetId: number; newReturnDueDate: string }) =>
    api.post('/tickets/rental-extensions', body),

  /** 유지보수 요청 */
  createMaintenanceRequest: (body: MaintenanceRequestCreate) =>
    api.post('/tickets/maintenance-requests', body),

  /** 반납 요청 */
  createReturnRequest: (body: ReturnRequestCreate) =>
    api.post('/tickets/return-requests', body),

  /** 무형자산 해지 요청 */
  createTerminationRequest: (body: TerminationRequestCreate) =>
    api.post('/tickets/termination-requests', body),

  /** 구매 요청 (구매자산팀) */
  createPurchaseRequest: (body: unknown) =>
    api.post('/tickets/purchase-requests', body),

  /** 반품 요청 */
  createReturnProductRequest: (body: unknown) =>
    api.post('/tickets/return-product-requests', body),
}
