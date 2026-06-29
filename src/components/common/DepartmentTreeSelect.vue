<template>
  <div class="relative rounded-xl">
    <button
      :id="id"
      type="button"
      class="w-full h-9 inline-flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-text-main transition-all hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
      :class="hasError && 'border-danger focus:ring-danger/20'"
      :disabled="disabled"
      :aria-invalid="hasError"
      @click="toggleOpen"
    >
      <span :class="selectedDepartment ? 'min-w-0 truncate font-medium text-text-main' : 'text-text-muted'">
        {{ selectedDepartment ? selectedDepartment.path : placeholder }}
      </span>
      <ChevronDown
        :size="16"
        class="shrink-0 text-text-muted transition-transform"
        :class="isOpen && 'rotate-180'"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
    >
      <div
        v-for="row in visibleRows"
        :key="row.node.departmentId"
        class="flex w-full items-center rounded-lg text-sm transition-colors hover:bg-surface-secondary"
        :class="modelValue === row.node.departmentId ? 'font-semibold text-primary' : 'text-text-main'"
        :style="{ paddingLeft: `${12 + row.depth * 18}px` }"
      >
        <button
          type="button"
          class="min-w-0 flex-1 truncate py-2 text-left"
          @click="selectDepartment(row.node)"
        >
          {{ row.node.name }}
        </button>
        <button
          v-if="row.node.children.length"
          type="button"
          class="mr-2 flex size-6 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface"
          @click="toggleDepartment(row.node.departmentId)"
        >
          <ChevronDown
            :size="15"
            class="transition-transform"
            :class="expandedDepartmentIds.has(row.node.departmentId) && 'rotate-180'"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Department } from '@/types'

interface DepartmentNode extends Department {
  children: DepartmentNode[]
}

interface VisibleDepartmentRow {
  node: DepartmentNode
  depth: number
}

const props = withDefaults(defineProps<{
  id?: string
  modelValue?: string | null
  departments: Department[]
  placeholder?: string
  disabled?: boolean
  expandAllOnOpen?: boolean
  keepOpenOnParentSelect?: boolean
  hasError?: boolean
}>(), {
  id: undefined,
  modelValue: null,
  placeholder: '부서 선택',
  disabled: false,
  expandAllOnOpen: true,
  keepOpenOnParentSelect: false,
  hasError: false,
})

const emit = defineEmits<{
  'update:modelValue': [departmentId: string | null]
}>()

const isOpen = ref(false)
const expandedDepartmentIds = ref<Set<string>>(new Set())

const flatDepartments = computed(() => {
  const departmentById = new Map<string, Department>()

  const visit = (departments: Department[]) => {
    departments.forEach((department) => {
      const { children = [], ...current } = department
      departmentById.set(current.departmentId, current)
      visit(children)
    })
  }

  visit(props.departments)
  return Array.from(departmentById.values())
})

const departmentTree = computed<DepartmentNode[]>(() => {
  const map = new Map<string, DepartmentNode>()
  const roots: DepartmentNode[] = []

  flatDepartments.value.forEach((department) => {
    map.set(department.departmentId, { ...department, children: [] })
  })

  flatDepartments.value.forEach((department) => {
    const node = map.get(department.departmentId)
    if (!node) return

    const parent = department.parentDepartmentId
      ? map.get(department.parentDepartmentId)
      : undefined

    if (parent) {
      parent.children.push(node)
      return
    }

    roots.push(node)
  })

  return roots
})

const departmentById = computed(() => (
  new Map(flatDepartments.value.map((department) => [department.departmentId, department]))
))

const parentDepartmentIds = computed(() => {
  const ids: string[] = []

  const visit = (nodes: DepartmentNode[]) => {
    nodes.forEach((node) => {
      if (node.children.length) {
        ids.push(node.departmentId)
        visit(node.children)
      }
    })
  }

  visit(departmentTree.value)
  return ids
})

const visibleRows = computed<VisibleDepartmentRow[]>(() => {
  const rows: VisibleDepartmentRow[] = []

  const visit = (nodes: DepartmentNode[], depth: number) => {
    nodes.forEach((node) => {
      rows.push({ node, depth })
      if (expandedDepartmentIds.value.has(node.departmentId)) {
        visit(node.children, depth + 1)
      }
    })
  }

  visit(departmentTree.value, 0)
  return rows
})

const getDepartmentPath = (department: Department) => {
  const names: string[] = []
  let current: Department | undefined = department

  while (current) {
    names.unshift(current.name)
    current = current.parentDepartmentId
      ? departmentById.value.get(current.parentDepartmentId)
      : undefined
  }

  return names.join(' > ')
}

const selectedDepartment = computed(() => {
  if (!props.modelValue) return null
  const department = departmentById.value.get(props.modelValue)
  if (!department) return null

  return {
    ...department,
    path: getDepartmentPath(department),
  }
})

const expandAllParents = () => {
  expandedDepartmentIds.value = new Set(parentDepartmentIds.value)
}

const toggleOpen = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value && props.expandAllOnOpen) {
    expandAllParents()
  }
}

const toggleDepartment = (departmentId: string) => {
  const next = new Set(expandedDepartmentIds.value)

  if (next.has(departmentId)) {
    next.delete(departmentId)
  } else {
    next.add(departmentId)
  }

  expandedDepartmentIds.value = next
}

const selectDepartment = (department: DepartmentNode) => {
  emit('update:modelValue', department.departmentId)
  if (props.keepOpenOnParentSelect && department.children.length) {
    toggleDepartment(department.departmentId)
    return
  }
  isOpen.value = false
}

watch(() => props.disabled, (disabled) => {
  if (disabled) {
    isOpen.value = false
  }
})
</script>
