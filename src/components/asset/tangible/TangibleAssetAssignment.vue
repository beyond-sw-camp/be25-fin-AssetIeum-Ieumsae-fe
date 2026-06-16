<template>
  <div class="flex min-h-full flex-col">
    <div class="flex-1 space-y-6 p-6 pb-8">
      <div class="grid grid-cols-3 gap-2 rounded-lg bg-surface-secondary p-1">
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

      <section v-if="mode !== 'bulk'" class="space-y-4">
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

          <Input id="assignment-asset-code" v-model="selectedAssetInfo.assetCode" label="자산 번호" disabled />
          <Input id="assignment-product-name" v-model="selectedAssetInfo.productName" label="제품명" disabled />
          <Input id="assignment-status" v-model="selectedAssetInfo.statusLabel" label="자산 상태" disabled />
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
              :options="memberOptions"
              placeholder="사용자를 선택하세요"
            />
          </FormField>

          <Input id="assignment-department-name" :model-value="selectedMemberInfo.departmentName" label="부서" disabled />

          <FormField label="사용 유형" required>
            <Dropdown v-model="usageTypeLabel" :options="usageTypeOptions" />
          </FormField>

          <FormField label="자산 사용 범위" required>
            <Dropdown v-model="assetUsageTypeLabel" :options="assetUsageTypeOptions" />
          </FormField>

          <Input
            id="assignment-ended-at"
            v-model="endedAt"
            type="datetime-local"
            label="반납 예정 일시"
            :disabled="usageTypeLabel === '정식 배정'"
          />
        </div>
        <p v-if="usageTypeLabel === '정식 배정'" class="text-xs text-text-sub">
          정식 배정은 반납 예정 일시 없이 요청합니다.
        </p>
      </section>

      <section v-if="mode === 'reassign'" class="space-y-4">
        <h2 class="text-sm font-bold text-text-main">
          재배정 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="assignment-current-member" v-model="selectedAssetInfo.currentUser" label="현재 사용자" disabled />

          <FormField label="새 사용자" required>
            <Dropdown
              v-model="newMemberId"
              :options="reassignMemberOptions"
              placeholder="새 사용자를 선택하세요"
            />
          </FormField>

          <Input id="assignment-current-department-name" :model-value="selectedAssetInfo.currentDepartment" label="현재 부서" disabled />
          <Input id="assignment-new-department-name" :model-value="selectedNewMemberInfo.departmentName" label="새 부서" disabled />
        </div>
      </section>

      <section v-if="mode === 'bulk'" class="space-y-4">
        <div class="flex gap-2">
          <h2 class="text-sm font-bold text-text-main">
            사용자 기준 일괄 재배정
          </h2>
          <p class="text-sm text-text-sub">
            (같은 부서의 사용자에게만 배정이 가능합니다.)
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="현재 사용자" required>
            <Dropdown
              v-model="currentMemberId"
              :options="memberOptions"
              placeholder="현재 사용자를 선택하세요"
            />
          </FormField>

          <FormField label="새 사용자" required>
            <Dropdown
              v-model="bulkNewMemberId"
              :options="bulkReassignMemberOptions"
              placeholder="새 사용자를 선택하세요"
            />
          </FormField>

          <Input id="bulk-current-member-no" :model-value="selectedCurrentMemberInfo.memberNo" label="현재 사번" disabled />
          <Input id="bulk-new-member-no" :model-value="selectedBulkNewMemberInfo.memberNo" label="새 사번" disabled />
          <Input id="bulk-current-department" :model-value="selectedCurrentMemberInfo.departmentName" label="현재 부서" disabled />
          <Input id="bulk-new-department" :model-value="selectedBulkNewMemberInfo.departmentName" label="새 부서" disabled />
        </div>
      </section>

      <section v-if="mode !== 'bulk'" class="space-y-3">
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
          <template #cell-memberInfo="{ row }">
            <span>{{ row.memberName }}({{ row.memberNo }})</span>
          </template>

          <template #cell-assignmentType="{ value }">
            <span>{{ usageTypeText(value as string) }}</span>
          </template>
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
      <Button
        v-if="mode === 'reassign'"
        variant="danger"
        class="flex-1"
        :disabled="!selectedAsset || isSubmitting"
        :loading="isSubmitting"
        @click="returnSelectedAsset"
      >
        배정 해지
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed, defineComponent, h, ref } from 'vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import {
  tangibleAssetApi,
  type TangibleAssetAssignmentAssetUsageType,
  type TangibleAssetAssignmentResponse,
  type TangibleAssetAssignmentUsageType,
} from '@/api/asset.api'
import { TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { Department, Member, TangibleAsset } from '@/types'

type AssignmentMode = 'assign' | 'reassign' | 'bulk'

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

interface TangibleAssetAliases extends TangibleAsset {
  id?: string | number | null
  productName?: string
  assetItemName?: string
  tangibleAssetstatus?: string | null
  memberName?: string | null
  userName?: string | null
}

interface DepartmentAliases extends Department {
  id?: string
  department_id?: string
  departmentName?: string
}

const props = defineProps<{
  assets: TangibleAsset[]
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
  { value: 'reassign', label: '재배정/반납' },
  { value: 'bulk', label: '일괄 재배정' },
]
const usageTypeOptions = ['정식 배정', '임시 대여']
const assetUsageTypeOptions = ['개인자산', '공용자산']

const mode = ref<AssignmentMode>('assign')
const assetLabel = ref('')
const memberId = ref('')
const newMemberId = ref('')
const currentMemberId = ref('')
const bulkNewMemberId = ref('')
const usageTypeLabel = ref('정식 배정')
const assetUsageTypeLabel = ref('개인자산')
const endedAt = ref('')
const isSubmitting = ref(false)
const isLoadingAssignments = ref(false)
const errorMessage = ref('')
const assignments = ref<TangibleAssetAssignmentResponse[]>([])

const getAssetId = (asset: TangibleAsset) => {
  const aliases = asset as TangibleAssetAliases
  return String(
    asset.assetId
      ?? aliases.id
      ?? asset.tangibleAssetId
      ?? asset.tangibleAssetAssetId
      ?? asset.asset_id
      ?? null
  )
}

const getAssetStatus = (asset: TangibleAsset) => {
  const aliases = asset as TangibleAssetAliases
  const itemStatus = asset.status ?? asset.tangibleAssetStatus ?? aliases.tangibleAssetstatus
  return itemStatus ?? 'AVAILABLE'
}

const statusLabel = (status: string | null | undefined) => (
  status ? TANGIBLE_STATUS_LABEL[status as keyof typeof TANGIBLE_STATUS_LABEL] ?? status : '-'
)

const getAssetProductName = (asset: TangibleAsset) => {
  const aliases = asset as TangibleAssetAliases
  return aliases.productName ?? aliases.assetItemName ?? asset.assetCode ?? '제품명 없음'
}

const getAssetMemberName = (asset: TangibleAsset) => {
  const aliases = asset as TangibleAssetAliases
  return asset.assignedMemberName ?? aliases.memberName ?? aliases.userName ?? '미배정'
}

const normalizeText = (value: string | null | undefined) => (
  (value ?? '').trim().toLowerCase()
)

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

const getAssetMemberNo = (asset: TangibleAsset) => (
  asset.currentUserMemberNo ?? ''
)

const getAssetMemberId = (asset: TangibleAsset) => {
  const memberId = asset.assignedMemberId ?? asset.memberId ?? ''
  if (memberId) return memberId

  const memberName = normalizeText(getAssetMemberName(asset))
  const memberNo = normalizeText(getAssetMemberNo(asset))
  const matchedMember = filteredMembers.value.find((member) => (
    (!!memberNo && normalizeText(getMemberNo(member)) === memberNo)
    || (!!memberName && normalizeText(getMemberName(member)) === memberName)
  ))

  return matchedMember ? getMemberId(matchedMember) : ''
}

const getAssetDepartmentName = (asset: TangibleAsset) => {
  if (asset.departmentName) return asset.departmentName
  const departmentName = findDepartmentNameById(asset.departmentId)
  if (departmentName) return departmentName

  const member = findMemberByIdentity({
    memberId: getAssetMemberId(asset),
    memberNo: getAssetMemberNo(asset),
    name: getAssetMemberName(asset),
  })

  if (member) return getMemberDepartmentName(member)

  return '-'
}

const getAssetLabel = (asset: TangibleAsset) => (
  `${getAssetProductName(asset)} / ${asset.assetCode ?? '-'} / ${statusLabel(getAssetStatus(asset))}`
)

const assignableAssets = computed(() => props.assets.filter((asset) => {
  const status = getAssetStatus(asset)
  const hasNoMemberId = !asset.assignedMemberId
  const memberName = getAssetMemberName(asset)
  const hasNoMemberName = !memberName || memberName === '미배정'

  return status === 'AVAILABLE' && hasNoMemberId && hasNoMemberName
}))

const assignedAssets = computed(() => props.assets.filter((asset) => {
  const status = getAssetStatus(asset)
  const hasMemberId = !!asset.assignedMemberId
  const memberName = getAssetMemberName(asset)
  const hasValidMemberName = memberName && memberName !== '미배정'

  return status !== 'DISPOSED' && (hasMemberId || hasValidMemberName)
}))

const visibleAssets = computed(() => (mode.value === 'assign' ? assignableAssets.value : assignedAssets.value))
const assetOptions = computed(() => visibleAssets.value.map(getAssetLabel))
const selectedAsset = computed(() => visibleAssets.value.find((asset) => getAssetLabel(asset) === assetLabel.value) ?? null)

const selectedAssetInfo = computed(() => ({
  assetCode: selectedAsset.value?.assetCode ?? '-',
  productName: selectedAsset.value ? getAssetProductName(selectedAsset.value) : '-',
  statusLabel: selectedAsset.value ? statusLabel(getAssetStatus(selectedAsset.value)) : '-',
  currentUser: selectedAsset.value ? getAssetMemberName(selectedAsset.value) : '-',
  currentDepartment: selectedAsset.value ? getAssetDepartmentName(selectedAsset.value) : '-',
}))

const getMemberId = (member: Member) => {
  const aliases = member as MemberAliases
  return member.memberId ?? aliases.id ?? aliases.member_id ?? ''
}

const getMemberNo = (member: Member) => {
  const aliases = member as MemberAliases
  return member.memberNo ?? aliases.employeeNo ?? aliases.employee_no ?? '-'
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

const getMemberName = (member: Member) => {
  const aliases = member as MemberAliases
  return member.name ?? aliases.memberName ?? '-'
}

const findMemberByIdentity = ({
  memberId,
  memberNo,
  name,
}: {
  memberId?: string | null
  memberNo?: string | null
  name?: string | null
}) => {
  const normalizedId = normalizeText(memberId)
  const normalizedNo = normalizeText(memberNo)
  const normalizedName = normalizeText(name)

  return props.members.find((member) => {
    const candidateId = normalizeText(getMemberId(member))
    const candidateNo = normalizeText(getMemberNo(member))
    const candidateName = normalizeText(getMemberName(member))

    return (!!normalizedId && candidateId === normalizedId)
      || (!!normalizedNo && candidateNo === normalizedNo)
      || (!!normalizedName && candidateName === normalizedName)
  }) ?? null
}

const getMemberLabel = (member: Member) => `${getMemberName(member)}(${getMemberNo(member)})`

const filteredMembers = computed(() => {
  return props.members.filter((member) => {
    const aliases = member as MemberAliases
    const rawRole = aliases.role ?? aliases.memberRole
    
    if (!rawRole) return true

    const roleStr = typeof rawRole === 'object'
      ? (typeof (rawRole as Record<string, unknown>).name === 'string' ? String((rawRole as Record<string, unknown>).name) : '')
      : String(rawRole)

    const upperRole = roleStr.toUpperCase()
    return upperRole !== 'ADMIN' && upperRole !== 'SUPER_ADMIN'
  })
})

const memberOptions = computed(() => filteredMembers.value.map((member) => ({
  label: getMemberLabel(member),
  value: getMemberId(member),
})))

const reassignMemberOptions = computed(() => {
  const currentMemberId = selectedAsset.value ? getAssetMemberId(selectedAsset.value) : ''
  const currentMember = currentMemberId ? findMemberById(currentMemberId) : null
  const currentDepartmentName = currentMember
    ? getMemberDepartmentName(currentMember)
    : selectedAsset.value
      ? getAssetDepartmentName(selectedAsset.value)
      : ''
  const normalizedCurrentDepartmentName = normalizeText(currentDepartmentName)

  if (!normalizedCurrentDepartmentName || normalizedCurrentDepartmentName === '-') return []

  return filteredMembers.value
    .filter((member) => {
      const candidateMemberId = getMemberId(member)
      if (currentMemberId && candidateMemberId === currentMemberId) return false
      return normalizeText(getMemberDepartmentName(member)) === normalizedCurrentDepartmentName
    })
    .map((member) => ({
      label: getMemberLabel(member),
      value: getMemberId(member),
    }))
})

const bulkReassignMemberOptions = computed(() => {
  const currentMember = selectedCurrentMember.value
  if (!currentMember) return []

  const currentId = getMemberId(currentMember)
  const currentDepartmentName = getMemberDepartmentName(currentMember)

  return filteredMembers.value
    .filter((member) => {
      const candidateMemberId = getMemberId(member)
      if (candidateMemberId === currentId) return false
      return getMemberDepartmentName(member) === currentDepartmentName
    })
    .map((member) => ({
      label: getMemberLabel(member),
      value: getMemberId(member),
    }))
})

const findMemberById = (id: string | number) => (
  filteredMembers.value.find((member) => getMemberId(member) === String(id)) ?? null
)

const selectedMember = computed(() => findMemberById(memberId.value))
const selectedNewMember = computed(() => findMemberById(newMemberId.value))
const selectedCurrentMember = computed(() => findMemberById(currentMemberId.value))
const selectedBulkNewMember = computed(() => findMemberById(bulkNewMemberId.value))

const memberInfo = (member: Member | null) => ({
  memberNo: member ? getMemberNo(member) : '-',
  name: member ? getMemberName(member) : '-',
  departmentName: member ? getMemberDepartmentName(member) : '-',
})

const selectedMemberInfo = computed(() => memberInfo(selectedMember.value))
const selectedNewMemberInfo = computed(() => memberInfo(selectedNewMember.value))
const selectedCurrentMemberInfo = computed(() => memberInfo(selectedCurrentMember.value))
const selectedBulkNewMemberInfo = computed(() => memberInfo(selectedBulkNewMember.value))

const usageTypeValue = (): TangibleAssetAssignmentUsageType => (
  usageTypeLabel.value === '임시 대여' ? 'TEMPORARY' : 'PERMANENT'
)

const assetUsageTypeValue = (): TangibleAssetAssignmentAssetUsageType => (
  assetUsageTypeLabel.value === '공용자산' ? 'DEPARTMENT' : 'PERSONAL'
)

const toServerDateTime = (value: string) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

const canSubmit = computed(() => {
  if (mode.value === 'assign') {
    return !!selectedAsset.value
      && !!selectedMember.value
      && (usageTypeValue() !== 'TEMPORARY' || !!endedAt.value)
  }
  if (mode.value === 'reassign') return !!selectedAsset.value && !!selectedNewMember.value
  return !!selectedCurrentMember.value && !!selectedBulkNewMember.value
})

const submitLabel = computed(() => {
  if (mode.value === 'assign') return '배정하기'
  if (mode.value === 'reassign') return '재배정하기'
  return '일괄 재배정하기'
})

const usageTypeText = (value: string) => {
  if (value === 'TEMPORARY') return '임시 대여'
  if (value === 'PERMANENT') return '정식 배정'
  return value || '-'
}

const assignmentStatusText = (value: string) => {
  if (value === 'ACTIVE') return '배정 중'
  if (value === 'ENDED') return '종료'
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

const assignmentColumns: Column<TangibleAssetAssignmentResponse>[] = [
  { key: 'memberInfo', label: '사용자(사번)', align: 'center', width: '16%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '12%' },
  { key: 'assignmentType', label: '유형', align: 'center', width: '14%' },
  { key: 'assignedAt', label: '배정 일시', align: 'center', width: '18%' },
  { key: 'endedAt', label: '종료 일시', align: 'center', width: '18%' },
  { key: 'assignmentStatus', label: '상태', align: 'center', width: '18%' },
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
    const response = await tangibleAssetApi.getAssignments(assetId)
    assignments.value = response.data
  } catch (error) {
    console.error('유형자산 배정 이력 조회 실패', error)
    assignments.value = []
  } finally {
    isLoadingAssignments.value = false
  }
}

const resetForm = () => {
  if (isSubmitting.value) return
  assetLabel.value = ''
  memberId.value = ''
  newMemberId.value = ''
  currentMemberId.value = ''
  bulkNewMemberId.value = ''
  usageTypeLabel.value = '정식 배정'
  assetUsageTypeLabel.value = '개인자산'
  endedAt.value = ''
  assignments.value = []
  errorMessage.value = ''
}

const submit = async () => {
  if (!canSubmit.value) {
    errorMessage.value = '필수 항목을 모두 선택해주세요.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (mode.value === 'assign' && selectedAsset.value && selectedMember.value) {
      if (usageTypeValue() === 'TEMPORARY' && !endedAt.value) {
        errorMessage.value = '임시 배정은 반납 예정 일시가 필수입니다.'
        return
      }

      await tangibleAssetApi.assign(getAssetId(selectedAsset.value), {
        memberId: getMemberId(selectedMember.value),
        usageType: usageTypeValue(),
        assetUsageType: assetUsageTypeValue(),
        endedAt: usageTypeValue() === 'PERMANENT' ? null : toServerDateTime(endedAt.value),
      })
    }

    if (mode.value === 'reassign' && selectedAsset.value && selectedNewMember.value) {
      await tangibleAssetApi.reassign(getAssetId(selectedAsset.value), {
        newMemberId: getMemberId(selectedNewMember.value),
      })
    }

    if (mode.value === 'bulk' && selectedCurrentMember.value && selectedBulkNewMember.value) {
      await tangibleAssetApi.reassignBulk({
        currentMemberId: getMemberId(selectedCurrentMember.value),
        newMemberId: getMemberId(selectedBulkNewMember.value),
      })
    }

    emit('assigned')
    resetForm()
  } catch (error) {
    console.error('유형자산 배정 처리 실패', error)
    errorMessage.value = '유형자산 배정 처리 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

const returnSelectedAsset = async () => {
  if (!selectedAsset.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await tangibleAssetApi.returnAsset(getAssetId(selectedAsset.value))
    emit('assigned')
    resetForm()
  } catch (error) {
    console.error('유형자산 반납 처리 실패', error)
    errorMessage.value = '유형자산 배정 해지 처리 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
