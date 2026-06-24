<template>
  <BaseDrawer
    :is-open="isOpen"
    title="구매 계획 자산 등록"
    panel-class="w-full max-w-6xl"
    body-class="min-h-0 overflow-hidden! p-0"
    hide-footer
    @close="handleClose"
  >
    <div class="flex h-full flex-col">
      <div class="border-b border-border px-6 py-4">
        <p class="text-sm font-semibold text-primary">{{ assetTypeLabel }}</p>
        <h2 class="mt-1 text-lg font-bold text-text-main">
          {{ item?.itemName ?? '구매 품목' }}
        </h2>
        <p class="mt-1 text-sm text-text-sub">
          {{ item?.category || '-' }} · 납품 확인 후 개별 자산 등록
        </p>
      </div>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <section class="space-y-3">
          <SectionTitle title="구매 계획 및 등록 현황" />
          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryItem label="구매 계획 번호" :value="plan?.planNo ?? '-'" />
            <SummaryItem label="구매 수량" :value="`${purchaseQuantity}개`" />
            <SummaryItem label="자산 등록 진행률" :value="`${successCount} / ${purchaseQuantity}`" />
            <SummaryItem label="미등록 수량" :value="`${remainingCount}개`" />
            <SummaryItem label="요청자" :value="plan?.requesterName ?? '-'" />
            <SummaryItem label="요청 부서" :value="requestDepartmentName" />
            <SummaryItem label="납품 확인일" :value="formatDate(deliveryConfirmedAt)" />
            <SummaryItem label="실제 집행 금액" :value="actualExecutionAmountText" />
            <SummaryItem label="예상 단가" :value="formatCurrency(item?.estimatedUnitPrice ?? 0)" />
          </div>
          <p class="text-xs text-text-muted">
            각 자산 행에서 요청자 할당, 사용자 직접 선택, 미할당을 선택할 수 있습니다.
          </p>
        </section>

        <section class="space-y-4">
          <SectionTitle title="공통 정보" />
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              id="purchase-asset-date"
              v-model="commonForm.purchaseDate"
              type="date"
              label="구매일"
              required
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-price"
              v-model="commonForm.purchasePrice"
              type="number"
              label="구매 가격"
              required
              placeholder="0"
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-vendor"
              v-model="commonForm.purchaseVendor"
              label="구매처"
              required
              placeholder="구매처를 입력하세요"
              :disabled="isSubmitting"
            />
            <Input
              id="purchase-asset-department"
              :model-value="requestDepartmentName"
              label="사용 부서"
              disabled
            />

            <!-- 유형자산 전용 공통 필드 -->
            <template v-if="isTangible">
              <Input
                id="purchase-asset-warranty"
                v-model="tangibleForm.warrantyExpiredAt"
                type="date"
                label="보증 만료일"
                required
                :disabled="isSubmitting"
              />
              <Input
                id="purchase-asset-location"
                v-model="tangibleForm.location"
                label="사용 위치"
                required
                placeholder="본사 3층"
                :disabled="isSubmitting"
              />
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">사용 유형</label>
                <Dropdown
                  id="purchase-asset-usage-type"
                  :model-value="tangibleForm.usageType"
                  :options="TANGIBLE_USAGE_TYPE_OPTIONS"
                  :disabled="isSubmitting"
                  @update:model-value="(value) => tangibleForm.usageType = String(value)"
                />
              </div>
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">자산 사용 구분</label>
                <Dropdown
                  id="purchase-asset-usage-scope"
                  :model-value="tangibleForm.assetUsageType"
                  :options="TANGIBLE_ASSET_USAGE_TYPE_OPTIONS"
                  :disabled="isSubmitting"
                  @update:model-value="(value) => tangibleForm.assetUsageType = String(value)"
                />
              </div>
              <Input
                id="purchase-tangible-used-started-at"
                v-model="tangibleForm.usedStartedAt"
                type="date"
                label="사용 시작일"
                :disabled="isSubmitting"
              />
              <Input
                id="purchase-tangible-return-due-date"
                v-model="tangibleForm.returnDueDate"
                type="date"
                label="반납 예정일"
                :disabled="isSubmitting"
              />
            </template>

            <!-- 무형자산 전용 공통 필드 -->
            <template v-else>
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">라이선스 유형 <span class="text-danger">*</span></label>
                <Dropdown
                  id="purchase-intangible-license-type"
                  :model-value="intangibleForm.licenseType"
                  :options="LICENSE_TYPE_OPTIONS"
                  :disabled="isSubmitting"
                  @update:model-value="(value) => intangibleForm.licenseType = String(value) as 'SUBSCRIPTION' | 'PERPETUAL' | 'TERM'"
                />
              </div>
              <Input
                id="purchase-intangible-seat-count"
                v-model="intangibleForm.seatCount"
                type="number"
                label="좌석 수"
                required
                placeholder="1"
                :disabled="isSubmitting"
              />
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">과금 주기</label>
                <Dropdown
                  id="purchase-intangible-billing-cycle"
                  :model-value="intangibleForm.billingCycle ?? ''"
                  :options="BILLING_CYCLE_OPTIONS"
                  :disabled="isSubmitting"
                  @update:model-value="(value) => intangibleForm.billingCycle = value ? String(value) as 'MONTHLY' | 'YEARLY' | 'ONE_TIME' : null"
                />
              </div>
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">자동 갱신</label>
                <Dropdown
                  id="purchase-intangible-auto-renewal"
                  :model-value="intangibleForm.isAutoRenewal ? 'true' : 'false'"
                  :options="AUTO_RENEWAL_OPTIONS"
                  :disabled="isSubmitting"
                  @update:model-value="(value) => intangibleForm.isAutoRenewal = value === 'true'"
                />
              </div>
              <Input
                id="purchase-intangible-started-at"
                v-model="intangibleForm.startedAt"
                type="date"
                label="사용 시작일"
                :disabled="isSubmitting"
              />
              <Input
                id="purchase-intangible-expired-at"
                v-model="intangibleForm.expiredAt"
                type="date"
                label="만료일"
                :disabled="isSubmitting"
              />
            </template>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle :title="isTangible ? '자산별 고유정보' : '라이선스별 고유정보'" />
            <span class="text-xs font-semibold text-text-muted">
              각 행은 실제 자산 레코드 1개로 등록됩니다.
            </span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-border">
            <table class="min-w-[920px] w-full border-collapse text-sm">
              <thead class="bg-surface-secondary text-xs font-bold text-text-sub">
                <tr>
                  <th class="w-14 px-3 py-2 text-center">번호</th>
                  <th class="px-3 py-2 text-left">{{ isTangible ? '시리얼 번호' : '라이선스 코드' }}</th>
                  <th class="w-[180px] px-3 py-2 text-left">할당 방식</th>
                  <th class="w-[320px] px-3 py-2 text-left">할당 사용자</th>
                  <th class="w-[120px] px-3 py-2 text-center">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(row, index) in assetRows" :key="row.localId" class="bg-surface">
                  <td class="px-3 py-3 text-center font-semibold text-text-sub">
                    {{ index + 1 }}
                  </td>
                  <td class="px-3 py-3">
                    <input
                      v-model="row.uniqueCode"
                      :placeholder="isTangible ? 'SN-001' : 'LIC-001'"
                      :disabled="isSubmitting || row.status === 'success'"
                      class="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
                      @input="markRowEdited(row)"
                    />
                    <p v-if="row.errorMessage" class="mt-1 text-xs font-semibold text-danger">
                      {{ row.errorMessage }}
                    </p>
                  </td>
                  <td class="px-3 py-3">
                    <Dropdown
                      :id="`purchase-asset-assignment-${index}`"
                      :model-value="row.assignmentMethod"
                      :options="ASSIGNMENT_METHOD_OPTIONS"
                      :disabled="isSubmitting || row.status === 'success'"
                      menu-strategy="fixed"
                      @update:model-value="(value) => handleRowAssignmentMethodChange(row, value)"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <div v-if="row.assignmentMethod === 'REQUESTER'" class="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-main">
                      <div>{{ requesterLabel }}</div>
                      <p v-if="!isTangible" class="mt-1 text-xs font-semibold text-text-muted">
                        {{ selectedMemberCountLabel(row) }}
                      </p>
                    </div>
                    <Dropdown
                      v-else-if="isTangible"
                      :id="`purchase-asset-member-${index}`"
                      :model-value="row.memberId"
                      :options="memberOptions"
                      :disabled="isSubmitting || row.status === 'success' || row.assignmentMethod === 'UNASSIGNED'"
                      menu-strategy="fixed"
                      @update:model-value="(value) => handleRowMemberChange(row, value)"
                    />
                    <div v-else-if="row.assignmentMethod === 'UNASSIGNED'" class="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-muted">
                      미할당
                    </div>
                    <div v-else class="space-y-2">
                      <div class="max-h-32 overflow-y-auto rounded-xl border border-border bg-surface">
                        <label
                          v-for="member in assignableMembers"
                          :key="String(member.memberId)"
                          class="flex cursor-pointer items-center gap-2 border-b border-border/60 px-3 py-2 text-sm text-text-main last:border-b-0 hover:bg-surface-secondary"
                          :class="isIntangibleMemberOptionDisabled(row, member.memberId) && 'cursor-not-allowed opacity-50 hover:bg-surface'"
                        >
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                            :checked="isRowMemberSelected(row, member.memberId)"
                            :disabled="isSubmitting || row.status === 'success' || isIntangibleMemberOptionDisabled(row, member.memberId)"
                            @change="handleRowMemberToggle(row, member.memberId)"
                          />
                          <span class="min-w-0 flex-1 truncate">{{ memberLabel(member) }}</span>
                        </label>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          v-for="memberId in row.memberIds"
                          :key="memberId"
                          class="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                        >
                          <span class="truncate">{{ memberNameById(memberId) }}</span>
                          <button
                            type="button"
                            class="text-primary/70 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="isSubmitting || row.status === 'success'"
                            @click="handleRowMemberToggle(row, memberId)"
                          >
                            x
                          </button>
                        </span>
                        <span v-if="row.memberIds.length === 0" class="text-xs font-semibold text-text-muted">
                          사용자를 선택해주세요.
                        </span>
                      </div>
                      <p class="text-xs font-semibold text-text-muted">
                        {{ selectedMemberCountLabel(row) }}
                      </p>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span :class="rowStatusClass(row)">
                      {{ rowStatusLabel(row) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="errorMessage" class="rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            {{ errorMessage }}
          </p>
        </section>
      </div>

      <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-border px-6 py-4">
        <Button class="w-full" variant="outline" :disabled="isSubmitting" @click="handleClose">취소</Button>
        <Button class="w-full" :loading="isSubmitting" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitButtonText }}
        </Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'

