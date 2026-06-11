<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
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
        <Button variant="primary" @click="isRegisterDrawerOpen = true">
          <Plus :size="15" />
          자산 등록
        </Button>
        <TangibleAssetRegister
          :is-open="isRegisterDrawerOpen"
          :initial-items="assetItemOptions"
          :departments="departments"
          :members="members"
          @close="isRegisterDrawerOpen = false"
          @registered="handleAssetRegistered"
        />
      </div>
    </div>

    <TangibleAssetDetailView
      :is-open="isDetailDrawerOpen"
      :asset="selectedAsset"
      :departments="departments"
      :members="members"
      @close="closeAssetDetail"
      @saved="handleAssetSaved"
    />

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
              placeholder="제품명, 자산번호로 검색"
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
          row-key="assetId"
          class="min-w-full"
          @row-click="openAssetDetail"
        >
          <template #cell-status="{ value }">
            <span>{{ statusLabel(value as string) }}</span>
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
import { Plus, Layers, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';
import { tangibleAssetApi, tangibleItemApi } from '@/api/asset.api'
import { departmentApi } from '@/api/department.api'
import { memberApi } from '@/api/member.api'
import { TANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type {
  Department,
  Member,
  TangibleAsset,
  TangibleAssetItem,
  TangibleCategoryGroup,
} from '@/types'

import Input from '@/components/common/Input.vue';
import TangibleAssetDetailView from './TangibleAssetDetailView.vue';
import TangibleAssetRegister from './TangibleAssetRegister.vue';

interface AssetItemOption {
  id: string
  name: string
  category: string
  manufacturer: string
  modelName: string
}

type FilterGroup = TangibleCategoryGroup

interface TangibleAssetRow extends TangibleAsset {
  productName: string
  category: string
  manufacturer: string
  modelName: string
}

const useMockData = import.meta.env.VITE_USE_MOCKS === 'true';
const isRegisterDrawerOpen = ref(false);
const isDetailDrawerOpen = ref(false);
const selectedAsset = ref<TangibleAssetRow | null>(null);

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기'];
const rowsPerPageText = ref('20개씩 보기');

const searchParams = ref({
  categoryName: '전체 품목 보기',
  keyword: '',
  page: 0,
  size: 20
});

const assetItemOptions = ref<AssetItemOption[]>([]);
const departments = ref<Department[]>([]);
const members = ref<Member[]>([]);

const DEFAULT_CASCADING_OPTIONS: FilterGroup[] = [
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

const cloneCategoryGroups = (groups: FilterGroup[]): FilterGroup[] => (
  groups.map((group) => ({
    mainCategory: group.mainCategory,
    subCategories: [...group.subCategories],
    ...(group.childCategories
      ? {
          childCategories: Object.fromEntries(
            Object.entries(group.childCategories).map(([key, values]) => [key, [...values]]),
          ),
        }
      : {}),
  }))
);

const normalizeCategoryGroups = (groups: FilterGroup[]): FilterGroup[] => (
  groups.map((group) => {
    const subCategories = Array.from(new Set(
      group.subCategories.filter((category) => category && !category.endsWith(' - 전체')),
    ));

    return {
      mainCategory: group.mainCategory,
      subCategories,
      ...(group.childCategories
        ? {
            childCategories: Object.fromEntries(
              Object.entries(group.childCategories).map(([key, values]) => [key, Array.from(new Set(values))]),
            ),
          }
        : {}),
    };
  })
);

const cascadingOptions = ref<FilterGroup[]>(
  useMockData ? cloneCategoryGroups(DEFAULT_CASCADING_OPTIONS) : [],
);

const assetItemMap = computed(() => (
  new Map(assetItemOptions.value.map((item) => [item.id, item]))
));

const handleAssetRegistered = () => {
  handleSearch()
};

const openAssetDetail = async (row: TangibleAssetRow) => {
  selectedAsset.value = row
  isDetailDrawerOpen.value = true

  try {
    const response = await tangibleAssetApi.getDetail(row.assetId)
    selectedAsset.value = toAssetRow(response.data)
  } catch (error) {
    console.error(error)
  }
}

const closeAssetDetail = () => {
  isDetailDrawerOpen.value = false
  selectedAsset.value = null
}

const handleAssetSaved = () => {
  loadServerData()
};

const serverAssetList = ref<TangibleAssetRow[]>([]);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const listError = ref('');

const tableColumns: Column<TangibleAssetRow>[] = [
  { key: 'productName', label: '제품명', align: 'center', width: '25%' },
  { key: 'assetCode', label: '자산 번호', align: 'center', width: '20%' },
  { key: 'status', label: '자산 상태', align: 'center', width: '18%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '18%' },
  { key: 'assignedMemberName', label: '사용자', align: 'center', width: '19%' }
];

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '–'
  return TANGIBLE_STATUS_LABEL[status as keyof typeof TANGIBLE_STATUS_LABEL] ?? status
}

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : '유형자산 목록을 불러오지 못했습니다.'
)

const getSelectableSubCategories = (group: FilterGroup) => (
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

const handleSearch = () => {
  searchParams.value.page = 0;
  loadServerData();
};

const changePage = (targetPage: number) => {
  if (targetPage < 0 || targetPage >= totalPages.value) return
  searchParams.value.page = targetPage;
  loadServerData();
};

const toAssetItemOption = (item: TangibleAssetItem): AssetItemOption => ({
  id: item.assetItemId,
  name: item.name,
  category: item.category ?? '',
  manufacturer: item.manufacturer,
  modelName: item.modelName,
})

const toAssetRow = (asset: TangibleAsset): TangibleAssetRow => {
  const item = assetItemMap.value.get(asset.assetItemId)

  return {
    ...asset,
    productName: asset.assetItemName ?? item?.name ?? '',
    category: (asset as TangibleAsset & { category?: string }).category ?? item?.category ?? '',
    manufacturer: item?.manufacturer ?? '',
    modelName: item?.modelName ?? '',
  }
}

const buildCategoryGroupsFromItems = (items: AssetItemOption[]) => {
  const groups = useMockData ? cloneCategoryGroups(DEFAULT_CASCADING_OPTIONS) : [];
  const knownCategories = new Set(
    groups.flatMap((group) => group.subCategories.filter((category) => !category.endsWith(' - 전체'))),
  );
  const additionalCategories = Array.from(new Set(
    items
      .map((item) => item.category)
      .filter((category) => category && !knownCategories.has(category)),
  ));

  if (additionalCategories.length > 0) {
    groups.push({
      mainCategory: '기타',
      subCategories: additionalCategories,
    });
  }

  return groups;
};

const loadCategoryOptions = async () => {
  cascadingOptions.value = normalizeCategoryGroups(buildCategoryGroupsFromItems(assetItemOptions.value));
};

const loadReferenceData = async () => {
  try {
    const [departmentResponse, memberResponse] = await Promise.all([
      departmentApi.getList({ page: 0, size: 999 }),
      memberApi.getList({ page: 0, size: 999 }),
    ])

    departments.value = departmentResponse.data.content
    members.value = memberResponse.data.content
  } catch (error) {
    console.error(error)
    departments.value = []
    members.value = []
  }
}

const loadAssetItems = async () => {
  try {
    const response = await tangibleItemApi.getList({ page: 0, size: 100 })
    assetItemOptions.value = response.data.content.map(toAssetItemOption)
  } catch (error) {
    console.error(error)
    assetItemOptions.value = []
  }
}

const loadServerData = async () => {
  isLoading.value = true;

  try {
    const categoryFilterNames = getCategoryFilterNames();
    const shouldFilterClientSide = categoryFilterNames.length > 1;
    const params: { page: number; size: number; categoryName?: string; keyword?: string } = {
      page: shouldFilterClientSide ? 0 : searchParams.value.page,
      size: shouldFilterClientSide ? 999 : searchParams.value.size,
    };

    if (categoryFilterNames.length === 1) {
      params.categoryName = categoryFilterNames[0];
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim().toLowerCase();
    }

    const response = await tangibleAssetApi.getList(params);

    const rows = response.data.content.map(toAssetRow);
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
    listError.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
};

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0';
  const start = searchParams.value.page * searchParams.value.size + 1;
  const end = Math.min(start + searchParams.value.size - 1, totalElements.value);
  return `${start}-${end}`;
});

watch(rowsPerPageText, (newVal) => {
  const matches = newVal.match(/\d+/);
  searchParams.value.size = matches ? parseInt(matches[0], 10) : 10;
  searchParams.value.page = 0;
  loadServerData();
});

onMounted(async () => {
  await Promise.all([loadAssetItems(), loadReferenceData()]);
  await loadCategoryOptions();
  loadServerData();
});
</script>
