<template>
  <BaseDrawer :is-open="isOpen" title="무형자산 품목 등록" submit-text="등록" @close="emit('close')" @submit="handleSave">
    <div class="space-y-5 py-2">
      <div>
        <label for="productName" class="text-sm font-semibold text-text-main mb-3 block">
          제품명 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="productName" v-model="formData.productName" placeholder="예: Adobe Creative Cloud" />
      </div>

      <div>
        <label for="category" class="text-sm font-semibold text-text-main mb-3 block">
          카테고리 <span class="text-primary font-bold">*</span>
        </label>
        <Dropdown
          v-model="formData.category"
          :options="initialCategories"
          root-option="카테고리 선택"
          category-select-mode="leaf-only"
          category-value-mode="label"
        />
      </div>

      <div>
        <label for="licenseType" class="text-sm font-semibold text-text-main mb-3 block">
          라이선스 유형 <span class="text-primary font-bold">*</span>
        </label>
        <Dropdown v-model="formData.licenseType" :options="licenseTypeOptions" root-option="라이선스 유형 선택" />
      </div>

      <div>
        <label for="vendor" class="text-sm font-semibold text-text-main mb-3 block">
          제공사 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="vendor" v-model="formData.vendor" placeholder="예: Adobe, Microsoft" />
      </div>

      <!-- 표준 품목 여부 -->
      <div>
        <label class="text-sm font-semibold text-text-main mb-3 block">
          표준 품목 여부 <span class="text-primary font-bold">*</span>
        </label>
        <div class="flex gap-8 mt-2">
          <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
            <div class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input v-model="formData.isStandard" type="radio" :value="true" class="sr-only peer" />
              <div
                class="w-5 h-5 rounded-full border border-gray-300 bg-white
                peer-checked:border-primary transition-all duration-200
              group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </div>
              <div
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2
                scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </div>
            </div>
            <span>표준 자산</span>
          </label>

          <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
            <div class="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <input v-model="formData.isStandard" type="radio" :value="false" class="sr-only peer" />
              <div
                class="w-5 h-5 rounded-full border border-gray-300 bg-white
                peer-checked:border-primary transition-all duration-200
              group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </div>
              <div
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2
                scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              >
              </div>
            </div>
            <span>비표준 자산</span>
          </label>
        </div>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Input from '@/components/common/Input.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import type { IntangibleAssetItemCreateRequest, LicenseType } from '@/types'

interface CategoryGroup {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

interface RegisterForm {
  productName: string
  category: string
  licenseType: string
  vendor: string
  isStandard: boolean
}

const props = defineProps<{
  isOpen: boolean
  initialCategories: CategoryGroup[]
}>()

const emit = defineEmits(['close', 'register-asset'])

const licenseTypeOptions = ['구독형 (SaaS)', '영구 라이선스', '기간제 라이선스']
const licenseTypeValueByLabel: Record<string, LicenseType> = {
  '구독형 (SaaS)': 'SUBSCRIPTION',
  '영구 라이선스': 'PERPETUAL',
  '기간제 라이선스': 'TERM',
}

const toLicenseType = (labelOrValue: string): LicenseType => (
  licenseTypeValueByLabel[labelOrValue]
    ?? (labelOrValue === 'SUBSCRIPTION' || labelOrValue === 'PERPETUAL' || labelOrValue === 'TERM'
      ? labelOrValue
      : 'SUBSCRIPTION')
)

const formData = ref<RegisterForm>({
  productName: '',
  category: '카테고리 선택',
  licenseType: '라이선스 유형 선택',
  vendor: '',
  isStandard: true,
})

const categoryIdByName = computed(() => {
  const map = new Map<string, string>()

  props.initialCategories.forEach((group) => {
    if (group.categoryId) map.set(group.mainCategory, group.categoryId)

    Object.entries(group.subCategoryIds ?? {}).forEach(([name, id]) => {
      map.set(name, id)
    })

    Object.entries(group.childCategoryIds ?? {}).forEach(([name, id]) => {
      map.set(name, id)
    })
  })

  return map
})

const handleSave = () => {
  if (!formData.value.productName.trim()) {
    alert('제품명을 입력해주세요.')
    return
  }

  if (!formData.value.vendor.trim()) {
    alert('제공사를 입력해주세요.')
    return
  }

  if (formData.value.category === '카테고리 선택') {
    alert('카테고리를 선택해주세요.')
    return
  }

  const categoryId = categoryIdByName.value.get(formData.value.category)
  if (!categoryId) {
    alert('카테고리 ID를 찾을 수 없습니다. 카테고리를 다시 선택해주세요.')
    return
  }

  if (formData.value.licenseType === '라이선스 유형 선택') {
    alert('라이선스 유형을 선택해주세요.')
    return
  }

  const payload: IntangibleAssetItemCreateRequest = {
    categoryId,
    productName: formData.value.productName.trim(),
    licenseType: toLicenseType(formData.value.licenseType),
    provider: formData.value.vendor.trim(),
    isStandard: formData.value.isStandard,
  }

  emit('register-asset', payload)
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      formData.value = {
        productName: '',
        category: '카테고리 선택',
        licenseType: '라이선스 유형 선택',
        vendor: '',
        isStandard: true,
      }
    }
  }
)
</script>
