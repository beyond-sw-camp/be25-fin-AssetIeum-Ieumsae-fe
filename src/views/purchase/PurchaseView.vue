<template>
  <div class="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden bg-background text-text-main">
    <section v-if="selectedPlanId" class="relative flex h-full min-h-0 flex-col bg-background text-text-main">
      <div class="min-h-0 flex-1 overflow-y-auto pb-14">
        <div class="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-2">
          <div class="mb-3 flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-sub transition hover:bg-surface-secondary hover:text-primary"
              aria-label="구매 계획 목록으로 돌아가기"
              @click="closeDetail"
            >
              <ArrowLeft :size="15" />
            </button>
            <p class="page-subtitle">구매 계획 &gt; 상세내용</p>
          </div>

          <div
            v-if="detailError"
            class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
          >
            <p class="text-sm font-semibold text-danger">{{ detailError }}</p>
            <Button variant="outline" size="sm" @click="fetchPlanDetail(selectedPlanId)">
              <RefreshCw :size="15" />
              다시 조회
            </Button>
          </div>

          <div v-if="isDetailLoading" class="space-y-4">
            <div class="h-12 animate-pulse rounded-xl bg-surface-secondary" />
            <div class="h-44 animate-pulse rounded-2xl bg-surface-secondary" />
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="h-72 animate-pulse rounded-2xl bg-surface-secondary" />
              <div class="h-72 animate-pulse rounded-2xl bg-surface-secondary" />
            </div>
          </div>

          <div v-else-if="selectedPlan" class="flex flex-col gap-4">
            <header class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xl font-semibold text-text-muted">#{{ selectedPlan.planNo }}</span>
                  <span class="text-text-muted">|</span>
                  <h1 class="text-2xl font-bold text-text-main">{{ purchasePlanTitle }}</h1>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span :class="['rounded-full px-3 py-1.5 text-xs font-bold', getStatusBadgeClass(displayPlanStatus(selectedPlan))]">
                    {{ getStatusLabel(displayPlanStatus(selectedPlan)) }}
                  </span>
                  <span class="text-sm text-text-sub">
                    신청 팀원 {{ selectedPlan.requesterName || '-' }} · 생성일 {{ formatDateTime(selectedPlan.createdAt) }}
                  </span>
                </div>
              </div>

              <div v-if="canChangeStatus" class="w-full shrink-0 lg:w-60">
                <div class="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    for="purchase-plan-status-selector"
                    class="text-xs font-semibold text-text-muted"
                  >
                    상태 변경
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    class="shrink-0"
                    :loading="isStatusSaving"
                    :disabled="!canSaveSelectedStatus"
                    @click="changeSelectedStatus"
                  >
                    <Save :size="14" />
                    상태 저장
                  </Button>
                </div>
                <Dropdown
                  id="purchase-plan-status-selector"
                  :model-value="selectedStatusForDropdown"
                  :options="STATUS_ACTION_OPTIONS"
                  :disabled="isStatusSaving"
                  menu-align="right"
                  aria-label="구매 계획 상태"
                  @update:model-value="handleStatusSelect"
                />
              </div>
            </header>

            <div class="space-y-4">
              <div class="grid items-stretch gap-4 lg:grid-cols-2">
                <TicketDetailCard title="구매 계획 내역" class="h-full">
                  <template #icon>
                    <ClipboardCheck :size="18" class="text-primary" />
                  </template>

                  <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                      v-for="item in purchasePlanInfoItems"
                      :key="item.label"
                      class="border-b border-border pb-3"
                    >
                      <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                      <dd class="mt-1.5 break-words text-sm font-semibold text-text-main">
                        {{ item.value }}
                      </dd>
                    </div>
                  </dl>
                </TicketDetailCard>

                <TicketDetailCard title="집행 및 상태 정보" class="h-full">
                  <template #icon>
                    <ReceiptText :size="18" class="text-primary" />
                  </template>

                  <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                      v-for="item in purchaseExecutionInfoItems"
                      :key="item.label"
                      class="border-b border-border pb-3"
                    >
                      <dt class="text-xs font-semibold text-text-muted">{{ item.label }}</dt>
                      <dd class="mt-1.5 break-words text-sm font-semibold text-text-main">
                        {{ item.value }}
                      </dd>
                    </div>
                  </dl>
                </TicketDetailCard>
              </div>

              <TicketDetailCard title="구매 품목" padding="none">
                <template #icon>
                  <PackageCheck :size="18" class="text-primary" />
                </template>

                <Table
                  :columns="planItemColumns"
                  :rows="selectedPlan.items"
                  row-key="itemId"
                  empty-text="구매 품목이 없습니다."
                  class="rounded-none! border-0! [&_table]:min-w-[860px]"
                >
                  <template #cell-category="{ value }">
                    <span class="text-text-sub">{{ value || '-' }}</span>
                  </template>

                  <template #cell-itemName="{ value }">
                    <span class="font-semibold text-text-main">{{ value }}</span>
                  </template>

                  <template #cell-isStandard="{ row }">
                    <span>{{ row.isStandard === false ? '비표준' : '표준' }}</span>
                  </template>

                  <template #cell-estimatedUnitPrice="{ value }">
                    <span>{{ formatCurrency(Number(value || 0)) }}</span>
                  </template>

                  <template #cell-totalAmount="{ value }">
                    <span class="font-semibold">{{ formatCurrency(Number(value || 0)) }}</span>
                  </template>

                  <template #cell-delivery="{ row }">
                    <span v-if="row.receivedAt" class="text-xs font-semibold text-success">
                      {{ formatDate(row.receivedAt) }}
                    </span>
                    <Button
                      v-else
                      variant="outline"
                      size="sm"
                      :disabled="!canConfirmDelivery(row) || isConfirmingItem === row.itemId"
                      :loading="isConfirmingItem === row.itemId"
                      @click.stop="confirmDelivery(row)"
                    >
                      납품 확인
                    </Button>
                  </template>
                </Table>
              </TicketDetailCard>

              <TicketDetailCard title="증빙자료">
                <template #icon>
                  <FileWarning :size="18" class="text-text-muted" />
                </template>

                <div class="rounded-xl border border-dashed border-border bg-surface-secondary/40 px-4 py-3">
                  <p class="text-sm leading-6 text-text-sub">
                    구매 증빙자료 업로드 API는 추후 개발 예정이라 현재 화면에서는 업로드를 연결하지 않았습니다.
                  </p>
                </div>
              </TicketDetailCard>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="canApprovePlan"
        class="absolute -inset-x-4 -bottom-4 z-20 flex min-h-14 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-6 py-2"
      >
        <Button
          variant="outline"
          class="shrink-0 border-danger! text-danger! hover:bg-danger/5!"
          :disabled="!canReviewCurrentPlan || isStatusSaving"
          :loading="isStatusSaving && pendingReviewStatus === 'REJECTED'"
          @click="reviewPlan('REJECTED')"
        >
          반려
        </Button>
        <Button
          class="shrink-0"
          :disabled="!canReviewCurrentPlan || isStatusSaving"
          :loading="isStatusSaving && pendingReviewStatus === 'APPROVED'"
          @click="reviewPlan('APPROVED')"
        >
          승인
        </Button>
      </div>
    </section>

    <template v-else>
      <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="page-subtitle mb-1">구매 계획</p>
          <h1 class="page-title">구매 계획 및 집행 관리</h1>
        </div>
        <Button @click="openCreateDrawer">
          <Plus :size="16" />
          구매 계획 등록
        </Button>
      </header>

      <section class="mx-3 mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <article
          v-for="card in statCards"
          :key="card.label"
          :class="[
            'relative overflow-hidden rounded-xl border bg-surface p-4 shadow-sm transition-colors duration-300',
            card.className,
          ]"
        >
          <span :class="['absolute inset-y-0 left-0 w-1', card.accentClass]" aria-hidden="true"></span>
          <p class="text-xs font-semibold text-text-sub">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-bold text-text-main">{{ card.value }}건</p>
        </article>
      </section>

      <section class="card mx-3 mb-6 flex flex-col border border-border">
        <div class="flex shrink-0 flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <Dropdown
              :model-value="pageSize"
              :options="PAGE_SIZE_OPTIONS"
              class="w-32!"
              aria-label="페이지 크기"
              @update:model-value="handlePageSizeChange"
            />
          </div>

          <form class="flex w-full flex-wrap items-center gap-2 xl:max-w-4xl xl:justify-end" @submit.prevent="handleSearch">
            <Dropdown
              :model-value="statusFilter"
              :options="STATUS_FILTER_OPTIONS"
              class="w-40! shrink-0"
              menu-align="right"
              aria-label="진행 상태"
              @update:model-value="handleStatusChange"
            />
            <Dropdown
              :model-value="requesterFilter"
              :options="requesterOptions"
              class="w-44! shrink-0"
              menu-align="right"
              aria-label="신청한 구매자산팀원"
              @update:model-value="handleRequesterChange"
            />
            <input
              v-model="keywordInput"
              type="search"
              class="h-9 min-w-[240px] flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 xl:max-w-[22rem]"
              placeholder="계획 번호 또는 품목 검색"
              aria-label="구매 계획 검색"
            />
            <Button type="submit" class="shrink-0">
              <Search :size="16" />
              조회하기
            </Button>
          </form>
        </div>

        <div
          v-if="listError"
          class="mt-4 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
        >
          <p class="text-sm font-semibold text-danger">{{ listError }}</p>
          <Button variant="outline" size="sm" @click="refreshList">
            <RefreshCw :size="15" />
            다시 조회
          </Button>
        </div>

        <div class="mt-4 rounded-xl border border-border bg-surface">
          <Table
            :columns="columns"
            :rows="plans"
            :loading="isListLoading"
            row-key="planId"
            empty-text="조회된 구매 계획이 없습니다."
            class="border-0!"
            @row-click="openDetail"
          >
            <template #cell-planNo="{ value }">
              <span class="font-bold text-text-main">{{ value }}</span>
            </template>

            <template #cell-itemSummary="{ row }">
              <span class="line-clamp-1 font-semibold text-text-main">{{ row.itemSummary || '-' }}</span>
            </template>

            <template #cell-requesterName="{ row }">
              <span>{{ row.requesterName || '-' }}</span>
            </template>

            <template #cell-estimatedAmount="{ value }">
              <span class="font-semibold">{{ formatCurrency(Number(value || 0)) }}</span>
            </template>

            <template #cell-createdAt="{ value }">
              <span class="text-text-sub">{{ formatDate(String(value)) }}</span>
            </template>

            <template #cell-status="{ row }">
              <span :class="['rounded-full px-2.5 py-1 text-xs font-bold', getStatusBadgeClass(displayListStatus(row))]">
                {{ getStatusLabel(displayListStatus(row)) }}
              </span>
            </template>
          </Table>
        </div>

        <div class="flex shrink-0 items-center justify-center border-t border-border py-3">
          <div class="flex items-center justify-center gap-1">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="page === 0 || isListLoading"
              aria-label="이전 페이지"
              @click="page -= 1"
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
                  page === item
                    ? 'bg-primary text-white'
                    : 'text-text-sub hover:bg-surface-secondary',
                ]"
                @click="page = item"
              >
                {{ item + 1 }}
              </button>
            </template>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="totalPages === 0 || page >= totalPages - 1 || isListLoading"
              aria-label="다음 페이지"
              @click="page += 1"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </section>
    </template>

    <BaseDrawer
      :is-open="isCreateDrawerOpen"
      title="신규 구매 계획 등록"
      panel-class="w-full max-w-5xl"
      body-class="min-h-0 overflow-hidden! p-0"
      hide-footer
      @close="closeCreateDrawer"
    >
      <div class="flex h-full flex-col">
        <div
          v-if="eligibleError"
          class="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
        >
          <p class="text-sm font-semibold text-danger">{{ eligibleError }}</p>
          <Button variant="outline" size="sm" @click="fetchEligibleTickets">
            <RefreshCw :size="15" />
            다시 조회
          </Button>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden px-6 py-4">
          <div v-if="isEligibleLoading" class="flex h-full min-h-[320px] items-center justify-center">
            <Loader2 class="animate-spin text-primary" :size="28" />
          </div>

          <Table
            v-else
            :columns="eligibleTicketColumns"
            :rows="eligibleTickets"
            row-key="ticketId"
            empty-text="구매 계획으로 등록할 결재 완료 요청이 없습니다."
            class="h-full max-w-full rounded-xl! [&_table]:table-fixed [&_td]:align-middle [&_th]:whitespace-nowrap"
            @row-click="handleEligibleTicketRowClick"
          >
            <template #cell-select="{ row }">
              <input
                type="checkbox"
                class="pointer-events-none h-4 w-4 rounded border-border text-primary focus:ring-primary"
                :checked="selectedTicketIds.includes(row.ticketId)"
                :disabled="!row.canCreate"
                :aria-label="`${row.ticket.ticketNo} 선택`"
                tabindex="-1"
              />
            </template>

            <template #cell-ticketNo="{ row }">
              <span class="block truncate font-bold text-text-main">{{ row.ticket.ticketNo }}</span>
            </template>

            <template #cell-requesterName="{ row }">
              <span class="block truncate">{{ row.ticket.requesterName || '-' }}</span>
            </template>

            <template #cell-itemName="{ value }">
              <span class="block truncate font-semibold text-text-main" :title="String(value || '-')">
                {{ value || '-' }}
              </span>
            </template>

            <template #cell-categoryName="{ value }">
              <span class="block truncate" :title="String(value || '-')">{{ value || '-' }}</span>
            </template>

            <template #cell-estimatedUnitPrice="{ value }">
              <span class="whitespace-nowrap">{{ formatCurrency(Number(value || 0)) }}</span>
            </template>

            <template #cell-validation="{ row }">
              <span v-if="row.canCreate" class="whitespace-nowrap text-xs font-semibold text-success">등록 가능</span>
              <span v-else class="block truncate text-xs font-semibold text-danger" :title="row.disabledReason">
                {{ row.disabledReason }}
              </span>
            </template>
          </Table>
        </div>

        <div class="border-t border-border px-6 py-4">
          <div class="mb-4 flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3">
            <span class="text-sm font-semibold text-text-sub">선택 {{ selectedEligibleTickets.length }}건</span>
            <span class="text-lg font-bold text-text-main">합계 {{ formatCurrency(selectedEstimatedAmount) }}</span>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="closeCreateDrawer">취소</Button>
            <Button
              :disabled="selectedEligibleTickets.length === 0 || isCreatingPlan"
              :loading="isCreatingPlan"
              @click="createPlan"
            >
              등록
            </Button>
          </div>
        </div>
      </div>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  ReceiptText,
  Save,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, memberApi, purchaseApi, ticketApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import TicketDetailCard from '@/components/ticket/TicketDetailCard.vue'
