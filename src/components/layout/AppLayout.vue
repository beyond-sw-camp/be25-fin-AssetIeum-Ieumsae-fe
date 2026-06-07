<template>
  <div class="h-screen bg-background text-text-main transition-colors duration-300">
    <Header />

    <div class="flex h-[calc(100vh-64px)] pt-16">
      <Sidebar 
        v-model:collapsed="collapsed" 
        :navItems="navItems" 
      />

      <main class="flex-1 overflow-auto bg-background p-4 transition-colors duration-300">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePermission } from '@/composables'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

import {
  LayoutDashboard,
  Ticket,
  Laptop,
  Package,
  Building2,
  Users,
  Search,
  ShoppingCart,
  Wallet,
  FileText
} from 'lucide-vue-next'

const collapsed = ref(false)
const { canManageSystem, canManageDepartment, canManageAsset, canPurchase } = usePermission()

const navItems = computed(() => {
  const menuConfig = [
    { name: 'dashboard', to: '/', label: '대시보드', icon: LayoutDashboard, show: true },
    {
      name: 'tangible',
      label: '유형 자산 관리',
      icon: Laptop,
      show: true,
      children: [
        { name: 'tangible-items', to: '/assets/tangible/items', label: '유형 자산 품목 관리', show: canManageAsset.value },
        { name: 'tangible-list', to: '/assets/tangible', label: '유형 자산 관리', show: true }
      ]
    },
    {
      name: 'intangible',
      label: '무형 자산 관리',
      icon: Package,
      show: true,
      children: [
        { name: 'intangible-items', to: '/assets/intangible/items', label: '무형 자산 품목 관리', show: canManageAsset.value },
        { name: 'intangible-list', to: '/assets/intangible', label: '무형 자산 관리', show: true }
      ]
    },
    { name: 'tickets', to: '/tickets', label: '서비스 데스크', icon: Ticket, show: true },
    { name: 'surveys', to: '/surveys', label: '전수조사', icon: Search, show: canManageAsset.value },
    { name: 'purchase', to: '/purchase', label: '구매 프로세스', icon: ShoppingCart, show: canPurchase.value },
    { name: 'organization', to: '/organization', label: '조직도', icon: Building2, show: canManageDepartment.value },
    { name: 'members', to: '/members', label: '사원 관리', icon: Users, show: canManageSystem.value },
    { name: 'budget', to: '/budget', label: '예산 관리', icon: Wallet, show: canManageSystem.value },
    { name: 'logs', to: '/logs', label: '로그', icon: FileText, show: canManageSystem.value }
  ]

  return menuConfig
    .filter(item => item.show)
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => child.show)
        }
      }
      return item
    })
})
</script>