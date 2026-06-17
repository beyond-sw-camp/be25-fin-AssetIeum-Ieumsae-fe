import api from './client'
import type {
  HrTemplateCreateRequest,
  HrTemplateResponse,
} from '@/types/hr'

export const hrApi = {
  createTemplate(payload: HrTemplateCreateRequest) {
    return api.post<HrTemplateResponse>(
      '/hr-templates',
      payload,
    )
  },

  getTemplate() {
    return api.get<HrTemplateResponse>(
      '/hr-templates',
    )
  },


  deleteTemplate() {
    return api.delete<HrTemplateResponse>(
      '/hr-templates',
    )
  },
}