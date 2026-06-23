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

      <section v-if="ticket?.ticketType !== 'ASSET_REQUEST' && suggestedItemOptions.length > 0" class="space-y-2">
        <h3 class="text-sm font-semibold text-text-main">요청 품목</h3>
        <label
          v-for="item in suggestedItemOptions"
          :key="`suggested-${item.itemId}`"
          :class="itemRowClass(item)"
        >
          <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              v-model="selectedItemId"
              type="radio"
              class="peer sr-only"
              name="assign-asset-item"
              :value="item.itemId"
              :disabled="isResolvingAssets || submitting"
            />
            <span
              class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
            />
            <span
              class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
            <span class="mt-1 block truncate text-xs leading-5 text-text-muted">
              {{ item.itemNo }} · {{ item.category || '-' }}
            </span>
          </span>
          <span :class="itemCountBadgeClass(item)">
            {{ itemCountText(item) }}
          </span>
        </label>
      </section>

      <div class="grid gap-3 md:grid-cols-[150px_190px_1fr_auto]">
        <Dropdown
          :model-value="assetType"
          :options="ASSET_TYPE_OPTIONS"
          aria-label="자산 유형"
          :disabled="isCategoryLoading || isItemLoading || isResolvingAssets || submitting"
          @update:model-value="handleAssetTypeChange"
        />
        <Dropdown
          :model-value="selectedCategory"
          :options="categoryOptions"
          root-option="자산 분류 선택"
          aria-label="자산 분류"
          :disabled="isCategoryLoading || isItemLoading || isResolvingAssets || submitting"
          @update:model-value="handleCategoryChange"
        />
        <input
          v-model="keyword"
          class="h-9 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="품목명 또는 품목번호로 검색"
          :disabled="isItemLoading || isResolvingAssets || submitting"
          @keyup.enter="() => loadItems()"
        />
        <Button
          variant="outline"
          :disabled="!canSearchItems || isCategoryLoading || isItemLoading || isResolvingAssets || submitting"
          @click="() => loadItems()"
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

      <div v-if="ticket?.ticketType === 'ASSET_REQUEST'" class="rounded-xl border border-border p-3">
        <div
          v-if="isItemLoading"
          class="flex h-40 items-center justify-center text-sm text-text-sub"
        >
          품목 목록을 불러오는 중입니다.
        </div>

        <div
          v-else-if="!hasSearchedItems || itemOptions.length === 0"
          class="space-y-2 p-6 text-center text-sm text-text-sub"
        >
          <p>{{ emptyItemTitle }}</p>
          <p class="text-xs text-text-muted">
            {{ emptyItemDescription }}
          </p>
        </div>

        <div v-else class="grid gap-3 md:grid-cols-2">
          <section class="min-w-0 space-y-2">
            <div class="flex items-center justify-between gap-2 px-1">
              <h3 class="text-sm font-semibold text-text-main">표준 품목</h3>
              <span class="text-xs font-medium text-text-muted">{{ standardItemOptions.length }}개</span>
            </div>
            <div class="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              <p
                v-if="standardItemOptions.length === 0"
                class="rounded-xl border border-dashed border-border bg-surface-secondary p-6 text-center text-sm text-text-sub"
              >
                조회된 표준 품목이 없습니다.
              </p>
              <label
                v-for="item in standardItemOptions"
                :key="`standard-${item.itemId}`"
                :class="itemRowClass(item)"
              >
                <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    v-model="selectedItemId"
                    type="radio"
                    class="peer sr-only"
                    name="assign-asset-item"
                    :value="item.itemId"
                    :disabled="isResolvingAssets || submitting"
                  />
                  <span
                    class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
                  />
                  <span
                    class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
                  />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
                  <span class="mt-1 block truncate text-xs leading-5 text-text-muted">
                    {{ item.itemNo }} · {{ item.category || '-' }}
                  </span>
                </span>
                <span :class="itemCountBadgeClass(item)">
                  {{ itemCountText(item) }}
                </span>
              </label>
            </div>
          </section>

          <section class="min-w-0 space-y-2">
            <div class="flex items-center justify-between gap-2 px-1">
              <h3 class="text-sm font-semibold text-text-main">비표준 품목</h3>
              <span class="text-xs font-medium text-text-muted">{{ nonStandardItemOptions.length }}개</span>
            </div>
            <div class="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              <p
                v-if="nonStandardItemOptions.length === 0"
                class="rounded-xl border border-dashed border-border bg-surface-secondary p-6 text-center text-sm text-text-sub"
              >
                조회된 비표준 품목이 없습니다.
              </p>
              <label
                v-for="item in nonStandardItemOptions"
                :key="`non-standard-${item.itemId}`"
                :class="itemRowClass(item)"
              >
                <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    v-model="selectedItemId"
                    type="radio"
                    class="peer sr-only"
                    name="assign-asset-item"
                    :value="item.itemId"
                    :disabled="isResolvingAssets || submitting"
                  />
                  <span
                    class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
                  />
                  <span
                    class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
                  />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
                  <span class="mt-1 block truncate text-xs leading-5 text-text-muted">
                    {{ item.itemNo }} · {{ item.category || '-' }}
                  </span>
                </span>
                <span :class="itemCountBadgeClass(item)">
                  {{ itemCountText(item) }}
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="max-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-border p-2">
        <h3 v-if="suggestedItemOptions.length > 0" class="px-1 pt-1 text-sm font-semibold text-text-main">
          검색 결과
        </h3>

        <div
          v-if="isItemLoading"
          class="flex h-40 items-center justify-center text-sm text-text-sub"
        >
          품목 목록을 불러오는 중입니다.
        </div>

        <div
          v-else-if="!hasSearchedItems || visibleItemOptions.length === 0"
          class="space-y-2 p-6 text-center text-sm text-text-sub"
        >
          <p>{{ emptyItemTitle }}</p>
          <p class="text-xs text-text-muted">
            {{ emptyItemDescription }}
          </p>
        </div>

        <template v-else>
          <label
            v-for="item in visibleItemOptions"
            :key="item.itemId"
            :class="itemRowClass(item)"
          >
            <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                v-model="selectedItemId"
                type="radio"
                class="peer sr-only"
                name="assign-asset-item"
                :value="item.itemId"
                :disabled="isResolvingAssets || submitting"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              />
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
              <span class="mt-1 block truncate text-xs leading-5 text-text-muted">
                {{ item.itemNo }} · {{ item.category || '-' }}
              </span>
            </span>
            <span :class="itemCountBadgeClass(item)">
              {{ itemCountText(item) }}
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  intangibleAssetApi,
  intangibleItemApi,
  tangibleAssetApi,
  tangibleItemApi,
  ticketApi,
} from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import { useNotificationStore } from '@/stores'
import type {
  AssetType,
  AssetRequestAssignableItem,
  DropdownOption,
  IntangibleItem,
  RentalAssignableAsset,
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
  availableCount: number
  availableCountLabel?: string
  assetType?: AssetType
  isStandard?: boolean
  requestedItem?: boolean
}

