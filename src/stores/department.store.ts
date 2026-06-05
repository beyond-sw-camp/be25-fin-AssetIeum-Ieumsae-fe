import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { departmentApi } from '@/api'
import type { Department, DepartmentTreeNode } from '@/types'

// =====================================================
// Department Store - 부서 목록 / 트리 상태
// =====================================================

export const useDepartmentStore = defineStore('department', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const departments = ref<Department[]>([])
  const isLoading = ref(false)
  const selectedDepartmentId = ref<number | null>(null)

  // ─── Getters ─────────────────────────────────────────────────────────────────

  /** 평탄한 부서 목록을 트리 구조로 변환 */
  const departmentTree = computed<DepartmentTreeNode[]>(() => {
    const map = new Map<number, DepartmentTreeNode>()
    const roots: DepartmentTreeNode[] = []

    departments.value.forEach((dept) => {
      map.set(dept.departmentId, { ...dept, children: [] })
    })

    map.forEach((node) => {
      if (node.parentDepartmentId && map.has(node.parentDepartmentId)) {
        map.get(node.parentDepartmentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  })

  const selectedDepartment = computed(() =>
    departments.value.find((d) => d.departmentId === selectedDepartmentId.value) ?? null
  )

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function fetchAll() {
    isLoading.value = true
    try {
      // 전체 부서를 가져오기 위해 size를 크게 설정
      const res = await departmentApi.getList({ size: 999 })
      departments.value = res.data.content
    } finally {
      isLoading.value = false
    }
  }

  function selectDepartment(id: number | null) {
    selectedDepartmentId.value = id
  }

  return {
    departments,
    isLoading,
    selectedDepartmentId,
    departmentTree,
    selectedDepartment,
    fetchAll,
    selectDepartment,
  }
})
