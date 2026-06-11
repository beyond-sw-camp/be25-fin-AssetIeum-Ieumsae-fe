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
          <Input id="edit-location" v-model="assetEditForm.location" label="위치" placeholder="위치 입력" />
          <Input id="edit-startedAt" v-model="assetEditForm.startedAt" type="date" label="사용 시작일" />
          <Input id="edit-returnDueDate" v-model="assetEditForm.returnDueDate" type="date" label="반납 예정일" />
          <FormField class="" label="부서">
            <Dropdown v-model="assetEditForm.departmentName" :options="departmentOptions" root-option="부서 선택" />
          </FormField>
          <FormField label="사용자">
            <Dropdown v-model="assetEditForm.memberName" :options="memberOptions" root-option="사용자 선택" />
          </FormField>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          구매 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-purchaseDate" v-model="assetEditForm.purchaseDate" type="date" label="구매일" disabled />
          <Input id="edit-purchasePrice" v-model="assetEditForm.purchasePrice" label="구매 금액" placeholder="구매 금액 입력" disabled />
          <Input id="edit-vendor" v-model="assetEditForm.vendor" label="구매처" placeholder="구매처 입력" disabled />
          <Input id="edit-warrantyExpiredAt" v-model="assetEditForm.warrantyExpiredAt" type="date" label="보증 만료일" disabled />
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
  assetUsageType?: string
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

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '-'
  return TANGIBLE_STATUS_LABEL[status as keyof typeof TANGIBLE_STATUS_LABEL] ?? status
}

const usageTypeLabel = (asset: TangibleAssetDetail) => {
  if (asset.usageType === 'PERMANENT') return '정식 배정'
  if (asset.usageType === 'TEMPORARY') return '임시 대여'
  if (asset.status === 'AVAILABLE') return '미배정'
  if (asset.assignedMemberName) return '정식 배정'
  return '공용자산'
}

const usageTypeValue = (): TangibleAssetUsageType | null => {
  if (assetEditForm.value.usageType === '정식 배정') return 'PERMANENT'
  if (assetEditForm.value.usageType === '임시 대여') return 'TEMPORARY'
  return null
}

const toAssetEditForm = (asset: TangibleAssetDetail): AssetEditForm => {
  const assignedMember = props.members.find((member) => member.memberId === asset.assignedMemberId)

  return {
    productName: asset.productName,
    assetCode: asset.assetCode,
    statusLabel: statusLabel(asset.status),
    serialNo: asset.serialNo,
    assetUsageType: asset.assetUsageType ?? (asset.assignedMemberName ? '개인자산' : '공용자산'),
    usageType: usageTypeLabel(asset),
    location: asset.location ?? '',
    startedAt: asset.startedAt ?? '',
    returnDueDate: asset.returnDueDate ?? '',
    departmentName: asset.departmentName ?? '부서 선택',
    memberName: asset.assignedMemberName
      ? `${asset.assignedMemberName}${assignedMember ? `(${assignedMember.memberNo})` : ''}`
      : '사용자 선택',
    purchaseDate: asset.purchaseDate ?? '',
    purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : '',
    vendor: asset.vendor ?? '',
    warrantyExpiredAt: asset.warrantyExpiredAt ?? '',
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

const handleUpdateAsset = async () => {
  if (!props.asset || isSavingAsset.value || !isAssetEditDirty.value) return

  if (!assetEditForm.value.productName.trim() || !assetEditForm.value.assetCode.trim() || !assetEditForm.value.serialNo.trim()) {
    alert('필수 항목을 입력해주세요.')
    return
  }

  const isAssigned = assetEditForm.value.usageType === '정식 배정'
  const isShared = assetEditForm.value.usageType === '공용자산'
  const department = selectedDepartment.value
  const member = selectedMember.value

  if (isAssigned && !member) {
    alert('정식 배정 자산은 사용자를 선택해주세요.')
    return
  }

  isSavingAsset.value = true

  try {
    await tangibleAssetApi.update(props.asset.assetId, {
      status: statusByLabel[assetEditForm.value.statusLabel] ?? props.asset.status,
      assignedMemberId: isAssigned ? member?.memberId ?? null : null,
      assignedMemberName: isAssigned ? member?.name ?? null : null,
      departmentId: isAssigned ? member?.departmentId ?? null : isShared ? department?.departmentId ?? null : null,
      departmentName: isAssigned ? member?.departmentName ?? null : isShared ? department?.name ?? null : null,
      usageType: usageTypeValue(),
      startedAt: assetEditForm.value.startedAt.trim() || null,
      returnDueDate: assetEditForm.value.returnDueDate.trim() || null,
      location: assetEditForm.value.location.trim() || null,
    })

    emit('saved')
    emit('close')
  } catch (error) {
    console.error(error)
    alert('자산 수정 중 오류가 발생했습니다.')
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
