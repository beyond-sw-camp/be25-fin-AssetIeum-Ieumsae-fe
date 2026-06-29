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

      <main
        :class="[
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background p-4 transition-colors duration-300',
          usesContainedPageScroll ? 'overflow-y-hidden' : 'overflow-y-auto',
        ]"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  BarChart3,
  Building2,
  Building,
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

import { notificationApi } from '@/api'
import ToastContainer from '@/components/common/ToastContainer.vue'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { usePermission } from '@/composables'
import { useEventSource } from '@/composables/useEventSource'

const collapsed = ref(false)
const route = useRoute()
const permission = usePermission()
const notificationSubscription = useEventSource()
const {
  canManageCompany,
  canManageDepartment,
  canManageAsset,
  canManageTickets,
  canPurchase,
  canViewHrWorkflow,
  canViewMyTickets,
  canViewInspection,
  canViewMyInspectionFollowUps,
  canViewLogs,
  canManagePlatform,
} = permission

const canViewOperationReports = computed(() =>
  permission.hasRole('ASSET_TEAM', 'ASSET_MANAGER'),
)

const usesContainedPageScroll = computed(() => (
  route.path === '/tickets'
  || route.path.startsWith('/tickets/')
))

onMounted(() => {
  notificationSubscription.connect(notificationApi.getSubscribePath())
})

const navItems = computed(() => {
  if (canManagePlatform.value) {
    return [
      { name: 'system-companies', to: '/system/companies', label: '회사 관리', icon: Building, show: true },
      { name: 'settings', to: '/settings', label: '설정', icon: SettingsIcon, show: true },
    ]
  }

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
      show: canViewMyTickets.value || canManageTickets.value,
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
        { name: 'tangible', to: '/inspections/tangible', label: '유형자산', show: canViewInspection.value },
        { name: 'intangible', to: '/inspections/intangible', label: '무형자산', show: canViewInspection.value },
        { name: 'follow-ups', to: '/inspections/follow-ups/my', label: '내 후속처리', show: canViewMyInspectionFollowUps.value },
      ],
    },
    { name: 'purchase', to: '/purchase', label: '구매 프로세스', icon: ShoppingCart, show: canPurchase.value },
    { name: 'operation-report', to: '/reports/operations', label: '운영 리포트', icon: BarChart3, show: canViewOperationReports.value },
    { name: 'organization', to: '/organization', label: '조직도', icon: Building2, show: canManageDepartment.value },
    { name: 'members', to: '/members', label: '사원 관리', icon: Users, show: canManageCompany.value },
    {
      name: 'logs',
      label: '로그',
      icon: FileText,
      show: canViewLogs.value,
      children: [
        { name: 'audit-logs', to: '/audit', label: '감사로그', show: canViewLogs.value },
        { name: 'activity-logs', to: '/activity', label: '활동로그', show: canViewLogs.value },
      ],
    },
    { name: 'settings', to: '/settings', label: '설정', icon: SettingsIcon, show: true },
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
