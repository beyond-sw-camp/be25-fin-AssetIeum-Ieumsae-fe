<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 pb-8">
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
          <FormField label="부서">
            <DepartmentTreeSelect
              v-model="departmentId"
              :departments="departments"
              placeholder="부서 선택"
            />
          </FormField>

          <FormField label="사용자" required>
            <div class="flex gap-2">
              <Dropdown
                v-model="memberId"
                :options="assignableMemberOptions"
                placeholder="사용자를 선택하세요"
                class="flex-1"
                :disabled="availableSeatCount <= 0"
              />
              <Button
                variant="outline"
                type="button"
                :disabled="!canAddSelectedMember"
                @click="addSelectedMember"
              >
                추가
              </Button>
            </div>
          </FormField>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <label class="text-sm font-semibold text-text-main">배정 사용자</label>
              <span class="text-xs font-medium text-text-sub">
                {{ totalAssignedSeatCount }} / {{ selectedAssetSeatCount }}명
              </span>
            </div>

            <div
              v-if="displayAssignmentMembers.length"
              class="flex flex-wrap gap-2 rounded-xl border border-border bg-surface-secondary p-2"
            >
              <span
                v-for="member in displayAssignmentMembers"
                :key="member.key"
                class="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs text-text-main shadow-sm"
              >
                {{ member.label }}

                <button
                  v-if="!member.isAlreadyAssigned"
                  type="button"
                  class="text-text-sub hover:text-danger"
                  @click="removeSelectedMember(member.memberId)"
                >
                  ×
                </button>
              </span>
            </div>

            <p
              v-else
              class="rounded-xl border border-border bg-surface-secondary px-3.5 py-2 text-sm text-text-sub"
            >
              배정된 사용자가 없습니다.
            </p>
          </div>

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
    <div class="flex shrink-0 gap-2 border-t border-border bg-surface px-6 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
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
import DepartmentTreeSelect from '@/components/common/DepartmentTreeSelect.vue'
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

interface MemberAliases extends Omit<Member, 'role' | 'memberRole' | 'departmentId' | 'departmentName' | 'departmentNamePath' | 'department'> {
  id?: string
  member_id?: string
  employeeNo?: string
  employee_no?: string
  memberName?: string
  departmentName?: string
  departmentNamePath?: string
  department_name?: string
  department_name_path?: string
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
  parentId?: string | null
  parent_id?: string | null
}

