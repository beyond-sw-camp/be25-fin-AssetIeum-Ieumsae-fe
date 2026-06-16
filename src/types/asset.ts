import type { TangibleAssetStatus, IntangibleAssetStatus } from './common'

export type TangibleAssetUsageType = 'TEMPORARY' | 'PERMANENT'
export type TangibleAssetUsageScope = 'PERSONAL' | 'DEPARTMENT' | string
export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'ONE_TIME'

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
}

export interface TangibleAssetItemCreateRequest {
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
  assetId?: string | null
  id?: string | number | null
  tangibleAssetId?: string | null
  tangibleAssetAssetId?: string | null
  asset_id?: string | null
  tangible_asset_id?: string | null
  tangible_asset_asset_id?: string | null
  tangibleItemId?: string
  assetItemId?: string
  tangibleAssetItemId?: string
  assetCode: string
  serialNumber?: string
  serialNo?: string
  usageType?: TangibleAssetUsageType | null
  assetUsageType?: TangibleAssetUsageScope | null
  tangibleAssetStatus?: TangibleAssetStatus | string | null
  tangibleAssetstatus?: TangibleAssetStatus | string | null
  status?: TangibleAssetStatus | string | null
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
  createdAt?: string
}

export interface TangibleAssetCreateRequest {
  tangibleItemId?: string
  assetItemId?: string
  serialNumber?: string
  serialNo?: string
  usageType?: TangibleAssetUsageType | null
  assetUsageType?: TangibleAssetUsageScope
  tangibleAssetStatus?: TangibleAssetStatus | string | null
  tangibleAssetstatus?: TangibleAssetStatus | string | null
  status?: TangibleAssetStatus | string | null
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
  tangibleAssetStatus?: TangibleAssetStatus | string | null
  tangibleAssetstatus?: TangibleAssetStatus | string | null
  status?: TangibleAssetStatus | string | null
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
  page?: number
  size?: number
  assetId?: string | null
  productName?: string
  assetCode?: string
  status?: TangibleAssetStatus | string
  tangibleAssetStatus?: TangibleAssetStatus | string
  tangibleAssetstatus?: TangibleAssetStatus | string
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
export interface IntangibleCategoryGroup {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

export interface IntangibleAssetCategoryCreateRequest {
  name: string
  parentId?: string | null
}

export interface IntangibleAssetCategoryResponse {
  categoryId?: string
  intangibleAssetCategoryId?: string
  name: string
  parentId?: string | null
}

export interface IntangibleAssetCategoryDeleteResponse {
  categoryId?: string
  intangibleAssetCategoryId?: string
  deletedAt?: string
}

export interface IntangibleAssetItem {
  assetItemId: string
  itemNo: string
  name: string           // 소프트웨어명
  vendor: string         // 제공사
  softwareType: string   // 소프트웨어 종류
  stockCount: number
  availableCount: number
}

export interface IntangibleItem {
  assetItemId?: string
  itemId?: string
  id?: string
  categoryId?: string
  intangibleAssetCategoryId?: string
  productName: string
  category: string
  licenseType: string
  vendor: string
  provider?: string
  isStandard: number | boolean
  assetCount?: number
  stockCount?: number
  availableCount?: number
  intangibleAssetCount?: number
  totalAssetCount?: number
  assetTotalCount?: number
  count?: number
}

export interface IntangibleAssetItemCreateRequest {
  categoryId?: string
  productName?: string
  category?: string
  licenseType?: string
  provider?: string
  vendor?: string
  isStandard?: number | boolean
}

export interface IntangibleAssetItemUpdateRequest {
  categoryId?: string
  productName?: string
  category?: string
  licenseType?: string
  provider?: string
  vendor?: string
  isStandard?: number | boolean
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
  licenseCode?: string
  licenseKey?: string
  status?: IntangibleAssetStatus
  assignedMemberId: string | null
  assignedMemberName: string | null
  departmentId: string | null
  departmentName: string | null
  startedAt: string | null
  expiredAt: string | null
  vendor?: string
  purchasePrice?: number
  billingCycle?: BillingCycle
  seatCount?: number
  intangibleAssetStatus?: IntangibleAssetStatus
  isAutoRenewal?: boolean
  purchaseDate?: string
  purchaseVendor?: string
  createdAt?: string
}

export interface IntangibleAssetCreateRequest {
  intangibleItemId?: string
  assetItemId?: string
  licenseType?: LicenseType
  licenseCode?: string
  licenseKey?: string
  seatCount?: number
  isAutoRenewal?: boolean
  purchaseDate?: string
  purchasePrice?: number
  purchaseVendor?: string
  intangibleAssetStatus?: IntangibleAssetStatus
  status?: IntangibleAssetStatus
  memberId?: string | null
  departmentId?: string | null
  startedAt?: string | null
  expiredAt?: string | null
  billingCycle?: BillingCycle
}

export interface IntangibleAssetListFilter {
  page?: number
  size?: number
  categoryId?: string
  status?: IntangibleAssetStatus
  keyword?: string
  currentUserId?: string
  departmentId?: string
}

export interface IntangibleAssetUpdateRequest {
  intangibleAssetStatus?: IntangibleAssetStatus
  seatCount?: number
  isAutoRenewal: number | boolean
  startedAt?: string | null
  expiredAt?: string | null
}
