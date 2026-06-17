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
