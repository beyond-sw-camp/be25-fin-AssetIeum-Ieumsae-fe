<template>
  <BaseDrawer :is-open="isOpen" title="유형자산 품목 등록" submit-text="등록" @close="emit('close')" @submit="handleSave">
    <div class="space-y-5 py-2">
      <!-- 제품명 -->
      <div>
        <label for="productName" class="text-sm font-semibold text-text-main mb-3 block">
          제품명 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="productName" v-model="formData.assetName" placeholder="예: MacBook Pro 16인치" />
      </div>

      <!-- 카테고리 -->
      <div>
        <label for="category" class="text-sm font-semibold text-text-main mb-3 block">
          카테고리 <span class="text-primary font-bold">*</span>
        </label>
        <Dropdown v-model="formData.category" :options="dropdownOptions" root-option="카테고리 선택" />
      </div>

      <!-- 제조사 -->
      <div>
        <label for="manufacturer" class="text-sm font-semibold text-text-main mb-3 block">
          제조사 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="manufacturer" v-model="formData.manufacturer" placeholder="예: Apple, 삼성전자" />
      </div>

      <!-- 모델명 -->
      <div>
        <label for="modelName" class="text-sm font-semibold text-text-main mb-3 block">
          모델명 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="modelName" v-model="formData.modelName" placeholder="예: A2992, SM-S928N" />
      </div>

      <!-- 표준 품목 여부 -->
      <div>
        <label class="text-sm font-semibold text-text-main mb-3 block">
          표준 품목 여부 <span class="text-primary font-bold">*</span>
        </label>
        <div class="flex gap-8 mt-2">
          <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
            <div class="relative flex items-center justify-center">
              <input v-model="formData.isStandard" type="radio" :value="1" class="sr-only peer" />
              <div 
                class="w-5 h-5 rounded-full border border-gray-300 bg-white 
                peer-checked:border-primary transition-all duration-200
              group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </div>
              <div 
                class="absolute w-2.5 h-2.5 rounded-full bg-primary 
                scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out"
              >
              </div>
            </div>
            <span>표준 자산</span>
          </label>

          <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
            <div class="relative flex items-center justify-center">
              <input v-model="formData.isStandard" type="radio" :value="0" class="sr-only peer" />
              <div 
                class="w-5 h-5 rounded-full border border-gray-300 bg-white 
                peer-checked:border-primary transition-all duration-200
              group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              >
              </div>
              <div 
                class="absolute w-2.5 h-2.5 rounded-full bg-primary 
                scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out"
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
import { ref, watch, computed } from 'vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import Input from '@/components/common/Input.vue';
import Dropdown from '@/components/common/Dropdown.vue';

interface CategoryItem {
    id: string;
    name: string;
}

interface RegisterForm {
    assetName: string
    category: string
    manufacturer: string
    modelName: string
    isStandard: number
}

const props = defineProps<{
    isOpen: boolean;
    initialCategories: CategoryItem[]; // 부모에게서 내려받는 카테고리 원본 목록
}>();

const emit = defineEmits(['close', 'update-categories']);

const dropdownOptions = computed(() => {
    return props.initialCategories.map(cat => cat.name);
});

// 등록할 폼 데이터 객체
const formData = ref<RegisterForm>({
    assetName: '',
    category: '카테고리 선택', // 기본값 매칭
    manufacturer: '',
    modelName: '',
    isStandard: 1
});

const handleSave = () => {
    // 카테고리 유효성 검사 추가
    if (formData.value.category === '카테고리 선택') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    if (!formData.value.assetName.trim() || !formData.value.modelName.trim()) {
        alert('필수 항목을 입력해주세요.');
        return;
    }

    console.log('서버로 보낼 완벽한 데이터:', formData.value);
    alert('성공적으로 등록되었습니다.');
    emit('close');
};

// 창이 열릴 때마다 기존 입력값 리셋
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formData.value = {
            assetName: '',
            category: '카테고리 선택',
            manufacturer: '',
            modelName: '',
            isStandard: 1
        };
    }
});
</script>