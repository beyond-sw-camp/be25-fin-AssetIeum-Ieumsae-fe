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

  // 회사 등록 및 회사 ADMIN 생성 화면은 관련 API 확정 후 연결한다.
  const canManagePlatform = computed(() => hasRole('SUPER_ADMIN'))

  // 회사 최고 관리자 전용 기능 여부
  const canManageCompany = computed(() => hasRole('ADMIN'))

  // 조직도 조회 가능 여부
  const canManageDepartment = computed(() => hasRole('ADMIN'))

  // 조직도 부서 생성/수정/삭제 가능 여부
  const canEditOrganization = computed(() => hasRole('ADMIN'))

  // 자산 관리 가능 여부 (구매자산팀, 최고관리자)
  const canManageAsset = computed(() =>
    hasRole('ADMIN', 'ASSET_TEAM')
  )

  // 티켓 승인 가능 여부 (부서책임자, 구매자산팀, 최고관리자)
  const canApproveTicket = computed(() =>
    hasRole('ADMIN', 'DEPARTMENT_MANAGER', 'ASSET_TEAM')
  )

  // 구매 관련 기능 (구매자산팀)
  const canPurchase = computed(() =>
    hasRole('ADMIN', 'ASSET_TEAM')
  )

  // 예산 관리 (최고관리자)
  const canManageBudget = computed(() => hasRole('ADMIN'))

  return {
    role,
    hasRole,
    canManagePlatform,
    canManageCompany,
    canManageDepartment,
    canEditOrganization,
    canManageAsset,
    canApproveTicket,
    canPurchase,
    canManageBudget,
  }
}
