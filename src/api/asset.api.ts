import api from './client'
import type {
  TangibleAssetItem,
  TangibleAssetItemCreateRequest,
  TangibleAssetItemUpdateRequest,
  TangibleAssetCategoryCreateRequest,
  TangibleAssetCategoryDeleteResponse,
  TangibleAssetCategoryResponse,
  TangibleCategoryGroup,
  IntangibleAssetCategoryCreateRequest,
  IntangibleAssetCategoryDeleteResponse,
  IntangibleAssetCategoryResponse,
  IntangibleAssetItemCreateRequest,
  IntangibleAssetItemUpdateRequest,
  IntangibleCategoryGroup,
  TangibleAsset,
  TangibleAssetCreateRequest,
  TangibleAssetUpdateRequest,
  TangibleAssetListFilter,
  IntangibleItem,
  IntangibleAsset,
  IntangibleAssetCreateRequest,
  IntangibleAssetUpdateRequest,
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

export type TangibleAssetAssignmentStatus = 'ACTIVE' | 'ENDED' | 'ASSIGNED' | 'RETURNED' | 'CANCELED' | 'EXPIRED' | string
export type TangibleAssetAssignmentUsageType = 'TEMPORARY' | 'PERMANENT' | string
export type TangibleAssetAssignmentAssetUsageType = 'PERSONAL' | 'DEPARTMENT' | string

export interface TangibleAssetAssignmentRequest {
  memberId: string
  usageType: TangibleAssetAssignmentUsageType
  assetUsageType: TangibleAssetAssignmentAssetUsageType
  endedAt?: string | null
}

export interface TangibleAssetReassignmentRequest {
  newMemberId: string
}

export interface TangibleAssetReassignBulkRequest {
  currentMemberId: string
  newMemberId: string
}

export interface TangibleAssetAssignmentResponse extends Record<string, unknown> {
  assignmentId: string
  memberName: string
  memberNo: string
  departmentName: string
  assignmentType: TangibleAssetAssignmentUsageType
  assignedAt: string
  endedAt?: string | null
  assignmentStatus: TangibleAssetAssignmentStatus
}

export type IntangibleAssetAssignmentStatus = 'ACTIVE' | 'ENDED' | 'ASSIGNED' | 'RETURNED' | 'CANCELED' | 'EXPIRED' | string

export interface IntangibleAssetAssignmentRequest {
  memberId: string
  endedAt?: string | null
}

export interface IntangibleAssetCancelRequest {
  memberId?: string | null
}

export interface IntangibleAssetAssignmentResponse extends Record<string, unknown> {
  assignmentId: string
  memberId?: string
  memberName: string
  memberNo: string
  departmentId?: string
  departmentName: string
  assignedAt: string
  endedAt?: string | null
  assignmentStatus: IntangibleAssetAssignmentStatus
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

const toTangibleAssetAssignmentBody = (body: TangibleAssetAssignmentRequest) => compactBody({
  memberId: body.memberId,
  usageType: body.usageType,
  assetUsageType: body.assetUsageType,
  endedAt: toLocalDateTime(body.endedAt),
})

const toIntangibleAssetAssignmentBody = (body: IntangibleAssetAssignmentRequest) => compactBody({
  memberId: body.memberId,
  endedAt: toLocalDateTime(body.endedAt),
})

const toIntangibleItemBody = (body: IntangibleAssetItemCreateRequest | IntangibleAssetItemUpdateRequest) => compactBody({
  categoryId: body.categoryId,
  productName: body.productName,
  licenseType: body.licenseType,
  provider: body.provider ?? body.vendor,
  isStandard: toBoolean(body.isStandard),
})

const toIntangibleAssetCreateBody = (body: IntangibleAssetCreateRequest) => compactBody({
  intangibleItemId: body.intangibleItemId,
  licenseCode: body.licenseCode,
  seatCount: body.seatCount,
  isAutoRenewal: body.isAutoRenewal,
  purchaseDate: toLocalDateTime(body.purchaseDate),
  purchasePrice: body.purchasePrice,
  purchaseVendor: body.purchaseVendor,
  intangibleAssetStatus: body.intangibleAssetStatus,
  memberId: body.memberId,
  departmentId: body.departmentId,
  startedAt: toLocalDateTime(body.startedAt),
  expiredAt: toLocalDateTime(body.expiredAt),
  billingCycle: body.billingCycle,
})

const toIntangibleAssetUpdateBody = (body: Partial<IntangibleAssetUpdateRequest>) => compactBody({
  intangibleAssetStatus: body.intangibleAssetStatus,
  seatCount: body.seatCount,
  isAutoRenewal: toBoolean(body.isAutoRenewal),
  startedAt: toLocalDateTime(body.startedAt),
  expiredAt: toLocalDateTime(body.expiredAt),
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
    assetUsageType?: 'DEPARTMENT' | 'PERSONAL'
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

  /** 유형자산 배정 이력 조회 */
  getAssignments: (assetId: string, params?: { assignmentStatus?: TangibleAssetAssignmentStatus }) =>
    api.get<TangibleAssetAssignmentResponse[]>(
      `/tangible-asset/assets/${assetId}/assignments`,
      compactParams(params),
    ),

  /** 유형자산 배정 */
  assign: (assetId: string, body: TangibleAssetAssignmentRequest) =>
    api.post<TangibleAssetAssignmentResponse>(
      `/tangible-asset/assets/${assetId}/assign`,
      toTangibleAssetAssignmentBody(body),
    ),

  /** 유형자산 반납/해지 */
  returnAsset: (assetId: string) =>
    api.post<TangibleAssetAssignmentResponse>(`/tangible-asset/assets/${assetId}/return`),

  /** 유형자산 사용자 변경 */
  reassign: (assetId: string, body: TangibleAssetReassignmentRequest) =>
    api.post<TangibleAssetAssignmentResponse>(`/tangible-asset/assets/${assetId}/reassign`, body),

  /** 유형자산 사용자 일괄 변경 */
  reassignBulk: (body: TangibleAssetReassignBulkRequest) =>
    api.post<TangibleAssetAssignmentResponse[]>('/tangible-asset/assets/reassign-bulk', body),
}

// ─── 무형자산 품목 API ───────────────────────────────────────────────────────

export const intangibleItemApi = {
  /** 무형자산 품목 목록 조회 */
  getList: (params?: { page?: number; size?: number; category?: string; categoryId?: string; keyword?: string }) =>
    api.get<PageResponse<IntangibleItem>>('/intangible-asset/items', compactParams(params)),

  /** 무형자산 품목 카테고리 목록 조회 */
  getCategories: () =>
    api.get<IntangibleCategoryGroup[] | string[]>('/intangible-asset/categories'),

  /** 무형자산 카테고리 등록 */
  createCategory: (body: IntangibleAssetCategoryCreateRequest) =>
    api.post<IntangibleAssetCategoryResponse>('/intangible-asset/categories', compactBody(body)),

  /** 무형자산 카테고리 삭제 */
  deleteCategory: (categoryId: string) =>
    api.delete<IntangibleAssetCategoryDeleteResponse>(`/intangible-asset/categories/${categoryId}`),

  /** 무형자산 품목 상세 조회 */
  getDetail: (itemId: string) =>
    api.get<IntangibleItem>(`/intangible-asset/items/${itemId}`),

  /** 무형자산 품목 등록 */
  create: (body: IntangibleAssetItemCreateRequest) =>
    api.post<IntangibleItem>('/intangible-asset/items', toIntangibleItemBody(body)),

  /** 무형자산 품목 수정 */
  update: (itemId: string, body: IntangibleAssetItemUpdateRequest) =>
    api.patch<IntangibleItem>(`/intangible-asset/items/${itemId}`, toIntangibleItemBody(body)),

  // TODO: 무형자산 품목 일괄 등록
  /** 무형자산 품목 일괄 등록 (CSV/Excel) */
  // bulkCreate: (file: File) => {
  //   const formData = new FormData()
  //   formData.append('file', file)
  //   return api.upload('/assets/intangible/items/bulk', formData)
  // },

  /** 무형자산 품목 삭제 */
  delete: (itemId: string) =>
    api.delete(`/intangible-asset/items/${itemId}`),
}

// ─── 무형자산 API ────────────────────────────────────────────────────────────

export const intangibleAssetApi = {
  /** 무형자산 목록 조회 */
  getList: (params?: IntangibleAssetListFilter) =>
    api.get<PageResponse<IntangibleAsset>>('/intangible-asset/assets', compactParams(params)),

  /** 무형자산 상세 조회 */
  getDetail: (assetId: string) =>
    api.get<IntangibleAsset>(`/intangible-asset/assets/${assetId}`),

  /** 무형자산 등록 */
  create: (body: IntangibleAssetCreateRequest) =>
    api.post<IntangibleAsset>('/intangible-asset/assets', toIntangibleAssetCreateBody(body)),

  /** 무형자산 수정 */
  update: (assetId: string, body: Partial<IntangibleAssetUpdateRequest>) =>
    api.patch<IntangibleAsset>(`/intangible-asset/assets/${assetId}`, toIntangibleAssetUpdateBody(body)),

  /** 무형자산 해지 처리 */
  terminate: (assetId: string) =>
    api.patch(`/intangible-asset/assets/${assetId}/terminate`),

  /** 무형자산 배정 이력 조회 */
  getAssignments: (assetId: string, params?: { assignmentStatus?: IntangibleAssetAssignmentStatus }) =>
    api.get<IntangibleAssetAssignmentResponse[]>(
      `/intangible-asset/assets/${assetId}/assignments`,
      compactParams(params),
    ),

  /** 무형자산 배정 */
  assign: (assetId: string, body: IntangibleAssetAssignmentRequest) =>
    api.post<IntangibleAssetAssignmentResponse>(
      `/intangible-asset/assets/${assetId}/assign`,
      toIntangibleAssetAssignmentBody(body),
    ),

  /** 무형자산 배정 해지 */
  cancelAssignment: (assetId: string, body: IntangibleAssetCancelRequest = {}) =>
    api.post<IntangibleAssetAssignmentResponse[]>(
      `/intangible-asset/assets/${assetId}/cancel`,
      compactBody(body),
    ),

  // TODO: 무형자산 일괄 등록 
  // /** 무형자산 일괄 등록 (CSV/Excel) */
  // bulkCreate: (file: File) => {
  //   const formData = new FormData()
  //   formData.append('file', file)
  //   return api.upload('/intangible-asset/assets/bulk', formData)
  // },
}