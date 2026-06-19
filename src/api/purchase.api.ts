import { api } from './client'
import type {
  PurchasePlanCreateRequest,
  PurchasePlanCreateResponse,
  PurchasePlanDetail,
  PurchasePlanItem,
  PurchasePlanListFilter,
  PurchasePlanListItem,
  PurchasePlanPage,
  PurchasePlanStatistics,
  PurchasePlanStatusChangeRequest,
  PurchasePolicyUpdateRequest,
  PurchasePolicyUpdateResponse,
} from '@/types/purchase'

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


function normalizePlanPage(data: PurchasePlanPage | PurchasePlanListItem[]): PurchasePlanPage {
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    }
  }

  return {
    ...data,
    content: Array.isArray(data.content) ? data.content : [],
    totalElements: Number(data.totalElements ?? data.content?.length ?? 0),
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

  getPlanDetail: (planId: number | string) =>
    api.get<PurchasePlanDetail>(`/purchase-plans/${planId}`),

  deletePlan: (planId: number | string) =>
    api.delete<Record<string, never>>(`/purchase-plans/${planId}`),

  changePlanStatus: (planId: number | string, data: PurchasePlanStatusChangeRequest) =>
    api.patch<PurchasePlanDetail>(`/purchase-plans/${planId}/status`, data),

  confirmDelivery: (planId: number | string, itemId: number | string) =>
    api.patch<PurchasePlanItem>(`/purchase-plans/${planId}/items/${itemId}/confirm`),

  updatePolicy: (data: PurchasePolicyUpdateRequest) =>
    api.put<PurchasePolicyUpdateResponse>('/purchase-policies', data),
}