interface TangibleItemAliases extends TangibleAssetItem {
  assetName?: string
}

const ASSET_TYPE_OPTIONS: DropdownOption[] = [
  { label: '유형 자산', value: 'TANGIBLE' },
  { label: '무형 자산', value: 'INTANGIBLE' },
]
const LICENSE_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: '구독형 (SaaS)',
  PERPETUAL: '영구 라이선스',
  TERM: '기간제 라이선스',
}

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
const selectedCategory = ref('')
const keyword = ref('')
const returnDueDate = ref('')
const selectedItemId = ref('')
const assetRequestItemOptions = ref<ItemOption[]>([])
const tangibleItems = ref<TangibleAssetItem[]>([])
const intangibleItems = ref<IntangibleItem[]>([])
const tangibleCategoryOptions = ref<DropdownOption[]>([])
const intangibleCategoryOptions = ref<DropdownOption[]>([])
const isCategoryLoading = ref(false)
const isItemLoading = ref(false)
const isResolvingAssets = ref(false)
const itemErrorMessage = ref('')
const validationMessage = ref('')
const hasSearchedItems = ref(false)
const notificationStore = useNotificationStore()

const requestedQuantity = computed(() => {
  const quantity = props.ticket?.quantity
  return Number.isInteger(quantity) && Number(quantity) > 0 ? Number(quantity) : 1
})

