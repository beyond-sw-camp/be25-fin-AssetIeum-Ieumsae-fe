import api from './client'
import type {
  TangibleAssetItem,
  TangibleAssetItemCreateRequest,
  TangibleAsset,
  TangibleAssetCreateRequest,
  TangibleAssetListFilter,
  IntangibleItem,
  IntangibleAsset,
  IntangibleAssetCreateRequest,
  IntangibleAssetListFilter,
  PageResponse,
} from '@/types'

// ─── 유형자산 품목 API ───────────────────────────────────────────────────────

export const tangibleItemApi = {
  /** 유형자산 품목 목록 조회 */
  getList: (params?: { page?: number; size?: number; keyword?: string }) =>
    api.get<PageResponse<TangibleAssetItem>>('/assets/tangible/items', params as Record<string, unknown>),

  /** 유형자산 품목 상세 조회 */
  getDetail: (assetItemId: number) =>
    api.get<TangibleAssetItem>(`/assets/tangible/items/${assetItemId}`),

  /** 유형자산 품목 등록 */
  create: (body: TangibleAssetItemCreateRequest) =>
    api.post<TangibleAssetItem>('/assets/tangible/items', body),

  /** 유형자산 품목 삭제 */
  delete: (assetItemId: number) =>
    api.delete(`/assets/tangible/items/${assetItemId}`),

  /** 유형자산 품목 일괄 등록 (CSV/Excel) */
  bulkCreate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload('/assets/tangible/items/bulk', formData)
  },
}

// ─── 유형자산 API ────────────────────────────────────────────────────────────

export const tangibleAssetApi = {
  /** 유형자산 목록 조회 */
  getList: (params?: TangibleAssetListFilter) =>
    api.get<PageResponse<TangibleAsset>>('/assets/tangible', params as Record<string, unknown>),

  /** 유형자산 상세 조회 */
  getDetail: (assetId: number) =>
    api.get<TangibleAsset>(`/assets/tangible/${assetId}`),

  /** 유형자산 등록 */
  create: (body: TangibleAssetCreateRequest) =>
    api.post<TangibleAsset>('/assets/tangible', body),

  /** 유형자산 상태 변경 */
  changeStatus: (assetId: number, status: string) =>
    api.patch(`/assets/tangible/${assetId}/status`, { status }),

  /** 유형자산 폐기 처리 */
  discard: (assetId: number) =>
    api.patch(`/assets/tangible/${assetId}/discard`),

  /** QR 코드 조회 */
  getQrCode: (assetId: number) =>
    api.get<{ assetId: number; qrCodeUrl: string }>(`/assets/tangible/${assetId}/qr`),
}

// ─── 무형자산 품목 API ───────────────────────────────────────────────────────

export const intangibleItemApi = {
  /** 무형자산 품목 목록 조회 */
  getList: (params?: { page?: number; size?: number; category?: string; keyword?: string }) =>
    api.get<PageResponse<IntangibleItem>>('/assets/intangible/items', params as Record<string, unknown>),

  /** 무형자산 품목 카테고리 목록 조회 */
  getCategories: () =>
    api.get<string[]>('/assets/intangible/categories'),

  /** 무형자산 품목 상세 조회 */
  getDetail: (assetItemId: number) =>
    api.get<IntangibleItem>(`/assets/intangible/items/${assetItemId}`),

  /** 무형자산 품목 등록 */
  create: (body: Omit<IntangibleItem, 'assetItemId'>) =>
    api.post<IntangibleItem>('/assets/intangible/items', body),

  /** 무형자산 품목 삭제 */
  delete: (assetItemId: number) =>
    api.delete(`/assets/intangible/items/${assetItemId}`),
}

// ─── 무형자산 API ────────────────────────────────────────────────────────────

export const intangibleAssetApi = {
  /** 무형자산 목록 조회 */
  getList: (params?: IntangibleAssetListFilter) =>
    api.get<PageResponse<IntangibleAsset>>('/assets/intangible', params as Record<string, unknown>),

  /** 무형자산 상세 조회 */
  getDetail: (assetId: number) =>
    api.get<IntangibleAsset>(`/assets/intangible/${assetId}`),

  /** 무형자산 등록 */
  create: (body: IntangibleAssetCreateRequest) =>
    api.post<IntangibleAsset>('/assets/intangible', body),

  /** 무형자산 해지 처리 */
  terminate: (assetId: number) =>
    api.patch(`/assets/intangible/${assetId}/terminate`),
}
