<template>
  <nav
    v-if="props.totalPages > 0"
    class="flex items-center justify-center gap-1"
    aria-label="페이지 이동"
  >
    <Button
      unstyled
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      :disabled="props.disabled || props.currentPage <= 0"
      aria-label="이전 페이지"
      @click="changePage(props.currentPage - 1)"
    >
      <ChevronLeft :size="16" />
    </Button>

    <Button
      v-for="pageIndex in visiblePageIndexes"
      :key="pageIndex"
      unstyled
      :class="[
        'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
        props.currentPage === pageIndex
          ? 'bg-primary text-white shadow-sm shadow-primary/20'
          : 'text-text-sub hover:bg-surface-secondary',
      ]"
      :disabled="props.disabled"
      :aria-current="props.currentPage === pageIndex ? 'page' : undefined"
      :aria-label="`${pageIndex + 1}페이지`"
      @click="changePage(pageIndex)"
    >
      {{ pageIndex + 1 }}
    </Button>

    <Button
      unstyled
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      :disabled="props.disabled || props.currentPage >= props.totalPages - 1"
      aria-label="다음 페이지"
      @click="changePage(props.currentPage + 1)"
    >
      <ChevronRight :size="16" />
    </Button>
  </nav>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

import Button from '@/components/common/Button.vue'

const props = withDefaults(defineProps<{
  currentPage: number
  totalPages: number
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  change: [page: number]
}>()

const visiblePageIndexes = computed(() => {
  const visibleCount = Math.min(props.totalPages, 5)
  const maxStart = Math.max(props.totalPages - visibleCount, 0)
  const start = Math.min(Math.max(props.currentPage - 2, 0), maxStart)

  return Array.from({ length: visibleCount }, (_, index) => start + index)
})

function changePage(page: number) {
  if (
    props.disabled
    || page < 0
    || page >= props.totalPages
    || page === props.currentPage
  ) return

  emit('change', page)
}
</script>
