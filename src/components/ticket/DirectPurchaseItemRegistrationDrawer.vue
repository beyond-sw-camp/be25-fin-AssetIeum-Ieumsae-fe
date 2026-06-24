<template>
  <BaseDrawer
    :is-open="isOpen"
    title="비표준 품목 선택"
    panel-class="w-full max-w-2xl"
    @close="handleClose"
  >
    <div class="space-y-5">
      <section class="rounded-lg border border-border bg-surface-secondary p-4 text-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-semibold text-text-main">{{ requestItemName }}</p>
            <p class="mt-1 text-text-sub">{{ ticket.ticketNo }} · {{ assetTypeLabel }}</p>
          </div>
          <span class="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            비표준 품목
          </span>
        </div>
      </section>

      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          v-model="keyword"
          class="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="품목명, 제조사, 모델명 검색"
          :disabled="isLoadingItems || submitting"
          @keyup.enter="loadItems"
        />
        <Button
          variant="outline"
          :loading="isLoadingItems"
          :disabled="submitting"
          @click="loadItems"
        >
          <Search :size="15" />
          검색
        </Button>
      </div>

      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text-main">검색된 비표준 품목</h3>
          <span class="text-xs text-text-muted">{{ itemOptions.length }}개</span>
        </div>

        <div v-if="itemErrorMessage" class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {{ itemErrorMessage }}
        </div>

        <div class="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
          <div v-if="isLoadingItems" class="flex h-32 items-center justify-center text-sm text-text-sub">
            비표준 품목을 조회하고 있습니다.
          </div>

          <template v-else-if="itemOptions.length > 0">
            <label
              v-for="item in itemOptions"
              :key="item.itemId"
              :class="[
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                selectedMode === 'existing' && selectedItemId === item.itemId
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-surface-secondary',
              ]"
            >
              <input
                v-model="selectedItemId"
                type="radio"
                class="mt-1"
                name="direct-purchase-item"
                :value="item.itemId"
                :disabled="submitting"
                @change="selectedMode = 'existing'"
              />
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-text-main">{{ item.productName }}</span>
                <span class="mt-1 block text-xs text-text-muted">
                  {{ item.manufacturer }} · {{ item.modelName }} · {{ item.categoryName || '-' }}
                </span>
              </span>
              <span class="shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
                비표준
              </span>
            </label>
          </template>

          <div v-else class="p-6 text-center text-sm text-text-sub">
            검색어와 일치하는 비표준 품목이 없습니다.
          </div>
        </div>
      </section>

      <section class="space-y-3 rounded-lg border border-border p-4">
        <label class="flex items-center gap-2 text-sm font-semibold text-text-main">
          <input
            v-model="selectedMode"
            type="radio"
            value="new"
            :disabled="submitting"
          />
          새 비표준 품목 정보 입력
        </label>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">품목명</span>
            <input v-model="newItem.productName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">카테고리</span>
            <input v-model="newItem.categoryName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">제조사</span>
            <input v-model="newItem.manufacturer" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">모델명</span>
            <input v-model="newItem.modelName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
        </div>
      </section>

      <p v-if="validationMessage" class="text-sm text-danger">{{ validationMessage }}</p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" :disabled="submitting" @click="handleClose">
          취소
        </Button>
        <Button class="flex-1" :loading="submitting" @click="handleSubmit">
          자산 등록 및 할당
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'

import { intangibleItemApi, tangibleItemApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type { AssetType, IntangibleItem, TangibleAssetItem, TicketDetail } from '@/types'

export interface DirectPurchaseItemPayload {
  mode: 'existing' | 'new'
  productName: string
  manufacturer: string
  modelName: string
  itemId?: string
  categoryName?: string | null
}

interface ItemOption {
  itemId: string
  productName: string
  manufacturer: string
  modelName: string
  categoryName?: string | null
}

const props = defineProps<{
  isOpen: boolean
  ticket: TicketDetail
  submitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: DirectPurchaseItemPayload]
}>()

const keyword = ref('')
const selectedMode = ref<'existing' | 'new'>('existing')
const selectedItemId = ref('')
const itemOptions = ref<ItemOption[]>([])
const isLoadingItems = ref(false)
const itemErrorMessage = ref('')
const validationMessage = ref('')
const newItem = reactive({
  productName: '',
  manufacturer: '',
  modelName: '',
  categoryName: '',
})