import { usePermission } from '@/composables/usePermission'
import type {
  DropdownOption,
  Member,
  PurchasePlanCreateItem,
  PurchasePlanDetail,
  PurchasePlanItem,
  PurchasePlanListItem,
  PurchasePlanStatistics,
  PurchasePlanStatus,
  TicketDetail,
  TicketListItem,
} from '@/types'

interface EligibleTicket {
  ticketId: string
  ticket: TicketListItem
  detail: TicketDetail
  itemName: string
  categoryName: string
  quantity: number
  estimatedUnitPrice: number
  assetItemId: number | null
  isStandard: boolean
  canCreate: boolean
  disabledReason: string
}

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: '10개씩 보기', value: 10 },
  { label: '20개씩 보기', value: 20 },
  { label: '50개씩 보기', value: 50 },
]

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { label: '전체 상태', value: '' },
  { label: '승인 대기', value: 'REQUESTED' },
  { label: '승인', value: 'APPROVED' },
  { label: '반려', value: 'REJECTED' },
  { label: '발주', value: 'ORDERED' },
  { label: '납품 확인', value: 'DELIVERED' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
]

const STATUS_ACTION_OPTIONS: DropdownOption[] = [
  { label: '승인 대기', value: 'REQUESTED' },
  { label: '승인', value: 'APPROVED' },
  { label: '반려', value: 'REJECTED' },
  { label: '발주', value: 'ORDERED' },
  { label: '납품 확인', value: 'DELIVERED' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
]

const STATUS_LABEL: Record<PurchasePlanStatus, string> = {
  REQUESTED: '승인 대기',
  APPROVED: '승인',
  REJECTED: '반려',
  ORDERED: '발주',
  DELIVERED: '납품 확인',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const columns: Column<PurchasePlanListItem>[] = [
  { key: 'planNo', label: '구매 계획 번호', width: '20%', align: 'center' },
  { key: 'itemSummary', label: '요청 품목', width: '28%', align: 'center' },
  { key: 'requesterName', label: '신청 팀원', width: '14%', align: 'center' },
  { key: 'itemCount', label: '품목 수', width: '10%', align: 'center' },
  { key: 'estimatedAmount', label: '예상 금액', width: '16%', align: 'center' },
  { key: 'status', label: '상태', width: '12%', align: 'center' },
]

const planItemColumns: Column<PurchasePlanItem>[] = [
  { key: 'category', label: '분류', width: '14%', align: 'center' },
  { key: 'itemName', label: '품목', width: '24%', align: 'center' },
  { key: 'isStandard', label: '표준 여부', width: '12%', align: 'center' },
  { key: 'quantity', label: '수량', width: '10%', align: 'center' },
  { key: 'estimatedUnitPrice', label: '단가', width: '14%', align: 'center' },
  { key: 'totalAmount', label: '합계', width: '14%', align: 'center' },
  { key: 'delivery', label: '납품', width: '12%', align: 'center' },
]

const eligibleTicketColumns: Column<EligibleTicket>[] = [
  { key: 'select', label: '선택', width: '7%', align: 'center' },
  { key: 'ticketNo', label: '티켓 번호', width: '15%', align: 'center' },
  { key: 'requesterName', label: '티켓 요청자', width: '13%', align: 'center' },
  { key: 'itemName', label: '품목', width: '22%', align: 'center' },
  { key: 'categoryName', label: '분류', width: '13%', align: 'center' },
  { key: 'quantity', label: '수량', width: '8%', align: 'center' },
  { key: 'estimatedUnitPrice', label: '예상 단가', width: '12%', align: 'center' },
  { key: 'validation', label: '확인', width: '10%', align: 'center' },
]

const EMPTY_STATISTICS: PurchasePlanStatistics = {
  totalCount: 0,
  requestedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  orderedCount: 0,
  deliveredCount: 0,
  completedCount: 0,
  cancelledCount: 0,
}

const { hasRole } = usePermission()
const route = useRoute()
const router = useRouter()
const canApprovePlan = computed(() => hasRole('ADMIN', 'SUPER_ADMIN', 'ASSET_MANAGER'))
const canChangeStatus = computed(() => hasRole('ADMIN', 'SUPER_ADMIN', 'ASSET_MANAGER'))

const plans = ref<PurchasePlanListItem[]>([])
const statistics = ref<PurchasePlanStatistics>({ ...EMPTY_STATISTICS })
const page = ref(0)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(0)
const statusFilter = ref<PurchasePlanStatus | ''>('')
const requesterFilter = ref('')
const keywordInput = ref('')
const keyword = ref('')
const isListLoading = ref(false)
const listError = ref('')
const assetTeamMembers = ref<Member[]>([])

const selectedPlanId = ref<number | null>(null)
const selectedPlan = ref<PurchasePlanDetail | null>(null)
const isDetailLoading = ref(false)
const detailError = ref('')
const nextStatus = ref<PurchasePlanStatus | ''>('')
const isStatusSaving = ref(false)
const pendingReviewStatus = ref<PurchasePlanStatus | null>(null)
const isConfirmingItem = ref<number | string | null>(null)

const isCreateDrawerOpen = ref(false)
const eligibleTickets = ref<EligibleTicket[]>([])
const selectedTicketIds = ref<string[]>([])
const isEligibleLoading = ref(false)
const eligibleError = ref('')
const isCreatingPlan = ref(false)

const requesterOptions = computed<DropdownOption[]>(() => [
  { label: '전체 팀원', value: '' },
  ...assetTeamMembers.value.map((member) => ({
    label: member.name,
    value: member.memberId,
  })),
])

const statCards = computed(() => [
  {
    label: '전체',
    value: statistics.value.totalCount,
    className: 'border-border',
    accentClass: 'bg-text-muted',
  },
  {
    label: '승인 대기',
    value: statistics.value.requestedCount,
    className: 'border-warning/30 ',
    accentClass: 'bg-warning',
  },
  {
    label: '발주',
    value: statistics.value.orderedCount,
    className: 'border-primary/30 bg-primary/5',
    accentClass: 'bg-primary',
  },
  {
    label: '납품 확인',
    value: statistics.value.deliveredCount,
    className: 'border-success/30 bg-success/5',
    accentClass: 'bg-success',
  },
])

const selectedEligibleTickets = computed(() =>
  eligibleTickets.value.filter((item) => selectedTicketIds.value.includes(item.ticket.ticketId)),
)

const selectedEstimatedAmount = computed(() =>
  selectedEligibleTickets.value.reduce((sum, item) => sum + item.estimatedUnitPrice * item.quantity, 0),
)

const canReviewCurrentPlan = computed(() => {
  if (!selectedPlan.value) return false
  return displayPlanStatus(selectedPlan.value) === 'REQUESTED'
})

const selectedStatusForDropdown = computed(() => {
  if (nextStatus.value) return nextStatus.value
  return selectedPlan.value ? displayPlanStatus(selectedPlan.value) : ''
})

const canSaveSelectedStatus = computed(() => {
  if (!selectedPlan.value || !nextStatus.value || isStatusSaving.value) return false
  return nextStatus.value !== displayPlanStatus(selectedPlan.value)
})

const purchasePlanTitle = computed(() => {
  if (!selectedPlan.value) return '구매 계획 상세'
  const firstItemName = selectedPlan.value.items[0]?.itemName
  if (firstItemName) {
    const extraCount = selectedPlan.value.items.length - 1
    return extraCount > 0 ? `${firstItemName} 외 ${extraCount}건` : firstItemName
  }
  return '구매 계획 상세'
})

const purchasePlanInfoItems = computed(() => {
  if (!selectedPlan.value) return []

  return [
    { label: '구매 계획 번호', value: selectedPlan.value.planNo },
    { label: '신청 팀원', value: selectedPlan.value.requesterName || '-' },
    { label: '품목 수', value: `${selectedPlan.value.items.length}종` },
    { label: '생성 일시', value: formatDateTime(selectedPlan.value.createdAt) },
    { label: '수정 일시', value: formatDateTime(selectedPlan.value.updatedAt) },
    { label: '현재 상태', value: getStatusLabel(displayPlanStatus(selectedPlan.value)) },
  ]
})

const purchaseExecutionInfoItems = computed(() => {
  if (!selectedPlan.value) return []

  const totalQuantity = selectedPlan.value.items.reduce((sum, item) => sum + item.quantity, 0)
  const deliveredCount = selectedPlan.value.items.filter((item) => item.receivedAt).length
  const standardCount = selectedPlan.value.items.filter((item) => item.isStandard !== false).length
  const actualAmount = selectedPlan.value.actualAmount == null
    ? '-'
    : formatCurrency(selectedPlan.value.actualAmount)

  return [
    { label: '예상 금액', value: formatCurrency(selectedPlan.value.estimatedAmount) },
    { label: '실제 집행 금액', value: actualAmount },
    { label: '총 수량', value: `${totalQuantity}개` },
    { label: '납품 확인', value: `${deliveredCount}/${selectedPlan.value.items.length}건` },
    { label: '표준 품목', value: `${standardCount}건` },
    { label: '비표준 품목', value: `${selectedPlan.value.items.length - standardCount}건` },
  ]
})

const paginationItems = computed<Array<number | 'ellipsis'>>(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, index) => index)
  }

  const items: Array<number | 'ellipsis'> = [0]
  const start = Math.max(1, page.value - 1)
  const end = Math.min(totalPages.value - 2, page.value + 1)

  if (start > 1) items.push('ellipsis')
  for (let index = start; index <= end; index += 1) items.push(index)
  if (end < totalPages.value - 2) items.push('ellipsis')
  items.push(totalPages.value - 1)

  return items
})

