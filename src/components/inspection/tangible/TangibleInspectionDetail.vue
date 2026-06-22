<template>
  <InspectionDetail
    :is-open="isOpen"
    :inspection="inspection"
    :assigned-targets="assignedTargets"
    asset-type="tangible"
    @close="emit('close')"
    @refresh="emit('refresh')"
  />
</template>

<script setup lang="ts">
import InspectionDetail from '@/components/inspection/common/InspectionDetail.vue'
import type { EmployeeInspectionTargetResponse, InspectionStatus } from '@/types/inspection'

interface TangibleInspectionRow extends Record<string, unknown> {
  rowKey: string
  inspectionId: string
  targetName: string
  executor: string
  status: InspectionStatus
  inspectorDepartment: string
  inspectorName: string
  startDate: string
  endDate: string
  targetAssetCount: number
  completedAssetCount: number
  followUpCount: number
  description: string
}

defineProps<{
  isOpen: boolean
  inspection: TangibleInspectionRow | null
  assignedTargets?: EmployeeInspectionTargetResponse[]
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()
</script>