const requestItemName = computed(() => (
  props.ticket.requestedItemName
  ?? props.ticket.requestedItemDetail
  ?? props.ticket.productName
  ?? ''
))

const assetType = computed<AssetType>(() => (
  props.ticket.assetType === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE'
))

const assetTypeLabel = computed(() => (
  assetType.value === 'INTANGIBLE' ? '무형자산' : '유형자산'
))

function isNonStandardItem(value: number | boolean | undefined) {
  if (typeof value === 'boolean') return !value
  return Number(value) === 0
}

function tangibleItemName(item: TangibleAssetItem) {
  const aliases = item as TangibleAssetItem & { assetName?: string }
  return item.name ?? item.productName ?? aliases.assetName ?? item.itemCode ?? ''
}

function mapTangibleItem(item: TangibleAssetItem): ItemOption {
  return {
    itemId: String(item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? item.itemNo),
    productName: tangibleItemName(item),
    manufacturer: item.manufacturer ?? '',
    modelName: item.modelName ?? '',
    categoryName: item.categoryName ?? item.category ?? null,
  }
}

function mapIntangibleItem(item: IntangibleItem): ItemOption {
  return {
    itemId: String(item.assetItemId ?? item.itemId ?? item.id ?? item.productName),
    productName: item.productName,
    manufacturer: item.provider ?? item.vendor ?? '',
    modelName: item.licenseType ?? item.productName,
    categoryName: item.category ?? null,
  }
}

async function loadItems() {
  isLoadingItems.value = true
  itemErrorMessage.value = ''
  validationMessage.value = ''

  try {
    if (assetType.value === 'INTANGIBLE') {
      const response = await intangibleItemApi.getList({
        page: 0,
        size: 100,
        keyword: keyword.value.trim() || undefined,
        isStandard: false,
      })
      itemOptions.value = response.data.content
        .filter((item) => isNonStandardItem(item.isStandard))
        .map(mapIntangibleItem)
    } else {
      const response = await tangibleItemApi.getList({
        page: 0,
        size: 100,
        keyword: keyword.value.trim() || undefined,
        isStandard: false,
      })
      itemOptions.value = response.data.content
        .filter((item) => isNonStandardItem(item.isStandard))
        .map(mapTangibleItem)
    }

    selectedItemId.value = itemOptions.value[0]?.itemId ?? ''
    if (itemOptions.value.length > 0) selectedMode.value = 'existing'
  } catch (error) {
    itemOptions.value = []
    itemErrorMessage.value = error instanceof Error
      ? error.message
      : '비표준 품목 목록을 불러오지 못했습니다.'
  } finally {
    isLoadingItems.value = false
  }
}

function resetForm() {
  keyword.value = requestItemName.value
  selectedMode.value = 'existing'
  selectedItemId.value = ''
  itemOptions.value = []
  itemErrorMessage.value = ''
  validationMessage.value = ''
  newItem.productName = requestItemName.value
  newItem.manufacturer = props.ticket.manufacturer ?? ''
  newItem.modelName = props.ticket.modelName ?? props.ticket.requestedItemDetail ?? ''
  newItem.categoryName = props.ticket.categoryName ?? ''
  void loadItems()
}

function handleClose() {
  if (props.submitting) return
  emit('close')
}

function handleSubmit() {
  validationMessage.value = ''

  if (selectedMode.value === 'existing') {
    const item = itemOptions.value.find((option) => option.itemId === selectedItemId.value)
    if (!item) {
      validationMessage.value = '자산 등록 및 할당에 사용할 비표준 품목을 선택해 주세요.'
      return
    }

    emit('submit', {
      mode: 'existing',
      itemId: item.itemId,
      productName: item.productName,
      manufacturer: item.manufacturer,
      modelName: item.modelName,
      categoryName: item.categoryName,
    })
    return
  }

  const productName = newItem.productName.trim()
  const manufacturer = newItem.manufacturer.trim()
  const modelName = newItem.modelName.trim()

  if (!productName || !manufacturer || !modelName) {
    validationMessage.value = '품목명, 제조사, 모델명을 모두 입력해 주세요.'
    return
  }

  emit('submit', {
    mode: 'new',
    productName,
    manufacturer,
    modelName,
    categoryName: newItem.categoryName.trim() || null,
  })
}

watch(
  () => [props.isOpen, props.ticket.ticketId] as const,
  ([isOpen]) => {
    if (isOpen) resetForm()
  },
)
</script>

<style scoped>
.form-input {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
}
</style>
