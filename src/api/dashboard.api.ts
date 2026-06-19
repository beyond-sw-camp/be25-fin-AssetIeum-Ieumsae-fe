import api from './client'
import type { IntangibleAsset, Role, TangibleAsset } from '@/types'
import { getDashboardMockSnapshot } from '@/mocks/dashboard.data'

export interface DashboardAssetsSnapshot {
  tangibleAssets: TangibleAsset[]
  intangibleAssets: IntangibleAsset[]
}

const dashboardScopePath = (role: Role | null | undefined) => {
  if (role === 'DEPARTMENT_MANAGER') return '/dashboard/department/assets/summary'
  if (role === 'EMPLOYEE') return '/dashboard/employee/assets/summary'
  return '/dashboard/admin/assets/summary'
}

const dashboardScope = (role: Role | null | undefined) => {
  if (role === 'DEPARTMENT_MANAGER') return 'department'
  if (role === 'EMPLOYEE') return 'employee'
  return 'admin'
}

export const dashboardApi = {
  getAssetsSnapshot: async (role: Role | null | undefined, params?: {
    companyId?: string
    departmentId?: string
    memberId?: string
  }) => {
    try {
      return await api.get<DashboardAssetsSnapshot>(dashboardScopePath(role), {
        company_id: params?.companyId,
        department_id: params?.departmentId,
        member_id: params?.memberId,
      })
    } catch (error) {
      console.warn('대시보드 API 미연결 - mock 데이터로 대체합니다.', error)

      return {
        status: 200,
        errorCode: null,
        message: '대시보드 mock 데이터입니다.',
        data: getDashboardMockSnapshot({
          scope: dashboardScope(role),
          departmentId: params?.departmentId,
          memberId: params?.memberId,
        }),
      }
    }
  },
}
