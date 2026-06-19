<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          ASSET ITEM
        </p>
        <h1 class="page-title">
          유형자산 전수조사
        </h1>
      </div>

      <Button
        v-if="canRegisterInspection"
        size="md"
        @click="openRegisterDrawer"
      >
        <Plus :size="15" />
        전수조사 계획 등록
      </Button>
    </header>

    <section class="grid shrink-0 grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-lg border border-border bg-surface p-5"
      >
        <p class="text-sm font-bold text-text-main">
          {{ card.label }}
        </p>
        <p class="mt-4 text-3xl font-bold text-text-main">
          {{ card.value }}건
        </p>
        <div class="mt-5 grid grid-cols-3 gap-2 text-xs">
          <div v-for="item in card.items" :key="item.label">
            <p class="font-semibold text-text-main">
              {{ item.label }}
            </p>
            <p class="mt-2 font-bold text-text-sub">
              {{ item.value }}건
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="card mx-3 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-surface">
      <div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2">
          <Dropdown
            :model-value="String(pageSize)"
            :options="pageSizeOptions"
            class="w-34"
            @update:model-value="handlePageSizeChange"
          />
          <span class="text-xs text-text-sub">
            총 {{ filteredRows.length }}건 중 {{ rangeText }}
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <Dropdown
            v-model="filters.status"
            :options="statusFilterOptions"
            class="w-36"
            menu-align="right"
          />
          <Dropdown
            v-model="filters.inspector"
            :options="inspectorFilterOptions"
            class="w-40"
            menu-align="right"
          />
          <Input
            id="inspection-keyword"
            v-model="filters.keyword"
            class="w-52"
            placeholder="조사 대상 검색"
            @keyup.enter="applySearch"
          />
          <Button size="md" @click="applySearch">
            <Search :size="14" />
            검색
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <Table
          :columns="columns"
          :rows="pagedRows"
          row-key="inspectionId"
          empty-text="등록된 유형자산 전수조사가 없습니다."
          @row-click="openDetailDrawer"
        >
          <template #cell-targetName="{ value: targetName }">
            <span class="font-semibold text-text-main">{{ targetName }}</span>
          </template>

          <template #cell-status="{ row }">
            <span :class="statusBadgeClass(row.status)">
              {{ STATUS_LABEL[row.status] }}
            </span>
          </template>

          <template #cell-inspectorName="{ row }">
            <span class="text-text-sub">{{ row.inspectorDepartment }} - {{ row.inspectorName }}</span>
          </template>

          <template #cell-startDate="{ value: startDate }">
            <span class="text-text-main">{{ formatDate(startDate as string) }}</span>
          </template>

          <template #cell-endDate="{ value: endDate }">
            <span class="text-text-main">{{ formatDate(endDate as string) }}</span>
          </template>
        </Table>
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border bg-surface px-4 py-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="currentPage === 0"
            @click="changePage(currentPage - 1)"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            :class="[
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
              currentPage === page - 1
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-surface-secondary',
            ]"
            @click="changePage(page - 1)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="currentPage >= totalPages - 1"
            @click="changePage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <BaseDrawer
      :is-open="isRegisterDrawerOpen"
      title="전수조사 계획 등록"
      body-class="p-0"
      hide-footer
      @close="closeRegisterDrawer"
    >
      <form class="flex h-full flex-col" @submit.prevent="handleRegisterInspection">
        <div class="flex-1 space-y-5 overflow-y-auto px-8 py-7">
          <Input
            id="inspection-description"
            v-model="registerForm.description"
            label="조사명"
            placeholder="예: 개발팀 보유 유형자산 전수조사"
            required
          />

          <div class="space-y-2">
            <label class="text-sm font-semibold text-text-main" for="inspection-target-type">
              조사 대상
            </label>
            <Dropdown
              id="inspection-target-type"
              v-model="registerForm.targetType"
              :options="targetTypeOptions"
              menu-strategy="fixed"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-text-main" for="inspection-inspector">
              조사 담당자
            </label>
            <Dropdown
              id="inspection-inspector"
              v-model="registerForm.inspector"
              :options="registerInspectorOptions"
              menu-strategy="fixed"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <Input
              id="inspection-start-date"
              v-model="registerForm.startDate"
              type="date"
              label="시작일"
              required
            />
            <Input
              id="inspection-end-date"
              v-model="registerForm.endDate"
              type="date"
              label="종료일"
              required
            />
          </div>

          <p
            v-if="registerError"
            class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            {{ registerError }}
          </p>
        </div>

        <div class="shrink-0 border-t border-border px-8 py-5">
          <Button
            class="w-full"
            type="submit"
            :disabled="!isRegisterReady"
          >
            등록하기
          </Button>
        </div>
      </form>
    </BaseDrawer>

    <BaseDrawer
      :is-open="Boolean(selectedInspection)"
      title="전수조사 상세"
      body-class="p-0"
      hide-footer
      @close="selectedInspection = null"
    >
      <div v-if="selectedInspection" class="flex h-full flex-col">
        <div class="flex-1 space-y-5 overflow-y-auto px-8 py-7">
          <div class="rounded-lg border border-border bg-surface p-5">
            <p class="text-xs font-bold text-primary">조사 대상</p>
            <h3 class="mt-2 text-xl font-bold text-text-main">
              {{ selectedInspection.targetName }}
            </h3>
            <p class="mt-2 text-sm text-text-sub">
              {{ selectedInspection.description }}
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <DetailItem label="조사 수행자" :value="selectedInspection.executor" />
            <DetailItem label="조사 담당자" :value="`${selectedInspection.inspectorDepartment} - ${selectedInspection.inspectorName}`" />
            <DetailItem label="조사 상태" :value="STATUS_LABEL[selectedInspection.status]" />
            <DetailItem label="조사 대상 자산" :value="`${selectedInspection.targetAssetCount.toLocaleString()}건`" />
            <DetailItem label="응답 완료" :value="`${selectedInspection.completedAssetCount.toLocaleString()}건`" />
            <DetailItem label="후속 처리" :value="`${selectedInspection.followUpCount.toLocaleString()}건`" />
            <DetailItem label="시작일" :value="formatDate(selectedInspection.startDate)" />
            <DetailItem label="종료일" :value="formatDate(selectedInspection.endDate)" />
          </div>
        </div>
      </div>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { usePermission } from '@/composables'
