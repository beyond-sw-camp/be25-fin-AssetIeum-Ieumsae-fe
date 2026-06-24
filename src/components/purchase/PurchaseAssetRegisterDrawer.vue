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
          {{ item?.category || item?.categoryName || '-' }} · 납품 확인 후 자산 등록
        </p>
      </div>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
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

            <template v-else>
              <div class="space-y-2">
                <label class="block px-0.5 text-sm font-semibold text-text-main">
                  라이선스 유형 <span class="text-danger">*</span>
                </label>
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
            <table class="min-w-[960px] w-full border-collapse text-sm">
              <thead class="bg-surface-secondary text-xs font-bold text-text-sub">
                <tr>
                  <th class="w-14 px-3 py-2 text-center">번호</th>
                  <th class="px-3 py-2 text-left">
                    {{ isTangible ? '시리얼 번호' : '라이선스 코드' }}
                  </th>
                  <th class="w-[190px] px-3 py-2 text-left">할당 방식</th>
                  <th class="w-[480px] px-3 py-2 text-left">할당 사용자</th>
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
                    <div class="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-secondary p-1">
                      <button
                        v-for="option in ASSIGNMENT_METHOD_OPTIONS"
                        :key="String(option.value)"
                        type="button"
                        class="h-8 rounded-lg px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                        :class="row.assignmentMethod === option.value
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-sub hover:bg-surface'"
                        :disabled="isSubmitting || row.status === 'success'"
                        @click="handleRowAssignmentMethodChange(row, option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </td>
                  <td class="px-3 py-3">
                    <div
                      v-if="row.assignmentMethod === 'UNASSIGNED'"
                      class="rounded-xl border border-dashed border-border bg-surface-secondary px-3 py-2 text-sm font-semibold text-text-muted"
                    >
                      미할당으로 등록됩니다.
                    </div>
                    <div v-else class="space-y-2">
                      <div
                        v-if="assignmentCandidateMembers.length"
                        class="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-border bg-surface-secondary/40 p-2"
                      >
                        <button
                          v-for="member in assignmentCandidateMembers"
                          :key="member.memberId"
                          type="button"
                          class="flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition disabled:cursor-not-allowed"
                          :class="[
                            isRowMemberSelected(row, member.memberId)
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-border bg-surface text-text-main hover:border-primary/50 hover:bg-white',
                            isMemberOptionDisabled(row, member.memberId)
                              ? 'opacity-50 hover:border-border hover:bg-surface'
                              : ''
                          ]"
                          :disabled="isSubmitting || row.status === 'success' || isMemberOptionDisabled(row, member.memberId)"
                          @click="handleCandidateMemberSelect(row, member.memberId)"
                        >
                          <span
                            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black"
                            :class="isRowMemberSelected(row, member.memberId)
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-surface text-transparent'"
                          >
                            ✓
                          </span>
                          <span class="flex min-w-0 flex-1 items-center gap-2 text-sm">
                            <span class="shrink-0 font-bold">{{ member.name }}</span>
                            <span class="truncate text-xs font-semibold text-text-muted">
                              {{ member.memberNo || '-' }}
                              <span class="mx-1 text-border">|</span>
                              {{ member.departmentName || '-' }}
                            </span>
                          </span>
                        </button>
                      </div>
                      <p v-else class="rounded-xl border border-dashed border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-muted">
                        선택 가능한 자산 할당자가 없습니다.
                      </p>
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
                            @click="handleCandidateMemberSelect(row, memberId)"
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
        <Button class="w-full" variant="outline" :disabled="isSubmitting" @click="handleClose">
          취소
        </Button>
        <Button class="w-full" :loading="isSubmitting" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitButtonText }}
        </Button>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

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
type AssignmentMethod = 'DIRECT' | 'UNASSIGNED'

interface AssetRegisterRow {
  localId: string
  uniqueCode: string
  assignmentMethod: AssignmentMethod
  memberId: string
  memberIds: string[]
  status: RowStatus
  errorMessage: string
}

interface AssignmentCandidateMember {
  memberId: string
  memberNo: string | null
  name: string
  departmentId: string | null
  departmentName: string | null
}

interface AssignmentTargetRecord {
  targetId?: string | null
  memberId?: string | null
  assigneeId?: string | null
  targetMemberId?: string | null
  name?: string | null
  departmentId?: string | null
  departmentName?: string | null
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
  { label: '직접 선택', value: 'DIRECT' },
  { label: '미할당', value: 'UNASSIGNED' },
]

