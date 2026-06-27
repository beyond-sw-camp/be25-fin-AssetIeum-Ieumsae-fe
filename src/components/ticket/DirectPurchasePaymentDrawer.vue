<template>
  <BaseDrawer
    :is-open="isOpen"
    panel-class="w-full max-w-[680px]"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <ReceiptText :size="20" class="text-orange-500" />
        <h2 class="text-lg font-bold text-text-main">직접구매 결제 정보 등록</h2>
      </div>
    </template>

    <div class="space-y-7">
      <section class="rounded-lg border border-border bg-surface-secondary/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
            직접구매 진행 중
          </span>
          <span class="text-xs font-semibold text-text-sub">
            {{ formatDate(ticket.requestedAt, 'YYYY-MM-DD HH:mm') }}
          </span>
        </div>
        <p class="mt-3 text-base font-bold text-text-main">{{ itemName }}</p>
        <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-text-sub">
          <span>요청 수량 {{ requestedQuantity }}개</span>
          <span>{{ isTangibleAsset ? '유형자산' : '무형자산' }}</span>
        </div>
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
          공통 결제 정보
        </h3>

        <div class="mt-5 space-y-5">
          <div>
            <label
              for="direct-purchase-actual-price"
              class="text-sm font-semibold text-text-main"
            >
              실제 결제 금액
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

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-semibold text-text-main">
                구매 일시
                <span class="text-orange-500">*</span>
              </span>
              <input
                v-model="purchaseDate"
                type="datetime-local"
                :disabled="submitting"
                class="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-main outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
              />
            </label>
            <label class="block">
              <span class="text-sm font-semibold text-text-main">
                구매처
                <span class="text-orange-500">*</span>
              </span>
              <input
                v-model.trim="purchaseVendor"
                type="text"
                :disabled="submitting"
                class="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-main outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
              />
            </label>
          </div>

          <div
            v-if="isTangibleAsset"
            class="grid gap-4 sm:grid-cols-2"
          >
            <label class="block">
              <span class="text-sm font-semibold text-text-main">
                사용 위치
                <span class="text-orange-500">*</span>
              </span>
              <input
                v-model.trim="assetLocation"
                type="text"
                placeholder="본사 3층 개발본부"
                :disabled="submitting"
                class="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
              />
            </label>
            <label class="block">
              <span class="text-sm font-semibold text-text-main">
                보증 만료 일시
                <span class="text-orange-500">*</span>
              </span>
              <input
                v-model="warrantyExpiredAt"
                type="datetime-local"
                :disabled="submitting"
                class="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-main outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
              />
            </label>
          </div>

          <div>
            <p class="text-sm font-semibold text-text-main">
              영수증 증빙
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
                파일을 끌어오거나 클릭해서 업로드
              </span>
              <span class="mt-1 text-xs text-text-muted">
                영수증, 카드 승인 내역 등 선택 업로드 (PDF, JPG, PNG)
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

            <div class="mt-3 rounded-lg border border-border bg-surface-secondary/40">
              <div class="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                <p class="text-xs font-bold text-text-sub">등록된 증빙 파일</p>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="isEvidenceFilesLoading || submitting"
                  @click="loadEvidenceFiles"
                >
                  <RefreshCw :size="13" />
                  새로고침
                </button>
              </div>

              <div v-if="isEvidenceFilesLoading" class="px-3 py-3 text-xs font-semibold text-text-muted">
                증빙 파일을 조회하고 있습니다.
              </div>
              <div
                v-else-if="evidenceFiles.length"
                class="divide-y divide-border"
              >
                <div
                  v-for="file in evidenceFiles"
                  :key="String(file.fileId)"
                  class="flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <button
                    type="button"
                    class="min-w-0 text-left text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="submitting"
                    @click="openEvidenceFile(file)"
                  >
                    <span class="block truncate">{{ file.originalFilename || extractFilename(file.fileUrl) }}</span>
                    <span class="mt-0.5 block text-xs font-medium text-text-muted">
                      {{ formatFileSize(file.fileSize) }} · {{ formatDate(file.uploadedAt, 'YYYY-MM-DD HH:mm') }}
                    </span>
                  </button>
                  <button
                    type="button"
                    class="inline-flex shrink-0 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="submitting || deletingEvidenceFileId === String(file.fileId)"
                    @click="deleteEvidenceFile(file)"
                  >
                    <Trash2 :size="13" />
                    {{ deletingEvidenceFileId === String(file.fileId) ? '삭제 중' : '삭제' }}
                  </button>
                </div>
              </div>
              <p
                v-else
                class="px-3 py-3 text-xs font-semibold text-text-muted"
              >
                등록된 증빙 파일이 없습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="flex items-center gap-2 text-sm font-bold text-orange-600">
            <span class="h-2 w-2 rounded-full bg-orange-500" />
            자산별 등록 정보
          </h3>
          <span class="text-xs font-semibold text-text-sub">
            요청 수량 기준 {{ requestedQuantity }}건 입력
          </span>
        </div>

        <div class="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
          <div
            v-if="isTangibleAsset"
            class="hidden grid-cols-[2.25rem_minmax(0,1fr)] gap-2 border-b border-border bg-surface-secondary px-3 py-2 text-xs font-bold text-text-sub md:grid"
          >
            <span class="text-center">No</span>
            <span>시리얼 번호</span>
          </div>
          <div
            v-else
            class="hidden grid-cols-[3rem_minmax(0,1fr)_6rem_12rem_12rem] gap-2 border-b border-border bg-surface-secondary px-3 py-2 text-xs font-bold text-text-sub md:grid"
          >
            <span>No.</span>
            <span>라이선스 코드</span>
            <span>좌석 수</span>
            <span>시작 일시</span>
            <span>만료 일시</span>
          </div>

          <div
            v-for="(asset, index) in assetDrafts"
            :key="`compact-${asset.key}`"
            :class="[
              'grid gap-2 px-3 py-3',
              index > 0 ? 'border-t border-border' : '',
              isTangibleAsset
                ? 'md:grid-cols-[2.25rem_minmax(0,1fr)] md:items-center'
                : 'md:grid-cols-[3rem_minmax(0,1fr)_6rem_12rem_12rem] md:items-center',
            ]"
          >
            <div class="flex items-center gap-2 md:block">
              <span class="block text-center text-xs font-semibold tabular-nums text-text-sub">
                {{ formatRowNumber(index) }}
              </span>
              <span class="text-xs font-semibold text-text-muted md:hidden">
                {{ isTangibleAsset ? '유형자산' : '무형자산' }}
              </span>
            </div>

            <template v-if="isTangibleAsset">
              <label>
                <span class="sr-only">시리얼 번호</span>
                <input
                  v-model.trim="asset.serialNumber"
                  type="text"
                  placeholder="시리얼 번호"
                  :disabled="submitting"
                  class="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                />
              </label>
            </template>

            <template v-else>
              <label>
                <span class="sr-only">라이선스 코드</span>
                <input
                  v-model.trim="asset.licenseCode"
                  type="text"
                  placeholder="라이선스 코드"
                  :disabled="submitting"
                  class="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                />
              </label>
              <label>
                <span class="sr-only">사용 좌석 수</span>
                <input
                  v-model="asset.seatCount"
                  type="number"
                  min="1"
                  placeholder="좌석"
                  :disabled="submitting"
                  class="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                />
              </label>
              <label>
                <span class="sr-only">사용 시작 일시</span>
                <input
                  v-model="asset.startedAt"
                  type="datetime-local"
                  :disabled="submitting"
                  class="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text-main outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                />
              </label>
              <label>
                <span class="sr-only">만료 일시</span>
                <input
                  v-model="asset.expiredAt"
                  type="datetime-local"
                  :disabled="submitting"
                  class="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text-main outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-surface-secondary"
                />
              </label>
            </template>
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
          {{ submitLabel }}
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ReceiptText, RefreshCw, Trash2, UploadCloud, X } from 'lucide-vue-next'

import { fileApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type { DirectPurchasePaymentRequest, TicketActualAmountResponse, TicketDetail } from '@/types'
import type { FileMetadata } from '@/types/file'
import { formatDate } from '@/utils/labels'

export interface DirectPurchaseAssetPaymentDraft {
  index: number
  serialNumber: string | null
  location: string | null
  warrantyExpiredAt: string | null
  licenseCode: string | null
  seatCount: number | null
  startedAt: string | null
  expiredAt: string | null
}

type EditableAssetDraft = {
  key: string
  serialNumber: string
  location: string
  warrantyExpiredAt: string
  licenseCode: string
  seatCount: string
  startedAt: string
  expiredAt: string
}

type DirectPurchasePaymentPayload = DirectPurchasePaymentRequest & {
  file: File | null
  assets: DirectPurchaseAssetPaymentDraft[]
}

interface Props {
  isOpen: boolean
  ticket: TicketDetail
  paymentResult?: TicketActualAmountResponse | null
  submitLabel?: string
  submitting?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  paymentResult: null,
  submitLabel: '결제 정보 저장',
  submitting: false,
  errorMessage: '',
})

const emit = defineEmits<{
  close: []
  submit: [payload: DirectPurchasePaymentPayload]
  filesUpdated: []
}>()

const ACCEPTED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])
const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

