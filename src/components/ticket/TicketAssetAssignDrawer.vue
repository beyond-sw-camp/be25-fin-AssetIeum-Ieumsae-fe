<template>
  <BaseDrawer
    :is-open="isOpen"
    title="자산 검색 및 할당"
    panel-class="w-full max-w-2xl"
    @close="handleClose"
  >
    <div class="space-y-5">
      <section class="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
        <p class="font-semibold text-text-main">{{ ticket?.requesterName || '-' }}에게 할당</p>
        <p class="mt-1 text-text-sub">{{ ticket?.requestedItemName || '요청 품목 정보 없음' }}</p>
      </section>

      <div class="grid gap-3 md:grid-cols-[160px_1fr_auto]">
        <Dropdown
          :model-value="assetType"
          :options="ASSET_TYPE_OPTIONS"
          aria-label="자산 유형"
          @update:model-value="handleAssetTypeChange"
        />
        <input
          v-model="keyword"
          class="h-9 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="자산명, 자산번호로 검색"
          :disabled="isAssetLoading || submitting"
          @keyup.enter="loadAssets"
        />
        <Button
          variant="outline"
          :disabled="isAssetLoading || submitting"
          @click="loadAssets"
        >
          검색
        </Button>
      </div>

      <label v-if="ticket?.ticketType === 'RENTAL'" class="block">
        <span class="mb-2 block text-sm font-semibold text-text-main">반납 예정일</span>
        <input
          v-model="returnDueDate"
          type="date"
          class="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          :disabled="submitting"
        />
      </label>

      <div
        v-if="assetErrorMessage"
        class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ assetErrorMessage }}
      </div>

      <div class="max-h-[360px] overflow-y-auto rounded-xl border border-border">
        <div
          v-if="isAssetLoading"
          class="flex h-40 items-center justify-center text-sm text-text-sub"
        >
          사용 가능한 자산을 불러오는 중입니다.
        </div>

        <div
          v-else-if="assetOptions.length === 0"
          class="space-y-2 p-6 text-center text-sm text-text-sub"
        >
          <p>사용 가능한 자산이 없습니다.</p>
          <p class="text-xs text-text-muted">
            TODO: API 명세/백엔드 확인 필요 - 없는 자산의 구매계획 생성 endpoint가 확정되면 연결합니다.
          </p>
        </div>

        <template v-else>
          <label
            v-for="asset in assetOptions"
            :key="asset.assetId"
            class="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-secondary"
          >
            <input
              v-model="selectedAssetId"
              type="radio"
              class="h-4 w-4 accent-primary"
              :value="asset.assetId"
              :disabled="submitting"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-text-main">{{ asset.name }}</span>
              <span class="block truncate text-xs text-text-sub">{{ asset.assetCode }}</span>
            </span>
            <span class="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
              사용 가능
            </span>
          </label>
        </template>
      </div>

      <p v-if="validationMessage" class="text-sm text-danger">{{ validationMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="submitting"
          @click="handleClose"
        >
          취소
        </Button>
        <Button
          class="flex-1"
          :loading="submitting"
          @click="handleSubmit"
        >
          할당
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { intangibleAssetApi, tangibleAssetApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import type {
  AssetAssignRequest,
  AssetType,
  DropdownOption,
  IntangibleAsset,
  TangibleAsset,
  TicketDetail,
} from '@/types'

const ASSET_TYPE_OPTIONS: DropdownOption[] = [
  { label: '유형 자산', value: 'TANGIBLE' },
  { label: '무형 자산', value: 'INTANGIBLE' },
]

interface AssetOption {
  assetId: string
  assetCode: string
  name: string
}

const props = defineProps<{
  isOpen: boolean
  ticket: TicketDetail | null
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: AssetAssignRequest]
}>()

const assetType = ref<AssetType>('TANGIBLE')
const keyword = ref('')
const returnDueDate = ref('')
const selectedAssetId = ref('')
const tangibleAssets = ref<TangibleAsset[]>([])
const intangibleAssets = ref<IntangibleAsset[]>([])
const isAssetLoading = ref(false)
const assetErrorMessage = ref('')
const validationMessage = ref('')

const assetOptions = computed<AssetOption[]>(() => {
  if (assetType.value === 'TANGIBLE') {
    return tangibleAssets.value
      .filter((asset) => (asset.status ?? asset.tangibleAssetStatus) === 'AVAILABLE')
      .map((asset) => ({
        assetId: String(asset.assetId ?? asset.id ?? asset.tangibleAssetId ?? ''),
        assetCode: asset.assetCode,
        name: asset.assetItemName ?? asset.productName ?? asset.assetCode,
      }))
      .filter((asset) => asset.assetId)
  }

  return intangibleAssets.value
    .filter((asset) => (asset.status ?? asset.intangibleAssetStatus) === 'AVAILABLE')
    .map((asset) => ({
      assetId: asset.assetId,
      assetCode: asset.assetCode,
      name: asset.assetItemName ?? asset.assetCode,
    }))
})

watch(() => props.isOpen, async (isOpen) => {
  if (!isOpen) {
    keyword.value = ''
    returnDueDate.value = ''
    selectedAssetId.value = ''
    validationMessage.value = ''
    assetErrorMessage.value = ''
    return
  }

  assetType.value = props.ticket?.assetType ?? 'TANGIBLE'
  await loadAssets()
})

function handleClose() {
  if (props.submitting) return
  emit('close')
}

async function handleAssetTypeChange(value: string | number) {
  if (value !== 'TANGIBLE' && value !== 'INTANGIBLE') return
  assetType.value = value
  selectedAssetId.value = ''
  await loadAssets()
}

async function loadAssets() {
  isAssetLoading.value = true
  assetErrorMessage.value = ''

  try {
    if (assetType.value === 'TANGIBLE') {
      const response = await tangibleAssetApi.getList({
        page: 0,
        size: 100,
        status: 'AVAILABLE',
        keyword: keyword.value.trim() || undefined,
      })
      tangibleAssets.value = response.data.content
      return
    }

    const response = await intangibleAssetApi.getList({
      page: 0,
      size: 100,
      status: 'AVAILABLE',
      keyword: keyword.value.trim() || undefined,
    })
    intangibleAssets.value = response.data.content
  } catch (error) {
    assetErrorMessage.value = error instanceof Error
      ? error.message
      : '사용 가능한 자산을 불러오지 못했습니다.'
  } finally {
    isAssetLoading.value = false
  }
}

function handleSubmit() {
  if (!props.ticket) return

  if (!selectedAssetId.value) {
    validationMessage.value = '할당할 자산을 선택해 주세요.'
    return
  }

  validationMessage.value = ''
  emit('submit', {
    assetType: assetType.value,
    assetId: selectedAssetId.value,
    memberId: String(props.ticket.requesterId),
    returnDueDate: returnDueDate.value || undefined,
  })
}
</script>
