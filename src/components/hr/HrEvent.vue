<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 mb-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="page-title text-lg">
          우리 부서 HR 이벤트
        </h1>
      </div>

      <Button
        variant="primary"
        class="mr-3"
        :disabled="isLoadingMembers || isCreating"
        @click="openRegisterDrawer"
      >
        <UserPlus :size="15" />
        대상자 이벤트 등록
      </Button>
    </div>

    <div class="grid mx-1 shrink-0 px-1 md:grid-cols-2">
      <section class="card m-1 flex min-h-24 items-center justify-between border border-border bg-surface p-5">
        <div>
          <p class="text-xs font-semibold text-text-sub">
            실행 대기 중인 이벤트
          </p>
          <p class="mt-3 text-2xl font-bold text-primary">
            {{ pendingCount }}
            <span class="text-sm font-semibold text-text-sub">건</span>
          </p>
        </div>
        <ClipboardClock :size="42" class="text-primary/10" />
      </section>

      <section class="card m-1 flex min-h-24 items-center justify-between border border-border bg-surface p-5">
        <div>
          <p class="text-xs font-semibold text-text-sub">
            이달의 자동화 실행 완료
          </p>
          <p class="mt-3 text-2xl font-bold text-text-main">
            {{ completedThisMonthCount }}
            <span class="text-sm font-semibold text-text-sub">건</span>
          </p>
        </div>
        <CircleCheckBig :size="42" class="text-text-muted/20" />
      </section>
    </div>

    <section class="card mx-3 mt-4 flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-surface">
      <div class="flex shrink-0 flex-col gap-3 border-b border-border px-2 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2">
            <Dropdown
              :model-value="pagination.size"
              :options="PAGE_SIZE_OPTIONS"
              class="w-30! shrink-0"
              @update:model-value="handlePageSizeChange"
            />
            <span class="whitespace-nowrap text-xs text-text-sub">
              총 {{ pagination.totalElements }}건 중 {{ rangeText }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <div class="w-35 shrink-0">
            <Dropdown
              v-model="filters.eventType"
              :options="eventTypeFilterOptions"
            />
          </div>
          <div class="w-30 shrink-0">
            <Dropdown
              v-model="filters.status"
              :options="statusFilterOptions"
            />
          </div>
          <Button
            variant="primary"
            class="shrink-0"
            @click="handleFilterSearch"
          >
            <Search :size="14" />
            조회하기
          </Button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="m-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ errorMessage }}
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <Table
          :columns="eventColumns"
          :rows="eventRows"
          row-key="rowKey"
          :loading="isLoading"
          empty-text="등록된 HR 이벤트가 없습니다."
          @sort="handleSort"
        >
          <template #cell-eventNo="{ value }">
            <span class="font-semibold text-primary">{{ value }}</span>
          </template>

          <template #cell-targetMemberName="{ value }">
            <span class="font-bold text-text-main">{{ value }}</span>
          </template>

          <template #cell-eventTypeLabel="{ row }">
            <span :class="eventTypeBadgeClass(row.eventType)">
              {{ row.eventTypeLabel }}
            </span>
          </template>

          <template #cell-statusLabel="{ row }">
            <span class="inline-flex items-center gap-1.5 text-sm font-semibold" :class="statusTextClass(row.status)">
              <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(row.status)"></span>
              {{ row.statusLabel }}
            </span>
          </template>

          <template #cell-action="{ row }">
            <Button
              v-if="row.status === 'IN_PROGRESS'"
              size="sm"
              :disabled="isActing"
              :loading="actingEventId === row.hrEventId"
              @click.stop="handleCompleteEvent(row)"
            >
              완료 처리
            </Button>
            <Button
              v-else-if="row.status === 'PENDING'"
              variant="outline"
              size="sm"
              disabled
            >
              실행 대기
            </Button>
            <Button
              v-else
              variant="outline"
              size="sm"
              @click.stop="handleViewTickets(row)"
            >
              생성된 티켓 보기
            </Button>
          </template>

          <template #cell-delete="{ row }">
            <Button
              variant="danger"
              size="sm"
              class="gap-1"
              :disabled="row.status !== 'PENDING' || isActing"
              aria-label="HR 이벤트 삭제"
              @click.stop="handleDeleteEvent(row)"
            >
              <Trash2 :size="14" />
              <span class="hidden md:inline">삭제</span>
            </Button>
          </template>
        </Table>
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border px-4 pt-3">
        <div class="flex items-center justify-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="pagination.page <= 0 || isLoading"
            aria-label="이전 페이지"
            @click="movePage(pagination.page - 1)"
          >
            <ChevronLeft :size="16" />
          </button>
          <template v-for="item in paginationItems" :key="String(item)">
            <span
              v-if="item === 'ellipsis'"
              class="inline-flex h-8 min-w-8 items-center justify-center text-xs text-text-muted"
            >
              ...
            </span>
            <button
              v-else
              type="button"
              :class="[
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
                pagination.page === item
                  ? 'bg-primary text-white'
                  : 'text-text-sub hover:bg-surface-secondary',
              ]"
              :disabled="isLoading"
              @click="movePage(item)"
            >
              {{ item + 1 }}
            </button>
          </template>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="pagination.totalPages === 0 || pagination.page >= pagination.totalPages - 1 || isLoading"
            aria-label="다음 페이지"
            @click="movePage(pagination.page + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <BaseDrawer
      :is-open="isRegisterDrawerOpen"
      title="대상자 이벤트 등록"
      body-class="p-0"
      hide-footer
      @close="handleCloseDrawer"
    >
      <HrEventRegister
        ref="registerRef"
        :members="members"
        :template="template"
        :is-loading-members="isLoadingMembers"
        :is-creating="isCreating"
        :error-message="formErrorMessage"
        @submit="handleCreateEvent"
      />
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  ClipboardClock,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-vue-next'