const fileInput = ref<HTMLInputElement | null>(null)
const actualPrice = ref('')
const purchaseDate = ref('')
const purchaseVendor = ref('')
const assetLocation = ref('')
const warrantyExpiredAt = ref('')
const assetDrafts = ref<EditableAssetDraft[]>([])
const selectedFile = ref<File | null>(null)
const evidenceFiles = ref<FileMetadata[]>([])
const isEvidenceFilesLoading = ref(false)
const deletingEvidenceFileId = ref<string | null>(null)
const validationErrorMessage = ref('')

const itemName = computed(() => (
  props.ticket.requestedItemName
  ?? props.ticket.requestedItemDetail
  ?? props.ticket.productName
  ?? '-'
))

const requestedQuantity = computed(() => {
  const quantity = Number(props.ticket.quantity)
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1
})

const formattedActualPrice = computed(() => (
  actualPrice.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
))

const isTangibleAsset = computed(() => props.ticket.assetType !== 'INTANGIBLE')

const formattedFileSize = computed(() => {
  if (!selectedFile.value) return ''
  const kilobytes = selectedFile.value.size / 1024
  return kilobytes >= 1024
    ? `${(kilobytes / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(kilobytes))} KB`
})

const canSubmit = computed(() => (
  Number(actualPrice.value) > 0
  && !props.submitting
))

const displayErrorMessage = computed(() => (
  validationErrorMessage.value || props.errorMessage
))

