import type { PageResponse } from './common'

export interface Company {
  companyId: number | string
  companyCode: string
  companyName?: string | null
  createdAt: string
  deletedAt?: string | null
  adminName?: string | null
  adminMemberNo?: string | null
  adminEmail?: string | null
  memberCount?: number
}

export interface CompanyListFilter {
  page?: number
  size?: number
  keyword?: string
}

export interface CompanyCreateRequest {
  companyCode: string
  companyName?: string
}

export interface CompanyDeleteResponse {
  companyId: number | string
  deletedAt: string
}

export type CompanyPage = PageResponse<Company>
