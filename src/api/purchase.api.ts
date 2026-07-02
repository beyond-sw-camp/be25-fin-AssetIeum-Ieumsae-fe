import { api } from './client'
import { fileApi } from './file.api'
import type { FileMetadata } from '@/types/file'
import type {
  PurchasePlanCreateRequest,
  PurchasePlanCreateResponse,
  PurchasePlanDetail,
  PurchasePlanIntangibleAssetRegisterRequest,
  PurchasePlanItemRegisterRequest,
  PurchasePlanItem,
  PurchasePlanListFilter,
  PurchasePlanListItem,
  PurchasePlanPage,
  PurchasePlanPurchaseResultRequest,
  PurchasePlanStatistics,
  PurchasePlanStatus,
  PurchasePlanStatusChangeRequest,
  PurchasePlanTangibleAssetRegisterRequest,
  PurchasePolicyUpdateRequest,
  PurchasePolicyUpdateResponse,
  PurchasePolicy,
} from '@/types/purchase'

const PURCHASE_PLAN_STATUSES = new Set([
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'ORDERED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
])

type PurchasePlanItemResponse = PurchasePlanItem & {
  productName?: string | null
  name?: string | null
  categoryId?: string | null
  categoryName?: string | null
  assetCategoryName?: string | null
  assetCategory?: {
    categoryName?: string | null
    name?: string | null
  } | null
  assetItem?: {
    categoryName?: string | null
    category?: string | null
  } | null
  assetItemCategory?: string | null
  assetItemCategoryName?: string | null
  itemCategory?: string | null
  itemCategoryName?: string | null
  tangibleCategoryName?: string | null
  intangibleCategoryName?: string | null
  purchasePlanItemId?: string
  purchasePlanItemDetailId?: string
  purchaseItemId?: string
  planItemId?: string
  purchaseRequestItemId?: string
  purchasePlanId?: string
  purchaseId?: string
  planPurchaseItemId?: string
  purchasePlanItemNo?: string
  itemNo?: string
  id?: string
  purchasePlanItemStatus?: string | null
  itemStatus?: string | null
  status?: string | null
  unitPrice?: number
  estimatedAmount?: number
  actualPrice?: number | null
  purchasePrice?: number | null
  registeredCount?: number | null
  registeredAssetCount?: number | null
  assetRegisteredCount?: number | null
  registeredQuantity?: number | null
  registeredAssetQuantity?: number | null
  ticket?: {
    ticketRequesterId?: string | null
    ticketRequesterName?: string | null
    ticketDepartmentId?: string | null
    ticketDepartmentName?: string | null
    ticketTargetMemberIds?: (string | null)[]
  } | null
  ticketId?: string | null
  ticketRequesterId?: string | null
  ticketRequesterName?: string | null
  requesterId?: string | null
  requesterName?: string | null
  ticketDepartmentId?: string | null
  requestDepartmentId?: string | null
  ticketDepartmentName?: string | null
  requestDepartmentName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  assignmentTargetMemberIds?: (string | null)[]
  assignmentTargetIds?: (string | null)[]
  targetMemberIds?: (string | null)[]
  assigneeIds?: (string | null)[]
  assignmentTargets?: unknown[]
  targetMembers?: unknown[]
  tangibleAssetItemId?: string | null
  intangibleAssetItemId?: string | null
  evidenceFiles?: unknown
}

type PurchasePlanListItemResponse = PurchasePlanListItem & {
  itemName?: string | null
  itemSummary?: string | null
  created_at?: string | null
  updated_at?: string | null
  items?: PurchasePlanItemResponse[]
}

type PurchasePlanAssignmentTarget = NonNullable<PurchasePlanItem['assignmentTargets']>[number]

type PurchasePlanDetailResponse = PurchasePlanDetail

function normalizePurchasePlanStatus(data: Record<string, unknown>): PurchasePlanStatus {
  const statusCandidates = [
    data.purchaseRequestStatus,
    data.status,
    data.planStatus,
    data.purchasePlanStatus,
    data.requestStatus,
  ]
  const status = statusCandidates.find(
    (value) => typeof value === 'string' && PURCHASE_PLAN_STATUSES.has(value),
  )

  return typeof status === 'string' ? status as PurchasePlanStatus : 'REQUESTED'
}