function formatFileSize(value: number | null | undefined) {
  const bytes = Number(value ?? 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '-'
  const kilobytes = bytes / 1024
  return kilobytes < 1024
    ? `${Math.max(1, Math.round(kilobytes))} KB`
    : `${(kilobytes / 1024).toFixed(1)} MB`
}

function extractFilename(fileUrl: string | null | undefined) {
  if (!fileUrl) return '-'
  const [path] = fileUrl.split(/[?#]/)
  const filename = path.split('/').filter(Boolean).at(-1)
  return filename ? decodeURIComponent(filename) : '-'
}

async function loadEvidenceFiles() {
  if (!props.ticket.ticketId) {
    evidenceFiles.value = []
    return
  }

  isEvidenceFilesLoading.value = true
  try {
    const response = await fileApi.getFiles({
      targetType: 'TICKET',
      targetId: props.ticket.ticketId,
    })
    evidenceFiles.value = response.data
  } catch (error) {
    validationErrorMessage.value = error instanceof Error
      ? error.message
      : '증빙 파일 목록을 조회하지 못했습니다.'
  } finally {
    isEvidenceFilesLoading.value = false
  }
}

async function deleteEvidenceFile(file: FileMetadata) {
  if (props.submitting || deletingEvidenceFileId.value !== null) return

  deletingEvidenceFileId.value = String(file.fileId)
  validationErrorMessage.value = ''
  try {
    await fileApi.deleteFile(file.fileId)
    evidenceFiles.value = evidenceFiles.value.filter((item) => String(item.fileId) !== String(file.fileId))
    emit('filesUpdated')
  } catch (error) {
    validationErrorMessage.value = error instanceof Error
      ? error.message
      : '증빙 파일 삭제에 실패했습니다.'
  } finally {
    deletingEvidenceFileId.value = null
  }
}

async function openEvidenceFile(file: FileMetadata) {
  if (props.submitting) return

  validationErrorMessage.value = ''
  try {
    const response = await fileApi.getDownloadUrl(file.fileId)
    window.open(response.data.downloadUrl, '_blank')
  } catch (error) {
    validationErrorMessage.value = error instanceof Error
      ? error.message
      : '증빙 파일 다운로드 URL을 조회하지 못했습니다.'
  }
}

function createEmptyAssetDraft(index: number, payment?: TicketActualAmountResponse | null): EditableAssetDraft {
  const shouldPrefillFromSingleResult = index === 0
  return {
    key: `${props.ticket.ticketId}-${index}`,
    serialNumber: payment?.serialNumbers?.[index]
      ?? (shouldPrefillFromSingleResult ? payment?.serialNumber ?? props.ticket.serialNumber ?? '' : ''),
    location: '',
    warrantyExpiredAt: '',
    licenseCode: payment?.licenseCodes?.[index]
      ?? (shouldPrefillFromSingleResult ? payment?.licenseCode ?? props.ticket.licenseCode ?? '' : ''),
    seatCount: shouldPrefillFromSingleResult
      ? toOptionalNumberString(payment?.seatCount ?? props.ticket.seatCount)
      : '',
    startedAt: shouldPrefillFromSingleResult
      ? toDateTimeLocalInputValue(payment?.startedAt ?? props.ticket.startedAt)
      : '',
    expiredAt: shouldPrefillFromSingleResult
      ? toDateTimeLocalInputValue(payment?.expiredAt ?? props.ticket.expirationDate)
      : '',
  }
}

function resetForm() {
  const payment = props.paymentResult
  const paymentActualPrice = payment?.actualPrice ?? payment?.actualAmount
  const initialActualPrice = paymentActualPrice ?? props.ticket.actualAmount

  actualPrice.value = initialActualPrice ? String(initialActualPrice) : ''
  purchaseDate.value = toDateTimeLocalInputValue(payment?.purchaseDate ?? props.ticket.purchaseDate)
    || toDateTimeLocalInputValue(new Date().toISOString())
  purchaseVendor.value = payment?.purchaseVendor ?? props.ticket.purchaseVendor ?? ''
  assetLocation.value = payment?.location ?? props.ticket.location ?? ''
  warrantyExpiredAt.value = toDateTimeLocalInputValue(
    payment?.warrantyExpiredAt ?? props.ticket.warrantyExpiredAt ?? props.ticket.warrantyEndDate,
  )
  assetDrafts.value = Array.from(
    { length: requestedQuantity.value },
    (_, index) => createEmptyAssetDraft(index, payment),
  )
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
  if (!purchaseDate.value) {
    validationErrorMessage.value = '구매 일시를 입력해주세요.'
    return
  }
  if (!purchaseVendor.value.trim()) {
    validationErrorMessage.value = '구매처를 입력해주세요.'
    return
  }

  const invalidIndex = findInvalidAssetIndex()
  if (invalidIndex !== -1) return

  const assets = assetDrafts.value.map(toApiAssetDraft)
  const firstAsset = assets[0]
  const serialNumbers = assets
    .map((asset) => asset.serialNumber)
    .filter((value): value is string => Boolean(value))
  const licenseCodes = assets
    .map((asset) => asset.licenseCode)
    .filter((value): value is string => Boolean(value))

  validationErrorMessage.value = ''
  emit('submit', {
    actualPrice: price,
    purchaseDate: toApiDateTime(purchaseDate.value),
    purchaseVendor: purchaseVendor.value.trim(),
    serialNumber: isTangibleAsset.value ? firstAsset?.serialNumber ?? null : null,
    serialNumbers: isTangibleAsset.value ? serialNumbers : null,
    location: isTangibleAsset.value ? emptyToNull(assetLocation.value) : null,
    warrantyExpiredAt: isTangibleAsset.value ? toApiDateTimeOrNull(warrantyExpiredAt.value) : null,
    licenseCode: isTangibleAsset.value ? null : firstAsset?.licenseCode ?? null,
    licenseCodes: isTangibleAsset.value ? null : licenseCodes,
    seatCount: isTangibleAsset.value ? null : firstAsset?.seatCount ?? null,
    isAutoRenewal: null,
    startedAt: isTangibleAsset.value ? null : firstAsset?.startedAt ?? null,
    expiredAt: isTangibleAsset.value ? null : firstAsset?.expiredAt ?? null,
    billingCycle: null,
    file: selectedFile.value,
    assets,
  })
}

function findInvalidAssetIndex() {
  if (!isTangibleAsset.value) {
    const emptyLicenseIndex = assetDrafts.value.findIndex((asset) => !asset.licenseCode.trim())
    if (emptyLicenseIndex !== -1) {
      validationErrorMessage.value = `자산 ${emptyLicenseIndex + 1}의 라이선스 코드를 입력해주세요.`
      return emptyLicenseIndex
    }

    const duplicateLicenseIndex = findDuplicateValueIndex(assetDrafts.value.map((asset) => asset.licenseCode))
    if (duplicateLicenseIndex !== -1) {
      validationErrorMessage.value = `자산 ${duplicateLicenseIndex + 1}의 라이선스 코드가 중복되었습니다.`
      return duplicateLicenseIndex
    }

    const invalidSeatIndex = assetDrafts.value.findIndex((asset) => (
      asset.seatCount.trim() !== '' && positiveIntegerOrNull(asset.seatCount) === null
    ))
    if (invalidSeatIndex !== -1) {
      validationErrorMessage.value = `자산 ${invalidSeatIndex + 1}의 사용 좌석 수는 1 이상의 정수로 입력해주세요.`
      return invalidSeatIndex
    }
    return -1
  }

  const invalidIndex = assetDrafts.value.findIndex((asset) => (
    !asset.serialNumber.trim()
  ))
  if (invalidIndex !== -1) {
    validationErrorMessage.value = `자산 ${invalidIndex + 1}의 시리얼 번호를 입력해주세요.`
    return invalidIndex
  }
  if (!assetLocation.value.trim()) {
    validationErrorMessage.value = '사용 위치를 입력해주세요.'
    return 0
  }
  if (!warrantyExpiredAt.value) {
    validationErrorMessage.value = '보증 만료 일시를 입력해주세요.'
    return 0
  }

  const duplicateSerialIndex = findDuplicateValueIndex(assetDrafts.value.map((asset) => asset.serialNumber))
  if (duplicateSerialIndex !== -1) {
    validationErrorMessage.value = `자산 ${duplicateSerialIndex + 1}의 시리얼 번호가 중복되었습니다.`
    return duplicateSerialIndex
  }
  return -1
}

function findDuplicateValueIndex(values: string[]) {
  const seen = new Set<string>()
  return values.findIndex((value) => {
    const normalizedValue = value.trim().toLowerCase()
    if (!normalizedValue) return false
    if (seen.has(normalizedValue)) return true
    seen.add(normalizedValue)
    return false
  })
}

function toApiAssetDraft(asset: EditableAssetDraft, index: number): DirectPurchaseAssetPaymentDraft {
  return {
    index: index + 1,
    serialNumber: isTangibleAsset.value ? emptyToNull(asset.serialNumber) : null,
    location: isTangibleAsset.value ? emptyToNull(assetLocation.value) : null,
    warrantyExpiredAt: isTangibleAsset.value ? toApiDateTimeOrNull(warrantyExpiredAt.value) : null,
    licenseCode: isTangibleAsset.value ? null : emptyToNull(asset.licenseCode),
    seatCount: isTangibleAsset.value ? null : positiveIntegerOrNull(asset.seatCount),
    startedAt: isTangibleAsset.value ? null : toApiDateTimeOrNull(asset.startedAt),
    expiredAt: isTangibleAsset.value ? null : toApiDateTimeOrNull(asset.expiredAt),
  }
}

function toDateTimeLocalInputValue(value: string | null | undefined) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function toApiDateTimeOrNull(value: string) {
  return value ? toApiDateTime(value) : null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function positiveIntegerOrNull(value: string) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function toOptionalNumberString(value: number | null | undefined) {
  return value ? String(value) : ''
}

function formatRowNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

watch(
  () => [
    props.isOpen,
    props.ticket.ticketId,
    props.ticket.quantity,
    props.paymentResult,
    props.paymentResult?.updatedAt,
  ] as const,
  ([isOpen]) => {
    if (isOpen) {
      resetForm()
      void loadEvidenceFiles()
    }
  },
)
</script>