import { ApiError, purchaseApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import SectionTitle from '@/components/purchase/PurchaseAssetRegisterSectionTitle.vue'
import type {
  AssetType,
  Department,
  DropdownOption,
  Member,
  PurchasePlanDetail,
  PurchasePlanIntangibleAssetRegisterRequest,
  PurchasePlanItem,
  PurchasePlanTangibleAssetRegisterRequest,
} from '@/types'

type RowStatus = 'idle' | 'ready' | 'error' | 'submitting' | 'success' | 'failed'
type AssignmentMethod = 'REQUESTER' | 'DIRECT' | 'UNASSIGNED'

const SummaryItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-xl border border-border bg-surface-secondary/40 px-4 py-3' }, [
      h('dt', { class: 'text-xs font-semibold text-text-muted' }, props.label),
      h('dd', { class: 'mt-1 text-sm font-bold text-text-main' }, props.value),
    ])
  },
})

interface AssetRegisterRow {
  localId: string
  uniqueCode: string
  assignmentMethod: AssignmentMethod
  memberId: string
  memberIds: string[]
  status: RowStatus
  errorMessage: string
}

interface Props {
  isOpen: boolean
  plan: PurchasePlanDetail | null
  item: PurchasePlanItem | null
  departments: Department[]
  members: Member[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  registered: [payload: { itemId: string | null, registeredCount: number }]
}>()

// ── 옵션 상수 ─────────────────────────────────────────────
const TANGIBLE_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: '임시', value: 'TEMPORARY' },
  { label: '영구', value: 'PERMANENT' },
]

