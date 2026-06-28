<!-- TODO: 필수 입력란 표시 방법 변경 (필수 요소라는 문구 포함하기) -->

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
        <Button
          v-if="canRegisterAsset"
          variant="outline"
          :loading="isUploadingCsv"
          @click="handleCsvUploadClick"
        >
          <Upload :size="15" />
          CSV 파일 업로드
        </Button>
        <input
          ref="csvUploadInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleCsvUploadChange"
        />

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

        <BaseDrawer
          :is-open="isAssignmentDrawerOpen"
          title="무형자산 배정"
          body-class="p-0 !overflow-hidden"
          hide-footer
          @close="isAssignmentDrawerOpen = false"
        >
          <IntangibleAssetAssignment
            :assets="serverAssetList"
            :departments="departments"
            :members="members"
            @close="isAssignmentDrawerOpen = false"
            @assigned="handleAssetAssigned"
          />
        </BaseDrawer>

        <Button v-if="canRegisterAsset" variant="primary" @click="openAssignmentDrawer">
          <Tag :size="15" />
          자산 배정
        </Button>
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
            class="w-30"
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
            </Dropdown>
          </div>

          <Input
            id="keyword"
            v-model="searchParams.keyword"
            class="w-40!"
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
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import Input from '@/components/common/Input.vue'
import { Search, ChevronLeft, ChevronRight, Plus, Tag, Upload } from 'lucide-vue-next'
import { ApiError } from '@/api'
import { intangibleAssetApi, intangibleItemApi } from '@/api/asset.api'
import type { IntangibleAssetAssignmentResponse } from '@/api/asset.api'
import { departmentApi } from '@/api/department.api'
import { memberApi } from '@/api/member.api'
import { useNotificationStore } from '@/stores'
import { INTANGIBLE_STATUS_LABEL } from '@/utils/labels'
import { parseCsvText, validateCsvShape } from '@/utils/csvImport'
import type { Department, IntangibleAsset, IntangibleItem, LicenseType, Member } from '@/types'
import IntangibleAssetDetailView from '../../../components/asset/intangible/IntangibleAssetDetailView.vue'
import IntangibleAssetRegister from '../../../components/asset/intangible/IntangibleAssetRegister.vue'
import IntangibleAssetAssignment from '@/components/asset/intangible/IntangibleAssetAssignment.vue'

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
  memberId?: string | null
  memberName?: string | null
  userId?: string | null
  userName?: string | null
  assignedMember?: unknown
  currentUser?: unknown
  member?: unknown
  user?: unknown
  department?: unknown
  provider?: string
  assignedMemberCount?: number
  currentUserCount?: number
  activeAssignmentCount?: number
  assignmentCount?: number
  assignedMembers?: unknown[]
  currentUsers?: unknown[]
  members?: unknown[]
}

type NamedAssignmentLike = {
  memberId?: string | null
  id?: string | null
  userId?: string | null
  currentUserId?: string | null
  departmentId?: string | null
  memberName?: string | null
  name?: string | null
  userName?: string | null
  currentUserName?: string | null
  departmentName?: string | null
  memberNo?: string | null
  employeeNo?: string | null
  currentUserMemberNo?: string | null
}

type AssignmentSummary = {
  memberIds: string[]
  memberNames: string
  departmentIds: string[]
  departmentNames: string
  count: number
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

const INTANGIBLE_ASSET_IMPORT_HEADERS = [
  'productName',
  'licenseCode',
  'seatCount',
  'isAutoRenewal',
  'purchaseDate',
  'purchasePrice',
  'purchaseVendor',
  'billingCycle',
]

const rowsPerPageOptions = ['10개씩 보기', '20개씩 보기', '50개씩 보기', '100개씩 보기']
const rowsPerPageText = ref('20개씩 보기')
const isRegisterDrawerOpen = ref(false)
const isAssignmentDrawerOpen = ref(false)
const isDetailDrawerOpen = ref(false)
const selectedAsset = ref<IntangibleAsset | null>(null)
const csvUploadInputRef = ref<HTMLInputElement | null>(null)
const isUploadingCsv = ref(false)
const notificationStore = useNotificationStore()
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
const multiAssignedAssetIds = ref(new Set<string>())
const activeAssignmentSummaries = ref<Record<string, AssignmentSummary>>({})
const totalElements = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)

