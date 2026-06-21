<template>
  <div class="flex h-dvh w-full max-w-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <Header class="h-16 shrink-0" />
    <ToastContainer />

    <div class="mt-16 flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-full flex-none overflow-hidden">
      <Sidebar
        v-model:collapsed="collapsed"
        :nav-items="navItems"
        class="shrink-0"
      />

      <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background p-4 transition-colors duration-300">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Building2,
  FileText,
  Laptop,
  LayoutDashboard,
  Package,
  Search,
  SettingsIcon,
  ShoppingCart,
  Ticket,
  Users,
  Workflow,
} from 'lucide-vue-next'

import ToastContainer from '@/components/common/ToastContainer.vue'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { usePermission } from '@/composables'

const collapsed = ref(false)
const {
  canManageCompany,
  canManageDepartment,
  canManageAsset,
  canManageTickets,
  canPurchase,
  canViewHrWorkflow,
  canViewMyTickets,
  canViewInspection,
  canManageInspection,
  canRespondInspection,
} = usePermission()

const navItems = computed(() => {
  const menuConfig = [
    { name: 'dashboard', to: '/', label: '대시보드', icon: LayoutDashboard, show: true },
    {
      name: 'tangible',
      label: '유형자산',
      icon: Laptop,
      show: true,
      children: [
        { name: 'tangible-items', to: '/item/tangible', label: '유형자산 품목 관리', show: canManageAsset.value },
        { name: 'tangible-list', to: '/assets/tangible', label: '유형자산 관리', show: true },
      ],
    },
    {
      name: 'intangible',
      label: '무형자산',
      icon: Package,
      show: true,
      children: [
        { name: 'intangible-items', to: '/item/intangible', label: '무형자산 품목 관리', show: canManageAsset.value },
        { name: 'intangible-list', to: '/assets/intangible', label: '무형자산 관리', show: true },
      ],
    },
    {
      name: 'serviceDesk',
      label: '서비스 데스크',
      icon: Ticket,
      show: canViewMyTickets.value,
      children: [
        { name: 'my-requests', to: '/tickets', label: '나의 요청', show: canViewMyTickets.value },
        { name: 'ticket-management', to: '/tickets/manage', label: '티켓 관리', show: canManageTickets.value },
      ],
    },
    { name: 'hrworkflows', to: '/hrworkflows', label: 'HR 워크플로우', icon: Workflow, show: canViewHrWorkflow.value },
    {
      name: 'inspections',
      label: '전수조사',
      icon: Search,
      show: canViewInspection.value,
      children: [
        { name: 'tangible', to: '/inspections/tangible', label: '유형자산', show: canManageInspection.value },
        { name: 'intangible', to: '/inspections/intangible', label: '무형자산', show: canManageInspection.value },
        // { name: 'tangible-response', to: '/inspections/tangible/respond', label: '유형자산', show: canRespondInspection.value },
        // { name: 'intangible-response', to: '/inspections/intangible/respond', label: '무형자산', show: canRespondInspection.value },
      ],
    },
    { name: 'purchase', to: '/purchase', label: '구매 프로세스', icon: ShoppingCart, show: canPurchase.value },
    { name: 'organization', to: '/organization', label: '조직도', icon: Building2, show: canManageDepartment.value },
    { name: 'members', to: '/members', label: '사원 관리', icon: Users, show: canManageCompany.value },
    {
      name: 'logs',
      label: '로그',
      icon: FileText,
      show: canManageCompany.value,
      children: [
        { name: 'audit-logs', to: '/logs/audit', label: '감사로그', show: canManageCompany.value },
        { name: 'activity-logs', to: '/logs/activity', label: '활동로그', show: canManageCompany.value },
      ],
    },
    { name: 'settings', to: '/settings', label: '설정', icon: SettingsIcon, show: canManageCompany.value },
  ]

  return menuConfig
    .filter((item) => item.show)
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) => child.show),
        }
      }
      return item
    })
})
</script>
