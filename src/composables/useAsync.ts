import { ref } from 'vue'
import { useNotificationStore } from '@/stores'

// =====================================================
// useAsync - 비동기 API 호출 공통 패턴
// =====================================================
// 사용 예:
//   const { execute, isLoading, error } = useAsync(memberApi.getList)
//   const members = await execute({ page: 0, size: 20 })

export function useAsync<TArgs extends unknown[], TResult>(
  asyncFn: (...args: TArgs) => Promise<TResult>,
  options: {
    /** 에러 발생 시 자동으로 토스트를 보여줄지 여부 (기본 true) */
    showError?: boolean
    errorMessage?: string
  } = {}
) {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const notif = useNotificationStore()

  async function execute(...args: TArgs): Promise<TResult | null> {
    isLoading.value = true
    error.value = null
    try {
      const result = await asyncFn(...args)
      return result
    } catch (e) {
      error.value = e as Error
      if (options.showError !== false) {
        const msg = options.errorMessage
          ?? (e as { message?: string })?.message
          ?? '오류가 발생했습니다.'
        notif.error('오류', msg)
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { execute, isLoading, error }
}
