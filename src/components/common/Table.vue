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

    <table :class="['w-full table-fixed text-sm text-text-main', props.tableClass]">
      <thead class="bg-surface-secondary text-xs uppercase tracking-wide text-text-sub border-b border-border transition-colors duration-300">
        <tr>
          <th
            v-for="col in props.columns"
            :key="String(col.key)"
            :style="col.width ? { width: col.width } : {}"
            :class="[
              'px-4 py-3 font-semibold whitespace-nowrap',
              alignClass[col.align ?? 'left'],
              col.sortable && 'cursor-pointer select-none hover:text-text-main transition-colors',
            ]"
            @click="col.sortable && emit('sort', String(col.key))"
          >
            <span
              :class="[
                'inline-flex items-center gap-1',
                alignClass[col.align ?? 'left'],
              ]"
            >
              {{ col.label }}
              <span
                v-if="col.sortDirection"
                class="text-[10px] leading-none"
                aria-hidden="true"
              >
                {{ col.sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </span>
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
            :style="col.width ? { width: col.width } : {}"
            :class="['overflow-hidden px-4 py-3', alignClass[col.align ?? 'left']]"
          >
            <div
              :class="cellContentClass(col)"
              @mouseenter="handleCellMouseEnter($event, col)"
              @mouseleave="handleCellMouseLeave"
            >
              <slot :name="`cell-${String(col.key)}`" :value="getCellValue(row, String(col.key))" :row="row">
                <span class="font-medium text-text-main">
                  {{ getCellValue(row, String(col.key)) ?? '–' }}
                </span>
              </slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <Teleport to="body">
    <div
      v-if="tooltip.isVisible"
      ref="tooltipElement"
      role="tooltip"
      class="pointer-events-none fixed z-[11000] max-w-80 break-words rounded-md bg-gray px-2 py-1 text-xs font-medium leading-5 text-main shadow-lg"
      :style="{
        left: `${tooltip.left}px`,
        top: `${tooltip.top}px`,
        visibility: tooltip.isPositioned ? 'visible' : 'hidden',
      }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
// 범용 데이터 테이블 컴포넌트 (다크모드 지원 및 스크립트 통합 버전)

import { nextTick, onBeforeUnmount, reactive, ref } from 'vue'

export interface Column<T> {
  key: keyof T | string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortDirection?: 'asc' | 'desc'
  truncate?: boolean
  maxLines?: 1 | 2
  tooltip?: boolean
}

interface Props {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyText?: string
  rowKey?: keyof T
  tableClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '데이터가 없습니다.',
  rowKey: 'id' as keyof T,
  tableClass: '',
})

const emit = defineEmits<{
  'row-click': [row: T]
  'sort': [key: string]
}>()

const tooltipElement = ref<HTMLElement | null>(null)
const tooltip = reactive({
  isVisible: false,
  isPositioned: false,
  text: '',
  left: 0,
  top: 0,
})
let tooltipTarget: HTMLElement | null = null

function getCellValue(row: T, key: string): unknown {
  return key.split('.').reduce((obj: unknown, k) => {
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[k]
    }
    return undefined
  }, row)
}

const twoLineCellKeys = new Set([
  'assetname',
  'assetitemname',
  'itemname',
  'productname',
])

const nonTruncatingCellKeys = new Set([
  'action',
  'actions',
  'delivery',
  'manage',
  'management',
  'menu',
  'select',
  'selection',
])

function shouldTruncate(col: Column<T>) {
  if (col.truncate !== undefined) return col.truncate
  return !nonTruncatingCellKeys.has(String(col.key).toLowerCase())
}

function cellMaxLines(col: Column<T>) {
  if (col.maxLines) return col.maxLines
  return twoLineCellKeys.has(String(col.key).toLowerCase()) ? 2 : 1
}

function cellContentClass(col: Column<T>) {
  if (!shouldTruncate(col)) return 'min-w-0 max-w-full'
  if (cellMaxLines(col) === 2) {
    return 'line-clamp-2 max-h-10 min-w-0 max-w-full break-words whitespace-normal leading-5'
  }
  return 'min-w-0 max-w-full truncate whitespace-nowrap'
}

async function handleCellMouseEnter(event: MouseEvent, col: Column<T>) {
  if (col.tooltip === false || !shouldTruncate(col)) return

  const element = event.currentTarget as HTMLElement
  if (!isCellOverflowing(element)) return

  const text = element.innerText.replace(/\s+/g, ' ').trim()
  if (!text) return

  tooltipTarget = element
  tooltip.text = text
  tooltip.isPositioned = false
  tooltip.isVisible = true

  await nextTick()
  if (tooltipTarget !== element || !tooltipElement.value) return

  positionTooltip(element, tooltipElement.value)
}

function isCellOverflowing(element: HTMLElement) {
  if (
    element.scrollWidth > element.clientWidth + 1
    || element.scrollHeight > element.clientHeight + 1
  ) {
    return true
  }

  const range = document.createRange()
  range.selectNodeContents(element)
  const contentRect = range.getBoundingClientRect()

  return contentRect.width > element.clientWidth + 1
    || contentRect.height > element.clientHeight + 1
}

function positionTooltip(target: HTMLElement, tooltipNode: HTMLElement) {
  const targetRect = target.getBoundingClientRect()
  const tooltipRect = tooltipNode.getBoundingClientRect()
  const viewportPadding = 8
  const gap = 6
  const centeredLeft = targetRect.left + (targetRect.width - tooltipRect.width) / 2
  const maxLeft = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding)

  tooltip.left = Math.min(Math.max(centeredLeft, viewportPadding), maxLeft)
  tooltip.top = targetRect.top - tooltipRect.height - gap >= viewportPadding
    ? targetRect.top - tooltipRect.height - gap
    : Math.min(window.innerHeight - tooltipRect.height - viewportPadding, targetRect.bottom + gap)
  tooltip.isPositioned = true
}

function handleCellMouseLeave() {
  hideTooltip()
}

function hideTooltip() {
  tooltipTarget = null
  tooltip.isVisible = false
  tooltip.isPositioned = false
  tooltip.text = ''
}

window.addEventListener('scroll', hideTooltip, true)
window.addEventListener('resize', hideTooltip)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', hideTooltip, true)
  window.removeEventListener('resize', hideTooltip)
})

// 테마 변수를 타는 텍스트 정렬 매핑
const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }
</script>