import { hrApi } from '@/api/hr.api'
import { memberApi } from '@/api/member.api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { useAuthStore } from '@/stores'
import type { DropdownOption, Member, PageResponse } from '@/types'
import type {
  HrEventId,
  HrEventResponse,
  HrEventStatus,
  HrEventType,
  HrTemplateResponse,
} from '@/types/hr'
import HrEventRegister, { type HrEventRegisterSubmitPayload } from './HrEventRegister.vue'

interface HrEventRow extends Record<string, unknown> {
  rowKey: string
  hrEventId: HrEventId
  eventNo: string
  targetMemberName: string
  eventType: HrEventType
  eventTypeLabel: string
  eventDate: string
  templateName: string
  status: HrEventStatus
  statusLabel: string
}

interface MemberAliasSource {
  id?: string | number | null
  memberId?: string | number | null
  member_id?: string | number | null
  memberNo?: string | number | null
  employeeNo?: string | number | null
  employee_no?: string | number | null
  email?: string | null
  memberEmail?: string | null
  departmentId?: string | number | null
  department_id?: string | number | null
  departmentName?: string | null
  department_name?: string | null
  departmentNamePath?: string | null
  department_name_path?: string | null
  department?: {
    departmentId?: string | number | null
    id?: string | number | null
    name?: string | null
    departmentName?: string | null
    departmentNamePath?: string | null
  } | null
}

type EventDateSortOrder = 'ASC' | 'DESC'

const EVENT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: '10개씩 보기', value: 10 },
  { label: '20개씩 보기', value: 20 },
  { label: '50개씩 보기', value: 50 },
]

const EVENT_TYPE_LABEL: Record<HrEventType, string> = {
  ONBOARDING: '입사',
  OFFBOARDING: '퇴사',
  DEPARTMENT_TRANSFER: '부서 이동',
  LEAVE: '휴직',
  RETURN: '복직',
}

const STATUS_LABEL: Record<HrEventStatus, string> = {
  PENDING: '대기 중',
  IN_PROGRESS: '실행 중',
  COMPLETED: '실행 완료',
  CANCELLED: '취소됨',
  CANCELED: '취소됨',
}

