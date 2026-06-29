import { fetchEventSource } from '@microsoft/fetch-event-source'
import { onUnmounted, ref } from 'vue'

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

const isConnecting = ref(false)
const isConnected = ref(false)
const error = ref<unknown>(null)
const listeners = new Map<string, Set<SseHandler>>()

let abortController: AbortController | null = null
let activePath = ''
let consumerCount = 0

export function useEventSource() {
  consumerCount += 1

  function connect(path = '/notifications/subscribe') {
    if (abortController && activePath === path) return

    disconnect()
    activePath = path
    isConnecting.value = true
    abortController = new AbortController()

    void fetchEventSource(`${SSE_BASE_URL}${path}`, {
      method: 'GET',
      headers: createHeaders(),
      credentials: 'include',
      signal: abortController.signal,
      openWhenHidden: true,
      async onopen(response) {
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
        return RETRY_DELAY_MS
      },
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
