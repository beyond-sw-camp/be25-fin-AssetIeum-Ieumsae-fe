// =====================================================
// HR 템플릿 (HRTemplate) 타입
// =====================================================

export type HrTemplateAssetType = 'TANGIBLE' | 'INTANGIBLE'
export type HrTemplateId = string | number

export interface HrTemplateCreateRequest {
  items: HrTemplateItemCreateRequest[]
}

export interface HrTemplateResponse {
  hrTemplateId?: HrTemplateId
  templateId?: HrTemplateId
  departmentId?: HrTemplateId
  departmentName?: string
  name?: string
  items?: HrTemplateItemResponse[]
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

// =====================================================
// HR 템플릿 (HRTemplate) items 타입
// =====================================================

export interface HrTemplateItemCreateRequest {
  assetType: HrTemplateAssetType
  assetItemId: HrTemplateId
  quantity: number
}

export interface HrTemplateItemResponse {
  hrTemplateItemId: HrTemplateId
  assetType: HrTemplateAssetType
  assetItemId: HrTemplateId
  productName: string
  quantity: number
  createdAt?: string
  updatedAt?: string
}

// =====================================================
// HR 이벤트 (HREvent) 타입
// =====================================================

export type HrEventType = 'ONBOARDING' | 'OFFBOARDING' | 'DEPARTMENT_TRANSFER'
export type HrEventStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type HrEventId = string | number
export type HrEventAssetType = 'TANGIBLE' | 'INTANGIBLE'
export type HrEventAssetActionType =
  | 'RETURN_REQUIRED'
  | 'UNASSIGN_REQUIRED'
  | 'TRANSFER_REQUIRED'
  | 'KEEP'

export interface HrEventAssetTargetCreateRequest {
  assetType: HrEventAssetType
  assetId: string
  actionType: HrEventAssetActionType
  transferMemberId?: string
}

export interface HrEventCreateRequest {
  memberId: string
  eventType: HrEventType
  eventDate: string
  targetDepartmentId?: string
  assetTargets?: HrEventAssetTargetCreateRequest[]
}

export interface HrEventAssetTargetResponse {
  hrEventAssetTargetId?: string
  assetTargetId?: string
  assetType?: HrEventAssetType
  assetId?: string
  assignmentId?: string | null
  productName?: string | null
  assetCode?: string | null
  actionType?: HrEventAssetActionType
  targetActionType?: HrEventAssetActionType
  transferMemberId?: string | null
  transferMemberName?: string | null
  targetDepartmentId?: string | null
  targetDepartmentName?: string | null
  status?: HrEventStatus | string | null
  targetStatus?: HrEventStatus | string | null
  hrEventAssetTargetStatus?: HrEventStatus | string | null
  assetTargetStatus?: HrEventStatus | string | null
  ticketStatus?: string | null
  returnTicketStatus?: string | null
  requestTicketStatus?: string | null
  assetReturnStatus?: string | null
  processedAt?: string | null
  completedAt?: string | null
  targetProcessedAt?: string | null
  createdAt?: string
}

export interface HrEventResponse { 
  hrEventId: HrEventId
  hrEventNo?: string
  eventNo?: string
  departmentId?: string
  departmentName?: string
  targetDepartmentId?: string | null
  targetDepartmentName?: string | null
  memberId?: string
  memberName?: string
  targetMemberId?: string
  targetMemberName?: string
  templateId?: HrTemplateId
  templateName?: string
  matchedTemplateName?: string
  hrEventStatus?: HrEventStatus
  status?: HrEventStatus
  hrEventType?: HrEventType
  eventType?: HrEventType
  eventDate: string
  executedAt?: string
  completedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt?: string
}

export interface HrEventSearchRequest {
  page?: number
  size?: number
  status?: HrEventStatus
  eventType?: HrEventType
  departmentId?: string
  hrEventStatus?: HrEventStatus
  hrEventType?: HrEventType
}
