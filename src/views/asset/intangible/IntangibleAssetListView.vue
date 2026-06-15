<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          무형자산 > 무형자산 관리
        </p>
        <h1 class="page-title">
          무형자산 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button v-if="canRegisterAsset" variant="primary" @click="openRegisterDrawer">
          <Plus :size="15" />
          자산 등록
        </Button>
        <IntangibleAssetRegister
          :is-open="isRegisterDrawerOpen"
          :initial-items="assetItemOptions"
          :departments="departments"
          :members="members"
          @close="isRegisterDrawerOpen = false"
          @registered="handleAssetRegistered"
        />
      </div>
    </div>

    <IntangibleAssetDetailView
      :is-open="isDetailDrawerOpen"
      :asset="selectedAsset"
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

          <Input
            id="keyword"
            v-model="searchParams.keyword"
            placeholder="제품명, 자산코드로 검색"
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
import { ref, computed, watch, onMounted } from 'vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import Input from '@/components/common/Input.vue'
import { Search, ChevronLeft, ChevronRight, Layers, Plus } from 'lucide-vue-next'
import { intangibleAssetApi, intangibleItemApi } from '@/api/asset.api'
import { departmentApi } from '@/api/department.api'
import { memberApi } from '@/api/member.api'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import type { ApiResponse, Department, IntangibleAsset, IntangibleItem, LicenseType, Member } from '@/types'
import IntangibleAssetDetailView from '../../../components/asset/intangible/IntangibleAssetDetailView.vue'
import IntangibleAssetRegister from '../../../components/asset/intangible/IntangibleAssetRegister.vue'

import { usePermission } from '@/composables/usePermission.ts'
import { useAuthStore } from '@/stores/auth.store'

const { canRegisterAsset, role } = usePermission()
const auth = useAuthStore()

const currentMemberId = computed(() => {
  const user = auth.user as {
    memberId?: string
    id?: string
    member_id?: string
    employeeId?: string
    employee_id?: string
  } | null

  return user?.memberId
    ?? user?.id
    ?? user?.member_id
    ?? user?.employeeId
    ?? user?.employee_id
    ?? null
})

const currentDepartmentId = computed(() => {
  const user = auth.user as {
    departmentId?: string
    department_id?: string
  } | null

  return user?.departmentId
    ?? user?.department_id
    ?? null
})

interface CategoryGroup {
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

interface AssetItemOption {
  id: string
  name: string
  licenseType: LicenseType
}

type IntangibleAssetResponse = IntangibleAsset & {
  intangibleAssetId?: string
  intangibleItemId?: string
  intangibleAssetItemId?: string
  productName?: string
  itemName?: string
  currentUserName?: string | null
  currentUserMemberNo?: string | null
  currentUserId?: string | null
  memberName?: string | null
  userName?: string | null
  provider?: string
}

type ApiFailure = {
  status?: number | null
  errorCode?: string | null
  message?: string
  details?: unknown
}

type StoredAuthUser = {
  memberId?: string
  memberNo?: string
  name?: string
  email?: string | null
  departmentId?: string
  departmentName?: string
  role?: Member['role']
  status?: Member['status']
}

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기', '100개씩 보기']
const rowsPerPageText = ref('20개씩 보기')
const isRegisterDrawerOpen = ref(false)
const isDetailDrawerOpen = ref(false)
const selectedAsset = ref<IntangibleAsset | null>(null)
const ALL_CATEGORY = '전체 품목 보기'

const searchParams = ref({
  categoryName: ALL_CATEGORY,
  keyword: '',
  page: 0,
  size: 20,
})

const cascadingOptions = ref<CategoryGroup[]>([])
const serverAssetList = ref<IntangibleAsset[]>([])
const assetItemOptions = ref<AssetItemOption[]>([])
const departments = ref<Department[]>([])
const members = ref<Member[]>([])
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)

const tableColumns: Column<IntangibleAsset>[] = [
  { key: 'assetItemName', label: '제품명', align: 'center', width: '28%' },
  { key: 'assetCode', label: '자산 번호', align: 'center', width: '22%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '16%' },
  { key: 'assignedMemberName', label: '사용자', align: 'center', width: '18%' },
  { key: 'status', label: '자산 상태', align: 'center', width: '16%' },
]

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '–'
  return INTANGIBLE_STATUS_LABEL[status as keyof typeof INTANGIBLE_STATUS_LABEL] ?? status
}

