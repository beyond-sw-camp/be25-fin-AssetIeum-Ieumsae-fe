import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { departmentApi } from '@/api'
import type { Department, DepartmentTreeNode } from '@/types'

function flattenDepartments(items: Department[]): Department[] {
  return items.flatMap((department) => {
    const { children = [], ...current } = department
    return [current, ...flattenDepartments(children)]
  })
}

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<Department[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const selectedDepartmentId = ref<number | null>(null)

  const departmentTree = computed<DepartmentTreeNode[]>(() => {
    const map = new Map<number, DepartmentTreeNode>()
    const roots: DepartmentTreeNode[] = []

    departments.value.forEach((department) => {
      map.set(department.departmentId, { ...department, children: [] })
    })

    map.forEach((node) => {
      const parent = node.parentDepartmentId
        ? map.get(node.parentDepartmentId)
        : undefined

      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  })

  const selectedDepartment = computed(() =>
    departments.value.find(
      ({ departmentId }) => departmentId === selectedDepartmentId.value,
    ) ?? null
  )

  async function fetchAll() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await departmentApi.getList({ size: 999 })
      departments.value = flattenDepartments(response.data.content)

      if (
        selectedDepartmentId.value !== null
        && !departments.value.some(
          ({ departmentId }) => departmentId === selectedDepartmentId.value,
        )
      ) {
        selectedDepartmentId.value = null
      }
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : '조직도를 불러오지 못했습니다.'
      throw error
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
    errorMessage,
    selectedDepartmentId,
    departmentTree,
    selectedDepartment,
    fetchAll,
    selectDepartment,
  }
})
