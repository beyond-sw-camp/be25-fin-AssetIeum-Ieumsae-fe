import type { MemberStatus, Role } from './common'

// =====================================================
// 인증 관련 타입
// =====================================================

export interface LoginRequest {
  memberNo: string
  password: string
}

export interface LoginResponse {
  memberId: number
  memberNo: string
  name: string
  email: string
  departmentId: number
  departmentName: string
  role: Role
  accessToken: string
  refreshToken: string
}

export type AuthUser = Omit<LoginResponse, 'accessToken' | 'refreshToken'>

// =====================================================
// 사원(Member) 관련 타입
// =====================================================

export interface Member {
  memberId: number
  memberNo: string
  name: string
  email: string | null
  departmentId: number
  departmentName: string
  role: Role
  status: MemberStatus
  createdAt: string
}

export interface MemberRegisterRequest {
  memberNo: string
  password: string
  name: string
  email?: string
  departmentId: number
  role: Role
}

export interface MemberListFilter {
  page?: number
  size?: number
  departmentId?: number
  role?: Role
  status?: MemberStatus
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface DepartmentChangeRequest {
  departmentId: number
}