watch([page, pageSize, statusFilter, requesterFilter], () => {
  fetchPlans()
})

watch(
  () => [route.query.planId, route.query.purchasePlanId],
  ([planId, purchasePlanId]) => {
    const nextPlanId = parsePlanQueryId(getQueryString(planId) ?? getQueryString(purchasePlanId))

    if (!nextPlanId) {
      selectedPlanId.value = null
      selectedPlan.value = null
      detailError.value = ''
      nextStatus.value = ''
      return
    }

    if (selectedPlanId.value === nextPlanId) return
    selectedPlanId.value = nextPlanId
    selectedPlan.value = null
    void fetchPlanDetail(nextPlanId)
  },
  { immediate: true },
)

onMounted(() => {
  refreshList()
  fetchAssetTeamMembers()
})

async function refreshList() {
  await Promise.all([
    fetchPlans(),
    fetchPlanStatistics(),
  ])
}

async function fetchPlans() {
  isListLoading.value = true
  listError.value = ''

  try {
    const response = await purchaseApi.getPlans({
      page: page.value,
      size: pageSize.value,
      status: statusFilter.value || undefined,
      requesterId: requesterFilter.value || undefined,
      keyword: keyword.value || undefined,
    })

    plans.value = response.data.content
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    listError.value = getErrorMessage(error, '구매 계획 목록을 불러오지 못했습니다.')
  } finally {
    isListLoading.value = false
  }
}

