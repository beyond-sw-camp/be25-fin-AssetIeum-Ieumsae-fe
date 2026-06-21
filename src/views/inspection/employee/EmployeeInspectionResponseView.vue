<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="page-subtitle">
          INSPECTION
        </p>
        <h1 class="page-title">
          {{ pageTitle }}
        </h1>
        <p class="mt-2 text-sm text-text-sub">
          내게 지정된 전수조사와 대상 자산을 확인할 수 있습니다.
        </p>
      </div>
      <Button variant="secondary" :disabled="isLoading" @click="loadTargets">
        새로고침
      </Button>
    </header>

    <section class="grid shrink-0 grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-3">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-lg border border-border bg-surface p-5"
      >
        <p class="text-sm font-bold text-text-main">
          {{ card.label }}
        </p>
        <p class="mt-4 text-3xl font-bold" :class="card.valueClass">
          {{ card.value }}건
        </p>
        <p class="mt-3 text-xs text-text-sub">
          {{ card.description }}
        </p>
      </article>
    </section>

    <section class="mx-3 mb-4 grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[1fr_28rem]">
      <div class="card flex min-h-0 flex-col overflow-hidden border border-border bg-surface">
        <div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-2">
            <Dropdown
              v-model="respondedFilter"
              :options="respondedFilterOptions"
              class="w-30"
              menu-strategy="fixed"
            />
            <span class="text-xs text-text-sub">
              총 {{ totalElements }}개 자산
            </span>
          </div>

          <Input
            id="employee-inspection-keyword"
            v-model="keyword"
            class="lg:w-64!"
            placeholder="전수조사, 제품명, 자산 번호 검색"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <div v-if="isLoading" class="space-y-3">
            <div
              v-for="index in 4"
              :key="index"
              class="h-28 animate-pulse rounded-lg border border-border bg-surface-secondary"
            />
          </div>

          <div
            v-else-if="filteredInspectionGroups.length === 0"
            class="rounded-lg border border-dashed border-border px-6 py-16 text-center"
          >
            <p class="text-sm font-semibold text-text-main">
              {{ emptyText }}
            </p>
            <p class="mt-2 text-xs text-text-sub">
              전수조사 대상이 배정되면 이곳에 표시됩니다.
            </p>
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="group in filteredInspectionGroups"
              :key="group.inspectionId"
              class="rounded-lg border border-border bg-surface"
            >
              <div class="border-b border-border px-4 py-3">
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-sm font-bold text-text-main">
                      {{ group.title }}
                    </p>
                    <p class="mt-1 text-xs text-text-sub">
                      {{ formatDate(group.startDate) }} ~ {{ formatDate(group.endDate) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span :class="statusBadgeClass(group.inspectionStatus)">
                      {{ statusLabel[group.inspectionStatus] ?? group.inspectionStatus }}
                    </span>
                    <span class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
                      {{ group.respondedCount }}/{{ group.targets.length }} 응답
                    </span>
                  </div>
                </div>
              </div>

              <div class="divide-y divide-border">
                <button
                  v-for="target in group.targets"
                  :key="target.inspectionTargetId"
                  type="button"
                  :class="[
                    'flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-primary/5 md:flex-row md:items-center md:justify-between',
                    selectedTarget?.inspectionTargetId === target.inspectionTargetId && 'bg-primary/5',
                  ]"
                  @click="selectTarget(target)"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-text-main">
                      {{ target.productName }}
                    </p>
                    <p class="mt-1 text-xs text-text-sub">
                      {{ target.assetCode }} · {{ target.category }}
                    </p>
                  </div>
                  <span :class="target.isResponded ? 'badge-success' : 'badge-warning'">
                    {{ target.isResponded ? '응답 완료' : '응답 대기' }}
                  </span>
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <aside class="card flex min-h-0 flex-col border border-border bg-surface">
        <div class="border-b border-border px-5 py-4">
          <p class="text-base font-bold text-text-main">
            대상 자산 상세
          </p>
          <p class="mt-1 text-xs text-text-sub">
            자산을 선택하면 응답을 등록할 수 있습니다.
          </p>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div v-if="selectedTarget" class="space-y-3">
              <div class="rounded-lg border border-border bg-surface-secondary/40 p-4">
                <p class="text-sm font-bold text-text-main">
                  {{ selectedTarget.productName }}
                </p>
                <p class="mt-2 text-xs text-text-sub">
                  {{ selectedTarget.assetCode }} · {{ selectedTarget.category }}
                </p>
                <p class="mt-2 text-xs text-text-sub">
                  조사 기간 {{ formatDate(selectedTarget.startDate) }} ~ {{ formatDate(selectedTarget.endDate) }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg bg-surface-secondary px-3 py-3">
                  <p class="font-semibold text-text-muted">전수조사 ID</p>
                  <p class="mt-1 truncate font-bold text-text-main">{{ selectedTarget.inspectionId }}</p>
                </div>
                <div class="rounded-lg bg-surface-secondary px-3 py-3">
                  <p class="font-semibold text-text-muted">대상 ID</p>
                  <p class="mt-1 truncate font-bold text-text-main">{{ selectedTarget.inspectionTargetId }}</p>
                </div>
              </div>
            </div>

            <div v-else class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">
              상세를 볼 자산을 선택해주세요.
            </div>

            <label class="flex items-start gap-3 text-sm font-semibold text-text-main">
              <input
                v-model="form.followUpRequests"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                :disabled="!selectedTarget || selectedTarget.isResponded"
              >
              <span>
                확인 필요
                <span class="mt-1 block text-xs font-normal text-text-sub">
                  정보가 다르거나 실제 사용 상태가 맞지 않으면 선택해주세요.
                </span>
              </span>
            </label>

            <div>
              <label for="employee-inspection-response" class="text-sm font-semibold text-text-main">
                확인 내용 <span class="text-primary">*</span>
              </label>
              <textarea
                id="employee-inspection-response"
                v-model="form.responseContent"
                class="mt-2 min-h-36 w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-secondary disabled:text-text-muted"
                placeholder="예: 현재 사용 중이며 이상 없습니다."
                :disabled="!selectedTarget || selectedTarget.isResponded"
              />
            </div>

            <p
              v-if="message"
              :class="[
                'rounded-lg border px-4 py-3 text-sm',
                isSuccess
                  ? 'border-success/30 bg-success/5 text-success'
                  : 'border-danger/30 bg-danger/5 text-danger',
              ]"
            >
              {{ message }}
            </p>
          </div>

          <div class="shrink-0 border-t border-border px-5 py-4">
            <Button
              class="w-full"
              type="submit"
              :disabled="!isReady || isSubmitting"
              :loading="isSubmitting"
            >
              응답 등록하기
            </Button>
          </div>
        </form>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import {
  intangibleInspectionApi,
  tangibleInspectionApi,
} from '@/api/inspection.api'
import type { DropdownOption } from '@/types'
import type {
  EmployeeInspectionTargetResponse,
  InspectionStatus,
} from '@/types/inspection'

interface InspectionTargetRow extends Record<string, unknown> {
  inspectionTargetId: string
  inspectionId: string
  inspectionStatus: InspectionStatus
  productName: string
  assetCode: string
  category: string
  isResponded: boolean
  startDate: string
  endDate: string
}

interface InspectionGroup {
  inspectionId: string
  title: string
  inspectionStatus: InspectionStatus
  startDate: string
  endDate: string
  targets: InspectionTargetRow[]
  respondedCount: number
}

const props = defineProps<{
  assetType: 'tangible' | 'intangible'
}>()

const targets = ref<InspectionTargetRow[]>([])
const selectedTarget = ref<InspectionTargetRow | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const message = ref('')
const loadError = ref('')
const totalElements = ref(0)
const keyword = ref('')
const respondedFilter = ref('')

const form = reactive({
  responseContent: '',
  followUpRequests: false,
})

const statusLabel: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const pageTitle = computed(() => (
  props.assetType === 'tangible'
    ? '내 유형자산 전수조사'
    : '내 무형자산 전수조사'
))

const inspectionApi = computed(() => (
  props.assetType === 'tangible'
    ? tangibleInspectionApi
    : intangibleInspectionApi
))

const respondedFilterOptions: DropdownOption[] = [
  { label: '전체', value: '' },
  { label: '응답 대기', value: 'false' },
  { label: '응답 완료', value: 'true' },
]

const pendingCount = computed(() => targets.value.filter((target) => !target.isResponded).length)
const respondedCount = computed(() => targets.value.filter((target) => target.isResponded).length)
const inspectionCount = computed(() => new Set(targets.value.map((target) => target.inspectionId)).size)
const emptyText = computed(() => loadError.value || '내게 지정된 전수조사가 없습니다.')

const summaryCards = computed(() => [
  {
    label: '지정된 전수조사',
    value: inspectionCount.value,
    description: '내가 응답해야 하는 전수조사 수',
    valueClass: 'text-text-main',
  },
  {
    label: '응답 대기 자산',
    value: pendingCount.value,
    description: '아직 확인이 필요한 자산',
    valueClass: 'text-primary',
  },
  {
    label: '응답 완료 자산',
    value: respondedCount.value,
    description: '응답 등록이 완료된 자산',
    valueClass: 'text-success',
  },
])

const filteredTargets = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return targets.value.filter((target) => {
    const matchesResponded = !respondedFilter.value
      || String(target.isResponded) === respondedFilter.value
    const matchesKeyword = !query
      || [
        target.inspectionId,
        target.productName,
        target.assetCode,
        target.category,
      ].some((value) => value.toLowerCase().includes(query))

    return matchesResponded && matchesKeyword
  })
})

