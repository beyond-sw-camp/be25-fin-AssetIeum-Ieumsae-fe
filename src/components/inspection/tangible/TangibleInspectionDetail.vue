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
              {{ inspection.targetName }}
            </h3>
            <p class="mt-2 text-sm text-text-sub">
              {{ inspection.description || '설명이 없습니다.' }}
            </p>
          </div>
          <span :class="statusBadgeClass(inspection.status)">
            {{ statusLabel[inspection.status] }}
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

        <section v-else class="space-y-4">
          <div>
            <p class="text-sm font-bold text-text-main">후속 처리</p>
            <p class="mt-1 text-xs text-text-sub">후속 처리가 필요한 결과가 생기면 처리할 수 있습니다.</p>
          </div>

          <div
            v-if="followUpRows.length === 0"
            class="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted"
          >
            후속 처리가 필요한 결과가 없습니다.
          </div>

          <div
            v-for="row in followUpRows"
            :key="row.inspectionResultId"
            class="rounded-lg border border-border bg-surface p-5"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-bold text-text-main">
                  {{ row.assetCode }}
                </p>
                <p class="mt-1 text-xs text-text-sub">
                  {{ row.productName }} · {{ row.responseContent || '응답 내용 없음' }}
                </p>
              </div>
              <span class="badge-warning">후속 필요</span>
            </div>

            <label class="mt-4 block text-sm font-semibold text-text-main" :for="`follow-up-${row.inspectionResultId}`">
              처리 내용
            </label>
            <textarea
              :id="`follow-up-${row.inspectionResultId}`"
              v-model="followUpDrafts[row.inspectionResultId]"
              class="mt-2 min-h-24 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="후속 처리 내용을 입력하세요."
            />

            <div class="mt-3 flex justify-end">
              <Button
                size="sm"
                :disabled="!followUpDrafts[row.inspectionResultId]?.trim()"
                :loading="submittingResultId === row.inspectionResultId"
                @click="submitFollowUp(row)"
              >
                후속 처리 등록
              </Button>
            </div>
          </div>
        </section>

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
import Table, { type Column } from '@/components/common/Table.vue'
import { tangibleInspectionApi } from '@/api/inspection.api'
import type { DropdownOption } from '@/types'
import type {
  InspectionDetailResponse,
  InspectionStatus,
  InspectionUninspectedAssetItem,
} from '@/types/inspection'

interface TangibleInspectionRow extends Record<string, unknown> {
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
  productName: string
  assetCode: string
  responseContent: string
  followUpRequired: boolean
}

interface UninspectedRow extends Record<string, unknown> {
  productName: string
  assetCode: string
  category: string
}

const props = defineProps<{
  isOpen: boolean
  inspection: TangibleInspectionRow | null
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const statusLabel: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const tabs = [
  { label: '개요', value: 'overview' },
  { label: '결과', value: 'results' },
  { label: '미점검 자산', value: 'uninspected' },
  { label: '후속 처리', value: 'followUp' },
] as const

const resultColumns: Column<ResultRow>[] = [
  { key: 'assetCode', label: '자산 번호', width: '18%' },
  { key: 'productName', label: '제품명', width: '22%' },
  { key: 'responseContent', label: '응답 내용', width: '44%' },
  { key: 'followUpRequired', label: '후속 처리', width: '14%', align: 'center' },
]

const uninspectedColumns: Column<UninspectedRow>[] = [
  { key: 'assetCode', label: '자산 번호', width: '24%' },
  { key: 'productName', label: '제품명', width: '42%' },
  { key: 'category', label: '카테고리', width: '34%' },
]

const resultFilterOptions: DropdownOption[] = [
  { label: '전체 결과', value: '' },
  { label: '후속 필요', value: 'required' },
  { label: '후속 불필요', value: 'none' },
]

const activeTab = ref<(typeof tabs)[number]['value']>('overview')
const resultFilter = ref('')
const detail = ref<InspectionDetailResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const submittingResultId = ref('')
const followUpDrafts = ref<Record<string, string>>({})

const inspection = computed(() => props.inspection)

const inspectionInfo = computed(() => detail.value?.inspectionInfo)

const resultRows = computed<ResultRow[]>(() => (
  detail.value?.inspectionResults.map((item, index) => ({
    inspectionResultId: `${item.assetCode ?? index}`,
    productName: item.productName ?? '-',
    assetCode: item.assetCode ?? '-',
    responseContent: item.userResponseContent ?? '',
    followUpRequired: item.followUpRequired,
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

const followUpRows = computed(() => (
  resultRows.value.filter((row) => row.followUpRequired)
))

const completionRate = computed(() => {
  if (resultRows.value.length === 0) return 0
  return Math.round((respondedCount.value / resultRows.value.length) * 100)
})

const summaryTiles = computed(() => {
  if (!props.inspection) return []

  return [
    { label: '대상 자산', value: `${(resultRows.value.length + uninspectedRows.value.length).toLocaleString()}건` },
    { label: '응답 완료', value: `${respondedCount.value.toLocaleString()}건` },
    { label: '후속 필요', value: `${followUpRequiredCount.value.toLocaleString()}건` },
    { label: '조사 기간', value: `${formatDate(inspectionInfo.value?.startDate ?? props.inspection.startDate)} ~ ${formatDate(inspectionInfo.value?.endDate ?? props.inspection.endDate)}` },
  ]
})

const overviewItems = computed(() => {
  if (!props.inspection) return []

  return [
    { label: '조사 방식', value: inspectorTypeLabel(inspectionInfo.value?.inspectorType) || props.inspection.executor },
    { label: '조사 수행자', value: inspectionInfo.value?.inspectorName ?? props.inspection.inspectorName },
    { label: '시작일', value: formatDate(inspectionInfo.value?.startDate ?? props.inspection.startDate) },
    { label: '종료일', value: formatDate(inspectionInfo.value?.endDate ?? props.inspection.endDate) },
  ]
})

watch(() => [props.isOpen, props.inspection?.inspectionId], ([isOpen]) => {
  if (!isOpen || !props.inspection) return

  activeTab.value = 'overview'
  resultFilter.value = ''
  errorMessage.value = ''
  followUpDrafts.value = {}
  loadDetailData()
}, { immediate: true })

function inspectorTypeLabel(value: InspectionDetailResponse['inspectionInfo']['inspectorType'] | undefined) {
  if (!value) return ''
  return value === 'ASSET_TEAM' ? '자산팀 처리' : '소유자 응답'
}

function toUninspectedRow(item: InspectionUninspectedAssetItem): UninspectedRow {
  return {
    productName: item.productName ?? '-',
    assetCode: item.assetCode ?? '-',
    category: item.category ?? '-',
  }
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
    const response = await tangibleInspectionApi.getDetail(props.inspection.inspectionId)
    detail.value = response.data
  } catch {
    detail.value = null
    errorMessage.value = '전수조사 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function submitFollowUp(row: ResultRow) {
  const actionDetail = followUpDrafts.value[row.inspectionResultId]?.trim()
  if (!actionDetail) return

  errorMessage.value = '현재 처리할 수 없는 항목입니다.'
}
</script>