const TANGIBLE_ASSET_USAGE_TYPE_OPTIONS: DropdownOption[] = [
  { label: '개인', value: 'PERSONAL' },
  { label: '부서 공용', value: 'DEPARTMENT' },
]

const LICENSE_TYPE_OPTIONS: DropdownOption[] = [
  { label: '구독형 (SUBSCRIPTION)', value: 'SUBSCRIPTION' },
  { label: '영구 (PERPETUAL)', value: 'PERPETUAL' },
  { label: '기간형 (TERM)', value: 'TERM' },
]

const BILLING_CYCLE_OPTIONS: DropdownOption[] = [
  { label: '선택 안 함', value: '' },
  { label: '월간', value: 'MONTHLY' },
  { label: '연간', value: 'YEARLY' },
  { label: '일회성', value: 'ONE_TIME' },
]

const AUTO_RENEWAL_OPTIONS: DropdownOption[] = [
  { label: '자동 갱신', value: 'true' },
  { label: '수동 갱신', value: 'false' },
]

const ASSIGNMENT_METHOD_OPTIONS: DropdownOption[] = [
  { label: '요청자에게 할당', value: 'REQUESTER' },
  { label: '사용자 직접 선택', value: 'DIRECT' },
  { label: '미할당', value: 'UNASSIGNED' },
]

