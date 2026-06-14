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
        <Dropdown v-model="formData.category" :options="dropdownOptions" root-option="카테고리 선택" />
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
              <input v-model="formData.isStandard" type="radio" :value="1" class="sr-only peer" />
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
              <input v-model="formData.isStandard" type="radio" :value="0" class="sr-only peer" />
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
import { ref, watch, computed } from 'vue'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Input from '@/components/common/Input.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import type { IntangibleItem } from '@/types'

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

interface RegisterForm {
  productName: string
  category: string
  licenseType: string
  vendor: string
  isStandard: number
}

const props = defineProps<{
  isOpen: boolean
  initialCategories: CategoryGroup[]
}>()

const emit = defineEmits(['close', 'register-asset'])

const dropdownOptions = computed(() => {
  return props.initialCategories
    .flatMap((group) => group.subCategories)
    .filter((category) => !category.startsWith('전체'))
})

const licenseTypeOptions = ['구독형 (SaaS)', '사용자 수 라이선스', '영구 라이선스', '볼륨 라이선스']

const formData = ref<RegisterForm>({
  productName: '',
  category: '카테고리 선택',
  licenseType: '라이선스 유형 선택',
  vendor: '',
  isStandard: 1,
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

  if (formData.value.licenseType === '라이선스 유형 선택') {
    alert('라이선스 유형을 선택해주세요.')
    return
  }

  emit('register-asset', { ...formData.value } as Omit<IntangibleItem, 'assetItemId'>)
  alert('성공적으로 등록되었습니다.')
  emit('close')
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
        isStandard: 1,
      }
    }
  }
)
</script>
