import { http, HttpResponse } from 'msw'
import type {
  ApiResponse,
  ActivityLog,
  AuditLog,
  Department,
  DepartmentChangeRequest,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DirectPurchaseRequestCreate,
  IntangibleAsset,
  IntangibleAssetCreateRequest,
  LoginRequest,
  LoginResponse,
  MaintenanceRequestCreate,
  Member,
  MemberRegisterRequest,
  NonStandardAssetRequestCreate,
  PageResponse,
  PasswordChangeRequest,
  PurchaseReturnRequestCreate,
  PurchaseRequestMethod,
  RentalExtensionRequestCreate,
  RentalRequestCreate,
  ReturnRequestCreate,
  StandardAssetRequestCreate,
  TangibleAsset,
  TangibleAssetCreateRequest,
  TangibleCategoryGroup,
  TangibleAssetItemUpdateRequest,
  TangibleAssetUpdateRequest,
  TicketCreateResponse,
  TicketComment,
  TicketDetail,
  TicketListItem,
  TicketStatus,
  TicketType,
} from '@/types'

const API_PREFIX = '*/api/v1'
const MOCK_COMPANY_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_COMPANY_CODE = 'COMP001'
const ROOT_DEPARTMENT_ID = '11111111-1111-1111-1111-111111111111'
const ASSET_TEAM_DEPARTMENT_ID = '22222222-2222-2222-2222-222222222222'
const PLATFORM_DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333'
const FRONTEND_DEPARTMENT_ID = '44444444-4444-4444-4444-444444444444'
const TICKET_STATUS_VALUES: ReadonlySet<TicketStatus> = new Set([
  'REQUESTED',
  'DEPARTMENT_APPROVED',
  'DEPARTMENT_REJECTED',
  'ASSET_APPROVED',
  'ASSET_REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])
const CANCELLABLE_TICKET_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'REQUESTED',
  'DEPARTMENT_APPROVED',
])
const DIRECT_PURCHASE_PAYMENT_STATUSES: ReadonlySet<TicketStatus> = new Set([
  'ASSET_APPROVED',
  'IN_PROGRESS',
])

const auditLogs: AuditLog[] = [
  {
    auditLogId: '1',
    memberId: '1',
    memberName: '김관리',
    targetType: 'TICKET',
    targetId: '101',
    logType: 'APPROVE',
    description: '자산 요청 티켓을 승인했습니다.',
    createdAt: '2026-06-01T10:00:00',
  },
  {
    auditLogId: '2',
    memberId: '2',
    memberName: '박자산',
    targetType: 'BUDGET',
    targetId: '10',
    logType: 'BUDGET_DEDUCTION',
    description: '구매 예산이 차감되었습니다.',
    createdAt: '2026-06-01T11:00:00',
  },
  {
    auditLogId: '3',
    memberId: '1',
    memberName: '김관리',
    targetType: 'MEMBER',
    targetId: '5',
    logType: 'ROLE_CHANGE',
    description: '사원 권한을 변경했습니다.',
    createdAt: '2026-06-02T09:30:00',
  },
]

const activityLogs: ActivityLog[] = [
  {
    activityLogId: '1',
    memberId: '5',
    memberName: '홍길동',
    activityType: 'VIEW',
    targetType: 'TICKET',
    targetId: '101',
    description: '티켓 상세 화면을 조회했습니다.',
    createdAt: '2026-06-01T10:00:00',
  },
  {
    activityLogId: '2',
    memberId: '5',
    memberName: '홍길동',
    activityType: 'SEARCH',
    targetType: 'ASSET',
    targetId: null,
    description: '자산 목록을 검색했습니다.',
    createdAt: '2026-06-01T10:10:00',
  },
  {
    activityLogId: '3',
    memberId: '1',
    memberName: '김관리',
    activityType: 'LOGIN',
    targetType: 'AUTH',
    targetId: null,
    description: '로그인했습니다.',
    createdAt: '2026-06-02T08:55:00',
  },
]

function ok<T>(data: T, message = '요청이 성공했습니다.'): ApiResponse<T> {
  return {
    status: 200,
    errorCode: null,
    message,
    data,
  }
}

function pageOf<T>(content: T[], page: number, size: number): PageResponse<T> {
  const start = page * size
  const pagedContent = content.slice(start, start + size)

  return {
    content: pagedContent,
    page,
    size,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
  }
}

function filterLogsByRequest<T extends { memberId: string | number; createdAt: string }>(logs: T[], request: Request) {
  const url = new URL(request.url)
  const memberId = url.searchParams.get('memberId')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  return logs.filter((log) => {
    if (memberId && String(log.memberId) !== memberId) return false
    if (startDate && log.createdAt.slice(0, 10) < startDate) return false
    if (endDate && log.createdAt.slice(0, 10) > endDate) return false
    return true
  })
}

let departments: Department[] = [
  {
    departmentId: ROOT_DEPARTMENT_ID,
    parentDepartmentId: null,
    name: '이음테크',
    memberCount: 0,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    parentDepartmentId: ROOT_DEPARTMENT_ID,
    parentDepartmentName: '이음테크',
    name: '구매자산팀',
    memberCount: 2,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: PLATFORM_DEPARTMENT_ID,
    parentDepartmentId: ROOT_DEPARTMENT_ID,
    parentDepartmentName: '이음테크',
    name: '플랫폼개발본부',
    memberCount: 1,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: FRONTEND_DEPARTMENT_ID,
    parentDepartmentId: PLATFORM_DEPARTMENT_ID,
    parentDepartmentName: '플랫폼개발본부',
    name: '프론트엔드팀',
    memberCount: 2,
    createdAt: '2026-01-02T09:00:00',
  },
]

function mockMemberId(sequence: number): string {
  return `55555555-5555-5555-5555-${String(sequence).padStart(12, '0')}`
}

function getDepartmentNamePath(departmentId: string): string {
  const names: string[] = []
  let current = departments.find((department) => department.departmentId === departmentId)

  while (current) {
    names.unshift(current.name)
    current = departments.find(
      (department) => department.departmentId === current?.parentDepartmentId,
    )
  }

  return names.join(' > ')
}

const memberSeeds: Array<Omit<Member, 'departmentNamePath'>> = [
  {
    memberId: mockMemberId(1),
    memberNo: 'EMP0001',
    name: '김관리',
    email: 'admin@ieumtech.com',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-05T09:00:00',
  },
  {
    memberId: mockMemberId(2),
    memberNo: 'EMP0002',
    name: '박자산',
    email: 'asset@ieumtech.com',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    role: 'ASSET_TEAM',
    status: 'ACTIVE',
    createdAt: '2026-01-06T09:00:00',
  },
  {
    memberId: mockMemberId(3),
    memberNo: 'EMP0003',
    name: '이부장',
    email: 'manager@ieumtech.com',
    departmentId: PLATFORM_DEPARTMENT_ID,
    departmentName: '플랫폼개발본부',
    role: 'DEPARTMENT_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-01-07T09:00:00',
  },
  {
    memberId: mockMemberId(4),
    memberNo: 'EMP0004',
    name: '최휴직',
    email: 'leave@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ON_LEAVE',
    createdAt: '2026-01-08T09:00:00',
  },
  {
    memberId: mockMemberId(5),
    memberNo: 'EMP0005',
    name: '정사원',
    email: 'member@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-09T09:00:00',
  },
  {
    memberId: mockMemberId(6),
    memberNo: 'EMP0006',
    name: '강개발',
    email: 'dev1@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-10T09:00:00',
  },
  {
    memberId: mockMemberId(7),
    memberNo: 'EMP0007',
    name: '윤프론트',
    email: 'dev2@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-11T09:00:00',
  },
  {
    memberId: mockMemberId(8),
    memberNo: 'EMP0008',
    name: '한지민',
    email: 'dev3@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-12T09:00:00',
  },
  {
    memberId: mockMemberId(9),
    memberNo: 'EMP0009',
    name: '오서준',
    email: 'dev4@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-13T09:00:00',
  },
  {
    memberId: mockMemberId(10),
    memberNo: 'EMP0010',
    name: '임하늘',
    email: 'dev5@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ON_LEAVE',
    createdAt: '2026-01-14T09:00:00',
  },
  {
    memberId: mockMemberId(11),
    memberNo: 'EMP0011',
    name: '송유진',
    email: 'dev6@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-15T09:00:00',
  },
  {
    memberId: mockMemberId(12),
    memberNo: 'EMP0012',
    name: '문도윤',
    email: 'dev7@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-16T09:00:00',
  },
  {
    memberId: mockMemberId(13),
    memberNo: 'EMP0013',
    name: '배수아',
    email: 'dev8@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-17T09:00:00',
  },
  {
    memberId: mockMemberId(14),
    memberNo: 'EMP0014',
    name: '구매자산팀장',
    email: 'asset.manager@ieumtech.com',
    departmentId: ASSET_TEAM_DEPARTMENT_ID,
    departmentName: '구매자산팀',
    role: 'ASSET_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-01-18T09:00:00',
  },
  {
    memberId: mockMemberId(15),
    memberNo: 'EMP0015',
    name: '김팀장',
    email: 'frontend.manager@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'DEPARTMENT_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-01-19T09:00:00',
  },
]

let members: Member[] = memberSeeds.map((member) => ({
  ...member,
  departmentNamePath: getDepartmentNamePath(member.departmentId),
}))

const memberPasswords = new Map(
  members.map((member) => [member.memberNo, member.memberNo]),
)

interface MockTicket extends TicketListItem {
  requesterId: string
  requesterName: string
  departmentId: string
  departmentName: string
}

let tickets: MockTicket[] = [
  {
    ticketId: '1',
    ticketNo: 'TKT-20260601-001',
    ticketType: 'ASSET_REQUEST',
    requestMethod: null,
    requestedItemName: 'MacBook Pro 14인치 M3 Max',
    ticketStatus: 'REQUESTED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-06-01T10:00:00',
  },
  {
    ticketId: '2',
    ticketNo: 'TKT-20260528-002',
    ticketType: 'RENTAL',
    requestMethod: null,
    requestedItemName: 'Dell UltraSharp 27인치 4K',
    ticketStatus: 'ASSET_APPROVED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-28T14:20:00',
  },
  {
    ticketId: '3',
    ticketNo: 'TKT-20260520-003',
    ticketType: 'MAINTENANCE_REQUEST',
    requestMethod: null,
    requestedItemName: '에어론 체어 풀 스펙 B사이즈',
    ticketStatus: 'COMPLETED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-20T09:10:00',
  },
  {
    ticketId: '4',
    ticketNo: 'TKT-20260512-004',
    ticketType: 'ASSET_RETURN',
    requestMethod: null,
    requestedItemName: 'iPhone 15 Pro Max 512GB',
    ticketStatus: 'DEPARTMENT_REJECTED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-12T11:30:00',
  },
  {
    ticketId: '5',
    ticketNo: 'TKT-20260508-005',
    ticketType: 'PURCHASE_RETURN',
    requestMethod: null,
    requestedItemName: 'MacBook Pro 14인치 M3 Max',
    ticketStatus: 'COMPLETED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-08T16:00:00',
  },
  {
    ticketId: '6',
    ticketNo: 'TKT-20260506-006',
    ticketType: 'PURCHASE_REQUEST',
    requestMethod: 'TEAM_PURCHASE',
    requestedItemName: 'IntelliJ IDEA Ultimate 연간 구독',
    ticketStatus: 'IN_PROGRESS',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-06T09:20:00',
  },
  {
    ticketId: '7',
    ticketNo: 'TKT-20260504-007',
    ticketType: 'PURCHASE_REQUEST',
    requestMethod: 'DIRECT_PURCHASE',
    requestedItemName: 'MX Keys S 무선 키보드',
    ticketStatus: 'IN_PROGRESS',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-04T13:40:00',
  },
  {
    ticketId: '8',
    ticketNo: 'TKT-20260502-008',
    ticketType: 'RENTAL_EXTENSION',
    requestMethod: null,
    requestedItemName: 'iPhone 15 Pro Max 512GB',
    ticketStatus: 'COMPLETED',
    requesterId: mockMemberId(5),
    requesterName: '정사원',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    requestedAt: '2026-05-02T11:10:00',
  },
]

const ticketReasons = new Map<string, string>([
  ['1', '업무용 표준 자산이 필요합니다.'],
  ['2', '외부 교육 기간 동안 사용할 장비가 필요합니다.'],
  ['3', '사용 중인 장비 점검이 필요합니다.'],
  ['4', '업무 종료로 자산을 반납합니다.'],
  ['5', '초기 불량으로 구매한 노트북의 반품을 요청합니다.'],
  ['6', '백엔드 개발 업무용 IDE 라이선스가 필요합니다.'],
  ['7', '재택근무 시 사용할 무선 키보드가 필요합니다.'],
  ['8', '프로젝트 일정 연장으로 대여 기간 연장이 필요합니다.'],
])

const ticketDetailData = new Map<string, Partial<TicketDetail>>([
  ['1', {
    detailStatus: '요청 접수',
    assetType: 'TANGIBLE',
    categoryName: '전산장비 (PC)',
    requestedItemName: 'MacBook Pro 14인치 M3 Max',
    quantity: 1,
  }],
  ['2', {
    detailStatus: '대여 자산 배정 완료',
    assetType: 'TANGIBLE',
    categoryName: '전산장비 (모니터)',
    requestedItemName: 'Dell UltraSharp 27인치 4K',
    quantity: 1,
    rentalStartDate: '2026-06-01T10:00:00',
    requestedDueDate: '2026-06-27T18:00:00',
    rentalDueDate: '2026-06-27T18:00:00',
  }],
  ['3', {
    detailStatus: '유지보수 완료',
    assetType: 'TANGIBLE',
    categoryName: '가구',
    requestedItemName: '에어론 체어 풀 스펙 B사이즈',
    assetId: '19',
    maintenanceReason: '사용 중인 장비 점검이 필요합니다.',
    maintenanceResult: '점검 완료',
  }],
  ['4', {
    detailStatus: '부서 반려',
    assetType: 'TANGIBLE',
    categoryName: '모바일 기기',
    requestedItemName: 'iPhone 15 Pro Max 512GB',
    assetId: '11',
    quantity: 1,
    startedAt: '2025-07-03T00:00:00',
    assetStatus: 'IN_USE',
    returnReason: '업무 종료로 자산을 반납합니다.',
  }],
  ['5', {
    detailStatus: '반품 및 환불 완료',
    assetType: 'TANGIBLE',
    categoryName: '전산장비 (PC)',
    requestedItemName: 'MacBook Pro 14인치 M3 Max',
    assetId: '2',
    returnReason: '초기 불량으로 구매한 노트북의 반품을 요청합니다.',
    collectedAt: '2026-05-08T18:00:00',
    returnResult: 'REFUNDED',
    refundAmount: 3500000,
    processedAt: '2026-05-09T14:30:00',
    assetStatus: 'RETURNED_TO_VENDOR',
  }],
  ['6', {
    detailStatus: '납품 확인 완료',
    requestedUsageType: 'PERSONAL',
    assetType: 'INTANGIBLE',
    categoryName: '개발 도구',
    requestedItemName: 'IntelliJ IDEA Ultimate 연간 구독',
    requestedItemDetail: 'IntelliJ IDEA Ultimate 연간 구독',
    quantity: 1,
    expectedPrice: 200000,
    actualAmount: 198000,
    orderedAt: '2026-05-07T10:00:00',
    receivedAt: '2026-05-08T11:30:00',
  }],
  ['7', {
    detailStatus: '직접 구매 진행 중',
    requestedUsageType: 'PERSONAL',
    assetType: 'TANGIBLE',
    categoryName: '전산장비 (주변기기)',
    requestedItemName: 'MX Keys S 무선 키보드',
    requestedItemDetail: '저소음 무선 키보드 / Graphite',
    quantity: 1,
    expectedPrice: 159000,
  }],
  ['8', {
    detailStatus: '반납 예정일 변경 완료',
    assetType: 'TANGIBLE',
    categoryName: '모바일 기기',
    requestedItemName: 'iPhone 15 Pro Max 512GB',
    assetId: '11',
    quantity: 1,
    previousDueDate: '2026-06-20T18:00:00',
    requestedDueDate: '2026-07-10T18:00:00',
    changedDueDate: '2026-07-10T18:00:00',
    processedAt: '2026-05-02T15:30:00',
  }],
])

