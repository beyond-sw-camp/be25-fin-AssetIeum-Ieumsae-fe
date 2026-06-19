<template>
  <BaseDrawer
    :is-open="isOpen"
    title="구매 계획 자산 등록"
    panel-class="w-full max-w-2xl"
    body-class="min-h-0 overflow-hidden! p-0"
    hide-footer
    @close="handleClose"
  >
    <div class="flex h-full flex-col">
      <div class="border-b border-border px-6 py-4">
        <p class="text-sm font-semibold text-primary">
          {{ assetTypeLabel }}
        </p>
        <h2 class="mt-1 text-lg font-bold text-text-main">
          {{ item?.itemName ?? '구매 품목' }}
        </h2>
        <p class="mt-1 text-sm text-text-sub">
          {{ item?.category || '-' }} · 납품 확인 후 등록
        </p>
      </div>

      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section class="space-y-4">
          <SectionTitle title="구매 정보" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="purchase-asset-date"
              v-model="form.purchaseDate"
              type="date"
              label="구매일"
              required
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-price"
              v-model="form.purchasePrice"
              type="number"
              label="구매 금액"
              required
              placeholder="0"
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-vendor"
              v-model="form.purchaseVendor"
              label="구매처"
              required
              placeholder="구매처를 입력하세요"
              :disabled="isSubmitting"
            />
            <Input
              v-if="isTangible"
              id="purchase-asset-warranty"
              v-model="form.warrantyExpiredAt"
              type="date"
              label="보증 만료일"
              required
              :disabled="isSubmitting"
            />
          </div>
        </section>

        <section v-if="isTangible" class="space-y-4">
          <SectionTitle title="유형자산 정보" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="purchase-asset-serial-number"
              v-model="form.serialNumber"
              label="시리얼 번호"
              required
              placeholder="SN-20260101-001"
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-location"
              v-model="form.location"
              label="위치"
              required
              placeholder="본사 3층"
              :disabled="isSubmitting"
            />
            <div class="space-y-2">
              <label class="block px-0.5 text-sm font-semibold text-text-main">사용 유형</label>
              <Dropdown
                id="purchase-asset-usage-type"
                :model-value="form.usageType"
                :options="TANGIBLE_USAGE_TYPE_OPTIONS"
                :disabled="isSubmitting"
                @update:model-value="(value) => form.usageType = String(value)"
              />
            </div>
            <div class="space-y-2">
              <label class="block px-0.5 text-sm font-semibold text-text-main">자산 사용 구분</label>
              <Dropdown
                id="purchase-asset-usage-scope"
                :model-value="form.assetUsageType"
                :options="TANGIBLE_ASSET_USAGE_TYPE_OPTIONS"
                :disabled="isSubmitting"
                @update:model-value="(value) => form.assetUsageType = String(value)"
              />
            </div>
          </div>
        </section>

        <section v-else class="space-y-4">
          <SectionTitle title="무형자산 정보" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="purchase-intangible-seat-count"
              v-model="form.seatCount"
              type="number"
              label="최대 사용 인원"
              required
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-intangible-license-code"
              v-model="form.licenseCode"
              label="라이선스 코드"
              placeholder="선택 입력"
              :disabled="isSubmitting"
            />
            <div class="space-y-2">
              <label class="block px-0.5 text-sm font-semibold text-text-main">자동 갱신</label>
              <Dropdown
                id="purchase-intangible-auto-renewal"
                :model-value="form.isAutoRenewal"
                :options="AUTO_RENEWAL_OPTIONS"
                :disabled="isSubmitting"
                @update:model-value="(value) => form.isAutoRenewal = Number(value)"
              />
            </div>
            <div class="space-y-2">
              <label class="block px-0.5 text-sm font-semibold text-text-main">결제 주기</label>
              <Dropdown
                id="purchase-intangible-billing-cycle"
                :model-value="form.billingCycle"
                :options="BILLING_CYCLE_OPTIONS"
                :disabled="isSubmitting"
                @update:model-value="(value) => form.billingCycle = String(value)"
              />
            </div>
            <Input
              id="purchase-intangible-started-at"
              v-model="form.startedAt"
              type="date"
              label="사용 시작일"
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-intangible-expired-at"
              v-model="form.expiredAt"
              type="date"
              label="만료 예정일"
              :disabled="isSubmitting"
            />
          </div>
        </section>

        <section class="space-y-4">
          <SectionTitle title="할당 정보" optional />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm font-semibold text-text-main">
              사용자
              <select
                v-model="form.memberId"
                :disabled="isSubmitting"
                class="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
              >
                <option value="">할당하지 않음</option>
                <option v-for="member in members" :key="member.memberId" :value="member.memberId">
                  {{ member.name }} ({{ member.memberNo }})
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-2 text-sm font-semibold text-text-main">
              부서
              <select
                v-model="form.departmentId"
                :disabled="isSubmitting"
                class="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
              >
                <option value="">선택 안 함</option>
                <option v-for="department in departments" :key="department.departmentId" :value="department.departmentId">
                  {{ department.name }}
                </option>
              </select>
            </label>

            <Input
              v-if="isTangible"
              id="purchase-tangible-used-started-at"
              v-model="form.usedStartedAt"
              type="date"
              label="사용 시작일"
              :disabled="isSubmitting || !form.memberId"
            />
            <Input
              v-if="isTangible"
              id="purchase-tangible-return-due-date"
              v-model="form.returnDueDate"
              type="date"
              label="반납 예정일"
              :disabled="isSubmitting || !form.memberId"
            />
          </div>
        </section>

        <p v-if="errorMessage" class="rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
          {{ errorMessage }}
        </p>
      </div>

      <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-border px-6 py-4">
        <Button class="w-full" variant="outline" :disabled="isSubmitting" @click="handleClose">취소</Button>
        <Button class="w-full" :loading="isSubmitting" @click="handleSubmit">등록</Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { ApiError, intangibleAssetApi, tangibleAssetApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import SectionTitle from '@/components/purchase/PurchaseAssetRegisterSectionTitle.vue'
import type {
  AssetType,
  BillingCycle,
  Department,
  DropdownOption,
  IntangibleAsset,
  IntangibleAssetCreateRequest,
  Member,
  PurchasePlanItem,
  TangibleAsset,
  TangibleAssetCreateRequest,
} from '@/types'

const TANGIBLE_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: '임시', value: 'TEMPORARY' },
  { label: '영구', value: 'PERMANENT' },
]

