<template>
  <BaseDrawer
    :is-open="isOpen"
    title="템플릿 등록"
    @close="handleClose"
  >
    <div class="space-y-5">
      <section>
        <FormField label="자산 유형" required>
          <Dropdown v-model="selectedAssetTypeStatus" :options="assetTypeOptions" />
        </FormField>
      </section>
      <section>
        <FormField label="자산 품목" required>
          <Dropdown
            v-model="selectedAssetItemId"
            :options="assetItemOptions"
            root-option="자산 품목 선택"
            :disabled="!selectedAssetType"
          />
        </FormField>
      </section>
      <section>
        <Input
          id="hr-template-quantity"
          v-model="quantity"
          type="number"
          label="수량"
          required
          :min="1"
        />
      </section>

      <p v-if="errorMessage" class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        {{ errorMessage }}
      </p>
    </div>

    <template #footer>
      <Button
        class="w-full"
        :disabled="!isRegisterReady || isSaving"
        :loading="isSaving"
        @click="handleRegister"
      >
        등록
      </Button>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'

import { hrApi } from '@/api/hr.api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import type { DropdownOption, HrTemplateAssetType, IntangibleItem, TangibleAssetItem } from '@/types'
import type { HrTemplateCreateRequest } from '@/types/hr'

const selectedAssetTypeStatus = ref('자산 유형 선택')
const selectedAssetItemId = ref('')
const quantity = ref('1')
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

const assetTypeValueByLabel: Record<string, HrTemplateAssetType> = {
  유형자산: 'TANGIBLE',
  무형자산: 'INTANGIBLE',
}

const assetTypeOptions = computed(() =>
  props.assetTypes.map((type) => ASSET_TYPE_LABEL[type]),
)

const selectedAssetType = computed(() =>
  assetTypeValueByLabel[selectedAssetTypeStatus.value] ?? null,
)

const assetItemOptions = computed<DropdownOption[]>(() => {
  switch (selectedAssetType.value) {
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
})

const quantityValue = computed(() => Number(quantity.value))

const isRegisterReady = computed(() =>
  Boolean(selectedAssetType.value && selectedAssetItemId.value && Number.isInteger(quantityValue.value) && quantityValue.value > 0),
)

const props = defineProps<{
  isOpen: boolean
  assetTypes: HrTemplateAssetType[]
  tangibleAssetItems: TangibleAssetItem[]
  intangibleAssetItems: IntangibleItem[]
}>()

const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  setup(fieldProps, { slots }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('label', { class: 'flex items-center gap-0.5 text-sm font-semibold text-text-main' }, [
        fieldProps.label,
        fieldProps.required ? h('span', { class: 'ml-1 font-bold text-primary' }, '*') : null,
      ]),
      slots.default?.(),
    ])
  },
})

function resetForm() {
  selectedAssetTypeStatus.value = '자산 유형 선택'
  selectedAssetItemId.value = ''
  quantity.value = '1'
  errorMessage.value = ''
}

const handleRegister = async () => {
  if (!selectedAssetType.value || !isRegisterReady.value || isSaving.value) return

  const payload: HrTemplateCreateRequest = {
    items: [
      {
        assetType: selectedAssetType.value,
        assetItemId: toApiId(selectedAssetItemId.value),
        quantity: quantityValue.value,
      },
    ],
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await hrApi.createTemplate(payload)
    emit('registered')
    handleClose()
  } catch (error) {
    console.error('HR 템플릿 등록 실패', error)
    errorMessage.value = '템플릿을 등록하지 못했습니다.'
  } finally {
    isSaving.value = false
  }
}

watch(selectedAssetType, () => {
  selectedAssetItemId.value = ''
})

function toApiId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : value
}
 
</script>