const tableColumns: Column<IntangibleAsset>[] = [
  { key: 'assetItemName', label: '제품명', align: 'center', width: '26%', maxLines: 2 },
  { key: 'assetCode', label: '자산 번호', align: 'center', width: '22%' },
  { key: 'status', label: '자산 상태', align: 'center', width: '16%' },
  { key: 'departmentName', label: '부서', align: 'center', width: '16%' },
  { key: 'assignedMemberName', label: '사용자', align: 'center', width: '22%' },
]

const statusLabel = (status: string | null | undefined) => {
  if (!status) return '–'
  return INTANGIBLE_STATUS_LABEL[status] ?? '알 수 없음'
}

const assetIdOf = (asset: IntangibleAsset) => {
  const assetWithAliases = asset as IntangibleAssetResponse
  return asset.assetId ?? assetWithAliases.intangibleAssetId ?? ''
}

const assetGroupKeyOf = (asset: IntangibleAssetResponse) => (
  asset.assetId
  ?? asset.intangibleAssetId
  ?? asset.assetCode
)

const itemIdOf = (item: IntangibleItem) => (
  item.assetItemId ?? item.itemId ?? item.id ?? ''
)

const toLicenseType = (value: string | undefined): LicenseType => {
  if (value === 'PERPETUAL' || value === 'TERM' || value === 'SUBSCRIPTION') {
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

const assignmentCountOf = (asset: IntangibleAssetResponse) => {
  const count = asset.assignedMemberCount
    ?? asset.currentUserCount
    ?? asset.activeAssignmentCount
    ?? asset.assignmentCount

  if (typeof count === 'number') return count

  return asset.assignedMembers?.length
    ?? asset.currentUsers?.length
    ?? asset.members?.length
    ?? 0
}

const isNamedAssignmentLike = (value: unknown): value is NamedAssignmentLike => (
  typeof value === 'object' && value !== null
)

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return null
}

const memberIdFromUnknown = (value: unknown) => {
  if (typeof value === 'string') return value
  if (!isNamedAssignmentLike(value)) return null

  return firstText(
    value.memberId,
    value.id,
    value.userId,
    value.currentUserId,
  )
}

const departmentIdFromUnknown = (value: unknown) => {
  if (typeof value === 'string') return value
  if (!isNamedAssignmentLike(value)) return null

  return firstText(value.departmentId)
}

const memberById = (memberId: string | null | undefined) => (
  memberId ? members.value.find((member) => member.memberId === memberId) : undefined
)

const departmentById = (departmentId: string | null | undefined) => (
  departmentId ? departments.value.find((department) => department.departmentId === departmentId) : undefined
)

const memberLabelFromUnknown = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (!isNamedAssignmentLike(value)) return ''

  const member = memberById(memberIdFromUnknown(value))
  const name = firstText(
    value.memberName,
    value.name,
    value.userName,
    value.currentUserName,
    member?.name,
  )
  const memberNo = firstText(value.memberNo, value.employeeNo, value.currentUserMemberNo, member?.memberNo)

  if (!name) return ''
  return memberNo ? `${name}(${memberNo})` : name
}

