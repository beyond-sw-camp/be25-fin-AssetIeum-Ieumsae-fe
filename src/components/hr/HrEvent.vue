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
            이달 완료된 이벤트
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
          @row-click="openEventDetail"
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
              variant="outline"
              size="sm"
              @click.stop="openEventDetail(row)"
            >
              상세 보기
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

      <div>
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :disabled="isLoading"
          @change="movePage"
        />
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
        :departments="departments"
        :template="template"
        :is-loading-members="isLoadingMembers"
        :is-creating="isCreating"
        :error-message="formErrorMessage"
        @submit="handleCreateEvent"
      />
    </BaseDrawer>

    <HrEventDetail
      :is-open="isDetailDrawerOpen"
      :event="selectedEvent"
      :targets="selectedEventTargets"
      :template="template"
      :is-loading="isLoadingTargets"
      :is-completing="selectedEvent ? actingEventId === selectedEvent.hrEventId : false"
      :error-message="detailErrorMessage"
      @close="closeEventDetail"
      @refresh="loadSelectedEventTargets"
      @complete="handleSelectedEventComplete"
    />

    <ConfirmationModal
      :is-open="Boolean(pendingEventAction)"
      :title="pendingEventAction?.type === 'complete' ? 'HR 이벤트 완료' : 'HR 이벤트 삭제'"
      :message="pendingEventAction?.type === 'complete'
        ? '이 HR 이벤트와 모든 처리 대상을 완료하시겠습니까?'
        : '대기 중인 HR 이벤트를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.'"
      :confirm-text="pendingEventAction?.type === 'complete' ? '완료 처리' : '삭제'"
      :loading="isActing"
      @cancel="pendingEventAction = null"
      @confirm="confirmEventAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  CircleCheckBig,
  ClipboardClock,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-vue-next'

import { hrApi } from '@/api/hr.api'
import { memberApi } from '@/api/member.api'
import { departmentApi } from '@/api/department.api'
import { intangibleAssetApi } from '@/api/asset.api'
import { ticketApi } from '@/api/ticket.api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Pagination from '@/components/common/Pagination.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { useAuthStore, useNotificationStore } from '@/stores'
import type { Department, DropdownOption, Member, TicketListItem } from '@/types'
import { getApiErrorMessage } from '@/utils/apiError'
import { toFutureLocalDateTimeValue } from '@/utils/date'
import type {
  HrEventId,
  HrEventAssetType,
  HrEventAssetTargetResponse,
  HrEventResponse,
  HrEventStatus,
  HrEventType,
  HrTemplateResponse,
} from '@/types/hr'
import HrEventRegister, { type HrEventRegisterSubmitPayload } from './HrEventRegister.vue'
import HrEventDetail from './HrEventDetail.vue'

interface HrEventRow extends Record<string, unknown> {
  rowKey: string
  hrEventId: HrEventId
  eventNo: string
  targetMemberId: string
  targetMemberName: string
  departmentId: string
  departmentName: string
  eventType: HrEventType
  eventTypeLabel: string
  eventDate: string
  createdAt: string
  executedAt: string
  templateName: string
  status: HrEventStatus
  statusLabel: string
}

interface PendingEventAction {
  type: 'complete' | 'delete'
  row: HrEventRow
}

interface MemberAliasSource {
  id?: string | number | null
  memberId?: string | number | null
  memberNo?: string | number | null
  employeeNo?: string | number | null
  email?: string | null
  memberEmail?: string | null
  departmentId?: string | number | null
  departmentName?: string | null
  departmentNamePath?: string | null
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
}

const STATUS_LABEL: Record<HrEventStatus, string> = {
  PENDING: '대기 중',
  IN_PROGRESS: '실행 중',
  COMPLETED: '실행 완료',
  CANCELLED: '취소됨',
}