// ── 상태 ──────────────────────────────────────────────────
const isSubmitting = ref(false)
const errorMessage = ref('')
const assetRows = ref<AssetRegisterRow[]>([])

/** 유형/무형 공통 */
const commonForm = reactive({
  purchaseDate: '',
  purchasePrice: '' as number | '',
  purchaseVendor: '',
})

/** 유형자산 전용 */
const tangibleForm = reactive({
  location: '',
  warrantyExpiredAt: '',
  usageType: 'TEMPORARY',
  assetUsageType: 'PERSONAL',
  usedStartedAt: '',
  returnDueDate: '',
})

/** 무형자산 전용 */
const intangibleForm = reactive({
  licenseType: 'SUBSCRIPTION' as 'SUBSCRIPTION' | 'PERPETUAL' | 'TERM',
  seatCount: 1 as number | '',
  isAutoRenewal: true,
  billingCycle: null as 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | null,
  startedAt: '',
  expiredAt: '',
})

// ── 계산 속성 ──────────────────────────────────────────────
const assetType = computed<AssetType>(() => (
  props.item?.assetType === 'INTANGIBLE' ? 'INTANGIBLE' : 'TANGIBLE'
))
const isTangible = computed(() => assetType.value === 'TANGIBLE')
const assetTypeLabel = computed(() => (isTangible.value ? '유형자산' : '무형자산'))
const purchaseQuantity = computed(() => Math.max(0, Number(props.item?.quantity ?? 0)))
const intangibleSeatCount = computed(() => Math.max(1, Number(intangibleForm.seatCount) || 1))
const successCount = computed(() => assetRows.value.filter((row) => row.status === 'success').length)
const remainingCount = computed(() => Math.max(0, purchaseQuantity.value - successCount.value))
const deliveryConfirmedAt = computed(() => (
  props.item?.receivedAt ?? props.plan?.receivedAt ?? props.plan?.deliveredAt ?? null
))
const actualExecutionAmount = computed(() => props.plan?.actualAmount ?? null)
const actualExecutionAmountText = computed(() => (
  actualExecutionAmount.value == null ? '-' : formatCurrency(actualExecutionAmount.value)
))
const defaultPurchasePrice = computed(() => {
  if (props.item?.actualUnitPrice != null) return props.item.actualUnitPrice
  if (props.item?.actualAmount != null && purchaseQuantity.value > 0) {
    return Math.round(props.item.actualAmount / purchaseQuantity.value)
  }
  if (
    actualExecutionAmount.value != null &&
    props.plan?.items.length === 1 &&
    purchaseQuantity.value > 0
  ) {
    return Math.round(actualExecutionAmount.value / purchaseQuantity.value)
  }
  return props.item?.estimatedUnitPrice ?? ''
})
const rowsToSubmit = computed(() => assetRows.value.filter((row) => row.status !== 'success'))
const canSubmit = computed(() => Boolean(props.item) && rowsToSubmit.value.length > 0 && !isSubmitting.value)
const submitButtonText = computed(() => (
  isSubmitting.value ? '등록 중' : `${rowsToSubmit.value.length}개 자산 등록`
))

