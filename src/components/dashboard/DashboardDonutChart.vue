<template>
  <div class="relative h-50 w-50">
    <VChart
      class="h-full w-full"
      :option="chartOption"
      autoresize
    />
    <div class="pointer-events-none absolute inset-13 flex flex-col items-center justify-center rounded-full bg-surface text-center">
      <span class="text-xs font-semibold text-text-sub">{{ label }}</span>
      <span class="mt-1 text-lg font-bold text-primary">{{ normalizedValue }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PieChart } from 'echarts/charts'
import type { PieSeriesOption } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import type { TooltipComponentOption } from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

type ChartOption = ComposeOption<PieSeriesOption | TooltipComponentOption>

const props = withDefaults(defineProps<{
  value: number
  usedValue?: number
  label?: string
}>(), {
  usedValue: undefined,
  label: '소진율',
})

use([
  PieChart,
  TooltipComponent,
  CanvasRenderer,
])

const normalizedValue = computed(() => clampPercent(props.value))
const normalizedUsedValue = computed(() => Math.min(
  clampPercent(props.usedValue ?? props.value),
  normalizedValue.value,
))
const heldValue = computed(() => Math.max(normalizedValue.value - normalizedUsedValue.value, 0))
const remainingValue = computed(() => Math.max(100 - normalizedValue.value, 0))

const chartOption = computed<ChartOption>(() => ({
  animationDuration: 500,
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      const item = Array.isArray(params) ? params[0] : params
      const name = 'name' in item ? item.name : ''
      const value = 'value' in item ? item.value : 0

      return `${String(name)}: ${Number(value).toLocaleString('ko-KR')}%`
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['64%', '86%'],
      silent: true,
      animation: false,
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      data: [
        {
          name: '배경',
          value: 100,
          itemStyle: {
            color: '#F3F4F6',
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['64%', '86%'],
      avoidLabelOverlap: true,
      silent: false,
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      data: [
        {
          name: '실제 사용',
          value: normalizedUsedValue.value,
          itemStyle: {
            color: '#f97316',
          },
        },
        {
          name: '집행 대기',
          value: heldValue.value,
          itemStyle: {
            color: '#f6bc98',
          },
        },
        {
          name: '',
          value: remainingValue.value,
          itemStyle: {
            color: 'transparent',
          },
        },
      ],
    },
  ],
}))

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}
</script>