async function fetchPlanStatistics() {
  try {
    const response = await purchaseApi.getPlanStatistics()
    statistics.value = response.data
  } catch {
    statistics.value = { ...EMPTY_STATISTICS }
  }
}

async function fetchAssetTeamMembers() {
  try {
    const response = await memberApi.getList({ page: 0, size: 100, status: 'ACTIVE' })
    assetTeamMembers.value = response.data.content.filter((member) => (
      member.role === 'ASSET_TEAM'
      || member.role === 'ASSET_MANAGER'
      || (member.role === 'ADMIN' && member.departmentName === '구매자산팀')
    ))
  } catch {
    assetTeamMembers.value = []
  }
}

async function fetchPlanDetail(planId: number) {
  isDetailLoading.value = true
  detailError.value = ''

  try {
    const response = await purchaseApi.getPlanDetail(planId)
    selectedPlan.value = response.data
    nextStatus.value = ''
  } catch (error) {
    detailError.value = getErrorMessage(error, '구매 계획 상세를 불러오지 못했습니다.')
  } finally {
    isDetailLoading.value = false
  }
}

function handleSearch() {
  keyword.value = keywordInput.value.trim()
  page.value = 0
  fetchPlans()
}

function handlePageSizeChange(value: string | number) {
  pageSize.value = Number(value)
  page.value = 0
}

