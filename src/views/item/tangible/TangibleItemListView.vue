<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          유형자산 > 유형자산 품목 관리
        </p>
        <h1 class="page-title">
          유형자산 품목 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="primary" @click="isCategoryDrawerOpen = true">
          <Edit :size="15" />
          자산 카테고리 관리
        </Button>
        <TangibleItemCategory
          :is-open="isCategoryDrawerOpen"
          :initial-categories="cascadingOptions"
          @close="isCategoryDrawerOpen = false"
          @changed="handleCategoryChanged"
        />

        <Button variant="primary" @click="isRegisterDrawerOpen = true">
          <Plus :size="15" />
          자산 품목 등록
        </Button>
        <TangibleItemRegister
          :is-open="isRegisterDrawerOpen"
          :initial-categories="cascadingOptions"
          @close="isRegisterDrawerOpen = false"
          @registered="handleItemRegistered"
        />
      </div>
    </div>

    <BaseDrawer
      :is-open="isEditDrawerOpen"
      title="유형자산 품목 수정"
      @close="closeItemEdit"
    >
      <div v-if="selectedItem" class="space-y-5">
        <Input id="edit-assetName" v-model="itemEditForm.assetName" label="제품명" required placeholder="예: MacBook Pro 16인치" />

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

        <Input id="edit-manufacturer" v-model="itemEditForm.manufacturer" label="제조사" required placeholder="예: Apple, 삼성전자" />
        <Input id="edit-modelName" v-model="itemEditForm.modelName" label="모델명" required placeholder="예: A2992, SM-S928N" />

        <!-- 표준 품목 여부 -->
        <div>
          <label class="text-sm font-semibold text-text-main mb-3 block">
            표준 품목 여부 <span class="text-primary font-bold">*</span>
          </label>
          <div class="flex gap-8 mt-2">
            <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
              <div class="relative flex items-center justify-center">
                <input v-model="itemEditForm.isStandard" type="radio" :value="1" class="sr-only peer" />
                <div class="w-5 h-5 rounded-full border border-gray-300 bg-white peer-checked:border-primary transition-all duration-200 group-hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"></div>
                <div class="absolute w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out"></div>
              </div>
              <span>표준 자산</span>
            </label>

            <label class="flex items-center gap-2.5 text-sm text-text-main cursor-pointer select-none group">
              <div class="relative flex items-center justify-center">
                <input v-model="itemEditForm.isStandard" type="radio" :value="0" class="sr-only peer" />
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
          />
          <span class="text-xs text-text-sub whitespace-nowrap">
            총 {{ totalElements }}개 항목 중 {{ itemRangeText }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-text-main">
          <div class="min-w-40">
            <Dropdown
              v-model="searchParams.categoryName"
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
              placeholder="제품명, 제조사 등으로 검색"
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

      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-surface p-3 relative z-10">
        <Table
          :columns="tableColumns"
          :rows="serverAssetList"
          :loading="isLoading"
          row-key="assetItemId"
          class="min-w-full"
          @row-click="openItemEdit"
        >
          <template #cell-isStandard="{ value }">
            <span>
              {{ value === true || value === 1 ? '표준 자산' : '비표준 자산' }}
            </span>
          </template>
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
import { ref, computed, watch, onMounted } from 'vue';
import Button from '@/components/common/Button.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import Table, { type Column } from '@/components/common/Table.vue';
import BaseDrawer from '@/components/common/BaseDrawer.vue';
import { Edit, Plus, Layers, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-vue-next';
import { tangibleItemApi } from '@/api/asset.api'
import type { TangibleAssetItem, TangibleCategoryGroup } from '@/types'

import TangibleItemCategory from './TangibleItemCategory.vue';
import TangibleItemRegister from './TangibleItemRegister.vue';
import Input from '@/components/common/Input.vue';

interface Asset {
  assetItemId?: string
  categoryId?: string
  itemCode?: string
  productName?: string
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number | boolean
  stockCount?: number
  availableCount?: number
  assetCount?: number
}

interface ItemEditForm {
  assetName: string
  category: string
  categoryId: string
  modelName: string
  manufacturer: string
  isStandard: number
}

const createEmptyItemEditForm = (): ItemEditForm => ({
  assetName: '',
  category: '카테고리 선택',
  categoryId: '',
  modelName: '',
  manufacturer: '',
  isStandard: 1
})

type TangibleItemResponse = TangibleAssetItem & Partial<Asset> & {
  id?: string
  categoryName?: string
  categoryPath?: string
  mainCategoryName?: string
  subCategoryName?: string
  childCategoryName?: string
  tangibleAssetCategoryName?: string
  tangibleAssetCategoryId?: string
  tangibleAssetItemId?: string
  itemId?: string
  itemCode?: string
  productName?: string
  tangibleAssetCategory?: {
    id?: string
    categoryId?: string
    tangibleAssetCategoryId?: string
    name?: string
    categoryName?: string
  }
}

type CategoryGroup = TangibleCategoryGroup
const useMockData = import.meta.env.VITE_USE_MOCKS === 'true'

const toRadioValue = (value: number | boolean | undefined) => {
  if (typeof value === 'boolean') return value ? 1 : 0
  return value ?? 1
}

// 드로어 열림/닫힘 상태 플래그
const isCategoryDrawerOpen = ref(false);
const isRegisterDrawerOpen = ref(false);
const isEditDrawerOpen = ref(false);
const isSavingItem = ref(false);
const selectedItem = ref<Asset | null>(null);
const initialItemEditForm = ref<ItemEditForm>(createEmptyItemEditForm())

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기'];
const rowsPerPageText = ref('20개씩 보기');

const searchParams = ref({
  categoryName: '전체 품목 보기',
  categoryId: '',
  keyword: '',
  modelName: '',
  isStandard: 1,
  page: 0,
  size: 20
});

const DEFAULT_CASCADING_OPTIONS: CategoryGroup[] = [
  {
    mainCategory: 'IT / 전자기기',
    subCategories: [
      '노트북',
      '노트북 커버',
      '모니터',
      '스마트폰',
      '태블릿',
      '주변기기',
      '키보드',
      '마우스',
      '웹캠',
      '외장 저장장치',
    ],
    childCategories: {
      노트북: ['노트북 커버'],
      주변기기: ['키보드', '마우스', '웹캠', '외장 저장장치'],
    },
  },
  {
    mainCategory: '사무용 가구',
    subCategories: ['사무가구', '의자', '책상', '회의 테이블'],
    childCategories: {
      사무가구: ['의자', '책상', '회의 테이블'],
    },
  },
  {
    mainCategory: '사무기기 / 가전',
    subCategories: ['사무기기', '복합기', '라벨프린터'],
    childCategories: {
      사무기기: ['복합기', '라벨프린터'],
    },
  }
];

const cloneCategoryGroups = (groups: CategoryGroup[]): CategoryGroup[] => (
  groups.map((group) => ({
    ...(group.categoryId ? { categoryId: group.categoryId } : {}),
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
    ...(group.childCategories
      ? {
          childCategories: Object.fromEntries(
            Object.entries(group.childCategories).map(([key, values]) => [key, [...values]]),
          ),
        }
      : {}),
    ...(group.subCategoryIds
      ? { subCategoryIds: { ...group.subCategoryIds } }
      : {}),
    ...(group.childCategoryIds
      ? { childCategoryIds: { ...group.childCategoryIds } }
      : {}),
  }))
);

const cascadingOptions = ref<CategoryGroup[]>(
  useMockData ? cloneCategoryGroups(DEFAULT_CASCADING_OPTIONS) : [],
);

const itemEditForm = ref<ItemEditForm>(createEmptyItemEditForm());

const getSelectableSubCategories = (group: CategoryGroup) => (
  group.subCategories.filter((category) => !category.endsWith(' - 전체'))
);

const getCategoryFilterNames = () => {
  const selectedCategory = searchParams.value.categoryName;
  if (!selectedCategory || selectedCategory === '전체 품목 보기') return [];

  for (const group of cascadingOptions.value) {
    if (selectedCategory === group.mainCategory || selectedCategory === `${group.mainCategory} - 전체`) {
      return getSelectableSubCategories(group);
    }

    const childCategories = group.childCategories ?? {};
    if (childCategories[selectedCategory]) {
      return [selectedCategory, ...childCategories[selectedCategory]];
    }

    if (group.subCategories.includes(selectedCategory)) {
      return [selectedCategory];
    }
  }

  return [selectedCategory];
};

const categoryIdByName = (categoryName: string) => {
  if (!categoryName || categoryName === '카테고리 선택' || categoryName === '전체 품목 보기') return '';

  for (const group of cascadingOptions.value) {
    if (categoryName === group.mainCategory || categoryName === `${group.mainCategory} - 전체`) {
      return group.categoryId ?? '';
    }

    if (group.subCategoryIds?.[categoryName]) {
      return group.subCategoryIds[categoryName];
    }

    if (group.childCategoryIds?.[categoryName]) {
      return group.childCategoryIds[categoryName];
    }
  }

  return '';
};

const categoryNameById = (categoryId?: string) => {
  if (!categoryId) return '';

  for (const group of cascadingOptions.value) {
    if (group.categoryId === categoryId) return group.mainCategory;

    const subCategoryName = Object.entries(group.subCategoryIds ?? {})
      .find(([, id]) => id === categoryId)?.[0];
    if (subCategoryName) return subCategoryName;

    const childCategoryName = Object.entries(group.childCategoryIds ?? {})
      .find(([, id]) => id === categoryId)?.[0];
    if (childCategoryName) return childCategoryName;
  }

  return '';
};

const handleCategoryChanged = async () => {
  await loadCategories();
  handleSearch();
};

const handleItemRegistered = () => {
  handleSearch()
};

const toItemEditForm = (row: Asset): ItemEditForm => ({
  assetName: row.assetName,
  category: row.category || '카테고리 선택',
  categoryId: row.categoryId || categoryIdByName(row.category),
  modelName: row.modelName,
  manufacturer: row.manufacturer,
  isStandard: toRadioValue(row.isStandard),
});

const openItemEdit = (row: Asset) => {
  const form = toItemEditForm(row)

  selectedItem.value = row
  itemEditForm.value = { ...form }
  initialItemEditForm.value = { ...form }
  isEditDrawerOpen.value = true
};

const closeItemEdit = () => {
  isEditDrawerOpen.value = false
  selectedItem.value = null
  itemEditForm.value = createEmptyItemEditForm()
  initialItemEditForm.value = createEmptyItemEditForm()
};

const handleUpdateItem = async () => {
  if (isSavingItem.value) return

  const itemId = selectedItem.value?.assetItemId
  if (!itemId) {
    alert('수정할 품목 정보를 찾을 수 없습니다.')
    return
  }

  const categoryId = itemEditForm.value.categoryId || categoryIdByName(itemEditForm.value.category)

  if (itemEditForm.value.category === '카테고리 선택' || !categoryId) {
    alert('카테고리를 선택해주세요.')
    return
  }

  if (
    !itemEditForm.value.assetName.trim() ||
    !itemEditForm.value.manufacturer.trim() ||
    !itemEditForm.value.modelName.trim()
  ) {
    alert('필수 항목을 입력해주세요.')
    return
  }

  isSavingItem.value = true

  try {
    const initialForm = initialItemEditForm.value
    const trimmedProductName = itemEditForm.value.assetName.trim()
    const trimmedManufacturer = itemEditForm.value.manufacturer.trim()
    const trimmedModelName = itemEditForm.value.modelName.trim()
    const updatePayload = {
      ...(categoryId !== initialForm.categoryId ? { categoryId } : {}),
      ...(trimmedProductName !== initialForm.assetName.trim() ? { productName: trimmedProductName } : {}),
      ...(trimmedManufacturer !== initialForm.manufacturer.trim() ? { manufacturer: trimmedManufacturer } : {}),
      ...(trimmedModelName !== initialForm.modelName.trim() ? { modelName: trimmedModelName } : {}),
      ...(itemEditForm.value.isStandard !== initialForm.isStandard ? { isStandard: itemEditForm.value.isStandard } : {}),
    }

    await tangibleItemApi.update(itemId, {
      ...updatePayload,
    })
    await loadServerData()
    closeItemEdit()
  } catch (error) {
    console.error('유형자산 품목 수정 실패', error)
  } finally {
    isSavingItem.value = false
  }
};

const canDeleteRow = (row: Asset) => {
  return (row.assetCount ?? 0) === 0
};

const resetItemEditForm = () => {
  if (!isItemEditDirty.value || isSavingItem.value) return
  itemEditForm.value = { ...initialItemEditForm.value }
}

const handleDeleteAsset = async (row: Asset) => {
  if (!row.assetItemId) {
    alert('삭제할 품목 정보를 찾을 수 없습니다.')
    return
  }

  if (!confirm('선택한 품목을 삭제하시겠습니까?')) {
    return
  }

  try {
    await tangibleItemApi.delete(row.assetItemId)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('품목 삭제 중 오류가 발생했습니다.')
  }
};

const serverAssetList = ref<Asset[]>([]);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const listError = ref('');

const tableColumns: Column<Asset>[] = [
  { key: 'assetName', label: '제품명', align: 'center', width: '25%' },
  { key: 'category', label: '카테고리', align: 'center', width: '14%' },
  { key: 'manufacturer', label: '제조사', align: 'center', width: '14%' },
  { key: 'modelName', label: '모델명', align: 'center', width: '18%' },
  { key: 'assetCount', label: '자산 수', align: 'center', width: '10%' },
  { key: 'isStandard', label: '표준 품목 여부', align: 'center', width: '10%' },
  { key: 'action', label: '삭제', align: 'center', width: '10%' }
];

const handleSearch = () => {
  searchParams.value.page = 0;
  loadServerData();
};

const changePage = (targetPage: number) => {
  searchParams.value.page = targetPage;
  loadServerData();
};

type CategoryTreeNode = {
  categoryId?: string
  tangibleAssetCategoryId?: string
  id?: string
  name?: string
  categoryName?: string
  children?: CategoryTreeNode[]
  subCategories?: CategoryTreeNode[]
}

const categoryIdOf = (category: CategoryTreeNode) => (
  category.categoryId ?? category.tangibleAssetCategoryId ?? category.id ?? ''
)

const categoryNameOf = (category: CategoryTreeNode) => (
  category.name ?? category.categoryName ?? ''
)

const categoryChildrenOf = (category: CategoryTreeNode) => (
  category.children ?? category.subCategories ?? []
)

const toCategoryGroups = (categories: CategoryTreeNode[]): CategoryGroup[] => (
  categories
    .map((category) => {
      const mainCategory = categoryNameOf(category)
      const middleCategories = categoryChildrenOf(category)
      const childCategories: Record<string, string[]> = {}
      const subCategoryIds: Record<string, string> = {}
      const childCategoryIds: Record<string, string> = {}
      const subCategories: string[] = []

      for (const middleCategory of middleCategories) {
        const middleName = categoryNameOf(middleCategory)
        if (!middleName) continue

        subCategories.push(middleName)
        subCategoryIds[middleName] = categoryIdOf(middleCategory)

        const smallCategories = categoryChildrenOf(middleCategory)
          .map((smallCategory) => {
            const smallName = categoryNameOf(smallCategory)
            if (smallName) childCategoryIds[smallName] = categoryIdOf(smallCategory)
            return smallName
          })
          .filter((smallName) => smallName)

        if (smallCategories.length > 0) {
          childCategories[middleName] = smallCategories
          subCategories.push(...smallCategories)
        }
      }

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
    const response = await tangibleItemApi.getCategories()
    cascadingOptions.value = toCategoryGroups(response.data as CategoryTreeNode[])
  } catch {
    if (useMockData) return
    cascadingOptions.value = []
  }
}

const toAssetRow = (item: TangibleItemResponse): Asset => {
  const categoryId = item.categoryId
    ?? item.tangibleAssetCategoryId
    ?? item.tangibleAssetCategory?.categoryId
    ?? item.tangibleAssetCategory?.tangibleAssetCategoryId
    ?? item.tangibleAssetCategory?.id

  return {
    ...item,
    assetItemId: item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? item.id,
    categoryId,
    itemCode: item.itemCode,
    productName: item.productName,
    assetName: item.productName ?? item.assetName ?? item.name ?? item.itemCode ?? item.itemNo ?? '',
    category: item.category
    ?? item.categoryName
    ?? item.childCategoryName
    ?? item.subCategoryName
    ?? item.mainCategoryName
    ?? item.categoryPath
    ?? item.tangibleAssetCategoryName
    ?? item.tangibleAssetCategory?.name
    ?? item.tangibleAssetCategory?.categoryName
    ?? categoryNameById(categoryId)
    ?? '',
    manufacturer: item.manufacturer ?? '',
    modelName: item.modelName ?? '',
    isStandard: item.isStandard ?? true,
    assetCount: item.assetCount ?? item.stockCount ?? 0,
    stockCount: item.stockCount ?? item.assetCount ?? 0,
    availableCount: item.availableCount,
  }
};

const loadServerData = async () => {
  isLoading.value = true;

  try {
    const categoryFilterNames = getCategoryFilterNames();
    const shouldFilterClientSide = categoryFilterNames.length > 1;
    const selectedCategoryId = categoryIdByName(searchParams.value.categoryName);
    const params: {
      page: number
      size: number
      categoryId?: string
      categoryName?: string
      keyword?: string
    } = {
      page: shouldFilterClientSide ? 0 : searchParams.value.page,
      size: shouldFilterClientSide ? 999 : searchParams.value.size,
    };

    if (!shouldFilterClientSide && selectedCategoryId) {
      params.categoryId = selectedCategoryId;
    } else if (categoryFilterNames.length === 1) {
      params.categoryName = categoryFilterNames[0];
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase();
    }

    const response = await tangibleItemApi.getList(params);

    const rows = response.data.content.map((item) => toAssetRow(item));
    listError.value = '';

    if (shouldFilterClientSide) {
      const filteredRows = rows.filter((row) => categoryFilterNames.includes(row.category));
      const start = searchParams.value.page * searchParams.value.size;
      const end = start + searchParams.value.size;

      serverAssetList.value = filteredRows.slice(start, end);
      totalElements.value = filteredRows.length;
      totalPages.value = Math.ceil(filteredRows.length / searchParams.value.size);
      return;
    }

    serverAssetList.value = rows;
    totalElements.value = response.data.totalElements;
    totalPages.value = response.data.totalPages;
  } catch (error) {
    console.error('유형자산 품목 목록 조회 실패', error);
    listError.value = '';
  } finally {
    isLoading.value = false;
  }
};

const isItemEditDirty = computed(() => (
  JSON.stringify(itemEditForm.value) !== JSON.stringify(initialItemEditForm.value)
))

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0';
  const start = searchParams.value.page * searchParams.value.size + 1;
  const end = Math.min(start + searchParams.value.size, totalElements.value);
  return `${start}-${end}`;
});

watch(rowsPerPageText, (newVal) => {
  const matches = newVal.match(/\d+/);
  searchParams.value.size = matches ? parseInt(matches[0], 10) : 10;
  searchParams.value.page = 0;
  loadServerData();
});

watch(
  () => itemEditForm.value.category,
  (category) => {
    itemEditForm.value.categoryId = categoryIdByName(category)
  },
)

onMounted(async () => {
  await loadCategories();
  loadServerData();
});
</script>
