<template>
  <BaseDrawer
    :is-open="isOpen"
    title="유형자산 상세/수정"
    @close="emit('close')"
  >
    <div v-if="asset" class="space-y-8">
      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          기본 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-productName" v-model="assetEditForm.productName" label="제품명" disabled />
          <Input id="edit-assetCode" v-model="assetEditForm.assetCode" label="자산 번호" disabled />
          <FormField label="자산 상태" required>
            <Dropdown v-model="assetEditForm.statusLabel" :options="statusOptions" :disabled="!canUpdateAsset"/>
          </FormField>
          <Input id="edit-serialNo" v-model="assetEditForm.serialNo" label="시리얼 번호" disabled />
          <Input id="edit-assetUsageType" v-model="assetEditForm.assetUsageType" label="공용자산 여부" disabled />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          사용 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="사용 유형">
            <Dropdown v-model="assetEditForm.usageType" :options="usageTypeOptions" disabled />
          </FormField>
          <Input id="edit-location" v-model="assetEditForm.location" label="위치" placeholder="위치 입력" required :disabled="!canUpdateAsset" />
          <Input id="edit-startedAt" v-model="assetEditForm.startedAt" type="datetime-local" label="사용 시작 일시" :required="requiresAssignmentInfo" :disabled="!canUpdateAsset" />
          <Input id="edit-returnDueDate" v-model="assetEditForm.returnDueDate" type="datetime-local" label="반납 예정 일시" :disabled="!canUpdateAsset" />
          <Input id="edit-department" v-model="assetEditForm.departmentName" label="부서" disabled />
          <Input id="edit-member" v-model="assetEditForm.memberName" label="사용자" disabled />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          구매 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-purchaseDate" v-model="assetEditForm.purchaseDate" type="datetime-local" label="구매 일시" disabled />
          <Input id="edit-purchasePrice" v-model="assetEditForm.purchasePrice" label="구매 금액" placeholder="구매 금액 입력" disabled />
          <Input id="edit-vendor" v-model="assetEditForm.vendor" label="구매처" placeholder="구매처 입력" disabled />
          <Input id="edit-warrantyExpiredAt" v-model="assetEditForm.warrantyExpiredAt" type="datetime-local" label="보증 만료 일시" disabled />
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button
          v-if="canUpdateAsset"
          variant="outline"
          class="flex-1"
          :disabled="!isAssetEditDirty || isSavingAsset"
          @click="resetAssetEditForm"
        >
          초기화
        </Button>
        <Button
          v-if="canUpdateAsset"
          class="flex-1"
          :disabled="!isAssetEditDirty || isSavingAsset"
          :loading="isSavingAsset"
          @click="handleUpdateAsset"
        >
          저장하기
        </Button>
      </div>
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
import type { Department, Member, TangibleAsset, TangibleAssetStatus, TangibleAssetUsageType } from '@/types'
import { usePermission } from '@/composables'

interface TangibleAssetDetail extends TangibleAsset {
  productName: string
  assetUsageType?: string | null
  usageType?: TangibleAssetUsageType | null
}