const requester = computed(() => {
  const requesterId = props.plan?.requesterId
  if (requesterId === null || requesterId === undefined) return null
  return props.members.find((member) => String(member.memberId) === String(requesterId)) ?? null
})

const requestDepartmentId = computed(() => requester.value?.departmentId ?? '')
const requestDepartmentName = computed(() => requester.value?.departmentName ?? '-')
const requesterLabel = computed(() => (requester.value ? memberLabel(requester.value) : '요청자 확인 필요'))
const assignableMembers = computed(() => {
  const activeMembers = props.members.filter((member) => member.status === 'ACTIVE')
  if (!requestDepartmentId.value) return activeMembers
  return activeMembers.filter((member) => member.departmentId === requestDepartmentId.value)
})

const memberOptions = computed<DropdownOption[]>(() => [
  { label: '사용자 선택', value: '' },
  ...assignableMembers.value.map((member) => ({
    label: memberLabel(member),
    value: member.memberId,
  })),
])

// ── 워처 ──────────────────────────────────────────────────
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetForm()
})

watch(intangibleSeatCount, (seatCount) => {
  assetRows.value.forEach((row) => {
    if (row.memberIds.length <= seatCount) return
    row.memberIds = row.memberIds.slice(0, seatCount)
    row.memberId = row.memberIds[0] ?? ''
  })
})

// ── 폼 초기화 ──────────────────────────────────────────────
function resetForm() {
  errorMessage.value = ''
  const purchaseDate = toDateInputValue(deliveryConfirmedAt.value)

  // 공통
  commonForm.purchaseDate = purchaseDate
  commonForm.purchasePrice = defaultPurchasePrice.value
  commonForm.purchaseVendor = ''

  // 유형자산
  tangibleForm.location = ''
  tangibleForm.warrantyExpiredAt = ''
  tangibleForm.usageType = 'TEMPORARY'
  tangibleForm.assetUsageType = 'PERSONAL'
  tangibleForm.usedStartedAt = purchaseDate
  tangibleForm.returnDueDate = ''

  // 무형자산
  intangibleForm.licenseType = 'SUBSCRIPTION'
  intangibleForm.seatCount = 1
  intangibleForm.isAutoRenewal = true
  intangibleForm.billingCycle = null
  intangibleForm.startedAt = purchaseDate
  intangibleForm.expiredAt = ''

  assetRows.value = createRows(purchaseQuantity.value)
}

function createRows(count: number): AssetRegisterRow[] {
  return Array.from({ length: count }, (_, index) => ({
    localId: `purchase-asset-${Date.now()}-${index}`,
    uniqueCode: '',
    assignmentMethod: 'REQUESTER',
    memberId: '',
    memberIds: [],
    status: 'idle',
    errorMessage: '',
  }))
}

function markRowEdited(row: AssetRegisterRow) {
  if (row.status === 'success') return
  row.status = row.uniqueCode.trim() && !row.errorMessage ? 'ready' : 'idle'
  row.errorMessage = ''
}

function handleRowAssignmentMethodChange(row: AssetRegisterRow, value: string | number) {
  row.assignmentMethod = toAssignmentMethod(value)
  row.memberId = ''
  row.memberIds = []
  if (row.status !== 'success') {
    row.status = row.uniqueCode.trim() ? 'ready' : 'idle'
    row.errorMessage = ''
  }
}

