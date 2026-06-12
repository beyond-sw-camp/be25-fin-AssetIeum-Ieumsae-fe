<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main">
    <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">사원 관리</p>
        <h1 class="page-title">사원 관리</h1>
      </div>

      <Button v-if="canManageMembers" @click="openRegisterDrawer">
        <UserPlus :size="17" />
        신규 사원 등록
      </Button>
    </header>

    <section class="card mb-4 flex min-h-0 flex-1 flex-col overflow-hidden border border-border">
      <form
        class="relative z-30 flex shrink-0 items-center justify-between gap-3 overflow-visible border-b border-border pb-3"
        @submit.prevent="handleSearch"
      >
        <div class="flex shrink-0 items-center gap-2">
          <Dropdown
            :model-value="size"
            :options="PAGE_SIZE_OPTIONS"
            class="w-32"
            aria-label="페이지 표시 개수"
            @update:model-value="handlePageSizeChange"
          />
          <span class="whitespace-nowrap text-xs text-text-sub">
            총 {{ totalElements }}명 중 {{ memberRangeText }}
          </span>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <Dropdown
            :model-value="filterForm.status"
            :options="STATUS_FILTER_OPTIONS"
            class="w-28"
            aria-label="재직 상태"
            @update:model-value="handleStatusFilterChange"
          />

          <Dropdown
            :model-value="filterForm.departmentId"
            :options="departmentFilterOptions"
            class="w-40"
            aria-label="소속 부서"
            @update:model-value="handleDepartmentFilterChange"
          />

          <Input
            id="member-keyword"
            v-model="filterForm.keyword"
            class="w-56"
            placeholder="이름, 이메일, 사번 검색"
          />

          <Button type="submit" class="shrink-0">
            <Search :size="15" />
            조회하기
          </Button>
        </div>
      </form>

      <div
        v-if="listError"
        class="mt-3 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
      >
        <p class="text-sm text-danger">{{ listError }}</p>
        <Button variant="outline" size="sm" @click="fetchMembers">
          <RefreshCw :size="16" />
          다시 시도
        </Button>
      </div>

      <div class="min-h-0 flex-1 overflow-auto py-3">
        <Table
          :columns="memberColumns"
          :rows="members"
          :loading="isLoading"
          empty-text="조회된 사원이 없습니다."
          row-key="memberId"
          class="min-w-[960px]"
        >
          <template #cell-name="{ row }">
            <div class="min-w-0">
              <p class="truncate font-semibold text-text-main">{{ row.name }}</p>
              <p class="truncate text-xs text-text-sub">{{ row.email ?? '-' }}</p>
            </div>
          </template>

          <template #cell-role="{ row }">
            <span class="text-text-sub">{{ getRoleLabel(row.role) }}</span>
          </template>

          <template #cell-departmentName="{ row }">
            <span class="text-text-sub">{{ getMemberDepartmentName(row) }}</span>
          </template>

          <template #cell-status="{ row }">
            <span :class="statusBadgeClass[row.status]">
              {{ MEMBER_STATUS_LABEL[row.status] }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <MemberActionMenu
              v-if="canManageMembers && row.status !== 'RESIGNED'"
              :member-name="row.name"
              @change-department="openDepartmentDrawer(row)"
              @resign="requestResign(row)"
            />
            <span v-else class="text-xs text-text-muted">처리 완료</span>
          </template>
        </Table>
      </div>

      <div
        v-if="totalElements > 0"
        class="flex shrink-0 items-center justify-center gap-2 border-t border-border pt-3"
      >
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="page === 0 || isLoading"
          aria-label="이전 페이지"
          @click="changePage(page - 1)"
        >
          <ChevronLeft :size="16" />
        </button>

        <button
          v-for="pageNumber in visiblePageNumbers"
          :key="pageNumber"
          type="button"
          :class="[
            'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors',
            pageNumber - 1 === page
              ? 'bg-primary font-semibold text-white'
              : 'text-text-sub hover:bg-surface-secondary',
          ]"
          :disabled="isLoading"
          @click="changePage(pageNumber - 1)"
        >
          {{ pageNumber }}
        </button>

        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
          :disabled="totalPages === 0 || page >= totalPages - 1 || isLoading"
          aria-label="다음 페이지"
          @click="changePage(page + 1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </section>

    <BaseDrawer
      :is-open="isRegisterDrawerOpen"
      title="신규 사원 등록"
      @close="closeRegisterDrawer"
    >
      <form class="space-y-6" @submit.prevent="handleRegisterMember">
        <section class="space-y-4">
          <h3 class="border-b border-border pb-2 text-sm font-bold text-primary">기본 정보</h3>
          <Input
            id="register-member-no"
            v-model="registerForm.memberNo"
            label="사번"
            required
            placeholder="사번을 입력해주세요."
            :disabled="isRegistering"
            :error="registerSubmitted && Boolean(registerErrors.memberNo)"
            :error-message="registerErrors.memberNo"
          />
          <Input
            id="register-member-name"
            v-model="registerForm.name"
            label="이름"
            required
            placeholder="이름을 입력해주세요."
            :disabled="isRegistering"
            :error="registerSubmitted && Boolean(registerErrors.name)"
            :error-message="registerErrors.name"
          />
          <Input
            id="register-member-email"
            v-model="registerForm.email"
            type="email"
            label="이메일"
            required
            placeholder="example@ieumtech.com"
            :disabled="isRegistering"
            :error="registerSubmitted && Boolean(registerErrors.email)"
            :error-message="registerErrors.email"
          />
        </section>

        <section class="space-y-4">
          <h3 class="border-b border-border pb-2 text-sm font-bold text-primary">조직 및 소속</h3>
          <div class="flex flex-col gap-1.5">
            <label for="register-department" class="text-sm font-semibold text-text-main">
              부서 <span class="font-bold text-primary">*</span>
            </label>
            <Dropdown
              id="register-department"
              :model-value="registerForm.departmentId"
              :options="departmentRegisterOptions"
              :disabled="isRegistering"
              trigger-class="h-11 py-2.5"
              @update:model-value="handleRegisterDepartmentChange"
            />
            <p
              v-if="registerSubmitted && registerErrors.departmentId"
              class="text-xs font-medium text-danger"
              role="alert"
            >
              {{ registerErrors.departmentId }}
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="register-role" class="text-sm font-semibold text-text-main">
              권한 <span class="font-bold text-primary">*</span>
            </label>
            <Dropdown
              id="register-role"
              :model-value="registerForm.role"
              :options="registerRoleOptions"
              :disabled="isRegistering"
              trigger-class="h-11 py-2.5"
              @update:model-value="handleRegisterRoleChange"
            />
          </div>
        </section>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="isRegistering" @click="closeRegisterDrawer">
            취소
          </Button>
          <Button :loading="isRegistering" @click="handleRegisterMember">
            등록
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <BaseDrawer
      :is-open="isDepartmentDrawerOpen"
      title="부서 변경"
      @close="closeDepartmentDrawer"
    >
      <div v-if="memberToChangeDepartment" class="space-y-5">
        <div class="rounded-xl bg-surface-secondary p-4">
          <p class="font-semibold text-text-main">{{ memberToChangeDepartment.name }}</p>
          <p class="mt-1 text-sm text-text-sub">
            현재 부서: {{ getMemberDepartmentName(memberToChangeDepartment) }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="change-department" class="text-sm font-semibold text-text-main">
            변경할 부서 <span class="font-bold text-primary">*</span>
          </label>
          <Dropdown
            id="change-department"
            :model-value="departmentChangeForm.departmentId"
            :options="departmentRegisterOptions"
            :disabled="isChangingDepartment"
            trigger-class="h-11 py-2.5"
            @update:model-value="handleDepartmentChangeSelection"
          />
          <p
            v-if="departmentChangeError"
            class="text-xs font-medium text-danger"
            role="alert"
          >
            {{ departmentChangeError }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            :disabled="isChangingDepartment"
            @click="closeDepartmentDrawer"
          >
            취소
          </Button>
          <Button :loading="isChangingDepartment" @click="handleChangeDepartment">
            등록
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <ConfirmationModal
      :is-open="Boolean(memberToResign)"
      title="퇴사 처리"
      :message="`'${memberToResign?.name ?? ''}' 사원을 퇴사 처리하시겠습니까? 배정된 자산은 즉시 회수 처리됩니다.`"
      confirm-text="퇴사 처리"
      :loading="isResigning"
      @cancel="memberToResign = null"
      @confirm="handleResignMember"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-vue-next'

import { ApiError, memberApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table from '@/components/common/Table.vue'
import type { Column } from '@/components/common/Table.vue'
import MemberActionMenu from '@/components/member/MemberActionMenu.vue'
import { usePagination, usePermission } from '@/composables'
import { useDepartmentStore, useNotificationStore } from '@/stores'
import type { DropdownOption, Member, MemberStatus, Role } from '@/types'
import { MEMBER_STATUS_LABEL, ROLE_LABEL } from '@/utils/labels'

// 사원 등록 화면에서는 회사/플랫폼 관리자 권한을 부여하지 않는다.
type RegisterRole = Exclude<Role, 'SUPER_ADMIN' | 'ADMIN'>

const PAGE_SIZE_OPTIONS: DropdownOption[] = [10, 20, 50].map((value) => ({
  label: `${value}개씩 보기`,
  value,
}))
const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: '전체 상태', value: '' },
  { label: MEMBER_STATUS_LABEL.ACTIVE, value: 'ACTIVE' },
  { label: MEMBER_STATUS_LABEL.ON_LEAVE, value: 'ON_LEAVE' },
  { label: MEMBER_STATUS_LABEL.RESIGNED, value: 'RESIGNED' },
]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const departmentStore = useDepartmentStore()
const notificationStore = useNotificationStore()
const { canManageMembers } = usePermission()
const {
  page,
  size,
  totalElements,
  totalPages,
  setPage,
  setSize,
  updateFromResponse,
} = usePagination({ defaultSize: 20, syncUrl: true })

const members = ref<Member[]>([])
const isLoading = ref(false)
const listError = ref('')
const isRegisterDrawerOpen = ref(false)
const isDepartmentDrawerOpen = ref(false)
const isRegistering = ref(false)
const isChangingDepartment = ref(false)
const isResigning = ref(false)
const registerSubmitted = ref(false)
const memberToChangeDepartment = ref<Member | null>(null)
const memberToResign = ref<Member | null>(null)
let listRequestId = 0

const filterForm = reactive({
  status: '' as MemberStatus | '',
  departmentId: '',
  keyword: '',
})

const registerForm = reactive({
  memberNo: '',
  name: '',
  email: '',
  departmentId: '',
  role: 'EMPLOYEE' as RegisterRole,
})

const departmentChangeForm = reactive({
  departmentId: '',
})

const memberColumns: Column<Member>[] = [
  { key: 'memberNo', label: '사번', width: '14%' },
  { key: 'name', label: '이름 (이메일)', width: '25%' },
  { key: 'departmentName', label: '소속 부서', width: '20%' },
  { key: 'role', label: '권한', width: '15%' },
  { key: 'status', label: '상태', width: '11%', align: 'center' },
  { key: 'actions', label: '관리', width: '15%', align: 'center' },
]

const statusBadgeClass: Record<MemberStatus, string> = {
  ACTIVE: 'badge-success',
  ON_LEAVE: 'badge-warning',
  RESIGNED: 'badge-danger',
}

const registerRoleOptions: Array<{
  value: RegisterRole
  label: string
}> = [
  { value: 'EMPLOYEE', label: ROLE_LABEL.EMPLOYEE },
  { value: 'DEPARTMENT_MANAGER', label: ROLE_LABEL.DEPARTMENT_MANAGER },
  { value: 'ASSET_TEAM', label: ROLE_LABEL.ASSET_TEAM },
  { value: 'ASSET_MANAGE', label: ROLE_LABEL.ASSET_MANAGE },
]

// 최상위 회사 노드는 조직 구조 표시용이므로 실제 사원 소속 선택지에서 제외한다.
const selectableDepartments = computed(() =>
  departmentStore.departments.filter(
    ({ parentDepartmentId }) => parentDepartmentId !== null,
  ),
)

const departmentFilterOptions = computed<DropdownOption[]>(() => [
  { label: '전체 부서', value: '' },
  ...selectableDepartments.value.map(({ departmentId, name }) => ({
    label: name,
    value: departmentId,
  })),
])

const departmentRegisterOptions = computed<DropdownOption[]>(() => [
  { label: '부서를 선택해주세요.', value: '' },
  ...selectableDepartments.value.map(({ departmentId, name }) => ({
    label: name,
    value: departmentId,
  })),
])

const memberRangeText = computed(() => {
  if (totalElements.value === 0) return '0명'

  const start = page.value * size.value + 1
  const end = Math.min((page.value + 1) * size.value, totalElements.value)
  return `${start}-${end}명`
})

const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)

  const current = page.value + 1
  const start = Math.min(Math.max(current - 2, 1), total - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
})

