<template>
  <BaseDrawer
    :is-open="isOpen"
    title="무형자산 등록"
    @close="emit('close')"
  >
    <div class="space-y-8">
      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          기본 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- 제품명 -->
          <FormField label="제품명" required>
            <Dropdown
              v-model="formData.assetItemName"
              :options="itemOptions"
              root-option="제품명 선택"
            />
          </FormField>
          <!-- 자산 코드 -->
          <Input id="intangible-asset-code" model-value="자동 생성" label="자산 코드" disabled />
          <!-- 상태 -->
          <FormField label="자산 상태">
            <Dropdown v-model="formData.statusLabel" :options="statusOptions" />
          </FormField>
          <!-- 라이선스 번호  -->
          <Input
            id="intangible-license-code"
            v-model="formData.licenseCode"
            label="라이선스 번호"
            placeholder="라이선스 번호 입력"
          />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          사용 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- 자동 연장 여부  -->
          <FormField label="자동 연장 여부" required>
            <Dropdown
              v-model="formData.autoRenewalLabel"
              :options="autoRenewalOptions"
              root-option="자동 연장 여부 선택"
            />
          </FormField>
          <!-- 최대 사용 가능 인원 수 -->
          <Input
            id="intangible-seat-count"
            v-model="formData.seatCount"
            type="number"
            label="최대 사용 가능 인원 수"
            placeholder="1"
            required
          />
          <!-- 부서명 -->
          <FormField label="부서" :required="requiresAssignmentInfo">
            <DepartmentTreeSelect
              v-model="formData.departmentId"
              :departments="departments"
              placeholder="부서 선택"
            />
          </FormField>
          <!-- 사용자 -->
          <FormField label="사용자" :required="requiresAssignmentInfo">
            <Dropdown
              v-model="formData.memberName"
              :options="memberOptions"
              root-option="사용자 선택"
            />
          </FormField>
          <!-- 사용 시작일 -->
          <Input
            id="intangible-started-at"
            v-model="formData.startedAt"
            type="datetime-local"
            label="사용 시작 일시"
            :required="requiresAssignmentInfo"
          />
          <!-- 만료 예정일  -->
          <Input
            id="intangible-expired-at"
            v-model="formData.expiredAt"
            type="datetime-local"
            label="만료 일시"
          />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          구매 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- 구매 일 -->
          <Input
            id="intangible-purchase-date"
            v-model="formData.purchaseDate"
            type="datetime-local"
            label="구매 일시"
            required
          />
          <!-- 구매 가격 -->
          <Input
            id="intangible-purchase-price"
            v-model="formData.purchasePrice"
            type="number"
            label="구매 금액"
            placeholder="구매 금액 입력"
            required
          />
          <!-- 구매처 -->
          <Input
            id="intangible-purchase-vendor"
            v-model="formData.purchaseVendor"
            label="구매처"
            placeholder="구매처 입력"
            required
          />
          <!-- 결제 주기  -->
          <FormField label="결제 주기" required>
            <Dropdown
              v-model="formData.billingCycleLabel"
              :options="billingCycleOptions"
              root-option="결제 주기 선택"
            />
          </FormField>
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
import DepartmentTreeSelect from '@/components/common/DepartmentTreeSelect.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { intangibleAssetApi } from '@/api/asset.api'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type {
  BillingCycle,
  Department,
  IntangibleAsset,
  IntangibleAssetCreateRequest,
  IntangibleAssetStatus,
  LicenseType,
  Member,
} from '@/types'

interface AssetItemOption {
  id: string
  name: string
  licenseType: LicenseType
}

interface RegisterForm {
  assetItemName: string
  licenseCode: string
  seatCount: string
  autoRenewalLabel: string
  statusLabel: string
  departmentId: string | null
  memberName: string
  startedAt: string
  expiredAt: string
  purchaseDate: string
  purchasePrice: string
  purchaseVendor: string
  billingCycleLabel: string
}

interface MemberAliases extends Member {
  id?: string
  member_id?: string
  employeeNo?: string
  employee_no?: string
  department_id?: string
  department_name?: string
  department_name_path?: string
  department?: {
    departmentId?: string
    id?: string
    name?: string
    departmentName?: string
    departmentNamePath?: string
  }
}

const props = defineProps<{
  isOpen: boolean
  initialItems: AssetItemOption[]
  departments: Department[]
  members: Member[]
}>()

