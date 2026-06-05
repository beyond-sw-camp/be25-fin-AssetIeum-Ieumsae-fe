import { onUnmounted, ref } from 'vue'

const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL
  || import.meta.env.VITE_API_BASE_URL
  || '/api/v1'

export interface SseEvent<T = unknown> {
  type: string
  data: T
}

/**
 * 알림 API 명세의 GET /notifications/subscribe를 위한 SSE 기본 틀.
 * EventSource는 임의 Authorization 헤더를 넣을 수 없으므로 쿠키 인증을 전제로 한다.
 */
export function useEventSource() {
  const source = ref<EventSource | null>(null)
  const isConnected = ref(false)
  const error = ref<Event | null>(null)

  function connect(path = '/notifications/subscribe') {
    disconnect()

    source.value = new EventSource(`${SSE_BASE_URL}${path}`, {
      withCredentials: true,
    })

    source.value.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    source.value.onerror = (event) => {
      isConnected.value = false
      error.value = event
    }
  }

  function on<T>(eventType: string, handler: (event: SseEvent<T>) => void) {
    const listener = (event: MessageEvent<string>) => {
      handler({
        type: eventType,
        data: JSON.parse(event.data) as T,
      })
    }

    source.value?.addEventListener(eventType, listener as EventListener)
    return () => source.value?.removeEventListener(eventType, listener as EventListener)
  }

  function disconnect() {
    source.value?.close()
    source.value = null
    isConnected.value = false
  }

  onUnmounted(disconnect)

  return {
    source,
    isConnected,
    error,
    connect,
    on,
    disconnect,
  }
}
