<template>
  <BaseDrawer 
    :is-open="isOpen" 
    title="유형자산 카테고리" 
    submit-text="저장"
    @close="emit('close')"
    @submit="handleSave"
  >
    <p class="text-sm font-semibold text-text-sub mb-4">카테고리 목록</p>
    
    <ul class="space-y-3">
      <li 
        v-for="cat in localList" 
        :key="cat.id" 
        class="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-surface-secondary/50 dark:bg-surface-secondary/20 transition-colors"
      >
        <button 
          type="button" 
          class="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-surface transition-colors"
          @click="deleteCategory(cat.id)"
        >
          <Minus :size="16" />
        </button>
        <span class="text-sm text-text-main font-medium">{{ cat.name }}</span>
      </li>
    </ul>

    <div v-if="isAdding" class="mt-4 flex items-center gap-2 p-1">
      <input 
        v-model="newCategoryName" 
        type="text" 
        placeholder="새 카테고리명 입력"
        class="border border-border rounded-xl px-3 py-2 text-sm bg-surface text-text-main flex-1 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        @keyup.enter="addCategory" 
      />
      <button 
        type="button"
        class="px-3 py-2 text-sm border border-border rounded-xl text-text-sub bg-surface hover:bg-surface-secondary transition-colors"
        @click="isAdding = false"
      >
        취소
      </button>
    </div>

    <button 
      v-if="!isAdding" 
      type="button" 
      class="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-sm text-text-sub hover:text-primary hover:border-primary font-medium transition-all duration-200" 
      @click="isAdding = true"
    >
      <Plus :size="16" /> 카테고리 추가하기
    </button>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import { Minus, Plus } from 'lucide-vue-next';

interface CategoryItem {
  id: string;
  name: string;
}

const props = defineProps<{ 
  isOpen: boolean;
  initialCategories: CategoryItem[];
}>();

const emit = defineEmits(['close', 'update-categories']);

const localList = ref<CategoryItem[]>([]);
const isAdding = ref(false);
const newCategoryName = ref('');

const addCategory = () => {
  if (!newCategoryName.value.trim()) return;
  localList.value.push({
    id: String(Date.now()), 
    name: newCategoryName.value.trim()
  });
  newCategoryName.value = '';
  isAdding.value = false;
};

const deleteCategory = (id: string) => {
  localList.value = localList.value.filter(item => item.id !== id);
};

const handleSave = () => {
  emit('update-categories', [...localList.value]);
  emit('close');
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    localList.value = [...props.initialCategories];
    isAdding.value = false;
    newCategoryName.value = '';
  }
});
</script>