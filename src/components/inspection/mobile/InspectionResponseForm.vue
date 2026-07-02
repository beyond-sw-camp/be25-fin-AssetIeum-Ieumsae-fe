<template>
  <form class="min-w-0 space-y-3" @submit.prevent="emit('submit')">
    <div v-if="target" class="min-w-0 rounded-lg bg-surface-secondary px-3 py-3">
      <p class="truncate text-sm font-bold text-text-main">
        {{ target.productName }}
      </p>
      <p class="mt-1 truncate text-xs text-text-sub">
        {{ target.assetCode }} · {{ target.category }}
      </p>
    </div>

    <div v-else class="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
      QR을 스캔하거나 목록에서 자산을 선택해주세요.
    </div>

    <p v-if="target?.isResponded" class="text-sm font-bold text-text-main">
      등록한 응답
    </p>

    <div
      v-if="loadingResponse"
      class="h-24 animate-pulse rounded-lg bg-surface-secondary"
    />

    <label v-else class="flex min-w-0 items-start gap-3 text-sm font-semibold text-text-main">
      <input
        :checked="followUpRequests"
        type="checkbox"
        class="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        :disabled="disabled"
        @change="emit('update:followUpRequests', ($event.target as HTMLInputElement).checked)"
      >
      <span class="min-w-0">
        {{ target?.isResponded ? '후속 처리 요청' : '후속 처리 요청' }}
        <span class="block text-xs font-normal text-text-sub">
          {{ target?.isResponded
            ? '응답 등록 시 요청한 후속 처리 여부입니다.'
            : '정보가 다르거나 실제 상태가 맞지 않으면 선택해주세요.' }}
        </span>
      </span>
    </label>

    <textarea
      v-if="!loadingResponse"
      :value="responseContent"
      class="min-h-24 w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-secondary disabled:text-text-muted"
      :placeholder="target?.isResponded ? '등록된 응답 내용이 없습니다.' : '예: 현재 사용 중이며 이상 없습니다.'"
      :disabled="disabled"
      @input="emit('update:responseContent', ($event.target as HTMLTextAreaElement).value)"
    />

    <Button
      v-if="!target?.isResponded"
      class="w-full"
      type="submit"
      :disabled="disabled || !responseContent.trim() || submitting"
      :loading="submitting"
    >
      응답 등록하기
    </Button>
  </form>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import type { MobileInspectionTarget } from './InspectionTargetCard.vue'

defineProps<{
  target: MobileInspectionTarget | null
  responseContent: string
  followUpRequests: boolean
  submitting?: boolean
  disabled?: boolean
  loadingResponse?: boolean
}>()

const emit = defineEmits<{
  'update:responseContent': [value: string]
  'update:followUpRequests': [value: boolean]
  submit: []
}>()
</script>
