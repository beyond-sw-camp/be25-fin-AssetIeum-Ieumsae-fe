<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">INSPECTION</p>
        <h1 class="page-title">내 후속처리</h1>
        <p class="mt-2 text-sm text-text-sub">내가 담당자로 지정된 전수조사 후속처리를 확인합니다.</p>
      </div>
      <Button variant="secondary" :disabled="isLoading" @click="loadFollowUps">
        <RefreshCw :size="15" />
        새로고침
      </Button>
    </header>

    <main class="mx-3 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p class="text-xs text-text-sub">총 {{ filteredRows.length.toLocaleString() }}건</p>
        <div class="flex gap-2">
          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            class="w-36"
            menu-strategy="fixed"
            menu-align="right"
          />
          <Input
            id="my-follow-up-keyword"
            v-model="keyword"
            class="w-56"
            placeholder="제품명, 자산코드 검색"
          />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
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
          :rows="filteredRows"
          :submitting-id="submittingFollowUpId"
          @refresh="loadFollowUps"
          @update-status="submitFollowUpStatus"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import InspectionFollowUpPanel, {
  type InspectionFollowUpPanelRow,
} from '@/components/inspection/common/InspectionFollowUpPanel.vue'
import { inspectionFollowUpApi } from '@/api'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores'
import type { DropdownOption } from '@/types'
import type {
  InspectionFollowUpResponse,
  InspectionFollowUpStatus,
} from '@/types/inspection'

const followUps = ref<InspectionFollowUpResponse[]>([])
const statusFilter = ref('')
const keyword = ref('')
const isLoading = ref(false)
const loadError = ref('')
const submittingFollowUpId = ref('')
const authStore = useAuthStore()

const statusOptions: DropdownOption[] = [
  { label: '전체 상태', value: '' },
  { label: '처리 대기', value: 'PENDING' },
  { label: '처리 중', value: 'IN_PROGRESS' },
  { label: '처리 완료', value: 'COMPLETED' },
]

const rows = computed<InspectionFollowUpPanelRow[]>(() => followUps.value.map((item, index) => {
  const followUpId = textValue(item.followUpId, item.inspectionFollowUpId)
  return {
    key: followUpId || `follow-up-${index}`,
    followUpId,
    inspectionResultId: textValue(item.inspectionResultId),
    productName: textValue(item.productName) || '-',
    assetCode: textValue(item.assetCode) || '-',
    memberName: textValue(item.memberName) || '-',
    processorName: textValue(item.processorName) || '-',
    responseContent: textValue(item.responseContent),
    actionDetail: textValue(item.actionDetail),
    status: followUpStatusValue(item.status ?? item.followUpStatus ?? item.inspectionFollowUpStatus),
  }
}))

const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value
    const matchesKeyword = !query || [row.productName, row.assetCode, row.memberName]
      .some((value) => value.toLowerCase().includes(query))
    return matchesStatus && matchesKeyword
  })
})

function textValue(...values: unknown[]) {
  return values.find((value): value is string | number => (
    (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
  ))?.toString() ?? ''
}

function followUpStatusValue(value: unknown): InspectionFollowUpStatus {
  if (value === 'PENDING' || value === 'IN_PROGRESS' || value === 'COMPLETED') return value
  return 'PENDING'
}

async function loadFollowUps() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await inspectionFollowUpApi.getMyFollowUps({ page: 0, size: 1000 })
    const currentMemberId = textValue(authStore.user?.memberId)
    followUps.value = currentMemberId
      ? response.data.content.filter((item) => (
        textValue(item.processorId) === currentMemberId
      ))
      : []
  } catch (error) {
    followUps.value = []
    loadError.value = error instanceof ApiError
      ? error.message
      : '후속처리 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
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
  } catch (error) {
    loadError.value = error instanceof ApiError
      ? error.message
      : '후속처리 상태를 변경하지 못했습니다.'
  } finally {
    submittingFollowUpId.value = ''
  }
}

onMounted(loadFollowUps)

</script>
