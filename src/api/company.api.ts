import api from './client'
import type {
  Company,
  CompanyCreateRequest,
  CompanyDeleteResponse,
  CompanyListFilter,
  CompanyPage,
} from '@/types'

export const companyApi = {
  getList: (params?: CompanyListFilter) =>
    api.get<CompanyPage>('/companies', params as Record<string, unknown>),

  create: (body: CompanyCreateRequest) =>
    api.post<Company>('/companies', body),

  delete: (companyId: Company['companyId']) =>
    api.delete<CompanyDeleteResponse>(`/companies/${companyId}`),
}
