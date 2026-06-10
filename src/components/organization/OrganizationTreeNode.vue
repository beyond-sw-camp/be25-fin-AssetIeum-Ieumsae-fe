<script setup lang="ts">
import { ChevronRight, Folder, FolderOpen, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'

import type { DepartmentTreeNode } from '@/types'

defineOptions({ name: 'OrganizationTreeNode' })

interface Props {
  node: DepartmentTreeNode
  selectedDepartmentId: number | null
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: false,
})

const emit = defineEmits<{
  select: [departmentId: number]
  delete: [department: DepartmentTreeNode]
}>()

const isExpanded = ref(true)
</script>

<template>
  <li>
    <div
      :class="[
        'group flex min-h-10 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
        props.selectedDepartmentId === props.node.departmentId
          ? 'bg-primary-light text-primary'
          : 'text-text-main hover:bg-surface-secondary',
      ]"
    >
      <button
        v-if="props.node.children.length"
        type="button"
        class="rounded p-0.5 text-text-sub hover:bg-black/5"
        :aria-label="isExpanded ? `${props.node.name} 접기` : `${props.node.name} 펼치기`"
        @click.stop="isExpanded = !isExpanded"
      >
        <ChevronRight
          :size="16"
          :class="['transition-transform', isExpanded && 'rotate-90']"
        />
      </button>
      <span v-else class="w-5" />

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        @click="emit('select', props.node.departmentId)"
      >
        <FolderOpen v-if="isExpanded && props.node.children.length" :size="18" />
        <Folder v-else :size="18" />
        <span class="truncate text-sm font-medium">{{ props.node.name }}</span>
      </button>

      <span
        v-if="props.node.memberCount > 0"
        class="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white"
      >
        {{ props.node.memberCount }}
      </span>

      <button
        v-if="props.canDelete && props.node.parentDepartmentId !== null"
        type="button"
        class="rounded-lg p-1 text-text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"
        :aria-label="`${props.node.name} 삭제`"
        @click.stop="emit('delete', props.node)"
      >
        <Trash2 :size="16" />
      </button>
    </div>

    <ul v-if="isExpanded && props.node.children.length" class="ml-5 border-l border-border pl-2">
      <OrganizationTreeNode
        v-for="child in props.node.children"
        :key="child.departmentId"
        :node="child"
        :selected-department-id="props.selectedDepartmentId"
        :can-delete="props.canDelete"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
      />
    </ul>
  </li>
</template>
