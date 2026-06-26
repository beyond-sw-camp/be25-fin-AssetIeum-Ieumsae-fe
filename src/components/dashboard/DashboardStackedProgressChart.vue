<template>
  <div class="h-3 w-full">
    <VChart
      class="block h-full w-full"
      :option="chartOption"
      autoresize
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BarChart } from 'echarts/charts'
import type { BarSeriesOption } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

import type { DashboardSegment } from '@/components/dashboard/ProgressTicketCard.vue'

type ChartOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

interface LayeredSegment extends DashboardSegment {
  cumulativePercent: number
}

const props = defineProps<{
  segments: DashboardSegment[]
}>()

use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
])

const chartSegments = computed<LayeredSegment[]>(() => {
  let cumulativePercent = 0

  return props.segments
    .filter((segment) => segment.percent > 0)
    .map((segment) => {
      cumulativePercent += segment.percent

      return {
        ...segment,
        cumulativePercent: clampPercent(cumulativePercent),
      }
    })
})

const chartOption = computed<ChartOption>(() => ({
  animationDuration: 450,
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      const item = Array.isArray(params) ? params[0] : params
      const data = 'data' in item ? item.data : null
      const segment = typeof data === 'object' && data !== null && 'segment' in data
        ? data.segment as unknown as DashboardSegment
        : null

      if (!segment) return ''

      return `${segment.label}: ${segment.count.toLocaleString('ko-KR')}건 (${segment.percent}%)`
    },
  },
  grid: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  xAxis: {
    type: 'value',
    max: 100,
    show: false,
  },
  yAxis: {
    type: 'category',
    data: [''],
    show: false,
  },
  series: chartSegments.value.length > 0
    ? [...chartSegments.value].reverse().map((segment, index) => ({
      name: segment.label,
      type: 'bar',
      data: [{
        value: segment.cumulativePercent,
        segment,
      }],
      barWidth: 12,
      barGap: '-100%',
      itemStyle: {
        borderRadius: 999,
        color: chartColor(segment.barClass),
      },
      z: index + 1,
    }))
    : [{
      name: '데이터 없음',
      type: 'bar',
      data: [100],
      barWidth: 12,
      itemStyle: {
        borderRadius: 999,
        color: '#F3F4F6',
      },
    }],
}))

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100)
}

function chartColor(className: string) {
  if (className.includes('bg-primary-trans')) return '#f6bc98'
  if (className.includes('bg-primary')) return '#f97316'
  if (className.includes('bg-warning')) return '#facc15'
  if (className.includes('bg-success')) return '#22c55e'
  if (className.includes('bg-danger')) return '#ef4444'
  if (className.includes('bg-neutral-800')) return '#1f2937'
  return '#9CA3AF'
}
</script>