function toQueryParams(params?: PurchasePlanListFilter): Record<string, unknown> | undefined {
  if (!params) return undefined

  const cleanedParams: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      cleanedParams[key] = value
    }
  }

  return Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
}

function normalizePlanItem(item: PurchasePlanItemResponse): PurchasePlanItem {
  const quantity = Number(item.quantity ?? 0)
  const estimatedUnitPrice = Number(item.estimatedUnitPrice ?? item.unitPrice ?? 0)
  const totalAmount = Number(item.totalAmount ?? item.estimatedAmount ?? estimatedUnitPrice * quantity)
  const itemId = pickPurchasePlanItemId(item)
  const actualUnitPrice = toNullableNumber(
    item.actualUnitPrice
      ?? item.actualPrice
      ?? item.purchasePrice,
  )
  const actualAmount = toNullableNumber(item.actualAmount)

  return {
    ...item,
    itemId,
    category: pickPlanItemCategory(item),
    categoryId: item.categoryId ?? null,
    categoryName: pickPlanItemCategory(item),
    itemName: item.itemName ?? item.productName ?? item.name ?? '-',
    assetType: normalizePlanItemAssetType(item),
    tangibleAssetItemId: item.tangibleAssetItemId ?? item.tangibleItemId ?? null,
    intangibleAssetItemId: item.intangibleAssetItemId ?? item.intangibleItemId ?? null,
    quantity,
    estimatedUnitPrice,
    totalAmount,
    purchasePlanItemStatus: normalizePlanItemStatus(item),
    receivedAt: item.receivedAt ?? null,
    actualAmount,
    actualUnitPrice,
    evidenceFiles: normalizeFileMetadataList(item.evidenceFiles),
    isStandard: normalizePlanItemStandard(item),
    registeredCount: normalizeRegisteredAssetCount(item),
    ticketId: item.ticketId ?? null,
    ticketRequesterId: item.ticketRequesterId ?? item.ticket?.ticketRequesterId ?? item.requesterId ?? null,
    ticketRequesterName: item.ticketRequesterName ?? item.ticket?.ticketRequesterName ?? item.requesterName ?? null,
    assignmentTargetMemberIds: normalizeAssignmentTargetMemberIds(item),
    assignmentTargets: normalizeAssignmentTargets(item),
    ticketDepartmentId: item.ticketDepartmentId
      ?? item.ticket?.ticketDepartmentId
      ?? item.requestDepartmentId
      ?? item.departmentId
      ?? null,
    ticketDepartmentName: item.ticketDepartmentName
      ?? item.ticket?.ticketDepartmentName
      ?? item.requestDepartmentName
      ?? item.departmentName
      ?? null,
  }
}

function normalizeFileMetadataList(value: unknown): FileMetadata[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((file) => {
    if (!file || typeof file !== 'object') return []
    const record = file as Record<string, unknown>
    const fileId = toNullableNumber(record.fileId)
    const fileUrl = normalizeString(record.fileUrl)
    const originalFilename = normalizeString(record.originalFilename)
      ?? normalizeString(record.fileName)
      ?? normalizeString(record.filename)
      ?? '-'
    const fileSize = toNullableNumber(record.fileSize) ?? 0

    if (fileId === null || !fileUrl) return []

    return [{
      fileId,
      fileUrl,
      originalFilename,
      fileSize,
      extension: normalizeString(record.extension),
      uploadedAt: normalizeString(record.uploadedAt),
    }]
  })
}

function normalizePlanItemStatus(item: PurchasePlanItemResponse) {
  const status =
    item.purchasePlanItemStatus
    ?? item.itemStatus
    ?? item.status
  return typeof status === 'string' ? status.trim() || null : null
}