const isSubmitting = ref(false)
const errorMessage = ref('')
const assetRows = ref<AssetRegisterRow[]>([])

const commonForm = reactive({
  purchaseDate: '',
  purchasePrice: '' as number | '',
  purchaseVendor: '',
})

const tangibleForm = reactive({
  location: '',
  warrantyExpiredAt: '',
  usageType: 'TEMPORARY',
  assetUsageType: 'PERSONAL',
  usedStartedAt: '',
  returnDueDate: '',
})

const intangibleForm = reactive({
  licenseType: 'SUBSCRIPTION' as 'SUBSCRIPTION' | 'PERPETUAL' | 'TERM',
  seatCount: 1 as number | '',
  isAutoRenewal: true,
  billingCycle: null as 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | null,
  startedAt: '',
  expiredAt: '',
})

const assetType = computed<AssetType | null>(() => resolvePurchaseItemAssetType(props.item))
const isTangible = computed(() => assetType.value === 'TANGIBLE')
const assetTypeLabel = computed(() => {
  if (assetType.value === 'TANGIBLE') return '유형자산'
  if (assetType.value === 'INTANGIBLE') return '무형자산'
  return '자산 유형 확인 필요'
})
const purchaseQuantity = computed(() => Math.max(0, Number(props.item?.quantity ?? 0)))
const intangibleSeatCount = computed(() => Math.max(1, Number(intangibleForm.seatCount) || 1))
const deliveryConfirmedAt = computed(() => (
  props.item?.receivedAt ?? props.plan?.receivedAt ?? props.plan?.deliveredAt ?? null
))
const actualExecutionAmount = computed(() => props.plan?.actualAmount ?? null)
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
  const requesterId = props.item?.ticketRequesterId ?? props.item?.requesterId ?? props.plan?.requesterId
  if (requesterId === null || requesterId === undefined) return null
  return props.members.find((member) => String(member.memberId) === String(requesterId)) ?? null
})
const requestDepartmentId = computed(() => (
  props.item?.ticketDepartmentId ?? props.item?.departmentId ?? requester.value?.departmentId ?? ''
))
const requestDepartmentName = computed(() => (
  props.item?.ticketDepartmentName ?? props.item?.departmentName ?? requester.value?.departmentName ?? '-'
))
const assignableMembers = computed(() => {
  const activeMembers = props.members.filter((member) => !member.status || member.status === 'ACTIVE')
  const requestDeptId = toNullableStringId(requestDepartmentId.value)
  if (!requestDeptId) return []
  return activeMembers.filter((member) => toNullableStringId(member.departmentId) === requestDeptId)
})
const ticketAssignmentTargetIds = computed(() => extractAssignmentTargetMemberIds(props.item))
const assignmentCandidateMembers = computed<AssignmentCandidateMember[]>(() => {
  const ticketTargetMembers = ticketAssignmentTargetIds.value.map((memberId) => {
    const member = props.members.find((item) => String(item.memberId) === memberId)
    if (member) return toAssignmentCandidateMember(member)
    const target = findAssignmentTargetInfo(props.item, memberId)
    return {
      memberId,
      memberNo: null,
      name: target?.name || memberId,
      departmentId: target?.departmentId ?? null,
      departmentName: target?.departmentName ?? null,
    }
  })

  const candidateMembers = ticketTargetMembers.length > 0
    ? ticketTargetMembers
    : assignableMembers.value.map(toAssignmentCandidateMember)

  return uniqueAssignmentCandidates(candidateMembers)
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetForm()
})

watch(assignmentCandidateMembers, () => {
  if (!props.isOpen) return
  applyDefaultAssignments()
})

watch(intangibleSeatCount, (seatCount) => {
  assetRows.value.forEach((row) => {
    if (row.memberIds.length <= seatCount) return
    row.memberIds = row.memberIds.slice(0, seatCount)
    row.memberId = row.memberIds[0] ?? ''
  })
})