const TANGIBLE_ASSET_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: '개인', value: 'PERSONAL' },
  { label: '부서 공용', value: 'DEPARTMENT' },
]

const AUTO_RENEWAL_OPTIONS: DropdownOption[] = [
  { label: '자동 갱신', value: 1 },
  { label: '수동 갱신', value: 0 },
]

const BILLING_CYCLE_OPTIONS: DropdownOption[] = [
  { label: '월별', value: 'MONTHLY' },
  { label: '연별', value: 'YEARLY' },
  { label: '일회성', value: 'ONE_TIME' },
]

interface Props {
  isOpen: boolean
  item: PurchasePlanItem | null
  departments: Department[]
  members: Member[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  registered: []
}>()

const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  serialNumber: '',
  location: '',
  purchaseDate: '',
  purchasePrice: '' as number | '',
  purchaseVendor: '',
  warrantyExpiredAt: '',
  usageType: 'TEMPORARY',
  assetUsageType: 'PERSONAL',
  memberId: '',
  departmentId: '',
  usedStartedAt: '',
  returnDueDate: '',
  seatCount: 1 as number | '',
  isAutoRenewal: 0,
  billingCycle: 'YEARLY',
  licenseCode: '',
  startedAt: '',
  expiredAt: '',
})

const isTangible = computed(() => assetType.value === 'TANGIBLE')
const assetType = computed<AssetType>(() => (
  props.item?.assetType === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE'
))
const assetTypeLabel = computed(() => (isTangible.value ? '유형자산' : '무형자산'))

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetForm()
})

function resetForm() {
  errorMessage.value = ''
  const purchaseDate = toDateInputValue(props.item?.receivedAt)

  form.serialNumber = ''
  form.location = ''
  form.purchaseDate = purchaseDate
  form.purchasePrice = props.item?.estimatedUnitPrice ?? ''
  form.purchaseVendor = ''
  form.warrantyExpiredAt = ''
  form.usageType = 'TEMPORARY'
  form.assetUsageType = 'PERSONAL'
  form.memberId = ''
  form.departmentId = ''
  form.usedStartedAt = purchaseDate
  form.returnDueDate = ''
  form.seatCount = 1
  form.isAutoRenewal = 0
  form.billingCycle = 'YEARLY'
  form.licenseCode = ''
  form.startedAt = purchaseDate
  form.expiredAt = ''
}

function getPurchasePlanAssetItemId(item: PurchasePlanItem | null) {
  if (!item) return null
  const assetItemId = item.assetItemId ?? item.tangibleItemId ?? item.intangibleItemId
  if (assetItemId !== null && assetItemId !== undefined && String(assetItemId).trim()) {
    return assetItemId.toString()
  }

  // TODO: API 명세/백엔드 확인 필요 - 구매 계획 품목의 실제 자산 품목 ID가 응답에 포함되어야 한다.
  const fallbackId = item.itemId ?? item.ticketId ?? item.itemName
  return `purchase-plan-item-${String(fallbackId).replaceAll(/\s+/g, '-')}`
}

