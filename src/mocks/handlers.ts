import { http, HttpResponse } from 'msw'
import type {
  ApiResponse,
  Department,
  DepartmentChangeRequest,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  IntangibleItem,
  LoginRequest,
  LoginResponse,
  Member,
  MemberListFilter,
  MemberRegisterRequest,
  PageResponse,
  PasswordChangeRequest,
} from '@/types'

const API_PREFIX = '*/api/v1'
const MOCK_COMPANY_CODE = 'COMP001'
const ROOT_DEPARTMENT_ID = '11111111-1111-1111-1111-111111111111'
const ASSET_TEAM_DEPARTMENT_ID = '22222222-2222-2222-2222-222222222222'
const PLATFORM_DEPARTMENT_ID = '33333333-3333-3333-3333-333333333333'
const FRONTEND_DEPARTMENT_ID = '44444444-4444-4444-4444-444444444444'

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

let members: Member[] = [
  {
    memberId: 1,
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
    memberId: 2,
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
    memberId: 3,
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
    memberId: 4,
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
    memberId: 5,
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
    memberId: 6,
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
    memberId: 7,
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
    memberId: 8,
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
    memberId: 9,
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
    memberId: 10,
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
    memberId: 11,
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
    memberId: 12,
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
    memberId: 13,
    memberNo: 'EMP0013',
    name: '배수아',
    email: 'dev8@ieumtech.com',
    departmentId: FRONTEND_DEPARTMENT_ID,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-17T09:00:00',
  },
]

const memberPasswords = new Map(
  members.map((member) => [member.memberNo, member.memberNo]),
)

function withCurrentMemberCount(department: Department): Department {
  return {
    ...department,
    memberCount: members.filter(
      (member) => member.departmentId === department.departmentId,
    ).length,
  }
}

interface TangibleItem {
  assetItemId: number
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
}

