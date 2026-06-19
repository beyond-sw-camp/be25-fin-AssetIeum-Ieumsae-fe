<template>
  <VChart
    class="h-80 w-full"
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
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

export interface GroupedBarItem {
  label: string
  primary: number
  secondary: number
}

type ChartOption = ComposeOption<
  BarSeriesOption | GridComponentOption | LegendComponentOption | TooltipComponentOption
>

const props = withDefaults(defineProps<{
  items: GroupedBarItem[]
  primaryLabel?: string
  secondaryLabel?: string
}>(), {
  primaryLabel: '미반납 자산 수',
  secondaryLabel: '반납 지연 건수',
})

use([
  BarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const chartOption = computed<ChartOption>(() => ({
  color: ['#3B9BF4', '#45C980'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    valueFormatter: (value) => `${Number(value).toLocaleString('ko-KR')}건`,
  },
  legend: {
    bottom: 0,
    itemHeight: 10,
    itemWidth: 10,
    textStyle: {
      color: '#6B7280',
      fontSize: 12,
      fontWeight: 600,
    },
  },
  grid: {
    top: 24,
    right: 16,
    bottom: 48,
    left: 44,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
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
      interval: 0,
    },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: {
      lineStyle: {
        color: '#E5E7EB',
        type: 'dashed',
      },
    },
    axisLabel: {
      color: '#9CA3AF',
      fontSize: 11,
    },
  },
  series: [
    {
      name: props.primaryLabel,
      type: 'bar',
      data: props.items.map((item) => item.primary),
      barWidth: 18,
      barGap: '35%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },
    {
      name: props.secondaryLabel,
      type: 'bar',
      data: props.items.map((item) => item.secondary),
      barWidth: 18,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },
  ],
}))
</script>
