<template>
  <div class="flex min-h-full flex-col">
    <div class="flex-1 space-y-6 p-6 pb-8">
      <div class="grid grid-cols-2 gap-2 rounded-lg bg-surface-secondary p-1">
        <button
          v-for="option in modeOptions"
          :key="option.value"
          type="button"
          class="rounded-md px-3 py-2 text-sm font-semibold transition"
          :class="mode === option.value ? 'bg-surface text-primary shadow-sm' : 'text-text-sub hover:text-text-main'"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <section class="space-y-4">
        <h2 class="text-sm font-bold text-text-main">
          자산 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="대상 자산" required>
            <Dropdown
              v-model="assetLabel"
              :options="assetOptions"
              placeholder="자산을 선택하세요"
            />
          </FormField>

          <Input id="intangible-assignment-asset-code" :model-value="selectedAssetInfo.assetCode" label="자산 번호" disabled />
          <Input id="intangible-assignment-product-name" :model-value="selectedAssetInfo.productName" label="제품명" disabled />
          <Input id="intangible-assignment-status" :model-value="selectedAssetInfo.statusLabel" label="자산 상태" disabled />
          <Input id="intangible-assignment-seat-count" :model-value="selectedAssetInfo.seatUsage" label="배정 가능 자리" disabled />
        </div>
      </section>

      <section v-if="mode === 'assign'" class="space-y-4">
        <h2 class="text-sm font-bold text-text-main">
          신규 배정 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="사용자" required>
            <Dropdown
              v-model="memberId"
              :options="assignableMemberOptions"
              placeholder="사용자를 선택하세요"
            />
          </FormField>

          <Input id="intangible-assignment-member-department" :model-value="selectedMemberInfo.departmentName" label="부서" disabled />
          <Input id="intangible-assignment-member-no" :model-value="selectedMemberInfo.memberNo" label="사번" disabled />
          <Input
            id="intangible-assignment-ended-at"
            v-model="endedAt"
            type="datetime-local"
            label="사용 종료 예정 일시"
          />
        </div>
      </section>

      <section v-if="mode === 'cancel'" class="space-y-4">
        <h2 class="text-sm font-bold text-text-main">
          배정 해지 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="해지 대상">
            <Dropdown
              v-model="cancelTarget"
              :options="cancelTargetOptions"
              placeholder="해지 대상을 선택하세요"
            />
          </FormField>

          <Input id="intangible-cancel-department" :model-value="selectedCancelMemberInfo.departmentName" label="부서" disabled />
        </div>
        <p class="text-xs text-text-sub">
          전체 해지를 선택하면 해당 무형자산의 활성 배정 이력이 모두 해지됩니다.
        </p>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-text-main">
            배정 이력
          </h2>
          <Button variant="outline" size="sm" :disabled="!selectedAsset" :loading="isLoadingAssignments" @click="loadAssignments">
            새로고침
          </Button>
        </div>

        <Table
          :columns="assignmentColumns"
          :rows="assignmentRows"
          :loading="isLoadingAssignments"
          row-key="assignmentId"
          empty-text="배정 이력이 없습니다."
        >
          <template #cell-assignmentStatus="{ value }">
            <span class="rounded-full px-2 py-1 text-xs font-bold" :class="assignmentStatusClass(value as string)">
              {{ assignmentStatusText(value as string) }}
            </span>
          </template>
        </Table>
      </section>

      <p v-if="errorMessage" class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
        {{ errorMessage }}
      </p>
    </div>

    <div class="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-surface px-6 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
      <Button variant="outline" class="flex-1" :disabled="isSubmitting" @click="resetForm">
        초기화
      </Button>
      <Button class="flex-1" :disabled="!canSubmit || isSubmitting" :loading="isSubmitting" @click="submit">
        {{ submitLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import {
  intangibleAssetApi,
  type IntangibleAssetAssignmentResponse,
} from '@/api/asset.api'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { Department, IntangibleAsset, Member } from '@/types'

type AssignmentMode = 'assign' | 'cancel'

interface MemberAliases extends Omit<Member, 'role' | 'memberRole' | 'departmentId' | 'departmentName' | 'department'> {
  id?: string
  member_id?: string
  employeeNo?: string
  employee_no?: string
  memberName?: string
  departmentName?: string
  department_name?: string
  deptName?: string
  dept_name?: string
  teamName?: string
  team_name?: string
  departmentId?: string
  department_id?: string
  deptId?: string
  dept_id?: string
  department?: string | {
    departmentId?: string
    department_id?: string
    id?: string
    name?: string
    departmentName?: string
    department_name?: string
    deptName?: string
    teamName?: string
  }
  role?: string | Record<string, unknown> | null
  memberRole?: string | Record<string, unknown> | null
}

interface DepartmentAliases extends Department {
  id?: string
  department_id?: string
  departmentName?: string
}

interface IntangibleAssetAliases extends IntangibleAsset {
  id?: string | number | null
  intangibleAssetId?: string
  productName?: string
  itemName?: string
  currentUserId?: string | null
  currentUserName?: string | null
  currentUserMemberNo?: string | null
  memberId?: string | null
  memberName?: string | null
  userName?: string | null
}

const props = defineProps<{
  assets: IntangibleAsset[]
  departments: Department[]
  members: Member[]
}>()

const emit = defineEmits<{
  close: []
  assigned: []
}>()

const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  setup(fieldProps, { slots }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('label', { class: 'flex items-center gap-0.5 text-sm font-semibold text-text-main' }, [
        fieldProps.label,
        fieldProps.required ? h('span', { class: 'ml-1 font-bold text-primary' }, '*') : null,
      ]),
      slots.default?.(),
    ])
  },
})

