<template>
  <header
    class="
    fixed top-0 left-0 right-0 z-50 h-16
    border-b border-border bg-surface shadow-sm
    transition-colors duration-300"
  >
    <div class="flex h-full items-center justify-between px-6">
      <RouterLink to="/" class="cursor-pointer">
        <h1 class="text-xl font-bold text-primary dark:text-orange-400">자산이음</h1>
      </RouterLink>

      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-md"
          :aria-label="isDark ? '라이트 모드로 변경' : '다크 모드로 변경'"
          @click="toggleDarkMode"
        >
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </Button>

        <NotificationPopover />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import NotificationPopover from '@/components/notification/NotificationPopover.vue'

const isDark = ref(false)

// 다크 모드 토글 함수
const toggleDarkMode = () => {
  isDark.value = !isDark.value

  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})
</script>
