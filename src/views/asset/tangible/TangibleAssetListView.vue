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
        <Button v-if="canRegisterAsset" variant="primary" @click="openRegisterDrawer">
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
import TangibleAssetDetailView from '../../../components/asset/tangible/TangibleAssetDetailView.vue';
import TangibleAssetRegister from '../../../components/asset/tangible/TangibleAssetRegister.vue';
import { usePermission } from '@/composables/usePermission.ts';

interface AssetItemOption {
  id: string
  name: string
  category: string
  categoryId: string
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

const isRegisterDrawerOpen = ref(false);
const isDetailDrawerOpen = ref(false);
const selectedAsset = ref<TangibleAssetRow | null>(null);
const isReferenceDataLoaded = ref(false)
const referenceDataPromise = ref<Promise<void> | null>(null)
const { canRegisterAsset } = usePermission()

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
const assetIdByAssetCode = ref<Record<string, string>>({});
const ASSET_ID_STORAGE_PREFIX = 'tangibleAssetId:'

const normalizeCategoryGroups = (groups: FilterGroup[]): FilterGroup[] => (
  groups.map((group) => {
    const subCategories = Array.from(new Set(
      group.subCategories.filter((category) => category && !category.endsWith(' - 전체')),
    ));

    return {
      ...(group.categoryId ? { categoryId: group.categoryId } : {}),
      mainCategory: group.mainCategory,
      subCategories,
      ...(group.childCategories
        ? {
            childCategories: Object.fromEntries(
              Object.entries(group.childCategories).map(([key, values]) => [key, Array.from(new Set(values))]),
            ),
          }
        : {}),
      ...(group.subCategoryIds ? { subCategoryIds: { ...group.subCategoryIds } } : {}),
      ...(group.childCategoryIds ? { childCategoryIds: { ...group.childCategoryIds } } : {}),
    };
  })
);

const cascadingOptions = ref<FilterGroup[]>([]);

const assetItemMap = computed(() => (
  new Map(assetItemOptions.value.map((item) => [item.id, item]))
));

const handleAssetRegistered = (asset: TangibleAsset) => {
  const assetId = getAssetId(asset)
  if (asset.assetCode && assetId) {
    assetIdByAssetCode.value = {
      ...assetIdByAssetCode.value,
      [asset.assetCode]: assetId,
    }
    localStorage.setItem(`${ASSET_ID_STORAGE_PREFIX}${asset.assetCode}`, assetId)
  }

  handleSearch()
};

const openRegisterDrawer = () => {
  isRegisterDrawerOpen.value = true
  void loadReferenceData()
}

const openAssetDetail = async (row: TangibleAssetRow) => {
  const assetId = getAssetId(row)
  selectedAsset.value = { ...row, assetId }
  isDetailDrawerOpen.value = true
  void loadReferenceData()

  if (!assetId) {
    const responseKeys = Object.keys(row).join(', ')
    console.warn('유형자산 상세 조회에 필요한 자산 UUID가 없습니다.', {
      row,
      responseKeys,
    })
    return
  }

  try {
    const response = await tangibleAssetApi.getDetail(assetId)
    const detailRow = toAssetRow(response.data)
    selectedAsset.value = {
      ...detailRow,
      assetId: detailRow.assetId || assetId,
      tangibleAssetId: detailRow.tangibleAssetId || assetId,
    }
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

const getSelectedCategoryId = () => {
  const selectedCategory = searchParams.value.categoryName
  if (!selectedCategory || selectedCategory === '전체 품목 보기') return undefined

  return categoryIdByName(selectedCategory) || undefined
}

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
  id: item.assetItemId ?? item.tangibleAssetItemId ?? item.itemId ?? '',
  name: item.productName ?? item.name ?? item.itemNo ?? '',
  category: item.categoryName ?? item.category ?? '',
  categoryId: item.categoryId ?? '',
  manufacturer: item.manufacturer,
  modelName: item.modelName,
})

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

const toCategoryGroups = (categories: CategoryTreeNode[]): FilterGroup[] => (
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

const categoryIdByName = (categoryName: string) => {
  if (!categoryName || categoryName === '전체 품목 보기') return ''

  for (const group of cascadingOptions.value) {
    if (categoryName === group.mainCategory || categoryName === `${group.mainCategory} - 전체`) {
      return group.categoryId ?? ''
    }

    if (group.subCategoryIds?.[categoryName]) {
      return group.subCategoryIds[categoryName]
    }

    if (group.childCategoryIds?.[categoryName]) {
      return group.childCategoryIds[categoryName]
    }
  }

  return ''
}

type AssetResponseAliases = TangibleAsset & {
  memberName?: string | null
  locationName?: string | null
  member?: Partial<Member> | null
  user?: Partial<Member> | null
  department?: Partial<Department> | null
  asset?: Record<string, unknown> | null
  tangibleAsset?: Record<string, unknown> | null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: unknown): value is string => (
  typeof value === 'string' && UUID_PATTERN.test(value)
)

const toIdString = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

const toUuidString = (value: unknown) => {
  const id = toIdString(value)
  return isUuid(id) ? id : ''
}

const normalizeKey = (key: string) => key.toLowerCase().replaceAll('_', '')

const findNestedAssetId = (value: unknown, path: string[] = [], seen = new Set<object>()): string => {
  if (!value || typeof value !== 'object') return ''
  if (seen.has(value)) return ''

  seen.add(value)

  for (const [key, childValue] of Object.entries(value as Record<string, unknown>)) {
    const normalizedPath = [...path, key].map(normalizeKey)
    const normalizedKey = normalizeKey(key)
    const pathText = normalizedPath.join('.')
    const isAssetIdKey = normalizedKey.includes('asset') && normalizedKey.includes('id')
    const isNestedAssetId = normalizedKey === 'id' && normalizedPath.some((part) => part.includes('asset'))
    const isWrongDomain = ['item', 'company', 'category', 'department', 'member', 'user'].some((domain) => pathText.includes(domain))

    if (isUuid(childValue) && (isAssetIdKey || isNestedAssetId) && !isWrongDomain) {
      return childValue
    }
  }

  for (const [key, childValue] of Object.entries(value as Record<string, unknown>)) {
    const nestedId = findNestedAssetId(childValue, [...path, key], seen)
    if (nestedId) return nestedId
  }

  return ''
}

const getAssetId = (asset: TangibleAsset) => {
  const assetWithAliases = asset as AssetResponseAliases
  const storedAssetId = asset.assetCode
    ? localStorage.getItem(`${ASSET_ID_STORAGE_PREFIX}${asset.assetCode}`)
    : ''

  return toUuidString(asset.assetId)
    || toUuidString(asset.id)
    || toUuidString(asset.tangibleAssetId)
    || toUuidString(asset.tangibleAssetAssetId)
    || toUuidString(asset.asset_id)
    || toUuidString(asset.tangible_asset_id)
    || toUuidString(asset.tangible_asset_asset_id)
    || toUuidString(asset.assetCode ? assetIdByAssetCode.value[asset.assetCode] : '')
    || toUuidString(storedAssetId)
    || findNestedAssetId(assetWithAliases.asset)
    || findNestedAssetId(assetWithAliases.tangibleAsset)
    || findNestedAssetId(asset)
}

const getMemberId = (asset: AssetResponseAliases) => (
  asset.assignedMemberId ?? asset.memberId ?? asset.member?.memberId ?? asset.user?.memberId ?? null
)

const getDepartmentId = (asset: AssetResponseAliases) => (
  asset.departmentId ?? asset.department?.departmentId ?? asset.member?.departmentId ?? asset.user?.departmentId ?? null
)

const getMemberName = (asset: AssetResponseAliases) => {
  const memberId = getMemberId(asset)
  const member = memberId ? members.value.find((candidate) => candidate.memberId === memberId) : undefined
  const currentUserLabel = asset.currentUserName
    ? `${asset.currentUserName}${asset.currentUserMemberNo ? `(${asset.currentUserMemberNo})` : ''}`
    : null

  return asset.assignedMemberName
    ?? asset.memberName
    ?? asset.userName
    ?? currentUserLabel
    ?? asset.member?.name
    ?? asset.user?.name
    ?? member?.name
    ?? null
}

const getDepartmentName = (asset: AssetResponseAliases) => {
  const departmentId = getDepartmentId(asset)
  const department = departmentId ? departments.value.find((candidate) => candidate.departmentId === departmentId) : undefined
  const memberId = getMemberId(asset)
  const member = memberId ? members.value.find((candidate) => candidate.memberId === memberId) : undefined

  return asset.departmentName
    ?? asset.department?.name
    ?? member?.departmentName
    ?? department?.name
    ?? null
}

const toAssetRow = (asset: TangibleAsset): TangibleAssetRow => {
  const assetWithAliases = asset as AssetResponseAliases
  const assetItemId = asset.assetItemId ?? asset.tangibleItemId ?? asset.tangibleAssetItemId
  const item = assetItemId ? assetItemMap.value.get(assetItemId) : undefined

  return {
    ...asset,
    assetId: getAssetId(asset),
    assetItemId,
    serialNo: asset.serialNo ?? asset.serialNumber ?? '',
    status: asset.status ?? asset.tangibleAssetStatus ?? asset.tangibleAssetstatus ?? 'AVAILABLE',
    assignedMemberId: getMemberId(assetWithAliases),
    assignedMemberName: getMemberName(assetWithAliases),
    departmentId: getDepartmentId(assetWithAliases),
    departmentName: getDepartmentName(assetWithAliases),
    location: asset.location ?? assetWithAliases.locationName ?? null,
    startedAt: asset.startedAt ?? asset.usedStartedAt ?? null,
    vendor: asset.vendor ?? asset.purchaseVendor ?? '',
    productName: asset.productName ?? asset.assetItemName ?? item?.name ?? '',
    category: (asset as TangibleAsset & { category?: string }).category ?? item?.category ?? '',
    manufacturer: item?.manufacturer ?? '',
    modelName: item?.modelName ?? '',
  }
}

const loadCategoryOptions = async () => {
  try {
    const response = await tangibleItemApi.getCategories()
    cascadingOptions.value = normalizeCategoryGroups(toCategoryGroups(response.data as CategoryTreeNode[]))
  } catch (error) {
    console.error(error)
    cascadingOptions.value = []
  }
};

const loadReferenceData = async () => {
  if (isReferenceDataLoaded.value) return
  if (referenceDataPromise.value) return referenceDataPromise.value

  referenceDataPromise.value = (async () => {
    const [departmentResult, memberResult] = await Promise.allSettled([
      departmentApi.getList({ size: 999 }),
      memberApi.getList({ size: 999 }),
    ])

    const failed = departmentResult.status === 'rejected' || memberResult.status === 'rejected'

    if (departmentResult.status === 'fulfilled') {
      departments.value = departmentResult.value.data.content
    } else {
      console.warn('유형자산 부서 참조 데이터 조회 실패:', getReferenceErrorMessage(departmentResult.reason))
      departments.value = []
    }

    if (memberResult.status === 'fulfilled') {
      members.value = memberResult.value.data.content
    } else {
      console.warn('유형자산 사원 참조 데이터 조회 실패:', getReferenceErrorMessage(memberResult.reason))
      members.value = []
    }

    isReferenceDataLoaded.value = !failed
  })().finally(() => {
    referenceDataPromise.value = null
  })

  return referenceDataPromise.value
}

const getReferenceErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
)

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
    const selectedCategoryId = getSelectedCategoryId()
    const params: { page: number; size: number; categoryId?: string; keyword?: string } = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    };

    if (selectedCategoryId) {
      params.categoryId = selectedCategoryId;
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim();
    }

    const response = await tangibleAssetApi.getList(params);

    const rows = response.data.content.map(toAssetRow);
    listError.value = '';
    serverAssetList.value = rows;
    totalElements.value = response.data.totalElements;
    totalPages.value = response.data.totalPages;
  } catch (error) {
    console.error('유형자산 목록 조회 실패', error);
    listError.value = '';
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
  await loadAssetItems();
  await loadCategoryOptions();
  loadServerData();
});
</script>
