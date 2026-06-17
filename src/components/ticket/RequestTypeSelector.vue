<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
      @click="emit('select', option.value)"
    >
      <component :is="option.icon" :size="20" class="mb-3 text-primary" />
      <p class="text-sm font-semibold text-text-main">{{ option.label }}</p>
      <p class="mt-1 text-xs leading-5 text-text-muted">{{ option.description }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  BadgeDollarSign,
  Box,
  CalendarClock,
  PackageCheck,
  PackageX,
  ShoppingCart,
  Wrench,
} from 'lucide-vue-next'

import type { TicketRequestKind } from '@/types'

const options: Array<{
  value: TicketRequestKind
  label: string
  description: string
  icon: typeof Box
}> = [
  {
    value: 'STANDARD_ASSET_REQUEST',
    label: '자산 요청',
    description: '등록된 품목을 선택해 자산을 요청합니다.',
    icon: Box,
  },
  {
    value: 'NON_STANDARD_ASSET_REQUEST',
    label: '구매 요청',
    description: '등록되지 않은 품목의 구매를 요청합니다.',
    icon: ShoppingCart,
  },
  {
    value: 'DIRECT_PURCHASE',
    label: '직접 구매 요청',
    description: '표준 품목을 선택하거나 비표준 품목을 입력해 직접 구매를 요청합니다.',
    icon: BadgeDollarSign,
  },
  {
    value: 'RENTAL',
    label: '대여 자산 요청',
    description: '단기 사용을 위한 자산 대여를 요청합니다.',
    icon: PackageCheck,
  },
  {
    value: 'RENTAL_EXTENSION',
    label: '대여 연장 요청',
    description: '현재 대여 중인 자산의 이용 기간을 연장합니다.',
    icon: CalendarClock,
  },
  {
    value: 'MAINTENANCE',
    label: '자산 서비스 요청',
    description: '자산의 수리 또는 자산의 반품을 요청합니다.',
    icon: Wrench,
  },
  {
    value: 'RETURN',
    label: '자산 반납 및 해지 요청',
    description: '유형자산 반납 또는 무형자산 해지를 요청합니다.',
    icon: PackageX,
  },
  {
    value: 'PURCHASE_RETURN',
    label: '구매 자산 반품 요청',
    description: '구매한 자산의 반품 처리를 요청합니다.',
    icon: PackageX,
  },
]

const emit = defineEmits<{
  select: [kind: TicketRequestKind]
}>()
</script>
