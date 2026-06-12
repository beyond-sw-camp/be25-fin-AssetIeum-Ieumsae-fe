import type { MemberStatus, Role } from './common'

// =====================================================
// 인증 관련 타입
// =====================================================

export interface LoginRequest {
  companyCode: string
  memberNo: string
  password: string
}

export interface LoginResponse {
  companyId?: string
  memberId: string
  memberNo: string
  name: string
  email: string
  departmentId: string
  departmentName: string
  role: Role
  status: MemberStatus
  accessToken: string
  refreshToken?: string
}

export type AuthUser = Omit<LoginResponse, 'accessToken' | 'refreshToken'>

// =====================================================
// 사원(Member) 관련 타입
// =====================================================

export interface Member {
  memberId: string
  memberNo: string
  name: string
  email: string | null
  departmentId: string
  departmentName: string
  departmentNamePath: string
  role: Role
  status: MemberStatus
  createdAt: string
}

export interface MemberRegisterRequest {
  memberNo: string
  name: string
  email?: string
  departmentId: string
  role: Role
}

export interface MemberListFilter {
  page?: number
  size?: number
  departmentId?: string
  keyword?: string
  status?: MemberStatus
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface PasswordChangeResponse {
  memberId: string
  updatedAt: string
}

export interface DepartmentChangeRequest {
  departmentId: string
}

export interface MemberResignResponse {
  memberId: string
  memberNo: string
  name: string
  status: 'RESIGNED'
  returnedTangibleAssetCount: number
  returnedIntangibleAssetCount: number
  resignedAt: string
}

export interface DepartmentChangeResponse {
  memberId: string
  memberNo: string
  name: string
  previousDepartmentId: string
  previousDepartmentName: string
  currentDepartmentId: string
  currentDepartmentName: string
  updatedAt: string
}
