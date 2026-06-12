<template>
  <BaseDrawer
    :is-open="isOpen"
    title="유형자산 품목 등록"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <!-- 제품명 -->
      <div>
        <label for="productName" class="text-sm font-semibold text-text-main mb-2 block">
          제품명 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="productName" v-model="formData.productName" placeholder="예: MacBook Pro 16인치" />
      </div>

      <!-- 카테고리 -->
      <div>
        <label for="category" class="text-sm font-semibold text-text-main mb-3 block">
          카테고리 <span class="text-primary font-bold">*</span>
        </label>
        <div class="rounded-xl border border-border bg-surface">
          <button
            type="button"
            class="flex h-10 w-full items-center justify-between gap-3 px-3.5 text-left text-sm"
            @click="isCategoryListOpen = !isCategoryListOpen"
          >
            <span :class="formData.category === DEFAULT_CATEGORY ? 'text-text-muted' : 'font-medium text-text-main'">
              {{ formData.category }}
            </span>
            <ChevronDown
              :size="16"
              class="shrink-0 text-text-muted transition-transform"
              :class="isCategoryListOpen && 'rotate-180'"
            />
          </button>

          <div v-if="isCategoryListOpen" class="border-t border-border p-2">
            <div
              v-for="group in initialCategories"
              :key="group.mainCategory"
              class="overflow-hidden rounded-lg"
            >
              <button
                type="button"
                :class="[
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-secondary',
                  isCategorySelected(group.mainCategory) ? 'font-semibold text-primary' : 'font-medium text-text-main',
                ]"
                @click="selectMainCategory(group)"
              >
                <span class="truncate">{{ group.mainCategory }}</span>
                <ChevronDown
                  v-if="getMiddleCategories(group).length"
                  :size="15"
                  class="shrink-0 text-text-muted transition-transform"
                  :class="expandedMainCategory === group.mainCategory && 'rotate-180'"
                />
              </button>

              <div
                v-if="expandedMainCategory === group.mainCategory"
                class="ml-3 border-l border-border/80 pl-2"
              >
                <div
                  v-for="middleCategory in getMiddleCategories(group)"
                  :key="`${group.mainCategory}-${middleCategory}`"
                  class="overflow-hidden rounded-lg"
                >
                  <button
                    type="button"
                    :class="[
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-secondary',
                      isCategorySelected(middleCategory) ? 'font-semibold text-primary' : 'text-text-main',
                    ]"
                    @click="selectMiddleCategory(group, middleCategory)"
                  >
                    <span class="truncate">{{ middleCategory }}</span>
                    <ChevronDown
                      v-if="getSmallCategories(group, middleCategory).length"
                      :size="15"
                      class="shrink-0 text-text-muted transition-transform"
                      :class="expandedMiddleCategory === middleCategory && 'rotate-180'"
                    />
                  </button>

                  <div
                    v-if="expandedMiddleCategory === middleCategory"
                    class="ml-3 border-l border-border/70 pl-2"
                  >
                    <button
                      v-for="smallCategory in getSmallCategories(group, middleCategory)"
                      :key="`${group.mainCategory}-${middleCategory}-${smallCategory}`"
                      type="button"
                      :class="[
                        'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-secondary',
                        isCategorySelected(smallCategory) ? 'font-semibold text-primary' : 'text-text-main',
                      ]"
                      @click="selectCategory(smallCategory, group.childCategoryIds?.[smallCategory] ?? '')"
                    >
                      {{ smallCategory }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 제조사 -->
      <div>
        <label for="manufacturer" class="text-sm font-semibold text-text-main mb-2 block">
          제조사 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="manufacturer" v-model="formData.manufacturer" placeholder="예: Apple, 삼성전자" />
      </div>

      <!-- 모델명 -->
      <div>
        <label for="modelName" class="text-sm font-semibold text-text-main mb-2 block">
          모델명 <span class="text-primary font-bold">*</span>
        </label>
        <Input id="modelName" v-model="formData.modelName" placeholder="예: A2992, SM-S928N" />
      </div>

      <!-- 표준 품목 여부 -->
      <div>
        <label class="text-sm font-semibold text-text-main mb-2 block">
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

    <template #footer>
      <Button
        class="w-full"
        :disabled="!isRegisterReady || isSaving"
        :loading="isSaving"
        @click="handleSave"
      >
        등록
      </Button>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import { ChevronDown } from 'lucide-vue-next';
import { tangibleItemApi } from '@/api/asset.api';
import type { TangibleAssetItemCreateRequest } from '@/types';

interface CategoryGroup {
    mainCategory: string;
    categoryId?: string;
    subCategories: string[];
    childCategories?: Record<string, string[]>;
    subCategoryIds?: Record<string, string>;
    childCategoryIds?: Record<string, string>;
}

interface RegisterForm {
    productName: string
    category: string
    categoryId: string
    manufacturer: string
    modelName: string
    isStandard: number
}

const props = defineProps<{
    isOpen: boolean;
    initialCategories: CategoryGroup[];
    companyId?: string;
}>();

const emit = defineEmits(['close', 'update-categories', 'registered']);

const DEFAULT_CATEGORY = '카테고리 선택';

const createInitialForm = (): RegisterForm => ({
    productName: '',
    category: DEFAULT_CATEGORY,
    categoryId: '',
    manufacturer: '',
    modelName: '',
    isStandard: 1
});

// 등록할 폼 데이터 객체
const formData = ref<RegisterForm>(createInitialForm());
const isCategoryListOpen = ref(false);
const expandedMainCategory = ref('');
const expandedMiddleCategory = ref('');
const isSaving = ref(false);

const isRegisterReady = computed(() => (
    formData.value.category !== DEFAULT_CATEGORY &&
    Boolean(formData.value.categoryId) &&
    Boolean(formData.value.productName.trim()) &&
    Boolean(formData.value.manufacturer.trim()) &&
    Boolean(formData.value.modelName.trim())
));

const getSmallCategorySet = (group: CategoryGroup) => (
    new Set(Object.values(group.childCategories ?? {}).flat())
);

const getMiddleCategories = (group: CategoryGroup) => {
    const smallCategorySet = getSmallCategorySet(group);
    return group.subCategories.filter((subCategory) => !subCategory.endsWith(' - 전체') && !smallCategorySet.has(subCategory));
};

const getSmallCategories = (group: CategoryGroup, middleCategory: string) => (
    group.childCategories?.[middleCategory] ?? []
);

const isCategorySelected = (category: string) => (
    formData.value.category === category
);

const selectCategory = (category: string, categoryId = '') => {
    formData.value.category = category;
    formData.value.categoryId = category === DEFAULT_CATEGORY ? '' : categoryId;
};

const selectMainCategory = (group: CategoryGroup) => {
    formData.value.category = group.mainCategory;
    formData.value.categoryId = group.categoryId ?? '';
    expandedMainCategory.value = expandedMainCategory.value === group.mainCategory ? '' : group.mainCategory;
    expandedMiddleCategory.value = '';
};

const selectMiddleCategory = (group: CategoryGroup, middleCategory: string) => {
    formData.value.category = middleCategory;
    formData.value.categoryId = group.subCategoryIds?.[middleCategory] ?? '';
    expandedMainCategory.value = group.mainCategory;
    expandedMiddleCategory.value = expandedMiddleCategory.value === middleCategory ? '' : middleCategory;
};

const getErrorMessage = (error: unknown) => (
    error instanceof Error ? error.message : '품목 등록 중 오류가 발생했습니다.'
);

const handleSave = async () => {
    if (!isRegisterReady.value || isSaving.value) return;

    if (formData.value.category === DEFAULT_CATEGORY || !formData.value.categoryId) {
        alert('카테고리를 선택해주세요.');
        return;
    }
    if (!formData.value.productName.trim() || !formData.value.modelName.trim()) {
        alert('필수 항목을 입력해주세요.');
        return;
    }

    if (!props.companyId) {
        alert('회사 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.');
        return;
    }

    const productName = formData.value.productName.trim();
    const payload: TangibleAssetItemCreateRequest = {
        companyId: props.companyId,
        categoryId: formData.value.categoryId,
        productName,
        manufacturer: formData.value.manufacturer.trim(),
        modelName: formData.value.modelName.trim(),
        isStandard: formData.value.isStandard,
    };

    isSaving.value = true;

    try {
        await tangibleItemApi.create(payload);
        emit('registered');
        alert('성공적으로 등록되었습니다.');
        emit('close');
    } catch (error) {
        console.error(error);
        alert(getErrorMessage(error));
    } finally {
        isSaving.value = false;
    }
};

// 창이 열릴 때마다 기존 입력값 리셋
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formData.value = createInitialForm();
        isCategoryListOpen.value = false;
        expandedMainCategory.value = '';
        expandedMiddleCategory.value = '';
        isSaving.value = false;
        return;
    }

    formData.value = createInitialForm();
    isCategoryListOpen.value = false;
    expandedMainCategory.value = '';
    expandedMiddleCategory.value = '';
    isSaving.value = false;
});
</script>