const eventColumns = computed<Column<HrEventRow>[]>(() => [
  { key: 'eventNo', label: '이벤트 ID', align: 'center', width: '15%' },
  { key: 'targetMemberName', label: '대상자명', align: 'center', width: '13%' },
  { key: 'eventTypeLabel', label: '이벤트 유형', align: 'center', width: '13%' },
  {
    key: 'eventDate',
    label: '이벤트 예정일',
    align: 'center',
    width: '15%',
    sortable: true,
    sortDirection: eventDateSortOrder.value === 'ASC' ? 'asc' : 'desc',
  },
  { key: 'statusLabel', label: '상태', align: 'center', width: '12%' },
  { key: 'action', label: '관리(액션)', align: 'center', width: '15%' },
  { key: 'delete', label: '관리(삭제)', align: 'center', width: '12%' },
])

const authStore = useAuthStore()
const isRegisterDrawerOpen = ref(false)
const isLoading = ref(false)
const isLoadingMembers = ref(false)
const isCreating = ref(false)
const actingEventId = ref<HrEventId | null>(null)
const errorMessage = ref('')
const formErrorMessage = ref('')
const events = ref<HrEventResponse[]>([])
const eventDateSortOrder = ref<EventDateSortOrder>('ASC')
const members = ref<Member[]>([])
const template = ref<HrTemplateResponse | null>(null)
const pendingSummaryCount = ref(0)
const completedThisMonthSummaryCount = ref(0)
const registerRef = ref<InstanceType<typeof HrEventRegister> | null>(null)
const pagination = reactive({
  page: 0,
  size: EVENT_PAGE_SIZE,
  totalElements: 0,
  totalPages: 1,
})
const filters = reactive<{
  eventType: '' | HrEventType
  status: '' | HrEventStatus
}>({
  eventType: '',
  status: '',
})
const isActing = computed(() => actingEventId.value !== null)
const currentUser = computed(() => authStore.user as MemberAliasSource | null | undefined)
const currentDepartmentId = computed(() => (
  normalizeId(template.value?.departmentId) || getMemberDepartmentId(currentUser.value)
))
const currentDepartmentName = computed(() => (
  normalizeText(template.value?.departmentName) || getMemberDepartmentName(currentUser.value)
))
const currentDepartmentPath = computed(() => getMemberDepartmentPath(currentUser.value))
const currentMemberId = computed(() => getMemberId(currentUser.value))
const currentMemberNo = computed(() => getMemberNo(currentUser.value))
const currentMemberEmail = computed(() => getMemberEmail(currentUser.value))
const eventTypeFormOptions = computed<DropdownOption[]>(() => (
  Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ label, value }))
))
const eventTypeFilterOptions = computed<DropdownOption[]>(() => [
  { label: '이벤트 유형 전체', value: '' },
  ...eventTypeFormOptions.value,
])
const statusFilterOptions = computed<DropdownOption[]>(() => [
  { label: '상태 전체', value: '' },
  { label: '대기 중', value: 'PENDING' },
  { label: '실행 중', value: 'IN_PROGRESS' },
  { label: '실행 완료', value: 'COMPLETED' },
  { label: '취소됨', value: 'CANCELLED' },
])
const eventRows = computed<HrEventRow[]>(() => (
  [...events.value].sort(compareEventsByDate).map(toEventRow)
))
const pendingCount = computed(() => pendingSummaryCount.value)
const completedThisMonthCount = computed(() => completedThisMonthSummaryCount.value)
const matchedTemplateLabel = computed(() => getTemplateLabel(template.value))
const rangeStart = computed(() => pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1)
const rangeEnd = computed(() => Math.min((pagination.page + 1) * pagination.size, pagination.totalElements))
const rangeText = computed(() => (
  pagination.totalElements === 0 ? '0건' : `${rangeStart.value}-${rangeEnd.value}건`
))
const paginationItems = computed<Array<number | 'ellipsis'>>(() => {
  if (pagination.totalPages <= 7) {
    return Array.from({ length: pagination.totalPages }, (_, index) => index)
  }

  const items: Array<number | 'ellipsis'> = [0]
  const start = Math.max(1, pagination.page - 1)
  const end = Math.min(pagination.totalPages - 2, pagination.page + 1)

  if (start > 1) items.push('ellipsis')
  for (let index = start; index <= end; index += 1) items.push(index)
  if (end < pagination.totalPages - 2) items.push('ellipsis')
  items.push(pagination.totalPages - 1)

  return items
})

