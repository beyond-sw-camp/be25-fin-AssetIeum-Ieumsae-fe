import api from './client'
import type {
  TangibleAssetItem,
  TangibleAssetItemCreateRequest,
  TangibleAssetItemUpdateRequest,
  TangibleCategoryGroup,
  TangibleAsset,
  TangibleAssetCreateRequest,
  TangibleAssetUpdateRequest,
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
  getList: (params?: { page?: number; size?: number; categoryName?: string; keyword?: string }) =>
    api.get<PageResponse<TangibleAssetItem>>('/tangible-asset/items', {
      ...params,
      categoryName: params?.categoryName ?? '',
      keyword: params?.keyword ?? '',
    }),

  /** 유형자산 품목 카테고리 목록 조회 */
  getCategories: () =>
    api.get<TangibleCategoryGroup[]>('/tangible-asset/categories'),

  // TODO: 카테고리 수정/삭제 API 명세 확인 필요

  /** 유형자산 품목 상세 조회 */
  getDetail: (itemId: string) =>
    api.get<TangibleAssetItem>(`/tangible-asset/items/${itemId}`),

  /** 유형자산 품목 등록 */
  create: (body: TangibleAssetItemCreateRequest) =>
    api.post<TangibleAssetItem>('/tangible-asset/items', body),

  /** 유형자산 품목 수정 */
  update: (itemId: string, body: TangibleAssetItemUpdateRequest) =>
    api.patch<TangibleAssetItem>(`/tangible-asset/items/${itemId}`, body),

  /** 유형자산 품목 삭제 */
  delete: (itemId: string) =>
    api.delete(`/tangible-asset/items/${itemId}`),

  /** 유형자산 품목 일괄 등록 (CSV/Excel) */
  bulkCreate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload('/tangible-asset/items/bulk', formData)
  },
}

// ─── 유형자산 API ────────────────────────────────────────────────────────────

export const tangibleAssetApi = {
  /** 유형자산 목록 조회 */
  getList: (params?: TangibleAssetListFilter) =>
    api.get<PageResponse<TangibleAsset>>('/tangible-asset/assets', {
      ...params,
      categoryName: params?.categoryName ?? '',
      keyword: params?.keyword ?? '',
    }),

  /** 유형자산 상세 조회 */
  getDetail: (assetId: string) =>
    api.get<TangibleAsset>(`/tangible-asset/assets/${assetId}`),

  /** 유형자산 등록 */
  create: (body: TangibleAssetCreateRequest) =>
    api.post<TangibleAsset>('/tangible-asset/assets', body),

  /** 유형자산 수정 */
  update: (assetId: string, body: TangibleAssetUpdateRequest) =>
    api.patch<TangibleAsset>(`/tangible-asset/assets/${assetId}`, body),
}

// ─── 무형자산 품목 API ───────────────────────────────────────────────────────

export const intangibleItemApi = {
  /** 무형자산 품목 목록 조회 */
  getList: (params?: { page?: number; size?: number; category?: string; keyword?: string }) =>
    api.get<PageResponse<IntangibleItem>>('intangible-asset/items', params as Record<string, unknown>),

  /** 무형자산 품목 카테고리 목록 조회 */
  getCategories: () =>
    api.get<string[]>('intangible-asset/categories'),

  /** 무형자산 품목 상세 조회 */
  getDetail: (itemId: number) =>
    api.get<IntangibleItem>(`intangible-asset/items/${itemId}`),

  /** 무형자산 품목 등록 */
  create: (body: Omit<IntangibleItem, 'itemId'>) =>
    api.post<IntangibleItem>('intangible-asset/items/', body),

  /** 무형자산 품목 일괄 등록 (CSV/Excel) */
  bulkCreate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload('/assets/intangible/items/bulk', formData)
  },

  /** 무형자산 품목 삭제 */
  delete: (itemId: string) =>
    api.delete(`intangible-asset/items/${itemId}`),
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

  /** 무형자산 일괄 등록 (CSV/Excel) */
  bulkCreate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload('/assets/intangible/bulk', formData)
  },
}