const singleAssignedMemberNameOf = (asset: IntangibleAssetResponse) => {
  const member = memberById(
    firstText(
      asset.assignedMemberId,
      asset.currentUserId,
      asset.memberId,
      asset.userId,
      memberIdFromUnknown(asset.assignedMember),
      memberIdFromUnknown(asset.currentUser),
      memberIdFromUnknown(asset.member),
      memberIdFromUnknown(asset.user),
    ),
  )
  const currentUserLabel = asset.currentUserName
      ? `${asset.currentUserName}${asset.currentUserMemberNo ? `(${asset.currentUserMemberNo})` : ''}`
      : null
  const directName = firstText(
    asset.assignedMemberName,
    asset.memberName,
    asset.userName,
    currentUserLabel,
    memberLabelFromUnknown(asset.assignedMember),
    memberLabelFromUnknown(asset.currentUser),
    memberLabelFromUnknown(asset.member),
    memberLabelFromUnknown(asset.user),
    member?.name,
  )

  if (directName && directName !== '-') {
    return member?.memberNo && directName === member.name ? `${member.name}(${member.memberNo})` : directName
  }

  return asset.assignedMembers?.map(memberLabelFromUnknown).find(Boolean)
    ?? asset.currentUsers?.map(memberLabelFromUnknown).find(Boolean)
    ?? asset.members?.map(memberLabelFromUnknown).find(Boolean)
    ?? ''
}

const departmentNameFromUnknown = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (!isNamedAssignmentLike(value)) return ''

  const department = departmentById(departmentIdFromUnknown(value))
  return firstText(value.departmentName, value.name, department?.name) ?? ''
}

const departmentNameOf = (asset: IntangibleAssetResponse) => {
  const member = memberById(
    firstText(
      asset.assignedMemberId,
      asset.currentUserId,
      asset.memberId,
      asset.userId,
      memberIdFromUnknown(asset.assignedMember),
      memberIdFromUnknown(asset.currentUser),
      memberIdFromUnknown(asset.member),
      memberIdFromUnknown(asset.user),
    ),
  )
  const department = departmentById(
    firstText(
      asset.departmentId,
      departmentIdFromUnknown(asset.department),
      departmentIdFromUnknown(asset.assignedMember),
      departmentIdFromUnknown(asset.currentUser),
      departmentIdFromUnknown(asset.member),
      departmentIdFromUnknown(asset.user),
      member?.departmentId,
    ),
  )

  return firstText(
    asset.departmentName,
    departmentNameFromUnknown(asset.department),
    departmentNameFromUnknown(asset.assignedMember),
    departmentNameFromUnknown(asset.currentUser),
    departmentNameFromUnknown(asset.member),
    departmentNameFromUnknown(asset.user),
    member?.departmentName,
    department?.name,
  )
}

const assignedMemberSummaryOf = (asset: IntangibleAssetResponse, assignedMemberCount: number) => {
  const firstMemberName = singleAssignedMemberNameOf(asset)
  if (assignedMemberCount > 1) {
    return firstMemberName ? `${firstMemberName} 외 ${assignedMemberCount - 1}명` : `${assignedMemberCount}명`
  }

  return firstMemberName || '-'
}

const isActiveAssignment = (assignment: IntangibleAssetAssignmentResponse) => (
  assignment.assignmentStatus === 'ACTIVE' || assignment.assignmentStatus === 'ASSIGNED'
)

const uniqueText = (values: Array<string | null | undefined>) => (
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
)

const assignmentMemberLabel = (assignment: IntangibleAssetAssignmentResponse) => {
  if (!assignment.memberName) return ''
  return assignment.memberNo ? `${assignment.memberName}(${assignment.memberNo})` : assignment.memberName
}

const toAssignmentSummary = (assignments: IntangibleAssetAssignmentResponse[]): AssignmentSummary | null => {
  const activeAssignments = assignments.filter(isActiveAssignment)
  if (activeAssignments.length === 0) return null

  const memberLabels = uniqueText(activeAssignments.map(assignmentMemberLabel))
  const memberNames = memberLabels.length > 1
    ? `${memberLabels[0]} 외 ${memberLabels.length - 1}명`
    : memberLabels[0] ?? ''

  return {
    memberIds: uniqueText(activeAssignments.map((assignment) => assignment.memberId)),
    memberNames,
    departmentIds: uniqueText(activeAssignments.map((assignment) => assignment.departmentId)),
    departmentNames: uniqueText(activeAssignments.map((assignment) => assignment.departmentName)).join(', '),
    count: activeAssignments.length,
  }
}