import type { DropdownOption } from '@/types'
import type { InspectionStatus } from '@/types/inspection'

type TangibleInspectionStatus = InspectionStatus
type TangibleInspectionTargetType = 'ALL' | 'DEPARTMENT' | 'CATEGORY'

interface TangibleInspectionRow extends Record<string, unknown> {
  inspectionId: string
  targetName: string
  executor: string
  status: TangibleInspectionStatus
  inspectorDepartment: string
  inspectorName: string
  startDate: string
  endDate: string
  targetAssetCount: number
  completedAssetCount: number
  followUpCount: number
  description: string
}

interface SummaryCard {
  label: string
  value: number
  items: Array<{
    label: string
    value: number
  }>
}

const DetailItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-lg border border-border bg-surface p-4' }, [
      h('p', { class: 'text-xs font-semibold text-text-muted' }, props.label),
      h('p', { class: 'mt-2 text-sm font-bold text-text-main' }, props.value),
    ])
  },
})

const STATUS_LABEL: Record<TangibleInspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const TARGET_TYPE_LABEL: Record<TangibleInspectionTargetType, string> = {
  ALL: '전체 유형자산',
  DEPARTMENT: '부서',
  CATEGORY: '품목',
}

const SAMPLE_INSPECTIONS: TangibleInspectionRow[] = [
  {
    inspectionId: 'TIN-20260612-001',
    targetName: '개발팀',
    executor: '구매자산팀',
    status: 'READY',
    inspectorDepartment: '구매자산팀',
    inspectorName: '구매자산팀 - 구○○',
    startDate: '2026-06-12',
    endDate: '2026-06-29',
    targetAssetCount: 1248,
    completedAssetCount: 0,
    followUpCount: 0,
    description: '개발팀 보유 유형자산 전수조사',
  },
  {
    inspectionId: 'TIN-20260602-002',
    targetName: '노트북',
    executor: '구매자산팀',
    status: 'IN_PROGRESS',
    inspectorDepartment: '구매자산팀',
    inspectorName: '구매자산팀 - 이○○',
    startDate: '2026-06-02',
    endDate: '2026-06-19',
    targetAssetCount: 428,
    completedAssetCount: 217,
    followUpCount: 8,
    description: '노트북 보유 현황 및 QR 확인 조사',
  },
  {
    inspectionId: 'TIN-20260605-003',
    targetName: 'PC',
    executor: '구매자산팀',
    status: 'IN_PROGRESS',
    inspectorDepartment: '구매자산팀',
    inspectorName: '구매자산팀 - 임□□',
    startDate: '2026-06-05',
    endDate: '2026-06-22',
    targetAssetCount: 519,
    completedAssetCount: 321,
    followUpCount: 11,
    description: '사무실 PC 실물 확인 및 사용자 응답 조사',
  },
  {
    inspectionId: 'TIN-20260512-004',
    targetName: 'PC',
    executor: '사원',
    status: 'COMPLETED',
    inspectorDepartment: '구매자산팀',
    inspectorName: '김□□',
    startDate: '2026-05-12',
    endDate: '2026-06-01',
    targetAssetCount: 356,
    completedAssetCount: 356,
    followUpCount: 2,
    description: '사용자 확인 기반 PC 보유 여부 조사',
  },
  {
    inspectionId: 'TIN-20260512-005',
    targetName: '모니터',
    executor: '사원',
    status: 'COMPLETED',
    inspectorDepartment: '구매자산팀',
    inspectorName: '김□□',
    startDate: '2026-05-12',
    endDate: '2026-06-01',
    targetAssetCount: 812,
    completedAssetCount: 812,
    followUpCount: 6,
    description: '모니터 배정 현황 및 위치 확인 조사',
  },
  {
    inspectionId: 'TIN-20260512-006',
    targetName: '프론트엔드팀',
    executor: '구매자산팀',
    status: 'CLOSED',
    inspectorDepartment: '구매자산팀',
    inspectorName: '박□□',
    startDate: '2026-05-12',
    endDate: '2026-06-01',
    targetAssetCount: 214,
    completedAssetCount: 189,
    followUpCount: 19,
    description: '프론트엔드팀 미응답 및 불일치 후속 처리',
  },
]

