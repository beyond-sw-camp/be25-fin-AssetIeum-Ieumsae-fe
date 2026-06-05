import { defineStore } from 'pinia'
import { ref } from 'vue'

// =====================================================
// Notification Store - 시스템 알림 상태
// =====================================================

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number    // ms, 0이면 자동 닫힘 없음
  createdAt: number
}

export const useNotificationStore = defineStore('notification', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  /** 토스트 알림 목록 */
  const toasts = ref<Notification[]>([])

  /** 서버 알림 미읽음 수 */
  const unreadCount = ref(0)

  // ─── Actions ─────────────────────────────────────────────────────────────────

  function push(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 4000,
    }
    toasts.value.push(item)

    if (item.duration && item.duration > 0) {
      setTimeout(() => remove(id), item.duration)
    }
  }

  function remove(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  function success(title: string, message?: string) {
    push({ type: 'success', title, message })
  }

  function error(title: string, message?: string) {
    push({ type: 'error', title, message, duration: 6000 })
  }

  function warning(title: string, message?: string) {
    push({ type: 'warning', title, message })
  }

  function info(title: string, message?: string) {
    push({ type: 'info', title, message })
  }

  function setUnreadCount(count: number) {
    unreadCount.value = count
  }

  return {
    toasts,
    unreadCount,
    push,
    remove,
    success,
    error,
    warning,
    info,
    setUnreadCount,
  }
})
