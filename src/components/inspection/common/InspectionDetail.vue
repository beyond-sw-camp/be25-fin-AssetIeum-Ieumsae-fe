<template>
  <BaseDrawer
    :is-open="isOpen"
    title="전수조사 상세"
    body-class="p-0"
    hide-footer
    @close="emit('close')"
  >
    <div v-if="inspection" class="flex h-full flex-col">
      <div class="border-b border-border px-8 py-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="text-xs font-bold text-primary">조사 대상</p>
            <h3 class="mt-2 text-xl font-bold text-text-main">
              {{ displayTargetName }}
            </h3>
            <p class="mt-2 text-sm text-text-sub">
              {{ inspection.description || '설명이 없습니다.' }}
            </p>
          </div>
          <span :class="statusBadgeClass(displayStatus)">
            {{ statusLabel[displayStatus] }}
          </span>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-4">
          <div
            v-for="tile in summaryTiles"
            :key="tile.label"
            class="rounded-lg border border-border bg-surface p-4"
          >
            <p class="text-xs font-semibold text-text-muted">
              {{ tile.label }}
            </p>
            <p class="mt-2 text-lg font-bold text-text-main">
              {{ tile.value }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex border-b border-border px-8">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
            activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-text-sub hover:text-text-main',
          ]"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <section v-if="activeTab === 'overview'" class="space-y-5">
          <div class="grid gap-3 md:grid-cols-2">
            <div
              v-for="item in overviewItems"
              :key="item.label"
              class="rounded-lg border border-border bg-surface p-4"
            >
              <p class="text-xs font-semibold text-text-muted">
                {{ item.label }}
              </p>
              <p class="mt-2 text-sm font-bold text-text-main">
                {{ item.value }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border border-border bg-surface p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-text-main">진행 현황</p>
                <p class="mt-1 text-xs text-text-sub">응답 결과 기준으로 자동 집계됩니다.</p>
              </div>
              <Button size="sm" variant="secondary" :disabled="isLoading" @click="loadDetailData">
                새로고침
              </Button>
            </div>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${completionRate}%` }"
              />
            </div>
            <p class="mt-2 text-xs font-semibold text-text-sub">
              응답률 {{ completionRate }}%
            </p>
          </div>
        </section>

        <section v-else-if="activeTab === 'results'" class="space-y-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-bold text-text-main">전수조사 결과</p>
              <p class="mt-1 text-xs text-text-sub">전수조사 응답이 수집되면 결과가 표시됩니다.</p>
            </div>
            <Dropdown
              v-model="resultFilter"
              :options="resultFilterOptions"
              class="w-40"
              menu-align="right"
            />
          </div>

          <Table
            :columns="resultColumns"
            :rows="filteredResultRows"
            row-key="inspectionResultId"
            :loading="isLoading"
            empty-text="전수조사 결과가 없습니다."
          >
            <template #cell-followUpRequired="{ value: followUpRequired }">
              <span :class="followUpRequired ? 'badge-warning' : 'badge-success'">
                {{ followUpRequired ? '필요' : '불필요' }}
              </span>
            </template>
          </Table>
        </section>

        <section v-else-if="activeTab === 'uninspected'" class="space-y-4">
          <div>
            <p class="text-sm font-bold text-text-main">미점검 자산</p>
            <p class="mt-1 text-xs text-text-sub">아직 응답이 수집되지 않은 자산입니다.</p>
          </div>

          <Table
            :columns="uninspectedColumns"
            :rows="uninspectedRows"
            row-key="assetCode"
            :loading="isLoading"
            empty-text="미점검 자산이 없습니다."
          />
        </section>

        <InspectionFollowUpPanel
          v-else
          :rows="followUpRows"
          :is-loading="isFollowUpLoading"
          :submitting-id="submittingFollowUpId"
          @refresh="loadFollowUpData"
          @update-status="submitFollowUpStatus"
        />

        <p
          v-if="errorMessage"
          class="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import InspectionFollowUpPanel, {
  type InspectionFollowUpPanelRow,
} from '@/components/inspection/common/InspectionFollowUpPanel.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { intangibleAssetApi, memberApi, tangibleAssetApi } from '@/api'
import { intangibleInspectionApi, tangibleInspectionApi } from '@/api/inspection.api'
import { usePermission } from '@/composables'
import { resolveInspectionStatus } from '@/utils/inspectionStatus'
import type { DropdownOption } from '@/types'
import type { Member } from '@/types/member'
import type {
  InspectionDetailResponse,
  EmployeeInspectionTargetResponse,
  InspectionFollowUpResponse,
  InspectionFollowUpStatus,
  InspectionStatus,
  InspectionUninspectedAssetItem,
} from '@/types/inspection'

interface InspectionRow extends Record<string, unknown> {
  rowKey: string
  inspectionId: string
  targetName: string
  executor: string
  status: InspectionStatus
  inspectorDepartment: string
  inspectorName: string
  startDate: string
  endDate: string
  targetAssetCount: number
  completedAssetCount: number
  followUpCount: number
  description: string
}

interface ResultRow extends Record<string, unknown> {
  inspectionResultId: string
  followUpId: string
  productName: string
  assetCode: string
  memberName: string
  responseContent: string
  followUpRequired: boolean
  actionDetail: string
  followUpStatus: InspectionFollowUpStatus
}

interface UninspectedRow extends Record<string, unknown> {
  productName: string
  assetCode: string
  category: string
  memberName: string
}

const props = defineProps<{
  isOpen: boolean
  inspection: InspectionRow | null
  assetType?: 'tangible' | 'intangible'
  assignedTargets?: EmployeeInspectionTargetResponse[]
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const statusLabel: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '조사 완료',
  CLOSED: '조사 종료',
}

const { canManageInspection } = usePermission()

const allTabs = [
  { label: '개요', value: 'overview' },
  { label: '결과', value: 'results' },
  { label: '미점검 자산', value: 'uninspected' },
  { label: '후속 처리', value: 'followUp' },
] as const
type InspectionDetailTab = (typeof allTabs)[number]['value']
const tabs = computed(() => (
  canManageInspection.value
    ? allTabs
    : allTabs.filter((tab) => tab.value !== 'followUp')
))

const resultColumns: Column<ResultRow>[] = [
  { key: 'productName', label: '제품명', width: '20%' },
  { key: 'assetCode', label: '자산코드', width: '17%' },
  { key: 'memberName', label: '대상 사용자', width: '15%' },
  { key: 'followUpRequired', label: '후속처리 여부', width: '16%', align: 'center' },
  { key: 'responseContent', label: '사용자 응답 내용', width: '32%' },
]

const uninspectedColumns: Column<UninspectedRow>[] = [
  { key: 'productName', label: '제품명', width: '28%' },
  { key: 'category', label: '카테고리', width: '22%' },
  { key: 'assetCode', label: '자산코드', width: '27%' },
  { key: 'memberName', label: '대상 사용자', width: '23%' },
]

const resultFilterOptions: DropdownOption[] = [
  { label: '전체 결과', value: '' },
  { label: '후속 필요', value: 'required' },
  { label: '후속 불필요', value: 'none' },
]

const activeTab = ref<InspectionDetailTab>('overview')
const resultFilter = ref('')
const detail = ref<InspectionDetailResponse | null>(null)
const inspectionTargets = ref<EmployeeInspectionTargetResponse[]>([])
const members = ref<Member[]>([])
const assetMemberNames = ref<Map<string, string[]>>(new Map())
const followUps = ref<InspectionFollowUpResponse[]>([])
const isLoading = ref(false)
const isFollowUpLoading = ref(false)
const errorMessage = ref('')
const submittingFollowUpId = ref('')
const inspectionApi = computed(() => (
  props.assetType === 'intangible'
    ? intangibleInspectionApi
    : tangibleInspectionApi
))

const inspection = computed(() => props.inspection)

const inspectionInfo = computed(() => detail.value?.inspectionInfo)
const displayTargetName = computed(() => inspectionInfo.value?.targetName ?? props.inspection?.targetName ?? '-')
const displayInspectorName = computed(() => inspectionInfo.value?.inspectorName ?? props.inspection?.inspectorName ?? '-')
const displayInspectorType = computed(() => (
  inspectorTypeLabel(inspectionInfo.value?.inspectorType) || props.inspection?.executor || '-'
))
const displayStartDate = computed(() => inspectionInfo.value?.startDate ?? props.inspection?.startDate ?? '')
const displayEndDate = computed(() => inspectionInfo.value?.endDate ?? props.inspection?.endDate ?? '')

const resultRows = computed<ResultRow[]>(() => (
  detail.value?.inspectionResults.map((item, index) => ({
    inspectionResultId: textValue(item.inspectionResultId, item.assetCode) || `result-${index}`,
    followUpId: textValue(item.inspectionFollowUpId, item.followUpId),
    productName: item.productName ?? '-',
    assetCode: item.assetCode ?? '-',
    memberName: resolveTargetMemberName(item.memberName, item.memberId, item.assetCode),
    responseContent: item.userResponseContent ?? '',
    followUpRequired: item.followUpRequired,
    actionDetail: textValue(item.actionDetail),
    followUpStatus: followUpStatusValue(item.status ?? item.followUpStatus),
  })) ?? []
))

const uninspectedRows = computed<UninspectedRow[]>(() => (
  detail.value?.uninspectedAssets.map(toUninspectedRow) ?? []
))

const filteredResultRows = computed(() => {
  if (resultFilter.value === 'required') {
    return resultRows.value.filter((row) => row.followUpRequired)
  }
  if (resultFilter.value === 'none') {
    return resultRows.value.filter((row) => !row.followUpRequired)
  }

  return resultRows.value
})

const respondedCount = computed(() => (
  resultRows.value.length
))

const followUpRequiredCount = computed(() => followUpRows.value.length)

const followUpRows = computed<InspectionFollowUpPanelRow[]>(() => {
  const apiRows = followUps.value.map(toFollowUpRow)
  if (apiRows.length > 0) return apiRows

  return resultRows.value
    .filter((row) => row.followUpRequired)
    .map((row) => ({
      key: `result-${row.inspectionResultId}`,
      followUpId: row.followUpId,
      inspectionResultId: row.inspectionResultId,
      productName: row.productName,
      assetCode: row.assetCode,
      memberName: row.memberName,
      responseContent: row.responseContent,
      actionDetail: row.actionDetail,
      status: row.followUpStatus,
    }))
})

const displayStatus = computed<InspectionStatus>(() => resolveInspectionStatus({
  startDate: displayStartDate.value,
  endDate: displayEndDate.value,
  fallbackStatus: inspectionInfo.value?.inspectionStatus ?? props.inspection?.status ?? 'READY',
  unrespondedCount: detail.value ? uninspectedRows.value.length : undefined,
  followUpCount: detail.value ? followUpRows.value.length : undefined,
  completedFollowUpCount: detail.value
    ? followUpRows.value.filter((row) => row.status === 'COMPLETED').length
    : undefined,
}))

const completionRate = computed(() => {
  const totalCount = resultRows.value.length + uninspectedRows.value.length
  if (totalCount === 0) return 0
  return Math.round((respondedCount.value / totalCount) * 100)
})

const summaryTiles = computed(() => {
  if (!props.inspection) return []

  return [
    { label: '대상 자산', value: `${(resultRows.value.length + uninspectedRows.value.length).toLocaleString()}건` },
    { label: '응답 완료', value: `${respondedCount.value.toLocaleString()}건` },
    { label: '후속 필요', value: `${followUpRequiredCount.value.toLocaleString()}건` },
    { label: '조사 기간', value: `${formatDate(displayStartDate.value)} ~ ${formatDate(displayEndDate.value)}` },
  ]
})

const overviewItems = computed(() => {
  if (!props.inspection) return []

  return [
    { label: '조사 담당자', value: displayInspectorName.value },
    { label: '조사 대상', value: displayTargetName.value },
    { label: '조사 수행자', value: displayInspectorType.value },
    { label: '조사 상태', value: statusLabel[displayStatus.value] },
    { label: '조사 시작일', value: formatDate(displayStartDate.value) },
    { label: '조사 종료일', value: formatDate(displayEndDate.value) },
  ]
})

watch(() => [props.isOpen, props.inspection?.inspectionId], ([isOpen]) => {
  if (!isOpen || !props.inspection) return

  activeTab.value = 'overview'
  resultFilter.value = ''
  errorMessage.value = ''
  loadDetailData()
}, { immediate: true })

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

function followUpStatusValue(value: unknown): InspectionFollowUpStatus {
  if (value === 'COMPLETED' || value === 'IN_PROGRESS' || value === 'PENDING') return value
  return 'PENDING'
}

function toFollowUpRow(item: InspectionFollowUpResponse, index: number): InspectionFollowUpPanelRow {
  const followUpId = textValue(item.inspectionFollowUpId, item.followUpId)
  const inspectionResultId = textValue(item.inspectionResultId)

  return {
    key: followUpId || inspectionResultId || `follow-up-${index}`,
    followUpId,
    inspectionResultId,
    productName: textValue(item.productName) || '-',
    assetCode: textValue(item.assetCode) || '-',
    memberName: resolveTargetMemberName(item.memberName, item.memberId, item.assetCode),
    responseContent: textValue(item.responseContent),
    actionDetail: textValue(item.actionDetail),
    status: followUpStatusValue(item.status ?? item.followUpStatus ?? item.inspectionFollowUpStatus),
  }
}

function inspectorTypeLabel(value: InspectionDetailResponse['inspectionInfo']['inspectorType'] | undefined) {
  if (!value) return ''
  return value === 'ASSET_TEAM' ? '자산팀 처리' : '소유자 응답'
}

function toUninspectedRow(item: InspectionUninspectedAssetItem): UninspectedRow {
  return {
    productName: item.productName ?? '-',
    assetCode: item.assetCode ?? '-',
    category: item.category ?? '-',
    memberName: resolveTargetMemberName(item.memberName, item.memberId, item.assetCode),
  }
}

function resolveTargetMemberName(
  memberName: string | null | undefined,
  memberId: string | null | undefined,
  assetCode: string | null | undefined,
) {
  const directName = textValue(memberName)
  if (directName) return directName

  const directMember = memberId
    ? members.value.find((member) => member.memberId === memberId)
    : undefined
  if (directMember?.name) return directMember.name

  const matchedTargets = inspectionTargets.value.filter((target) => (
    (memberId && target.memberId === memberId)
    || (assetCode && target.assetCode === assetCode)
  ))
  const targetMemberNames = matchedTargets
    .map((target) => (
      textValue(target.memberName)
      || members.value.find((member) => member.memberId === target.memberId)?.name
      || ''
    ))
    .filter((name) => name)

  const targetNames = [...new Set(targetMemberNames)]
  if (targetNames.length > 0) return targetNames.join(', ')

  return assetCode
    ? assetMemberNames.value.get(assetCode)?.join(', ') || '-'
    : '-'
}

function statusBadgeClass(status: InspectionStatus) {
  if (status === 'READY') return 'badge-warning'
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'
  if (status === 'COMPLETED') return 'badge-success'
  return 'bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-semibold'
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function loadDetailData() {
  if (!props.inspection?.inspectionId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (!canManageInspection.value) {
      await loadEmployeeDetailData()
      return
    }

    const [detailResult, targetsResult, membersResult, tangibleAssetsResult, intangibleAssetsResult] = await Promise.allSettled([
      inspectionApi.value.getDetail(props.inspection.inspectionId),
      inspectionApi.value.getTargets({
        inspectionId: props.inspection.inspectionId,
        page: 0,
        size: 1000,
      }),
      memberApi.getList({ page: 0, size: 1000 }),
      tangibleAssetApi.getList({ page: 0, size: 1000 }),
      intangibleAssetApi.getList({ page: 0, size: 1000 }),
    ])

    if (detailResult.status === 'rejected') throw detailResult.reason

    detail.value = detailResult.value.data
    inspectionTargets.value = targetsResult.status === 'fulfilled'
      ? targetsResult.value.data.content.filter((target) => (
        !target.inspectionId
        || String(target.inspectionId) === props.inspection?.inspectionId
      ))
      : []
    members.value = membersResult.status === 'fulfilled'
      ? membersResult.value.data.content
      : []
    const assetNameMap = new Map<string, Set<string>>()
    if (tangibleAssetsResult.status === 'fulfilled') {
      tangibleAssetsResult.value.data.content.forEach((asset) => {
        addAssetMemberName(
          assetNameMap,
          asset.assetCode,
          textValue(
            asset.currentUserName,
            asset.assignedMemberName,
            asset.memberName,
            members.value.find((member) => (
              member.memberId === (asset.memberId ?? asset.assignedMemberId)
            ))?.name,
          ),
        )
      })
    }
    if (intangibleAssetsResult.status === 'fulfilled') {
      intangibleAssetsResult.value.data.content.forEach((asset) => {
        addAssetMemberName(
          assetNameMap,
          asset.assetCode,
          textValue(
            asset.assignedMemberName,
            members.value.find((member) => member.memberId === asset.assignedMemberId)?.name,
          ),
        )
      })
    }
    assetMemberNames.value = new Map(
      Array.from(assetNameMap, ([assetCode, names]) => [assetCode, [...names]]),
    )
    await loadFollowUpData()
  } catch {
    detail.value = null
    inspectionTargets.value = []
    members.value = []
    assetMemberNames.value = new Map()
    followUps.value = []
    errorMessage.value = '전수조사 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function loadEmployeeDetailData() {
  if (!props.inspection) return

  const assignedTargets = props.assignedTargets ?? []
  const respondedTargets = assignedTargets.filter((target) => (
    target.isResponded === true || target.responded === true
  ))
  const responseResults = await Promise.allSettled(
    respondedTargets.map((target) => (
      inspectionApi.value.getResponse(textValue(target.inspectionTargetId))
    )),
  )

  const inspectionResults = respondedTargets.map((target, index) => {
    const responseResult = responseResults[index]
    const response = responseResult?.status === 'fulfilled' ? responseResult.value.data : null

    return {
      inspectionResultId: response?.inspectionResultId,
      productName: textValue(target.productName, target.itemName) || '-',
      assetCode: textValue(target.assetCode, target.licenseCode) || '-',
      memberId: target.memberId,
      memberName: target.memberName,
      followUpRequired: response?.followUpRequests === true || response?.followUpRequests === 1,
      userResponseContent: response?.responseContent ?? '',
    }
  })
  const uninspectedAssets = assignedTargets
    .filter((target) => target.isResponded !== true && target.responded !== true)
    .map((target) => ({
      productName: textValue(target.productName, target.itemName) || '-',
      assetCode: textValue(target.assetCode, target.licenseCode) || '-',
      category: textValue(target.category, target.categoryName) || '-',
      memberId: target.memberId,
      memberName: target.memberName,
    }))

  inspectionTargets.value = assignedTargets
  members.value = []
  assetMemberNames.value = new Map()
  followUps.value = []
  detail.value = {
    inspectionInfo: {
      inspectorName: props.inspection.inspectorName,
      targetName: props.inspection.targetName,
      inspectorType: 'EMPLOYEE',
      inspectionStatus: props.inspection.status,
      startDate: props.inspection.startDate,
      endDate: props.inspection.endDate,
    },
    inspectionResults,
    uninspectedAssets,
  }
}

function addAssetMemberName(
  map: Map<string, Set<string>>,
  assetCode: string | null | undefined,
  memberName: string,
) {
  if (!assetCode || !memberName) return
  const names = map.get(assetCode) ?? new Set<string>()
  names.add(memberName)
  map.set(assetCode, names)
}

async function loadFollowUpData() {
  isFollowUpLoading.value = true

  try {
    const followUpIds = [
      ...new Set(
        (detail.value?.inspectionResults ?? [])
          .map((item) => textValue(item.inspectionFollowUpId, item.followUpId))
          .filter((followUpId) => followUpId),
      ),
    ]

    if (followUpIds.length === 0) {
      followUps.value = []
      return
    }

    const responses = await Promise.all(
      followUpIds.map((followUpId) => inspectionApi.value.getFollowUp(followUpId)),
    )
    followUps.value = responses.map((response) => response.data)
  } catch {
    followUps.value = []
  } finally {
    isFollowUpLoading.value = false
  }
}

async function submitFollowUpStatus(
  row: InspectionFollowUpPanelRow,
  draft: { status: InspectionFollowUpStatus; actionDetail: string },
) {
  if (!row.followUpId) return

  submittingFollowUpId.value = row.followUpId
  errorMessage.value = ''

  try {
    await inspectionApi.value.updateFollowUpStatus(row.followUpId, {
      status: draft.status,
      actionDetail: draft.actionDetail,
    })
    await loadFollowUpData()
    emit('refresh')
  } catch {
    errorMessage.value = '후속 처리 상태를 변경하지 못했습니다.'
  } finally {
    submittingFollowUpId.value = ''
  }
}
</script>
