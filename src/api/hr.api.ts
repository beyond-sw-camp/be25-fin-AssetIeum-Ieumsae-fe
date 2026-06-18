import api from './client'
import type {
  HrEventId,
  HrEventCreateRequest,
  HrEventResponse,
  HrEventSearchRequest,
  HrTemplateCreateRequest,
  HrTemplateResponse,
} from '@/types/hr'
import type { PageResponse } from '@/types'

export const hrApi = {
  // HR 템플릿
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

  // HR 이벤트 

  getEvents(params?: HrEventSearchRequest) {
    return api.get<PageResponse<HrEventResponse>>(
      '/hr-events',
      params as Record<string, unknown>,
    )
  },

  createEvent(payload: HrEventCreateRequest) {
    return api.post<HrEventResponse>(
      '/hr-events',
      payload,
    )
  },

  deleteEvent(eventId: HrEventId) {
    return api.delete<HrEventResponse>(
      `/hr-events/${encodeURIComponent(String(eventId))}`,
    )
  },

  completeEvent(eventId: HrEventId) {
    return api.patch<HrEventResponse>(
      `/hr-events/${encodeURIComponent(String(eventId))}/complete`,
    )
  }
}
