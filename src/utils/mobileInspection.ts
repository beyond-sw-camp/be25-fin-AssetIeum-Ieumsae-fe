import type { Role } from '@/types'

const MOBILE_INSPECTION_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'DEPARTMENT_MANAGER',
  'ASSET_TEAM',
  'ASSET_MANAGER',
  'EMPLOYEE',
]

export function canUseMobileInspectionRole(role: unknown): role is Role {
  return typeof role === 'string' && MOBILE_INSPECTION_ROLES.includes(role as Role)
}