function apiErrorMessage(error: unknown, fallbackMessage: string) {
  return getApiErrorMessage(error, fallbackMessage)
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
const notificationStore = useNotificationStore()
const isRegisterDrawerOpen = ref(false)
const isDetailDrawerOpen = ref(false)
const isLoading = ref(false)
const isLoadingMembers = ref(false)
const isCreating = ref(false)
const actingEventId = ref<HrEventId | null>(null)
const pendingEventAction = ref<PendingEventAction | null>(null)
const errorMessage = ref('')
const formErrorMessage = ref('')
const detailErrorMessage = ref('')
const events = ref<HrEventResponse[]>([])
const selectedEvent = ref<HrEventRow | null>(null)
const selectedEventTargets = ref<HrEventAssetTargetResponse[]>([])
const isLoadingTargets = ref(false)
const eventDateSortOrder = ref<EventDateSortOrder>('DESC')
const members = ref<Member[]>([])
const departments = ref<Department[]>([])
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
function toEventRow(event: HrEventResponse): HrEventRow {
  const eventType = event.hrEventType ?? event.eventType ?? 'ONBOARDING'
  const status = event.hrEventStatus ?? event.status ?? 'PENDING'
  const eventId = event.hrEventId

  return {
    rowKey: String(eventId),
    hrEventId: eventId ?? '-',
    eventNo: event.hrEventNo ?? event.eventNo ?? '-',
    targetMemberId: String(event.memberId ?? event.targetMemberId ?? ''),
    targetMemberName: event.memberName ?? event.targetMemberName ?? '-',
    departmentId: event.departmentId ?? '',
    departmentName: event.departmentName ?? '',
    eventType,
    eventTypeLabel: EVENT_TYPE_LABEL[eventType] ?? eventType,
    eventDate: formatDate(event.eventDate),
    createdAt: event.createdAt ?? '',
    executedAt: event.executedAt ?? '',
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
    const request = {
      page: 0,
      size: 1000,
      hrEventType: filters.eventType || undefined,
      hrEventStatus: filters.status || undefined,
    }
    const firstResponse = await hrApi.getEvents(request)
    const remainingResponses = await Promise.all(
      Array.from(
        { length: Math.max(firstResponse.data.totalPages - 1, 0) },
        (_, index) => hrApi.getEvents({ ...request, page: index + 1 }),
      ),
    )
    const allEvents = [
      ...firstResponse.data.content,
      ...remainingResponses.flatMap((response) => response.data.content),
    ].sort(compareEventsByDate)
    pendingSummaryCount.value = allEvents.filter((event) => (
      (event.hrEventStatus ?? event.status) === 'PENDING'
    )).length
    completedThisMonthSummaryCount.value = allEvents.filter((event) => (
      (event.hrEventStatus ?? event.status) === 'COMPLETED'
      && isCurrentMonth(resolveEventDate(formatDate(event.eventDate)))
    )).length
    const totalPages = Math.max(Math.ceil(allEvents.length / pagination.size), 1)
    pagination.page = Math.min(pagination.page, totalPages - 1)
    pagination.totalElements = allEvents.length
    pagination.totalPages = totalPages
    const start = pagination.page * pagination.size
    events.value = allEvents.slice(start, start + pagination.size)
  } catch (error) {
    console.error('HR 이벤트 목록 조회 실패', error)
    events.value = []
    errorMessage.value = apiErrorMessage(error, 'HR 이벤트 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
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

async function loadDepartments() {
  try {
    const response = await departmentApi.getList({ page: 0, size: 999 })
    departments.value = response.data.content
  } catch (error) {
    console.error('HR 이벤트 부서 목록 조회 실패', error)
    departments.value = []
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

function normalizeId(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function getMemberId(value: MemberAliasSource | null | undefined) {
  return normalizeId(value?.memberId ?? value?.id)
}

function getMemberNo(value: MemberAliasSource | null | undefined) {
  return normalizeId(value?.memberNo ?? value?.employeeNo)
}

function getMemberEmail(value: MemberAliasSource | null | undefined) {
  return normalizeText(value?.email ?? value?.memberEmail).toLowerCase()
}

function getMemberDepartmentId(value: MemberAliasSource | null | undefined) {
  return normalizeId(
    value?.departmentId
    ?? value?.department?.departmentId
    ?? value?.department?.id,
  )
}

function getMemberDepartmentName(value: MemberAliasSource | null | undefined) {
  return normalizeText(
    value?.departmentName
    ?? value?.department?.departmentName
    ?? value?.department?.name,
  )
}

function getMemberDepartmentPath(value: MemberAliasSource | null | undefined) {
  return normalizeText(
    value?.departmentNamePath
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
  void Promise.all([
    members.value.length === 0 ? loadMembers() : Promise.resolve(),
    departments.value.length === 0 ? loadDepartments() : Promise.resolve(),
    template.value === null ? loadTemplate() : Promise.resolve(),
  ])
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
      eventDate: toFutureLocalDateTimeValue(payload.eventDate) ?? payload.eventDate,
      targetDepartmentId: payload.targetDepartmentId,
      assetTargets: payload.assetTargets,
    })
    notificationStore.success('HR 이벤트가 등록되었습니다.')
    handleCloseDrawer()
    await loadEvents()
  } catch (error) {
    console.error('HR 이벤트 등록 실패', error)
    formErrorMessage.value = apiErrorMessage(error, 'HR 이벤트를 등록하지 못했습니다.')
    notificationStore.error('HR 이벤트 등록 실패', formErrorMessage.value)
  } finally {
    isCreating.value = false
  }
}

function handleCompleteEvent(row: HrEventRow) {
  if (row.status !== 'IN_PROGRESS' || isActing.value) return
  pendingEventAction.value = { type: 'complete', row }
}

function handleDeleteEvent(row: HrEventRow) {
  if (row.status !== 'PENDING' || isActing.value) return
  pendingEventAction.value = { type: 'delete', row }
}

async function confirmEventAction() {
  const action = pendingEventAction.value
  if (!action || isActing.value) return

  actingEventId.value = action.row.hrEventId
  errorMessage.value = ''

  try {
    if (action.type === 'complete') {
      await hrApi.completeEvent(action.row.hrEventId)
      notificationStore.success('HR 이벤트가 완료 처리되었습니다.')
    } else {
      await hrApi.deleteEvent(action.row.hrEventId)
      notificationStore.success('HR 이벤트가 삭제되었습니다.')
    }
    await loadEvents()
  } catch (error) {
    console.error(`HR 이벤트 ${action.type === 'complete' ? '완료 처리' : '삭제'} 실패`, error)
    errorMessage.value = apiErrorMessage(
      error,
      action.type === 'complete'
        ? '실행 중인 HR 이벤트만 완료 처리할 수 있습니다.'
        : '대기 중인 HR 이벤트만 삭제할 수 있습니다.',
    )
    notificationStore.error(
      action.type === 'complete' ? 'HR 이벤트 완료 실패' : 'HR 이벤트 삭제 실패',
      errorMessage.value,
    )
  } finally {
    actingEventId.value = null
    pendingEventAction.value = null
  }
}

function openEventDetail(row: HrEventRow) {
  selectedEvent.value = row
  selectedEventTargets.value = []
  detailErrorMessage.value = ''
  isDetailDrawerOpen.value = true
  void loadSelectedEventTargets()
}

function closeEventDetail() {
  isDetailDrawerOpen.value = false
  selectedEvent.value = null
  selectedEventTargets.value = []
  detailErrorMessage.value = ''
}

async function loadSelectedEventTargets() {
  if (!selectedEvent.value) return

  isLoadingTargets.value = true
  detailErrorMessage.value = ''

  try {
    if (selectedEvent.value.eventType === 'ONBOARDING' && template.value === null) {
      await loadTemplate()
    }
    const response = await hrApi.getEventTargets(selectedEvent.value.hrEventId)
    const targets = response.data.length > 0
      ? await enrichEventTargetsWithTickets(response.data)
      : await loadEventTicketTargets()
    selectedEventTargets.value = await enrichIntangibleTargetNames(targets)
  } catch (error) {
    console.error('HR 이벤트 처리 대상 조회 실패', error)
    selectedEventTargets.value = []
    detailErrorMessage.value = 'HR 이벤트 자산 처리 대상을 불러오지 못했습니다.'
  } finally {
    isLoadingTargets.value = false
  }
}

async function enrichEventTargetsWithTickets(targets: HrEventAssetTargetResponse[]) {
  if (!selectedEvent.value) return targets
  if (targets.every(hasTicketStatusInfo)) return targets

  const candidateTickets = await loadEventCandidateTickets({ requireEventOwner: false })

  return targets.map((target) => {
    if (hasTicketStatusInfo(target)) return target

    const matchedTicket = candidateTickets.find((ticket) => isMatchingTargetTicket(target, ticket))
    return matchedTicket ? mergeTargetTicket(target, matchedTicket) : target
  })
}

function hasTicketStatusInfo(target: HrEventAssetTargetResponse) {
  return Boolean(
    target.ticketStatus
    || target.currentStatus
    || target.detailStatus
    || target.assetRequestStatus
    || target.requestTicketStatus
    || target.returnTicketStatus
    || target.assetReturnStatus
    || target.ticketNo,
  )
}

async function loadEventTicketTargets(): Promise<HrEventAssetTargetResponse[]> {
  if (!selectedEvent.value) return []

  const candidateTickets = await loadEventCandidateTickets({ requireEventOwner: true })
  if (selectedEvent.value.eventType === 'ONBOARDING') {
    return loadOnboardingTicketTargets(candidateTickets)
  }

  return candidateTickets.map(ticketToHrEventTarget)
}

async function loadEventCandidateTickets(options: { requireEventOwner: boolean }) {
  const response = await ticketApi.getList({
    page: 0,
    size: 1000,
  })

  return response.data.content.filter((ticket) => isSelectedEventTicket(ticket, options))
}

function loadOnboardingTicketTargets(candidateTickets: TicketListItem[]): HrEventAssetTargetResponse[] {
  if (!selectedEvent.value || selectedEvent.value.eventType !== 'ONBOARDING') return []

  const templateItems = template.value?.items ?? []

  return templateItems.flatMap((item) => {
    const matchedTickets = candidateTickets.filter((ticket) => (
      normalizeSearchText(ticket.requestedItemName)
        === normalizeSearchText(item.productName)
      || normalizeSearchText(ticket.productName)
        === normalizeSearchText(item.productName)
    ))

    return (matchedTickets.length > 0 ? matchedTickets : []).map((ticket) => ({
      ticketId: ticket.ticketId,
      ticketNo: ticket.ticketNo,
      ticketType: ticket.ticketType,
      ticketStatus: ticket.ticketStatus,
      detailStatus: ticket.detailStatus,
      assetType: item.assetType,
      assetItemId: item.assetItemId,
      productName: item.productName,
      requestedItemName: ticket.requestedItemName,
      status: ticket.ticketStatus,
      createdAt: ticket.requestedAt,
    }))
  })
}

function ticketToHrEventTarget(ticket: TicketListItem): HrEventAssetTargetResponse {
  return {
    ticketId: ticket.ticketId,
    ticketNo: ticket.ticketNo,
    ticketType: ticket.ticketType,
    ticketStatus: ticket.ticketStatus,
    detailStatus: ticket.detailStatus,
    assetType: normalizeHrAssetType(ticket.assetType),
    assetId: firstText(recordField(ticket, 'assetId')),
    assetCode: firstText(recordField(ticket, 'assetCode')),
    productName: firstText(
      ticket.requestedItemName,
      ticket.productName,
      recordField(ticket, 'assetName'),
      recordField(ticket, 'itemName'),
    ),
    requestedItemName: ticket.requestedItemName,
    status: ticket.ticketStatus,
    createdAt: ticket.requestedAt,
  }
}

function mergeTargetTicket(target: HrEventAssetTargetResponse, ticket: TicketListItem): HrEventAssetTargetResponse {
  return {
    ...target,
    ticketId: target.ticketId ?? ticket.ticketId,
    ticketNo: target.ticketNo ?? ticket.ticketNo,
    ticketType: target.ticketType ?? ticket.ticketType,
    ticketStatus: target.ticketStatus ?? ticket.ticketStatus,
    detailStatus: target.detailStatus ?? ticket.detailStatus,
    requestedItemName: target.requestedItemName ?? ticket.requestedItemName,
  }
}

function isMatchingTargetTicket(target: HrEventAssetTargetResponse, ticket: TicketListItem) {
  const targetAssetId = normalizeSearchText(target.assetId)
  const ticketAssetId = normalizeSearchText(firstText(recordField(ticket, 'assetId')))
  if (targetAssetId && ticketAssetId && targetAssetId === ticketAssetId) return true

  const targetAssetCode = normalizeSearchText(target.assetCode)
  const ticketAssetCode = normalizeSearchText(firstText(recordField(ticket, 'assetCode')))
  if (targetAssetCode && ticketAssetCode && targetAssetCode === ticketAssetCode) return true

  const targetName = normalizeSearchText(target.productName)
  const ticketName = normalizeSearchText(
    ticket.requestedItemName
    ?? ticket.productName
    ?? firstText(recordField(ticket, 'assetName'), recordField(ticket, 'itemName')),
  )

  return Boolean(targetName && ticketName && targetName === ticketName)
}

function isSelectedEventTicket(ticket: TicketListItem, options: { requireEventOwner: boolean }) {
  if (!selectedEvent.value) return false

  const requestedAfterEvent = isRequestedAfterEvent(ticket.requestedAt, selectedEvent.value.executedAt || selectedEvent.value.createdAt)
  if (!requestedAfterEvent) return false

  if (!options.requireEventOwner) return true

  const requesterMatches = selectedEvent.value.targetMemberId
    ? String(ticket.requesterId ?? '') === selectedEvent.value.targetMemberId
    : normalizeSearchText(ticket.requesterName) === normalizeSearchText(selectedEvent.value.targetMemberName)
  const departmentMatches = selectedEvent.value.departmentId
    ? String(ticket.departmentId ?? '') === selectedEvent.value.departmentId
    : normalizeSearchText(ticket.departmentName) === normalizeSearchText(selectedEvent.value.departmentName)

  return requesterMatches && departmentMatches
}

function isRequestedAfterEvent(requestedAt: string, eventStartedAt: string) {
  if (!eventStartedAt || !requestedAt) return true

  const requestedTime = new Date(requestedAt).getTime()
  const eventTime = new Date(eventStartedAt).getTime()
  if (Number.isNaN(requestedTime) || Number.isNaN(eventTime)) return true

  return requestedTime >= eventTime - 5 * 60 * 1000
}

function normalizeSearchText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function normalizeHrAssetType(value: unknown): HrEventAssetType | undefined {
  if (value === 'TANGIBLE' || value === 'INTANGIBLE') return value
  return undefined
}

async function enrichIntangibleTargetNames(targets: HrEventAssetTargetResponse[]) {
  const needsProductNames = targets.some((target) => (
    target.assetType === 'INTANGIBLE'
    && target.assetCode
    && (!target.productName || target.productName === target.assetCode)
  ))

  if (!needsProductNames) return targets

  try {
    const response = await intangibleAssetApi.getList({ page: 0, size: 1000 })
    const productNamesByAssetCode = new Map(
      response.data.content.map((asset) => {
        return [
          asset.assetCode,
          firstText(
            recordField(asset, 'productName'),
            asset.assetItemName,
            recordField(asset, 'itemName'),
          ),
        ] as const
      }),
    )

    return targets.map((target) => {
      if (target.assetType !== 'INTANGIBLE' || !target.assetCode) return target
      const productName = productNamesByAssetCode.get(target.assetCode)
      return productName ? { ...target, productName } : target
    })
  } catch (error) {
    console.error('HR 이벤트 무형자산 제품명 목록 조회 실패', error)
    return targets
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function recordField(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim()
}

async function handleSelectedEventComplete() {
  const event = selectedEvent.value
  if (!event) return

  await handleCompleteEvent(event)
  await loadSelectedEventTargets()
}

function handleWindowFocus() {
  if (!isDetailDrawerOpen.value || isLoadingTargets.value) return
  void loadSelectedEventTargets()
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
  if (status === 'CANCELLED') return 'text-danger'
  return 'text-text-sub'
}

function statusDotClass(status: HrEventStatus) {
  if (status === 'COMPLETED') return 'bg-success'
  if (status === 'IN_PROGRESS') return 'bg-primary'
  if (status === 'CANCELLED') return 'bg-danger'
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

onMounted(() => {
  window.addEventListener('focus', handleWindowFocus)
  void loadEvents()
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus)
})
</script>
