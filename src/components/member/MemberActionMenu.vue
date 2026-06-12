<template>
  <div ref="triggerRef" class="relative inline-flex" @click.stop>
    <button
      type="button"
      class="rounded-lg p-1.5 text-text-sub transition-colors hover:bg-surface-secondary hover:text-text-main"
      :aria-label="`${props.memberName} 관리 메뉴`"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <MoreVertical :size="18" />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        :style="menuStyle"
        class="fixed z-50 w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import type { CSSProperties } from 'vue'
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
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuTop = ref(0)
const menuLeft = ref(0)

const menuStyle = computed<CSSProperties>(() => ({
  top: `${menuTop.value}px`,
  left: `${menuLeft.value}px`,
}))

async function openMenu() {
  const trigger = triggerRef.value
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  isOpen.value = true
  await nextTick()

  const menuRect = menuRef.value?.getBoundingClientRect()
  const menuWidth = menuRect?.width ?? 144
  const menuHeight = menuRect?.height ?? 80
  const gap = 4
  const viewportPadding = 8

  menuLeft.value = Math.min(
    Math.max(triggerRect.right - menuWidth, viewportPadding),
    window.innerWidth - menuWidth - viewportPadding,
  )
  menuTop.value = triggerRect.bottom + gap + menuHeight <= window.innerHeight
    ? triggerRect.bottom + gap
    : Math.max(triggerRect.top - menuHeight - gap, viewportPadding)
}

function closeMenu() {
  isOpen.value = false
}

function toggleMenu() {
  if (isOpen.value) {
    closeMenu()
    return
  }

  void openMenu()
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) return

  closeMenu()
}

function handleDepartmentChange() {
  closeMenu()
  emit('change-department')
}

function handleResign() {
  closeMenu()
  emit('resign')
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  window.addEventListener('resize', closeMenu)
  window.addEventListener('scroll', closeMenu, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  window.removeEventListener('resize', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>
