<template>
  <form class="flex h-full flex-col" @submit.prevent="handleSubmit">
    <div class="flex-1 space-y-7 overflow-y-auto px-8 py-8">
      <div class="space-y-2">
        <label class="flex items-center gap-0.5 text-sm font-bold text-text-main" for="hr-event-member">
          임직원 선택
          <span class="text-primary">*</span>
        </label>
        <Dropdown
          id="hr-event-member"
          v-model="form.memberId"
          :options="memberOptions"
          root-option="임직원 선택"
          menu-strategy="fixed"
          :disabled="isLoadingMembers"
        >
        </Dropdown>
        <p
          v-if="!isLoadingMembers && memberOptions.length === 0"
          class="px-0.5 text-xs font-medium text-text-muted"
        >
          선택 가능한 같은 부서 임직원이 없습니다.
        </p>
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-0.5 text-sm font-bold text-text-main" for="hr-event-type">
          이벤트 유형
          <span class="text-primary">*</span>
        </label>
        <Dropdown
          id="hr-event-type"
          v-model="form.eventType"
          :options="eventTypeOptions"
          root-option="선택하세요"
          menu-strategy="fixed"
        />
      </div>

      <div v-if="form.eventType === 'DEPARTMENT_TRANSFER'" class="space-y-2">
        <label class="flex items-center gap-0.5 text-sm font-bold text-text-main" for="hr-event-target-department">
          이동 부서
          <span class="text-primary">*</span>
        </label>
        <DepartmentTreeSelect
          v-model="form.targetDepartmentId"
          :departments="departments ?? []"
          placeholder="이동할 부서를 선택하세요"
          :expand-all-on-open="false"
          keep-open-on-parent-select
        />
      </div>

      <div v-if="form.eventType === 'ONBOARDING'" class="space-y-3">
        <div>
          <p class="text-sm font-bold text-text-main">입사 자산 요청</p>
          <p class="mt-1 text-xs text-text-sub">입사일 배치에서 아래 템플릿 기준으로 자산 요청 티켓이 자동 생성됩니다.</p>
        </div>
        <div
          v-if="!template?.items?.length"
          class="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm text-primary"
        >
          {{ EMPTY_ASSET_MESSAGE }}
        </div>
        <ul v-else class="divide-y divide-border rounded-lg border border-border bg-surface">
          <li
            v-for="item in template.items"
            :key="String(item.hrTemplateItemId)"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-text-main">{{ item.productName }}</p>
              <p class="mt-1 text-xs text-text-sub">{{ assetTypeLabel(item.assetType) }}</p>
            </div>
            <span class="text-sm font-bold text-primary">{{ item.quantity }}개</span>
          </li>
        </ul>
      </div>

      <div v-if="requiresAssetTargets" class="space-y-3">
        <div>
          <p class="text-sm font-bold text-text-main">자산 처리 대상</p>
          <p class="mt-1 text-xs text-text-sub">대상자가 사용 중인 자산별 처리 방법을 선택합니다.</p>
        </div>
        <div v-if="isLoadingAssets" class="rounded-lg border border-border px-4 py-8 text-center text-sm text-text-muted">
          배정 자산을 불러오는 중입니다.
        </div>
        <div v-else-if="assetTargets.length === 0" class="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm text-primary">
          {{ EMPTY_ASSET_MESSAGE }}
        </div>
        <template v-else>
          <article
            v-for="target in assetTargets"
            :key="`${target.assetType}-${target.assetId}`"
            class="rounded-lg border border-border bg-surface p-4"
          >
            <div class="flex items-start gap-3">
              <input
                v-model="target.isSelected"
                type="checkbox"
                class="mt-1 h-4 w-4 accent-primary"
                :aria-label="`${target.productName} 처리 대상 선택`"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-text-main">{{ target.productName }}</p>
                <p class="mt-1 text-xs text-text-sub">{{ target.assetCode }} · {{ assetTypeLabel(target.assetType) }}</p>
              </div>
            </div>
            <div v-if="target.isSelected" class="mt-3 space-y-3 pl-7">
              <Dropdown v-model="target.actionType" :options="actionTypeOptions" menu-strategy="fixed" />
              <Dropdown
                v-if="target.actionType === 'TRANSFER_REQUIRED'"
                v-model="target.transferMemberId"
                :options="transferMemberOptions"
                root-option="전달받을 사원을 선택하세요"
                menu-strategy="fixed"
              />
            </div>
          </article>
        </template>
      </div>

      <Input
        id="hr-event-date"
        v-model="form.eventDate"
        type="date"
        label="이벤트 예정일"
        required
      />

      <p
        v-if="errorMessage || assetErrorMessage"
        class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ errorMessage || assetErrorMessage }}
      </p>
    </div>

    <div class="shrink-0 px-8 py-6">
      <Button
        class="w-full"
        size="m"
        type="submit"
        :disabled="!isCreateReady || isCreating"
        :loading="isCreating"
      >
        등록
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { intangibleAssetApi, tangibleAssetApi } from '@/api/asset.api'
import Button from '@/components/common/Button.vue'
import DepartmentTreeSelect from '@/components/common/DepartmentTreeSelect.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { useAuthStore } from '@/stores'
import type { Department, DropdownOption, IntangibleAsset, Member, TangibleAsset } from '@/types'
import type {
  HrEventAssetActionType,
  HrEventAssetTargetCreateRequest,
  HrEventAssetType,
  HrEventType,
  HrTemplateResponse,
} from '@/types/hr'

