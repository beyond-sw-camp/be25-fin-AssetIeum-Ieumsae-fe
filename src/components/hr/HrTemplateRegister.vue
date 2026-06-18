<template>
  <BaseDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    panel-class="w-full max-w-[804px]"
    body-class="p-0"
    hide-footer
    @close="handleClose"
  >
    <div class="flex min-h-full flex-col">
      <div class="flex-1 px-6 py-5">
        <section class="space-y-5">
          <div class="border-b border-primary/40 pb-3">
            <h3 class="text-lg font-bold text-primary">
              자산 구성 빌더
            </h3>
          </div>

          <button
            type="button"
            class="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-surface text-base font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            @click="addItemRow"
          >
            <PlusCircle :size="22" />
            <span>자산 품목 추가</span>
          </button>

          <div class="grid grid-cols-[minmax(132px,1fr)_minmax(220px,1.7fr)_106px_40px] gap-4 px-2 text-sm font-bold text-text-sub">
            <span>자산 유형</span>
            <span>품목명</span>
            <span class="text-center">수량</span>
            <span class="sr-only">삭제</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="(item, index) in items"
              :key="item.rowId"
              class="grid grid-cols-[minmax(132px,1fr)_minmax(220px,1.7fr)_106px_40px] items-center gap-4 rounded-lg bg-surface-secondary p-2"
            >
              <Dropdown
                :id="`hr-template-asset-type-${item.rowId}`"
                :model-value="item.assetType"
                :options="assetTypeOptions"
                @update:model-value="updateAssetType(index, $event)"
              />

              <div class="relative">
                <Search
                  :size="18"
                  class="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-text-sub"
                />
                <Dropdown
                  :id="`hr-template-asset-item-${item.rowId}`"
                  class="pl-0 [&>button]:pl-10"
                  :model-value="item.assetItemId"
                  :options="getAssetItemOptions(item.assetType)"
                  root-option="자산 품목 선택"
                  :disabled="!item.assetType"
                  @update:model-value="updateAssetItem(index, $event)"
                />
              </div>

              <Input
                :id="`hr-template-quantity-${item.rowId}`"
                :model-value="item.quantity"
                type="number"
                :min="1"
                @update:model-value="updateQuantity(index, $event)"
              />

              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-danger/10 hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="items.length === 1"
                aria-label="자산 품목 삭제"
                @click="removeItemRow(index)"
              >
                <Trash2 :size="21" />
              </button>
            </div>
          </div>
        </section>

        <p v-if="errorMessage" class="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {{ errorMessage }}
        </p>
      </div>

      <div class="flex shrink-0 justify-end gap-4 border-t border-border px-8 py-6">
        <Button
          variant="outline"
          size="m"
          :disabled="isSaving"
          @click="handleClose"
        >
          취소
        </Button>

        <Button
          size="m"
          :disabled="!isRegisterReady || isSaving"
          :loading="isSaving"
          @click="handleRegister"
        >
          저장하기
        </Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusCircle, Search, Trash2 } from 'lucide-vue-next'

import { hrApi } from '@/api/hr.api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import type { DropdownOption, HrTemplateAssetType, IntangibleItem, TangibleAssetItem } from '@/types'
import type { HrTemplateCreateRequest, HrTemplateId } from '@/types/hr'

interface TemplateItemForm {
  rowId: string
  assetType: HrTemplateAssetType
  assetItemId: string | number
  quantity: string
}

const props = defineProps<{
  isOpen: boolean
  templateId?: HrTemplateId | null
  assetTypes: HrTemplateAssetType[]
  tangibleAssetItems: TangibleAssetItem[]
  intangibleAssetItems: IntangibleItem[]
}>()

const createItemRow = (): TemplateItemForm => ({
  rowId: crypto.randomUUID(),
  assetType: props.assetTypes[0] ?? 'TANGIBLE',
  assetItemId: '',
  quantity: '1',
})

const items = ref<TemplateItemForm[]>([createItemRow()])
const isSaving = ref(false)
const errorMessage = ref('')

const emit = defineEmits<{
  close: []
  registered: []
}>()

const handleClose = () => {
  resetForm()
  emit('close')
}

const ASSET_TYPE_LABEL: Record<HrTemplateAssetType, string> = {
  TANGIBLE: '유형자산',
  INTANGIBLE: '무형자산',
}

const drawerTitle = computed(() => props.templateId ? '템플릿 수정' : '템플릿 등록')

const assetTypeOptions = computed(() =>
  props.assetTypes.map((type) => ({
    label: ASSET_TYPE_LABEL[type],
    value: type,
  })),
)

const getAssetItemOptions = (assetType: HrTemplateAssetType): DropdownOption[] => {
  switch (assetType) {
    case 'TANGIBLE':
      return props.tangibleAssetItems
        .map((item) => ({
          label: item.productName ?? item.name,
          value: item.assetItemId ?? item.itemId ?? '',
        }))
        .filter((option) => Boolean(option.label && option.value))

    case 'INTANGIBLE':
      return props.intangibleAssetItems
        .map((item) => ({
          label: item.productName,
          value: item.assetItemId ?? item.itemId ?? item.id ?? '',
        }))
        .filter((option) => Boolean(option.label && option.value))

    default:
      return []
  }
}

const isRegisterReady = computed(() => (
  items.value.length > 0
  && items.value.every((item) => {
    const quantityValue = Number(item.quantity)

    return Boolean(
      item.assetType
      && item.assetItemId
      && Number.isInteger(quantityValue)
      && quantityValue > 0,
    )
  })
))

function resetForm() {
  items.value = [createItemRow()]
  errorMessage.value = ''
}

const handleRegister = async () => {
  if (!isRegisterReady.value || isSaving.value) return

  const payload: HrTemplateCreateRequest = {
    items: items.value.map((item) => ({
      assetType: item.assetType,
      assetItemId: toApiId(item.assetItemId),
      quantity: Number(item.quantity),
    })),
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await hrApi.createTemplate(payload)
    emit('registered')
    handleClose()
  } catch (error) {
    console.error('HR 템플릿 등록 실패', error)
    errorMessage.value = props.templateId
      ? '템플릿을 수정하지 못했습니다.'
      : '템플릿을 등록하지 못했습니다.'
  } finally {
    isSaving.value = false
  }
}

function addItemRow() {
  items.value.push(createItemRow())
}

function removeItemRow(index: number) {
  if (items.value.length === 1) return
  items.value.splice(index, 1)
}

function updateAssetType(index: number, value: string | number) {
  const nextAssetType = String(value) as HrTemplateAssetType
  const item = items.value[index]
  if (!item || !props.assetTypes.includes(nextAssetType)) return

  item.assetType = nextAssetType
  item.assetItemId = ''
}

function updateAssetItem(index: number, value: string | number) {
  const item = items.value[index]
  if (!item) return

  item.assetItemId = value
}

function updateQuantity(index: number, value: string) {
  const item = items.value[index]
  if (!item) return

  item.quantity = value
}

function toApiId(value: string | number) {
  if (typeof value === 'number') return value
  return /^\d+$/.test(value) ? Number(value) : value
}
</script>
