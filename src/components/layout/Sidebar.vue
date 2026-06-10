<template>
  <div class="relative h-[calc(100vh-64px)] min-h-0">
    <aside 
      :class="[
        'flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-surface transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- 메뉴 목록 -->
      <nav class="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <template v-for="item in navItems" :key="item.name">
          <!-- 서브 메뉴가 있는 메뉴 목록 -->
          <div v-if="item.children && item.children.length > 0" class="space-y-1">
            <button
              :class="[
                'w-full flex items-center rounded-xl px-3 py-2 transition-colors hover:bg-primary/5',
                collapsed ? 'justify-center' : 'justify-between',
                isParentActive(item.children) 
                  ? 'bg-primary/10 text-primary! font-semibold' 
                  : 'text-text-main'
              ]"
              @click="handleParentClick(item)"
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
                class="flex items-center rounded-xl px-4 py-2 text-sm text-text-sub transition-all hover:bg-primary/5 hover:text-primary"
                exact-active-class="bg-primary/10! text-primary! font-semibold"
              >
                {{ child.label }}
              </RouterLink>
            </div>
          </div>

          <!-- 단일 메뉴 목록 -->
          <RouterLink 
            v-else
            :to="item.to!" 
            :class="[
              'flex items-center rounded-xl px-3 py-2 transition-colors text-text-main hover:bg-primary/5',
              collapsed ? 'justify-center' : 'gap-3'
            ]" 
            exact-active-class="bg-primary/10! text-primary! font-semibold" 
          >
            <component :is="item.icon" :size="18" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <!-- 사이드바 하단 - 사용자 + 로그아웃 -->
      <div class="shrink-0 border-t border-border bg-surface p-2 space-y-3 shadow-0">
        <div class="flex justify-between">
          <!-- 사용자 버튼 (프로필) -->
          <div>
            <RouterLink 
              v-if="user"
              to="/profile" 
              :class="[
                'flex items-center rounded-xl px-3 py-2 bg-surface-secondary/50 hover:bg-primary/5 transition-colors group',
                collapsed ? 'justify-center' : 'gap-3'
              ]"
            >
              <div v-if="!collapsed" class="flex-1 min-w-0 leading-tight">
                <div class="flex items-center gap-2">
                  <User :size="14" />
                  <span class="text-sm font-semibold text-text-main truncate">{{ user.name }}</span>
                  <span class="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-sub shrink-0">
                    {{ roleLabel }}
                  </span>
                </div>
                <p class="text-xs text-text-sub truncate">{{ user.departmentName }}</p>
              </div>
            </RouterLink>
          </div>
          
          <!-- 로그아웃 버튼 -->
          <button
            class="
            w-hug flex h-11 items-center gap-1 rounded-xl px-3
            text-xs font-medium text-text-sub hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30
            transition-colors duration-200"
            :class="collapsed ? 'justify-center' : ''"
            @click="handleLogout"
          >
            <LogOut :size="15" class="shrink-0" />
            <span v-if="!collapsed">로그아웃</span>
          </button>
        </div>
      </div>
    </aside>
    
    <!-- 사이드바 접기/열기 버튼 -->
    <button 
      class="
        absolute top-10 -right-4 z-50
        flex h-8 w-8 items-center justify-center
        rounded-xl border border-border bg-surface
        shadow-md transition-colors text-text-main
      " 
      @click="collapsed = !collapsed"
    >
      <ChevronLeft v-if="!collapsed" :size="16" />
      <ChevronRight v-else :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-vue-next'
import { ROLE_LABEL } from '@/utils/labels'

interface NavChildItem {
  name: string
  to: string
  label: string
}

interface NavItem {
  name: string
  to?: string
  label: string
  icon: Component
  children?: NavChildItem[]
}

const collapsed = defineModel<boolean>('collapsed', { required: true })
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const roleLabel = computed(() => user.value ? ROLE_LABEL[user.value.role] : '')

defineProps<{
  navItems: NavItem[]
}>()

const openMenus = ref<Record<string, boolean>>({
  tangible: true,   
  intangible: false 
})

const handleParentClick = (item: NavItem) => {
  if (!item.children || item.children.length === 0) return

  if (collapsed.value) {
    openMenus.value[item.name] = true
    router.push(item.children[0].to)
    return
  }

  const isCurrentlyOpen = !!openMenus.value[item.name]
  openMenus.value[item.name] = !isCurrentlyOpen
  
  if (!isCurrentlyOpen) {
    router.push(item.children[0].to)
  }
}

const isMenuOpen = (menuName: string) => {
  return !!openMenus.value[menuName]
}

const isParentActive = (children: Array<{ to: string }>) => {
  return children.some(child => route.path === child.to)
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login') 
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error)
  }
}
</script>