const itemOptions = computed<ItemOption[]>(() => (
  props.ticket?.ticketType === 'ASSET_REQUEST'
    ? assetRequestItemOptions.value
    :
  assetType.value === 'TANGIBLE'
    ? tangibleItems.value.map(toTangibleItemOption).filter((item) => item.itemId)
    : intangibleItems.value.map(toIntangibleItemOption).filter((item) => item.itemId)
))

const categoryOptions = computed(() => (
  assetType.value === 'TANGIBLE'
    ? tangibleCategoryOptions.value
    : intangibleCategoryOptions.value
))

const selectedItem = computed(() => (
  itemOptions.value.find((item) => item.itemId === selectedItemId.value) ?? null
))

const suggestedItemOptions = computed(() => (
  itemOptions.value.filter((item) => isRequestedItem(item))
))

const visibleItemOptions = computed(() => (
  itemOptions.value.filter((item) => !isRequestedItem(item))
))

const standardItemOptions = computed(() => (
  itemOptions.value.filter((item) => item.isStandard !== false)
))

const nonStandardItemOptions = computed(() => (
  itemOptions.value.filter((item) => item.isStandard === false)
))

const canSearchItems = computed(() => (
  props.ticket?.ticketType === 'ASSET_REQUEST'
  || props.ticket?.ticketType === 'RENTAL'
  || Boolean(selectedCategory.value || keyword.value.trim())
))

const emptyItemTitle = computed(() => {
  if (!hasSearchedItems.value) return '자산 분류를 선택하거나 품목명을 입력하고 조회를 눌러주세요.'
  if (suggestedItemOptions.value.length > 0) return '같이 보여줄 다른 품목이 없습니다.'
  return '조회된 품목이 없습니다.'
})

const emptyItemDescription = computed(() => {
  if (!hasSearchedItems.value) return '요청 품목명은 처음 열 때 자동으로 검색합니다.'
  if (props.ticket?.ticketType === 'PURCHASE_REQUEST') {
    return '구매 완료 후 품목과 자산을 등록하면 다시 할당할 수 있습니다.'
  }
  return '품목 재고가 없는 경우 구매 계획 또는 자산 등록 후 다시 할당해야 합니다.'
})

watch(() => props.isOpen, async (isOpen) => {
  if (!isOpen) {
    selectedCategory.value = ''
    keyword.value = ''
    returnDueDate.value = ''
    selectedItemId.value = ''
    clearItems()
    validationMessage.value = ''
    itemErrorMessage.value = ''
    return
  }

  assetType.value = props.ticket?.assetType ?? 'TANGIBLE'
  selectedCategory.value = ''
  keyword.value = props.ticket?.requestedItemName
    ?? props.ticket?.requestedItemDetail
    ?? props.ticket?.productName
    ?? ''
  selectedItemId.value = ''
  clearItems()
  await loadCategories()
  if (props.ticket?.ticketType === 'ASSET_REQUEST' || props.ticket?.ticketType === 'RENTAL' || keyword.value.trim()) {
    await loadItems({ selectSuggested: true })
  }
})

function handleClose() {
  if (props.submitting || isResolvingAssets.value) return
  emit('close')
}

async function handleAssetTypeChange(value: string | number) {
  if (value !== 'TANGIBLE' && value !== 'INTANGIBLE') return
  assetType.value = value
  selectedCategory.value = ''
  selectedItemId.value = ''
  validationMessage.value = ''
  clearItems()
  await loadCategories()
}

function handleCategoryChange(value: string | number) {
  selectedCategory.value = String(value)
  selectedItemId.value = ''
  validationMessage.value = ''
  clearItems()
}

async function loadCategories() {
  if (
    assetType.value === 'TANGIBLE' && tangibleCategoryOptions.value.length > 0
    || assetType.value === 'INTANGIBLE' && intangibleCategoryOptions.value.length > 0
  ) return

  isCategoryLoading.value = true
  itemErrorMessage.value = ''

  try {
    if (assetType.value === 'TANGIBLE') {
      const response = await tangibleItemApi.getCategories()
      tangibleCategoryOptions.value = toCategoryOptions(response.data)
      return
    }

    const response = await intangibleItemApi.getCategories()
    intangibleCategoryOptions.value = toCategoryOptions(response.data)
  } catch (error) {
    itemErrorMessage.value = error instanceof Error
      ? error.message
      : '자산 분류를 불러오지 못했습니다.'
  } finally {
    isCategoryLoading.value = false
  }
}

