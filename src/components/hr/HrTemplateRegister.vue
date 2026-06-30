<template>
  <BaseDrawer
    :is-open="isOpen"
    :title="drawerTitle"
    panel-class="w-full max-w-[804px]"
    body-class="p-0"
    hide-footer
    @close="handleClose"
  >
    <div class="flex min-h-full flex-col bg-surface">
      <div class="flex-1 overflow-y-auto px-8 py-7">
        <section class="space-y-5">
          <div class="rounded-lg border border-border bg-surface p-5">
            <div class="mb-5 border-b border-border pb-3">
              <h3 class="text-sm font-bold text-text-main">
                품목 추가
              </h3>
            </div>

            <div class="grid grid-cols-[minmax(120px,1fr)_minmax(220px,1.8fr)_88px_96px] items-end gap-3">
              <label class="space-y-2">
                <span class="text-xs font-bold text-text-sub">자산 유형</span>
                <Dropdown
                  id="hr-template-draft-asset-type"
                  :model-value="draftItem.assetType"
                  :options="assetTypeOptions"
                  menu-strategy="fixed"
                  @update:model-value="updateDraftAssetType"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold text-text-sub">품목명</span>
                <Dropdown
                  id="hr-template-draft-asset-item"
                  :model-value="draftItem.assetItemId"
                  :options="getAssetItemOptions(draftItem.assetType)"
                  root-option="자산 품목 선택"
                  menu-strategy="fixed"
                  :disabled="!draftItem.assetType"
                  @update:model-value="updateDraftAssetItem"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-bold text-text-sub">수량</span>
                <Input
                  id="hr-template-draft-quantity"
                  :model-value="draftItem.quantity"
                  type="number"
                  :min="1"
                  @update:model-value="updateDraftQuantity"
                />
              </label>

              <Button
                :disabled="!canAddDraftItem"
                class="w-20"
                @click="addDraftItem"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <PlusCircle :size="14" />
                  <span>추가</span>
                </div>
              </Button>
            </div>
          </div>

          <div class="rounded-lg border border-border bg-surface p-5">
            <div class="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h4 class="text-sm font-bold text-text-main">
                추가된 품목
              </h4>
              <span class="text-xs font-semibold text-text-sub">
                총 {{ items.length }}개
              </span>
            </div>

            <div class="overflow-hidden rounded-lg border border-border">
              <div class="grid grid-cols-[minmax(120px,1fr)_minmax(220px,1.8fr)_88px_62px] gap-4 border-b border-border bg-surface-secondary px-4 py-3 text-xs font-bold text-text-sub">
                <span>자산 유형</span>
                <span>품목명</span>
                <span class="text-center">수량</span>
                <span class="pl-2">삭제</span>
              </div>

              <div
                v-if="items.length === 0"
                class="flex h-32 items-center justify-center bg-surface text-sm text-text-sub"
              >
                추가된 자산 품목이 없습니다.
              </div>

              <div v-else class="divide-y divide-border">
                <div
                  v-for="(item, index) in items"
                  :key="item.rowId"
                  class="grid grid-cols-[minmax(120px,1fr)_minmax(220px,1.8fr)_88px_57px] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-secondary/60"
                >
                  <span class="text-sm font-semibold text-text-main">
                    {{ ASSET_TYPE_LABEL[item.assetType] }}
                  </span>

                  <span class="truncate text-sm font-medium text-text-main">
                    {{ item.productName }}
                  </span>

                  <span class="text-center text-sm font-semibold text-text-main">
                    {{ item.quantity }}
                  </span>

                  <Button
                    variant="danger"
                    size="sm"
                    class="whitespace-nowrap gap-1"
                    @click="removeItemRow(index)"
                  >
                    <Trash2 :size="14" />
                    <span class="hidden md:inline">삭제</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p v-if="errorMessage" class="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {{ errorMessage }}
        </p>
      </div>

      <div class="shrink-0 border-t border-border bg-surface px-8 py-5">
        <Button
          class="w-full"
          size="m"
          :disabled="!isRegisterReady || isSaving"
          :loading="isSaving"
          @click="handleRegister"
        >
          등록하기
        </Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusCircle, Trash2 } from 'lucide-vue-next'

import { hrApi } from '@/api/hr.api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { useNotificationStore } from '@/stores'
import type { DropdownOption, HrTemplateAssetType, IntangibleItem, TangibleAssetItem } from '@/types'
import type { HrTemplateCreateRequest, HrTemplateId } from '@/types/hr'
import { getApiErrorMessage } from '@/utils/apiError'

interface TemplateItemForm {
  rowId: string
  assetType: HrTemplateAssetType
  assetItemId: string | number
  productName: string
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
  productName: '',
  quantity: '1',
})

const draftItem = ref<TemplateItemForm>(createItemRow())
const items = ref<TemplateItemForm[]>([])
const isSaving = ref(false)
const errorMessage = ref('')
const notificationStore = useNotificationStore()

const emit = defineEmits<{
  close: []
  registered: [updatedAt?: string]
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

const canAddDraftItem = computed(() => {
  const quantityValue = Number(draftItem.value.quantity)

  return Boolean(
    draftItem.value.assetType
    && draftItem.value.assetItemId
    && Number.isInteger(quantityValue)
    && quantityValue > 0,
  )
})

function resetForm() {
  draftItem.value = createItemRow()
  items.value = []
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
    const response = await hrApi.createTemplate(payload)
    notificationStore.success(props.templateId ? '입사 템플릿이 수정되었습니다.' : '입사 템플릿이 등록되었습니다.')
    emit('registered', response.data.updatedAt ?? new Date().toISOString())
    handleClose()
  } catch (error) {
    console.error('HR 템플릿 등록 실패', error)
    errorMessage.value = getApiErrorMessage(
      error,
      props.templateId ? '템플릿을 수정하지 못했습니다.' : '템플릿을 등록하지 못했습니다.',
    )
    notificationStore.error(
      props.templateId ? '입사 템플릿 수정 실패' : '입사 템플릿 등록 실패',
      errorMessage.value,
    )
  } finally {
    isSaving.value = false
  }
}

function removeItemRow(index: number) {
  items.value.splice(index, 1)
}

function updateDraftAssetType(value: string | number) {
  const nextAssetType = String(value) as HrTemplateAssetType
  if (!props.assetTypes.includes(nextAssetType)) return

  draftItem.value.assetType = nextAssetType
  draftItem.value.assetItemId = ''
  draftItem.value.productName = ''
}

function updateDraftAssetItem(value: string | number) {
  const selectedOption = getAssetItemOptions(draftItem.value.assetType)
    .find((option) => String(option.value) === String(value))

  draftItem.value.assetItemId = value
  draftItem.value.productName = selectedOption?.label ?? ''
}

function updateDraftQuantity(value: string) {
  draftItem.value.quantity = value
}

function addDraftItem() {
  if (!canAddDraftItem.value) return

  const existingItem = items.value.find((item) => (
    item.assetType === draftItem.value.assetType
    && String(item.assetItemId) === String(draftItem.value.assetItemId)
  ))

  if (existingItem) {
    existingItem.quantity = String(Number(existingItem.quantity) + Number(draftItem.value.quantity))
  } else {
    items.value.push({
      ...draftItem.value,
      rowId: crypto.randomUUID(),
    })
  }

  draftItem.value = {
    ...createItemRow(),
    assetType: draftItem.value.assetType,
  }
}

function toApiId(value: string | number) {
  return String(value)
}
</script>
