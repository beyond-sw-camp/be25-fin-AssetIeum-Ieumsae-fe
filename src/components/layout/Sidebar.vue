<template>
  <div class="relative">
    <aside 
      :class="[
        'flex min-h-[calc(100vh-64px)] flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- 메뉴 목록 -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <template v-for="item in navItems" :key="item.name">
          <div v-if="item.children && item.children.length > 0" class="space-y-1">
            <button
              :class="[   
                'w-full flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-orange-50/50 text-gray-700',
                collapsed ? 'justify-center' : '',
                isParentActive(item.children) && !collapsed ? 'bg-orange-50 text-primary font-semibold' : ''
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

            <div 
              v-if="isMenuOpen(item.name) && !collapsed" 
              class="pl-4 space-y-1 overflow-hidden transition-all"
            >
              <RouterLink
                v-for="child in item.children"
                :key="child.name"
                :to="child.to"
                class="flex items-center rounded-xl px-4 py-2.5 text-sm text-gray-600 transition hover:bg-orange-50 hover:text-primary"
                exact-active-class="bg-orange-50 text-primary font-semibold"
              >
                {{ child.label }}
              </RouterLink>
            </div>
          </div>

          <RouterLink 
            v-else
            :to="item.to!" 
            :class="[
              'flex items-center rounded-xl px-3 py-3 transition hover:bg-orange-50 hover:text-primary text-gray-700',
              collapsed ? 'justify-center' : 'gap-3'
            ]" 
            exact-active-class="bg-orange-50 text-primary font-semibold" 
          >
            <component :is="item.icon" :size="18" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="border-t border-gray-100 p-4">
        <RouterLink
          to="/settings"
          class="flex items-center rounded-xl px-3 py-3 transition hover:bg-orange-50 hover:text-primary text-gray-700"
          exact-active-class="bg-orange-50 text-primary font-semibold"
        >
          <Settings :size="18" />
          <span v-if="!collapsed" class="ml-3">설정</span>
        </RouterLink>
      </div>
    </aside>
    
    <!-- 사이드바 열고 닫는 버튼 -->
    <button 
      class="
        absolute top-10 -right-4 z-50
        flex h-8 w-8 items-center justify-center
        rounded-xl border border-gray-200 bg-white
        shadow-md transition
        hover:bg-orange-50 hover:text-primary
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

// 🌟 현재 주소가 서브 메뉴 중 하나와 일치하는지 확인하여 부모 대메뉴 하이라이트 여부 결정
const isParentActive = (children: Array<{ to: string }>) => {
  return children.some(child => route.path === child.to)
}
</script>