import api from './client'
import { mockLogApi } from '@/mocks/logs'
import type { ActivityLog, AuditLog, LogListFilter, PageResponse } from '@/types'

function compactParams(params?: LogListFilter) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const logApi = {
  getAuditLogs: async (params?: LogListFilter) => {
    try {
      return await api.get<PageResponse<AuditLog>>('/logs/audit', compactParams(params))
    } catch (error) {
      console.warn('감사 로그 API 미구현 또는 실패 - mock 데이터로 대체합니다.', error)
      return mockLogApi.getAuditLogs(params)
    }
  },

  getActivityLogs: async (params?: LogListFilter) => {
    try {
      return await api.get<PageResponse<ActivityLog>>('/logs/activity', compactParams(params))
    } catch (error) {
      console.warn('활동 로그 API 미구현 또는 실패 - mock 데이터로 대체합니다.', error)
      return mockLogApi.getActivityLogs(params)
    }
  },
}
