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

      <section v-if="suggestedItemOptions.length > 0" class="space-y-2">
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
          <span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            사용가능 {{ item.availableCount }}개
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
          :disabled="!selectedCategory || isCategoryLoading || isItemLoading || isResolvingAssets || submitting"
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

      <div class="max-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-border p-2">
        <h3 v-if="suggestedItemOptions.length > 0" class="px-1 pt-1 text-sm font-semibold text-text-main">
          같은 카테고리 품목
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
            <span class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              사용가능 {{ item.availableCount }}개
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
} from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import { useNotificationStore } from '@/stores'
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
  availableCount: number
}

interface TangibleItemAliases extends TangibleAssetItem {
  assetName?: string
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
const selectedCategory = ref('')
const keyword = ref('')
const returnDueDate = ref('')
const selectedItemId = ref('')
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

const emptyItemTitle = computed(() => {
  if (!hasSearchedItems.value) return '자산 분류를 선택하고 조회를 눌러주세요.'
  if (suggestedItemOptions.value.length > 0) return '같은 카테고리의 다른 품목이 없습니다.'
  return '조회된 품목이 없습니다.'
})

const emptyItemDescription = computed(() => {
  if (!hasSearchedItems.value) return '키워드는 필요한 경우에만 입력하면 됩니다.'
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
  keyword.value = ''
  selectedItemId.value = ''
  clearItems()
  await loadCategories()
  selectedCategory.value = resolveInitialCategory()
  if (selectedCategory.value) {
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
  if (!selectedCategory.value) {
    validationMessage.value = '자산 분류를 선택해주세요.'
    return
  }

  isItemLoading.value = true
  itemErrorMessage.value = ''
  validationMessage.value = ''
  selectedItemId.value = ''
  hasSearchedItems.value = true

  try {
    if (assetType.value === 'TANGIBLE') {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        categoryName: selectedCategory.value,
        keyword: keyword.value.trim() || undefined,
      })
      tangibleItems.value = response.data.content
      return
    }

    const response = await intangibleItemApi.getList({
      page: 0,
      size: 100,
      category: selectedCategory.value,
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
  if (item.availableCount < requestedQuantity.value) {
    showInsufficientQuantityToast(item.availableCount)
    return
  }

  isResolvingAssets.value = true
  itemErrorMessage.value = ''

  try {
    const assetIds = await loadAssignableAssetIds(item.itemId, requestedQuantity.value)
    if (assetIds.length < requestedQuantity.value) {
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

function showInsufficientQuantityToast(availableCount: number) {
  notificationStore.warning('수량 부족', `요청 ${requestedQuantity.value}개, 사용가능 ${availableCount}개입니다.`)
}

function clearItems() {
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

function resolveInitialCategory() {
  const requestedCategory = props.ticket?.categoryName ?? ''
  if (!requestedCategory) return ''

  return categoryOptions.value.find((option) => (
    matchesCategory(requestedCategory, String(option.value))
  ))?.value as string ?? ''
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

function isRequestedItem(item: ItemOption) {
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

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s()[\]{}·/_-]/g, '')
}

function matchesCategory(requestedCategory: string, itemCategory: string) {
  const requested = normalizeCategory(requestedCategory)
  const item = normalizeCategory(itemCategory)
  if (!requested || !item) return false
  if (requested === item || requested.includes(item) || item.includes(requested)) return true

  const groups = [
    { requested: ['pc', '노트북'], items: ['노트북', 'pc'] },
    { requested: ['모니터'], items: ['모니터'] },
    { requested: ['주변기기'], items: ['주변기기', '키보드', '마우스', '웹캠', '저장장치'] },
    { requested: ['모바일기기', '스마트폰'], items: ['스마트폰', '모바일기기'] },
    { requested: ['개발도구', '개발툴'], items: ['개발도구', '개발툴'] },
    { requested: ['디자인도구', '디자인'], items: ['디자인도구', '디자인'] },
  ]

  return groups.some((group) => (
    group.requested.some((token) => requested.includes(token))
    && group.items.some((token) => item.includes(token))
  ))
}

function toTangibleItemOption(item: TangibleAssetItem): ItemOption {
  const aliases = item as TangibleItemAliases
  const itemId = String(item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? '')
  const availableCount = numberValue(item.availableCount)

  return {
    itemId,
    itemNo: item.itemNo ?? item.itemCode ?? itemId,
    name: item.name ?? item.productName ?? aliases.assetName ?? item.itemCode ?? itemId,
    category: item.categoryName ?? item.category ?? '',
    availableCount,
  }
}

function toIntangibleItemOption(item: IntangibleItem): ItemOption {
  const itemId = String(item.assetItemId ?? item.itemId ?? item.id ?? '')
  const availableCount = numberValue(item.availableCount)

  return {
    itemId,
    itemNo: itemId ? `SW-${itemId.padStart(4, '0')}` : '-',
    name: item.productName ?? itemId,
    category: item.category ?? item.licenseType ?? '',
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
