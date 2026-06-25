import api, { ApiError } from './client'
import type {
  TicketListItem,
  PurchasePlanCandidateTicket,
  TicketDetail,
  TicketListFilter,
  TicketStatistics,
  StandardAssetRequestCreate,
  NonStandardAssetRequestCreate,
  DirectPurchaseRequestCreate,
  ActiveRentalAsset,
  MaintenanceAvailableAsset,
  RentalAvailableItem,
  RentalRequestCreate,
  RentalExtensionRequestCreate,
  MaintenanceRequestCreate,
  ReturnRequestCreate,
  PurchaseReturnRequestCreate,
  TicketCreateResponse,
  TicketApproveRequest,
  TicketRejectRequest,
  AssetAssignRequest,
  AssetRequestAssignRequest,
  AssetRequestAssignableItemsResponse,
  RentalAssignableAssetsResponse,
  RentalAssignRequest,
  RentalAssignResponse,
  MaintenanceCollectResponse,
  AssetCollectResponse,
  ReturnCompleteResponse,
  MaintenanceCompleteRequest,
  MaintenanceCompleteResponse,
  TicketAssignMeResponse,
  RentalExtensionProcessRequest,
  RentalExtensionProcessResponse,
  TicketActualAmountResponse,
  DirectPurchasePaymentRequest,
  DirectPurchaseAssetAssignRequest,
  DirectPurchaseAssetAssignResponse,
  TicketComment,
  TicketEvidenceUploadResponse,
  TicketStatus,
  TicketType,
  TicketCommentDeleteResponse,
  ApiResponse,
  PageResponse,
} from '@/types'
import { normalizeTicketStatus } from '@/utils/labels'

function compactParams<T extends object>(params?: T) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

type TicketDetailResponse = Partial<TicketDetail> & Record<string, unknown>
type TicketListItemResponse = Partial<TicketListItem> & Record<string, unknown>
const DEFAULT_REQUESTED_USAGE_TYPE = 'DEPARTMENT'

const TICKET_DETAIL_ENDPOINT_BY_TYPE: Record<TicketType, (ticketId: string) => string> = {
  ASSET_REQUEST: (ticketId) => `/tickets/asset-requests/${ticketId}`,
  PURCHASE_REQUEST: (ticketId) => `/tickets/purchase-requests/${ticketId}`,
  RENTAL: (ticketId) => `/tickets/rentals/${ticketId}`,
  RENTAL_EXTENSION: (ticketId) => `/tickets/rentals/extensions/${ticketId}`,
  MAINTENANCE_REQUEST: (ticketId) => `/tickets/maintenance/${ticketId}`,
  ASSET_RETURN: (ticketId) => `/tickets/asset-returns/${ticketId}`,
  PURCHASE_RETURN: (ticketId) => `/tickets/purchase-returns/${ticketId}`,
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function pickString(source: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!source) return undefined

  for (const key of keys) {
    const value = getNestedValue(source, key)
    if (typeof value === 'string' && value.trim()) return value
  }

  return undefined
}

function pickId(source: Record<string, unknown> | null, keys: string[]): string | number | undefined {
  if (!source) return undefined

  for (const key of keys) {
    const value = getNestedValue(source, key)
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return value
  }

  return undefined
}

function getNestedValue(source: Record<string, unknown>, key: string): unknown {
  if (!key.includes('.')) return source[key]

  return key.split('.').reduce<unknown>((current, path) => (
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as Record<string, unknown>)[path]
      : undefined
  ), source)
}

function pickNumber(source: Record<string, unknown> | null, keys: string[]): number | undefined {
  if (!source) return undefined

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }

  return undefined
}

function normalizeRequestedUsageType(value: unknown): TicketDetail['requestedUsageType'] {
  return value === 'DEPARTMENT' || value === 'PERSONAL' ? value : null
}

