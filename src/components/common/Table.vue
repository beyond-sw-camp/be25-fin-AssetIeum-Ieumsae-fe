<script setup lang="ts" generic="T extends Record<string, unknown>">
// 범용 데이터 테이블 컴포넌트 (다크모드 지원 및 스크립트 통합 버전)

export interface Column<T> {
  key: keyof T | string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

interface Props {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyText?: string
  rowKey?: keyof T
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '데이터가 없습니다.',
  rowKey: 'id' as keyof T,
})

const emit = defineEmits<{
  'row-click': [row: T]
  'sort': [key: string]
}>()

function getCellValue(row: T, key: string): unknown {
  return key.split('.').reduce((obj: unknown, k) => {
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[k]
    }
    return undefined
  }, row)
}

// 테마 변수를 타는 텍스트 정렬 매핑
const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }
</script>

<template>
  <div class="relative overflow-x-auto rounded-xl border border-border bg-surface transition-colors duration-300">
    
    <div
      v-if="props.loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 backdrop-blur-[1px]"
    >
      <svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>

    <table class="w-full table-auto text-sm text-text-main">
      <thead class="bg-surface-secondary text-xs uppercase tracking-wide text-text-sub border-b border-border transition-colors duration-300">
        <tr>
          <th
            v-for="col in props.columns"
            :key="String(col.key)"
            :style="col.width ? { width: col.width } : {}"
            :class="[
              'px-4 py-3 font-semibold',
              alignClass[col.align ?? 'left'],
              col.sortable && 'cursor-pointer select-none hover:text-text-main transition-colors',
            ]"
            @click="col.sortable && emit('sort', String(col.key))"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-border transition-colors duration-300">
        <tr v-if="!props.loading && props.rows.length === 0">
          <td
            :colspan="props.columns.length"
            class="py-12 text-center text-text-muted"
          >
            {{ props.emptyText }}
          </td>
        </tr>

        <tr
          v-for="(row, i) in props.rows"
          :key="String((row as Record<string, unknown>)[String(props.rowKey)] ?? i)"
          class="hover:bg-surface-secondary transition-colors duration-100 cursor-pointer"
          @click="emit('row-click', row)"
        >
          <td
            v-for="col in props.columns"
            :key="String(col.key)"
            :class="['px-4 py-3', alignClass[col.align ?? 'left']]"
          >
            <slot :name="`cell-${String(col.key)}`" :value="getCellValue(row, String(col.key))" :row="row">
              <span class="font-medium text-text-main">
                {{ getCellValue(row, String(col.key)) ?? '–' }}
              </span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>