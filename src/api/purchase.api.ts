import { api } from './client'
import type {
  PurchasePlanCreateRequest,
  PurchasePlanCreateResponse,
  PurchasePlanDetail,
  PurchasePlanListFilter,
  PurchasePlanPage,
  PurchasePlanStatistics,
  PurchasePlanStatusChangeRequest,
  PurchasePolicyUpdateRequest,
  PurchasePolicyUpdateResponse,
} from '@/types/purchase'

function toQueryParams(params?: PurchasePlanListFilter): Record<string, unknown> | undefined {
  return params ? { ...params } : undefined
}

export const purchaseApi = {
  getPlans: (params?: PurchasePlanListFilter) =>
    api.get<PurchasePlanPage>('/purchase-plans', toQueryParams(params)),

  getPlanStatistics: () =>
    api.get<PurchasePlanStatistics>('/purchase-plans/statistics'),

  createPlan: (data: PurchasePlanCreateRequest) =>
    api.post<PurchasePlanCreateResponse>('/purchase-plans', data),

  getPlanDetail: (planId: number) =>
    api.get<PurchasePlanDetail>(`/purchase-plans/${planId}`),

  deletePlan: (planId: number) =>
    api.delete<Record<string, never>>(`/purchase-plans/${planId}`),

  changePlanStatus: (planId: number, data: PurchasePlanStatusChangeRequest) =>
    api.patch<PurchasePlanDetail>(`/purchase-plans/${planId}/status`, data),

  confirmDelivery: (planId: number, itemId: number | string) =>
    api.get<Record<string, never>>(`/purchase-plans/${planId}/items/${itemId}/confirm`),

  updatePolicy: (data: PurchasePolicyUpdateRequest) =>
    api.put<PurchasePolicyUpdateResponse>('/purchase-policies', data),
}
