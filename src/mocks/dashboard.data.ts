import type { IntangibleAsset, TangibleAsset } from '@/types'

export interface DashboardAssetsSnapshot {
  tangibleAssets: TangibleAsset[]
  intangibleAssets: IntangibleAsset[]
}

export interface DashboardDemandMockRow extends Record<string, unknown> {
  id: string
  kind: string
  name: string
  expectedDemand: number
  currentStock: number
  returnExpected: number
  availability: number
  status: '충분' | '부족'
}

export interface DashboardBudgetMockRow extends Record<string, unknown> {
  department: string
  limit: number
  used: number
  percent: number
}

export interface DashboardDepartmentBudgetSummary {
  departmentName: string
  totalBudget: number
  usedBudget: number
  remainingBudget: number
  usagePercent: number
  usages: {
    label: string
    percent: number
  }[]
}

export interface DashboardLifecycleCategory {
  id: string
  label: string
  count: number
  checked: boolean
}

export interface DashboardLifecycleEvent {
  id: string
  type: 'join' | 'leave' | 'move'
  title: string
  description: string
  date: string
  dueText: string
}

export interface DashboardLifecycleStatus {
  id: string
  label: string
  current: number
  total: number
  percent: number
  colorClass: string
  iconClass: string
}

export interface DashboardDepartmentLifecycle {
  categories: DashboardLifecycleCategory[]
  events: DashboardLifecycleEvent[]
  statuses: DashboardLifecycleStatus[]
}

const ASSET_TEAM_DEPARTMENT_ID = '22222222-2222-2222-2222-222222222222'
const PLATFORM_DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333'
const FRONTEND_DEPARTMENT_ID = '44444444-4444-4444-4444-444444444444'
const OPERATIONS_DEPARTMENT_ID = '66666666-6666-6666-6666-666666666666'
const HR_DEPARTMENT_ID = '77777777-7777-7777-7777-777777777777'

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
  {
    assetId: 'dashboard-tangible-5',
    assetCode: 'TNG-1005',
    assetItemId: 'dashboard-item-laptop',
    assetItemName: 'MacBook Air 15인치',
    status: 'AVAILABLE',
    assignedMemberId: null,
    assignedMemberName: null,
    departmentId: null,
    departmentName: null,
    startedAt: null,
    returnDueDate: null,
    warrantyExpiredAt: '2026-07-12T00:00:00',
    purchaseDate: '2025-07-12T09:00:00',
    purchasePrice: 2100000,
    purchaseVendor: 'Apple Korea',
    createdAt: '2025-07-12T09:00:00',
  },
  {
    assetId: 'dashboard-tangible-6',
    assetCode: 'TNG-1006',
    assetItemId: 'dashboard-item-projector',
    assetItemName: '회의실 프로젝터',
    status: 'IN_USE',
    usageType: 'TEMPORARY',
    assignedMemberId: mockMemberId(5),
    assignedMemberName: '정운영',
    departmentId: OPERATIONS_DEPARTMENT_ID,
    departmentName: '운영팀',
    startedAt: '2026-06-08T09:00:00',
    returnDueDate: '2026-06-17T18:00:00',
    warrantyExpiredAt: '2027-06-08T00:00:00',
    purchaseDate: '2025-06-08T09:00:00',
    purchasePrice: 1350000,
    purchaseVendor: '벤큐코리아',
    createdAt: '2025-06-08T09:00:00',
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
    isAutoRenewal: true,
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
    isAutoRenewal: true,
  },
  {
    assetId: 'dashboard-intangible-3',
    assetCode: 'INT-2003',
    assetItemId: 'dashboard-item-figma',
    assetItemName: 'Figma Organization',
    licenseType: 'TERM',
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
    isAutoRenewal: false,
  },
  {
    assetId: 'dashboard-intangible-4',
    assetCode: 'INT-2004',
    assetItemId: 'dashboard-item-notion',
    assetItemName: 'Notion Enterprise',
    licenseType: 'TERM',
    licenseCode: 'NOTION-ENT-001',
    licenseKey: 'NOTION-ENT-001-KEY',
    status: 'IN_USE',
    assignedMemberId: mockMemberId(6),
    assignedMemberName: '한인사',
    departmentId: HR_DEPARTMENT_ID,
    departmentName: '인사팀',
    startedAt: '2026-04-01T09:00:00',
    expiredAt: '2026-06-29T23:59:59',
    vendor: 'Notion',
    purchaseDate: '2026-04-01T09:00:00',
    purchaseVendor: 'Notion',
    purchasePrice: 860000,
    createdAt: '2026-04-01T09:00:00',
    intangibleAssetStatus: 'IN_USE',
    billingCycle: 'YEARLY',
    seatCount: 30,
    isAutoRenewal: true,
  },
]

