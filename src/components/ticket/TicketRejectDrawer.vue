<template>
  <BaseDrawer
    :is-open="isOpen"
    :title="title"
    panel-class="w-full max-w-lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="mb-2 block text-sm font-semibold text-text-main">반려 사유</span>
        <textarea
          v-model="reason"
          class="min-h-36 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="반려 사유를 입력해 주세요."
          :disabled="submitting"
        />
      </label>
      <div class="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-text-sub">
        반려 사유는 요청자에게 노출됩니다. 업무 판단 근거를 확인할 수 있게 구체적으로 입력해 주세요.
      </div>

      <p v-if="validationMessage" class="text-sm text-danger">{{ validationMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="submitting"
          @click="handleClose"
        >
          취소
        </Button>
        <Button
          variant="danger"
          class="flex-1"
          :loading="submitting"
          @click="handleSubmit"
        >
          반려
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  isOpen: boolean
  title: string
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [reason: string]
}>()

const reason = ref('')
const validationMessage = ref('')

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    reason.value = ''
    validationMessage.value = ''
  }
})

function handleClose() {
  if (props.submitting) return
  emit('close')
}

function handleSubmit() {
  const trimmedReason = reason.value.trim()

  if (!trimmedReason) {
    validationMessage.value = '반려 사유를 입력해 주세요.'
    return
  }

  validationMessage.value = ''
  emit('submit', trimmedReason)
}
</script>
