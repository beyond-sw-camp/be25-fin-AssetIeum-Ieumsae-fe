<template>
  <TicketDetailCard title="커뮤니케이션" class="h-full">
    <template #icon>
      <MessageSquareText :size="18" class="text-primary" />
    </template>

    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="commentListRef" class="min-h-40 flex-1 space-y-4 overflow-y-auto pr-1">
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
              <div
                :class="[
                  'mb-1 flex items-center gap-2',
                  isMine(comment) ? 'justify-end' : 'justify-start',
                ]"
              >
                <p class="text-xs font-semibold text-text-sub">
                  {{ comment.writerName }}
                  <span v-if="isMine(comment)" class="text-primary">(나)</span>
                  <span class="ml-1 font-normal text-text-muted">
                    {{ formatDate(comment.createdAt, 'YYYY-MM-DD HH:mm') }}
                  </span>
                  <span
                    v-if="comment.updatedAt !== comment.createdAt"
                    class="ml-1 font-normal text-text-muted"
                  >
                    (수정됨)
                  </span>
                </p>
                <div
                  v-if="isMine(comment) && editingCommentId !== comment.commentId"
                  class="flex items-center gap-0.5"
                >
                  <button
                    type="button"
                    class="rounded-md p-1 text-text-muted transition hover:bg-surface-secondary hover:text-primary disabled:opacity-40"
                    aria-label="댓글 수정"
                    :disabled="isCommentActionLocked"
                    @click="startEditing(comment)"
                  >
                    <Pencil :size="13" />
                  </button>
                  <button
                    type="button"
                    class="rounded-md p-1 text-text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    aria-label="댓글 삭제"
                    :disabled="isCommentActionLocked"
                    @click="emit('delete', comment)"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </div>

              <form
                v-if="editingCommentId === comment.commentId"
                class="w-80 max-w-full rounded-2xl rounded-br-md border border-primary/30 bg-primary/5 p-3 text-left"
                @submit.prevent="handleUpdate(comment)"
              >
                <label class="sr-only" :for="`ticket-comment-edit-${comment.commentId}`">
                  댓글 수정
                </label>
                <textarea
                  :id="`ticket-comment-edit-${comment.commentId}`"
                  v-model="editContent"
                  rows="3"
                  maxlength="1000"
                  class="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20"
                  :disabled="updatingCommentId === comment.commentId"
                  @keydown.esc.prevent="cancelEditing"
                  @keydown.ctrl.enter.prevent="handleUpdate(comment)"
                />
                <div class="mt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="updatingCommentId === comment.commentId"
                    @click="cancelEditing"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    :loading="updatingCommentId === comment.commentId"
                    :disabled="!editContent.trim() || editContent.trim() === comment.content"
                  >
                    저장
                  </Button>
                </div>
              </form>
              <p
                v-else
                :class="[
                  'inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-left text-sm',
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

      <form class="mt-4 flex items-stretch gap-2 border-t border-border pt-4" @submit.prevent="handleSubmit">
        <label class="sr-only" for="ticket-comment">댓글</label>
        <textarea
          id="ticket-comment"
          v-model="content"
          rows="1"
          maxlength="1000"
          class="h-11 flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="댓글을 입력해주세요."
          :disabled="submitting"
          @keydown="handleCommentKeydown"
        />
        <Button
          type="submit"
          size="m"
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
      <p v-if="actionErrorMessage" class="mt-2 text-xs text-danger">
        {{ actionErrorMessage }}
      </p>
    </div>
  </TicketDetailCard>
</template>

<script setup lang="ts">
import {
  LoaderCircle,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'

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
  actionErrorMessage?: string
  currentMemberId?: string
  submitVersion?: number
  actionVersion?: number
  updatingCommentId?: number | null
  deletingCommentId?: number | null
}>(), {
  loading: false,
  submitting: false,
  errorMessage: '',
  submitErrorMessage: '',
  actionErrorMessage: '',
  currentMemberId: '',
  submitVersion: 0,
  actionVersion: 0,
  updatingCommentId: null,
  deletingCommentId: null,
})

const emit = defineEmits<{
  retry: []
  submit: [content: string]
  update: [commentId: number, content: string]
  delete: [comment: TicketComment]
}>()

const content = ref('')
const editingCommentId = ref<number | null>(null)
const editContent = ref('')
const commentListRef = ref<HTMLElement | null>(null)

const isCommentActionLocked = computed(() => (
  editingCommentId.value !== null
  || props.updatingCommentId !== null
  || props.deletingCommentId !== null
))

function isMine(comment: TicketComment) {
  return comment.writerId === props.currentMemberId
}

function handleSubmit() {
  const normalizedContent = content.value.trim()
  if (!normalizedContent || props.submitting) return
  emit('submit', normalizedContent)
}

function handleCommentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return

  event.preventDefault()
  handleSubmit()
}

function startEditing(comment: TicketComment) {
  if (isCommentActionLocked.value) return
  editingCommentId.value = comment.commentId
  editContent.value = comment.content
}

function cancelEditing() {
  if (props.updatingCommentId !== null) return
  editingCommentId.value = null
  editContent.value = ''
}

function handleUpdate(comment: TicketComment) {
  const normalizedContent = editContent.value.trim()
  if (
    !normalizedContent
    || normalizedContent === comment.content
    || props.updatingCommentId !== null
  ) return

  emit('update', comment.commentId, normalizedContent)
}

async function scrollCommentsToBottom() {
  await nextTick()
  const commentList = commentListRef.value
  if (!commentList) return

  commentList.scrollTop = commentList.scrollHeight
}

watch(() => props.submitVersion, () => {
  content.value = ''
})

watch(() => props.actionVersion, () => {
  editingCommentId.value = null
  editContent.value = ''
})

watch(
  [() => props.comments.length, () => props.loading],
  () => {
    if (props.loading || props.comments.length === 0) return
    void scrollCommentsToBottom()
  },
  { immediate: true, flush: 'post' },
)
</script>
