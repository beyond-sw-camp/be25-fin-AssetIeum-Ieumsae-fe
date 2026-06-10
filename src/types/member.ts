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
  // TODO: API 명세의 UUID string과 기존 프론트 number 모델 중 확정 타입 확인 필요
  memberId: number
  memberNo: string
  name: string
  email: string
  departmentId: number
  departmentName: string
  role: Role
  status: MemberStatus
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

export interface PasswordChangeResponse {
  // TODO: API 명세의 UUID string과 기존 프론트 number 모델 중 확정 타입 확인 필요
  memberId: number
  updatedAt: string
}

export interface DepartmentChangeRequest {
  departmentId: number
}
