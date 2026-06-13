import api from './client'
import type {
  TangibleAssetItem,
  TangibleAssetItemCreateRequest,
  TangibleAssetItemUpdateRequest,
  TangibleAssetCategoryCreateRequest,
  TangibleAssetCategoryDeleteResponse,
  TangibleAssetCategoryResponse,
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

function compactParams<T extends object>(params?: T) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

function compactBody<T extends object>(body: T) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
  )
}

function toLocalDateTime(value?: string | null) {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

const toBoolean = (value: number | boolean | undefined) => {
  if (typeof value === 'number') return value === 1
  return value
}

const toTangibleItemCreateBody = (body: TangibleAssetItemCreateRequest) => compactBody({
  categoryId: body.categoryId,
  productName: body.productName ?? body.name ?? body.assetName ?? body.itemCode ?? body.itemNo,
  manufacturer: body.manufacturer,
  modelName: body.modelName,
  isStandard: toBoolean(body.isStandard),
})

const toTangibleItemUpdateBody = (body: TangibleAssetItemUpdateRequest) => compactBody({
  categoryId: body.categoryId,
  productName: body.productName ?? body.name ?? body.assetName ?? body.itemCode,
  manufacturer: body.manufacturer,
  modelName: body.modelName,
  isStandard: toBoolean(body.isStandard),
})

const toTangibleAssetCreateBody = (body: TangibleAssetCreateRequest) => compactBody({
  tangibleItemId: body.tangibleItemId ?? body.assetItemId,
  serialNumber: body.serialNumber ?? body.serialNo,
  usageType: body.usageType,
  assetUsageType: body.assetUsageType,
  tangibleAssetStatus: body.tangibleAssetStatus ?? body.status,
  memberId: body.memberId ?? body.assignedMemberId,
  departmentId: body.departmentId,
  location: body.location,
  usedStartedAt: toLocalDateTime(body.usedStartedAt ?? body.startedAt),
  returnDueDate: toLocalDateTime(body.returnDueDate),
  purchaseDate: toLocalDateTime(body.purchaseDate),
  warrantyExpiredAt: toLocalDateTime(body.warrantyExpiredAt),
  purchasePrice: body.purchasePrice,
  purchaseVendor: body.purchaseVendor ?? body.vendor,
})

const toTangibleAssetUpdateBody = (body: TangibleAssetUpdateRequest) => compactBody({
  tangibleAssetStatus: body.tangibleAssetStatus ?? body.tangibleAssetstatus ?? body.status,
  memberId: body.memberId ?? body.assignedMemberId,
  departmentId: body.departmentId,
  location: body.location,
  usedStartedAt: toLocalDateTime(body.usedStartedAt ?? body.startedAt),
  returnDueDate: toLocalDateTime(body.returnDueDate),
  usageType: body.usageType,
})

// ─── 유형자산 품목 API ───────────────────────────────────────────────────────

export const tangibleItemApi = {
  /** 유형자산 품목 목록 조회 */
  getList: (params?: {
    page?: number
    size?: number
    categoryId?: string
    categoryName?: string
    keyword?: string
  }) =>
    api.get<PageResponse<TangibleAssetItem>>('/tangible-asset/items', compactParams(params)),

  /** 유형자산 품목 카테고리 목록 조회 */
  getCategories: () =>
    api.get<TangibleCategoryGroup[]>('/tangible-asset/categories'),

  /** 유형자산 카테고리 등록 */
  createCategory: (body: TangibleAssetCategoryCreateRequest) =>
    api.post<TangibleAssetCategoryResponse>('/tangible-asset/categories', body),

  /** 유형자산 카테고리 삭제 */
  deleteCategory: (categoryId: string) =>
    api.delete<TangibleAssetCategoryDeleteResponse>(`/tangible-asset/categories/${categoryId}`),

  // TODO: 카테고리 수정 API 명세 확인 필요

  /** 유형자산 품목 등록 */
  create: (body: TangibleAssetItemCreateRequest) =>
    api.post<TangibleAssetItem>('/tangible-asset/items', toTangibleItemCreateBody(body)),

  /** 유형자산 품목 수정 */
  update: (itemId: string, body: TangibleAssetItemUpdateRequest) =>
    api.patch<TangibleAssetItem>(`/tangible-asset/items/${itemId}`, toTangibleItemUpdateBody(body)),

  /** 유형자산 품목 삭제 */
  delete: (itemId: string) =>
    api.delete(`/tangible-asset/items/${itemId}`),
}

// ─── 유형자산 API ────────────────────────────────────────────────────────────

export const tangibleAssetApi = {
  /** 유형자산 등록 */
  create: (body: TangibleAssetCreateRequest) =>
    api.post<TangibleAsset>('/tangible-asset/assets', toTangibleAssetCreateBody(body)),

  /** 유형자산 목록 조회 */
  getList: (params?: TangibleAssetListFilter) =>
    api.get<PageResponse<TangibleAsset>>('/tangible-asset/assets', compactParams(params)),

  /** 유형자산 상세 조회 */
  getDetail: (assetId: string) =>
    api.get<TangibleAsset>(`/tangible-asset/assets/${assetId}`),

  /** 유형자산 수정 */
  update: (assetId: string, body: TangibleAssetUpdateRequest) =>
    api.patch<TangibleAsset>(`/tangible-asset/assets/${assetId}`, toTangibleAssetUpdateBody(body)),
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
