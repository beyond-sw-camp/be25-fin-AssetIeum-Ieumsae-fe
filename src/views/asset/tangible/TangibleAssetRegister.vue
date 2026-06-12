<template>
  <BaseDrawer
    :is-open="isOpen"
    title="자산 등록"
    @close="handleClose"
  >
    <div class="space-y-8">
      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          기본 정보
        </h2>
        <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <FormField label="제품명" required>
            <Dropdown
              v-model="selectedAssetItemName"
              :options="assetItemNames"
              root-option="제품명 선택"
            />
          </FormField>

          <Input
            id="register-assetCode"
            model-value="자동 생성"
            label="자산 코드"
            disabled
          />

          <FormField label="자산 상태">
            <Dropdown v-model="selectedStatusLabel" :options="statusOptions" />
          </FormField>

          <Input
            id="register-serialNo"
            v-model="formData.serialNo"
            label="시리얼 번호"
            required
            placeholder="시리얼 번호 입력"
          />

          <FormField label="공용자산 여부" required>
            <Dropdown v-model="formData.assetUsageType" :options="assetUsageTypeOptions" root-option="-- 공용자산 여부 선택 --" />
          </FormField>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          사용 정보
        </h2>
        <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <FormField label="사용 유형" required>
            <Dropdown v-model="formData.usageType" :options="usageTypeOptions" root-option="-- 사용 유형 선택 --" />
          </FormField>

          <Input
            id="register-location"
            v-model="formData.location"
            label="위치"
            required
            placeholder="위치 입력"
          />

          <Input
            id="register-startedAt"
            v-model="formData.startedAt"
            type="datetime-local"
            label="사용 시작 일시"
            :required="requiresAssignmentInfo"
            placeholder="사용 시작 일시 입력"
          />

          <Input
            id="register-returnDueDate"
            v-model="formData.returnDueDate"
            type="datetime-local"
            label="반납 예정 일시"
            placeholder="반납 예정 일시 입력"
          />

          <FormField label="부서" :required="requiresAssignmentInfo">
            <Dropdown
              v-model="formData.departmentName"
              :options="departmentOptions"
              root-option="-- 부서 선택 --"
            />
          </FormField>

          <FormField label="사용자" :required="requiresAssignmentInfo">
            <Dropdown
              v-model="formData.memberName"
              :options="memberOptions"
              root-option="-- 사용자(사번) 선택 --"
            />
          </FormField>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          구매 정보
        </h2>
        <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <Input
            id="register-purchaseDate"
            v-model="formData.purchaseDate"
            type="datetime-local"
            label="구매 일시"
            placeholder="구매 일시 입력"
            required
          />

          <Input
            id="register-purchasePrice"
            v-model="formData.purchasePrice"
            label="구매 금액"
            placeholder="구매 금액 입력"
            required
          />

          <Input
            id="register-vendor"
            v-model="formData.vendor"
            label="구매처"
            placeholder="구매처 입력"
            required
          />

          <Input
            id="register-warrantyExpiredAt"
            v-model="formData.warrantyExpiredAt"
            type="datetime-local"
            label="보증 만료 일시"
            placeholder="보증 만료 일시 입력"
            required
          />
        </div>
      </section>
    </div>

    <template #footer>
      <Button
        class="w-full"
        size="m"
        :disabled="!isRegisterReady || isSaving"
        :loading="isSaving"
        @click="handleSave"
      >
        등록
      </Button>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { tangibleAssetApi } from '@/api/asset.api'
import { TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type {
  Department,
  Member,
  TangibleAsset,
  TangibleAssetCreateRequest,
  TangibleAssetStatus,
  TangibleAssetUsageType,
} from '@/types'

interface AssetItemOption {
  id: string
  name: string
  manufacturer: string
  modelName: string
}

interface RegisterForm {
  serialNo: string
  assetUsageType: string
  usageType: string
  location: string
  startedAt: string
  returnDueDate: string
  departmentName: string
  memberName: string
  purchaseDate: string
  purchasePrice: string
  vendor: string
  warrantyExpiredAt: string
}

const props = defineProps<{
  isOpen: boolean
  companyId?: string
  initialItems: AssetItemOption[]
  departments: Department[]
  members: Member[]
}>()

const emit = defineEmits<{
  close: []
  registered: [asset: TangibleAsset]
}>()

const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  setup(fieldProps, { slots }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('label', { class: 'text-sm font-semibold text-text-main flex items-center gap-0.5' }, [
        fieldProps.label,
        fieldProps.required ? h('span', { class: 'ml-1 text-primary font-bold' }, '*') : null,
      ]),
      slots.default?.(),
    ])
  },
})

const statusOptions = [
  TANGIBLE_STATUS_LABEL.AVAILABLE,
  TANGIBLE_STATUS_LABEL.IN_USE,
  TANGIBLE_STATUS_LABEL.REPAIRING,
]

const statusByLabel: Record<string, TangibleAssetStatus> = {
  [TANGIBLE_STATUS_LABEL.AVAILABLE]: 'AVAILABLE',
  [TANGIBLE_STATUS_LABEL.IN_USE]: 'IN_USE',
  [TANGIBLE_STATUS_LABEL.REPAIRING]: 'REPAIRING',
}

const assetUsageTypeOptions = ['공용자산', '개인자산']
const usageTypeOptions = ['정식 배정', '임시 대여', '미배정']

