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
}

// =====================================================
// HR 이벤트 (HREvent) 타입
// =====================================================

export type HrEventType = 'ONBOARDING' | 'OFFBOARDING' | 'DEPARTMENT_TRANSFER' | 'LEAVE' | 'RETURN'
export type HrEventStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CANCELED'
export type HrEventId = string | number

export interface HrEventCreateRequest {
  memberId: string
  eventType: HrEventType
  eventDate: string
}

export interface HrEventResponse { 
  hrEventId: HrEventId
  hrEventNo?: string
  eventNo?: string
  departmentId?: string
  departmentName?: string
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
  canceledAt?: string
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