function toEventRow(event: HrEventResponse): HrEventRow {
  const eventType = event.hrEventType ?? event.eventType ?? 'ONBOARDING'
  const status = event.hrEventStatus ?? event.status ?? 'PENDING'
  const eventId = event.hrEventId

  return {
    rowKey: String(eventId),
    hrEventId: eventId,
    eventNo: event.hrEventNo ?? event.eventNo ?? '-',
    targetMemberName: event.memberName ?? event.targetMemberName ?? '-',
    eventType,
    eventTypeLabel: EVENT_TYPE_LABEL[eventType] ?? eventType,
    eventDate: formatDate(event.eventDate),
    templateName: event.templateName ?? event.matchedTemplateName ?? matchedTemplateLabel.value,
    status,
    statusLabel: STATUS_LABEL[status] ?? status,
  }
}

function compareEventsByDate(current: HrEventResponse, next: HrEventResponse) {
  const currentTime = getEventDateTime(current.eventDate)
  const nextTime = getEventDateTime(next.eventDate)

  if (currentTime === null && nextTime === null) return 0
  if (currentTime === null) return 1
  if (nextTime === null) return -1

  return eventDateSortOrder.value === 'ASC'
    ? currentTime - nextTime
    : nextTime - currentTime
}

async function loadEvents() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await hrApi.getEvents({
      page: pagination.page,
      size: pagination.size,
      hrEventType: filters.eventType || undefined,
      hrEventStatus: filters.status || undefined,
    })
    applyPage(response.data)
    void loadEventSummary()
  } catch (error) {
    console.error('HR 이벤트 목록 조회 실패', error)
    events.value = []
    errorMessage.value = 'HR 이벤트 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function loadEventSummary() {
  try {
    const [pendingResponse, completedResponse] = await Promise.all([
      hrApi.getEvents({ page: 0, size: 1, hrEventStatus: 'PENDING' }),
      hrApi.getEvents({ page: 0, size: 100, hrEventStatus: 'COMPLETED' }),
    ])

    pendingSummaryCount.value = pendingResponse.data.totalElements
    completedThisMonthSummaryCount.value = completedResponse.data.content.filter((event) => (
      isCurrentMonth(resolveEventDate(formatDate(event.eventDate)))
    )).length
  } catch (error) {
    console.error('HR 이벤트 요약 조회 실패', error)
    pendingSummaryCount.value = 0
    completedThisMonthSummaryCount.value = 0
  }
}

async function loadMembers() {
  isLoadingMembers.value = true

  try {
    const response = await memberApi.getList({
      page: 0,
      size: 999,
      status: 'ACTIVE',
    })

    members.value = filterMembersByDepartment(response.data.content)
  } catch (error) {
    console.error('HR 이벤트 대상자 목록 조회 실패', error)
    members.value = []
    errorMessage.value = '이벤트 대상자 목록을 불러오지 못했습니다.'
  } finally {
    isLoadingMembers.value = false
  }
}

async function loadTemplate() {
  try {
    const response = await hrApi.getTemplate()
    template.value = response.data
  } catch (error) {
    console.error('HR 이벤트 템플릿 조회 실패', error)
    template.value = null
  }
}

function applyPage(page: PageResponse<HrEventResponse>) {
  events.value = page.content
  pagination.page = page.page
  pagination.size = page.size
  pagination.totalElements = page.totalElements
  pagination.totalPages = page.totalPages
}

