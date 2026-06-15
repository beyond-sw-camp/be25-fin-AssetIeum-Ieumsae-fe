<template>
  <div class="space-y-6">
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
            v-model="memberLabel"
            :options="memberOptions"
            placeholder="사용자를 선택하세요"
          />
        </FormField>

        <Input id="assignment-member-no" v-model="selectedMemberInfo.memberNo" label="사번" disabled />
        <Input id="assignment-member-name" v-model="selectedMemberInfo.name" label="사용자명" disabled />
        <Input id="assignment-department-name" v-model="selectedMemberInfo.departmentName" label="부서" disabled />

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
            v-model="newMemberLabel"
            :options="memberOptions"
            placeholder="새 사용자를 선택하세요"
          />
        </FormField>

        <Input id="assignment-new-member-no" v-model="selectedNewMemberInfo.memberNo" label="새 사번" disabled />
        <Input id="assignment-new-department-name" v-model="selectedNewMemberInfo.departmentName" label="새 부서" disabled />
      </div>
    </section>

    <section v-if="mode === 'bulk'" class="space-y-4">
      <h2 class="text-sm font-bold text-text-main">
        사용자 기준 일괄 재배정
      </h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="현재 사용자" required>
          <Dropdown
            v-model="currentMemberLabel"
            :options="memberOptions"
            placeholder="현재 사용자를 선택하세요"
          />
        </FormField>

        <FormField label="새 사용자" required>
          <Dropdown
            v-model="bulkNewMemberLabel"
            :options="memberOptions"
            placeholder="새 사용자를 선택하세요"
          />
        </FormField>

        <Input id="bulk-current-member-no" v-model="selectedCurrentMemberInfo.memberNo" label="현재 사번" disabled />
        <Input id="bulk-new-member-no" v-model="selectedBulkNewMemberInfo.memberNo" label="새 사번" disabled />
        <Input id="bulk-current-department" v-model="selectedCurrentMemberInfo.departmentName" label="현재 부서" disabled />
        <Input id="bulk-new-department" v-model="selectedBulkNewMemberInfo.departmentName" label="새 부서" disabled />
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

    <div class="flex gap-2">
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
        반납 처리
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
  tangibleAssetApi,
  type TangibleAssetAssignmentAssetUsageType,
  type TangibleAssetAssignmentResponse,
  type TangibleAssetAssignmentUsageType,
} from '@/api/asset.api'
import { TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { Member, TangibleAsset } from '@/types'

type AssignmentMode = 'assign' | 'reassign' | 'bulk'

interface MemberAliases extends Member {
  id?: string
  member_id?: string
  employeeNo?: string
  employee_no?: string
  department_name?: string
  department?: {
    name?: string
    departmentName?: string
  }
}

interface TangibleAssetAliases extends TangibleAsset {
  id?: string | number | null
  productName?: string
  assetItemName?: string
  tangibleAssetstatus?: string | null
  memberName?: string | null
  userName?: string | null
}

const props = defineProps<{
  assets: TangibleAsset[]
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
const memberLabel = ref('')
const newMemberLabel = ref('')
const currentMemberLabel = ref('')
const bulkNewMemberLabel = ref('')
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
      ?? asset.tangible_asset_id
      ?? asset.tangible_asset_asset_id
      ?? '',
  )
}

const getAssetStatus = (asset: TangibleAsset) => {
  const aliases = asset as TangibleAssetAliases
  return asset.status ?? asset.tangibleAssetStatus ?? aliases.tangibleAssetstatus ?? 'AVAILABLE'
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

const getAssetLabel = (asset: TangibleAsset) => (
  `${getAssetProductName(asset)} / ${asset.assetCode ?? '-'} / ${statusLabel(getAssetStatus(asset))}`
)

const assignableAssets = computed(() => props.assets.filter((asset) => {
  const status = getAssetStatus(asset)
  return status === 'AVAILABLE' || !asset.assignedMemberId
}))

const assignedAssets = computed(() => props.assets.filter((asset) => {
  const status = getAssetStatus(asset)
  return status !== 'AVAILABLE' && status !== 'DISPOSED' && !!asset.assignedMemberId
}))

const visibleAssets = computed(() => (mode.value === 'assign' ? assignableAssets.value : assignedAssets.value))
const assetOptions = computed(() => visibleAssets.value.map(getAssetLabel))
const selectedAsset = computed(() => visibleAssets.value.find((asset) => getAssetLabel(asset) === assetLabel.value) ?? null)

const selectedAssetInfo = computed(() => ({
  assetCode: selectedAsset.value?.assetCode ?? '-',
  productName: selectedAsset.value ? getAssetProductName(selectedAsset.value) : '-',
  statusLabel: selectedAsset.value ? statusLabel(getAssetStatus(selectedAsset.value)) : '-',
  currentUser: selectedAsset.value ? getAssetMemberName(selectedAsset.value) : '-',
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
  return member.departmentName
    ?? aliases.department_name
    ?? aliases.department?.name
    ?? aliases.department?.departmentName
    ?? '-'
}

const getMemberLabel = (member: Member) => `${member.name}(${getMemberNo(member)})`
const memberOptions = computed(() => props.members.map(getMemberLabel))
const findMemberByLabel = (label: string) => props.members.find((member) => getMemberLabel(member) === label) ?? null

const selectedMember = computed(() => findMemberByLabel(memberLabel.value))
const selectedNewMember = computed(() => findMemberByLabel(newMemberLabel.value))
const selectedCurrentMember = computed(() => findMemberByLabel(currentMemberLabel.value))
const selectedBulkNewMember = computed(() => findMemberByLabel(bulkNewMemberLabel.value))

const memberInfo = (member: Member | null) => ({
  memberNo: member ? getMemberNo(member) : '-',
  name: member?.name ?? '-',
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
  if (mode.value === 'assign') return !!selectedAsset.value && !!selectedMember.value
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
  if (value === 'ASSIGNED') return '배정 중'
  if (value === 'RETURNED') return '반납 완료'
  if (value === 'CANCELED') return '취소'
  if (value === 'EXPIRED') return '만료'
  return value || '-'
}

const assignmentStatusClass = (value: string) => {
  if (value === 'ASSIGNED') return 'bg-success/10 text-success'
  if (value === 'RETURNED') return 'bg-surface-secondary text-text-sub'
  if (value === 'EXPIRED') return 'bg-warning/10 text-warning'
  return 'bg-danger/10 text-danger'
}

const assignmentRows = computed(() => assignments.value.map((assignment) => ({
  ...assignment,
  endedAt: assignment.endedAt ?? '-',
})))

const assignmentColumns: Column<TangibleAssetAssignmentResponse>[] = [
  { key: 'memberName', label: '사용자', align: 'center', width: '16%' },
  { key: 'memberNo', label: '사번', align: 'center', width: '14%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '18%' },
  { key: 'assignmentType', label: '유형', align: 'center', width: '14%' },
  { key: 'assignedAt', label: '배정 일시', align: 'center', width: '18%' },
  { key: 'endedAt', label: '종료 일시', align: 'center', width: '18%' },
  { key: 'assignmentStatus', label: '상태', align: 'center', width: '12%' },
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
  memberLabel.value = ''
  newMemberLabel.value = ''
  currentMemberLabel.value = ''
  bulkNewMemberLabel.value = ''
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
    errorMessage.value = '유형자산 반납 처리 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

watch(mode, () => resetForm())
watch(assetLabel, () => {
  void loadAssignments()
})
watch(usageTypeLabel, (value) => {
  if (value === '정식 배정') endedAt.value = ''
})
</script>
