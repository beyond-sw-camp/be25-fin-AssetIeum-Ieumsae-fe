<template>
  <div class="h-2 w-16 overflow-hidden rounded-full bg-surface-secondary">
    <VChart
      class="h-full w-full"
      :option="chartOption"
      autoresize
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BarChart } from 'echarts/charts'
import type { BarSeriesOption } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import type { GridComponentOption } from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

type ChartOption = ComposeOption<BarSeriesOption | GridComponentOption>

const props = defineProps<{
  value: number
}>()

use([
  BarChart,
  GridComponent,
  CanvasRenderer,
])

const normalizedValue = computed(() => clampPercent(props.value))

const chartOption = computed<ChartOption>(() => ({
  animationDuration: 350,
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
  series: [
    {
      name: '가용률',
      type: 'bar',
      data: [normalizedValue.value],
      barWidth: 6,
      itemStyle: {
        borderRadius: 999,
        color: '#f97316',
      },
    },
  ],
}))

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}
</script>
