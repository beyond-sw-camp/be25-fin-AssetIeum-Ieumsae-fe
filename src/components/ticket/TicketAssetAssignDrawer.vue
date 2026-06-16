<template>
  <BaseDrawer
    :is-open="isOpen"
    title="품목 검색 및 할당"
    panel-class="w-full max-w-2xl"
    @close="handleClose"
  >
    <div class="space-y-5">
      <section class="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
        <p class="font-semibold text-text-main">{{ ticket?.requesterName || '-' }}에게 할당</p>
        <p class="mt-1 text-text-sub">{{ ticket?.requestedItemName || '요청 품목 정보 없음' }}</p>
        <p class="mt-2 text-xs font-semibold text-text-muted">
          요청 수량 {{ requestedQuantity }}개
        </p>
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
          placeholder="품목명 또는 품목번호로 검색"
          :disabled="isItemLoading || isResolvingAssets || submitting"
          @keyup.enter="loadItems"
        />
        <Button
          variant="outline"
          :disabled="isItemLoading || isResolvingAssets || submitting"
          @click="loadItems"
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
          :disabled="isResolvingAssets || submitting"
        />
      </label>

      <div
        v-if="itemErrorMessage"
        class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ itemErrorMessage }}
      </div>

      <div class="max-h-[360px] overflow-y-auto rounded-xl border border-border">
        <div
          v-if="isItemLoading"
          class="flex h-40 items-center justify-center text-sm text-text-sub"
        >
          품목 목록을 불러오는 중입니다.
        </div>

        <div
          v-else-if="itemOptions.length === 0"
          class="space-y-2 p-6 text-center text-sm text-text-sub"
        >
          <p>조회된 품목이 없습니다.</p>
          <p class="text-xs text-text-muted">
            품목 재고가 없는 경우 구매 계획 또는 자산 등록 후 다시 할당해야 합니다.
          </p>
        </div>

        <template v-else>
          <label
            v-for="item in itemOptions"
            :key="item.itemId"
            class="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-secondary"
          >
            <input
              v-model="selectedItemId"
              type="radio"
              class="h-4 w-4 accent-primary"
              :value="item.itemId"
              :disabled="isResolvingAssets || submitting"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-text-main">{{ item.name }}</span>
              <span class="block truncate text-xs text-text-sub">
                {{ item.itemNo }} · {{ item.category || '-' }}
              </span>
            </span>
            <span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              가능 {{ item.availableCount }} / 총 {{ item.stockCount }}
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
          :disabled="isResolvingAssets || submitting"
          @click="handleClose"
        >
          취소
        </Button>
        <Button
          class="flex-1"
          :loading="isResolvingAssets || submitting"
          @click="handleSubmit"
        >
          할당
        </Button>
      </div>
    </template>
  </BaseDrawer>

  <div
    v-if="isInsufficientDialogOpen"
    class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="insufficient-quantity-title"
  >
    <div class="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
      <h2 id="insufficient-quantity-title" class="text-lg font-bold text-text-main">
        수량 부족
      </h2>
      <p class="mt-2 text-sm leading-6 text-text-sub">{{ insufficientDialogMessage }}</p>
      <div class="mt-6 flex justify-end">
        <Button @click="isInsufficientDialogOpen = false">확인</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  intangibleAssetApi,
  intangibleItemApi,
  tangibleAssetApi,
  tangibleItemApi,
} from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import type {
  AssetType,
  DropdownOption,
  IntangibleItem,
  TangibleAsset,
  TangibleAssetItem,
  TicketDetail,
} from '@/types'

export interface AssetItemAssignPayload {
  assetType: AssetType
  assetItemId: string
  itemName: string
  assetIds: string[]
  quantity: number
  memberId: string
  returnDueDate?: string
}

interface ItemOption {
  itemId: string
  itemNo: string
  name: string
  category: string
  stockCount: number
  availableCount: number
}

interface TangibleItemAliases extends TangibleAssetItem {
  assetName?: string
  assetCount?: number
  totalAssetCount?: number
  count?: number
}

const ASSET_TYPE_OPTIONS: DropdownOption[] = [
  { label: '유형 자산', value: 'TANGIBLE' },
  { label: '무형 자산', value: 'INTANGIBLE' },
]

const props = defineProps<{
  isOpen: boolean
  ticket: TicketDetail | null
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: AssetItemAssignPayload]
}>()

const assetType = ref<AssetType>('TANGIBLE')
const keyword = ref('')
const returnDueDate = ref('')
const selectedItemId = ref('')
const tangibleItems = ref<TangibleAssetItem[]>([])
const intangibleItems = ref<IntangibleItem[]>([])
const isItemLoading = ref(false)
const isResolvingAssets = ref(false)
const itemErrorMessage = ref('')
const validationMessage = ref('')
const isInsufficientDialogOpen = ref(false)
const insufficientDialogMessage = ref('')

const requestedQuantity = computed(() => {
  const quantity = props.ticket?.quantity
  return Number.isInteger(quantity) && Number(quantity) > 0 ? Number(quantity) : 1
})

const itemOptions = computed<ItemOption[]>(() => (
  assetType.value === 'TANGIBLE'
    ? tangibleItems.value.map(toTangibleItemOption).filter((item) => item.itemId)
    : intangibleItems.value.map(toIntangibleItemOption).filter((item) => item.itemId)
))

const selectedItem = computed(() => (
  itemOptions.value.find((item) => item.itemId === selectedItemId.value) ?? null
))