const modeOptions: Array<{ value: AssignmentMode; label: string }> = [
  { value: 'assign', label: '신규 배정' },
  { value: 'cancel', label: '배정 해지' },
]

const mode = ref<AssignmentMode>('assign')
const assetLabel = ref('')
const memberId = ref('')
const cancelTarget = ref('ALL')
const endedAt = ref('')
const assignments = ref<IntangibleAssetAssignmentResponse[]>([])
const isSubmitting = ref(false)
const isLoadingAssignments = ref(false)
const errorMessage = ref('')

const getDepartmentId = (department: Department) => {
  const aliases = department as DepartmentAliases
  return department.departmentId ?? aliases.id ?? aliases.department_id ?? ''
}

const getDepartmentName = (department: Department) => {
  const aliases = department as DepartmentAliases
  return department.name ?? aliases.departmentName ?? '-'
}

const findDepartmentNameById = (departmentId: string | null | undefined) => {
  if (!departmentId) return null
  const matchedDepartment = props.departments.find((department) => getDepartmentId(department) === departmentId)
  return matchedDepartment ? getDepartmentName(matchedDepartment) : null
}

const getAssetId = (asset: IntangibleAsset) => {
  const aliases = asset as IntangibleAssetAliases
  return String(asset.assetId ?? aliases.intangibleAssetId ?? aliases.id ?? '')
}

const getAssetStatus = (asset: IntangibleAsset) => (
  asset.status ?? asset.intangibleAssetStatus ?? 'AVAILABLE'
)

const getAssetSeatCount = (asset: IntangibleAsset | null) => (
  Math.max(1, Number(asset?.seatCount ?? 1) || 1)
)

const statusLabel = (status: string | null | undefined) => (
  status ? INTANGIBLE_STATUS_LABEL[status as keyof typeof INTANGIBLE_STATUS_LABEL] ?? status : '-'
)

const getAssetProductName = (asset: IntangibleAsset) => {
  const aliases = asset as IntangibleAssetAliases
  return asset.assetItemName ?? aliases.productName ?? aliases.itemName ?? asset.assetCode ?? '제품명 없음'
}

const getAssetMemberName = (asset: IntangibleAsset) => {
  const aliases = asset as IntangibleAssetAliases
  return asset.assignedMemberName
    ?? aliases.memberName
    ?? aliases.userName
    ?? aliases.currentUserName
    ?? '미배정'
}

const getAssetLabel = (asset: IntangibleAsset) => (
  `${getAssetProductName(asset)} / ${asset.assetCode ?? '-'} / ${statusLabel(getAssetStatus(asset))}`
)

const getMemberId = (member: Member) => {
  const aliases = member as MemberAliases
  return member.memberId ?? aliases.id ?? aliases.member_id ?? ''
}

const getMemberNo = (member: Member) => {
  const aliases = member as MemberAliases
  return member.memberNo ?? aliases.employeeNo ?? aliases.employee_no ?? '-'
}

const getMemberName = (member: Member) => {
  const aliases = member as MemberAliases
  return member.name ?? aliases.memberName ?? '-'
}