const assetIdOf = (asset: IntangibleAsset) => (
  asset.assetId ?? ''
)

const itemIdOf = (item: IntangibleItem) => (
  item.assetItemId ?? item.itemId ?? item.id ?? ''
)

const toLicenseType = (value: string | undefined): LicenseType => {
  if (value === 'PERPETUAL' || value === 'VOLUME' || value === 'USER_BASED' || value === 'SUBSCRIPTION') {
    return value
  }

  return 'SUBSCRIPTION'
}

const toAssetItemOption = (item: IntangibleItem): AssetItemOption | null => {
  const id = itemIdOf(item)
  const name = item.productName
  if (!id || !name) return null

  return {
    id,
    name,
    licenseType: toLicenseType(item.licenseType),
  }
}

const toAssetRow = (asset: IntangibleAssetResponse): IntangibleAsset => ({
  ...asset,
  assetId: asset.assetId ?? asset.intangibleAssetId,
  assetItemId: asset.assetItemId ?? asset.intangibleItemId ?? asset.intangibleAssetItemId,
  assetItemName: asset.assetItemName ?? asset.productName ?? asset.itemName ?? '',
  status: asset.status ?? asset.intangibleAssetStatus ?? 'AVAILABLE',
  assignedMemberId: asset.assignedMemberId ?? asset.currentUserId ?? null,
  assignedMemberName: asset.assignedMemberName
    ?? asset.memberName
    ?? asset.userName
    ?? (asset.currentUserName
      ? `${asset.currentUserName}${asset.currentUserMemberNo ? `(${asset.currentUserMemberNo})` : ''}`
      : null),
  departmentId: asset.departmentId ?? null,
  departmentName: asset.departmentName ?? null,
  startedAt: asset.startedAt ?? null,
  expiredAt: asset.expiredAt ?? null,
  vendor: asset.provider ?? asset.vendor,
})

const handleAssetRegistered = () => {
  handleSearch()
}

const handleAssetSaved = () => {
  handleSearch()
}

