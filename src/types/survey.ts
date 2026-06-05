// =====================================================
// 전수조사(Inventory Survey) 관련 타입
// =====================================================

export type SurveyTarget = 'ALL' | 'BY_DEPARTMENT' | 'BY_ITEM'
export type SurveyStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
export type SurveyResponseStatus = 'MATCH' | 'USER_MISMATCH' | 'STATUS_MISMATCH' | 'UNREGISTERED' | 'LOST_SUSPECTED'

export interface InventorySurvey {
  surveyId: number
  surveyName: string
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  targetType: SurveyTarget
  targetDepartmentId?: number
  targetAssetItemId?: number
  startDate: string
  endDate: string
  status: SurveyStatus
  managerId: number
  managerName: string
  totalCount: number
  respondedCount: number
  matchedCount: number
  mismatchedCount: number
  createdAt: string
}

export interface SurveyCreateRequest {
  surveyName: string
  assetType: 'TANGIBLE' | 'INTANGIBLE'
  targetType: SurveyTarget
  targetDepartmentId?: number
  targetAssetItemId?: number
  startDate: string
  endDate: string
  managerId: number
}

export interface SurveyResponseItem {
  assetId: number
  assetCode: string
  assetName: string
  currentOwnerName: string
  departmentName: string
  status: string
  responseStatus: SurveyResponseStatus | null
  userResponse?: string
  note?: string
  respondedAt?: string
}

export interface UserSurveyResponse {
  assetId: number
  isOwned: boolean
  actualStatus: string
  note?: string
}
