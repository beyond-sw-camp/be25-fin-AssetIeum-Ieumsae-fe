<template>
  <BaseDrawer
    :is-open="isOpen"
    title="유형자산 카테고리"
    @close="emit('close')"
  >
    <p class="text-sm font-semibold text-text-sub mb-4">카테고리 목록</p>

    <!-- 카테고리 리스트 영역 -->
    <div class="space-y-4">
      <div v-if="localGroups.length === 0" class="text-center py-8 text-sm text-text-muted bg-surface-secondary/30 rounded-2xl border border-dashed border-border">
        등록된 카테고리가 없습니다. 아래에서 새 대분류를 추가해주세요.
      </div>

      <div
        v-for="group in localGroups"
        :key="group.mainCategory"
        class="rounded-2xl border border-border bg-surface-secondary/50 p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-text-main">{{ group.mainCategory }}</p>
          </div>
          <button
            type="button"
            class="text-text-muted hover:text-danger p-2 rounded-lg hover:bg-surface transition-colors"
            :disabled="isSaving"
            @click="deleteMainCategory(group.mainCategory)"
          >
            <Minus :size="16" />
          </button>
        </div>

        <ul class="space-y-2 pl-3">
          <li
            v-for="subCategory in getMiddleCategories(group)"
            :key="group.mainCategory + '-' + subCategory"
            class="rounded-xl border border-border bg-surface p-2.5"
          >
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-surface transition-colors"
                :disabled="isSaving"
                @click="deleteSubCategory(group.mainCategory, subCategory)"
              >
                <Minus :size="16" />
              </button>
              <span class="text-sm text-text-main font-medium">{{ subCategory }}</span>
            </div>

            <ul v-if="getSmallCategories(group, subCategory).length" class="mt-2 space-y-1 pl-8">
              <li
                v-for="smallCategory in getSmallCategories(group, subCategory)"
                :key="`${group.mainCategory}-${subCategory}-${smallCategory}`"
                class="flex items-center gap-2 rounded-lg bg-surface-secondary/70 px-2 py-1.5"
              >
                <button
                  type="button"
                  class="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-surface transition-colors"
                  :disabled="isSaving"
                  @click="deleteSmallCategory(group.mainCategory, subCategory, smallCategory)"
                >
                  <Minus :size="14" />
                </button>
                <span class="text-xs font-medium text-text-main">{{ smallCategory }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <!-- 카테고리 추가 영역 -->
    <div class="mt-5 rounded-2xl border border-border bg-surface p-4">
      <p class="text-sm font-semibold text-text-main mb-3">카테고리 추가</p>
      <div class="mb-4 flex gap-2">
        <Button
          :variant="addMode === 'main' ? 'primary' : 'outline'"
          size="md"
          @click="handleAddModeChange('main')"
        >
          대분류 추가
        </Button>
        <Button
          :variant="addMode === 'sub' ? 'primary' : 'outline'"
          size="md"
          :disabled="localGroups.length === 0"
          @click="handleAddModeChange('sub')"
        >
          중분류 추가
        </Button>
        <Button
          :variant="addMode === 'small' ? 'primary' : 'outline'"
          size="md"
          :disabled="middleCategoryOptions.length === 0"
          @click="handleAddModeChange('small')"
        >
          소분류 추가
        </Button>
      </div>

      <div class="space-y-4">
        <div v-if="addMode !== 'main'" class="grid gap-3 sm:grid-cols-[120px_1fr] items-center">
          <label class="text-sm text-text-main">대분류</label>
          <Dropdown
            :model-value="selectedMainCategory"
            :options="mainCategoryOptions"
            menu-direction="down"
            @update:model-value="handleMainCategoryChange"
          />
        </div>

        <div v-if="addMode === 'small'" class="grid gap-3 sm:grid-cols-[120px_1fr] items-center">
          <label class="text-sm text-text-main">중분류</label>
          <Dropdown
            :model-value="selectedMiddleCategory"
            :options="middleCategoryDropdownOptions"
            menu-direction="down"
            @update:model-value="handleMiddleCategoryChange"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-[120px_1fr] items-center">
          <label class="text-sm text-text-main">{{ addInputLabel }}</label>
          <input
            v-model="newCategoryName"
            type="text"
            :placeholder="addInputPlaceholder"
            class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            @keyup.enter="addCategory"
          />
        </div>

        <Button
          variant="outline"
          size="md"
          class="w-full"
          :disabled="isSaving || !newCategoryName.trim()"
          :loading="isSaving"
          @click="addCategory"
        >
          추가하기
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button class="flex-1" :disabled="isSaving" @click="emit('close')">
          저장
        </Button>
      </div>
    </template>
  </BaseDrawer>

  <ConfirmationModal
    :is-open="Boolean(mainCategoryToDelete)"
    title="대분류 삭제"
    :message="`'${mainCategoryToDelete}' 대분류와 하위 중분류 목록을 함께 삭제하시겠습니까?`"
    confirm-text="삭제"
    :loading="isSaving"
    @cancel="mainCategoryToDelete = ''"
    @confirm="confirmDeleteMainCategory"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import Button from '@/components/common/Button.vue';
import ConfirmationModal from '@/components/common/ConfirmationModal.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import { Minus } from 'lucide-vue-next';
import { tangibleItemApi } from '@/api/asset.api'
import { useNotificationStore } from '@/stores'

interface CategoryGroup {
  categoryId?: string;
  mainCategory: string;
  subCategories: string[];
  childCategories?: Record<string, string[]>;
  subCategoryIds?: Record<string, string>;
  childCategoryIds?: Record<string, string>;
}

const props = defineProps<{
  isOpen: boolean;
  initialCategories: CategoryGroup[];
}>();

const emit = defineEmits(['close', 'changed']);
const notificationStore = useNotificationStore();

const localGroups = ref<CategoryGroup[]>([]);
const initialGroups = ref<CategoryGroup[]>([]);
const addMode = ref<'main' | 'sub' | 'small'>('main');
const selectedMainCategory = ref('');
const selectedMiddleCategory = ref('');
const newCategoryName = ref('');
const isSaving = ref(false);
const mainCategoryToDelete = ref('');

const cloneGroups = (groups: CategoryGroup[]) => (
  groups.map((group) => ({
    categoryId: group.categoryId,
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
    childCategories: Object.fromEntries(
      Object.entries(group.childCategories ?? {}).map(([key, values]) => [key, [...values]]),
    ),
    subCategoryIds: { ...(group.subCategoryIds ?? {}) },
    childCategoryIds: { ...(group.childCategoryIds ?? {}) },
  }))
);

const resetAddControls = () => {
  selectedMainCategory.value = localGroups.value[0]?.mainCategory ?? '';
  selectedMiddleCategory.value = middleCategoryOptions.value[0] ?? '';
  newCategoryName.value = '';
  addMode.value = 'main';
};

const selectedGroup = computed(() => (
  localGroups.value.find((group) => group.mainCategory === selectedMainCategory.value)
));

const middleCategoryOptions = computed(() => (
  selectedGroup.value ? getMiddleCategories(selectedGroup.value) : []
));

const mainCategoryOptions = computed(() => (
  localGroups.value.map((group) => ({
    label: group.mainCategory,
    value: group.mainCategory,
  }))
));

const middleCategoryDropdownOptions = computed(() => (
  middleCategoryOptions.value.map((category) => ({
    label: category,
    value: category,
  }))
));

const addInputLabel = computed(() => {
  if (addMode.value === 'main') return '대분류명';
  if (addMode.value === 'sub') return '중분류명';
  return '소분류명';
});

const addInputPlaceholder = computed(() => {
  if (addMode.value === 'main') return '새 대분류명 입력';
  if (addMode.value === 'sub') return '새 중분류명 입력';
  return '새 소분류명 입력';
});

const getSmallCategorySet = (group: CategoryGroup) => (
  new Set(Object.values(group.childCategories ?? {}).flat())
);

const getMiddleCategories = (group: CategoryGroup) => {
  const smallCategorySet = getSmallCategorySet(group);
  return group.subCategories.filter((sub) => !sub.endsWith(' - 전체') && !smallCategorySet.has(sub));
};

const getSmallCategories = (group: CategoryGroup, middleCategory: string) => (
  group.childCategories?.[middleCategory] ?? []
);

const categoryResponseId = (response: { categoryId?: string; tangibleAssetCategoryId?: string }) => (
  response.categoryId ?? response.tangibleAssetCategoryId ?? ''
);

const createCategory = async (name: string, parentId: string | null) => {
  const response = await tangibleItemApi.createCategory({
    name,
    parentId,
  });

  return categoryResponseId(response.data);
};

const handleAddModeChange = (mode: 'main' | 'sub' | 'small') => {
  addMode.value = mode;
  newCategoryName.value = '';
};

const handleMainCategoryChange = (value: string | number) => {
  selectedMainCategory.value = String(value);
};

const handleMiddleCategoryChange = (value: string | number) => {
  selectedMiddleCategory.value = String(value);
};

const deleteCategory = async (categoryId: string) => {
  if (!categoryId) {
    notificationStore.warning('카테고리를 삭제할 수 없습니다.', '카테고리 ID를 찾을 수 없습니다.');
    return false;
  }

  await tangibleItemApi.deleteCategory(categoryId);
  return true;
};

const addCategory = async () => {
  if (isSaving.value) return;

  const trimmedName = newCategoryName.value.trim();
  if (!trimmedName) return;

  isSaving.value = true;

  try {
    if (addMode.value === 'main') {
    if (localGroups.value.some((group) => group.mainCategory === trimmedName)) {
      notificationStore.warning('이미 존재하는 대분류명입니다.');
      return;
    }
    const categoryId = await createCategory(trimmedName, null);
    if (!categoryId) return;

    localGroups.value.push({
      categoryId,
      mainCategory: trimmedName,
      subCategories: [],
      childCategories: {},
      subCategoryIds: {},
      childCategoryIds: {},
    });
    selectedMainCategory.value = trimmedName;
  } else if (addMode.value === 'sub') {
    if (trimmedName.endsWith(' - 전체')) {
      notificationStore.warning('" - 전체"로 끝나는 이름은 중분류로 사용할 수 없습니다.');
      return;
    }

    const group = localGroups.value.find((item) => item.mainCategory === selectedMainCategory.value);
    if (!group) {
      notificationStore.warning('선택된 대분류를 찾을 수 없습니다.');
      return;
    }
    if (group.subCategories.includes(trimmedName)) {
      notificationStore.warning('해당 대분류 내에 이미 존재하는 중분류명입니다.');
      return;
    }
    const categoryId = await createCategory(trimmedName, group.categoryId ?? null);
    if (!categoryId) return;

    group.subCategories.push(trimmedName);
    group.childCategories = {
      ...(group.childCategories ?? {}),
      [trimmedName]: group.childCategories?.[trimmedName] ?? [],
    };
    group.subCategoryIds = {
      ...(group.subCategoryIds ?? {}),
      [trimmedName]: categoryId,
    };
    selectedMiddleCategory.value = trimmedName;
  } else {
    if (trimmedName.endsWith(' - 전체')) {
      notificationStore.warning('" - 전체"로 끝나는 이름은 소분류로 사용할 수 없습니다.');
      return;
    }

    const group = selectedGroup.value;
    if (!group) {
      notificationStore.warning('선택된 대분류를 찾을 수 없습니다.');
      return;
    }
    if (!selectedMiddleCategory.value) {
      notificationStore.warning('중분류를 선택해주세요.');
      return;
    }
    if (group.subCategories.includes(trimmedName)) {
      notificationStore.warning('해당 대분류 내에 이미 존재하는 카테고리명입니다.');
      return;
    }
    const parentId = group.subCategoryIds?.[selectedMiddleCategory.value] ?? '';
    const categoryId = await createCategory(trimmedName, parentId);
    if (!categoryId) return;

    group.childCategories = {
      ...(group.childCategories ?? {}),
      [selectedMiddleCategory.value]: [
        ...(group.childCategories?.[selectedMiddleCategory.value] ?? []),
        trimmedName,
      ],
    };
    group.childCategoryIds = {
      ...(group.childCategoryIds ?? {}),
      [trimmedName]: categoryId,
    };
    group.subCategories.push(trimmedName);
  }

  newCategoryName.value = '';
  initialGroups.value = cloneGroups(localGroups.value);
  emit('changed');
  notificationStore.success('카테고리가 등록되었습니다.');
  } catch (error) {
    console.error(error);
    notificationStore.error('카테고리 등록 실패', '다시 시도해주세요.');
  } finally {
    isSaving.value = false;
  }
};

const deleteMainCategory = (mainCategory: string) => {
  if (isSaving.value) return;
  mainCategoryToDelete.value = mainCategory;
};

const confirmDeleteMainCategory = async () => {
  const mainCategory = mainCategoryToDelete.value;
  if (!mainCategory || isSaving.value) return;

  const group = localGroups.value.find((item) => item.mainCategory === mainCategory);
  if (!group) return;

  isSaving.value = true;

  try {
    if (!(await deleteCategory(group.categoryId ?? ''))) return;

  localGroups.value = localGroups.value.filter((group) => group.mainCategory !== mainCategory);

  if (selectedMainCategory.value === mainCategory) {
    selectedMainCategory.value = localGroups.value[0]?.mainCategory ?? '';
  }

  if (localGroups.value.length === 0) {
    addMode.value = 'main';
  }
  selectedMiddleCategory.value = middleCategoryOptions.value[0] ?? '';
  initialGroups.value = cloneGroups(localGroups.value);
  emit('changed');
  notificationStore.success('카테고리가 삭제되었습니다.');
  } catch (error) {
    console.error(error);
    notificationStore.error('카테고리 삭제 실패', '다시 시도해주세요.');
  } finally {
    isSaving.value = false;
    mainCategoryToDelete.value = '';
  }
};

const deleteSubCategory = async (mainCategory: string, subCategory: string) => {
  if (isSaving.value) return;

  const group = localGroups.value.find((item) => item.mainCategory === mainCategory);
  if (!group) return;

  isSaving.value = true;

  try {
  if (!(await deleteCategory(group.subCategoryIds?.[subCategory] ?? ''))) return;

  const smallCategories = group.childCategories?.[subCategory] ?? [];
  group.subCategories = group.subCategories.filter((item) => item !== subCategory && !smallCategories.includes(item));
  if (group.childCategories) {
    delete group.childCategories[subCategory];
  }
  if (group.subCategoryIds) {
    delete group.subCategoryIds[subCategory];
  }
  for (const smallCategory of smallCategories) {
    if (group.childCategoryIds) delete group.childCategoryIds[smallCategory];
  }
  selectedMiddleCategory.value = middleCategoryOptions.value[0] ?? '';
  initialGroups.value = cloneGroups(localGroups.value);
  emit('changed');
  notificationStore.success('카테고리가 삭제되었습니다.');
  } catch (error) {
    console.error(error);
    notificationStore.error('카테고리 삭제 실패', '다시 시도해주세요.');
  } finally {
    isSaving.value = false;
  }
};

const deleteSmallCategory = async (mainCategory: string, middleCategory: string, smallCategory: string) => {
  if (isSaving.value) return;

  const group = localGroups.value.find((item) => item.mainCategory === mainCategory);
  if (!group) return;

  isSaving.value = true;

  try {
  if (!(await deleteCategory(group.childCategoryIds?.[smallCategory] ?? ''))) return;

  group.childCategories = {
    ...(group.childCategories ?? {}),
    [middleCategory]: (group.childCategories?.[middleCategory] ?? []).filter((item) => item !== smallCategory),
  };
  group.subCategories = group.subCategories.filter((item) => item !== smallCategory);
  if (group.childCategoryIds) {
    delete group.childCategoryIds[smallCategory];
  }
  initialGroups.value = cloneGroups(localGroups.value);
  emit('changed');
  notificationStore.success('카테고리가 삭제되었습니다.');
  } catch (error) {
    console.error(error);
    notificationStore.error('카테고리 삭제 실패', '다시 시도해주세요.');
  } finally {
    isSaving.value = false;
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      localGroups.value = cloneGroups(props.initialCategories);
      initialGroups.value = cloneGroups(props.initialCategories);
      resetAddControls();
      return;
    }

    localGroups.value = [];
    initialGroups.value = [];
    mainCategoryToDelete.value = '';
    resetAddControls();
  }
);

watch(selectedMainCategory, () => {
  selectedMiddleCategory.value = middleCategoryOptions.value[0] ?? '';
});
</script>