export interface HrEventRegisterSubmitPayload {
  memberId: string
  eventType: HrEventType
  eventDate: string
  targetDepartmentId: string | null
  assetTargets: HrEventAssetTargetCreateRequest[] | null
}

interface AssetTargetDraft {
  assetType: HrEventAssetType
  assetId: string
  assetCode: string
  productName: string
  isSelected: boolean
  actionType: HrEventAssetActionType
  transferMemberId: string
}

interface IntangibleAssetAliases {
  intangibleAssetId?: string | null
  productName?: string | null
  itemName?: string | null
}

interface MemberAliasRecord {
  id?: string | number | null
  memberId?: string | number | null
  departmentId?: string | number | null
  departmentName?: string | null
  departmentNamePath?: string | null
  department?: {
    departmentId?: string | number | null
    id?: string | number | null
    name?: string | null
    departmentName?: string | null
    departmentNamePath?: string | null
  } | null
}

const EVENT_TYPE_LABEL: Record<HrEventType, string> = {
  ONBOARDING: '입사',
  OFFBOARDING: '퇴사',
  DEPARTMENT_TRANSFER: '부서 이동',
}
const EMPTY_ASSET_MESSAGE = '대상 자산이 없습니다.'

const props = defineProps<{
  members: Member[]
  departments?: Department[]
  template?: HrTemplateResponse | null
  isLoadingMembers?: boolean
  isCreating?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: [payload: HrEventRegisterSubmitPayload]
}>()

const authStore = useAuthStore()
const form = reactive<{
  memberId: string
  eventType: '' | HrEventType
  eventDate: string
  targetDepartmentId: string
}>({
  memberId: '',
  eventType: '',
  eventDate: '',
  targetDepartmentId: '',
})
const assetTargets = ref<AssetTargetDraft[]>([])
const isLoadingAssets = ref(false)
const assetErrorMessage = ref('')

const currentDepartmentId = computed(() => getMemberDepartmentId(authStore.user as MemberAliasRecord | null))
const currentDepartmentName = computed(() => getMemberDepartmentName(authStore.user as MemberAliasRecord | null))
const currentDepartmentPath = computed(() => getMemberDepartmentPath(authStore.user as MemberAliasRecord | null))
const departmentScopedMembers = computed(() => props.members.filter(isSameDepartmentMember))
const memberOptions = computed<DropdownOption[]>(() => departmentScopedMembers.value.map((member) => ({
  label: `${member.memberNo} · ${member.name}`,
  value: member.memberId,
})))

const eventTypeOptions = computed<DropdownOption[]>(() => (
  Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ label, value }))
))