const emit = defineEmits<{
  close: []
  registered: [asset: IntangibleAsset]
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

const statusOptions = Object.values(INTANGIBLE_STATUS_LABEL)
const statusByLabel = Object.entries(INTANGIBLE_STATUS_LABEL).reduce(
  (map, [status, label]) => {
    map[label] = status as IntangibleAssetStatus
    return map
  },
  {} as Record<string, IntangibleAssetStatus>,
)

const autoRenewalOptions = ['자동 갱신', '자동 갱신 안 함']
const autoRenewalValueByLabel: Record<string, number> = {
  '자동 갱신': 1,
  '자동 갱신 안 함': 0,
}

const billingCycleOptions = ['월간', '연간', '일회성']
const billingCycleValueByLabel: Record<string, BillingCycle> = {
  월간: 'MONTHLY',
  연간: 'YEARLY',
  일회성: 'ONE_TIME',
}

const createEmptyForm = (): RegisterForm => ({
  assetItemName: '제품명 선택',
  licenseCode: '',
  seatCount: '1',
  autoRenewalLabel: '자동 갱신 안 함',
  statusLabel: INTANGIBLE_STATUS_LABEL.AVAILABLE,
  departmentId: null,
  memberName: '사용자 선택',
  startedAt: '',
  expiredAt: '',
  purchaseDate: '',
  purchasePrice: '',
  purchaseVendor: '',
  billingCycleLabel: '결제 주기 선택',
})

const formData = ref<RegisterForm>(createEmptyForm())
const isSaving = ref(false)

const flattenDepartments = (departments: Department[]): Department[] => (
  departments.flatMap((department) => {
    const { children = [], ...current } = department
    return [current, ...flattenDepartments(children)]
  })
)

const flatDepartments = computed(() => flattenDepartments(props.departments))
const itemOptions = computed(() => props.initialItems.map((item) => item.name))
const selectedItem = computed(() => (
  props.initialItems.find((item) => item.name === formData.value.assetItemName)
))

const childDepartmentIdsByParentId = computed(() => (
  flatDepartments.value.reduce((map, department) => {
    if (!department.parentDepartmentId) return map

    const children = map.get(department.parentDepartmentId) ?? []
    children.push(department.departmentId)
    map.set(department.parentDepartmentId, children)
    return map
  }, new Map<string, string[]>())
))

const selectedDepartment = computed(() => (
  flatDepartments.value.find((department) => department.departmentId === formData.value.departmentId)
))

const selectedDepartmentIds = computed(() => {
  const department = selectedDepartment.value
  if (!department) return new Set<string>()

  const ids = new Set<string>([department.departmentId])
  const visit = (departmentId: string) => {
    childDepartmentIdsByParentId.value.get(departmentId)?.forEach((childDepartmentId) => {
      ids.add(childDepartmentId)
      visit(childDepartmentId)
    })
  }

  visit(department.departmentId)
  return ids
})

const selectedDepartmentNames = computed(() => (
  new Set(
    flatDepartments.value
      .filter((department) => selectedDepartmentIds.value.has(department.departmentId))
      .map((department) => department.name),
  )
))

const selectedDepartmentPathParts = computed(() => {
  const department = selectedDepartment.value
  if (!department) return []

  const names: string[] = []
  let current: Department | undefined = department

  while (current) {
    names.unshift(current.name)
    current = current.parentDepartmentId
      ? flatDepartments.value.find((candidate) => candidate.departmentId === current?.parentDepartmentId)
      : undefined
  }

  return names
})

const getMemberNo = (member: Member) => {
  const aliases = member as MemberAliases
  return aliases.memberNo ?? aliases.employeeNo ?? aliases.employee_no ?? ''
}

const getMemberLabel = (member: Member) => `${member.name}(${getMemberNo(member)})`

const getMemberDepartmentId = (member: Member) => {
  const aliases = member as MemberAliases
  return aliases.departmentId
    ?? aliases.department_id
    ?? aliases.department?.departmentId
    ?? aliases.department?.id
    ?? ''
}

const getMemberDepartmentName = (member: Member) => {
  const aliases = member as MemberAliases
  return aliases.departmentName
    ?? aliases.department_name
    ?? aliases.department?.name
    ?? aliases.department?.departmentName
    ?? ''
}

const getMemberDepartmentPath = (member: Member) => {
  const aliases = member as MemberAliases
  return aliases.departmentNamePath
    ?? aliases.department_name_path
    ?? aliases.department?.departmentNamePath
    ?? getMemberDepartmentName(member)
}

const memberDepartmentPathParts = (member: Member) => (
  getMemberDepartmentPath(member)
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean)
)

const memberDepartmentPathContainsSelectedDepartment = (member: Member) => {
  const selectedPathParts = selectedDepartmentPathParts.value
  if (!selectedPathParts.length) return false

  const memberPathParts = memberDepartmentPathParts(member)
  if (memberPathParts.length < selectedPathParts.length) return false

  return selectedPathParts.every((part, index) => memberPathParts[index] === part)
}

const memberBelongsToSelectedDepartment = (member: Member) => {
  if (!selectedDepartment.value) return true

  return selectedDepartmentIds.value.has(getMemberDepartmentId(member))
    || selectedDepartmentNames.value.has(getMemberDepartmentName(member))
    || memberDepartmentPathContainsSelectedDepartment(member)
}

const filteredMembers = computed(() => (
  props.members.filter(memberBelongsToSelectedDepartment)
))