function resetForm() {
  errorMessage.value = ''
  const purchaseDate = toDateInputValue(deliveryConfirmedAt.value)

  commonForm.purchaseDate = purchaseDate
  commonForm.purchasePrice = defaultPurchasePrice.value
  commonForm.purchaseVendor = ''

  tangibleForm.location = ''
  tangibleForm.warrantyExpiredAt = ''
  tangibleForm.usageType = 'TEMPORARY'
  tangibleForm.assetUsageType = 'PERSONAL'
  tangibleForm.usedStartedAt = purchaseDate
  tangibleForm.returnDueDate = ''

  intangibleForm.licenseType = 'SUBSCRIPTION'
  intangibleForm.seatCount = 1
  intangibleForm.isAutoRenewal = true
  intangibleForm.billingCycle = null
  intangibleForm.startedAt = purchaseDate
  intangibleForm.expiredAt = ''

  assetRows.value = createRows(purchaseQuantity.value)
  applyDefaultAssignments()
}

function createRows(count: number): AssetRegisterRow[] {
  return Array.from({ length: count }, (_, index) => ({
    localId: `purchase-asset-${Date.now()}-${index}`,
    uniqueCode: '',
    assignmentMethod: 'DIRECT',
    memberId: '',
    memberIds: [],
    status: 'idle',
    errorMessage: '',
  }))
}