function normalizeAssignmentTargetMemberIds(item: PurchasePlanItemResponse) {
  return uniqueNormalizedIds([
    ...(Array.isArray(item.assignmentTargetMemberIds) ? item.assignmentTargetMemberIds : []),
    ...(Array.isArray(item.assignmentTargetIds) ? item.assignmentTargetIds : []),
    ...(Array.isArray(item.ticket?.ticketTargetMemberIds) ? item.ticket.ticketTargetMemberIds : []),
    ...(Array.isArray(item.targetMemberIds) ? item.targetMemberIds : []),
    ...(Array.isArray(item.assigneeIds) ? item.assigneeIds : []),
    ...normalizeAssignmentTargets(item).flatMap((target) => [
      target.memberId,
      target.assigneeId,
      target.targetMemberId,
      target.targetId,
    ]),
  ])
}

function normalizeAssignmentTargets(item: PurchasePlanItemResponse): PurchasePlanAssignmentTarget[] {
  const source =
    item.assignmentTargets
    ?? item.targetMembers
    ?? []
  if (!Array.isArray(source)) return []

  return source.flatMap<PurchasePlanAssignmentTarget>((target) => {
    if (target === null || target === undefined) return []
    if (typeof target !== 'object') {
      const id = normalizeId(target)
      return id ? [{ memberId: id }] : []
    }

    const record = target as Record<string, unknown>
    const memberId = normalizeId(
      record.memberId
      ?? record.assigneeId
      ?? record.targetMemberId
      ?? record.targetId
      ?? record.id,
    )
    return [{
      targetId: normalizeId(record.targetId ?? record.id),
      memberId,
      assigneeId: normalizeId(record.assigneeId),
      targetMemberId: normalizeId(record.targetMemberId),
      name: normalizeString(record.name),
      memberName: normalizeString(record.memberName ?? record.targetName),
      assigneeName: normalizeString(record.assigneeName),
      departmentId: normalizeId(record.departmentId),
      departmentName: normalizeString(record.departmentName),
    }]
  })
}

function uniqueNormalizedIds(values: unknown[]) {
  return Array.from(new Set(values.map(normalizeId).filter((value): value is string => Boolean(value))))
}

function normalizeId(value: unknown) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function normalizeString(value: unknown) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function normalizePlanItemAssetType(item: PurchasePlanItemResponse) {
  const rawAssetType = item.assetType
  if (rawAssetType === 'TANGIBLE' || rawAssetType === 'INTANGIBLE') return rawAssetType

  if (item.intangibleItemId || item.intangibleAssetItemId) {
    return 'INTANGIBLE'
  }
  if (item.tangibleItemId || item.tangibleAssetItemId) {
    return 'TANGIBLE'
  }

  return null
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function compactPurchaseAssetRegisterBody<T extends Record<string, unknown>>(body: T) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }),
  )
}

function toTangibleAssetRegisterBody(data: PurchasePlanTangibleAssetRegisterRequest) {
  const normalizedMemberIds = data.memberIds
    ?.map((memberId) => typeof memberId === 'string' ? memberId.trim() : '')
  const memberIds = normalizedMemberIds?.every(Boolean) ? normalizedMemberIds : undefined

  return compactPurchaseAssetRegisterBody({
    usageType: data.usageType,
    assetUsageType: data.assetUsageType,
    serialNumbers: data.serialNumbers.map((serialNumber) => serialNumber.trim()),
    location: data.location,
    purchaseDate: data.purchaseDate,
    purchasePrice: data.purchasePrice,
    purchaseVendor: data.purchaseVendor,
    warrantyExpiredAt: data.warrantyExpiredAt,
    memberIds,
    departmentId: data.departmentId,
    usedStartedAt: data.usedStartedAt,
    returnDueDate: data.returnDueDate,
  })
}