function handleRowMemberChange(row: AssetRegisterRow, value: string | number) {
  row.memberId = String(value)
  row.memberIds = row.memberId ? [row.memberId] : []
  if (row.status !== 'success') {
    row.status = row.uniqueCode.trim() ? 'ready' : 'idle'
    row.errorMessage = ''
  }
}

function handleRowMemberToggle(row: AssetRegisterRow, memberId: string | number) {
  const normalizedMemberId = String(memberId)
  if (row.status === 'success') return

  if (row.memberIds.includes(normalizedMemberId)) {
    row.memberIds = row.memberIds.filter((selectedMemberId) => selectedMemberId !== normalizedMemberId)
  } else if (row.memberIds.length < intangibleSeatCount.value) {
    row.memberIds = [...row.memberIds, normalizedMemberId]
  }

  row.memberId = row.memberIds[0] ?? ''
  row.status = row.uniqueCode.trim() ? 'ready' : 'idle'
  row.errorMessage = ''
}

// ── 유효성 검사 ────────────────────────────────────────────
function validateCommonFields() {
  if (!props.plan?.planId) return '자산을 등록할 구매 계획을 확인할 수 없습니다.'
  if (!props.item) return '자산을 등록할 구매 품목을 확인할 수 없습니다.'
  if (!String(commonForm.purchaseDate).trim()) return '구매일을 입력해주세요.'
  if (commonForm.purchasePrice === '' || Number(commonForm.purchasePrice) <= 0) {
    return '구매 금액을 입력해주세요.'
  }
  if (!String(commonForm.purchaseVendor).trim()) return '구매처를 입력해주세요.'

  if (isTangible.value) {
    if (!String(tangibleForm.location).trim()) return '위치를 입력해주세요.'
    if (!String(tangibleForm.warrantyExpiredAt).trim()) return '보증 만료일을 입력해주세요.'
  } else {
    if (!intangibleForm.licenseType) return '라이선스 유형을 선택해주세요.'
    if (intangibleForm.seatCount === '' || Number(intangibleForm.seatCount) < 1) {
      return '좌석 수를 1 이상으로 입력해주세요.'
    }
  }

  return ''
}

function validateRows() {
  const duplicateCodes = findDuplicateCodes(rowsToSubmit.value)
  let hasError = false

  rowsToSubmit.value.forEach((row) => {
    const code = row.uniqueCode.trim()
    row.errorMessage = ''

    if (!code) {
      row.status = 'error'
      row.errorMessage = isTangible.value
        ? '시리얼 번호를 입력해주세요.'
        : '라이선스 코드를 입력해주세요.'
      hasError = true
      return
    }

    if (code && duplicateCodes.has(code)) {
      row.status = 'error'
      row.errorMessage = isTangible.value
        ? '중복된 시리얼 번호입니다.'
        : '중복된 라이선스 코드입니다.'
      hasError = true
      return
    }

    const assignmentError = validateRowAssignment(row)
    if (assignmentError) {
      row.status = 'error'
      row.errorMessage = assignmentError
      hasError = true
      return
    }

    row.status = 'ready'
  })

  return !hasError
}

function validateRowAssignment(row: AssetRegisterRow) {
  if (row.assignmentMethod === 'DIRECT' && !isTangible.value) {
    if (row.memberIds.length === 0) return '할당 사용자를 1명 이상 선택해주세요.'
    if (row.memberIds.length > intangibleSeatCount.value) {
      return `선택한 사용자가 좌석 수(${intangibleSeatCount.value}명)를 초과했습니다.`
    }
    if (row.memberIds.some((memberId) => !isAssignableMemberId(memberId))) {
      return '현재 회사 또는 요청 부서에 속한 사용자만 선택할 수 있습니다.'
    }
    return ''
  }

  if (row.assignmentMethod === 'REQUESTER') {
    if (!requester.value?.memberId) return '요청자 ID를 확인할 수 없습니다.'
    if (!isAssignableMemberId(requester.value.memberId)) return '요청자를 현재 선택 가능한 사용자 목록에서 확인할 수 없습니다.'
    return ''
  }

  if (row.assignmentMethod === 'DIRECT') {
    if (!row.memberId) return '할당 사용자를 선택해주세요.'
    if (!isAssignableMemberId(row.memberId)) return '현재 회사 또는 요청 부서에 속한 사용자만 선택할 수 있습니다.'
  }

  return ''
}

