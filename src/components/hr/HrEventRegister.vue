<template>
  <div class="flex h-full flex-col">
    <div class="flex-1 space-y-7 overflow-y-auto px-4 py-5">
      <section class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-bold text-text-main">
          <span class="h-4 w-1 rounded-full bg-primary"></span>
          대상자 정보
        </h3>
        <div class="space-y-2">
          <label class="text-xs font-semibold text-text-sub" for="hr-event-member">임직원 검색</label>
          <Dropdown
            id="hr-event-member"
            v-model="form.memberId"
            :options="memberOptions"
            root-option="사번 + 멤버 선택"
            :disabled="isLoadingMembers"
          >
            <template #icon>
              <Users :size="15" class="text-text-sub" />
            </template>
          </Dropdown>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-bold text-text-main">
          <span class="h-4 w-1 rounded-full bg-primary"></span>
          이벤트 설정
        </h3>
        <div class="space-y-2">
          <label class="text-xs font-semibold text-text-sub" for="hr-event-type">이벤트 유형</label>
          <Dropdown
            id="hr-event-type"
            v-model="form.eventType"
            :options="eventTypeOptions"
            root-option="선택하세요"
          />
        </div>
        <Input
          id="hr-event-date"
          v-model="form.eventDate"
          type="date"
          label="이벤트 예정일"
          required
        />
      </section>

      <section class="space-y-3">
        <h3 class="flex items-center gap-2 text-sm font-bold text-text-main">
          <span class="h-4 w-1 rounded-full bg-primary"></span>
          템플릿 선택
        </h3>
        <div class="space-y-2">
          <label class="text-xs font-semibold text-text-sub" for="hr-event-template">적용할 템플릿</label>
          <Dropdown
            id="hr-event-template"
            v-model="form.templateId"
            :options="templateOptions"
            root-option="템플릿을 선택하세요"
          />
        </div>
      </section>

      <div class="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-semibold leading-5 text-primary">
        템플릿을 선택하면 해당 이벤트 발생 시 자동으로 자산 요청 티켓이 생성됩니다.
      </div>

      <p
        v-if="errorMessage"
        class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ errorMessage }}
      </p>
    </div>

    <div class="flex shrink-0 gap-3 border-t border-border px-4 py-4">
      <Button
        class="flex-1"
        variant="outline"
        :disabled="isCreating"
        @click="handleCancel"
      >
        취소
      </Button>
      <Button
        class="flex-1"
        :disabled="!isCreateReady || isCreating"
        :loading="isCreating"
        @click="handleSubmit"
      >
        등록
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Users } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import type { DropdownOption, Member } from '@/types'
import type { HrEventType, HrTemplateResponse } from '@/types/hr'

const CURRENT_TEMPLATE_OPTION_VALUE = 'current-department-template'

export interface HrEventRegisterSubmitPayload {
  memberId: string
  eventType: HrEventType
  eventDate: string
  templateId: string
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
  template: HrTemplateResponse | null
  isLoadingMembers?: boolean
  isCreating?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: HrEventRegisterSubmitPayload]
}>()

const form = reactive<{
  memberId: string
  eventType: '' | HrEventType
  eventDate: string
  templateId: string | number | ''
}>({
  memberId: '',
  eventType: '',
  eventDate: '',
  templateId: '',
})

const memberOptions = computed<DropdownOption[]>(() => props.members.map((member) => ({
  label: `${member.memberNo} · ${member.name}`,
  value: member.memberId,
})))

const eventTypeOptions = computed<DropdownOption[]>(() => (
  Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ label, value }))
))

const templateOptions = computed<DropdownOption[]>(() => {
  if (!props.template) return []

  const templateId = props.template.templateId ?? props.template.hrTemplateId ?? CURRENT_TEMPLATE_OPTION_VALUE

  return [{
    label: getTemplateLabel(props.template),
    value: templateId,
  }]
})

const isCreateReady = computed(() => Boolean(
  form.memberId
  && form.eventType
  && form.eventDate
  && form.templateId,
))

watch(templateOptions, (options) => {
  form.templateId = options[0]?.value ?? ''
}, { immediate: true })

function resetForm() {
  form.memberId = ''
  form.eventType = ''
  form.eventDate = ''
  form.templateId = templateOptions.value[0]?.value ?? ''
}

function handleCancel() {
  resetForm()
  emit('close')
}

function handleSubmit() {
  if (!isCreateReady.value || !form.eventType || props.isCreating) return

  emit('submit', {
    memberId: String(form.memberId),
    eventType: form.eventType,
    eventDate: form.eventDate,
    templateId: String(form.templateId),
  })
}

function getTemplateLabel(value: HrTemplateResponse) {
  if (value.name) return value.name
  if (value.departmentName) return `${value.departmentName} HR 템플릿`
  return '우리 부서 HR 템플릿'
}

defineExpose({
  resetForm,
})
</script>