watch(() => props.isOpen, async (isOpen) => {
  if (!isOpen) {
    keyword.value = ''
    returnDueDate.value = ''
    selectedItemId.value = ''
    validationMessage.value = ''
    itemErrorMessage.value = ''
    isInsufficientDialogOpen.value = false
    insufficientDialogMessage.value = ''
    return
  }

  assetType.value = props.ticket?.assetType ?? 'TANGIBLE'
  await loadItems()
})

function handleClose() {
  if (props.submitting || isResolvingAssets.value) return
  emit('close')
}

async function handleAssetTypeChange(value: string | number) {
  if (value !== 'TANGIBLE' && value !== 'INTANGIBLE') return
  assetType.value = value
  selectedItemId.value = ''
  await loadItems()
}

async function loadItems() {
  isItemLoading.value = true
  itemErrorMessage.value = ''

  try {
    if (assetType.value === 'TANGIBLE') {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        keyword: keyword.value.trim() || undefined,
      })
      tangibleItems.value = response.data.content
      return
    }

    const response = await intangibleItemApi.getList({
      page: 0,
      size: 100,
      keyword: keyword.value.trim() || undefined,
    })
    intangibleItems.value = response.data.content
  } catch (error) {
    itemErrorMessage.value = error instanceof Error
      ? error.message
      : '품목 목록을 불러오지 못했습니다.'
  } finally {
    isItemLoading.value = false
  }
}

async function handleSubmit() {
  if (!props.ticket) return

  if (!selectedItem.value) {
    validationMessage.value = '할당할 품목을 선택해 주세요.'
    return
  }

  validationMessage.value = ''
  const item = selectedItem.value
  if (item.availableCount < requestedQuantity.value) {
    openInsufficientDialog(item.availableCount)
    return
  }

  isResolvingAssets.value = true
  itemErrorMessage.value = ''

  try {
    const assetIds = await loadAssignableAssetIds(item.itemId, requestedQuantity.value)
    if (assetIds.length < requestedQuantity.value) {
      openInsufficientDialog(assetIds.length)
      return
    }

    emit('submit', {
      assetType: assetType.value,
      assetItemId: item.itemId,
      itemName: item.name,
      assetIds,
      quantity: requestedQuantity.value,
      memberId: String(props.ticket.requesterId),
      returnDueDate: returnDueDate.value || undefined,
    })
  } catch (error) {
    itemErrorMessage.value = error instanceof Error
      ? error.message
      : '할당 가능한 자산을 확인하지 못했습니다.'
  } finally {
    isResolvingAssets.value = false
  }
}

async function loadAssignableAssetIds(itemId: string, quantity: number) {
  if (assetType.value === 'TANGIBLE') {
    const response = await tangibleAssetApi.getList({
      page: 0,
      size: 999,
      status: 'AVAILABLE',
      assetItemId: itemId,
    })

    return response.data.content
      .filter((asset) => isAvailableAsset(asset.status ?? asset.tangibleAssetStatus))
      .filter((asset) => getAssetItemId(asset) === itemId)
      .map(getTangibleAssetId)
      .filter(Boolean)
      .slice(0, quantity)
  }

  const response = await intangibleAssetApi.getList({
    page: 0,
    size: 999,
    status: 'AVAILABLE',
  })

  return response.data.content
    .filter((asset) => isAvailableAsset(asset.status ?? asset.intangibleAssetStatus))
    .filter((asset) => asset.assetItemId === itemId)
    .map((asset) => asset.assetId)
    .filter(Boolean)
    .slice(0, quantity)
}

function openInsufficientDialog(availableCount: number) {
  insufficientDialogMessage.value = `요청 수량은 ${requestedQuantity.value}개이지만 현재 할당 가능한 수량은 ${availableCount}개입니다. 수량이 부족하여 할당할 수 없습니다.`
  isInsufficientDialogOpen.value = true
}

function toTangibleItemOption(item: TangibleAssetItem): ItemOption {
  const aliases = item as TangibleItemAliases
  const itemId = String(item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? '')
  const stockCount = numberValue(item.stockCount ?? aliases.assetCount ?? aliases.totalAssetCount ?? aliases.count)
  const availableCount = numberValue(item.availableCount ?? item.stockCount)

  return {
    itemId,
    itemNo: item.itemNo ?? item.itemCode ?? itemId,
    name: item.name ?? item.productName ?? aliases.assetName ?? item.itemCode ?? itemId,
    category: item.categoryName ?? item.category ?? '',
    stockCount,
    availableCount,
  }
}

function toIntangibleItemOption(item: IntangibleItem): ItemOption {
  const itemId = String(item.assetItemId ?? item.itemId ?? item.id ?? '')
  const stockCount = numberValue(
    item.stockCount
      ?? item.assetCount
      ?? item.intangibleAssetCount
      ?? item.totalAssetCount
      ?? item.assetTotalCount
      ?? item.count,
  )
  const availableCount = numberValue(item.availableCount ?? item.stockCount ?? stockCount)

  return {
    itemId,
    itemNo: itemId ? `SW-${itemId.padStart(4, '0')}` : '-',
    name: item.productName ?? itemId,
    category: item.category ?? item.licenseType ?? '',
    stockCount,
    availableCount,
  }
}

function getTangibleAssetId(asset: TangibleAsset) {
  return String(asset.assetId ?? asset.id ?? asset.tangibleAssetId ?? '')
}

function getAssetItemId(asset: TangibleAsset) {
  return String(asset.assetItemId ?? asset.tangibleItemId ?? asset.tangibleAssetItemId ?? '')
}

function isAvailableAsset(status: string | null | undefined) {
  return status === 'AVAILABLE'
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
</script>