function getCreatedTangibleAssetId(asset: TangibleAsset) {
  return asset.assetId ?? asset.tangibleAssetId ?? asset.id ?? null
}

function getCreatedIntangibleAssetId(asset: IntangibleAsset) {
  const created = asset as IntangibleAsset & { intangibleAssetId?: string | number }
  return created.assetId ?? created.intangibleAssetId ?? null
}

function validateRequired(value: string | number, message: string) {
  if (String(value).trim()) return false
  errorMessage.value = message
  return true
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!props.item) {
    errorMessage.value = '자산을 등록할 구매 품목을 확인할 수 없습니다.'
    return
  }

  const assetItemId = getPurchasePlanAssetItemId(props.item)
  if (!assetItemId) {
    errorMessage.value = '자산 등록에 필요한 자산 품목 ID가 없습니다. TODO: API 명세/백엔드 확인 필요'
    return
  }

  if (validateRequired(form.purchaseDate, '구매일을 입력해주세요.')) return
  if (form.purchasePrice === '' || Number(form.purchasePrice) <= 0) {
    errorMessage.value = '구매 금액을 입력해주세요.'
    return
  }
  if (validateRequired(form.purchaseVendor, '구매처를 입력해주세요.')) return

  if (isTangible.value) {
    await submitTangibleAsset(assetItemId)
    return
  }

  await submitIntangibleAsset(assetItemId)
}

async function submitTangibleAsset(assetItemId: string) {
  if (validateRequired(form.serialNumber, '시리얼 번호를 입력해주세요.')) return
  if (validateRequired(form.location, '위치를 입력해주세요.')) return
  if (validateRequired(form.warrantyExpiredAt, '보증 만료일을 입력해주세요.')) return

  const body: TangibleAssetCreateRequest = {
    tangibleItemId: assetItemId,
    serialNumber: form.serialNumber,
    location: form.location,
    purchaseDate: form.purchaseDate,
    purchasePrice: Number(form.purchasePrice),
    purchaseVendor: form.purchaseVendor,
    warrantyExpiredAt: form.warrantyExpiredAt,
    usageType: form.usageType as 'TEMPORARY' | 'PERMANENT',
    assetUsageType: form.assetUsageType,
    tangibleAssetStatus: 'AVAILABLE',
    departmentId: form.departmentId || null,
  }

  isSubmitting.value = true
  try {
    const response = await tangibleAssetApi.create(body)

    if (form.memberId) {
      const assetId = getCreatedTangibleAssetId(response.data)
      if (!assetId) {
        throw new Error('생성된 유형자산 ID를 응답에서 확인할 수 없어 할당을 진행할 수 없습니다.')
      }

      await tangibleAssetApi.assign(assetId.toString(), {
        memberId: form.memberId,
        usageType: form.usageType,
        assetUsageType: form.assetUsageType,
        endedAt: form.returnDueDate || null,
      })
    }

    emit('registered')
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '유형자산 등록에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function submitIntangibleAsset(assetItemId: string) {
  if (form.seatCount === '' || Number(form.seatCount) <= 0) {
    errorMessage.value = '최대 사용 인원을 입력해주세요.'
    return
  }

  const body: IntangibleAssetCreateRequest = {
    intangibleItemId: assetItemId,
    seatCount: Number(form.seatCount),
    isAutoRenewal: form.isAutoRenewal === 1,
    purchaseDate: form.purchaseDate,
    purchasePrice: Number(form.purchasePrice),
    purchaseVendor: form.purchaseVendor,
    billingCycle: form.billingCycle as BillingCycle,
    licenseCode: form.licenseCode || undefined,
    startedAt: form.startedAt || null,
    expiredAt: form.expiredAt || null,
    intangibleAssetStatus: 'AVAILABLE',
  }

  isSubmitting.value = true
  try {
    const response = await intangibleAssetApi.create(body)

    if (form.memberId) {
      const assetId = getCreatedIntangibleAssetId(response.data)
      if (!assetId) {
        throw new Error('생성된 무형자산 ID를 응답에서 확인할 수 없어 할당을 진행할 수 없습니다.')
      }

      await intangibleAssetApi.assign(assetId.toString(), {
        memberId: form.memberId,
        endedAt: form.expiredAt || null,
      })
    }

    emit('registered')
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '무형자산 등록에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (isSubmitting.value) return
  emit('close')
}

function toDateInputValue(value?: string | null) {
  const source = value ? new Date(value) : new Date()
  if (Number.isNaN(source.getTime())) return ''

  const yyyy = source.getFullYear()
  const mm = String(source.getMonth() + 1).padStart(2, '0')
  const dd = String(source.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

</script>