const { hasRole } = usePermission()

const inspections = ref<TangibleInspectionRow[]>([...SAMPLE_INSPECTIONS])
const selectedInspection = ref<TangibleInspectionRow | null>(null)
const isRegisterDrawerOpen = ref(false)
const registerError = ref('')
const currentPage = ref(0)
const pageSize = ref(10)
const appliedKeyword = ref('')

const filters = reactive({
  status: '',
  inspector: '',
  keyword: '',
})

const registerForm = reactive({
  description: '',
  targetType: 'DEPARTMENT' as TangibleInspectionTargetType,
  inspector: 'ASSET_TEAM',
  startDate: '',
  endDate: '',
})

const canRegisterInspection = computed(() => (
  hasRole('ADMIN', 'SUPER_ADMIN', 'ASSET_TEAM', 'ASSET_MANAGER')
))

const columns: Column<TangibleInspectionRow>[] = [
  { key: 'targetName', label: '조사 대상', width: '18%' },
  { key: 'executor', label: '조사 수행자', width: '16%' },
  { key: 'status', label: '조사 상태', width: '16%' },
  { key: 'inspectorName', label: '조사 담당자', width: '22%' },
  { key: 'startDate', label: '시작일', width: '14%', align: 'center' },
  { key: 'endDate', label: '종료일', width: '14%', align: 'center' },
]

const pageSizeOptions: DropdownOption[] = [10, 20, 50].map((value) => ({
  label: `${value}개씩 보기`,
  value: String(value),
}))

const statusFilterOptions: DropdownOption[] = [
  { label: '- 전체 -', value: '' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ label, value })),
]

const inspectorFilterOptions = computed<DropdownOption[]>(() => [
  { label: '- 조사 담당자 -', value: '' },
  ...Array.from(new Set(inspections.value.map((item) => item.inspectorName))).map((name) => ({
    label: name,
    value: name,
  })),
])

const targetTypeOptions: DropdownOption[] = Object.entries(TARGET_TYPE_LABEL).map(([value, label]) => ({
  label,
  value,
}))

const registerInspectorOptions: DropdownOption[] = [
  { label: '구매자산팀', value: 'ASSET_TEAM' },
  { label: '사원 본인', value: 'EMPLOYEE' },
]

