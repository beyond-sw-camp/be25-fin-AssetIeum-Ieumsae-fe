import api from './client'
import type {
  Member,
  MemberRegisterRequest,
  MemberListFilter,
  MemberResignResponse,
  DepartmentChangeRequest,
  DepartmentChangeResponse,
  PageResponse,
} from '@/types'

export const memberApi = {
  /** 사원 목록 조회 */
  getList: (params?: MemberListFilter) =>
    api.get<PageResponse<Member>>('/members', params as Record<string, unknown>),

  /** 사원 등록 */
  create: (body: MemberRegisterRequest) =>
    api.post<Member>('/members', body),

  /** 사원 퇴사 처리 */
  resign: (memberId: Member['memberId']) =>
    api.patch<MemberResignResponse>(`/members/${memberId}/resign`),

  /** 사원 소속 부서 변경 */
  changeDepartment: (memberId: Member['memberId'], body: DepartmentChangeRequest) =>
    api.patch<DepartmentChangeResponse>(`/members/${memberId}/department`, body),
}
