<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="page-subtitle">INSPECTION</p>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="mt-2 text-sm text-text-sub">
          내게 지정된 자산을 확인하고 전수조사 응답을 등록합니다.
        </p>
      </div>
      <Button variant="secondary" :disabled="isLoading" @click="loadTargets">
        새로고침
      </Button>
    </header>

    <section class="mx-3 mb-4 grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div class="card flex min-h-0 flex-col overflow-hidden border border-border bg-surface">
        <div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2">
            <Dropdown
              v-model="respondedFilter"
              :options="respondedFilterOptions"
              class="w-32"
              menu-strategy="fixed"
            />
            <span class="text-xs text-text-sub">총 {{ totalElements }}개 자산</span>
          </div>
          <Input
            id="inspection-target-keyword"
            v-model="keyword"
            class="md:w-64!"
            placeholder="제품명, 자산 코드 검색"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <div v-if="isLoading" class="space-y-3">
            <div
              v-for="index in 4"
              :key="index"
              class="h-24 animate-pulse rounded-lg border border-border bg-surface-secondary"
            />
          </div>

          <div
            v-else-if="filteredTargets.length === 0"
            class="rounded-lg border border-dashed border-border px-6 py-16 text-center"
          >
            <p class="text-sm font-semibold text-text-main">{{ emptyText }}</p>
            <p class="mt-2 text-xs text-text-sub">응답 대상이 배정되면 이곳에 표시됩니다.</p>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="target in filteredTargets"
              :key="target.inspectionTargetId"
              type="button"
              :class="[
                'flex w-full flex-col gap-3 rounded-lg border px-4 py-4 text-left transition md:flex-row md:items-center md:justify-between',
                selectedTarget?.inspectionTargetId === target.inspectionTargetId
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface hover:border-primary/40',
              ]"
              @click="selectTarget(target)"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-text-main">{{ target.productName }}</p>
                <p class="mt-1 text-xs text-text-sub">
                  {{ target.assetCode }} · {{ target.category }}
                </p>
                <p class="mt-2 text-xs text-text-muted">
                  {{ formatDate(target.startDate) }} ~ {{ formatDate(target.endDate) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span :class="statusBadgeClass(target.inspectionStatus)">
                  {{ inspectionStatusLabel[target.inspectionStatus] }}
                </span>
                <span :class="target.isResponded ? 'badge-success' : 'badge-warning'">
                  {{ target.isResponded ? '응답 완료' : '응답 대기' }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <aside class="card flex min-h-0 flex-col overflow-hidden border border-border bg-surface">
        <div class="shrink-0 border-b border-border px-5 py-4">
          <p class="text-base font-bold text-text-main">전수조사 응답</p>
          <p class="mt-1 text-xs text-text-sub">진행 중인 대상 자산에 응답할 수 있습니다.</p>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div v-if="selectedTarget" class="rounded-lg bg-surface-secondary px-4 py-4">
              <p class="text-sm font-bold text-text-main">{{ selectedTarget.productName }}</p>
              <p class="mt-2 text-xs text-text-sub">
                {{ selectedTarget.assetCode }} · {{ selectedTarget.category }}
              </p>
            </div>
            <div v-else class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-muted">
              응답할 자산을 선택해주세요.
            </div>

            <label class="flex items-start gap-3 text-sm font-semibold text-text-main">
              <input
                v-model="form.followUpRequests"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                :disabled="!canSubmit"
              >
              <span>
                후속 처리 필요
                <span class="mt-1 block text-xs font-normal text-text-sub">
                  자산 정보나 실제 상태가 다르면 선택해주세요.
                </span>
              </span>
            </label>

            <div>
              <label for="inspection-response-content" class="text-sm font-semibold text-text-main">
                응답 내용 <span class="text-primary">*</span>
              </label>
              <textarea
                id="inspection-response-content"
                v-model="form.responseContent"
                class="mt-2 min-h-40 w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-secondary disabled:text-text-muted"
                placeholder="예: 현재 사용 중이며 이상 없습니다."
                :disabled="!canSubmit"
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
              type="submit"
              class="w-full"
              :disabled="!isReady"
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
import { intangibleInspectionApi, tangibleInspectionApi } from '@/api/inspection.api'
import { ApiError } from '@/api/client'
import type { DropdownOption } from '@/types'
import type {
  EmployeeInspectionTargetResponse,
  InspectionStatus,
} from '@/types/inspection'

interface InspectionTargetRow {
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

const props = withDefaults(defineProps<{
  assetType?: 'tangible' | 'intangible'
}>(), {
  assetType: 'tangible',
})

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

const inspectionApi = computed(() => (
  props.assetType === 'intangible' ? intangibleInspectionApi : tangibleInspectionApi
))
const pageTitle = computed(() => (
  props.assetType === 'intangible' ? '내 무형자산 전수조사' : '내 유형자산 전수조사'
))
const emptyText = computed(() => loadError.value || '배정된 전수조사 대상이 없습니다.')
const canSubmit = computed(() => (
  Boolean(selectedTarget.value)
  && selectedTarget.value?.inspectionStatus === 'IN_PROGRESS'
  && !selectedTarget.value?.isResponded
))
const isReady = computed(() => (
  canSubmit.value && form.responseContent.trim().length > 0 && !isSubmitting.value
))

const respondedFilterOptions: DropdownOption[] = [
  { label: '전체', value: '' },
  { label: '응답 대기', value: 'false' },
  { label: '응답 완료', value: 'true' },
]

const inspectionStatusLabel: Record<InspectionStatus, string> = {
  READY: '진행 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CLOSED: '후속 처리 중',
}

const filteredTargets = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return targets.value.filter((target) => {
    const matchesResponded = !respondedFilter.value
      || String(target.isResponded) === respondedFilter.value
    const matchesKeyword = !query
      || [target.productName, target.assetCode, target.category]
        .some((value) => value.toLowerCase().includes(query))

    return matchesResponded && matchesKeyword
  })
})

function textValue(...values: unknown[]) {
  return values.find((value): value is string | number => (
    (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
  ))?.toString() ?? ''
}

function booleanValue(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'boolean')
  return typeof value === 'boolean' ? value : false
}

function inspectionStatusValue(value: unknown): InspectionStatus {
  if (value === 'READY' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'CLOSED') {
    return value
  }
  return 'READY'
}

function toTargetRow(item: EmployeeInspectionTargetResponse): InspectionTargetRow {
  return {
    inspectionTargetId: textValue(item.inspectionTargetId, item.inspection_target_id),
    inspectionId: textValue(item.inspectionId, item.inspection_id),
    inspectionStatus: inspectionStatusValue(item.inspectionStatus ?? item.inspection_status),
    productName: textValue(item.productName, item.product_name, item.itemName, item.item_name) || '-',
    assetCode: textValue(item.assetCode, item.asset_code, item.licenseCode, item.license_code) || '-',
    category: textValue(item.category, item.categoryName, item.category_name) || '-',
    isResponded: booleanValue(item.isResponded, item.is_responded, item.responded),
    startDate: textValue(item.startDate, item.start_date),
    endDate: textValue(item.endDate, item.end_date),
  }
}

function selectTarget(target: InspectionTargetRow) {
  selectedTarget.value = target
  form.responseContent = ''
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
    const initialTarget = targets.value.find((target) => !target.isResponded) ?? targets.value[0] ?? null
    if (initialTarget) {
      selectTarget(initialTarget)
    } else {
      selectedTarget.value = null
    }
  } catch {
    targets.value = []
    selectedTarget.value = null
    totalElements.value = 0
    loadError.value = '전수조사 대상을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!selectedTarget.value || !isReady.value) return

  isSubmitting.value = true
  message.value = ''

  try {
    await inspectionApi.value.createResponse(selectedTarget.value.inspectionId, {
      inspectionTargetId: selectedTarget.value.inspectionTargetId,
      responseContent: form.responseContent,
      followUpRequests: form.followUpRequests,
    })
    isSuccess.value = true
    message.value = '전수조사 응답이 등록되었습니다.'
    await loadTargets()
  } catch (error) {
    isSuccess.value = false
    message.value = error instanceof ApiError
      ? error.message
      : '전수조사 응답을 등록하지 못했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function statusBadgeClass(status: InspectionStatus) {
  if (status === 'IN_PROGRESS') return 'bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold'
  if (status === 'COMPLETED') return 'badge-success'
  return 'badge-warning'
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

onMounted(loadTargets)
</script>
