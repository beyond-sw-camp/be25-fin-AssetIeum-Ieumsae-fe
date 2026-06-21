import api from './client'
import type {
  InspectionCreateRequest,
  InspectionDetailResponse,
  EmployeeInspectionTargetResponse,
  InspectionResponseCreateRequest,
  InspectionResponseCreateResponse,
  InspectionResponse,
  InspectionSearchResponse,
  InspectionStatisticsResponse,
  PageResponse,
} from '@/types'

const toLocalDateTime = (value: string) => {
  if (!value) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

const toInspectionCreateBody = (body: InspectionCreateRequest) => ({
  targetType: body.targetType,
  targetDepartmentId: body.targetType === 'DEPARTMENT' ? body.targetDepartmentId : null,
  targetCategoryId: body.targetType === 'CATEGORY' ? body.targetCategoryId : null,
  inspectorType: body.inspectorType,
  description: body.description?.trim() || null,
  inspectorId: body.inspectorId,
  startDate: toLocalDateTime(body.startDate),
  endDate: toLocalDateTime(body.endDate),
})

const toInspectionResponseBody = (body: InspectionResponseCreateRequest) => ({
  inspection_target_id: body.inspectionTargetId,
  response_content: body.responseContent.trim(),
  follow_up_requests: body.followUpRequests ? 1 : 0,
})

const createInspectionApi = (basePath: string, responsePath: string) => ({
  getList: (params?: {
    status?: string
    inspectorId?: string
    page?: number
    size?: number
  }) =>
    api.get<PageResponse<InspectionSearchResponse>>(basePath, params),

  getDetail: (inspectionId: string) =>
    api.get<InspectionDetailResponse>(`${basePath}/${inspectionId}`),

  getStatistics: () =>
    api.get<InspectionStatisticsResponse>(`${basePath}/statistics`),

  create: (body: InspectionCreateRequest) =>
    api.post<InspectionResponse>(basePath, toInspectionCreateBody(body)),

  createResponse: (inspectionId: string | number, body: InspectionResponseCreateRequest) =>
    api.post<InspectionResponseCreateResponse>(
      `${responsePath}/${inspectionId}/responses`,
      toInspectionResponseBody(body),
    ),

  getMyTargets: (params?: { page?: number; size?: number; inspectionId?: string; isResponded?: boolean }) =>
    api.get<PageResponse<EmployeeInspectionTargetResponse>>(
      `${basePath}/my-targets`,
      params,
    ),

  getTargets: (params?: { page?: number; size?: number; inspectionId?: string; isResponded?: boolean }) =>
    api.get<PageResponse<EmployeeInspectionTargetResponse>>(
      `${basePath}/targets`,
      params,
    ),
})

export const tangibleInspectionApi = createInspectionApi(
  '/tangible-asset/inspections',
  '/tangible-asset-inspections',
)

export const intangibleInspectionApi = createInspectionApi(
  '/intangible-asset/inspections',
  '/intangible-asset-inspections',
)
