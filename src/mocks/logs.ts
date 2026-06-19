import type { ActivityLog, ApiResponse, AuditLog, LogListFilter, PageResponse } from '@/types'

const auditLogs: AuditLog[] = [
  {
  auditLogId: '1',
  memberId: 'EMP0002',
  memberName: '김관리',
  memberInfo: '김관리(EMP0002)',
  targetType: '유형자산',
  targetId: 'AST-202606-0001',
  logType: '정보변경',
  description: '구매종류: - -> 구입\n사용자: - -> 홍길동',
  createdAt: '2026-06-10T10:30:00',
},
{
  auditLogId: '2',
  memberId: 'EMP0002',
  memberName: '김관리',
  memberInfo: '김관리(EMP0002)',
  targetType: '유형자산',
  targetId: 'AST-202606-0002',
  logType: '생성',
  description: '자산번호: TA0001\n자산명: MacBook Pro 14 생성',
  createdAt: '2026-06-10T09:45:00',
},
{
  auditLogId: '3',
  memberId: 'EMP0003',
  memberName: '이담당',
  memberInfo: '이담당(EMP0003)',
  targetType: '무형자산',
  targetId: 'IAS-202606-0001',
  logType: '배정',
  description: '사용자: - -> 김개발\n라이선스: JetBrains All Products',
  createdAt: '2026-06-09T16:20:00',
},
{
  auditLogId: '4',
  memberId: 'EMP0001',
  memberName: '관리자',
  memberInfo: '관리자(EMP0001)',
  targetType: '멤버',
  targetId: 'EMP0015',
  logType: '초대',
  description: '이메일: newmember@ieum.kr\n권한: EMPLOYEE',
  createdAt: '2026-06-09T14:10:00',
},
{
  auditLogId: '5',
  memberId: 'EMP0004',
  memberName: '박자산',
  memberInfo: '박자산(EMP0004)',
  targetType: '유형자산',
  targetId: 'AST-202606-0005',
  logType: '반납',
  description: '사용자: 김개발 -> -\n상태: 사용중 -> 대기',
  createdAt: '2026-06-08T18:30:00',
},
{
  auditLogId: '6',
  memberId: 'EMP0001',
  memberName: '관리자',
  memberInfo: '관리자(EMP0001)',
  targetType: '부서',
  targetId: 'DEP0003',
  logType: '정보변경',
  description: '부서명: 프론트엔드팀 -> FE개발팀',
  createdAt: '2026-06-08T11:05:00',
},
{
  auditLogId: '7',
  memberId: 'EMP0002',
  memberName: '김관리',
  memberInfo: '김관리(EMP0002)',
  targetType: '유형자산',
  targetId: 'AST-202606-0007',
  logType: '삭제',
  description: '폐기 대상 자산 삭제',
  createdAt: '2026-06-07T15:40:00',
},

]

const activityLogs: ActivityLog[] = [
  {
    activityLogId: '1',
    memberId: 'EMP0002',
    memberName: '김관리',
    memberInfo: '김관리(EMP0002)',
    activityType: '조회',
    targetType: '유형자산',
    targetId: 'AST-202606-0001',
    description: '유형자산 상세 화면을 조회했습니다.',
    createdAt: '2026-06-10T10:30:00',
  },
  {
    activityLogId: '2',
    memberId: 'EMP0002',
    memberName: '김관리',
    memberInfo: '김관리(EMP0002)',
    activityType: '검색',
    targetType: '유형자산',
    targetId: null,
    description: '유형자산 목록에서 로그 검색을 실행했습니다.',
    createdAt: '2026-06-10T09:50:00',
  },
  {
    activityLogId: '3',
    memberId: 'EMP0003',
    memberName: '이담당',
    memberInfo: '이담당(EMP0003)',
    activityType: '조회',
    targetType: '무형자산',
    targetId: 'IAS-202606-0001',
    description: '무형자산 상세 화면을 조회했습니다.',
    createdAt: '2026-06-09T16:20:00',
  },
  {
    activityLogId: '4',
    memberId: 'EMP0001',
    memberName: '관리자',
    memberInfo: '관리자(EMP0001)',
    activityType: '로그인',
    targetType: '인증',
    targetId: null,
    description: '관리자 계정으로 로그인했습니다.',
    createdAt: '2026-06-09T09:10:00',
  },
]

function filterLogs<T extends { memberId: string | number; createdAt: string }>(logs: T[], params?: LogListFilter) {
  return logs.filter((log) => {
    if (params?.memberId && String(log.memberId) !== String(params.memberId)) return false
    if (params?.startDate && log.createdAt.slice(0, 10) < params.startDate) return false
    if (params?.endDate && log.createdAt.slice(0, 10) > params.endDate) return false
    return true
  })
}

function pageOf<T>(content: T[], params?: LogListFilter): PageResponse<T> {
  const page = Number(params?.page ?? 0)
  const size = Number(params?.size ?? 20)
  const start = page * size

  return {
    content: content.slice(start, start + size),
    page,
    size,
    totalElements: content.length,
    totalPages: Math.max(1, Math.ceil(content.length / size)),
  }
}

function ok<T>(data: T, message: string): ApiResponse<T> {
  return {
    status: 200,
    errorCode: null,
    message,
    data,
  }
}

export const mockLogApi = {
  getAuditLogs: (params?: LogListFilter) =>
    ok(pageOf(filterLogs(auditLogs, params), params), '감사 로그 목록 조회에 성공했습니다.'),

  getActivityLogs: (params?: LogListFilter) =>
    ok(pageOf(filterLogs(activityLogs, params), params), '활동 로그 목록 조회에 성공했습니다.'),
}
