import { fetchEventSource } from '@microsoft/fetch-event-source'
import axios from 'axios'
import { onUnmounted, ref } from 'vue'

import type { ApiResponse } from '@/types'
import { AUTH_EXPIRED_EVENT } from '@/utils/authSession'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL
  || import.meta.env.VITE_API_BASE_URL
  || '/api/v1'
const ACCESS_TOKEN_KEY = 'accessToken'
const RETRY_DELAY_MS = 3000

export interface SseEvent<T = unknown> {
  type: string
  data: T
}

type SseHandler<T = unknown> = (event: SseEvent<T>) => void

class RetriableSseError extends Error {
  constructor(message = 'SSE 연결이 종료되었습니다.') {
    super(message)
    this.name = 'RetriableSseError'
  }
}

class NonRetriableSseError extends Error {
  constructor(message = 'SSE connection stopped.') {
    super(message)
    this.name = 'NonRetriableSseError'
  }
}

interface RefreshResponse {
  accessToken: string
}

const isConnecting = ref(false)
const isConnected = ref(false)
const error = ref<unknown>(null)
const listeners = new Map<string, Set<SseHandler>>()

let abortController: AbortController | null = null
let activePath = ''
let consumerCount = 0
let refreshPromise: Promise<string> | null = null

export function useEventSource() {
  consumerCount += 1

  function connect(path = '/notifications/subscribe') {
    if (abortController && activePath === path) return

    disconnect()
    activePath = path
    isConnecting.value = true
    abortController = new AbortController()
    const headers = createHeaders()

    void fetchEventSource(`${SSE_BASE_URL}${path}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: abortController.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.status === 401) {
          try {
            await refreshSseAccessToken()
            Object.assign(headers, createHeaders())
          } catch (caughtError) {
            const message = caughtError instanceof Error
              ? caughtError.message
              : 'SSE authentication failed.'
            throw new NonRetriableSseError(message)
          }

          throw new RetriableSseError('SSE access token refreshed.')
        }

        if (!response.ok) {
          throw new RetriableSseError(`SSE 연결 실패 (${response.status})`)
        }

        isConnected.value = true
        isConnecting.value = false
        error.value = null
      },
      onmessage(message) {
        if (!message.data.trim()) return

        dispatch({
          type: message.event || 'message',
          data: message.data,
        })
      },
      onclose() {
        isConnecting.value = false
        isConnected.value = false
        throw new RetriableSseError()
      },
      onerror(caughtError: unknown) {
        isConnecting.value = false
        isConnected.value = false
        error.value = caughtError

        if (caughtError instanceof NonRetriableSseError) {
          disconnect()
          notifyAuthExpired()
          throw caughtError
        }

        return RETRY_DELAY_MS
      },
    }).catch((caughtError: unknown) => {
      if (caughtError instanceof NonRetriableSseError) return
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return

      error.value = caughtError
    })
  }

  function createHeaders() {
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
    }
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    return headers
  }

  async function refreshSseAccessToken() {
    refreshPromise ??= axios.post<ApiResponse<RefreshResponse>>(
      `${API_BASE_URL}/auth/reissue`,
      null,
      { withCredentials: true },
    )
      .then((response) => {
        const token = response.data.data.accessToken
        localStorage.setItem(ACCESS_TOKEN_KEY, token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  function notifyAuthExpired() {
    if (typeof window === 'undefined') return

    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }

  function dispatch(event: { type: string; data: string }) {
    const handlers = Array.from(listeners.get(event.type) ?? [])

    for (const handler of handlers) {
      handler({
        type: event.type,
        data: parseEventData(event.data),
      })
    }
  }

  function parseEventData(data: string) {
    try {
      return JSON.parse(data) as unknown
    } catch {
      return data
    }
  }

  function on<T>(eventType: string, handler: SseHandler<T>) {
    const eventHandlers = listeners.get(eventType) ?? new Set<SseHandler>()
    eventHandlers.add(handler as SseHandler)
    listeners.set(eventType, eventHandlers)

    return () => {
      eventHandlers.delete(handler as SseHandler)
      if (eventHandlers.size === 0) {
        listeners.delete(eventType)
      }
    }
  }

  function disconnect() {
    abortController?.abort()
    abortController = null
    activePath = ''
    isConnecting.value = false
    isConnected.value = false
  }

  onUnmounted(() => {
    consumerCount = Math.max(0, consumerCount - 1)

    if (consumerCount === 0) {
      disconnect()
      listeners.clear()
    }
  })

  return {
    isConnecting,
    isConnected,
    error,
    connect,
    on,
    disconnect,
  }
}
