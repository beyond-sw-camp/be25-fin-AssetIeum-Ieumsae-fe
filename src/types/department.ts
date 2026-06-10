// =====================================================
// 부서(Department) 관련 타입
// =====================================================

export interface Department {
  departmentId: string
  parentDepartmentId: string | null
  parentDepartmentName?: string
  name: string
  memberCount: number
  createdAt: string
  updatedAt?: string
  children?: Department[]
}

export interface DepartmentCreateRequest {
  parentDepartmentId?: string | null
  name: string
}

export interface DepartmentUpdateRequest {
  parentDepartmentId?: string | null
  name?: string
}

// 트리 구조 렌더링을 위한 타입 (FE 전용)
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[]
}
