import api, { ApiError } from './client'
import type {
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationReadResponse,
  NotificationUnreadCountResponse,
} from '@/types'

const NOTIFICATION_BASE = '/notifications'

export const notificationApi = {
  getSubscribePath() {
    return `${NOTIFICATION_BASE}/subscribe`
  },

  async getList(params?: { page?: number; size?: number }) {
    try {
      return await api.get<NotificationListResponse>(NOTIFICATION_BASE, params)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return api.get<NotificationListResponse>('/notificatoins', params)
      }
      throw error
    }
  },

  markAllAsRead() {
    return api.patch<NotificationReadAllResponse>(`${NOTIFICATION_BASE}/read-all`)
  },

  markAsRead(notificationId: number) {
    return api.patch<NotificationReadResponse>(`${NOTIFICATION_BASE}/${notificationId}/read`)
  },

  getUnreadCount() {
    return api.get<NotificationUnreadCountResponse>(`${NOTIFICATION_BASE}/unread-count`)
  },
}
