<template>
  <BaseDrawer
    :is-open="isOpen"
    title="신규 구매 계획 등록"
    panel-class="w-full max-w-5xl"
    body-class="min-h-0 overflow-hidden! p-0"
    hide-footer
    @close="emit('close')"
  >
    <div class="flex h-full flex-col">
      <div
        v-if="eligibleError"
        class="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
      >
        <p class="text-sm font-semibold text-danger">{{ eligibleError }}</p>
        <Button variant="outline" size="sm" @click="emit('reload')">
          <RefreshCw :size="15" />
          다시 조회
        </Button>
      </div>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
        <div
          v-if="isEligibleLoading"
          class="flex h-full min-h-80 items-center justify-center"
        >
          <Loader2 class="animate-spin text-primary" :size="28" />
        </div>

        <Table
          v-else
          :columns="eligibleTicketColumns"
          :rows="eligibleTickets"
          row-key="ticketId"
          empty-text="구매 계획으로 등록할 결재 완료 요청이 없습니다."
          class="max-h-100 max-w-full overflow-y-auto rounded-xl! [&_table]:table-fixed [&_td]:align-middle [&_th]:whitespace-nowrap"
          @row-click="emit('eligible-row-click', $event)"
        >
          <template #cell-select="{ row }">
            <div
              role="checkbox"
              :aria-checked="selectedTicketIds.includes(row.ticketId)"
              :aria-label="row.canCreate ? `${row.ticket.ticketNo} 선택` : `${row.ticket.ticketNo} 선택 불가: ${row.disabledReason}`"
              :title="row.canCreate ? '구매 계획 대상 선택' : row.disabledReason"
              class="flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200"
              :class="[
                selectedTicketIds.includes(row.ticketId)
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-border bg-surface text-transparent',
                !row.canCreate && 'cursor-not-allowed border-border bg-surface-secondary text-transparent opacity-40',
              ]"
            >
              <Check :size="14" :stroke-width="3" />
            </div>
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
        </Table>

        <section class="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div>
            <h2 class="text-sm font-bold text-text-main">표준 품목 추가</h2>
            <p class="mt-1 text-xs text-text-muted">
              구매 계획에 필요한 표준 품목을 선택해 요청 품목에 추가합니다.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div class="space-y-2 text-left">
              <label class="block px-0.5 text-sm font-semibold text-text-main">자산 유형</label>
              <Dropdown
                :model-value="directItemForm.assetType"
                :options="assetTypeOptions"
                :disabled="isCreatingPlan"
                @update:model-value="emit('update-direct-asset-type', $event)"
              />
            </div>
            <div class="space-y-2 text-left">
              <label for="direct-plan-category" class="block px-0.5 text-sm font-semibold text-text-main">
                분류
              </label>
              <Dropdown
                id="direct-plan-category"
                :model-value="directItemForm.categoryId"
                :options="directCategoryOptions"
                :disabled="isDirectCategoryDisabled"
                root-option="분류 선택"
                category-select-mode="leaf-only"
                @update:model-value="emit('update-direct-category', $event)"
              />
            </div>
            <div class="space-y-2 text-left xl:col-span-2">
              <label for="direct-plan-standard-item" class="block px-0.5 text-sm font-semibold text-text-main">
                표준 품목
              </label>
              <Dropdown
                id="direct-plan-standard-item"
                :model-value="directItemForm.assetItemId"
                :options="standardPurchaseItemOptions"
                :disabled="isStandardPurchaseItemDisabled"
                @update:model-value="emit('update-direct-standard-item', $event)"
              />
            </div>
            <Input
              id="direct-plan-quantity"
              :model-value="directItemForm.quantity"
              type="number"
              :min="1"
              label="수량"
              required
              :disabled="isCreatingPlan"
              @update:model-value="emit('update-direct-quantity', $event)"
            />
            <div class="space-y-2 text-left">
              <label
                for="direct-plan-unit-price"
                class="flex items-center gap-0.5 px-0.5 text-sm font-semibold text-text-main"
              >
                예상 단가
                <span class="font-bold text-primary">*</span>
              </label>
              <div class="relative">
                <input
                  id="direct-plan-unit-price"
                  :value="formattedDirectEstimatedUnitPrice"
                  inputmode="numeric"
                  placeholder="0"
                  :disabled="isCreatingPlan"
                  class="h-9 w-full rounded-xl border border-border bg-surface py-2.5 pl-4 pr-9 text-right text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-60"
                  @input="emit('update-direct-price', $event)"
                />
                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted"
                >
                  원
                </span>
              </div>
            </div>
            <div class="flex items-end">
              <Button
                class="w-full"
                variant="outline"
                :disabled="isCreatingPlan"
                @click="emit('add-direct-item')"
              >
                <Plus :size="16" />
                품목 추가
              </Button>
            </div>
          </div>

          <p v-if="directItemError" class="text-xs font-semibold text-danger">
            {{ directItemError }}
          </p>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-bold text-text-main">구매계획 요청 품목</h2>
            <span class="text-xs font-semibold text-text-muted">총 {{ planRequestItems.length }}건</span>
          </div>

          <Table
            :columns="planRequestItemColumns"
            :rows="planRequestItems"
            row-key="id"
            empty-text="승인 완료 티켓을 선택하거나 직접 품목을 추가해주세요."
            class="max-h-75 overflow-y-auto [&_table]:min-w-205"
          >
            <template #cell-sourceLabel="{ row }">
              <span
                :class="[
                  'whitespace-nowrap text-sm font-semibold',
                  row.source === 'ticket' ? 'text-text-main' : 'text-success',
                ]"
              >
                {{ row.sourceLabel }}
              </span>
            </template>

            <template #cell-itemName="{ row }">
              <span class="font-semibold text-text-main" :title="row.itemName">{{ row.itemName }}</span>
            </template>

            <template #cell-categoryName="{ row }">
              <span class="text-text-sub" :title="row.categoryName || '-'">{{ row.categoryName || '-' }}</span>
            </template>

            <template #cell-estimatedUnitPrice="{ row }">
              <span class="whitespace-nowrap">{{ formatCurrency(row.estimatedUnitPrice) }}</span>
            </template>

            <template #cell-estimatedAmount="{ row }">
              <span class="whitespace-nowrap font-bold text-text-main">
                {{ formatCurrency(row.estimatedAmount) }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="!row.canRemove || isCreatingPlan"
                :aria-label="`${row.itemName} 삭제`"
                title="삭제"
                @click.stop="emit('remove-request-item', row.id)"
              >
                <Trash2 :size="15" />
              </button>
            </template>
          </Table>
        </section>
      </div>

      <div class="border-t border-border px-6 py-4">
        <div class="mb-4 flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3">
          <span class="text-sm font-semibold text-text-sub">요청 품목 {{ planRequestItems.length }}건</span>
          <span class="text-lg font-bold text-text-main">합계 {{ formatCurrency(selectedEstimatedAmount) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Button class="w-full" variant="outline" @click="emit('close')">취소</Button>
          <Button
            class="w-full"
            :disabled="planRequestItems.length === 0 || isCreatingPlan"
            :loading="isCreatingPlan"
            @click="emit('submit')"
          >
            등록
          </Button>
        </div>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { Check, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import type {
  AssetType,
  DropdownOption,
  IntangibleCategoryGroup,
  PurchasePlanCandidateTicket,
  TangibleCategoryGroup,
} from '@/types'

interface EligibleTicket extends Record<string, unknown> {
  ticketId: string
  ticket: PurchasePlanCandidateTicket
  itemName: string
  categoryName: string
  assetType: PurchasePlanCandidateTicket['assetType']
  quantity: number
  estimatedUnitPrice: number
  assetItemId: string | null
  tangibleAssetItemId: string | null
  intangibleAssetItemId: string | null
  isStandard: boolean
  canCreate: boolean
  disabledReason: string
}

interface PlanRequestItem extends Record<string, unknown> {
  id: string
  source: 'ticket' | 'direct'
  sourceLabel: string
  itemName: string
  categoryName: string
  assetType: AssetType
  quantity: number
  estimatedUnitPrice: number
  estimatedAmount: number
  canRemove: boolean
}

interface DirectItemForm {
  assetItemId: string
  categoryId: string
  categoryName: string
  assetType: AssetType
  quantity: string
  estimatedUnitPrice: string
  externalUrl: string
}

defineProps<{
  isOpen: boolean
  eligibleError: string
  isEligibleLoading: boolean
  eligibleTickets: EligibleTicket[]
  selectedTicketIds: string[]
  directItemForm: DirectItemForm
  assetTypeOptions: DropdownOption[]
  directCategoryOptions: Array<TangibleCategoryGroup | IntangibleCategoryGroup>
  isDirectCategoryDisabled: boolean
  standardPurchaseItemOptions: DropdownOption[]
  isStandardPurchaseItemDisabled: boolean
  formattedDirectEstimatedUnitPrice: string
  directItemError: string
  planRequestItems: PlanRequestItem[]
  selectedEstimatedAmount: number
  isCreatingPlan: boolean
}>()

const emit = defineEmits<{
  close: []
  reload: []
  'eligible-row-click': [row: EligibleTicket]
  'update-direct-asset-type': [value: string | number]
  'update-direct-category': [value: string | number]
  'update-direct-standard-item': [value: string | number]
  'update-direct-quantity': [value: string]
  'update-direct-price': [event: Event]
  'add-direct-item': []
  'remove-request-item': [id: string]
  submit: []
}>()

const eligibleTicketColumns: Column<EligibleTicket>[] = [
  { key: 'select', label: '선택', width: '7%', align: 'center', truncate: false },
  { key: 'ticketNo', label: '티켓 번호', width: '19%', align: 'center' },
  { key: 'requesterName', label: '티켓 요청자', width: '13%', align: 'center' },
  { key: 'itemName', label: '품목', width: '20%', align: 'center' },
  { key: 'categoryName', label: '분류', width: '13%', align: 'center' },
  { key: 'quantity', label: '수량', width: '8%', align: 'center' },
  { key: 'estimatedUnitPrice', label: '예상 단가', width: '20%', align: 'center' },
]

const planRequestItemColumns: Column<PlanRequestItem>[] = [
  { key: 'sourceLabel', label: '티켓 번호', width: '20%', align: 'center', truncate: false },
  { key: 'itemName', label: '품목', width: '20%', align: 'center', maxLines: 2 },
  { key: 'categoryName', label: '분류', width: '14%', align: 'center' },
  { key: 'quantity', label: '수량', width: '8%', align: 'center' },
  { key: 'estimatedUnitPrice', label: '단가', width: '15%', align: 'center' },
  { key: 'estimatedAmount', label: '금액', width: '15%', align: 'center' },
  { key: 'actions', label: '삭제', width: '8%', align: 'center', truncate: false },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}
</script>
