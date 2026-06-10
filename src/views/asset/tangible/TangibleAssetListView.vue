<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          유형자산 > 유형자산 관리
        </p>
        <h1 class="page-title">
          유형자산 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" @click="handleUploadClick">
          <Upload :size="15" />
          <span class="hidden sm:inline">CSV 파일 업로드</span>
        </Button>
        <input
          ref="uploadInputRef"
          type="file"
          accept=".csv,.xlsx"
          class="hidden"
          @change="handleUploadFile"
        />

        <Button variant="primary" @click="handleSearch">
          <Search :size="15" />
          조회하기
        </Button>
      </div>
    </div>

    <div class="card mb-4 flex-1 min-h-0 flex flex-col border border-border overflow-visible relative z-10">
      <div class="shrink-0 rounded-t-2xl bg-surface border-b border-border px-2 pb-3 flex flex-col gap-3 relative z-30 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2 text-text-main shrink-0">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
            class="w-36"
          />
          <span class="text-xs text-text-sub whitespace-nowrap">
            총 {{ totalElements }}개 항목 중 {{ itemRangeText }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-text-main">
          <Input
            id="keyword"
            v-model="searchParams.keyword"
            placeholder="자산코드, 시리얼번호, 품목명으로 검색"
            autocomplete="off"
            @keyup.enter="handleSearch"
          />

          <Button
            variant="primary"
            size="md"
            class="shrink-0"
            @click="handleSearch"
          >
            <Search :size="14" />
            조회하기
          </Button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-surface p-3 relative z-10">
        <Table
          :columns="tableColumns"
          :rows="serverAssetList"
          :loading="isLoading"
          row-key="assetId"
          class="min-w-full"
        >
          <template #cell-status="{ value }">
            <span>{{ statusLabel(value as string) }}</span>
          </template>

          <template #cell-action="{ row }">
            <Button
              variant="danger"
              size="sm"
              class="flex items-center gap-2"
              :disabled="row.status === 'DISCARDED'"
              @click.stop="handleDiscardAsset(row)"
            >
              <Trash2 :size="14" />
              <span class="hidden sm:inline">폐기</span>
            </Button>
          </template>
        </Table>
      </div>

      <div class="shrink-0 rounded-b-2xl border-t border-border bg-surface px-4 pt-3 flex items-center justify-center relative z-20">
        <div class="flex items-center gap-2">
          <button
            :disabled="searchParams.page === 0"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            @click="changePage(searchParams.page - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="pageIndex in totalPages"
            :key="pageIndex"
            type="button"
            :class="[
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
              searchParams.page === (pageIndex - 1)
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'text-text-sub hover:bg-surface-secondary'
            ]"
            @click="changePage(pageIndex - 1)"
          >
            {{ pageIndex }}
          </button>

          <button
            :disabled="searchParams.page >= totalPages - 1"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            @click="changePage(searchParams.page + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import Input from '@/components/common/Input.vue'
import { Upload, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-vue-next'
import { tangibleAssetApi } from '@/api/asset.api'
import { TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { TangibleAsset } from '@/types'

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기', '100개씩 보기']
const rowsPerPageText = ref('20개씩 보기')
const uploadInputRef = ref<HTMLInputElement | null>(null)

const searchParams = ref({
  keyword: '',
  page: 0,
  size: 20,
})

const serverAssetList = ref<TangibleAsset[]>([])
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)

const tableColumns: Column<TangibleAsset>[] = [
  { key: 'productName', label: '제품명', align: 'center', width: '18%' },
  { key: 'assetCode', label: '자산 코드', align: 'center', width: '13%' },
  { key: 'departmentName', label: '부서명', align: 'center', width: '13%' },
  { key: 'currentUserName', label: '사용자', align: 'center', width: '13%' },
  { key: 'currentUserMemberNo', label: '사번', align: 'center', width: '13%' },
  { key: 'tangibleAssetStatus', label: '자산 상태', align: 'center', width: '13%' }
]

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '–'
  return TANGIBLE_STATUS_LABEL[status as keyof typeof TANGIBLE_STATUS_LABEL] ?? status
}

const handleSearch = () => {
  searchParams.value.page = 0
  loadServerData()
}

const changePage = (targetPage: number) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  searchParams.value.page = targetPage
  loadServerData()
}

const loadServerData = async () => {
  isLoading.value = true

  try {
    const params: Record<string, unknown> = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase()
    }

    const response = await tangibleAssetApi.getList(params)

    serverAssetList.value = response.data.content
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error(error)
    serverAssetList.value = []
    totalElements.value = 0
    totalPages.value = 0
  } finally {
    isLoading.value = false
  }
}

const handleUploadClick = () => {
  uploadInputRef.value?.click()
}

const handleUploadFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    await tangibleAssetApi.bulkCreate(file)
    alert('업로드가 완료되었습니다.')
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('업로드 중 오류가 발생했습니다.')
  } finally {
    target.value = ''
  }
}

const handleDiscardAsset = async (row: TangibleAsset) => {
  if (!row.assetId) return

  if (!confirm('선택한 자산을 폐기 처리하시겠습니까?')) {
    return
  }

  try {
    await tangibleAssetApi.discard(row.assetId)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('자산 폐기 중 오류가 발생했습니다.')
  }
}

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0'
  const start = searchParams.value.page * searchParams.value.size + 1
  const end = Math.min(start + searchParams.value.size - 1, totalElements.value)
  return `${start}-${end}`
})

watch(rowsPerPageText, (newVal) => {
  const matches = newVal.match(/\d+/)
  searchParams.value.size = matches ? parseInt(matches[0], 10) : 20
  searchParams.value.page = 0
  loadServerData()
})

onMounted(() => {
  loadServerData()
})
</script>