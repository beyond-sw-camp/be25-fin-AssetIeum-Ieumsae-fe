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
        <Button variant="outline">
          <Upload :size="15" />
          CSV 파일 등록
        </Button>

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
import { Edit, Plus, Upload, Layers, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-vue-next';
import { api } from '@/api/client'
import { tangibleItemApi } from '@/api/asset.api'

import TangibleItemCategory from './TangibleItemCategory.vue';
import TangibleItemRegister from './TangibleItemRegister.vue';
import Input from '@/components/common/Input.vue';

interface Asset {
  [key: string]: unknown
  assetItemId?: number
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
  stockCount?: number
  availableCount?: number
  assetCount?: number
}

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

// 드로어 열림/닫힘 상태 플래그
const isCategoryDrawerOpen = ref(false);
const isRegisterDrawerOpen = ref(false);

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기'];
const rowsPerPageText = ref('20개씩 보기');

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

const handleRegisterAsset = async (newAsset: Omit<Asset, 'id'>) => {
  try {
    await api.post<Asset>('/assets/tangible/items', newAsset)
    handleSearch()
  } catch (error) {
    console.error(error)
    alert('자산 등록 중 오류가 발생했습니다.')
  }
};

const canDeleteRow = (row: Asset) => {
  return (row.assetCount ?? 0) === 0
};

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
    alert('자산 삭제 중 오류가 발생했습니다.')
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
  { key: 'assetCount', label: '자산 수', align: 'center', width: '8%' },
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

const loadServerData = async () => {
  isLoading.value = true;

  try {
    const params: Record<string, unknown> = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    };

    if (searchParams.value.categoryName && searchParams.value.categoryName !== '전체 품목 보기') {
      params.categoryName = searchParams.value.categoryName;
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase();
    }

    const response = await api.get<{
      content: Asset[];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>('/assets/tangible/items', params);

    serverAssetList.value = response.data.content;
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