const filteredInspectionGroups = computed<InspectionGroup[]>(() => {
  const groupMap = new Map<string, InspectionTargetRow[]>()

  filteredTargets.value.forEach((target) => {
    const items = groupMap.get(target.inspectionId) ?? []
    items.push(target)
    groupMap.set(target.inspectionId, items)
  })

  return Array.from(groupMap.entries()).map(([inspectionId, groupTargets], index) => {
    const firstTarget = groupTargets[0]
    return {
      inspectionId,
      title: `전수조사 ${index + 1}`,
      inspectionStatus: firstTarget?.inspectionStatus ?? 'READY',
      startDate: firstTarget?.startDate ?? '',
      endDate: firstTarget?.endDate ?? '',
      targets: groupTargets,
      respondedCount: groupTargets.filter((target) => target.isResponded).length,
    }
  })
})

const isReady = computed(() => Boolean(
  selectedTarget.value
  && !selectedTarget.value.isResponded
  && form.responseContent.trim(),
))

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

function booleanValue(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'boolean')
  return typeof value === 'boolean' ? value : false
}

function toTargetRow(item: EmployeeInspectionTargetResponse): InspectionTargetRow {
  return {
    inspectionTargetId: textValue(item.inspectionTargetId),
    inspectionId: textValue(item.inspectionId),
    inspectionStatus: item.inspectionStatus ?? 'READY',
    productName: textValue(item.productName, item.itemName) || '-',
    assetCode: textValue(item.assetCode, item.licenseCode) || '-',
    category: textValue(item.category, item.categoryName) || '-',
    isResponded: booleanValue(item.isResponded, item.responded),
    startDate: textValue(item.startDate),
    endDate: textValue(item.endDate),
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

function selectTarget(row: InspectionTargetRow) {
  selectedTarget.value = row
  form.responseContent = row.isResponded ? '이미 응답이 등록된 자산입니다.' : ''
  form.followUpRequests = false
  message.value = ''
}

async function loadTargets() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await inspectionApi.value.getMyTargets({ page: 0, size: 100 })
    targets.value = response.data.content.map(toTargetRow)
    totalElements.value = response.data.totalElements
    selectedTarget.value = targets.value.find((target) => !target.isResponded) ?? targets.value[0] ?? null
  } catch {
    targets.value = []
    totalElements.value = 0
    selectedTarget.value = null
    loadError.value = '내 전수조사를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!selectedTarget.value || !isReady.value) {
    isSuccess.value = false
    message.value = '응답할 자산과 확인 내용을 입력해주세요.'
    return
  }

  isSubmitting.value = true
  message.value = ''

  try {
    await inspectionApi.value.createResponse(selectedTarget.value.inspectionTargetId, {
      responseContent: form.responseContent,
      followUpRequests: form.followUpRequests,
    })

    isSuccess.value = true
    message.value = '전수조사 응답이 등록되었습니다.'
    form.responseContent = ''
    form.followUpRequests = false
    await loadTargets()
  } catch {
    isSuccess.value = false
    message.value = '전수조사 응답 등록에 실패했습니다. 입력한 정보를 확인해주세요.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadTargets)
</script>
