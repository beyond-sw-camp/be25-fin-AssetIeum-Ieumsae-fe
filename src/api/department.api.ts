import api from './client'
import type {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  PageResponse,
} from '@/types'

export const departmentApi = {
  /** 부서 목록 조회 */
  getList: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<Department>>('/departments', params),

  /** 부서 상세 조회 */
  getDetail: (departmentId: string) =>
    api.get<Department>(`/departments/${departmentId}`),

  /** 부서 등록 */
  create: (body: DepartmentCreateRequest) =>
    api.post<Department>('/departments', body),

  /** 부서 수정 */
  update: (departmentId: string, body: DepartmentUpdateRequest) =>
    api.patch<Department>(`/departments/${departmentId}`, body),

  /** 부서 삭제 */
  delete: (departmentId: string) =>
    api.delete<{ departmentId: string; deletedAt: string }>(`/departments/${departmentId}`),
}