function toIntangibleAssetRegisterBody(data: PurchasePlanIntangibleAssetRegisterRequest) {
  const licenseCodes = data.licenseCodes?.map((licenseCode) => licenseCode.trim()).filter(Boolean)
  const normalizedMemberIds = data.memberIds
    ?.map((rowMemberIds) => rowMemberIds.map((memberId) => memberId.trim()).filter(Boolean))
  const memberIds = normalizedMemberIds?.every((rowMemberIds) => rowMemberIds.length > 0)
    ? normalizedMemberIds
    : undefined

  return compactPurchaseAssetRegisterBody({
    licenseCodes,
    seatCount: data.seatCount,
    isAutoRenewal: data.isAutoRenewal ? 1 : 0,
    purchaseDate: data.purchaseDate,
    purchasePrice: data.purchasePrice,
    purchaseVendor: data.purchaseVendor,
    memberIds,
    departmentId: data.departmentId,
    startedAt: data.startedAt,
    expiredAt: data.expiredAt,
    billingCycle: data.billingCycle,
  })
}

function pickPlanItemCategory(item: PurchasePlanItemResponse) {
  return item.category
    ?? item.categoryName
    ?? item.assetCategoryName
    ?? item.assetCategory?.categoryName
    ?? item.assetCategory?.name
    ?? item.assetItem?.categoryName
    ?? item.assetItem?.category
    ?? item.assetItemCategory
    ?? item.assetItemCategoryName
    ?? item.itemCategory
    ?? item.itemCategoryName
    ?? item.tangibleCategoryName
    ?? item.intangibleCategoryName
    ?? '-'
}

function normalizeRegisteredAssetCount(item: PurchasePlanItemResponse) {
  const count =
    item.registeredCount
    ?? item.registeredAssetCount
    ?? item.assetRegisteredCount
    ?? item.registeredQuantity
    ?? item.registeredAssetQuantity
    ?? 0
  return Number(count || 0)
}

function normalizePlanItemStandard(item: PurchasePlanItemResponse) {
  const value = (item as unknown as Record<string, unknown>).isStandard
  if (value === false || value === 0) return false
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'false' || normalized === '0') return false
  }
  return true
}

function pickPurchasePlanItemId(item: PurchasePlanItemResponse) {
  return item.itemId
    ?? item.purchasePlanItemId
    ?? item.purchasePlanItemDetailId
    ?? item.purchaseItemId
    ?? item.planItemId
    ?? item.planPurchaseItemId
}

function normalizePlanDetail(data: PurchasePlanDetailResponse): PurchasePlanDetail {
  const purchaseRequestStatus = normalizePurchasePlanStatus(data as unknown as Record<string, unknown>)

  return {
    ...data,
    purchaseRequestStatus,
    status: purchaseRequestStatus,
    actualAmount: toNullableNumber(data.actualAmount),
    receivedAt: data.receivedAt ?? null,
    deliveredAt: data.deliveredAt ?? null,
    items: Array.isArray(data.items)
      ? data.items.map((item) => normalizePlanItem(item as PurchasePlanItemResponse))
      : [],
  }
}

function formatPurchasePlanItemName(firstItemName: string | null | undefined, itemCount: number) {
  const normalizedName = firstItemName?.trim() || '-'
  if (/\s외\s\d+종$/.test(normalizedName)) return normalizedName
  const extraCount = Math.max(Number(itemCount || 0) - 1, 0)
  return extraCount > 0 ? `${normalizedName} 외 ${extraCount}종` : normalizedName
}

function normalizeListItem(item: PurchasePlanListItemResponse): PurchasePlanListItem {
  const itemCount = Number(item.itemCount ?? item.items?.length ?? 0)
  const firstItemName = item.itemName
    ?? item.itemSummary
    ?? item.items?.[0]?.itemName
    ?? item.items?.[0]?.productName
    ?? item.items?.[0]?.name
    ?? '-'
  const itemName = formatPurchasePlanItemName(firstItemName, itemCount)

  const purchaseRequestStatus = normalizePurchasePlanStatus(item as unknown as Record<string, unknown>)

  return {
    ...item,
    itemName,
    itemSummary: itemName,
    itemCount,
    createdAt: item.createdAt ?? item.created_at ?? '',
    updatedAt: item.updatedAt ?? item.updated_at ?? '',
    estimatedAmount: Number(item.estimatedAmount ?? 0),
    purchaseRequestStatus,
    status: purchaseRequestStatus,
  }
}