const selectedMember = computed(() => departmentScopedMembers.value.find((member) => member.memberId === form.memberId))
const requiresAssetTargets = computed(() => (
  form.eventType === 'OFFBOARDING' || form.eventType === 'DEPARTMENT_TRANSFER'
))
const transferMemberOptions = computed<DropdownOption[]>(() => departmentScopedMembers.value
  .filter((member) => (
    member.memberId !== form.memberId
    && getMemberDepartmentId(member as MemberAliasRecord) === getMemberDepartmentId(selectedMember.value as MemberAliasRecord | undefined)
  ))
  .map((member) => ({ label: `${member.memberNo} · ${member.name}`, value: member.memberId })))
const actionTypeOptions = computed<DropdownOption[]>(() => {
  const options: DropdownOption[] = [
    { label: '반납 요청 생성', value: 'RETURN_REQUIRED' },
    { label: '다른 사용자에게 전달', value: 'TRANSFER_REQUIRED' },
  ]
  if (form.eventType === 'DEPARTMENT_TRANSFER') {
    options.push({ label: '동일 사용자 유지', value: 'KEEP' })
  }
  return options
})

const isCreateReady = computed(() => Boolean(
  form.memberId
  && form.eventType
  && form.eventDate
  && (form.eventType !== 'ONBOARDING' || Boolean(props.template?.items?.length))
  && (form.eventType !== 'DEPARTMENT_TRANSFER' || (
    form.targetDepartmentId
    && form.targetDepartmentId !== selectedMember.value?.departmentId
  ))
  && (!requiresAssetTargets.value || (
    assetTargets.value.some((target) => target.isSelected)
    && assetTargets.value.filter((target) => target.isSelected).every((target) => target.assetId)
    && assetTargets.value
      .filter((target) => target.isSelected && target.actionType === 'TRANSFER_REQUIRED')
      .every((target) => target.transferMemberId)
  ))
))

watch(
  () => [form.memberId, form.eventType] as const,
  ([memberId, eventType]) => {
    form.targetDepartmentId = ''
    assetErrorMessage.value = ''
    if (!memberId || (eventType !== 'OFFBOARDING' && eventType !== 'DEPARTMENT_TRANSFER')) {
      assetTargets.value = []
      return
    }
    void loadAssignedAssets(memberId, eventType)
  },
)

watch(
  departmentScopedMembers,
  (members) => {
    if (form.memberId && !members.some((member) => member.memberId === form.memberId)) {
      form.memberId = ''
      assetTargets.value = []
      assetErrorMessage.value = ''
    }
  },
)

function resetForm() {
  form.memberId = ''
  form.eventType = ''
  form.eventDate = ''
  form.targetDepartmentId = ''
  assetTargets.value = []
  assetErrorMessage.value = ''
}

function handleSubmit() {
  if (!isCreateReady.value || !form.eventType || props.isCreating) return

  assetErrorMessage.value = ''

  emit('submit', {
    memberId: String(form.memberId),
    eventType: form.eventType,
    eventDate: form.eventDate,
    targetDepartmentId: form.targetDepartmentId || null,
    assetTargets: requiresAssetTargets.value
      ? assetTargets.value.filter((target) => target.isSelected).map(toCreateTarget)
      : null,
  })
}

async function loadAssignedAssets(memberId: string, eventType: HrEventType) {
  isLoadingAssets.value = true
  assetTargets.value = []

  try {
    const [tangibleResponse, intangibleResponse] = await Promise.all([
      tangibleAssetApi.getList({ page: 0, size: 1000, currentUserId: memberId }),
      intangibleAssetApi.getList({ page: 0, size: 1000, currentUserId: memberId }),
    ])
    const defaultAction: HrEventAssetActionType = eventType === 'DEPARTMENT_TRANSFER'
      ? 'KEEP'
      : 'RETURN_REQUIRED'

    assetTargets.value = [
      ...tangibleResponse.data.content
        .filter(isInUseAsset)
        .map((asset) => toTangibleDraft(asset, defaultAction)),
      ...intangibleResponse.data.content
        .filter(isInUseAsset)
        .map((asset) => toIntangibleDraft(asset, defaultAction)),
    ]
  } catch (error) {
    console.error('HR 이벤트 대상 자산 조회 실패', error)
    assetErrorMessage.value = '대상자에게 배정된 자산을 불러오지 못했습니다.'
  } finally {
    isLoadingAssets.value = false
  }
}