const ticketApproverIds = new Map<string, string>()
const ticketCancelledAt = new Map<string, string>()
const ticketEvidenceFiles = new Map<string, string>()

let ticketComments: TicketComment[] = [
  {
    commentId: 1,
    ticketId: '1',
    writerId: mockMemberId(3),
    writerName: '이부장',
    writerRole: 'DEPARTMENT_MANAGER',
    content: '요청 내용을 확인했습니다. 필요한 사양을 댓글로 남겨주세요.',
    createdAt: '2026-06-01T10:20:00',
    updatedAt: '2026-06-01T10:20:00',
  },
  {
    commentId: 2,
    ticketId: '1',
    writerId: mockMemberId(5),
    writerName: '정사원',
    writerRole: 'EMPLOYEE',
    content: '개발 업무용으로 메모리 32GB 이상이 필요합니다.',
    createdAt: '2026-06-01T10:35:00',
    updatedAt: '2026-06-01T10:35:00',
  },
]

function withCurrentMemberCount(department: Department): Department {
  return {
    ...department,
    memberCount: members.filter(
      (member) => member.departmentId === department.departmentId,
    ).length,
  }
}

interface TangibleItem {
  assetItemId: string
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
}

type TangibleItemRequestBody = Partial<Omit<TangibleItem, 'assetItemId' | 'isStandard'>> & {
  itemCode?: string
  name?: string
  productName?: string
  isStandard?: number | boolean
}

const toMockStandardValue = (value: number | boolean | undefined, fallback = 1) => {
  if (typeof value === 'boolean') return value ? 1 : 0
  return value ?? fallback
}

interface IntangibleItem {
  assetItemId: string
  productName: string
  category: string
  categoryId?: string
  licenseType: string
  vendor: string
  isStandard: number
}

