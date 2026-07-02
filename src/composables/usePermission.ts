import { computed } from 'vue'
import { useAuthStore } from '@/stores'
import type { Role } from '@/types'

// =====================================================
// usePermission - 역할(Role) 기반 권한 제어
// =====================================================

export function usePermission() {
  const auth = useAuthStore()

  const role = computed(() => auth.currentRole)

  // 특정 역할 중 하나에 해당하는지 확인
  function hasRole(...roles: Role[]): boolean {
    return !!role.value && roles.includes(role.value)
  }

  const canAccessAllPages = computed(() => hasRole('ADMIN'))

  // 회사 등록 및 회사 (super admin)
  const canManagePlatform = computed(() => hasRole('SUPER_ADMIN'))

  // 감사/활동 로그 (최고관리자, 구매자산팀)
  const canViewLogs = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canViewOperationReports = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  // 예산 관리 (최고관리자)
  const canManageBudget = computed(() => canAccessAllPages.value)

  // 회사 최고 관리자 전용 기능 여부
  const canManageCompany = computed(() => canAccessAllPages.value)

  const canManagePurchasePolicy = computed(() => hasRole('ADMIN'))

  // 사원 등록, 부서 변경, 퇴사 처리 권한
  const canManageMembers = computed(() =>
    canAccessAllPages.value
  )

  // 조직도 조회 가능 여부
  const canManageDepartment = computed(() =>
    canAccessAllPages.value
  )

  // 조직도 부서 생성/수정/삭제 가능 여부
  const canEditOrganization = computed(() => canAccessAllPages.value)

  // 티켓 승인 가능 여부 (부서책임자, 구매자산팀, 최고관리자)
  const canApproveTicket = computed(() =>
    canAccessAllPages.value || hasRole('DEPARTMENT_MANAGER', 'ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canViewMyTickets = computed(() => (
    auth.isAuthenticated
    && !hasRole('ADMIN', 'SUPER_ADMIN')
  ))

  const canCreateTicket = computed(() => (
    auth.isAuthenticated
    && !hasRole('ADMIN', 'SUPER_ADMIN')
  ))

  const canViewDepartmentTickets = computed(() =>
    canAccessAllPages.value || hasRole('DEPARTMENT_MANAGER')
  )
  
  const canViewAllTickets = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canManageTickets = computed(() =>
    canAccessAllPages.value || hasRole('DEPARTMENT_MANAGER', 'ASSET_TEAM', 'ASSET_MANAGER')
  )

  // 구매 관련 기능 (구매자산팀)
  const canPurchase = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  // 자산 관리 가능 여부 (구매자산팀, 최고관리자)
  const canManageAsset = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canRegisterAsset = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canUpdateAsset = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )
  
  // HR 워크플로우
  const canRegisterHrTemplate = computed(() => 
    hasRole('ASSET_MANAGER', 'DEPARTMENT_MANAGER', 'ADMIN')
  )

  const canViewHrWorkflow = computed(() => 
    hasRole('ASSET_MANAGER', 'DEPARTMENT_MANAGER', 'ADMIN')
  )

  // 전수조사 
  const canManageInspection = computed(() =>
    canAccessAllPages.value || hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )

  const canCloseInspection = computed(() =>
    hasRole('ASSET_TEAM', 'ASSET_MANAGER', 'ADMIN')
  )

  const canViewMyInspectionFollowUps = computed(() =>
    hasRole('ASSET_TEAM', 'ASSET_MANAGER')
  )
  
  const canRespondInspection = computed(() =>
    hasRole('EMPLOYEE')
  )

  const canViewInspection = computed(() =>
    canManageInspection.value || canRespondInspection.value
  )

  return {
    role,
    hasRole,
    canAccessAllPages,
    canManagePlatform,
    canManageCompany,
    canManagePurchasePolicy,
    canManageMembers,
    canManageDepartment,
    canEditOrganization,
    canManageAsset,
    canApproveTicket,
    canViewMyTickets,
    canCreateTicket,
    canViewDepartmentTickets,
    canViewHrWorkflow,
    canViewAllTickets,
    canManageTickets,
    canPurchase,
    canManageBudget,
    canRegisterAsset,
    canUpdateAsset,
    canRegisterHrTemplate,
    canViewInspection,
    canManageInspection,
    canCloseInspection,
    canViewMyInspectionFollowUps,
    canViewLogs,
    canViewOperationReports,
    canRespondInspection,
  }
}
