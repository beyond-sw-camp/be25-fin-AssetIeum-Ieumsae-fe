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
            <DepartmentTreeSelect
              v-model="formData.departmentId"
              :departments="departments"
              placeholder="-- 부서 선택 --"
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
import DepartmentTreeSelect from '@/components/common/DepartmentTreeSelect.vue'
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
  departmentId: string | null
  departmentName: string
  memberName: string
  purchaseDate: string
  purchasePrice: string
  vendor: string
  warrantyExpiredAt: string
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
]

const statusByLabel: Record<string, TangibleAssetStatus> = {
  [TANGIBLE_STATUS_LABEL.AVAILABLE]: 'AVAILABLE',
  [TANGIBLE_STATUS_LABEL.IN_USE]: 'IN_USE',
  [TANGIBLE_STATUS_LABEL.REPAIRING]: 'REPAIRING',
}

const assetUsageTypeOptions = ['공용자산', '개인자산']
const usageTypeOptions = ['정식 배정', '임시 대여']

const createInitialForm = (): RegisterForm => ({
  serialNo: '',
  assetUsageType: '-- 공용자산 여부 선택 --',
  usageType: '-- 사용 유형 선택 --',
  location: '',
  startedAt: '',
  returnDueDate: '',
  departmentId: null,
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

const flattenDepartments = (departments: Department[]): Department[] => (
  departments.flatMap((department) => {
    const { children = [], ...current } = department
    return [current, ...flattenDepartments(children)]
  })
)

const flatDepartments = computed(() => flattenDepartments(props.departments))
const assetItemNames = computed(() => props.initialItems.map((item) => item.name))
const childDepartmentIdsByParentId = computed(() => (
  flatDepartments.value.reduce((map, department) => {
    if (!department.parentDepartmentId) return map

    const children = map.get(department.parentDepartmentId) ?? []
    children.push(department.departmentId)
    map.set(department.parentDepartmentId, children)
    return map
  }, new Map<string, string[]>())
))

const selectedAssetItem = computed(() => (
  props.initialItems.find((item) => item.name === selectedAssetItemName.value)
))

const selectedDepartment = computed(() => (
  flatDepartments.value.find((department) => department.departmentId === formData.value.departmentId)
  ?? flatDepartments.value.find((department) => department.name === formData.value.departmentName)
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
  props.members.filter((member) => member.status === 'ACTIVE' && memberBelongsToSelectedDepartment(member))
))

const memberOptions = computed(() => (
  filteredMembers.value.map(getMemberLabel)
))

const selectedMember = computed(() => (
  props.members.find((member) => getMemberLabel(member) === formData.value.memberName)
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

const selectedStatus = computed(() => (
  statusByLabel[selectedStatusLabel.value] ?? 'AVAILABLE'
))

const requiresAssignmentInfo = computed(() => (
  selectedStatus.value === 'IN_USE'
))

const effectiveDepartment = computed(() => (
  selectedMemberDepartment.value
  ?? selectedDepartment.value
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
  if (!member) {
    return
  }

  if (selectedMemberDepartment.value) {
    formData.value.departmentId = selectedMemberDepartment.value.departmentId
    formData.value.departmentName = selectedMemberDepartment.value.name
    return
  }

  if (selectedDepartment.value) return

  const departmentId = getMemberDepartmentId(member)
  const departmentName = getMemberDepartmentName(member)
  if (!departmentId && !departmentName) return

  formData.value.departmentId = departmentId || null
  formData.value.departmentName = departmentName || formData.value.departmentName
})

watch(selectedMemberDepartment, (department) => {
  if (!department || !selectedMember.value) return

  formData.value.departmentId = department.departmentId
  formData.value.departmentName = department.name
}, { immediate: true })

watch(flatDepartments, () => {
  const department = selectedMemberDepartment.value
  if (!department || !selectedMember.value) return

  formData.value.departmentId = department.departmentId
  formData.value.departmentName = department.name
})

watch(() => formData.value.departmentId, () => {
  const member = selectedMember.value
  if (!member || memberBelongsToSelectedDepartment(member)) return

  formData.value.memberName = '-- 사용자(사번) 선택 --'
})
</script>
