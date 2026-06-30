<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">전수조사 > 내 후속처리</p>
        <h1 class="page-title">내 후속처리</h1>
        <p class="mt-2 text-sm text-text-sub">내가 담당자로 지정된 전수조사 후속처리를 확인합니다.</p>
      </div>
      <Button variant="secondary" :disabled="isLoading" @click="loadFollowUps">
        <RefreshCw :size="15" />
        새로고침
      </Button>
    </header>

    <main class="card relative z-10 mb-4 flex min-h-0 flex-1 flex-col overflow-visible border border-border">
      <div class="relative z-30 flex shrink-0 flex-col gap-3 rounded-t-2xl border-b border-border bg-surface px-2 pb-3 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <Dropdown
            :model-value="String(pageSize)"
            :options="pageSizeOptions"
            class="w-30"
            menu-strategy="fixed"
            @update:model-value="handlePageSizeChange"
          />
          <p class="whitespace-nowrap text-xs text-text-sub">
            총 {{ totalElements.toLocaleString() }}건 중 {{ rangeText }}
          </p>
        </div>
        <div class="flex gap-2">
          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            class="w-40!"
            menu-strategy="fixed"
            menu-align="right"
          />
          <Input
            id="my-follow-up-keyword"
            v-model="keyword"
            class="w-40!"
            placeholder="제품명, 자산코드 검색"
            @keyup.enter="handleSearch"
          />
          <Button class="shrink-0" @click="handleSearch">
            <Search :size="14" />
            검색
          </Button>
        </div>
      </div>

      <div class="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-surface p-3">
        <div
          v-if="loadError"
          class="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ loadError }}
        </div>

        <div v-if="isLoading" class="space-y-3">
          <div v-for="index in 3" :key="index" class="h-44 animate-pulse rounded-lg bg-surface-secondary" />
        </div>

        <InspectionFollowUpPanel
          v-else
          :rows="rows"
          :submitting-id="submittingFollowUpId"
          @refresh="loadFollowUps"
          @update-status="submitFollowUpStatus"
        />
      </div>

      <div
        v-if="totalElements > 0"
        class="relative z-20 flex shrink-0 items-center justify-center rounded-b-2xl border-t border-border bg-surface px-4 pt-3"
      >
        <Pagination
          :current-page="page"
          :total-pages="totalPages"
          :disabled="isLoading"
          @change="changePage"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RefreshCw, Search } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Pagination from '@/components/common/Pagination.vue'
import InspectionFollowUpPanel, {
  type InspectionFollowUpPanelRow,
} from '@/components/inspection/common/InspectionFollowUpPanel.vue'
import { inspectionFollowUpApi } from '@/api'
import { useNotificationStore } from '@/stores'
import type { DropdownOption } from '@/types'
import { getApiErrorMessage } from '@/utils/apiError'
import type {
  InspectionFollowUpSearchResponse,
  InspectionFollowUpStatus,
} from '@/types/inspection'

const followUps = ref<InspectionFollowUpSearchResponse[]>([])
const notificationStore = useNotificationStore()
const statusFilter = ref('')
const keyword = ref('')
const appliedKeyword = ref('')
const isLoading = ref(false)
const loadError = ref('')
const submittingFollowUpId = ref('')
const page = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

const pageSizeOptions: DropdownOption[] = [10, 20, 50].map((value) => ({
  label: `${value}개씩 보기`,
  value: String(value),
}))

const statusOptions: DropdownOption[] = [
  { label: '전체 상태', value: '' },
  { label: '처리 대기', value: 'PENDING' },
  { label: '처리 중', value: 'IN_PROGRESS' },
  { label: '처리 완료', value: 'COMPLETED' },
]

const rangeText = computed(() => {
  if (totalElements.value === 0) return '0-0건'
  const start = page.value * pageSize.value + 1
  const end = Math.min(start + followUps.value.length - 1, totalElements.value)
  return `${start}-${end}건`
})

const rows = computed<InspectionFollowUpPanelRow[]>(() => followUps.value.map((item, index) => {
  const followUpId = textValue(item.inspectionFollowUpId)
  return {
    key: followUpId || `follow-up-${index}`,
    followUpId,
    inspectionResultId: '',
    productName: textValue(item.productName) || '-',
    assetCode: textValue(item.assetCode) || '-',
    memberName: textValue(item.memberName) || '-',
    processorName: textValue(item.inspectorName) || '-',
    responseContent: textValue(item.responseContent),
    actionDetail: textValue(item.actionDetail),
    status: item.status,
  }
}))

function textValue(...values: unknown[]) {
  return values.find((value): value is string | number => (
    (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
  ))?.toString() ?? ''
}

async function loadFollowUps() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await inspectionFollowUpApi.getFollowUps({
      page: page.value,
      size: pageSize.value,
      status: isFollowUpStatus(statusFilter.value) ? statusFilter.value : undefined,
      keyword: appliedKeyword.value || undefined,
    })
    followUps.value = response.data.content
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    followUps.value = []
    totalElements.value = 0
    totalPages.value = 0
    loadError.value = getApiErrorMessage(error, '후속처리 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  appliedKeyword.value = keyword.value.trim()
  page.value = 0
  void loadFollowUps()
}

function handlePageSizeChange(value: string | number) {
  const nextSize = Number(value)
  if (!Number.isInteger(nextSize) || nextSize <= 0) return
  pageSize.value = nextSize
  page.value = 0
  void loadFollowUps()
}

function changePage(nextPage: number) {
  if (nextPage < 0 || nextPage >= totalPages.value || nextPage === page.value) return
  page.value = nextPage
  void loadFollowUps()
}

function isFollowUpStatus(value: string): value is InspectionFollowUpStatus {
  return value === 'PENDING' || value === 'IN_PROGRESS' || value === 'COMPLETED'
}

async function submitFollowUpStatus(
  row: InspectionFollowUpPanelRow,
  draft: { status: InspectionFollowUpStatus; actionDetail: string },
) {
  if (!row.followUpId) return
  submittingFollowUpId.value = row.followUpId
  loadError.value = ''

  try {
    await inspectionFollowUpApi.updateFollowUpStatus(row.followUpId, draft)
    await loadFollowUps()
    notificationStore.success('후속처리 상태가 변경되었습니다.')
  } catch (error) {
    loadError.value = getApiErrorMessage(error, '후속처리 상태를 변경하지 못했습니다.')
    notificationStore.error('후속처리 상태 변경 실패', loadError.value)
  } finally {
    submittingFollowUpId.value = ''
  }
}

watch(statusFilter, () => {
  page.value = 0
  void loadFollowUps()
})

onMounted(loadFollowUps)

</script>
