import type { TangibleAssetStatus, IntangibleAssetStatus } from './common'

// =====================================================
// 유형자산 품목(TangibleAssetItem) 타입
// =====================================================

export interface TangibleAssetItem {
  assetItemId: string
  itemNo: string        // 품목번호
  name: string          // 제품명
  category?: string     // 카테고리
  manufacturer: string  // 제조사
  modelName: string     // 모델명
  vendor: string        // 구매처
  purchasePrice: number // 구매금액
  stockCount: number    // 재고수량
  availableCount: number
  isStandard?: number
  createdAt: string
}

export interface TangibleAssetItemCreateRequest {
  itemNo?: string
  name?: string
  assetName?: string
  category?: string
  manufacturer?: string
  modelName?: string
  vendor?: string
  purchasePrice?: number
  stockCount?: number
  isStandard?: number
}

export interface TangibleAssetItemUpdateRequest {
  name?: string
  assetName?: string
  category?: string
  manufacturer?: string
  modelName?: string
  vendor?: string
  purchasePrice?: number
  isStandard?: number
}

export interface TangibleCategoryGroup {
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
}

// =====================================================
// 유형자산(TangibleAsset) 타입
// =====================================================

export interface TangibleAsset {
  assetId: string
  assetCode: string     // 자산코드 (QR 연동)
  serialNo: string      // 시리얼번호
  assetItemId: string
  assetItemName: string
  status: TangibleAssetStatus
  assignedMemberId: string | null
  assignedMemberName: string | null
  departmentId: string | null
  departmentName: string | null
  purchaseDate: string
  vendor?: string
  purchasePrice?: number
  warrantyExpiredAt: string | null
  location?: string | null
  startedAt: string | null
  returnDueDate: string | null
  createdAt: string
}

export interface TangibleAssetCreateRequest {
  assetItemId: string
  serialNo: string
  purchaseDate: string
  vendor?: string
  purchasePrice?: number
  status?: TangibleAssetStatus
  assignedMemberId?: string | null
  assignedMemberName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  startedAt?: string | null
  returnDueDate?: string | null
  warrantyExpiredAt?: string | null
  location?: string | null
}

export interface TangibleAssetUpdateRequest {
  assetCode?: string
  assetItemName?: string
  serialNo?: string
  status?: TangibleAssetStatus
  assignedMemberId?: string | null
  assignedMemberName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  startedAt?: string | null
  returnDueDate?: string | null
  purchaseDate?: string
  vendor?: string
  purchasePrice?: number | null
  warrantyExpiredAt?: string | null
  location?: string | null
}

export interface TangibleAssetListFilter {
  page?: number
  size?: number
  status?: TangibleAssetStatus
  categoryName?: string
  departmentId?: string
  memberId?: string
  assetItemId?: string
  keyword?: string
}

// =====================================================
// 무형자산 품목(IntangibleAssetItem) 타입
// =====================================================

export interface IntangibleAssetItem {
  assetItemId: string
  itemNo: string
  name: string           // 소프트웨어명
  vendor: string         // 제공사
  softwareType: string   // 소프트웨어 종류
  stockCount: number
  availableCount: number
  createdAt: string
}

export interface IntangibleItem {
  assetItemId?: string
  productName: string
  category: string
  licenseType: string
  vendor: string
  isStandard: number
  assetCount?: number
}

// =====================================================
// 무형자산(IntangibleAsset) 타입
// =====================================================

export type LicenseType = 'SUBSCRIPTION' | 'PERPETUAL' | 'VOLUME' | 'USER_BASED'

export interface IntangibleAsset {
  assetId: string
  assetCode: string
  assetItemId: string
  assetItemName: string
  licenseType: LicenseType
  licenseKey?: string
  status: IntangibleAssetStatus
  assignedMemberId: string | null
  assignedMemberName: string | null
  departmentId: string | null
  departmentName: string | null
  startedAt: string | null
  expiredAt: string | null
  vendor?: string
  purchasePrice?: number
  createdAt: string
}

export interface IntangibleAssetCreateRequest {
  assetItemId: string
  licenseType: LicenseType
  licenseKey?: string
  startedAt: string
  expiredAt?: string
  status?: IntangibleAssetStatus
}

export interface IntangibleAssetListFilter {
  page?: number
  size?: number
  status?: IntangibleAssetStatus
  departmentId?: string
  memberId?: string
  assetItemId?: string
}