function normalizePlanPage(data: PurchasePlanPage | PurchasePlanListItem[]): PurchasePlanPage {
  if (Array.isArray(data)) {
    const content = data.map((item) => normalizeListItem(item as PurchasePlanListItemResponse))
    return {
      content,
      page: 0,
      size: content.length,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
    }
  }

  const content = Array.isArray(data.content)
    ? data.content.map((item) => normalizeListItem(item as PurchasePlanListItemResponse))
    : []

  return {
    ...data,
    content,
    totalElements: Number(data.totalElements ?? content.length ?? 0),
    totalPages: Number(data.totalPages ?? 0),
  }
}

export const purchaseApi = {
  getPlans: async (params?: PurchasePlanListFilter) => {
    const response = await api.get<PurchasePlanPage | PurchasePlanListItem[]>(
      '/purchase-plans',
      toQueryParams(params),
    )
    return {
      ...response,
      data: normalizePlanPage(response.data),
    }
  },

  createPlan: (data: PurchasePlanCreateRequest) =>
    api.post<PurchasePlanCreateResponse>('/purchase-plans', data),

  getStatistics: () =>
    api.get<PurchasePlanStatistics>('/purchase-plans/statistics'),

  getPlanDetail: async (planId: number | string) => {
    const response = await api.get<PurchasePlanDetail>(`/purchase-plans/${planId}`)
    return {
      ...response,
      data: normalizePlanDetail(response.data),
    }
  },

  deletePlan: (planId: number | string) =>
    api.delete<Record<string, never>>(`/purchase-plans/${planId}`),

  changePlanStatus: (planId: number | string, data: PurchasePlanStatusChangeRequest) =>
    api.patch<PurchasePlanDetail>(`/purchase-plans/${planId}/status`, data),

  updatePurchaseResult: async (
    planId: number | string,
    data: PurchasePlanPurchaseResultRequest,
  ) => {
    const response = await api.patch<PurchasePlanDetail>(
      `/purchase-plans/${planId}/purchase-result`,
      data,
    )
    return {
      ...response,
      data: normalizePlanDetail(response.data as PurchasePlanDetailResponse),
    }
  },

  confirmDelivery: (planId: number | string, itemId: number | string) =>
    api.patch<PurchasePlanItem>(`/purchase-plans/${planId}/items/${itemId}/confirm`),

  registerPlanItem: (
    planId: number | string,
    itemId: number | string,
    data: PurchasePlanItemRegisterRequest,
  ) =>
    api.post<null>(`/purchase-plans/${planId}/items/${itemId}`, data),

  registerAssets: (
    planId: number | string,
    itemId: number | string,
    assetType: 'TANGIBLE' | 'INTANGIBLE',
    data: PurchasePlanTangibleAssetRegisterRequest | PurchasePlanIntangibleAssetRegisterRequest,
  ) => {
    const assetPath = assetType === 'TANGIBLE' ? 'tangible-assets' : 'intangible-assets'
    const body = assetType === 'TANGIBLE'
      ? toTangibleAssetRegisterBody(data as PurchasePlanTangibleAssetRegisterRequest)
      : toIntangibleAssetRegisterBody(data as PurchasePlanIntangibleAssetRegisterRequest)

    return api.post<Record<string, unknown>>(
      `/purchase-plans/${planId}/items/${itemId}/${assetPath}`,
      body,
    )
  },

  uploadPlanItemEvidence: (planId: number | string, itemId: string, file: File) => {
    void planId
    return fileApi.upload({ file, targetType: 'PURCHASE_PLAN_ITEM', targetId: itemId })
  },

  getPlanItemEvidenceFiles: (itemId: number | string) =>
    fileApi.getFiles({ targetType: 'PURCHASE_PLAN_ITEM', targetId: itemId }),

  deletePlanItemEvidenceFile: (fileId: number | string) =>
    fileApi.deleteFile(fileId),

  getPolicy: () =>
    api.get<PurchasePolicy>('/purchase-policies'),

  updatePolicy: (data: PurchasePolicyUpdateRequest) =>
    api.put<PurchasePolicyUpdateResponse>('/purchase-policies', data),
}
