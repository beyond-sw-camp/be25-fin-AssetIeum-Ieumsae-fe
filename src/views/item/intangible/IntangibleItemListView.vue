<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          무형자산 > 무형자산 품목 관리
        </p>
        <h1 class="page-title">
          무형자산 품목 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :loading="isUploadingCsv" @click="handleUploadClick">
          <Upload :size="15" />
          CSV 파일 업로드
        </Button>
        <input
          ref="uploadInputRef"
          type="file"
          accept=".csv,text/csv"
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

    <BaseDrawer
      :is-open="isEditDrawerOpen"
      title="무형자산 품목 수정"
      @close="closeItemEdit"
    >
      <div v-if="selectedItem" class="space-y-5">
        <Input id="edit-productName" v-model="itemEditForm.productName" label="제품명" required placeholder="예: Adobe Creative Cloud" />

        <div>
          <label for="edit-category" class="text-sm font-semibold text-text-main mb-2 block">
            카테고리 <span class="text-primary font-bold">*</span>
          </label>
          <Dropdown
            v-model="itemEditForm.category"
            :options="cascadingOptions"
            root-option="카테고리 선택"
            submenu-direction="left"
          />
        </div>

        <div>
          <label for="edit-licenseType" class="text-sm font-semibold text-text-main mb-2 block">
            라이선스 유형 <span class="text-primary font-bold">*</span>
          </label>
          <Dropdown
            v-model="itemEditForm.licenseType"
            :options="licenseTypeOptions"
            root-option="라이선스 유형 선택"
          />
        </div>

        <Input id="edit-provider" v-model="itemEditForm.provider" label="제공사" required placeholder="예: Adobe, Microsoft" />

        <div>
          <label class="text-sm font-semibold text-text-main mb-3 block">
            표준 품목 여부 <span class="text-primary font-bold">*</span>
          </label>
          <div class="flex gap-8 mt-2">
            <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
              <div class="relative flex items-center justify-center">
                <input v-model="itemEditForm.isStandard" type="radio" :value="true" class="sr-only peer" />
                <div class="w-5 h-5 rounded-full border border-gray-300 bg-white peer-checked:border-primary transition-all duration-200 group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"></div>
                <div class="absolute w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out"></div>
              </div>
              <span>표준 자산</span>
            </label>

            <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
              <div class="relative flex items-center justify-center">
                <input v-model="itemEditForm.isStandard" type="radio" :value="false" class="sr-only peer" />
                <div class="w-5 h-5 rounded-full border border-gray-300 bg-white peer-checked:border-primary transition-all duration-200 group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"></div>
                <div class="absolute w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out"></div>
              </div>
              <span>비표준 자산</span>
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            variant="outline"
            class="flex-1"
            :disabled="!isItemEditDirty || isSavingItem"
            @click="resetItemEditForm"
          >
            초기화
          </Button>
          <Button
            class="flex-1"
            :disabled="!isItemEditDirty || isSavingItem"
            :loading="isSavingItem"
            @click="handleUpdateItem"
          >
            저장하기
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <!-- 테이블 -->
    <div class="card mb-4 flex-1 min-h-0 flex flex-col border border-border overflow-visible relative z-10">
      <div class="shrink-0 rounded-t-2xl bg-surface border-b border-border px-2 pb-3 flex flex-col gap-3 relative z-30 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2 text-text-main shrink-0">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
            class="w-30"
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
            </Dropdown>
          </div>

          <div>
            <Input
              id="keyword"
              v-model="searchParams.keyword"
              class="w-40!"
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

      <div
        v-if="listError"
        class="mx-3 mt-3 flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
      >
        <span>{{ listError }}</span>
        <Button variant="outline" size="sm" :loading="isLoading" @click="loadServerData">
          다시 시도
        </Button>
      </div>

      <!-- 테이블 -->
      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-surface p-3 relative z-10">
        <Table
          :columns="tableColumns"
          :rows="serverAssetList"
          :is-loading="isLoading"
          row-key="assetItemId"
          class="min-w-full"
          @row-click="openItemEdit"
        >
          <template #cell-licenseType="{ value }">
            <span>
              {{ licenseTypeLabel(value as string) }}
            </span>
          </template>

          <template #cell-isStandard="{ value }">
            <span>
              {{ value ? '표준 자산' : '비표준 자산' }}
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
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import { Edit, Plus, Upload, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-vue-next'
import { ApiError } from '@/api'
import { intangibleAssetApi, intangibleItemApi } from '@/api/asset.api'
import { useNotificationStore } from '@/stores'
import { createNormalizedCsvFile, normalizeCsvCell, parseCsvText, validateCsvShape } from '@/utils/csvImport'
import type { IntangibleAsset, IntangibleAssetItemCreateRequest, IntangibleAssetItemUpdateRequest, IntangibleItem, LicenseType } from '@/types'

import IntangibleItemCategory from '../../../components/item/intangible/IntangibleItemCategory.vue'
import IntangibleItemRegister from '../../../components/item/intangible/IntangibleItemRegister.vue'
import Input from '@/components/common/Input.vue'

interface SoftwareTypeGroup {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

interface CategoryTreeNode {
  categoryId?: string
  intangibleAssetCategoryId?: string
  id?: string
  name?: string
  categoryName?: string
  children?: CategoryTreeNode[]
  subCategories?: CategoryTreeNode[]
}

interface ItemEditForm {
  productName: string
  category: string
  categoryId: string
  licenseType: string
  provider: string
  isStandard: boolean
}

type IntangibleItemResponse = IntangibleItem & {
  intangibleAssetItemId?: string
  intangibleItemId?: string
  name?: string
  assetItemCount?: number
  intangibleAssetCount?: number
  totalAssetCount?: number
  assetTotalCount?: number
  count?: number
  intangibleAssetCategory?: {
    id?: string
    categoryId?: string
    intangibleAssetCategoryId?: string
    name?: string
    categoryName?: string
  }
  categoryName?: string
  categoryPath?: string
  mainCategoryName?: string
  subCategoryName?: string
  childCategoryName?: string
  stockCount?: number
  availableCount?: number
}

type IntangibleAssetCountSource = IntangibleAsset & {
  intangibleAssetId?: string
  intangibleItemId?: string
  intangibleAssetItemId?: string
  productName?: string
  itemName?: string
}

const createEmptyItemEditForm = (): ItemEditForm => ({
  productName: '',
  category: '카테고리 선택',
  categoryId: '',
  licenseType: '라이선스 유형 선택',
  provider: '',
  isStandard: true,
})

const licenseTypeOptions = ['구독형 (SaaS)', '영구 라이선스', '기간제 라이선스']
const licenseTypeValueByLabel: Record<string, LicenseType> = {
  '구독형 (SaaS)': 'SUBSCRIPTION',
  '영구 라이선스': 'PERPETUAL',
  '기간제 라이선스': 'TERM',
}
const licenseTypeLabelByValue: Record<string, string> = Object.fromEntries(
  Object.entries(licenseTypeValueByLabel).map(([label, value]) => [value, label]),
)

const INTANGIBLE_ITEM_IMPORT_HEADERS = [
  'categoryName',
  'productName',
  'provider',
  'licenseType',
  'isStandard',
]
const INTANGIBLE_ITEM_IMPORT_LICENSE_TYPES = new Set(['SUBSCRIPTION', 'PERPETUAL', 'TERM'])
const INTANGIBLE_ITEM_IMPORT_BOOLEAN_VALUES = new Set(['true', 'false'])

const licenseTypeLabel = (value?: string) => {
  if (!value) return '-'
  return licenseTypeLabelByValue[value] ?? value
}

const licenseTypeValue = (labelOrValue: string): LicenseType => (
  licenseTypeValueByLabel[labelOrValue]
    ?? (labelOrValue === 'SUBSCRIPTION' || labelOrValue === 'PERPETUAL' || labelOrValue === 'TERM'
      ? labelOrValue
      : 'SUBSCRIPTION')
)

const isCategoryDrawerOpen = ref(false)
const isRegisterDrawerOpen = ref(false)
const isEditDrawerOpen = ref(false)
const isSavingItem = ref(false)
const selectedItem = ref<IntangibleItem | null>(null)
const itemEditForm = ref<ItemEditForm>(createEmptyItemEditForm())
const initialItemEditForm = ref<ItemEditForm>(createEmptyItemEditForm())

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기']
const rowsPerPageText = ref('20개씩 보기')
const uploadInputRef = ref<HTMLInputElement | null>(null)
const isUploadingCsv = ref(false)
const notificationStore = useNotificationStore()

const searchParams = ref({
  category: '전체 품목 보기',
  keyword: '',
  page: 0,
  size: 20,
})

const cascadingOptions = ref<SoftwareTypeGroup[]>([])

const localCategories = computed(() => {
  return cascadingOptions.value.map((group) => ({
    ...(group.categoryId ? { categoryId: group.categoryId } : {}),
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
    childCategories: Object.fromEntries(
      Object.entries(group.childCategories ?? {}).map(([key, values]) => [key, [...values]]),
    ),
    subCategoryIds: { ...(group.subCategoryIds ?? {}) },
    childCategoryIds: { ...(group.childCategoryIds ?? {}) },
  }))
})

const handleCategoryUpdate = (updatedGroups: SoftwareTypeGroup[]) => {
  cascadingOptions.value = updatedGroups.map((group) => {
    const normalizedSubCategories = group.subCategories
      .map((sub) => sub.trim())
      .filter((sub) => sub)
    const childCategories = Object.fromEntries(
      Object.entries(group.childCategories ?? {}).map(([key, values]) => [
        key,
        values.map((value) => value.trim()).filter((value) => value),
      ]),
    )

    return {
      ...group,
      subCategories: normalizedSubCategories.filter((sub) => sub !== '전체 품목 보기'),
      childCategories,
      subCategoryIds: { ...(group.subCategoryIds ?? {}) },
      childCategoryIds: { ...(group.childCategoryIds ?? {}) },
    }
  })

  const flatCurrentCategories = cascadingOptions.value.flatMap((group) => [
    group.mainCategory,
    ...group.subCategories,
    ...Object.values(group.childCategories ?? {}).flat(),
  ])
  if (
    searchParams.value.category &&
    searchParams.value.category !== '전체 품목 보기' &&
    !flatCurrentCategories.includes(searchParams.value.category)
  ) {
    searchParams.value.category = '전체 품목 보기'
  }

  handleSearch()
}

const handleRegisterAsset = async (newAsset: IntangibleAssetItemCreateRequest) => {
  try {
    await intangibleItemApi.create(newAsset)
    alert('성공적으로 등록되었습니다.')
    isRegisterDrawerOpen.value = false
    handleSearch()
  } catch (error) {
    console.error('무형자산 품목 등록 실패', error)
    alert('자산 등록 중 오류가 발생했습니다.')
  }
}

const handleUploadClick = () => {
  if (isUploadingCsv.value) return
  uploadInputRef.value?.click()
}

const getLeafCategoryNames = () => {
  const names = new Set<string>()

  cascadingOptions.value.forEach((group) => {
    if (group.subCategories.length === 0) {
      names.add(group.mainCategory)
      return
    }

    group.subCategories.forEach((subCategory) => {
      const children = group.childCategories?.[subCategory] ?? []
      if (children.length > 0) {
        children.forEach((childCategory) => names.add(childCategory))
      } else {
        names.add(subCategory)
      }
    })
  })

  return names
}

const validateIntangibleItemCsv = async (file: File) => {
  const rows = parseCsvText(await file.text())
    .map((row) => row.map(normalizeCsvCell))
  const shapeError = validateCsvShape(rows, INTANGIBLE_ITEM_IMPORT_HEADERS, '무형자산 품목')
  if (shapeError) return { error: shapeError, file: null }

  const normalizedRows = rows.map((row, index) => {
    if (index === 0) return row

    return [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4].toLowerCase(),
    ]
  })

  const invalidValueRow = rows.slice(1).findIndex((row) => (
    row[0] === ''
      || row[1] === ''
      || row[2] === ''
      || !INTANGIBLE_ITEM_IMPORT_LICENSE_TYPES.has(row[3])
      || !INTANGIBLE_ITEM_IMPORT_BOOLEAN_VALUES.has(row[4].toLowerCase())
  ))

  if (invalidValueRow >= 0) {
    return {
      error: `${invalidValueRow + 2}번째 줄 값을 확인해주세요. licenseType은 SUBSCRIPTION, PERPETUAL, TERM 중 하나이고 isStandard는 true 또는 false여야 합니다.`,
      file: null,
    }
  }

  if (cascadingOptions.value.length === 0) {
    await loadCategories()
  }

  const leafCategoryNames = getLeafCategoryNames()
  if (leafCategoryNames.size === 0) {
    return {
      error: null,
      file: createNormalizedCsvFile(normalizedRows, file.name),
    }
  }

  const invalidCategories = Array.from(new Set(
    rows
      .slice(1)
      .map((row) => normalizeCsvCell(row[0] ?? ''))
      .filter((categoryName) => categoryName && !leafCategoryNames.has(categoryName)),
  ))

  if (invalidCategories.length > 0) {
    return {
      error: `categoryName은 현재 등록된 마지막 단계 카테고리명이어야 합니다. 확인 필요: ${invalidCategories.slice(0, 5).join(', ')}`,
      file: null,
    }
  }

  return {
    error: null,
    file: createNormalizedCsvFile(normalizedRows, file.name),
  }
}

const formatCsvUploadError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.errorCode
      ? `${error.message} (${error.errorCode})`
      : error.message
  }

  return error instanceof Error ? error.message : 'CSV 업로드 중 오류가 발생했습니다.'
}

const handleUploadFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.name.toLowerCase().endsWith('.csv')) {
    notificationStore.warning('CSV 파일만 업로드할 수 있습니다.', '파일 확장자를 확인해주세요.')
    input.value = ''
    return
  }

  isUploadingCsv.value = true

  try {
    const validation = await validateIntangibleItemCsv(file)
    if (validation.error) {
      notificationStore.warning('CSV 파일 형식을 확인해주세요.', validation.error)
      return
    }

    const response = await intangibleItemApi.importCsv(validation.file ?? file)
    notificationStore.success('무형자산 품목 일괄 등록 완료', `${response.data.length}건이 등록되었습니다.`)
    await loadCategories()
    handleSearch()
  } catch (error) {
    const message = formatCsvUploadError(error)
    console.error('무형자산 품목 CSV 업로드 실패', {
      error,
      ...(error instanceof ApiError
        ? { status: error.status, errorCode: error.errorCode, details: error.details }
        : {}),
    })
    notificationStore.error('무형자산 품목 일괄 등록 실패', message)
  } finally {
    isUploadingCsv.value = false
    input.value = ''
  }
}

const serverAssetList = ref<IntangibleItem[]>([])
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const listError = ref('')

const tableColumns: Column<IntangibleItem>[] = [
  { key: 'productName', label: '제품명', align: 'center', width: '25%', maxLines: 2 },
  { key: 'category', label: '카테고리', align: 'center', width: '12%' },
  { key: 'licenseType', label: '라이선스 유형', align: 'center', width: '12%' },
  { key: 'vendor', label: '제공사', align: 'center', width: '16%' },
  { key: 'assetCount', label: '자산 수', align: 'center', width: '10%' },
  { key: 'isStandard', label: '표준 품목 여부', align: 'center', width: '12%' },
  { key: 'action', label: '삭제', align: 'center', width: '13%' }
]

