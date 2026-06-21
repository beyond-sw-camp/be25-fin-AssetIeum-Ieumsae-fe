<template>
  <InspectionRegister
    :is-open="isOpen"
    asset-type="intangible"
    @close="emit('close')"
    @registered="emit('registered')"
  />
</template>

<script setup lang="ts">
import InspectionRegister from '@/components/inspection/common/InspectionRegister.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  registered: []
}>()
</script>
