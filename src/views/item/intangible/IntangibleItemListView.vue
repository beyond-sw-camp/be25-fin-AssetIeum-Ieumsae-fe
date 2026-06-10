<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          Intangible Asset Item
        </p>
        <h1 class="page-title">
          무형자산 품목 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" @click="handleUploadClick">
          <Upload :size="15" />
          CSV 파일 업로드
        </Button>
        <input
          ref="uploadInputRef"
          type="file"
          accept=".csv,.xlsx"
          class="hidden"
          @change="handleUploadFile"
        />

        <Button variant="primary" @click="isCategoryDrawerOpen = true">
          <Edit :size="15" />
          자산 카테고리 수정
        </Button>
        <IntangibleItemCategory 
          :is-open="isCategoryDrawerOpen" 
          :initial-categories="localCategories"
          @close="isCategoryDrawerOpen = false" 
          @update-categories="handleCategoryUpdate"
        />
        
        <Button variant="primary" @click="isRegisterDrawerOpen = true">
          <Plus :size="15" />
          자산 품목 등록
        </Button>
        <IntangibleItemRegister 
          :is-open="isRegisterDrawerOpen" 
          :initial-categories="localCategories"
          @close="isRegisterDrawerOpen = false" 
          @register-asset="handleRegisterAsset"
        />
      </div>
    </div>

    <!-- 테이블 -->
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
          <div class="min-w-40">
            <Dropdown
              v-model="searchParams.category"
              :options="cascadingOptions"
              root-option="전체 품목 보기"
              menu-align="right"
              submenu-direction="left"
              class="w-44 text-text-sub"
            >
              <template #icon>
                <Layers :size="16" />
              </template>
            </Dropdown>
          </div>

          <div>
            <Input
              id="keyword"
              v-model="searchParams.keyword"
              placeholder="제품명, 제공사 등으로 검색"
              autocomplete="off"
              @keyup.enter="handleSearch"
            />
          </div>

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

      <!-- 테이블 -->
      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-surface p-3 relative z-10">
        <Table
          :columns="tableColumns"
          :rows="serverAssetList"
          :is-loading="isLoading"
          row-key="assetItemId"
          class="min-w-full"
        >
          <template #cell-isStandard="{ value }">
            <span>
              {{ value === 1 ? '표준 자산' : '비표준 자산' }}
            </span>
          </template>

          <!-- 무형자산 품목의 삭제 기준 = 무형자산의 수 == 0 -->
          <template #cell-action="{ row }">
            <Button
              variant="danger"
              size="sm"
              class="whitespace-nowrap gap-1"
              :disabled="!canDeleteRow(row)"
              @click.stop="handleDeleteAsset(row)"
            >
              <Trash2 :size="14" />
              <span class="hidden md:inline">삭제</span>
            </Button>
          </template>
        </Table>
      </div>

      <!-- 페이징 -->
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
import { Edit, Plus, Upload, Layers, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-vue-next'
import { intangibleItemApi } from '@/api/asset.api'
import type { IntangibleItem } from '@/types'

import IntangibleItemCategory from './IntangibleItemCategory.vue'
import IntangibleItemRegister from './IntangibleItemRegister.vue'
import Input from '@/components/common/Input.vue'

interface SoftwareTypeGroup {
  mainCategory: string
  subCategories: string[]
}

const isCategoryDrawerOpen = ref(false)
const isRegisterDrawerOpen = ref(false)

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기']
const rowsPerPageText = ref('20개씩 보기')
const uploadInputRef = ref<HTMLInputElement | null>(null)

const searchParams = ref({
  category: '전체 품목 타입',
  keyword: '',
  page: 0,
  size: 20,
})

const cascadingOptions = ref<SoftwareTypeGroup[]>([
  {
    mainCategory: '전체 품목 타입',
    subCategories: ['전체 품목 타입', '업무용', '디자인', '개발툴', '보안', '협업'],
  },
])

const localCategories = computed(() => {
  return cascadingOptions.value.map((group) => ({
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
  }))
})

const handleCategoryUpdate = (updatedGroups: SoftwareTypeGroup[]) => {
  cascadingOptions.value = updatedGroups.map((group, index) => {
    const normalizedSubCategories = group.subCategories
      .map((sub) => sub.trim())
      .filter((sub) => sub)

    if (index === 0 && !normalizedSubCategories.some((sub) => sub.startsWith('전체'))) {
      return {
        ...group,
        subCategories: ['전체 품목 타입', ...normalizedSubCategories.filter((sub) => sub !== '전체 품목 타입')],
      }
    }

    return {
      ...group,
      subCategories: normalizedSubCategories,
    }
  })

  const flatCurrentCategories = cascadingOptions.value.flatMap((g) => g.subCategories)
  if (
    searchParams.value.category &&
    searchParams.value.category !== '전체 품목 타입' &&
    !flatCurrentCategories.includes(searchParams.value.category)
  ) {
    searchParams.value.category = '전체 품목 타입'
  }

  handleSearch()
}

const handleRegisterAsset = async (newAsset: Omit<IntangibleItem, 'assetItemId'>) => {
  try {
    await intangibleItemApi.create(newAsset)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('자산 등록 중 오류가 발생했습니다.')
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
    await intangibleItemApi.bulkCreate(file)
    alert('업로드가 완료되었습니다.')
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('업로드 중 오류가 발생했습니다.')
  } finally {
    target.value = ''
  }
}

const serverAssetList = ref<IntangibleItem[]>([])
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)