async function loadItems(options: { selectSuggested?: boolean } = {}) {
  if (!canSearchItems.value) {
    validationMessage.value = '자산 분류를 선택하거나 품목명을 입력해주세요.'
    return
  }

  isItemLoading.value = true
  itemErrorMessage.value = ''
  validationMessage.value = ''
  selectedItemId.value = ''
  hasSearchedItems.value = true

  try {
    if (props.ticket?.ticketType === 'RENTAL') {
      const response = await ticketApi.getRentalAssignableAssets(props.ticket.ticketId, {
        page: 0,
        size: 20,
        keyword: keyword.value.trim() || undefined,
      })
      const requestedItem = response.data.requestedItem
      const availableCount = [
        response.data.reservedAsset?.assetId,
        ...response.data.assets.content.map((asset) => asset.assetId),
      ].filter(Boolean).length

      tangibleItems.value = [{
        assetItemId: requestedItem.itemId,
        itemId: requestedItem.itemId,
        itemNo: requestedItem.itemId,
        name: requestedItem.name,
        productName: requestedItem.name,
        category: props.ticket.categoryName ?? '',
        categoryName: props.ticket.categoryName ?? '',
        manufacturer: requestedItem.manufacturer ?? '',
        modelName: '',
        vendor: '',
        purchasePrice: 0,
        stockCount: availableCount,
        availableCount,
      }]
      return
    }

    if (props.ticket?.ticketType === 'ASSET_REQUEST') {
      const response = await ticketApi.getAssetRequestAssignableItems(props.ticket.ticketId, {
        assetType: assetType.value,
        keyword: keyword.value.trim() || undefined,
        page: 0,
        size: 100,
      })
      assetRequestItemOptions.value = uniqueItemOptions([
        ...(response.data.requestedItem ? [toAssetRequestItemOption(response.data.requestedItem)] : []),
        ...response.data.items.content.map(toAssetRequestItemOption),
      ]).filter((item) => item.itemId)
      return
    }

    if (assetType.value === 'TANGIBLE') {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        categoryName: selectedCategory.value || undefined,
        keyword: keyword.value.trim() || undefined,
      })
      tangibleItems.value = response.data.content
      return
    }

    const response = await intangibleItemApi.getList({
      page: 0,
      size: 100,
      category: selectedCategory.value || undefined,
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

  if (options.selectSuggested && suggestedItemOptions.value.length > 0) {
    selectedItemId.value = suggestedItemOptions.value[0].itemId
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
  if (props.ticket.ticketType !== 'RENTAL' && item.availableCount < requestedQuantity.value) {
    showInsufficientQuantityToast(item.availableCount)
    return
  }

  isResolvingAssets.value = true
  itemErrorMessage.value = ''

  try {
    const assetIds = props.ticket.ticketType === 'ASSET_REQUEST'
      ? []
      : await loadAssignableAssetIds(item.itemId, requestedQuantity.value)

    if (props.ticket.ticketType !== 'ASSET_REQUEST' && assetIds.length < requestedQuantity.value) {
      showInsufficientQuantityToast(assetIds.length)
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
  if (props.ticket?.ticketType === 'RENTAL') {
    const response = await ticketApi.getRentalAssignableAssets(props.ticket.ticketId, {
      page: 0,
      size: Math.max(quantity, 20),
      keyword: keyword.value.trim() || undefined,
    })
    const reservedAssetId = response.data.reservedAsset?.assetId
    const assetIds = response.data.assets.content
      .filter((asset: RentalAssignableAsset) => asset.status === 'AVAILABLE' || asset.reservedAsset)
      .map((asset) => asset.assetId)
      .filter(Boolean)

    return [
      ...(reservedAssetId ? [reservedAssetId] : []),
      ...assetIds.filter((assetId: string) => assetId !== reservedAssetId),
    ].slice(0, quantity)
  }

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
    .filter((asset) => getIntangibleAssetItemId(asset as unknown as Record<string, unknown>) === itemId)
    .map((asset) => asset.assetId)
    .filter(Boolean)
    .slice(0, quantity)
}

function showInsufficientQuantityToast(availableCount: number) {
  const unit = selectedItem.value?.assetType === 'INTANGIBLE' ? '명' : '개'
  notificationStore.warning('수량 부족', `요청 ${requestedQuantity.value}${unit}, 사용가능 ${availableCount}${unit}입니다.`)
}

function clearItems() {
  assetRequestItemOptions.value = []
  tangibleItems.value = []
  intangibleItems.value = []
  hasSearchedItems.value = false
}

function collectCategoryNames(value: unknown): string[] {
  if (typeof value === 'string') {
    const name = value.trim()
    return name ? [name] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectCategoryNames)
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const category = value as Record<string, unknown>
  const categoryNames = [
    ...collectCategoryNames(category.mainCategory),
    ...collectCategoryNames(category.name),
    ...collectCategoryNames(category.categoryName),
    ...collectCategoryNames(category.children),
    ...collectCategoryNames(category.subCategories),
  ]

  if (category.childCategories && typeof category.childCategories === 'object') {
    Object.entries(category.childCategories).forEach(([name, children]) => {
      categoryNames.push(...collectCategoryNames(name))
      categoryNames.push(...collectCategoryNames(children))
    })
  }

  return categoryNames
}

function toCategoryOptions(value: unknown): DropdownOption[] {
  return [...new Set(collectCategoryNames(value))]
    .filter(Boolean)
    .map((category) => ({ label: category, value: category }))
}

function itemRowClass(item: ItemOption) {
  return [
    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
    selectedItemId.value === item.itemId
      ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(255,111,15,0.14)]'
      : 'border-border bg-surface hover:bg-surface-secondary',
    (isResolvingAssets.value || props.submitting) && 'cursor-not-allowed opacity-60',
  ]
}

function itemCountBadgeClass(item: ItemOption) {
  return [
    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
    item.availableCount >= requestedQuantity.value
      ? 'bg-primary/10 text-primary'
      : 'bg-danger/10 text-danger',
  ]
}

function itemCountText(item: ItemOption) {
  return item.availableCountLabel ?? `남은 수량 ${item.availableCount}개`
}

function isRequestedItem(item: ItemOption) {
  if (item.requestedItem) return true

  const requestedName = normalizeItemName(
    props.ticket?.requestedItemName
      ?? props.ticket?.requestedItemDetail
      ?? props.ticket?.productName
      ?? '',
  )
  const itemName = normalizeItemName(item.name)

  if (!requestedName || !itemName) return false
  return requestedName.includes(itemName) || itemName.includes(requestedName)
}

function normalizeItemName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\d+\s*(개|석|seat|seats|user|users|명)/g, '')
    .replace(/[^a-z0-9가-힣]/g, '')
}

function toTangibleItemOption(item: TangibleAssetItem): ItemOption {
  const aliases = item as TangibleItemAliases
  const itemId = String(item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? '')
  const availableCount = availableItemCount(item)

  return {
    itemId,
    itemNo: item.itemNo ?? item.itemCode ?? itemId,
    name: item.name ?? item.productName ?? aliases.assetName ?? item.itemCode ?? itemId,
    category: item.categoryName ?? item.category ?? '',
    availableCount,
    assetType: 'TANGIBLE',
    isStandard: isStandardValue(item.isStandard),
  }
}

function toIntangibleItemOption(item: IntangibleItem): ItemOption {
  const itemId = String(item.assetItemId ?? item.itemId ?? item.id ?? '')
  const availableCount = availableSeatCount(item)

  return {
    itemId,
    itemNo: itemId ? `SW-${itemId.padStart(4, '0')}` : '-',
    name: item.productName ?? itemId,
    category: [item.category, licenseTypeLabel(item.licenseType)].filter(Boolean).join(' · '),
    availableCount,
    availableCountLabel: assignablePersonCountLabel(availableCount),
    assetType: 'INTANGIBLE',
    isStandard: isStandardValue(item.isStandard),
  }
}

function toAssetRequestItemOption(item: AssetRequestAssignableItem): ItemOption {
  const itemId = String(
    item.itemId
      ?? item.assetItemId
      ?? item.tangibleAssetItemId
      ?? item.intangibleAssetItemId
      ?? item.itemIdentifier
      ?? '',
  )

  const itemAssetType = assetRequestItemAssetType(item)
  const availableCount = itemAssetType === 'INTANGIBLE'
    ? availableSeatCount(item)
    : availableItemCount(item)

  return {
    itemId,
    itemNo: String((item.itemIdentifier ?? item.itemNo ?? item.itemCode ?? itemId) || '-'),
    name: String((item.productName ?? item.name ?? item.itemIdentifier ?? itemId) || '-'),
    category: [item.categoryName, licenseTypeLabel(item.licenseType)].filter(Boolean).join(' · '),
    availableCount,
    availableCountLabel: itemAssetType === 'INTANGIBLE'
      ? assignablePersonCountLabel(availableCount)
      : undefined,
    assetType: itemAssetType,
    isStandard: isStandardValue(item.isStandard),
    requestedItem: item.requestedItem,
  }
}

function assetRequestItemAssetType(item: AssetRequestAssignableItem): AssetType {
  if (item.assetType === 'INTANGIBLE' || item.assetType === 'TANGIBLE') return item.assetType
  return item.intangibleAssetItemId || item.licenseType ? 'INTANGIBLE' : assetType.value
}

function licenseTypeLabel(value: string | null | undefined) {
  if (!value) return ''
  return LICENSE_TYPE_LABEL[value] ?? value
}

function isStandardValue(value: boolean | number | string | null | undefined) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value !== '0' && value.toLowerCase() !== 'false'
  return true
}

