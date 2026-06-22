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
  targetId: number | string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationCreateRequest {
  receiverId?: number | string
  receiverIds?: Array<number | string>
  sendToAll?: boolean
  notificationType: NotificationType
  title: string
  content: string
  targetType: NotificationTargetType
  targetId: number | string
}

export interface NotificationCreateResponse {
  createdCount: number
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

export interface NotificationPreferences {
  system: boolean
  ticketStatus: boolean
  assetReturnDue: boolean
  intangibleExpiration: boolean
  inspection: boolean
  budgetThreshold: boolean
  email: boolean
}
