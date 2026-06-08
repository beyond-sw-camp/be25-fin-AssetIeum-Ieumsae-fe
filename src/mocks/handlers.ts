import { http, HttpResponse } from 'msw'
import type {
  ApiResponse,
  Department,
  DepartmentChangeRequest,
  LoginRequest,
  LoginResponse,
  Member,
  MemberListFilter,
  MemberRegisterRequest,
  PageResponse,
  PasswordChangeRequest,
} from '@/types'

const API_PREFIX = '*/api/v1'

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

const departments: Department[] = [
  {
    departmentId: 1,
    parentDepartmentId: null,
    name: '이음테크',
    memberCount: 8,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: 2,
    parentDepartmentId: 1,
    parentDepartmentName: '이음테크',
    name: '구매자산팀',
    memberCount: 3,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: 3,
    parentDepartmentId: 1,
    parentDepartmentName: '이음테크',
    name: '플랫폼개발본부',
    memberCount: 4,
    createdAt: '2026-01-02T09:00:00',
  },
  {
    departmentId: 4,
    parentDepartmentId: 3,
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
    departmentId: 2,
    departmentName: '구매자산팀',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-05T09:00:00',
  },
  {
    memberId: 2,
    memberNo: 'EMP0002',
    name: '박자산',
    email: 'asset@ieumtech.com',
    departmentId: 2,
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
    departmentId: 3,
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
    departmentId: 4,
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
    departmentId: 4,
    departmentName: '프론트엔드팀',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2026-01-09T09:00:00',
  },
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
    accessToken: `mock-access-token-${member.memberNo}`,
    refreshToken: `mock-refresh-token-${member.memberNo}`,
  }
}

export const handlers = [
  http.post(`${API_PREFIX}/auth/login`, async ({ request }) => {
    const credentials = await request.json() as LoginRequest
    const member = members.find((item) => item.memberNo === credentials.memberNo) ?? members[0]

    return HttpResponse.json(ok(toLoginResponse(member), '로그인 되었습니다.'))
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
    await request.json() as PasswordChangeRequest

    return HttpResponse.json(ok({
      memberId: 1,
      changedAt: new Date().toISOString(),
    }, '비밀번호가 변경되었습니다.'))
  }),

  http.get(`${API_PREFIX}/members`, ({ request }) => {
    const url = new URL(request.url)
    const filter: MemberListFilter = {
      page: Number(url.searchParams.get('page') ?? 0),
      size: Number(url.searchParams.get('size') ?? 10),
      departmentId: url.searchParams.get('departmentId')
        ? Number(url.searchParams.get('departmentId'))
        : undefined,
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

  http.get(`${API_PREFIX}/departments`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)

    return HttpResponse.json(ok(pageOf(departments, page, size)))
  }),

  http.get(`${API_PREFIX}/departments/:departmentId`, ({ params }) => {
    const departmentId = Number(params.departmentId)
    const department = departments.find((item) => item.departmentId === departmentId)

    return HttpResponse.json(ok(department ?? null))
  }),
]
