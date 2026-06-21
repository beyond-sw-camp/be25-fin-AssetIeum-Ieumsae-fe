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
        <video
          ref="videoRef"
          class="aspect-[3/4] w-full object-cover"
          autoplay
          muted
          playsinline
        />
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'

interface BarcodeDetectorConstructor {
  new(options?: { formats?: string[] }): {
    detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>
  }
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: BarcodeDetectorConstructor
}

const emit = defineEmits<{
  detected: [value: string]
  close: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isScanning = ref(false)
const manualCode = ref('')
const message = ref('')
const canTryCamera = ref(true)

const helperText = computed(() => (
  canTryCamera.value
    ? 'QR 인식이 어렵다면 자산 번호를 직접 입력해주세요.'
    : '현재 접속 환경에서는 직접 입력으로 검수를 진행해주세요.'
))

onMounted(startCamera)
onBeforeUnmount(stopCamera)

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
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })

    if (!videoRef.value) return

    videoRef.value.srcObject = stream.value
    await videoRef.value.play()
    startBarcodeLoop()
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

function stopCamera() {
  isScanning.value = false
  stream.value?.getTracks().forEach((track) => track.stop())
  stream.value = null
}

async function startBarcodeLoop() {
  const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector
  if (!BarcodeDetector || !videoRef.value) {
    message.value = 'QR 자동 인식이 지원되지 않으면 자산 번호를 직접 입력해주세요.'
    return
  }

  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  isScanning.value = true

  while (isScanning.value && videoRef.value) {
    try {
      const codes = await detector.detect(videoRef.value)
      const rawValue = codes[0]?.rawValue
      if (rawValue) {
        emit('detected', rawValue)
        return
      }
    } catch {
      message.value = 'QR 자동 인식이 어렵습니다. 자산 번호를 직접 입력해주세요.'
      return
    }

    await new Promise((resolve) => window.setTimeout(resolve, 500))
  }
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