function uniqueItemOptions(items: ItemOption[]) {
  const itemMap = new Map<string, ItemOption>()
  items.forEach((item) => {
    if (!item.itemId || itemMap.has(item.itemId)) return
    itemMap.set(item.itemId, item)
  })
  return [...itemMap.values()]
}

function getTangibleAssetId(asset: TangibleAsset) {
  return String(asset.assetId ?? asset.id ?? asset.tangibleAssetId ?? '')
}

function getAssetItemId(asset: TangibleAsset) {
  const assetRecord = asset as unknown as Record<string, unknown>
  const assetItem = asRecord(assetRecord.assetItem)
  const item = asRecord(assetRecord.item)
  return String(
    asset.assetItemId
      ?? asset.tangibleItemId
      ?? asset.tangibleAssetItemId
      ?? assetRecord.itemId
      ?? assetItem?.itemId
      ?? assetItem?.assetItemId
      ?? item?.itemId
      ?? '',
  )
}

function getIntangibleAssetItemId(asset: Record<string, unknown>) {
  const assetItem = asRecord(asset.assetItem)
  const item = asRecord(asset.item)
  return String(
    asset.assetItemId
      ?? asset.itemId
      ?? asset.intangibleItemId
      ?? asset.intangibleAssetItemId
      ?? assetItem?.itemId
      ?? assetItem?.assetItemId
      ?? item?.itemId
      ?? '',
  )
}

