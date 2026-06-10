<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-6">대시보드</h2>
    <!-- TODO: 역할에 따라 구매자산팀/부서책임자/사원 대시보드 분기 -->
    <p class="text-gray-500">역할: {{ auth.user?.role }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores'
const auth = useAuthStore()
</script>
