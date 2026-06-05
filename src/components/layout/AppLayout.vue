<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 사이드바 -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-blue-600">자산이음</h1>
        <p class="text-xs text-gray-500 mt-1">{{ auth.user?.departmentName }}</p>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          active-class="bg-blue-50 text-blue-600 font-medium"
        >
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- 사용자 정보 -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {{ auth.user?.name?.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ auth.user?.memberNo }}</p>
          </div>
          <button class="text-gray-400 hover:text-red-500 text-xs" @click="handleLogout">로그아웃</button>
        </div>
      </div>
    </aside>

    <!-- 메인 컨텐츠 -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { usePermission } from '@/composables'

const auth = useAuthStore()
const router = useRouter()
const { canManageSystem, canManageDepartment, canManageAsset, canPurchase } = usePermission()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const navItems = computed(() => [
  { name: 'dashboard', to: '/', label: '대시보드', icon: '📊', show: true },
  { name: 'tickets', to: '/tickets', label: '티켓', icon: '🎫', show: true },
  { name: 'tangible', to: '/assets/tangible', label: '유형자산', icon: '💻', show: true },
  { name: 'intangible', to: '/assets/intangible', label: '무형자산', icon: '📦', show: true },
  { name: 'organization', to: '/organization', label: '조직도', icon: '🏢', show: canManageDepartment.value },
  { name: 'members', to: '/members', label: '사원 관리', icon: '👥', show: canManageSystem.value },
  { name: 'surveys', to: '/surveys', label: '전수조사', icon: '🔍', show: canManageAsset.value },
  { name: 'purchase', to: '/purchase', label: '구매 관리', icon: '🛒', show: canPurchase.value },
  { name: 'budget', to: '/budget', label: '예산 관리', icon: '💰', show: canManageSystem.value },
  { name: 'logs', to: '/logs', label: '로그', icon: '📋', show: canManageSystem.value },
].filter((item) => item.show))
</script>