function handleStatusChange(value: string | number) {
  statusFilter.value = toStatusOption(value)
  page.value = 0
}

function handleRequesterChange(value: string | number) {
  requesterFilter.value = String(value)
  page.value = 0
}

function openDetail(row: PurchasePlanListItem) {
  void router.push({
    name: 'Purchase',
    query: {
      ...route.query,
      planId: String(row.planId),
    },
  })
}

function closeDetail() {
  const query = { ...route.query }
  delete query.planId
  delete query.purchasePlanId
  void router.replace({ name: 'Purchase', query })
  refreshList()
}

function openCreateDrawer() {
  isCreateDrawerOpen.value = true
  selectedTicketIds.value = []
  fetchEligibleTickets()
}

function closeCreateDrawer() {
  isCreateDrawerOpen.value = false
  selectedTicketIds.value = []
  eligibleError.value = ''
}

async function fetchEligibleTickets() {
  isEligibleLoading.value = true
  eligibleError.value = ''

  try {
    const response = await ticketApi.getList({
      ticketType: 'PURCHASE_REQUEST',
      ticketStatus: 'ASSET_APPROVED',
      page: 0,
      size: 100,
    })

    const planTargetTickets = response.data.content.filter((ticket) => (
      ticket.requestMethod !== 'DIRECT_PURCHASE'
    ))

    const details = await Promise.all(
      planTargetTickets.map(async (ticket) => {
        const detailResponse = await ticketApi.getDetail(ticket.ticketId)
        return toEligibleTicket(ticket, detailResponse.data)
      }),
    )

    eligibleTickets.value = details
  } catch (error) {
    eligibleError.value = getErrorMessage(error, '구매 계획 대상 요청을 불러오지 못했습니다.')
  } finally {
    isEligibleLoading.value = false
  }
}

