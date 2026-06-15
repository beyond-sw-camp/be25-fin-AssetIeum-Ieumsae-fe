<template>
  <TicketDetailCard title="커뮤니케이션" class="h-full">
    <template #icon>
      <MessageSquareText :size="18" class="text-primary" />
    </template>

    <div class="flex min-h-80 flex-col">
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div v-if="loading" class="flex min-h-40 items-center justify-center text-sm text-text-sub">
          <LoaderCircle :size="18" class="mr-2 animate-spin" />
          댓글을 불러오는 중입니다.
        </div>

        <div v-else-if="errorMessage" class="flex min-h-40 flex-col items-center justify-center gap-3">
          <p class="text-center text-sm text-danger">{{ errorMessage }}</p>
          <Button variant="outline" size="sm" @click="emit('retry')">
            <RefreshCw :size="14" />
            다시 시도
          </Button>
        </div>

        <p
          v-else-if="comments.length === 0"
          class="flex min-h-40 items-center justify-center text-sm text-text-muted"
        >
          등록된 댓글이 없습니다.
        </p>

        <template v-else>
          <article
            v-for="comment in comments"
            :key="comment.commentId"
            :class="['flex', isMine(comment) ? 'justify-end' : 'justify-start']"
          >
            <div :class="['max-w-[82%]', isMine(comment) && 'text-right']">
              <p class="mb-1 text-xs font-semibold text-text-sub">
                {{ comment.writerName }}
                <span v-if="isMine(comment)" class="text-primary">(나)</span>
                <span class="ml-1 font-normal text-text-muted">
                  {{ formatDate(comment.createdAt, 'YYYY-MM-DD HH:mm') }}
                </span>
              </p>
              <p
                :class="[
                  'inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-sm',
                  isMine(comment)
                    ? 'rounded-br-md bg-primary/15 text-text-main'
                    : 'rounded-bl-md bg-surface-secondary text-text-main',
                ]"
              >
                {{ comment.content }}
              </p>
            </div>
          </article>
        </template>
      </div>

      <form class="mt-4 flex items-end gap-2 border-t border-border pt-4" @submit.prevent="handleSubmit">
        <label class="sr-only" for="ticket-comment">댓글</label>
        <textarea
          id="ticket-comment"
          v-model="content"
          rows="2"
          maxlength="1000"
          class="min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="댓글을 입력해주세요."
          :disabled="submitting"
          @keydown.ctrl.enter.prevent="handleSubmit"
        />
        <Button
          type="submit"
          class="shrink-0"
          :loading="submitting"
          :disabled="!content.trim()"
          aria-label="댓글 등록"
        >
          <Send :size="16" />
        </Button>
      </form>
      <p v-if="submitErrorMessage" class="mt-2 text-xs text-danger">
        {{ submitErrorMessage }}
      </p>
    </div>
  </TicketDetailCard>
</template>

<script setup lang="ts">
import { LoaderCircle, MessageSquareText, RefreshCw, Send } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import Button from '@/components/common/Button.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import type { TicketComment } from '@/types'
import { formatDate } from '@/utils/labels'

const props = withDefaults(defineProps<{
  comments: TicketComment[]
  loading?: boolean
  submitting?: boolean
  errorMessage?: string
  submitErrorMessage?: string
  currentMemberId?: string
  submitVersion?: number
}>(), {
  loading: false,
  submitting: false,
  errorMessage: '',
  submitErrorMessage: '',
  currentMemberId: '',
  submitVersion: 0,
})

const emit = defineEmits<{
  retry: []
  submit: [content: string]
}>()

const content = ref('')

function isMine(comment: TicketComment) {
  return comment.writerId === props.currentMemberId
}

function handleSubmit() {
  const normalizedContent = content.value.trim()
  if (!normalizedContent || props.submitting) return
  emit('submit', normalizedContent)
}

watch(() => props.submitVersion, () => {
  content.value = ''
})
</script>