const filteredRows = computed(() => {
  const keyword = appliedKeyword.value.trim().toLowerCase()

  return inspections.value.filter((item) => {
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesInspector = !filters.inspector || item.inspectorName === filters.inspector
    const matchesKeyword = !keyword || [
      item.targetName,
      item.executor,
      item.inspectorDepartment,
      item.inspectorName,
      item.description,
    ].some((value) => value.toLowerCase().includes(keyword))

    return matchesStatus && matchesInspector && matchesKeyword
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))

const pagedRows = computed(() => {
  const start = currentPage.value * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const visiblePages = computed(() => (
  Array.from({ length: totalPages.value }, (_, index) => index + 1).slice(0, 5)
))

const rangeText = computed(() => {
  if (filteredRows.value.length === 0) return '0-0건'
  const start = currentPage.value * pageSize.value + 1
  const end = Math.min((currentPage.value + 1) * pageSize.value, filteredRows.value.length)
  return `${start}-${end}건`
})

const summaryCards = computed<SummaryCard[]>(() => {
  const rows = inspections.value
  const ready = rows.filter((item) => item.status === 'READY').length
  const inProgress = rows.filter((item) => item.status === 'IN_PROGRESS').length
  const completed = rows.filter((item) => item.status === 'COMPLETED').length
  const closed = rows.filter((item) => item.status === 'CLOSED').length
  const targetAssets = rows.reduce((sum, item) => sum + item.targetAssetCount, 0)
  const completedAssets = rows.reduce((sum, item) => sum + item.completedAssetCount, 0)
  const followUps = rows.reduce((sum, item) => sum + item.followUpCount, 0)

  return [
    {
      label: '전체 전수조사 현황',
      value: rows.length,
      items: [
        { label: '진행 전', value: ready },
        { label: '진행 중', value: inProgress },
        { label: '완료', value: completed },
      ],
    },
    {
      label: '진행 중인 전수조사',
      value: inProgress,
      items: [
        { label: '조사 대상 자산', value: targetAssets },
        { label: '응답 완료 자산', value: completedAssets },
        { label: '후속 처리', value: followUps },
      ],
    },
    {
      label: '완료된 전수조사',
      value: completed,
      items: [
        { label: '조사 완료 자산', value: completedAssets },
        { label: '후속 처리 완료', value: closed },
        { label: '미처리', value: followUps },
      ],
    },
    {
      label: '미처리 자산',
      value: rows.reduce((sum, item) => sum + Math.max(item.targetAssetCount - item.completedAssetCount, 0), 0),
      items: [
        { label: '조사 대상 자산', value: targetAssets },
        { label: '응답 완료', value: completedAssets },
        { label: '미응답', value: targetAssets - completedAssets },
      ],
    },
    {
      label: '후속 처리 중',
      value: followUps,
      items: [
        { label: '처리 대기', value: Math.max(followUps - closed, 0) },
        { label: '처리 완료', value: closed },
        { label: '전체 후속', value: followUps },
      ],
    },
  ]
})

const isRegisterReady = computed(() => Boolean(
  registerForm.description.trim()
  && registerForm.targetType
  && registerForm.inspector
  && registerForm.startDate
  && registerForm.endDate
))

watch(() => [filters.status, filters.inspector], () => {
  currentPage.value = 0
})

function statusBadgeClass(status: TangibleInspectionStatus) {
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

function applySearch() {
  appliedKeyword.value = filters.keyword
  currentPage.value = 0
}

function handlePageSizeChange(value: string | number) {
  const nextSize = Number(value)
  if (!Number.isInteger(nextSize) || nextSize <= 0) return
  pageSize.value = nextSize
  currentPage.value = 0
}

function changePage(page: number) {
  if (page < 0 || page > totalPages.value - 1) return
  currentPage.value = page
}

function openDetailDrawer(row: TangibleInspectionRow) {
  selectedInspection.value = row
}

function openRegisterDrawer() {
  registerError.value = ''
  isRegisterDrawerOpen.value = true
}

function closeRegisterDrawer() {
  isRegisterDrawerOpen.value = false
  registerError.value = ''
}

function handleRegisterInspection() {
  if (!isRegisterReady.value) {
    registerError.value = '전수조사 계획 정보를 모두 입력해주세요.'
    return
  }

  if (new Date(registerForm.startDate).getTime() > new Date(registerForm.endDate).getTime()) {
    registerError.value = '종료일은 시작일 이후여야 합니다.'
    return
  }

  inspections.value = [
    {
      inspectionId: `TIN-${Date.now()}`,
      targetName: TARGET_TYPE_LABEL[registerForm.targetType],
      executor: registerForm.inspector === 'ASSET_TEAM' ? '구매자산팀' : '사원',
      status: 'READY',
      inspectorDepartment: '구매자산팀',
      inspectorName: registerForm.inspector === 'ASSET_TEAM' ? '구매자산팀 - 신규' : '사원',
      startDate: registerForm.startDate,
      endDate: registerForm.endDate,
      targetAssetCount: 0,
      completedAssetCount: 0,
      followUpCount: 0,
      description: registerForm.description.trim(),
    },
    ...inspections.value,
  ]

  registerForm.description = ''
  registerForm.targetType = 'DEPARTMENT'
  registerForm.inspector = 'ASSET_TEAM'
  registerForm.startDate = ''
  registerForm.endDate = ''
  closeRegisterDrawer()
}
</script>
