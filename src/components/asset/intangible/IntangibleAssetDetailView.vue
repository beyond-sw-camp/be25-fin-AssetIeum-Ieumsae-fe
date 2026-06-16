<template>
  <BaseDrawer
    :is-open="isOpen"
    title="무형자산 상세/수정"
    @close="emit('close')"
  >
    <div v-if="currentAsset" class="space-y-8">
      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          기본 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-assetItemName" v-model="assetEditForm.assetItemName" label="품목명" disabled />
          <Input id="edit-assetCode" v-model="assetEditForm.assetCode" label="자산 코드" disabled />
          <FormField label="자산 상태" required>
            <Dropdown v-model="assetEditForm.statusLabel" :options="statusOptions" disabled />
          </FormField>
          <Input id="edit-licenseCode" v-model="assetEditForm.licenseCode" label="라이선스 번호" disabled />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          사용 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-semibold text-text-main">
              사용자 정보 (부서-사용자)
            </label>

            <p
              class="min-h-9 whitespace-pre-wrap break-words rounded-xl border border-border bg-surface-secondary px-3.5 py-2 text-sm text-text-main"
            >
              {{ displayAssignmentText || '-' }}
            </p>
          </div>
          <Input id="edit-seatCount" v-model="assetEditForm.seatCount" type="number" label="최대 사용 가능 인원 수" required :disabled="!canUpdateAsset" />
          <FormField label="자동 갱신 여부" required>
            <Dropdown v-model="assetEditForm.isAutoRenewal" :options="autoRenewalOptions" :disabled="!canUpdateAsset" />
          </FormField>
          <Input id="edit-startedAt" v-model="assetEditForm.startedAt" type="datetime-local" label="사용 시작 일시" :disabled="!canUpdateAsset" />
          <Input id="edit-expiredAt" v-model="assetEditForm.expiredAt" type="datetime-local" label="만료 일시" :disabled="!canUpdateAsset" />
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          구매 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-purchaseDate" v-model="assetEditForm.purchaseDate" type="datetime-local" label="구매 일시" disabled />
          <Input id="edit-purchasePrice" v-model="assetEditForm.purchasePrice" label="구매 금액" disabled />
          <Input id="edit-purchaseVendor" v-model="assetEditForm.purchaseVendor" label="구매처" disabled />
          <Input id="edit-billingCycle" v-model="assetEditForm.billingCycle" label="결제 주기" disabled />
        </div>
      </section>
    </div>

    <div v-else class="py-12 text-center text-sm text-text-muted">
      무형자산 상세 정보를 불러오는 중입니다.
    </div>

    <template #footer>
      <p v-if="saveErrorMessage" class="mb-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
        {{ saveErrorMessage }}
      </p>
      <p v-if="seatCountValidationMessage" class="mb-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
        {{ seatCountValidationMessage }}
      </p>
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
          :disabled="!isAssetEditDirty || isSavingAsset || Boolean(seatCountValidationMessage)"
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
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { intangibleAssetApi } from '@/api/asset.api'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { BillingCycle, IntangibleAsset } from '@/types'
import type { IntangibleAssetAssignmentResponse } from '@/api/asset.api'
import { usePermission } from '@/composables'

interface AssetEditForm {
  assetItemName: string
  assetCode: string
  statusLabel: string
  licenseCode: string
  seatCount: string
  isAutoRenewal: string
  billingCycle: string
  departmentName: string
  memberName: string
  startedAt: string
  expiredAt: string
  purchaseDate: string
  purchasePrice: string
  purchaseVendor: string
}

type IntangibleAssetDetailAliases = IntangibleAsset & {
  intangibleAssetId?: string
  intangibleItemId?: string
  intangibleAssetItemId?: string
  productName?: string
  itemName?: string
  currentUserName?: string | null
  currentUserMemberNo?: string | null
  currentUserId?: string | null
  memberName?: string | null
  userName?: string | null
  provider?: string
  departmentName?: string | null
  departmentId?: string | null
  currentDepartmentName?: string | null
  assignedMemberCount?: number
  currentUserCount?: number
  activeAssignmentCount?: number
  assignmentCount?: number
}

const { canUpdateAsset } = usePermission()

const props = withDefaults(defineProps<{
  isOpen?: boolean
  asset?: IntangibleAsset | null
}>(), {
  isOpen: true,
  asset: null,
})

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

const statusOptions = Object.values(INTANGIBLE_STATUS_LABEL)

