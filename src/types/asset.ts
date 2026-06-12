import type { TangibleAssetStatus, IntangibleAssetStatus } from './common'

export type TangibleAssetUsageType = 'TEMPORARY' | 'PERMANENT'
export type TangibleAssetUsageScope = 'PERSONAL' | 'DEPARTMENT' | string

// =====================================================
// 유형자산 품목(TangibleAssetItem) 타입
// =====================================================

export interface TangibleAssetItem {
  assetItemId: string
  tangibleAssetItemId?: string
  itemId?: string
  itemNo: string        // 품목번호
  itemCode?: string
  productName?: string
  name: string          // 제품명
  category?: string     // 카테고리
  categoryId?: string
  categoryName?: string
  manufacturer: string  // 제조사
  modelName: string     // 모델명
  vendor: string        // 구매처
  purchasePrice: number // 구매금액
  stockCount: number    // 재고수량
  availableCount: number
  isStandard?: number | boolean
  createdAt: string
}

export interface TangibleAssetItemCreateRequest {
  companyId?: string
  categoryId?: string
  productName?: string
  itemCode?: string
  itemNo?: string
  name?: string
  assetName?: string
  category?: string
  manufacturer?: string
  modelName?: string
  vendor?: string
  purchasePrice?: number
  stockCount?: number
  isStandard?: number | boolean
}

export interface TangibleAssetItemUpdateRequest {
  categoryId?: string
  productName?: string
  itemCode?: string
  name?: string
  assetName?: string
  category?: string
  manufacturer?: string
  modelName?: string
  vendor?: string
  purchasePrice?: number
  isStandard?: number | boolean
}

export interface TangibleCategoryGroup {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

export interface TangibleAssetCategoryCreateRequest {
  companyId: string
  name: string
  parentId?: string | null
}

export interface TangibleAssetCategoryResponse {
  categoryId?: string
  tangibleAssetCategoryId?: string
  name: string
  parentId?: string | null
}

export interface TangibleAssetCategoryDeleteResponse {
  categoryId?: string
  tangibleAssetCategoryId?: string
  deletedAt?: string
}

// =====================================================
// 유형자산(TangibleAsset) 타입
// =====================================================

export interface TangibleAsset {
  assetId?: string | number | null
  id?: string | number | null
  tangibleAssetId?: string | number | null
  tangibleAssetAssetId?: string | number | null
  asset_id?: string | number | null
  tangible_asset_id?: string | number | null
  tangible_asset_asset_id?: string | number | null
  companyId?: string
  tangibleItemId?: string
  assetItemId?: string
  tangibleAssetItemId?: string
  assetCode: string
  serialNumber?: string
  serialNo?: string
  usageType?: TangibleAssetUsageType | null
  assetUsageType?: TangibleAssetUsageScope | null
  tangibleAssetStatus?: TangibleAssetStatus | null
  tangibleAssetstatus?: TangibleAssetStatus | null
  status?: TangibleAssetStatus | null
  memberId?: string | null
  assignedMemberId?: string | null
  assignedMemberName?: string | null
  memberName?: string | null
  userName?: string | null
  currentUserName?: string | null
  currentUserMemberNo?: string | null
  departmentId?: string | null
  departmentName?: string | null
  location?: string | null
  locationName?: string | null
  usedStartedAt?: string | null
  startedAt?: string | null
  returnDueDate?: string | null
  purchaseDate: string
  purchasePrice?: number
  purchaseVendor?: string
  vendor?: string
  warrantyExpiredAt?: string | null
  assetItemName?: string
  productName?: string
  createdAt: string
}

export interface TangibleAssetCreateRequest {
  companyId?: string
  tangibleItemId?: string
  assetItemId?: string
  serialNumber?: string
  serialNo?: string
  usageType?: TangibleAssetUsageType | null
  assetUsageType?: TangibleAssetUsageScope
  tangibleAssetStatus?: TangibleAssetStatus | null
  status?: TangibleAssetStatus | null
  memberId?: string | null
  assignedMemberId?: string | null
  assignedMemberName?: string | null
  memberName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  location?: string | null
  locationName?: string | null
  usedStartedAt?: string | null
  startedAt?: string | null
  returnDueDate?: string | null
  purchaseDate: string
  purchasePrice?: number
  purchaseVendor?: string
  vendor?: string
  warrantyExpiredAt?: string | null
}

export interface TangibleAssetUpdateRequest {
  tangibleAssetId?: string
  assetCode?: string
  assetItemName?: string
  serialNo?: string
  tangibleAssetStatus?: TangibleAssetStatus | null
  tangibleAssetstatus?: TangibleAssetStatus | null
  status?: TangibleAssetStatus | null
  memberId?: string | null
  assignedMemberId?: string | null
  assignedMemberName?: string | null
  memberName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  location?: string | null
  locationName?: string | null
  usedStartedAt?: string | null
  startedAt?: string | null
  returnDueDate?: string | null
  usageType?: TangibleAssetUsageType | null
  purchaseDate?: string
  vendor?: string
  purchasePrice?: number
  warrantyExpiredAt?: string | null
}

export interface TangibleAssetListFilter {
  companyId?: string
  page?: number
  size?: number
  assetId?: string | number | null
  productName?: string
  assetCode?: string
  status?: TangibleAssetStatus
  tangibleAssetStatus?: TangibleAssetStatus
  departmentId?: string
  memberId?: string
  currentUserId?: string
  assetItemId?: string
  categoryId?: string
  categoryName?: string
  keyword?: string
}

export interface TangibleAssetListDetailFilter {
  productName: string
  assetCode: string
  serialNumber: string
  status?: TangibleAssetStatus
  usageType?: TangibleAssetUsageType
  assetUsageType: TangibleAssetUsageScope
  userName?: string | null
  departmentName?: string | null
  location?: string | null
  usedStartedAt?: string | null
  returnDueDate?: string | null
  purchaseDate: string
  purchasePrice?: number
  purchaseVendor?: string
  warrantyExpiredAt?: string
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