function tangibleAssetId(asset: TangibleAsset) {
  return String(asset.assetId ?? asset.tangibleAssetId ?? asset.id ?? '')
}

function toTangibleDraft(asset: TangibleAsset, actionType: HrEventAssetActionType): AssetTargetDraft {
  return {
    assetType: 'TANGIBLE',
    assetId: tangibleAssetId(asset),
    assetCode: asset.assetCode,
    productName: asset.productName ?? asset.assetItemName ?? asset.assetCode,
    isSelected: true,
    actionType,
    transferMemberId: '',
  }
}

function toIntangibleDraft(asset: IntangibleAsset, actionType: HrEventAssetActionType): AssetTargetDraft {
  const aliases = asset as IntangibleAsset & IntangibleAssetAliases

  return {
    assetType: 'INTANGIBLE',
    assetId: String(asset.assetId ?? aliases.intangibleAssetId ?? ''),
    assetCode: asset.assetCode,
    productName: firstText(
      aliases.productName,
      asset.assetItemName,
      aliases.itemName,
      asset.assetCode,
    ),
    isSelected: true,
    actionType,
    transferMemberId: '',
  }
}

function toCreateTarget(target: AssetTargetDraft): HrEventAssetTargetCreateRequest {
  return {
    assetType: target.assetType,
    assetId: target.assetId,
    actionType: target.actionType,
    transferMemberId: target.actionType === 'TRANSFER_REQUIRED' ? target.transferMemberId : null,
  }
}

function assetTypeLabel(assetType: HrEventAssetType) {
  return assetType === 'TANGIBLE' ? '유형자산' : '무형자산'
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => (
    typeof value === 'string' && value.trim().length > 0
  ))?.trim() ?? '-'
}

function assetStatusValue(asset: TangibleAsset | IntangibleAsset) {
  const record = asset as unknown as Record<string, unknown>
  return firstText(
    record.status as string | null | undefined,
    record.tangibleAssetStatus as string | null | undefined,
    record.tangibleAssetstatus as string | null | undefined,
    record.intangibleAssetStatus as string | null | undefined,
    record.assetStatus as string | null | undefined,
  )
}

function isInUseAsset(asset: TangibleAsset | IntangibleAsset) {
  const normalizedStatus = assetStatusValue(asset)
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
    .toUpperCase()

  return normalizedStatus === 'IN_USE'
    || normalizedStatus === 'INUSE'
    || normalizedStatus === 'USED'
    || normalizedStatus === 'ASSIGNED'
    || normalizedStatus === '사용중'
    || normalizedStatus === '사용_중'
}

function normalizeId(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function getMemberDepartmentId(member: MemberAliasRecord | null | undefined) {
  return normalizeId(
    member?.departmentId
    ?? member?.department?.departmentId
    ?? member?.department?.id,
  )
}

function getMemberDepartmentName(member: MemberAliasRecord | null | undefined) {
  return normalizeText(
    member?.departmentName
    ?? member?.department?.departmentName
    ?? member?.department?.name,
  )
}

function getMemberDepartmentPath(member: MemberAliasRecord | null | undefined) {
  return normalizeText(
    member?.departmentNamePath
    ?? member?.department?.departmentNamePath
    ?? getMemberDepartmentName(member),
  )
}

function isSameDepartmentMember(member: Member) {
  const memberRecord = member as MemberAliasRecord
  const memberDepartmentId = getMemberDepartmentId(memberRecord)
  if (currentDepartmentId.value && memberDepartmentId) {
    return memberDepartmentId === currentDepartmentId.value
  }

  const memberDepartmentName = getMemberDepartmentName(memberRecord)
  if (currentDepartmentName.value && memberDepartmentName) {
    return memberDepartmentName === currentDepartmentName.value
  }

  const memberDepartmentPath = getMemberDepartmentPath(memberRecord)
  if (currentDepartmentName.value && memberDepartmentPath) {
    return memberDepartmentPath
      .split('>')
      .map((part) => part.trim())
      .includes(currentDepartmentName.value)
  }

  if (currentDepartmentPath.value && memberDepartmentPath) {
    return memberDepartmentPath === currentDepartmentPath.value
  }

  return false
}

defineExpose({
  resetForm,
})
</script>
