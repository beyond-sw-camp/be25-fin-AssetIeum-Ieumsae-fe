<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'

import Button from './Button.vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '확인',
  cancelText: '취소',
  loading: false,
})

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <div
    v-if="props.isOpen"
    class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirmation-modal-title"
  >
    <div class="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <span class="rounded-xl bg-danger/10 p-2 text-danger">
            <AlertTriangle :size="22" />
          </span>
          <div>
            <h2 id="confirmation-modal-title" class="text-lg font-bold text-text-main">
              {{ props.title }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-text-sub">{{ props.message }}</p>
          </div>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-text-sub hover:bg-surface-secondary"
          aria-label="닫기"
          :disabled="props.loading"
          @click="emit('cancel')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button variant="outline" :disabled="props.loading" @click="emit('cancel')">
          {{ props.cancelText }}
        </Button>
        <Button variant="danger" :loading="props.loading" @click="emit('confirm')">
          {{ props.confirmText }}
        </Button>
      </div>
    </div>
  </div>
</template>