const registerErrors = computed(() => ({
  memberNo: registerForm.memberNo.trim() ? '' : '사번을 입력해주세요.',
  name: registerForm.name.trim() ? '' : '이름을 입력해주세요.',
  email: !registerForm.email.trim()
    ? '이메일을 입력해주세요.'
    : EMAIL_PATTERN.test(registerForm.email.trim())
      ? ''
      : '올바른 이메일 형식을 입력해주세요.',
  departmentId: registerForm.departmentId ? '' : '부서를 선택해주세요.',
}))

const hasRegisterError = computed(() =>
  Object.values(registerErrors.value).some(Boolean),
)

const departmentChangeError = computed(() => {
  if (!departmentChangeForm.departmentId) return '변경할 부서를 선택해주세요.'
  if (
    memberToChangeDepartment.value
    && departmentChangeForm.departmentId === memberToChangeDepartment.value.departmentId
  ) {
    return '현재 소속 부서와 다른 부서를 선택해주세요.'
  }
  return ''
})

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function getRoleLabel(role: unknown) {
  if (typeof role !== 'string' || !role.trim()) return '-'

  const roleCode = role.trim()
  return Object.hasOwn(ROLE_LABEL, roleCode)
    ? ROLE_LABEL[roleCode as Role]
    : roleCode
}

