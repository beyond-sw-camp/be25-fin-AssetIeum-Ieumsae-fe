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
        <button 
          class="
          flex h-9 w-9 items-center justify-center 
          rounded-lg border border-border hover:bg-surface-secondary text-text-sub
          transition-colors duration-300"
          @click="toggleDarkMode"
        >
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>
        
        <button class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface-secondary text-text-sub transition-colors duration-300">
          <Bell :size="18" />
          <span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">5</span>
        </button>
      </div> 
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Moon, Bell, Sun } from 'lucide-vue-next'

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