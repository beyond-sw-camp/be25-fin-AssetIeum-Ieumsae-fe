<template>
  <div class="grid h-full grid-cols-1 gap-3 pb-6 sm:grid-cols-2 sm:grid-rows-3">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="flex flex-col rounded-xl border border-border bg-surface p-5 text-left transition hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
      @click="handleOptionSelect(option)"
    >
      <div class="rounded-lg bg-primary/10 p-2.5 mb-3 w-fit">
        <component :is="option.icon" :size="24" class="text-primary" />
      </div>
      <div>
        <p class="text-base font-bold text-text-main">{{ option.label }}</p>
        <p class="mt-1.5 text-sm leading-relaxed text-text-muted">{{ option.description }}</p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  BadgeDollarSign,
  Box,
  PackageCheck,
  PackageX,
  ShoppingCart,
  Wrench,
} from 'lucide-vue-next'

import type { TicketRequestKind } from '@/types'

type RequestGroupId =
  | 'asset'
  | 'purchase'
  | 'directPurchase'
  | 'rental'
  | 'service'
  | 'return'

interface RequestChildOption {
  value: TicketRequestKind
  label: string
}

interface RequestGroupOption {
  id: RequestGroupId
  value?: TicketRequestKind
  label: string
  description: string
  icon: typeof Box
  children?: RequestChildOption[]
}

const options: RequestGroupOption[] = [
  {
    id: 'asset',
    value: 'STANDARD_ASSET_REQUEST',
    label: '자산 요청',
    description: '등록된 표준 품목을 선택해 자산을 요청합니다.',
    icon: Box,
  },
  {
    id: 'purchase',
    value: 'NON_STANDARD_ASSET_REQUEST',
    label: '구매 요청',
    description: '등록되지 않은 품목의 구매를 요청합니다.',
    icon: ShoppingCart,
  },
  {
    id: 'directPurchase',
    value: 'DIRECT_PURCHASE',
    label: '직접 구매 요청',
    description: '표준 품목 또는 비표준 품목을 직접 구매로 요청합니다.',
    icon: BadgeDollarSign,
  },
  {
    id: 'rental',
    label: '대여 자산 요청',
    description: '자산 대여 또는 기존 대여 기간 연장을 요청합니다.',
    icon: PackageCheck,
    children: [
      { value: 'RENTAL', label: '대여' },
      { value: 'RENTAL_EXTENSION', label: '대여 연장' },
    ],
  },
  {
    id: 'service',
    label: '자산 서비스 요청',
    description: '사용 중인 자산의 수리 또는 구매 자산 반품을 요청합니다.',
    icon: Wrench,
    children: [
      { value: 'MAINTENANCE', label: '수리' },
      { value: 'PURCHASE_RETURN', label: '반품' },
    ],
  },
  {
    id: 'return',
    value: 'RETURN',
    label: '자산 반납 및 해지 요청',
    description: '유형자산 반납 또는 무형자산 해지를 요청합니다.',
    icon: PackageX,
    children: [
      { value: 'RETURN', label: '반납' },
      { value: 'RETURN', label: '해지' },
    ],
  },
]

const emit = defineEmits<{
  select: [kind: TicketRequestKind]
}>()

function handleOptionSelect(option: RequestGroupOption) {
  if (option.children && option.children.length > 0) {
    emit('select', option.children[0].value)
    return
  }

  if (option.value) emit('select', option.value)
}
</script>
