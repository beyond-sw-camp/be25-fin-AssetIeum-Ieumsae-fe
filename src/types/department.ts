// =====================================================
// 부서(Department) 관련 타입
// =====================================================

export interface Department {
  departmentId: number
  parentDepartmentId: number | null
  parentDepartmentName?: string
  name: string
  memberCount: number
  createdAt: string
  updatedAt?: string
}

export interface DepartmentCreateRequest {
  parentDepartmentId?: number | null
  name: string
}

export interface DepartmentUpdateRequest {
  parentDepartmentId?: number | null
  name?: string
}

// 트리 구조 렌더링을 위한 타입 (FE 전용)
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[]
  isExpanded?: boolean
  isSelected?: boolean
}