function toEligibleTicket(ticket: TicketListItem, detail: TicketDetail): EligibleTicket {
  const itemName = detail.requestedItemName || detail.requestedItemDetail || ticket.requestedItemName || ''
  const quantity = detail.quantity ?? 1
  const estimatedUnitPrice = detail.expectedPrice ?? 0
  const assetItemId = parseAssetItemId(detail.assetItemId)
  const disabledReasons: string[] = []

  if (!detail.assetType) disabledReasons.push('자산 유형 없음')
  if (!estimatedUnitPrice) disabledReasons.push('예상 단가 없음')

  return {
    ticketId: ticket.ticketId,
    ticket,
    detail,
    itemName,
    categoryName: detail.categoryName || '',
    quantity,
    estimatedUnitPrice,
    assetItemId,
    isStandard: detail.isStandard !== false && detail.isStandard !== 0,
    canCreate: disabledReasons.length === 0,
    disabledReason: disabledReasons.join(', '),
  }
}

function toggleTicketSelection(ticketId: string) {
  if (selectedTicketIds.value.includes(ticketId)) {
    selectedTicketIds.value = selectedTicketIds.value.filter((id) => id !== ticketId)
    return
  }

  selectedTicketIds.value = [...selectedTicketIds.value, ticketId]
}

function handleEligibleTicketRowClick(request: EligibleTicket) {
  if (!request.canCreate) return
  toggleTicketSelection(request.ticketId)
}