function findDuplicateCodes(rows: AssetRegisterRow[]) {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    const code = row.uniqueCode.trim()
    if (!code) return
    counts.set(code, (counts.get(code) ?? 0) + 1)
  })

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([code]) => code),
  )
}

// ── 제출 ──────────────────────────────────────────────────
async function handleSubmit() {
  errorMessage.value = ''
  const commonError = validateCommonFields()
  if (commonError) {
    errorMessage.value = commonError
    return
  }

  if (!validateRows()) {
    errorMessage.value = '자산별 고유정보를 확인해주세요.'
    return
  }

  const planId = props.plan?.planId
  const itemId = getPurchasePlanItemId(props.item)
  if (!planId) return

  const submittedCount = rowsToSubmit.value.length
  isSubmitting.value = true
  try {
    await submitPurchasePlanAssets(planId, itemId)
    rowsToSubmit.value.forEach((row) => {
      row.status = 'success'
      row.errorMessage = ''
    })
    emit('registered', {
      itemId,
      registeredCount: submittedCount,
    })
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '자산 등록에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

async function submitPurchasePlanAssets(planId: number | string, itemId: number | string | null) {
  rowsToSubmit.value.forEach((row) => {
    row.status = 'submitting'
    row.errorMessage = ''
  })

  let body: PurchasePlanTangibleAssetRegisterRequest | PurchasePlanIntangibleAssetRegisterRequest

  if (isTangible.value) {
    const { serialNumbers, memberIds } = toTangibleAssetRowsPayload(rowsToSubmit.value)
    body = {
      serialNumbers,
      memberIds,
      location: tangibleForm.location,
      purchaseDate: toLocalDateTime(commonForm.purchaseDate),
      purchasePrice: Number(commonForm.purchasePrice),
      purchaseVendor: commonForm.purchaseVendor,
      warrantyExpiredAt: toLocalDateTime(tangibleForm.warrantyExpiredAt),
      usageType: tangibleForm.usageType as 'TEMPORARY' | 'PERMANENT',
      assetUsageType: tangibleForm.assetUsageType,
      departmentId: requestDepartmentId.value || null,
      usedStartedAt: tangibleForm.usedStartedAt ? toLocalDateTime(tangibleForm.usedStartedAt) : null,
      returnDueDate: tangibleForm.returnDueDate ? toLocalDateTime(tangibleForm.returnDueDate) : null,
    } satisfies PurchasePlanTangibleAssetRegisterRequest
  } else {
    const { licenseCodes, memberIds } = toIntangibleAssetRowsPayload(rowsToSubmit.value)
    body = {
      licenseCodes,
      memberIds,
      purchaseDate: toLocalDateTime(commonForm.purchaseDate),
      purchasePrice: Number(commonForm.purchasePrice),
      purchaseVendor: commonForm.purchaseVendor,
      licenseType: intangibleForm.licenseType,
      seatCount: Number(intangibleForm.seatCount) || 1,
      isAutoRenewal: intangibleForm.isAutoRenewal,
      billingCycle: intangibleForm.billingCycle || null,
      startedAt: intangibleForm.startedAt ? toLocalDateTime(intangibleForm.startedAt) : null,
      expiredAt: intangibleForm.expiredAt ? toLocalDateTime(intangibleForm.expiredAt) : null,
      departmentId: requestDepartmentId.value || null,
    } satisfies PurchasePlanIntangibleAssetRegisterRequest
  }

  try {
    await purchaseApi.registerAssets(planId, itemId, body)
  } catch (error) {
    rowsToSubmit.value.forEach((row) => {
      row.status = 'failed'
      row.errorMessage = getErrorMessage(error, '자산 등록에 실패했습니다.')
    })
    throw error
  }
}

// ── 유틸 ──────────────────────────────────────────────────
function toTangibleAssetRowsPayload(rows: AssetRegisterRow[]) {
  return {
    serialNumbers: rows.map((row) => row.uniqueCode.trim()),
    memberIds: rows.map(resolveAssignedMemberId),
  }
}

function toIntangibleAssetRowsPayload(rows: AssetRegisterRow[]) {
  return {
    licenseCodes: rows.map((row) => row.uniqueCode.trim()),
    memberIds: rows.map(resolveAssignedMemberIds),
  }
}

function resolveAssignedMemberId(row: AssetRegisterRow) {
  if (row.assignmentMethod === 'UNASSIGNED') return null
  if (row.assignmentMethod === 'REQUESTER') return requester.value?.memberId ?? null
  return row.memberId || null
}

function resolveAssignedMemberIds(row: AssetRegisterRow) {
  if (row.assignmentMethod === 'UNASSIGNED') return []
  if (row.assignmentMethod === 'REQUESTER') {
    return requester.value?.memberId ? [String(requester.value.memberId)] : []
  }
  return row.memberIds.filter(Boolean)
}

function toAssignmentMethod(value: string | number): AssignmentMethod {
  if (value === 'DIRECT') return 'DIRECT'
  if (value === 'UNASSIGNED') return 'UNASSIGNED'
  return 'REQUESTER'
}

function isAssignableMemberId(memberId: string | number) {
  return assignableMembers.value.some((member) => String(member.memberId) === String(memberId))
}

function isRowMemberSelected(row: AssetRegisterRow, memberId: string | number) {
  return row.memberIds.includes(String(memberId))
}

function isIntangibleMemberOptionDisabled(row: AssetRegisterRow, memberId: string | number) {
  return !isRowMemberSelected(row, memberId) && row.memberIds.length >= intangibleSeatCount.value
}

function selectedMemberCountLabel(row: AssetRegisterRow) {
  const selectedCount = row.assignmentMethod === 'REQUESTER' && requester.value?.memberId
    ? 1
    : row.memberIds.length
  return `${selectedCount} / ${intangibleSeatCount.value}명`
}

function memberNameById(memberId: string | number) {
  const member = props.members.find((item) => String(item.memberId) === String(memberId))
  return member ? memberLabel(member) : String(memberId)
}

function memberLabel(member: Member) {
  return `${member.name} / ${member.memberNo} / ${member.departmentName}`
}

function getPurchasePlanItemId(item: PurchasePlanItem | null) {
  if (!item) return null
  const itemId =
    item.itemId
    ?? item.purchasePlanItemId
    ?? item.purchaseItemId
    ?? item.planItemId
    ?? item.purchaseRequestItemId
    ?? item.id
    ?? item.assetItemId
    ?? item.tangibleItemId
    ?? item.intangibleItemId
  if (itemId === null || itemId === undefined) return null
  const normalized = String(itemId).trim()
  return normalized || null
}

function rowStatusLabel(row: AssetRegisterRow) {
  if (row.status === 'ready') return '입력 완료'
  if (row.status === 'error') return '검증 오류'
  if (row.status === 'submitting') return '등록 중'
  if (row.status === 'success') return '등록 성공'
  if (row.status === 'failed') return '등록 실패'
  return '입력 전'
}

function rowStatusClass(row: AssetRegisterRow) {
  return [
    'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
    row.status === 'success' && 'bg-success/10 text-success',
    row.status === 'failed' || row.status === 'error' ? 'bg-danger/10 text-danger' : '',
    row.status === 'submitting' && 'bg-primary/10 text-primary',
    row.status === 'ready' && 'bg-warning/10 text-warning',
    row.status === 'idle' && 'bg-surface-secondary text-text-muted',
  ]
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

function toLocalDateTime(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
</script>