const itemIdOf = (row: IntangibleItem) => row.assetItemId ?? row.itemId ?? row.id ?? ''

const canDeleteRow = (row: IntangibleItem) => {
  return (row.assetCount ?? 0) === 0
}

const toItemEditForm = (row: IntangibleItem): ItemEditForm => ({
  productName: row.productName,
  category: row.category || categoryNameById(row.categoryId) || '카테고리 선택',
  categoryId: row.categoryId || categoryIdByName(row.category),
  licenseType: licenseTypeLabel(row.licenseType) === '-' ? '라이선스 유형 선택' : licenseTypeLabel(row.licenseType),
  provider: row.provider ?? row.vendor ?? '',
  isStandard: row.isStandard,
})

const openItemEdit = (row: IntangibleItem) => {
  const form = toItemEditForm(row)

  selectedItem.value = row
  itemEditForm.value = { ...form }
  initialItemEditForm.value = { ...form }
  isEditDrawerOpen.value = true
}

const closeItemEdit = () => {
  isEditDrawerOpen.value = false
  selectedItem.value = null
  itemEditForm.value = createEmptyItemEditForm()
  initialItemEditForm.value = createEmptyItemEditForm()
}

const resetItemEditForm = () => {
  if (!isItemEditDirty.value || isSavingItem.value) return
  itemEditForm.value = { ...initialItemEditForm.value }
}