const selectedMemberDepartment = computed(() => {
  const member = selectedMember.value
  if (!member) return null

  const departmentId = getMemberDepartmentId(member)
  const departmentName = getMemberDepartmentName(member)
  if (!departmentId && !departmentName) return null

  return flatDepartments.value.find((department) => department.departmentId === departmentId)
    ?? flatDepartments.value.find((department) => department.name === departmentName)
    ?? null
})
const memberOptions = computed(() => filteredMembers.value.map(getMemberLabel))
const selectedMember = computed(() => (
  props.members.find((member) => getMemberLabel(member) === formData.value.memberName)
))

const selectedStatus = computed(() => (
  statusByLabel[formData.value.statusLabel] ?? 'AVAILABLE'
))

const requiresAssignmentInfo = computed(() => (
  selectedStatus.value !== 'AVAILABLE' && selectedStatus.value !== 'TERMINATED'
))

const effectiveDepartment = computed(() => (
  selectedMemberDepartment.value
  ?? selectedDepartment.value
))

const positiveNumberValue = (value: string) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

const isRegisterReady = computed(() => (
  Boolean(selectedItem.value) &&
  positiveNumberValue(formData.value.seatCount) !== null &&
  autoRenewalOptions.includes(formData.value.autoRenewalLabel) &&
  (
    !requiresAssignmentInfo.value ||
    (
      Boolean(formData.value.startedAt.trim()) &&
      Boolean(effectiveDepartment.value) &&
      Boolean(selectedMember.value)
    )
  ) &&
  Boolean(formData.value.purchaseDate.trim()) &&
  positiveNumberValue(formData.value.purchasePrice) !== null &&
  Boolean(formData.value.purchaseVendor.trim()) &&
  billingCycleOptions.includes(formData.value.billingCycleLabel)
))

const handleSave = async () => {
  if (!isRegisterReady.value || isSaving.value) return

  const item = selectedItem.value
  const member = selectedMember.value
  const department = effectiveDepartment.value
  const seatCount = positiveNumberValue(formData.value.seatCount)
  const purchasePrice = positiveNumberValue(formData.value.purchasePrice)
  const isAutoRenewal = autoRenewalValueByLabel[formData.value.autoRenewalLabel]

  if (!item) {
    console.error('무형자산 등록에 필요한 품목 ID가 없습니다.', formData.value)
    return
  }

  if (requiresAssignmentInfo.value && (!member || !department || !formData.value.startedAt.trim())) {
    console.error('사용중/만료예정/만료/해지요청 상태의 무형자산 등록에는 사용자, 부서, 사용 시작일이 필요합니다.', formData.value)
    return
  }

  if (!seatCount) {
    console.error('무형자산 등록에 필요한 최대 사용 가능 인원 수가 없습니다.', formData.value)
    return
  }

  if (isAutoRenewal === undefined) {
    console.error('무형자산 등록에 필요한 자동 갱신 여부가 없습니다.', formData.value)
    return
  }

  if (!formData.value.purchaseDate.trim() || !purchasePrice || !formData.value.purchaseVendor.trim()) {
    console.error('무형자산 등록에 필요한 구매 정보가 없습니다.', formData.value)
    return
  }

  isSaving.value = true

  const payload: IntangibleAssetCreateRequest = {
    intangibleItemId: item.id,
    licenseCode: formData.value.licenseCode.trim(),
    seatCount,
    isAutoRenewal,
    purchaseDate: formData.value.purchaseDate,
    purchasePrice,
    purchaseVendor: formData.value.purchaseVendor.trim(),
    intangibleAssetStatus: selectedStatus.value,
    memberId: member?.memberId ?? null,
    departmentId: department?.departmentId ?? null,
    startedAt: formData.value.startedAt.trim() || null,
    expiredAt: formData.value.expiredAt.trim() || null,
    billingCycle: billingCycleValueByLabel[formData.value.billingCycleLabel],
  }

  console.log('등록 요청 payload', payload)

  try {
    const response = await intangibleAssetApi.create(payload)
    console.log('무형자산 등록 성공', {
      status: response.status,
      response,
    })

    emit('registered', response.data)
    emit('close')
  } catch (error) {
    const failure = typeof error === 'object' && error !== null
      ? error as { status?: number | null; errorCode?: string | null; message?: string; details?: unknown }
      : { message: String(error) }

    console.error('무형자산 등록 실패', {
      status: failure.status,
      errorCode: failure.errorCode,
      message: failure.message,
      details: failure.details,
      error,
    })
  } finally {
    isSaving.value = false
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    formData.value = createEmptyForm()
  }
})

watch(() => formData.value.departmentId, () => {
  const member = selectedMember.value
  if (!member) return
  if (memberBelongsToSelectedDepartment(member)) return

  formData.value.memberName = '사용자 선택'
})

watch(selectedMember, (member) => {
  if (!member) return

  const department = selectedMemberDepartment.value
  if (department) {
    formData.value.departmentId = department.departmentId
  }
})
</script>
