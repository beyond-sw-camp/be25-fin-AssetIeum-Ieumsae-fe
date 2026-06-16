import api from './client'
import type { ActivityLog, AuditLog, LogListFilter, PageResponse } from '@/types'

function compactParams(params?: LogListFilter) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const logApi = {
  getAuditLogs: (params?: LogListFilter) =>
    api.get<PageResponse<AuditLog>>('/logs/audit', compactParams(params)),

  getActivityLogs: (params?: LogListFilter) =>
    api.get<PageResponse<ActivityLog>>('/logs/activity', compactParams(params)),
}