function isAvailableAsset(status: string | null | undefined) {
  return status === 'AVAILABLE'
}

function availableItemCount(item: object) {
  const source = item as Record<string, unknown>
  return numberValue(
    source.availableCount
      ?? source.availableAssetCount
      ?? source.intangibleAssetCount
      ?? source.totalAssetCount
      ?? source.assetTotalCount
      ?? source.assetCount
      ?? source.stockCount
      ?? source.count,
  )
}

function availableSeatCount(item: object) {
  const source = item as Record<string, unknown>
  return numberValue(
    source.availableSeatCount
      ?? source.remainingSeatCount
      ?? source.remainingSeats
      ?? source.availableSeats
      ?? source.assignableSeatCount
      ?? source.remainingAssignableCount
      ?? source.remainingAssignableSeatCount
      ?? source.availableUserCount
      ?? source.remainingUserCount
      ?? source.availableMemberCount
      ?? source.remainingMemberCount
      ?? source.availableAssignmentCount
      ?? source.remainingAssignmentCount
      ?? source.available_seat_count
      ?? source.remaining_seat_count
      ?? source.available_user_count
      ?? source.remaining_user_count
      ?? source.available_member_count
      ?? source.remaining_member_count
      ?? source.available_assignment_count
      ?? source.remaining_assignment_count
      ?? source.availableCount
      ?? source.availableAssetCount
      ?? source.intangibleAssetCount
      ?? source.totalAssetCount
      ?? source.assetTotalCount
      ?? source.assetCount
      ?? source.stockCount
      ?? source.count,
  )
}

function assignablePersonCountLabel(count: number) {
  return `할당 가능 ${count}명`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
</script>
