import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { Role } from '@/types'

// =====================================================
// 라우트 메타 타입 확장
// =====================================================

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Role[]           // 접근 가능한 역할 목록
    title?: string           // 페이지 타이틀
  }
}

// =====================================================
// 라우트 정의
// =====================================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ─── 인증 불필요 ───────────────────────────────
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false, title: '로그인' },
    },
    // ─── 인증 필요 (공통 레이아웃) ─────────────────
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        // 대시보드 (역할별 분기)
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '대시보드' },
        },

        // ─── 조직도 ─────────────────────────────────
        {
          path: 'organization',
          name: 'Organization',
          component: () => import('@/views/organization/OrganizationView.vue'),
          meta: { title: '조직도', roles: ['ADMIN'] },
        },

        // ─── 사원 관리 ───────────────────────────────
        {
          path: 'members',
          children: [
            {
              path: '',
              name: 'MemberList',
              component: () => import('@/views/member/MemberListView.vue'),
              meta: { title: '사원 목록', roles: ['ADMIN'] },
            },
          ],
        },

        // ─── 티켓 ────────────────────────────────────
        {
          path: 'tickets',
          children: [
            {
              path: '',
              name: 'TicketList',
              component: () => import('@/views/ticket/TicketListView.vue'),
              meta: {
                title: '나의 요청',
              },
            },
            {
              path: 'create',
              name: 'TicketCreate',
              redirect: { name: 'TicketList', query: { create: '1' } },
              meta: { title: '새 요청', roles: ['EMPLOYEE'] },
            },
            {
              path: ':ticketId',
              name: 'TicketDetail',
              component: () => import('@/views/ticket/TicketDetailView.vue'),
              meta: { title: '티켓 상세' },
            },
          ],
        },

        // ─── 유형자산 품목 ────────────────────────────────
        {
          path: 'item/tangible',
          children: [
            {
              path: '',
              name: 'TangibleAssetItemList',
              component: () => import('@/views/item/tangible/TangibleItemListView.vue'),
              meta: {title: '유형자산 품목 목록'}
            }
          ]
        }, 

        // ─── 유형자산 ────────────────────────────────
        {
          path: 'assets/tangible',
          children: [
            {
              path: '',
              name: 'TangibleAssetList',
              component: () => import('@/views/asset/tangible/TangibleAssetListView.vue'),
              meta: { title: '유형자산 목록' },
            },
          ],
        },

        // ─── 무형자산 품목 ────────────────────────────────
        {
          path: 'item/intangible',
          children: [
            {
              path: '',
              name: 'IntangibleItemList',
              component: () => import('@/views/item/intangible/IntangibleItemListView.vue'),
              meta: {title: '무형자산 품목 목록'}
            }
          ]
        },

        // ─── 무형자산 ────────────────────────────────
        {
          path: 'assets/intangible',
          children: [
            {
              path: '',
              name: 'IntangibleAssetList',
              component: () => import('@/views/asset/intangible/IntangibleAssetListView.vue'),
              meta: { title: '무형자산 목록' },
            },
            {
              path: ':assetId',
              name: 'IntangibleAssetDetail',
              component: () => import('@/components/asset/intangible/IntangibleAssetDetailView.vue'),
              meta: { title: '무형자산 상세' },
            },
          ],
        },

        // ─── 전수조사 ────────────────────────────────
        {
          path: 'surveys',
          children: [
            {
              path: '',
              name: 'SurveyList',
              component: () => import('@/views/survey/SurveyListView.vue'),
              meta: { title: '전수조사', roles: ['ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'] },
            },
            {
              path: ':surveyId',
              name: 'SurveyDetail',
              component: () => import('@/views/survey/SurveyDetailView.vue'),
              meta: { title: '전수조사 상세' },
            },
          ],
        },

        // ─── 예산 관리 ───────────────────────────────
        {
          path: 'budget',
          name: 'Budget',
          component: () => import('@/views/budget/BudgetView.vue'),
          meta: { title: '예산 관리', roles: ['ADMIN'] },
        },

        // ─── 구매 관리 ───────────────────────────────
        {
          path: 'purchase',
          name: 'Purchase',
          component: () => import('@/views/purchase/PurchaseView.vue'),
          meta: { title: '구매 관리', roles: ['ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER'] },
        },

        // ─── 로그 ─────────────────────────────────────
        {
          path: 'logs',
          name: 'Logs',
          component: () => import('@/views/log/LogView.vue'),
          meta: { title: '감사/활동 로그', roles: ['ADMIN'] },
        },

        // ─── 내 정보 ─────────────────────────────────
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/profile/ProfileView.vue'),
          meta: { title: '내 정보' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/SettingsView.vue'),
          meta: { title: '설정' },
        },
        {
          path: 'settings/password',
          name: 'PasswordChange',
          component: () => import('@/views/auth/PasswordChangeView.vue'),
          meta: { title: '비밀번호 변경' },
        },
      ],
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/NotFoundView.vue'),
    },
  ],
})

// =====================================================
// 네비게이션 가드
// =====================================================

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 타이틀 업데이트
  document.title = to.meta.title ? `${to.meta.title} | 자산이음` : '자산이음'

  // 인증 불필요 페이지
  if (to.meta.requiresAuth === false) {
    if (auth.isAuthenticated && to.name === 'Login') {
      return { name: 'Dashboard' }
    }
    return true
  }

  // 미인증 → 로그인 페이지로
  if (!auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 역할 체크
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!auth.currentRole || !to.meta.roles.includes(auth.currentRole)) {
      return { name: 'Dashboard' } // 권한 없으면 대시보드로
    }
  }

  return true
})

export default router
