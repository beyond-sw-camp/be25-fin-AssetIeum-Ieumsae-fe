<template>
  <div class="relative inline-flex" @click.stop>
    <button
      type="button"
      class="rounded-lg p-1.5 text-text-sub transition-colors hover:bg-surface-secondary hover:text-text-main"
      :aria-label="`${props.memberName} 관리 메뉴`"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <MoreVertical :size="18" />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-main transition-colors hover:bg-surface-secondary"
        @click="handleDepartmentChange"
      >
        <Building2 :size="15" />
        부서 변경
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
        @click="handleResign"
      >
        <UserMinus :size="15" />
        퇴사 처리
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Building2, MoreVertical, UserMinus } from 'lucide-vue-next'

interface Props {
  memberName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'change-department': []
  resign: []
}>()

const isOpen = ref(false)

function handleDepartmentChange() {
  isOpen.value = false
  emit('change-department')
}

function handleResign() {
  isOpen.value = false
  emit('resign')
}
</script>
