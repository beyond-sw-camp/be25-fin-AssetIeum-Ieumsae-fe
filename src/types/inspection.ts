// =====================================================
// 전수조사 계획 등록 (Inspection Register) 타입
// =====================================================

export type InspectionTargetType = 'ALL' | 'DEPARTMENT' | 'CATEGORY'
export type InspectionType = 'TANGIBLE_ASSET' | 'INTANGIBLE_ASSET'
export type InspectorType = 'EMPLOYEE' | 'ASSET_TEAM'
export type InspectionStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'

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
  inspection_id?: string | number
  inspectionType: InspectionType
  inspection_type?: string
  targetType: InspectionTargetType
  target_type?: InspectionTargetType
  targetDepartmentId: string | null
  target_department_id?: string | number | null
  targetCategoryId: string | null
  target_category_id?: string | number | null
  inspectorType: InspectorType
  inspector_type?: InspectorType
  inspection_actor?: InspectorType
  startDate: string
  start_date?: string
  endDate: string
  end_date?: string
  inspectionStatus: InspectionStatus
  inspection_status?: InspectionStatus
  status?: InspectionStatus
  description: string | null
  inspectorId: string
  inspector_id?: string | number
  createdAt: string
  created_at?: string
  updatedAt: string
  updated_at?: string
  inspectionResults?: InspectionResultResponse[]
  inspection_results?: InspectionResultResponse[]
}

export interface InspectionSearchResponse {
  inspectionId?: string
  inspection_id?: string | number
  targetName?: string | null
  target_name?: string | null
  inspectorName?: string | null
  inspector_name?: string | null
  inspectorType?: InspectorType
  inspector_type?: InspectorType
  inspectionStatus?: InspectionStatus
  inspection_status?: InspectionStatus
  status?: InspectionStatus
  startDate?: string
  start_date?: string
  endDate?: string
  end_date?: string
  description?: string | null
  targetAssetCount?: number
  target_asset_count?: number
  inspectedAssetCount?: number
  inspected_asset_count?: number
  completedAssetCount?: number
  completed_asset_count?: number
  followUpRequiredCount?: number
  follow_up_required_count?: number
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
  productName: string | null
  assetCode: string | null
  followUpRequired: boolean
  userResponseContent: string | null
}

export interface InspectionUninspectedAssetItem {
  productName: string | null
  assetCode: string | null
  category: string | null
}

export interface InspectionStatisticsResponse {
  totalCount?: number
  total_count?: number
  totalInspectionCount?: number
  total_inspection_count?: number
  total?: number
  readyCount?: number
  ready_count?: number
  inProgressCount?: number
  in_progress_count?: number
  completedCount?: number
  completed_count?: number
  closedCount?: number
  closed_count?: number
  targetAssetCount?: number
  target_asset_count?: number
  inspectedAssetCount?: number
  inspected_asset_count?: number
  uninspectedAssetCount?: number
  uninspected_asset_count?: number
  followUpRequiredCount?: number
  follow_up_required_count?: number
}

export interface InspectionResultResponse {
  inspectionResultId?: string | number
  inspection_result_id?: string | number
  inspectionId?: string | number
  inspection_id?: string | number
  inspectionTargetId?: string | number
  inspection_target_id?: string | number
  tangibleAssetId?: string | number
  tangible_asset_id?: string | number
  assetCode?: string
  asset_code?: string
  serialNumber?: string
  serial_number?: string
  responseContent?: string | null
  response_content?: string | null
  inspectionResult?: string | null
  inspection_result?: string | null
  followUpAction?: string | null
  follow_up_action?: string | null
  followUpRequests?: boolean | number
  follow_up_requests?: boolean | number
  checkedBy?: string | number | null
  checked_by?: string | number | null
  checkedAt?: string | null
  checked_at?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface InspectionFollowUpRequest {
  actionDetail: string
  processedBy?: string | number | null
  status?: 'PENDING' | 'COMPLETED'
}

export interface InspectionFollowUpResponse {
  inspectionFollowUpId?: string | number
  inspection_follow_up_id?: string | number
  followUpId?: string | number
  follow_up_id?: string | number
  inspectionResultId?: string | number
  inspection_result_id?: string | number
  actionDetail?: string
  action_detail?: string
  processedBy?: string | number
  processed_by?: string | number
  status?: 'PENDING' | 'COMPLETED'
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface InspectionResponseCreateRequest {
  inspectionTargetId: string | number
  responseContent: string
  followUpRequests: boolean
}

export interface InspectionResponseCreateBody {
  inspection_target_id: string | number
  response_content: string
  follow_up_requests: 0 | 1
}

export interface InspectionResponseCreateResponse {
  inspectionResultId?: string | number
  inspection_result_id?: string | number
  inspectionId?: string | number
  inspection_id?: string | number
  inspectionTargetId?: string | number
  inspection_target_id?: string | number
  responseContent?: string | null
  response_content?: string | null
  followUpRequests?: boolean | number
  follow_up_requests?: boolean | number
  checkedBy?: string | number | null
  checked_by?: string | number | null
  checkedAt?: string | null
  checked_at?: string | null
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface EmployeeInspectionTargetResponse {
  inspectionTargetId?: string | number
  inspection_target_id?: string | number
  inspectionId?: string | number
  inspection_id?: string | number
  inspectionType?: InspectionType
  inspection_type?: InspectionType
  inspectionStatus?: InspectionStatus
  inspection_status?: InspectionStatus
  tangibleAssetId?: string | number | null
  tangible_asset_id?: string | number | null
  intangibleAssetId?: string | number | null
  intangible_asset_id?: string | number | null
  assetId?: string | number | null
  asset_id?: string | number | null
  assetCode?: string | null
  asset_code?: string | null
  productName?: string | null
  product_name?: string | null
  itemName?: string | null
  item_name?: string | null
  serialNumber?: string | null
  serial_number?: string | null
  licenseCode?: string | null
  license_code?: string | null
  category?: string | null
  categoryName?: string | null
  category_name?: string | null
  location?: string | null
  isResponded?: boolean
  is_responded?: boolean
  responded?: boolean
  startDate?: string
  start_date?: string
  endDate?: string
  end_date?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}