const loadActiveAssignmentSummaries = async (rows: IntangibleAsset[]) => {
  const assetIds = uniqueText(rows.map((row) => row.assetId))
  activeAssignmentSummaries.value = {}

  if (assetIds.length === 0) return

  const results = await Promise.allSettled(
    assetIds.map(async (assetId) => {
      const response = await intangibleAssetApi.getAssignments(assetId, { assignmentStatus: 'ACTIVE' })
      return [assetId, toAssignmentSummary(response.data)] as const
    }),
  )

  const nextSummaries: Record<string, AssignmentSummary> = {}
  for (const result of results) {
    if (result.status !== 'fulfilled') continue

    const [assetId, summary] = result.value
    if (summary) {
      nextSummaries[assetId] = summary
    }
  }

  activeAssignmentSummaries.value = nextSummaries
}

const withAssignmentSummary = (row: IntangibleAsset): IntangibleAsset => {
  const summary = activeAssignmentSummaries.value[row.assetId]
  if (!summary) return row

  return {
    ...row,
    assignedMemberId: summary.count === 1 ? (summary.memberIds[0] ?? row.assignedMemberId) : null,
    assignedMemberName: summary.memberNames || row.assignedMemberName,
    departmentId: summary.count === 1 ? (summary.departmentIds[0] ?? row.departmentId) : null,
    departmentName: summary.departmentNames || row.departmentName,
    assignedMemberCount: summary.count,
    activeAssignmentCount: summary.count,
  } as IntangibleAsset
}

const toAssetRow = (asset: IntangibleAssetResponse): IntangibleAsset => {
  const assetId = asset.assetId ?? asset.intangibleAssetId ?? ''
  const assignedMemberCount = assignmentCountOf(asset)
  const hasMultipleAssignedUsers = assignedMemberCount > 1
    || Boolean(assetId && multiAssignedAssetIds.value.has(assetId))

  return {
    ...asset,
    assetId,
    assetItemId: asset.assetItemId ?? asset.intangibleItemId ?? asset.intangibleAssetItemId,
    assetItemName: asset.assetItemName ?? asset.productName ?? asset.itemName ?? '',
    status: asset.status ?? asset.intangibleAssetStatus ?? 'AVAILABLE',
    assignedMemberId: hasMultipleAssignedUsers
      ? null
      : firstText(
        asset.assignedMemberId,
        asset.currentUserId,
        asset.memberId,
        asset.userId,
        memberIdFromUnknown(asset.assignedMember),
        memberIdFromUnknown(asset.currentUser),
        memberIdFromUnknown(asset.member),
        memberIdFromUnknown(asset.user),
      ),
    assignedMemberName: assignedMemberSummaryOf(asset, hasMultipleAssignedUsers ? Math.max(assignedMemberCount, 2) : assignedMemberCount),
    departmentId: hasMultipleAssignedUsers
      ? null
      : firstText(
        asset.departmentId,
        departmentIdFromUnknown(asset.department),
        departmentIdFromUnknown(asset.assignedMember),
        departmentIdFromUnknown(asset.currentUser),
        departmentIdFromUnknown(asset.member),
        departmentIdFromUnknown(asset.user),
      ),
    departmentName: hasMultipleAssignedUsers ? '-' : departmentNameOf(asset) ?? '-',
    startedAt: asset.startedAt ?? null,
    expiredAt: asset.expiredAt ?? null,
    vendor: asset.provider ?? asset.vendor,
  }
}