let tangibleItems: TangibleItem[] = [
  { assetItemId: 1, assetName: 'MacBook Pro 14인치 M3 Max', category: '노트북', manufacturer: 'Apple', modelName: 'A2992', isStandard: 1 },
  { assetItemId: 2, assetName: 'ThinkPad X1 Carbon Gen 12', category: '노트북', manufacturer: 'Lenovo', modelName: '21KC', isStandard: 0 },
  { assetItemId: 3, assetName: '시디즈 T80 하이엔드 의자', category: '사무가구', manufacturer: '시디즈', modelName: 'TN800HLDA', isStandard: 1 },
  { assetItemId: 4, assetName: 'MX Keys S 무선 팬터그래프', category: '주변기기', manufacturer: 'Logitech', modelName: 'KX800S', isStandard: 1 },
  { assetItemId: 5, assetName: '퍼시스 6인용 모듈러 회의 테이블', category: '사무가구', manufacturer: '퍼시스', modelName: 'CRN016', isStandard: 1 },
  { assetItemId: 6, assetName: 'iPhone 15 Pro Max 512GB', category: '스마트폰', manufacturer: 'Apple', modelName: 'A3106', isStandard: 1 },
  { assetItemId: 7, assetName: 'Galaxy S24 Ultra 자급제', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-S928N', isStandard: 1 },
  { assetItemId: 8, assetName: 'iPad Pro 13인치 M4 셀룰러', category: '태블릿', manufacturer: 'Apple', modelName: 'A3007', isStandard: 0 },
  { assetItemId: 9, assetName: 'MX Master 3S 무소음 마우스', category: '주변기기', manufacturer: 'Logitech', modelName: 'MX-M3S', isStandard: 1 },
  { assetItemId: 10, assetName: 'LG 27인치 QHD 에르고 모니터', category: '모니터', manufacturer: 'LG전자', modelName: '27QN880', isStandard: 1 },
  { assetItemId: 11, assetName: 'Galaxy Tab S9 Ultra 256GB', category: '태블릿', manufacturer: '삼성전자', modelName: 'SM-X910', isStandard: 1 },
  { assetItemId: 12, assetName: '에어론 체어 풀 스펙 B사이즈', category: '사무가구', manufacturer: 'Herman Miller', modelName: 'AERON-B', isStandard: 1 },
  { assetItemId: 13, assetName: 'Galaxy Book4 Ultra 코어Ultra9', category: '노트북', manufacturer: '삼성전자', modelName: 'NT960XGK', isStandard: 1 },
  { assetItemId: 14, assetName: '모션데스크 E0 스마트 1600', category: '사무가구', manufacturer: '데스커', modelName: 'DSMD1607', isStandard: 0 },
  { assetItemId: 15, assetName: '오디세이 OLED G9 게이밍 모니터', category: '모니터', manufacturer: '삼성전자', modelName: 'G95SC', isStandard: 0 },
  { assetItemId: 16, assetName: '가산 지사 복사기 렌탈 장비', category: '사무기기', manufacturer: 'Sindoh', modelName: 'D450-RENT', isStandard: 0 },
]

let intangibleItems: IntangibleItem[] = [
  { productName: 'Adobe Creative Cloud', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 1 },
  { productName: 'Microsoft 365', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 1 },
  { productName: 'Figma', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Figma', isStandard: 1 },
  { productName: 'Slack', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Slack', isStandard: 1 },
  { productName: 'GitHub Enterprise', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'GitHub', isStandard: 1 },
  { productName: 'Adobe Creative Cloud', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 1 },
  { productName: 'Microsoft 365', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 0 },
  { productName: 'Figma', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Figma', isStandard: 1 },
  { productName: 'Slack', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Slack', isStandard: 1 },
  { productName: 'GitHub Enterprise', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'GitHub', isStandard: 0 },
  { productName: 'Adobe Creative Cloud', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 0 },
  { productName: 'Microsoft 365', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 1 },
  { productName: 'Figma', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Figma', isStandard: 0 },
  { productName: 'Slack', category: '협업', licenseType: '구독형 (SaaS)', vendor: 'Slack', isStandard: 1 },
  { productName: 'GitHub Enterprise', category: '개발툴', licenseType: '사용자 수 라이선스', vendor: 'GitHub', isStandard: 1 },
  { productName: 'Adobe Creative Cloud', category: '디자인', licenseType: '구독형 (SaaS)', vendor: 'Adobe', isStandard: 1 },
  { productName: 'Microsoft 365', category: '업무용', licenseType: '구독형 (SaaS)', vendor: 'Microsoft', isStandard: 1 }
]

function toLoginResponse(member: Member): LoginResponse {
  return {
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

export const handlers = [
  http.post(`${API_PREFIX}/auth/login`, async ({ request }) => {
    const credentials = await request.json() as LoginRequest
    const member = members.find((item) => item.memberNo === credentials.memberNo)

    if (
      credentials.companyCode !== MOCK_COMPANY_CODE
      || !member
      || memberPasswords.get(member.memberNo) !== credentials.password
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
    return HttpResponse.json(ok(null, '로그아웃 되었습니다.'))
  }),

  http.post(`${API_PREFIX}/auth/refresh`, () => {
    return HttpResponse.json(ok({
      accessToken: 'mock-access-token-refreshed',
      refreshToken: 'mock-refresh-token-refreshed',
    }))
  }),

  http.patch(`${API_PREFIX}/members/me/password`, async ({ request }) => {
    const body = await request.json() as PasswordChangeRequest
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    const memberNo = accessToken?.replace('mock-access-token-', '')
    const member = members.find((item) => item.memberNo === memberNo)

    if (!member || memberPasswords.get(member.memberNo) !== body.currentPassword) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'BAD_REQUEST',
        message: '기존 비밀번호가 일치하지 않습니다.',
        data: null,
      }, { status: 400 })
    }

    memberPasswords.set(member.memberNo, body.newPassword)

    return HttpResponse.json(ok({
      memberId: member.memberId,
      updatedAt: new Date().toISOString(),
    }, '비밀번호가 변경되었습니다.'))
  }),

  http.get(`${API_PREFIX}/members`, ({ request }) => {
    const url = new URL(request.url)
    const filter: MemberListFilter = {
      page: Number(url.searchParams.get('page') ?? 0),
      size: Number(url.searchParams.get('size') ?? 10),
      departmentId: url.searchParams.get('departmentId')
        ?? undefined,
      role: (url.searchParams.get('role') as MemberListFilter['role']) ?? undefined,
      status: (url.searchParams.get('status') as MemberListFilter['status']) ?? undefined,
    }

    const filteredMembers = members.filter((member) => {
      const byDepartment = filter.departmentId ? member.departmentId === filter.departmentId : true
      const byRole = filter.role ? member.role === filter.role : true
      const byStatus = filter.status ? member.status === filter.status : true

      return byDepartment && byRole && byStatus
    })

    return HttpResponse.json(ok(pageOf(filteredMembers, filter.page ?? 0, filter.size ?? 10)))
  }),

  http.post(`${API_PREFIX}/members`, async ({ request }) => {
    const body = await request.json() as MemberRegisterRequest
    const department = departments.find((item) => item.departmentId === body.departmentId)
    const member: Member = {
      memberId: Math.max(...members.map((item) => item.memberId)) + 1,
      memberNo: body.memberNo,
      name: body.name,
      email: body.email ?? null,
      departmentId: body.departmentId,
      departmentName: department?.name ?? '미지정',
      role: body.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }

    members = [member, ...members]

    return HttpResponse.json(ok(member, '사원이 등록되었습니다.'))
  }),

  http.patch(`${API_PREFIX}/members/:memberId/resign`, ({ params }) => {
    const memberId = Number(params.memberId)
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
    const memberId = Number(params.memberId)
    const body = await request.json() as DepartmentChangeRequest
    const member = members.find((item) => item.memberId === memberId)
    const department = departments.find((item) => item.departmentId === body.departmentId)

    if (member && department) {
      member.departmentId = department.departmentId
      member.departmentName = department.name
    }

    return HttpResponse.json(ok(member ?? null, '소속 부서가 변경되었습니다.'))
  }),

  http.get(`${API_PREFIX}/assets/tangible/items`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const categoryName = url.searchParams.get('categoryName') ?? ''
    const modelName = url.searchParams.get('modelName')?.toLowerCase() ?? ''

    let filteredItems = [...tangibleItems]

    if (categoryName && categoryName !== '전체 품목 보기') {
      const categoryGroupMap: Record<string, string[]> = {
        'IT / 전자기기': ['노트북', '모니터', '스마트폰', '태블릿', '주변기기'],
        '사무용 가구': ['사무가구'],
        '사무기기 / 가전': ['사무기기'],
      }

      if (categoryName.endsWith(' - 전체')) {
        const mainCategory = categoryName.replace(' - 전체', '')
        const subCategories = categoryGroupMap[mainCategory] ?? []
        filteredItems = filteredItems.filter((item) => subCategories.includes(item.category))
      } else {
        filteredItems = filteredItems.filter((item) => item.category === categoryName)
      }
    }

    if (modelName) {
      filteredItems = filteredItems.filter((item) =>
        item.modelName.toLowerCase().includes(modelName) ||
        item.assetName.toLowerCase().includes(modelName)
      )
    }

    return HttpResponse.json(ok({
      content: filteredItems.slice(page * size, page * size + size),
      page,
      size,
      totalElements: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / size),
    }))
  }),

  http.post(`${API_PREFIX}/assets/tangible/items`, async ({ request }) => {
    const body = await request.json() as Omit<TangibleItem, 'assetItemId'>
    const newItem: TangibleItem = {
      assetItemId: Math.max(...tangibleItems.map((item) => item.assetItemId)) + 1,
      ...body,
    }

    tangibleItems = [newItem, ...tangibleItems]

    return HttpResponse.json(ok(newItem, '유형자산 품목이 등록되었습니다.'))
  }),

  http.get(`${API_PREFIX}/assets/intangible/items`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const category = url.searchParams.get('category') ?? ''
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? ''

    let filteredItems = [...intangibleItems]

    if (category && category !== '전체 소프트웨어 타입') {
      filteredItems = filteredItems.filter((item) => item.category === category)
    }

    if (keyword) {
      filteredItems = filteredItems.filter((item) =>
        item.productName.toLowerCase().includes(keyword) ||
        item.vendor.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        item.licenseType.toLowerCase().includes(keyword)
      )
    }

    return HttpResponse.json(ok({
      content: filteredItems.slice(page * size, page * size + size),
      page,
      size,
      totalElements: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / size),
    }))
  }),

  http.post(`${API_PREFIX}/assets/intangible/items`, async ({ request }) => {
    const body = await request.json() as Omit<IntangibleItem, 'assetItemId'>
    const newItem: IntangibleItem = {
      assetItemId: Math.max(...intangibleItems.map((item) => item.assetItemId ?? 0)) + 1,
      ...body,
    }

    intangibleItems = [newItem, ...intangibleItems]

    return HttpResponse.json(ok(newItem, '무형자산 품목이 등록되었습니다.'))
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

    if (!body.parentDepartmentId) {
      return HttpResponse.json({
        status: 400,
        errorCode: 'PARENT_DEPARTMENT_REQUIRED',
        message: '상위 부서를 선택해주세요.',
        data: null,
      }, { status: 400 })
    }

    const parent = body.parentDepartmentId
      ? departments.find((item) => item.departmentId === body.parentDepartmentId)
      : null

    if (!parent) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'PARENT_DEPARTMENT_NOT_FOUND',
        message: '상위 부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const now = new Date().toISOString()
    const department: Department = {
      departmentId: crypto.randomUUID(),
      parentDepartmentId: body.parentDepartmentId ?? null,
      parentDepartmentName: parent?.name,
      name: body.name,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    departments = [...departments, department]

    return HttpResponse.json({
      status: 201,
      errorCode: null,
      message: '부서가 등록되었습니다.',
      data: withCurrentMemberCount(department),
    }, { status: 201 })
  }),

  http.patch(`${API_PREFIX}/departments/:departmentId`, async ({ params, request }) => {
    const departmentId = String(params.departmentId)
    const body = await request.json() as DepartmentUpdateRequest
    const index = departments.findIndex((item) => item.departmentId === departmentId)

    if (index < 0) {
      return HttpResponse.json({
        status: 404,
        errorCode: 'DEPARTMENT_NOT_FOUND',
        message: '부서를 찾을 수 없습니다.',
        data: null,
      }, { status: 404 })
    }

    const parent = body.parentDepartmentId
      ? departments.find((item) => item.departmentId === body.parentDepartmentId)
      : null
    const current = departments[index]

    if (
      current.parentDepartmentId !== null
      && body.parentDepartmentId === null
    ) {
      return HttpResponse.json({
        status: 409,
        errorCode: 'ROOT_DEPARTMENT_ALREADY_EXISTS',
        message: '최상위 회사 부서는 추가할 수 없습니다.',
        data: null,
      }, { status: 409 })
    }

    const updated: Department = {
      ...current,
      name: body.name ?? current.name,
      parentDepartmentId: body.parentDepartmentId === undefined
        ? current.parentDepartmentId
        : body.parentDepartmentId,
      parentDepartmentName: body.parentDepartmentId === undefined
        ? current.parentDepartmentName
        : parent?.name,
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

    return HttpResponse.json(ok({
      departmentId,
      deletedAt: new Date().toISOString(),
    }, '부서가 삭제되었습니다.'))
  }),
]
