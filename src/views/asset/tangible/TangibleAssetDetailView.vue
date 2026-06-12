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
            <Dropdown v-model="assetEditForm.statusLabel" :options="statusOptions" />
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
          <Input id="edit-location" v-model="assetEditForm.location" label="위치" placeholder="위치 입력" required />
          <Input id="edit-startedAt" v-model="assetEditForm.startedAt" type="datetime-local" label="사용 시작 일시" :required="requiresAssignmentInfo" />
          <Input id="edit-returnDueDate" v-model="assetEditForm.returnDueDate" type="datetime-local" label="반납 예정 일시" />
          <FormField class="" label="부서" :required="requiresAssignmentInfo">
            <Dropdown v-model="assetEditForm.departmentName" :options="departmentOptions" root-option="부서 선택" />
          </FormField>
          <FormField label="사용자" :required="requiresAssignmentInfo">
            <Dropdown v-model="assetEditForm.memberName" :options="memberOptions" root-option="사용자 선택" />
          </FormField>
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
          variant="outline"
          class="flex-1"
          :disabled="!isAssetEditDirty || isSavingAsset"
          @click="resetAssetEditForm"
        >
          초기화
        </Button>
        <Button
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
  departmentName: string
  memberName: string
  purchaseDate: string
  purchasePrice: string
  vendor: string
  warrantyExpiredAt: string
}

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

const departmentOptions = computed(() => props.departments.map((department) => department.name))
const memberOptions = computed(() => (
  props.members.map((member) => `${member.name}(${member.memberNo})`)
))

const selectedDepartment = computed(() => (
  props.departments.find((department) => department.name === assetEditForm.value.departmentName)
))

const selectedMember = computed(() => (
  props.members.find((member) =>
    `${member.name}(${member.memberNo})` === assetEditForm.value.memberName ||
    member.name === assetEditForm.value.memberName,
  )
))

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
    departmentName: asset.departmentName ?? '부서 선택',
    memberName: displayMemberName
      ? `${displayMemberName}${assignedMember ? `(${assignedMember.memberNo})` : ''}`
      : '사용자 선택',
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
  const department = selectedDepartment.value
    ?? props.departments.find((candidate) => candidate.departmentId === member?.departmentId)

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
</script>
