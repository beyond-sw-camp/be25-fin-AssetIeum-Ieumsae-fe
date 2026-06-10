<template>
  <div v-if="isOpen" class="fixed inset-0 z-[10000] flex justify-end">
    <div
      class="fixed inset-0 bg-black/40 transition-opacity"
      @click="emit('close')"
    >
    </div>

    <div class="relative w-[50%] h-full bg-surface shadow-2xl flex flex-col z-10">
      <div class="p-6 border-b border-border flex items-center justify-between shrink-0">
        <slot name="header">
          <h2 class="text-xl font-bold text-text-main">{{ title }}</h2>
        </slot>
        <button
          type="button"
          class="p-1 hover:bg-surface-secondary rounded-lg text-text-sub transition-colors"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto">
        <slot></slot>
      </div>

      <div class="p-4 mb-3 shrink-0">
        <slot name="footer">
          <Button
            class="w-full"
            @click="emit('submit')"
          >
            {{ submitText }}
          </Button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import Button from './Button.vue';

// 공통으로 제어할 Props 정의
defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, default: '타이틀' },
  submitText: { type: String, default: '저장하기' }
});

const emit = defineEmits(['close', 'submit']);
</script>