// 유형자산 품목 마스터 데이터 (30개) - ID를 string으로 변경
let tangibleItems: TangibleItem[] = [
  { assetItemId: '1', assetName: 'MacBook Pro 14인치 M3 Max', category: '노트북', manufacturer: 'Apple', modelName: 'A2992', isStandard: 1 },
  { assetItemId: '2', assetName: 'ThinkPad X1 Carbon Gen 12', category: '노트북', manufacturer: 'Lenovo', modelName: '21KC', isStandard: 0 },
  { assetItemId: '3', assetName: '시디즈 T80 하이엔드 의자', category: '사무가구', manufacturer: '시디즈', modelName: 'TN800HLDA', isStandard: 1 },
  { assetItemId: '4', assetName: 'MX Keys S 무선 팬터그래프', category: '주변기기', manufacturer: 'Logitech', modelName: 'KX800S', isStandard: 1 },
  { assetItemId: '5', assetName: '퍼시스 6인용 모듈러 회의 테이블', category: '사무가구', manufacturer: '퍼시스', modelName: 'CRN016', isStandard: 1 },
  { assetItemId: '6', assetName: 'iPhone 15 Pro Max 512GB', category: '스마트폰', manufacturer: 'Apple', modelName: 'A3106', isStandard: 1 },
  { assetItemId: '7', assetName: 'Galaxy S24 Ultra 자급제', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-S928N', isStandard: 1 },
  { assetItemId: '8', assetName: 'iPad Pro 13인치 M4 셀룰러', category: '태블릿', manufacturer: 'Apple', modelName: 'A3007', isStandard: 0 },
  { assetItemId: '9', assetName: 'MX Master 3S 무소음 마우스', category: '주변기기', manufacturer: 'Logitech', modelName: 'MX-M3S', isStandard: 1 },
  { assetItemId: '10', assetName: 'LG 27인치 QHD 에르고 모니터', category: '모니터', manufacturer: 'LG전자', modelName: '27QN880', isStandard: 1 },
  { assetItemId: '11', assetName: 'Galaxy Tab S9 Ultra 256GB', category: '태블릿', manufacturer: '삼성전자', modelName: 'SM-X910', isStandard: 1 },
  { assetItemId: '12', assetName: '에어론 체어 풀 스펙 B사이즈', category: '사무가구', manufacturer: 'Herman Miller', modelName: 'AERON-B', isStandard: 1 },
  { assetItemId: '13', assetName: 'Galaxy Book4 Ultra 코어Ultra9', category: '노트북', manufacturer: '삼성전자', modelName: 'NT960XGK', isStandard: 1 },
  { assetItemId: '14', assetName: '모션데스크 E0 스마트 1600', category: '사무가구', manufacturer: '데스커', modelName: 'DSMD1607', isStandard: 0 },
  { assetItemId: '15', assetName: '오디세이 OLED G9 게이밍 모니터', category: '모니터', manufacturer: '삼성전자', modelName: 'G95SC', isStandard: 0 },
  { assetItemId: '16', assetName: '가산 지사 복사기 렌탈 장비', category: '사무기기', manufacturer: 'Sindoh', modelName: 'D450-RENT', isStandard: 0 },
  { assetItemId: '17', assetName: 'Dell XPS 15 9530', category: '노트북', manufacturer: 'Dell', modelName: '9530', isStandard: 1 },
  { assetItemId: '18', assetName: 'HP EliteDragonfly G4', category: '노트북', manufacturer: 'HP', modelName: 'G4', isStandard: 1 },
  { assetItemId: '19', assetName: 'LG UltraFine 5K 모니터', category: '모니터', manufacturer: 'LG전자', modelName: '27MD5KL-B', isStandard: 1 },
  { assetItemId: '20', assetName: 'BenQ PD2725U 디자이너 모니터', category: '모니터', manufacturer: 'BenQ', modelName: 'PD2725U', isStandard: 0 },
  { assetItemId: '21', assetName: 'Apple Magic Keyboard', category: '주변기기', manufacturer: 'Apple', modelName: 'MQ052KH/A', isStandard: 1 },
  { assetItemId: '22', assetName: 'Samsung T7 Touch SSD 2TB', category: '주변기기', manufacturer: 'Samsung', modelName: 'MU-PC2T0T/KO', isStandard: 0 },
  { assetItemId: '23', assetName: 'Microsoft Surface Pro 9', category: '태블릿', manufacturer: 'Microsoft', modelName: 'QVG-00001', isStandard: 1 },
  { assetItemId: '24', assetName: 'Logitech Brio 500 웹캠', category: '주변기기', manufacturer: 'Logitech', modelName: '960-001399', isStandard: 1 },
  { assetItemId: '25', assetName: '시디즈 T50 사무용 의자', category: '사무가구', manufacturer: '시디즈', modelName: 'T50', isStandard: 0 },
  { assetItemId: '26', assetName: 'Samsung Galaxy Tab S9 FE', category: '태블릿', manufacturer: '삼성전자', modelName: 'SM-X510N', isStandard: 0 },
  { assetItemId: '27', assetName: 'MX Vertical 인체공학 마우스', category: '주변기기', manufacturer: 'Logitech', modelName: '910-005448', isStandard: 0 },
  { assetItemId: '28', assetName: 'Canon imageCLASS 복합기', category: '사무기기', manufacturer: 'Canon', modelName: 'MF746Cdw', isStandard: 1 },
  { assetItemId: '29', assetName: 'Brother 라벨프린터 QL-820NWB', category: '사무기기', manufacturer: 'Brother', modelName: 'QL-820NWB', isStandard: 0 },
  { assetItemId: '30', assetName: 'Samsung Galaxy Z Fold 5', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-F946N', isStandard: 1 },
  { assetItemId: '31', assetName: 'ABC 노트북 커버', category: '노트북 커버', manufacturer: '삼성전자', modelName: 'SM-46N', isStandard: 1 },
]

let tangibleCategoryGroups: TangibleCategoryGroup[] = [
  {
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    mainCategory: 'IT / 전자기기',
    subCategories: [
      '노트북',
      '노트북 커버',
      '모니터',
      '스마트폰',
      '태블릿',
      '주변기기'
    ],
    childCategories: {
      노트북: ['노트북 커버'],
      주변기기: ['키보드', '마우스', '웹캠', '외장 저장장치'],
    },
    subCategoryIds: {
      노트북: 'c0000000-0000-0000-0000-000000000011',
      주변기기: 'c0000000-0000-0000-0000-000000000012',
      모니터: 'c0000000-0000-0000-0000-000000000013',
      스마트폰: 'c0000000-0000-0000-0000-000000000014',
      태블릿: 'c0000000-0000-0000-0000-000000000015',
    },
    childCategoryIds: {
      '노트북 커버': 'c0000000-0000-0000-0000-000000000021',
      키보드: 'c0000000-0000-0000-0000-000000000022',
      마우스: 'c0000000-0000-0000-0000-000000000023',
      웹캠: 'c0000000-0000-0000-0000-000000000024',
      '외장 저장장치': 'c0000000-0000-0000-0000-000000000025',
    },
  },
  {
    categoryId: 'c0000000-0000-0000-0000-000000000002',
    mainCategory: '사무용 가구',
    subCategories: ['사무가구'],
    childCategories: {
      사무가구: ['의자', '책상', '회의 테이블'],
    },
    subCategoryIds: {
      사무가구: 'c0000000-0000-0000-0000-000000000031',
    },
    childCategoryIds: {
      의자: 'c0000000-0000-0000-0000-000000000032',
      책상: 'c0000000-0000-0000-0000-000000000033',
      '회의 테이블': 'c0000000-0000-0000-0000-000000000034',
    },
  },
  {
    categoryId: 'c0000000-0000-0000-0000-000000000003',
    mainCategory: '사무기기 / 가전',
    subCategories: ['사무기기'],
    childCategories: {
      사무기기: ['복합기', '라벨프린터'],
    },
    subCategoryIds: {
      사무기기: 'c0000000-0000-0000-0000-000000000041',
    },
    childCategoryIds: {
      복합기: 'c0000000-0000-0000-0000-000000000042',
      라벨프린터: 'c0000000-0000-0000-0000-000000000043',
    },
  },
]

// 무형자산 품목 마스터 데이터 (31개) - ID를 string으로 변경
let intangibleItems: IntangibleItem[] = [
  { assetItemId: '1', productName: 'Adobe Creative Cloud', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 1 },
  { assetItemId: '2', productName: 'Microsoft 365', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 1 },
  { assetItemId: '3', productName: 'Figma', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Figma', isStandard: 1 },
  { assetItemId: '4', productName: 'Slack', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Slack', isStandard: 1 },
  { assetItemId: '5', productName: 'GitHub Enterprise', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'GitHub', isStandard: 1 },
  { assetItemId: '6', productName: 'JetBrains All Products Pack', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'JetBrains', isStandard: 1 },
  { assetItemId: '7', productName: 'Notion', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Notion Labs', isStandard: 0 },
  { assetItemId: '8', productName: 'Zoom', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Zoom', isStandard: 1 },
  { assetItemId: '9', productName: 'Atlassian Jira Software', category: '업무용', licenseType: '사용자 수 라이선스', vendor: 'Atlassian', isStandard: 1 },
  { assetItemId: '10', productName: 'Atlassian Confluence', category: '업무용', licenseType: '사용자 수 라이선스', vendor: 'Atlassian', isStandard: 0 },
  { assetItemId: '11', productName: 'AWS Developer Tools', category: '개발툴', licenseType: '구독형 (SaaS)', vendor: 'Amazon Web Services', isStandard: 1 },
  { assetItemId: '12', productName: 'Slack Enterprise Grid', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Slack', isStandard: 1 },
  { assetItemId: '13', productName: 'Adobe Illustrator', category: '디자인', licenseType: '영구 라이선스', vendor: 'Adobe', isStandard: 0 },
  { assetItemId: '14', productName: 'Tableau', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Tableau', isStandard: 1 },
  { assetItemId: '15', productName: 'Salesforce CRM', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Salesforce', isStandard: 1 },
  { assetItemId: '16', productName: 'Dropbox Business', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Dropbox', isStandard: 0 },
  { assetItemId: '17', productName: 'Adobe Photoshop', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 1 },
  { assetItemId: '18', productName: 'GitHub Copilot', category: '개발툴', licenseType: '구독형 (SaaS)', vendor: 'GitHub', isStandard: 1 },
  { assetItemId: '19', productName: 'Microsoft Azure DevOps', category: '개발툴', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 0 },
  { assetItemId: '20', productName: 'Visual Studio Enterprise', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'Microsoft', isStandard: 1 },
  { assetItemId: '21', productName: 'Figma Organization', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Figma', isStandard: 1 },
  { assetItemId: '22', productName: 'Sketch', category: '디자인', licenseType: '영구 라이선스', vendor: 'Sketch', isStandard: 0 },
  { assetItemId: '23', productName: 'AhnLab V3', category: '보안', licenseType: '구독형 (SaaS)', vendor: 'AhnLab', isStandard: 1 },
  { assetItemId: '24', productName: 'McAfee Endpoint Security', category: '보안', licenseType: '볼륨 라이선스', vendor: 'McAfee', isStandard: 0 },
  { assetItemId: '25', productName: 'GitLab Ultimate', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'GitLab', isStandard: 1 },
  { assetItemId: '26', productName: 'Concur Expense', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'SAP Concur', isStandard: 1 },
  { assetItemId: '27', productName: 'Zendesk Support', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Zendesk', isStandard: 0 },
  { assetItemId: '28', productName: 'Miro', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Miro', isStandard: 1 },
  { assetItemId: '29', productName: 'Dropbox Sign', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Dropbox', isStandard: 1 },
  { assetItemId: '30', productName: 'HubSpot Marketing Hub', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'HubSpot', isStandard: 0 },
  { assetItemId: '31', productName: 'Grammarly Business', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Grammarly', isStandard: 1 },
]

// 유형자산 실물 데이터 (36개) - 모든 ID 필드를 string으로 정렬
let tangibleAssets: TangibleAsset[] = [
  { assetId: '1', assetCode: 'NBC-0001', serialNo: 'NB-C-01', assetItemId: '31', assetItemName: 'ABC 노트북 커버', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2025-01-20', warrantyExpiredAt: '2027-01-20', startedAt: '2025-01-25', returnDueDate: null, createdAt: '2025-01-20T09:00:00' },
  { assetId: '2', assetCode: 'TNG-0002', serialNo: 'SN-TNG-M3-02', assetItemId: '1', assetItemName: 'MacBook Pro 14인치 M3 Max', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-01-20', warrantyExpiredAt: '2027-01-20', startedAt: null, returnDueDate: null, createdAt: '2025-01-20T09:10:00' },
  { assetId: '3', assetCode: 'TNG-0003', serialNo: 'SN-TNG-M3-03', assetItemId: '1', assetItemName: 'MacBook Pro 14인치 M3 Max', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-03-10', warrantyExpiredAt: '2027-03-10', startedAt: '2025-03-12', returnDueDate: null, createdAt: '2025-03-10T11:00:00' },
  { assetId: '4', assetCode: 'TNG-0004', serialNo: 'SN-TNG-THINK-01', assetItemId: '2', assetItemName: 'ThinkPad X1 Carbon Gen 12', status: 'IN_USE', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', purchaseDate: '2025-03-05', warrantyExpiredAt: '2027-03-05', startedAt: '2025-03-15', returnDueDate: null, createdAt: '2025-03-05T10:30:00' },
  { assetId: '5', assetCode: 'TNG-0005', serialNo: 'SN-TNG-THINK-02', assetItemId: '2', assetItemName: 'ThinkPad X1 Carbon Gen 12', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-03-05', warrantyExpiredAt: '2027-03-05', startedAt: null, returnDueDate: null, createdAt: '2025-03-05T10:35:00' },
  { assetId: '6', assetCode: 'TNG-0006', serialNo: 'SN-TNG-SIDI-01', assetItemId: '3', assetItemName: '시디즈 T80 하이엔드 의자', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2024-11-18', warrantyExpiredAt: '2026-11-18', startedAt: '2024-11-20', returnDueDate: null, createdAt: '2024-11-18T14:15:00' },
  { assetId: '7', assetCode: 'TNG-0007', serialNo: 'SN-TNG-SIDI-02', assetItemId: '3', assetItemName: '시디즈 T80 하이엔드 의자', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-11-18', warrantyExpiredAt: '2026-11-18', startedAt: null, returnDueDate: null, createdAt: '2024-11-18T14:20:00' },
  { assetId: '8', assetCode: 'TNG-0008', serialNo: 'SN-TNG-MXK-01', assetItemId: '4', assetItemName: 'MX Keys S 무선 팬터그래프', status: 'IN_USE', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', purchaseDate: '2025-07-22', warrantyExpiredAt: '2027-07-22', startedAt: '2025-08-01', returnDueDate: null, createdAt: '2025-07-22T15:00:00' },
  { assetId: '9', assetCode: 'TNG-0009', serialNo: 'SN-TNG-MXK-02', assetItemId: '4', assetItemName: 'MX Keys S 무선 팬터그래프', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-07-22', warrantyExpiredAt: '2027-07-22', startedAt: '2025-07-25', returnDueDate: null, createdAt: '2025-07-22T15:05:00' },
  { assetId: '10', assetCode: 'TNG-0010', serialNo: 'SN-TNG-FUR-01', assetItemId: '4', assetItemName: 'MX Keys S 무선 팬터그래프', status: 'IN_USE', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-07-22', warrantyExpiredAt: '2027-07-22', startedAt: '2025-07-15', returnDueDate: null, createdAt: '2025-07-22T15:05:00' },
  { assetId: '11', assetCode: 'TNG-0011', serialNo: 'SN-TNG-IPH-01', assetItemId: '6', assetItemName: 'iPhone 15 Pro Max 512GB', status: 'IN_USE', usageType: 'TEMPORARY', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-06-30', warrantyExpiredAt: '2027-06-30', startedAt: '2025-07-03', returnDueDate: '2026-07-02', createdAt: '2025-06-30T11:00:00' },
  { assetId: '12', assetCode: 'TNG-0012', serialNo: 'SN-TNG-GAL-01', assetItemId: '7', assetItemName: 'Galaxy S24 Ultra 자급제', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-05-12', warrantyExpiredAt: '2027-05-12', startedAt: '2025-05-15', returnDueDate: null, createdAt: '2025-05-12T08:20:00' },
  { assetId: '13', assetCode: 'TNG-0013', serialNo: 'SN-TNG-IPAD-01', assetItemId: '8', assetItemName: 'iPad Pro 13인치 M4 셀룰러', status: 'REPAIR_REQUESTED', assignedMemberId: null, assignedMemberName: null, departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2024-10-08', warrantyExpiredAt: '2026-10-08', startedAt: null, returnDueDate: null, createdAt: '2024-10-08T13:50:00' },
  { assetId: '14', assetCode: 'TNG-0014', serialNo: 'SN-TNG-MXM-01', assetItemId: '9', assetItemName: 'MX Master 3S 무소음 마우스', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-04-18', warrantyExpiredAt: '2027-04-18', startedAt: null, returnDueDate: null, createdAt: '2025-04-18T10:00:00' },
  { assetId: '15', assetCode: 'TNG-0015', serialNo: 'SN-TNG-MXM-02', assetItemId: '9', assetItemName: 'MX Master 3S 무소음 마우스', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2025-04-18', warrantyExpiredAt: '2027-04-18', startedAt: '2025-04-20', returnDueDate: null, createdAt: '2025-04-18T10:05:00' },
  { assetId: '16', assetCode: 'TNG-0016', serialNo: 'SN-TNG-LGE-01', assetItemId: '10', assetItemName: 'LG 27인치 QHD 에르고 모니터', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2024-09-12', warrantyExpiredAt: '2026-09-12', startedAt: '2024-09-20', returnDueDate: null, createdAt: '2024-09-12T16:20:00' },
  { assetId: '17', assetCode: 'TNG-0017', serialNo: 'SN-TNG-LGE-02', assetItemId: '10', assetItemName: 'LG 27인치 QHD 에르고 모니터', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-09-12', warrantyExpiredAt: '2026-09-12', startedAt: null, returnDueDate: null, createdAt: '2024-09-12T16:25:00' },
  { assetId: '18', assetCode: 'TNG-0018', serialNo: 'SN-TNG-TAB-01', assetItemId: '11', assetItemName: 'Galaxy Tab S9 Ultra 256GB', status: 'RETURN_REQUESTED', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', purchaseDate: '2025-01-17', warrantyExpiredAt: '2027-01-17', startedAt: '2025-01-20', returnDueDate: '2026-01-19', createdAt: '2025-01-17T09:30:00' },
  { assetId: '19', assetCode: 'TNG-0019', serialNo: 'SN-TNG-HERM-01', assetItemId: '12', assetItemName: '에어론 체어 풀 스펙 B사이즈', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-08-25', warrantyExpiredAt: '2026-08-25', startedAt: null, returnDueDate: null, createdAt: '2024-08-25T11:10:00' },
  { assetId: '20', assetCode: 'TNG-0020', serialNo: 'SN-TNG-GB-01', assetItemId: '13', assetItemName: 'Galaxy Book4 Ultra 코어Ultra9', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2025-02-10', warrantyExpiredAt: '2027-02-10', startedAt: '2025-02-12', returnDueDate: null, createdAt: '2025-02-10T12:00:00' },
  { assetId: '21', assetCode: 'TNG-0021', serialNo: 'SN-TNG-DESK-01', assetItemId: '14', assetItemName: '모션데스크 E0 스마트 1600', status: 'DISPOSED', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2023-11-01', warrantyExpiredAt: '2025-11-01', startedAt: null, returnDueDate: null, createdAt: '2023-11-01T08:45:00' },
  { assetId: '22', assetCode: 'TNG-0022', serialNo: 'SN-TNG-DESK-02', assetItemId: '14', assetItemName: '모션데스크 E0 스마트 1600', status: 'IN_USE', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', purchaseDate: '2024-06-15', warrantyExpiredAt: '2026-06-15', startedAt: '2024-06-18', returnDueDate: null, createdAt: '2024-06-15T09:30:00' },
  { assetId: '23', assetCode: 'TNG-0023', serialNo: 'SN-TNG-OLED-01', assetItemId: '15', assetItemName: '오디세이 OLED G9 게이밍 모니터', status: 'REPAIRING', assignedMemberId: null, assignedMemberName: null, departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2024-12-07', warrantyExpiredAt: '2026-12-07', startedAt: null, returnDueDate: null, createdAt: '2024-12-07T13:30:00' },
  { assetId: '24', assetCode: 'TNG-0024', serialNo: 'SN-TNG-RENT-01', assetItemId: '16', assetItemName: '가산 지사 복사기 렌탈 장비', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-09-05', warrantyExpiredAt: '2027-09-05', startedAt: null, returnDueDate: null, createdAt: '2025-09-05T10:30:00' },
  { assetId: '25', assetCode: 'TNG-0025', serialNo: 'SN-TNG-XPS-01', assetItemId: '17', assetItemName: 'Dell XPS 15 9530', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', purchaseDate: '2025-04-08', warrantyExpiredAt: '2027-04-08', startedAt: '2025-04-15', returnDueDate: null, createdAt: '2025-04-08T09:25:00' },
  { assetId: '26', assetCode: 'TNG-0026', serialNo: 'SN-TNG-XPS-02', assetItemId: '17', assetItemName: 'Dell XPS 15 9530', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-04-08', warrantyExpiredAt: '2027-04-08', startedAt: null, returnDueDate: null, createdAt: '2025-04-08T09:30:00' },
  { assetId: '27', assetCode: 'TNG-0027', serialNo: 'SN-TNG-HP-01', assetItemId: '18', assetItemName: 'HP EliteDragonfly G4', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-08-14', warrantyExpiredAt: '2027-08-14', startedAt: null, returnDueDate: null, createdAt: '2025-08-14T11:40:00' },
  { assetId: '28', assetCode: 'TNG-0028', serialNo: 'SN-TNG-HP-02', assetItemId: '18', assetItemName: 'HP EliteDragonfly G4', status: 'RETURN_REQUESTED', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', purchaseDate: '2024-07-21', warrantyExpiredAt: '2026-07-21', startedAt: '2024-07-25', returnDueDate: '2025-07-24', createdAt: '2024-07-21T14:00:00' },
  { assetId: '29', assetCode: 'TNG-0029', serialNo: 'SN-TNG-BENQ-01', assetItemId: '20', assetItemName: 'BenQ PD2725U 디자이너 모니터', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-02-25', warrantyExpiredAt: '2027-02-25', startedAt: null, returnDueDate: null, createdAt: '2025-02-25T08:55:00' },
  { assetId: '30', assetCode: 'TNG-0030', serialNo: 'SN-TNG-APM-01', assetItemId: '21', assetItemName: 'Apple Magic Keyboard', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-01-30', warrantyExpiredAt: '2027-01-30', startedAt: null, returnDueDate: null, createdAt: '2025-01-30T12:20:00' },
  { assetId: '31', assetCode: 'TNG-0031', serialNo: 'SN-TNG-SSD-01', assetItemId: '22', assetItemName: 'Samsung T7 Touch SSD 2TB', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-11-11', warrantyExpiredAt: '2026-11-11', startedAt: null, returnDueDate: null, createdAt: '2024-11-11T10:50:00' },
  { assetId: '32', assetCode: 'TNG-0032', serialNo: 'SN-TNG-MS9-01', assetItemId: '23', assetItemName: 'Microsoft Surface Pro 9', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-03-03', warrantyExpiredAt: '2027-03-03', startedAt: null, returnDueDate: null, createdAt: '2025-03-03T15:10:00' },
  { assetId: '33', assetCode: 'TNG-0033', serialNo: 'SN-TNG-BRIO-01', assetItemId: '24', assetItemName: 'Logitech Brio 500 웹캠', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2025-07-09', warrantyExpiredAt: '2027-07-09', startedAt: null, returnDueDate: null, createdAt: '2025-07-09T09:15:00' },
  { assetId: '34', assetCode: 'TNG-0034', serialNo: 'SN-TNG-CAN-01', assetItemId: '28', assetItemName: 'Canon imageCLASS 복합기', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-05-14', warrantyExpiredAt: '2026-05-14', startedAt: null, returnDueDate: null, createdAt: '2024-05-14T11:45:00' },
  { assetId: '35', assetCode: 'TNG-0035', serialNo: 'SN-TNG-ZFL-01', assetItemId: '30', assetItemName: 'Samsung Galaxy Z Fold 5', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, purchaseDate: '2024-01-15', warrantyExpiredAt: '2026-01-15', startedAt: null, returnDueDate: null, createdAt: '2024-01-15T16:00:00' },
  { assetId: '36', assetCode: 'TNG-0036', serialNo: 'SN-TNG-RENT-02', assetItemId: '17', assetItemName: 'Dell XPS 15 9530', status: 'IN_USE', usageType: 'TEMPORARY', assignedMemberId: '5', assignedMemberName: '정사원', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', purchaseDate: '2026-05-20', warrantyExpiredAt: '2028-05-20', startedAt: '2026-06-01', returnDueDate: '2026-06-30', createdAt: '2026-05-20T10:00:00' },
]

// 무형자산 실물 데이터 (35개) - 모든 ID 필드를 string으로 정렬
let intangibleAssets: IntangibleAsset[] = [
  { assetId: '1', assetCode: 'INT-0001', assetItemId: '1', assetItemName: 'Adobe Creative Cloud', licenseType: 'SUBSCRIPTION', licenseKey: 'ADOBE-CC-LIC01', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-01-10', expiredAt: '2026-01-10', vendor: 'Adobe', purchasePrice: 1200000, createdAt: '2025-01-10T10:00:00' },
  { assetId: '2', assetCode: 'INT-0002', assetItemId: '1', assetItemName: 'Adobe Creative Cloud', licenseType: 'SUBSCRIPTION', licenseKey: 'ADOBE-CC-LIC02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-01-10', vendor: 'Adobe', purchasePrice: 1200000, createdAt: '2025-01-10T10:05:00' },
  { assetId: '3', assetCode: 'INT-0003', assetItemId: '2', assetItemName: 'Microsoft 365', licenseType: 'SUBSCRIPTION', licenseKey: 'MS365-LIC01', status: 'IN_USE', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', startedAt: '2025-02-01', expiredAt: '2026-02-01', vendor: 'Microsoft', purchasePrice: 850000, createdAt: '2025-02-01T10:15:00' },
  { assetId: '4', assetCode: 'INT-0004', assetItemId: '2', assetItemName: 'Microsoft 365', licenseType: 'SUBSCRIPTION', licenseKey: 'MS365-LIC02', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-02-01', expiredAt: '2026-02-01', vendor: 'Microsoft', purchasePrice: 850000, createdAt: '2025-02-01T10:20:00' },
  { assetId: '5', assetCode: 'INT-0005', assetItemId: '2', assetItemName: 'Microsoft 365', licenseType: 'SUBSCRIPTION', licenseKey: 'MS365-LIC03', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-02-01', vendor: 'Microsoft', purchasePrice: 850000, createdAt: '2025-02-01T10:25:00' },
  { assetId: '6', assetCode: 'INT-0006', assetItemId: '3', assetItemName: 'Figma', licenseType: 'SUBSCRIPTION', licenseKey: 'FIGMA-ACC-01', status: 'EXPIRING_SOON', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2024-11-01', expiredAt: '2025-11-01', vendor: 'Figma', purchasePrice: 750000, createdAt: '2024-11-01T09:20:00' },
  { assetId: '7', assetCode: 'INT-0007', assetItemId: '3', assetItemName: 'Figma', licenseType: 'SUBSCRIPTION', licenseKey: 'FIGMA-ACC-02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2025-11-01', vendor: 'Figma', purchasePrice: 750000, createdAt: '2024-11-01T09:25:00' },
  { assetId: '8', assetCode: 'INT-0008', assetItemId: '4', assetItemName: 'Slack', licenseType: 'SUBSCRIPTION', licenseKey: 'SLACK-WS-01', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2025-03-15', expiredAt: '2026-03-15', vendor: 'Slack', purchasePrice: 450000, createdAt: '2025-03-15T14:00:00' },
  { assetId: '9', assetCode: 'INT-0009', assetItemId: '5', assetItemName: 'GitHub Enterprise', licenseType: 'USER_BASED', licenseKey: 'GH-ENT-KEY01', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-05-10', expiredAt: '2026-05-10', vendor: 'GitHub', purchasePrice: 980000, createdAt: '2025-05-10T11:00:00' },
  { assetId: '10', assetCode: 'INT-0010', assetItemId: '6', assetItemName: 'JetBrains All Products Pack', licenseType: 'USER_BASED', licenseKey: 'JB-ALL-KEY01', status: 'IN_USE', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', startedAt: '2025-01-22', expiredAt: '2026-01-22', vendor: 'JetBrains', purchasePrice: 650000, createdAt: '2025-01-22T16:30:00' },
  { assetId: '11', assetCode: 'INT-0011', assetItemId: '6', assetItemName: 'JetBrains All Products Pack', licenseType: 'USER_BASED', licenseKey: 'JB-ALL-KEY02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-01-22', vendor: 'JetBrains', purchasePrice: 650000, createdAt: '2025-01-22T16:35:00' },
  { assetId: '12', assetCode: 'INT-0012', assetItemId: '8', assetItemName: 'Zoom', licenseType: 'SUBSCRIPTION', licenseKey: 'ZOOM-ROOM-01', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2024-09-20', expiredAt: '2026-09-20', vendor: 'Zoom', purchasePrice: 330000, createdAt: '2024-09-20T09:55:00' },
  { assetId: '13', assetCode: 'INT-0013', assetItemId: '8', assetItemName: 'Zoom', licenseType: 'SUBSCRIPTION', licenseKey: 'ZOOM-ROOM-02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-09-20', vendor: 'Zoom', purchasePrice: 330000, createdAt: '2024-09-20T10:00:00' },
  { assetId: '14', assetCode: 'INT-0014', assetItemId: '9', assetItemName: 'Atlassian Jira Software', licenseType: 'USER_BASED', licenseKey: 'JIRA-LIC-01', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-04-10', expiredAt: '2026-04-10', vendor: 'Atlassian', purchasePrice: 680000, createdAt: '2025-04-10T09:50:00' },
  { assetId: '15', assetCode: 'INT-0015', assetItemId: '10', assetItemName: 'Atlassian Confluence', licenseType: 'USER_BASED', licenseKey: 'CONF-LIC-01', status: 'IN_USE', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2025-01-05', expiredAt: '2026-01-05', vendor: 'Atlassian', purchasePrice: 520000, createdAt: '2025-01-05T11:20:00' },
  { assetId: '16', assetCode: 'INT-0016', assetItemId: '11', assetItemName: 'AWS Developer Tools', licenseType: 'SUBSCRIPTION', licenseKey: 'AWS-LIC-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2027-05-18', vendor: 'Amazon Web Services', purchasePrice: 550000, createdAt: '2025-05-18T10:40:00' },
  { assetId: '17', assetCode: 'INT-0017', assetItemId: '12', assetItemName: 'Slack Enterprise Grid', licenseType: 'SUBSCRIPTION', licenseKey: 'SLACK-ENT-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-08-12', vendor: 'Slack', purchasePrice: 1500000, createdAt: '2025-08-12T13:15:00' },
  { assetId: '18', assetCode: 'INT-0018', assetItemId: '14', assetItemName: 'Tableau', licenseType: 'SUBSCRIPTION', licenseKey: 'TAB-LIC-01', status: 'IN_USE', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2025-03-01', expiredAt: '2026-03-01', vendor: 'Tableau', purchasePrice: 920000, createdAt: '2025-03-01T14:20:00' },
  { assetId: '19', assetCode: 'INT-0019', assetItemId: '15', assetItemName: 'Salesforce CRM', licenseType: 'SUBSCRIPTION', licenseKey: 'SF-CRM-LIC01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-06-25', vendor: 'Salesforce', purchasePrice: 2100000, createdAt: '2025-06-25T11:00:00' },
  { assetId: '20', assetCode: 'INT-0020', assetItemId: '17', assetItemName: 'Adobe Photoshop', licenseType: 'SUBSCRIPTION', licenseKey: 'ADOBE-PS-LIC01', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-01-15', expiredAt: '2026-01-15', vendor: 'Adobe', purchasePrice: 480000, createdAt: '2025-01-15T09:40:00' },
  { assetId: '21', assetCode: 'INT-0021', assetItemId: '17', assetItemName: 'Adobe Photoshop', licenseType: 'SUBSCRIPTION', licenseKey: 'ADOBE-PS-LIC02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-01-15', vendor: 'Adobe', purchasePrice: 480000, createdAt: '2025-01-15T09:45:00' },
  { assetId: '22', assetCode: 'INT-0022', assetItemId: '18', assetItemName: 'GitHub Copilot', licenseType: 'SUBSCRIPTION', licenseKey: 'COP-LIC-01', status: 'IN_USE', assignedMemberId: '4', assignedMemberName: '최휴직', departmentId: FRONTEND_DEPARTMENT_ID, departmentName: '프론트엔드팀', startedAt: '2025-05-01', expiredAt: '2026-05-01', vendor: 'GitHub', purchasePrice: 280000, createdAt: '2025-05-01T09:40:00' },
  { assetId: '23', assetCode: 'INT-0024', assetItemId: '18', assetItemName: 'GitHub Copilot', licenseType: 'SUBSCRIPTION', licenseKey: 'COP-LIC-02', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-05-01', expiredAt: '2026-05-01', vendor: 'GitHub', purchasePrice: 280000, createdAt: '2025-05-01T09:45:00' },
  { assetId: '24', assetCode: 'INT-0025', assetItemId: '19', assetItemName: 'Microsoft Azure DevOps', licenseType: 'SUBSCRIPTION', licenseKey: 'AZDO-LIC-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2027-10-12', vendor: 'Microsoft', purchasePrice: 660000, createdAt: '2025-10-12T10:00:00' },
  { assetId: '25', assetCode: 'INT-0026', assetItemId: '20', assetItemName: 'Visual Studio Enterprise', licenseType: 'USER_BASED', licenseKey: 'VS-LIC-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2027-03-20', vendor: 'Microsoft', purchasePrice: 1300000, createdAt: '2025-03-20T10:05:00' },
  { assetId: '26', assetCode: 'INT-0027', assetItemId: '21', assetItemName: 'Figma Organization', licenseType: 'SUBSCRIPTION', licenseKey: 'FIGORG-LIC-01', status: 'IN_USE', assignedMemberId: '3', assignedMemberName: '이부장', departmentId: PLATFORM_DEPARTMENT_ID, departmentName: '플랫폼개발본부', startedAt: '2025-04-15', expiredAt: '2026-04-15', vendor: 'Figma', purchasePrice: 1800000, createdAt: '2025-04-15T11:20:00' },
  { assetId: '27', assetCode: 'INT-0028', assetItemId: '23', assetItemName: 'AhnLab V3', licenseType: 'SUBSCRIPTION', licenseKey: 'V3-ENT-LIC01', status: 'IN_USE', assignedMemberId: '1', assignedMemberName: '김관리', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2025-01-05', expiredAt: '2026-01-05', vendor: 'AhnLab', purchasePrice: 150000, createdAt: '2025-01-05T09:10:00' },
  { assetId: '28', assetCode: 'INT-0029', assetItemId: '23', assetItemName: 'AhnLab V3', licenseType: 'SUBSCRIPTION', licenseKey: 'V3-ENT-LIC02', status: 'IN_USE', assignedMemberId: '2', assignedMemberName: '박자산', departmentId: ASSET_TEAM_DEPARTMENT_ID, departmentName: '구매자산팀', startedAt: '2025-01-05', expiredAt: '2026-01-05', vendor: 'AhnLab', purchasePrice: 150000, createdAt: '2025-01-05T09:15:00' },
  { assetId: '29', assetCode: 'INT-0030', assetItemId: '25', assetItemName: 'GitLab Ultimate', licenseType: 'USER_BASED', licenseKey: 'GL-ULT-KEY01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-11-20', vendor: 'GitLab', purchasePrice: 1100000, createdAt: '2025-11-20T10:30:00' },
  { assetId: '30', assetCode: 'INT-0031', assetItemId: '26', assetItemName: 'Concur Expense', licenseType: 'SUBSCRIPTION', licenseKey: 'SAP-CONCUR-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-05-14', vendor: 'SAP Concur', purchasePrice: 880000, createdAt: '2025-05-14T15:00:00' },
  { assetId: '31', assetCode: 'INT-0032', assetItemId: '26', assetItemName: 'Concur Expense', licenseType: 'SUBSCRIPTION', licenseKey: 'SAP-CONCUR-02', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2026-05-14', vendor: 'SAP Concur', purchasePrice: 880000, createdAt: '2025-05-14T15:05:00' },
  { assetId: '32', assetCode: 'INT-0033', assetItemId: '28', assetItemName: 'Miro', licenseType: 'SUBSCRIPTION', licenseKey: 'MIRO-LIC-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2027-06-12', vendor: 'Miro', purchasePrice: 520000, createdAt: '2025-06-12T10:10:00' },
  { assetId: '33', assetCode: 'INT-0034', assetItemId: '29', assetItemName: 'Dropbox Sign', licenseType: 'SUBSCRIPTION', licenseKey: 'DBS-LIC-01', status: 'AVAILABLE', assignedMemberId: null, assignedMemberName: null, departmentId: null, departmentName: null, startedAt: null, expiredAt: '2027-09-02', vendor: 'Dropbox', purchasePrice: 290000, createdAt: '2025-09-02T09:45:00' }
]

function normalizeAssignedMemberId(memberId: string | null | undefined): string | null {
  if (!memberId || !/^\d+$/.test(memberId)) return memberId ?? null
  return mockMemberId(Number(memberId))
}

tangibleAssets.forEach((asset) => {
  asset.assignedMemberId = normalizeAssignedMemberId(asset.assignedMemberId)
})

intangibleAssets.forEach((asset) => {
  asset.assignedMemberId = normalizeAssignedMemberId(asset.assignedMemberId)
})

type MockAssignmentStatus = 'ASSIGNED' | 'RETURNED' | 'CANCELED' | 'EXPIRED'
type MockAssignmentType = 'TEMPORARY' | 'PERMANENT'

interface MockTangibleAssetAssignment {
  assignmentId: string
  assetId: string
  memberId: string
  memberName: string
  memberNo: string
  departmentName: string
  assignmentType: MockAssignmentType
  assetUsageType: 'PERSONAL' | 'DEPARTMENT'
  assignedAt: string
  endedAt: string | null
  assignmentStatus: MockAssignmentStatus
}

interface MockIntangibleAssetAssignment {
  assignmentId: string
  assetId: string
  memberId: string
  memberName: string
  memberNo: string
  departmentId: string
  departmentName: string
  assignedAt: string
  endedAt: string | null
  assignmentStatus: MockAssignmentStatus | 'ACTIVE' | 'ENDED'
}

const memberById = (memberId: string) => members.find((member) => member.memberId === memberId)

let tangibleAssignmentSequence = 1
let tangibleAssetAssignments: MockTangibleAssetAssignment[] = tangibleAssets
  .filter((asset) => asset.assignedMemberId)
  .map((asset) => {
    const member = memberById(asset.assignedMemberId ?? '')
    return {
      assignmentId: `assignment-${tangibleAssignmentSequence++}`,
      assetId: String(asset.assetId),
      memberId: asset.assignedMemberId ?? '',
      memberName: member?.name ?? asset.assignedMemberName ?? '-',
      memberNo: member?.memberNo ?? '-',
      departmentName: member?.departmentName ?? asset.departmentName ?? '-',
      assignmentType: (asset.usageType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT') as MockAssignmentType,
      assetUsageType: asset.assetUsageType === 'DEPARTMENT' ? 'DEPARTMENT' : 'PERSONAL',
      assignedAt: asset.startedAt?.includes('T') ? asset.startedAt : `${asset.startedAt ?? '2026-06-01'}T09:00:00`,
      endedAt: asset.returnDueDate ? (asset.returnDueDate.includes('T') ? asset.returnDueDate : `${asset.returnDueDate}T18:00:00`) : null,
      assignmentStatus: 'ASSIGNED',
    }
  })

function createTangibleAssignment(asset: TangibleAsset, body: {
  memberId: string
  usageType?: MockAssignmentType
  assetUsageType?: 'PERSONAL' | 'DEPARTMENT'
  endedAt?: string | null
}): MockTangibleAssetAssignment {
  const member = memberById(body.memberId)

  return {
    assignmentId: `assignment-${tangibleAssignmentSequence++}`,
    assetId: String(asset.assetId),
    memberId: body.memberId,
    memberName: member?.name ?? '-',
    memberNo: member?.memberNo ?? '-',
    departmentName: member?.departmentName ?? '-',
    assignmentType: body.usageType ?? 'PERMANENT',
    assetUsageType: body.assetUsageType ?? 'PERSONAL',
    assignedAt: new Date().toISOString().slice(0, 19),
    endedAt: body.endedAt ?? null,
    assignmentStatus: 'ASSIGNED',
  }
}

function applyAssignmentToAsset(asset: TangibleAsset, assignment: MockTangibleAssetAssignment) {
  asset.status = 'IN_USE'
  asset.tangibleAssetStatus = 'IN_USE'
  asset.assignedMemberId = assignment.memberId
  asset.assignedMemberName = assignment.memberName
  asset.departmentId = memberById(assignment.memberId)?.departmentId ?? asset.departmentId ?? null
  asset.departmentName = assignment.departmentName
  asset.usageType = assignment.assignmentType
  asset.assetUsageType = assignment.assetUsageType
  asset.startedAt = assignment.assignedAt
  asset.returnDueDate = assignment.endedAt
}

function closeActiveAssignments(assetId: string, endedAt = new Date().toISOString().slice(0, 19)) {
  tangibleAssetAssignments = tangibleAssetAssignments.map((assignment) => (
    assignment.assetId === assetId && assignment.assignmentStatus === 'ASSIGNED'
      ? { ...assignment, assignmentStatus: 'RETURNED', endedAt: assignment.endedAt ?? endedAt }
      : assignment
  ))
}

let intangibleAssignmentSequence = 1
let intangibleAssetAssignments: MockIntangibleAssetAssignment[] = intangibleAssets
  .filter((asset) => asset.assignedMemberId)
  .map((asset) => {
    const member = memberById(asset.assignedMemberId ?? '')
    return {
      assignmentId: `intangible-assignment-${intangibleAssignmentSequence++}`,
      assetId: String(asset.assetId),
      memberId: asset.assignedMemberId ?? '',
      memberName: member?.name ?? asset.assignedMemberName ?? '-',
      memberNo: member?.memberNo ?? '-',
      departmentId: member?.departmentId ?? asset.departmentId ?? '',
      departmentName: member?.departmentName ?? asset.departmentName ?? '-',
      assignedAt: asset.startedAt?.includes('T') ? asset.startedAt : `${asset.startedAt ?? '2026-06-01'}T09:00:00`,
      endedAt: asset.expiredAt ? (asset.expiredAt.includes('T') ? asset.expiredAt : `${asset.expiredAt}T18:00:00`) : null,
      assignmentStatus: 'ACTIVE',
    }
  })

function createIntangibleAssignment(asset: IntangibleAsset, body: {
  memberId: string
  endedAt?: string | null
}): MockIntangibleAssetAssignment {
  const member = memberById(body.memberId)

  return {
    assignmentId: `intangible-assignment-${intangibleAssignmentSequence++}`,
    assetId: String(asset.assetId),
    memberId: body.memberId,
    memberName: member?.name ?? '-',
    memberNo: member?.memberNo ?? '-',
    departmentId: member?.departmentId ?? '',
    departmentName: member?.departmentName ?? '-',
    assignedAt: new Date().toISOString().slice(0, 19),
    endedAt: body.endedAt ?? null,
    assignmentStatus: 'ACTIVE',
  }
}

function applyIntangibleAssignmentToAsset(asset: IntangibleAsset, assignment: MockIntangibleAssetAssignment) {
  asset.status = 'IN_USE'
  asset.intangibleAssetStatus = 'IN_USE'
  asset.assignedMemberId = assignment.memberId
  asset.assignedMemberName = assignment.memberName
  asset.departmentId = assignment.departmentId || null
  asset.departmentName = assignment.departmentName
  asset.startedAt = assignment.assignedAt
}

function closeActiveIntangibleAssignments(
  assetId: string,
  memberId?: string | null,
  endedAt = new Date().toISOString().slice(0, 19),
) {
  intangibleAssetAssignments = intangibleAssetAssignments.map((assignment) => {
    const isTargetAsset = assignment.assetId === assetId
    const isTargetMember = !memberId || assignment.memberId === memberId
    const isActive = assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'

    return isTargetAsset && isTargetMember && isActive
      ? { ...assignment, assignmentStatus: 'ENDED', endedAt: assignment.endedAt ?? endedAt }
      : assignment
  })
}

function toLoginResponse(member: Member): LoginResponse {
  return {
    companyId: MOCK_COMPANY_ID,
    memberId: member.memberId,
    memberNo: member.memberNo,
    name: member.name,
    email: member.email ?? '',
    departmentId: member.departmentId,
    departmentName: member.departmentName,
    role: member.role,
    status: member.status,
    accessToken: `mock-access-token-${member.memberNo}`,
    refreshToken: `mock-refresh-token-${member.memberNo}`,
  }
}

function getAuthenticatedMember(request: Request): Member | undefined {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer mock-access-token-')) return undefined

  const memberNo = authHeader.replace('Bearer mock-access-token-', '')
  return members.find((member) => member.memberNo === memberNo)
}

function getDepartmentManager(departmentId: string): Member | undefined {
  return members.find((member) => (
    member.departmentId === departmentId
    && member.role === 'DEPARTMENT_MANAGER'
    && member.status === 'ACTIVE'
  ))
}

function getTicketApprover(ticket: MockTicket): Member | undefined {
  const assignedApproverId = ticketApproverIds.get(ticket.ticketId)
  if (assignedApproverId) {
    return members.find((member) => member.memberId === assignedApproverId)
  }

  const requester = members.find((member) => member.memberId === ticket.requesterId)
  return requester ? getDepartmentManager(requester.departmentId) : undefined
}

function memberSequence(member: Member): number {
  return Number(member.memberNo.replace(/\D/g, ''))
}

function getMockItemName(
  assetType: StandardAssetRequestCreate['assetType'],
  assetItemId: string | number,
): string | null {
  const itemId = String(assetItemId)

  if (assetType === 'INTANGIBLE') {
    return intangibleItems.find((item) => item.assetItemId === itemId)?.productName ?? null
  }

  return tangibleItems.find((item) => item.assetItemId === itemId)?.assetName ?? null
}

function getMockAssetName(
  assetType: ReturnRequestCreate['assetType'],
  assetId: string,
): string | null {
  if (assetType === 'INTANGIBLE') {
    return intangibleAssets.find((asset) => asset.assetId === assetId)?.assetItemName ?? null
  }

  return tangibleAssets.find((asset) => asset.assetId === assetId)?.assetItemName ?? null
}

function createMockTicket(
  request: Request,
  ticketType: TicketType,
  requestReason: string,
  assetItemName: string | null,
  requestMethod?: PurchaseRequestMethod,
  detailData?: Partial<TicketDetail>,
): TicketCreateResponse {
  const requester = getAuthenticatedMember(request)
  const nextTicketId = Math.max(0, ...tickets.map((ticket) => Number(ticket.ticketId))) + 1
  const ticketId = String(nextTicketId)
  const createdAt = new Date().toISOString()
  const datePart = createdAt.slice(0, 10).replaceAll('-', '')
  const requesterId = requester?.memberId ?? mockMemberId(nextTicketId)

  const ticket: MockTicket = {
    ticketId,
    ticketNo: `TKT-${datePart}-${String(ticketId).padStart(3, '0')}`,
    ticketType,
    requestMethod: requestMethod ?? null,
    requestedItemName: assetItemName,
    ticketStatus: 'REQUESTED',
    requesterId,
    requesterName: requester?.name ?? '요청자',
    departmentId: requester?.departmentId ?? FRONTEND_DEPARTMENT_ID,
    departmentName: requester?.departmentName ?? '미지정',
    requestedAt: createdAt,
  }

  tickets = [ticket, ...tickets]
  ticketReasons.set(ticketId, requestReason)
  ticketDetailData.set(ticketId, {
    requestedItemName: assetItemName,
    ...detailData,
  })
  const departmentManager = requester
    ? getDepartmentManager(requester.departmentId)
    : undefined
  if (departmentManager) {
    ticketApproverIds.set(ticketId, departmentManager.memberId)
  }

  return {
    ticketId: ticket.ticketId,
    ticketNo: ticket.ticketNo,
    ticketType: ticket.ticketType,
    ticketStatus: ticket.ticketStatus,
    createdAt: ticket.requestedAt,
  }
}

function toTicketListItem(ticket: MockTicket): TicketListItem {
  return {
    ticketId: ticket.ticketId,
    ticketNo: ticket.ticketNo,
    ticketType: ticket.ticketType,
    requestMethod: ticket.requestMethod,
    requestedItemName: ticket.requestedItemName,
    requestedAt: ticket.requestedAt,
    ticketStatus: ticket.ticketStatus,
  }
}

export const handlers = [
  http.get(`${API_PREFIX}/logs/audit`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const filteredLogs = filterLogsByRequest(auditLogs, request)

    return HttpResponse.json(ok(
      pageOf(filteredLogs, page, size),
      '감사 로그 목록 조회에 성공했습니다.',
    ))
  }),

  http.get(`${API_PREFIX}/logs/activity`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const filteredLogs = filterLogsByRequest(activityLogs, request)

    return HttpResponse.json(ok(
      pageOf(filteredLogs, page, size),
      '활동 로그 목록 조회에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/auth/login`, async ({ request }) => {
    const credentials = await request.json() as LoginRequest
    const member = members.find((item) => item.memberNo === credentials.memberNo)

    if (
      credentials.companyCode !== MOCK_COMPANY_CODE ||
      !member ||
      memberPasswords.get(member.memberNo) !== credentials.password
    ) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'BAD_REQUEST',
        message: '회사 코드, 사번 또는 비밀번호가 일치하지 않습니다.',
        data: null,
      }, { status: 400 })
    }

    return HttpResponse.json(ok(toLoginResponse(member), '로그인에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/auth/logout`, () => {
    return HttpResponse.json(ok(null, '로그아웃되었습니다.'))
  }),

  http.get(`${API_PREFIX}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '인증되지 않은 요청입니다.',
        data: null,
      }, { status: 401 })
    }

    const empNo = authHeader.replace('Bearer mock-access-token-', '')
    const member = members.find((item) => item.memberNo === empNo)

    if (!member) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '사용자를 찾을 수 없습니다.',
        data: null,
      }, { status: 401 })
    }

    return HttpResponse.json(ok(toLoginResponse(member)))
  }),

  http.patch(`${API_PREFIX}/auth/password`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '인증 정보가 올바르지 않습니다.',
        data: null,
      }, { status: 401 })
    }

    const body = await request.json() as PasswordChangeRequest
    const empNo = authHeader.replace('Bearer mock-access-token-', '')

    if (memberPasswords.get(empNo) !== body.currentPassword) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'PASSWORD_MISMATCH',
        message: '현재 비밀번호가 일치하지 않습니다.',
        data: null,
      }, { status: 400 })
    }

    memberPasswords.set(empNo, body.newPassword)
    return HttpResponse.json(ok(null, '비밀번호가 성공적으로 변경되었습니다.'))
  }),

  http.get(`${API_PREFIX}/tickets`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    const ticketType = url.searchParams.get('ticketType') as TicketType | null
    const ticketStatus = url.searchParams.get('ticketStatus') as TicketStatus | null
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase() ?? ''
    const requesterId = url.searchParams.get('requesterId')
    const departmentId = url.searchParams.get('departmentId')
    const requester = getAuthenticatedMember(request)

    let filteredTickets = [...tickets]
    if (requester?.role === 'EMPLOYEE') {
      filteredTickets = tickets.filter((ticket) => ticket.requesterId === requester.memberId)
    } else if (requester?.role === 'DEPARTMENT_MANAGER') {
      filteredTickets = tickets.filter((ticket) => (
        ticket.departmentId === requester.departmentId
      ))
    }

    if (ticketType) {
      filteredTickets = filteredTickets.filter((ticket) => ticket.ticketType === ticketType)
    }
    if (ticketStatus) {
      filteredTickets = filteredTickets.filter((ticket) => ticket.ticketStatus === ticketStatus)
    }
    if (keyword) {
      filteredTickets = filteredTickets.filter((ticket) => (
        ticket.ticketNo.toLowerCase().includes(keyword)
        || ticket.requestedItemName?.toLowerCase().includes(keyword)
      ))
    }
    if (requesterId) {
      filteredTickets = filteredTickets.filter((ticket) => ticket.requesterId === requesterId)
    }
    if (departmentId) {
      filteredTickets = filteredTickets.filter((ticket) => ticket.departmentId === departmentId)
    }

    return HttpResponse.json(ok(pageOf(filteredTickets.map(toTicketListItem), page, size)))
  }),

  http.get(`${API_PREFIX}/tickets/:ticketId`, ({ params }) => {
    const ticketId = String(params.ticketId)
    const ticket = tickets.find((item) => item.ticketId === ticketId)

    if (!ticket) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'TICKET_NOT_FOUND',
        message: '티켓을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const isDepartmentRejected = ticket.ticketStatus === 'DEPARTMENT_REJECTED'
    const departmentApprover = getTicketApprover(ticket)
    const isAssetRejected = ticket.ticketStatus === 'ASSET_REJECTED'
    const isAssetApproved = [
      'ASSET_APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
    ].includes(ticket.ticketStatus)
    const hasDepartmentDecision = ticket.ticketStatus !== 'REQUESTED'
    const hasAssetTeamAssignee = [
      'ASSET_APPROVED',
      'ASSET_REJECTED',
      'IN_PROGRESS',
      'COMPLETED',
    ].includes(ticket.ticketStatus)
    const departmentDecisionAt = hasDepartmentDecision
      ? new Date(new Date(ticket.requestedAt).getTime() + 60 * 60 * 1000).toISOString()
      : null
    const cancellationDate = ticketCancelledAt.get(ticketId)
    const updatedAt = cancellationDate
      ?? (ticket.ticketStatus === 'REQUESTED'
        ? ticket.requestedAt
        : new Date(new Date(ticket.requestedAt).getTime() + 2 * 60 * 60 * 1000).toISOString())
    const assetDecisionAt = isAssetApproved || isAssetRejected ? updatedAt : null
    const requestDetail = ticketDetailData.get(ticketId) ?? {}

    const detail: TicketDetail = {
      ticketId: ticket.ticketId,
      ticketNo: ticket.ticketNo,
      ticketType: ticket.ticketType,
      requestMethod: ticket.requestMethod,
      status: ticket.ticketStatus,
      detailStatus: null,
      requesterId: ticket.requesterId,
      requesterName: ticket.requesterName,
      departmentId: ticket.departmentId,
      departmentName: ticket.departmentName,
      approverId: departmentApprover ? memberSequence(departmentApprover) : null,
      approverName: departmentApprover?.name ?? null,
      assigneeId: hasAssetTeamAssignee ? 2 : null,
      assigneeName: hasAssetTeamAssignee ? '박자산' : null,
      requestReason: ticketReasons.get(ticketId) ?? null,
      ...requestDetail,
      departmentApprovedAt: hasDepartmentDecision && !isDepartmentRejected
        ? departmentDecisionAt
        : null,
      departmentRejectedAt: isDepartmentRejected ? departmentDecisionAt : null,
      departmentRejectionReason: isDepartmentRejected ? '요청 사유를 보완해주세요.' : null,
      purchaseApprovedAt: isAssetApproved ? assetDecisionAt : null,
      purchaseRejectedAt: isAssetRejected ? assetDecisionAt : null,
      purchaseRejectionReason: isAssetRejected ? '구매자산팀 검토 결과 반려되었습니다.' : null,
      orderedAt: requestDetail.orderedAt ?? null,
      receivedAt: requestDetail.receivedAt ?? null,
      registeredAt: requestDetail.registeredAt ?? null,
      completedAt: requestDetail.completedAt
        ?? (ticket.ticketStatus === 'COMPLETED' ? updatedAt : null),
      cancelledAt: ticket.ticketStatus === 'CANCELLED' ? updatedAt : null,
      requestedAt: ticket.requestedAt,
      updatedAt,
    }

    return HttpResponse.json(ok(detail))
  }),

  http.patch(`${API_PREFIX}/tickets/:ticketId/status`, async ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const ticket = tickets.find((item) => item.ticketId === ticketId)
    const requester = getAuthenticatedMember(request)

    if (!ticket) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'TICKET_NOT_FOUND',
        message: '티켓을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const body = await request.json() as { status?: string }
    if (!body.status || !TICKET_STATUS_VALUES.has(body.status as TicketStatus)) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_TICKET_STATUS',
        message: '올바르지 않은 티켓 상태입니다.',
        data: null,
      }, { status: 400 })
    }

    const nextStatus = body.status as TicketStatus
    if (nextStatus === 'CANCELLED') {
      if (!requester || requester.memberId !== ticket.requesterId) {
        return HttpResponse.json({
          status: 403,
          errorCode: 'FORBIDDEN',
          message: '요청자 본인만 티켓을 취소할 수 있습니다.',
          data: null,
        }, { status: 403 })
      }
      if (!CANCELLABLE_TICKET_STATUSES.has(ticket.ticketStatus)) {
        return HttpResponse.json({
          status: 409,
          errorCode: 'TICKET_CANNOT_BE_CANCELLED',
          message: '현재 상태에서는 티켓을 취소할 수 없습니다.',
          data: null,
        }, { status: 409 })
      }
    }

    const previousStatus = ticket.ticketStatus
    const updatedAt = new Date().toISOString()
    ticket.ticketStatus = nextStatus
    if (nextStatus === 'CANCELLED') {
      ticketCancelledAt.set(ticketId, updatedAt)
    }

    return HttpResponse.json(ok({
      ticketId,
      previousStatus,
      currentStatus: nextStatus,
      updatedAt,
    }, '티켓 상태 변경에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/tickets/:ticketId/actual-amount`, async ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const ticket = tickets.find((item) => item.ticketId === ticketId)
    const requester = getAuthenticatedMember(request)

    if (!ticket) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'TICKET_NOT_FOUND',
        message: '티켓을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }
    if (!requester || requester.memberId !== ticket.requesterId) {
      return HttpResponse.json({
        status: 403,
        errorCode: 'FORBIDDEN',
        message: '요청자 본인만 실제 결제 금액을 입력할 수 있습니다.',
        data: null,
      }, { status: 403 })
    }
    if (
      ticket.ticketType !== 'PURCHASE_REQUEST'
      || ticket.requestMethod !== 'DIRECT_PURCHASE'
      || !DIRECT_PURCHASE_PAYMENT_STATUSES.has(ticket.ticketStatus)
    ) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'INVALID_DIRECT_PURCHASE_STATUS',
        message: '구매자산팀 승인 후 직접 구매 티켓에만 결제 금액을 입력할 수 있습니다.',
        data: null,
      }, { status: 409 })
    }

    const body = await request.json() as { actualPrice?: number }
    if (!Number.isInteger(body.actualPrice) || Number(body.actualPrice) <= 0) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_ACTUAL_PRICE',
        message: '실제 결제 금액을 올바르게 입력해주세요.',
        data: null,
      }, { status: 400 })
    }

    const actualPrice = Number(body.actualPrice)
    const requestDetail = ticketDetailData.get(ticketId) ?? {}
    const expectedPrice = requestDetail.expectedPrice ?? 0
    const updatedAt = new Date().toISOString()
    ticketDetailData.set(ticketId, {
      ...requestDetail,
      actualAmount: actualPrice,
    })

    return HttpResponse.json(ok({
      ticketId,
      expectedPrice,
      actualPrice,
      priceDifference: actualPrice - expectedPrice,
      requiresReapproval: false,
      updatedAt,
    }, '실제 결제 금액 입력에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/tickets/:ticketId/evidences`, async ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const ticket = tickets.find((item) => item.ticketId === ticketId)
    const requester = getAuthenticatedMember(request)

    if (!ticket) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'TICKET_NOT_FOUND',
        message: '티켓을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }
    if (!requester || requester.memberId !== ticket.requesterId) {
      return HttpResponse.json({
        status: 403,
        errorCode: 'FORBIDDEN',
        message: '요청자 본인만 구매 증빙을 업로드할 수 있습니다.',
        data: null,
      }, { status: 403 })
    }
    if (
      ticket.ticketType !== 'PURCHASE_REQUEST'
      || ticket.requestMethod !== 'DIRECT_PURCHASE'
      || !DIRECT_PURCHASE_PAYMENT_STATUSES.has(ticket.ticketStatus)
    ) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'INVALID_DIRECT_PURCHASE_STATUS',
        message: '구매자산팀 승인 후 직접 구매 티켓에만 증빙을 업로드할 수 있습니다.',
        data: null,
      }, { status: 409 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_EVIDENCE_FILE',
        message: '업로드할 증빙 파일을 선택해주세요.',
        data: null,
      }, { status: 400 })
    }

    const updatedAt = new Date().toISOString()
    ticketEvidenceFiles.set(ticketId, file.name)

    return HttpResponse.json(ok({
      ticketId,
      purchaseDate: updatedAt.slice(0, 10),
      updatedAt,
    }, '구매 증빙 업로드에 성공했습니다.'))
  }),

  http.get(`${API_PREFIX}/tickets/:ticketId/comments`, ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const comments = ticketComments.filter((comment) => comment.ticketId === ticketId)

    return HttpResponse.json(ok(pageOf(comments, page, size)))
  }),

  http.post(`${API_PREFIX}/tickets/:ticketId/comments`, async ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const ticket = tickets.find((item) => item.ticketId === ticketId)
    const writer = getAuthenticatedMember(request)

    if (!ticket) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'TICKET_NOT_FOUND',
        message: '티켓을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }
    if (!writer) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '인증되지 않은 요청입니다.',
        data: null,
      }, { status: 401 })
    }

    const body = await request.json() as { content?: string }
    const content = body.content?.trim()
    if (!content) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_COMMENT',
        message: '댓글 내용을 입력해주세요.',
        data: null,
      }, { status: 400 })
    }

    const createdAt = new Date().toISOString()
    const comment: TicketComment = {
      commentId: Math.max(0, ...ticketComments.map((item) => item.commentId)) + 1,
      ticketId,
      writerId: writer.memberId,
      writerName: writer.name,
      writerRole: writer.role,
      content,
      createdAt,
      updatedAt: createdAt,
    }
    ticketComments = [...ticketComments, comment]

    return HttpResponse.json(ok(comment, '티켓 댓글 등록에 성공했습니다.'))
  }),

  http.patch(`${API_PREFIX}/tickets/:ticketId/comments/:commentId`, async ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const commentId = Number(params.commentId)
    const writer = getAuthenticatedMember(request)
    const commentIndex = ticketComments.findIndex((comment) => (
      comment.ticketId === ticketId && comment.commentId === commentId
    ))

    if (!writer) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '인증되지 않은 요청입니다.',
        data: null,
      }, { status: 401 })
    }
    if (commentIndex < 0) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'COMMENT_NOT_FOUND',
        message: '댓글을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const currentComment = ticketComments[commentIndex]
    if (!currentComment || currentComment.writerId !== writer.memberId) {
      return HttpResponse.json({
        status: 403,
        errorCode: 'COMMENT_FORBIDDEN',
        message: '본인이 작성한 댓글만 수정할 수 있습니다.',
        data: null,
      }, { status: 403 })
    }

    const body = await request.json() as { content?: string }
    const content = body.content?.trim()
    if (!content) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_COMMENT',
        message: '댓글 내용을 입력해주세요.',
        data: null,
      }, { status: 400 })
    }

    const updatedComment: TicketComment = {
      ...currentComment,
      content,
      updatedAt: new Date().toISOString(),
    }
    ticketComments[commentIndex] = updatedComment

    return HttpResponse.json(ok(updatedComment, '티켓 댓글 수정에 성공했습니다.'))
  }),

  http.delete(`${API_PREFIX}/tickets/:ticketId/comments/:commentId`, ({ params, request }) => {
    const ticketId = String(params.ticketId)
    const commentId = Number(params.commentId)
    const writer = getAuthenticatedMember(request)
    const commentIndex = ticketComments.findIndex((comment) => (
      comment.ticketId === ticketId && comment.commentId === commentId
    ))

    if (!writer) {
      return HttpResponse.json({
        status: 401,
        errorCode: 'UNAUTHORIZED',
        message: '인증되지 않은 요청입니다.',
        data: null,
      }, { status: 401 })
    }
    if (commentIndex < 0) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'COMMENT_NOT_FOUND',
        message: '댓글을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const comment = ticketComments[commentIndex]
    if (!comment || comment.writerId !== writer.memberId) {
      return HttpResponse.json({
        status: 403,
        errorCode: 'COMMENT_FORBIDDEN',
        message: '본인이 작성한 댓글만 삭제할 수 있습니다.',
        data: null,
      }, { status: 403 })
    }

    const deletedAt = new Date().toISOString()
    ticketComments.splice(commentIndex, 1)

    return HttpResponse.json(ok(
      { commentId, deletedAt },
      '티켓 댓글 삭제에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/asset-requests/standard`, async ({ request }) => {
    const body = await request.json() as StandardAssetRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'ASSET_REQUEST',
        body.requestReason,
        getMockItemName(body.assetType, body.assetItemId),
        undefined,
        {
          requestedUsageType: body.requestedUsageType,
          assetType: body.assetType,
          quantity: body.quantity,
        },
      ),
      '표준 자산 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/purchase-requests/non-standard`, async ({ request }) => {
    const body = await request.json() as NonStandardAssetRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'PURCHASE_REQUEST',
        body.requestReason,
        body.requestedItemDetail,
        'TEAM_PURCHASE',
        {
          requestedUsageType: body.requestedUsageType,
          assetType: body.assetType,
          requestedItemDetail: body.requestedItemDetail,
          quantity: body.quantity,
          expectedPrice: body.expectedPrice,
        },
      ),
      '비표준 자산 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/purchase-requests/direct-purchase`, async ({ request }) => {
    const body = await request.json() as DirectPurchaseRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'PURCHASE_REQUEST',
        body.requestReason,
        body.requestedItemDetail,
        'DIRECT_PURCHASE',
        {
          requestedUsageType: body.requestedUsageType,
          assetType: body.assetType,
          requestedItemDetail: body.requestedItemDetail,
          quantity: body.quantity,
          expectedPrice: body.expectedPrice,
        },
      ),
      '직접 구매 자산 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/rentals`, async ({ request }) => {
    const body = await request.json() as RentalRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'RENTAL',
        body.requestReason,
        getMockItemName('TANGIBLE', body.tangibleAssetItemId),
        undefined,
        {
          requestedUsageType: body.requestedUsageType,
          assetType: 'TANGIBLE',
          quantity: 1,
          rentalStartDate: body.rentalStartDate,
          requestedDueDate: body.requestedDueDate,
          rentalDueDate: body.requestedDueDate,
        },
      ),
      '대여 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/rental-extensions`, async ({ request }) => {
    const body = await request.json() as RentalExtensionRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'RENTAL_EXTENSION',
        body.requestReason,
        getMockAssetName('TANGIBLE', body.assetId),
        undefined,
        {
          assetType: 'TANGIBLE',
          assetId: body.assetId,
          quantity: 1,
          requestedDueDate: body.requestedDueDate,
        },
      ),
      '대여 연장 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/maintenance-requests`, async ({ request }) => {
    const body = await request.json() as MaintenanceRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'MAINTENANCE_REQUEST',
        body.maintenanceReason,
        getMockAssetName('TANGIBLE', body.assetId),
        undefined,
        {
          assetType: 'TANGIBLE',
          assetId: body.assetId,
          maintenanceReason: body.maintenanceReason,
        },
      ),
      '유지보수 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/returns`, async ({ request }) => {
    const body = await request.json() as ReturnRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'ASSET_RETURN',
        body.returnReason,
        getMockAssetName(body.assetType, body.assetId),
        undefined,
        {
          assetType: body.assetType,
          assetId: body.assetId,
          quantity: 1,
          returnReason: body.returnReason,
        },
      ),
      '자산 반납 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.post(`${API_PREFIX}/tickets/purchase-returns`, async ({ request }) => {
    const body = await request.json() as PurchaseReturnRequestCreate
    return HttpResponse.json(ok(
      createMockTicket(
        request,
        'PURCHASE_RETURN',
        body.returnReason,
        getMockAssetName(body.assetType, body.assetId),
        undefined,
        {
          assetType: body.assetType,
          assetId: body.assetId,
          returnReason: body.returnReason,
        },
      ),
      '반품 요청 티켓 등록에 성공했습니다.',
    ))
  }),

  http.get(`${API_PREFIX}/members`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0) as number
    const size = Number(url.searchParams.get('size') ?? 10) as number
    const departmentId = url.searchParams.get('departmentId') ?? ''
    const role = url.searchParams.get('role') ?? ''
    const status = url.searchParams.get('status') ?? ''
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? ''

    let filteredMembers = [...members]

    if (departmentId) {
      filteredMembers = filteredMembers.filter((item) => item.departmentId === departmentId)
    }
    if (role) {
      filteredMembers = filteredMembers.filter((item) => item.role === role)
    }
    if (status) {
      filteredMembers = filteredMembers.filter((item) => item.status === status)
    }
    if (keyword) {
      filteredMembers = filteredMembers.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.memberNo.toLowerCase().includes(keyword) ||
          (item.email && item.email.toLowerCase().includes(keyword)),
      )
    }

    return HttpResponse.json(ok(pageOf(filteredMembers, page, size)))
  }),

  http.post(`${API_PREFIX}/members`, async ({ request }) => {
    const body = await request.json() as MemberRegisterRequest
    const department = departments.find((item) => item.departmentId === body.departmentId)
    const normalizedEmail = body.email?.toLowerCase()

    if (members.some((item) => item.memberNo === body.memberNo)) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'MEMBER_NO_ALREADY_EXISTS',
        message: '이미 사용 중인 사번입니다.',
        data: null,
      }, { status: 409 })
    }

    if (
      normalizedEmail
      && members.some((item) => item.email?.toLowerCase() === normalizedEmail)
    ) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'MEMBER_EMAIL_ALREADY_EXISTS',
        message: '이미 사용 중인 이메일입니다.',
        data: null,
      }, { status: 409 })
    }

    if (!department || department.parentDepartmentId === null) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '사원이 소속될 부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const member: Member = {
      memberId: crypto.randomUUID(),
      memberNo: body.memberNo,
      name: body.name,
      email: body.email ?? null,
      departmentId: body.departmentId,
      departmentName: department.name,
      departmentNamePath: getDepartmentNamePath(department.departmentId),
      role: body.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }

    members = [member, ...members]
    memberPasswords.set(member.memberNo, member.memberNo)
    return HttpResponse.json(ok(member, '사원이 등록되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/members/:memberId/resign`, ({ params }) => {
    const memberId = String(params.memberId)
    const member = members.find((item) => item.memberId === memberId)

    if (!member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'MEMBER_NOT_FOUND',
        message: '사원을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    member.status = 'RESIGNED'
    return HttpResponse.json(ok({
      memberId: member.memberId,
      memberNo: member.memberNo,
      name: member.name,
      status: member.status,
      returnedTangibleAssetCount: 2,
      returnedIntangibleAssetCount: 1,
      resignedAt: new Date().toISOString(),
    }, '퇴사 처리가 완료되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/members/:memberId/department`, async ({ params, request }) => {
    const memberId = String(params.memberId)
    const body = await request.json() as DepartmentChangeRequest
    const member = members.find((item) => item.memberId === memberId)
    const department = departments.find((item) => item.departmentId === body.departmentId)

    if (!member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'MEMBER_NOT_FOUND',
        message: '사원을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    if (member.status === 'RESIGNED') {
      return HttpResponse.json({
        status: 409,
        errorCode: 'RESIGNED_MEMBER_CANNOT_CHANGE_DEPARTMENT',
        message: '퇴사 처리된 사원은 부서를 변경할 수 없습니다.',
        data: null,
      }, { status: 409 })
    }

    if (!department || department.parentDepartmentId === null) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '변경할 부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    if (member.departmentId === department.departmentId) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'SAME_DEPARTMENT',
        message: '현재 소속 부서와 다른 부서를 선택해주세요.',
        data: null,
      }, { status: 409 })
    }

    const previousDepartmentId = member.departmentId
    const previousDepartmentName = member.departmentName
    member.departmentId = department.departmentId
    member.departmentName = department.name
    member.departmentNamePath = getDepartmentNamePath(department.departmentId)

    return HttpResponse.json(ok({
      memberId: member.memberId,
      memberNo: member.memberNo,
      name: member.name,
      previousDepartmentId,
      previousDepartmentName,
      currentDepartmentId: department.departmentId,
      currentDepartmentName: department.name,
      updatedAt: new Date().toISOString(),
    }, '소속 부서가 변경되었습니다.'))
  }),

  http.get(`${API_PREFIX}/tangible-asset/categories`, () => {
    return HttpResponse.json(ok(tangibleCategoryGroups))
  }),

  http.post(`${API_PREFIX}/tangible-asset/categories`, async ({ request }) => {
    const body = await request.json() as { name?: string; parentId?: string | null }
    const categoryId = crypto.randomUUID()
    const name = body.name?.trim() ?? ''

    if (!name) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_CATEGORY_NAME',
        message: '카테고리명을 입력해주세요.',
        data: null,
      }, { status: 400 })
    }

    if (!body.parentId) {
      tangibleCategoryGroups.push({
        categoryId,
        mainCategory: name,
        subCategories: [],
        childCategories: {},
        subCategoryIds: {},
        childCategoryIds: {},
      })
    } else {
      const parentGroup = tangibleCategoryGroups.find((group) => group.categoryId === body.parentId)
      const parentMiddleGroup = tangibleCategoryGroups.find((group) =>
        Object.values(group.subCategoryIds ?? {}).includes(body.parentId ?? ''),
      )

      if (parentGroup) {
        parentGroup.subCategories.push(name)
        parentGroup.childCategories = {
          ...(parentGroup.childCategories ?? {}),
          [name]: [],
        }
        parentGroup.subCategoryIds = {
          ...(parentGroup.subCategoryIds ?? {}),
          [name]: categoryId,
        }
      } else if (parentMiddleGroup) {
        const parentMiddleName = Object.entries(parentMiddleGroup.subCategoryIds ?? {})
          .find(([, id]) => id === body.parentId)?.[0]

        if (parentMiddleName) {
          parentMiddleGroup.subCategories.push(name)
          parentMiddleGroup.childCategories = {
            ...(parentMiddleGroup.childCategories ?? {}),
            [parentMiddleName]: [
              ...(parentMiddleGroup.childCategories?.[parentMiddleName] ?? []),
              name,
            ],
          }
          parentMiddleGroup.childCategoryIds = {
            ...(parentMiddleGroup.childCategoryIds ?? {}),
            [name]: categoryId,
          }
        }
      }
    }

    return HttpResponse.json(ok({
      categoryId,
      name,
      parentId: body.parentId ?? null,
    }, '유형자산 카테고리가 등록되었습니다.'))
  }),

  http.delete(`${API_PREFIX}/tangible-asset/categories/:categoryId`, ({ params }) => {
    const categoryId = String(params.categoryId)

    tangibleCategoryGroups = tangibleCategoryGroups
      .filter((group) => group.categoryId !== categoryId)
      .map((group) => {
        const middleName = Object.entries(group.subCategoryIds ?? {})
          .find(([, id]) => id === categoryId)?.[0]
        const smallName = Object.entries(group.childCategoryIds ?? {})
          .find(([, id]) => id === categoryId)?.[0]

        if (middleName) {
          const smallCategories = group.childCategories?.[middleName] ?? []
          return {
            ...group,
            subCategories: group.subCategories.filter((name) => name !== middleName && !smallCategories.includes(name)),
            childCategories: Object.fromEntries(
              Object.entries(group.childCategories ?? {}).filter(([name]) => name !== middleName),
            ),
            subCategoryIds: Object.fromEntries(
              Object.entries(group.subCategoryIds ?? {}).filter(([name]) => name !== middleName),
            ),
            childCategoryIds: Object.fromEntries(
              Object.entries(group.childCategoryIds ?? {}).filter(([name]) => !smallCategories.includes(name)),
            ),
          }
        }

        if (smallName) {
          return {
            ...group,
            subCategories: group.subCategories.filter((name) => name !== smallName),
            childCategories: Object.fromEntries(
              Object.entries(group.childCategories ?? {}).map(([name, values]) => [
                name,
                values.filter((value) => value !== smallName),
              ]),
            ),
            childCategoryIds: Object.fromEntries(
              Object.entries(group.childCategoryIds ?? {}).filter(([name]) => name !== smallName),
            ),
          }
        }

        return group
      })

    return HttpResponse.json(ok({
      categoryId,
      deletedAt: new Date().toISOString(),
    }, '유형자산 카테고리가 삭제되었습니다.'))
  }),

  http.get(`${API_PREFIX}/tangible-asset/items`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const categoryName = url.searchParams.get('categoryName') ?? ''
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? ''
    const assetUsageType = url.searchParams.get('assetUsageType') ?? ''

    let filteredItems = [...tangibleItems]

    if (categoryName && categoryName !== '전체 자산 품목' && categoryName !== '전체 품목 보기') {
      filteredItems = filteredItems.filter((item) => item.category === categoryName)
    }

    if (keyword) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.assetName.toLowerCase().includes(keyword) ||
          item.manufacturer.toLowerCase().includes(keyword) ||
          item.modelName.toLowerCase().includes(keyword),
      )
    }

    if (assetUsageType) {
      filteredItems = filteredItems.filter((item) => tangibleAssets.some((asset) => {
        if (asset.assetItemId !== item.assetItemId) return false
        const usageScope = asset.assetUsageType
          ?? (asset.assignedMemberId ? 'PERSONAL' : 'DEPARTMENT')
        return usageScope === assetUsageType
      }))
    }

    const itemsWithCounts = filteredItems.map((item) => {
      const totalAssets = tangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId)
      const stockCount = totalAssets.length
      const availableCount = totalAssets.filter((asset) => asset.status === 'AVAILABLE').length

      return {
        assetItemId: item.assetItemId,
        itemNo: `ITEM-${item.assetItemId.padStart(4, '0')}`,
        productName: item.assetName,
        assetName: item.assetName,
        name: item.assetName,
        category: item.category,
        manufacturer: item.manufacturer,
        modelName: item.modelName,
        vendor: '공식 공급처',
        purchasePrice: 1500000,
        assetCount: stockCount,
        stockCount,
        availableCount,
        isStandard: item.isStandard,
        createdAt: '2025-01-01T09:00:00',
      }
    })

    return HttpResponse.json(ok({
      content: itemsWithCounts.slice(page * size, page * size + size),
      page,
      size,
      totalElements: itemsWithCounts.length,
      totalPages: Math.ceil(itemsWithCounts.length / size),
    }))
  }),

  http.get(`${API_PREFIX}/tangible-asset/items/:itemId`, ({ params }) => {
    const itemId = String(params.itemId)
    const item = tangibleItems.find((entry) => entry.assetItemId === itemId)

    if (!item) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ITEM_NOT_FOUND',
        message: '품목을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const totalAssets = tangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId)
    const stockCount = totalAssets.length

    return HttpResponse.json(ok({
      assetItemId: item.assetItemId,
      itemNo: `ITEM-${item.assetItemId.padStart(4, '0')}`,
      productName: item.assetName,
      assetName: item.assetName,
      name: item.assetName,
      category: item.category,
      manufacturer: item.manufacturer,
      modelName: item.modelName,
      vendor: '공식 공급처',
      purchasePrice: 1500000,
      assetCount: stockCount,
      stockCount,
      availableCount: totalAssets.filter((asset) => asset.status === 'AVAILABLE').length,
      isStandard: item.isStandard,
      createdAt: '2025-01-01T09:00:00',
    }))
  }),

  http.post(`${API_PREFIX}/tangible-asset/items`, async ({ request }) => {
    const body = await request.json() as TangibleItemRequestBody
    const nextId = String(Math.max(...tangibleItems.map((item) => Number(item.assetItemId))) + 1)
    const itemName = body.productName ?? body.assetName ?? body.name ?? body.itemCode ?? ''
    const newItem: TangibleItem = {
      assetItemId: nextId,
      assetName: itemName,
      category: body.category ?? '미분류',
      manufacturer: body.manufacturer ?? '',
      modelName: body.modelName ?? '',
      isStandard: toMockStandardValue(body.isStandard),
    }

    tangibleItems = [newItem, ...tangibleItems]
    return HttpResponse.json(ok(newItem, '유형자산 품목이 등록되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/tangible-asset/items/:itemId`, async ({ params, request }) => {
    const assetItemId = String(params.itemId)
    const body = await request.json() as TangibleAssetItemUpdateRequest
    const item = tangibleItems.find((entry) => entry.assetItemId === assetItemId)

    if (!item) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ITEM_NOT_FOUND',
        message: '품목을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    item.assetName = body.productName ?? body.assetName ?? body.name ?? item.assetName
    item.category = body.category ?? item.category
    item.manufacturer = body.manufacturer ?? item.manufacturer
    item.modelName = body.modelName ?? item.modelName
    item.isStandard = toMockStandardValue(body.isStandard, item.isStandard)

    tangibleAssets.forEach((asset) => {
      if (asset.assetItemId === assetItemId) {
        asset.assetItemName = item.assetName
      }
    })

    return HttpResponse.json(ok({
      assetItemId: item.assetItemId,
      itemNo: `ITEM-${item.assetItemId.padStart(4, '0')}`,
      productName: item.assetName,
      assetName: item.assetName,
      name: item.assetName,
      category: item.category,
      manufacturer: item.manufacturer,
      modelName: item.modelName,
      vendor: '공식 공급처',
      purchasePrice: 1500000,
      stockCount: tangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId).length,
      availableCount: tangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId && asset.status === 'AVAILABLE').length,
      isStandard: item.isStandard,
      createdAt: '2025-01-01T09:00:00',
    }, '유형자산 품목이 수정되었습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/items/bulk`, async ({ request }) => {
    try {
      await request.formData()
    } catch {
      return HttpResponse.json({
        status: 400,
        errorCode: 'INVALID_FILE',
        message: '업로드 파일을 처리할 수 없습니다.',
        data: null,
      }, { status: 400 })
    }
    return HttpResponse.json(ok(null, '유형자산 품목 일괄 업로드가 완료되었습니다.'))
  }),

  http.get(`${API_PREFIX}/intangible-asset/items`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const category = url.searchParams.get('category') ?? ''
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? ''
    const assetUsageType = url.searchParams.get('assetUsageType') ?? ''

    let filteredItems = [...intangibleItems]

    if (category && category !== '전체 소프트웨어 타입') {
      filteredItems = filteredItems.filter((item) => item.category === category)
    }

    if (keyword) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.productName.toLowerCase().includes(keyword) ||
          item.vendor.toLowerCase().includes(keyword) ||
          item.category.toLowerCase().includes(keyword) ||
          item.licenseType.toLowerCase().includes(keyword),
      )
    }

    if (assetUsageType) {
      filteredItems = filteredItems.filter((item) => intangibleAssets.some((asset) => {
        if (asset.assetItemId !== item.assetItemId) return false
        const usageScope = asset.assignedMemberId ? 'PERSONAL' : 'DEPARTMENT'
        return usageScope === assetUsageType
      }))
    }

    const itemsWithAssetCount = filteredItems.map((item) => ({
      assetItemId: item.assetItemId,
      productName: item.productName,
      category: item.category,
      licenseType: item.licenseType,
      isStandard: item.isStandard,
      itemNo: `SW-${item.assetItemId!.padStart(4, '0')}`,
      name: item.productName,
      vendor: item.vendor,
      softwareType: item.category,
      stockCount: intangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId).length,
      availableCount: intangibleAssets.filter((asset) => asset.assetItemId === item.assetItemId && asset.status === 'AVAILABLE').length,
      createdAt: '2025-01-01T09:00:00',
    }))

    return HttpResponse.json(ok({
      content: itemsWithAssetCount.slice(page * size, page * size + size),
      page,
      size,
      totalElements: itemsWithAssetCount.length,
      totalPages: Math.ceil(itemsWithAssetCount.length / size),
    }))
  }),

  http.get(`${API_PREFIX}/intangible-asset/categories`, () => {
    return HttpResponse.json(ok([...new Set(intangibleItems.map((item) => item.category))]))
  }),

  http.post(`${API_PREFIX}/assets/intangible/items`, async ({ request }) => {
    const body = await request.json() as Omit<IntangibleItem, 'assetItemId'>
    const nextId = String(Math.max(...intangibleItems.map((item) => Number(item.assetItemId || 0))) + 1)
    const newItem: IntangibleItem = {
      assetItemId: nextId,
      ...body,
    }

    intangibleItems = [newItem, ...intangibleItems]
    return HttpResponse.json(ok(newItem, '무형자산 품목이 등록되었습니다.'))
  }),

  http.delete(`${API_PREFIX}/assets/intangible/items/:assetItemId`, ({ params }) => {
    const assetItemId = String(params.assetItemId)
    const existingItem = intangibleItems.find((item) => item.assetItemId === assetItemId)

    if (!existingItem) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ITEM_NOT_FOUND',
        message: '품목을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const assetExists = intangibleAssets.some((asset) => asset.assetItemId === assetItemId)
    if (assetExists) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'ITEM_HAS_ASSETS',
        message: '자산이 존재하는 품목은 삭제할 수 없습니다.',
        data: null,
      }, { status: 400 })
    }

    intangibleItems = intangibleItems.filter((item) => item.assetItemId !== assetItemId)
    return HttpResponse.json(ok(null, '무형자산 품목이 삭제되었습니다.'))
  }),

  http.delete(`${API_PREFIX}/tangible-asset/items/:itemId`, ({ params }) => {
    const assetItemId = String(params.itemId)
    const existingItem = tangibleItems.find((item) => item.assetItemId === assetItemId)

    if (!existingItem) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ITEM_NOT_FOUND',
        message: '품목을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const assetExists = tangibleAssets.some((asset) => asset.assetItemId === assetItemId)
    if (assetExists) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'ITEM_HAS_ASSETS',
        message: '자산이 존재하는 품목은 삭제할 수 없습니다.',
        data: null,
      }, { status: 400 })
    }

    tangibleItems = tangibleItems.filter((item) => item.assetItemId !== assetItemId)
    return HttpResponse.json(ok(null, '유형자산 품목이 삭제되었습니다.'))
  }),

  http.get(`${API_PREFIX}/tangible-asset/assets`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const status = url.searchParams.get('status') ?? ''
    const categoryName = url.searchParams.get('categoryName') ?? ''
    const departmentId = url.searchParams.get('departmentId') ?? ''
    const memberId = url.searchParams.get('memberId') ?? ''
    const assetItemId = url.searchParams.get('assetItemId') ?? ''
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? ''

    let filteredAssets = [...tangibleAssets]

    if (status) {
      filteredAssets = filteredAssets.filter((asset) => asset.status === status)
    }
    if (categoryName && categoryName !== '전체 품목 보기') {
      const itemIds = tangibleItems
        .filter((item) => item.category === categoryName)
        .map((item) => item.assetItemId)
      filteredAssets = filteredAssets.filter((asset) => itemIds.includes(asset.assetItemId ?? ''))
    }
    if (departmentId) {
      filteredAssets = filteredAssets.filter((asset) => asset.departmentId === departmentId)
    }
    if (memberId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assignedMemberId === memberId)
    }
    if (assetItemId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assetItemId === assetItemId)
    }
    if (keyword) {
      filteredAssets = filteredAssets.filter(
        (asset) =>
          asset.assetCode.toLowerCase().includes(keyword) ||
          (asset.serialNo ?? '').toLowerCase().includes(keyword) ||
          (asset.assetItemName ?? '').toLowerCase().includes(keyword) ||
          (asset.assignedMemberName && asset.assignedMemberName.toLowerCase().includes(keyword)),
      )
    }

    const assetsWithItemInfo = filteredAssets.map((asset) => {
      const item = tangibleItems.find((entry) => entry.assetItemId === asset.assetItemId)

      return {
        ...asset,
        productName: item?.assetName ?? asset.assetItemName,
        category: item?.category ?? '',
        manufacturer: item?.manufacturer ?? '',
        modelName: item?.modelName ?? '',
      }
    })

    return HttpResponse.json(ok({
      content: assetsWithItemInfo.slice(page * size, page * size + size),
      page,
      size,
      totalElements: assetsWithItemInfo.length,
      totalPages: Math.ceil(assetsWithItemInfo.length / size),
    }))
  }),

  http.get(`${API_PREFIX}/tangible-asset/assets/:assetId`, ({ params }) => {
    const assetId = String(params.assetId)
    const asset = tangibleAssets.find((entry) => entry.assetId === assetId)

    if (!asset) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ASSET_NOT_FOUND',
        message: '유형자산을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const item = tangibleItems.find((entry) => entry.assetItemId === asset.assetItemId)

    return HttpResponse.json(ok({
      ...asset,
      productName: item?.assetName ?? asset.assetItemName,
      category: item?.category ?? '',
      manufacturer: item?.manufacturer ?? '',
      modelName: item?.modelName ?? '',
    }, '유형자산 상세 조회에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/assets`, async ({ request }) => {
    const body = await request.json() as TangibleAssetCreateRequest
    const item = tangibleItems.find((t) => t.assetItemId === body.assetItemId)

    const nextId = String(Math.max(...tangibleAssets.map((asset) => Number(asset.assetId))) + 1)
    const newAsset: TangibleAsset = {
      assetId: nextId,
      assetCode: `TNG-${nextId.padStart(4, '0')}`,
      serialNo: body.serialNo,
      assetItemId: body.assetItemId,
      assetItemName: item?.assetName ?? '알 수 없는 품목',
      status: body.status ?? 'AVAILABLE',
      assignedMemberId: body.assignedMemberId ?? null,
      assignedMemberName: body.assignedMemberName ?? null,
      departmentId: body.departmentId ?? null,
      departmentName: body.departmentName ?? null,
      purchaseDate: body.purchaseDate,
      vendor: body.vendor,
      purchasePrice: body.purchasePrice,
      usageType: body.usageType,
      warrantyExpiredAt: body.warrantyExpiredAt ?? new Date(new Date(body.purchaseDate).setFullYear(new Date(body.purchaseDate).getFullYear() + 2)).toISOString().split('T')[0],
      location: body.location ?? null,
      startedAt: body.startedAt ?? null,
      returnDueDate: body.returnDueDate ?? null,
      createdAt: new Date().toISOString(),
    }

    tangibleAssets = [newAsset, ...tangibleAssets]
    return HttpResponse.json(ok(newAsset, '유형자산이 등록되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/tangible-asset/assets/:assetId`, async ({ params, request }) => {
    const assetId = String(params.assetId)
    const body = await request.json() as TangibleAssetUpdateRequest
    const asset = tangibleAssets.find((item) => item.assetId === assetId)

    if (!asset) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ASSET_NOT_FOUND',
        message: '유형자산을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const updatedAsset = Object.assign(asset, {
      assetCode: body.assetCode ?? asset.assetCode,
      assetItemName: body.assetItemName ?? asset.assetItemName,
      serialNo: body.serialNo ?? asset.serialNo,
      status: body.status ?? asset.status,
      assignedMemberId: body.assignedMemberId ?? null,
      assignedMemberName: body.assignedMemberName ?? null,
      departmentId: body.departmentId ?? null,
      departmentName: body.departmentName ?? null,
      startedAt: body.startedAt ?? null,
      returnDueDate: body.returnDueDate ?? null,
      purchaseDate: body.purchaseDate ?? asset.purchaseDate,
      vendor: body.vendor ?? asset.vendor,
      purchasePrice: body.purchasePrice ?? asset.purchasePrice,
      warrantyExpiredAt: body.warrantyExpiredAt ?? null,
      location: body.location ?? null,
    })

    return HttpResponse.json(ok(updatedAsset, '유형자산이 수정되었습니다.'))
  }),

  http.get(`${API_PREFIX}/tangible-asset/assets/:assetId/assignments`, ({ params, request }) => {
    const assetId = String(params.assetId)
    const url = new URL(request.url)
    const assignmentStatus = url.searchParams.get('assignmentStatus')

    let assignments = tangibleAssetAssignments.filter((assignment) => assignment.assetId === assetId)
    if (assignmentStatus) {
      assignments = assignments.filter((assignment) => assignment.assignmentStatus === assignmentStatus)
    }

    return HttpResponse.json(ok(assignments, '유형자산 배정 이력 조회에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/assets/:assetId/assign`, async ({ params, request }) => {
    const assetId = String(params.assetId)
    const body = await request.json() as {
      memberId: string
      usageType?: MockAssignmentType
      assetUsageType?: 'PERSONAL' | 'DEPARTMENT'
      endedAt?: string | null
    }
    const asset = tangibleAssets.find((item) => String(item.assetId) === assetId)
    const member = memberById(body.memberId)

    if (!asset || !member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ASSIGNMENT_TARGET_NOT_FOUND',
        message: '배정 대상 자산 또는 사용자를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    closeActiveAssignments(assetId)
    const assignment = createTangibleAssignment(asset, body)
    tangibleAssetAssignments = [assignment, ...tangibleAssetAssignments]
    applyAssignmentToAsset(asset, assignment)

    return HttpResponse.json(ok(assignment, '유형자산이 배정되었습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/assets/:assetId/return`, ({ params }) => {
    const assetId = String(params.assetId)
    const asset = tangibleAssets.find((item) => String(item.assetId) === assetId)

    if (!asset) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ASSET_NOT_FOUND',
        message: '유형자산을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    closeActiveAssignments(assetId)
    const latestAssignment = tangibleAssetAssignments.find((assignment) => assignment.assetId === assetId)

    asset.status = 'AVAILABLE'
    asset.tangibleAssetStatus = 'AVAILABLE'
    asset.assignedMemberId = null
    asset.assignedMemberName = null
    asset.departmentId = null
    asset.departmentName = null
    asset.usageType = null
    asset.returnDueDate = null

    return HttpResponse.json(ok(latestAssignment ?? null, '유형자산이 반납 처리되었습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/assets/:assetId/reassign`, async ({ params, request }) => {
    const assetId = String(params.assetId)
    const body = await request.json() as { newMemberId: string }
    const asset = tangibleAssets.find((item) => String(item.assetId) === assetId)
    const member = memberById(body.newMemberId)

    if (!asset || !member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'REASSIGNMENT_TARGET_NOT_FOUND',
        message: '재배정 대상 자산 또는 사용자를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    closeActiveAssignments(assetId)
    const assignment = createTangibleAssignment(asset, {
      memberId: body.newMemberId,
      usageType: asset.usageType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT',
      assetUsageType: asset.assetUsageType === 'DEPARTMENT' ? 'DEPARTMENT' : 'PERSONAL',
      endedAt: asset.returnDueDate ?? null,
    })
    tangibleAssetAssignments = [assignment, ...tangibleAssetAssignments]
    applyAssignmentToAsset(asset, assignment)

    return HttpResponse.json(ok(assignment, '유형자산이 재배정되었습니다.'))
  }),

  http.post(`${API_PREFIX}/tangible-asset/assets/reassign-bulk`, async ({ request }) => {
    const body = await request.json() as { currentMemberId: string; newMemberId: string }
    const targetAssets = tangibleAssets.filter((asset) => asset.assignedMemberId === body.currentMemberId)
    const member = memberById(body.newMemberId)

    if (!member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'MEMBER_NOT_FOUND',
        message: '새 사용자를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const assignments = targetAssets.map((asset) => {
      closeActiveAssignments(String(asset.assetId))
      const assignment = createTangibleAssignment(asset, {
        memberId: body.newMemberId,
        usageType: asset.usageType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT',
        assetUsageType: asset.assetUsageType === 'DEPARTMENT' ? 'DEPARTMENT' : 'PERSONAL',
        endedAt: asset.returnDueDate ?? null,
      })
      applyAssignmentToAsset(asset, assignment)
      return assignment
    })

    tangibleAssetAssignments = [...assignments, ...tangibleAssetAssignments]

    return HttpResponse.json(ok(assignments, '유형자산이 일괄 재배정되었습니다.'))
  }),

  http.get(`${API_PREFIX}/assets/intangible`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const status = url.searchParams.get('status') ?? ''
    const departmentId = url.searchParams.get('departmentId') ?? ''
    const memberId = url.searchParams.get('memberId') ?? ''
    const assetItemId = url.searchParams.get('assetItemId') ?? ''

    let filteredAssets = [...intangibleAssets]

    if (status) {
      filteredAssets = filteredAssets.filter((asset) => asset.status === status)
    }
    if (departmentId) {
      filteredAssets = filteredAssets.filter((asset) => asset.departmentId === departmentId)
    }
    if (memberId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assignedMemberId === memberId)
    }
    if (assetItemId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assetItemId === assetItemId)
    }

    return HttpResponse.json(ok({
      content: filteredAssets.slice(page * size, page * size + size),
      page,
      size,
      totalElements: filteredAssets.length,
      totalPages: Math.ceil(filteredAssets.length / size),
    }))
  }),

  http.get(`${API_PREFIX}/intangible-asset/assets`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const status = url.searchParams.get('status') ?? ''
    const departmentId = url.searchParams.get('departmentId') ?? ''
    const memberId = url.searchParams.get('memberId') ?? url.searchParams.get('currentUserId') ?? ''
    const assetItemId = url.searchParams.get('assetItemId') ?? ''
    const categoryId = url.searchParams.get('categoryId') ?? ''
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase()

    let filteredAssets = [...intangibleAssets]

    if (status) {
      filteredAssets = filteredAssets.filter((asset) => asset.status === status || asset.intangibleAssetStatus === status)
    }
    if (departmentId) {
      filteredAssets = filteredAssets.filter((asset) => asset.departmentId === departmentId)
    }
    if (memberId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assignedMemberId === memberId)
    }
    if (assetItemId) {
      filteredAssets = filteredAssets.filter((asset) => asset.assetItemId === assetItemId)
    }
    if (categoryId) {
      const itemIds = intangibleItems
        .filter((item) => item.categoryId === categoryId)
        .map((item) => item.assetItemId)
      filteredAssets = filteredAssets.filter((asset) => itemIds.includes(asset.assetItemId))
    }
    if (keyword) {
      filteredAssets = filteredAssets.filter((asset) => (
        asset.assetItemName.toLowerCase().includes(keyword)
        || asset.assetCode.toLowerCase().includes(keyword)
        || (asset.assignedMemberName?.toLowerCase().includes(keyword) ?? false)
      ))
    }

    return HttpResponse.json(ok({
      content: filteredAssets.slice(page * size, page * size + size),
      page,
      size,
      totalElements: filteredAssets.length,
      totalPages: Math.ceil(filteredAssets.length / size),
    }))
  }),

  http.post(`${API_PREFIX}/assets/intangible`, async ({ request }) => {
    const body = await request.json() as IntangibleAssetCreateRequest
    const assetItemId = body.assetItemId ?? body.intangibleItemId ?? ''
    const item = intangibleItems.find((t) => t.assetItemId === assetItemId)

    const nextId = String(Math.max(...intangibleAssets.map((asset) => Number(asset.assetId))) + 1)
    const newAsset: IntangibleAsset = {
      assetId: nextId,
      assetCode: `INT-${nextId.padStart(4, '0')}`,
      assetItemId,
      assetItemName: item?.productName ?? '알 수 없는 소프트웨어',
      licenseType: body.licenseType ?? 'SUBSCRIPTION',
      licenseCode: body.licenseCode,
      licenseKey: body.licenseKey ?? body.licenseCode,
      status: body.intangibleAssetStatus ?? body.status ?? 'AVAILABLE',
      assignedMemberId: null,
      assignedMemberName: null,
      departmentId: body.departmentId ?? null,
      departmentName: null,
      startedAt: body.startedAt ?? null,
      expiredAt: body.expiredAt ?? null,
      vendor: body.purchaseVendor ?? item?.vendor,
      purchaseDate: body.purchaseDate,
      purchasePrice: body.purchasePrice ?? 500000,
      purchaseVendor: body.purchaseVendor,
      seatCount: body.seatCount,
      isAutoRenewal: body.isAutoRenewal,
      billingCycle: body.billingCycle,
      createdAt: new Date().toISOString(),
    }

    intangibleAssets = [newAsset, ...intangibleAssets]
    return HttpResponse.json(ok(newAsset, '무형자산이 등록되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/assets/intangible/:assetId/terminate`, ({ params }) => {
    const assetId = String(params.assetId)
    const asset = intangibleAssets.find((item) => item.assetId === assetId)

    if (!asset) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'ASSET_NOT_FOUND',
        message: '무형자산을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    asset.status = 'TERMINATED'
    return HttpResponse.json(ok(asset, '무형자산 해지 처리가 완료되었습니다.'))
  }),

  http.get(`${API_PREFIX}/intangible-asset/assets/:assetId/assignments`, ({ params, request }) => {
    const assetId = String(params.assetId)
    const url = new URL(request.url)
    const assignmentStatus = url.searchParams.get('assignmentStatus')

    let assignments = intangibleAssetAssignments.filter((assignment) => assignment.assetId === assetId)
    if (assignmentStatus) {
      assignments = assignments.filter((assignment) => assignment.assignmentStatus === assignmentStatus)
    }

    return HttpResponse.json(ok(assignments, '무형자산 배정 이력 조회에 성공했습니다.'))
  }),

  http.post(`${API_PREFIX}/intangible-asset/assets/:assetId/assign`, async ({ params, request }) => {
    const assetId = String(params.assetId)
    const body = await request.json() as {
      memberId: string
      endedAt?: string | null
    }
    const asset = intangibleAssets.find((item) => String(item.assetId) === assetId)
    const member = memberById(body.memberId)

    if (!asset || !member) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'INTANGIBLE_ASSIGNMENT_TARGET_NOT_FOUND',
        message: '배정 대상 무형자산 또는 사용자를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const assignment = createIntangibleAssignment(asset, body)
    intangibleAssetAssignments = [assignment, ...intangibleAssetAssignments]
    applyIntangibleAssignmentToAsset(asset, assignment)

    return HttpResponse.json(ok(assignment, '무형자산이 배정되었습니다.'))
  }),

  http.post(`${API_PREFIX}/intangible-asset/assets/:assetId/cancel`, async ({ params, request }) => {
    const assetId = String(params.assetId)
    const body = await request.json() as { memberId?: string | null }
    const asset = intangibleAssets.find((item) => String(item.assetId) === assetId)

    if (!asset) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'INTANGIBLE_ASSET_NOT_FOUND',
        message: '무형자산을 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    closeActiveIntangibleAssignments(assetId, body.memberId)
    const endedAssignments = intangibleAssetAssignments.filter((assignment) => (
      assignment.assetId === assetId
      && (!body.memberId || assignment.memberId === body.memberId)
      && assignment.assignmentStatus === 'ENDED'
    ))
    const hasActiveAssignment = intangibleAssetAssignments.some((assignment) => (
      assignment.assetId === assetId
      && (assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED')
    ))

    if (!hasActiveAssignment) {
      asset.status = 'AVAILABLE'
      asset.intangibleAssetStatus = 'AVAILABLE'
      asset.assignedMemberId = null
      asset.assignedMemberName = null
      asset.departmentId = null
      asset.departmentName = null
      asset.startedAt = null
    }

    return HttpResponse.json(ok(endedAssignments, '무형자산 배정이 해지되었습니다.'))
  }),

  http.get(`${API_PREFIX}/assets/intangible/categories`, () => {
    const types = Array.from(new Set(intangibleItems.map((item) => item.category)))
    return HttpResponse.json(ok(types))
  }),

  http.get(`${API_PREFIX}/departments`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    return HttpResponse.json(ok(pageOf(
      departments.map(withCurrentMemberCount),
      page,
      size,
    )))
  }),

  http.get(`${API_PREFIX}/departments/:departmentId`, ({ params }) => {
    const departmentId = String(params.departmentId)
    const department = departments.find((item) => item.departmentId === departmentId)

    if (!department) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    return HttpResponse.json(ok(withCurrentMemberCount(department)))
  }),

  http.post(`${API_PREFIX}/departments`, async ({ request }) => {
    const body = await request.json() as DepartmentCreateRequest
    const nextId = crypto.randomUUID()

    let parentName = undefined
    if (body.parentDepartmentId) {
      const p = departments.find((d) => d.departmentId === body.parentDepartmentId)
      parentName = p?.name
    }

    const newDepartment: Department = {
      departmentId: nextId,
      parentDepartmentId: body.parentDepartmentId ?? null,
      parentDepartmentName: parentName,
      name: body.name,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    }

    departments = [...departments, newDepartment]
    return HttpResponse.json(ok(
      withCurrentMemberCount(newDepartment),
      '부서가 등록되었습니다.',
    ))
  }),

  http.put(`${API_PREFIX}/departments/:departmentId`, async ({ params, request }) => {
    const departmentId = String(params.departmentId)
    const body = await request.json() as DepartmentUpdateRequest

    const index = departments.findIndex((item) => item.departmentId === departmentId)
    if (index === -1) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const current = departments[index]
    const parent = body.parentDepartmentId
      ? departments.find((d) => d.departmentId === body.parentDepartmentId)
      : null

    const updated: Department = {
      ...current,
      name: body.name ?? current.name,
      parentDepartmentId: body.parentDepartmentId === undefined ? current.parentDepartmentId : body.parentDepartmentId,
      parentDepartmentName: body.parentDepartmentId === undefined ? current.parentDepartmentName : parent?.name,
      updatedAt: new Date().toISOString(),
    }

    departments[index] = updated
    return HttpResponse.json(ok(
      withCurrentMemberCount(updated),
      '부서 정보가 수정되었습니다.',
    ))
  }),

  http.delete(`${API_PREFIX}/departments/:departmentId`, ({ params }) => {
    const departmentId = String(params.departmentId)
    const department = departments.find((item) => item.departmentId === departmentId)

    if (!department) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    if (department.parentDepartmentId === null) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'ROOT_DEPARTMENT_CANNOT_BE_DELETED',
        message: '최상위 회사 부서는 삭제할 수 없습니다.',
        data: null,
      }, { status: 409 })
    }

    const hasChildren = departments.some(
      ({ parentDepartmentId }) => parentDepartmentId === departmentId,
    )
    const hasMembers = members.some((member) => member.departmentId === departmentId)

    if (hasMembers) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'DEPARTMENT_HAS_MEMBERS',
        message: '소속 부서원이 있는 부서는 삭제할 수 없습니다.',
        data: null,
      }, { status: 409 })
    }

    if (hasChildren) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'DEPARTMENT_HAS_CHILDREN',
        message: '하위 부서가 있는 부서는 삭제할 수 없습니다.',
        data: null,
      }, { status: 409 })
    }

    departments = departments.filter((item) => item.departmentId !== departmentId)
    return HttpResponse.json(ok(null, '부서가 성공적으로 삭제되었습니다.'))
  }),

  http.all(`${API_PREFIX}/*`, ({ request }) => {
    const url = new URL(request.url)

    return HttpResponse.json({
      status: 501,
      errorCode: 'MOCK_HANDLER_NOT_IMPLEMENTED',
      message: `등록되지 않은 Mock API입니다: ${request.method} ${url.pathname}`,
      data: null,
    }, { status: 501 })
  }),
]