const createInitialForm = (): RegisterForm => ({
  serialNo: '',
  assetUsageType: '-- 공용자산 여부 선택 --',
  usageType: '-- 사용 유형 선택 --',
  location: '',
  startedAt: '',
  returnDueDate: '',
  departmentName: '-- 부서 선택 --',
  memberName: '-- 사용자(사번) 선택 --',
  purchaseDate: '',
  purchasePrice: '',
  vendor: '',
  warrantyExpiredAt: '',
})

const selectedAssetItemName = ref('제품명 선택')
const selectedStatusLabel = ref(TANGIBLE_STATUS_LABEL.AVAILABLE)
const formData = ref<RegisterForm>(createInitialForm())
const isSaving = ref(false)

const assetItemNames = computed(() => props.initialItems.map((item) => item.name))
const departmentOptions = computed(() => props.departments.map((department) => department.name))
const memberOptions = computed(() => props.members.map((member) => `${member.name}(${member.memberNo})`))

const selectedAssetItem = computed(() => (
  props.initialItems.find((item) => item.name === selectedAssetItemName.value)
))

const selectedDepartment = computed(() => (
  props.departments.find((department) => department.name === formData.value.departmentName)
))

const selectedMember = computed(() => (
  props.members.find((member) => `${member.name}(${member.memberNo})` === formData.value.memberName)
))

const selectedStatus = computed(() => (
  statusByLabel[selectedStatusLabel.value] ?? 'AVAILABLE'
))

const requiresAssignmentInfo = computed(() => (
  selectedStatus.value !== 'AVAILABLE' && selectedStatus.value !== 'DISPOSED'
))

const effectiveDepartment = computed(() => (
  selectedDepartment.value
  ?? props.departments.find((department) => department.departmentId === selectedMember.value?.departmentId)
))

const isRegisterReady = computed(() => (
  Boolean(selectedAssetItem.value) &&
  Boolean(formData.value.serialNo.trim()) &&
  assetUsageTypeOptions.includes(formData.value.assetUsageType) &&
  usageTypeOptions.includes(formData.value.usageType) &&
  Boolean(formData.value.location.trim()) &&
  (
    !requiresAssignmentInfo.value ||
    (
      Boolean(formData.value.startedAt.trim()) &&
      Boolean(effectiveDepartment.value) &&
      Boolean(selectedMember.value)
    )
  ) &&
  Boolean(formData.value.purchaseDate.trim()) &&
  Boolean(formData.value.purchasePrice.replaceAll(',', '').trim()) &&
  Boolean(formData.value.vendor.trim()) &&
  Boolean(formData.value.warrantyExpiredAt.trim())
))

const optionalDate = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const parsePrice = (value: string) => {
  const normalized = value.replaceAll(',', '').trim()
  if (!normalized) return undefined

  const price = Number(normalized)
  return Number.isFinite(price) ? price : undefined
}

const selectedUsageType = (): TangibleAssetUsageType => {
  if (formData.value.usageType === '임시 대여') return 'TEMPORARY'
  if (formData.value.usageType === '정식 배정') return 'PERMANENT'
  return 'PERMANENT'
}

const selectedAssetUsageType = () => {
  if (formData.value.assetUsageType === '개인자산') return 'PERSONAL'
  return 'DEPARTMENT'
}

const handleClose = () => {
  if (isSaving.value) return
  emit('close')
}

const handleSave = async () => {
  if (!isRegisterReady.value || !selectedAssetItem.value || isSaving.value) return

  if (!props.companyId) {
    alert('회사 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.')
    return
  }

  const department = effectiveDepartment.value
  const member = selectedMember.value
  const purchaseDate = formData.value.purchaseDate.trim()
  const purchasePrice = parsePrice(formData.value.purchasePrice)

  if (purchasePrice === undefined) {
    alert('구매 금액을 숫자로 입력해주세요.')
    return
  }

  if (!formData.value.location.trim()) {
    alert('위치를 입력해주세요.')
    return
  }

  if (requiresAssignmentInfo.value && (!member || !department || !formData.value.startedAt.trim())) {
    alert('AVAILABLE, DISPOSED 상태가 아닌 자산은 사용자, 부서, 사용 시작일이 필요합니다.')
    return
  }

  const payload: TangibleAssetCreateRequest = {
    companyId: props.companyId,
    tangibleItemId: selectedAssetItem.value.id,
    serialNumber: formData.value.serialNo.trim(),
    purchaseDate,
    tangibleAssetStatus: selectedStatus.value,
    usageType: selectedUsageType(),
    assetUsageType: selectedAssetUsageType(),
    purchaseVendor: formData.value.vendor.trim(),
    purchasePrice,
    departmentId: department?.departmentId ?? null,
    memberId: member?.memberId ?? null,
    usedStartedAt: optionalDate(formData.value.startedAt),
    returnDueDate: optionalDate(formData.value.returnDueDate),
    warrantyExpiredAt: optionalDate(formData.value.warrantyExpiredAt),
    location: formData.value.location.trim(),
  }

  isSaving.value = true

  try {
    const response = await tangibleAssetApi.create(payload)
    emit('registered', response.data)
    emit('close')
  } catch (error) {
    console.error(error)
    alert(error instanceof Error ? error.message : '자산 등록 중 오류가 발생했습니다.')
  } finally {
    isSaving.value = false
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isSaving.value) return
  formData.value = createInitialForm()
  selectedAssetItemName.value = '제품명 선택'
  selectedStatusLabel.value = TANGIBLE_STATUS_LABEL.AVAILABLE

  if (!isOpen) return
})

watch(selectedMember, (member) => {
  if (!member?.departmentName) return
  formData.value.departmentName = member.departmentName
})
</script>
