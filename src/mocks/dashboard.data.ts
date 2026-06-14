import type { IntangibleAsset, TangibleAsset } from '@/types'

export interface DashboardAssetsSnapshot {
  tangibleAssets: TangibleAsset[]
  intangibleAssets: IntangibleAsset[]
}

const ASSET_TEAM_DEPARTMENT_ID = '22222222-2222-2222-2222-222222222222'
const PLATFORM_DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333'
const FRONTEND_DEPARTMENT_ID = '44444444-4444-4444-4444-444444444444'

const mockMemberId = (sequence: number) => `55555555-5555-5555-5555-${String(sequence).padStart(12, '0')}`

export const dashboardTangibleAssets: TangibleAsset[] = [
  {
    assetId: 'dashboard-tangible-1',
    assetCode: 'TNG-1001',
    assetItemId: 'dashboard-item-laptop',
    assetItemName: 'MacBook Pro 14인치 M3',
    status: 'IN_USE',
    assignedMemberId: mockMemberId(1),
    assignedMemberName: '김관리',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    startedAt: '2026-05-10T09:00:00',
    returnDueDate: '2026-06-25T18:00:00',
    warrantyExpiredAt: '2026-07-05T00:00:00',
    purchaseDate: '2025-05-10T09:00:00',
    createdAt: '2025-05-10T09:00:00',
  },
  {
    assetId: 'dashboard-tangible-2',
    assetCode: 'TNG-1002',
    assetItemId: 'dashboard-item-tablet',
    assetItemName: 'iPad Pro 13인치',
    status: 'IN_USE',
    usageType: 'TEMPORARY',
    assignedMemberId: mockMemberId(3),
    assignedMemberName: '이부장',
    departmentId: PLATFORM_DEPARTMENT_ID,
    departmentName: '플랫폼개발본부',
    startedAt: '2026-05-01T09:00:00',
    returnDueDate: '2026-06-18T18:00:00',
    warrantyExpiredAt: '2027-05-01T00:00:00',
    purchaseDate: '2025-05-01T09:00:00',
    createdAt: '2025-05-01T09:00:00',
  },
  {
    assetId: 'dashboard-tangible-3',
    assetCode: 'TNG-1003',
    assetItemId: 'dashboard-item-phone',
    assetItemName: 'Galaxy S24 Ultra',
    status: 'IN_USE',
    usageType: 'TEMPORARY',
    assignedMemberId: mockMemberId(2),
    assignedMemberName: '박자산',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    startedAt: '2026-04-10T09:00:00',
    returnDueDate: '2026-06-01T18:00:00',
    warrantyExpiredAt: '2027-04-10T00:00:00',
    purchaseDate: '2025-04-10T09:00:00',
    createdAt: '2025-04-10T09:00:00',
  },
  {
    assetId: 'dashboard-tangible-4',
    assetCode: 'TNG-1004',
    assetItemId: 'dashboard-item-monitor',
    assetItemName: 'LG 27인치 QHD 모니터',
    status: 'AVAILABLE',
    assignedMemberId: null,
    assignedMemberName: null,
    departmentId: null,
    departmentName: null,
    startedAt: null,
    returnDueDate: null,
    warrantyExpiredAt: '2026-06-28T00:00:00',
    purchaseDate: '2025-06-28T09:00:00',
    createdAt: '2025-06-28T09:00:00',
  },
]

export const dashboardIntangibleAssets: IntangibleAsset[] = [
  {
    assetId: 'dashboard-intangible-1',
    assetCode: 'INT-2001',
    assetItemId: 'dashboard-item-chatgpt',
    assetItemName: 'ChatGPT 구독',
    licenseType: 'SUBSCRIPTION',
    licenseCode: 'GPT-TEAM-001',
    licenseKey: 'GPT-TEAM-001-KEY',
    status: 'IN_USE',
    assignedMemberId: mockMemberId(1),
    assignedMemberName: '김관리',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    startedAt: '2026-06-01T09:00:00',
    expiredAt: '2026-06-30T23:59:59',
    vendor: 'OpenAI',
    purchaseDate: '2026-06-01T09:00:00',
    purchaseVendor: 'OpenAI',
    purchasePrice: 320000,
    createdAt: '2026-06-01T09:00:00',
    intangibleAssetStatus: 'IN_USE',
    billingCycle: 'MONTHLY',
    seatCount: 1,
    isAutoRenewal: 1,
  },
  {
    assetId: 'dashboard-intangible-2',
    assetCode: 'INT-2002',
    assetItemId: 'dashboard-item-gemini',
    assetItemName: 'Gemini',
    licenseType: 'SUBSCRIPTION',
    licenseCode: 'GEMINI-BIZ-001',
    licenseKey: 'GEMINI-BIZ-001-KEY',
    status: 'EXPIRING_SOON',
    assignedMemberId: mockMemberId(4),
    assignedMemberName: '최휴직',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    startedAt: '2026-01-01T09:00:00',
    expiredAt: '2026-06-20T23:59:59',
    vendor: 'Google',
    purchaseDate: '2026-01-01T09:00:00',
    purchaseVendor: 'Google',
    purchasePrice: 280000,
    createdAt: '2026-01-01T09:00:00',
    intangibleAssetStatus: 'EXPIRING_SOON',
    billingCycle: 'MONTHLY',
    seatCount: 1,
    isAutoRenewal: 1,
  },
  {
    assetId: 'dashboard-intangible-3',
    assetCode: 'INT-2003',
    assetItemId: 'dashboard-item-figma',
    assetItemName: 'Figma Organization',
    licenseType: 'USER_BASED',
    licenseCode: 'FIGMA-ORG-001',
    licenseKey: 'FIGMA-ORG-001-KEY',
    status: 'AVAILABLE',
    assignedMemberId: null,
    assignedMemberName: null,
    departmentId: null,
    departmentName: null,
    startedAt: null,
    expiredAt: '2026-08-01T23:59:59',
    vendor: 'Figma',
    purchaseDate: '2026-01-01T09:00:00',
    purchaseVendor: 'Figma',
    purchasePrice: 480000,
    createdAt: '2026-01-01T09:00:00',
    intangibleAssetStatus: 'AVAILABLE',
    billingCycle: 'YEARLY',
    seatCount: 10,
    isAutoRenewal: 0,
  },
]

export function getDashboardMockSnapshot(params?: {
  scope?: 'admin' | 'department' | 'employee'
  departmentId?: string
  memberId?: string
}): DashboardAssetsSnapshot {
  if (params?.scope === 'department' && params.departmentId) {
    return {
      tangibleAssets: dashboardTangibleAssets.filter((asset) => asset.departmentId === params.departmentId),
      intangibleAssets: dashboardIntangibleAssets.filter((asset) => asset.departmentId === params.departmentId),
    }
  }

  if (params?.scope === 'employee' && params.memberId) {
    return {
      tangibleAssets: dashboardTangibleAssets.filter((asset) => (asset.assignedMemberId ?? asset.memberId) === params.memberId),
      intangibleAssets: dashboardIntangibleAssets.filter((asset) => asset.assignedMemberId === params.memberId),
    }
  }

  return {
    tangibleAssets: dashboardTangibleAssets,
    intangibleAssets: dashboardIntangibleAssets,
  }
}
