<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">사원 목록</h2>
    <!-- TODO: 사원 목록 테이블, 검색/필터, 사원 등록 모달 -->
    <p class="text-gray-400">사원 목록 구현 예정</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { memberApi } from '@/api'
import { usePagination, useFilter } from '@/composables'
import type { Member, MemberListFilter } from '@/types'

const members = ref<Member[]>([])
const { page, size, updateFromResponse } = usePagination()
const { activeParams } = useFilter<MemberListFilter>({})

async function fetchMembers() {
  const res = await memberApi.getList({ page: page.value, size: size.value, ...activeParams.value })
  members.value = res.data.content
  updateFromResponse(res.data)
}
onMounted(fetchMembers)
</script>
