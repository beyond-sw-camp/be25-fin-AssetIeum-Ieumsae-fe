<template>
  <div class="relative">
    <aside 
      :class="[
        'flex min-h-[calc(100vh-64px)] flex-col border-r border-border bg-surface transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- 메뉴 목록 -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <template v-for="item in navItems" :key="item.name">
          <!-- 서브 메뉴가 있는 메뉴 그룹 -->
          <div v-if="item.children && item.children.length > 0" class="space-y-1">
            <button
              :class="[   
                'w-full flex items-center justify-between rounded-xl px-3 py-3 transition-colors text-text-main hover:bg-primary/5',
                collapsed ? 'justify-center' : '',
                isParentActive(item.children) && !collapsed ? 'bg-primary/10 text-primary! font-semibold' : ''
              ]"
              @click="toggleMenu(item.name)"
            >
              <div class="flex items-center" :class="collapsed ? '' : 'gap-3'">
                <component :is="item.icon" :size="18" />
                <span v-if="!collapsed">{{ item.label }}</span>
              </div>
              <ChevronDown 
                v-if="!collapsed" 
                :size="16" 
                :class="['transition-transform duration-200', { 'rotate-180': isMenuOpen(item.name) }]" 
              />
            </button>

            <!-- 서브 메뉴 목록 -->
            <div 
              v-if="isMenuOpen(item.name) && !collapsed" 
              class="pl-4 space-y-1 overflow-hidden transition-all"
            >
              <RouterLink
                v-for="child in item.children"
                :key="child.name"
                :to="child.to"
                class="flex items-center rounded-xl px-4 py-2.5 text-sm text-text-sub transition-all hover:bg-primary/5 hover:text-primary"
                exact-active-class="bg-primary/15! text-primary! font-semibold"
              >
                {{ child.label }}
              </RouterLink>
            </div>
          </div>

          <!-- 단일 메뉴 (이미지의 서비스 데스크 등) -->
          <RouterLink 
            v-else
            :to="item.to!" 
            :class="[
              'flex items-center rounded-xl px-3 py-3 transition-colors text-text-main hover:bg-primary/5',
              collapsed ? 'justify-center' : 'gap-3'
            ]" 
            exact-active-class="bg-primary/15! text-primary! font-semibold" 
          >
            <component :is="item.icon" :size="18" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <!-- 사이드바 하단 - 설정 -->
      <div class="border-t border-border p-4">
        <RouterLink
          to="/settings"
          class="flex items-center rounded-xl px-3 py-3 transition-colors text-text-main hover:bg-primary/5"
          exact-active-class="bg-primary/15! text-primary! font-semibold"
        >
          <Settings :size="18" />
          <span v-if="!collapsed" class="ml-3">설정</span>
        </RouterLink>
      </div>
    </aside>
    
    <!-- 사이드바 접기/열기 버튼 -->
    <button 
      class="
        absolute top-10 -right-4 z-50
        flex h-8 w-8 items-center justify-center
        rounded-xl border border-border bg-surface
        shadow-md transition-colors text-text-main
        hover:bg-primary/10
      " 
      @click="collapsed = !collapsed"
    >
      <ChevronLeft v-if="!collapsed" :size="16" />
      <ChevronRight v-else :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Settings, ChevronDown } from 'lucide-vue-next'

const collapsed = defineModel<boolean>('collapsed', { required: true })
const route = useRoute()

defineProps<{
  navItems: Array<{
    name: string
    to?: string
    label: string
    icon: Component
    children?: Array<{ name: string; to: string; label: string }>
  }>
}>()

const openMenus = ref<Record<string, boolean>>({
  tangible: true,   
  intangible: false
})

const toggleMenu = (menuName: string) => {
  openMenus.value[menuName] = !openMenus.value[menuName]
}

const isMenuOpen = (menuName: string) => {
  return !!openMenus.value[menuName]
}

const isParentActive = (children: Array<{ to: string }>) => {
  return children.some(child => route.path === child.to)
}
</script>