function getMemberDepartmentName(member: Member) {
  const departmentName = departmentStore.departments.find(
    ({ departmentId }) => departmentId === member.departmentId,
  )?.name
  if (departmentName) return departmentName

  const responseDepartmentName = member.departmentName?.trim()
  if (responseDepartmentName) return responseDepartmentName

  return '-'
}

async function fetchMembers() {
  // 검색 조건이 빠르게 바뀌어도 가장 마지막 요청 결과만 목록에 반영한다.
  const requestId = ++listRequestId
  isLoading.value = true
  listError.value = ''

  try {
    const response = await memberApi.getList({
      page: page.value,
      size: size.value,
      status: filterForm.status || undefined,
      departmentId: filterForm.departmentId || undefined,
      keyword: filterForm.keyword.trim() || undefined,
    })
    if (requestId !== listRequestId) return

    members.value = response.data.content
    updateFromResponse(response.data)
  } catch (error) {
    if (requestId !== listRequestId) return

    // TODO: 목록이 비었을 때는 백엔드에서 200과 빈 content를 반환하도록 수정 필요
    if (
      error instanceof ApiError
      && error.status === 404
      && error.errorCode === 'MEMBER_NOT_FOUND'
    ) {
      members.value = []
      updateFromResponse({
        page: page.value,
        size: size.value,
        totalElements: 0,
        totalPages: 0,
      })
      return
    }

    listError.value = getErrorMessage(error, '사원 목록을 불러오지 못했습니다.')
  } finally {
    if (requestId === listRequestId) {
      isLoading.value = false
    }
  }
}

