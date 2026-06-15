<template>
  <form
    class="flex min-w-[15rem] max-w-[22rem] flex-1 items-center gap-2"
    @submit.prevent="emit('search')"
  >
    <input
      :value="modelValue"
      type="search"
      class="h-9 min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      placeholder="티켓 번호 또는 품목명 검색"
      aria-label="나의 요청 검색"
      @input="handleInput"
    />
    <Button type="submit" class="shrink-0">
      <Search :size="16" />
      조회하기
    </Button>
  </form>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
