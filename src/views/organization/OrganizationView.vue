<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">조직도</h2>
    <!-- TODO: 트리 구조 렌더링, 부서 CRUD -->
    <p class="text-gray-400">부서 트리 UI 구현 예정</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useDepartmentStore } from '@/stores'
const deptStore = useDepartmentStore()
onMounted(() => deptStore.fetchAll())
</script>