interface IntangibleAssetAliases extends IntangibleAsset {
  id?: string | number | null
  intangibleAssetId?: string
  seat_count?: number | string | null
  maxSeatCount?: number | string | null
  totalSeatCount?: number | string | null
  productName?: string
  itemName?: string
  currentUserId?: string | null
  currentUserName?: string | null
  currentUserMemberNo?: string | null
  memberId?: string | null
  memberName?: string | null
  userName?: string | null
  assignedMemberCount?: number
  currentUserCount?: number
  activeAssignmentCount?: number
  assignmentCount?: number
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
const departmentId = ref('')
const memberId = ref('')
const selectedMemberIds = ref<string[]>([])
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

const getParentDepartmentId = (department: Department) => {
  const aliases = department as DepartmentAliases
  return department.parentDepartmentId ?? aliases.parentId ?? aliases.parent_id ?? null
}

const flattenDepartments = (departments: Department[]): Department[] => (
  departments.flatMap((department) => {
    const { children = [], ...current } = department
    return [current, ...flattenDepartments(children)]
  })
)

const flatDepartments = computed(() => flattenDepartments(props.departments))

const childDepartmentIdsByParentId = computed(() => (
  flatDepartments.value.reduce((map, department) => {
    const parentDepartmentId = getParentDepartmentId(department)
    if (!parentDepartmentId) return map

    const children = map.get(parentDepartmentId) ?? []
    children.push(getDepartmentId(department))
    map.set(parentDepartmentId, children)
    return map
  }, new Map<string, string[]>())
))

const selectedDepartment = computed(() => (
  flatDepartments.value.find((department) => getDepartmentId(department) === departmentId.value)
))

const selectedDepartmentIds = computed(() => {
  const department = selectedDepartment.value
  if (!department) return new Set<string>()

  const rootDepartmentId = getDepartmentId(department)
  const ids = new Set<string>([rootDepartmentId])
  const visit = (currentDepartmentId: string) => {
    childDepartmentIdsByParentId.value.get(currentDepartmentId)?.forEach((childDepartmentId) => {
      ids.add(childDepartmentId)
      visit(childDepartmentId)
    })
  }

  visit(rootDepartmentId)
  return ids
})

const selectedDepartmentNames = computed(() => (
  new Set(
    flatDepartments.value
      .filter((department) => selectedDepartmentIds.value.has(getDepartmentId(department)))
      .map(getDepartmentName),
  )
))

const selectedDepartmentPathParts = computed(() => {
  const department = selectedDepartment.value
  if (!department) return []

  const names: string[] = []
  let current: Department | undefined = department

  while (current) {
    names.unshift(getDepartmentName(current))
    const parentDepartmentId = getParentDepartmentId(current)
    current = parentDepartmentId
      ? flatDepartments.value.find((candidate) => getDepartmentId(candidate) === parentDepartmentId)
      : undefined
  }

  return names
})

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

const getAssetSeatCount = (asset: IntangibleAsset | null) => {
  if (!asset) return 1

  const aliases = asset as IntangibleAssetAliases
  const rawSeatCount = asset.seatCount
    ?? aliases.seat_count
    ?? aliases.maxSeatCount
    ?? aliases.totalSeatCount
    ?? 1

  return Math.max(1, Number(rawSeatCount) || 1)
}

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

const getMemberDepartmentId = (member: Member) => {
  const aliases = member as MemberAliases
  const department = aliases.department

  return aliases.departmentId
    ?? aliases.department_id
    ?? aliases.deptId
    ?? aliases.dept_id
    ?? (department && typeof department === 'object'
      ? department.departmentId ?? department.department_id ?? department.id
      : '')
    ?? ''
}

const getMemberDepartmentPath = (member: Member) => {
  const aliases = member as MemberAliases
  return aliases.departmentNamePath
    ?? aliases.department_name_path
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

const departmentFilteredMembers = computed(() => filteredMembers.value.filter(memberBelongsToSelectedDepartment))

const findMemberById = (id: string | number) => (
  filteredMembers.value.find((member) => getMemberId(member) === String(id)) ?? null
)

const selectedMember = computed(() => findMemberById(memberId.value))
const selectedMembers = computed(() => (
  selectedMemberIds.value
    .map((id) => findMemberById(id))
    .filter((member): member is Member => Boolean(member))
))

const displayAssignmentMembers = computed(() => {
  const alreadyAssigned = activeAssignments.value.map((assignment) => ({
    key: `assigned-${assignment.assignmentId ?? getAssignmentMemberId(assignment)}`,
    memberId: getAssignmentMemberId(assignment),
    label: `${assignment.departmentName ?? '-'} - ${assignment.memberName}(${assignment.memberNo})`,
    isAlreadyAssigned: true,
  }))

  const newlySelected = selectedMembers.value.map((member) => ({
    key: `selected-${getMemberId(member)}`,
    memberId: getMemberId(member),
    label: `${getMemberDepartmentName(member)} - ${getMemberLabel(member)}`,
    isAlreadyAssigned: false,
  }))

  return [...alreadyAssigned, ...newlySelected]
})

const totalAssignedSeatCount = computed(() => (
  activeAssignments.value.length + selectedMembers.value.length
))

const getAssignmentMemberId = (assignment: IntangibleAssetAssignmentResponse) => {
  if (assignment.memberId) return assignment.memberId

  const matchedMember = filteredMembers.value.find((member) => (
    getMemberNo(member) === assignment.memberNo
    || getMemberName(member) === assignment.memberName
  ))

  return matchedMember ? getMemberId(matchedMember) : ''
}

const cancelableAssets = computed(() => props.assets.filter((asset) => getAssetStatus(asset) === 'IN_USE'))
const isAssignableAssetStatus = (asset: IntangibleAsset) => {
  const status = getAssetStatus(asset)
  return status === 'AVAILABLE' || status === 'IN_USE'
}

const assignmentCountOfAsset = (asset: IntangibleAsset | null) => {
  if (!asset) return 0

  const aliases = asset as IntangibleAssetAliases
  const count = aliases.activeAssignmentCount
    ?? aliases.assignedMemberCount
    ?? aliases.currentUserCount
    ?? aliases.assignmentCount

  return typeof count === 'number' ? count : 0
}

const assignableAssets = computed(() => props.assets.filter(isAssignableAssetStatus))
const visibleAssets = computed(() => (mode.value === 'assign' ? assignableAssets.value : cancelableAssets.value))
const assetOptions = computed(() => visibleAssets.value.map(getAssetLabel))
const selectedAssetBase = computed(() => visibleAssets.value.find((asset) => getAssetLabel(asset) === assetLabel.value) ?? null)
const selectedAssetDetail = ref<IntangibleAsset | null>(null)
const selectedAsset = computed(() => selectedAssetDetail.value ?? selectedAssetBase.value)

const activeAssignments = computed(() => assignments.value.filter((assignment) => (
  assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'
)))

const assignedMemberIds = computed(() => new Set(activeAssignments.value.map(getAssignmentMemberId).filter(Boolean)))
const selectedMemberIdSet = computed(() => new Set(selectedMemberIds.value))
const activeSeatCount = computed(() => Math.max(activeAssignments.value.length, assignmentCountOfAsset(selectedAsset.value)))
const selectedAssetSeatCount = computed(() => getAssetSeatCount(selectedAsset.value))
const assignableSeatCount = computed(() => Math.max(0, selectedAssetSeatCount.value - activeSeatCount.value))
const availableSeatCount = computed(() => Math.max(0, assignableSeatCount.value - selectedMemberIds.value.length))

const assignableMemberOptions = computed(() => departmentFilteredMembers.value
  .filter((member) => (
    availableSeatCount.value > 0
    && !assignedMemberIds.value.has(getMemberId(member))
    && !selectedMemberIdSet.value.has(getMemberId(member))
  ))
  .map((member) => ({
    label: getMemberLabel(member),
    value: getMemberId(member),
  })))

const canAddSelectedMember = computed(() => (
  Boolean(selectedMember.value)
  && availableSeatCount.value > 0
  && !assignedMemberIds.value.has(memberId.value)
  && !selectedMemberIdSet.value.has(memberId.value)
))

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
    departmentName: matchedAssignment?.departmentName ?? '-'
  }
})

