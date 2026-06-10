<template>
  <BaseDrawer
    :is-open="isOpen"
    title="무형자산 카테고리"
    submit-text="저장"
    @close="emit('close')"
    @submit="handleSave"
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
            @click="deleteMainCategory(group.mainCategory)"
          >
            <Minus :size="16" />
          </button>
        </div>

        <ul class="space-y-2 pl-3">
          <li
            v-for="subCategory in group.subCategories.filter(sub => !sub.endsWith(' - 전체'))"
            :key="group.mainCategory + '-' + subCategory"
            class="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5"
          >
            <button
              type="button"
              class="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-surface transition-colors"
              @click="deleteSubCategory(group.mainCategory, subCategory)"
            >
              <Minus :size="16" />
            </button>
            <span class="text-sm text-text-main font-medium">{{ subCategory }}</span>
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
          @click="addMode = 'main'"
        >
          대분류 추가
        </Button>
        <Button
          :variant="addMode === 'sub' ? 'primary' : 'outline'"
          size="md"
          :disabled="localGroups.length === 0"
          @click="addMode = 'sub'"
        >
          중분류 추가
        </Button>
      </div>

      <div class="space-y-4">
        <div v-if="addMode === 'sub'" class="grid gap-3 sm:grid-cols-[120px_1fr] items-center">
          <label class="text-sm text-text-main">대분류</label>
          <select
            v-model="selectedMainCategory"
            class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option v-for="group in localGroups" :key="group.mainCategory" :value="group.mainCategory">
              {{ group.mainCategory }}
            </option>
          </select>
        </div>

        <div class="grid gap-3 sm:grid-cols-[120px_1fr] items-center">
          <label class="text-sm text-text-main">{{ addMode === 'main' ? '대분류명' : '중분류명' }}</label>
          <input
            v-model="newCategoryName"
            type="text"
            :placeholder="addMode === 'main' ? '새 대분류명 입력' : '새 중분류명 입력'"
            class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            @keyup.enter="addCategory"
          />
        </div>

        <Button
          variant="outline"
          size="md"
          class="w-full"
          @click="addCategory"
        >
          추가하기
        </Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import Button from '@/components/common/Button.vue';
import { Minus } from 'lucide-vue-next';

interface CategoryGroup {
  mainCategory: string;
  subCategories: string[];
}

const props = defineProps<{
  isOpen: boolean;
  initialCategories: CategoryGroup[];
}>();

const emit = defineEmits(['close', 'update-categories']);

const localGroups = ref<CategoryGroup[]>([]);
const addMode = ref<'main' | 'sub'>('sub');
const selectedMainCategory = ref('');
const newCategoryName = ref('');

const addCategory = () => {
  const trimmedName = newCategoryName.value.trim();
  if (!trimmedName) {
    alert('카테고리 이름을 입력해주세요.');
    return;
  }

  if (addMode.value === 'main') {
    if (localGroups.value.some((group) => group.mainCategory === trimmedName)) {
      alert('이미 존재하는 대분류명입니다.');
      return;
    }
    localGroups.value.push({
      mainCategory: trimmedName,
      subCategories: [`${trimmedName} - 전체`],
    });
    selectedMainCategory.value = trimmedName;
  } else {
    if (trimmedName.endsWith(' - 전체')) {
      alert('" - 전체"로 끝나는 이름은 중분류로 사용할 수 없습니다.');
      return;
    }

    const group = localGroups.value.find((item) => item.mainCategory === selectedMainCategory.value);
    if (!group) {
      alert('선택된 대분류를 찾을 수 없습니다.');
      return;
    }
    if (group.subCategories.includes(trimmedName)) {
      alert('해당 대분류 내에 이미 존재하는 중분류명입니다.');
      return;
    }
    group.subCategories.push(trimmedName);
  }

  newCategoryName.value = '';
};

const deleteMainCategory = (mainCategory: string) => {
  if (!confirm(`"${mainCategory}" 대분류를 삭제하시겠습니까?\n하위 중분류 목록도 함께 삭제됩니다.`)) {
    return;
  }

  localGroups.value = localGroups.value.filter((group) => group.mainCategory !== mainCategory);

  if (selectedMainCategory.value === mainCategory) {
    selectedMainCategory.value = localGroups.value[0]?.mainCategory ?? '';
  }

  if (localGroups.value.length === 0) {
    addMode.value = 'main';
  }
};

const deleteSubCategory = (mainCategory: string, subCategory: string) => {
  const group = localGroups.value.find((item) => item.mainCategory === mainCategory);
  if (!group) return;
  group.subCategories = group.subCategories.filter((item) => item !== subCategory);
};

const handleSave = () => {
  emit('update-categories', localGroups.value.map((group) => ({
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
  })));
  emit('close');
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      localGroups.value = props.initialCategories.map((group) => ({
        mainCategory: group.mainCategory,
        subCategories: [...group.subCategories],
      }));
      selectedMainCategory.value = localGroups.value[0]?.mainCategory ?? '';
      newCategoryName.value = '';
      addMode.value = localGroups.value.length > 0 ? 'sub' : 'main';
    }
  }
);
</script>