async function handleSearch() {
  setPage(0)
  await fetchMembers()
}

async function handlePageSizeChange(value: string | number) {
  if (typeof value !== 'number') return

  setSize(value)
  await fetchMembers()
}

function handleStatusFilterChange(value: string | number) {
  if (
    value === ''
    || value === 'ACTIVE'
    || value === 'ON_LEAVE'
    || value === 'RESIGNED'
  ) {
    filterForm.status = value
  }
}

function handleDepartmentFilterChange(value: string | number) {
  if (typeof value === 'string') {
    filterForm.departmentId = value
  }
}

function handleRegisterDepartmentChange(value: string | number) {
  if (typeof value === 'string') {
    registerForm.departmentId = value
  }
}

function handleRegisterRoleChange(value: string | number) {
  if (
    value === 'EMPLOYEE'
    || value === 'DEPARTMENT_MANAGER'
    || value === 'ASSET_TEAM'
    || value === 'ASSET_MANAGE'
  ) {
    registerForm.role = value
  }
}

function handleDepartmentChangeSelection(value: string | number) {
  if (typeof value === 'string') {
    departmentChangeForm.departmentId = value
  }
}

async function changePage(nextPage: number) {
  if (nextPage < 0 || nextPage >= totalPages.value || nextPage === page.value) return
  setPage(nextPage)
  await fetchMembers()
}

