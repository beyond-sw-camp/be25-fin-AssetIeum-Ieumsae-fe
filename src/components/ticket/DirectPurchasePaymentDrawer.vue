<template>
  <BaseDrawer
    :is-open="isOpen"
    panel-class="w-full max-w-[440px]"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <ReceiptText :size="20" class="text-orange-500" />
        <h2 class="text-lg font-bold text-text-main">결제 금액 입력 및 영수증 업로드</h2>
      </div>
    </template>

    <div class="space-y-7">
      <section class="rounded-xl border border-border bg-surface-secondary/70 p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
            구매 진행 중
          </span>
          <span class="text-xs font-semibold text-text-sub">
            {{ formatDate(ticket.requestedAt, 'YYYY-MM-DD HH:mm') }}
          </span>
        </div>
        <p class="mt-3 text-base font-bold text-text-main">{{ itemName }}</p>
        <div class="mt-4 border-t border-border pt-4">
          <p class="text-xs font-semibold text-text-muted">요청 사유</p>
          <p class="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-text-main">
            {{ ticket.requestReason || '-' }}
          </p>
        </div>
      </section>

      <section>
        <h3 class="flex items-center gap-2 text-sm font-bold text-orange-600">
          <span class="h-2 w-2 rounded-full bg-orange-500" />
          결제 내역 입력
        </h3>

        <div class="mt-5 space-y-5">
          <div>
            <label
              for="direct-purchase-actual-price"
              class="text-sm font-semibold text-text-main"
            >
              실제 결제 금액 입력
              <span class="text-orange-500">*</span>
            </label>
            <div class="relative mt-2">
              <input
                id="direct-purchase-actual-price"
                :value="formattedActualPrice"
                type="text"
                inputmode="numeric"
                placeholder="0"
                :disabled="submitting"
                class="h-11 w-full rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                @input="handleActualPriceInput"
              />
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-sub">
                원
              </span>
            </div>
          </div>

          <div>
            <p class="text-sm font-semibold text-text-main">
              증빙 서류 업로드
              <span class="text-orange-500">*</span>
            </p>
            <input
              ref="fileInput"
              type="file"
              class="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              :disabled="submitting"
              @change="handleFileChange"
            />
            <button
              type="button"
              class="mt-2 flex min-h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary/50 px-4 py-6 text-center transition hover:border-orange-400 hover:bg-orange-50/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
              @click="fileInput?.click()"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <UploadCloud :size="28" class="text-text-sub" />
              <span class="mt-2 text-sm font-semibold text-text-main">
                파일을 마우스로 끌어오거나 클릭하세요
              </span>
              <span class="mt-1 text-xs text-text-muted">
                영수증, 카드 승인 내역 등 (PDF, JPG, PNG)
              </span>
            </button>

            <div
              v-if="selectedFile"
              class="mt-2 flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-text-main">{{ selectedFile.name }}</p>
                <p class="text-xs text-text-muted">{{ formattedFileSize }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded p-1 text-text-sub transition hover:bg-orange-100 hover:text-orange-600"
                aria-label="선택한 파일 제거"
                :disabled="submitting"
                @click="clearSelectedFile"
              >
                <X :size="16" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <p
        v-if="displayErrorMessage"
        class="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
        role="alert"
      >
        {{ displayErrorMessage }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="m"
          :disabled="submitting"
          @click="handleClose"
        >
          취소
        </Button>
        <Button
          size="m"
          class="bg-orange-500! text-white! hover:bg-orange-600! focus:ring-orange-500/50!"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        >
          결제 정보 저장
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ReceiptText, UploadCloud, X } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type { TicketDetail } from '@/types'
import { formatDate } from '@/utils/labels'

interface Props {
  isOpen: boolean
  ticket: TicketDetail
  submitting?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  errorMessage: '',
})

const emit = defineEmits<{
  close: []
  submit: [payload: { actualPrice: number; file: File }]
}>()

const ACCEPTED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])
const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

const fileInput = ref<HTMLInputElement | null>(null)
const actualPrice = ref('')
const selectedFile = ref<File | null>(null)
const validationErrorMessage = ref('')

const itemName = computed(() => (
  props.ticket.requestedItemName
  ?? props.ticket.requestedItemDetail
  ?? props.ticket.productName
  ?? '-'
))

const formattedActualPrice = computed(() => (
  actualPrice.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
))

const formattedFileSize = computed(() => {
  if (!selectedFile.value) return ''
  const kilobytes = selectedFile.value.size / 1024
  return kilobytes >= 1024
    ? `${(kilobytes / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(kilobytes))} KB`
})

const canSubmit = computed(() => (
  Number(actualPrice.value) > 0
  && selectedFile.value !== null
  && !props.submitting
))

const displayErrorMessage = computed(() => (
  validationErrorMessage.value || props.errorMessage
))

function resetForm() {
  actualPrice.value = props.ticket.actualAmount
    ? String(props.ticket.actualAmount)
    : ''
  selectedFile.value = null
  validationErrorMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function handleActualPriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  actualPrice.value = digits
  input.value = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  validationErrorMessage.value = ''
}

function isAcceptedFile(file: File) {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_FILE_TYPES.has(file.type)
    || ACCEPTED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
}

function selectFile(file: File | undefined) {
  if (!file) return
  if (!isAcceptedFile(file)) {
    selectedFile.value = null
    validationErrorMessage.value = 'PDF, JPG, PNG 형식의 증빙 파일만 업로드할 수 있습니다.'
    return
  }

  selectedFile.value = file
  validationErrorMessage.value = ''
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectFile(input.files?.[0])
}

function handleFileDrop(event: DragEvent) {
  if (props.submitting) return
  selectFile(event.dataTransfer?.files[0])
}

function clearSelectedFile() {
  selectedFile.value = null
  validationErrorMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function handleClose() {
  if (props.submitting) return
  emit('close')
}

function handleSubmit() {
  const price = Number(actualPrice.value)
  if (!Number.isInteger(price) || price <= 0) {
    validationErrorMessage.value = '실제 결제 금액을 입력해주세요.'
    return
  }
  if (!selectedFile.value) {
    validationErrorMessage.value = '영수증 또는 결제 증빙 파일을 업로드해주세요.'
    return
  }

  validationErrorMessage.value = ''
  emit('submit', { actualPrice: price, file: selectedFile.value })
}

watch(
  () => [props.isOpen, props.ticket.ticketId] as const,
  ([isOpen]) => {
    if (isOpen) resetForm()
  },
)
</script>
