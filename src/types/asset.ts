import type { TangibleAssetStatus, IntangibleAssetStatus } from './common'

// =====================================================
// 유형자산 품목(TangibleAssetItem) 타입
// =====================================================

export interface TangibleAssetItem {
  assetItemId: number
  itemNo: string        // 품목번호
  name: string          // 제품명
  manufacturer: string  // 제조사
  modelName: string     // 모델명
  vendor: string        // 구매처
  purchasePrice: number // 구매금액
  stockCount: number    // 재고수량
  availableCount: number
  createdAt: string
}

export interface TangibleAssetItemCreateRequest {
  itemNo: string
  name: string
  manufacturer?: string
  modelName?: string
  vendor?: string
  purchasePrice?: number
  stockCount: number
}

// =====================================================
// 유형자산(TangibleAsset) 타입
// =====================================================

export interface TangibleAsset {
  assetId: number
  assetCode: string     // 자산코드 (QR 연동)
  serialNo: string      // 시리얼번호
  assetItemId: number
  assetItemName: string
  status: TangibleAssetStatus
  assignedMemberId: number | null
  assignedMemberName: string | null
  departmentId: string | null
  departmentName: string | null
  purchaseDate: string
  warrantyExpiredAt: string | null
  startedAt: string | null
  returnDueDate: string | null
  createdAt: string
}

export interface TangibleAssetCreateRequest {
  assetItemId: number
  serialNo: string
  purchaseDate: string
  vendor?: string
  purchasePrice?: number
  status?: TangibleAssetStatus
}

export interface TangibleAssetListFilter {
  page?: number
  size?: number
  status?: TangibleAssetStatus
  departmentId?: string
  memberId?: number
  assetItemId?: number
  keyword?: string
}

// =====================================================
// 무형자산 품목(IntangibleAssetItem) 타입
// =====================================================

export interface IntangibleAssetItem {
  assetItemId: number
  itemNo: string
  name: string           // 소프트웨어명
  vendor: string         // 제공사
  softwareType: string   // 소프트웨어 종류
  stockCount: number
  availableCount: number
  createdAt: string
}

export interface IntangibleItem {
  assetItemId?: number
  productName: string
  category: string
  licenseType: string
  vendor: string
  isStandard: number
}

// =====================================================
// 무형자산(IntangibleAsset) 타입
// =====================================================

export type LicenseType = 'SUBSCRIPTION' | 'PERPETUAL' | 'VOLUME' | 'USER_BASED'

export interface IntangibleAsset {
  assetId: number
  assetCode: string
  assetItemId: number
  assetItemName: string
  licenseType: LicenseType
  licenseKey?: string
  status: IntangibleAssetStatus
  assignedMemberId: number | null
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
  assetItemId: number
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
  memberId?: number
  assetItemId?: number
}