const autoRenewalOptions = ['자동 갱신', '자동 갱신 안 함']
const autoRenewalValueByLabel: Record<string, boolean> = {
  '자동 갱신': true,
  '자동 갱신 안 함': false,
}

const createEmptyAssetEditForm = (): AssetEditForm => ({
  assetItemName: '',
  assetCode: '',
  statusLabel: INTANGIBLE_STATUS_LABEL.AVAILABLE,
  licenseCode: '',
  seatCount: '',
  isAutoRenewal: '',
  billingCycle: '',
  departmentName: '',
  memberName: '',
  startedAt: '',
  expiredAt: '',
  purchaseDate: '',
  purchasePrice: '',
  purchaseVendor: '',
})

const route = useRoute()
const routeAsset = ref<IntangibleAsset | null>(null)
const assetEditForm = ref<AssetEditForm>(createEmptyAssetEditForm())
const initialAssetEditForm = ref<AssetEditForm>(createEmptyAssetEditForm())
const isSavingAsset = ref(false)
const saveErrorMessage = ref('')
const activeAssignments = ref<IntangibleAssetAssignmentResponse[]>([])
const currentAsset = computed(() => routeAsset.value ?? props.asset)

const isAssetEditDirty = computed(() => (
  JSON.stringify(assetEditForm.value) !== JSON.stringify(initialAssetEditForm.value)
))

const statusLabel = (status: string | null | undefined) => {
  if (!status) return INTANGIBLE_STATUS_LABEL.AVAILABLE
  return INTANGIBLE_STATUS_LABEL[status as keyof typeof INTANGIBLE_STATUS_LABEL] ?? status
}

const billingCycleLabel = (billingCycle: BillingCycle | null | undefined) => {
  if (billingCycle === 'MONTHLY') return '월간'
  if (billingCycle === 'YEARLY') return '연간'
  if (billingCycle === 'ONE_TIME') return '일회성'
  return billingCycle ?? ''
}

const positiveNumberValue = (value: string) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

const currentActiveAssignmentCount = computed(() => {
  if (activeAssignments.value.length > 0) return activeAssignments.value.length

  const assetWithAliases = currentAsset.value as IntangibleAssetDetailAliases | null
  const count = assetWithAliases?.activeAssignmentCount
    ?? assetWithAliases?.assignedMemberCount
    ?? assetWithAliases?.currentUserCount
    ?? assetWithAliases?.assignmentCount

  return typeof count === 'number' ? count : 0
})

const seatCountValidationMessage = computed(() => {
  const seatCount = positiveNumberValue(assetEditForm.value.seatCount)
  if (!seatCount || currentActiveAssignmentCount.value === 0) return ''
  if (seatCount >= currentActiveAssignmentCount.value) return ''

  return `현재 사용 중인 사용자가 ${currentActiveAssignmentCount.value}명이라 최대 사용 가능 인원 수를 ${currentActiveAssignmentCount.value}명 미만으로 줄일 수 없습니다.`
})

const toDateTimeInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`
  return value.slice(0, 16)
}

const toLocalDateTimeRequestValue = (value: string) => {
  const trimmedValue = value.trim()
  if (!trimmedValue || trimmedValue === '-') return undefined
  return trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue
}

const toIdString = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

const isUuid = (value: string) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
)

const toUuidString = (value: unknown) => {
  const id = toIdString(value)
  return isUuid(id) ? id : ''
}

const compactPayload = <T extends Record<string, unknown>>(payload: T) => (
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>
)

const getAssetId = () => (
  toUuidString(currentAsset.value?.assetId)
  || toUuidString((currentAsset.value as IntangibleAssetDetailAliases | null)?.intangibleAssetId)
  || (typeof route.params.assetId === 'string' ? toUuidString(route.params.assetId) : '')
)

const getAssetIdFrom = (asset: IntangibleAsset | null | undefined) => {
  const assetWithAliases = asset as IntangibleAssetDetailAliases | null | undefined
  return toUuidString(asset?.assetId)
    || toUuidString(assetWithAliases?.intangibleAssetId)
    || ''
}

const isActiveAssignment = (assignment: IntangibleAssetAssignmentResponse) => (
  assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'
)

const uniqueText = (values: Array<string | null | undefined>) => (
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
)

const splitDisplayText = (value: string) => (
  value
    .split(',')
    .map((text) => text.trim())
    .filter((text) => text && text !== '-')
)

const memberLabelOf = (assignment: IntangibleAssetAssignmentResponse) => {
  if (!assignment.memberName) return ''
  return assignment.memberNo ? `${assignment.memberName}(${assignment.memberNo})` : assignment.memberName
}

const assignmentMemberText = (assignments: IntangibleAssetAssignmentResponse[]) => (
  uniqueText(assignments.map(memberLabelOf)).join(', ')
)

const assignmentDepartmentText = (assignments: IntangibleAssetAssignmentResponse[]) => (
  uniqueText(assignments.map((assignment) => assignment.departmentName)).join(', ')
)

const toAssetEditForm = (asset: IntangibleAsset): AssetEditForm => {
  const assetWithAliases = asset as IntangibleAssetDetailAliases
  const displayMemberName = asset.assignedMemberName
    ?? assetWithAliases.memberName
    ?? assetWithAliases.userName
    ?? (assetWithAliases.currentUserName
      ? `${assetWithAliases.currentUserName}${assetWithAliases.currentUserMemberNo ? `(${assetWithAliases.currentUserMemberNo})` : ''}`
      : '')

  const displayDepartmentName = asset.departmentName
    ?? assetWithAliases.departmentName
    ?? assetWithAliases.currentDepartmentName
    ?? ''

  return {
    assetItemName: asset.assetItemName ?? assetWithAliases.productName ?? assetWithAliases.itemName ?? '-',
    assetCode: asset.assetCode ?? '-',
    statusLabel: statusLabel(asset.status ?? asset.intangibleAssetStatus),
    licenseCode: asset.licenseCode ?? asset.licenseKey ?? '-',
    seatCount: asset.seatCount !== undefined ? String(asset.seatCount) : '-',
    isAutoRenewal: asset.isAutoRenewal === undefined ? '' : asset.isAutoRenewal ? '자동 갱신' : '자동 갱신 안 함',
    billingCycle: billingCycleLabel(asset.billingCycle) || '-',
    departmentName: displayDepartmentName || '-',
    memberName: displayMemberName || '-',
    startedAt: toDateTimeInputValue(asset.startedAt),
    expiredAt: toDateTimeInputValue(asset.expiredAt),
    purchaseDate: toDateTimeInputValue(asset.purchaseDate),
    purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : '-',
    purchaseVendor: asset.purchaseVendor ?? assetWithAliases.provider ?? asset.vendor ?? '-',
  }
}

const displayAssignmentText = computed(() => {
  if (activeAssignments.value.length > 0) {
    return activeAssignments.value
      .map((assignment) => {
        const member = memberLabelOf(assignment)
        const departmentName = assignment.departmentName?.trim()

        if (departmentName && member) return `${departmentName} - ${member}`
        return departmentName || member
      })
      .filter((text) => text && text !== '-')
      .join('\n')
  }

  const departmentNames = splitDisplayText(assetEditForm.value.departmentName)
  const memberNames = splitDisplayText(assetEditForm.value.memberName)

  if (departmentNames.length > 0 && memberNames.length > 0) {
    return memberNames
      .map((memberName, index) => {
        const departmentName = departmentNames[index] ?? departmentNames[0]
        return `${departmentName} - ${memberName}`
      })
      .join('\n')
  }

  if (currentAsset.value) {
    const form = toAssetEditForm(currentAsset.value)
    const fallbackDepartmentNames = splitDisplayText(form.departmentName)
    const fallbackMemberNames = splitDisplayText(form.memberName)

    if (fallbackDepartmentNames.length > 0 && fallbackMemberNames.length > 0) {
      return fallbackMemberNames
        .map((memberName, index) => {
          const departmentName = fallbackDepartmentNames[index] ?? fallbackDepartmentNames[0]
          return `${departmentName} - ${memberName}`
        })
        .join('\n')
    }
  }

  return ''
})

const syncAssetEditForm = () => {
  if (!currentAsset.value) {
    assetEditForm.value = createEmptyAssetEditForm()
    initialAssetEditForm.value = createEmptyAssetEditForm()
    return
  }

  const form = toAssetEditForm(currentAsset.value)
  assetEditForm.value = { ...form }
  initialAssetEditForm.value = { ...form }
}

const loadAssetDetail = async () => {
  const assetId = getAssetIdFrom(props.asset) || getAssetId()
  if (!assetId) return

  try {
    const [detailResult, assignmentResult] = await Promise.allSettled([
      intangibleAssetApi.getDetail(assetId),
      intangibleAssetApi.getAssignments(assetId, { assignmentStatus: 'ACTIVE' }),
    ])

    let nextAsset: IntangibleAsset | null = props.asset ? { ...props.asset } : null

    if (detailResult.status === 'fulfilled') {
      nextAsset = {
        ...detailResult.value.data,
        assetId,
      }
      console.log('무형자산 상세 조회 성공', {
        endpoint: `GET /intangible-asset/assets/${assetId}`,
        status: detailResult.value.status,
        response: detailResult.value.data,
      })
    } else {
      console.error('무형자산 상세 조회 실패', detailResult.reason)
    }

    if (assignmentResult.status === 'fulfilled') {
      const assignments = assignmentResult.value.data.filter(isActiveAssignment)
      activeAssignments.value = assignments

      if (nextAsset && assignments.length > 0) {
        nextAsset = {
          ...nextAsset,
          assignedMemberName: assignmentMemberText(assignments) || nextAsset.assignedMemberName,
          departmentName: assignmentDepartmentText(assignments) || nextAsset.departmentName,
        }
      }

      console.log('무형자산 배정 이력 조회 성공', {
        endpoint: `GET /intangible-asset/assets/${assetId}/assignments?assignmentStatus=ACTIVE`,
        status: assignmentResult.value.status,
        activeAssignmentCount: assignments.length,
        response: assignmentResult.value.data,
      })
    } else {
      activeAssignments.value = []
      console.error('무형자산 배정 이력 조회 실패', assignmentResult.reason)
    }

    if (nextAsset) {
      routeAsset.value = nextAsset
      syncAssetEditForm()
    }
  } catch (error) {
    console.error('무형자산 상세 정보 조회 중 오류가 발생했습니다.', error)
  }
}

const resetAssetEditForm = () => {
  if (!isAssetEditDirty.value || isSavingAsset.value) return
  assetEditForm.value = { ...initialAssetEditForm.value }
  saveErrorMessage.value = ''
}

const handleUpdateAsset = async () => {
  if (!currentAsset.value || isSavingAsset.value || !isAssetEditDirty.value) return

  const assetId = getAssetId()
  if (!assetId) {
    console.error('무형자산 수정에 필요한 자산 UUID가 없습니다.', currentAsset.value)
    saveErrorMessage.value = '무형자산 수정에 필요한 자산 ID가 없습니다.'
    return
  }

  const seatCount = positiveNumberValue(assetEditForm.value.seatCount)
  if (!seatCount) {
    console.error('무형자산 수정에 필요한 최대 사용 가능 인원 수가 없습니다.', assetEditForm.value)
    saveErrorMessage.value = '최대 사용 가능 인원 수를 1 이상으로 입력해주세요.'
    return
  }

  if (seatCountValidationMessage.value) {
    console.error('무형자산 수정 불가 - 최대 사용 가능 인원 수가 현재 사용 중인 사용자 수보다 작습니다.', {
      seatCount,
      activeAssignmentCount: currentActiveAssignmentCount.value,
      activeAssignments: activeAssignments.value,
    })
    saveErrorMessage.value = seatCountValidationMessage.value
    return
  }

  const isAutoRenewal = autoRenewalValueByLabel[assetEditForm.value.isAutoRenewal]
  if (typeof isAutoRenewal !== 'boolean') {
    console.error('무형자산 수정에 필요한 자동 갱신 여부가 없습니다.', assetEditForm.value)
    saveErrorMessage.value = '자동 갱신 여부를 선택해주세요.'
    return
  }

  isSavingAsset.value = true
  saveErrorMessage.value = ''

  try {
    const payload = compactPayload({
      seatCount,
      isAutoRenewal,
      startedAt: toLocalDateTimeRequestValue(assetEditForm.value.startedAt),
      expiredAt: toLocalDateTimeRequestValue(assetEditForm.value.expiredAt),
    })

    console.log('무형자산 수정 요청 payload', payload)
    await intangibleAssetApi.update(assetId, payload)

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('무형자산 수정 실패', error)
    saveErrorMessage.value = error instanceof Error
      ? error.message
      : '무형자산 수정 중 오류가 발생했습니다.'
  } finally {
    isSavingAsset.value = false
  }
}

watch(() => props.asset, () => {
  if (!props.isOpen) return
  routeAsset.value = null
  activeAssignments.value = []
  syncAssetEditForm()
  void loadAssetDetail()
}, { deep: true, immediate: true })

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    syncAssetEditForm()
    saveErrorMessage.value = ''
    void loadAssetDetail()
    return
  }

  routeAsset.value = null
  activeAssignments.value = []
  assetEditForm.value = createEmptyAssetEditForm()
  initialAssetEditForm.value = createEmptyAssetEditForm()
  saveErrorMessage.value = ''
})

onMounted(() => {
  if (props.isOpen) {
    void loadAssetDetail()
  }
})
</script>