const toGroupedAssetRows = (assets: IntangibleAssetResponse[]) => {
  const groupedAssets = new Map<string, { asset: IntangibleAssetResponse; rowCount: number }>()

  for (const asset of assets) {
    const groupKey = assetGroupKeyOf(asset)
    const assignmentCount = assignmentCountOf(asset)
    const rowCount = Math.max(assignmentCount, 1)

    if (!groupKey) {
      groupedAssets.set(crypto.randomUUID(), { asset, rowCount })
      continue
    }

    const existing = groupedAssets.get(groupKey)
    if (!existing) {
      groupedAssets.set(groupKey, { asset, rowCount })
      continue
    }

    existing.rowCount += rowCount
  }

  return Array.from(groupedAssets.values()).map(({ asset, rowCount }) => (
    toAssetRow({
      ...asset,
      assignedMemberCount: rowCount > 1 ? rowCount : assignmentCountOf(asset),
    })
  ))
}

const handleAssetRegistered = (asset?: IntangibleAsset) => {
  if (asset && assignmentCountOf(asset as IntangibleAssetResponse) > 1) {
    const assetId = assetIdOf(asset)
    if (assetId) {
      multiAssignedAssetIds.value = new Set([...multiAssignedAssetIds.value, assetId])
    }
  }

  handleSearch()
}

const handleAssetAssigned = () => {
  isAssignmentDrawerOpen.value = false
  handleSearch()
}

const handleAssetSaved = () => {
  handleSearch()
}

const handleCsvUploadClick = () => {
  if (isUploadingCsv.value) return
  csvUploadInputRef.value?.click()
}

const validateIntangibleAssetCsv = async (file: File) => {
  const rows = parseCsvText(await file.text())
  return validateCsvShape(rows, INTANGIBLE_ASSET_IMPORT_HEADERS, '무형자산')
}

const formatCsvUploadError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.errorCode
      ? `${error.message} (${error.errorCode})`
      : error.message
  }

  return error instanceof Error ? error.message : 'CSV 업로드 중 오류가 발생했습니다.'
}

const handleCsvUploadChange = async (event: Event) => {
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
    const validationError = await validateIntangibleAssetCsv(file)
    if (validationError) {
      notificationStore.warning('CSV 파일 형식을 확인해주세요.', validationError)
      return
    }

    const response = await intangibleAssetApi.importCsv(file)
    notificationStore.success('무형자산 일괄 등록 완료', `${response.data.length}건이 등록되었습니다.`)
    handleSearch()
  } catch (error) {
    const message = formatCsvUploadError(error)
    console.error('무형자산 CSV 업로드 실패', {
      error,
      ...(error instanceof ApiError
        ? { status: error.status, errorCode: error.errorCode, details: error.details }
        : {}),
    })
    notificationStore.error('무형자산 일괄 등록 실패', message)
  } finally {
    isUploadingCsv.value = false
    input.value = ''
  }
}

const openRegisterDrawer = () => {
  isRegisterDrawerOpen.value = true
  void loadRegisterReferenceData()
}

const openAssignmentDrawer = async () => {
  await loadRegisterReferenceData()
  isAssignmentDrawerOpen.value = true
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
    memberApi.getList({ size: 999, status: 'ACTIVE' }),
  ])

  if (itemsResult.status === 'fulfilled') {
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
  await loadRegisterReferenceData()
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

    const response = await intangibleAssetApi.getList(params)

    const groupedRows = toGroupedAssetRows(response.data.content as IntangibleAssetResponse[])
    await loadActiveAssignmentSummaries(groupedRows)
    const duplicateCountOnPage = response.data.content.length - groupedRows.length
    const adjustedTotalElements = Math.max(groupedRows.length, response.data.totalElements - duplicateCountOnPage)

    serverAssetList.value = groupedRows.map(withAssignmentSummary)
    totalElements.value = adjustedTotalElements
    totalPages.value = Math.max(1, Math.ceil(adjustedTotalElements / searchParams.value.size))
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
