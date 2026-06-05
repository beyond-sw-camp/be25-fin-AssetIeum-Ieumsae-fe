import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// =====================================================
// usePagination - 페이지네이션 상태 관리
// =====================================================
// URL query 파라미터와 동기화 지원

export interface PaginationOptions {
  defaultPage?: number
  defaultSize?: number
  syncUrl?: boolean   // URL query param과 동기화 여부
}

export function usePagination(options: PaginationOptions = {}) {
  const { defaultPage = 0, defaultSize = 20, syncUrl = false } = options

  const route = useRoute()
  const router = useRouter()

  const page = ref<number>(
    syncUrl ? Number(route.query.page ?? defaultPage) : defaultPage
  )
  const size = ref<number>(
    syncUrl ? Number(route.query.size ?? defaultSize) : defaultSize
  )
  const totalElements = ref(0)
  const totalPages = ref(0)

  function setPage(newPage: number) {
    page.value = newPage
    if (syncUrl) {
      router.replace({ query: { ...route.query, page: newPage } })
    }
  }

  function setSize(newSize: number) {
    size.value = newSize
    page.value = 0
    if (syncUrl) {
      router.replace({ query: { ...route.query, size: newSize, page: 0 } })
    }
  }

  function updateFromResponse(data: {
    totalElements: number
    totalPages: number
    page?: number
    size?: number
  }) {
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages
    if (data.page !== undefined) page.value = data.page
    if (data.size !== undefined) size.value = data.size
  }

  function reset() {
    page.value = defaultPage
    size.value = defaultSize
    totalElements.value = 0
    totalPages.value = 0
  }

  return {
    page,
    size,
    totalElements,
    totalPages,
    setPage,
    setSize,
    updateFromResponse,
    reset,
  }
}
