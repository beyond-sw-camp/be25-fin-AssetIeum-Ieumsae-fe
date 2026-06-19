<template>
  <form class="flex h-full flex-col" @submit.prevent="handleSubmit">
    <div class="flex-1 space-y-7 overflow-y-auto px-8 py-8">
      <div class="space-y-2">
        <label class="flex items-center gap-0.5 text-sm font-bold text-text-main" for="hr-event-member">
          임직원 선택
          <span class="text-primary">*</span>
        </label>
        <Dropdown
          id="hr-event-member"
          v-model="form.memberId"
          :options="memberOptions"
          root-option="임직원 선택"
          menu-strategy="fixed"
          :disabled="isLoadingMembers"
        >
        </Dropdown>
        <p
          v-if="!isLoadingMembers && memberOptions.length === 0"
          class="px-0.5 text-xs font-medium text-text-muted"
        >
          선택 가능한 같은 부서 임직원이 없습니다.
        </p>
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-0.5 text-sm font-bold text-text-main" for="hr-event-type">
          이벤트 유형
          <span class="text-primary">*</span>
        </label>
        <Dropdown
          id="hr-event-type"
          v-model="form.eventType"
          :options="eventTypeOptions"
          root-option="선택하세요"
          menu-strategy="fixed"
        />
      </div>
      <Input
        id="hr-event-date"
        v-model="form.eventDate"
        type="date"
        label="이벤트 예정일"
        required
      />

      <p
        v-if="errorMessage"
        class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ errorMessage }}
      </p>
    </div>

    <div class="shrink-0 px-8 py-6">
      <Button
        class="w-full"
        size="m"
        type="submit"
        :disabled="!isCreateReady || isCreating"
        :loading="isCreating"
      >
        등록
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import type { DropdownOption, Member } from '@/types'
import type { HrEventType } from '@/types/hr'

export interface HrEventRegisterSubmitPayload {
  memberId: string
  eventType: HrEventType
  eventDate: string
}

const EVENT_TYPE_LABEL: Record<HrEventType, string> = {
  ONBOARDING: '입사',
  OFFBOARDING: '퇴사',
  DEPARTMENT_TRANSFER: '부서 이동',
  LEAVE: '휴직',
  RETURN: '복직',
}

const props = defineProps<{
  members: Member[]
  isLoadingMembers?: boolean
  isCreating?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: [payload: HrEventRegisterSubmitPayload]
}>()

const form = reactive<{
  memberId: string
  eventType: '' | HrEventType
  eventDate: string
}>({
  memberId: '',
  eventType: '',
  eventDate: '',
})

const memberOptions = computed<DropdownOption[]>(() => props.members.map((member) => ({
  label: `${member.memberNo} · ${member.name}`,
  value: member.memberId,
})))

const eventTypeOptions = computed<DropdownOption[]>(() => (
  Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ label, value }))
))

const isCreateReady = computed(() => Boolean(
  form.memberId
  && form.eventType
  && form.eventDate
))

function resetForm() {
  form.memberId = ''
  form.eventType = ''
  form.eventDate = ''
}

function handleSubmit() {
  if (!isCreateReady.value || !form.eventType || props.isCreating) return

  emit('submit', {
    memberId: String(form.memberId),
    eventType: form.eventType,
    eventDate: form.eventDate,
  })
}

defineExpose({
  resetForm,
})
</script>
