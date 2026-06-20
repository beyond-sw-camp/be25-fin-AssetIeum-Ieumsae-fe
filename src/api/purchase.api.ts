import { api } from './client'
import type {
  PurchasePlanCreateRequest,
  PurchasePlanCreateResponse,
  PurchasePlanDetail,
  PurchasePlanIntangibleAssetRegisterRequest,
  PurchasePlanItem,
  PurchasePlanListFilter,
  PurchasePlanListItem,
  PurchasePlanPage,
  PurchasePlanStatistics,
  PurchasePlanStatusChangeRequest,
  PurchasePlanTangibleAssetRegisterRequest,
  PurchasePolicyUpdateRequest,
  PurchasePolicyUpdateResponse,
  PurchasePolicy,
} from '@/types/purchase'

type PurchasePlanItemResponse = PurchasePlanItem & {
  productName?: string | null
  name?: string | null
  categoryName?: string | null
  purchasePlanItemId?: number | string
  purchaseItemId?: number | string
  planItemId?: number | string
  purchaseRequestItemId?: number | string
  id?: number | string
  unitPrice?: number
  estimatedAmount?: number
  ticketRequesterId?: number | string | null
  ticketRequesterName?: string | null
  ticketDepartmentId?: number | string | null
  ticketDepartmentName?: string | null
}

type PurchasePlanListItemResponse = PurchasePlanListItem & {
  itemName?: string | null
  itemSummary?: string | null
  items?: PurchasePlanItemResponse[]
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

  return {
    ...item,
    itemId:
      item.itemId
      ?? item.purchasePlanItemId
      ?? item.purchaseItemId
      ?? item.planItemId
      ?? item.purchaseRequestItemId
      ?? item.id,
    category: item.category ?? item.categoryName ?? '-',
    itemName: item.itemName ?? item.productName ?? item.name ?? '-',
    quantity,
    estimatedUnitPrice,
    totalAmount,
  }
}

function normalizePlanDetail(data: PurchasePlanDetail): PurchasePlanDetail {
  return {
    ...data,
    purchaseRequestStatus: data.purchaseRequestStatus ?? data.status ?? 'REQUESTED',
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

  return {
    ...item,
    itemName,
    itemSummary: itemName,
    itemCount,
    estimatedAmount: Number(item.estimatedAmount ?? 0),
    purchaseRequestStatus: item.purchaseRequestStatus ?? item.status ?? 'REQUESTED',
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
  // TODO: 백엔드 구현 완료 후 구매 계획 후보 티켓 조회 API 연결
  // GET /purchase-plans/candidate-tickets?page={page}&size={size}
  // 현재 구매 계획 생성 화면은 ticketApi.getList({ ticketStatus: 'ASSET_APPROVED' }) 후 프론트 필터링을 사용한다.
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
