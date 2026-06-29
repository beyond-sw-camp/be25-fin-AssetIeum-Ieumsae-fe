<template>
  <div class="mt-3 flex items-center justify-center">
    <Pagination
      :current-page="page"
      :total-pages="totalPages"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import Pagination from '@/components/common/Pagination.vue'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  change: [page: number]
}>()

function handleChange(nextPage: number) {
  emit('change', nextPage)
  if (nextPage === props.page - 1) emit('prev')
  if (nextPage === props.page + 1) emit('next')
}
</script>
