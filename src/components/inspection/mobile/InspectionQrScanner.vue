<template>
  <div class="fixed inset-0 z-50 flex items-end bg-black/60 md:items-center md:justify-center">
    <div class="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-xl md:max-w-md md:rounded-2xl">
      <div class="flex items-center justify-between">
        <p class="text-base font-bold text-text-main">QR 스캔</p>
        <button
          type="button"
          class="rounded-lg p-2 text-text-sub hover:bg-surface-secondary"
          aria-label="QR 스캔 닫기"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div
        v-if="canTryCamera"
        class="mt-4 overflow-hidden rounded-lg bg-black"
      >
        <div :id="readerId" class="aspect-[3/4] w-full overflow-hidden" />
      </div>

      <div
        v-else
        class="mt-4 rounded-lg border border-dashed border-border bg-surface-secondary px-4 py-8 text-center"
      >
        <p class="text-sm font-bold text-text-main">
          카메라를 사용할 수 없습니다.
        </p>
        <p class="mt-2 text-xs leading-relaxed text-text-sub">
          {{ message || '자산 번호를 직접 입력해주세요.' }}
        </p>
      </div>

      <p class="mt-3 text-center text-xs text-text-sub">
        {{ helperText }}
      </p>

      <div class="mt-4 grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
        <Input
          id="mobile-inspection-manual-code"
          v-model="manualCode"
          class="min-w-0 flex-1"
          placeholder="자산 번호 입력"
          @keyup.enter="emitDetected"
        />
        <Button class="w-20" @click="emitDetected">
          찾기
        </Button>
      </div>

      <p
        v-if="message && canTryCamera"
        class="mt-3 rounded-lg bg-surface-secondary px-3 py-2 text-xs text-text-sub"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'

const emit = defineEmits<{
  detected: [value: string]
  close: []
}>()

const readerId = `inspection-qr-reader-${Math.random().toString(36).slice(2)}`
const scanner = ref<Html5Qrcode | null>(null)
const isDetected = ref(false)
const manualCode = ref('')
const message = ref('')
const canTryCamera = ref(true)

const helperText = computed(() => (
  canTryCamera.value
    ? 'QR 인식이 어렵다면 자산 번호를 직접 입력해주세요.'
    : '현재 접속 환경에서는 직접 입력으로 검수를 진행해주세요.'
))

onMounted(() => void startCamera())
onBeforeUnmount(() => void stopCamera())

async function startCamera() {
  if (!isCameraAllowedContext()) {
    canTryCamera.value = false
    message.value = '휴대폰 브라우저 카메라는 HTTPS 주소에서만 사용할 수 있습니다. 현재처럼 IP 주소를 HTTP로 열면 브라우저가 카메라를 차단합니다.'
    return
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    canTryCamera.value = false
    message.value = '이 브라우저에서는 카메라 기능을 지원하지 않습니다.'
    return
  }

  try {
    await nextTick()
    scanner.value = new Html5Qrcode(readerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    await scanner.value.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7)
          return { width: size, height: size }
        },
      },
      (decodedText) => void handleDetected(decodedText),
      undefined,
    )
  } catch (error) {
    canTryCamera.value = false
    message.value = getCameraErrorMessage(error)
  }
}

function isCameraAllowedContext() {
  if (window.isSecureContext) return true

  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
    }

    if (error.name === 'NotFoundError') {
      return '사용 가능한 카메라를 찾지 못했습니다.'
    }

    if (error.name === 'NotReadableError') {
      return '카메라가 다른 앱에서 사용 중이거나 접근할 수 없습니다.'
    }
  }

  return '카메라를 시작하지 못했습니다. 자산 번호를 직접 입력해주세요.'
}

async function stopCamera() {
  const currentScanner = scanner.value
  scanner.value = null
  if (!currentScanner) return

  try {
    if (currentScanner.isScanning) await currentScanner.stop()
    currentScanner.clear()
  } catch {
    // The scanner may already be stopped while the drawer is closing.
  }
}

async function handleDetected(value: string) {
  if (isDetected.value) return
  isDetected.value = true
  await stopCamera()
  emit('detected', value)
}

function emitDetected() {
  const code = manualCode.value.trim()
  if (!code) {
    message.value = '자산 번호를 입력해주세요.'
    return
  }

  emit('detected', code)
}
</script>
