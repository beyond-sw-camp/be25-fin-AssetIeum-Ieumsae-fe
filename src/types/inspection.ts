// =====================================================
// 전수조사 계획 등록 (Inspection Register) 타입
// =====================================================

export type InspectionTargetType = 'ALL' | 'DEPARTMENT' | 'CATEGORY'
export type InspectionType = 'TANGIBLE_ASSET' | 'INTANGIBLE_ASSET'
export type InspectorType = 'EMPLOYEE' | 'ASSET_TEAM'
export type InspectionStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
export type InspectionFollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface InspectionCreateRequest {
  targetType: InspectionTargetType
  targetDepartmentId?: string | null
  targetCategoryId?: string | null
  inspectorType: InspectorType
  description?: string | null
  inspectorId: string
  startDate: string
  endDate: string
}

export interface InspectionResponse {
  inspectionId: string
  inspectionType: InspectionType
  targetType: InspectionTargetType
  targetDepartmentId: string | null
  targetCategoryId: string | null
  inspectorType: InspectorType
  startDate: string
  endDate: string
  inspectionStatus: InspectionStatus
  status?: InspectionStatus
  description: string | null
  inspectorId: string
  createdAt: string
  updatedAt: string
  inspectionResults?: InspectionResultResponse[]
}

export interface InspectionSearchResponse {
  inspectionId?: string
  targetType?: InspectionTargetType
  targetName?: string | null
  inspectorName?: string | null
  inspectorType?: InspectorType
  inspectionStatus?: InspectionStatus
  status?: InspectionStatus
  startDate?: string
  endDate?: string
  description?: string | null
  targetAssetCount?: number
  inspectedAssetCount?: number
  completedAssetCount?: number
  followUpRequiredCount?: number
}

export interface InspectionDetailResponse {
  inspectionInfo: InspectionDetailInfo
  inspectionResults: InspectionDetailResultItem[]
  uninspectedAssets: InspectionUninspectedAssetItem[]
}

export interface InspectionDetailInfo {
  inspectorName: string
  targetName: string
  inspectorType: InspectorType
  inspectionStatus: InspectionStatus
  startDate: string
  endDate: string
}

export interface InspectionDetailResultItem {
  inspectionResultId?: string | number
  inspectionFollowUpId?: string | number | null
  followUpId?: string | number | null
  productName: string | null
  assetCode: string | null
  followUpRequired: boolean
  userResponseContent: string | null
  actionDetail?: string | null
  followUpStatus?: InspectionFollowUpStatus | null
  status?: InspectionFollowUpStatus | null
}

export interface InspectionUninspectedAssetItem {
  productName: string | null
  assetCode: string | null
  category: string | null
}

export interface InspectionStatisticsResponse {
  totalInspectionCount?: number | null
  readyInspectionCount?: number | null
  inProgressInspectionCount?: number | null
  completedInspectionCount?: number | null
  inProgressTargetAssetCount?: number | null
  completedTargetAssetCount?: number | null
  unprocessedAssetCount?: number | null
  followUpInProgressAssetCount?: number | null
  followUpCompletedAssetCount?: number | null
}

export interface InspectionResultResponse {
  inspectionResultId?: string | number
  inspectionId?: string | number
  inspectionTargetId?: string | number
  inspectionFollowUpId?: string | number | null
  followUpId?: string | number | null
  tangibleAssetId?: string | number
  assetCode?: string
  serialNumber?: string
  responseContent?: string | null
  inspectionResult?: string | null
  followUpAction?: string | null
  followUpRequests?: boolean | number
  followUpStatus?: InspectionFollowUpStatus | null
  status?: InspectionFollowUpStatus | null
  actionDetail?: string | null
  checkedBy?: string | number | null
  checkedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface InspectionFollowUpRequest {
  actionDetail: string
  processedBy?: string | number | null
  status?: InspectionFollowUpStatus
}

export interface InspectionFollowUpResponse {
  inspectionFollowUpId?: string | number
  followUpId?: string | number
  inspectionResultId?: string | number
  actionDetail?: string
  productName?: string | null
  assetCode?: string | null
  responseContent?: string | null
  processedBy?: string | number
  processorName?: string | null
  status?: InspectionFollowUpStatus
  followUpStatus?: InspectionFollowUpStatus
  inspectionFollowUpStatus?: InspectionFollowUpStatus
  processedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface InspectionFollowUpStatusUpdateRequest {
  status: InspectionFollowUpStatus
  actionDetail?: string | null
}

export interface InspectionResponseCreateRequest {
  responseContent: string
  followUpRequests: boolean
}

export interface InspectionResponseCreateBody {
  responseContent: string
  followUpRequests: boolean
}

export interface InspectionResponseCreateResponse {
  inspectionResultId?: string | number
  inspectionId?: string | number
  inspectionTargetId?: string | number
  responseContent?: string | null
  followUpRequests?: boolean | number
  checkedBy?: string | number | null
  checkedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeInspectionTargetResponse {
  inspectionTargetId?: string | number
  inspectionId?: string | number
  inspectionType?: InspectionType
  inspectionStatus?: InspectionStatus
  tangibleAssetId?: string | number | null
  intangibleAssetId?: string | number | null
  assetId?: string | number | null
  assetCode?: string | null
  productName?: string | null
  itemName?: string | null
  serialNumber?: string | null
  licenseCode?: string | null
  category?: string | null
  categoryName?: string | null
  location?: string | null
  isResponded?: boolean
  responded?: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
}
