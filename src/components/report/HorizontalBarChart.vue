<template>
  <VChart
    class="h-56 w-full"
    :option="chartOption"
    autoresize
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BarChart } from 'echarts/charts'
import type { BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import type {
  GridComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

interface BarItem {
  label: string
  value: number
}

type ChartOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

const props = withDefaults(defineProps<{
  items: BarItem[]
  unit?: string
}>(), {
  unit: '',
})

use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
])

const chartOption = computed<ChartOption>(() => ({
  color: ['#68A1F2'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    valueFormatter: (value) => `${Number(value).toLocaleString('ko-KR')}${props.unit}`,
  },
  grid: {
    top: 8,
    right: 42,
    bottom: 8,
    left: 12,
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: {
      lineStyle: {
        color: '#E5E7EB',
      },
    },
    axisLabel: {
      color: '#9CA3AF',
      fontSize: 11,
    },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: props.items.map((item) => item.label),
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: '#E5E7EB',
      },
    },
    axisLabel: {
      color: '#6B7280',
      fontSize: 11,
      fontWeight: 600,
    },
  },
  series: [
    {
      type: 'bar',
      data: props.items.map((item) => item.value),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        color: '#374151',
        fontSize: 11,
        fontWeight: 700,
        formatter: ({ value }) => `${Number(value).toLocaleString('ko-KR')}${props.unit}`,
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
      },
    },
  ],
}))
</script>