const handleUpdateItem = async () => {
  if (isSavingItem.value) return

  const itemId = selectedItem.value ? itemIdOf(selectedItem.value) : ''
  if (!itemId) {
    console.error('무형자산 품목 수정에 필요한 품목 ID가 없습니다.', selectedItem.value)
    return
  }

  const categoryId = itemEditForm.value.categoryId || categoryIdByName(itemEditForm.value.category)
  if (itemEditForm.value.category === '카테고리 선택' || !categoryId) {
    console.error('무형자산 품목 수정에 필요한 카테고리 ID가 없습니다.', itemEditForm.value)
    return
  }

  if (
    !itemEditForm.value.productName.trim() ||
    !itemEditForm.value.provider.trim() ||
    itemEditForm.value.licenseType === '라이선스 유형 선택'
  ) {
    console.error('무형자산 품목 수정 필수값이 비어 있습니다.', itemEditForm.value)
    return
  }

  isSavingItem.value = true

  try {
    const initialForm = initialItemEditForm.value
    const trimmedProductName = itemEditForm.value.productName.trim()
    const trimmedProvider = itemEditForm.value.provider.trim()
    const currentLicenseType = licenseTypeValue(itemEditForm.value.licenseType)
    const initialLicenseType = licenseTypeValue(initialForm.licenseType)
    const updatePayload: IntangibleAssetItemUpdateRequest = {
      ...(categoryId !== initialForm.categoryId ? { categoryId } : {}),
      ...(trimmedProductName !== initialForm.productName.trim() ? { productName: trimmedProductName } : {}),
      ...(currentLicenseType !== initialLicenseType ? { licenseType: currentLicenseType } : {}),
      ...(trimmedProvider !== initialForm.provider.trim() ? { provider: trimmedProvider } : {}),
      ...(itemEditForm.value.isStandard !== initialForm.isStandard ? { isStandard: itemEditForm.value.isStandard } : {}),
    }

    await intangibleItemApi.update(itemId, updatePayload)
    await loadServerData()
    closeItemEdit()
  } catch (error) {
    console.error('무형자산 품목 수정 실패', error)
  } finally {
    isSavingItem.value = false
  }
}