interface AssetEditForm {
  productName: string
  assetCode: string
  statusLabel: string
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

const { canUpdateAsset } = usePermission()

const props = defineProps<{
  isOpen: boolean
  asset: TangibleAssetDetail | null
  departments: Department[]
  members: Member[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
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

const statusOptions = Object.values(TANGIBLE_STATUS_LABEL)
const statusByLabel = Object.entries(TANGIBLE_STATUS_LABEL).reduce(
  (acc, [status, label]) => {
    acc[label] = status as TangibleAssetStatus
    return acc
  },
  {} as Record<string, TangibleAssetStatus>,
)
const usageTypeOptions = ['미배정', '정식 배정', '임시 대여', '공용자산']

const createEmptyAssetEditForm = (): AssetEditForm => ({
  productName: '',
  assetCode: '',
  statusLabel: TANGIBLE_STATUS_LABEL.AVAILABLE,
  serialNo: '',
  assetUsageType: '',
  usageType: '미배정',
  location: '',
  startedAt: '',
  returnDueDate: '',
  departmentId: null,
  departmentName: '부서 선택',
  memberName: '사용자 선택',
  purchaseDate: '',
  purchasePrice: '',
  vendor: '',
  warrantyExpiredAt: '',
})

const assetEditForm = ref<AssetEditForm>(createEmptyAssetEditForm())
const initialAssetEditForm = ref<AssetEditForm>(createEmptyAssetEditForm())
const isSavingAsset = ref(false)

const flattenDepartments = (departments: Department[]): Department[] => (
  departments.flatMap((department) => {
    const { children = [], ...current } = department
    return [current, ...flattenDepartments(children)]
  })
)

const flatDepartments = computed(() => flattenDepartments(props.departments))
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
  flatDepartments.value.find((department) => department.departmentId === assetEditForm.value.departmentId)
  ?? flatDepartments.value.find((department) => department.name === assetEditForm.value.departmentName)
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

const selectedMember = computed(() => (
  props.members.find((member) =>
    getMemberLabel(member) === assetEditForm.value.memberName ||
    member.name === assetEditForm.value.memberName,
  )
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

const isAssetEditDirty = computed(() => (
  JSON.stringify(assetEditForm.value) !== JSON.stringify(initialAssetEditForm.value)
))

const selectedStatus = computed(() => (
  statusByLabel[assetEditForm.value.statusLabel]
    ?? props.asset?.status
    ?? props.asset?.tangibleAssetStatus
    ?? props.asset?.tangibleAssetstatus
    ?? 'AVAILABLE'
))

const requiresAssignmentInfo = computed(() => (
  selectedStatus.value !== 'AVAILABLE' && selectedStatus.value !== 'DISPOSED'
))

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '-'
  return TANGIBLE_STATUS_LABEL[status as keyof typeof TANGIBLE_STATUS_LABEL] ?? status
}

const usageTypeLabel = (asset: TangibleAssetDetail) => {
  if (asset.usageType === 'PERMANENT') return '정식 배정'
  if (asset.usageType === 'TEMPORARY') return '임시 대여'
  if ((asset.status ?? asset.tangibleAssetStatus ?? asset.tangibleAssetstatus) === 'AVAILABLE') return '미배정'
  if (asset.userName ?? asset.assignedMemberName ?? asset.memberName ?? asset.assignedMemberId ?? asset.memberId) return '정식 배정'
  return '공용자산'
}

const usageTypeValue = (): TangibleAssetUsageType | null => {
  if (assetEditForm.value.usageType === '정식 배정') return 'PERMANENT'
  if (assetEditForm.value.usageType === '임시 대여') return 'TEMPORARY'
  return null
}

const toDateTimeInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`
  return value.slice(0, 16)
}

const toAssetEditForm = (asset: TangibleAssetDetail): AssetEditForm => {
  const displayMemberName = asset.userName ?? asset.assignedMemberName ?? asset.memberName ?? ''
  const assignedMember = props.members.find((member) => (
    member.memberId === (asset.assignedMemberId ?? asset.memberId) ||
    member.name === displayMemberName
  ))
  const assignedDepartment = flatDepartments.value.find((department) => department.departmentId === asset.departmentId)
    ?? flatDepartments.value.find((department) => department.departmentId === (assignedMember ? getMemberDepartmentId(assignedMember) : ''))
    ?? flatDepartments.value.find((department) => department.name === asset.departmentName)

  return {
    productName: asset.productName,
    assetCode: asset.assetCode,
    statusLabel: statusLabel(asset.status ?? asset.tangibleAssetStatus ?? asset.tangibleAssetstatus),
    serialNo: asset.serialNo ?? asset.serialNumber ?? '',
    assetUsageType: asset.assetUsageType ?? (displayMemberName ? '개인자산' : '공용자산'),
    usageType: usageTypeLabel(asset),
    location: asset.location ?? '',
    startedAt: toDateTimeInputValue(asset.startedAt ?? asset.usedStartedAt),
    returnDueDate: toDateTimeInputValue(asset.returnDueDate),
    departmentId: assignedDepartment?.departmentId ?? asset.departmentId ?? null,
    departmentName: assignedDepartment?.name ?? asset.departmentName ?? '-',
    memberName: displayMemberName
      ? `${displayMemberName}${assignedMember ? `(${getMemberNo(assignedMember)})` : ''}`
      : '-',
    purchaseDate: toDateTimeInputValue(asset.purchaseDate),
    purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : '',
    vendor: asset.vendor ?? asset.purchaseVendor ?? '',
    warrantyExpiredAt: toDateTimeInputValue(asset.warrantyExpiredAt),
  }
}

const syncAssetEditForm = () => {
  if (!props.asset) {
    assetEditForm.value = createEmptyAssetEditForm()
    initialAssetEditForm.value = createEmptyAssetEditForm()
    return
  }

  const form = toAssetEditForm(props.asset)
  assetEditForm.value = { ...form }
  initialAssetEditForm.value = { ...form }
}

const resetAssetEditForm = () => {
  if (!isAssetEditDirty.value || isSavingAsset.value) return
  assetEditForm.value = { ...initialAssetEditForm.value }
}

const toIdString = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

const isUuid = (value: string) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
)

const ASSET_ID_STORAGE_PREFIX = 'tangibleAssetId:'

const toUuidString = (value: unknown) => {
  const id = toIdString(value)
  return isUuid(id) ? id : ''
}

const getAssetId = () => (
  toUuidString(props.asset?.assetId)
  || toUuidString(props.asset?.id)
  || toUuidString(props.asset?.tangibleAssetId)
  || toUuidString(props.asset?.tangibleAssetAssetId)
  || toUuidString(props.asset?.asset_id)
  || toUuidString(props.asset?.tangible_asset_id)
  || toUuidString(props.asset?.tangible_asset_asset_id)
)

const handleUpdateAsset = async () => {
  if (!props.asset || isSavingAsset.value || !isAssetEditDirty.value) return

  const assetId = getAssetId()

  if (!assetId) {
    console.warn('유형자산 수정에 필요한 UUID를 찾을 수 없습니다.', {
      asset: props.asset,
    })
    return
  }

  if (!assetEditForm.value.location.trim()) {
    alert('위치를 입력해주세요.')
    return
  }

  const isAssigned = assetEditForm.value.usageType === '정식 배정'
  const isShared = assetEditForm.value.usageType === '공용자산'
  const member = selectedMember.value
  const department = selectedMemberDepartment.value ?? selectedDepartment.value

  if (isAssigned && !member) {
    alert('정식 배정 자산은 사용자를 선택해주세요.')
    return
  }

  if (requiresAssignmentInfo.value && (!member || !department || !assetEditForm.value.startedAt.trim())) {
    alert('AVAILABLE, DISPOSED 상태가 아닌 자산은 사용자, 부서, 사용 시작일이 필요합니다.')
    return
  }

  isSavingAsset.value = true

  try {
    const response = await tangibleAssetApi.update(assetId, {
      tangibleAssetStatus: selectedStatus.value,
      memberId: requiresAssignmentInfo.value ? member?.memberId ?? null : null,
      departmentId: requiresAssignmentInfo.value ? department?.departmentId ?? null : isShared ? department?.departmentId ?? null : null,
      usageType: requiresAssignmentInfo.value ? usageTypeValue() ?? 'PERMANENT' : usageTypeValue(),
      usedStartedAt: assetEditForm.value.startedAt.trim() || null,
      returnDueDate: assetEditForm.value.returnDueDate.trim() || null,
      location: assetEditForm.value.location.trim() || null,
    })

    const responseAssetId = toUuidString(response.data.tangibleAssetId ?? response.data.assetId ?? assetId)
    const responseAssetCode = response.data.assetCode ?? props.asset.assetCode

    if (responseAssetId && responseAssetCode) {
      localStorage.setItem(`${ASSET_ID_STORAGE_PREFIX}${responseAssetCode}`, responseAssetId)
    }

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('유형자산 수정 실패', error)
  } finally {
    isSavingAsset.value = false
  }
}

watch(() => props.asset, () => {
  if (!props.isOpen) return
  syncAssetEditForm()
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    syncAssetEditForm()
    return
  }

  assetEditForm.value = createEmptyAssetEditForm()
  initialAssetEditForm.value = createEmptyAssetEditForm()
})

watch(selectedMember, (member) => {
  if (!member) {
    return
  }

  if (selectedMemberDepartment.value) {
    assetEditForm.value.departmentId = selectedMemberDepartment.value.departmentId
    assetEditForm.value.departmentName = selectedMemberDepartment.value.name
    return
  }

  if (selectedDepartment.value) return

  const departmentId = getMemberDepartmentId(member)
  const departmentName = getMemberDepartmentName(member)
  if (!departmentId && !departmentName) return

  assetEditForm.value.departmentId = departmentId || null
  assetEditForm.value.departmentName = departmentName || assetEditForm.value.departmentName
})

watch(selectedMemberDepartment, (department) => {
  if (!department || !selectedMember.value) return

  assetEditForm.value.departmentId = department.departmentId
  assetEditForm.value.departmentName = department.name
}, { immediate: true })

watch(flatDepartments, () => {
  const department = selectedMemberDepartment.value
  if (!department || !selectedMember.value) return

  assetEditForm.value.departmentId = department.departmentId
  assetEditForm.value.departmentName = department.name
})

watch(() => assetEditForm.value.departmentId, () => {
  const member = selectedMember.value
  if (!member || memberBelongsToSelectedDepartment(member)) return

  assetEditForm.value.memberName = '사용자 선택'
})
</script>