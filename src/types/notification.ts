import type { PageResponse } from './common'

export type NotificationType =
  | 'TICKET_STATUS_CHANGED'
  | 'ASSET_RETURN_DUE'
  | 'INTANGIBLE_ASSET_EXPIRING'
  | 'INSPECTION'
  | 'BUDGET_THRESHOLD'
  | 'SYSTEM'
  | (string & {})

export type NotificationTargetType =
  | 'TICKET'
  | 'PURCHASE'
  | 'PURCHASE_PLAN'
  | 'ASSET'
  | 'INSPECTION'
  | 'BUDGET'
  | 'SYSTEM'
  | (string & {})

export interface ServerNotification {
  notificationId: number
  notificationType: NotificationType
  title: string
  content: string
  targetType: NotificationTargetType
  targetId?: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationReadAllResponse {
  updatedCount: number
}

export interface NotificationReadResponse {
  notificationId: number
}

export interface NotificationUnreadCountResponse {
  unreadCount: number
}

export type NotificationListResponse = PageResponse<ServerNotification>
