import { ref } from 'vue'

// =====================================================
// useModal - 모달/다이얼로그 상태 관리
// =====================================================
// 사용 예:
//   const { isOpen, openWith, close, payload } = useModal<TangibleAsset>()
//   openWith(selectedAsset)   // 수정 모달
//   openWith()                // 등록 모달

export function useModal<T = undefined>() {
  const isOpen = ref(false)
  const payload = ref<T | undefined>(undefined) as ReturnType<typeof ref<T | undefined>>

  function open() {
    payload.value = undefined
    isOpen.value = true
  }

  function openWith(data: T) {
    payload.value = data
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    payload.value = undefined
  }

  return { isOpen, payload, open, openWith, close }
}

// =====================================================
// useConfirm - 확인 다이얼로그 상태 관리
// =====================================================

export function useConfirm() {
  const isOpen = ref(false)
  const title = ref('')
  const message = ref('')
  const confirmLabel = ref('확인')
  const dangerMode = ref(false)

  let resolveRef: ((confirmed: boolean) => void) | null = null

  function confirm(options: {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
  }): Promise<boolean> {
    title.value = options.title
    message.value = options.message
    confirmLabel.value = options.confirmLabel ?? '확인'
    dangerMode.value = options.danger ?? false
    isOpen.value = true

    return new Promise((resolve) => {
      resolveRef = resolve
    })
  }

  function onConfirm() {
    isOpen.value = false
    resolveRef?.(true)
  }

  function onCancel() {
    isOpen.value = false
    resolveRef?.(false)
  }

  return {
    isOpen,
    title,
    message,
    confirmLabel,
    dangerMode,
    confirm,
    onConfirm,
    onCancel,
  }
}
