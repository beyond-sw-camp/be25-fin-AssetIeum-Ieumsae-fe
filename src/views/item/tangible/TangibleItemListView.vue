<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          Tangible Asset Item
        </p>
        <h1 class="page-title">
          유형자산 품목 관리
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
        <TangibleItemCategory
          :is-open="isCategoryDrawerOpen"
          :initial-categories="cascadingOptions"
          @close="isCategoryDrawerOpen = false"
          @update-categories="handleCategoryUpdate"
        />

        <Button variant="primary" @click="isRegisterDrawerOpen = true">
          <Plus :size="15" />
          자산 품목 등록
        </Button>
        <TangibleItemRegister
          :is-open="isRegisterDrawerOpen"
          :initial-categories="localCategories"
          @close="isRegisterDrawerOpen = false"
          @register-asset="handleRegisterAsset"
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
          <Dropdown v-model="itemEditForm.category" :options="categoryOptions" root-option="카테고리 선택" />
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
            class="w-36"
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
              {{ value === 1 ? '표준 자산' : '비표준 자산' }}
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
import { Edit, Plus, Upload, Layers, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-vue-next';
import { tangibleItemApi } from '@/api/asset.api'
import type { TangibleAssetItem, TangibleAssetItemCreateRequest } from '@/types'

import TangibleItemCategory from './TangibleItemCategory.vue';
import TangibleItemRegister from './TangibleItemRegister.vue';
import Input from '@/components/common/Input.vue';

interface Asset {
  assetItemId?: string
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
  stockCount?: number
  availableCount?: number
  assetCount?: number
}

interface ItemEditForm {
  assetName: string
  category: string
  modelName: string
  manufacturer: string
  isStandard: number
}

const createEmptyItemEditForm = (): ItemEditForm => ({
  assetName: '',
  category: '카테고리 선택',
  modelName: '',
  manufacturer: '',
  isStandard: 1
})

type TangibleItemResponse = TangibleAssetItem & Partial<Asset> & {
  categoryName?: string
}

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
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
const uploadInputRef = ref<HTMLInputElement | null>(null);

const searchParams = ref({
  companyId: '1',
  categoryName: '전체 품목 보기',
  categoryId: '',
  keyword: '',
  modelName: '',
  isStandard: 1,
  page: 0,
  size: 20
});

// 이중 드롭다운 레이아웃용 대분류-소분류 원본 상태 구조
const cascadingOptions = ref<CategoryGroup[]>([
  {
    mainCategory: 'IT / 전자기기',
    subCategories: ['IT / 전자기기 - 전체', '노트북', '모니터', '스마트폰', '태블릿', '주변기기']
  },
  {
    mainCategory: '사무용 가구',
    subCategories: ['사무용 가구 - 전체', '사무가구']
  },
  {
    mainCategory: '사무기기 / 가전',
    subCategories: ['사무기기 / 가전 - 전체', '사무기기']
  }
]);

// 자식 드로어(단일 1차원 리스트 규격)에 내려보내 주기 위한 computed 바인딩 데이터
const localCategories = computed(() => {
  const list: { id: string; name: string }[] = [];
  let index = 1;
  cascadingOptions.value.forEach(group => {
    group.subCategories.forEach(sub => {
      if (!sub.endsWith(' - 전체')) {
        list.push({ id: String(index++), name: sub });
      }
    });
  });
  return list;
});

const categoryOptions = computed(() => localCategories.value.map((category) => category.name));

const itemEditForm = ref<ItemEditForm>(createEmptyItemEditForm());

// [에러 해결 및 데이터 동기화 구현]
// 자식 컴포넌트(1차원 배열)의 변경사항을 부모의 계층형 대분류 구조(2차원 배열)에 맞게 안전하게 가공 처리합니다.
const handleCategoryUpdate = (updatedGroups: CategoryGroup[]) => {
  cascadingOptions.value = updatedGroups.map((group) => ({
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
  }));

  const flatCurrentCategories = cascadingOptions.value.flatMap((g) => g.subCategories);
  if (
    searchParams.value.categoryName !== '전체 품목 보기' &&
    !flatCurrentCategories.includes(searchParams.value.categoryName)
  ) {
    searchParams.value.categoryName = '전체 품목 보기';
  }

  handleSearch();
};

const handleRegisterAsset = async (newAsset: TangibleAssetItemCreateRequest) => {
  try {
    await tangibleItemApi.create(newAsset)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('품목 등록 중 오류가 발생했습니다.')
  }
};

const toItemEditForm = (row: Asset): ItemEditForm => ({
  assetName: row.assetName,
  category: row.category || '카테고리 선택',
  modelName: row.modelName,
  manufacturer: row.manufacturer,
  isStandard: row.isStandard,
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
  if (!selectedItem.value?.assetItemId || isSavingItem.value) return

  if (itemEditForm.value.category === '카테고리 선택') {
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
    await tangibleItemApi.update(selectedItem.value.assetItemId, {
      assetName: itemEditForm.value.assetName.trim(),
      name: itemEditForm.value.assetName.trim(),
      category: itemEditForm.value.category,
      manufacturer: itemEditForm.value.manufacturer.trim(),
      modelName: itemEditForm.value.modelName.trim(),
      isStandard: itemEditForm.value.isStandard,
    })
    await loadServerData()
    closeItemEdit()
  } catch (error) {
    console.error(error)
    alert('품목 수정 중 오류가 발생했습니다.')
  } finally {
    isSavingItem.value = false
  }
};

const handleUploadClick = () => {
  uploadInputRef.value?.click()
};

const handleUploadFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    await tangibleItemApi.bulkCreate(file);
    alert('업로드가 완료되었습니다.')
    handleSearch();
  } catch (error) {
    console.error(error);
    alert('업로드 중 오류가 발생했습니다.')
  } finally {
    target.value = '';
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

const toAssetRow = (item: TangibleItemResponse): Asset => ({
  ...item,
  assetName: item.assetName ?? item.name ?? '',
  category: item.category ?? item.categoryName ?? '',
  manufacturer: item.manufacturer ?? '',
  modelName: item.modelName ?? '',
  isStandard: item.isStandard ?? 1,
  assetCount: item.assetCount ?? item.stockCount ?? 0,
  stockCount: item.stockCount ?? item.assetCount ?? 0,
  availableCount: item.availableCount,
});

const loadServerData = async () => {
  isLoading.value = true;

  try {
    const params: { page: number; size: number; categoryName?: string; keyword?: string } = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    };

    if (searchParams.value.categoryName && searchParams.value.categoryName !== '전체 품목 보기') {
      params.categoryName = searchParams.value.categoryName;
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase();
    }

    const response = await tangibleItemApi.getList(params);

    serverAssetList.value = response.data.content.map((item) => toAssetRow(item));
    totalElements.value = response.data.totalElements;
    totalPages.value = response.data.totalPages;
  } catch (error) {
    console.error(error);
    serverAssetList.value = [];
    totalElements.value = 0;
    totalPages.value = 0;
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

onMounted(() => {
  loadServerData();
});
</script>
