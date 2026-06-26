import { ref, computed } from 'vue'

// =====================================================
// useFilter - 필터/검색 상태 관리 (debounce 포함)
// =====================================================
// 사용 예:
//   const { filters, debouncedFilters, updateFilter, resetFilters } = useFilter({
//     keyword: '',
//     status: undefined,
//     departmentId: undefined,
//   })

export function useFilter<T extends object>(
  initialFilters: T,
  debounceMs = 300
) {
  const filters = ref<T>({ ...initialFilters }) as ReturnType<typeof ref<T>>

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const debouncedFilters = ref<T>({ ...initialFilters }) as ReturnType<typeof ref<T>>

  function updateFilter<K extends keyof T>(key: K, value: T[K]) {
    ;(filters.value as T)[key] = value

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      ;(debouncedFilters.value as T)[key] = value
    }, debounceMs)
  }

  function resetFilters() {
    filters.value = { ...initialFilters } as T
    debouncedFilters.value = { ...initialFilters } as T
  }

  /** undefined/null/빈 문자열 제거 후 API 파라미터로 변환 */
  const activeParams = computed(() => {
    return Object.fromEntries(
      Object.entries(debouncedFilters.value as Record<string, unknown>).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    ) as Partial<T>
  })

  return {
    filters,
    debouncedFilters,
    updateFilter,
    resetFilters,
    activeParams,
  }
}
