<template>
  <div
    class="pointer-events-none fixed right-5 top-20 z-[11000] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-3"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border bg-surface p-4 shadow-lg',
          colorByType[toast.type],
        ]"
        role="status"
      >
        <component :is="iconByType[toast.type]" :size="20" class="mt-0.5 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-base text-text-main">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-1 text-sm text-text-sub">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="rounded p-0.5 text-text-muted hover:bg-surface-secondary hover:text-text-main"
          aria-label="알림 닫기"
          @click="notificationStore.remove(toast.id)"
        >
          <X :size="16" />
        </button>
        <span
          v-if="toast.duration && toast.duration > 0"
          :class="[
            'toast-progress absolute inset-x-0 bottom-0 h-1',
            progressColorByType[toast.type],
          ]"
          :style="{ animationDuration: `${toast.duration}ms` }"
          aria-hidden="true"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-vue-next'

import { useNotificationStore } from '@/stores'

const notificationStore = useNotificationStore()

const iconByType = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorByType = {
  success: 'border-success/30 text-success',
  error: 'border-danger/30 text-danger',
  warning: 'border-warning/40 text-warning',
  info: 'border-info/30 text-info',
}

const progressColorByType = {
  success: 'bg-success',
  error: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-progress {
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  transform-origin: left;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}
</style>