function handleStatusSelect(value: string | number) {
  nextStatus.value = toStatusOption(value)
}

async function createPlan() {
  const items: PurchasePlanCreateItem[] = selectedEligibleTickets.value
    .filter((item) => item.canCreate && item.detail.assetType)
    .map((item) => ({
      ticketId: item.ticket.ticketId,
      itemName: item.itemName,
      assetType: item.detail.assetType!,
      assetItemId: item.assetItemId,
      quantity: item.quantity,
      isStandard: item.isStandard ? 1 : 0,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedAmount: item.estimatedUnitPrice * item.quantity,
      externalUrl: null,
    }))

  if (items.length === 0) return

  isCreatingPlan.value = true

  try {
    const response = await purchaseApi.createPlan({ items })
    closeCreateDrawer()
    await refreshList()
    void router.push({
      name: 'Purchase',
      query: {
        ...route.query,
        planId: String(response.data.planId),
      },
    })
  } catch (error) {
    eligibleError.value = getErrorMessage(error, '구매 계획 등록에 실패했습니다.')
  } finally {
    isCreatingPlan.value = false
  }
}

async function reviewPlan(status: PurchasePlanStatus) {
  pendingReviewStatus.value = status
  await changeStatus(status)
  pendingReviewStatus.value = null
}