function normalizeTicketDetail(rawDetail: TicketDetailResponse): TicketDetail {
  const requester = asRecord(rawDetail.requester)
    ?? asRecord(rawDetail.requestMember)
    ?? asRecord(rawDetail.member)
  const department = asRecord(rawDetail.department)
    ?? asRecord(rawDetail.requesterDepartment)
  const departmentApprover = asRecord(rawDetail.departmentApprover)
  const assetAssignee = asRecord(rawDetail.assetAssignee)
    ?? asRecord(rawDetail.assignee)
  const assetCategory = asRecord(rawDetail.assetCategory)
  const assetItem = asRecord(rawDetail.assetItem)
  const requestDetail = asRecord(rawDetail.requestDetail)
  const rawStatus = pickString(rawDetail, ['currentStatus', 'status', 'ticketStatus']) ?? 'REQUESTED'
  const requestedReturnDueDate = pickString(rawDetail, ['requestedReturnDueDate'])
  const returnDueDate = pickString(rawDetail, ['returnDueDate'])
  const assetItemId = rawDetail.assetItemId
    ?? pickId(assetItem, ['itemId', 'assetItemId', 'tangibleAssetItemId'])

  return {
    ...rawDetail,
    ticketId: String(rawDetail.ticketId ?? ''),
    ticketNo: String(rawDetail.ticketNo ?? ''),
    ticketType: rawDetail.ticketType ?? 'ASSET_REQUEST',
    status: normalizeTicketStatus(rawStatus),
    linkedPurchasePlanId: pickString(rawDetail, ['linkedPurchasePlanId', 'purchasePlanId']) ?? null,
    linkedPurchasePlanNo: pickString(rawDetail, ['linkedPurchasePlanNo', 'purchasePlanNo', 'planNo']) ?? null,
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
    approverId: rawDetail.approverId
      ?? pickId(rawDetail, ['departmentApproverId'])
      ?? pickId(departmentApprover, ['memberId', 'employeeId', 'id'])
      ?? null,
    approverName: rawDetail.approverName
      ?? pickString(rawDetail, ['departmentApproverName'])
      ?? pickString(departmentApprover, ['memberName', 'name', 'employeeName'])
      ?? null,
    assigneeId: rawDetail.assigneeId
      ?? pickId(assetAssignee, ['memberId', 'employeeId', 'id'])
      ?? null,
    assigneeName: rawDetail.assigneeName
      ?? pickString(assetAssignee, ['memberName', 'name', 'employeeName'])
      ?? null,
    requestReason: rawDetail.requestReason ?? null,
    requestedUsageType: normalizeRequestedUsageType(
      rawDetail.requestedUsageType
        ?? pickString(rawDetail, ['assetUsageType'])
        ?? pickString(requestDetail, ['requestedUsageType', 'assetUsageType']),
    ),
    assetType: rawDetail.assetType ?? null,
    assetItemId: assetItemId !== undefined && assetItemId !== null ? String(assetItemId) : null,
    categoryName: rawDetail.categoryName
      ?? pickString(assetCategory, ['categoryName', 'name'])
      ?? null,
    requestedItemName: rawDetail.requestedItemName
      ?? pickString(assetItem, ['name', 'productName', 'itemName'])
      ?? pickString(requestDetail, ['productName', 'itemName', 'name'])
      ?? null,
    requestedItemDetail: rawDetail.requestedItemDetail ?? null,
    productName: rawDetail.productName
      ?? pickString(assetItem, ['productName', 'name', 'itemName'])
      ?? pickString(requestDetail, ['productName', 'itemName', 'name'])
      ?? null,
    manufacturer: rawDetail.manufacturer
      ?? pickString(assetItem, ['manufacturer', 'manufacturerOrProvider', 'provider'])
      ?? pickString(requestDetail, ['manufacturer', 'manufacturerOrProvider', 'provider'])
      ?? null,
    modelName: rawDetail.modelName
      ?? pickString(assetItem, ['modelName', 'model'])
      ?? pickString(requestDetail, ['modelName', 'model'])
      ?? null,
    quantity: rawDetail.quantity ?? null,
    actualAmount: pickNumber(rawDetail, ['actualAmount', 'actualPrice']) ?? null,
    directPurchaseEvidenceUrl: pickString(rawDetail, ['directPurchaseEvidenceUrl', 'proofFileUrl']) ?? null,
    directPurchaseEvidenceUploadedAt: pickString(
      rawDetail,
      ['directPurchaseEvidenceUploadedAt', 'proofFileUploadedAt'],
    ) ?? null,
    directPurchaseEvidenceFileName: rawDetail.directPurchaseEvidenceFileName
      ?? pickString(rawDetail, ['proofFileName'])
      ?? null,
    directPurchaseConfirmationStatus: pickString(rawDetail, ['confirmationStatus', 'directPurchaseConfirmationStatus'])
      ?? pickString(requestDetail, ['confirmationStatus', 'directPurchaseConfirmationStatus'])
      ?? null,
    requestedDueDate: rawDetail.requestedDueDate
      ?? requestedReturnDueDate
      ?? returnDueDate
      ?? null,
    assetId: rawDetail.assetId
      ? String(rawDetail.assetId)
      : pickString(requestDetail, ['assetId']) ?? null,
    assetStatus: rawDetail.assetStatus
      ?? pickString(requestDetail, ['assetStatus'])
      ?? null,
    startedAt: pickString(rawDetail, ['startedAt', 'usedStartedAt']) ?? null,
    maintenanceReason: rawDetail.maintenanceReason
      ?? pickString(rawDetail, ['requestDetail'])
      ?? rawDetail.requestReason
      ?? null,
    returnReason: rawDetail.returnReason
      ?? pickString(requestDetail, ['returnReason', 'reason'])
      ?? rawDetail.requestReason
      ?? null,
    refundAmount: rawDetail.refundAmount
      ?? (typeof requestDetail?.refundAmount === 'number' ? requestDetail.refundAmount : null),
    previousDueDate: rawDetail.previousDueDate
      ?? rawDetail.currentReturnDueDate
      ?? rawDetail.rentalDueDate
      ?? null,
    changedDueDate: rawDetail.changedDueDate
      ?? returnDueDate
      ?? null,
    departmentApprovedAt: rawDetail.departmentApprovedAt
      ?? pickString(rawDetail, ['departmentProcessedAt'])
      ?? null,
    departmentRejectedAt: rawDetail.departmentRejectedAt ?? null,
    departmentRejectionReason: rawDetail.departmentRejectionReason ?? null,
    purchaseApprovedAt: rawDetail.purchaseApprovedAt
      ?? pickString(rawDetail, ['assetProcessedAt'])
      ?? null,
    purchaseRejectedAt: rawDetail.purchaseRejectedAt ?? null,
    purchaseRejectionReason: rawDetail.purchaseRejectionReason ?? null,
    purchaseDate: rawDetail.purchaseDate ?? pickString(requestDetail, ['purchaseDate']) ?? null,
    purchaseVendor: rawDetail.purchaseVendor ?? pickString(requestDetail, ['purchaseVendor', 'vendor']) ?? null,
    serialNumber: rawDetail.serialNumber ?? pickString(requestDetail, ['serialNumber', 'serialNo']) ?? null,
    location: rawDetail.location ?? pickString(requestDetail, ['location']) ?? null,
    warrantyEndDate: rawDetail.warrantyEndDate
      ?? rawDetail.warrantyExpiredAt
      ?? pickString(requestDetail, ['warrantyEndDate', 'warrantyExpiredAt'])
      ?? null,
    warrantyExpiredAt: rawDetail.warrantyExpiredAt
      ?? rawDetail.warrantyEndDate
      ?? pickString(requestDetail, ['warrantyExpiredAt', 'warrantyEndDate'])
      ?? null,
    licenseCode: pickString(rawDetail, ['licenseCode', 'licenseKey'])
      ?? pickString(requestDetail, ['licenseCode', 'licenseKey'])
      ?? null,
    seatCount: pickNumber(rawDetail, ['seatCount']) ?? pickNumber(requestDetail, ['seatCount']) ?? null,
    isAutoRenewal: typeof rawDetail.isAutoRenewal === 'boolean' ? rawDetail.isAutoRenewal : null,
    billingCycle: pickString(rawDetail, ['billingCycle', 'paymentCycle'])
      ?? pickString(requestDetail, ['billingCycle'])
      ?? null,
    paymentCycle: pickString(rawDetail, ['paymentCycle', 'billingCycle'])
      ?? pickString(requestDetail, ['paymentCycle', 'billingCycle'])
      ?? null,
    expirationDate: pickString(rawDetail, ['expirationDate', 'expiredAt'])
      ?? pickString(requestDetail, ['expirationDate', 'expiredAt'])
      ?? null,
    assignedAt: rawDetail.assignedAt
      ?? pickString(rawDetail, ['assetAssignedAt', 'assignmentAt', 'allocatedAt'])
      ?? pickString(requestDetail, ['assignedAt', 'assetAssignedAt', 'assignmentAt', 'allocatedAt'])
      ?? null,
    registeredAt: rawDetail.registeredAt
      ?? pickString(rawDetail, ['assetRegisteredAt', 'registrationAt'])
      ?? pickString(requestDetail, ['registeredAt', 'assetRegisteredAt', 'registrationAt'])
      ?? null,
    completedAt: rawDetail.completedAt ?? null,
    canceledAt: rawDetail.canceledAt ?? (rawDetail.cancelledAt as string | null | undefined) ?? null,
    requestedAt: rawDetail.requestedAt ?? pickString(rawDetail, ['createdAt']) ?? '',
    updatedAt: rawDetail.updatedAt ?? pickString(rawDetail, ['processedAt']) ?? '',
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

function normalizeTicketListItem(rawItem: TicketListItemResponse): TicketListItem {
  const requester = asRecord(rawItem.requester)
    ?? asRecord(rawItem.requestMember)
    ?? asRecord(rawItem.requestMemberInfo)
    ?? asRecord(rawItem.requesterMember)
    ?? asRecord(rawItem.requesterMemberInfo)
    ?? asRecord(rawItem.member)
    ?? asRecord(rawItem.requesterInfo)
    ?? asRecord(rawItem.employee)
    ?? asRecord(rawItem.user)
    ?? asRecord(rawItem.applicant)
  const department = asRecord(rawItem.department)
    ?? asRecord(rawItem.requesterDepartment)
    ?? asRecord(rawItem.requestDepartment)
    ?? asRecord(rawItem.requesterDepartmentInfo)
    ?? asRecord(rawItem.departmentInfo)
    ?? asRecord(requester?.department)
    ?? asRecord(requester?.departmentInfo)
  const rawStatus = pickString(rawItem, ['ticketStatus', 'currentStatus', 'status']) ?? 'REQUESTED'
  const requesterId = rawItem.requesterId
    ?? pickId(rawItem, [
      'requester.memberId',
      'requester.id',
      'requestMember.memberId',
      'requestMember.id',
      'requestMemberId',
      'requesterMemberId',
      'memberId',
      'employeeId',
      'applicantId',
    ])
    ?? pickId(requester, ['memberId', 'employeeId', 'userId', 'id'])
  const departmentId = rawItem.departmentId
    ?? pickId(rawItem, [
      'requester.departmentId',
      'requester.department.departmentId',
      'requestMember.departmentId',
      'requestMember.department.departmentId',
      'requesterDepartmentId',
      'requestDepartmentId',
    ])
    ?? pickId(department, ['departmentId', 'id'])
    ?? pickId(requester, ['departmentId', 'department.id'])

  return {
    ...rawItem,
    ticketId: String(rawItem.ticketId ?? ''),
    ticketNo: String(rawItem.ticketNo ?? ''),
    ticketType: rawItem.ticketType ?? 'ASSET_REQUEST',
    requestMethod: rawItem.requestMethod ?? null,
    requestedItemName: rawItem.requestedItemName
      ?? pickString(rawItem, ['itemName', 'productName', 'requestedItemDetail'])
      ?? null,
    requesterId,
    requesterName: pickString(rawItem, [
      'requesterName',
      'requestMemberName',
      'requesterMemberName',
      'memberName',
      'employeeName',
      'applicantName',
      'requester.memberName',
      'requester.name',
      'requester.employeeName',
      'requestMember.memberName',
      'requestMember.name',
      'requestMember.employeeName',
      'member.name',
      'employee.name',
      'user.name',
    ])
      ?? pickString(requester, ['memberName', 'name', 'employeeName', 'userName'])
      ?? '',
    departmentId,
    departmentName: pickString(rawItem, [
      'departmentName',
      'requesterDepartmentName',
      'requestDepartmentName',
      'departmentNamePath',
      'requester.departmentName',
      'requester.department.departmentName',
      'requester.department.name',
      'requestMember.departmentName',
      'requestMember.department.departmentName',
      'requestMember.department.name',
    ])
      ?? pickString(department, ['departmentName', 'name', 'departmentNamePath'])
      ?? pickString(requester, ['departmentName', 'departmentNamePath', 'teamName', 'department.departmentName', 'department.name'])
      ?? '',
    requestedAt: rawItem.requestedAt ?? pickString(rawItem, ['createdAt']) ?? '',
    ticketStatus: normalizeTicketStatus(rawStatus),
    status: normalizeTicketStatus(rawStatus),
  }
}

function normalizeTicketListResponse(
  response: ApiResponse<PageResponse<TicketListItemResponse>>,
): ApiResponse<PageResponse<TicketListItem>> {
  return {
    ...response,
    data: {
      ...response.data,
      content: response.data.content.map(normalizeTicketListItem),
    },
  }
}

async function getDetailFromEndpoint(endpoint: string): Promise<ApiResponse<TicketDetail>> {
  const response = await api.get<TicketDetailResponse>(endpoint)
  return normalizeTicketDetailResponse(response)
}

async function getDetailFromFirstAvailableEndpoint(
  ticketId: string,
  ticketType?: TicketType,
): Promise<ApiResponse<TicketDetail>> {
  if (ticketType) {
    return getDetailFromEndpoint(TICKET_DETAIL_ENDPOINT_BY_TYPE[ticketType](ticketId))
  }

  let lastError: unknown = null
  for (const buildEndpoint of Object.values(TICKET_DETAIL_ENDPOINT_BY_TYPE)) {
    try {
      return await getDetailFromEndpoint(buildEndpoint(ticketId))
    } catch (error) {
      lastError = error
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error
      }
    }
  }

  if (lastError instanceof ApiError) throw lastError
  throw new ApiError('티켓 상세 정보를 찾을 수 없습니다.', { status: 404 })
}

// ─── 티켓 공통 API ───────────────────────────────────────────────────────────

export const ticketApi = {
  /** 티켓 목록 조회 */
  getList: async (params?: TicketListFilter) => {
    const response = await api.get<PageResponse<TicketListItemResponse>>(
      '/tickets',
      params as Record<string, unknown>,
    )
    return normalizeTicketListResponse(response)
  },

  getStatistics: () =>
    api.get<TicketStatistics>('/tickets/statistics'),

  getPurchasePlanCandidates: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<PurchasePlanCandidateTicket>>(
      '/tickets/purchase-plan-candidates',
      compactParams(params),
    ),

  /** 티켓 상세 조회 */
  getDetail: (ticketId: string, ticketType?: TicketType) =>
    getDetailFromFirstAvailableEndpoint(ticketId, ticketType),

  approveDepartment: (ticketId: string) =>
    api.patch(`/tickets/${ticketId}/department-approval/approve`, {}),

  rejectDepartment: (ticketId: string, rejectionReason: string) =>
    api.patch(`/tickets/${ticketId}/department-approval/reject`, {
      rejectionReason,
    }),

  approveAsset: (ticketId: string) =>
    api.patch(`/tickets/${ticketId}/asset-approval/approve`, {}),

  rejectAsset: (ticketId: string, rejectionReason: string) =>
    api.patch(`/tickets/${ticketId}/asset-approval/reject`, { rejectionReason }),

  /** 티켓 승인 */
  approve: (ticketId: string, body: TicketApproveRequest) =>
    body.approver === 'ASSET_TEAM'
      ? ticketApi.approveAsset(ticketId)
      : ticketApi.approveDepartment(ticketId),

  /** 티켓 반려 */
  reject: (ticketId: string, body: TicketRejectRequest) =>
    body.rejectionType === 'ASSET_TEAM'
      ? ticketApi.rejectAsset(ticketId, body.rejectionReason)
      : ticketApi.rejectDepartment(ticketId, body.rejectionReason),

  /** 티켓 상태 변경 */
  changeStatus: (ticketId: string, ticketStatus: TicketStatus) =>
    api.patch(`/tickets/${ticketId}/processing-status`, { ticketStatus }),

  cancel: (ticketId: string) =>
    api.patch<TicketCreateResponse>(`/tickets/${ticketId}/cancel`, {}),

  /** 자산 할당 */
  assignAsset: (ticketId: string, body: AssetAssignRequest) =>
    api.post(`/tickets/${ticketId}/asset-assignment`, body),

  getAssetRequestAssignableItems: (
    ticketId: string,
    params?: { assetType?: string; categoryId?: string; keyword?: string; page?: number; size?: number },
  ) =>
    api.get<AssetRequestAssignableItemsResponse>(
      `/tickets/asset-requests/${ticketId}/assignable-items`,
      compactParams(params),
    ),

  assignAssetRequestItem: (ticketId: string, body: AssetRequestAssignRequest) =>
    api.post(`/tickets/asset-requests/${ticketId}/assign`, body),

  getRentalAssignableAssets: (ticketId: string, params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<RentalAssignableAssetsResponse>(
      `/tickets/rentals/${ticketId}/assignable-assets`,
      compactParams(params),
    ),

  assignRentalAsset: (ticketId: string, body: RentalAssignRequest) =>
    api.post<RentalAssignResponse>(`/tickets/rentals/${ticketId}/assign`, body),

  /** 유지보수 대상 자산 회수 처리 */
  collectMaintenanceAsset: (ticketId: string) =>
    api.patch<MaintenanceCollectResponse>(`/tickets/maintenance/${ticketId}/collect`, {}),

  /** 반납/해지 대상 자산 회수 처리 */
  collectReturnAsset: (ticketId: string) =>
    api.patch<AssetCollectResponse>(`/tickets/asset-returns/${ticketId}/collect`, {}),

  /** 반품 대상 자산 회수 처리 */
  collectPurchaseReturnAsset: (ticketId: string) =>
    api.patch<AssetCollectResponse>(`/tickets/purchase-returns/${ticketId}/collect`, {}),

  completeReturnAsset: (ticketId: string) =>
    api.patch<ReturnCompleteResponse>(`/tickets/asset-returns/${ticketId}/complete`, {}),

  completePurchaseReturnAsset: (ticketId: string) =>
    api.patch<ReturnCompleteResponse>(`/tickets/purchase-returns/${ticketId}/complete`, {}),

  /** 구매자산팀 티켓 담당자 나에게 배정 */
  completeMaintenance: (maintenanceTicketId: string, body: MaintenanceCompleteRequest) =>
    api.patch<MaintenanceCompleteResponse>(`/tickets/maintenance/${maintenanceTicketId}/complete`, {
      maintenanceResult: body.maintenanceResult,
      maintenanceCost: body.maintenanceCost,
    }),

  assignMe: (ticketId: string) =>
    api.patch<TicketAssignMeResponse>(`/tickets/${ticketId}/assign-me`, {}),

  /** 대여 연장 반납 예정일 변경 처리 */
  changeRentalExtensionDueDate: (ticketId: string, body: RentalExtensionProcessRequest) =>
    api.patch<RentalExtensionProcessResponse>(`/tickets/rentals/extensions/${ticketId}/return-due-date`, {
      returnDueDate: body.returnDueDate ?? body.changedDueDate,
    }),

  /** 구매 증빙 업로드 */
  uploadEvidence: (ticketId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<TicketEvidenceUploadResponse>(`/tickets/${ticketId}/evidences`, formData)
  },

  /** 실제 결제 금액 입력 */
  setActualPrice: (ticketId: string, body: DirectPurchasePaymentRequest) =>
    api.post<TicketActualAmountResponse>(`/tickets/${ticketId}/actual-amount`, body),

  setDirectPurchaseResult: (ticketId: string, body: DirectPurchasePaymentRequest) =>
    api.post<TicketActualAmountResponse>(
      `/tickets/purchase-requests/${ticketId}/direct-purchase-result`,
      body,
    ),

  /** 댓글 목록 조회 */
  getDirectPurchaseResult: (ticketId: string) =>
    api.get<TicketActualAmountResponse>(
      `/tickets/purchase-requests/${ticketId}/direct-purchase-result`,
    ),

  updateDirectPurchaseResult: (ticketId: string, body: DirectPurchasePaymentRequest) =>
    api.put<TicketActualAmountResponse>(
      `/tickets/purchase-requests/${ticketId}/direct-purchase-result`,
      body,
    ),

  confirmDirectPurchaseResult: (ticketId: string) =>
    api.patch<TicketActualAmountResponse>(
      `/tickets/purchase-requests/${ticketId}/direct-purchase-result/confirm`,
      {},
    ),

  assignDirectPurchaseAsset: (ticketId: string, body: DirectPurchaseAssetAssignRequest) =>
    api.post<DirectPurchaseAssetAssignResponse>(
      `/tickets/purchase-requests/${ticketId}/direct-purchase-assets/assign`,
      body,
    ),

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
    api.post<TicketCreateResponse>('/tickets/asset-requests', {
      ...body,
      requestedUsageType: body.requestedUsageType ?? DEFAULT_REQUESTED_USAGE_TYPE,
    }),

  /** 비표준 자산 요청 */
  createNonStandardRequest: (body: NonStandardAssetRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-requests/non-standard', {
      ...body,
      requestedUsageType: body.requestedUsageType ?? DEFAULT_REQUESTED_USAGE_TYPE,
    }),

  /** 직접 구매 자산 요청 */
  createDirectPurchaseRequest: (body: DirectPurchaseRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-requests/direct-purchase', {
      ...body,
      requestedUsageType: body.requestedUsageType ?? DEFAULT_REQUESTED_USAGE_TYPE,
    }),

  /** 대여 요청 */
  createRentalRequest: (body: RentalRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/rentals', body),

  getRentalAvailableItems: (params?: {
    categoryId?: string
    isStandard?: string | boolean
    keyword?: string
    page?: number
    size?: number
  }) =>
    api.get<PageResponse<RentalAvailableItem>>('/tickets/rentals/available-items', compactParams(params)),

  getActiveRentalAssets: () =>
    api.get<ActiveRentalAsset[]>('/tickets/rentals/active-assets'),

  /** 대여 연장 요청 */
  createRentalExtension: (body: RentalExtensionRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/rentals/extensions', body),

  /** 유지보수 요청 */
  createMaintenanceRequest: (body: MaintenanceRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/maintenance', body),

  getMaintenanceAvailableAssets: () =>
    api.get<MaintenanceAvailableAsset[]>('/tickets/maintenance/available-assets'),

  /** 반납 요청 */
  createReturnRequest: (body: ReturnRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/asset-returns', body),

  getReturnAvailableAssets: (params?: { assetType?: string }) =>
    api.get<MaintenanceAvailableAsset[]>('/tickets/asset-returns/available-assets', compactParams(params)),

  /** 반품/환불 요청 */
  createPurchaseReturnRequest: (body: PurchaseReturnRequestCreate) =>
    api.post<TicketCreateResponse>('/tickets/purchase-returns', body),

  getPurchaseReturnAvailableAssets: (params?: { assetType?: string }) =>
    api.get<MaintenanceAvailableAsset[]>('/tickets/purchase-returns/available-assets', compactParams(params)),
}