const getMemberDepartmentName = (member: Member) => {
  const aliases = member as MemberAliases

  if (aliases.departmentNamePath) {
    const parts = aliases.departmentNamePath.split('>')
    return parts[parts.length - 1].trim()
  }

  const department = aliases.department
  const departmentId = aliases.departmentId
    ?? aliases.department_id
    ?? aliases.deptId
    ?? aliases.dept_id
    ?? (department && typeof department === 'object'
      ? department.departmentId ?? department.department_id ?? department.id
      : undefined)

  const departmentName = findDepartmentNameById(departmentId)
  if (departmentName) return departmentName

  if (typeof department === 'string' && department.trim()) {
    return findDepartmentNameById(department) ?? department
  }

  if (department && typeof department === 'object') {
    return department.departmentName
      ?? department.department_name
      ?? department.name
      ?? department.deptName
      ?? department.teamName
      ?? '-'
  }

  return aliases.departmentName
    ?? aliases.department_name
    ?? aliases.deptName
    ?? aliases.dept_name
    ?? aliases.teamName
    ?? aliases.team_name
    ?? '-'
}

const getMemberLabel = (member: Member) => `${getMemberName(member)}(${getMemberNo(member)})`

const filteredMembers = computed(() => props.members.filter((member) => {
  const aliases = member as MemberAliases
  const rawRole = aliases.role ?? aliases.memberRole
  if (!rawRole) return true

  const roleStr = typeof rawRole === 'object'
    ? (typeof (rawRole as Record<string, unknown>).name === 'string' ? String((rawRole as Record<string, unknown>).name) : '')
    : String(rawRole)

  const upperRole = roleStr.toUpperCase()
  return upperRole !== 'ADMIN' && upperRole !== 'SUPER_ADMIN'
}))

const findMemberById = (id: string | number) => (
  filteredMembers.value.find((member) => getMemberId(member) === String(id)) ?? null
)

const selectedMember = computed(() => findMemberById(memberId.value))

const getAssignmentMemberId = (assignment: IntangibleAssetAssignmentResponse) => {
  if (assignment.memberId) return assignment.memberId

  const matchedMember = filteredMembers.value.find((member) => (
    getMemberNo(member) === assignment.memberNo
    || getMemberName(member) === assignment.memberName
  ))

  return matchedMember ? getMemberId(matchedMember) : ''
}

const memberInfo = (member: Member | null) => ({
  memberNo: member ? getMemberNo(member) : '-',
  departmentName: member ? getMemberDepartmentName(member) : '-',
})

const selectedMemberInfo = computed(() => memberInfo(selectedMember.value))

const cancelableAssets = computed(() => props.assets.filter((asset) => getAssetStatus(asset) === 'IN_USE'))
const assignableAssets = computed(() => props.assets.filter((asset) => {
  const status = getAssetStatus(asset)
  return status === 'AVAILABLE' || (status === 'IN_USE' && getAssetSeatCount(asset) > 1)
}))
const visibleAssets = computed(() => (mode.value === 'assign' ? assignableAssets.value : cancelableAssets.value))
const assetOptions = computed(() => visibleAssets.value.map(getAssetLabel))
const selectedAsset = computed(() => visibleAssets.value.find((asset) => getAssetLabel(asset) === assetLabel.value) ?? null)

const activeAssignments = computed(() => assignments.value.filter((assignment) => (
  assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'
)))

const assignedMemberIds = computed(() => new Set(activeAssignments.value.map(getAssignmentMemberId).filter(Boolean)))
const activeSeatCount = computed(() => activeAssignments.value.length)
const selectedAssetSeatCount = computed(() => getAssetSeatCount(selectedAsset.value))
const hasAvailableSeat = computed(() => activeSeatCount.value < selectedAssetSeatCount.value)

const assignableMemberOptions = computed(() => filteredMembers.value
  .filter((member) => hasAvailableSeat.value && !assignedMemberIds.value.has(getMemberId(member)))
  .map((member) => ({
    label: getMemberLabel(member),
    value: getMemberId(member),
  })))

const cancelTargetOptions = computed(() => [
  { label: '전체 해지', value: 'ALL' },
  ...activeAssignments.value.map((assignment) => ({
    label: `${assignment.memberName}(${assignment.memberNo})`,
    value: getAssignmentMemberId(assignment),
  })).filter((option) => option.value),
])

const selectedCancelMemberInfo = computed(() => {
  if (cancelTarget.value === 'ALL') {
    return { memberNo: '-', departmentName: '-' }
  }
  
  const matchedAssignment = activeAssignments.value.find(
    (assignment) => getAssignmentMemberId(assignment) === cancelTarget.value
  )
  
  return {
    memberNo: matchedAssignment?.memberNo ?? '-',
    departmentName: matchedAssignment?.departmentName ?? '-' // 💡 배정 이력에 있는 부서명을 그대로 사용!
  }
})

