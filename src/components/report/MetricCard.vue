<template>
  <div class="rounded-lg border border-border bg-surface p-6 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm font-bold text-text-main">{{ label }}</p>
      <span :class="['rounded-md px-2 py-1 text-xs font-bold', toneClass]">
        {{ badge }}
      </span>
    </div>
    <p class="mt-4 text-3xl font-extrabold text-text-main">{{ value }}</p>
    <p class="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-sub">
      <span>{{ caption }}</span>
      <span
        v-if="changeRate !== undefined"
        :class="['rounded-full px-3 py-1 text-sm font-extrabold shadow-sm', changeRateClass]"
      >
        {{ animatedChangeRateText }}
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string
  caption: string
  badge?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  changeRate?: number
}>(), {
  badge: '지표',
  tone: 'blue',
  changeRate: undefined,
})

const ANIMATION_DURATION_MS = 800
const animatedChangeRate = ref(0)
let animationFrameId: number | null = null

const toneClass = computed(() => ({
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
}[props.tone]))

const changeRateClass = computed(() => {
  if ((props.changeRate ?? 0) > 0) return 'bg-green-50 text-green-700 ring-1 ring-green-200'
  if ((props.changeRate ?? 0) < 0) return 'bg-red-50 text-red-700 ring-1 ring-red-200'
  return 'bg-surface-secondary text-text-main ring-1 ring-border'
})

const animatedChangeRateText = computed(() => {
  const value = animatedChangeRate.value
  const sign = value > 0 ? '+' : ''
  const formatted = new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 1,
  }).format(value)

  return `${sign}${formatted}%`
})

watch(
  () => props.changeRate,
  (nextValue) => {
    if (nextValue === undefined) return
    animateChangeRate(nextValue)
  },
  { immediate: true },
)

function animateChangeRate(targetValue: number) {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  const startTime = performance.now()
  const startValue = 0

  const step = (currentTime: number) => {
    const progress = Math.min((currentTime - startTime) / ANIMATION_DURATION_MS, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    animatedChangeRate.value = startValue + (targetValue - startValue) * easedProgress

    if (progress < 1) {
      animationFrameId = window.requestAnimationFrame(step)
    } else {
      animatedChangeRate.value = targetValue
      animationFrameId = null
    }
  }

  animatedChangeRate.value = startValue
  animationFrameId = window.requestAnimationFrame(step)
}

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }
})
</script>