function applyDefaultAssignments() {
  const defaultMemberIds = ticketAssignmentTargetIds.value.filter(isAssignableMemberId)
  if (!defaultMemberIds.length) return

  assetRows.value.forEach((row, index) => {
    if (row.assignmentMethod !== 'DIRECT' || row.memberIds.length > 0 || row.status === 'success') return

    if (isTangible.value) {
      const memberId = defaultMemberIds[index] ?? defaultMemberIds[0]
      row.memberId = memberId
      row.memberIds = [memberId]
      return
    }

    row.memberIds = defaultMemberIds.slice(0, intangibleSeatCount.value)
    row.memberId = row.memberIds[0] ?? ''
  })
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

function handleCandidateMemberSelect(row: AssetRegisterRow, memberId: string | number) {
  const normalizedMemberId = String(memberId)
  if (row.status === 'success') return

  if (isTangible.value) {
    row.memberId = row.memberId === normalizedMemberId ? '' : normalizedMemberId
    row.memberIds = row.memberId ? [row.memberId] : []
    row.status = row.uniqueCode.trim() ? 'ready' : 'idle'
    row.errorMessage = ''
    return
  }

  if (row.memberIds.includes(normalizedMemberId)) {
    row.memberIds = row.memberIds.filter((selectedMemberId) => selectedMemberId !== normalizedMemberId)
  } else if (row.memberIds.length < intangibleSeatCount.value) {
    row.memberIds = [...row.memberIds, normalizedMemberId]
  }

  row.memberId = row.memberIds[0] ?? ''
  row.status = row.uniqueCode.trim() ? 'ready' : 'idle'
  row.errorMessage = ''
}

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
  if (row.assignmentMethod === 'UNASSIGNED') return ''
  if (!assignmentCandidateMembers.value.length) return '선택 가능한 자산 할당자가 없습니다.'

  if (isTangible.value) {
    if (!row.memberId) return '할당 사용자를 선택해주세요.'
    if (!isAssignableMemberId(row.memberId)) return '티켓의 자산 할당자 목록에서 사용자를 선택해주세요.'
    return ''
  }

  if (row.memberIds.length === 0) return '할당 사용자를 1명 이상 선택해주세요.'
  if (row.memberIds.length > intangibleSeatCount.value) {
    return `선택한 사용자가 좌석 수 ${intangibleSeatCount.value}명을 초과했습니다.`
  }
  if (row.memberIds.some((memberId) => !isAssignableMemberId(memberId))) {
    return '티켓의 자산 할당자 목록에서 사용자를 선택해주세요.'
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
  if (!planId) {
    errorMessage.value = '구매계획 정보를 확인할 수 없습니다.'
    return
  }
  if (!itemId) {
    errorMessage.value = '구매계획 품목 ID를 확인할 수 없습니다.'
    return
  }
  if (!assetType.value) {
    errorMessage.value = '자산 유형을 확인할 수 없어 등록 엔드포인트를 결정할 수 없습니다.'
    return
  }

  const submittedCount = rowsToSubmit.value.length
  isSubmitting.value = true
  try {
    await submitPurchasePlanAssets(planId, itemId, assetType.value)
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

async function submitPurchasePlanAssets(
  planId: number | string,
  itemId: number | string,
  resolvedAssetType: AssetType,
) {
  rowsToSubmit.value.forEach((row) => {
    row.status = 'submitting'
    row.errorMessage = ''
  })

  let body: PurchasePlanTangibleAssetRegisterRequest | PurchasePlanIntangibleAssetRegisterRequest

  if (resolvedAssetType === 'TANGIBLE') {
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
      departmentId: toNullableStringId(requestDepartmentId.value),
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
      seatCount: Number(intangibleForm.seatCount) || 1,
      isAutoRenewal: intangibleForm.isAutoRenewal,
      billingCycle: intangibleForm.billingCycle || null,
      startedAt: intangibleForm.startedAt ? toLocalDateTime(intangibleForm.startedAt) : null,
      expiredAt: intangibleForm.expiredAt ? toLocalDateTime(intangibleForm.expiredAt) : null,
      departmentId: toNullableStringId(requestDepartmentId.value),
    } satisfies PurchasePlanIntangibleAssetRegisterRequest
  }

  try {
    await purchaseApi.registerAssets(planId, itemId, resolvedAssetType, body)
  } catch (error) {
    rowsToSubmit.value.forEach((row) => {
      row.status = 'failed'
      row.errorMessage = getErrorMessage(error, '자산 등록에 실패했습니다.')
    })
    throw error
  }
}

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
  return row.memberId || null
}

function resolveAssignedMemberIds(row: AssetRegisterRow) {
  if (row.assignmentMethod === 'UNASSIGNED') return []
  return row.memberIds.filter(Boolean)
}

function toAssignmentMethod(value: string | number): AssignmentMethod {
  return value === 'UNASSIGNED' ? 'UNASSIGNED' : 'DIRECT'
}

function isAssignableMemberId(memberId: string | number) {
  return assignmentCandidateMembers.value.some((member) => String(member.memberId) === String(memberId))
}

function isRowMemberSelected(row: AssetRegisterRow, memberId: string | number) {
  return row.memberIds.includes(String(memberId))
}

function isMemberOptionDisabled(row: AssetRegisterRow, memberId: string | number) {
  return !isTangible.value
    && !isRowMemberSelected(row, memberId)
    && row.memberIds.length >= intangibleSeatCount.value
}

function selectedMemberCountLabel(row: AssetRegisterRow) {
  const selectedCount = isTangible.value ? (row.memberId ? 1 : 0) : row.memberIds.length
  return isTangible.value ? `${selectedCount} / 1명` : `${selectedCount} / ${intangibleSeatCount.value}명`
}

function memberNameById(memberId: string | number) {
  const member = assignmentCandidateMembers.value.find((item) => String(item.memberId) === String(memberId))
  return member ? assignmentCandidateLabel(member) : String(memberId)
}

function assignmentCandidateLabel(member: AssignmentCandidateMember) {
  return [member.name, member.memberNo, member.departmentName]
    .filter((value) => value !== null && value !== undefined && String(value).trim())
    .join(' / ')
}

function toAssignmentCandidateMember(member: Member): AssignmentCandidateMember {
  return {
    memberId: String(member.memberId),
    memberNo: member.memberNo ?? null,
    name: member.name || String(member.memberId),
    departmentId: toNullableStringId(member.departmentId),
    departmentName: member.departmentName || null,
  }
}

function uniqueAssignmentCandidates(members: AssignmentCandidateMember[]) {
  const memberMap = new Map<string, AssignmentCandidateMember>()
  members.forEach((member) => {
    if (!member.memberId || memberMap.has(member.memberId)) return
    memberMap.set(member.memberId, member)
  })
  return Array.from(memberMap.values())
}

function extractAssignmentTargetMemberIds(item: PurchasePlanItem | null) {
  if (!item) return []
  const rawItem = item as PurchasePlanItem & Record<string, unknown>
  return uniqueStringValues([
    ...(Array.isArray(item.assignmentTargetMemberIds) ? item.assignmentTargetMemberIds : []),
    ...(Array.isArray(item.assigneeIds) ? item.assigneeIds : []),
    ...(Array.isArray(rawItem.assignment_target_member_ids) ? rawItem.assignment_target_member_ids : []),
    ...(Array.isArray(rawItem.assignee_ids) ? rawItem.assignee_ids : []),
    rawItem.assignmentTargetMemberId,
    rawItem.assignment_target_member_id,
    rawItem.assigneeId,
    rawItem.assignee_id,
    rawItem.targetMemberId,
    rawItem.target_member_id,
    ...extractAssignmentTargetRecords(item).flatMap((target) => [
      target.memberId,
      target.assigneeId,
      target.targetMemberId,
      target.targetId,
    ]),
  ])
}

function findAssignmentTargetInfo(item: PurchasePlanItem | null, memberId: string) {
  return extractAssignmentTargetRecords(item).find((target) => (
    [target.memberId, target.assigneeId, target.targetMemberId, target.targetId]
      .some((value) => toNullableStringId(value) === memberId)
  ))
}

function extractAssignmentTargetRecords(item: PurchasePlanItem | null): AssignmentTargetRecord[] {
  if (!item) return []
  const rawItem = item as PurchasePlanItem & Record<string, unknown>
  const source =
    item.assignmentTargets
    ?? rawItem.assignment_targets
    ?? rawItem.targetMembers
    ?? rawItem.target_members
    ?? []
  if (!Array.isArray(source)) return []

  return source.flatMap<AssignmentTargetRecord>((target) => {
    if (target === null || target === undefined) return []
    if (typeof target !== 'object') {
      const memberId = toNullableStringId(target)
      return memberId ? [{ memberId, name: memberId }] : []
    }

    const record = target as Record<string, unknown>
    return [{
      targetId: toNullableStringId(record.targetId ?? record.id),
      memberId: toNullableStringId(record.memberId ?? record.member_id),
      assigneeId: toNullableStringId(record.assigneeId ?? record.assignee_id),
      targetMemberId: toNullableStringId(record.targetMemberId ?? record.target_member_id),
      name: String(record.name ?? record.memberName ?? record.assigneeName ?? record.targetName ?? '').trim() || null,
      departmentId: toNullableStringId(record.departmentId ?? record.department_id),
      departmentName: String(record.departmentName ?? record.department_name ?? '').trim() || null,
    }]
  })
}

function uniqueStringValues(values: unknown[]) {
  return Array.from(new Set(
    values
      .map((value) => toNullableStringId(value))
      .filter((value): value is string => Boolean(value)),
  ))
}

function resolvePurchaseItemAssetType(item: PurchasePlanItem | null): AssetType | null {
  if (!item) return null
  const rawItem = item as PurchasePlanItem & Record<string, unknown>
  const rawAssetType =
    item.assetType
    ?? rawItem.asset_type
    ?? rawItem.assetItemType
    ?? rawItem.asset_item_type
    ?? rawItem.type
  if (rawAssetType === 'TANGIBLE' || rawAssetType === 'INTANGIBLE') {
    return rawAssetType
  }
  if (
    item.intangibleItemId
    || item.intangibleAssetItemId
    || rawItem.intangible_asset_item_id
    || rawItem.intangible_item_id
  ) return 'INTANGIBLE'
  if (
    item.tangibleItemId
    || item.tangibleAssetItemId
    || rawItem.tangible_asset_item_id
    || rawItem.tangible_item_id
  ) return 'TANGIBLE'
  return null
}

function toNullableStringId(value: unknown) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function getPurchasePlanItemId(item: PurchasePlanItem | null) {
  if (!item) return null
  const rawItem = item as PurchasePlanItem & Record<string, unknown>
  const itemId =
    item.itemId
    ?? item.purchasePlanItemId
    ?? item.purchasePlanItemDetailId
    ?? item.purchasePlanItemDetailID
    ?? item.purchase_plan_item_detail_id
    ?? item.purchasePlanItemDetail_id
    ?? item.purchasePlanItemID
    ?? item.purchase_plan_item_id
    ?? item.purchasePlanItem_id
    ?? item.purchaseItemId
    ?? item.purchase_item_id
    ?? item.planItemId
    ?? item.plan_item_id
    ?? item.purchaseRequestItemId
    ?? item.purchase_request_item_id
    ?? item.planPurchaseItemId
    ?? item.plan_purchase_item_id
    ?? item.purchasePlanItemNo
    ?? item.itemNo
    ?? rawItem.purchasePlanDetailItemId
    ?? rawItem.purchase_plan_detail_item_id
    ?? rawItem.purchasePlanItemDetailNo
    ?? rawItem.purchase_plan_item_detail_no
    ?? item.id
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
  return '입력 대기'
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
</script>