const tableColumns: Column<IntangibleItem>[] = [
  { key: 'productName', label: '제품명', align: 'center', width: '25%' },
  { key: 'category', label: '카테고리', align: 'center', width: '12%' },
  { key: 'licenseType', label: '라이선스 유형', align: 'center', width: '12%' },
  { key: 'vendor', label: '제공사', align: 'center', width: '16%' },
  { key: 'assetCount', label: '자산 수', align: 'center', width: '10%' },
  { key: 'isStandard', label: '표준 품목 여부', align: 'center', width: '12%' },
  { key: 'action', label: '삭제', align: 'center', width: '13%' }
]

const canDeleteRow = (row: IntangibleItem) => {
  return (row.assetCount ?? 0) === 0
}

const handleDeleteAsset = async (row: IntangibleItem) => {
  if (!row.assetItemId) {
    alert('삭제할 품목 정보를 찾을 수 없습니다.')
    return
  }

  if (!confirm('선택한 품목을 삭제하시겠습니까?')) {
    return
  }

  try {
    await intangibleItemApi.delete(row.assetItemId)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('자산 삭제 중 오류가 발생했습니다.')
  }
}

const handleSearch = () => {
  searchParams.value.page = 0
  loadServerData()
}

const changePage = (targetPage: number) => {
  searchParams.value.page = targetPage
  loadServerData()
}

const loadCategories = async () => {
  try {
    const response = await intangibleItemApi.getCategories()
    const types = response.data

    cascadingOptions.value = [
      {
        mainCategory: '품목 타입',
        subCategories: ['전체 품목 타입', ...types],
      },
    ]
  } catch (error) {
    console.error(error)
  }
}

const loadServerData = async () => {
  isLoading.value = true

  try {
    const params: Record<string, unknown> = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    }

    if (searchParams.value.category && searchParams.value.category !== '전체 품목 타입') {
      params.category = searchParams.value.category
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase()
    }

    const response = await intangibleItemApi.getList(params)
    const pageData = response.data
    serverAssetList.value = pageData.content
    totalElements.value = pageData.totalElements
    totalPages.value = pageData.totalPages
  } catch (error) {
    console.error(error)
    serverAssetList.value = []
    totalElements.value = 0
    totalPages.value = 0
  } finally {
    isLoading.value = false
  }
}

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0'
  const start = searchParams.value.page * searchParams.value.size + 1
  const end = Math.min(start + searchParams.value.size, totalElements.value)
  return `${start}-${end}`
})

watch(rowsPerPageText, (newVal) => {
  const matches = newVal.match(/\d+/)
  searchParams.value.size = matches ? parseInt(matches[0], 10) : 10
  searchParams.value.page = 0
  loadServerData()
})

onMounted(() => {
  loadCategories()
  loadServerData()
})
</script>