function changeSelectedStatus() {
  if (!nextStatus.value) return
  changeStatus(nextStatus.value)
}

async function changeStatus(status: PurchasePlanStatus) {
  if (!selectedPlanId.value) return
  isStatusSaving.value = true

  try {
    const response = await purchaseApi.changePlanStatus(selectedPlanId.value, { status })
    selectedPlan.value = response.data
    nextStatus.value = ''
    await refreshList()
  } catch (error) {
    detailError.value = getErrorMessage(error, '상태 변경에 실패했습니다.')
  } finally {
    isStatusSaving.value = false
  }
}

async function confirmDelivery(item: PurchasePlanItem) {
  if (!selectedPlanId.value || item.itemId == null) return
  isConfirmingItem.value = item.itemId

  try {
    await purchaseApi.confirmDelivery(selectedPlanId.value, item.itemId)
    await fetchPlanDetail(selectedPlanId.value)
    await refreshList()
  } catch (error) {
    detailError.value = getErrorMessage(error, '납품 확인에 실패했습니다.')
  } finally {
    isConfirmingItem.value = null
  }
}

function canConfirmDelivery(item: PurchasePlanItem) {
  if (!canChangeStatus.value || item.itemId == null || item.receivedAt) return false
  if (!selectedPlan.value) return false

  const confirmableStatuses: PurchasePlanStatus[] = ['APPROVED', 'ORDERED']
  return confirmableStatuses.includes(displayPlanStatus(selectedPlan.value))
}

function displayListStatus(plan: PurchasePlanListItem): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || 'REQUESTED'
}

function displayPlanStatus(plan: PurchasePlanDetail): PurchasePlanStatus {
  return plan.status || plan.purchaseRequestStatus || 'REQUESTED'
}

function getStatusLabel(status: PurchasePlanStatus) {
  return STATUS_LABEL[status]
}

function getStatusBadgeClass(status: PurchasePlanStatus) {
  if (status === 'APPROVED') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200'
  if (status === 'REJECTED') return 'bg-danger/10 text-danger'
  if (status === 'CANCELLED') return 'bg-surface-secondary text-text-muted'
  if (status === 'ORDERED') return 'bg-primary/10 text-primary'
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'bg-success/10 text-success'
  return 'bg-surface-secondary text-text-sub'
}

function toStatusOption(value: string | number): PurchasePlanStatus | '' {
  const status = String(value)
  return Object.hasOwn(STATUS_LABEL, status) ? status as PurchasePlanStatus : ''
}

function parseAssetItemId(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

function getQueryString(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : null
  return typeof value === 'string' && value.trim() ? value : null
}

function parsePlanQueryId(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
</script>