export const dashboardDemandRows: DashboardDemandMockRow[] = [
  { id: 'demand-1', kind: '유형자산', name: '노트북', expectedDemand: 8, currentStock: 3, returnExpected: 0, availability: 38, status: '부족' },
  { id: 'demand-2', kind: '무형자산', name: '라이선스', expectedDemand: 2, currentStock: 4, returnExpected: 1, availability: 100, status: '충분' },
  { id: 'demand-3', kind: '유형자산', name: '모니터', expectedDemand: 12, currentStock: 9, returnExpected: 4, availability: 100, status: '충분' },
  { id: 'demand-4', kind: '유형자산', name: '태블릿', expectedDemand: 6, currentStock: 1, returnExpected: 1, availability: 33, status: '부족' },
  { id: 'demand-5', kind: '무형자산', name: '협업툴', expectedDemand: 5, currentStock: 7, returnExpected: 0, availability: 100, status: '충분' },
]

export const dashboardBudgetRows: DashboardBudgetMockRow[] = [
  { department: '개발팀', limit: 150000000, used: 120000000, percent: 80 },
  { department: '운영팀', limit: 50000000, used: 42000000, percent: 84 },
  { department: '인사팀', limit: 60000000, used: 25000000, percent: 41 },
  { department: '총무팀', limit: 240000000, used: 233000000, percent: 97 },
]

export const dashboardDepartmentDemandRows: DashboardDemandMockRow[] = [
  { id: 'department-demand-1', kind: '유형자산', name: '노트북', expectedDemand: 8, currentStock: 3, returnExpected: 0, availability: 38, status: '부족' },
  { id: 'department-demand-2', kind: '무형자산', name: '라이선스', expectedDemand: 2, currentStock: 4, returnExpected: 1, availability: 100, status: '충분' },
  { id: 'department-demand-3', kind: '유형자산', name: '노트북', expectedDemand: 8, currentStock: 3, returnExpected: 0, availability: 38, status: '부족' },
  { id: 'department-demand-4', kind: '무형자산', name: '라이선스', expectedDemand: 2, currentStock: 4, returnExpected: 1, availability: 100, status: '충분' },
  { id: 'department-demand-5', kind: '무형자산', name: '라이선스', expectedDemand: 2, currentStock: 4, returnExpected: 1, availability: 100, status: '충분' },
]

export const dashboardDepartmentBudgetSummary: DashboardDepartmentBudgetSummary = {
  departmentName: '개발팀',
  totalBudget: 150000000,
  usedBudget: 120000000,
  remainingBudget: 30000000,
  usagePercent: 80,
  usages: [
    { label: '노트북 구매', percent: 60 },
    { label: '라이선스 구매', percent: 15 },
    { label: '기타', percent: 5 },
  ],
}

export const dashboardDepartmentLifecycle: DashboardDepartmentLifecycle = {
  categories: [
    { id: 'join', label: '입사', count: 12, checked: true },
    { id: 'leave', label: '퇴사', count: 8, checked: true },
    { id: 'move', label: '부서이동', count: 7, checked: false },
    { id: 'leave-of-absence', label: '휴직', count: 5, checked: false },
    { id: 'return', label: '복직', count: 3, checked: false },
    { id: 'all', label: '전체 선택', count: 35, checked: false },
  ],
  events: [
    { id: 'hr-event-1', type: 'join', title: '김00 님 입사', description: '개발본부/개발1팀', date: '2026-06-05', dueText: 'D-Day' },
    { id: 'hr-event-2', type: 'leave', title: '이ㅁㅁ 님 퇴사', description: '경영지원본부/인사팀', date: '2026-06-07', dueText: 'D-2' },
    { id: 'hr-event-3', type: 'leave', title: '이ㅁㅁ 님 퇴사', description: '경영지원본부/인사팀', date: '2026-06-09', dueText: 'D-5' },
    { id: 'hr-event-4', type: 'move', title: '이ㅁㅁ 님 부서이동', description: '마케팅팀으로 이동', date: '2026-06-09', dueText: 'D-5' },
    { id: 'hr-event-5', type: 'leave', title: '이ㅁㅁ 님 퇴사', description: '경영지원본부/인사팀', date: '2026-06-11', dueText: 'D-8' },
  ],
  statuses: [
    { id: 'paid', label: '지급 완료', current: 24, total: 48, percent: 50, colorClass: 'bg-success', iconClass: 'bg-success/20 text-success' },
    { id: 'collecting', label: '회수 중', current: 15, total: 45, percent: 33, colorClass: 'bg-orange-700', iconClass: 'bg-primary/20 text-primary' },
    { id: 'return', label: '반품', current: 9, total: 12, percent: 75, colorClass: 'bg-blue-700', iconClass: 'bg-blue-100 text-blue-700' },
  ],
}

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
