<template>
  <div ref="popoverRoot" class="relative">
    <button
      type="button"
      class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-sub transition-colors duration-300 hover:bg-surface-secondary"
      aria-label="알림"
      @click="togglePopover"
    >
      <Bell :size="18" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white"
      >
        {{ displayUnreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 class="text-sm font-bold text-text-main">알림</h2>
          <p class="mt-0.5 text-xs text-text-sub">읽지 않은 알림 {{ unreadCount }}개</p>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary"
            aria-label="새로고침"
            title="새로고침"
            @click="loadNotifications"
          >
            <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="전체 확인"
            title="전체 확인"
            :disabled="unreadCount === 0 || isMarkingAll"
            @click="markAllAsRead"
          >
            <CheckCheck :size="16" />
          </button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="border-b border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger"
      >
        {{ errorMessage }}
      </div>

      <div class="max-h-[420px] overflow-y-auto">
        <div v-if="isLoading && notifications.length === 0" class="space-y-3 px-4 py-4">
          <div v-for="index in 4" :key="index" class="animate-pulse rounded-lg border border-border p-3">
            <div class="h-3 w-2/3 rounded bg-surface-secondary" />
            <div class="mt-3 h-2 w-full rounded bg-surface-secondary" />
            <div class="mt-2 h-2 w-1/2 rounded bg-surface-secondary" />
          </div>
        </div>

        <div v-else-if="notifications.length === 0" class="px-4 py-10 text-center">
          <BellOff class="mx-auto text-text-sub" :size="24" />
          <p class="mt-3 text-sm font-semibold text-text-main">도착한 알림이 없습니다.</p>
          <p class="mt-1 text-xs text-text-sub">새 알림이 생기면 이곳에서 확인할 수 있습니다.</p>
        </div>

        <button
          v-for="notification in notifications"
          v-else
          :key="notification.notificationId"
          type="button"
          class="block w-full border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-secondary"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="notification.isRead ? 'bg-border' : 'bg-primary'"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <p class="line-clamp-1 text-sm font-bold text-text-main">
                  {{ notification.title }}
                </p>
                <span class="shrink-0 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-text-sub">
                  {{ getTypeLabel(notification.notificationType) }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-sm leading-5 text-text-sub">
                {{ notification.content }}
              </p>
              <p class="mt-2 text-xs text-text-sub">
                {{ formatDateTime(notification.createdAt) }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Bell, BellOff, CheckCheck, RefreshCw } from 'lucide-vue-next'
import { useRouter, type RouteLocationRaw } from 'vue-router'

import { ApiError, notificationApi } from '@/api'
import { useEventSource } from '@/composables/useEventSource'
import type { NotificationType, ServerNotification } from '@/types'

const MAX_BADGE_COUNT = 99

const isOpen = ref(false)
const isLoading = ref(false)
const isMarkingAll = ref(false)
const errorMessage = ref('')
const notifications = ref<ServerNotification[]>([])
const unreadCount = ref(0)
const popoverRoot = ref<HTMLElement | null>(null)

const router = useRouter()
const eventSource = useEventSource()
let offNotificationEvent: (() => void) | null = null
let offMessageEvent: (() => void) | null = null

const displayUnreadCount = computed(() => (
  unreadCount.value > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount.value
))

onMounted(() => {
  void loadUnreadCount()
  connectRealtimeNotifications()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  offNotificationEvent?.()
  offMessageEvent?.()
  document.removeEventListener('click', handleDocumentClick)
})

async function togglePopover() {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    await loadNotifications()
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!isOpen.value) return

  const target = event.target
  if (!(target instanceof Node)) return
  if (popoverRoot.value?.contains(target)) return

  isOpen.value = false
}

async function loadNotifications() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await notificationApi.getList({ page: 0, size: 10 })
    notifications.value = response.data.content
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '알림 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

async function loadUnreadCount() {
  try {
    const response = await notificationApi.getUnreadCount()
    unreadCount.value = response.data.unreadCount
  } catch {
    unreadCount.value = 0
  }
}

async function markAsRead(notification: ServerNotification) {
  if (notification.isRead) return

  try {
    await notificationApi.markAsRead(notification.notificationId)
    notification.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '알림 읽음 처리에 실패했습니다.')
  }
}

async function handleNotificationClick(notification: ServerNotification) {
  await markAsRead(notification)

  const routeLocation = resolveNotificationRoute(notification)
  if (!routeLocation) return

  isOpen.value = false
  await router.push(routeLocation)
}

async function markAllAsRead() {
  isMarkingAll.value = true
  errorMessage.value = ''

  try {
    await notificationApi.markAllAsRead()
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      isRead: true,
    }))
    unreadCount.value = 0
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '전체 알림 읽음 처리에 실패했습니다.')
  } finally {
    isMarkingAll.value = false
  }
}

function connectRealtimeNotifications() {
  try {
    eventSource.connect(notificationApi.getSubscribePath())
    offNotificationEvent = eventSource.on<ServerNotification>('notification', handleIncomingNotification)
    offMessageEvent = eventSource.on<ServerNotification>('message', handleIncomingNotification)
  } catch {
    // SSE is optional for the popover; the list and unread-count APIs remain available.
  }
}

function handleIncomingNotification(event: { data: ServerNotification }) {
  const incoming = event.data
  const existingNotification = notifications.value.find((notification) => (
    notification.notificationId === incoming.notificationId
  ))

  notifications.value = [
    incoming,
    ...notifications.value.filter((notification) => (
      notification.notificationId !== incoming.notificationId
    )),
  ].slice(0, 10)

  if (!incoming.isRead && !existingNotification) {
    unreadCount.value += 1
  }
}

function resolveNotificationRoute(notification: ServerNotification): RouteLocationRaw | null {
  const targetId = normalizeTargetId(notification.targetId)
  if (!targetId) return null

  const targetType = String(notification.targetType).trim().toUpperCase()
  const notificationType = String(notification.notificationType).trim().toUpperCase()

  if (targetType === 'TICKET' || notificationType === 'TICKET_STATUS_CHANGED') {
    return {
      name: 'TicketDetail',
      params: { ticketId: targetId },
    }
  }

  if (targetType === 'PURCHASE' || targetType === 'PURCHASE_PLAN') {
    return {
      name: 'Purchase',
      query: { planId: targetId },
    }
  }

  return null
}

function normalizeTargetId(value: ServerNotification['targetId']) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function getTypeLabel(type: NotificationType) {
  const labels: Record<string, string> = {
    TICKET_STATUS_CHANGED: '티켓',
    ASSET_RETURN_DUE: '반납',
    INTANGIBLE_ASSET_EXPIRING: '만료',
    INSPECTION: '전수조사',
    BUDGET_THRESHOLD: '예산',
    SYSTEM: '시스템',
  }

  return labels[type] ?? '알림'
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
</script>
