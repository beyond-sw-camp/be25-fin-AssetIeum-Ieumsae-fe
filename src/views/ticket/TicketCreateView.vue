<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">티켓 생성</h2>
    <!-- TODO: 티켓 종류 선택 → 종류별 폼 렌더링 -->
    <select v-model="selectedType" class="rounded border border-gray-300 px-3 py-2">
      <option :value="null">티켓 종류를 선택하세요</option>
      <option value="ASSET_REQUEST">표준 자산 요청</option>
      <option value="NON_STANDARD_REQUEST">비표준 자산 요청</option>
      <option value="RENTAL_REQUEST">대여 요청</option>
      <option value="MAINTENANCE_REQUEST">유지보수 요청</option>
      <option value="RETURN_REQUEST">반납 요청</option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { TicketType } from '@/types'
const selectedType = ref<TicketType | null>(null)
</script>
