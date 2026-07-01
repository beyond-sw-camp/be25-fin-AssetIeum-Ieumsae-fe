<template>
  <div class="relative h-full min-h-0">
    <aside
      :class="[
        'flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-all duration-300',
        collapsed ? 'w-20' : 'w-65',
      ]"
    >
      <nav class="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <template v-for="item in navItems" :key="item.name">
          <div v-if="item.children && item.children.length > 0" class="space-y-1">
            <button
              :class="[
                'flex w-full items-center rounded-xl px-3 py-2 transition-colors hover:bg-primary/5',
                collapsed ? 'justify-center' : 'justify-between',
                isParentActive(item.children)
                  ? 'bg-primary/10 font-semibold text-primary!'
                  : 'text-text-main',
              ]"
              @click="handleParentClick(item)"
            >
              <div class="flex min-w-0 items-center" :class="collapsed ? '' : 'gap-3'">
                <component :is="item.icon" :size="18" class="shrink-0" />
                <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
              </div>
              <ChevronDown
                v-if="!collapsed"
                :size="16"
                :class="['transition-transform duration-200', { 'rotate-180': isMenuOpen(item.name) }]"
              />
            </button>

            <div
              v-if="isMenuOpen(item.name) && !collapsed"
              class="space-y-1 overflow-hidden pl-4 transition-all"
            >
              <RouterLink
                v-for="child in item.children"
                :key="child.name"
                :to="child.to"
                :class="[
                  'flex items-center whitespace-nowrap rounded-xl px-4 py-2 text-sm text-text-sub transition-all hover:bg-primary/5 hover:text-primary',
                  isChildActive(child.to, item.children) && 'bg-primary/10! font-semibold text-primary!',
                ]"
              >
                {{ child.label }}
              </RouterLink>
            </div>
          </div>

          <RouterLink
            v-else
            :to="item.to!"
            :class="[
              'flex items-center rounded-xl px-3 py-2 text-text-main transition-colors hover:bg-primary/5',
              collapsed ? 'justify-center' : 'gap-3',
            ]"
            exact-active-class="bg-primary/10! text-primary! font-semibold"
          >
            <component :is="item.icon" :size="18" class="shrink-0" />
            <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="shrink-0 space-y-3 border-t border-border bg-surface p-2 shadow-0">
        <div class="flex min-w-0 items-center gap-1">
          <div class="min-w-0 flex-1">
            <RouterLink
              v-if="user"
              to="/profile"
              :class="[
                'group flex min-w-0 items-center rounded-xl bg-surface-secondary/50 px-3 py-2 transition-colors hover:bg-primary/5',
                collapsed ? 'justify-center' : 'gap-3',
              ]"
            >
              <div v-if="!collapsed" class="min-w-0 gap-3 leading-tight">
                <div class="flex min-w-0 items-center gap-2">
                  <User :size="14" class="shrink-0" />
                  <span class="truncate text-sm font-semibold text-text-main">{{ user.name }}</span>
                </div>  
                <div class="flex min-w-0 items-center gap-2">
                  <p class="truncate text-xs text-text-sub">{{ user.departmentName }}</p>
                  <span class="max-w-18 shrink truncate whitespace-nowrap rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-sub items-center">
                    {{ roleLabel }}
                  </span>
                </div>
              </div>
            </RouterLink>
          </div>

          <button
            class="flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-2 text-xs font-medium text-text-sub transition-colors duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            :class="collapsed ? 'justify-center' : ''"
            @click="handleLogout"
          >
            <LogOut :size="15" class="shrink-0" />
            <span v-if="!collapsed">로그아웃</span>
          </button>
        </div>
      </div>
    </aside>

    <button
      v-if="!collapseLocked"
      class="absolute -right-4 top-[86%] z-50 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-main shadow-md transition-colors"
      @click="collapsed = !collapsed"
    >
      <ChevronLeft v-if="!collapsed" :size="16" />
      <ChevronRight v-else :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-vue-next'

import { useAuthStore } from '@/stores'
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

const props = defineProps<{
  navItems: NavItem[]
  collapseLocked?: boolean
}>()

function updateOpenMenus() {
  const matchedParent = props.navItems.find((item) =>
    item.children?.some((child) =>
      route.path === child.to ||
      route.path.startsWith(`${child.to}/`),
    ),
  )

  openMenus.value = matchedParent
    ? { [matchedParent.name]: true }
    : {}
}

const openMenus = ref<Record<string, boolean>>({})
updateOpenMenus()

function handleParentClick(item: NavItem) {
  if (!item.children || item.children.length === 0) return

  if (collapsed.value) {
    openMenus.value = { [item.name]: true }
    router.push(item.children[0].to)
    return
  }

  const isCurrentlyOpen = Boolean(openMenus.value[item.name])
  openMenus.value = isCurrentlyOpen ? {} : { [item.name]: true }

  if (!isCurrentlyOpen) {
    router.push(item.children[0].to)
  }
}

function isMenuOpen(menuName: string) {
  const menu = props.navItems.find((item) => item.name === menuName)
  return Boolean(openMenus.value[menuName] || (menu?.children && isParentActive(menu.children)))
}

function isParentActive(children: Array<{ to: string }>) {
  return Boolean(getActiveChild(children))
}

function isRouteMatch(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))
}

function getActiveChild(children: Array<{ to: string }>) {
  return children
    .filter((child) => isRouteMatch(child.to))
    .sort((current, next) => next.to.length - current.to.length)[0]
}

function isChildActive(path: string, siblings: Array<{ to: string }>) {
  return getActiveChild(siblings)?.to === path
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error)
  }
}

watch(
  () => route.path,
  () => {
    updateOpenMenus()
  },
  { immediate: true },
)
</script>
