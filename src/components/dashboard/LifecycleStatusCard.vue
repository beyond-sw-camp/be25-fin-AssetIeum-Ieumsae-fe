<template>
  <div class="rounded-xl border border-border bg-surface p-4 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-bold text-text-main">라이프 사이클 진행 현황</h2>
      <span class="text-xs text-text-sub">최근 이벤트</span>
    </div>
    <div class="space-y-3">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
      >
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <component :is="event.icon" :size="15" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-text-main">{{ event.title }}</p>
          <p class="text-xs text-text-sub">{{ event.description }}</p>
        </div>
        <span class="shrink-0 text-xs font-semibold text-primary">{{ event.dueText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

export interface LifecycleEvent {
  id: string
  title: string
  description: string
  dueText: string
  icon: Component
}

defineProps<{
  events: LifecycleEvent[]
}>()
</script>