const selectedAssetInfo = computed(() => ({
  assetCode: selectedAsset.value?.assetCode ?? '-',
  productName: selectedAsset.value ? getAssetProductName(selectedAsset.value) : '-',
  statusLabel: selectedAsset.value ? statusLabel(getAssetStatus(selectedAsset.value)) : '-',
  seatUsage: selectedAsset.value ? `${totalAssignedSeatCount.value}/${selectedAssetSeatCount.value}` : '-',
  currentUser: selectedAsset.value ? getAssetMemberName(selectedAsset.value) : '-',
  currentDepartment: selectedAsset.value?.departmentName
    ?? findDepartmentNameById(selectedAsset.value?.departmentId)
    ?? '-',
}))

const toServerDateTime = (value: string) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

const addSelectedMember = () => {
  if (!canAddSelectedMember.value || !selectedMember.value) return

  selectedMemberIds.value = [...selectedMemberIds.value, getMemberId(selectedMember.value)]
  memberId.value = ''
}

const removeSelectedMember = (targetMemberId: string) => {
  selectedMemberIds.value = selectedMemberIds.value.filter((selectedMemberId) => selectedMemberId !== targetMemberId)
}

const canSubmit = computed(() => {
  if (!selectedAsset.value) return false
  if (mode.value === 'assign') {
    return selectedMemberIds.value.length > 0
      && selectedMemberIds.value.length <= assignableSeatCount.value
  }
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
  memberInfo: assignment.memberNo
    ? `${assignment.memberName}(${assignment.memberNo})`
    : assignment.memberName,
  endedAt: assignment.endedAt ?? '-',
})))

const assignmentColumns: Column<IntangibleAssetAssignmentResponse>[] = [
  { key: 'memberInfo', label: '사용자(사번)', align: 'center', width: '16%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '12%' },
  { key: 'assignedAt', label: '배정 일시', align: 'center', width: '20%' },
  { key: 'endedAt', label: '종료 일시', align: 'center', width: '20%' },
  { key: 'assignmentStatus', label: '상태', align: 'center', width: '18%' },
]

const loadSelectedAssetDetail = async () => {
  const asset = selectedAssetBase.value
  if (!asset) {
    selectedAssetDetail.value = null
    return
  }

  const assetId = getAssetId(asset)
  if (!assetId) {
    selectedAssetDetail.value = asset
    return
  }

  try {
    const response = await intangibleAssetApi.getDetail(assetId)
    selectedAssetDetail.value = {
      ...asset,
      ...response.data,
      assetId,
    } as IntangibleAsset
  } catch (error) {
    console.error('무형자산 상세 조회 실패', error)
    selectedAssetDetail.value = asset
  }
}

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
  departmentId.value = ''
  memberId.value = ''
  selectedMemberIds.value = []
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

    if (mode.value === 'assign') {
      if (selectedMemberIds.value.length > assignableSeatCount.value) {
        errorMessage.value = `배정 가능 자리는 ${assignableSeatCount.value}개입니다.`
        return
      }

      for (const selectedMemberId of selectedMemberIds.value) {
        await intangibleAssetApi.assign(assetId, {
          memberId: selectedMemberId,
          endedAt: toServerDateTime(endedAt.value),
        })
      }
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
watch(assetLabel, async () => {
  departmentId.value = ''
  memberId.value = ''
  selectedMemberIds.value = []
  cancelTarget.value = 'ALL'
  selectedAssetDetail.value = null
  await loadSelectedAssetDetail()
  void loadAssignments()
})

watch(departmentId, () => {
  memberId.value = ''
})

watch([activeSeatCount, selectedAssetSeatCount], () => {
  if (selectedMemberIds.value.length > assignableSeatCount.value) {
    selectedMemberIds.value = selectedMemberIds.value.slice(0, assignableSeatCount.value)
  }
})

</script>