const openRegisterDrawer = () => {
  isRegisterDrawerOpen.value = true
  console.info('무형자산 등록 Drawer 오픈 - 참조 API 호출 시작', [
    'GET /intangible-asset/items',
    'GET /departments?size=999',
    'GET /members?size=999',
  ])
  void loadRegisterReferenceData()
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

const openAssetDetail = async (row: IntangibleAsset) => {
  selectedAsset.value = row
  isDetailDrawerOpen.value = true

  const assetId = assetIdOf(row)
  if (!assetId) {
    console.warn('무형자산 상세 조회에 필요한 자산 ID가 없습니다.', {
      responseKeys: Object.keys(row),
      row,
    })
    return
  }

  try {
    const response = await intangibleAssetApi.getDetail(assetId)
    selectedAsset.value = {
      ...toAssetRow(response.data as IntangibleAssetResponse),
      assetId,
    }
  } catch (error) {
    console.error('무형자산 상세 조회 실패', error)
  }
}

const closeAssetDetail = () => {
  isDetailDrawerOpen.value = false
  selectedAsset.value = null
}

const categoryIdByName = (categoryName: string) => {
  if (!categoryName || categoryName === ALL_CATEGORY) return ''

  for (const group of cascadingOptions.value) {
    if (categoryName === group.mainCategory) {
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

const categoryIdOf = (category: CategoryTreeNode) => (
  category.categoryId ?? category.intangibleAssetCategoryId ?? category.id ?? ''
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

const loadCategoryOptions = async () => {
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
    console.warn('무형자산 카테고리 조회 실패:', error instanceof Error ? error.message : String(error))
    cascadingOptions.value = []
  }
}

const apiFailureOf = (error: unknown): ApiFailure => {
  if (typeof error === 'object' && error !== null) {
    return error as ApiFailure
  }

  return { message: String(error) }
}

const logRegisterReferenceSuccess = <T>(
  label: string,
  endpoint: string,
  response: ApiResponse<T>,
) => {
  console.log(`무형자산 등록 Drawer ${label} 성공`, {
    endpoint,
    status: response.status,
    response,
  })
}

const logRegisterReferenceFailure = (
  label: string,
  endpoint: string,
  error: unknown,
) => {
  const failure = apiFailureOf(error)

  console.error(`무형자산 등록 Drawer ${label} 실패`, {
    endpoint,
    status: failure.status,
    errorCode: failure.errorCode,
    message: failure.message,
    details: failure.details,
    error,
  })
}

const getStoredAuthUser = (): StoredAuthUser | null => {
  const storedUser = localStorage.getItem('authUser')
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as StoredAuthUser
  } catch {
    return null
  }
}

const getFallbackDepartment = (): Department[] => {
  const user = getStoredAuthUser()
  if (!user?.departmentId || !user.departmentName) return []

  return [{
    departmentId: user.departmentId,
    parentDepartmentId: null,
    name: user.departmentName,
    memberCount: 1,
    createdAt: '',
  }]
}

const getFallbackMember = (): Member[] => {
  const user = getStoredAuthUser()
  if (!user?.memberId || !user.name || !user.departmentId) return []

  return [{
    memberId: user.memberId,
    memberNo: user.memberNo ?? '',
    name: user.name,
    email: user.email ?? null,
    departmentId: user.departmentId,
    departmentName: user.departmentName ?? '',
    departmentNamePath: user.departmentName ?? '',
    role: user.role ?? 'EMPLOYEE',
    status: user.status ?? 'ACTIVE',
    createdAt: '',
  }]
}

const loadRegisterReferenceData = async () => {
  const [itemsResult, departmentsResult, membersResult] = await Promise.allSettled([
    intangibleItemApi.getList({ page: 0, size: 999 }),
    departmentApi.getList({ size: 999 }),
    memberApi.getList({ size: 999 }),
  ])

  if (itemsResult.status === 'fulfilled') {
    logRegisterReferenceSuccess(
      '무형자산 품목 조회',
      'GET /intangible-asset/items',
      itemsResult.value,
    )
    assetItemOptions.value = itemsResult.value.data.content
      .map(toAssetItemOption)
      .filter((item): item is AssetItemOption => Boolean(item))
  } else {
    logRegisterReferenceFailure(
      '무형자산 품목 조회',
      'GET /intangible-asset/items',
      itemsResult.reason,
    )
    assetItemOptions.value = []
  }

  if (departmentsResult.status === 'fulfilled') {
    logRegisterReferenceSuccess(
      '부서 목록 조회',
      'GET /departments?size=999',
      departmentsResult.value,
    )
    departments.value = departmentsResult.value.data.content
  } else {
    logRegisterReferenceFailure(
      '부서 목록 조회',
      'GET /departments?size=999',
      departmentsResult.reason,
    )
    departments.value = getFallbackDepartment()
    if (departments.value.length > 0) {
      console.warn('부서 목록 조회 실패 - 로그인 사용자 부서 정보로 대체합니다.', departments.value)
    }
  }

  if (membersResult.status === 'fulfilled') {
    logRegisterReferenceSuccess(
      '사용자 목록 조회',
      'GET /members?size=999',
      membersResult.value,
    )
    members.value = membersResult.value.data.content
  } else {
    logRegisterReferenceFailure(
      '사용자 목록 조회',
      'GET /members?size=999',
      membersResult.reason,
    )
    members.value = getFallbackMember()
    if (members.value.length > 0) {
      console.warn('사용자 목록 조회 실패 - 로그인 사용자 정보로 대체합니다.', members.value)
    }
  }
}

const loadInitialData = async () => {
  await loadCategoryOptions()
  loadServerData()
}

const loadServerData = async () => {
  isLoading.value = true

  try {
    const params: Record<string, unknown> = {
      page: searchParams.value.page,
      size: searchParams.value.size,
    }

    const selectedCategoryId = categoryIdByName(searchParams.value.categoryName)
    if (selectedCategoryId) {
      params.categoryId = selectedCategoryId
    }

    if (searchParams.value.keyword.trim()) {
      params.keyword = searchParams.value.keyword.trim()
    }

    if (role.value === 'EMPLOYEE' && currentMemberId.value) {
      params.currentUserId = currentMemberId.value
    }

    if (role.value === 'DEPARTMENT_MANAGER' && currentDepartmentId.value) {
      params.departmentId = currentDepartmentId.value
    }

    console.log('무형자산 목록 조회 요청 params', params)
    const response = await intangibleAssetApi.getList(params)
    console.log('무형자산 목록 조회 성공', {
      status: response.status,
      response,
    })

    serverAssetList.value = response.data.content.map((asset) => toAssetRow(asset as IntangibleAssetResponse))
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('무형자산 목록 조회 실패', error)
  } finally {
    isLoading.value = false
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

onMounted(loadInitialData)
</script>
