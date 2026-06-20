// =====================================================
// 전수조사 (Inspection) 타입
// =====================================================

// export type HrTemplateAssetType = 'TANGIBLE' | 'INTANGIBLE'
// export type HrTemplateId = string | number

// export interface HrTemplateCreateRequest {
//   items: HrTemplateItemCreateRequest[]
// }

// export interface HrTemplateResponse {
//   hrTemplateId?: HrTemplateId
//   templateId?: HrTemplateId
//   departmentId?: HrTemplateId
//   departmentName?: string
//   name?: string
//   items?: HrTemplateItemResponse[]
//   createdAt: string
//   updatedAt?: string
//   deletedAt?: string | null
// }


// =====================================================
// 전수조사 계획 등록 (Inspection Register) 타입
// =====================================================

export type InspectionTargetType = 'ALL' | 'DEPARTMENT' | 'CATEGORY'
export type InspectionType = 'TANGIBLE_ASSET' | 'INTANGIBLE_ASSET'
export type InspectorType = 'EMPLOYEE' | 'ASSET_TEAM'
export type InspectionStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'

export interface InspectionCreateRequest {
    targetType: InspectionTargetType[]
    targetDepartmentId: string | null
    targetCategoryId: string | null
    inspectorType: string
    description: string | null
    inspectorId: string
    startDate: string
    endDate: string
}

export interface InspectionResponse {
    inspectionId: string
    inspectionType: InspectionType[]
    targetType: InspectionTargetType[]
    targetDepartmentId:string
    targetCategoryId: string
    inspectorType: InspectorType[]
    startDate: string
    endDate: string
    inspectionStatus: InspectionStatus[]
    description: string
    inspectorId: string
    createdAt: string
    updatedAt: string
}