const selectedAssetInfo = computed(() => ({
  assetCode: selectedAsset.value?.assetCode ?? '-',
  productName: selectedAsset.value ? getAssetProductName(selectedAsset.value) : '-',
  statusLabel: selectedAsset.value ? statusLabel(getAssetStatus(selectedAsset.value)) : '-',
  seatUsage: selectedAsset.value ? `${activeSeatCount.value}/${selectedAssetSeatCount.value}` : '-',
  currentUser: selectedAsset.value ? getAssetMemberName(selectedAsset.value) : '-',
  currentDepartment: selectedAsset.value?.departmentName
    ?? findDepartmentNameById(selectedAsset.value?.departmentId)
    ?? '-',
}))

const toServerDateTime = (value: string) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

const canSubmit = computed(() => {
  if (!selectedAsset.value) return false
  if (mode.value === 'assign') return hasAvailableSeat.value && !!selectedMember.value
  return activeAssignments.value.length > 0
})

const submitLabel = computed(() => (mode.value === 'assign' ? '배정하기' : '배정 해지하기'))

const assignmentStatusText = (value: string) => {
  if (value === 'ACTIVE' || value === 'ASSIGNED') return '배정 중'
  if (value === 'ENDED' || value === 'RETURNED') return '종료'
  if (value === 'CANCELED') return '취소'
  if (value === 'EXPIRED') return '만료'
  return value || '-'
}

const assignmentStatusClass = (value: string) => {
  if (value === 'ACTIVE' || value === 'ASSIGNED') return 'bg-success/10 text-success'
  if (value === 'ENDED' || value === 'RETURNED') return 'bg-surface-secondary text-text-sub'
  if (value === 'EXPIRED') return 'bg-warning/10 text-warning'
  return 'bg-danger/10 text-danger'
}

const assignmentRows = computed(() => assignments.value.map((assignment) => ({
  ...assignment,
  endedAt: assignment.endedAt ?? '-',
})))

const assignmentColumns: Column<IntangibleAssetAssignmentResponse>[] = [
  { key: 'memberName', label: '사용자', align: 'center', width: '18%' },
  { key: 'memberNo', label: '사번', align: 'center', width: '14%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '18%' },
  { key: 'assignedAt', label: '배정 일시', align: 'center', width: '20%' },
  { key: 'endedAt', label: '종료 일시', align: 'center', width: '20%' },
  { key: 'assignmentStatus', label: '상태', align: 'center', width: '14%' },
]

const loadAssignments = async () => {
  if (!selectedAsset.value) {
    assignments.value = []
    return
  }

  const assetId = getAssetId(selectedAsset.value)
  if (!assetId) return

  isLoadingAssignments.value = true
  try {
    const response = await intangibleAssetApi.getAssignments(assetId)
    assignments.value = response.data
  } catch (error) {
    console.error('무형자산 배정 이력 조회 실패', error)
    assignments.value = []
  } finally {
    isLoadingAssignments.value = false
  }
}

const resetForm = () => {
  if (isSubmitting.value) return
  assetLabel.value = ''
  memberId.value = ''
  cancelTarget.value = 'ALL'
  endedAt.value = ''
  assignments.value = []
  errorMessage.value = ''
}

const submit = async () => {
  if (!canSubmit.value || !selectedAsset.value) {
    errorMessage.value = '필수 항목을 모두 선택해주세요.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const assetId = getAssetId(selectedAsset.value)

    if (mode.value === 'assign' && selectedMember.value) {
      await intangibleAssetApi.assign(assetId, {
        memberId: getMemberId(selectedMember.value),
        endedAt: toServerDateTime(endedAt.value),
      })
    }

    if (mode.value === 'cancel') {
      await intangibleAssetApi.cancelAssignment(assetId, {
        memberId: cancelTarget.value === 'ALL' ? null : cancelTarget.value,
      })
    }

    emit('assigned')
    resetForm()
  } catch (error) {
    console.error('무형자산 배정 처리 실패', error)
    errorMessage.value = '무형자산 배정 처리 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

watch(mode, () => resetForm())
watch(assetLabel, () => {
  memberId.value = ''
  cancelTarget.value = 'ALL'
  void loadAssignments()
})

// 스크립트 최하단에 추가해서 자산 데이터를 확인해보세요!
watch(selectedAsset, (newAsset) => {
  if (newAsset) {
    console.log('선택된 무형자산 상세 데이터:', JSON.parse(JSON.stringify(newAsset)))
  }
})
</script>