const handleDeleteAsset = async (row: IntangibleItem) => {
  const itemId = itemIdOf(row)

  if (!itemId) {
    console.error('무형자산 품목 삭제에 필요한 품목 ID가 없습니다.', row)
    return
  }

  if (!confirm('선택한 품목을 삭제하시겠습니까?')) {
    return
  }

  try {
    await intangibleItemApi.delete(itemId)
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

const categoryIdOf = (category: CategoryTreeNode) => (
  category.categoryId ?? category.intangibleAssetCategoryId ?? category.id ?? ''
)

const categoryNameOf = (category: CategoryTreeNode) => (
  category.name ?? category.categoryName ?? ''
)

const categoryChildrenOf = (category: CategoryTreeNode) => (
  category.children ?? category.subCategories ?? []
)

const toCategoryGroups = (categories: CategoryTreeNode[]): SoftwareTypeGroup[] => (
  categories
    .map((category) => {
      const mainCategory = categoryNameOf(category)
      const children = categoryChildrenOf(category)
      const subCategories: string[] = []
      const childCategories: Record<string, string[]> = {}
      const subCategoryIds: Record<string, string> = {}
      const childCategoryIds: Record<string, string> = {}

      children.forEach((middleCategory) => {
        const middleName = categoryNameOf(middleCategory)
        if (!middleName) return

        subCategories.push(middleName)
        subCategoryIds[middleName] = categoryIdOf(middleCategory)

        const smallCategories = categoryChildrenOf(middleCategory)
          .map((childCategory) => {
            const childName = categoryNameOf(childCategory)
            const childId = categoryIdOf(childCategory)
            if (childName && childId) childCategoryIds[childName] = childId
            return childName
          })
          .filter(Boolean)

        if (smallCategories.length > 0) {
          childCategories[middleName] = smallCategories
          subCategories.push(...smallCategories)
        }
      })

      return {
        categoryId: categoryIdOf(category),
        mainCategory,
        subCategories,
        childCategories,
        subCategoryIds,
        childCategoryIds,
      }
    })
    .filter((category) => category.mainCategory)
)

const loadCategories = async () => {
  try {
    const response = await intangibleItemApi.getCategories()
    const categories = response.data

    if (Array.isArray(categories) && categories.every((category) => typeof category === 'string')) {
      cascadingOptions.value = categories
        .map((category) => category.trim())
        .filter(Boolean)
        .map((category) => ({
          mainCategory: category,
          subCategories: [],
          childCategories: {},
          subCategoryIds: {},
          childCategoryIds: {},
        }))
      return
    }

    cascadingOptions.value = toCategoryGroups(categories as CategoryTreeNode[])
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

    if (searchParams.value.category && searchParams.value.category !== '전체 품목 보기') {
      const selectedCategoryId = categoryIdByName(searchParams.value.category)
      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId
      }
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase()
    }

    const [response, assetCountMap] = await Promise.all([
      intangibleItemApi.getList(params),
      loadAssetCountMap(),
    ])
    const pageData = response.data
    console.log('무형자산 품목 목록 조회 성공', {
      status: response.status,
      content: pageData.content,
      assetCountMap: Object.fromEntries(assetCountMap),
    })
    listError.value = ''
    serverAssetList.value = pageData.content.map((item) => toItemRow(item as IntangibleItemResponse, assetCountMap))
    totalElements.value = pageData.totalElements
    totalPages.value = pageData.totalPages
  } catch (error) {
    console.error('무형자산 품목 목록 조회 실패', error)
    listError.value = ''
  } finally {
    isLoading.value = false
  }
}

const assetItemIdOf = (asset: IntangibleAssetCountSource) => (
  asset.assetItemId ?? asset.intangibleItemId ?? asset.intangibleAssetItemId ?? ''
)

const assetItemNameOf = (asset: IntangibleAssetCountSource) => (
  asset.assetItemName ?? asset.productName ?? asset.itemName ?? ''
)

const addAssetCount = (map: Map<string, number>, key: string | undefined | null) => {
  if (!key) return
  map.set(key, (map.get(key) ?? 0) + 1)
}

const loadAssetCountMap = async () => {
  const map = new Map<string, number>()

  try {
    const response = await intangibleAssetApi.getList({ page: 0, size: 999 })
    response.data.content.forEach((asset) => {
      const source = asset as IntangibleAssetCountSource
      addAssetCount(map, assetItemIdOf(source))
      addAssetCount(map, assetItemNameOf(source))
    })
  } catch (error) {
    console.warn('무형자산 목록 기반 자산 수 계산 실패', error)
  }

  return map
}

const categoryIdByName = (categoryName: string) => {
  if (!categoryName || categoryName === '전체 품목 보기') return ''

  for (const group of cascadingOptions.value) {
    if (categoryName === group.categoryId) {
      return group.categoryId ?? ''
    }

    if (categoryName === group.mainCategory) {
      return group.categoryId ?? ''
    }

    if (group.subCategoryIds?.[categoryName]) {
      return group.subCategoryIds[categoryName]
    }

    if (Object.values(group.subCategoryIds ?? {}).includes(categoryName)) {
      return categoryName
    }

    if (group.childCategoryIds?.[categoryName]) {
      return group.childCategoryIds[categoryName]
    }

    if (Object.values(group.childCategoryIds ?? {}).includes(categoryName)) {
      return categoryName
    }
  }

  return ''
}

const categoryNameById = (categoryId?: string) => {
  if (!categoryId) return ''

  for (const group of cascadingOptions.value) {
    if (group.categoryId === categoryId) return group.mainCategory

    const subCategoryName = Object.entries(group.subCategoryIds ?? {})
      .find(([, id]) => id === categoryId)?.[0]
    if (subCategoryName) return subCategoryName

    const childCategoryName = Object.entries(group.childCategoryIds ?? {})
      .find(([, id]) => id === categoryId)?.[0]
    if (childCategoryName) return childCategoryName
  }

  return ''
}

const numberValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }

  return 0
}