function resetRegisterForm() {
  registerForm.memberNo = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.departmentId = ''
  registerForm.role = 'EMPLOYEE'
  registerSubmitted.value = false
}

function openRegisterDrawer() {
  closeDepartmentDrawer()
  resetRegisterForm()
  isRegisterDrawerOpen.value = true
}

function closeRegisterDrawer() {
  if (isRegistering.value) return
  isRegisterDrawerOpen.value = false
}

async function handleRegisterMember() {
  registerSubmitted.value = true
  if (hasRegisterError.value) return

  isRegistering.value = true
  try {
    const memberNo = registerForm.memberNo.trim()
    await memberApi.create({
      memberNo,
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      departmentId: registerForm.departmentId,
      role: registerForm.role,
    })

    isRegisterDrawerOpen.value = false
    setPage(0)
    // 사원 변경은 부서별 현재 인원수에도 영향을 주므로 두 데이터를 함께 갱신한다.
    await Promise.all([fetchMembers(), departmentStore.fetchAll()])
    notificationStore.success(
      '사원이 등록되었습니다.',
      '초기 비밀번호는 사번과 동일합니다.',
    )
  } catch (error) {
    notificationStore.error(
      '사원을 등록하지 못했습니다.',
      getErrorMessage(error, '입력 정보를 확인한 뒤 다시 시도해주세요.'),
    )
  } finally {
    isRegistering.value = false
  }
}

function openDepartmentDrawer(member: Member) {
  closeRegisterDrawer()
  memberToChangeDepartment.value = member
  departmentChangeForm.departmentId = member.departmentId
  isDepartmentDrawerOpen.value = true
}

function closeDepartmentDrawer() {
  if (isChangingDepartment.value) return
  isDepartmentDrawerOpen.value = false
  memberToChangeDepartment.value = null
  departmentChangeForm.departmentId = ''
}

async function handleChangeDepartment() {
  const member = memberToChangeDepartment.value
  if (!member || departmentChangeError.value) return

  isChangingDepartment.value = true
  try {
    await memberApi.changeDepartment(member.memberId, {
      departmentId: departmentChangeForm.departmentId,
    })

    isDepartmentDrawerOpen.value = false
    memberToChangeDepartment.value = null
    await Promise.all([fetchMembers(), departmentStore.fetchAll()])
    notificationStore.success('소속 부서가 변경되었습니다.')
  } catch (error) {
    notificationStore.error(
      '소속 부서를 변경하지 못했습니다.',
      getErrorMessage(error, '사원 상태와 부서 정보를 확인해주세요.'),
    )
  } finally {
    isChangingDepartment.value = false
  }
}

function requestResign(member: Member) {
  memberToResign.value = member
}

async function handleResignMember() {
  const member = memberToResign.value
  if (!member) return

  isResigning.value = true
  try {
    const response = await memberApi.resign(member.memberId)
    memberToResign.value = null
    await Promise.all([fetchMembers(), departmentStore.fetchAll()])
    notificationStore.success(
      '퇴사 처리가 완료되었습니다.',
      `유형자산 ${response.data.returnedTangibleAssetCount}개, 무형자산 ${response.data.returnedIntangibleAssetCount}개가 회수 처리되었습니다.`,
    )
  } catch (error) {
    notificationStore.error(
      '퇴사 처리에 실패했습니다.',
      getErrorMessage(error, '사원 상태를 확인한 뒤 다시 시도해주세요.'),
    )
  } finally {
    isResigning.value = false
  }
}

onMounted(async () => {
  await Promise.allSettled([
    departmentStore.fetchAll(),
    fetchMembers(),
  ])
})
</script>
