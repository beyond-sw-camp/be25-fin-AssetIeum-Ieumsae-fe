import { defineStore } from 'pinia'
import { ref } from 'vue'

const MAX_TOAST_COUNT = 5

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
    const isDuplicate = toasts.value.some((toast) =>
      toast.type === notification.type
      && toast.title === notification.title
      && toast.message === notification.message
    )

    if (isDuplicate) return

    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 3000,
    }
    toasts.value.push(item)

    if (toasts.value.length > MAX_TOAST_COUNT) {
      toasts.value.splice(0, toasts.value.length - MAX_TOAST_COUNT)
    }

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
    push({ type: 'error', title, message, duration: 5000 })
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