const toItemRow = (item: IntangibleItemResponse, assetCountMap = new Map<string, number>()): IntangibleItem => {
  const categoryId = item.categoryId
    ?? item.intangibleAssetCategoryId
    ?? item.intangibleAssetCategory?.categoryId
    ?? item.intangibleAssetCategory?.intangibleAssetCategoryId
    ?? item.intangibleAssetCategory?.id

  const assetItemId = item.assetItemId ?? item.intangibleAssetItemId ?? item.intangibleItemId ?? item.itemId ?? item.id
  const productName = item.productName ?? item.name ?? ''
  const responseAssetCount = numberValue(
    item.assetCount,
    item.stockCount,
    item.assetItemCount,
    item.intangibleAssetCount,
    item.totalAssetCount,
    item.assetTotalCount,
    item.count,
  )
  const calculatedAssetCount = Math.max(
    assetCountMap.get(assetItemId ?? '') ?? 0,
    assetCountMap.get(productName) ?? 0,
  )
  const assetCount = calculatedAssetCount > 0 ? calculatedAssetCount : responseAssetCount

  return {
    ...item,
    assetItemId,
    categoryId,
    productName,
    category: item.category
      ?? item.categoryName
      ?? item.childCategoryName
      ?? item.subCategoryName
      ?? item.mainCategoryName
      ?? item.categoryPath
      ?? item.intangibleAssetCategory?.name
      ?? item.intangibleAssetCategory?.categoryName
      ?? categoryNameById(categoryId)
      ?? '',
    licenseType: item.licenseType ?? '',
    vendor: item.provider ?? item.vendor ?? '',
    provider: item.provider ?? item.vendor ?? '',
    isStandard: item.isStandard ?? true,
    assetCount,
    stockCount: assetCount,
    availableCount: numberValue(item.availableCount),
  }
}

const isItemEditDirty = computed(() => (
  JSON.stringify(itemEditForm.value) !== JSON.stringify(initialItemEditForm.value)
))

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

watch(
  () => itemEditForm.value.category,
  (category) => {
    itemEditForm.value.categoryId = categoryIdByName(category)
  },
)

onMounted(async () => {
  await loadCategories()
  loadServerData()
})
</script>
