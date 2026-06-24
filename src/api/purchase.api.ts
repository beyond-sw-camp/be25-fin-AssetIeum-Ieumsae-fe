import { api } from './client'
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
  purchasePlanItemId?: number | string
  purchasePlanItemDetailId?: number | string
  purchasePlanItemDetailID?: number | string
  purchase_plan_item_detail_id?: number | string
  purchasePlanItemDetail_id?: number | string
  purchasePlanItemID?: number | string
  purchase_plan_item_id?: number | string
  purchasePlanItem_id?: number | string
  purchaseItemId?: number | string
  purchase_item_id?: number | string
  planItemId?: number | string
  plan_item_id?: number | string
  purchaseRequestItemId?: number | string
  purchase_request_item_id?: number | string
  purchasePlanId?: number | string
  purchaseId?: number | string
  purchase_id?: number | string
  planPurchaseItemId?: number | string
  plan_purchase_item_id?: number | string
  purchasePlanItemNo?: number | string
  itemNo?: number | string
  id?: number | string
  unitPrice?: number
  estimatedAmount?: number
  actual_amount?: number | null
  actual_unit_price?: number | null
  actualPrice?: number | null
  purchasePrice?: number | null
  received_at?: string | null
  registeredCount?: number | null
  registeredAssetCount?: number | null
  assetRegisteredCount?: number | null
  registeredQuantity?: number | null
  registeredAssetQuantity?: number | null
  ticketRequesterId?: number | string | null
  ticketRequesterName?: string | null
  requesterId?: number | string | null
  requesterName?: string | null
  ticketDepartmentId?: number | string | null
  ticketDepartmentName?: string | null
  departmentId?: number | string | null
  departmentName?: string | null
}

type PurchasePlanListItemResponse = PurchasePlanListItem & {
  itemName?: string | null
  itemSummary?: string | null
  items?: PurchasePlanItemResponse[]
}

type PurchasePlanDetailResponse = PurchasePlanDetail & {
  actual_amount?: number | null
  received_at?: string | null
  delivered_at?: string | null
}

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
      ?? item.actual_unit_price
      ?? item.actualPrice
      ?? item.purchasePrice,
  )
  const actualAmount = toNullableNumber(item.actualAmount ?? item.actual_amount)

  return {
    ...item,
    itemId,
    category: pickPlanItemCategory(item),
    itemName: item.itemName ?? item.productName ?? item.name ?? '-',
    quantity,
    estimatedUnitPrice,
    totalAmount,
    receivedAt: item.receivedAt ?? item.received_at ?? null,
    actualAmount,
    actualUnitPrice,
    registeredCount: normalizeRegisteredAssetCount(item),
    ticketRequesterId: item.ticketRequesterId ?? item.requesterId ?? null,
    ticketRequesterName: item.ticketRequesterName ?? item.requesterName ?? null,
    ticketDepartmentId: item.ticketDepartmentId ?? item.departmentId ?? null,
    ticketDepartmentName: item.ticketDepartmentName ?? item.departmentName ?? null,
  }
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
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

function pickPurchasePlanItemId(item: PurchasePlanItemResponse) {
  return item.itemId
    ?? item.purchasePlanItemId
    ?? item.purchasePlanItemDetailId
    ?? item.purchasePlanItemDetailID
    ?? item.purchase_plan_item_detail_id
    ?? item.purchasePlanItemDetail_id
    ?? item.purchasePlanItemID
    ?? item.purchase_plan_item_id
    ?? item.purchasePlanItem_id
    ?? item.purchaseItemId
    ?? item.purchase_item_id
    ?? item.planItemId
    ?? item.plan_item_id
    ?? item.purchaseRequestItemId
    ?? item.purchase_request_item_id
    ?? item.purchasePlanId
    ?? item.purchaseId
    ?? item.purchase_id
    ?? item.planPurchaseItemId
    ?? item.plan_purchase_item_id
    ?? item.purchasePlanItemNo
    ?? item.itemNo
    ?? item.id
}

function normalizePlanDetail(data: PurchasePlanDetailResponse): PurchasePlanDetail {
  const purchaseRequestStatus = normalizePurchasePlanStatus(data as unknown as Record<string, unknown>)

  return {
    ...data,
    purchaseRequestStatus,
    status: purchaseRequestStatus,
    actualAmount: toNullableNumber(data.actualAmount ?? data.actual_amount),
    receivedAt: data.receivedAt ?? data.received_at ?? null,
    deliveredAt: data.deliveredAt ?? data.delivered_at ?? null,
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
    itemId: number | string | null,
    data: PurchasePlanTangibleAssetRegisterRequest | PurchasePlanIntangibleAssetRegisterRequest,
  ) => {
    const assetPath = 'serialNumbers' in data ? 'tangible-assets' : 'intangible-assets'
    const itemPath = itemId ? `/items/${itemId}` : ''
    return api.post<Record<string, unknown>>(
      `/purchase-plans/${planId}${itemPath}/${assetPath}`,
      data,
    )
  },

  getPolicy: () =>
    api.get<PurchasePolicy>('/purchase-policies'),

  updatePolicy: (data: PurchasePolicyUpdateRequest) =>
    api.put<PurchasePolicyUpdateResponse>('/purchase-policies', data),
}
