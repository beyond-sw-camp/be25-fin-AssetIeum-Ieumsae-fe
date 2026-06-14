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
            <Dropdown v-model="assetEditForm.statusLabel" :options="statusOptions" />
          </FormField>
          <Input id="edit-licenseCode" v-model="assetEditForm.licenseCode" label="라이선스 번호" placeholder="라이선스 번호 입력" />
          <FormField label="결제 주기">
            <Dropdown v-model="assetEditForm.billingCycle" :options="billingCycleOptions" root-option="결제 주기 선택" />
          </FormField>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-bold text-text-main">
          사용 정보
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input id="edit-departmentName" v-model="assetEditForm.departmentName" label="부서" disabled />
          <Input id="edit-memberName" v-model="assetEditForm.memberName" label="사용자" disabled />
          <Input id="edit-seatCount" v-model="assetEditForm.seatCount" type="number" label="최대 사용 가능 인원 수" required />
          <FormField label="자동 갱신 여부" required>
            <Dropdown v-model="assetEditForm.isAutoRenewal" :options="autoRenewalOptions" />
          </FormField>
          <Input id="edit-startedAt" v-model="assetEditForm.startedAt" type="datetime-local" label="사용 시작 일시" required />
          <Input id="edit-expiredAt" v-model="assetEditForm.expiredAt" type="datetime-local" label="만료 일시" />
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
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { intangibleAssetApi } from '@/api/asset.api'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { BillingCycle, IntangibleAsset, IntangibleAssetStatus } from '@/types'

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
const currentAsset = computed(() => props.asset ?? routeAsset.value)

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

const toDateTimeInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`
  return value.slice(0, 16)
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

const getAssetId = () => (
  toUuidString(currentAsset.value?.assetId)
  || (typeof route.params.assetId === 'string' ? toUuidString(route.params.assetId) : '')
)

const toAssetEditForm = (asset: IntangibleAsset): AssetEditForm => {
  const displayMemberName = asset.assignedMemberName ?? ''

  return {
    assetItemName: asset.assetItemName ?? '-',
    assetCode: asset.assetCode ?? '-',
    statusLabel: statusLabel(asset.status ?? asset.intangibleAssetStatus),
    licenseCode: asset.licenseCode ?? asset.licenseKey ?? '-',
    seatCount: asset.seatCount !== undefined ? String(asset.seatCount) : '-',
    isAutoRenewal: asset.isAutoRenewal === undefined ? '' : asset.isAutoRenewal ? '자동 갱신' : '자동 갱신 안 함',
    billingCycle: billingCycleLabel(asset.billingCycle) || '-',
    departmentName: asset.departmentName ?? '-',
    memberName: displayMemberName || '-',
    startedAt: toDateTimeInputValue(asset.startedAt),
    expiredAt: toDateTimeInputValue(asset.expiredAt),
    purchaseDate: toDateTimeInputValue(asset.purchaseDate),
    purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : '-',
    purchaseVendor: asset.purchaseVendor ?? asset.vendor ?? '-',
  }
}

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

const resetAssetEditForm = () => {
  if (!isAssetEditDirty.value || isSavingAsset.value) return
  assetEditForm.value = { ...initialAssetEditForm.value }
}

const handleUpdateAsset = async () => {
  if (!currentAsset.value || isSavingAsset.value || !isAssetEditDirty.value) return

  const assetId = getAssetId()
  if (!assetId) {
    console.error('무형자산 수정에 필요한 자산 UUID가 없습니다.', currentAsset.value)
    return
  }

  if (!assetEditForm.value.startedAt.trim()) {
    console.error('무형자산 수정에 필요한 사용 시작 일시가 없습니다.', assetEditForm.value)
    return
  }

  const seatCount = positiveNumberValue(assetEditForm.value.seatCount)
  if (!seatCount) {
    console.error('무형자산 수정에 필요한 최대 사용 가능 인원 수가 없습니다.', assetEditForm.value)
    return
  }

  const isAutoRenewal = autoRenewalValueByLabel[assetEditForm.value.isAutoRenewal]
  if (isAutoRenewal === undefined) {
    console.error('무형자산 수정에 필요한 자동 갱신 여부가 없습니다.', assetEditForm.value)
    return
  }

  isSavingAsset.value = true

  try {
    await intangibleAssetApi.update(assetId, {
      intangibleAssetStatus: statusByLabel[assetEditForm.value.statusLabel] ?? currentAsset.value.status,
      seatCount,
      isAutoRenewal,
      startedAt: assetEditForm.value.startedAt.trim(),
      expiredAt: assetEditForm.value.expiredAt.trim(),
      licenseCode: assetEditForm.value.licenseCode.trim(),
      billingCycle: billingCycleValueByLabel[assetEditForm.value.billingCycle],
    })

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('무형자산 수정 실패', error)
  } finally {
    isSavingAsset.value = false
  }
}

const loadRouteAsset = async () => {
  const assetId = route.params.assetId
  if (props.asset || typeof assetId !== 'string' || !assetId) return

  try {
    const response = await intangibleAssetApi.getDetail(assetId)
    routeAsset.value = {
      ...response.data,
      assetId,
    }
    syncAssetEditForm()
  } catch (error) {
    console.error('무형자산 상세 조회 실패', error)
  }
}

watch(() => props.asset, () => {
  if (!props.isOpen) return
  routeAsset.value = null
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

onMounted(loadRouteAsset)
</script>