function normalizeId(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function getMemberId(value: MemberAliasSource | null | undefined) {
  return normalizeId(value?.memberId ?? value?.id ?? value?.member_id)
}

function getMemberNo(value: MemberAliasSource | null | undefined) {
  return normalizeId(value?.memberNo ?? value?.employeeNo ?? value?.employee_no)
}

function getMemberEmail(value: MemberAliasSource | null | undefined) {
  return normalizeText(value?.email ?? value?.memberEmail).toLowerCase()
}

function getMemberDepartmentId(value: MemberAliasSource | null | undefined) {
  return normalizeId(
    value?.departmentId
    ?? value?.department_id
    ?? value?.department?.departmentId
    ?? value?.department?.id,
  )
}

function getMemberDepartmentName(value: MemberAliasSource | null | undefined) {
  return normalizeText(
    value?.departmentName
    ?? value?.department_name
    ?? value?.department?.departmentName
    ?? value?.department?.name,
  )
}

function getMemberDepartmentPath(value: MemberAliasSource | null | undefined) {
  return normalizeText(
    value?.departmentNamePath
    ?? value?.department_name_path
    ?? value?.department?.departmentNamePath
    ?? getMemberDepartmentName(value),
  )
}

function findCurrentMember(items: Member[]) {
  return items.find((member) => {
    const memberSource = member as MemberAliasSource
    const memberId = getMemberId(memberSource)
    const memberNo = getMemberNo(memberSource)
    const memberEmail = getMemberEmail(memberSource)

    return Boolean(currentMemberId.value && memberId && memberId === currentMemberId.value)
      || Boolean(currentMemberNo.value && memberNo && memberNo === currentMemberNo.value)
      || Boolean(currentMemberEmail.value && memberEmail && memberEmail === currentMemberEmail.value)
  })
}

function filterMembersByDepartment(items: Member[]) {
  const currentMember = findCurrentMember(items)
  const baseDepartmentId = currentDepartmentId.value || getMemberDepartmentId(currentMember)
  const baseDepartmentName = currentDepartmentName.value || getMemberDepartmentName(currentMember)
  const baseDepartmentPath = currentDepartmentPath.value || getMemberDepartmentPath(currentMember)

  if (!baseDepartmentId && !baseDepartmentName && !baseDepartmentPath) {
    console.warn('로그인 사용자 부서 정보를 찾지 못했습니다.', {
      authUser: authStore.user,
      currentMember,
      sampleMember: items[0],
    })
    return []
  }

  return items.filter((member) => {
    const memberDepartmentId = getMemberDepartmentId(member)
    if (baseDepartmentId && memberDepartmentId) {
      return memberDepartmentId === baseDepartmentId
    }

    const memberDepartmentName = getMemberDepartmentName(member)
    if (baseDepartmentName && memberDepartmentName) {
      return memberDepartmentName === baseDepartmentName
    }

    const memberDepartmentPath = getMemberDepartmentPath(member)
    if (baseDepartmentName && memberDepartmentPath) {
      return memberDepartmentPath
        .split('>')
        .map((part) => part.trim())
        .includes(baseDepartmentName)
    }

    if (baseDepartmentPath && memberDepartmentPath) {
      return memberDepartmentPath === baseDepartmentPath
    }

    return false
  })
}

function openRegisterDrawer() {
  formErrorMessage.value = ''
  isRegisterDrawerOpen.value = true
}

function handleFilterSearch() {
  pagination.page = 0
  void loadEvents()
}

function handlePageSizeChange(value: string | number) {
  const nextSize = Number(value)
  if (!Number.isInteger(nextSize) || nextSize <= 0 || nextSize === pagination.size) return

  pagination.size = nextSize
  pagination.page = 0
  void loadEvents()
}

function handleSort(key: string) {
  if (key !== 'eventDate') return
  eventDateSortOrder.value = eventDateSortOrder.value === 'ASC' ? 'DESC' : 'ASC'
}

function handleCloseDrawer() {
  registerRef.value?.resetForm()
  formErrorMessage.value = ''
  isRegisterDrawerOpen.value = false
}

async function handleCreateEvent(payload: HrEventRegisterSubmitPayload) {
  if (isCreating.value) return

  const selectedMember = members.value.find((member) => getMemberId(member) === payload.memberId)
  if (!selectedMember) {
    formErrorMessage.value = '이벤트 대상자를 다시 선택해주세요.'
    return
  }

  isCreating.value = true
  formErrorMessage.value = ''

  try {
    await hrApi.createEvent({
      memberId: getMemberId(selectedMember),
      eventType: payload.eventType,
      eventDate: toLocalDateTime(payload.eventDate),
    })
    handleCloseDrawer()
    await loadEvents()
  } catch (error) {
    console.error('HR 이벤트 등록 실패', error)
    formErrorMessage.value = 'HR 이벤트를 등록하지 못했습니다.'
  } finally {
    isCreating.value = false
  }
}

async function handleCompleteEvent(row: HrEventRow) {
  if (isActing.value) return

  actingEventId.value = row.hrEventId
  errorMessage.value = ''

  try {
    await hrApi.completeEvent(row.hrEventId)
    await loadEvents()
  } catch (error) {
    console.error('HR 이벤트 완료 처리 실패', error)
    errorMessage.value = '실행 중인 HR 이벤트만 완료 처리할 수 있습니다.'
  } finally {
    actingEventId.value = null
  }
}

async function handleDeleteEvent(row: HrEventRow) {
  if (row.status !== 'PENDING' || isActing.value) return
  if (!window.confirm('대기 중인 HR 이벤트를 삭제할까요?')) return

  actingEventId.value = row.hrEventId
  errorMessage.value = ''

  try {
    await hrApi.deleteEvent(row.hrEventId)
    await loadEvents()
  } catch (error) {
    console.error('HR 이벤트 삭제 실패', error)
    errorMessage.value = '대기 중인 HR 이벤트만 삭제할 수 있습니다.'
  } finally {
    actingEventId.value = null
  }
}

function handleViewTickets(row: HrEventRow) {
  errorMessage.value = `${row.eventNo} 이벤트로 생성된 티켓 조회 화면은 API 명세/백엔드 확인이 필요합니다.`
}

function movePage(page: number) {
  if (page < 0 || page >= pagination.totalPages || page === pagination.page) return
  pagination.page = page
  void loadEvents()
}

function eventTypeBadgeClass(eventType: HrEventType) {
  const baseClass = 'inline-flex rounded-full px-2.5 py-1 text-xs font-bold'
  if (eventType === 'ONBOARDING') return `${baseClass} bg-blue-100 text-blue-700`
  if (eventType === 'OFFBOARDING') return `${baseClass} bg-red-100 text-red-700`
  if (eventType === 'DEPARTMENT_TRANSFER') return `${baseClass} bg-orange-100 text-orange-700`
  return `${baseClass} bg-surface-secondary text-text-sub`
}

function statusTextClass(status: HrEventStatus) {
  if (status === 'COMPLETED') return 'text-success'
  if (status === 'IN_PROGRESS') return 'text-primary'
  if (status === 'CANCELLED' || status === 'CANCELED') return 'text-danger'
  return 'text-text-sub'
}

function statusDotClass(status: HrEventStatus) {
  if (status === 'COMPLETED') return 'bg-success'
  if (status === 'IN_PROGRESS') return 'bg-primary'
  if (status === 'CANCELLED' || status === 'CANCELED') return 'bg-danger'
  return 'bg-border'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return value.slice(0, 10)
}

function getTemplateLabel(value: HrTemplateResponse | null) {
  if (!value) return '-'
  if (value.name) return value.name
  if (value.departmentName) return `${value.departmentName} HR 템플릿`
  return '우리 부서 HR 템플릿'
}

function toLocalDateTime(value: string) {
  return value.includes('T') ? value : `${value}T00:00:00`
}

function resolveEventDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getEventDateTime(value?: string | null) {
  if (!value) return null

  const date = resolveEventDate(value.includes('T') ? value : `${value}T00:00:00`)
  return date?.getTime() ?? null
}

function isCurrentMonth(date: Date | null) {
  if (!date) return false

  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

onMounted(async () => {
  await loadTemplate()
  void loadMembers()
  void loadEvents()
})
</script>
